"use client";

import { useEffect, useState } from "react";
import { ActiveAuction } from "@/lib/types";

function countdown(iso: string, now: number): { text: string; closing: boolean } {
  const ms = new Date(iso).getTime() - now;
  if (ms <= 0) return { text: "Ended", closing: false };
  const h = Math.floor(ms / 3600_000);
  const m = Math.floor((ms % 3600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  if (h >= 24) return { text: `${Math.floor(h / 24)}d ${h % 24}h`, closing: false };
  if (h > 0) return { text: `${h}h ${m}m`, closing: h < 2 };
  return { text: `${m}m ${s}s`, closing: true };
}

export default function AuctionsTable({ auctions }: { auctions: ActiveAuction[] }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const sorted = [...auctions].sort(
    (a, b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime()
  );

  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-ink text-left font-display text-base tracking-wider text-ink">
            <th className="py-2 pr-4 font-normal">Item</th>
            <th className="py-2 pr-4 text-right font-normal">Current bid</th>
            <th className="py-2 pr-4 text-right font-normal">Bids</th>
            <th className="py-2 pr-4 text-right font-normal">Watchers</th>
            <th className="py-2 font-normal">Time left</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((a) => {
            const t = countdown(a.endTime, now);
            return (
              <tr key={a.itemId} className="border-b border-felt">
                <td className="max-w-[380px] py-3 pr-4">
                  <p>{a.title}</p>
                  <p className="text-xs text-steel">#{a.itemId}</p>
                </td>
                <td className="py-3 pr-4 text-right font-semibold tabular-nums">
                  ${a.currentBid.toFixed(2)}
                </td>
                <td className="py-3 pr-4 text-right tabular-nums">{a.bidCount}</td>
                <td className="py-3 pr-4 text-right tabular-nums text-steel">{a.watchers}</td>
                <td className="py-3 tabular-nums">
                  <span className={t.closing ? "font-bold text-gameday" : ""}>{t.text}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
