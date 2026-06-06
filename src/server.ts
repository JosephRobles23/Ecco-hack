import express from "express";
import cors from "cors";
import { ingestRouter } from "./routes/ingest.js";
import { queryRouter } from "./routes/query.js";
import { reportsRouter } from "./routes/reports.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Pipeline routes
app.use("/api", ingestRouter);   // Worktree A
app.use("/api", queryRouter);    // Worktree B
app.use("/api", reportsRouter);  // Worktree C

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Backend IA running on port ${PORT}`);
});

export { app };
