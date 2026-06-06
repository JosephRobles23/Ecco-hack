// Worktree B: Query Pipeline
// Implement POST /api/query here
import { Router } from "express";

export const queryRouter = Router();

// TODO: Worktree B implements this
queryRouter.post("/query", async (_req, res) => {
  res.status(501).json({ error: "Not implemented — Worktree B" });
});
