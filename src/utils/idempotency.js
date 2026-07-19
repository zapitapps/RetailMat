/**
 * Idempotency helper for webhooks
 */
async function isAlreadyProcessed(supabase, eventId) {
  const { data } = await supabase
    .from('processed_events')
    .select('id')
    .eq('event_id', eventId)
    .single();
  return !!data;
}

async function markProcessed(supabase, eventId, eventType, businessId) {
  await supabase.from('processed_events').insert({
    event_id: eventId,
    event_type: eventType,
    business_id: businessId
  });
}

module.exports = { isAlreadyProcessed, markProcessed };
