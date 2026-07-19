/**
 * PREMIUM MULTI-TENANT KB SERVICE (v3.5)
 * Global Master + Tenant Custom + Admin Approval + Learning
 */
const logger = require('../utils/logger');

class KBService {
  constructor(supabase) {
    this.supabase = supabase;
  }

  async getResponse(businessId, message, lang = 'en', context = {}) {
    const lower = (message || '').trim().toLowerCase();
    const dialogues = await this.getApprovedDialogues(businessId);
    const match = this.findBestMatch(dialogues, lower);

    if (match && match.score >= 1) {
      await this.logUsage(businessId, match, message, lang);

      let response = match[`response_${lang}`] || match.response_en || match.response_pidgin || '';

      response = response
        .replace(/\{business_name\}/g, context.businessName || 'our shop')
        .replace(/\{product_name\}/g, context.productName || 'the item')
        .replace(/\{price\}/g, context.price || '')
        .replace(/\{date\}/g, context.estimatedDate || 'soon');

      return { text: response, source: match.source, category: match.category, usedAI: false };
    }

    return { text: null, usedAI: true, source: 'ai_fallback' };
  }

  async getApprovedDialogues(businessId) {
    const { data: global } = await this.supabase.from('global_dialogues').select('*').eq('is_active', true);
    const { data: tenant } = await this.supabase.from('tenant_dialogues').select('*').eq('business_id', businessId).eq('status', 'approved');

    return [
      ...(global || []).map(d => ({ ...d, source: 'global' })),
      ...(tenant || []).map(d => ({ ...d, source: 'tenant' }))
    ];
  }

  findBestMatch(dialogues, lower) {
    let best = null; let bestScore = 0;
    for (const d of dialogues) {
      const kws = d.trigger_keywords || [];
      let score = 0;
      kws.forEach(kw => { if (lower.includes(kw.toLowerCase())) score += 1; });
      if (score > bestScore) { bestScore = score; best = { ...d, score }; }
    }
    return best;
  }

  async logUsage(businessId, match, originalMessage, lang) {
    try {
      await this.supabase.from('dialogue_usage_logs').insert({
        business_id: businessId,
        dialogue_id: match.id,
        dialogue_source: match.source,
        trigger_message: originalMessage,
        matched_keywords: match.trigger_keywords,
        response_used: match.response_en,
        lang
      });
    } catch (e) {}
  }

  async submitTenantDialogue(businessId, category, keywords, responses, submittedBy) {
    return await this.supabase.from('tenant_dialogues').insert({
      business_id: businessId,
      category,
      trigger_keywords: keywords,
      response_en: responses.en,
      response_pidgin: responses.pidgin,
      response_yo: responses.yo,
      response_ha: responses.ha,
      response_ig: responses.ig,
      status: 'pending',
      submitted_by: submittedBy
    });
  }

  async approveTenantDialogue(id, admin, notes = '') {
    await this.supabase.from('tenant_dialogues').update({ status: 'approved', approved_by: admin, approved_at: new Date() }).eq('id', id);
    await this.supabase.from('dialogue_approvals').insert({ tenant_dialogue_id: id, action: 'approved', admin_username: admin, notes });
  }
}

module.exports = KBService;
