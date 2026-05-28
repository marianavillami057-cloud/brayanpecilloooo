import { Router } from "express";
import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "./auth";

const router = Router();

async function getSetting(key: string): Promise<string | null> {
  const [row] = await db
    .select()
    .from(settingsTable)
    .where(eq(settingsTable.key, key));
  return row?.value ?? null;
}

async function setSetting(key: string, value: string): Promise<void> {
  const existing = await getSetting(key);
  if (existing !== null) {
    await db
      .update(settingsTable)
      .set({ value })
      .where(eq(settingsTable.key, key));
  } else {
    await db.insert(settingsTable).values({ key, value });
  }
}

// Protected: get cloudinary settings
router.get("/cloudinary", requireAuth, async (req, res) => {
  try {
    const cloudName = await getSetting("cloudinary_cloud_name");
    const apiKey = await getSetting("cloudinary_api_key");
    const apiSecret = await getSetting("cloudinary_api_secret");

    return res.json({
      cloudName,
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret,
    });
  } catch (err) {
    req.log.error(err, "Failed to get cloudinary settings");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Protected: update cloudinary settings
router.put("/cloudinary", requireAuth, async (req, res) => {
  try {
    const { cloudName, apiKey, apiSecret } = req.body as {
      cloudName: string;
      apiKey: string;
      apiSecret: string;
    };

    await setSetting("cloudinary_cloud_name", cloudName);
    await setSetting("cloudinary_api_key", apiKey);
    await setSetting("cloudinary_api_secret", apiSecret);

    return res.json({
      cloudName,
      hasApiKey: true,
      hasApiSecret: true,
    });
  } catch (err) {
    req.log.error(err, "Failed to update cloudinary settings");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
