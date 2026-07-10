// Builds the content paragraphs for one address label.
// Shared by the single-order route and the batch route so both produce
// identical label content — only the sheet layout around them differs.

import { AlignmentType, Paragraph, TextRun } from "docx";
import { ClosedOrder } from "@/lib/types";

export function buildLabelParagraphs(order: ClosedOrder): Paragraph[] {
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
          spacing: { after: 0 },
          children: [new TextRun({ text: line, size: 14, font: "Arial" })], // 7pt
        })
      );
    }
    children.push(new Paragraph({ text: "", spacing: { after: 0 } }));
  }

  // Ship-to block, large and centered
  const shipLines = [
    a.name.toUpperCase(),
    a.line1.toUpperCase(),
    a.line2?.toUpperCase(),
    `${a.city.toUpperCase()}, ${a.state.toUpperCase()} ${a.postalCode}`,
    a.country !== "US" ? a.country : undefined,
  ].filter(Boolean) as string[];

  for (const line of shipLines) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [
          new TextRun({ text: line, bold: true, size: 44, font: "Arial" }), // 22pt — fills a 4x6 page
        ],
      })
    );
  }

  // Order reference, small print at the bottom (helps pack the right card)
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120 },
      children: [
        new TextRun({
          text: `Order ${order.orderId} — ${order.itemTitle}`,
          size: 12, // 6pt
          font: "Arial",
          color: "555555",
        }),
      ],
    })
  );

  return children;
}
