import { parse, HTMLElement, Node, NodeType } from "node-html-parser";

const DARK = "#111827";
const BORDER = "#e5e7eb";
const LIGHT_BLUE = "#dbeafe";
const BLUE = "#1e40af";

interface RunStyle {
  bold?: boolean;
  italic?: boolean;
  color?: string;
}

function pdfFont(style: RunStyle): string {
  if (style.bold && style.italic) return "Helvetica-BoldOblique";
  if (style.bold) return "Helvetica-Bold";
  if (style.italic) return "Helvetica-Oblique";
  return "Helvetica";
}

function parseColor(style: string | undefined): string | undefined {
  if (!style) return undefined;
  const m = style.match(/color:\s*([^;]+)/);
  if (!m) return undefined;
  const val = m[1].trim();
  if (val.startsWith("#")) return val;
  const rgb = val.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgb) {
    return (
      "#" +
      [rgb[1], rgb[2], rgb[3]].map((n) => parseInt(n, 10).toString(16).padStart(2, "0")).join("")
    );
  }
  return undefined;
}

interface TextSegment {
  text: string;
  style: RunStyle;
}

function collectSegments(node: Node, inherited: RunStyle): TextSegment[] {
  const segments: TextSegment[] = [];
  if (node.nodeType === NodeType.TEXT_NODE) {
    if (node.rawText) segments.push({ text: node.rawText, style: inherited });
    return segments;
  }
  if (node.nodeType !== NodeType.ELEMENT_NODE) return segments;
  const el = node as HTMLElement;
  const tag = el.tagName?.toLowerCase();
  if (tag === "br") {
    segments.push({ text: "\n", style: inherited });
    return segments;
  }
  const color = parseColor(el.getAttribute("style")) || inherited.color;
  const next: RunStyle = {
    bold: inherited.bold || tag === "strong" || tag === "b",
    italic: inherited.italic || tag === "em" || tag === "i",
    color,
  };
  for (const child of el.childNodes) {
    segments.push(...collectSegments(child, next));
  }
  return segments;
}

function decodeDataUrl(src: string): Buffer | null {
  const m = src.match(/^data:image\/(png|jpeg|jpg|gif|bmp);base64,(.+)$/);
  if (!m) return null;
  return Buffer.from(m[2], "base64");
}

/**
 * Renders a simple HTML string (as produced by the TipTap rich text editor)
 * directly into a pdfkit document, preserving bold, italic, color, tables,
 * and images. `doc` and layout constants are supplied by the caller so the
 * generator's existing pagination helpers keep working.
 */
export function renderHtmlIntoPdf(
  doc: PDFKit.PDFDocument,
  html: string,
  opts: { marginX: number; contentWidth: number; pageHeight: number; marginBottom: number },
) {
  if (!html || !html.trim()) return;
  const root = parse(html);
  const topLevel = root.childNodes.filter((n) => n.nodeType === NodeType.ELEMENT_NODE) as HTMLElement[];
  const { marginX, contentWidth, pageHeight, marginBottom } = opts;

  const ensureSpace = (needed: number) => {
    if (doc.y > pageHeight - marginBottom - needed) doc.addPage();
  };

  const renderParagraphLike = (el: HTMLElement) => {
    const segments = collectSegments(el, {});
    if (segments.length === 0) return;
    ensureSpace(20);
    doc.fontSize(10);
    segments.forEach((seg, i) => {
      doc
        .font(pdfFont(seg.style))
        .fillColor(seg.style.color || DARK)
        .text(seg.text, {
          width: contentWidth,
          continued: i < segments.length - 1,
        });
    });
    doc.fillColor(DARK).font("Helvetica").moveDown(0.5);
  };

  const renderList = (el: HTMLElement, ordered: boolean) => {
    const items = el.querySelectorAll("li");
    items.forEach((li, idx) => {
      const segments = collectSegments(li, {});
      const prefix = ordered ? `${idx + 1}. ` : "• ";
      ensureSpace(20);
      doc.fontSize(10).fillColor(DARK).font("Helvetica");
      const text = prefix + segments.map((s) => s.text).join("");
      doc.text(text, marginX + 10, doc.y, { width: contentWidth - 10 });
      doc.moveDown(0.2);
    });
    doc.moveDown(0.3);
  };

  const renderTable = (el: HTMLElement) => {
    const trs = el.querySelectorAll("tr");
    if (trs.length === 0) return;
    const rows = trs.map((tr) => tr.querySelectorAll("td, th"));
    const colCount = Math.max(...rows.map((r) => r.length));
    if (colCount === 0) return;
    const colWidth = contentWidth / colCount;
    const rowH = 22;

    rows.forEach((cells, ri) => {
      ensureSpace(rowH);
      const isHeader = cells.length > 0 && cells.every((c) => c.tagName?.toLowerCase() === "th");
      const y = doc.y;
      doc.fillColor(isHeader ? LIGHT_BLUE : ri % 2 === 1 ? "#f9fafb" : "#ffffff").rect(marginX, y, contentWidth, rowH).fill();
      let x = marginX;
      cells.forEach((cell) => {
        const text = cell.textContent?.trim() || "";
        doc
          .fillColor(isHeader ? BLUE : DARK)
          .fontSize(9)
          .font(isHeader ? "Helvetica-Bold" : "Helvetica")
          .text(text, x + 4, y + 6, { width: colWidth - 8, lineBreak: false });
        x += colWidth;
      });
      doc.strokeColor(BORDER).lineWidth(0.5).rect(marginX, y, contentWidth, rowH).stroke();
      doc.y = y + rowH;
    });
    doc.fillColor(DARK).moveDown(0.5);
  };

  const renderImage = (el: HTMLElement) => {
    const src = el.getAttribute("src");
    if (!src) return;
    const buffer = decodeDataUrl(src);
    if (!buffer) return;
    ensureSpace(150);
    try {
      doc.image(buffer, marginX, doc.y, { fit: [Math.min(contentWidth, 400), 300] });
      doc.moveDown(8);
    } catch {
      // ignore malformed image data
    }
  };

  const walk = (el: HTMLElement) => {
    const tag = el.tagName?.toLowerCase();
    if (tag === "table") {
      renderTable(el);
    } else if (tag === "ul") {
      renderList(el, false);
    } else if (tag === "ol") {
      renderList(el, true);
    } else if (tag === "img") {
      renderImage(el);
    } else if (tag === "p" || tag === "div" || /^h[1-6]$/.test(tag || "")) {
      const nestedImages = el.querySelectorAll("img");
      if (nestedImages.length > 0) {
        nestedImages.forEach((img) => renderImage(img));
      } else {
        renderParagraphLike(el);
      }
    } else {
      renderParagraphLike(el);
    }
  };

  if (topLevel.length === 0) {
    bodyTextFallback(doc, root.textContent || "", { marginX, contentWidth });
    return;
  }
  topLevel.forEach(walk);
}

function bodyTextFallback(
  doc: PDFKit.PDFDocument,
  text: string,
  opts: { marginX: number; contentWidth: number },
) {
  if (!text) return;
  doc
    .fillColor(DARK)
    .fontSize(10)
    .font("Helvetica")
    .text(text, opts.marginX, doc.y, { width: opts.contentWidth })
    .moveDown(0.5);
}
