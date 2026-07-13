import PDFDocument from "pdfkit";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { renderHtmlIntoPdf } from "./htmlToPdfKit.js";

// Placeholder logo/watermark images. Swapping in the final branding later is
// a matter of replacing these two files on disk — no code changes needed.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.join(__dirname, "../assets/logo-placeholder.png");
const WATERMARK_PATH = path.join(__dirname, "../assets/watermark-placeholder.png");

function decodeDataUrlImage(src: string): Buffer | null {
  const m = src.match(/^data:image\/(png|jpeg|jpg|gif|bmp);base64,(.+)$/);
  if (!m) return null;
  return Buffer.from(m[2], "base64");
}

const BLUE = "#1e40af";
const LIGHT_BLUE = "#dbeafe";
const DARK = "#111827";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 60;
const CONTENT_W = PAGE_W - MARGIN * 2;

function addPageIfNeeded(doc: PDFKit.PDFDocument, needed = 100) {
  if (doc.y > PAGE_H - MARGIN - needed) {
    doc.addPage();
  }
}

function sectionHeading(doc: PDFKit.PDFDocument, text: string) {
  addPageIfNeeded(doc, 80);
  doc
    .fillColor(BLUE)
    .fontSize(13)
    .font("Helvetica-Bold")
    .text(text, MARGIN, doc.y, { width: CONTENT_W })
    .moveDown(0.3);
  doc.strokeColor(BLUE).lineWidth(1).moveTo(MARGIN, doc.y).lineTo(PAGE_W - MARGIN, doc.y).stroke();
  doc.moveDown(0.5).fillColor(DARK);
}

function subHeading(doc: PDFKit.PDFDocument, text: string) {
  addPageIfNeeded(doc, 60);
  doc
    .fillColor(DARK)
    .fontSize(11)
    .font("Helvetica-Bold")
    .text(text, MARGIN, doc.y, { width: CONTENT_W })
    .moveDown(0.4);
}

function bodyText(doc: PDFKit.PDFDocument, text: string) {
  if (!text) return;
  doc
    .fillColor(DARK)
    .fontSize(10)
    .font("Helvetica")
    .text(text, MARGIN, doc.y, { width: CONTENT_W })
    .moveDown(0.5);
}

function simpleTable(
  doc: PDFKit.PDFDocument,
  headers: string[],
  rows: string[][],
  colWidths?: number[],
) {
  addPageIfNeeded(doc, 60);
  const widths = colWidths || headers.map(() => CONTENT_W / headers.length);
  const rowH = 22;
  const x0 = MARGIN;
  let y = doc.y;

  // Header row
  doc.fillColor(LIGHT_BLUE).rect(x0, y, CONTENT_W, rowH).fill();
  let x = x0;
  headers.forEach((h, i) => {
    doc
      .fillColor(BLUE)
      .fontSize(9)
      .font("Helvetica-Bold")
      .text(h, x + 4, y + 6, { width: widths[i] - 8, lineBreak: false });
    x += widths[i];
  });
  y += rowH;

  // Data rows
  rows.forEach((row, ri) => {
    // check if we need a page break
    if (y + rowH > PAGE_H - MARGIN) {
      doc.addPage();
      y = MARGIN;
      // redraw header
      doc.fillColor(LIGHT_BLUE).rect(x0, y, CONTENT_W, rowH).fill();
      let hx = x0;
      headers.forEach((h, i) => {
        doc
          .fillColor(BLUE)
          .fontSize(9)
          .font("Helvetica-Bold")
          .text(h, hx + 4, y + 6, { width: widths[i] - 8, lineBreak: false });
        hx += widths[i];
      });
      y += rowH;
    }
    if (ri % 2 === 1) {
      doc.fillColor("#f9fafb").rect(x0, y, CONTENT_W, rowH).fill();
    }
    let cx = x0;
    row.forEach((cell, i) => {
      doc
        .fillColor(DARK)
        .fontSize(9)
        .font("Helvetica")
        .text(cell || "", cx + 4, y + 6, { width: widths[i] - 8, lineBreak: false });
      cx += widths[i];
    });
    y += rowH;
  });

  // Border
  doc.strokeColor(BORDER).lineWidth(0.5).rect(x0, doc.y, CONTENT_W, y - doc.y).stroke();
  doc.y = y + 8;
  doc.moveDown(0.5);
}

