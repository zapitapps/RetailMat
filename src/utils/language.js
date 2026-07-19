/**
 * Language Utilities — Full Master Prompt + 8-stage lifecycle support
 * Nigerian-English + light Pidgin + major local languages.
 * Flows through: business_settings → catalog → greeting → AI prompts
 */
const logger = require('./logger');

const SUPPORTED_LANGS = ['en', 'pidgin', 'yo', 'ha', 'ig'];
const DEFAULT_LANG = 'en';

const translations = {
  catalog_header: {
    en: '🛍️ {name} — Products',
    pidgin: '🛍️ {name} — Wetin dey sell',
    yo: '🛍️ {name} — Awọn ọja',
    ha: '🛍️ {name} — Kayayyaki',
    ig: '🛍️ {name} — Ngwaahịa'
  },
  no_products: {
    en: 'No products listed yet. Type *CONTACT* to reach the owner.',
    pidgin: 'No product for now. Type *CONTACT* make we talk.',
    yo: 'Ko si ọja lọwọlọwọ. Tẹ *CONTACT*.',
    ha: 'Babu samfuran yanzu. Tafi *CONTACT* don magana.',
    ig: 'Enweghi ngwaahịa ugbu a. Pịa *CONTACT*.'
  },
  delivery: {
    en: 'Delivery: {days} days',
    pidgin: 'Delivery go take {days} days',
    yo: 'Ifijiṣẹ: {days} ọjọ',
    ha: 'Isar da: {days} kwanaki',
    ig: 'Nnyefe: {days} ụbọchị'
  },
  order_placed: {
    en: 'Thank you! Your order has been received. We will confirm shortly.',
    pidgin: 'Thank you! Your order don enter. We go confirm am soon.',
    yo: 'O ṣeun! Aṣẹ rẹ ti wọle. A yoo jẹrisi laipẹ.',
    ha: 'Na gode! Odar ɗinku ya shiga. Za mu tabbatar da shi nan da nan.',
    ig: 'Daalụ! Iwu gị abanyela. Anyị ga-ezipụta ya n\'oge na-adịghị anya.'
  },
  payment_received: {
    en: 'Payment received! Your order is now being processed. Expected delivery: {days}.',
    pidgin: 'Payment don land! Your order dey process. Delivery go be {days}.',
    yo: 'Isanwo ti gba! Aṣẹ rẹ n ṣiṣẹ lọwọlọwọ. Ifijiṣẹ: {days}.',
    ha: 'An karɓi biya! Ana sarrafa odar ku. Isar da: {days}.',
    ig: 'Ekwụrụ ụgwọ! A na-edozi iwu gị ugbu a. Nnyefe: {days}.'
  }
};

function getBusinessLang(supabase, businessId) {
  // In production, fetch from business_settings
  // For now return a sensible default (can be overridden)
  return DEFAULT_LANG;
}

function translate(key, lang = DEFAULT_LANG, vars = {}) {
  const langKey = SUPPORTED_LANGS.includes(lang) ? lang : DEFAULT_LANG;
  let text = translations[key]?.[langKey] || translations[key]?.[DEFAULT_LANG] || key;
  
  // Simple variable interpolation
  Object.keys(vars).forEach(v => {
    text = text.replace(new RegExp(`\\{${v}\\}`, 'g'), vars[v]);
  });
  return text;
}

function getLocalizedProduct(product, lang = DEFAULT_LANG) {
  if (!product) return '';
  const currency = product.currency || 'NGN';
  const price = product.sale_price 
    ? `~~${currency} ${product.price}~~ *${currency} ${product.sale_price}*`
    : `${currency} ${product.price}`;
  
  let text = `• *${product.name}* — ${price}`;
  if (product.description) {
    text += `\n   ${product.description.substring(0, 55)}`;
  }
  text += `\n   ${product.type === 'digital' ? '⚡ Digital' : '📦 Physical'}`;
  return text;
}

function getBusinessPreferredLang(business) {
  // Prefer business_settings if passed
  return business?.preferred_language || business?.business_settings?.preferred_language || DEFAULT_LANG;
}

module.exports = {
  SUPPORTED_LANGS,
  DEFAULT_LANG,
  getBusinessLang,
  translate,
  getLocalizedProduct,
  getBusinessPreferredLang
};
