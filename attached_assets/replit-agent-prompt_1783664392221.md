Build a complete, fully functional web application called **Business Proposal Generator** directly in this Replit project. Do not explain your plan, do not ask for confirmation, do not pause for approval — build, run, test, fix, and verify end-to-end before stopping.

## GOAL
Internal tool for a sales team. Each Business Unit has a fixed proposal template. For this MVP, implement ONLY the **DT (Digital Transformation)** Business Unit end-to-end. Structure the code so other BUs could be added later (e.g. a BU config/template folder), but do not build any other BU now.

## TECH CHOICES (keep it simple and Replit-stable)
- Node.js + Express
- EJS templates + vanilla JS + CSS (no frontend framework)
- express-session for auth sessions
- bcryptjs for password hashing
- JSON file or SQLite for storage (pick whichever is more reliable to set up quickly — no external DB, no cloud services, no paid APIs, no Docker)
- A real DOCX generation library (e.g. `docx` npm package) — must produce genuinely editable, valid .docx files, NOT HTML renamed as .docx
- A real PDF generation library that works reliably on Replit (e.g. `pdf-lib` or `puppeteer` if it runs reliably here, or a pure-JS HTML-to-PDF option — pick whichever is most stable in this environment) — must produce genuinely valid, previewable, downloadable PDFs
- Configure the Run button so `npm run dev`/`npm start` reliably boots the app
- Install all dependencies yourself

