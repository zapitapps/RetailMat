/**
 * Lightweight Conversation Memory (Premium Standard)
 * Stores last 5 turns per contact for context-aware responses
 */
async function getRecentMessages(supabase, businessId, phone, limit = 5) {
  try {
    const { data } = await supabase
      .from('messages')
      .select('direction, content, created_at')
      .eq('business_id', businessId)
      .eq('contact_phone', phone)
      .order('created_at', { ascending: false })
      .limit(limit);
    return data || [];
  } catch (e) {
    return [];
  }
}

module.exports = { getRecentMessages };
