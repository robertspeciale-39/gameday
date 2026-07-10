// Label doc builder: one 4"(w) x 6"(h) page per order, one label per page.
// Batch printing produces a multi-page doc — each page is a single 4x6 label,
// which feeds a thermal 4x6 printer or prints one-per-sheet on a desktop printer.

import { Document, Packer } from "docx";
import { ClosedOrder } from "@/lib/types";
import { buildLabelParagraphs } from "@/lib/label-content";

const TW = 1440; // twips per inch

const PAGE_WIDTH = 4 * TW;
const PAGE_HEIGHT = 6 * TW;
const MARGIN = 0.3 * TW;

/**
 * Builds a print-ready docx with one 4x6 label per page.
 * A batch of N orders yields an N-page document.
 */
export function buildLabelSheetDocx(orders: ClosedOrder[]): Promise<Buffer> {
  const sections = orders.map((order) => ({
    properties: {
      page: {
        size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
        margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
      },
    },
    children: buildLabelParagraphs(order),
  }));

  const doc = new Document({ sections });
  return Packer.toBuffer(doc) as unknown as Promise<Buffer>;
}
