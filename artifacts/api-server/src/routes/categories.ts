import { Router } from "express";
import { db, categoriesTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { requireAuth } from "./auth";

const router = Router();

// Public: list active categories (or all if includeInactive=true and authenticated)
router.get("/", async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    let rows;
    if (includeInactive) {
      rows = await db.select().from(categoriesTable).orderBy(asc(categoriesTable.order));
    } else {
      rows = await db
        .select()
        .from(categoriesTable)
        .where(eq(categoriesTable.active, true))
        .orderBy(asc(categoriesTable.order));
    }
    return res.json(
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        order: r.order,
        active: r.active,
        createdAt: r.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error(err, "Failed to list categories");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Protected: create
router.post("/", requireAuth, async (req, res) => {
  try {
    const { name, order = 0, active = true } = req.body as {
      name: string;
      order?: number;
      active?: boolean;
    };
    const [row] = await db
      .insert(categoriesTable)
      .values({ name, order, active })
      .returning();
    return res.status(201).json({
      id: row.id,
      name: row.name,
      order: row.order,
      active: row.active,
      createdAt: row.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err, "Failed to create category");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Protected: update
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, order, active } = req.body as {
      name?: string;
      order?: number;
      active?: boolean;
    };
    const updates: Partial<{ name: string; order: number; active: boolean }> = {};
    if (name !== undefined) updates.name = name;
    if (order !== undefined) updates.order = order;
    if (active !== undefined) updates.active = active;

    const [row] = await db
      .update(categoriesTable)
      .set(updates)
      .where(eq(categoriesTable.id, id))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    return res.json({
      id: row.id,
      name: row.name,
      order: row.order,
      active: row.active,
      createdAt: row.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err, "Failed to update category");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Protected: delete
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
    return res.status(204).send();
  } catch (err) {
    req.log.error(err, "Failed to delete category");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Protected: toggle active
router.patch("/:id/toggle", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [existing] = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, id));
    if (!existing) return res.status(404).json({ error: "Not found" });

    const [row] = await db
      .update(categoriesTable)
      .set({ active: !existing.active })
      .where(eq(categoriesTable.id, id))
      .returning();
    return res.json({
      id: row.id,
      name: row.name,
      order: row.order,
      active: row.active,
      createdAt: row.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err, "Failed to toggle category");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
