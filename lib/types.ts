export interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ClosedOrder {
  orderId: string;
  buyerUsername: string;
  itemTitle: string;
  salePrice: number;
  paid: boolean;
  shipByDate: string; // ISO
  soldDate: string; // ISO
  address: ShippingAddress;
}

export interface ActiveAuction {
  itemId: string;
  title: string;
  currentBid: number;
  bidCount: number;
  endTime: string; // ISO
  watchers: number;
}
