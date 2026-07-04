"use client";

import { useEffect, useMemo, useState } from "react";
import { ClosedOrder } from "@/lib/types";

const LABELED_KEY = "gameday-labeled-orders";

function shipByLabel(iso: string): { text: string; overdue: boolean } {
  const ms = new Date(iso).getTime() - Date.now();
  const hrs = Math.round(ms / 3600_000);
  if (ms < 0) return { text: `${Math.abs(hrs)}h overdue`, overdue: true };
  if (hrs < 24) return { text: `${hrs}h left`, overdue: false };
  return { text: `${Math.round(hrs / 24)}d left`, overdue: false };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function OrdersTable({ orders }: { orders: ClosedOrder[] }) {
  const [labeled, setLabeled] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    setLabeled(JSON.parse(localStorage.getItem(LABELED_KEY) ?? "[]"));
  }, []);

  const payableOrders = useMemo(() => orders.filter((o) => o.paid), [orders]);
  const allSelected =
    payableOrders.length > 0 && payableOrders.every((o) => selected.includes(o.orderId));

  function markLabeled(orderIds: string[]) {
    const next = Array.from(new Set([...labeled, ...orderIds]));
    setLabeled(next);
    localStorage.setItem(LABELED_KEY, JSON.stringify(next));
  }

  function toggleOne(orderId: string) {
    setSelected((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  }

  function toggleAll() {
    setSelected(allSelected ? [] : payableOrders.map((o) => o.orderId));
  }

  async function printSelected() {
    setPrinting(true);
    try {
      const res = await fetch("/api/label/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: selected }),
      });
      if (!res.ok) throw new Error("Batch label generation failed");
      const blob = await res.blob();
      const sheets = Math.ceil(selected.length / 2);
      downloadBlob(blob, `labels-${selected.length}-orders-${sheets}-sheets.docx`);
      markLabeled(selected);
      setSelected([]);
    } catch {
      alert("Couldn't generate the label sheet. Try again.");
    } finally {
      setPrinting(false);
    }
  }

  return (
    <div className="mt-6">
      {selected.length > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-sm bg-ink px-4 py-2.5">
          <p className="text-sm text-chalk">
            {selected.length} {selected.length === 1 ? "label" : "labels"} selected ·{" "}
            {Math.ceil(selected.length / 2)}{" "}
            {Math.ceil(selected.length / 2) === 1 ? "sheet" : "sheets"}
          </p>
          <button
            onClick={printSelected}
            disabled={printing}
            className="rounded-sm bg-gameday px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-chalk transition-colors hover:bg-gameday-deep disabled:opacity-60"
          >
            {printing ? "Generating…" : `Print ${selected.length} labels`}
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-ink text-left font-display text-base tracking-wider text-ink">
              <th className="w-8 py-2 pr-2">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all paid orders"
                  className="h-4 w-4 accent-gameday"
                />
              </th>
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
              const checked = selected.includes(o.orderId);
              return (
                <tr key={o.orderId} className="border-b border-felt align-top">
                  <td className="py-3 pr-2">
                    {o.paid && (
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleOne(o.orderId)}
                        aria-label={`Select order ${o.orderId}`}
                        className="h-4 w-4 accent-gameday"
                      />
                    )}
                  </td>
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
                        onClick={() => markLabeled([o.orderId])}
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
    </div>
  );
}
