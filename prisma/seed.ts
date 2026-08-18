import { PrismaClient, VehicleType, SpaceType } from "@prisma/client";
import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PASSWORD = "demo1234";

function hoursFromNow(h: number): Date {
  return new Date(Date.now() + h * 3600 * 1000);
}

async function main() {
  console.log("Clearing existing data…");
  await prisma.payment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.parkingImage.deleteMany();
  await prisma.parkingSpace.deleteMany();
  await prisma.session.deleteMany();
  await prisma.walletTransaction.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.platformSetting.deleteMany();
  await prisma.user.deleteMany();

  const pw = await bcrypt.hash(PASSWORD, 10);

  const driver = await prisma.user.create({
    data: {
      email: "driver@myspot.app",
      phone: "+91 90000 00001",
      aadhar: "123456789012",
      phoneVerified: true,
      name: "Aarav Sharma",
      passwordHash: pw,
      isVerified: true,
    },
  });

  const owner = await prisma.user.create({
    data: {
      email: "owner@myspot.app",
      phone: "+91 90000 00002",
      aadhar: "234567890123",
      phoneVerified: true,
      name: "Priya Nair",
      passwordHash: pw,
      isOwner: true,
      isVerified: true,
    },
  });

  const owner2 = await prisma.user.create({
    data: {
      email: "owner2@myspot.app",
      phone: "+91 90000 00003",
      aadhar: "345678901234",
      phoneVerified: true,
      name: "Rahul Verma",
      passwordHash: pw,
      isOwner: true,
      isVerified: true,
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: "admin@myspot.app",
      phone: "+91 90000 00004",
      aadhar: "456789012345",
      phoneVerified: true,
      name: "MYSPOT Admin",
      passwordHash: pw,
      isAdmin: true,
      isVerified: true,
    },
  });

  await prisma.vehicle.createMany({
    data: [
      { userId: driver.id, regNumber: "MH-01-AB-1234", type: "CAR" as VehicleType, model: "Maruti Suzuki Swift", color: "Red", nickname: "My Swift", licenseNumber: "MH012022000001", licenseVerified: true, insuranceNumber: "INS10000001" },
      { userId: driver.id, regNumber: "MH-02-CD-5678", type: "BIKE" as VehicleType, model: "Honda Activa", color: "Black", nickname: "Scooty", licenseNumber: "MH012022000002", licenseVerified: true, insuranceNumber: "INS10000002" },
      { userId: owner.id, regNumber: "MH-03-EF-9012", type: "SUV" as VehicleType, model: "Hyundai Creta", color: "White", licenseNumber: "MH012022000003", licenseVerified: true, insuranceNumber: "INS10000003" },
    ],
  });

  const spaces: {
    ownerId: string;
    title: string;
    description: string;
    lat: number;
    lng: number;
    address: string;
    landmark?: string;
    spaceType: SpaceType;
    allowedTypes: string;
    isCovered: boolean;
    isIndoor: boolean;
    hasCCTV: boolean;
    hasLighting: boolean;
    hasEV: boolean;
    pricePerHour: number;
    openHour: number;
    closeHour: number;
    autoApprove: boolean;
    verificationStatus: "VERIFIED" | "PENDING";
    rating: number;
    ratingCount: number;
  }[] = [
    {
      ownerId: owner.id,
      title: "Secure Driveway Parking — Colaba",
      description: "A well-lit private driveway right next to Gateway of India. CCTV monitored, owner on site. Perfect for a day trip to the waterfront.",
      lat: 18.922,
      lng: 72.8347,
      address: "12, Wodehouse Road, Colaba, Mumbai 400005",
      landmark: "200 m from Gateway of India",
      spaceType: SpaceType.DRIVEWAY,
      allowedTypes: JSON.stringify(["BIKE", "CAR"]),
      isCovered: false,
      isIndoor: false,
      hasCCTV: true,
      hasLighting: true,
      hasEV: false,
      pricePerHour: 60,
      openHour: 6,
      closeHour: 23,
      autoApprove: true,
      verificationStatus: "VERIFIED",
      rating: 4.8,
      ratingCount: 24,
    },
    {
      ownerId: owner.id,
      title: "Covered Garage — Fort Area",
      description: "Covered private garage with automatic gate. CCTV + good lighting. Bikes and hatchbacks fit easily.",
      lat: 18.9322,
      lng: 72.8333,
      address: "45, Shahid Bhagat Singh Road, Fort, Mumbai 400001",
      landmark: "Near CST Station",
      spaceType: SpaceType.GARAGE,
      allowedTypes: JSON.stringify(["BIKE", "CAR"]),
      isCovered: true,
      isIndoor: true,
      hasCCTV: true,
      hasLighting: true,
      hasEV: false,
      pricePerHour: 80,
      openHour: 0,
      closeHour: 24,
      autoApprove: false,
      verificationStatus: "VERIFIED",
      rating: 4.9,
      ratingCount: 41,
    },
    {
      ownerId: owner.id,
      title: "Home Driveway — Marine Drive",
      description: "Spacious driveway facing Marine Drive. Great for evening visits to the promenade. Owner available 24x7.",
      lat: 18.943,
      lng: 72.8234,
      address: "9, Marine Drive, Churchgate, Mumbai 400020",
      landmark: "2 min walk to Marine Drive",
      spaceType: SpaceType.DRIVEWAY,
      allowedTypes: JSON.stringify(["CAR", "SUV"]),
      isCovered: false,
      isIndoor: false,
      hasCCTV: false,
      hasLighting: true,
      hasEV: false,
      pricePerHour: 100,
      openHour: 7,
      closeHour: 22,
      autoApprove: true,
      verificationStatus: "VERIFIED",
      rating: 4.6,
      ratingCount: 17,
    },
    {
      ownerId: owner2.id,
      title: "Society Parking Slot — Bandra West",
      description: "Reserved society parking slot with security guard at the gate. EV charging available. Near Linking Road market.",
      lat: 19.0596,
      lng: 72.8295,
      address: "Hill Road Society, Bandra West, Mumbai 400050",
      landmark: "5 min walk from Linking Road",
      spaceType: SpaceType.LOT,
      allowedTypes: JSON.stringify(["BIKE", "CAR", "SUV"]),
      isCovered: true,
      isIndoor: true,
      hasCCTV: true,
      hasLighting: true,
      hasEV: true,
      pricePerHour: 70,
      openHour: 5,
      closeHour: 24,
      autoApprove: true,
      verificationStatus: "VERIFIED",
      rating: 4.7,
      ratingCount: 33,
    },
    {
      ownerId: owner2.id,
      title: "Private Lot near Andheri Station",
      description: "Secure private parking lot 3 minutes from Andheri station. Perfect for daily commuters — monthly pricing available.",
      lat: 19.1197,
      lng: 72.8464,
      address: "Andheri East, Mumbai 400069",
      landmark: "Near Andheri Railway Station East",
      spaceType: SpaceType.LOT,
      allowedTypes: JSON.stringify(["BIKE", "CAR"]),
      isCovered: false,
      isIndoor: false,
      hasCCTV: true,
      hasLighting: true,
      hasEV: false,
      pricePerHour: 50,
      openHour: 5,
      closeHour: 23,
      autoApprove: true,
      verificationStatus: "VERIFIED",
      rating: 4.5,
      ratingCount: 28,
    },
    {
      ownerId: owner.id,
      title: "EV-Friendly Garage — Powai",
      description: "Modern garage with 7kW EV charger. App-controlled gate, CCTV inside. Ideal for EV owners visiting Hiranandani.",
      lat: 19.1176,
      lng: 72.906,
      address: "Hiranandani Gardens, Powai, Mumbai 400076",
      landmark: "Near Hiranandani Business Park",
      spaceType: SpaceType.GARAGE,
      allowedTypes: JSON.stringify(["CAR", "SUV"]),
      isCovered: true,
      isIndoor: true,
      hasCCTV: true,
      hasLighting: true,
      hasEV: true,
      pricePerHour: 120,
      openHour: 0,
      closeHour: 24,
      autoApprove: false,
      verificationStatus: "VERIFIED",
      rating: 4.9,
      ratingCount: 52,
    },
    {
      ownerId: owner2.id,
      title: "Street-side Marked Space — Thane",
      description: "Marked residential street parking with night lighting. Budget option near Viviana Mall.",
      lat: 19.2183,
      lng: 72.9781,
      address: "Kolshet Road, Thane West 400607",
      landmark: "10 min walk to Viviana Mall",
      spaceType: SpaceType.STREET,
      allowedTypes: JSON.stringify(["BIKE", "CAR"]),
      isCovered: false,
      isIndoor: false,
      hasCCTV: false,
      hasLighting: true,
      hasEV: false,
      pricePerHour: 30,
      openHour: 6,
      closeHour: 22,
      autoApprove: true,
      verificationStatus: "PENDING",
      rating: 3.9,
      ratingCount: 9,
    },
    {
      ownerId: owner.id,
      title: "Compact Bike Space — Fort",
      description: "Secure indoor bike parking with CCTV. Small footprint, perfect for two-wheelers near office clusters.",
      lat: 18.9343,
      lng: 72.836,
      address: "Nagindas Master Road, Fort, Mumbai 400023",
      landmark: "Near Bombay Stock Exchange",
      spaceType: SpaceType.LOT,
      allowedTypes: JSON.stringify(["BIKE"]),
      isCovered: true,
      isIndoor: true,
      hasCCTV: true,
      hasLighting: true,
      hasEV: false,
      pricePerHour: 25,
      openHour: 8,
      closeHour: 21,
      autoApprove: true,
      verificationStatus: "VERIFIED",
      rating: 4.4,
      ratingCount: 15,
    },
    {
      ownerId: owner2.id,
      title: "Big SUV Driveway — Juhu",
      description: "Extra-wide driveway that easily fits SUVs and pickup trucks. Gated community, security booth.",
      lat: 19.1075,
      lng: 72.8266,
      address: "Juhu Tara Road, Juhu, Mumbai 400049",
      landmark: "Near Juhu Beach",
      spaceType: SpaceType.DRIVEWAY,
      allowedTypes: JSON.stringify(["CAR", "SUV", "TRUCK"]),
      isCovered: false,
      isIndoor: false,
      hasCCTV: true,
      hasLighting: true,
      hasEV: false,
      pricePerHour: 90,
      openHour: 6,
      closeHour: 23,
      autoApprove: true,
      verificationStatus: "VERIFIED",
      rating: 4.7,
      ratingCount: 21,
    },
    {
      ownerId: owner.id,
      title: "Office Peak-Hour Slot — BKC",
      description: "Residential garage near Bandra Kurla Complex for office visitors. Avoid BKC parking chaos with pre-booked space.",
      lat: 19.0634,
      lng: 72.8369,
      address: "Bandra Kurla Complex, Mumbai 400051",
      landmark: "10 min walk from BKC offices",
      spaceType: SpaceType.GARAGE,
      allowedTypes: JSON.stringify(["CAR"]),
      isCovered: true,
      isIndoor: true,
      hasCCTV: true,
      hasLighting: true,
      hasEV: false,
      pricePerHour: 110,
      openHour: 8,
      closeHour: 21,
      autoApprove: true,
      verificationStatus: "VERIFIED",
      rating: 4.8,
      ratingCount: 38,
    },
    {
      ownerId: owner2.id,
      title: "24x7 Secure Lot — Colaba Causeway",
      description: "Round-the-clock guarded parking near Colaba Causeway market. Ideal for tourists and shoppers.",
      lat: 18.9167,
      lng: 72.8297,
      address: "Colaba Causeway, Mumbai 400005",
      landmark: "Near Colaba Causeway Market",
      spaceType: SpaceType.LOT,
      allowedTypes: JSON.stringify(["BIKE", "CAR", "SUV"]),
      isCovered: false,
      isIndoor: false,
      hasCCTV: true,
      hasLighting: true,
      hasEV: false,
      pricePerHour: 65,
      openHour: 0,
      closeHour: 24,
      autoApprove: true,
      verificationStatus: "VERIFIED",
      rating: 4.6,
      ratingCount: 46,
    },
    {
      ownerId: owner.id,
      title: "Event Parking — Gateway Grounds",
      description: "Reserve extra space for events, weddings and gatherings at Gateway. Multiple vehicle slots, coordinator on site.",
      lat: 18.9214,
      lng: 72.836,
      address: "Apollo Bandar, Colaba, Mumbai 400001",
      landmark: "Gateway of India grounds",
      spaceType: SpaceType.LOT,
      allowedTypes: JSON.stringify(["CAR", "SUV", "TRUCK"]),
      isCovered: false,
      isIndoor: false,
      hasCCTV: true,
      hasLighting: true,
      hasEV: false,
      pricePerHour: 150,
      openHour: 8,
      closeHour: 23,
      autoApprove: false,
      verificationStatus: "VERIFIED",
      rating: 4.3,
      ratingCount: 12,
    },
  ];

  for (const s of spaces) {
    const space = await prisma.parkingSpace.create({ data: s });
    await prisma.parkingImage.createMany({
      data: [
        { spaceId: space.id, url: `https://picsum.photos/seed/myspot-${space.id.slice(0, 6)}/800/500`, isPrimary: true },
        { spaceId: space.id, url: `https://picsum.photos/seed/myspot-b-${space.id.slice(0, 6)}/800/500`, isPrimary: false },
      ],
    });
  }

  // A confirmed upcoming booking for the demo driver (for check-in demo).
  const car = await prisma.vehicle.findFirstOrThrow({ where: { userId: driver.id, type: "CAR" } });
  const colaba = await prisma.parkingSpace.findFirstOrThrow({ where: { title: "Secure Driveway Parking — Colaba" } });

  const upcoming = await prisma.booking.create({
    data: {
      bookingRef: "MSP-DEMO01",
      userId: driver.id,
      spaceId: colaba.id,
      vehicleId: car.id,
      startAt: hoursFromNow(2),
      endAt: hoursFromNow(5),
      status: "CONFIRMED",
      ownerApproved: true,
      baseAmount: 180,
      feeAmount: 9,
      taxAmount: 34,
      totalAmount: 233,
      ownerAmount: 153,
      commissionAmount: 27,
      qrToken: `${randomInt(0, 2 ** 48 - 1).toString(36).toUpperCase()}${randomInt(0, 2 ** 48 - 1).toString(36).toUpperCase()}`,
    },
  });
  await prisma.payment.create({
    data: {
      bookingId: upcoming.id,
      provider: "sandbox",
      providerRef: "SBX_SEED_1",
      type: "BOOKING",
      amount: 233,
      status: "SUCCESS",
    },
  });
  await prisma.notification.create({
    data: {
      userId: driver.id,
      type: "booking",
      title: "Booking confirmed",
      body: `Your parking at ${colaba.title} is confirmed. Check in at the space using OTP.`,
    },
  });

  // A completed booking with a review.
  const garage = await prisma.parkingSpace.findFirstOrThrow({ where: { title: "Covered Garage — Fort Area" } });
  const completed = await prisma.booking.create({
    data: {
      bookingRef: "MSP-DEMO02",
      userId: driver.id,
      spaceId: garage.id,
      vehicleId: car.id,
      startAt: hoursFromNow(-72),
      endAt: hoursFromNow(-69),
      status: "COMPLETED",
      ownerApproved: true,
      checkInAt: hoursFromNow(-71.8),
      checkOutAt: hoursFromNow(-68.9),
      baseAmount: 240,
      feeAmount: 12,
      taxAmount: 45,
      totalAmount: 307,
      ownerAmount: 204,
      commissionAmount: 36,
    },
  });
  await prisma.payment.create({
    data: {
      bookingId: completed.id,
      provider: "sandbox",
      providerRef: "SBX_SEED_2",
      type: "BOOKING",
      amount: 307,
      status: "SUCCESS",
    },
  });
  await prisma.review.create({
    data: {
      bookingId: completed.id,
      userId: driver.id,
      spaceId: garage.id,
      rating: 5,
      comment: "Very clean, well-lit garage. The OTP check-in was smooth and the owner was friendly.",
    },
  });
  await prisma.favorite.create({ data: { userId: driver.id, spaceId: colaba.id } });

  await prisma.platformSetting.createMany({
    data: [
      { key: "currency", value: "INR" },
      { key: "sandboxPaymentLabel", value: "Sandbox payment (no real money) — connect Stripe/Razorpay via env vars for live payments." },
    ],
  });

  console.log("\n✅ Seed complete!\n");
  console.log("Demo logins (password: demo1234):");
  console.log("  Driver : driver@myspot.app");
  console.log("  Owner  : owner@myspot.app");
  console.log("  Owner2 : owner2@myspot.app");
  console.log("  Admin  : admin@myspot.app");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
