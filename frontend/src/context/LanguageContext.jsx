import { createContext, useContext, useState, useEffect } from "react";

export const translations = {
  en: {
    // Top Bar & Nav
    top_location: "Ambikapur, Chhattisgarh Pilot Live",
    top_helpline: "24/7 Helpline",
    top_instant_care: "Need a Care Companion today? Arriving in 20 min.",
    nav_services: "Services",
    nav_how_it_works: "How It Works",
    nav_membership: "VIP Membership",
    nav_doctors: "Doctors & Clinics",
    nav_partner: "Become a Partner",
    nav_instant_book: "Instant Book",
    nav_whatsapp: "WhatsApp",
    nav_login: "Login",
    nav_logout: "Log out",
    nav_my_bookings: "My Bookings",
    nav_my_membership: "My Membership",
    nav_admin: "Admin Console",
    nav_pilot_badge: "Ambikapur Pilot Live",

    // Mobile Drawer
    mob_need_care: "Need Care Immediately?",
    mob_verified_partner: "Verified Partner at your door in 20 min",
    mob_book_now: "Book Now ⚡",
    mob_navigation: "Navigation",
    mob_emergency_support: "Emergency Support",
    mob_book_whatsapp: "Book via WhatsApp",

    // Bottom Nav
    bottom_home: "Home",
    bottom_services: "Services",
    bottom_book: "Book ⚡",
    bottom_vip: "VIP Pass",
    bottom_bookings: "Bookings",
    bottom_login: "Login",

    // Hero Section
    hero_badge: "Chhattisgarh & India's Premier Healthcare Concierge",
    hero_title_prefix: "Hospital visit or bedside care — ",
    hero_title_highlight: "a trusted companion",
    hero_title_suffix: " by your side.",
    hero_subtitle: "When you can't be there in person, ROSKYRO provides background-verified care companions to accompany your loved ones during hospital visits, OPD consultations, tests, and recovery in Ambikapur.",
    hero_book_btn: "Book a Care Companion",
    hero_concierge_btn: "Explore VIP Concierge",
    hero_arrival_guarantee: "20-Min Fast Arrival",
    hero_verified_badge: "100% Police Verified",
    hero_pricing_badge: "Transparent Hourly Rates",

    // Hero Tabs
    tab_tracker: "Live Companion Tracker",
    tab_fare: "Fare Estimator",
    tab_vip: "Digital VIP Pass",

    // Tracker Demo
    sim_status_active: "Active Hospital Booking",
    sim_partner_role: "Senior Hospital Companion",
    sim_companion_assigned: "Companion Assigned",
    sim_pin_verified: "Start PIN Verified",
    sim_care_progress: "Bedside Care in Progress",
    sim_sos_guarantee: "24x7 Safety Officer On Call",

    // Fare Estimator
    fare_hours_label: "Required Care Duration:",
    fare_base_rate: "Companion Base Fee",
    fare_arrival_fee: "Partner Arrival Fee",
    fare_tax: "GST (18%)",
    fare_total: "Estimated Total",
    fare_book_this: "Book This Duration",

    // Services Section
    services_tag: "Comprehensive Care Coverage",
    services_title: "Everything you need for seamless hospital & elder care",
    services_subtitle: "From OPD companion to in-patient assistance, choose the specialized care your family deserves.",
    filter_all: "All Services",
    filter_hospital: "Hospital Assistance",
    filter_elder: "Home & Elder Care",
    filter_diagnostic: "Diagnostic & Tests",
    filter_emergency: "24x7 Urgent Support",
    service_book_now: "Book Service",
    service_learn_more: "Learn More",
    service_price_from: "From ₹",
    service_per_hour: "/ hour",

    // Quick Book Modal
    modal_title: "Instant Care Companion Booking",
    modal_step_service: "1. Select Care Service",
    modal_step_hours: "2. Choose Hours & Address",
    modal_step_confirm: "3. Confirmation & Dispatch",
    modal_hours_needed: "Select Duration:",
    modal_address_label: "Hospital / Residence Address in Ambikapur:",
    modal_confirm_btn: "Confirm & Dispatch Companion",
    modal_whatsapp_btn: "Or Book Instantly on WhatsApp",
    modal_safety_guarantee: "Verified Companions • Transparent Fare • Safety Officer On Call",

    // General
    lang_name: "English",
    lang_switch: "हिन्दी में बदलें",
    switch_to: "हिंदी",
  },
  hi: {
    // Top Bar & Nav
    top_location: "अंबिकापुर, छत्तीसगढ़ पायलट लाइव",
    top_helpline: "24/7 हेल्पलाइन",
    top_instant_care: "आज केयर साथी चाहिए? केवल 20 मिनट में पहुंचेगा।",
    nav_services: "सेवाएं",
    nav_how_it_works: "कैसे काम करता है",
    nav_membership: "VIP सदस्यता",
    nav_doctors: "डॉक्टर और क्लिनिक",
    nav_partner: "पार्टनर बनें",
    nav_instant_book: "तुरंत बुक करें",
    nav_whatsapp: "व्हाट्सएप",
    nav_login: "लॉगिन",
    nav_logout: "लॉगआउट",
    nav_my_bookings: "मेरी बुकिंग",
    nav_my_membership: "मेरी सदस्यता",
    nav_admin: "एडमिन कंसोल",
    nav_pilot_badge: "अंबिकापुर पायलट लाइव",

    // Mobile Drawer
    mob_need_care: "क्या तुरंत केयर असिस्टेंट चाहिए?",
    mob_verified_partner: "वेरिफाइड साथी 20 मिनट में आपके द्वार",
    mob_book_now: "अभी बुक करें ⚡",
    mob_navigation: "नेविगेशन",
    mob_emergency_support: "आपातकालीन सहायता",
    mob_book_whatsapp: "व्हाट्सएप से बुक करें",

    // Bottom Nav
    bottom_home: "होम",
    bottom_services: "सेवाएं",
    bottom_book: "बुक करें ⚡",
    bottom_vip: "VIP पास",
    bottom_bookings: "बुकिंग",
    bottom_login: "लॉगिन",

    // Hero Section
    hero_badge: "छत्तीसगढ़ व भारत का अग्रणी हेल्थकेयर कॉन्सिएर्ज",
    hero_title_prefix: "अस्पताल का काम हो या अपनों की देखभाल — ",
    hero_title_highlight: "एक भरोसेमंद साथी",
    hero_title_suffix: " हमेशा आपके साथ।",
    hero_subtitle: "जब आप खुद मौजूद न हो सकें, ROSKYRO का बैकग्राउंड-सत्यापित केयर साथी आपके माता-पिता या मरीज के साथ ओपीडी पर्ची, डॉक्टर परामर्श, टेस्ट और डिस्चार्ज में हर कदम साथ रहता है।",
    hero_book_btn: "केयर साथी बुक करें",
    hero_concierge_btn: "VIP कॉन्सिएर्ज देखें",
    hero_arrival_guarantee: "20-मिनट त्वरित आगमन",
    hero_verified_badge: "100% पुलिस व आईडी सत्यापित",
    hero_pricing_badge: "पारदर्शी घंटेवार दरें",

    // Hero Tabs
    tab_tracker: "लाइव साथी ट्रैकर",
    tab_fare: "किराया कैलकुलेटर",
    tab_vip: "डिजिटल VIP पास",

    // Tracker Demo
    sim_status_active: "सक्रिय अस्पताल बुकिंग",
    sim_partner_role: "वरिष्ठ अस्पताल केयर साथी",
    sim_companion_assigned: "साथी नियुक्त हुआ",
    sim_pin_verified: "स्टार्ट पिन सत्यापित",
    sim_care_progress: "मरीज देखभाल जारी है",
    sim_sos_guarantee: "24x7 सुरक्षा अधिकारी ऑन-कॉल",

    // Fare Estimator
    fare_hours_label: "देखभाल अवधि चुनें:",
    fare_base_rate: "साथी आधार शुल्क",
    fare_arrival_fee: "आगमन शुल्क",
    fare_tax: "जीएसटी (18%)",
    fare_total: "कुल अनुमानित राशि",
    fare_book_this: "यह अवधि बुक करें",

    // Services Section
    services_tag: "संपूर्ण स्वास्थ्य सहायता",
    services_title: "अस्पताल व बुजुर्ग देखभाल के लिए हर जरूरी सेवा",
    services_subtitle: "ओपीडी पर्ची से लेकर बेडसाइड सहायता तक, अपने परिवार के लिए विशेषज्ञ साथी चुनें।",
    filter_all: "सभी सेवाएं",
    filter_hospital: "अस्पताल सहायता",
    filter_elder: "घर व बुजुर्ग देखभाल",
    filter_diagnostic: "लैब व डायग्नोस्टिक",
    filter_emergency: "24x7 इमरजेंसी सपोर्ट",
    service_book_now: "सेवा बुक करें",
    service_learn_more: "विस्तार से जानें",
    service_price_from: "शुरुआती ₹",
    service_per_hour: "/ घंटा",

    // Quick Book Modal
    modal_title: "तुरंत केयर साथी बुक करें",
    modal_step_service: "1. सेवा का चयन करें",
    modal_step_hours: "2. घंटे और पता दर्ज करें",
    modal_step_confirm: "3. पुष्टि व साथी रवानगी",
    modal_hours_needed: "अवधि चुनें:",
    modal_address_label: "अंबिकापुर में अस्पताल / घर का पता:",
    modal_confirm_btn: "पुष्टि करें और साथी भेजें",
    modal_whatsapp_btn: "या व्हाट्सएप पर तुरंत बुक करें",
    modal_safety_guarantee: "सत्यापित साथी • पारदर्शी दरें • 24x7 सुरक्षा अधिकारी",

    // General
    lang_name: "हिन्दी",
    lang_switch: "Switch to English",
    switch_to: "English",
  },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem("roskyro_lang") || "en";
    } catch {
      return "en";
    }
  });

  const setLanguage = (lang) => {
    const nextLang = lang === "hi" ? "hi" : "en";
    setLanguageState(nextLang);
    try {
      localStorage.setItem("roskyro_lang", nextLang);
      document.documentElement.lang = nextLang;
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (key, fallback = "") => {
    const dict = translations[language] || translations.en;
    if (dict[key] !== undefined) return dict[key];
    if (translations.en[key] !== undefined) return translations.en[key];
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if accessed outside provider
    return {
      language: "en",
      setLanguage: () => {},
      t: (k, fallback = "") => translations.en[k] || fallback || k,
    };
  }
  return context;
}
