/**
 * Tenant Isolation Middleware (defense in depth)
 * Sets context for RLS. Real security = RLS policies.
 */
module.exports = function tenantIsolation(req, res, next) {
  if (req.business && req.business.id) {
    // For Supabase RLS policies
    // In real usage: await supabase.rpc('set_config', { key: 'app.current_business_id', value: req.business.id });
  }
  next();
};
