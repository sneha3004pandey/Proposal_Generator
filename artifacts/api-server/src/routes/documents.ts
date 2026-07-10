import { Router } from "express";
import { db, proposalsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth.js";
import { generateDocx } from "../lib/generateDocx.js";
import { generatePdf } from "../lib/generatePdf.js";

const router = Router();

router.use(requireAuth);

// GET /proposals/:id/docx
router.get("/proposals/:id/docx", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [proposal] = await db
    .select()
    .from(proposalsTable)
    .where(
      and(
        eq(proposalsTable.id, id),
        eq(proposalsTable.userId, req.session.userId!),
      ),
    )
    .limit(1);

  if (!proposal) {
    res.status(404).json({ error: "Proposal not found" });
    return;
  }

  const data = proposal.data as Record<string, unknown>;
  const title = (data.proposalTitle as string) || "proposal";
  const safe = title.replace(/[^a-z0-9_-]/gi, "_").toLowerCase();

  const buffer = await generateDocx(data);

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  res.setHeader("Content-Disposition", `attachment; filename="${safe}.docx"`);
  res.send(buffer);
});

// GET /proposals/:id/pdf
router.get("/proposals/:id/pdf", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [proposal] = await db
    .select()
    .from(proposalsTable)
    .where(
      and(
        eq(proposalsTable.id, id),
        eq(proposalsTable.userId, req.session.userId!),
      ),
    )
    .limit(1);

  if (!proposal) {
    res.status(404).json({ error: "Proposal not found" });
    return;
  }

  const data = proposal.data as Record<string, unknown>;
  const title = (data.proposalTitle as string) || "proposal";
  const safe = title.replace(/[^a-z0-9_-]/gi, "_").toLowerCase();

  const buffer = await generatePdf(data);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${safe}.pdf"`);
  res.send(buffer);
});

export default router;
