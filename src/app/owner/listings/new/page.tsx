import ListingForm from "@/components/ListingForm";

export const metadata = { title: "List a space — MYSPOT Owner" };

export default function NewListingPage() {
  return (
    <div>
      <h2 className="font-display text-xl font-extrabold text-slate-900">List a new parking space</h2>
      <p className="mt-1 mb-6 text-sm text-slate-500">
        Fill in the details, pin the exact location, and start earning from your unused space.
      </p>
      <ListingForm />
    </div>
  );
}
