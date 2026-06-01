import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { pbkdf2Sync } from "node:crypto";
import type { Db } from "@nextstepai/db";
import { authUsers, authAccounts } from "@nextstepai/db";
import {
  authSessionSchema,
  currentUserProfileSchema,
  updateCurrentUserProfileSchema,
} from "@nextstepai/shared";
import { unauthorized } from "../errors.js";
import { validate } from "../middleware/validate.js";

const SALT = "Nextstep-system-dev-salt-2026";
function hashPassword(password: string): string {
  return pbkdf2Sync(password, SALT, 1000, 64, "sha512").toString("hex");
}

async function loadCurrentUserProfile(db: Db, userId: string) {
  const user = await db
    .select({
      id: authUsers.id,
      email: authUsers.email,
      name: authUsers.name,
      image: authUsers.image,
    })
    .from(authUsers)
    .where(eq(authUsers.id, userId))
    .then((rows) => rows[0] ?? null);

  if (!user) {
    throw unauthorized("Signed-in user not found");
  }

  return currentUserProfileSchema.parse({
    id: user.id,
    email: user.email ?? null,
    name: user.name ?? null,
    image: user.image ?? null,
  });
}

export function authRoutes(db: Db, deploymentMode?: string) {
  const router = Router();

  if (deploymentMode === "local_trusted") {
    // Custom Local Credentials Sign Up
    router.post("/sign-up/email", async (req, res) => {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: "Name, email, and password are required" });
      }

      const trimmedEmail = email.trim().toLowerCase();

      // Check if user already exists
      const existingUser = await db
        .select({ id: authUsers.id })
        .from(authUsers)
        .where(eq(authUsers.email, trimmedEmail))
        .then((rows) => rows[0] ?? null);

      if (existingUser) {
        return res.status(409).json({ error: "Email address already registered" });
      }

      const userId = `u-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const now = new Date();

      // Insert user
      await db.insert(authUsers).values({
        id: userId,
        name: name.trim(),
        email: trimmedEmail,
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      });

      // Insert account with hashed password
      const hashedPassword = hashPassword(password);
      const accountId = `acc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      await db.insert(authAccounts).values({
        id: accountId,
        accountId: userId,
        providerId: "credentials",
        userId: userId,
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      });

      // Set cookie
      res.cookie("Nextstep-local-session", userId, { path: "/", httpOnly: false });
      res.json({ success: true, user: { id: userId, email: trimmedEmail, name: name.trim() } });
    });

    // Custom Local Credentials Sign In
    router.post("/sign-in/email", async (req, res) => {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const trimmedEmail = email.trim().toLowerCase();

      // Find user
      const user = await db
        .select()
        .from(authUsers)
        .where(eq(authUsers.email, trimmedEmail))
        .then((rows) => rows[0] ?? null);

      if (!user) {
        return res.status(400).json({ error: "Email address not registered" });
      }

      // Find account
      const account = await db
        .select()
        .from(authAccounts)
        .where(and(eq(authAccounts.userId, user.id), eq(authAccounts.providerId, "credentials")))
        .then((rows) => rows[0] ?? null);

      if (!account || !account.password) {
        return res.status(400).json({ error: "Incorrect password. Please try again." });
      }

      // Match password
      const hashedPassword = hashPassword(password);
      if (account.password !== hashedPassword) {
        return res.status(400).json({ error: "Incorrect password. Please try again." });
      }

      // Set cookie
      res.cookie("Nextstep-local-session", user.id, { path: "/", httpOnly: false });
      res.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
    });

    // Custom Local Sign Out
    router.post("/sign-out", async (req, res) => {
      res.cookie("Nextstep-local-session", "", { path: "/", expires: new Date(0), httpOnly: false });
      res.json({ success: true });
    });
  }

  router.get("/get-session", async (req, res) => {
    if (req.actor.type !== "board" || !req.actor.userId) {
      throw unauthorized("Board authentication required");
    }

    const user = await loadCurrentUserProfile(db, req.actor.userId);
    res.json(authSessionSchema.parse({
      session: {
        id: `Nextstep:${req.actor.source ?? "none"}:${req.actor.userId}`,
        userId: req.actor.userId,
      },
      user,
    }));
  });

  router.get("/profile", async (req, res) => {
    if (req.actor.type !== "board" || !req.actor.userId) {
      throw unauthorized("Board authentication required");
    }

    res.json(await loadCurrentUserProfile(db, req.actor.userId));
  });

  router.patch("/profile", validate(updateCurrentUserProfileSchema), async (req, res) => {
    if (req.actor.type !== "board" || !req.actor.userId) {
      throw unauthorized("Board authentication required");
    }

    const patch = updateCurrentUserProfileSchema.parse(req.body);
    const now = new Date();

    const updated = await db
      .update(authUsers)
      .set({
        name: patch.name,
        ...(patch.image !== undefined ? { image: patch.image } : {}),
        updatedAt: now,
      })
      .where(eq(authUsers.id, req.actor.userId))
      .returning({
        id: authUsers.id,
        email: authUsers.email,
        name: authUsers.name,
        image: authUsers.image,
      })
      .then((rows) => rows[0] ?? null);

    if (!updated) {
      throw unauthorized("Signed-in user not found");
    }

    res.json(currentUserProfileSchema.parse({
      id: updated.id,
      email: updated.email ?? null,
      name: updated.name ?? null,
      image: updated.image ?? null,
    }));
  });

  router.post("/check-email", async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const user = await db
      .select({ id: authUsers.id })
      .from(authUsers)
      .where(eq(authUsers.email, email.trim().toLowerCase()))
      .then((rows) => rows[0] ?? null);

    res.json({ exists: !!user });
  });

  return router;
}
