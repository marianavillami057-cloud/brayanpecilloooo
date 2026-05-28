import { Router } from "express";
import { db, mediaTable, settingsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { requireAuth } from "./auth";
import crypto from "crypto";

const router = Router();

// Public: list media
router.get("/", async (req, res) => {
  try {
    const categoryId = req.query.categoryId
      ? parseInt(req.query.categoryId as string, 10)
      : undefined;

    let rows;
    if (categoryId !== undefined) {
      rows = await db
        .select()
        .from(mediaTable)
        .where(eq(mediaTable.categoryId, categoryId))
        .orderBy(asc(mediaTable.order));
    } else {
      rows = await db.select().from(mediaTable).orderBy(asc(mediaTable.order));
    }

    return res.json(
      rows.map((r) => ({
        id: r.id,
        title: r.title,
        type: r.type,
        url: r.url,
        publicId: r.publicId ?? null,
        thumbnailUrl: r.thumbnailUrl ?? null,
        categoryId: r.categoryId,
        order: r.order,
        createdAt: r.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error(err, "Failed to list media");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Protected: create
router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, type, url, publicId, thumbnailUrl, categoryId, order = 0 } =
      req.body as {
        title: string;
        type: string;
        url: string;
        publicId?: string;
        thumbnailUrl?: string;
        categoryId: number;
        order?: number;
      };

    const [row] = await db
      .insert(mediaTable)
      .values({ title, type, url, publicId, thumbnailUrl, categoryId, order })
      .returning();

    return res.status(201).json({
      id: row.id,
      title: row.title,
      type: row.type,
      url: row.url,
      publicId: row.publicId ?? null,
      thumbnailUrl: row.thumbnailUrl ?? null,
      categoryId: row.categoryId,
      order: row.order,
      createdAt: row.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err, "Failed to create media");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Protected: update
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { title, categoryId, order } = req.body as {
      title?: string;
      categoryId?: number;
      order?: number;
    };
    const updates: Partial<{ title: string; categoryId: number; order: number }> = {};
    if (title !== undefined) updates.title = title;
    if (categoryId !== undefined) updates.categoryId = categoryId;
    if (order !== undefined) updates.order = order;

    const [row] = await db
      .update(mediaTable)
      .set(updates)
      .where(eq(mediaTable.id, id))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });

    return res.json({
      id: row.id,
      title: row.title,
      type: row.type,
      url: row.url,
      publicId: row.publicId ?? null,
      thumbnailUrl: row.thumbnailUrl ?? null,
      categoryId: row.categoryId,
      order: row.order,
      createdAt: row.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err, "Failed to update media");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Protected: delete
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [existing] = await db
      .select()
      .from(mediaTable)
      .where(eq(mediaTable.id, id));
    if (!existing) return res.status(200).json({ deleted: true });
    await db.delete(mediaTable).where(eq(mediaTable.id, id));
    return res.status(204).send();
  } catch (err) {
    req.log.error(err, "Failed to delete media");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Protected: get Cloudinary upload signature
router.post("/upload-signature", requireAuth, async (req, res) => {
  try {
    const [keyRow] = await db
      .select()
      .from(settingsTable)
      .where(eq(settingsTable.key, "cloudinary_api_key"));
    const [secretRow] = await db
      .select()
      .from(settingsTable)
      .where(eq(settingsTable.key, "cloudinary_api_secret"));
    const [nameRow] = await db
      .select()
      .from(settingsTable)
      .where(eq(settingsTable.key, "cloudinary_cloud_name"));

    const apiKey = keyRow?.value;
    const apiSecret = secretRow?.value;
    const cloudName = nameRow?.value;

    if (!apiKey || !apiSecret || !cloudName) {
      return res.status(400).json({ error: "Cloudinary settings not configured" });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "construccion";
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
    const signature = crypto
      .createHash("sha256")
      .update(paramsToSign + apiSecret)
      .digest("hex");

    return res.json({ signature, timestamp, apiKey, cloudName });
  } catch (err) {
    req.log.error(err, "Failed to generate upload signature");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
