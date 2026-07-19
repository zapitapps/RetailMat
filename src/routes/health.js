/**
 * Health & Status Routes
 */
const express = require('express');
const router = express.Router();

function createHealthRoutes(supabase) {
  router.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      version: '3.2-modular',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      features: ['8-stage-lifecycle', 'analytics', 'referrals', 'full-language', 'paystack']
    });
  });

  router.get('/admin/status', async (req, res) => {
    try {
      const { count: businesses } = await supabase
        .from('businesses')
        .select('id', { count: 'exact', head: true });

      const { count: orders } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true });

      res.json({
        status: 'healthy',
        version: '3.2-modular',
        uptime: Math.floor(process.uptime()),
        businesses: businesses || 0,
        orders: orders || 0,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      res.json({ status: 'degraded', error: e.message });
    }
  });

  return router;
}

module.exports = createHealthRoutes;
