import express from "express";
import cors from "cors";
import { webhookRouter } from "./webhooks/message-received.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "ecco-whatsapp-gateway", timestamp: new Date().toISOString() });
});

// Kapso webhook endpoint
app.use(webhookRouter);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Ecco WhatsApp Gateway running on port ${PORT}`);
});

export { app };
