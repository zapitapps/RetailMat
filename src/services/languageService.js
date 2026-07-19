/**
 * Language Service — Full Master Prompt integration
 * Ensures language preference flows across catalog/products/greeting/AI
 */
const logger = require('../utils/logger');
const { getBusinessLang, translate, getLocalizedProduct, getBusinessPreferredLang } = require('../utils/language');

class LanguageService {
  constructor(supabase) {
    this.supabase = supabase;
  }

  async getLang(businessId) {
    try {
      const { data } = await this.supabase
        .from('business_settings')
        .select('preferred_language')
        .eq('business_id', businessId)
        .single();
      return data?.preferred_language || 'en';
    } catch {
      return 'en';
    }
  }

  async getLangForBusiness(business) {
    return getBusinessPreferredLang(business);
  }

  translateCatalogHeader(businessName, lang) {
    return translate('catalog_header', lang, { name: businessName });
  }

  formatProduct(p, lang) {
    return getLocalizedProduct(p, lang);
  }

  getDeliveryText(lang, days = '2-5') {
    return translate('delivery', lang, { days });
  }

  translate(key, lang, vars) {
    return translate(key, lang, vars);
  }

  buildPremiumGreeting(business, lang) {
    const name = business.business_name || 'our shop';
    const greetings = {
      en: `Hello 👋 Welcome to *${name}*. I can help with products, prices, delivery, payment, or placing an order. What would you like to do today?`,
      pidgin: `Hello 👋 Welcome to *${name}*. Wetin you dey find? I fit help you with price, order, delivery or payment. Wetin you want make I do for you today?`,
      yo: `Ẹ ń lẹ́ 👋 Kaabo si *${name}*. Kini o n wa? Mo le ran ọ lọwọ pẹlu ọja, owo, gbigbe tabi sisanwo.`,
      ha: `Sannu 👋 Barka da zuwa *${name}*. Me ka ke nema? Zan iya taimaka maka da farashi, oda, jigilar kaya ko biya.`,
      ig: `Ndewo 👋 Nnọọ na *${name}*. Kedu ihe ị na-achọ? Enwere m ike inyere gị aka na ngwaahịa, ego, nnyefe ma ọ bụ ịkwụ ụgwọ.`
    };
    return greetings[lang] || greetings.en;
  }
}

module.exports = LanguageService;
