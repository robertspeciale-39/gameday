"use client";

import { useEffect, useState } from "react";
import { ClosedOrder } from "@/lib/types";

const LABELED_KEY = "gameday-labeled-orders";

function shipByLabel(iso: string): { text: string; overdue: boolean } {
  const ms = new Date(iso).getTime() - Date.now();
  const hrs = Math.round(ms / 3600_000);
  if (ms < 0) return { text: `${Math.abs(hrs)}h overdue`, overdue: true };
  if (hrs < 24) return { text: `${hrs}h left`, overdue: false };
  return { text: `${Math.round(hrs / 24)}d left`, overdue: false };
}

export default function OrdersTable({ orders }: { orders: ClosedOrder[] }) {
  const [labeled, setLabeled] = useState<string[]>([]);

  useEffect(() => {
    setLabeled(JSON.parse(localStorage.getItem(LABELED_KEY) ?? "[]"));
  }, []);

  function markLabeled(orderId: string) {
    const next = Array.from(new Set([...labeled, orderId]));
    setLabeled(next);
    localStorage.setItem(LABELED_KEY, JSON.stringify(next));
  }

  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-ink text-left font-display text-base tracking-wider text-ink">
            <th className="py-2 pr-4 font-normal">Buyer</th>
            <th className="py-2 pr-4 font-normal">Item</th>
            <th className="py-2 pr-4 text-right font-normal">Sale</th>
            <th className="py-2 pr-4 font-normal">Status</th>
            <th className="py-2 pr-4 font-normal">Ship by</th>
            <th className="py-2 font-normal">Label</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => {
            const shipBy = shipByLabel(o.shipByDate);
            const done = labeled.includes(o.orderId);
            return (
              <tr key={o.orderId} className="border-b border-felt align-top">
                <td className="py-3 pr-4">
                  <p className="font-semibold">{o.address.name}</p>
                  <p className="text-xs text-steel">{o.buyerUsername}</p>
                </td>
                <td className="max-w-[320px] py-3 pr-4">
                  <p>{o.itemTitle}</p>
                  <p className="text-xs text-steel">
                    {o.address.city}, {o.address.state} · #{o.orderId}
                  </p>
                </td>
                <td className="py-3 pr-4 text-right font-semibold tabular-nums">
                  ${o.salePrice.toFixed(2)}
                </td>
                <td className="py-3 pr-4">
                  {o.paid ? (
                    <span className="font-medium">Paid</span>
                  ) : (
                    <span className="text-steel">Awaiting payment</span>
                  )}
                </td>
                <td className="py-3 pr-4 tabular-nums">
                  <span className={shipBy.overdue ? "font-bold text-gameday" : ""}>
                    {shipBy.text}
                  </span>
                </td>
                <td className="py-3">
                  {o.paid ? (
                    <a
                      href={`/api/label/${o.orderId}`}
                      onClick={() => markLabeled(o.orderId)}
                      className={
                        done
                          ? "inline-block rounded-sm border border-felt px-3 py-1.5 text-xs font-semibold text-steel hover:border-steel"
                          : "inline-block rounded-sm bg-gameday px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-chalk transition-colors hover:bg-gameday-deep"
                      }
                    >
                      {done ? "Reprint label" : "Generate label"}
                    </a>
                  ) : (
                    <span className="text-xs text-steel">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
