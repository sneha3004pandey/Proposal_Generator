import PDFDocument from "pdfkit";

const PREREQS = [
  "User Credential with valid accesses & licenses for the developer",
  "Access to the infra/gateway/environments/templates/apps/reports/active directory",
  "SharePoint folder structure will be fixed before the start of the project and will be changed only via the backend",
  "Questionnaire for metadata will be fixed before the start of the project",
  "Approvers for each folder will be assigned in approver master by admin",
  "User master & role assignment will be managed by admin",
  "All users who will access the app will need either Microsoft E1/E3/E5/PowerApps license.",
  "Customer will provide all the necessary information and allow Orient team to access the system for development & maintenance of the project",
];

const COMMERCIAL_NOTES = [
  "Prices mentioned are exclusive of all government taxes.",
  "Payment terms would be 100% in advance.",
  "Customer shall release the payment within 30 days of the invoice submission.",
  'All payments should be released in favor of "Orient Technologies Ltd."',
  "AMC includes only lights-on services. Any changes or modifications will be made post Customer approval of the change request hours and be billed as per actuals.",
];

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

function bulletList(doc: PDFKit.PDFDocument, items: string[]) {
  items.forEach((item) => {
    addPageIfNeeded(doc, 30);
    doc
      .fillColor(DARK)
      .fontSize(10)
      .font("Helvetica")
      .text(`• ${item}`, MARGIN + 10, doc.y, { width: CONTENT_W - 10 })
      .moveDown(0.3);
  });
  doc.moveDown(0.3);
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generatePdf(data: Record<string, any>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

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
    sectionHeading(doc, "2. Project Summary");
    bodyText(doc, data.projectSummary || "");

    addPageIfNeeded(doc, 100);
    sectionHeading(doc, "3. Scope of Work");
    bodyText(doc, data.scopeOfWork || "");

    // ---- Page 5: Pre-Reqs, Out of Scope, Commercials ----
    doc.addPage();
    sectionHeading(doc, "4. Pre-Requisites");
    bulletList(doc, PREREQS);

    sectionHeading(doc, "5. Out of Scope");
    bodyText(doc, data.outOfScope || "");

    sectionHeading(doc, "6. Commercials");
    const commRows = (data.commercialRows || []).map(
      (r: Record<string, string>) => [r.description || "", r.timeline || "", r.totalCost || ""],
    );
    if (commRows.length > 0) {
      simpleTable(doc, ["Description", "Timeline", "Total Cost (In INR)"], commRows);
    }
    bulletList(doc, COMMERCIAL_NOTES);

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

    subHeading(doc, `9.1 ${customerName}`);
    const cust = data.customerAcceptance || {};
    simpleTable(
      doc,
      ["Name", "Designation", "Signature", "Date"],
      [[cust.name || "", cust.designation || "", cust.signature || "", cust.date || ""]],
    );

    subHeading(doc, "9.2 Orient Technologies Ltd");
    const orient = data.orientAcceptance || {};
    simpleTable(
      doc,
      ["Name", "Designation", "Signature", "Date"],
      [[orient.name || "", orient.designation || "", orient.signature || "", orient.date || ""]],
    );

    doc.end();
  });
}
