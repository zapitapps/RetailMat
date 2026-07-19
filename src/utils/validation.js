/**
 * Production-grade validation — Master Prompt compliant
 * All input validated at API boundary using Zod.
 * Reject early with specific messages.
 */
const { z } = require('zod');

// Reusable schemas
const uuidSchema = z.string().uuid();
const positiveNumber = z.number().positive();
const currencySchema = z.string().regex(/^[A-Z]{3}$/).default('NGN');
const phoneSchema = z.string().min(10).max(15).regex(/^\+?[0-9]+$/);

const PaymentConfirmationSchema = z.object({
  paymentMethod: z.enum(['paystack', 'bank_transfer', 'manual', 'card', 'ussd']).default('manual'),
  reference: z.string().min(3).max(100).optional(),
  amountReceived: z.coerce.number().positive().optional(),
  note: z.string().max(500).optional(),
  idempotencyKey: z.string().min(8).max(128).optional()
});

const OrderSchema = z.object({
  items: z.array(z.object({
    name: z.string().min(1).max(100),
    qty: z.number().int().positive().default(1),
    price: positiveNumber,
    product_id: uuidSchema.optional()
  })).min(1),
  total: positiveNumber,
  currency: currencySchema,
  customer_phone: phoneSchema.optional(),
  delivery_address: z.string().max(300).optional(),
  notes: z.string().max(500).optional()
});

const MessageSchema = z.object({
  text: z.string().min(1).max(2000)
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128)
});

const RegisterSchema = z.object({
  business_name: z.string().min(2).max(80),
  email: z.string().email(),
  phone: phoneSchema,
  password: z.string().min(8).max(128),
  whatsapp_number: phoneSchema.optional(),
  preferred_language: z.enum(['en', 'pidgin', 'yo', 'ha', 'ig']).default('en')
});

const IdempotencyKeySchema = z.string().min(8).max(128).optional();

const LifecycleUpdateSchema = z.object({
  trackingNumber: z.string().max(64).optional(),
  note: z.string().max(300).optional()
});

function validateWithSchema(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const firstError = result.error.errors[0];
  return {
    success: false,
    error: firstError?.message || 'Validation failed',
    details: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
  };
}

// Legacy wrappers for existing code (to avoid breaking)
function validatePaymentConfirmation(data) {
  // Enforce at least paymentMethod present (for legacy strictness)
  if (!data || !data.paymentMethod) {
    return { success: false, error: 'paymentMethod required' };
  }
  const res = validateWithSchema(PaymentConfirmationSchema, data);
  return res.success ? { success: true } : { success: false, error: res.error };
}

function validateOrder(data) {
  const res = validateWithSchema(OrderSchema, data);
  return res.success ? { success: true } : { success: false, error: res.error };
}

function validateMessage(text) {
  const res = validateWithSchema(MessageSchema, { text });
  return res.success ? { success: true } : { success: false, error: res.error };
}

module.exports = {
  // Zod schemas (new)
  schemas: {
    PaymentConfirmationSchema,
    OrderSchema,
    MessageSchema,
    LoginSchema,
    RegisterSchema,
    LifecycleUpdateSchema
  },
  validateWithSchema,
  // Legacy API compatibility
  validatePaymentConfirmation,
  validateOrder,
  validateMessage,
  // Named validators
  validateLogin: (d) => validateWithSchema(LoginSchema, d),
  validateRegister: (d) => validateWithSchema(RegisterSchema, d),
  validateIdempotencyKey: (key) => IdempotencyKeySchema.safeParse(key)
};
