import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  HeadingLevel,
  PageBreak,
  AlignmentType,
  Packer,
  ImageRun,
  Header,
  HorizontalPositionRelativeFrom,
  VerticalPositionRelativeFrom,
  HorizontalPositionAlign,
  VerticalPositionAlign,
} from "docx";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { htmlToDocxBlocks } from "./htmlToDocx.js";

// Placeholder logo/watermark images. Swapping in the final branding later is
// a matter of replacing these two files on disk — no code changes needed.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.join(__dirname, "../assets/logo-placeholder.png");
const WATERMARK_PATH = path.join(__dirname, "../assets/watermark-placeholder.png");

function decodeDataUrlImage(src: string): { buffer: Buffer; ext: "png" | "jpg" | "gif" | "bmp" } | null {
  const m = src.match(/^data:image\/(png|jpeg|jpg|gif|bmp);base64,(.+)$/);
  if (!m) return null;
  const mime = m[1] === "jpeg" ? "jpg" : (m[1] as "png" | "jpg" | "gif" | "bmp");
  return { buffer: Buffer.from(m[2], "base64"), ext: mime };
}

// Header repeated on every page: logo pinned to the top-right corner and a
// large, faded watermark image positioned behind the document content.
function buildPageHeader(): Header {
  return new Header({
    children: [
      new Paragraph({
        children: [
          new ImageRun({
            type: "png",
            data: readFileSync(WATERMARK_PATH),
            transformation: { width: 420, height: 280 },
            floating: {
              horizontalPosition: {
                relative: HorizontalPositionRelativeFrom.PAGE,
                align: HorizontalPositionAlign.CENTER,
              },
              verticalPosition: {
                relative: VerticalPositionRelativeFrom.PAGE,
                align: VerticalPositionAlign.CENTER,
              },
              behindDocument: true,
              wrap: { type: "none" as any },
            },
          }),
          new ImageRun({
            type: "png",
            data: readFileSync(LOGO_PATH),
            transformation: { width: 70, height: 52 },
            floating: {
              horizontalPosition: {
                relative: HorizontalPositionRelativeFrom.PAGE,
                align: HorizontalPositionAlign.RIGHT,
              },
              verticalPosition: {
                relative: VerticalPositionRelativeFrom.PAGE,
                align: VerticalPositionAlign.TOP,
              },
              behindDocument: false,
              wrap: { type: "none" as any },
            },
          }),
        ],
      }),
    ],
  });
}

function signatureParagraph(src: string): Paragraph | null {
  const decoded = decodeDataUrlImage(src);
  if (!decoded) return null;
  return new Paragraph({
    children: [
      new ImageRun({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type: decoded.ext as any,
        data: decoded.buffer,
        transformation: { width: 140, height: 60 },
      }),
    ],
  });
}

function heading(text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1) {
  return new Paragraph({ text, heading: level });
}

function para(text: string, opts?: { bold?: boolean; center?: boolean }) {
  return new Paragraph({
    alignment: opts?.center ? AlignmentType.CENTER : undefined,
    children: [
      new TextRun({ text, bold: opts?.bold }),
    ],
  });
}

function multiLinePara(text: string) {
  const lines = text.split("\n");
  return lines.map((line) => new Paragraph({ children: [new TextRun({ text: line })] }));
}

function tableCell(text: string, bold = false, shade?: string) {
  return new TableCell({
    shading: shade ? { fill: shade } : undefined,
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold })],
      }),
    ],
  });
}

