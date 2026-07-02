// Generates a 4"x6" Word address label for one order and returns it as a download.
import { NextRequest, NextResponse } from "next/server";
import {
  AlignmentType,
  Document,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { getOrderById } from "@/lib/orders";

const TW = 1440; // twips per inch

export async function GET(
  _req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const order = await getOrderById(params.orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const a = order.address;
  const returnName = process.env.RETURN_ADDRESS_NAME;

  const children: Paragraph[] = [];

  // Return address, small, top-left
  if (returnName) {
    const retLines = [
      returnName,
      process.env.RETURN_ADDRESS_LINE1,
      process.env.RETURN_ADDRESS_LINE2,
    ].filter(Boolean) as string[];
    for (const line of retLines) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: line, size: 16, font: "Arial" })], // 8pt
        })
      );
    }
    children.push(new Paragraph({ text: "" }));
  }

  // Ship-to block, large and centered
  const shipLines = [
    a.name.toUpperCase(),
    a.line1.toUpperCase(),
    a.line2?.toUpperCase(),
    `${a.city.toUpperCase()}, ${a.state.toUpperCase()} ${a.postalCode}`,
    a.country !== "US" ? a.country : undefined,
  ].filter(Boolean) as string[];

  children.push(new Paragraph({ text: "" }));
  for (const line of shipLines) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: line, bold: true, size: 44, font: "Arial" }), // 22pt
        ],
      })
    );
  }

  // Order reference, small print at the bottom (helps pack the right card)
  children.push(new Paragraph({ text: "" }), new Paragraph({ text: "" }));
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Order ${order.orderId} — ${order.itemTitle}`,
          size: 14, // 7pt
          font: "Arial",
          color: "555555",
        }),
      ],
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 4 * TW, height: 6 * TW },
            margin: { top: 0.3 * TW, bottom: 0.3 * TW, left: 0.3 * TW, right: 0.3 * TW },
          },
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const safeName = a.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="label-${safeName}-${order.orderId}.docx"`,
    },
  });
}
