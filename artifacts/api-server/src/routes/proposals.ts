import { Router } from "express";
import { db, proposalsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();

router.use(requireAuth);

// GET /proposals
router.get("/proposals", async (req, res) => {
  const rows = await db
    .select()
    .from(proposalsTable)
    .where(eq(proposalsTable.userId, req.session.userId!))
    .orderBy(proposalsTable.updatedAt);

  const result = rows.map((p) => {
    const data = p.data as Record<string, unknown>;
    return {
      id: p.id,
      businessUnit: p.businessUnit,
      proposalTitle: (data.proposalTitle as string) || "",
      customerName: (data.customerName as string) || "",
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  });

  res.json(result);
});

// POST /proposals
router.post("/proposals", async (req, res) => {
  const { businessUnit, data } = req.body;

  if (!businessUnit || !data) {
    res.status(400).json({ error: "businessUnit and data are required" });
    return;
  }

  const [proposal] = await db
    .insert(proposalsTable)
    .values({
      userId: req.session.userId!,
      businessUnit,
      data,
    })
    .returning();

  res.status(201).json({
    id: proposal.id,
    userId: proposal.userId,
    businessUnit: proposal.businessUnit,
    data: proposal.data,
    createdAt: proposal.createdAt.toISOString(),
    updatedAt: proposal.updatedAt.toISOString(),
  });
});

// POST /proposals/:id/duplicate
router.post("/proposals/:id/duplicate", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [existing] = await db
    .select()
    .from(proposalsTable)
    .where(
      and(
        eq(proposalsTable.id, id),
        eq(proposalsTable.userId, req.session.userId!),
      ),
    )
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Proposal not found" });
    return;
  }

  const [duplicate] = await db
    .insert(proposalsTable)
    .values({
      userId: req.session.userId!,
      businessUnit: existing.businessUnit,
      data: existing.data,
    })
    .returning();

  res.status(201).json({
    id: duplicate.id,
    userId: duplicate.userId,
    businessUnit: duplicate.businessUnit,
    data: duplicate.data,
    createdAt: duplicate.createdAt.toISOString(),
    updatedAt: duplicate.updatedAt.toISOString(),
  });
});

// GET /proposals/:id
router.get("/proposals/:id", async (req, res) => {
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

  res.json({
    id: proposal.id,
    userId: proposal.userId,
    businessUnit: proposal.businessUnit,
    data: proposal.data,
    createdAt: proposal.createdAt.toISOString(),
    updatedAt: proposal.updatedAt.toISOString(),
  });
});

// PUT /proposals/:id
router.put("/proposals/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const { businessUnit, data } = req.body;

  const [existing] = await db
    .select()
    .from(proposalsTable)
    .where(
      and(
        eq(proposalsTable.id, id),
        eq(proposalsTable.userId, req.session.userId!),
      ),
    )
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Proposal not found" });
    return;
  }

  const [updated] = await db
    .update(proposalsTable)
    .set({
      businessUnit: businessUnit ?? existing.businessUnit,
      data: data ?? existing.data,
      updatedAt: new Date(),
    })
    .where(eq(proposalsTable.id, id))
    .returning();

  res.json({
    id: updated.id,
    userId: updated.userId,
    businessUnit: updated.businessUnit,
    data: updated.data,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
});

// DELETE /proposals/:id
router.delete("/proposals/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [existing] = await db
    .select()
    .from(proposalsTable)
    .where(
      and(
        eq(proposalsTable.id, id),
        eq(proposalsTable.userId, req.session.userId!),
      ),
    )
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Proposal not found" });
    return;
  }

  await db.delete(proposalsTable).where(eq(proposalsTable.id, id));

  res.json({ message: "Deleted" });
});

export default router;
