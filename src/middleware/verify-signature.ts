import crypto from "crypto";
import { Request, Response, NextFunction } from "express";

const webhookSecret = process.env.KAPSO_WEBHOOK_SECRET;

export function verifyKapsoSignature(req: Request, res: Response, next: NextFunction) {
  if (!webhookSecret) {
    next();
    return;
  }

  const signature = req.headers["x-webhook-signature"] as string | undefined;

  if (!signature) {
    res.status(401).json({ error: "Missing webhook signature" });
    return;
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );

  if (!isValid) {
    res.status(401).json({ error: "Invalid webhook signature" });
    return;
  }

  next();
}