function simpleTable(
  headers: string[],
  rows: string[][],
) {
  const headerRow = new TableRow({
    children: headers.map((h) => tableCell(h, true, "D9E2F3")),
  });
  const dataRows = rows.map(
    (row) =>
      new TableRow({
        children: row.map((cell) => tableCell(cell)),
      }),
  );
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateDocx(data: Record<string, any>): Promise<Buffer> {
  const customerName = data.customerName || "Customer";

  const confidentialText =
    `Orient will take utmost precautions to ensure that sensitive data like business strategies, data, protected website/app locations, access rights, and confidential documents are managed appropriately. No information related to the project will be exposed to competitors or the public without prior consent of ${customerName} and Orient Technologies Ltd. (OTL)`;

  const docProps: string[][] = (data.documentProperties || []).map(
    (r: Record<string, string>) => [r.action || "", r.name || "", r.date || ""],
  );
  const versionHistory: string[][] = (data.versionHistory || []).map(
    (r: Record<string, string>) => [
      r.version || "",
      r.dateReleased || "",
      r.changeNotice || "",
      r.remark || "",
    ],
  );
  const commercialRows: string[][] = (data.commercialRows || []).map(
    (r: Record<string, string>) => [
      r.description || "",
      r.timeline || "",
      r.totalCost || "",
    ],
  );
  const commercialTotal = (data.commercialRows || []).reduce(
    (sum: number, r: Record<string, string>) => {
      const numeric = parseFloat((r.totalCost || "").replace(/[^0-9.-]/g, ""));
      return sum + (isNaN(numeric) ? 0 : numeric);
    },
    0,
  );

  const acceptancePair = (label: string, party: Record<string, string>) => {
    const signatureValue = party.signature || "";
    const signatureImage = signatureParagraph(signatureValue);
    const signatureCell = signatureImage
      ? new TableCell({ children: [signatureImage] })
      : tableCell(signatureValue);
    return [
      heading(label, HeadingLevel.HEADING_2),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: ["Name", "Designation", "Signature", "Date"].map((h) => tableCell(h, true, "D9E2F3")),
          }),
          new TableRow({
            children: [
              tableCell(party.name || ""),
              tableCell(party.designation || ""),
              signatureCell,
              tableCell(party.date || ""),
            ],
          }),
        ],
      }),
    ];
  };

  const totalTableRow = new TableRow({
    children: [
      new TableCell({
        columnSpan: 2,
        children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Total", bold: true })] })],
      }),
      tableCell(commercialTotal.toLocaleString("en-IN"), true, "D9E2F3"),
    ],
  });

  const sections = [
    // Page 1: Title Page
    new Paragraph({
      text: data.proposalTitle || "Business Proposal",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: `Prepared for: ${customerName}`, size: 28 })],
    }),
    pageBreak(),

    // Page 2: Document Control
    heading("1. Document Control"),
    heading("1.1 Document Properties", HeadingLevel.HEADING_2),
    docProps.length > 0
      ? simpleTable(["Action", "Name", "Date"], docProps)
      : para("(No entries)"),
    para(""),
    heading("1.2 Document Version History", HeadingLevel.HEADING_2),
    versionHistory.length > 0
      ? simpleTable(
          ["Version", "Date Released", "Change Notice", "Remark"],
          versionHistory,
        )
      : para("(No entries)"),
    para(""),
    heading("1.3 Confidential", HeadingLevel.HEADING_2),
    para(confidentialText),
    pageBreak(),

    // Pages 3-4: Project Summary, Scope of Work
    heading("2. Project Summary"),
    ...htmlToDocxBlocks(data.projectSummary || ""),
    para(""),
    heading("3. Scope of Work"),
    ...htmlToDocxBlocks(data.scopeOfWork || ""),
    pageBreak(),

    // Page 5: Pre-Reqs, Out of Scope, Commercials
    heading("4. Pre-Requisites"),
    ...htmlToDocxBlocks(data.preRequisites || ""),
    para(""),
    heading("5. Out of Scope"),
    ...htmlToDocxBlocks(data.outOfScope || ""),
    para(""),
    heading("6. Commercials"),
    (() => {
      const headerRow = new TableRow({
        children: ["Description", "Timeline", "Total Cost (In INR)"].map((h) => tableCell(h, true, "D9E2F3")),
      });
      const dataRows = commercialRows.map(
        (row) => new TableRow({ children: row.map((cell) => tableCell(cell)) }),
      );
      return commercialRows.length > 0
        ? new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [headerRow, ...dataRows, totalTableRow],
          })
        : para("(No entries)");
    })(),
    para(""),
    ...htmlToDocxBlocks(data.commercialNotes || ""),
    pageBreak(),

    // Page 6: Corporate Profile
    heading("7. Corporate Profile of Orient"),
    ...multiLinePara(data.corporateProfile || ""),
    pageBreak(),

    // Page 7: Orient's Strengths
    heading("8. Orient's Strengths"),
    ...multiLinePara(data.orientStrengths || ""),
    pageBreak(),

    // Page 8: Acceptance
    heading("9. Acceptance and Authorization"),
    ...acceptancePair("Orient Technologies Ltd", data.orientAcceptance || {}),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        headers: {
          default: buildPageHeader(),
        },
        children: sections,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
