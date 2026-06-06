// Worktree A: Ingest Pipeline
// Implement POST /api/ingest here
import { Router } from "express";

export const ingestRouter = Router();

// TODO: Worktree A implements this
ingestRouter.post("/ingest", async (_req, res) => {
  res.status(501).json({ error: "Not implemented — Worktree A" });
});
