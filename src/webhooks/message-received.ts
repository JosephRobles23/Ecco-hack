// Worktree A: Webhook Handler
// Handles whatsapp.message.received events from Kapso
import { Router } from "express";
import { verifyKapsoSignature } from "../middleware/verify-signature.js";

export const webhookRouter = Router();

webhookRouter.post("/webhooks/whatsapp", verifyKapsoSignature, async (req, res) => {
  // TODO: Worktree A implements this
  // 1. Parse KapsoWebhookPayload
  // 2. Route to media processor or text handler
  // 3. Forward to backend IA
  // 4. Send reply via Kapso
  res.status(200).send("OK");
});
