/**
 * VENDRAI PREMIUM CONVERSATION ENGINE (v3.5)
 * 
 * Two-path architecture:
 * 1. KB Path → Premium++++ drama-style dialogues (global + tenant-approved)
 * 2. AI Fallback → HuggingFace only when no strong KB match
 * 
 * Multi-tenant: Global master + tenant custom (with admin approval)
 * Learning: Usage logged for continuous improvement
 */

const logger = require('../utils/logger');
const KBService = require('../services/kbService');

async function processIncomingMessage(supabase, business, fromPhone, messageText, incomingMeta = {}, languageService) {
  try {
    const lang = await languageService.getLang(business.id);
    const trimmed = (messageText || '').trim();

    const kb = new KBService(supabase);

    const result = await kb.getResponse(business.id, trimmed, lang, {
      businessName: business.business_name,
      // You can enrich context from intelligence here
    });

    if (result.usedAI) {
      // Let existing HuggingFace / legacy AI handle it
      return { text: null, intent: 'ai_fallback', lang, useLegacyAI: true };
    }

    // KB response (premium)
    return {
      text: result.text,
      intent: result.category || 'kb',
      lang,
      source: result.source
    };

  } catch (err) {
    logger.error('Premium conversation engine error', { error: err.message });
    return {
      text: "Oops, something catch us. No worry — type *MENU* or *CONTACT* make we sort am now.",
      intent: 'error'
    };
  }
}

module.exports = { processIncomingMessage };
