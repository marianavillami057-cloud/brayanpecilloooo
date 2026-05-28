import { Router } from "express";
import { logger } from "../lib/logger";

const router = Router();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alejandropecillo";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "alejandro2026@@@";

declare module "express-serve-static-core" {
  interface Request {
    session?: { authenticated: boolean; email: string };
  }
}

// Simple in-memory session store keyed by token
const sessions = new Map<string, { email: string }>();

function generateToken(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

router.post("/login", (req, res) => {
  const { email, password } = req.body as { email: string; password: string };

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = generateToken();
    sessions.set(token, { email });
    res.cookie("auth_token", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    logger.info("Admin logged in");
    return res.json({ authenticated: true, email });
  }

  return res.status(401).json({ error: "Invalid credentials" });
});

router.post("/logout", (req, res) => {
  const token = req.cookies?.auth_token as string | undefined;
  if (token) sessions.delete(token);
  res.clearCookie("auth_token");
  return res.json({ authenticated: false, email: null });
});

router.get("/me", (req, res) => {
  const token = req.cookies?.auth_token as string | undefined;
  if (token && sessions.has(token)) {
    const session = sessions.get(token)!;
    return res.json({ authenticated: true, email: session.email });
  }
  return res.status(401).json({ authenticated: false, email: null });
});

export function requireAuth(
  req: Parameters<Parameters<typeof router.use>[0]>[0],
  res: Parameters<Parameters<typeof router.use>[0]>[1],
  next: Parameters<Parameters<typeof router.use>[0]>[2]
) {
  const token = (req as { cookies?: Record<string, string> }).cookies?.auth_token;
  if (token && sessions.has(token)) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized" });
}

export default router;
