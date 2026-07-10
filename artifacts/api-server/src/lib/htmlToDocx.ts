import { parse, HTMLElement, Node, NodeType } from "node-html-parser";
import {
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ImageRun,
  AlignmentType,
} from "docx";
import imageSize from "image-size";

interface RunStyle {
  bold?: boolean;
  italic?: boolean;
  color?: string;
  font?: string;
}

function rgbToHex(rgb: string): string | undefined {
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return undefined;
  return [m[1], m[2], m[3]]
    .map((n) => parseInt(n, 10).toString(16).padStart(2, "0"))
    .join("");
}

function parseStyleAttr(style: string | undefined): { color?: string; font?: string } {
  if (!style) return {};
  const result: { color?: string; font?: string } = {};
  const colorMatch = style.match(/color:\s*([^;]+)/);
  if (colorMatch) {
    const val = colorMatch[1].trim();
    result.color = val.startsWith("#") ? val.replace("#", "") : rgbToHex(val);
  }
  const fontMatch = style.match(/font-family:\s*([^;]+)/);
  if (fontMatch) {
    result.font = fontMatch[1].replace(/["']/g, "").split(",")[0].trim();
  }
  return result;
}

function decodeDataUrl(src: string): { buffer: Buffer; ext: "png" | "jpg" | "gif" | "bmp" } | null {
  const m = src.match(/^data:image\/(png|jpeg|jpg|gif|bmp);base64,(.+)$/);
  if (!m) return null;
  const mime = m[1] === "jpeg" ? "jpg" : (m[1] as "png" | "jpg" | "gif" | "bmp");
  return { buffer: Buffer.from(m[2], "base64"), ext: mime };
}

function imageParagraph(src: string): Paragraph | null {
  const decoded = decodeDataUrl(src);
  if (!decoded) return null;
  let width = 400;
  let height = 300;
  try {
    const dims = imageSize(decoded.buffer);
    if (dims.width && dims.height) {
      const maxWidth = 500;
      const scale = dims.width > maxWidth ? maxWidth / dims.width : 1;
      width = Math.round(dims.width * scale);
      height = Math.round(dims.height * scale);
    }
  } catch {
    // fall back to defaults
  }
  return new Paragraph({
    children: [
      new ImageRun({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type: decoded.ext as any,
        data: decoded.buffer,
        transformation: { width, height },
      }),
    ],
  });
}

function collectRuns(node: Node, inherited: RunStyle): TextRun[] {
  const runs: TextRun[] = [];
  if (node.nodeType === NodeType.TEXT_NODE) {
    const text = node.rawText;
    if (text) {
      runs.push(
        new TextRun({
          text,
          bold: inherited.bold,
          italics: inherited.italic,
          color: inherited.color,
          font: inherited.font,
        }),
      );
    }
    return runs;
  }
  if (node.nodeType !== NodeType.ELEMENT_NODE) return runs;
  const el = node as HTMLElement;
  const tag = el.tagName?.toLowerCase();
  const style = parseStyleAttr(el.getAttribute("style"));
  const next: RunStyle = {
    bold: inherited.bold || tag === "strong" || tag === "b",
    italic: inherited.italic || tag === "em" || tag === "i",
    color: style.color || inherited.color,
    font: style.font || inherited.font,
  };
  if (tag === "br") {
    runs.push(new TextRun({ text: "", break: 1 }));
    return runs;
  }
  for (const child of el.childNodes) {
    runs.push(...collectRuns(child, next));
  }
  return runs;
}

function elementToBlocks(el: HTMLElement): (Paragraph | Table)[] {
  const tag = el.tagName?.toLowerCase();
  const blocks: (Paragraph | Table)[] = [];

  if (tag === "img") {
    const src = el.getAttribute("src");
    if (src) {
      const p = imageParagraph(src);
      if (p) blocks.push(p);
    }
    return blocks;
  }

  if (tag === "table") {
    const rows: TableRow[] = [];
    const trs = el.querySelectorAll("tr");
    trs.forEach((tr) => {
      const cells = tr.querySelectorAll("td, th");
      const isHeaderRow = cells.length > 0 && cells.every((c) => c.tagName?.toLowerCase() === "th");
      const tableCells = cells.map((cell) => {
        const runs = collectRuns(cell, { bold: isHeaderRow });
        return new TableCell({
          shading: isHeaderRow ? { fill: "D9E2F3" } : undefined,
          children: [new Paragraph({ children: runs.length > 0 ? runs : [new TextRun("")] })],
        });
      });
      rows.push(new TableRow({ children: tableCells }));
    });
    if (rows.length > 0) {
      blocks.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }));
    }
    return blocks;
  }

  if (tag === "ul" || tag === "ol") {
    const items = el.querySelectorAll("li");
    items.forEach((li) => {
      const runs = collectRuns(li, {});
      blocks.push(
        new Paragraph({
          bullet: tag === "ul" ? { level: 0 } : undefined,
          numbering: tag === "ol" ? { reference: "default-numbering", level: 0 } : undefined,
          children: runs.length > 0 ? runs : [new TextRun("")],
        }),
      );
    });
    return blocks;
  }

  if (tag === "p" || tag === "div" || /^h[1-6]$/.test(tag || "")) {
    // Images nested inside a paragraph-like element are pulled out as their own blocks
    const imageEls = el.querySelectorAll("img");
    if (imageEls.length > 0) {
      imageEls.forEach((img) => {
        const src = img.getAttribute("src");
        if (src) {
          const p = imageParagraph(src);
          if (p) blocks.push(p);
        }
      });
      return blocks;
    }
    const runs = collectRuns(el, {});
    blocks.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: runs.length > 0 ? runs : [new TextRun("")],
      }),
    );
    return blocks;
  }

  // Fallback: treat unknown block-level content as a paragraph
  const runs = collectRuns(el, {});
  if (runs.length > 0) {
    blocks.push(new Paragraph({ children: runs }));
  }
  return blocks;
}

/**
 * Converts a simple HTML string (as produced by the TipTap rich text editor)
 * into an array of docx Paragraph/Table blocks, preserving bold, italic,
 * color, font family, tables, and images.
 */
export function htmlToDocxBlocks(html: string): (Paragraph | Table)[] {
  if (!html || !html.trim()) return [new Paragraph({ children: [new TextRun("")] })];
  const root = parse(html);
  const blocks: (Paragraph | Table)[] = [];
  const topLevel = root.childNodes.filter((n) => n.nodeType === NodeType.ELEMENT_NODE) as HTMLElement[];
  if (topLevel.length === 0) {
    // Plain text with no wrapping tags
    const text = root.textContent || "";
    return text
      .split("\n")
      .map((line) => new Paragraph({ children: [new TextRun({ text: line })] }));
  }
  for (const el of topLevel) {
    blocks.push(...elementToBlocks(el));
  }
  return blocks.length > 0 ? blocks : [new Paragraph({ children: [new TextRun("")] })];
}
