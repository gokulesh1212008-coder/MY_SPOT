export interface ClientUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  isOwner: boolean;
  isAdmin: boolean;
  isVerified: boolean;
}

export interface SearchResultItem {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  address: string;
  landmark: string | null;
  spaceType: string;
  allowedTypes: string[];
  isCovered: boolean;
  isIndoor: boolean;
  hasCCTV: boolean;
  hasLighting: boolean;
  hasEV: boolean;
  pricePerHour: number;
  currency: string;
  openHour: number;
  closeHour: number;
  verificationStatus: string;
  rating: number;
  ratingCount: number;
  image: string;
  distanceKm: number | null;
  score: number;
  reasons: string[];
}

export interface SpaceDetail {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  address: string;
  landmark: string | null;
  spaceType: string;
  allowedTypes: string[];
  isCovered: boolean;
  isIndoor: boolean;
  hasCCTV: boolean;
  hasLighting: boolean;
  hasEV: boolean;
  pricePerHour: number;
  currency: string;
  openHour: number;
  closeHour: number;
  autoApprove: boolean;
  verificationStatus: string;
  status: string;
  rating: number;
  ratingCount: number;
  maxDimensions: string | null;
  images: { id: string; url: string; isPrimary: boolean }[];
  available: boolean;
  availabilityReason: string;
  favorited: boolean;
  owner: { id: string; name: string; isVerified: boolean };
  reviews: {
    id: string;
    rating: number;
    comment: string | null;
    ownerReply: string | null;
    createdAt: string;
    user: { name: string };
  }[];
}

export interface BookingDTO {
  id: string;
  bookingRef: string;
  status: string;
  ownerApproved: boolean;
  startAt: string;
  endAt: string;
  baseAmount: number;
  feeAmount: number;
  taxAmount: number;
  totalAmount: number;
  ownerAmount: number;
  commissionAmount: number;
  checkInAt: string | null;
  checkOutAt: string | null;
  cancelReason: string | null;
  space: {
    id: string;
    title: string;
    address: string;
    pricePerHour: number;
    images: { url: string; isPrimary: boolean }[];
    owner: { id: string; name: string };
  };
  vehicle: { id: string; regNumber: string; model: string; type: string; color: string };
  payments: { id: string; type: string; amount: number; status: string; provider: string; createdAt: string }[];
  review: { id: string; rating: number } | null;
}
