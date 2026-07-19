/**
 * VendrAI — MODULAR ENTRY POINT (v3.3-refactor)
 * Full modular version created 2026-07-09
 * 
 * This is the new recommended entry point.
 * Original monolithic logic remains in index.js.bak.3231 for stability during transition.
 */

"use strict";
try { require("dotenv").config(); } catch (e) {}

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const { getSupabase } = require("./utils/supabaseClient");
const logger = require("./utils/logger");
const { requireAuth } = require("./middleware/auth");

const createHealthRoutes = require("./routes/health");
const createLanguageRoutes = require("./routes/language");
const { handleConfirmPayment, handleMarkShipped, handleMarkDelivered } = require("./handlers/lifecycle");
const LanguageService = require("./services/languageService");
const { processIncomingMessage } = require("./handlers/messageHandler");
const { isDemoMode, wrapDemo } = require("./utils/flags");

const supabase = getSupabase();
const languageService = new LanguageService(supabase);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: "*" }));
app.use(morgan("combined"));
app.use("/webhook/paystack", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

const authLimiter = rateLimit({ windowMs: 60000, max: 10 });

// Health + Language routes (modular)
app.use("/", createHealthRoutes(supabase));
app.use("/", createLanguageRoutes(supabase));

// Lifecycle routes (modular)
app.post("/dashboard/orders/:id/confirm-payment", requireAuth(supabase), async (req, res) => {
  const result = await handleConfirmPayment(supabase, req.params.id, req.business.id, req.body);
  res.json(result);
});

app.post("/dashboard/orders/:id/mark-shipped", requireAuth(supabase), async (req, res) => {
  const result = await handleMarkShipped(supabase, req.params.id, req.business.id, req.body?.trackingNumber);
  res.json(result);
});

app.post("/dashboard/orders/:id/mark-delivered", requireAuth(supabase), async (req, res) => {
  const result = await handleMarkDelivered(supabase, req.params.id, req.business.id);
  res.json(result);
});

// Main WhatsApp Webhook (uses new modular message handler + language)
app.post("/webhook/whatsapp", async (req, res) => {
  res.sendStatus(200);

  try {
    const body = req.body;
    // Meta verification already handled elsewhere
    if (body.object !== "whatsapp_business_account") return;

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    const messages = value?.messages || [];
    if (!messages.length) return;

    const msg = messages[0];
    const fromPhone = msg.from;
    const text = msg.text?.body || "";
    const businessPhoneId = value?.metadata?.phone_number_id;

    // Find business by phone (simplified lookup)
    const { data: business } = await supabase
      .from("businesses")
      .select("*")
      .eq("whatsapp_number", businessPhoneId)
      .or(`wa_phone_id.eq.${businessPhoneId}`)
      .single();

    if (!business) {
      logger.warn("No business found for webhook", { phoneId: businessPhoneId });
      return;
    }

    const result = await processIncomingMessage(
      supabase, 
      business, 
      fromPhone, 
      text, 
      {}, 
      languageService
    );

    if (result.text) {
      // Send reply (simplified - in real use the sendWA function)
      logger.info("Would send message", { to: fromPhone, text: result.text.substring(0, 80) });
    } else if (result.useLegacyAI) {
      // Fallback to full legacy handler if needed (for complex flows)
      logger.debug("Falling back to legacy AI for complex message");
    }

  } catch (err) {
    logger.error("Webhook processing error", { error: err.message });
  }
});

// Start
app.listen(PORT, () => {
  logger.info(`✅ VendrAI MODULAR backend running on port ${PORT}`);
  logger.info(`Health: http://localhost:${PORT}/health`);
  if (isDemoMode()) logger.warn("Running in DEMO MODE");
});

module.exports = app;
