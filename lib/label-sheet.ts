// Avery Presta 94278: 2 labels per sheet, each label 6"(w) x 4"(h), landscape
// orientation, printed on a standard US Letter sheet (8.5" x 11", portrait),
// stacked vertically.
//
// ASSUMPTION FLAG: Avery's product page confirms the label size (4"x6",
// 2/sheet) but does not publish the exact top margin / inter-label gap for
// this specific Presta template. The values below are a reasonable standard
// layout (labels centered horizontally, evenly spaced vertically) and are
// the ones to adjust after the first physical test print if the die-cut
// doesn't line up. All positioning lives in the constants below so that's a
// one-line fix, not a rebuild — see README "Adjusting label alignment".

import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  WidthType,
  HeightRule,
  VerticalAlign,
  BorderStyle,
} from "docx";
import { ClosedOrder } from "@/lib/types";
import { buildLabelParagraphs } from "@/lib/label-content";

const TW = 1440; // twips per inch

const PAGE_WIDTH = 8.5 * TW;
const PAGE_HEIGHT = 11 * TW;
const LABEL_WIDTH = 6 * TW;
const LABEL_HEIGHT = 4 * TW;
const SIDE_MARGIN = (8.5 * TW - LABEL_WIDTH) / 2; // centers the label horizontally
const TOP_MARGIN = 0.75 * TW;
const GAP_BETWEEN_LABELS = 0.5 * TW;
// Bottom margin is whatever's left over: 11 - 0.75 - 4 - 0.5 - 4 = 1.75"

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const NO_BORDERS = {
  top: NO_BORDER,
  bottom: NO_BORDER,
  left: NO_BORDER,
  right: NO_BORDER,
  insideHorizontal: NO_BORDER,
  insideVertical: NO_BORDER,
};

function labelCell(content: Paragraph[] | null): TableRow {
  return new TableRow({
    height: { value: LABEL_HEIGHT, rule: HeightRule.EXACT },
    children: [
      new TableCell({
        width: { size: LABEL_WIDTH, type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER,
        borders: NO_BORDERS,
        children: content ?? [new Paragraph({ text: "" })],
      }),
    ],
  });
}

/**
 * Builds a print-ready docx for Avery Presta 94278.
 * Orders are paginated 2-per-sheet; a trailing odd order gets a blank
 * second slot rather than spilling content across the die-cut line.
 */
export function buildLabelSheetDocx(orders: ClosedOrder[]): Promise<Buffer> {
  const sections = [];

  for (let i = 0; i < orders.length; i += 2) {
    const pair = orders.slice(i, i + 2);
    const rows = [
      labelCell(buildLabelParagraphs(pair[0])),
      labelCell(pair[1] ? buildLabelParagraphs(pair[1]) : null),
    ];

    sections.push({
      properties: {
        page: {
          size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
          margin: {
            top: TOP_MARGIN,
            left: SIDE_MARGIN,
            right: SIDE_MARGIN,
            bottom: 0,
          },
        },
      },
      children: [
        new Table({
          width: { size: LABEL_WIDTH, type: WidthType.DXA },
          rows: [
            rows[0],
            // Spacer row creates the gap between the two labels
            new TableRow({
              height: { value: GAP_BETWEEN_LABELS, rule: HeightRule.EXACT },
              children: [
                new TableCell({
                  width: { size: LABEL_WIDTH, type: WidthType.DXA },
                  borders: NO_BORDERS,
                  children: [new Paragraph({ text: "" })],
                }),
              ],
            }),
            rows[1],
          ],
        }),
      ],
    });
  }

  const doc = new Document({ sections });
  return Packer.toBuffer(doc) as unknown as Promise<Buffer>;
}
