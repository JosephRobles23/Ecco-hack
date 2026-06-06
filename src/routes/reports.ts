// Worktree C: Reports + Dashboard + Onboard
// Implement POST /api/reports/generate, GET /api/dashboard/:org_id, POST /api/onboard
import { Router } from "express";

export const reportsRouter = Router();

// TODO: Worktree C implements these
reportsRouter.post("/reports/generate", async (_req, res) => {
  res.status(501).json({ error: "Not implemented — Worktree C" });
});

reportsRouter.get("/dashboard/:org_id", async (_req, res) => {
  res.status(501).json({ error: "Not implemented — Worktree C" });
});

reportsRouter.post("/onboard", async (_req, res) => {
  res.status(501).json({ error: "Not implemented — Worktree C" });
});
