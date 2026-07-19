const express = require('express');
const router = express.Router();

function createLanguageRoutes(supabase) {
  router.post('/dashboard/preferred-language', require('../middleware/auth').requireAuth(supabase), async (req, res) => {
    try {
      const { language } = req.body;
      if (!language) return res.status(400).json({ error: 'language required' });

      await supabase.from('business_settings').upsert({
        business_id: req.business.id,
        preferred_language: language,
        updated_at: new Date().toISOString()
      }, { onConflict: 'business_id' });

      res.json({ success: true, language });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/dashboard/preferred-language', require('../middleware/auth').requireAuth(supabase), async (req, res) => {
    try {
      const { data } = await supabase.from('business_settings')
        .select('preferred_language')
        .eq('business_id', req.business.id)
        .single();
      res.json({ success: true, language: data?.preferred_language || 'en' });
    } catch (err) {
      res.json({ success: true, language: 'en' });
    }
  });

  return router;
}

module.exports = createLanguageRoutes;
