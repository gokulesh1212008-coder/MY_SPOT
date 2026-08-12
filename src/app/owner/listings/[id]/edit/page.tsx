import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import ListingForm from "@/components/ListingForm";
import { Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function EditListingPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { id } = await params;
  const { created } = await searchParams;
  const user = await getCurrentUser();
  if (!user) notFound();

  const space = await prisma.parkingSpace.findUnique({
    where: { id },
    include: { images: true },
  });
  if (!space || space.ownerId !== user.id) notFound();

  let allowedTypes: string[] = ["CAR"];
  try {
    allowedTypes = JSON.parse(space.allowedTypes);
  } catch {
    /* ignore */
  }

  return (
    <div>
      <h2 className="font-display text-xl font-extrabold text-slate-900">Edit listing</h2>
      <div className="mb-6 mt-1 flex flex-wrap items-center gap-2">
        <Badge color={space.verificationStatus === "VERIFIED" ? "green" : "amber"}>{space.verificationStatus}</Badge>
        <Badge color={space.status === "ACTIVE" ? "blue" : "slate"}>{space.status}</Badge>
        {created && <span className="text-sm font-medium text-emerald-600">✓ Listing created — it will appear in search once active.</span>}
      </div>
      <ListingForm
        initial={{
          id: space.id,
          title: space.title,
          description: space.description,
          lat: space.lat,
          lng: space.lng,
          address: space.address,
          landmark: space.landmark ?? "",
          spaceType: space.spaceType,
          allowedTypes,
          maxDimensions: space.maxDimensions ?? "",
          isCovered: space.isCovered,
          isIndoor: space.isIndoor,
          hasCCTV: space.hasCCTV,
          hasLighting: space.hasLighting,
          hasEV: space.hasEV,
          pricePerHour: String(space.pricePerHour),
          openHour: String(space.openHour),
          closeHour: String(space.closeHour),
          autoApprove: space.autoApprove,
        }}
      />
    </div>
  );
}
