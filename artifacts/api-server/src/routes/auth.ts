import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { logger } from "../lib/logger";

const router = Router();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alejandropecillo";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "alejandro2026@@@";
const SECRET = process.env.SESSION_SECRET ?? ADMIN_PASSWORD;

function createToken(email: string): string {
  const payload = Buffer.from(JSON.stringify({ email, iat: Date.now() })).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verifyToken(token: string): { email: string } | null {
  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  if (sig !== expected) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString()) as { email: string };
  } catch {
    return null;
  }
}

const isProduction = process.env.NODE_ENV === "production";

router.post("/login", (req, res) => {
  const { email, password } = req.body as { email: string; password: string };

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = createToken(email);
    res.cookie("auth_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    logger.info("Admin logged in");
    return res.json({ authenticated: true, email });
  }

  return res.status(401).json({ error: "Invalid credentials" });
});

router.post("/logout", (req, res) => {
  res.clearCookie("auth_token", { path: "/" });
  return res.json({ authenticated: false, email: null });
});

router.get("/me", (req, res) => {
  const token = req.cookies?.auth_token as string | undefined;
  if (token) {
    const session = verifyToken(token);
    if (session) return res.json({ authenticated: true, email: session.email });
  }
  return res.status(401).json({ authenticated: false, email: null });
});

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.auth_token as string | undefined;
  if (token && verifyToken(token)) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized" });
}

export default router;