## ABSOLUTE RULES
- Every visible button must actually work. No placeholders, no fake functionality, no fake dashboard stats.
- If a feature isn't implemented, don't show its button (e.g. don't show "Preview PDF" or "Download PDF" until a PDF has actually been generated).
- Functionality > visual polish. Design should be clean, corporate, and professional (corporate blue nav, white cards, light grey background, simple sidebar/step navigation, professional tables/buttons) but do not spend time on animations, gradients, or decorative effects.
- Never store passwords in plain text.
- Data must persist across all navigation (form sections, review, edit, preview, generation) without loss.

## AUTH
Build working Sign Up, Login, Logout.
- Sign Up fields: Full Name, Orient Email Address, Phone Number, Password, Confirm Password.
- Validate: all fields required, valid email format, valid phone format, password === confirm password, no duplicate email registrations, passwords hashed with bcrypt.
- Login fields: Email, Password. Correct → redirect to Dashboard. Incorrect → clean inline error message.
- Logout destroys the session and returns to Login.

## DASHBOARD
After login, show "Welcome, [Full Name]" and a "Create Business Proposal" heading. Show exactly one Business Unit card: **DT — Digital Transformation**, description "Create standardized Digital Transformation business proposals," with a "Create Proposal" button that opens the DT proposal form. Do not create cards or placeholders for any other BU.

## DT PROPOSAL FORM
Multi-section form with a sidebar or step navigation, preserving data when moving between sections. Sections, in order:
1. Proposal Details
2. Document Control
3. Project Summary
4. Scope of Work
5. Pre-Requisites
6. Out of Scope
7. Commercials
8. Corporate Profile
9. Orient's Strengths
10. Acceptance & Authorization
11. Review

### 1. Proposal Details
Fields: Proposal Title, Customer Name (both required). Customer Name entered once here must auto-populate everywhere else it's referenced (Confidential clause, Acceptance section 9.1, Preview, DOCX, PDF).

### 2. Document Control (renders as "1. Document Control")
**1.1 Document Properties** — table with columns Action | Name | Date. One row: Action fixed to "Prepared By", Name auto-filled from logged-in user's Full Name but editable, Date via date picker.

**1.2 Document Version History** — table with columns Version | Date Released | Change Notice | Remark. Version = editable text. Date Released = date picker. Change Notice = dropdown (Submitted, Pending Review, Revised, Approved, Rejected). Remark = dropdown (New Proposal Submission, Revised Proposal Submission, Commercial Revision, Scope Revision, Final Submission).

**1.3 Confidential** — auto-generate this exact text with [Customer Name] replaced dynamically:
"Orient will take utmost precautions to ensure that sensitive data like business strategies, data, protected website/app locations, access rights, and confidential documents are managed appropriately. No information related to the project will be exposed to competitors or the public without prior consent of [Customer Name] and Orient Technologies Ltd. (OTL)"

### 3. Project Summary (renders as "2. Project Summary")
Large multiline textarea, user-entered, free text. Preserve paragraphs/line breaks in Review, Preview, DOCX, and PDF.

### 4. Scope of Work (renders as "3. Scope of Work")
Large multiline textarea for user-entered content supporting paragraphs, bullet-style lines, and nested bullet-style lines. Preserve this formatting in Review, Preview, DOCX, and PDF. (This is free-form; do not hardcode any specific scope content.)

### 5. Pre-Requisites (renders as "4. Pre-Requisites")
Fixed content, not user-editable, auto-included everywhere (Preview, DOCX, PDF), exactly:
"• User Credential with valid accesses & licenses for the developer
• Access to the infra/gateway/environments/templates/apps/reports/active directory
• SharePoint folder structure will be fixed before the start of the project and will be changed only via the backend
• Questionnaire for metadata will be fixed before the start of the project
• Approvers for each folder will be assigned in approver master by admin
• User master & role assignment will be managed by admin
• All users who will access the app will need either Microsoft E1/E3/E5/PowerApps license.
• Customer will provide all the necessary information and allow Orient team to access the system for development & maintenance of the project"

### 6. Out of Scope (renders as "5. Out of Scope")
Multiline user-entered input. Preserve paragraphs/lines/bullets everywhere.

### 7. Commercials (renders as "6. Commercials")
Dynamic table with exact columns: Description | Timeline | Total Cost (In INR). Support Add Row, Edit Row, Delete Row, multiple rows. Below the table, auto-include exactly this fixed text everywhere (Review, Preview, DOCX, PDF):
"• Prices mentioned are exclusive of all government taxes.
• Payment terms would be 100% in advance.
• Customer shall release the payment within 30 days of the invoice submission.
• All payments should be released in favor of "Orient Technologies Ltd."
• AMC includes only lights-on services. Any changes or modifications will be made post Customer approval of the change request hours and be billed as per actuals."

### 8. Corporate Profile (renders as "7. Corporate Profile of Orient")
Pre-filled but editable textarea/rich text, defaulting to:
"Founded in 1992, Orient Technologies Pvt Ltd is an IT services company with 1000+ qualified professionals and rated among the top 10 solutions vendors with annual revenue of INR 600+ Crores. The company has a comprehensive network of offices and support centers in India, UAE & Singapore.

Orient Technologies has strategic alliances with global IT leaders. Some of them are:
• Microsoft
• AWS
• Nutanix
• Dell
• HPE & HPI
• Apple
• Citrix
• Cisco
• VMWare

Some of the broad services that Orient offers are:
• End User Computing (CapEx & OpEx)
• Premium Devices
• Laptops
• Desktops & Tablets
• Printers
• Accessories
• MDM
• Data Centre
• Hyper Converged Infrastructure
• Compute & Storage
• Networking
• Security
• Collaboration
• Cloud (Public Cloud)
• Business Applications
• BI
• RPA
• Application Development
• ITeS
• Resource Augmentation
• AMC/Multi-Vendor Support
• Renewals"
User edits to this text must flow into Review, Preview, DOCX, and PDF.

### 9. Orient's Strengths (renders as "8. Orient's Strengths")
Pre-filled but editable, defaulting to:
"Orient has the capability and proven experience of managing large IT setups. The key strengths are described below:

• Process Based Service Delivery Approach
Orient has developed its own unique process-based service delivery methods which ensure consistency in service levels across the locations.

• Use of Best Practices from ITIL
Orient has adopted ITIL as its main driver for service delivery and has incorporated incident management, problem management, change management, etc. as part of their overall service delivery.

• Strong project management skills
Managing large projects requires strong project management skills. Orient has successfully demonstrated its skill in various project executions.

• Strong pool of certified Engineers on various Technologies
Quick and reliable development as well as resolution of incidents requires in-depth knowledge of various technologies. Orient, with our strong team of trained developers, has won appreciation from various customers for our delivery team.

• Regular In-house training for Engineers to upgrade their skills.
New technologies are being introduced almost daily in IT; hence keeping the staff updated is essential. Orient has regular in-house training programs for engineers on latest technologies which is one of the motivation factors and reduces attrition.

• ISO 9001:2008 and ISO 20000-1 certified Organization
Orient is ISO certified, which indicates a continuous improvement in processes in line with industry requirement.

• Customer Base
Orient has serviced 1000s of customers over the years in almost every industry. Orient has satisfied & loyal customers from startups, SMEs, Enterprises & Government/PSUs."
User edits must flow into Review, Preview, DOCX, and PDF.

### 10. Acceptance & Authorization (renders as "9. Acceptance and Authorization")
"9.1 [Customer Name]" (dynamically replaced) followed by a professional table with fields: Name, Designation, Signature, Date.
"9.2 Orient Technologies Ltd" followed by another professional table with fields: Name, Designation, Signature, Date.
All entered values must appear in Review, Preview, DOCX, and PDF.

### 11. Review
Show every section's current data. Provide an "Edit Proposal" button that returns to the form WITHOUT losing any data, and a "Preview Proposal" button that opens the HTML preview.

## FINAL DOCUMENT STRUCTURE (target ~8 pages, use explicit page breaks in DOCX/PDF generation)
- Page 1: Proposal Title, Customer Name
- Page 2: 1. Document Control (1.1 Document Properties, 1.2 Document Version History, 1.3 Confidential)
- Pages 3–4: 2. Project Summary, 3. Scope of Work
- Page 5: 4. Pre-Requisites, 5. Out of Scope, 6. Commercials
- Page 6: 7. Corporate Profile of Orient
- Page 7: 8. Orient's Strengths
- Page 8: 9. Acceptance and Authorization (9.1 Customer table, 9.2 Orient table)
Do not truncate user content; optimize spacing toward this layout for normal-length input.

## HTML PREVIEW
A4-style preview: light grey background, centered white "pages," professional typography, tables, headings, bullets, page numbers where practical. Show pages as separate visual blocks. Only show buttons that work: Edit Proposal, Download Word, Generate PDF — and after PDF generation succeeds, also show Preview PDF and Download PDF.

## DOCX GENERATION (critical)
Generate a real, genuinely editable .docx (using a proper DOCX library, not HTML-as-docx) containing all fixed and user content, correct headings, all tables (Document Control, Commercials, Acceptance), preserved paragraphs/bullets, professional margins/spacing, and page breaks matching the structure above. It must open correctly in Microsoft Word.

## PDF GENERATION (critical)
Generate a real, valid PDF (not a fake/renamed file) containing all sections, fixed content, tables, and user data in correct order with appropriate page breaks. It must be viewable inline in the browser and downloadable.

## BUILD, TEST, AND VERIFY BEFORE STOPPING
After building the app:
1. Install all dependencies and start the app via the Run button.
2. Test the full flow yourself: Sign Up → Login → Dashboard → Select DT → fill out every form section with sample data → Review → Edit (confirm data is preserved) → Preview → Generate DOCX → Generate PDF.
3. Actually generate a sample DOCX and confirm the file is non-empty, valid, and opens correctly.
4. Actually generate a sample PDF and confirm the file is non-empty, valid, and previews correctly.
5. Confirm Customer Name dynamically replaces correctly in the Confidential clause, Acceptance section, Preview, DOCX, and PDF.
6. Confirm Add/Edit/Delete on Commercial rows correctly flows into Review, Preview, DOCX, and PDF.
7. Confirm Logout, invalid login errors, and duplicate email prevention all work.
8. Fix any runtime errors, broken routes, or generation failures you encounter during this testing.
9. Keep resource usage modest and appropriate for a free/limited Replit plan — avoid unnecessary dependencies or heavyweight processes (e.g. avoid full headless-browser PDF rendering if a lighter library will do the job reliably).
10. Do not stop until the app is fully runnable and every flow above has been demonstrated working end-to-end. Do not ask for confirmation at any point during this process.
