import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { prisma } from "../db.js";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      nlamsUser?: { id: string; email: string; name: string; role: Role; states: string[] };
    }
  }
}

const VALID_ROLES: Role[] = ["DOLR_SECRETARY", "DISTRICT_COLLECTOR", "LAO", "STATE_REVENUE"];

/**
 * Requires a valid Supabase session (Authorization: Bearer <access_token>),
 * then just-in-time syncs the local `users` row from the Supabase user's
 * app_metadata (set via server/scripts/seed-supabase-users.ts or the
 * Supabase dashboard). app_metadata is only writable via the service-role
 * key, so a signed-in user cannot grant themselves a role client-side.
 */
export async function requireNlamsUser(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      res.status(401).json({ error: "Invalid or expired session" });
      return;
    }
    const supaUser = data.user;
    const role = supaUser.app_metadata["role"] as Role | undefined;
    if (!role || !VALID_ROLES.includes(role)) {
      res.status(403).json({
        error:
          "No NLAMS role assigned to this account. An admin must set app_metadata.role in Supabase.",
      });
      return;
    }
    const states = Array.isArray(supaUser.app_metadata["states"])
      ? (supaUser.app_metadata["states"] as string[])
      : [];
    const email = supaUser.email ?? `${supaUser.id}@unknown`;
    const name = (supaUser.user_metadata["name"] as string | undefined) ?? email;

    const user = await prisma.user.upsert({
      where: { id: supaUser.id },
      create: { id: supaUser.id, email, name, role, states },
      update: { email, name, role, states },
    });

    req.nlamsUser = user;
    next();
  } catch (error) {
    console.error("Failed to resolve Supabase user", error);
    res.status(502).json({ error: "Could not verify session with Supabase" });
  }
}
