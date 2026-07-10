import { getActiveAuctions, getClosedOrders, isDemoMode } from "@/lib/orders";
import OrdersTable from "@/components/OrdersTable";
import AuctionsTable from "@/components/AuctionsTable";

// Re-fetch from eBay at most every 10 minutes (matches the project plan's cadence)
export const revalidate = 600;

export default async function Dashboard() {
  const [orders, auctions] = await Promise.all([
    getClosedOrders(),
    getActiveAuctions(),
  ]);
  const demo = isDemoMode();
  const toShip = orders.filter((o) => o.paid).length;

  return (
    <main className="mx-auto max-w-6xl px-6 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-4 pt-10 pb-2">
        <p className="text-sm text-steel">
          <span className="font-semibold text-ink">{toShip}</span> paid{" "}
          {toShip === 1 ? "order" : "orders"} waiting to ship ·{" "}
          <span className="font-semibold text-ink">{auctions.length}</span> auctions live
        </p>
        {demo && (
          <span className="rounded-sm border border-gameday px-2.5 py-1 text-xs font-semibold uppercase tracking-widest text-gameday">
            Demo data — connect eBay to go live
          </span>
        )}
      </div>

      <section className="mt-8">
        <h2 className="font-display text-4xl tracking-wide">
          Sold <span className="text-gameday">/</span> To Ship
        </h2>
        <p className="mt-1 max-w-[65ch] text-sm text-steel">
          Paid orders pull straight from eBay. Generate a single label, or check
          off several and print them together — one 4&Prime;&times;6&Prime; label
          per page.
        </p>
        <OrdersTable orders={orders} />
      </section>

      <section className="mt-16">
        <h2 className="font-display text-4xl tracking-wide">
          Live <span className="text-gameday">/</span> On the Block
        </h2>
        <AuctionsTable auctions={auctions} />
      </section>

      <p className="mt-16 text-xs text-steel">
        Last updated {new Date().toLocaleTimeString("en-US")} · refreshes every 10 minutes
      </p>
    </main>
  );
}
