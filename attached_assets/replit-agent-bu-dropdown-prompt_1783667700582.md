On the Dashboard, replace the single DT card with a Business Unit dropdown/select showing these options, in this order:

1. Cloud & DevOps
2. Digital Transformation (DT)
3. Infrastructure Managed Services (IMS)
4. Toss
5. Cyber Security
6. Data Centre Solutions
7. End User Computing

Behavior:
- Default selected option: none selected, or "Digital Transformation (DT)" — your choice, whichever is simpler.
- When "Digital Transformation (DT)" is selected, show the existing "Create Proposal" button, working exactly as it already does (no changes to DT logic, form, DOCX, or PDF generation).
- When any other BU is selected, disable the "Create Proposal" button (or hide it) and show a small message like "Template coming soon" or "Format not yet available" instead. Do not create any fake form, fake routes, or fake functionality for these other BUs — just the dropdown option and this disabled/coming-soon state.

Do not touch or modify any other part of the app (auth, DT form, review, DOCX, PDF, save logic). This is a small, isolated UI change only. After making the change, quickly verify: dropdown shows all 7 options, selecting DT still lets you create a proposal normally, selecting any other BU shows "coming soon" and does not break anything. Then stop.
