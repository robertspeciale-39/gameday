// Generates an Avery Presta 94278 sheet for one order (second slot left
// blank) and returns it as a download.
import { NextRequest, NextResponse } from "next/server";
import { getOrderById } from "@/lib/orders";
import { buildLabelSheetDocx } from "@/lib/label-sheet";

export async function GET(
  _req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const order = await getOrderById(params.orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const buffer = await buildLabelSheetDocx([order]);
  const safeName = order.address.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="label-${safeName}-${order.orderId}.docx"`,
    },
  });
}
