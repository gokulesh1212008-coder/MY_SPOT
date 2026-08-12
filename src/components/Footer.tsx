import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 text-lg text-white">
              🅿️
            </span>
            <span className="font-display text-xl font-extrabold text-white">
              MY<span className="text-brand-400">SPOT</span>
            </span>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
            Turn unused parking spaces into trusted parking. Park nearby. Park securely. Park smart.
          </p>
          <p className="mt-4 text-xs text-slate-500">
            © {new Date().getFullYear()} MYSPOT · Demo build · Payments run in sandbox mode until a live gateway is configured.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">Product</h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/parking" className="hover:text-white">Find Parking</Link></li>
            <li><Link href="/register" className="hover:text-white">List Your Parking</Link></li>
            <li><Link href="/login" className="hover:text-white">Sign in</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">Trust & Safety</h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li>Verified parking spaces</li>
            <li>OTP + QR check-in</li>
            <li>Owner authorization</li>
            <li>Incident reporting</li>
            <li>Transparent pricing</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
