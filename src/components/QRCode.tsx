import QRCodeLib from "qrcode";

export default async function QRCode({ value, size = 180 }: { value: string; size?: number }) {
  const dataUrl = await QRCodeLib.toDataURL(value, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: size,
    color: { dark: "#0f172a", light: "#ffffff" },
  });
  return (
    <div className="inline-block rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={dataUrl} alt={`QR code: ${value}`} width={size} height={size} style={{ width: size, height: size }} />
    </div>
  );
}
