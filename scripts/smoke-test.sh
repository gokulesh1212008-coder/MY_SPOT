#!/usr/bin/env bash
# End-to-end smoke test for MYSPOT. Requires the server running on :3000.
set -euo pipefail

BASE="http://localhost:3000"
JAR=$(mktemp)

# Reset to a clean demo dataset so results are deterministic.
(cd "$(dirname "$0")/.." && npx tsx prisma/seed.ts > /dev/null) || { echo "  ❌ reseed failed"; exit 1; }
echo "  🔄 Demo data reseeded"
JAR2=$(mktemp)
JAR3=$(mktemp)
echo "🚗 Starting MYSPOT smoke test…"

pass() { echo "  ✅ $1"; }
fail() { echo "  ❌ $1"; exit 1; }

# 1. Login as driver
curl -s -c "$JAR" -H "Content-Type: application/json" -d '{"email":"driver@myspot.app","password":"demo1234"}' "$BASE/api/auth/login" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d); if(!j.user) process.exit(1); console.log(j.user.name)})" > /tmp/drv.txt || fail "driver login"
pass "Driver login: $(cat /tmp/drv.txt)"

# 2. Driver vehicles
VEH=$(curl -s -b "$JAR" "$BASE/api/vehicles" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d); const v=j.vehicles.find(x=>x.isActive&&x.type==='CAR'); if(!v)process.exit(1); console.log(v.id)})") || fail "vehicles"
pass "Driver has active vehicle"

# 3. Search parking and pick a 24-hour space (needs an open window for near-now check-in)
SPACE=$(curl -s "$BASE/api/parking?lat=18.922&lng=72.8347&vehicleType=CAR" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d); const s=j.results.find(x=>x.openHour===0&&x.closeHour===24); if(!s)process.exit(1); console.log(s.id)})") || fail "search (no 24h space found)"
pass "Search returned results (24h space selected)"

# 4. Book a slot starting in 15 minutes on the 24h Fort garage (needs owner approval)
START=$(node -e "console.log(new Date(Date.now()+15*60000).toISOString())")
END=$(node -e "console.log(new Date(Date.now()+135*60000).toISOString())")
RESP=$(curl -s -b "$JAR" -H "Content-Type: application/json" -d "{\"spaceId\":\"$SPACE\",\"vehicleId\":\"$VEH\",\"startAt\":\"$START\",\"endAt\":\"$END\"}" "$BASE/api/bookings")
BOOKING=$(echo "$RESP" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d); if(!j.booking)process.exit(1); console.log(j.booking.id)})") || fail "booking"
BOOKING_REF=$(echo "$RESP" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d); console.log(j.booking.bookingRef)})")
echo "  ✅ Booking created: $BOOKING ($BOOKING_REF, payment confirmed)"
# In production the OTP is delivered by SMS; the provider logs it to the server console.
# Try the standard log, then any .freebuff preview log (dev server on this machine).
OTP=""
for slog in "${MSPOT_SERVER_LOG:-/tmp/myspot-server.log}" "$(ls -t .freebuff/preview-*.log 2>/dev/null | head -1)"; do
  [ -n "$slog" ] || continue
  OTP=$(grep -a "OTP for $BOOKING_REF" "$slog" 2>/dev/null | tail -1 | sed 's/.*OTP for [A-Z0-9-]*: \([0-9]*\).*/\1/' || true)
  [ -n "$OTP" ] && break
done
[ -z "$OTP" ] && fail "could not read OTP from server logs"

# 5. Double-booking must be rejected
CODE=$(curl -s -o /dev/null -w "%{http_code}" -b "$JAR" -H "Content-Type: application/json" -d "{\"spaceId\":\"$SPACE\",\"vehicleId\":\"$VEH\",\"startAt\":\"$START\",\"endAt\":\"$END\"}" "$BASE/api/bookings")
[ "$CODE" = "409" ] && pass "Double booking correctly rejected (409)" || fail "double booking not rejected (got $CODE)"

# 6. Owner approves (Fort garage is autoApprove=false)
curl -s -c "$JAR2" -H "Content-Type: application/json" -d '{"email":"owner@myspot.app","password":"demo1234"}' "$BASE/api/auth/login" > /dev/null
curl -s -b "$JAR2" -H "Content-Type: application/json" -d '{"approve":true}' "$BASE/api/bookings/$BOOKING/approve" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d); if(!j.ownerApproved)process.exit(1)})" || fail "owner approval"
pass "Owner approved the vehicle"

