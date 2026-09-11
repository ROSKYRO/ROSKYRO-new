// Central content store for the ROSKYRO blog. One entry per service so each
// gets a dedicated, keyword-focused landing page for search engines, plus a
// listing on /blog. Keep hourly_rate in sync with the backend /services data
// shown on the Services page — this is marketing copy, not the pricing
// source of truth.

export const BLOG_POSTS = [
  {
    slug: "urgent-support",
    icon: "🚨",
    name: "24x7 Urgent Support",
    hourly_rate: 269,
    category: "Urgent Assistance",
    title: "24x7 Urgent Support Service in India — Non-Medical Help, Any Hour",
    metaTitle: "24x7 Urgent Support Service | Verified Help Any Hour — ROSKYRO",
    metaDescription:
      "Need non-medical urgent help at 2 AM? ROSKYRO's 24x7 Urgent Support sends a background-verified Partner to your address any hour, any day. Pay after the visit — ₹269/hr.",
    keywords: [
      "24x7 urgent support service India",
      "emergency non-medical help at home",
      "urgent assistance service near me",
      "late night help at home India",
      "verified urgent support partner",
    ],
    excerpt:
      "Non-medical urgent help, any hour of the day or night — a verified Partner reaches you fast, with no advance payment.",
    readTime: "5 min read",
    heroTagline: "Because emergencies don't check the clock.",
    sections: [
      {
        heading: "What is ROSKYRO's 24x7 Urgent Support?",
        body: "24x7 Urgent Support is ROSKYRO's on-call, non-medical assistance service for moments when you need another pair of hands right now — not tomorrow, not after office hours, but immediately. Think of it as a trusted person you can call at 3 AM when a family member needs someone by their side, when an elderly parent living alone needs help, or when a situation feels urgent but doesn't require an ambulance. Our background-verified Partners are available around the clock, every day of the year, and reach you as fast as your city's traffic allows.",
      },
      {
        heading: "Who actually needs this service?",
        body: "This service is built for people who don't have a backup plan for the odd hours. Students living away from family, working professionals whose parents live alone in another city, or anyone facing a sudden situation late at night — a fall, a scare, a need for someone to simply be present — can book a Partner without waiting for morning. It's also useful when your regular caregiver is unavailable and you need reliable, verified stand-in support on short notice.",
      },
      {
        heading: "How urgent support booking works",
        body: "Booking takes under two minutes on WhatsApp. Message us, share the address and situation, and our team matches the nearest available, background-verified Partner. You get their name and photo before they arrive. Billing starts only when you share the Start PIN at your door and ends when you share the End PIN — so you're always billed for actual time, never guesswork. Payment is collected after the visit via UPI, with zero advance payment.",
      },
      {
        heading: "What this service is — and isn't",
        body: "It's important to be clear: ROSKYRO Partners provide practical, non-medical assistance and companionship — not medical treatment, diagnosis, or ambulance services. For a genuine medical emergency, always call an ambulance or 102 first. Urgent Support is for situations where a trained, verified, calm presence makes the difference — coordinating with hospital staff, staying with someone until family arrives, running an urgent errand, or simply providing reassurance when no one else can get there in time.",
      },
      {
        heading: "Why families choose ROSKYRO for urgent help",
        body: "Every Partner is background-verified before they're allowed to take a single booking. Pricing is published upfront — ₹269/hr plus a small distance-based arrival fee and GST, all shown before you confirm. There's no subscription, no advance payment, and no hidden charges. You only pay for the time actually worked, tracked transparently with Start and End PINs that you control.",
      },
    ],
    faqs: [
      {
        q: "Is 24x7 Urgent Support available every single day, including holidays?",
        a: "Yes. This service runs 24 hours a day, 365 days a year, including weekends and public holidays.",
      },
      {
        q: "How fast can a Partner reach me?",
        a: "Response time depends on Partner availability near your location, but urgent bookings are prioritised and matched as quickly as possible.",
      },
      {
        q: "Does urgent support include medical treatment?",
        a: "No. ROSKYRO Partners provide non-medical assistance and companionship. For medical emergencies, call an ambulance or 102 immediately.",
      },
      {
        q: "How do I pay?",
        a: "There's no advance payment. You pay after the visit is complete, via UPI, based on actual time worked.",
      },
    ],
  },
  {
    slug: "hospital-concierge",
    icon: "🏥",
    name: "Hospital Concierge",
    hourly_rate: 249,
    category: "Hospital Assistance",
    title: "Hospital Concierge Service — Admission to Discharge Support",
    metaTitle: "Hospital Concierge Service | Admission to Discharge — ROSKYRO",
    metaDescription:
      "ROSKYRO's Hospital Concierge handles admission, attendant coordination, and discharge support so your family isn't navigating a hospital alone. Verified Partners, ₹249/hr, pay after service.",
    keywords: [
      "hospital concierge service India",
      "hospital admission assistance",
      "attendant coordination service",
      "hospital discharge help",
      "hospital companion service near me",
    ],
    excerpt:
      "Admission → discharge, attendant coordination — a Partner who knows how hospitals work, right beside your family.",
    readTime: "5 min read",
    heroTagline: "Hospitals are confusing. Your Partner isn't.",
    sections: [
      {
        heading: "What is a Hospital Concierge?",
        body: "A hospital stay involves dozens of small, exhausting logistics — admission paperwork, finding the right counters, coordinating with attendants, tracking reports, and eventually managing discharge. ROSKYRO's Hospital Concierge is a verified Partner who takes on exactly this load, standing in for family members who can't always be physically present, or supporting them so no one has to figure it all out alone.",
      },
      {
        heading: "What's covered from admission to discharge",
        body: "Your Partner can assist with admission formalities, guide family or patients through hospital departments, coordinate with ward attendants and nursing staff for routine updates, keep track of appointment timings, and help organise the discharge process — including paperwork follow-ups and arranging transport home. It's the steady, present help that turns a stressful hospital visit into a managed one.",
      },
      {
        heading: "Who this service is for",
        body: "Families with an out-of-town relative admitted in hospital, working professionals who can't take unlimited leave to sit at a hospital all day, elderly patients who need someone alongside them for coordination, and anyone who simply needs an extra, capable set of hands during a hospital stay.",
      },
      {
        heading: "How booking a Hospital Concierge works",
        body: "Message ROSKYRO on WhatsApp with the hospital name, patient details, and what's needed. A background-verified Partner is matched and shared with you — name and photo included — before arrival. Billing runs on Start PIN to End PIN, so you pay only for actual time on the ground, and payment happens after the visit, not before.",
      },
      {
        heading: "Why families trust ROSKYRO in hospitals",
        body: "Every Partner is background-verified. Pricing is transparent at ₹249/hr plus a small arrival fee and GST, all disclosed before you confirm. There's no advance payment — you settle the bill via UPI once the concierge visit is complete, based on the exact hours worked.",
      },
    ],
    faqs: [
      {
        q: "Can the Hospital Concierge talk to doctors on our behalf?",
        a: "The Partner coordinates logistics and stays present with the patient or family, but medical decisions and conversations with doctors remain with the family — the Partner supports and relays, not replaces, that communication.",
      },
      {
        q: "Can I book for just the discharge process?",
        a: "Yes, you can book a Partner specifically for admission, an ongoing stay, discharge, or all of it — whatever your family needs.",
      },
      {
        q: "Is this a medical or nursing service?",
        a: "No, ROSKYRO Hospital Concierge is non-medical coordination and companionship support, not clinical care.",
      },
      {
        q: "How is billing calculated?",
        a: "You're billed for actual time worked between the Start PIN and End PIN, plus a small arrival fee and 18% GST — all shown as an estimate before you confirm the booking.",
      },
    ],
  },
  {
    slug: "elderly-care-concierge",
    icon: "👴",
    name: "Elderly Care Concierge",
    hourly_rate: 229,
    category: "Elder Care",
    title: "Elderly Care Concierge — Hospital Visits, Appointments & Assistance",
    metaTitle: "Elderly Care Concierge Service | Companion for Seniors — ROSKYRO",
    metaDescription:
      "ROSKYRO's Elderly Care Concierge accompanies seniors to hospital visits and appointments, with everyday assistance in between. Background-verified Partners at ₹229/hr, pay after the visit.",
    keywords: [
      "elderly care concierge service",
      "senior citizen companion service India",
      "elder care assistance near me",
      "help for elderly parents living alone",
      "elderly appointment accompaniment service",
    ],
    excerpt:
      "Hospital visits, appointments, and everyday assistance — steady companionship for the elderly parent you can't always be with.",
    readTime: "5 min read",
    heroTagline: "For the parent you wish you could visit more often.",
    sections: [
      {
        heading: "What is the Elderly Care Concierge?",
        body: "Many families live far from ageing parents, and the guilt of not being able to accompany them to a routine checkup or sit with them through a quiet afternoon is real. ROSKYRO's Elderly Care Concierge is a background-verified Partner who provides exactly this — companionship, accompaniment, and practical assistance for seniors, on a schedule that fits your family's needs.",
      },
      {
        heading: "What's included",
        body: "Your Partner can accompany elderly family members to hospital visits and doctor appointments, assist with daily errands, provide companionship at home, help with mobility around the house or outside, and generally be a dependable, verified presence when family can't be there in person.",
      },
      {
        heading: "Who needs this service",
        body: "Adult children living in a different city or country from ageing parents, elderly individuals living alone who need occasional or regular support, and families wanting a trusted, background-checked companion for a parent's routine medical visits or day-to-day needs.",
      },
      {
        heading: "How it works",
        body: "Book on WhatsApp with the address, timing, and what kind of support your parent needs. A verified Partner is matched, and you receive their name and photo in advance so you know exactly who's arriving. The Start PIN and End PIN mark the beginning and end of billed time, and payment happens after the visit — never before.",
      },
      {
        heading: "Why ROSKYRO for elder care",
        body: "Trust matters most when it comes to elderly parents. Every Partner is background-verified before taking bookings, pricing is fully published at ₹229/hr plus a small arrival fee and GST, and there's no advance payment. You get transparency at every step — from who's coming, to what it costs, to how long they stayed.",
      },
    ],
    faqs: [
      {
        q: "Can I book recurring visits for my parent?",
        a: "Yes, you can book the Elderly Care Concierge for one-off appointments or arrange regular, repeated visits based on your parent's routine.",
      },
      {
        q: "Is this service for medical care or nursing?",
        a: "No, this is companionship and non-medical assistance — accompanying, coordinating, and being present. It doesn't include clinical or nursing care.",
      },
      {
        q: "Will I know who is visiting my parent in advance?",
        a: "Yes, you receive the Partner's name and photo before they arrive, and every Partner is background-verified.",
      },
      {
        q: "What if the visit runs longer than planned?",
        a: "You're billed for actual time worked, tracked via Start and End PIN, so extra time is simply reflected in the final bill rather than requiring a whole new booking.",
      },
    ],
  },
  {
    slug: "medical-travel-concierge",
    icon: "✈️",
    name: "Medical Travel Concierge",
    hourly_rate: 349,
    category: "Travel Assistance",
    title: "Medical Travel Concierge — Outstation Patient Journey Support",
    metaTitle: "Medical Travel Concierge | Outstation Patient Support — ROSKYRO",
    metaDescription:
      "Travelling from another city for treatment? ROSKYRO's Medical Travel Concierge covers city arrival, hospital, stay, treatment, and return — one verified Partner, ₹349/hr, pay after service.",
    keywords: [
      "medical travel concierge India",
      "outstation patient assistance service",
      "help for patients travelling for treatment",
      "medical tourism support India",
      "patient escort service city hospital",
    ],
    excerpt:
      "Outstation patient → city → hospital → stay → treatment → return, handled end to end by one verified Partner.",
    readTime: "6 min read",
    heroTagline: "A familiar face in an unfamiliar city.",
    sections: [
      {
        heading: "What is the Medical Travel Concierge?",
        body: "Travelling to another city for treatment is stressful enough without also navigating an unknown hospital system, arranging local stay, and figuring out transport at every step. ROSKYRO's Medical Travel Concierge is built for exactly this journey — a single, background-verified Partner who supports outstation patients from the moment they arrive in the city through treatment and until they head home.",
      },
      {
        heading: "The full journey, covered",
        body: "This service can support patients across the whole arc of an outstation medical visit: reception on arrival in the city, transport coordination to the hospital, help settling into local stay arrangements, accompaniment during treatment days, and coordination for the return journey once treatment is complete. It's designed so patients and their families deal with one dependable point of contact instead of juggling unfamiliar logistics alone.",
      },
      {
        heading: "Who this service is for",
        body: "Patients travelling from smaller towns to bigger cities for specialised treatment, families who can send a patient for treatment but can't accompany them the whole way, and anyone facing a multi-day outstation treatment plan who needs steady, verified, local support in an unfamiliar city.",
      },
      {
        heading: "How to book Medical Travel Concierge",
        body: "Reach out on WhatsApp with travel dates, the hospital or clinic, and the kind of support needed across the visit. ROSKYRO matches a background-verified Partner and shares their name and photo before the journey begins. Billing is based on actual hours worked — tracked via Start PIN and End PIN — and settled after the service, with no advance payment required.",
      },
      {
        heading: "Why families trust ROSKYRO for medical travel",
        body: "At ₹349/hr, this is a premium, end-to-end support service reflecting the coordination it covers — arrival, hospital, stay, treatment, and return. Pricing, including the arrival fee and GST, is shown transparently before you confirm. Every Partner is background-verified, and payment is collected only after the visit is complete, via UPI.",
      },
    ],
    faqs: [
      {
        q: "Does this include booking my hospital appointment or hotel?",
        a: "The Partner coordinates and accompanies you through these steps, but bookings like hospital appointments or hotel stays should be confirmed by the family in advance; the Partner helps you navigate them once you're in the city.",
      },
      {
        q: "Can the Concierge stay with the patient for multiple days?",
        a: "Yes, you can book support across multiple days of an outstation treatment journey depending on your requirement.",
      },
      {
        q: "Is transport included in the hourly rate?",
        a: "The hourly rate covers the Partner's time and coordination. Any transport, hospital, or stay costs are separate and paid directly by the patient or family.",
      },
      {
        q: "How do I know the Partner is trustworthy for a multi-day trip?",
        a: "All ROSKYRO Partners are background-verified before they're allowed to take bookings, and you receive their name and photo before the journey starts.",
      },
    ],
  },
  {
    slug: "diagnostic-concierge",
    icon: "🧪",
    name: "Diagnostic Concierge",
    hourly_rate: 179,
    category: "Diagnostics",
    title: "Diagnostic Concierge — Test Booking to Report Collection",
    metaTitle: "Diagnostic Concierge Service | Test & Report Support — ROSKYRO",
    metaDescription:
      "ROSKYRO's Diagnostic Concierge handles test booking, diagnostic centre coordination, and report collection so you don't have to make the trip. Verified Partners at ₹179/hr, pay after service.",
    keywords: [
      "diagnostic concierge service India",
      "lab test booking assistance",
      "diagnostic centre coordination service",
      "medical report collection service",
      "lab report pickup near me",
    ],
    excerpt:
      "Test booking → centre coordination → report collection — one less trip for you to make.",
    readTime: "4 min read",
    heroTagline: "Skip the queue. Get the report handled.",
    sections: [
      {
        heading: "What is the Diagnostic Concierge?",
        body: "Between booking a diagnostic test, reaching the centre at the right time, and later making a separate trip to collect the report, a simple lab test can eat up an entire day. ROSKYRO's Diagnostic Concierge is a verified Partner who manages this loop for you — coordinating the test booking, visiting the diagnostic centre, and collecting the report on your behalf.",
      },
      {
        heading: "What's included",
        body: "Your Partner can help coordinate appointment timing with the diagnostic centre, accompany a patient for the test if needed, and separately handle report collection once results are ready — saving families a second trip across the city just to pick up a printout.",
      },
      {
        heading: "Who needs this service",
        body: "Busy professionals who can't take time off for routine diagnostic errands, families managing tests for an elderly or homebound patient, and anyone who'd rather have a verified Partner handle centre coordination and report pickup than lose half a day to it.",
      },
      {
        heading: "How to book",
        body: "Message ROSKYRO on WhatsApp with the diagnostic centre details and what's needed — accompaniment for the test, report collection, or both. A background-verified Partner is assigned and shared with you in advance. Billing runs on Start PIN to End PIN for actual time spent, and you pay after the task is complete, with no advance payment.",
      },
      {
        heading: "Why this service is worth it",
        body: "At ₹179/hr, it's ROSKYRO's most accessible service — designed for a quick, well-defined task rather than a long visit. Pricing including the arrival fee and GST is shown upfront before you confirm, and every Partner is background-verified before handling your reports or accompanying a family member.",
      },
    ],
    faqs: [
      {
        q: "Can the Partner collect reports from a diagnostic centre without the patient present?",
        a: "Yes, report collection can typically be handled independently, subject to the diagnostic centre's own ID or authorisation requirements — check with the centre for their specific policy.",
      },
      {
        q: "Can I book just for test accompaniment, without report collection?",
        a: "Yes, you can book the Diagnostic Concierge for test booking coordination, accompaniment, report collection, or a combination — based on what you need.",
      },
      {
        q: "How quickly can this be arranged?",
        a: "Booking takes a couple of minutes on WhatsApp, and a Partner is matched based on availability near the diagnostic centre.",
      },
      {
        q: "What's the minimum billed time?",
        a: "Billing follows actual time worked between the Start PIN and End PIN, with a fair minimum floor — details are shown in your estimate before you confirm.",
      },
    ],
  },
  {
    slug: "post-discharge-concierge",
    icon: "🏠",
    name: "Post-Discharge Concierge",
    hourly_rate: 209,
    category: "Recovery Support",
    title: "Post-Discharge Concierge — Hospital to Home Transition Support",
    metaTitle: "Post-Discharge Concierge Service | Home Recovery — ROSKYRO",
    metaDescription:
      "ROSKYRO's Post-Discharge Concierge manages the hospital-to-home transition and follow-up coordination, so recovery at home starts smoothly. Background-verified Partners, pay after service.",
    keywords: [
      "post discharge concierge service",
      "hospital to home transition support",
      "post discharge care India",
      "home recovery support service",
      "follow-up appointment coordination after hospital",
    ],
    excerpt:
      "Hospital → home transition + follow-up coordination — because recovery doesn't stop at the hospital gate.",
    readTime: "5 min read",
    heroTagline: "Discharge is just the beginning of recovery.",
    sections: [
      {
        heading: "What is the Post-Discharge Concierge?",
        body: "The hours right after a hospital discharge are often the most disorganised — arranging transport home, settling the patient in, and remembering every follow-up instruction the hospital gave. ROSKYRO's Post-Discharge Concierge is a verified Partner who smooths this transition, helping families move from hospital to home without the usual scramble, and staying involved for follow-up coordination afterward.",
      },
      {
        heading: "What's covered",
        body: "Support can include helping organise the journey from hospital to home, settling the patient in comfortably, keeping track of follow-up appointments and medication schedules as communicated by the hospital, and coordinating any subsequent visits needed during early recovery — all non-medical, practical support around a patient who just came home.",
      },
      {
        heading: "Who this service is for",
        body: "Families bringing home an elderly or recovering patient who needs a smoother transition, working professionals who can't be present for the entire discharge-day logistics, and anyone who wants a steady, verified hand during the first vulnerable days at home after a hospital stay.",
      },
      {
        heading: "How booking works",
        body: "Message ROSKYRO on WhatsApp with discharge details and what kind of transition and follow-up support is needed. A background-verified Partner is matched and introduced with name and photo before arrival. As with every ROSKYRO service, billing is based on actual time worked (Start PIN to End PIN) and settled after the visit — no advance payment.",
      },
      {
        heading: "Why families choose this service",
        body: "Recovery at home goes more smoothly with one less thing to manage. Every Partner is background-verified, pricing is transparent and shown before you confirm, and payment happens only after the service via UPI. It's steady, dependable support exactly when a household is adjusting to having a recovering patient at home.",
      },
    ],
    faqs: [
      {
        q: "Does this include nursing or medical care at home?",
        a: "No, this is non-medical transition and coordination support — helping the patient settle in and tracking follow-ups, not clinical or nursing care.",
      },
      {
        q: "Can I book follow-up visits separately from the discharge day?",
        a: "Yes, you can book the Post-Discharge Concierge just for the discharge-day transition, for later follow-up coordination, or both.",
      },
      {
        q: "How is pricing calculated for this service?",
        a: "Pricing follows ROSKYRO's standard model — an hourly rate plus a small arrival fee and GST, shown as an estimate before you confirm, billed on actual time worked.",
      },
      {
        q: "Is payment required in advance?",
        a: "No, ROSKYRO never requires advance payment. You pay after the service is complete, via UPI.",
      },
    ],
  },
  {
    slug: "concierge-medicine-india",
    icon: "🩺",
    name: "Concierge Medicine in India",
    category: "Concierge Medicine",
    title: "Concierge Medicine in India — What It Is and Who Actually Supports It",
    metaTitle: "Concierge Medicine in India: How It Works & Who Supports the Journey — ROSKYRO",
    metaDescription:
      "Concierge medicine is growing fast in India's metros and tier-2 cities. Here's what it actually means, why families are choosing it, and how ROSKYRO's verified Partners support the non-medical side of that journey — from hospital coordination to elder accompaniment.",
    keywords: [
      "concierge medicine India",
      "concierge medicine services India",
      "personalised healthcare India",
      "concierge doctor service India",
      "private healthcare concierge India",
      "concierge medicine tier 2 cities",
    ],
    excerpt:
      "Concierge medicine is reshaping how Indian families access healthcare — here's what the model actually means, and where non-medical support like ROSKYRO fits in.",
    readTime: "6 min read",
    heroTagline: "Personalised care is growing. So is the need for someone to handle everything around it.",
    sections: [
      {
        heading: "What is concierge medicine, exactly?",
        body: "Concierge medicine started as a model where patients pay a doctor or clinic directly for closer, more personalised attention — shorter waits, longer consultations, direct access to a physician, and care that feels less rushed than a typical hospital OPD visit. In India, the term has widened over the last few years to describe any healthcare experience built around convenience and personal attention: home visits, dedicated care coordinators, priority hospital access, and curated second-opinion networks for families who want more than a standard queue-and-consult experience.",
      },
      {
        heading: "Why concierge medicine is growing across Indian cities",
        body: "A few forces are pushing this shift at once. Nuclear families mean fewer people are physically available to sit through hospital queues or coordinate a parent's diagnostic reports. NRI families managing a parent's healthcare from another country need a dependable local presence, not just a phone update. Tier-2 and tier-3 cities are seeing rising incomes and rising expectations, but hospital infrastructure and staff-to-patient ratios haven't caught up everywhere — so the gap between wanting personalised care and actually getting it is widening, not shrinking.",
      },
      {
        heading: "The part of concierge medicine that usually gets ignored",
        body: "Most conversations about concierge medicine focus on the doctor relationship — access, consultation time, diagnosis quality. But the lived experience of a hospital visit, a diagnostic test, or a parent's recovery at home is made up mostly of logistics: who stands in the admission queue, who tracks down the report, who sits with an elderly patient so they're not alone between visits, who manages the trip home after discharge. This is the layer concierge medicine rarely covers, and it's exactly where families feel the most stress.",
      },
      {
        heading: "Where ROSKYRO fits into the concierge medicine landscape",
        body: "ROSKYRO isn't a clinic and doesn't provide medical treatment, diagnosis, or physician access — that distinction matters and we're upfront about it. What ROSKYRO provides is the non-medical concierge layer around a patient's journey: background-verified Partners who handle hospital admission and discharge coordination, accompany elderly family members to appointments, manage diagnostic centre visits and report collection, and support outstation patients travelling to another city for treatment. Think of it as the practical support system that sits alongside whatever medical care — concierge or otherwise — a family has already arranged.",
      },
      {
        heading: "A different model from traditional concierge retainers",
        body: "Classic concierge medicine often runs on an annual membership or retainer, paid whether or not it's used that month. ROSKYRO works the opposite way — there's no membership and no advance payment. You book a verified Partner on WhatsApp only when you need one, billing is tracked transparently from a Start PIN to an End PIN so you're charged for actual time on the ground, and payment is settled after the visit is complete. Full pricing details for each service are shared upfront during booking, before you confirm anything.",
      },
      {
        heading: "Who this matters most for",
        body: "Families with an out-of-town or NRI relative trying to coordinate an ageing parent's care from a distance. Patients travelling from a smaller town to a metro for specialised treatment who need one dependable local point of contact. Working professionals who can't take repeated leave for hospital logistics but still want a verified, accountable presence for their family. And increasingly, tier-2 city households who want the personalised, well-coordinated experience concierge medicine promises, without needing a premium retainer to get it.",
      },
    ],
    faqs: [
      {
        q: "Is ROSKYRO a concierge medicine provider or a doctor service?",
        a: "No. ROSKYRO is a non-medical concierge and coordination service. Partners handle logistics, accompaniment, and practical support — they don't provide medical treatment, diagnosis, or clinical advice. For medical care, families work with their own doctor or hospital, and ROSKYRO supports everything around that relationship.",
      },
      {
        q: "How is ROSKYRO different from a concierge medicine membership?",
        a: "Traditional concierge medicine typically involves a recurring membership or retainer fee paid to a doctor or clinic. ROSKYRO has no membership — you book a verified Partner only when needed, and pay after the service is complete, based on actual time worked.",
      },
      {
        q: "Can ROSKYRO Partners coordinate with my family's concierge doctor?",
        a: "Partners can help with logistics around appointments — reaching the clinic, coordinating timings, accompanying a patient — but clinical communication and decisions with the doctor remain between the doctor and the family.",
      },
      {
        q: "Is this available outside major metros?",
        a: "ROSKYRO is expanding city by city, with services designed to work well in both large metros and smaller cities where personalised healthcare support is harder to find locally.",
      },
      {
        q: "Where can I see exact pricing?",
        a: "Every service has transparent, published pricing shown on WhatsApp before you confirm a booking, so you always know the cost upfront — there's no hidden fee or advance payment required.",
      },
    ],
  },
];

export function getPostBySlug(slug) {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getRelatedPosts(slug, count = 3) {
  return BLOG_POSTS.filter((p) => p.slug !== slug).slice(0, count);
}
