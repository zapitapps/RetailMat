/**
 * 8-Stage Lifecycle Handlers — Master Prompt compliant
 * Business logic ONLY. Tenant-isolated. Idempotent-safe.
 * Used by routes + handlers.
 */
const logger = require('../utils/logger');

async function handleConfirmPayment(supabase, orderId, businessId, body, idempotencyKey = null) {
  try {
    if (idempotencyKey) {
      const { data: existing } = await supabase
        .from('processed_events')
        .select('id')
        .eq('event_id', idempotencyKey)
        .single();
      if (existing) {
        return { success: true, message: 'Already processed (idempotent)', idempotent: true };
      }
    }

    const { paymentMethod, reference, amountReceived, note } = body;

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('business_id', businessId)
      .single();

    if (orderErr || !order) {
      return { success: false, error: 'Order not found or access denied' };
    }

    const deliveryDays = order.delivery_days || '2-5';

    const { error: updateErr } = await supabase
      .from('orders')
      .update({
        status: 'processing',
        paystack_status: 'success',
        paystack_ref: reference || `MANUAL-${Date.now()}`,
        paid_at: new Date().toISOString(),
        payment_method: paymentMethod || 'manual',
        notes: note || `Manual payment confirmed via ${paymentMethod || 'bank'}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .eq('business_id', businessId);

    if (updateErr) throw updateErr;

    await supabase.from('payments').insert({
      business_id: businessId,
      order_id: orderId,
      type: 'order',
      amount: amountReceived || order.total,
      status: 'success',
      method: paymentMethod || 'manual',
      created_at: new Date().toISOString()
    });

    if (idempotencyKey) {
      await supabase.from('processed_events').insert({
        event_id: idempotencyKey,
        event_type: 'confirm_payment',
        business_id: businessId
      }).catch(() => {});
    }

    logger.event('payment_confirmed', { orderId, businessId, idempotencyKey });

    return {
      success: true,
      message: 'Payment confirmed',
      deliveryDays,
      orderId
    };
  } catch (err) {
    logger.error('Confirm payment failed', { orderId, businessId, error: err.message });
    return { success: false, error: err.message };
  }
}

async function handleMarkShipped(supabase, orderId, businessId, trackingNumber) {
  try {
    const { data: order } = await supabase
      .from('orders')
      .select('id')
      .eq('id', orderId)
      .eq('business_id', businessId)
      .single();

    if (!order) return { success: false, error: 'Order not found' };

    const { error: updateErr } = await supabase
      .from('orders')
      .update({
        status: 'shipped',
        tracking_number: trackingNumber || null,
        shipped_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .eq('business_id', businessId);

    if (updateErr) throw updateErr;

    logger.event('order_shipped', { orderId, businessId, tracking: trackingNumber });
    return { success: true, message: 'Order marked shipped' };
  } catch (err) {
    logger.error('Mark shipped failed', { orderId, businessId, error: err.message });
    return { success: false, error: err.message };
  }
}

async function handleMarkDelivered(supabase, orderId, businessId) {
  try {
    const { data: order } = await supabase
      .from('orders')
      .select('id')
      .eq('id', orderId)
      .eq('business_id', businessId)
      .single();

    if (!order) return { success: false, error: 'Order not found' };

    const { error: updateErr } = await supabase
      .from('orders')
      .update({
        status: 'delivered',
        delivered_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .eq('business_id', businessId);

    if (updateErr) throw updateErr;

    logger.event('order_delivered', { orderId, businessId });
    return { success: true, message: 'Order marked delivered' };
  } catch (err) {
    logger.error('Mark delivered failed', { orderId, businessId, error: err.message });
    return { success: false, error: err.message };
  }
}

module.exports = {
  handleConfirmPayment,
  handleMarkShipped,
  handleMarkDelivered
};
