Make these changes to the existing app. Do not rebuild anything from scratch — edit existing components/routes only. Do not touch or "improve" anything not listed below. Be efficient: smallest code changes needed, quick verification, then stop.

## PART A — PREVIOUSLY REQUESTED CHANGES

### A1. More font options
In the rich text editor's font dropdown (Project Summary, Scope of Work, Pre-Requisites, Out of Scope), expand the font list to include: Arial, Times New Roman, Calibri, Georgia, Verdana, Tahoma, Garamond, Cambria, Courier New, Trebuchet MS.

### A2. Better table insert (grid picker)
Replace the current table-insert flow with a Word/Google-Docs-style grid picker: clicking Table shows a small grid (up to 10x10), hovering highlights rows/columns, clicking inserts a table of that exact size at the cursor, and it remains fully editable after insertion. Use ONE shared toolbar config (font, color, table picker) reused across all 4 rich text editors — not separate implementations per section.

### A3. Digital signature upload
In the Acceptance & Authorization section's Signature field (Orient Technologies Ltd table), replace the plain input with an image upload option — user uploads their signature image from device/gallery, sees an inline preview, and it's stored/embedded as a real image in Review, Preview, DOCX, and PDF.

### A4. Watermark + logo on every page (Word & PDF)
Add a watermark image (faded, behind content) and a logo image (small, fixed top-right corner) appearing on every page of both generated DOCX and PDF. For now use a placeholder image (grey box / "LOGO" text) wired into the correct position and per-page repetition logic, structured so the real images can later be swapped in by just replacing the image file — no code changes needed then.

## PART B — NEW ADDITIONS

### B1. Proposal list / history on Dashboard
Add a list on the Dashboard (or a "My Proposals" section) showing all proposals the logged-in user has previously created/saved, with Proposal Title, Customer Name, and last-updated date. Each entry should have options to: Open/Edit (returns to the form with all data loaded) and Download (DOCX/PDF, if already generated). New proposals should get added to this list automatically when saved.

### B2. Draw Signature option
In addition to the image upload from A3, add a "Draw Signature" option (a simple canvas where the user can draw with mouse/touch, with Clear and Save buttons). Let the user choose either Upload Image or Draw Signature — whichever they pick becomes the stored signature image, used the same way in Review, Preview, DOCX, and PDF.

### B3. Duplicate/Clone proposal
On the Dashboard proposal list (from B1), add a "Duplicate" action on each proposal that creates a new copy of that proposal (all sections copied) as a new proposal, so the user can quickly reuse an old proposal for a new customer instead of starting from scratch. The duplicate should open in edit mode so the user can update Customer Name and other details.

### B4. Auto-increment version numbering
In Document Control → Document Version History, make the "Version" field auto-increment automatically (e.g. 1.0, 1.1, 1.2...) each time a new version row is added, instead of requiring the user to type it manually. Keep it editable in case the user wants to override it, but pre-fill it with the next logical version number by default.

## FINAL VERIFICATION BEFORE STOPPING
- Expanded font list appears in all 4 rich text editors.
- Table grid picker works and inserted tables stay editable, consistently across all 4 editors.
- Signature: both Upload Image and Draw Signature work, and the chosen signature appears correctly in Review/Preview/DOCX/PDF.
- Placeholder watermark + top-right logo appear on every page of a generated DOCX and PDF.
- Dashboard shows a working proposal list with Open/Edit and Download actions.
- Duplicate action creates a correct, independent copy of a proposal.
- Version field auto-increments by default but remains editable.
- Fix any errors found during this check, then stop. Do not make any other changes beyond what's listed above.