// Draws the faded watermark (centered, behind content) and the small
// top-right logo on the current page. Called once per page via the
// "pageAdded" event (plus once manually for the first page) so every page
// of the PDF gets the same decoration.
function drawPageDecoration(doc: PDFKit.PDFDocument) {
  const savedX = doc.x;
  const savedY = doc.y;

  const wmWidth = 320;
  const wmHeight = 213;
  doc.opacity(0.35).image(
    WATERMARK_PATH,
    (PAGE_W - wmWidth) / 2,
    (PAGE_H - wmHeight) / 2,
    { width: wmWidth, height: wmHeight },
  );

  const logoWidth = 60;
  const logoHeight = 44;
  doc.opacity(1).image(
    LOGO_PATH,
    PAGE_W - MARGIN - logoWidth,
    24,
    { width: logoWidth, height: logoHeight },
  );

  doc.opacity(1);
  doc.x = savedX;
  doc.y = savedY;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generatePdf(data: Record<string, any>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
      bufferPages: true,
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.on("pageAdded", () => drawPageDecoration(doc));
    // "pageAdded" does not fire for the very first (implicit) page.
    drawPageDecoration(doc);

    const customerName = data.customerName || "Customer";
    const confidentialText = `Orient will take utmost precautions to ensure that sensitive data like business strategies, data, protected website/app locations, access rights, and confidential documents are managed appropriately. No information related to the project will be exposed to competitors or the public without prior consent of ${customerName} and Orient Technologies Ltd. (OTL)`;

    // ---- Page 1: Title ----
    doc.y = PAGE_H / 3;
    doc
      .fillColor(BLUE)
      .fontSize(28)
      .font("Helvetica-Bold")
      .text(data.proposalTitle || "Business Proposal", MARGIN, doc.y, {
        width: CONTENT_W,
        align: "center",
      });
    doc.moveDown(1);
    doc
      .fillColor(MUTED)
      .fontSize(14)
      .font("Helvetica")
      .text(`Prepared for: ${customerName}`, MARGIN, doc.y, {
        width: CONTENT_W,
        align: "center",
      });
    doc.moveDown(0.5);
    doc
      .fillColor(MUTED)
      .fontSize(11)
      .text("DT — Digital Transformation", MARGIN, doc.y, {
        width: CONTENT_W,
        align: "center",
      });

    // ---- Page 2: Document Control ----
    doc.addPage();
    sectionHeading(doc, "1. Document Control");

    subHeading(doc, "1.1 Document Properties");
    const docProps = (data.documentProperties || []).map(
      (r: Record<string, string>) => [r.action || "", r.name || "", r.date || ""],
    );
    if (docProps.length > 0) {
      simpleTable(doc, ["Action", "Name", "Date"], docProps);
    }

    subHeading(doc, "1.2 Document Version History");
    const versionHistory = (data.versionHistory || []).map(
      (r: Record<string, string>) => [
        r.version || "",
        r.dateReleased || "",
        r.changeNotice || "",
        r.remark || "",
      ],
    );
    if (versionHistory.length > 0) {
      simpleTable(
        doc,
        ["Version", "Date Released", "Change Notice", "Remark"],
        versionHistory,
        [70, 100, 130, CONTENT_W - 300],
      );
    }

    subHeading(doc, "1.3 Confidential");
    bodyText(doc, confidentialText);

    // ---- Pages 3-4: Project Summary, Scope ----
    doc.addPage();
    const htmlOpts = { marginX: MARGIN, contentWidth: CONTENT_W, pageHeight: PAGE_H, marginBottom: MARGIN };

    sectionHeading(doc, "2. Project Summary");
    renderHtmlIntoPdf(doc, data.projectSummary || "", htmlOpts);

    addPageIfNeeded(doc, 100);
    sectionHeading(doc, "3. Scope of Work");
    renderHtmlIntoPdf(doc, data.scopeOfWork || "", htmlOpts);

    // ---- Page 5: Pre-Reqs, Out of Scope, Commercials ----
    doc.addPage();
    sectionHeading(doc, "4. Pre-Requisites");
    renderHtmlIntoPdf(doc, data.preRequisites || "", htmlOpts);

    sectionHeading(doc, "5. Out of Scope");
    renderHtmlIntoPdf(doc, data.outOfScope || "", htmlOpts);

    sectionHeading(doc, "6. Commercials");
    const commRows = (data.commercialRows || []).map(
      (r: Record<string, string>) => [r.description || "", r.timeline || "", r.totalCost || ""],
    );
    const commercialTotal = (data.commercialRows || []).reduce(
      (sum: number, r: Record<string, string>) => {
        const numeric = parseFloat((r.totalCost || "").replace(/[^0-9.-]/g, ""));
        return sum + (isNaN(numeric) ? 0 : numeric);
      },
      0,
    );
    if (commRows.length > 0) {
      simpleTable(doc, ["Description", "Timeline", "Total Cost (In INR)"], [
        ...commRows,
        ["", "Total", commercialTotal.toLocaleString("en-IN")],
      ]);
    }
    renderHtmlIntoPdf(doc, data.commercialNotes || "", htmlOpts);

    // ---- Page 6: Corporate Profile ----
    doc.addPage();
    sectionHeading(doc, "7. Corporate Profile of Orient");
    bodyText(doc, data.corporateProfile || "");

    // ---- Page 7: Orient's Strengths ----
    doc.addPage();
    sectionHeading(doc, "8. Orient's Strengths");
    bodyText(doc, data.orientStrengths || "");

    // ---- Page 8: Acceptance ----
    doc.addPage();
    sectionHeading(doc, "9. Acceptance and Authorization");

    subHeading(doc, "Orient Technologies Ltd");
    const orient = data.orientAcceptance || {};
    const signatureBuffer = decodeDataUrlImage(orient.signature || "");
    const tableTopY = doc.y;
    simpleTable(
      doc,
      ["Name", "Designation", "Signature", "Date"],
      [[orient.name || "", orient.designation || "", signatureBuffer ? "" : orient.signature || "", orient.date || ""]],
    );
    if (signatureBuffer) {
      // Overlay the signature image on top of the blank "Signature" cell:
      // header row (22px) + data row (22px), 3rd of 4 even columns.
      const colWidth = CONTENT_W / 4;
      const dataRowY = tableTopY + 22;
      doc.image(signatureBuffer, MARGIN + colWidth * 2 + 4, dataRowY + 2, {
        fit: [colWidth - 12, 18],
      });
    }

    doc.end();
  });
}
