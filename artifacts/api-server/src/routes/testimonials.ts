import { Router } from "express";
import { db, testimonialsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { requireAuth } from "./auth";

const router = Router();

function formatRow(r: typeof testimonialsTable.$inferSelect) {
  return {
    id: r.id,
    authorName: r.authorName,
    role: r.role ?? null,
    content: r.content,
    rating: r.rating,
    active: r.active,
    order: r.order,
    createdAt: r.createdAt.toISOString(),
  };
}

// Public: list (active only unless includeInactive=true + admin)
router.get("/", async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    let rows;
    if (includeInactive) {
      rows = await db.select().from(testimonialsTable).orderBy(asc(testimonialsTable.order));
    } else {
      rows = await db
        .select()
        .from(testimonialsTable)
        .where(eq(testimonialsTable.active, true))
        .orderBy(asc(testimonialsTable.order));
    }
    return res.json(rows.map(formatRow));
  } catch (err) {
    req.log.error(err, "Failed to list testimonials");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Protected: create
router.post("/", requireAuth, async (req, res) => {
  try {
    const { authorName, role, content, rating = 5, active = true, order = 0 } = req.body as {
      authorName: string;
      role?: string;
      content: string;
      rating?: number;
      active?: boolean;
      order?: number;
    };
    const [row] = await db
      .insert(testimonialsTable)
      .values({ authorName, role, content, rating, active, order })
      .returning();
    return res.status(201).json(formatRow(row));
  } catch (err) {
    req.log.error(err, "Failed to create testimonial");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Protected: update
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { authorName, role, content, rating, active, order } = req.body as {
      authorName?: string;
      role?: string;
      content?: string;
      rating?: number;
      active?: boolean;
      order?: number;
    };
    const updates: Partial<typeof testimonialsTable.$inferInsert> = {};
    if (authorName !== undefined) updates.authorName = authorName;
    if (role !== undefined) updates.role = role;
    if (content !== undefined) updates.content = content;
    if (rating !== undefined) updates.rating = rating;
    if (active !== undefined) updates.active = active;
    if (order !== undefined) updates.order = order;

    const [row] = await db
      .update(testimonialsTable)
      .set(updates)
      .where(eq(testimonialsTable.id, id))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    return res.json(formatRow(row));
  } catch (err) {
    req.log.error(err, "Failed to update testimonial");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Protected: delete
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.delete(testimonialsTable).where(eq(testimonialsTable.id, id));
    return res.status(204).send();
  } catch (err) {
    req.log.error(err, "Failed to delete testimonial");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Protected: toggle active
router.patch("/:id/toggle", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [existing] = await db.select().from(testimonialsTable).where(eq(testimonialsTable.id, id));
    if (!existing) return res.status(404).json({ error: "Not found" });
    const [row] = await db
      .update(testimonialsTable)
      .set({ active: !existing.active })
      .where(eq(testimonialsTable.id, id))
      .returning();
    return res.json(formatRow(row));
  } catch (err) {
    req.log.error(err, "Failed to toggle testimonial");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
