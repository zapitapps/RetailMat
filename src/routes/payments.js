/**
 * Payments & Bank Details Routes — Full 100% per Trilogy
 * Payment proofs, bank settings, confirmations, payment bar support
 */
const express = require('express');
const { validateWithSchema, schemas } = require('../utils/validation');

function createPaymentsRoutes(supabase) {
  const router = express.Router();

  // GET /dashboard/payments — Payment bar data (overdue, proofs, bank)
  router.get('/dashboard/payments', require('../middleware/auth').requireAuth(supabase), async (req, res, next) => {
    try {
      const bizId = req.business.id;

      const { data: orders = [] } = await supabase.from('orders').select('*').eq('business_id', bizId);
      const { data: payments = [] } = await supabase.from('payments').select('*').eq('business_id', bizId);
      const { data: settings } = await supabase.from('business_settings').select('bank_details, paystack_public').eq('business_id', bizId).single();

      const pendingPayments = orders.filter(o => ['pending', 'processing'].includes(o.status));
      const totalPending = pendingPayments.reduce((s, o) => s + (o.total || 0), 0);

      res.json({
        success: true,
        payments: {
          pendingAmount: totalPending,
          pendingCount: pendingPayments.length,
          proofsReceived: payments.filter(p => p.status === 'proof_received').length,
          bankDetails: settings?.bank_details || null,
          paystackConfigured: !!settings?.paystack_public,
          recentProofs: payments.slice(0, 5)
        }
      });
    } catch (err) { next(err); }
  });

  // POST /dashboard/payments/bank-details — Save payment settings
  router.post('/dashboard/payments/bank-details', require('../middleware/auth').requireAuth(supabase), async (req, res, next) => {
    try {
      const { bank_name, account_number, account_name, paystack_public, paystack_secret } = req.body;

      await supabase.from('business_settings').upsert({
        business_id: req.business.id,
        bank_details: { bank_name, account_number, account_name },
        paystack_public: paystack_public || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'business_id' });

      await supabase.from('audit_logs').insert({
        business_id: req.business.id,
        action: 'payment_settings_updated',
        metadata: { bank_name }
      });

      res.json({ success: true, message: 'Bank & payment settings saved successfully' });
    } catch (err) { next(err); }
  });

  // POST /dashboard/payments/confirm-proof — Confirm payment proof
  router.post('/dashboard/payments/confirm-proof', require('../middleware/auth').requireAuth(supabase), async (req, res, next) => {
    try {
      const { orderId, proofRef, amount } = req.body;
      const bizId = req.business.id;

      await supabase.from('payments').insert({
        business_id: bizId,
        order_id: orderId,
        type: 'proof',
        amount: amount || 0,
        status: 'success',
        method: 'bank_transfer',
        reference: proofRef || `PROOF-${Date.now()}`
      });

      await supabase.from('orders').update({ 
        status: 'processing', 
        paystack_status: 'success',
        paid_at: new Date().toISOString() 
      }).eq('id', orderId).eq('business_id', bizId);

      res.json({ success: true, message: 'Payment proof confirmed. Order moved to processing.' });
    } catch (err) { next(err); }
  });

  // GET /dashboard/payments/proofs — List payment proofs for bar
  router.get('/dashboard/payments/proofs', require('../middleware/auth').requireAuth(supabase), async (req, res, next) => {
    try {
      const { data: proofs = [] } = await supabase
        .from('payments')
        .select('*, orders(*)')
        .eq('business_id', req.business.id)
        .eq('type', 'proof')
        .order('created_at', { ascending: false })
        .limit(20);

      res.json({ success: true, proofs });
    } catch (err) { next(err); }
  });

  return router;
}

module.exports = createPaymentsRoutes;
