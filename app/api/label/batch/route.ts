// Generates one multi-page Avery Presta 94278 doc for several orders at
// once (2 labels per sheet, paginated automatically). POST { orderIds }.
import { NextRequest, NextResponse } from "next/server";
import { getOrderById } from "@/lib/orders";
import { buildLabelSheetDocx } from "@/lib/label-sheet";

export async function POST(req: NextRequest) {
  const { orderIds } = (await req.json()) as { orderIds?: string[] };
  if (!orderIds?.length) {
    return NextResponse.json({ error: "No order IDs provided" }, { status: 400 });
  }

  const orders = (
    await Promise.all(orderIds.map((id) => getOrderById(id)))
  ).filter((o): o is NonNullable<typeof o> => Boolean(o));

  if (!orders.length) {
    return NextResponse.json({ error: "No matching orders found" }, { status: 404 });
  }

  const buffer = await buildLabelSheetDocx(orders);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="labels-${orders.length}-orders.docx"`,
    },
  });
}
