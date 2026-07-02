// Single seam between demo data and the live eBay APIs.
// Demo mode is automatic: no EBAY_CLIENT_ID → staged data.

import { ActiveAuction, ClosedOrder } from "@/lib/types";
import { mockAuctions, mockOrders } from "@/lib/ebay/mock-data";
import { fetchActiveAuctions, fetchClosedOrders, isDemoMode } from "@/lib/ebay/client";

export { isDemoMode };

export async function getClosedOrders(): Promise<ClosedOrder[]> {
  return isDemoMode() ? mockOrders : fetchClosedOrders();
}

export async function getActiveAuctions(): Promise<ActiveAuction[]> {
  return isDemoMode() ? mockAuctions : fetchActiveAuctions();
}

export async function getOrderById(orderId: string): Promise<ClosedOrder | undefined> {
  const orders = await getClosedOrders();
  return orders.find((o) => o.orderId === orderId);
}