# 7. Wrong OTP must fail while the booking is still confirmed
CODE=$(curl -s -o /dev/null -w "%{http_code}" -b "$JAR" -H "Content-Type: application/json" -d '{"otp":"000000"}' "$BASE/api/bookings/$BOOKING/checkin")
[ "$CODE" = "401" ] && pass "Wrong OTP rejected (401)" || fail "wrong OTP accepted (got $CODE)"

# 8. Check-in with correct OTP
curl -s -b "$JAR" -H "Content-Type: application/json" -d "{\"otp\":\"$OTP\"}" "$BASE/api/bookings/$BOOKING/checkin" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d); if(j.error)process.exit(1); console.log(j.message)})" > /tmp/ci.txt || fail "check-in"
pass "OTP check-in: $(cat /tmp/ci.txt)"

# 9. Check-out (completes the booking)
curl -s -b "$JAR" -H "Content-Type: application/json" -d '{}' "$BASE/api/bookings/$BOOKING/checkout" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d); if(j.error)process.exit(1)})" || fail "checkout"
pass "Check-out completed booking"

# 10. Review the completed booking
curl -s -b "$JAR" -H "Content-Type: application/json" -d '{"rating":5,"comment":"Smoke test review — secure and smooth!"}' "$BASE/api/bookings/$BOOKING/review" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d); if(!j.review)process.exit(1)})" || fail "review"
pass "Review submitted"

# 11. Duplicate review must fail
CODE=$(curl -s -o /dev/null -w "%{http_code}" -b "$JAR" -H "Content-Type: application/json" -d '{"rating":4}' "$BASE/api/bookings/$BOOKING/review")
[ "$CODE" = "409" ] && pass "Duplicate review rejected (409)" || fail "duplicate review allowed (got $CODE)"

# 12. Cancel another booking with refund path
RESP2=$(curl -s -b "$JAR" -H "Content-Type: application/json" -d "{\"spaceId\":\"$SPACE\",\"vehicleId\":\"$VEH\",\"startAt\":\"$(node -e "console.log(new Date(Date.now()+72*3600000).toISOString())")\",\"endAt\":\"$(node -e "console.log(new Date(Date.now()+74*3600000).toISOString())")\"}" "$BASE/api/bookings")
B2=$(echo "$RESP2" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d); console.log(j.booking.id)})")
curl -s -b "$JAR" -X PATCH -H "Content-Type: application/json" -d '{"action":"cancel","reason":"changed plans"}' "$BASE/api/bookings/$B2" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d); if(j.status!=='REFUNDED')process.exit(1); console.log('  refund: ₹'+j.refundAmount+' ('+j.tier+')')})" > /tmp/rf.txt || fail "cancel/refund"
pass "Cancellation with refund: $(cat /tmp/rf.txt)"

# 13. Owner earnings updated
curl -s -b "$JAR2" "$BASE/api/owner/stats" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d); if(!j.stats||j.stats.completedBookings<1)process.exit(1); console.log('  earningsTotal: ₹'+j.stats.earningsTotal+', completed: '+j.stats.completedBookings)})" > /tmp/own.txt || fail "owner stats"
pass "Owner earnings: $(cat /tmp/own.txt)"

# 14. Admin stats + settings
curl -s -c "$JAR3" -H "Content-Type: application/json" -d '{"email":"admin@myspot.app","password":"demo1234"}' "$BASE/api/auth/login" > /dev/null
curl -s -b "$JAR3" "$BASE/api/admin/stats" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d); if(!j.stats)process.exit(1); console.log('  users: '+j.stats.users+', bookings: '+j.stats.bookings+', revenue: ₹'+j.stats.revenue)})" > /tmp/adm.txt || fail "admin stats"
pass "Admin analytics: $(cat /tmp/adm.txt)"

curl -s -b "$JAR3" -X PUT -H "Content-Type: application/json" -d '{"commissionRate":0.2}' "$BASE/api/admin/settings" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d); if(j.settings.commissionRate!==0.2)process.exit(1)})" || fail "settings"
pass "Admin updated commission → 20%"
curl -s -b "$JAR3" -X PUT -H "Content-Type: application/json" -d '{"commissionRate":0.15}' "$BASE/api/admin/settings" > /dev/null

# 15. Unauthorized access blocked
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/admin/stats")
[ "$CODE" = "401" ] && pass "Unauthenticated admin access blocked (401)" || fail "admin accessible without auth (got $CODE)"

echo ""
echo "🎉 All smoke tests passed!"
rm -f "$JAR" "$JAR2" "$JAR3"
