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
} from "docx";
import { htmlToDocxBlocks } from "./htmlToDocx.js";

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

  const acceptancePair = (label: string, party: Record<string, string>) => [
    heading(label, HeadingLevel.HEADING_2),
    simpleTable(
      ["Name", "Designation", "Signature", "Date"],
      [[party.name || "", party.designation || "", party.signature || "", party.date || ""]],
    ),
  ];

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
        children: sections,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
