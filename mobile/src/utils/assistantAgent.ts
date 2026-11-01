import {
  AGRI_PRODUCTS,
  getProductById,
  type AgriProduct,
} from '@/data/agriProducts';
import {
  GOVT_SCHEMES,
  getGovtSchemeById,
  type GovtScheme,
} from '@/data/govtSchemes';
import {
  getAssistantActions,
  getAssistantCardCopy,
  getAssistantStarterPrompts,
  getCropLabel,
  getDiseaseLabel,
  localize,
  type AssistantLanguage,
} from '@/constants/assistant-i18n';
import {
  canonicalizeDisease,
  getDiseaseProfile,
  getTreatmentBundle,
  normalizeCrop,
} from '@/utils/recommendationEngine';

export type AssistantIntent =
  | 'irrigation'
  | 'income-support'
  | 'crop-insurance'
  | 'machinery'
  | 'credit'
  | 'soil-organic'
  | 'crop-health'
  | 'scheme-info'
  | 'general';

export type AssistantQuickActionType =
  | 'crop-doctor'
  | 'govt-schemes'
  | 'agri-shop'
  | 'scheme';

export interface AssistantQuickAction {
  id: string;
  label: string;
  route: string;
  type: AssistantQuickActionType;
  disease?: string;
  crop?: string;
  schemeId?: string;
}

export interface AssistantResponse {
  intent: AssistantIntent;
  replyText: string;
  recommendedSchemes: GovtScheme[];
  recommendedProducts: AgriProduct[];
  quickActions: AssistantQuickAction[];
  detectedDisease?: string;
  detectedCrop?: string;
  source: 'local' | 'remote';
}

export const ASSISTANT_STARTER_PROMPTS = getAssistantStarterPrompts('en');

interface IntentRule {
  intent: AssistantIntent;
  terms: [string, number][];
}

const INTENT_RULES: IntentRule[] = [
  {
    intent: 'irrigation',
    terms: [
      ['drip', 6],
      ['sprinkler', 6],
      ['micro irrigation', 6],
      ['solar pump', 6],
      ['pm kusum', 7],
      ['kusum', 6],
      ['pmksy', 7],
      ['irrigation', 4],
      ['borewell', 3],
      ['sinchai', 4],
      ['sinchayi', 4],
      ['water source', 3],
      ['pump', 3],
      ['water', 1],
      ['सिंचाई', 5],
      ['सिंचन', 5],
      ['ठिबक', 6],
      ['ठिबक सिंचन', 7],
      ['ड्रिप', 6],
      ['स्प्रिंकलर', 6],
      ['सोलर पंप', 7],
      ['सौर पंप', 7],
      ['सोलर', 3],
      ['पंप', 3],
      ['जल स्रोत', 3],
      ['पाण्याचा स्रोत', 3],
      ['कुआं', 3],
      ['विहीर', 3],
    ],
  },
  {
    intent: 'income-support',
    terms: [
      ['pm kisan', 7],
      ['pmkisan', 7],
      ['kisan samman', 7],
      ['6000', 6],
      ['cash support', 5],
      ['income support', 5],
      ['installment', 4],
      ['instalment', 4],
      ['direct benefit', 3],
      ['cash', 2],
      ['पीएम किसान', 7],
      ['प्रधानमंत्री किसान', 7],
      ['किसान सम्मान', 7],
      ['नकद सहायता', 5],
      ['आय सहायता', 5],
      ['किस्त', 4],
      ['हप्ता', 4],
      ['हफ्ता', 4],
      ['रोख सहाय्य', 5],
    ],
  },
  {
    intent: 'crop-insurance',
    terms: [
      ['pmfby', 7],
      ['fasal bima', 7],
      ['crop insurance', 6],
      ['insurance', 3],
      ['crop damage', 6],
      ['damaged', 3],
      ['unseasonal rain', 6],
      ['heavy rain', 4],
      ['drought', 5],
      ['flood', 3],
      ['hailstorm', 3],
      ['yield loss', 4],
      ['claim', 2],
      ['फसल बीमा', 7],
      ['पीक विमा', 7],
      ['बीमा', 4],
      ['विमा', 4],
      ['फसल खराब', 6],
      ['पीक खराब', 6],
      ['बेमौसम बारिश', 6],
      ['अवेळी पाऊस', 6],
      ['सूखा', 5],
      ['दुष्काळ', 5],
      ['बाढ़', 3],
      ['पूर', 3],
      ['ओला', 3],
      ['गारपीट', 3],
      ['नुकसान', 3],
      ['दावा', 2],
    ],
  },
  {
    intent: 'machinery',
    terms: [
      ['namo drone', 7],
      ['drone', 6],
      ['tractor', 6],
      ['rotavator', 4],
      ['harvester', 4],
      ['tiller', 3],
      ['farm machinery', 6],
      ['agricultural machinery', 6],
      ['smam', 7],
      ['equipment subsidy', 4],
      ['machine', 2],
      ['ड्रोन', 6],
      ['ट्रैक्टर', 6],
      ['ट्रॅक्टर', 6],
      ['रोटावेटर', 4],
      ['हार्वेस्टर', 4],
      ['कृषि यंत्र', 6],
      ['शेती यंत्र', 6],
      ['मशीनरी', 5],
      ['यंत्र', 3],
      ['उपकरण', 2],
    ],
  },
  {
    intent: 'credit',
    terms: [
      ['kcc', 7],
      ['kisan credit card', 7],
      ['credit card', 4],
      ['4 interest', 5],
      ['low interest', 5],
      ['crop loan', 5],
      ['working capital', 3],
      ['loan', 3],
      ['interest', 2],
      ['केसीसी', 7],
      ['किसान क्रेडिट कार्ड', 7],
      ['क्रेडिट कार्ड', 4],
      ['फसल ऋण', 5],
      ['पीक कर्ज', 5],
      ['कर्ज', 4],
      ['ऋण', 4],
      ['ब्याज', 3],
      ['व्याज', 3],
      ['लोन', 3],
    ],
  },
  {
    intent: 'soil-organic',
    terms: [
      ['soil test', 7],
      ['soil testing', 7],
      ['soil health', 7],
      ['soil health card', 7],
      ['mahadbt', 7],
      ['organic', 5],
      ['bio fertilizer', 4],
      ['bio fertiliser', 4],
      ['vermicompost', 4],
      ['compost', 3],
      ['state subsidy', 4],
      ['state subsidies', 4],
      ['nutrient', 2],
      ['मिट्टी परीक्षण', 7],
      ['माती परीक्षण', 7],
      ['मिट्टी स्वास्थ्य', 7],
      ['माती आरोग्य', 7],
      ['मृदा', 5],
      ['जैविक', 5],
      ['सेंद्रिय', 5],
      ['जैव उर्वरक', 4],
      ['सेंद्रिय खत', 4],
      ['वर्मीकम्पोस्ट', 4],
      ['कंपोस्ट', 3],
      ['महाडीबीटी', 7],
    ],
  },
  {
    intent: 'crop-health',
    terms: [
      ['late blight', 7],
      ['early blight', 7],
      ['blight', 5],
      ['powdery mildew', 7],
      ['mildew', 4],
      ['leaf rust', 6],
      ['rust', 4],
      ['leaf spot', 5],
      ['dark spot', 5],
      ['yellow leaves', 6],
      ['yellow leaf', 6],
      ['yellowing', 4],
      ['aphid', 6],
      ['fungus', 5],
      ['fungal', 4],
      ['fungicide', 5],
      ['fertilizer', 4],
      ['fertiliser', 4],
      ['pesticide', 4],
      ['spray', 3],
      ['pest', 3],
      ['tomato', 1],
      ['potato', 1],
      ['लेट ब्लाइट', 7],
      ['पाउडरी मिल्ड्यू', 7],
      ['भुरी', 5],
      ['रतुआ', 5],
      ['तांबेरा', 5],
      ['माहू', 6],
      ['मावा', 6],
      ['पत्ती धब्बे', 5],
      ['पानांवर ठिपके', 5],
      ['पीले पत्ते', 6],
      ['पिवळी पाने', 6],
      ['पीलापन', 4],
      ['कवक', 5],
      ['फफूंद', 5],
      ['फवारणी', 4],
      ['छिड़काव', 4],
      ['खाद', 4],
      ['उर्वरक', 4],
      ['खत', 4],
      ['कीट', 3],
      ['कीड', 3],
      ['टमाटर', 1],
      ['टोमॅटो', 1],
      ['आलू', 1],
      ['बटाटा', 1],
      ['गेहूं', 1],
      ['गहू', 1],
      ['धान', 1],
      ['भात', 1],
      ['कपास', 1],
      ['कापूस', 1],
      ['गन्ना', 1],
      ['ऊस', 1],
      ['अंगूर', 1],
      ['द्राक्ष', 1],
      ['मिर्च', 1],
      ['मिरची', 1],
      ['मक्का', 1],
      ['मका', 1],
    ],
  },
  {
    intent: 'scheme-info',
    terms: [
      ['scheme', 1],
      ['schemes', 1],
      ['yojana', 2],
      ['subsidy', 1],
      ['government support', 2],
      ['योजना', 2],
      ['योजनाएं', 2],
      ['सरकारी सहायता', 2],
      ['सरकारी मदत', 2],
      ['अनुदान', 2],
      ['सब्सिडी', 2],
    ],
  },
];

const SEARCH_STOPWORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'from',
  'that',
  'this',
  'what',
  'when',
  'where',
  'which',
  'how',
  'can',
  'get',
  'apply',
  'tell',
  'about',
  'government',
  'scheme',
  'schemes',
  'subsidy',
  'subsidies',
  'yojana',
  'farmer',
  'farmers',
  'india',
  'indian',
]);

const ASSISTANT_ENDPOINT = process.env.EXPO_PUBLIC_ASSISTANT_API_URL;

type LocalizedAgronomyText = Record<AssistantLanguage, string>;

type AgronomyCropField =
  | 'sowing'
  | 'water'
  | 'nutrition'
  | 'harvest'
  | 'watch';

interface AgronomyTopic {
  id: string;
  terms: [string, number][];
  title: LocalizedAgronomyText;
  intro: LocalizedAgronomyText;
  assessment: LocalizedAgronomyText[];
  steps: LocalizedAgronomyText[];
  tips: LocalizedAgronomyText[];
  warning: LocalizedAgronomyText;
  schemeIds: string[];
  productIds: string[];
  productCategories: AgriProduct['category'][];
  preferCropDoctor: boolean;
}

interface AgronomyCropGuide {
  aliases: string[];
  label: LocalizedAgronomyText;
  sowing: LocalizedAgronomyText;
  water: LocalizedAgronomyText;
  nutrition: LocalizedAgronomyText;
  harvest: LocalizedAgronomyText;
  watch: LocalizedAgronomyText;
}

function agronomyText(
  en: string,
  hi: string,
  mr: string
): LocalizedAgronomyText {
  return { en, hi, mr };
}

const AGRONOMY_UI = {
  question: agronomyText(
    'Your question',
    'आपका प्रश्न',
    'तुमचा प्रश्न'
  ),
  assessment: agronomyText(
    'Field assessment',
    'खेत की जांच',
    'शेत तपासणी'
  ),
  actionPlan: agronomyText(
    'Action plan',
    'काम की योजना',
    'कामाची योजना'
  ),
  cropNote: agronomyText(
    'Crop note',
    'फसल नोट',
    'पीक टीप'
  ),
  expertTips: agronomyText(
    'Expert tips',
    'विशेषज्ञ सुझाव',
    'तज्ज्ञ सूचना'
  ),
  support: agronomyText(
    'Support matched to this answer',
    'इस उत्तर से जुड़ी सहायता',
    'या उत्तराशी जोडलेले सहाय्य'
  ),
  safety: agronomyText(
    'Safety and local check',
    'सुरक्षा और स्थानीय जांच',
    'सुरक्षितता आणि स्थानिक तपासणी'
  ),
  schemeSupport: agronomyText(
    'Scheme support',
    'योजना सहायता',
    'योजना सहाय्य'
  ),
  inputSupport: agronomyText(
    'Matching farm inputs are shown below. Confirm the active ingredient, label dose and pre-harvest interval before use.',
    'मिलते-जुलते कृषि इनपुट नीचे दिखाए गए हैं। उपयोग से पहले सक्रिय तत्व, लेबल खुराक और कटाई से पहले की अवधि जरूर जांचें।',
    'जुळणारे शेती साहित्य खाली दाखवले आहे. वापरण्यापूर्वी सक्रिय घटक, लेबलावरील मात्रा आणि कापणीपूर्व कालावधी नक्की तपासा.'
  ),
  closing: agronomyText(
    'For a more precise plan, share your district, soil type, crop stage and a clear photo. For pesticide doses, always follow the product label and your local KVK.',
    'अधिक सटीक योजना के लिए अपना जिला, मिट्टी का प्रकार, फसल की अवस्था और साफ फोटो भेजें। कीटनाशक की खुराक हमेशा उत्पाद लेबल और स्थानीय KVK के अनुसार ही लें।',
    'अधिक अचूक आराखड्यासाठी तुमचा जिल्हा, मातीचा प्रकार, पिकाची अवस्था आणि स्पष्ट फोटो पाठवा. कीटकनाशकाची मात्रा नेहमी उत्पादनाच्या लेबलानुसार आणि स्थानिक KVK च्या सल्ल्यानेच वापरा.'
  ),
  cropFields: {
    sowing: agronomyText(
      'Sowing window',
      'बुवाई का समय',
      'पेरणीची वेळ'
    ),
    water: agronomyText(
      'Water',
      'सिंचाई',
      'पाणी व्यवस्थापन'
    ),
    nutrition: agronomyText(
      'Nutrition',
      'पोषण',
      'पोषण'
    ),
    harvest: agronomyText(
      'Harvest',
      'कटाई',
      'काढणी'
    ),
    watch: agronomyText(
      'Watch for',
      'इन पर नजर रखें',
      'याकडे लक्ष द्या'
    ),
  } satisfies Record<AgronomyCropField, LocalizedAgronomyText>,
};

const AGRONOMY_CROP_FIELDS: Record<string, AgronomyCropField[]> = {
  soil: ['sowing', 'nutrition', 'watch'],
  water: ['water', 'watch'],
  nutrient: ['nutrition', 'water', 'watch'],
  pest: ['watch', 'water'],
  organic: ['nutrition', 'watch'],
  harvest: ['harvest', 'watch'],
  rotation: ['sowing', 'nutrition'],
  establishment: ['sowing', 'water', 'watch'],
  weed: ['sowing', 'watch'],
  livestock: [],
  weather: ['sowing', 'water', 'watch'],
  market: ['harvest', 'watch'],
  planning: ['sowing', 'water', 'harvest'],
  orchard: ['sowing', 'water', 'nutrition', 'harvest', 'watch'],
  general: [],
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[₹,]/g, '')
    .replace(/[^a-z0-9\u0900-\u097F]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getSchemes(ids: string[]): GovtScheme[] {
  return ids
    .map((id) => getGovtSchemeById(id))
    .filter((scheme): scheme is GovtScheme => Boolean(scheme));
}

function getProducts(ids: string[]): AgriProduct[] {
  return ids
    .map((id) => getProductById(id))
    .filter((product): product is AgriProduct => Boolean(product));
}

function topProductsByCategory(
  categories: AgriProduct['category'][],
  limit = 3
): AgriProduct[] {
  return [...AGRI_PRODUCTS]
    .filter(
      (product) =>
        product.inStock && categories.includes(product.category)
    )
    .sort((left, right) => right.rating - left.rating)
    .slice(0, limit);
}

function browseSchemesAction(
  language: AssistantLanguage
): AssistantQuickAction {
  return {
    id: 'browse-govt-schemes',
    label: getAssistantActions(language).browseSchemes,
    route: '/govt-schemes',
    type: 'govt-schemes',
  };
}

function cropDoctorAction(
  language: AssistantLanguage
): AssistantQuickAction {
  return {
    id: 'open-crop-doctor',
    label: getAssistantActions(language).openCropDoctor,
    route: '/crop-doctor',
    type: 'crop-doctor',
  };
}

function agriShopAction(
  id: string,
  label: string,
  disease?: string,
  crop?: string
): AssistantQuickAction {
  return {
    id,
    label,
    route: '/agri-shop',
    type: 'agri-shop',
    disease,
    crop,
  };
}

function schemeAction(
  schemeId: string,
  label: string
): AssistantQuickAction {
  return {
    id: `open-${schemeId}`,
    label,
    route: `/govt-schemes/${schemeId}`,
    type: 'scheme',
    schemeId,
  };
}

export function detectAssistantIntent(
  query: string
): AssistantIntent | null {
  const normalized = normalizeText(query);
  if (!normalized) return null;

  let bestIntent: AssistantIntent | null = null;
  let bestScore = 0;

  for (const rule of INTENT_RULES) {
    const score = rule.terms.reduce((total, [term, weight]) => {
      return normalized.includes(normalizeText(term))
        ? total + weight
        : total;
    }, 0);

    if (score > bestScore) {
      bestScore = score;
      bestIntent = rule.intent;
    }
  }

  return bestScore > 0 ? bestIntent : null;
}

function inferDiseaseFromQuery(query: string): string | null {
  const normalized = normalizeText(query);

  if (
    normalized.includes('nitrogen') ||
    normalized.includes('pale leaf') ||
    normalized.includes('pale leaves') ||
    normalized.includes('yellow leaf') ||
    normalized.includes('yellow leaves') ||
    normalized.includes('नाइट्रोजन') ||
    normalized.includes('नायट्रोजन') ||
    normalized.includes('पीले पत्ते') ||
    normalized.includes('पिवळी पाने')
  ) {
    return 'Nitrogen Deficiency';
  }

  if (
    normalized.includes('dark spot') ||
    normalized.includes('brown lesion') ||
    normalized.includes('water soaked') ||
    normalized.includes('fruit rot') ||
    normalized.includes('गहरे धब्बे') ||
    normalized.includes('काळे ठिपके') ||
    normalized.includes('फल सड़न') ||
    normalized.includes('फळ सड')
  ) {
    return 'Late Blight';
  }

  if (
    normalized.includes('white powder') ||
    normalized.includes('white spot') ||
    normalized.includes('सफेद पाउडर') ||
    normalized.includes('पांढरी पावडर')
  ) {
    return 'Powdery Mildew';
  }

  if (
    normalized.includes('orange pustule') ||
    normalized.includes('rust spot') ||
    normalized.includes('नारंगी फुंसी') ||
    normalized.includes('नारिंगी फोड')
  ) {
    return 'Leaf Rust';
  }

  if (
    normalized.includes('tiny green insect') ||
    normalized.includes('sticky honeydew') ||
    normalized.includes('चिपचिपा') ||
    normalized.includes('चिकट मध')
  ) {
    return 'Aphid Infestation';
  }

  return null;
}

function getDiseaseSummary(
  language: AssistantLanguage,
  disease: string
): string {
  switch (disease) {
    case 'Late Blight':
      return localize(language, {
        en: 'A fast-spreading water mould disease. Remove infected foliage immediately and begin a protective fungicide programme before symptoms spread to neighbouring plants.',
        hi: 'यह तेज़ी से फैलने वाला रोग है। संक्रमित पत्तियों को तुरंत हटाएं और पड़ोसी पौधों तक फैलने से पहले सुरक्षात्मक फफूंदनाशक कार्यक्रम शुरू करें।',
        mr: 'हा वेगाने पसरणारा रोग आहे. बाधित पाने लगेच काढून टाका आणि शेजारच्या झाडांपर्यंत पसरण्यापूर्वी संरक्षक बुरशीनाशक उपचार सुरू करा.',
      });
    case 'Powdery Mildew':
      return localize(language, {
        en: 'A fungal disease that coats leaves in a white powder and reduces photosynthesis. Early systemic treatment plus improved airflow keeps it from spreading.',
        hi: 'यह एक फफूंद रोग है जो पत्तियों पर सफेद पाउडर की परत बनाता है और प्रकाश संश्लेषण कम करता है। जल्दी उपचार और हवा का बेहतर आवागमन इसका फैलाव रोकता है।',
        mr: 'हा बुरशीजन्य रोग पानांवर पांढरी पावडर तयार करतो आणि प्रकाशसंश्लेषण कमी करतो. लवकर उपचार आणि हवेची चांगली रहदारी यामुळे प्रसार रोखता येतो.',
      });
    case 'Bacterial Leaf Blight':
      return localize(language, {
        en: 'A bacterial infection that spreads quickly in warm, humid conditions. Copper-based protection and field sanitation are critical during the early stages.',
        hi: 'यह एक जीवाणु संक्रमण है जो गर्म और नम मौसम में तेजी से फैलता है। शुरुआती चरण में कॉपर-आधारित सुरक्षा और खेत की सफाई बहुत जरूरी है।',
        mr: 'हे जिवाणूजन्य संक्रमण उष्ण व दमट हवामानात वेगाने पसरते. सुरुवातीच्या टप्प्यात तांबे-आधारित संरक्षण आणि शेताची स्वच्छता महत्त्वाची आहे.',
      });
    case 'Leaf Rust':
      return localize(language, {
        en: 'Rust fungi produce orange-brown pustules that drain nutrients from the leaf. A triazole spray at first symptoms protects the flag leaf and grain fill.',
        hi: 'रस्ट फंगस नारंगी-भूरे फुंसियां बनाता है जो पत्ती से पोषक तत्व खींच लेते हैं। शुरुआती लक्षणों पर ट्राईज़ोल छिड़काव ऊपरी पत्ती और दाने भरने की रक्षा करता है।',
        mr: 'तांबेरा बुरशी नारिंगी-तपकिरी फोड तयार करते आणि पानातील अन्नद्रव्ये शोषून घेते. सुरुवातीच्या लक्षणांवर ट्रायझोल फवारणी वरचे पान आणि दाणे भरण्याचे रक्षण करते.',
      });
    case 'Aphid Infestation':
      return localize(language, {
        en: 'Sap-sucking aphids weaken plants and leave sticky honeydew that invites sooty mould. Target the undersides of leaves and conserve natural predators.',
        hi: 'रस चूसने वाले माहू पौधों को कमजोर करते हैं और चिपचिपा शहद जैसा पदार्थ छोड़ते हैं जिससे काली फफूंद लगती है। पत्तियों के नीचे उपचार करें और प्राकृतिक शत्रुओं को बचाएं।',
        mr: 'रस शोषण करणारे मावा झाडे कमजोर करतात आणि चिकट मधासारखा पदार्थ सोडतात, ज्यामुळे काळी बुरशी येते. पानांच्या खालील बाजूस उपचार करा आणि नैसर्गिक शत्रूंचे संरक्षण करा.',
      });
    case 'Nitrogen Deficiency':
      return localize(language, {
        en: 'Pale yellow leaves and slow growth signal a nitrogen shortfall. A split application of nitrogen plus a balanced nutrient spray helps the crop recover without excess runoff.',
        hi: 'पीले पत्ते और धीमी वृद्धि नाइट्रोजन की कमी का संकेत हैं। नाइट्रोजन की विभाजित मात्रा और संतुलित पोषक छिड़काव से फसल बिना अतिरिक्त बहाव के सुधरती है।',
        mr: 'पिवळी पाने आणि संथ वाढ हे नायट्रोजनच्या कमतरतेचे लक्षण आहे. नायट्रोजनची विभागून दिलेली मात्रा आणि संतुलित अन्नद्रव्य फवारणीमुळे पीक अतिरिक्त वाहून न जाता सुधारते.',
      });
    default:
      return '';
  }
}

function getDiseaseTips(
  language: AssistantLanguage,
  isNutrientIssue: boolean,
  isPestIssue: boolean
): { immediate: string[]; prevention: string[] } {
  if (isNutrientIssue) {
    return {
      immediate: [
        localize(language, {
          en: '• Confirm the deficiency with a soil test or a leaf-colour pattern before applying more nitrogen.',
          hi: '• अधिक नाइट्रोजन डालने से पहले मिट्टी परीक्षण या पत्तियों के रंग के पैटर्न से कमी की पुष्टि करें।',
          mr: '• अधिक नायट्रोजन देण्यापूर्वी माती परीक्षण किंवा पानांच्या रंगाच्या नमुन्यावरून कमतरता तपासा.',
        }),
        localize(language, {
          en: '• Apply nitrogen in a split dose and irrigate lightly so the nutrient reaches the root zone.',
          hi: '• नाइट्रोजन विभाजित मात्रा में दें और हल्की सिंचाई करें ताकि पोषक तत्व जड़ क्षेत्र तक पहुंचे।',
          mr: '• नायट्रोजन विभागून द्या आणि हलके पाणी द्या, जेणेकरून अन्नद्रव्य मुळांच्या भागात पोहोचेल.',
        }),
      ],
      prevention: [
        localize(language, {
          en: '• Incorporate organic matter to improve nutrient retention.',
          hi: '• मिट्टी में जैविक पदार्थ मिलाएं ताकि पोषक तत्व बने रहें।',
          mr: '• मातीत सेंद्रिय पदार्थ मिसळा जेणेकरून अन्नद्रव्य टिकून राहतील.',
        }),
        localize(language, {
          en: '• Avoid applying urea to dry soil or immediately before heavy rain.',
          hi: '• सूखी मिट्टी में या भारी बारिश से ठीक पहले यूरिया न डालें।',
          mr: '• कोरड्या मातीत किंवा मुसळधार पावसापूर्वी युरिया देऊ नका.',
        }),
      ],
    };
  }

  if (isPestIssue) {
    return {
      immediate: [
        localize(language, {
          en: '• Inspect the undersides of new leaves where aphids cluster and feed.',
          hi: '• नई पत्तियों के नीचे देखें जहां माहू झुंड में बैठकर रस चूसते हैं।',
          mr: '• नवीन पानांच्या खालील बाजूस तपासा, जिथे मावा थव्याने बसून रस शोषतात.',
        }),
        localize(language, {
          en: '• Spot-treat early colonies and remove heavily curled shoots before the infestation spreads.',
          hi: '• शुरुआती झुंडों का स्थानीय उपचार करें और फैलने से पहले अधिक मुड़ी टहनियां हटा दें।',
          mr: '• सुरुवातीच्या थव्यांवर ठराविक फवारणी करा आणि पसरण्यापूर्वी जास्त वळलेल्या शेंड्या काढून टाका.',
        }),
      ],
      prevention: [
        localize(language, {
          en: '• Check the underside of leaves twice a week during dry spells.',
          hi: '• शुष्क मौसम में हफ्ते में दो बार पत्तियों के नीचे जांच करें।',
          mr: '• कोरड्या हवामानात आठवड्यातून दोन वेळा पानांच्या खालील बाजूस तपासा.',
        }),
        localize(language, {
          en: '• Avoid broad-spectrum sprays that kill ladybirds and parasitic wasps.',
          hi: '• ऐसे स्प्रे न करें जो लेडीबर्ड और परजीवी ततैया को मार दें।',
          mr: '• लेडीबर्ड आणि परजीवी भुंगे मारणारी रुंद-स्पेक्ट्रम फवारणी टाळा.',
        }),
      ],
    };
  }

  return {
    immediate: [
      localize(language, {
        en: '• Remove and destroy badly infected leaves away from the field.',
        hi: '• गंभीर रूप से संक्रमित पत्तियों को हटाकर खेत से दूर नष्ट करें।',
        mr: '• गंभीरपणे बाधित पाने काढून शेतापासून दूर नष्ट करा.',
      }),
      localize(language, {
        en: '• Avoid overhead watering and do not work among wet plants.',
        hi: '• ऊपर से सिंचाई न करें और गीले पौधों के बीच काम न करें।',
        mr: '• वरून पाणी देऊ नका आणि ओल्या झाडांमध्ये काम करू नका.',
      }),
    ],
    prevention: [
      localize(language, {
        en: '• Keep infected debris away from the field and clean your tools.',
        hi: '• बाधित अवशेष खेत से दूर रखें और औजार साफ रखें।',
        mr: '• बाधित अवशेष शेतापासून दूर ठेवा आणि अवजारे स्वच्छ ठेवा.',
      }),
      localize(language, {
        en: '• Space plants for airflow so leaves dry quickly.',
        hi: '• पौधों के बीच दूरी रखें ताकि हवा चलती रहे और पत्ते जल्दी सूखें।',
        mr: '• झाडांमध्ये अंतर ठेवा जेणेकरून हवा खेळती राहील आणि पाने लवकर सुकतील.',
      }),
    ],
  };
}

function buildDiseaseResponse(
  query: string,
  language: AssistantLanguage
): AssistantResponse | null {
  const disease =
    canonicalizeDisease(query) ?? inferDiseaseFromQuery(query);
  if (!disease) return null;

  const profile = getDiseaseProfile(disease);
  const crop =
    normalizeCrop(query) ?? profile?.defaultCrop ?? 'Tomato';
  const bundle = getTreatmentBundle(disease, crop);

  if (!bundle) return null;

  const cardCopy = getAssistantCardCopy(language);
  const diseaseLabel = getDiseaseLabel(language, bundle.disease);
  const cropLabel = getCropLabel(language, bundle.crop);
  const productLines = bundle.slots
    .map(
      (slot) =>
        `• ${cardCopy.roles[slot.role]}: ${slot.product.name} — ₹${slot.product.price} / ${slot.product.unit}.`
    )
    .join('\n');

  const isNutrientIssue = bundle.disease === 'Nitrogen Deficiency';
  const isPestIssue = bundle.disease === 'Aphid Infestation';
  const tips = getDiseaseTips(
    language,
    isNutrientIssue,
    isPestIssue
  );
  const summary = getDiseaseSummary(language, bundle.disease);
  const actions = getAssistantActions(language);

  const replyText = localize(language, {
    en: `I found a match for ${diseaseLabel} on ${cropLabel}.

${summary}

Act quickly:
${tips.immediate.join('\n')}
${tips.prevention.join('\n')}

Suggested Agri-Shop plan:
${productLines}

Tip: Confirm the diagnosis with a Crop Doctor photo scan or your local KVK before a large spray. Always follow the label dose and pre-harvest interval.`,
    hi: `मुझे ${cropLabel} पर ${diseaseLabel} से मेल मिला।

${summary}

तुरंत ये कदम उठाएं:
${tips.immediate.join('\n')}
${tips.prevention.join('\n')}

सुझाया गया एग्री-शॉप प्लान:
${productLines}

सुझाव: बड़े छिड़काव से पहले क्रॉप डॉक्टर फोटो स्कैन या अपने नज़दीकी KVK से निदान की पुष्टि करें। लेबल पर दी गई खुराक और फसल कटाई से पहले की अवधि का पालन करें।`,
    mr: `मला ${cropLabel} वरील ${diseaseLabel} शी जुळणी सापडली.

${summary}

तातडीने ही पावले उचला:
${tips.immediate.join('\n')}
${tips.prevention.join('\n')}

सुचवलेला ॲग्री-शॉप आराखडा:
${productLines}

टीप: मोठ्या फवारणीपूर्वी क्रॉप डॉक्टर फोटो स्कॅन किंवा जवळच्या KVK कडून निदानाची पुष्टी करा. लेबलावरील मात्रा आणि कापणीपूर्व कालावधीचे पालन करा.`,
  });

  return {
    intent: 'crop-health',
    replyText,
    recommendedSchemes: [],
    recommendedProducts: bundle.products.slice(0, 3),
    quickActions: [
      cropDoctorAction(language),
      agriShopAction(
        'agri-shop-treatment',
        actions.viewTreatment,
        bundle.disease,
        bundle.crop
      ),
    ],
    detectedDisease: bundle.disease,
    detectedCrop: bundle.crop,
    source: 'local',
  };
}

function buildProductResponse(
  query: string,
  language: AssistantLanguage
): AssistantResponse {
  const normalized = normalizeText(query);
  const crop = normalizeCrop(query);
  const cropLabel = crop ? getCropLabel(language, crop) : null;
  let products: AgriProduct[] = [];
  let focus = localize(language, {
    en: 'crop nutrition and protection',
    hi: 'फसल पोषण और सुरक्षा',
    mr: 'पीक पोषण आणि संरक्षण',
  });

  if (
    normalized.includes('fungicide') ||
    normalized.includes('fungus') ||
    normalized.includes('फफूंद') ||
    normalized.includes('कवक') ||
    normalized.includes('बुरशी')
  ) {
    products = topProductsByCategory(['Fungicides']);
    focus = localize(language, {
      en: 'fungal disease control',
      hi: 'फफूंद रोग नियंत्रण',
      mr: 'बुरशीजन्य रोग नियंत्रण',
    });
  } else if (
    normalized.includes('pesticide') ||
    normalized.includes('pest') ||
    normalized.includes('insect') ||
    normalized.includes('कीट') ||
    normalized.includes('कीड')
  ) {
    products = topProductsByCategory(['Pesticides']);
    focus = localize(language, {
      en: 'pest control',
      hi: 'कीट नियंत्रण',
      mr: 'कीड नियंत्रण',
    });
  } else if (
    normalized.includes('organic') ||
    normalized.includes('bio fertilizer') ||
    normalized.includes('bio fertiliser') ||
    normalized.includes('जैविक') ||
    normalized.includes('सेंद्रिय')
  ) {
    products = topProductsByCategory(['Bio-Cures & Organics', 'Fertilizers']);
    focus = localize(language, {
      en: 'organic nutrition',
      hi: 'जैविक पोषण',
      mr: 'सेंद्रिय पोषण',
    });
  } else {
    products = topProductsByCategory(['Fertilizers', 'Fungicides']);
  }

  const productLines = products
    .map(
      (product) =>
        `• ${product.name} — ₹${product.price} / ${product.unit}.`
    )
    .join('\n');
  const actions = getAssistantActions(language);

  const replyText = localize(language, {
    en: `For ${focus}${cropLabel ? ` in ${cropLabel}` : ''}, start by identifying the exact symptom before spending on inputs.

• Check whether the problem is on old or new leaves, and whether spots are dry, water-soaked or powdery.
• Remove badly affected plant material and avoid overhead irrigation.
• Spray in the early morning or late evening and follow the label dose.

Matched Agri-Shop products:
${productLines}

Tip: Upload a clear leaf photo to Crop Doctor for a closer symptom match before a large purchase.`,
    hi: `${cropLabel ? `${cropLabel} में ` : ''}${focus} के लिए, इनपुट पर खर्च करने से पहले सही लक्षण पहचानें।

• देखें कि समस्या पुरानी या नई पत्तियों पर है, और धब्बे सूखे, पानी से भीगे या पाउडर जैसे हैं।
• अधिक प्रभावित पौधों के हिस्से हटाएं और ऊपर से सिंचाई न करें।
• सुबह जल्दी या शाम को छिड़काव करें और लेबल पर दी गई खुराक का पालन करें।

मिले हुए एग्री-शॉप उत्पाद:
${productLines}

सुझाव: बड़ी खरीद से पहले क्रॉप डॉक्टर पर पत्ती की साफ फोटो अपलोड करें।`,
    mr: `${cropLabel ? `${cropLabel} मधील ` : ''}${focus} साठी, साहित्यावर खर्च करण्यापूर्वी नेमकी लक्षणे ओळखा.

• समस्या जुन्या की नवीन पानांवर आहे आणि ठिपके सुके, पाण्याने भिजलेले की पावडरसारखे आहेत हे तपासा.
• जास्त बाधित झाडाचे भाग काढून टाका आणि वरून पाणी देऊ नका.
• पहाटे किंवा संध्याकाळी फवारणी करा आणि लेबलावरील मात्रेचे पालन करा.

जुळलेली ॲग्री-शॉप उत्पादने:
${productLines}

टीप: मोठी खरेदी करण्यापूर्वी क्रॉप डॉक्टरवर पानाचा स्पष्ट फोटो अपलोड करा.`,
  });

  return {
    intent: 'crop-health',
    replyText,
    recommendedSchemes: [],
    recommendedProducts: products,
    quickActions: [
      cropDoctorAction(language),
      agriShopAction(
        'browse-agri-shop-inputs',
        actions.browseInputs
      ),
    ],
    detectedCrop: crop ?? undefined,
    source: 'local',
  };
}

function tokensForSearch(value: string): string[] {
  return normalizeText(value)
    .split(' ')
    .filter(
      (token) =>
        token.length > 2 && !SEARCH_STOPWORDS.has(token)
    );
}

function findSchemeMatches(query: string): GovtScheme[] {
  const queryTokens = tokensForSearch(query);
  if (queryTokens.length === 0) return [];

  return GOVT_SCHEMES.map((scheme) => {
    const schemeTokens = new Set(
      tokensForSearch(
        `${scheme.title} ${scheme.shortName} ${scheme.category} ${scheme.summary}`
      )
    );
    const score = queryTokens.reduce(
      (total, token) =>
        schemeTokens.has(token) ? total + 1 : total,
      0
    );

    return { scheme, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 2)
    .map((entry) => entry.scheme);
}

function buildSchemeInfoResponse(
  query: string,
  language: AssistantLanguage
): AssistantResponse {
  const schemes = findSchemeMatches(query);
  const actions = getAssistantActions(language);

  if (schemes.length > 0) {
    const list = schemes
      .map(
        (scheme) =>
          `• ${scheme.shortName}: ${scheme.maxBenefit}.`
      )
      .join('\n');

    return {
      intent: 'scheme-info',
      replyText: localize(language, {
        en: `Here are the scheme records closest to your question:

${list}

Open a card below for eligibility, documents and the step-by-step application process. Always confirm current deadlines and state rules on the official portal.`,
        hi: `आपके प्रश्न से सबसे नज़दीक मिलने वाली योजनाएं ये हैं:

${list}

पात्रता, दस्तावेज़ और आवेदन के चरण देखने के लिए नीचे कार्ड खोलें। वर्तमान समय-सीमा और राज्य के नियम आधिकारिक पोर्टल पर जरूर जांचें।`,
        mr: `तुमच्या प्रश्नाशी सर्वात जवळच्या योजना या आहेत:

${list}

पात्रता, कागदपत्रे आणि अर्जाचे टप्पे पाहण्यासाठी खालील कार्ड उघडा. सध्याची अंतिम तारीख आणि राज्याचे नियम अधिकृत पोर्टलवर नक्की तपासा.`,
      }),
      recommendedSchemes: schemes,
      recommendedProducts: [],
      quickActions: [
        browseSchemesAction(language),
        ...schemes.map((scheme) =>
          schemeAction(
            scheme.id,
            actions.openScheme(scheme.shortName)
          )
        ),
      ],
      source: 'local',
    };
  }

  return {
    intent: 'scheme-info',
    replyText: localize(language, {
      en: `I can help you find support for income, crop insurance, irrigation, farm machinery, credit and soil health.

Tell me what you need in your own words — for example, "drip irrigation subsidy" or "loan for seeds" — and I will connect the answer to matching schemes and official portals.`,
      hi: `मैं आय सहायता, फसल बीमा, सिंचाई, कृषि यंत्र, ऋण और मिट्टी स्वास्थ्य के लिए सरकारी सहायता खोजने में मदद कर सकता हूं।

अपनी जरूरत अपने शब्दों में बताएं — जैसे "ठिबक सिंचाई सब्सिडी" या "बीज के लिए लोन" — और मैं उत्तर को मिलती योजनाओं और आधिकारिक पोर्टल से जोड़ूंगा।`,
      mr: `मी उत्पन्न सहाय्य, पीक विमा, सिंचन, शेती यंत्रे, कर्ज आणि माती आरोग्यासाठी सरकारी सहाय्य शोधण्यात मदत करू शकतो.

तुमची गरज तुमच्या शब्दांत सांगा — उदा. "ठिबक सिंचन अनुदान" किंवा "बियाण्यांसाठी कर्ज" — आणि मी उत्तर जुळणाऱ्या योजना व अधिकृत पोर्टलशी जोडेन.`,
    }),
    recommendedSchemes: [],
    recommendedProducts: [],
    quickActions: [
      browseSchemesAction(language),
      cropDoctorAction(language),
    ],
    source: 'local',
  };
}

function buildIrrigationResponse(
  language: AssistantLanguage
): AssistantResponse {
  const actions = getAssistantActions(language);

  return {
    intent: 'irrigation',
    replyText: localize(language, {
      en: `For drip, sprinkler and solar pump support, these are the two strongest matches:

• PM-KUSUM: up to 60% subsidy on standalone solar agricultural pumps, with additional state support where notified.
• PMKSY – Per Drop More Crop: 55% assistance for small and marginal farmers and 45% for other farmers on drip and sprinkler systems.

Practical next steps:
1. Keep Aadhaar, 7/12 land record, bank passbook, water-source proof and an approved supplier quotation ready.
2. Apply through your state agriculture or horticulture portal. PMKSY usually needs a field survey and system design before approval.
3. For solar pumps, confirm the state component and net-metering rules at the district agriculture office.

Tip: Buy only through an empanelled supplier and keep the invoice — it is needed for the subsidy claim.`,
      hi: `ठिबक, स्प्रिंकलर और सोलर पंप सहायता के लिए ये दो सबसे मजबूत विकल्प हैं:

• PM-KUSUM: अलग सोलर कृषि पंप पर 60% तक सब्सिडी, जहां लागू हो वहां अतिरिक्त राज्य सहायता।
• PMKSY – Per Drop More Crop: छोटे और सीमांत किसानों के लिए ठिबक और स्प्रिंकलर पर 55% और अन्य किसानों के लिए 45% सहायता।

व्यावहारिक अगले कदम:
1. आधार, 7/12 भूमि रिकॉर्ड, बैंक पासबुक, जल स्रोत का प्रमाण और अनुमोदित आपूर्तिकर्ता का कोटेशन तैयार रखें।
2. अपने राज्य के कृषि या बागवानी पोर्टल से आवेदन करें। PMKSY में मंजूरी से पहले अक्सर फील्ड सर्वे और सिस्टम डिज़ाइन जरूरी होता है।
3. सोलर पंप के लिए जिला कृषि कार्यालय में राज्य घटक और नेट-मीटरिंग नियमों की पुष्टि करें।

सुझाव: केवल अधिकृत सप्लायर से खरीदें और बिल संभालकर रखें — सब्सिडी दावे के लिए यह जरूरी है।`,
      mr: `ठिबक, स्प्रिंकलर आणि सोलर पंप सहाय्यासाठी हे दोन सर्वात योग्य पर्याय आहेत:

• PM-KUSUM: स्वतंत्र सोलर कृषी पंपावर 60% पर्यंत अनुदान, जिथे लागू असेल तिथे अतिरिक्त राज्य सहाय्य.
• PMKSY – Per Drop More Crop: अल्प व अत्यल्प भूधारक शेतकऱ्यांना ठिबक व स्प्रिंकलरवर 55% आणि इतर शेतकऱ्यांना 45% सहाय्य.

पुढील व्यावहारिक पावले:
1. आधार, 7/12 जमीन नोंद, बँक पासबुक, पाण्याच्या स्रोताचा पुरावा आणि मंजूर पुरवठादाराचे कोटेशन तयार ठेवा.
2. तुमच्या राज्याच्या कृषी किंवा फलोत्पादन पोर्टलवरून अर्ज करा. PMKSY मध्ये मंजुरीपूर्वी सहसा क्षेत्र सर्व्हे आणि सिस्टम डिझाइन आवश्यक असते.
3. सोलर पंपासाठी जिल्हा कृषी कार्यालयाकडे राज्य घटक आणि नेट-मीटरिंग नियम तपासा.

टीप: फक्त अधिकृत पुरवठादाराकडून खरेदी करा आणि बिल जपून ठेवा — अनुदान दाव्यासाठी ते आवश्यक आहे.`,
    }),
    recommendedSchemes: getSchemes(['pm-kusum', 'pmksy']),
    recommendedProducts: [],
    quickActions: [
      browseSchemesAction(language),
      schemeAction('pm-kusum', actions.openPmKusum),
    ],
    source: 'local',
  };
}

function buildIncomeResponse(
  language: AssistantLanguage
): AssistantResponse {
  const actions = getAssistantActions(language);

  return {
    intent: 'income-support',
    replyText: localize(language, {
      en: `PM-KISAN is the direct cash-support scheme you are looking for. It pays ₹6,000 per eligible farmer family every year.

• The amount is released as three ₹2,000 instalments directly into an Aadhaar-linked bank account.
• The scheme has been extended through the 2026–27 to 2030–31 period.
• Institutional landholders, income-tax payers and specified high-income categories are excluded.

How to apply:
1. Open the Farmers Corner on the official PM-KISAN portal and choose New Farmer Registration.
2. Complete Aadhaar e-KYC with the OTP sent to your registered mobile number.
3. Verify your land record and enter the bank account number with IFSC code.
4. Submit the self-declaration and save the registration acknowledgement.

Tip: Complete e-KYC and correct any mismatch between your Aadhaar, bank account and land record before the next instalment cycle.`,
      hi: `PM-KISAN वह सीधी नकद सहायता योजना है जिसकी आपको जरूरत है। यह हर पात्र किसान परिवार को हर साल ₹6,000 देती है।

• राशि तीन ₹2,000 की किस्तों में सीधे आधार से जुड़े बैंक खाते में भेजी जाती है।
• योजना को 2026–27 से 2030–31 की अवधि तक बढ़ाया गया है।
• संस्थागत भूमिधारक, आयकर दाता और निर्दिष्ट उच्च आय वर्ग शामिल नहीं हैं।

आवेदन कैसे करें:
1. आधिकारिक PM-KISAN पोर्टल पर Farmers Corner खोलें और New Farmer Registration चुनें।
2. अपने पंजीकृत मोबाइल नंबर पर आए OTP से आधार e-KYC पूरा करें।
3. अपना भूमि रिकॉर्ड जांचें और IFSC कोड के साथ बैंक खाता संख्या दर्ज करें।
4. स्व-घोषणा जमा करें और पंजीकरण पावती सहेजें।

सुझाव: अगली किस्त से पहले e-KYC पूरा करें और आधार, बैंक खाते व भूमि रिकॉर्ड में किसी भी अंतर को ठीक करें।`,
      mr: `PM-KISAN ही तुम्हाला हवी असलेली थेट रोख सहाय्य योजना आहे. ती प्रत्येक पात्र शेतकरी कुटुंबाला दरवर्षी ₹6,000 देते.

• रक्कम तीन ₹2,000 हप्त्यांमध्ये थेट आधारशी जोडलेल्या बँक खात्यात जमा होते.
• योजना 2026–27 ते 2030–31 या कालावधीसाठी वाढवण्यात आली आहे.
• संस्थात्मक भूधारक, आयकर भरणारे आणि निर्दिष्ट उच्च उत्पन्न गट वगळले आहेत.

अर्ज कसा करायचा:
1. अधिकृत PM-KISAN पोर्टलवर Farmers Corner उघडा आणि New Farmer Registration निवडा.
2. तुमच्या नोंदणीकृत मोबाइल क्रमांकावर आलेल्या OTP ने आधार e-KYC पूर्ण करा.
3. जमीन नोंद तपासा आणि IFSC कोडसह बँक खाते क्रमांक भरा.
4. स्वयंघोषणा सबमिट करा आणि नोंदणी पावती जतन करा.

टीप: पुढील हप्त्यापूर्वी e-KYC पूर्ण करा आणि आधार, बँक खाते व जमीन नोंदीतील तफावत दुरुस्त करा.`,
    }),
    recommendedSchemes: getSchemes(['pm-kisan']),
    recommendedProducts: [],
    quickActions: [
      browseSchemesAction(language),
      schemeAction('pm-kisan', actions.openPmKisan),
    ],
    source: 'local',
  };
}

function buildInsuranceResponse(
  language: AssistantLanguage
): AssistantResponse {
  return {
    intent: 'crop-insurance',
    replyText: localize(language, {
      en: `Pradhan Mantri Fasal Bima Yojana (PMFBY) is the main crop insurance scheme for damage from unseasonal rain, drought, flood, hailstorm, pests and other notified risks.

What to do after crop damage:
1. Report the loss quickly to your bank, insurance company, CSC or the state crop-insurance portal. Many states require notice within 72 hours.
2. Take clear photos of the damaged crop with the field and date visible.
3. Keep the sowing proof, land record, bank details and application or policy number ready.
4. Complete the crop-loss survey and follow the claim status on the PMFBY portal.

• Enrolment usually happens before the seasonal cut-off, so confirm the current window for your crop and district.
• Claims are based on the notified area and yield-loss assessment, not only on individual field estimates.

Tip: Report damage immediately even if the survey team is delayed. A late intimation can weaken the claim.`,
      hi: `प्रधानमंत्री फसल बीमा योजना (PMFBY) बेमौसम बारिश, सूखा, बाढ़, ओलावृष्टि, कीट और अन्य अधिसूचित जोखिमों से फसल नुकसान के लिए मुख्य बीमा योजना है।

फसल खराब होने के बाद क्या करें:
1. नुकसान की सूचना जल्दी अपने बैंक, बीमा कंपनी, CSC या राज्य के फसल बीमा पोर्टल पर दें। कई राज्यों में 72 घंटे के भीतर सूचना जरूरी है।
2. खेत और तारीख दिखाई देने के साथ खराब फसल की साफ तस्वीरें लें।
3. बुवाई का प्रमाण, भूमि रिकॉर्ड, बैंक विवरण और आवेदन या पॉलिसी नंबर तैयार रखें।
4. फसल नुकसान सर्वे पूरा करें और PMFBY पोर्टल पर दावे की स्थिति देखें।

• नामांकन आमतौर पर मौसमी कट-ऑफ से पहले होता है, इसलिए अपनी फसल और जिले के लिए वर्तमान विंडो की पुष्टि करें।
• दावे अधिसूचित क्षेत्र और उपज नुकसान के आकलन पर आधारित होते हैं, केवल व्यक्तिगत खेत के अनुमान पर नहीं।

सुझाव: सर्वे टीम में देरी होने पर भी नुकसान की सूचना तुरंत दें। देर से सूचना देने पर दावा कमजोर हो सकता है।`,
      mr: `प्रधानमंत्री पीक विमा योजना (PMFBY) अवेळी पाऊस, दुष्काळ, पूर, गारपीट, कीड आणि इतर अधिसूचित धोक्यांमुळे होणाऱ्या पीक नुकसानीसाठी मुख्य विमा योजना आहे.

पीक खराब झाल्यानंतर काय करावे:
1. नुकसानीची माहिती लवकर तुमच्या बँक, विमा कंपनी, CSC किंवा राज्याच्या पीक विमा पोर्टलला द्या. अनेक राज्यांत 72 तासांत सूचना आवश्यक आहे.
2. शेत आणि तारीख दिसेल अशा पद्धतीने खराब पिकाचे स्पष्ट फोटो घ्या.
3. पेरणीचा पुरावा, जमीन नोंद, बँक तपशील आणि अर्ज किंवा पॉलिसी क्रमांक तयार ठेवा.
4. पीक नुकसान सर्व्हे पूर्ण करा आणि PMFBY पोर्टलवर दाव्याची स्थिती पहा.

• नोंदणी सहसा हंगामी कट-ऑफपूर्वी होते, त्यामुळे तुमच्या पिकासाठी व जिल्ह्यासाठी सध्याची मुदत तपासा.
• दावे अधिसूचित क्षेत्र आणि उत्पादन नुकसानीच्या मूल्यांकनावर आधारित असतात, केवळ वैयक्तिक शेताच्या अंदाजावर नाही.

टीप: सर्व्हे पथक उशिरा आले तरी नुकसानीची सूचना लगेच द्या. उशिरा दिलेल्या सूचनेमुळे दावा कमजोर होऊ शकतो.`,
    }),
    recommendedSchemes: getSchemes(['pmfby']),
    recommendedProducts: [],
    quickActions: [
      browseSchemesAction(language),
      cropDoctorAction(language),
    ],
    source: 'local',
  };
}

function buildMachineryResponse(
  language: AssistantLanguage
): AssistantResponse {
  const actions = getAssistantActions(language);

  return {
    intent: 'machinery',
    replyText: localize(language, {
      en: `There are two strong routes for farm machinery support:

• Namo Drone Didi: up to 80% central financial assistance, capped at ₹8 lakh per drone package, for eligible women SHGs and Cluster Level Federations. It includes DGCA-approved drone pilot training.
• SMAM: 40%–50% subsidy on tractors, tillers, rotavators, harvesters and other eligible machines, subject to category, state norms and landholding limits.

Practical next steps:
1. Confirm your state's current SMAM component and the approved machine list.
2. Get a quotation from an approved dealer or manufacturer before applying.
3. Apply through the state agriculture department or the AgriMachinery portal and complete verification.
4. For drones, check the SHG/CLF selection process with the district rural development agency.

Tip: Do not buy the machine before written approval. Reimbursement can be rejected if the purchase is made outside the approved process.`,
      hi: `कृषि यंत्र सहायता के लिए दो मजबूत रास्ते हैं:

• नमो ड्रोन दीदी: पात्र महिला SHG और क्लस्टर लेवल फेडरेशन के लिए प्रति ड्रोन पैकेज ₹8 लाख तक सीमित, 80% तक केंद्रीय वित्तीय सहायता। इसमें DGCA-अनुमोदित ड्रोन पायलट प्रशिक्षण शामिल है।
• SMAM: ट्रैक्टर, टिलर, रोटावेटर, हार्वेस्टर और अन्य पात्र मशीनों पर 40%–50% सब्सिडी, जो श्रेणी, राज्य नियमों और भूमि सीमा पर निर्भर है।

व्यावहारिक अगले कदम:
1. अपने राज्य का वर्तमान SMAM घटक और अनुमोदित मशीन सूची की पुष्टि करें।
2. आवेदन से पहले अनुमोदित डीलर या निर्माता से कोटेशन लें।
3. राज्य कृषि विभाग या AgriMachinery पोर्टल से आवेदन करें और सत्यापन पूरा करें।
4. ड्रोन के लिए जिला ग्रामीण विकास एजेंसी से SHG/CLF चयन प्रक्रिया जांचें।

सुझाव: लिखित मंजूरी से पहले मशीन न खरीदें। अनुमोदित प्रक्रिया के बाहर खरीद पर भरपाई अस्वीकार हो सकती है।`,
      mr: `शेती यंत्र सहाय्यासाठी दोन मजबूत मार्ग आहेत:

• नमो ड्रोन दीदी: पात्र महिला SHG आणि क्लस्टर स्तरीय फेडरेशनसाठी प्रति ड्रोन पॅकेज ₹8 लाखापर्यंत मर्यादित, 80% पर्यंत केंद्रीय आर्थिक सहाय्य. यात DGCA-मान्य ड्रोन पायलट प्रशिक्षण समाविष्ट आहे.
• SMAM: ट्रॅक्टर, टिलर, रोटावेटर, हार्वेस्टर आणि इतर पात्र यंत्रांवर 40%–50% अनुदान, जे श्रेणी, राज्य नियम आणि जमीन मर्यादेवर अवलंबून आहे.

पुढील व्यावहारिक पावले:
1. तुमच्या राज्याचा सध्याचा SMAM घटक आणि मंजूर यंत्रसूची तपासा.
2. अर्ज करण्यापूर्वी मंजूर विक्रेता किंवा उत्पादकाकडून कोटेशन घ्या.
3. राज्य कृषी विभाग किंवा AgriMachinery पोर्टलवरून अर्ज करा आणि पडताळणी पूर्ण करा.
4. ड्रोनसाठी जिल्हा ग्रामीण विकास यंत्रणेकडे SHG/CLF निवड प्रक्रिया तपासा.

टीप: लेखी मंजुरीपूर्वी यंत्र खरेदी करू नका. मंजूर प्रक्रियेबाहेर खरेदी केल्यास प्रतिपूर्ती नाकारली जाऊ शकते.`,
    }),
    recommendedSchemes: getSchemes(['namo-drone-didi', 'smam']),
    recommendedProducts: [],
    quickActions: [
      browseSchemesAction(language),
      schemeAction('namo-drone-didi', actions.openNamoDroneDidi),
    ],
    source: 'local',
  };
}

function buildCreditResponse(
  language: AssistantLanguage
): AssistantResponse {
  const actions = getAssistantActions(language);

  return {
    intent: 'credit',
    replyText: localize(language, {
      en: `The Kisan Credit Card (KCC) is the standard low-interest crop loan route for farmers.

• KCC usually carries a 7% interest rate. With the 3% prompt-repayment incentive, eligible farmers can effectively pay about 4%.
• Crop-production limits are generally collateral-free up to ₹3 lakh, subject to bank and scheme norms.
• KCC can cover seeds, fertilisers, pesticides, labour, irrigation and other working-capital needs.
• Apply through your bank, cooperative society, RRB or the bank's KCC portal with land and identity documents.

Practical next steps:
1. Get a crop plan and land record ready.
2. Ask the bank for the applicable scale of finance for your crop and district.
3. Repay on time to keep the 3% prompt-repayment benefit.

Tip: The effective 4% rate depends on repaying within the due date. Confirm the current bank terms before borrowing.`,
      hi: `किसान क्रेडिट कार्ड (KCC) किसानों के लिए मानक कम ब्याज वाला फसल ऋण मार्ग है।

• KCC पर आमतौर पर 7% ब्याज दर होती है। समय पर पुनर्भुगतान पर 3% प्रोत्साहन के साथ पात्र किसानों की प्रभावी दर लगभग 4% हो जाती है।
• फसल उत्पादन सीमा आमतौर पर ₹3 लाख तक बिना जमानत होती है, जो बैंक और योजना नियमों पर निर्भर है।
• KCC बीज, उर्वरक, कीटनाशक, मजदूरी, सिंचाई और अन्य कार्यशील पूंजी जरूरतों को कवर करता है।
• भूमि और पहचान दस्तावेज़ों के साथ अपने बैंक, सहकारी समिति, RRB या बैंक के KCC पोर्टल से आवेदन करें।

व्यावहारिक अगले कदम:
1. फसल योजना और भूमि रिकॉर्ड तैयार रखें।
2. बैंक से अपनी फसल और जिले के लिए लागू वित्त पैमाने के बारे में पूछें।
3. 3% समय पर भुगतान लाभ बनाए रखने के लिए समय पर पुनर्भुगतान करें।

सुझाव: प्रभावी 4% दर देय तिथि के भीतर पुनर्भुगतान पर निर्भर है। उधार लेने से पहले बैंक की वर्तमान शर्तें जांचें।`,
      mr: `किसान क्रेडिट कार्ड (KCC) शेतकऱ्यांसाठी कमी व्याजाचा मानक पीक कर्ज मार्ग आहे.

• KCC वर सहसा 7% व्याजदर असतो. वेळेवर परतफेडीवर 3% प्रोत्साहनासह पात्र शेतकऱ्यांचा प्रभावी दर सुमारे 4% होतो.
• पीक उत्पादन मर्यादा सहसा ₹3 लाखांपर्यंत तारणमुक्त असते, जी बँक व योजना नियमांवर अवलंबून असते.
• KCC बियाणे, खते, कीटकनाशके, मजुरी, सिंचन आणि इतर खेळते भांडवल गरजा भागवू शकते.
• जमीन व ओळखपत्रांसह तुमच्या बँक, सहकारी संस्था, RRB किंवा बँकेच्या KCC पोर्टलवरून अर्ज करा.

पुढील व्यावहारिक पावले:
1. पीक आराखडा आणि जमीन नोंद तयार ठेवा.
2. तुमच्या पिकासाठी व जिल्ह्यासाठी लागू वित्त प्रमाणाबद्दल बँकेला विचारा.
3. 3% वेळेवर परतफेडीचा लाभ टिकवण्यासाठी वेळेवर परतफेड करा.

टीप: प्रभावी 4% दर देय तारखेपर्यंत परतफेडीवर अवलंबून आहे. कर्ज घेण्यापूर्वी बँकेच्या सध्याच्या अटी तपासा.`,
    }),
    recommendedSchemes: getSchemes(['kcc']),
    recommendedProducts: [],
    quickActions: [
      browseSchemesAction(language),
      schemeAction('kcc', actions.openKcc),
    ],
    source: 'local',
  };
}

function buildSoilResponse(
  language: AssistantLanguage
): AssistantResponse {
  const actions = getAssistantActions(language);

  return {
    intent: 'soil-organic',
    replyText: localize(language, {
      en: `For soil health and organic support, these two schemes fit best:

• Soil Health Card: free soil testing and a crop-wise nutrient advisory, helping you avoid unnecessary fertiliser spending.
• MahaDBT Shetkari: Maharashtra's direct-benefit portal for state farmer schemes. The open schemes and subsidy rates change, so check the current list.

Practical next steps:
1. Contact your district agriculture office, Krishi Vigyan Kendra or soil testing laboratory.
2. Register a soil sample with the survey number and crop details.
3. Follow the recommended nutrient dose and re-test as advised.
4. If you are in Maharashtra, create a MahaDBT farmer profile and check open schemes.

Tip: A soil test before buying fertiliser can reduce costs and prevent nutrient imbalance.`,
      hi: `मिट्टी स्वास्थ्य और जैविक सहायता के लिए ये दो योजनाएं सबसे उपयुक्त हैं:

• Soil Health Card: मुफ्त मिट्टी परीक्षण और फसल-वार पोषक सलाह, जिससे अनावश्यक उर्वरक खर्च बचता है।
• MahaDBT Shetkari: महाराष्ट्र की राज्य किसान योजनाओं के लिए डायरेक्ट-बेनिफिट पोर्टल। खुली योजनाएं और सब्सिडी दरें बदलती रहती हैं, इसलिए वर्तमान सूची देखें।

व्यावहारिक अगले कदम:
1. अपने जिला कृषि कार्यालय, कृषि विज्ञान केंद्र या मिट्टी परीक्षण प्रयोगशाला से संपर्क करें।
2. सर्वे नंबर और फसल विवरण के साथ मिट्टी का नमूना दर्ज करें।
3. सुझाई गई पोषक मात्रा का पालन करें और सलाह के अनुसार दोबारा परीक्षण करें।
4. यदि आप महाराष्ट्र में हैं, तो MahaDBT किसान प्रोफाइल बनाएं और खुली योजनाएं देखें।

सुझाव: उर्वरक खरीदने से पहले मिट्टी परीक्षण खर्च कम कर सकता है और पोषक असंतुलन रोक सकता है।`,
      mr: `माती आरोग्य आणि सेंद्रिय सहाय्यासाठी या दोन योजना सर्वात योग्य आहेत:

• Soil Health Card: मोफत माती परीक्षण आणि पिकानुसार अन्नद्रव्य सल्ला, ज्यामुळे अनावश्यक खत खर्च टळतो.
• MahaDBT Shetkari: महाराष्ट्राच्या राज्य शेतकरी योजनांसाठी थेट लाभ पोर्टल. खुल्या योजना आणि अनुदान दर बदलत असतात, त्यामुळे सध्याची यादी पहा.

पुढील व्यावहारिक पावले:
1. तुमच्या जिल्हा कृषी कार्यालय, कृषी विज्ञान केंद्र किंवा माती परीक्षण प्रयोगशाळेशी संपर्क करा.
2. सर्व्हे क्रमांक आणि पीक तपशीलासह मातीचा नमुना नोंदवा.
3. शिफारस केलेली अन्नद्रव्य मात्रा पाळा आणि सल्ल्यानुसार पुन्हा तपासणी करा.
4. तुम्ही महाराष्ट्रात असल्यास MahaDBT शेतकरी प्रोफाइल तयार करा आणि खुल्या योजना पहा.

टीप: खत खरेदीपूर्वी माती परीक्षण केल्यास खर्च कमी होतो आणि अन्नद्रव्य असंतुलन टळते.`,
    }),
    recommendedSchemes: getSchemes(['soil-health-card', 'mahadbt']),
    recommendedProducts: [],
    quickActions: [
      browseSchemesAction(language),
      agriShopAction(
        'browse-soil-inputs',
        actions.browseSoilInputs
      ),
    ],
    source: 'local',
  };
}

const AGRONOMY_TOPIC_SOIL: AgronomyTopic = {
  id: 'soil',
  terms: [
    ['prepare soil', 8],
    ['soil preparation', 8],
    ['land preparation', 8],
    ['field preparation', 7],
    ['seedbed', 7],
    ['soil test', 6],
    ['soil health', 5],
    ['tillage', 6],
    ['plough', 5],
    ['plow', 5],
    ['hardpan', 5],
    ['compaction', 5],
    ['lime', 4],
    ['gypsum', 4],
    ['soil', 4],
    ['मिट्टी तैयार', 8],
    ['मिट्टी सुधार', 7],
    ['भूमि तैयार', 8],
    ['खेत तैयार', 7],
    ['जुताई', 6],
    ['हल', 5],
    ['मिट्टी', 4],
    ['चूना', 4],
    ['जिप्सम', 4],
    ['माती तयार', 8],
    ['माती सुधार', 7],
    ['जमीन तयार', 8],
    ['शेत तयार', 7],
    ['नांगरट', 6],
    ['नांगर', 5],
    ['माती', 4],
    ['चुना', 4],
  ],
  title: agronomyText(
    'Build the soil before you sow',
    'बुवाई से पहले मिट्टी को मजबूत बनाएं',
    'पेरणीपूर्वी माती मजबूत करा'
  ),
  intro: agronomyText(
    'A good seedbed is not just loose soil. It needs the right pH, organic matter, drainage and moisture so roots can establish quickly.',
    'अच्छी नर्सरी तैयारी सिर्फ ढीली मिट्टी नहीं है। जड़ों को जल्दी बढ़ने के लिए सही pH, जैविक पदार्थ, जल निकास और नमी चाहिए।',
    'चांगली बीजपेटी म्हणजे फक्त सैल माती नाही. मुळे लवकर रुजण्यासाठी योग्य pH, सेंद्रिय पदार्थ, पाण्याचा निचरा आणि ओलावा आवश्यक आहे.'
  ),
  assessment: [
    agronomyText(
      'Check the previous crop, residue load, drainage and any hardpan or compaction.',
      'पिछली फसल, फसल अवशेष, जल निकास और कहीं कड़ी परत या दबाव देखें।',
      'मागील पीक, पिक अवशेष, पाण्याचा निचरा आणि जमिनीतील कठीण थर किंवा दाब तपासा.'
    ),
    agronomyText(
      'Read the soil test for pH, electrical conductivity, organic carbon and major nutrients.',
      'मिट्टी परीक्षण में pH, लवणता, जैविक कार्बन और प्रमुख पोषक तत्व देखें।',
      'माती परीक्षणात pH, क्षारता, सेंद्रिय कार्बन आणि प्रमुख अन्नद्रव्ये पहा.'
    ),
    agronomyText(
      'Notice low spots where water stands and slopes where rain erodes topsoil.',
      'कहां पानी रुकता है और कहां बहाव से ऊपरी मिट्टी जाती है, यह नोट करें।',
      'कुठे पाणी साचते आणि कुठे पाण्याच्या प्रवाहाने वरची माती वाहून जाते ते नोंदवा.'
    ),
  ],
  steps: [
    agronomyText(
      'Take a representative sample from 0-15 cm in a W pattern. Mix it, quarter it and send a composite sample to a recognised laboratory.',
      'खेत में W आकार में 0-15 सेमी गहराई से कई जगह नमूने लें। उन्हें मिलाकर चौथाई करें और मान्य प्रयोगशाला में भेजें।',
      'शेतात W आकारात 0-15 सेमी खोलीवरून अनेक ठिकाणांहून नमुने घ्या. ते मिसळून चतुर्थांश करा आणि मान्यताप्राप्त प्रयोगशाळेत पाठवा.'
    ),
    agronomyText(
      'Do not burn residues. Incorporate them or keep them as mulch. Add 5-10 tonnes of well-rotted FYM or compost per acre 2-3 weeks before sowing.',
      'फसल अवशेष न जलाएं। उन्हें मिट्टी में मिलाएं या मल्च रखें। बुवाई से 2-3 हफ्ते पहले प्रति एकड़ 5-10 टन सड़ी गोबर खाद या कंपोस्ट डालें।',
      'पिक अवशेष जाळू नका. ते मातीत मिसळा किंवा आच्छादन म्हणून ठेवा. पेरणीच्या 2-3 आठवडे आधी एकरी 5-10 टन कुजलेले शेणखत किंवा कंपोस्ट द्या.'
    ),
    agronomyText(
      'Deep plough only where compaction is confirmed. Otherwise use minimum tillage and level the field so water spreads evenly.',
      'सिर्फ जहां दबाव की पुष्टि हो वहां गहरी जुताई करें; बाकी खेत में कम जुताई करें और समतलीकरण से पानी बराबर फैलाएं।',
      'दाब असल्याची खात्री असेल तिथेच खोल नांगरट करा; अन्यथा कमी नांगरट करा आणि शेत समतल करून पाणी समान पसरवा.'
    ),
    agronomyText(
      'Correct pH with lime for acidic soil or gypsum for sodic soil, based on the test. Apply before the final tillage and let rain or light irrigation settle it.',
      'मिट्टी परीक्षण के अनुसार अम्लीय मिट्टी में चूना और क्षारीय मिट्टी में जिप्सम डालें। अंतिम जुताई से पहले डालें और बारिश या हल्की सिंचाई से बैठने दें।',
      'माती परीक्षणानुसार आम्लीय मातीत चुना आणि क्षारीय मातीत जिप्सम द्या. शेवटच्या नांगरटीपूर्वी द्या आणि पाऊस किंवा हलक्या पाण्याने बसू द्या.'
    ),
  ],
  tips: [
    agronomyText(
      'Test every 2-3 years, and after a major manure or lime application.',
      'हर 2-3 साल में और अधिक खाद या चूना डालने के बाद मिट्टी जांच कराएं।',
      'दर 2-3 वर्षांनी आणि जास्त खत किंवा चुना दिल्यानंतर माती परीक्षण करा.'
    ),
    agronomyText(
      'Never till wet soil; it creates clods and compaction that can last for several seasons.',
      'गीली मिट्टी में जुताई न करें; इससे ढेले और दबाव बनते हैं जो कई मौसम तक रहते हैं।',
      'ओल्या मातीत नांगरट करू नका; त्यामुळे ढेकूळ आणि दाब तयार होतो जो अनेक हंगाम टिकतो.'
    ),
  ],
  warning: agronomyText(
    'Do not guess lime or gypsum doses. Over-application can lock nutrients and damage the next crop.',
    'चूना या जिप्सम की मात्रा अनुमान से न दें। अधिक मात्रा पोषक तत्वों को बांध सकती है और अगली फसल को नुकसान पहुंचा सकती है।',
    'चुना किंवा जिप्समची मात्रा अंदाजाने देऊ नका. जास्त मात्रा अन्नद्रव्ये बांधून पुढील पिकाला नुकसान करू शकते.'
  ),
  schemeIds: ['soil-health-card', 'mahadbt'],
  productIds: ['t-stanes-bioderma-viride', 'iffco-sagarika'],
  productCategories: ['Bio-Cures & Organics'],
  preferCropDoctor: false,
};

const AGRONOMY_TOPIC_WATER: AgronomyTopic = {
  id: 'water',
  terms: [
    ['water management', 8],
    ['irrigation schedule', 8],
    ['irrigation', 7],
    ['drip', 7],
    ['sprinkler', 7],
    ['solar pump', 7],
    ['pump maintenance', 8],
    ['pump', 4],
    ['watering', 5],
    ['irrigate', 7],
    ['irrigating', 7],
    ['irrigated', 6],
    ['water', 4],
    ['moisture', 4],
    ['mulch', 4],
    ['waterlogging', 4],
    ['सिंचाई', 7],
    ['सिंचन', 7],
    ['ठिबक', 7],
    ['स्प्रिंकलर', 7],
    ['पानी', 4],
    ['नमी', 4],
    ['मल्च', 4],
    ['जलभराव', 4],
    ['पाणी', 4],
    ['ओलावा', 4],
    ['ठिबक सिंचन', 8],
  ],
  title: agronomyText(
    'Irrigate by crop need, not by habit',
    'फसल की जरूरत से सिंचाई करें, आदत से नहीं',
    'पिकाच्या गरजेनुसार पाणी द्या, सवयीने नाही'
  ),
  intro: agronomyText(
    'Water should reach the root zone at the right time. Light daily watering is often less useful than a deep, well-timed irrigation that wets the full root zone.',
    'पानी सही समय पर जड़ क्षेत्र तक पहुंचना चाहिए। रोज थोड़ा पानी देने से बेहतर है समय पर गहरी सिंचाई, जिससे पूरी जड़ परत गीली हो।',
    'पाणी योग्य वेळी मुळांपर्यंत पोहोचले पाहिजे. दररोज थोडे पाणी देण्यापेक्षा योग्य वेळी मुळांचा संपूर्ण भाग ओला करणारे खोल पाणी अधिक उपयुक्त असते.'
  ),
  assessment: [
    agronomyText(
      'Check soil type, slope, drainage and the quality of your water source.',
      'मिट्टी का प्रकार, ढलान, जल निकास और पानी के स्रोत की गुणवत्ता देखें।',
      'मातीचा प्रकार, उतार, पाण्याचा निचरा आणि पाण्याच्या स्रोताची गुणवत्ता तपासा.'
    ),
    agronomyText(
      'Identify the crop stage; flowering, fruit set and grain fill are the most sensitive periods.',
      'फसल की अवस्था पहचानें; फूल, फल बनना और दाना भरना सबसे संवेदनशील समय है।',
      'पिकाची अवस्था ओळखा; फुलोरा, फळधारणा आणि दाणे भरणे हे सर्वात संवेदनशील काळ आहेत.'
    ),
    agronomyText(
      'Look at recent rainfall, the last irrigation and signs of stress such as midday wilting or leaf rolling.',
      'हाल की बारिश, पिछली सिंचाई और दोपहर में मुरझाना या पत्ते लिपटना जैसे तनाव के संकेत देखें।',
      'अलीकडील पाऊस, शेवटचे पाणी आणि दुपारी कोमेजणे किंवा पाने गुंडाळणे अशी ताणाची लक्षणे पहा.'
    ),
  ],
  steps: [
    agronomyText(
      'Check moisture at 15 cm with a hand probe or squeeze test. Irrigate when the root zone is drying, not on a fixed day of the week.',
      '15 सेमी गहराई पर हाथ से नमी जांचें या मुट्ठी परीक्षण करें। जड़ क्षेत्र सूखने पर सिंचाई करें, हफ्ते के तय दिन पर नहीं।',
      '15 सेमी खोलीवर हाताने ओलावा तपासा किंवा मुठीत माती पिळून पहा. मुळांचा भाग सुकू लागल्यावर पाणी द्या, आठवड्याच्या ठरलेल्या दिवशी नाही.'
    ),
    agronomyText(
      'Use drip or sprinkler where suitable. Drip saves water and keeps leaves dry; irrigate early in the morning and avoid windy hours.',
      'जहां उपयुक्त हो वहां ठिबक या स्प्रिंकलर लगाएं। ठिबक पानी बचाता है और पत्ते सूखे रखता है; सुबह जल्दी सिंचाई करें और तेज हवा में न करें।',
      'योग्य असेल तिथे ठिबक किंवा स्प्रिंकलर वापरा. ठिबक पाणी वाचवते आणि पाने कोरडी ठेवते; पहाटे पाणी द्या आणि जोरदार वाऱ्यात टाळा.'
    ),
    agronomyText(
      'Mulch with 5-7 cm of crop residue and make small basins or ridges so water stays near the roots instead of running off.',
      '5-7 सेमी फसल अवशेष का मल्च करें और छोटी क्यारियां या मेड़ बनाएं ताकि पानी बहने के बजाय जड़ों के पास रहे।',
      '5-7 सेमी पिक अवशेषांचे आच्छादन करा आणि लहान गाद्या किंवा वरंबे तयार करा, जेणेकरून पाणी वाहून न जाता मुळांजवळ राहील.'
    ),
    agronomyText(
      'For rice, follow alternate wetting and drying where safe; drain fields before heavy rain. Keep pumps, filters and drip lines clean and record the water used.',
      'धान में जहां सुरक्षित हो वहां बारी-बारी से गीला-सूखा तरीका अपनाएं; भारी बारिश से पहले खेत से पानी निकालें। पंप, फिल्टर और ठिबक लाइन साफ रखें और पानी का हिसाब रखें।',
      'भातात सुरक्षित असेल तिथे आलटून पालटून ओले-कोरडे पद्धत वापरा; मुसळधार पावसापूर्वी शेतातील पाणी काढा. पंप, फिल्टर आणि ठिबक नळ्या स्वच्छ ठेवा आणि वापरलेल्या पाण्याची नोंद ठेवा.'
    ),
  ],
  tips: [
    agronomyText(
      'Deep, less frequent irrigation usually builds stronger roots than daily light watering.',
      'गहरी और कम बार की सिंचाई रोज हल्का पानी देने से मजबूत जड़ें बनाती है।',
      'खोल आणि कमी वेळा पाणी दिल्याने दररोज हलके पाणी देण्यापेक्षा मजबूत मुळे तयार होतात.'
    ),
    agronomyText(
      'Keep leaves dry in humid weather to reduce fungal and bacterial disease pressure.',
      'नम मौसम में पत्ते सूखे रखें ताकि फफूंद और जीवाणु रोग कम हों।',
      'दमट हवामानात पाने कोरडी ठेवा, जेणेकरून बुरशी व जिवाणूजन्य रोग कमी होतील.'
    ),
  ],
  warning: agronomyText(
    'Do not irrigate already waterlogged soil, and check electrical safety around pumps before the monsoon.',
    'पहले से जलभराव वाली मिट्टी में सिंचाई न करें, और मानसून से पहले पंप के आसपास बिजली की सुरक्षा जांचें।',
    'आधीच पाणी साचलेल्या मातीत पाणी देऊ नका आणि पावसाळ्यापूर्वी पंपाभोवती विद्युत सुरक्षितता तपासा.'
  ),
  schemeIds: ['pm-kusum', 'pmksy'],
  productIds: [],
  productCategories: [],
  preferCropDoctor: false,
};

const AGRONOMY_TOPIC_NUTRIENT: AgronomyTopic = {
  id: 'nutrient',
  terms: [
    ['yellow leaves', 9],
    ['yellowing leaves', 9],
    ['yellowing', 7],
    ['yellow leaf', 9],
    ['pale leaves', 7],
    ['nutrient deficiency', 8],
    ['nutrient', 6],
    ['fertiliser', 5],
    ['fertilizer', 5],
    ['fertilize', 5],
    ['fertilise', 5],
    ['manure', 5],
    ['npk', 5],
    ['urea', 6],
    ['zinc', 5],
    ['iron', 5],
    ['chlorosis', 6],
    ['पीले पत्ते', 9],
    ['पत्ते पीले', 9],
    ['पीली पत्तियां', 9],
    ['पीलापन', 7],
    ['पोषक तत्व', 6],
    ['उर्वरक', 5],
    ['खाद', 5],
    ['यूरिया', 6],
    ['जिंक', 5],
    ['पिवळी पाने', 9],
    ['पाने पिवळी', 9],
    ['पिवळेपणा', 7],
    ['अन्नद्रव्य', 6],
    ['खत', 5],
    ['युरिया', 6],
  ],
  title: agronomyText(
    'Diagnose yellowing before adding fertiliser',
    'खाद डालने से पहले पीलापन की वजह पहचानें',
    'खत देण्यापूर्वी पिवळेपणाचे कारण ओळखा'
  ),
  intro: agronomyText(
    'Yellow leaves are a symptom, not a diagnosis. Nitrogen, sulphur, iron, zinc, waterlogging, salinity, root damage and viruses can all look similar.',
    'पीले पत्ते एक लक्षण हैं, निदान नहीं। नाइट्रोजन, सल्फर, लोहा, जिंक, जलभराव, लवणता, जड़ों की क्षति और वायरस सभी एक जैसे दिख सकते हैं।',
    'पिवळी पाने हे लक्षण आहे, निदान नाही. नायट्रोजन, गंधक, लोह, झिंक, पाणी साचणे, क्षारता, मुळांचे नुकसान आणि विषाणू हे सर्व सारखे दिसू शकतात.'
  ),
  assessment: [
    agronomyText(
      'Check whether older lower leaves or new upper leaves are yellow. Uniform pale colour points to a different cause than green veins with yellow tissue.',
      'देखें कि नीचे की पुरानी पत्तियां पीली हैं या ऊपर की नई। पूरा हल्का पीलापन और हरी नसों के बीच पीलापन अलग-अलग कारण बताते हैं।',
      'खालची जुनी पाने पिवळी आहेत की वरची नवीन याची नोंद घ्या. संपूर्ण फिकट पिवळेपण आणि हिरव्या शिरांमधील पिवळेपण वेगवेगळे कारण दर्शवतात.'
    ),
    agronomyText(
      'Map the field pattern: whole field, patches, low-lying spots, field edges or only shaded plants.',
      'खेत में पैटर्न देखें: पूरा खेत, कुछ हिस्से, नीचे का भाग, किनारे या सिर्फ छाया वाले पौधे।',
      'शेतातील नमुना पहा: संपूर्ण शेत, तुकडे, सखल भाग, कडे किंवा फक्त सावलीतील झाडे.'
    ),
    agronomyText(
      'Inspect roots and soil moisture. Waterlogging, compaction, nematodes and fertiliser burn can all block nutrient uptake.',
      'जड़ें और मिट्टी की नमी देखें। जलभराव, दबाव, सूत्रकृमि और खाद से जलन पोषक तत्वों का लेना रोक सकते हैं।',
      'मुळे आणि मातीतील ओलावा तपासा. पाणी साचणे, दाब, सूत्रकृमी आणि खतामुळे होणारी जळजळ अन्नद्रव्ये घेण्यास अडवू शकतात.'
    ),
  ],
  steps: [
    agronomyText(
      'Mark five affected and five healthy plants. Take clear photos of old and new leaves in daylight so the pattern can be compared later.',
      'पांच प्रभावित और पांच स्वस्थ पौधे चिह्नित करें। पुरानी और नई पत्तियों की दिन की रोशनी में साफ फोटो लें ताकि पैटर्न की तुलना हो सके।',
      'पाच बाधित आणि पाच निरोगी झाडे खुणा करा. जुनी व नवीन पाने दिवसाच्या उजेडात स्पष्ट फोटो काढा, जेणेकरून नमुन्याची तुलना करता येईल.'
    ),
    agronomyText(
      'Dig beside a plant and check the roots. If the soil smells sour or water stands, drain first and let the root zone breathe before any fertiliser.',
      'पौधे के पास खोदकर जड़ें देखें। मिट्टी में बदबू हो या पानी रुका हो तो पहले पानी निकालें और खाद से पहले जड़ क्षेत्र को हवा मिलने दें।',
      'झाडाजवळ खोदून मुळे तपासा. मातीला आंबट वास येत असेल किंवा पाणी साचले असेल तर आधी पाणी काढा आणि खत देण्यापूर्वी मुळांना हवा मिळू द्या.'
    ),
    agronomyText(
      'Use a soil test for pH, salinity, organic carbon and nitrogen. For orchards and high-value crops, a leaf-tissue test gives a clearer answer.',
      'pH, लवणता, जैविक कार्बन और नाइट्रोजन के लिए मिट्टी परीक्षण कराएं। बाग और उच्च मूल्य की फसलों में पत्ती परीक्षण अधिक स्पष्ट जवाब देता है।',
      'pH, क्षारता, सेंद्रिय कार्बन आणि नायट्रोजनसाठी माती परीक्षण करा. फळबागा आणि उच्च मूल्याच्या पिकांसाठी पानांचे परीक्षण अधिक स्पष्ट उत्तर देते.'
    ),
    agronomyText(
      'Treat the cause: split nitrogen only where nitrogen is low; use iron or zinc chelate for confirmed micronutrient deficiency; drain waterlogged patches. Recheck after 7-10 days instead of repeating a spray blindly.',
      'कारण का इलाज करें: नाइट्रोजन कम हो तभी विभाजित मात्रा दें; सूक्ष्म पोषक की पुष्टि होने पर आयरन या जिंक चीलेट दें; जलभराव वाले हिस्से सुखाएं। 7-10 दिन बाद दोबारा जांचें, बिना कारण छिड़काव न दोहराएं।',
      'कारणावर उपचार करा: नायट्रोजन कमी असेल तरच विभागून द्या; सूक्ष्म अन्नद्रव्याची खात्री झाल्यास लोह किंवा झिंक चिलेट द्या; पाणी साचलेले भाग सुकवा. 7-10 दिवसांनी पुन्हा तपासा, कारणाशिवाय फवारणी पुन्हा करू नका.'
    ),
  ],
  tips: [
    agronomyText(
      'Uniform yellowing of older leaves often suggests nitrogen, while interveinal yellowing of new leaves often suggests iron. These are clues, not proof.',
      'पुरानी पत्तियों का एक समान पीलापन अक्सर नाइट्रोजन और नई पत्तियों की नसों के बीच पीलापन लोहे का संकेत देता है। यह सुराग है, प्रमाण नहीं।',
      'जुन्या पानांचे सारखे पिवळेपण बहुतेक नायट्रोजनकडे आणि नव्या पानांच्या शिरांमधील पिवळेपण लोहाकडे निर्देश करते. हे संकेत आहेत, पुरावा नाही.'
    ),
    agronomyText(
      'Do not apply urea to dry soil or just before heavy rain; it can be lost and may pollute water.',
      'सूखी मिट्टी में या भारी बारिश से ठीक पहले यूरिया न डालें; इससे नुकसान हो सकता है और पानी प्रदूषित हो सकता है।',
      'कोरड्या मातीत किंवा मुसळधार पावसापूर्वी युरिया देऊ नका; त्याचा अपव्यय होऊ शकतो आणि पाणी दूषित होऊ शकते.'
    ),
  ],
  warning: agronomyText(
    'Viral yellowing will not recover with fertiliser. Remove infected plants and control whitefly or thrips with the advice of your KVK.',
    'वायरस से हुआ पीलापन खाद से ठीक नहीं होगा। संक्रमित पौधे हटाएं और KVK की सलाह से सफेद मक्खी या थ्रिप्स नियंत्रित करें।',
    'विषाणूमुळे झालेला पिवळेपणा खताने बरा होत नाही. बाधित झाडे काढा आणि KVK च्या सल्ल्याने पांढरी माशी किंवा थ्रिप्स नियंत्रित करा.'
  ),
  schemeIds: ['soil-health-card'],
  productIds: [
    'iffco-npk-19-19-19',
    'aries-agromin-max',
    'iffco-sagarika',
  ],
  productCategories: ['Fertilizers', 'Micronutrients & Seeds'],
  preferCropDoctor: true,
};

const AGRONOMY_TOPIC_PEST: AgronomyTopic = {
  id: 'pest',
  terms: [
    ['pest control', 8],
    ['pests control', 8],
    ['integrated pest', 8],
    ['crop protection', 8],
    ['insect control', 7],
    ['disease control', 7],
    ['pest', 5],
    ['pests', 5],
    ['insect', 5],
    ['insects', 5],
    ['disease', 5],
    ['diseases', 5],
    ['fungus', 5],
    ['fungal', 4],
    ['spray', 4],
    ['caterpillar', 5],
    ['borer', 5],
    ['whitefly', 5],
    ['thrips', 5],
    ['माहू', 6],
    ['कीट नियंत्रण', 8],
    ['कीड़ा', 5],
    ['रोग', 5],
    ['फफूंद', 5],
    ['छिड़काव', 4],
    ['स्प्रे', 4],
    ['मावा', 6],
    ['कीड नियंत्रण', 8],
    ['कीड', 5],
    ['बुरशी', 5],
    ['फवारणी', 4],
  ],
  title: agronomyText(
    'Scout first, spray last',
    'पहले निरीक्षण करें, छिड़काव अंत में',
    'आधी पाहणी करा, फवारणी शेवटी'
  ),
  intro: agronomyText(
    'Most pest and disease problems are easier and cheaper to manage when caught in the first few days. Blind spraying raises cost and helps resistance build.',
    'अधिकांश कीट और रोग शुरुआती दिनों में पकड़े जाने पर आसानी और कम खर्च में नियंत्रित होते हैं। बिना पहचान छिड़काव खर्च बढ़ाता है और प्रतिरोध पैदा करता है।',
    'बहुतेक कीड व रोग पहिल्या काही दिवसांत ओळखल्यास सोपे आणि कमी खर्चात नियंत्रित होतात. न ओळखता फवारणी केल्यास खर्च वाढतो आणि प्रतिकारशक्ती तयार होते.'
  ),
  assessment: [
    agronomyText(
      'Identify the pest or disease and note the crop stage. The same spot can be fungal, bacterial, viral or insect damage.',
      'कीट या रोग पहचानें और फसल की अवस्था नोट करें। एक जैसा धब्बा फफूंद, जीवाणु, वायरस या कीट का नुकसान हो सकता है।',
      'कीड किंवा रोग ओळखा आणि पिकाची अवस्था नोंदवा. सारखाच ठिपका बुरशी, जिवाणू, विषाणू किंवा कीटकांचे नुकसान असू शकतो.'
    ),
    agronomyText(
      'Estimate how many plants are affected and whether the problem is in patches or across the field. Look for ladybirds, spiders and parasitic wasps.',
      'कितने पौधे प्रभावित हैं और समस्या कुछ हिस्सों में है या पूरे खेत में, यह देखें। लेडीबर्ड, मकड़ी और परजीवी ततैया भी देखें।',
      'किती झाडे बाधित आहेत आणि समस्या तुकड्यांत आहे की संपूर्ण शेतात ते पहा. लेडीबर्ड, कोळी आणि परजीवी भुंगेही पहा.'
    ),
    agronomyText(
      'Check leaf undersides, growing tips and roots in humid weather. Review the last spray and whether the same product was repeated.',
      'नम मौसम में पत्तियों के नीचे, बढ़ते सिरे और जड़ें देखें। पिछले छिड़काव और एक ही उत्पाद दोहराए जाने की समीक्षा करें।',
      'दमट हवामानात पानांच्या खालील बाजू, वाढणारे टोक आणि मुळे तपासा. शेवटची फवारणी आणि तोच उत्पाद पुन्हा वापरला गेला का याचा आढावा घ्या.'
    ),
  ],
  steps: [
    agronomyText(
      'Scout in a W pattern, checking five spots and ten plants per spot. Count the pest or affected leaves and write it down; numbers matter more than a quick glance.',
      'W आकार में पांच जगह और हर जगह दस पौधों का निरीक्षण करें। कीट या प्रभावित पत्तियों की गिनती लिखें; सिर्फ देखने से ज्यादा संख्या मायने रखती है।',
      'W आकारात पाच ठिकाणी आणि प्रत्येक ठिकाणी दहा झाडांची पाहणी करा. कीड किंवा बाधित पानांची संख्या लिहा; केवळ पाहण्यापेक्षा संख्या महत्त्वाची आहे.'
    ),
    agronomyText(
      'Photograph the damage in daylight and confirm the cause with Crop Doctor or your KVK. Separate chewing insects, sucking insects, fungal lesions, bacterial ooze and viral distortion.',
      'दिन की रोशनी में नुकसान की फोटो लें और क्रॉप डॉक्टर या KVK से कारण की पुष्टि करें। चबाने वाले कीट, रस चूसने वाले कीट, फफूंद धब्बे, जीवाणु स्राव और वायरस विकृति अलग रखें।',
      'दिवसाच्या उजेडात नुकसानाचा फोटो घ्या आणि क्रॉप डॉक्टर किंवा KVK कडून कारणाची खात्री करा. चावणारे कीड, रस शोषणारे कीड, बुरशीजन्य ठिपके, जिवाणू स्राव आणि विषाणूजन्य विकृती वेगळे ठेवा.'
    ),
    agronomyText(
      'Remove severely affected plants and pruned material from the field. Improve airflow, avoid overhead watering and correct excess nitrogen before reaching for a spray.',
      'अधिक प्रभावित पौधे और कटी टहनियां खेत से हटाएं। हवा का आवागमन बढ़ाएं, ऊपर से सिंचाई न करें और छिड़काव से पहले अधिक नाइट्रोजन सुधारें।',
      'गंभीर बाधित झाडे आणि छाटलेले भाग शेताबाहेर काढा. हवेची रहदारी वाढवा, वरून पाणी देऊ नका आणि फवारणीपूर्वी जास्त नायट्रोजन दुरुस्त करा.'
    ),
    agronomyText(
      'Spray only when the pest population or disease pressure crosses the local threshold. Use a recommended product for that crop, rotate the mode of action, wear protective clothing and respect the pre-harvest interval.',
      'कीट संख्या या रोग दबाव स्थानीय सीमा पार करे तभी छिड़काव करें। उस फसल के लिए अनुशंसित उत्पाद वापरें, क्रिया-तंत्र बदलें, सुरक्षा कपड़े पहनें और कटाई से पहले की अवधि का पालन करें।',
      'कीडसंख्या किंवा रोगाचा दाब स्थानिक मर्यादा ओलांडल्यावरच फवारणी करा. त्या पिकासाठी शिफारस केलेले उत्पाद वापरा, कृती-पद्धत बदला, संरक्षक कपडे घाला आणि कापणीपूर्व कालावधी पाळा.'
    ),
    agronomyText(
      'Recheck after 3-5 days. If the problem is not reducing, get the diagnosis confirmed rather than mixing extra chemicals.',
      '3-5 दिन बाद दोबारा जांचें। समस्या कम न हो तो अतिरिक्त रसायन मिलाने के बजाय निदान की पुष्टि कराएं।',
      '3-5 दिवसांनी पुन्हा तपासा. समस्या कमी होत नसेल तर अधिक रसायने मिसळण्यापेक्षा निदानाची खात्री करा.'
    ),
  ],
  tips: [
    agronomyText(
      'Calibrate the sprayer and use clean water. A wrong dose or blocked nozzle wastes money and leaves uneven protection.',
      'स्प्रेयर कैलिब्रेट करें और साफ पानी लें। गलत खुराक या बंद नोजल पैसा बर्बाद करता है और असमान सुरक्षा देता है।',
      'फवारणी यंत्र कॅलिब्रेट करा आणि स्वच्छ पाणी वापरा. चुकीची मात्रा किंवा बंद नोझल पैसे वाया घालवते आणि असमान संरक्षण देते.'
    ),
    agronomyText(
      'Spray in the early morning or late evening and avoid flowering hours when bees are active.',
      'सुबह जल्दी या शाम को छिड़काव करें और मधुमक्खियों के सक्रिय समय फूलों पर छिड़काव से बचें।',
      'पहाटे किंवा संध्याकाळी फवारणी करा आणि मधुमाशा सक्रिय असताना फुलांवर फवारणी टाळा.'
    ),
  ],
  warning: agronomyText(
    'Never use a banned or unapproved pesticide. Do not mix several products unless the label or a local expert specifically approves it.',
    'प्रतिबंधित या अनुमोदित न किए गए कीटनाशक का उपयोग न करें। जब तक लेबल या स्थानीय विशेषज्ञ स्पष्ट अनुमति न दें, कई उत्पाद न मिलाएं।',
    'प्रतिबंधित किंवा मान्यता नसलेले कीटकनाशक वापरू नका. लेबल किंवा स्थानिक तज्ज्ञाने स्पष्ट परवानगी दिल्याशिवाय अनेक उत्पादने मिसळू नका.'
  ),
  schemeIds: [],
  productIds: [],
  productCategories: ['Pesticides', 'Bio-Cures & Organics'],
  preferCropDoctor: true,
};

const AGRONOMY_TOPIC_ORGANIC: AgronomyTopic = {
  id: 'organic',
  terms: [
    ['organic farming', 9],
    ['organic', 6],
    ['natural farming', 8],
    ['regenerative', 6],
    ['vermicompost', 6],
    ['compost', 6],
    ['green manure', 6],
    ['bio fertiliser', 6],
    ['bio fertilizer', 6],
    ['jaivik', 6],
    ['जैविक खेती', 9],
    ['जैविक', 6],
    ['प्राकृतिक खेती', 8],
    ['वर्मी कंपोस्ट', 6],
    ['कंपोस्ट', 6],
    ['हरी खाद', 6],
    ['जीवामृत', 6],
    ['सेंद्रिय शेती', 9],
    ['सेंद्रिय', 6],
    ['नैसर्गिक शेती', 8],
    ['गांडूळ खत', 6],
    ['हिरवी खत', 6],
  ],
  title: agronomyText(
    'Make organic matter the foundation',
    'जैविक पदार्थ को खेती की नींव बनाएं',
    'सेंद्रिय पदार्थाला शेतीचा पाया बनवा'
  ),
  intro: agronomyText(
    'Organic farming is a system, not a single replacement spray. Healthy compost, rotation, cover crops and biocontrol work together to build soil and reduce pest pressure.',
    'जैविक खेती एक पूरी प्रणाली है, किसी एक रसायन का विकल्प नहीं। अच्छी कंपोस्ट, फसल चक्र, हरी खाद और जैविक नियंत्रण मिलकर मिट्टी बनाते हैं और कीट दबाव घटाते हैं।',
    'सेंद्रिय शेती ही एक संपूर्ण पद्धत आहे, एका रसायनाचा पर्याय नाही. चांगली कंपोस्ट, पीक फेरपालट, हिरवी खत आणि जैविक नियंत्रण एकत्र माती घडवतात आणि कीड दाब कमी करतात.'
  ),
  assessment: [
    agronomyText(
      'Check organic carbon, pH, water availability and the current nutrient balance before planning the transition.',
      'बदलाव की योजना से पहले जैविक कार्बन, pH, पानी की उपलब्धता और वर्तमान पोषक संतुलन देखें।',
      'बदलाची योजना आखण्यापूर्वी सेंद्रिय कार्बन, pH, पाण्याची उपलब्धता आणि सध्याचे अन्नद्रव्य संतुलन तपासा.'
    ),
    agronomyText(
      'Review the last two seasons of pest and disease pressure, because organic control needs earlier action.',
      'पिछले दो मौसम के कीट और रोग दबाव की समीक्षा करें, क्योंकि जैविक नियंत्रण में जल्दी कदम उठाना पड़ता है।',
      'मागील दोन हंगामांतील कीड व रोगांचा दाब पाहा, कारण सेंद्रिय नियंत्रणात लवकर पावले उचलावी लागतात.'
    ),
    agronomyText(
      'Confirm the market, certification requirement and the labour available for compost and manual weeding.',
      'बाजार, प्रमाणन की जरूरत और कंपोस्ट व निराई के लिए उपलब्ध मजदूरी की पुष्टि करें।',
      'बाजार, प्रमाणनाची गरज आणि कंपोस्ट व तण काढण्यासाठी उपलब्ध मजुरी याची खात्री करा.'
    ),
  ],
  steps: [
    agronomyText(
      'Start with a soil test and a three-year transition plan. Keep a small comparison strip so you can measure soil and yield change honestly.',
      'मिट्टी परीक्षण और तीन साल की बदलाव योजना से शुरू करें। छोटा तुलनात्मक हिस्सा रखें ताकि मिट्टी और उपज का बदलाव ईमानदारी से माप सकें।',
      'माती परीक्षण आणि तीन वर्षांच्या संक्रमण योजनेने सुरुवात करा. लहान तुलनात्मक भाग ठेवा, जेणेकरून माती व उत्पादनातील बदल प्रामाणिकपणे मोजता येईल.'
    ),
    agronomyText(
      'Prepare mature compost or vermicompost. Use 5-10 tonnes per acre of well-rotted material, keep the heap moist and covered, and turn it regularly.',
      'पकी कंपोस्ट या वर्मी कंपोस्ट तैयार करें। प्रति एकड़ 5-10 टन अच्छी सड़ी सामग्री डालें, ढेर को नम और ढका रखें तथा समय-समय पर पलटें।',
      'पक्व कंपोस्ट किंवा गांडूळ खत तयार करा. एकरी 5-10 टन चांगले कुजलेले साहित्य द्या, ढीग ओला व झाकलेला ठेवा आणि वेळोवेळी उलथवा.'
    ),
    agronomyText(
      'Grow a green-manure or cover crop such as dhaincha, sunhemp or cowpea in the off-season and incorporate it at flowering. This adds organic matter and interrupts pest cycles.',
      'खाली मौसम में ढैंचा, सनई या लोबिया जैसी हरी खाद या आवरण फसल उगाएं और फूल आने पर मिट्टी में मिलाएं। इससे जैविक पदार्थ बढ़ता है और कीट चक्र टूटता है।',
      'रिकाम्या हंगामात धैंचा, सनई किंवा चवळी अशी हिरवी खत किंवा आच्छादन पीक घ्या आणि फुलोऱ्यात मातीत मिसळा. यामुळे सेंद्रिय पदार्थ वाढतो आणि कीड चक्र तुटते.'
    ),
    agronomyText(
      'Rotate cereals with legumes and use intercropping or border rows. Use biofertilisers and biocontrol agents correctly, and keep them out of direct sun and chemical fungicides.',
      'अनाज फसलों के साथ दलहन का चक्र लगाएं और अंतरफसल या किनारे की पंक्तियां रखें। जैव उर्वरक और जैव नियंत्रण सही तरीके से उपयोग करें, उन्हें तेज धूप और रासायनिक फफूंदनाशक से बचाएं।',
      'धान्य पिकांसोबत कडधान्यांची फेरपालट करा आणि आंतरपीक किंवा कडेच्या ओळी ठेवा. जैव खते व जैव नियंत्रण योग्य पद्धतीने वापरा आणि ती तीव्र उन्हापासून व रासायनिक बुरशीनाशकांपासून दूर ठेवा.'
    ),
  ],
  tips: [
    agronomyText(
      'Organic nutrients release slowly. Match the compost timing to the crop demand instead of expecting an immediate chemical-like response.',
      'जैविक पोषक तत्व धीरे छूटते हैं। रासायनिक जैसी तुरंत प्रतिक्रिया की उम्मीद के बजाय कंपोस्ट का समय फसल की मांग से मिलाएं।',
      'सेंद्रिय अन्नद्रव्ये हळूहळू मुक्त होतात. रासायनिकासारखा तात्काळ परिणाम अपेक्षित न धरता कंपोस्टची वेळ पिकाच्या गरजेशी जुळवा.'
    ),
    agronomyText(
      'Keep compost, biofertiliser and spray records. Buy only certified organic inputs and check the label, even for botanical products.',
      'कंपोस्ट, जैव उर्वरक और छिड़काव का रिकॉर्ड रखें। सिर्फ प्रमाणित जैविक इनपुट खरीदें और वानस्पतिक उत्पादों पर भी लेबल जांचें।',
      'कंपोस्ट, जैव खत आणि फवारणीची नोंद ठेवा. फक्त प्रमाणित सेंद्रिय साहित्य खरेदी करा आणि वनस्पतीजन्य उत्पादनांवरही लेबल तपासा.'
    ),
  ],
  warning: agronomyText(
    'Fresh manure can carry pathogens and weed seeds. Compost it fully and apply at least 2-3 weeks before planting. Organic does not mean unlimited or unlabelled use.',
    'ताजी गोबर खाद में रोगाणु और खरपतवार बीज हो सकते हैं। उसे पूरी तरह सड़ाएं और बुवाई से कम से कम 2-3 हफ्ते पहले डालें। जैविक का मतलब बिना लेबल या बिना सीमा का उपयोग नहीं है।',
    'ताजे शेणखतात रोगजंतू आणि तणांच्या बिया असू शकतात. ते पूर्ण कुजवा आणि लागवडीच्या किमान 2-3 आठवडे आधी द्या. सेंद्रिय म्हणजे लेबल नसलेला किंवा मर्यादेशिवाय वापर नाही.'
  ),
  schemeIds: ['soil-health-card', 'mahadbt'],
  productIds: [],
  productCategories: ['Bio-Cures & Organics'],
  preferCropDoctor: true,
};

const AGRONOMY_TOPIC_HARVEST: AgronomyTopic = {
  id: 'harvest',
  terms: [
    ['best time to harvest', 9],
    ['when to harvest', 9],
    ['harvesting', 8],
    ['harvest', 7],
    ['maturity', 6],
    ['post harvest', 8],
    ['storage', 5],
    ['threshing', 6],
    ['drying grain', 6],
    ['कटाई', 8],
    ['कब काटें', 9],
    ['पकना', 6],
    ['भंडारण', 5],
    ['सुखाना', 6],
    ['काढणी', 8],
    ['कधी काढावे', 9],
    ['पक्वता', 6],
    ['साठवण', 5],
    ['सुकवणे', 6],
  ],
  title: agronomyText(
    'Harvest at the right maturity and protect quality',
    'सही पकाव पर कटाई करें और गुणवत्ता बचाएं',
    'योग्य पक्वतेवर काढणी करा आणि गुणवत्ता टिकवा'
  ),
  intro: agronomyText(
    'Harvest timing should follow the crop, not only the calendar. A few days early or late can change weight, keeping quality and market price.',
    'कटाई का समय फसल से तय होना चाहिए, सिर्फ कैलेंडर से नहीं। कुछ दिन पहले या बाद काटने से वजन, भंडारण गुणवत्ता और बाजार भाव बदल सकता है।',
    'काढणीची वेळ पिकानुसार ठरवा, केवळ दिनदर्शिकेनुसार नाही. काही दिवस आधी किंवा उशिरा काढणी केल्यास वजन, साठवण गुणवत्ता आणि बाजारभाव बदलू शकतो.'
  ),
  assessment: [
    agronomyText(
      'Confirm the crop, variety and days after sowing or flowering. Variety duration can differ by two to three weeks.',
      'फसल, किस्म और बुवाई या फूल आने के बाद के दिन पुष्टि करें। किस्म की अवधि दो-तीन हफ्ते अलग हो सकती है।',
      'पीक, वाण आणि पेरणी किंवा फुलोऱ्यानंतरचे दिवस तपासा. वाणाचा कालावधी दोन-तीन आठवडे बदलू शकतो.'
    ),
    agronomyText(
      'Sample plants or fruits from several spots and check colour, firmness, grain hardness or moisture. Do not judge from the field edge alone.',
      'कई जगह से पौधे या फल लेकर रंग, कठोरता, दाने की सख्ती या नमी देखें। सिर्फ खेत के किनारे से अंदाज न लगाएं।',
      'अनेक ठिकाणांहून झाडे किंवा फळे घेऊन रंग, कडकपणा, दाण्यांची कठीणता किंवा ओलावा तपासा. केवळ शेताच्या कडेने अंदाज करू नका.'
    ),
    agronomyText(
      'Check the weather, labour and market before the harvest window. Rain at maturity can cause lodging, splitting and mould.',
      'कटाई से पहले मौसम, मजदूरी और बाजार देखें। पकने के समय बारिश से गिरना, फटना और फफूंद हो सकती है।',
      'काढणीपूर्वी हवामान, मजुरी आणि बाजार पहा. पक्वतेच्या वेळी पाऊस आल्यास पीक पडणे, फळे फुटणे आणि बुरशी येऊ शकते.'
    ),
  ],
  steps: [
    agronomyText(
      'Sample five spots and use the crop-specific sign: hard grain and golden straw for wheat, straw-coloured grains for rice, filled shoulders and skin colour for mango, and firm fully coloured fruit for tomato.',
      'पांच जगह नमूना लें और फसल के लक्षण देखें: गेहूं में सख्त दाना और सुनहरा भूसा, धान में भूसे जैसे दाने, आम में भरे कंधे और छिलके का रंग, टमाटर में सख्त पूरा रंग।',
      'पाच ठिकाणी नमुना घ्या आणि पिकानुसार लक्षणे पहा: गव्हात कडक दाणे व सोनेरी काड, भातात पेंढ्यासारखे दाणे, आंब्यात भरलेले खांदे व सालीचा रंग, टोमॅटोमध्ये कडक पूर्ण रंग.'
    ),
    agronomyText(
      'Harvest in the cool part of the day with clean tools and crates. Do not drop, throw or heap produce in the sun; every bruise becomes an entry point for rot.',
      'दिन के ठंडे समय में साफ औजार और टोकरियों से कटाई करें। उपज को गिराएं, फेंकें या धूप में ढेर न करें; हर चोट सड़न का दरवाजा बनती है।',
      'दिवसाच्या थंड वेळी स्वच्छ अवजारे आणि पेट्यांनी काढणी करा. उत्पादन पाडू, फेकू किंवा उन्हात रचू नका; प्रत्येक दुखापत सडण्याचे दार बनते.'
    ),
    agronomyText(
      'Dry grains on a clean tarpaulin or drying floor, not on a hot road. Target about 12-14% moisture for cereals and 9-10% for pulses, then clean and grade.',
      'अनाज साफ तिरपाल या सुखाने के फर्श पर सुखाएं, गर्म सड़क पर नहीं। अनाज में लगभग 12-14% और दलहन में 9-10% नमी रखें, फिर सफाई और ग्रेडिंग करें।',
      'धान्य स्वच्छ तरपाल किंवा सुकवण्याच्या जमिनीवर सुकवा, गरम रस्त्यावर नाही. धान्यात सुमारे 12-14% आणि कडधान्यात 9-10% ओलावा ठेवा, नंतर स्वच्छता व प्रतवारी करा.'
    ),
    agronomyText(
      'Store in a dry, ventilated, rodent-proof room. Use clean bags or hermetic storage, stack on pallets and inspect weekly for heating, insects and mould.',
      'सूखे, हवादार और चूहों से सुरक्षित कमरे में भंडारण करें। साफ बोरे या वायुरोधी भंडारण उपयोग करें, पैलेट पर रखें और हर हफ्ते गर्मी, कीट व फफूंद जांचें।',
      'कोरड्या, हवा खेळणाऱ्या आणि उंदरांपासून सुरक्षित खोलीत साठवा. स्वच्छ पोती किंवा हवाबंद साठवण वापरा, फळ्यांवर ठेवा आणि दर आठवड्याला उष्णता, कीड व बुरशी तपासा.'
    ),
    agronomyText(
      'For fruits and vegetables, pre-cool, sort out damaged pieces, pack in ventilated crates and move to market quickly. Never mix rotten produce with healthy lots.',
      'फल और सब्जियों को ठंडा करें, खराब टुकड़े अलग करें, हवादार टोकरियों में पैक करें और जल्दी बाजार भेजें। सड़ी उपज को स्वस्थ माल के साथ कभी न मिलाएं।',
      'फळे व भाज्या थंड करा, खराब तुकडे वेगळे करा, हवा खेळणाऱ्या पेट्यांत भरा आणि लवकर बाजारात पाठवा. सडलेले उत्पादन निरोगी मालासोबत कधीही मिसळू नका.'
    ),
  ],
  tips: [
    agronomyText(
      'Harvest before a forecast storm if the crop is ready. A few hours of planning can save a whole lot.',
      'फसल तैयार हो तो तूफान के पूर्वानुमान से पहले कटाई करें। कुछ घंटों की योजना पूरा माल बचा सकती है।',
      'पीक तयार असेल आणि वादळाचा अंदाज असेल तर आधी काढणी करा. काही तासांचे नियोजन संपूर्ण माल वाचवू शकते.'
    ),
    agronomyText(
      'Keep lot-wise harvest and sale records. They help you compare varieties, storage losses and buyers next season.',
      'कटाई और बिक्री का लॉट-वार रिकॉर्ड रखें। अगले मौसम में किस्म, भंडारण नुकसान और खरीदार की तुलना करने में मदद मिलेगी।',
      'काढणी व विक्रीची लॉटनिहाय नोंद ठेवा. पुढील हंगामात वाण, साठवण नुकसान आणि खरेदीदारांची तुलना करण्यास मदत होईल.'
    ),
  ],
  warning: agronomyText(
    'Damp maize and groundnut can develop aflatoxin, which is unsafe for people and animals. Dry thoroughly and discard mouldy lots.',
    'नम मक्का और मूंगफली में एफ्लाटॉक्सिन बन सकता है, जो मनुष्य और पशुओं के लिए सुरक्षित नहीं है। अच्छी तरह सुखाएं और फफूंद वाला माल हटा दें।',
    'ओले मका आणि भुईमूगात अॅफ्लाटॉक्सिन तयार होऊ शकते, जे माणसांसाठी व पशूंसाठी सुरक्षित नाही. पूर्ण सुकवा आणि बुरशीयुक्त माल टाकून द्या.'
  ),
  schemeIds: [],
  productIds: [],
  productCategories: [],
  preferCropDoctor: false,
};

const AGRONOMY_TOPIC_ROTATION: AgronomyTopic = {
  id: 'rotation',
  terms: [
    ['crop rotation', 10],
    ['rotation', 7],
    ['intercropping', 7],
    ['mixed cropping', 7],
    ['cropping pattern', 7],
    ['cover crop', 6],
    ['फसल चक्र', 10],
    ['फसलचक्र', 10],
    ['अंतरफसल', 7],
    ['मिश्रित खेती', 7],
    ['आवरण फसल', 6],
    ['पीक फेरपालट', 10],
    ['पीकफेरपालट', 10],
    ['आंतरपीक', 7],
    ['मिश्र पीक', 7],
    ['आच्छादन पीक', 6],
  ],
  title: agronomyText(
    'Plan a rotation that rebuilds the soil',
    'ऐसा फसल चक्र बनाएं जो मिट्टी सुधारे',
    'माती सुधारणारी पीक फेरपालट आखा'
  ),
  intro: agronomyText(
    'A good rotation interrupts pest cycles, spreads nutrient demand and keeps the soil covered. It is one of the cheapest long-term investments a farmer can make.',
    'अच्छा फसल चक्र कीट चक्र तोड़ता है, पोषक मांग बांटता है और मिट्टी को ढका रखता है। यह किसान का सबसे सस्ता दीर्घकालिक निवेश है।',
    'चांगली पीक फेरपालट कीड चक्र तोडते, अन्नद्रव्यांची मागणी विभागते आणि माती झाकलेली ठेवते. ही शेतकऱ्याची सर्वात स्वस्त दीर्घकालीन गुंतवणूक आहे.'
  ),
  assessment: [
    agronomyText(
      'List the last two to three crops and their plant families. Tomato, potato and chilli share a family; wheat, maize and rice are cereals.',
      'पिछली दो-तीन फसलें और उनके कुल लिखें। टमाटर, आलू और मिर्च एक ही कुल के हैं; गेहूं, मक्का और धान अनाज हैं।',
      'मागील दोन-तीन पिके आणि त्यांची कुळे लिहा. टोमॅटो, बटाटा आणि मिरची एकाच कुळातील आहेत; गहू, मका आणि भात धान्य आहेत.'
    ),
    agronomyText(
      'Note the pest and disease history, especially soil-borne problems such as root rot, wilt and nematodes.',
      'कीट और रोग का इतिहास लिखें, खासकर जड़ सड़न, उकठा और सूत्रकृमि जैसी मिट्टी से जुड़ी समस्याएं।',
      'कीड व रोगांचा इतिहास नोंदवा, विशेषतः मुळकुज, मर आणि सूत्रकृमी अशा मातीशी संबंधित समस्या.'
    ),
    agronomyText(
      'Match the rotation to water availability, soil depth, season length, fodder needs and the market you can actually reach.',
      'चक्र को पानी की उपलब्धता, मिट्टी की गहराई, मौसम की लंबाई, चारे की जरूरत और पहुंच वाले बाजार से मिलाएं।',
      'फेरपालट पाण्याची उपलब्धता, मातीची खोली, हंगामाची लांबी, चाऱ्याची गरज आणि पोहोचू शकणाऱ्या बाजाराशी जुळवा.'
    ),
  ],
  steps: [
    agronomyText(
      'Avoid planting the same family back-to-back. Follow a cereal with a legume, or a deep-rooted crop with a shallow-rooted one.',
      'एक ही कुल की फसल लगातार न लगाएं। अनाज के बाद दलहन, या गहरी जड़ वाली फसल के बाद छोटी जड़ वाली फसल लें।',
      'एकाच कुळाचे पीक सलग लागवड करू नका. धान्यानंतर कडधान्य किंवा खोल मुळांच्या पिकानंतर उथळ मुळांचे पीक घ्या.'
    ),
    agronomyText(
      'Use a legume such as cowpea, moong, gram or groundnut to add nitrogen and break disease cycles. In heavy soils, include a deep-rooted crop to improve structure.',
      'नाइट्रोजन बढ़ाने और रोग चक्र तोड़ने के लिए लोबिया, मूंग, चना या मूंगफली जैसी दलहन लें। भारी मिट्टी में संरचना सुधारने के लिए गहरी जड़ वाली फसल शामिल करें।',
      'नायट्रोजन वाढवण्यासाठी आणि रोगचक्र तोडण्यासाठी चवळी, मूग, हरभरा किंवा भुईमूग असे कडधान्य घ्या. जड मातीत रचना सुधारण्यासाठी खोल मुळांचे पीक समाविष्ट करा.'
    ),
    agronomyText(
      'Keep one green-manure or cover-crop slot every two to three cycles. Dhaincha, sunhemp or cowpea can be incorporated before the next cash crop.',
      'हर दो-तीन चक्र में एक हरी खाद या आवरण फसल का स्थान रखें। ढैंचा, सनई या लोबिया अगली नकदी फसल से पहले मिलाया जा सकता है।',
      'दर दोन-तीन फेरपालटीत एक हिरवी खत किंवा आच्छादन पिकाची जागा ठेवा. धैंचा, सनई किंवा चवळी पुढील नगदी पिकापूर्वी मिसळता येते.'
    ),
    agronomyText(
      'Write a three-season plan with one cash crop and one soil-building crop each year. Keep a border or trap crop where the pest history is severe.',
      'तीन मौसम की योजना लिखें जिसमें हर साल एक नकदी और एक मिट्टी सुधारने वाली फसल हो। जहां कीट इतिहास गंभीर है वहां किनारे या ट्रैप फसल रखें।',
      'प्रत्येक वर्षी एक नगदी आणि एक माती सुधारणारे पीक अशी तीन हंगामांची योजना लिहा. कीड इतिहास गंभीर असेल तिथे कडेचे किंवा सापळा पीक ठेवा.'
    ),
  ],
  tips: [
    agronomyText(
      'Plan three seasons at a time; a single-season swap is useful but a full rotation gives bigger soil and pest benefits.',
      'एक बार में तीन मौसम की योजना बनाएं; एक मौसम का बदलाव उपयोगी है, लेकिन पूरा चक्र मिट्टी और कीट को अधिक लाभ देता है।',
      'एकावेळी तीन हंगामांची योजना करा; एका हंगामाची अदलाबदल उपयोगी आहे, पण संपूर्ण फेरपालट माती व कीडांना अधिक फायदा देते.'
    ),
    agronomyText(
      'Rotation supports soil health but does not replace a soil test, drainage work or balanced fertiliser.',
      'फसल चक्र मिट्टी स्वास्थ्य में मदद करता है, लेकिन मिट्टी परीक्षण, जल निकास या संतुलित खाद का विकल्प नहीं है।',
      'पीक फेरपालट माती आरोग्यास मदत करते, पण माती परीक्षण, पाण्याचा निचरा किंवा संतुलित खत यांचा पर्याय नाही.'
    ),
  ],
  warning: agronomyText(
    'Rotation will not repair severe salinity, waterlogging or a hardpan by itself. Correct those constraints first.',
    'फसल चक्र अकेले गंभीर लवणता, जलभराव या कड़ी परत को ठीक नहीं करेगा। पहले उन अड़चनों को सुधारें।',
    'पीक फेरपालट एकट्याने तीव्र क्षारता, पाणी साचणे किंवा कठीण थर दुरुस्त करणार नाही. आधी त्या अडचणी सोडवा.'
  ),
  schemeIds: ['soil-health-card'],
  productIds: [],
  productCategories: [],
  preferCropDoctor: false,
};

const AGRONOMY_TOPIC_ESTABLISHMENT: AgronomyTopic = {
  id: 'establishment',
  terms: [
    ['seed treatment', 9],
    ['seed rate', 8],
    ['germination', 7],
    ['sowing time', 8],
    ['sowing', 6],
    ['planting', 6],
    ['transplanting', 7],
    ['nursery', 6],
    ['sow', 6],
    ['grow', 4],
    ['growing', 4],
    ['cultivation', 6],
    ['seed', 4],
    ['बीज', 4],
    ['बियाणे', 4],
    ['बुवाई', 7],
    ['बीज दर', 8],
    ['बीजोपचार', 9],
    ['अंकुरण', 7],
    ['रोपाई', 7],
    ['नर्सरी', 6],
    ['पेरणी', 7],
    ['बियाणे दर', 8],
    ['बीजप्रक्रिया', 9],
    ['उगवण', 7],
    ['लागवड', 6],
  ],
  title: agronomyText(
    'Get the seed and planting right',
    'बीज और बुवाई की शुरुआत सही करें',
    'बियाणे आणि लागवड योग्य करा'
  ),
  intro: agronomyText(
    'Half the yield is decided at sowing. Use tested seed, the right depth, spacing and soil moisture so the crop emerges evenly.',
    'आधी उपज बुवाई के समय तय होती है। परखा बीज, सही गहराई, दूरी और मिट्टी की नमी रखें ताकि फसल एक समान उगे।',
    'अर्धे उत्पादन पेरणीच्या वेळी ठरते. तपासलेले बियाणे, योग्य खोली, अंतर आणि मातीतील ओलावा ठेवा, जेणेकरून पीक सारखे उगवेल.'
  ),
  assessment: [
    agronomyText(
      'Check the seed source, lot number, germination percentage and whether it is certified for your season.',
      'बीज का स्रोत, लॉट नंबर, अंकुरण प्रतिशत और मौसम के लिए प्रमाणित होना जांचें।',
      'बियाण्याचा स्रोत, लॉट क्रमांक, उगवण टक्केवारी आणि हंगामासाठी प्रमाणित आहे का ते तपासा.'
    ),
    agronomyText(
      'Match the variety duration and water need to your rainfall, irrigation and market window.',
      'किस्म की अवधि और पानी की जरूरत अपनी बारिश, सिंचाई और बाजार के समय से मिलाएं।',
      'वाणाचा कालावधी आणि पाण्याची गरज तुमचा पाऊस, सिंचन आणि बाजाराच्या वेळेशी जुळवा.'
    ),
    agronomyText(
      'Check soil moisture at sowing depth. Dry soil delays germination; soggy soil causes seed rot and poor aeration.',
      'बुवाई की गहराई पर मिट्टी की नमी देखें। सूखी मिट्टी अंकुरण रोकती है; अधिक गीली मिट्टी बीज सड़ाती है और हवा नहीं पहुंचने देती।',
      'पेरणीच्या खोलीवर मातीतील ओलावा तपासा. कोरडी माती उगवण उशिरा करते; जास्त ओली माती बियाणे कुजवते आणि हवा पोहोचू देत नाही.'
    ),
  ],
  steps: [
    agronomyText(
      'Choose a variety recommended for your agro-climatic zone and season. Buy certified seed with a bill and keep the lot number for follow-up.',
      'अपने क्षेत्र और मौसम के लिए अनुशंसित किस्म चुनें। बिल के साथ प्रमाणित बीज खरीदें और शिकायत के लिए लॉट नंबर रखें।',
      'तुमच्या हवामान क्षेत्रासाठी व हंगामासाठी शिफारस केलेले वाण निवडा. बिलासह प्रमाणित बियाणे खरेदी करा आणि तक्रारीसाठी लॉट क्रमांक ठेवा.'
    ),
    agronomyText(
      'Treat seed with a recommended fungicide or biocontrol agent. For legumes, use the correct Rhizobium culture and follow the packet instructions.',
      'अनुशंसित फफूंदनाशक या जैविक एजेंट से बीजोपचार करें। दलहन में सही राइजोबियम कल्चर उपयोग करें और पैकेट के निर्देश मानें।',
      'शिफारस केलेल्या बुरशीनाशकाने किंवा जैविक घटकाने बीजप्रक्रिया करा. कडधान्यात योग्य रायझोबियम कल्चर वापरा आणि पाकिटावरील सूचना पाळा.'
    ),
    agronomyText(
      'Sow at the recommended depth and spacing. Wheat and maize usually go about 5 cm deep; shallow sowing dries out and deep sowing weakens emergence.',
      'अनुशंसित गहराई और दूरी पर बुवाई करें। गेहूं और मक्का आमतौर पर लगभग 5 सेमी गहरे जाते हैं; उथली बुवाई सूखती है और गहरी बुवाई अंकुरण कमजोर करती है।',
      'शिफारस केलेल्या खोलीवर आणि अंतरावर पेरणी करा. गहू व मका साधारण 5 सेमी खोल जातात; उथळ पेरणी सुकते आणि खोल पेरणी उगवण कमजोर करते.'
    ),
    agronomyText(
      'Calibrate the seed drill before the season and check the seed rate in a short run. Fill gaps only after the crop is established, and give light irrigation if the top layer dries.',
      'मौसम से पहले सीड ड्रिल कैलिब्रेट करें और छोटी दौड़ में बीज दर जांचें। फसल जमने के बाद ही खाली जगह भरें, और ऊपरी परत सूखने पर हल्की सिंचाई दें।',
      'हंगामापूर्वी पेरणी यंत्र कॅलिब्रेट करा आणि थोडक्यात धावेत बियाणे दर तपासा. पीक स्थिरावल्यावरच रिकाम्या जागा भरा आणि वरचा थर सुकल्यास हलके पाणी द्या.'
    ),
  ],
  tips: [
    agronomyText(
      'Adjust seed rate for actual germination. If germination is 80%, increase the rate by about one-fifth and confirm with a small trial.',
      'वास्तविक अंकुरण के अनुसार बीज दर बदलें। अंकुरण 80% हो तो दर लगभग एक-पांचवां बढ़ाएं और छोटे परीक्षण से पुष्टि करें।',
      'प्रत्यक्ष उगवणीनुसार बियाणे दर बदला. उगवण 80% असेल तर दर सुमारे एक-पंचमांश वाढवा आणि लहान चाचणीने खात्री करा.'
    ),
    agronomyText(
      'Keep a small untreated comparison strip when trying a new variety or seed treatment; it tells you what actually worked.',
      'नई किस्म या बीजोपचार आजमाते समय छोटा बिना-उपचार वाला तुलनात्मक हिस्सा रखें; इससे पता चलेगा कि वास्तव में क्या काम आया।',
      'नवीन वाण किंवा बीजप्रक्रिया वापरताना लहान उपचार न केलेला तुलनात्मक भाग ठेवा; त्यातून काय खरोखर उपयोगी ठरले ते कळेल.'
    ),
  ],
  warning: agronomyText(
    'Do not sow untreated saved seed from a diseased crop. Deep sowing and dry soil are common reasons for poor emergence.',
    'रोगग्रस्त फसल का बिना उपचार वाला बचा बीज न बोएं। गहरी बुवाई और सूखी मिट्टी कम अंकुरण के आम कारण हैं।',
    'रोगट पिकातील उपचार न केलेले साठवलेले बियाणे पेरू नका. खोल पेरणी आणि कोरडी माती कमी उगवणीची सामान्य कारणे आहेत.'
  ),
  schemeIds: ['soil-health-card'],
  productIds: [],
  productCategories: ['Micronutrients & Seeds'],
  preferCropDoctor: true,
};

const AGRONOMY_TOPIC_WEED: AgronomyTopic = {
  id: 'weed',
  terms: [
    ['weed control', 10],
    ['weed management', 10],
    ['weeding', 8],
    ['weed', 7],
    ['weeds', 7],
    ['herbicide', 8],
    ['glyphosate', 6],
    ['pendimethalin', 6],
    ['खरपतवार', 8],
    ['निराई', 8],
    ['घास', 6],
    ['शाकनाशी', 8],
    ['तण', 7],
    ['तणनाशक', 8],
    ['खुरपणी', 8],
  ],
  title: agronomyText(
    'Control weeds while they are small',
    'खरपतवार छोटे रहते ही नियंत्रित करें',
    'तण लहान असतानाच नियंत्रित करा'
  ),
  intro: agronomyText(
    'Weeds compete most during the first three to six weeks. The cheapest control is a clean seedbed, early mechanical removal and a crop that closes its canopy quickly.',
    'खरपतवार पहले तीन से छह हफ्तों में सबसे अधिक नुकसान करते हैं। सबसे सस्ता नियंत्रण साफ बुवाई तैयारी, समय पर यांत्रिक निराई और जल्दी छतरी बनाने वाली फसल है।',
    'तण पहिल्या तीन ते सहा आठवड्यांत सर्वाधिक नुकसान करतात. स्वच्छ पेरणी तयारी, वेळेवर यांत्रिक खुरपणी आणि लवकर छत तयार करणारे पीक हा सर्वात स्वस्त उपाय आहे.'
  ),
  assessment: [
    agronomyText(
      'Identify the main weeds: grasses, broadleaf weeds or sedges. Each needs a different method.',
      'मुख्य खरपतवार पहचानें: घास, चौड़ी पत्ती या सेज। हर एक का तरीका अलग है।',
      'मुख्य तण ओळखा: गवत, रुंद पाने किंवा लव्हाळे. प्रत्येकासाठी वेगळी पद्धत लागते.'
    ),
    agronomyText(
      'Note the weed and crop stage. A weed that has already flowered will return seed even if you remove the plant later.',
      'खरपतवार और फसल की अवस्था देखें। फूल आ चुका खरपतवार बाद में हटाने पर भी बीज छोड़ देगा।',
      'तण आणि पिकाची अवस्था नोंदवा. फुलोरा आलेला तण नंतर काढला तरी बिया टाकेल.'
    ),
    agronomyText(
      'Review previous herbicide use, crop injury and patches where the same weed survived. Repeated use can select resistant weeds.',
      'पहले के शाकनाशी उपयोग, फसल नुकसान और जहां वही खरपतवार बचा रहा ऐसे हिस्सों की समीक्षा करें। बार-बार उपयोग प्रतिरोधी खरपतवार चुन सकता है।',
      'आधीचा तणनाशक वापर, पिकाचे नुकसान आणि तोच तण टिकून राहिलेले भाग तपासा. सतत वापरामुळे प्रतिकारक तण निवडले जाऊ शकतात.'
    ),
  ],
  steps: [
    agronomyText(
      'Map the main weed patches and keep field borders, channels and bunds clean so weeds do not seed into the crop.',
      'मुख्य खरपतवार वाले हिस्से नक्शे पर लिखें और खेत के किनारे, नालियां व मेड़ साफ रखें ताकि खरपतवार बीज फसल में न गिराएं।',
      'मुख्य तण असलेले भाग नकाशावर नोंदवा आणि शेताचे कडे, पाण्याच्या वाटा व बांध स्वच्छ ठेवा, जेणेकरून तणाच्या बिया पिकात पडणार नाहीत.'
    ),
    agronomyText(
      'Prepare a stale seedbed where possible: irrigate, let weeds germinate, then shallow-till or use a non-selective burn-down before sowing at the recommended interval.',
      'जहां संभव हो पहले सिंचाई कर के खरपतवार उगाएं, फिर उथली जुताई या अनुशंसित अंतराल पर बुवाई से पहले गैर-चयनित नाशक से साफ करें।',
      'शक्य असेल तिथे आधी पाणी देऊन तण उगवा, नंतर उथळ नांगरट करा किंवा शिफारस केलेल्या अंतराने पेरणीपूर्वी निवड न करणारे तणनाशक वापरा.'
    ),
    agronomyText(
      'Remove weeds at two to three leaves with a hoe, hand weeder or cono weeder. Work shallow and avoid injuring crop roots; mulch can suppress the next flush.',
      'दो-तीन पत्ती पर कुदाल, हाथ यंत्र या कोनो वीडर से निराई करें। उथला काम करें और फसल की जड़ें न चोट पहुंचाएं; मल्च अगली बौछार दबा सकता है।',
      'दोन-तीन पानांवर खुरपे, हाताने काढणे किंवा कोनो वीडरने तण काढा. उथळ काम करा आणि पिकाच्या मुळांना दुखापत करू नका; आच्छादन पुढील तण दाबू शकते.'
    ),
    agronomyText(
      'Strengthen crop competition with the recommended seed rate, spacing and a vigorous variety. A crop that closes the rows early shades out late weeds.',
      'अनुशंसित बीज दर, दूरी और मजबूत किस्म से फसल की प्रतिस्पर्धा बढ़ाएं। जल्दी पंक्तियां ढकने वाली फसल देर से उगने वाले खरपतवार को छाया में दबा देती है।',
      'शिफारस केलेला बियाणे दर, अंतर आणि जोरदार वाणाने पिकाची स्पर्धा वाढवा. लवकर ओळी झाकणारे पीक उशिरा उगवणारे तण सावलीत दाबते.'
    ),
    agronomyText(
      'Use herbicide only for the labelled crop, weed and growth stage. Measure the dose, use clean water, a flat-fan nozzle and avoid drift to neighbouring crops.',
      'शाकनाशी सिर्फ लेबल पर लिखी फसल, खरपतवार और अवस्था के लिए उपयोग करें। खुराक नापें, साफ पानी, फ्लैट-फैन नोजल लें और पड़ोसी फसलों पर छिड़काव से बचें।',
      'तणनाशक फक्त लेबलावरील पीक, तण आणि वाढीच्या अवस्थेसाठी वापरा. मात्रा मोजा, स्वच्छ पाणी, फ्लॅट-फॅन नोझल वापरा आणि शेजारच्या पिकांवर फवारणी टाळा.'
    ),
  ],
  tips: [
    agronomyText(
      'Remove weeds before they flower. One timely pass is cheaper than three late passes and prevents thousands of seeds.',
      'खरपतवार में फूल आने से पहले निकालें। समय पर एक बार निराई देर की तीन बार से सस्ती है और हजारों बीज रोकती है।',
      'तण फुलण्यापूर्वी काढा. वेळेवर एक खुरपणी उशिराच्या तीन खुरपण्यांपेक्षा स्वस्त आहे आणि हजारो बिया रोखते.'
    ),
    agronomyText(
      'Clean the harvester, tiller and footwear between fields so weed seeds and rhizomes are not carried in.',
      'खेतों के बीच हार्वेस्टर, टिलर और जूते साफ करें ताकि खरपतवार के बीज और गठान इधर-उधर न जाएं।',
      'शेतांदरम्यान हार्वेस्टर, टिलर आणि पायताणे स्वच्छ करा, जेणेकरून तणाच्या बिया व मुळे इकडून तिकडे जाणार नाहीत.'
    ),
  ],
  warning: agronomyText(
    'A wrong herbicide or an off-label crop can destroy the standing crop. Read the label, check the sprayer and follow the pre-harvest interval.',
    'गलत शाकनाशी या बिना लेबल वाली फसल पर छिड़काव खड़ी फसल बर्बाद कर सकता है। लेबल पढ़ें, स्प्रेयर जांचें और कटाई से पहले की अवधि मानें।',
    'चुकीचे तणनाशक किंवा लेबल नसलेल्या पिकावर फवारणी उभे पीक नष्ट करू शकते. लेबल वाचा, फवारणी यंत्र तपासा आणि कापणीपूर्व कालावधी पाळा.'
  ),
  schemeIds: [],
  productIds: [],
  productCategories: ['Pesticides'],
  preferCropDoctor: false,
};

const AGRONOMY_TOPIC_LIVESTOCK: AgronomyTopic = {
  id: 'livestock',
  terms: [
    ['livestock', 9],
    ['animal husbandry', 9],
    ['cattle', 7],
    ['cow', 6],
    ['buffalo', 6],
    ['goat', 6],
    ['poultry', 7],
    ['dairy', 6],
    ['fodder', 6],
    ['पशुपालन', 9],
    ['गाय', 6],
    ['भैंस', 6],
    ['बकरी', 6],
    ['मुर्गी', 6],
    ['पशु', 7],
    ['चारा', 6],
    ['पशुसंगोपन', 9],
    ['गाय', 6],
    ['म्हैस', 6],
    ['शेळी', 6],
    ['कोंबडी', 6],
    ['पशू', 7],
    ['चारा', 6],
  ],
  title: agronomyText(
    'Healthy animals start with feed, water and daily observation',
    'स्वस्थ पशु चारे, पानी और रोज के निरीक्षण से शुरू होते हैं',
    'निरोगी पशू चारा, पाणी आणि दैनंदिन निरीक्षणापासून सुरू होतात'
  ),
  intro: agronomyText(
    'Most livestock problems show up early as a small change in appetite, water intake, dung or behaviour. A daily check and clean shed prevent expensive losses.',
    'अधिकांश पशु समस्याएं शुरुआत में भूख, पानी, गोबर या व्यवहार में छोटे बदलाव के रूप में दिखती हैं। रोज जांच और साफ शेड महंगे नुकसान रोकते हैं।',
    'बहुतेक पशूंच्या समस्या सुरुवातीला भूक, पाणी, शेण किंवा वर्तनातील छोट्या बदलाने दिसतात. दैनंदिन तपासणी आणि स्वच्छ गोठा महाग नुकसान टाळतात.'
  ),
  assessment: [
    agronomyText(
      'Note the species, age, purpose and production stage. A dairy animal, growing calf and poultry flock need different management.',
      'पशु की प्रजाति, उम्र, उद्देश और उत्पादन अवस्था लिखें। दूध देने वाला पशु, बढ़ता बछड़ा और मुर्गी समूह की देखभाल अलग होती है।',
      'पशूची जात, वय, उद्देश आणि उत्पादन अवस्था नोंदवा. दुधाळ पशू, वाढणारे वासरू आणि कोंबड्यांचा गट यांची काळजी वेगळी असते.'
    ),
    agronomyText(
      'Check feed quantity, quality and water availability. Sudden feed changes and mouldy fodder are common causes of digestive problems.',
      'चारे की मात्रा, गुणवत्ता और पानी की उपलब्धता देखें। अचानक चारा बदलना और फफूंद वाला चारा पाचन समस्या के आम कारण हैं।',
      'चाऱ्याची मात्रा, गुणवत्ता आणि पाण्याची उपलब्धता तपासा. अचानक चारा बदलणे आणि बुरशीयुक्त चारा पचनाच्या समस्यांची सामान्य कारणे आहेत.'
    ),
    agronomyText(
      'Review the vaccination and deworming record, recent stress, and any cough, lameness, diarrhoea or drop in milk.',
      'टीकाकरण और कृमिनाशन रिकॉर्ड, हाल का तनाव और खांसी, लंगड़ापन, दस्त या दूध में कमी देखें।',
      'लसीकरण व जंतुनाशनाची नोंद, अलीकडील ताण आणि खोकला, लंगडणे, जुलाब किंवा दूध कमी होणे पहा.'
    ),
  ],
  steps: [
    agronomyText(
      'Provide clean water at all times and a balanced ration of green fodder, dry fodder and concentrate. Change feed gradually over 7-10 days.',
      'हमेशा साफ पानी दें और हरा चारा, सूखा चारा व दाने का संतुलित राशन दें। चारा 7-10 दिन में धीरे-धीरे बदलें।',
      'नेहमी स्वच्छ पाणी द्या आणि हिरवा चारा, कोरडा चारा व दाण्याचे संतुलित रेशन द्या. चारा 7-10 दिवसांत हळूहळू बदला.'
    ),
    agronomyText(
      'Clean the shed daily, keep bedding dry and allow ventilation. Store manure away from feed and water, and wash hands after handling animals.',
      'शेड रोज साफ करें, बिछावन सूखा रखें और हवा आने दें। गोबर चारे और पानी से दूर रखें, और पशु को छूने के बाद हाथ धोएं।',
      'गोठा दररोज स्वच्छ करा, अंथरुण कोरडे ठेवा आणि हवा खेळू द्या. शेण चारा व पाण्यापासून दूर ठेवा आणि पशूला हात लावल्यानंतर हात धुवा.'
    ),
    agronomyText(
      'Observe animals at the same time daily. Separate a sick animal, record temperature and symptoms, and call the veterinarian early instead of trying random medicines.',
      'रोज एक ही समय पर पशुओं को देखें। बीमार पशु को अलग करें, तापमान और लक्षण लिखें, और बिना कारण दवा देने के बजाय जल्दी पशु चिकित्सक को बुलाएं।',
      'दररोज ठरलेल्या वेळी पशू पहा. आजारी पशू वेगळा ठेवा, तापमान व लक्षणे नोंदवा आणि विनाकारण औषधे देण्याऐवजी लवकर पशुवैद्यकाला बोलवा.'
    ),
    agronomyText(
      'Follow the local vaccination and deworming schedule. Quarantine newly purchased animals for at least two weeks before mixing them with the herd.',
      'स्थानीय टीकाकरण और कृमिनाशन कार्यक्रम मानें। नए खरीदे पशु को कम से कम दो हफ्ते अलग रखें, फिर झुंड में मिलाएं।',
      'स्थानिक लसीकरण व जंतुनाशन वेळापत्रक पाळा. नवीन खरेदी केलेला पशू किमान दोन आठवडे वेगळा ठेवा, नंतर कळपात मिसळा.'
    ),
    agronomyText(
      'Plan fodder for the dry season. Make hay or silage from clean, mature fodder, keep it dry and covered, and provide a mineral mixture as advised.',
      'सूखे मौसम का चारा पहले से योजना बनाएं। साफ, पके चारे से सूखा चारा या साइलेज बनाएं, सूखा और ढका रखें, और सलाह अनुसार खनिज मिश्रण दें।',
      'कोरड्या हंगामाचा चारा आधीच नियोजित करा. स्वच्छ, पक्व चाऱ्यापासून कोरडा चारा किंवा सायलेज तयार करा, कोरडा व झाकलेला ठेवा आणि सल्ल्यानुसार खनिज मिश्रण द्या.'
    ),
  ],
  tips: [
    agronomyText(
      'A sudden drop in feed or water intake is often the first sign of illness. Act the same day.',
      'चारा या पानी लेने में अचानक कमी अक्सर बीमारी का पहला संकेत है। उसी दिन कदम उठाएं।',
      'चारा किंवा पाणी घेण्यात अचानक घट ही बहुतेक आजाराची पहिली खूण असते. त्याच दिवशी उपाय करा.'
    ),
    agronomyText(
      'Do not feed mouldy fodder or give antibiotics without veterinary advice. Residues can enter milk and meat.',
      'फफूंद वाला चारा न खिलाएं और पशु चिकित्सक की सलाह के बिना एंटीबायोटिक न दें। अवशेष दूध और मांस में जा सकते हैं।',
      'बुरशीयुक्त चारा खाऊ घालू नका आणि पशुवैद्यकाच्या सल्ल्याशिवाय प्रतिजैविके देऊ नका. अवशेष दूध व मांसात जाऊ शकतात.'
    ),
  ],
  warning: agronomyText(
    'Some animal diseases spread to people. Use gloves for handling sick animals and contact the veterinary department for unusual deaths or sudden outbreaks.',
    'कुछ पशु रोग मनुष्यों में भी फैलते हैं। बीमार पशु को संभालते समय दस्ताने पहनें और असामान्य मृत्यु या अचानक प्रकोप पर पशु चिकित्सा विभाग से संपर्क करें।',
    'काही पशुविकार माणसांमध्येही पसरतात. आजारी पशू हाताळताना हातमोजे वापरा आणि असामान्य मृत्यू किंवा अचानक उद्रेकासाठी पशुवैद्यकीय विभागाशी संपर्क करा.'
  ),
  schemeIds: ['kcc', 'mahadbt'],
  productIds: [],
  productCategories: [],
  preferCropDoctor: false,
};

const AGRONOMY_TOPIC_WEATHER: AgronomyTopic = {
  id: 'weather',
  terms: [
    ['weather', 8],
    ['forecast', 8],
    ['rain', 6],
    ['rainfall', 6],
    ['monsoon', 6],
    ['drought', 7],
    ['flood', 7],
    ['hailstorm', 7],
    ['heatwave', 7],
    ['frost', 6],
    ['मौसम', 8],
    ['बारिश', 6],
    ['मानसून', 6],
    ['सूखा', 7],
    ['बाढ़', 7],
    ['ओलावृष्टि', 7],
    ['लू', 7],
    ['पाला', 6],
    ['हवामान', 8],
    ['पाऊस', 6],
    ['दुष्काळ', 7],
    ['पूर', 7],
    ['गारपीट', 7],
    ['उष्णतेची लाट', 7],
  ],
  title: agronomyText(
    'Use the forecast, but protect against uncertainty',
    'पूर्वानुमान देखें, लेकिन अनिश्चितता से बचाव करें',
    'अंदाज पाहा, पण अनिश्चिततेपासून संरक्षण करा'
  ),
  intro: agronomyText(
    'Weather advice is most useful when it is tied to the crop stage and to a practical action you can take today. Keep drainage, mulch and insurance records ready before the event.',
    'मौसम की सलाह तभी उपयोगी है जब वह फसल की अवस्था और आज करने वाले काम से जुड़ी हो। घटना से पहले जल निकास, मल्च और बीमा रिकॉर्ड तैयार रखें।',
    'हवामानाचा सल्ला पिकाच्या अवस्थेशी आणि आज करता येणाऱ्या कामाशी जोडला तरच उपयोगी ठरतो. घटनेपूर्वी पाण्याचा निचरा, आच्छादन आणि विमा नोंदी तयार ठेवा.'
  ),
  assessment: [
    agronomyText(
      'Identify the crop and growth stage. Flowering, pollination, fruit set and grain filling are the most weather-sensitive stages.',
      'फसल और वृद्धि अवस्था पहचानें। फूल, परागण, फल बनना और दाना भरना मौसम के प्रति सबसे संवेदनशील हैं।',
      'पीक आणि वाढीची अवस्था ओळखा. फुलोरा, परागण, फळधारणा आणि दाणे भरणे हे हवामानास सर्वात संवेदनशील टप्पे आहेत.'
    ),
    agronomyText(
      'Use a trusted local forecast and your own rain gauge. Check the next 48 hours before spraying, fertilising or irrigating.',
      'भरोसेमंद स्थानीय पूर्वानुमान और अपना वर्षा मापक उपयोग करें। छिड़काव, खाद या सिंचाई से पहले अगले 48 घंटे देखें।',
      'विश्वासार्ह स्थानिक अंदाज आणि स्वतःचे पर्जन्यमापक वापरा. फवारणी, खत किंवा पाणी देण्यापूर्वी पुढील 48 तास पहा.'
    ),
    agronomyText(
      'Check low-lying areas, drainage channels, bunds, pump safety and whether the crop is ready to harvest if the weather turns.',
      'नीचे के हिस्से, नालियां, मेड़, पंप की सुरक्षा और मौसम बिगड़ने पर फसल कटाई योग्य है या नहीं, यह देखें।',
      'सखल भाग, पाण्याच्या वाटा, बांध, पंपाची सुरक्षितता आणि हवामान बिघडल्यास पीक काढणीस तयार आहे का ते तपासा.'
    ),
  ],
  steps: [
    agronomyText(
      'Keep a simple field diary of rainfall and crop stage. A local rain gauge often tells you more than a district-level forecast.',
      'बारिश और फसल अवस्था की सादी डायरी रखें। स्थानीय वर्षा मापक जिला-स्तरीय पूर्वानुमान से अधिक उपयोगी हो सकता है।',
      'पाऊस आणि पिकाची अवस्था यांची साधी नोंदवही ठेवा. स्थानिक पर्जन्यमापक जिल्हास्तरीय अंदाजापेक्षा अधिक उपयोगी ठरू शकते.'
    ),
    agronomyText(
      'Before heavy rain, clean drainage channels, secure pumps and electrical points, support tall crops, cover nurseries and harvest mature produce that cannot wait.',
      'भारी बारिश से पहले नालियां साफ करें, पंप और बिजली के स्थान सुरक्षित करें, लंबी फसल को सहारा दें, नर्सरी ढकें और जो पक चुका है उसे काट लें।',
      'मुसळधार पावसापूर्वी पाण्याच्या वाटा स्वच्छ करा, पंप व विद्युत ठिकाणे सुरक्षित करा, उंच पिकांना आधार द्या, रोपवाटिका झाका आणि पक्व पीक काढून घ्या.'
    ),
    agronomyText(
      'In a dry spell, mulch to reduce evaporation, irrigate the most sensitive stages first and avoid applying fertiliser to dry soil.',
      'सूखे दौर में वाष्पीकरण कम करने के लिए मल्च करें, सबसे संवेदनशील अवस्था को पहले सिंचाई दें और सूखी मिट्टी में खाद न डालें।',
      'कोरड्या काळात बाष्पीभवन कमी करण्यासाठी आच्छादन करा, सर्वात संवेदनशील अवस्थेला आधी पाणी द्या आणि कोरड्या मातीत खत देऊ नका.'
    ),
    agronomyText(
      'After heavy rain, drain standing water within 24-48 hours where possible, wash silt off leaves and check for root rot and disease. Photograph damage for insurance.',
      'भारी बारिश के बाद जहां संभव हो 24-48 घंटे में पानी निकालें, पत्तियों पर कीचड़ धोएं और जड़ सड़न व रोग जांचें। बीमा के लिए नुकसान की फोटो लें।',
      'मुसळधार पावसानंतर शक्य असेल तिथे 24-48 तासांत साचलेले पाणी काढा, पानांवरील गाळ धुवा आणि मुळकुज व रोग तपासा. विम्यासाठी नुकसानाचे फोटो घ्या.'
    ),
    agronomyText(
      'For heat or frost, use shade nets, windbreaks, mulch and adjustable sowing dates. Choose tolerant varieties rather than relying on emergency sprays.',
      'गर्मी या पाले के लिए शेड नेट, हवा रोकने वाली पट्टी, मल्च और बुवाई की तारीख बदलें। आपातकालीन छिड़काव के बजाय सहनशील किस्म चुनें।',
      'उष्णता किंवा दंवासाठी सावलीचे जाळे, वाऱ्याचा अडसर, आच्छादन आणि पेरणीच्या तारखा बदला. आपत्कालीन फवारणीपेक्षा सहनशील वाण निवडा.'
    ),
  ],
  tips: [
    agronomyText(
      'Avoid spraying when rain is expected within six hours or when wind is strong. The product is wasted and can drift.',
      'छह घंटे में बारिश या तेज हवा हो तो छिड़काव टालें। उत्पाद बर्बाद होता है और दूसरी जगह जा सकता है।',
      'सहा तासांत पाऊस किंवा जोरदार वारा असेल तर फवारणी टाळा. उत्पाद वाया जाते आणि इतरत्र जाऊ शकते.'
    ),
    agronomyText(
      'Keep insurance documents and damage photos ready. Report crop loss to the insurer or agriculture office within the stated time.',
      'बीमा दस्तावेज और नुकसान की फोटो तैयार रखें। फसल नुकसान की सूचना निर्धारित समय में बीमा कंपनी या कृषि कार्यालय को दें।',
      'विमा कागदपत्रे आणि नुकसानाचे फोटो तयार ठेवा. पीक नुकसानाची माहिती ठरलेल्या वेळेत विमा कंपनी किंवा कृषी कार्यालयास द्या.'
    ),
  ],
  warning: agronomyText(
    'Do not enter an open field during lightning or a cyclone, and do not touch electrical equipment in standing water. Safety comes before the crop.',
    'बिजली या चक्रवात के समय खुले खेत में न जाएं, और पानी में खड़े बिजली उपकरण न छुएं। फसल से पहले सुरक्षा है।',
    'विजा किंवा चक्रीवादळाच्या वेळी उघड्या शेतात जाऊ नका आणि पाण्यात उभी विद्युत उपकरणे हाताळू नका. पिकापेक्षा सुरक्षितता आधी.'
  ),
  schemeIds: ['pmfby', 'pmksy'],
  productIds: [],
  productCategories: [],
  preferCropDoctor: false,
};

const AGRONOMY_TOPIC_MARKET: AgronomyTopic = {
  id: 'market',
  terms: [
    ['market price', 9],
    ['mandi price', 9],
    ['sell crop', 9],
    ['selling', 6],
    ['sell', 5],
    ['selling crops', 7],
    ['sell produce', 7],
    ['market', 6],
    ['mandi', 6],
    ['price', 5],
    ['procurement', 6],
    ['बाजार भाव', 9],
    ['मंडी भाव', 9],
    ['फसल बेच', 9],
    ['बाजार', 6],
    ['मंडी', 6],
    ['भाव', 5],
    ['खरीद', 6],
    ['बाजारभाव', 9],
    ['विक्री', 6],
    ['बाजार', 6],
  ],
  title: agronomyText(
    'Sell with a plan, not in a panic',
    'घबराहट में नहीं, योजना से बेचें',
    'घाईत नाही, योजनेने विका'
  ),
  intro: agronomyText(
    'Live prices change every day, so check the current mandi or eNAM rate before deciding. The best net price depends on grading, moisture, transport and payment reliability, not the headline rate alone.',
    'ताजा भाव रोज बदलता है, इसलिए फैसले से पहले मौजूदा मंडी या eNAM भाव देखें। सबसे अच्छा शुद्ध भाव ग्रेडिंग, नमी, ढुलाई और भुगतान की विश्वसनीयता पर निर्भर है, सिर्फ बड़े भाव पर नहीं।',
    'ताजे भाव दररोज बदलतात, म्हणून निर्णयापूर्वी सध्याचा मंडई किंवा eNAM दर पहा. सर्वोत्तम निव्वळ भाव प्रतवारी, ओलावा, वाहतूक आणि पेमेंटच्या विश्वासार्हतेवर अवलंबून असतो, केवळ जाहिरातीच्या दरावर नाही.'
  ),
  assessment: [
    agronomyText(
      'Check quantity, grade, moisture and how long the produce can be stored safely.',
      'मात्रा, ग्रेड, नमी और उपज कितने समय सुरक्षित रखी जा सकती है, यह देखें।',
      'प्रमाण, प्रतवारी, ओलावा आणि उत्पादन किती काळ सुरक्षित साठवता येईल ते तपासा.'
    ),
    agronomyText(
      'Compare at least two nearby mandis, eNAM and a local FPO or trader. Calculate transport, commission, loading and drying costs before comparing rates.',
      'कम से कम दो आसपास की मंडी, eNAM और स्थानीय FPO या व्यापारी की तुलना करें। भाव तुलना से पहले ढुलाई, कमीशन, लोडिंग और सुखाने का खर्च घटाएं।',
      'किमान दोन जवळच्या मंडई, eNAM आणि स्थानिक FPO किंवा व्यापाऱ्याची तुलना करा. दर तुलनेपूर्वी वाहतूक, कमिशन, लोडिंग आणि सुकवण्याचा खर्च वजा करा.'
    ),
    agronomyText(
      'Review your storage, cash needs and whether the crop is perishable. A guaranteed lower price may be better than an uncertain higher one.',
      'भंडारण, नकदी की जरूरत और फसल जल्दी खराब होने वाली है या नहीं, यह देखें। पक्का कम भाव अनिश्चित अधिक भाव से बेहतर हो सकता है।',
      'साठवण, रोखीची गरज आणि पीक लवकर खराब होणारे आहे का ते पहा. निश्चित कमी भाव अनिश्चित जास्त भावापेक्षा चांगला ठरू शकतो.'
    ),
  ],
  steps: [
    agronomyText(
      'Clean, dry and grade the produce before showing it. Uniform lots get better offers and reduce rejection at the gate.',
      'माल दिखाने से पहले साफ, सूखा और ग्रेड किया हुआ करें। एक समान लॉट बेहतर भाव पाते हैं और गेट पर रिजेक्ट कम होता है।',
      'माल दाखवण्यापूर्वी स्वच्छ, कोरडा आणि प्रतवारी केलेला ठेवा. सारखे लॉट चांगले भाव मिळवतात आणि गेटवर नाकारले जाणे कमी होते.'
    ),
    agronomyText(
      'Call or check the current rate at two or three markets on the same day. Compare the net amount after all deductions, not just the per-quintal rate.',
      'एक ही दिन दो-तीन बाजारों के मौजूदा भाव फोन या पोर्टल पर देखें। प्रति क्विंटल भाव के बजाय सभी कटौती के बाद शुद्ध राशि की तुलना करें।',
      'त्याच दिवशी दोन-तीन बाजारांतील सध्याचा दर फोन किंवा पोर्टलवर पहा. प्रति क्विंटल दराऐवजी सर्व वजावटीनंतरच्या निव्वळ रकमेची तुलना करा.'
    ),
    agronomyText(
      'Sell in planned lots instead of all at once if storage is safe. Never hold tomatoes, leafy greens or ripe fruit hoping for a better rate.',
      'भंडारण सुरक्षित हो तो एक साथ सब कुछ बेचने के बजाय योजना से लॉट में बेचें। टमाटर, पत्तेदार सब्जी या पके फल को अधिक भाव की उम्मीद में कभी न रोकें।',
      'साठवण सुरक्षित असेल तर सर्व एकदम न विकता योजनेनुसार लॉटमध्ये विका. टोमॅटो, पालेभाज्या किंवा पिकलेली फळे जास्त भावाच्या आशेने कधीही थांबवू नका.'
    ),
    agronomyText(
      'Get the weight, grade, rate and payment date in writing. Use a public weighbridge and prefer traceable digital payment where possible.',
      'वजन, ग्रेड, भाव और भुगतान की तारीख लिखित में लें। सार्वजनिक धर्मकांटा उपयोग करें और जहां संभव हो ट्रेस करने योग्य डिजिटल भुगतान चुनें।',
      'वजन, प्रतवारी, दर आणि पेमेंटची तारीख लेखी घ्या. सार्वजनिक काट्याचा वापर करा आणि शक्य असेल तिथे शोधता येणारे डिजिटल पेमेंट निवडा.'
    ),
    agronomyText(
      'Keep receipts and follow up on payment before the agreed date. If a buyer delays repeatedly, check their licence and consider an FPO or regulated market.',
      'रसीद रखें और तय तारीख से पहले भुगतान का पीछा करें। खरीदार बार-बार देरी करे तो लाइसेंस जांचें और FPO या नियंत्रित बाजार पर विचार करें।',
      'पावत्या ठेवा आणि ठरलेल्या तारखेपूर्वी पेमेंटचा पाठपुरावा करा. खरेदीदार वारंवार उशीर करत असेल तर परवाना तपासा आणि FPO किंवा नियंत्रित बाजाराचा विचार करा.'
    ),
  ],
  tips: [
    agronomyText(
      'Track prices for two weeks before harvest. This helps you recognise a genuinely good offer instead of reacting to one day’s number.',
      'कटाई से दो हफ्ते पहले भाव पर नजर रखें। इससे एक दिन के आंकड़े पर प्रतिक्रिया देने के बजाय सच में अच्छा भाव पहचानने में मदद मिलेगी।',
      'काढणीच्या दोन आठवडे आधी भाव पाहत राहा. यामुळे एका दिवसाच्या आकड्यावर प्रतिक्रिया देण्याऐवजी खरोखर चांगला भाव ओळखता येईल.'
    ),
    agronomyText(
      'Selling through an FPO or with other farmers can improve bargaining power and reduce transport costs.',
      'FPO के माध्यम से या दूसरे किसानों के साथ बेचने से सौदेबाजी की ताकत बढ़ती है और ढुलाई खर्च घटता है।',
      'FPO मार्फत किंवा इतर शेतकऱ्यांसोबत विकल्यास सौदेबाजीची ताकद वाढते आणि वाहतूक खर्च कमी होतो.'
    ),
  ],
  warning: agronomyText(
    'Do not hand over produce without a receipt or sell through an unlicensed buyer promising an unusually high rate. Never add water or foreign material to increase weight.',
    'बिना रसीद माल न दें और असामान्य रूप से ऊंचा भाव का वादा करने वाले बिना लाइसेंस खरीदार को न बेचें। वजन बढ़ाने के लिए पानी या बाहरी पदार्थ कभी न मिलाएं।',
    'पावतीशिवाय माल देऊ नका आणि असामान्य उच्च दराचे आश्वासन देणाऱ्या परवाना नसलेल्या खरेदीदाराला विकू नका. वजन वाढवण्यासाठी पाणी किंवा बाह्य पदार्थ कधीही मिसळू नका.'
  ),
  schemeIds: ['kcc', 'digital-agriculture-mission'],
  productIds: [],
  productCategories: [],
  preferCropDoctor: false,
};

const AGRONOMY_TOPIC_PLANNING: AgronomyTopic = {
  id: 'planning',
  terms: [
    ['crop planning', 10],
    ['crop plan', 9],
    ['season plan', 9],
    ['farming plan', 8],
    ['farm planning', 8],
    ['which crop', 8],
    ['what to grow', 8],
    ['फसल योजना', 9],
    ['खेती योजना', 8],
    ['कौन सी फसल', 8],
    ['पीक नियोजन', 10],
    ['पीक योजना', 9],
    ['शेती योजना', 8],
    ['कोणते पीक', 8],
  ],
  title: agronomyText(
    'Plan the season around water, money and risk',
    'मौसम की योजना पानी, पैसा और जोखिम के आधार पर बनाएं',
    'हंगामाची योजना पाणी, पैसा आणि जोखीम यावर आधारित करा'
  ),
  intro: agronomyText(
    'A crop plan is not a list of crops. It is a month-by-month decision map that matches your water, labour, money and market before the season starts.',
    'फसल योजना सिर्फ फसलों की सूची नहीं है। यह महीने-दर-महीने निर्णयों का नक्शा है जो मौसम शुरू होने से पहले पानी, मजदूरी, पैसा और बाजार से मिलता है।',
    'पीक योजना म्हणजे पिकांची यादी नाही. हंगाम सुरू होण्यापूर्वी पाणी, मजुरी, पैसा आणि बाजार यांच्याशी जुळणारा महिन्यानुसार निर्णयांचा नकाशा आहे.'
  ),
  assessment: [
    agronomyText(
      'Calculate available water for the whole season, not just for the first irrigation. Include rainfall, canal turns, well yield and power supply.',
      'पूरे मौसम के लिए उपलब्ध पानी गिनें, सिर्फ पहली सिंचाई के लिए नहीं। बारिश, नहर का टर्न, कुएं की क्षमता और बिजली शामिल करें।',
      'संपूर्ण हंगामासाठी उपलब्ध पाणी मोजा, केवळ पहिल्या पाण्यासाठी नाही. पाऊस, कालव्याची पाळी, विहिरीची क्षमता आणि वीज समाविष्ट करा.'
    ),
    agronomyText(
      'List your budget, labour, machinery and storage. A crop that needs labour or drying capacity you do not have can lose money even at a good price.',
      'बजट, मजदूरी, मशीनरी और भंडारण लिखें। जिस फसल को आपके पास न हो ऐसी मजदूरी या सुखाने की क्षमता चाहिए, वह अच्छे भाव पर भी घाटा दे सकती है।',
      'बजेट, मजुरी, यंत्रसामग्री आणि साठवण क्षमता लिहा. तुमच्याकडे नसलेली मजुरी किंवा सुकवण्याची क्षमता लागणारे पीक चांगल्या भावातही तोटा देऊ शकते.'
    ),
    agronomyText(
      'Review your risk: pest history, drainage, price swings and insurance. Decide how much loss you can absorb before choosing a high-input crop.',
      'अपना जोखिम देखें: कीट इतिहास, जल निकास, भाव का उतार-चढ़ाव और बीमा। अधिक खर्च वाली फसल चुनने से पहले तय करें कि कितना नुकसान सह सकते हैं।',
      'तुमची जोखीम पहा: कीड इतिहास, पाण्याचा निचरा, भावातील चढउतार आणि विमा. जास्त खर्चाचे पीक निवडण्यापूर्वी किती नुकसान सहन करू शकता ते ठरवा.'
    ),
  ],
  steps: [
    agronomyText(
      'Draw a simple field map, get a soil test and write the water available for each block. Put the most water-sensitive crop where irrigation is most reliable.',
      'सादा खेत नक्शा बनाएं, मिट्टी परीक्षण कराएं और हर हिस्से के लिए उपलब्ध पानी लिखें। सबसे अधिक पानी चाहने वाली फसल वहां लगाएं जहां सिंचाई सबसे भरोसेमंद है।',
      'साधा शेत नकाशा काढा, माती परीक्षण करा आणि प्रत्येक भागासाठी उपलब्ध पाणी लिहा. सर्वाधिक पाणी लागणारे पीक जिथे पाणी सर्वात विश्वासार्ह आहे तिथे लावा.'
    ),
    agronomyText(
      'Choose two or three crops or varieties with different durations and market windows. Avoid putting the whole farm into one crop or one harvest date.',
      'अलग-अलग अवधि और बाजार समय वाली दो-तीन फसलें या किस्में चुनें। पूरा खेत एक फसल या एक कटाई तारीख पर न लगाएं।',
      'वेगवेगळ्या कालावधी व बाजार वेळा असलेली दोन-तीन पिके किंवा वाण निवडा. संपूर्ण शेत एका पिकावर किंवा एका काढणी तारखेवर ठेवू नका.'
    ),
    agronomyText(
      'Make a month-wise calendar for land preparation, sowing, fertiliser, irrigation, pest checks, harvest and sale. Mark the critical stages you cannot miss.',
      'भूमि तैयारी, बुवाई, खाद, सिंचाई, कीट जांच, कटाई और बिक्री का महीने-वार कैलेंडर बनाएं। जिन महत्वपूर्ण अवस्थाओं को नजरअंदाज नहीं कर सकते, उन्हें चिह्नित करें।',
      'जमीन तयारी, पेरणी, खत, पाणी, कीड तपासणी, काढणी आणि विक्रीचे महिन्यानुसार कॅलेंडर बनवा. जे महत्त्वाचे टप्पे चुकवता येणार नाहीत ते खूण करा.'
    ),
    agronomyText(
      'Arrange seed, fertiliser, labour, credit and insurance before sowing. Compare the total cost of credit and avoid informal loans with unclear terms.',
      'बुवाई से पहले बीज, खाद, मजदूरी, ऋण और बीमा की व्यवस्था करें। ऋण की कुल लागत तुलना करें और अस्पष्ट शर्तों वाले अनौपचारिक कर्ज से बचें।',
      'पेरणीपूर्वी बियाणे, खत, मजुरी, कर्ज आणि विमा यांची व्यवस्था करा. कर्जाची एकूण किंमत तुलना करा आणि अस्पष्ट अटींचे अनौपचारिक कर्ज टाळा.'
    ),
    agronomyText(
      'Keep a 10% contingency for weather or pest problems. At the end of the season, compare planned and actual cost, yield and price.',
      'मौसम या कीट के लिए 10% आपातकालीन राशि रखें। मौसम के अंत में योजना और वास्तविक खर्च, उपज व भाव की तुलना करें।',
      'हवामान किंवा कीडांसाठी 10% आपत्कालीन रक्कम ठेवा. हंगामाच्या शेवटी नियोजित व प्रत्यक्ष खर्च, उत्पादन आणि भाव यांची तुलना करा.'
    ),
  ],
  tips: [
    agronomyText(
      'Try a new crop or variety on a small plot first. One season of local experience is more reliable than a very confident sales pitch.',
      'नई फसल या किस्म पहले छोटे हिस्से में आजमाएं। स्थानीय अनुभव का एक मौसम बहुत आत्मविश्वास वाली बिक्री बात से अधिक भरोसेमंद है।',
      'नवीन पीक किंवा वाण आधी लहान भागात वापरून पहा. स्थानिक अनुभवाचा एक हंगाम अतिशय आत्मविश्वासाने केलेल्या विक्री बोलीपेक्षा अधिक विश्वासार्ह असतो.'
    ),
    agronomyText(
      'Write down actual costs and yields. That record is the best basis for next season’s plan.',
      'वास्तविक खर्च और उपज लिखें। यही रिकॉर्ड अगले मौसम की योजना का सबसे अच्छा आधार है।',
      'प्रत्यक्ष खर्च व उत्पादन लिहा. हीच नोंद पुढील हंगामाच्या योजनेचा सर्वोत्तम आधार आहे.'
    ),
  ],
  warning: agronomyText(
    'Do not commit the entire farm to one crop because of a single high price. Check insurance enrolment deadlines and read loan conditions before signing.',
    'एक ऊंचे भाव देखकर पूरा खेत एक फसल में न लगाएं। बीमा नामांकन की अंतिम तारीख देखें और हस्ताक्षर से पहले ऋण की शर्तें पढ़ें।',
    'एका उच्च भावामुळे संपूर्ण शेत एका पिकात गुंतवू नका. विमा नोंदणीची शेवटची तारीख पहा आणि सही करण्यापूर्वी कर्जाच्या अटी वाचा.'
  ),
  schemeIds: ['soil-health-card', 'kcc', 'pmfby'],
  productIds: [],
  productCategories: [],
  preferCropDoctor: false,
};

const AGRONOMY_TOPIC_ORCHARD: AgronomyTopic = {
  id: 'orchard',
  terms: [
    ['orchard', 9],
    ['fruit tree', 9],
    ['fruit orchard', 9],
    ['pruning', 7],
    ['mango tree', 8],
    ['banana plant', 7],
    ['बाग', 7],
    ['फलदार पेड़', 9],
    ['आम का पेड़', 8],
    ['छंटाई', 7],
    ['फल बाग', 9],
    ['फळबाग', 9],
    ['फळझाड', 9],
    ['आंब्याचे झाड', 8],
    ['छाटणी', 7],
  ],
  title: agronomyText(
    'Care for the orchard through the year',
    'सालभर बाग की देखभाल करें',
    'वर्षभर फळबागेची काळजी घ्या'
  ),
  intro: agronomyText(
    'Fruit trees reward steady management more than emergency treatments. Root-zone moisture, light in the canopy, balanced nutrition and early pest checks decide fruit size and quality.',
    'फलदार पेड़ों को आपातकालीन इलाज से ज्यादा लगातार देखभाल चाहिए। जड़ क्षेत्र की नमी, पेड़ में रोशनी, संतुलित पोषण और शुरुआती कीट जांच फल के आकार और गुणवत्ता तय करते हैं।',
    'फळझाडांना तातडीच्या उपचारांपेक्षा सातत्यपूर्ण काळजी अधिक फायद्याची ठरते. मुळांच्या भागातील ओलावा, झाडातील प्रकाश, संतुलित पोषण आणि लवकर कीड तपासणी फळाचा आकार व गुणवत्ता ठरवतात.'
  ),
  assessment: [
    agronomyText(
      'Note the species, variety, age, rootstock and whether the tree is young, growing or bearing.',
      'प्रजाति, किस्म, उम्र, रूटस्टॉक और पेड़ छोटा, बढ़ता या फल देने वाला है, यह लिखें।',
      'जात, वाण, वय, मुळाचा प्रकार आणि झाड लहान, वाढणारे की फळ देणारे आहे ते नोंदवा.'
    ),
    agronomyText(
      'Check soil depth, drainage and the irrigation method. Fruit trees suffer quickly from water standing near the trunk.',
      'मिट्टी की गहराई, जल निकास और सिंचाई का तरीका देखें। तने के पास पानी रुकने से फलदार पेड़ जल्दी प्रभावित होते हैं।',
      'मातीची खोली, पाण्याचा निचरा आणि सिंचन पद्धत तपासा. खोडाजवळ पाणी साचल्यास फळझाडे लवकर बाधित होतात.'
    ),
    agronomyText(
      'Review pruning history, fruit fly or hopper damage, leaf colour and the last nutrient application.',
      'छंटाई का इतिहास, फल मक्खी या हॉपर का नुकसान, पत्ती का रंग और पिछला पोषक उपयोग देखें।',
      'छाटणीचा इतिहास, फळमाशी किंवा तुडतुड्याचे नुकसान, पानांचा रंग आणि शेवटचा अन्नद्रव्य वापर पहा.'
    ),
  ],
  steps: [
    agronomyText(
      'Make a basin around the canopy, keep the trunk dry and apply 5-10 cm of organic mulch, leaving a gap around the trunk. Improve drainage before the monsoon.',
      'पेड़ की छतरी के अनुसार क्यारी बनाएं, तना सूखा रखें और तने के पास जगह छोड़कर 5-10 सेमी जैविक मल्च डालें। मानसून से पहले जल निकास सुधारें।',
      'झाडाच्या छतरीभोवती गादी करा, खोड कोरडे ठेवा आणि खोडाभोवती जागा सोडून 5-10 सेमी सेंद्रिय आच्छादन द्या. पावसाळ्यापूर्वी पाण्याचा निचरा सुधारा.'
    ),
    agronomyText(
      'Irrigate the root zone deeply and less often. Young trees need more frequent small amounts; bearing trees need steady moisture from flowering to fruit development.',
      'जड़ क्षेत्र में गहरी और कम बार सिंचाई करें। छोटे पेड़ों को अधिक बार थोड़ा पानी चाहिए; फल देने वाले पेड़ों को फूल से फल विकास तक लगातार नमी चाहिए।',
      'मुळांच्या भागात खोल आणि कमी वेळा पाणी द्या. लहान झाडांना अधिक वेळा थोडे पाणी लागते; फळ देणाऱ्या झाडांना फुलोऱ्यापासून फळ वाढीपर्यंत सातत्याने ओलावा लागतो.'
    ),
    agronomyText(
      'Prune dead, diseased and crossing branches and open the centre for light. Clean and disinfect tools between trees, and avoid heavy pruning in wet weather.',
      'सूखी, रोगग्रस्त और एक-दूसरे को काटने वाली टहनियां काटें और रोशनी के लिए बीच खोलें। पेड़ों के बीच औजार साफ व कीटाणुरहित करें, गीले मौसम में भारी छंटाई न करें।',
      'सुकलेल्या, रोगट आणि एकमेकांना छेदणाऱ्या फांद्या छाटा आणि प्रकाशासाठी मध्यभाग मोकळा करा. झाडांदरम्यान अवजारे स्वच्छ व निर्जंतुक करा आणि ओल्या हवामानात जोरदार छाटणी टाळा.'
    ),
    agronomyText(
      'Apply nutrients in split doses based on soil or leaf analysis. Watch zinc, boron and iron, which are common limitations in fruit crops.',
      'मिट्टी या पत्ती परीक्षण के आधार पर पोषक तत्व विभाजित मात्रा में दें। जिंक, बोरॉन और लोहे पर ध्यान दें, जो फल फसलों में आम कमी हैं।',
      'माती किंवा पानांच्या परीक्षणानुसार अन्नद्रव्ये विभागून द्या. झिंक, बोरॉन आणि लोह याकडे लक्ष द्या, जी फळपिकांत सामान्य कमतरता आहेत.'
    ),
    agronomyText(
      'Monitor fruit fly, hoppers and fruit borers with traps and weekly checks. Remove fallen fruit, use bagging where practical and spray only at the recommended stage with the correct pre-harvest interval.',
      'फल मक्खी, हॉपर और फल छेदक की साप्ताहिक जांच और ट्रैप से निगरानी करें। गिरे फल हटाएं, जहां संभव हो थैली लगाएं और सही अवस्था पर अनुशंसित अंतराल के साथ छिड़काव करें।',
      'फळमाशी, तुडतुडे आणि फळ पोखरणाऱ्या अळ्यांची दर आठवड्याला तपासणी व सापळ्यांनी निगराणी करा. पडलेली फळे काढा, शक्य असेल तिथे पिशवी लावा आणि योग्य अवस्थेत कापणीपूर्व कालावधी पाळून फवारणी करा.'
    ),
  ],
  tips: [
    agronomyText(
      'Young orchards can be intercropped with legumes, but keep a clear basin around each tree and avoid crops that compete for water.',
      'छोटी बाग में दलहन की अंतरफसल ली जा सकती है, लेकिन हर पेड़ के चारों ओर साफ क्यारी रखें और पानी के लिए प्रतिस्पर्धा करने वाली फसल से बचें।',
      'लहान फळबागेत कडधान्यांचे आंतरपीक घेता येते, पण प्रत्येक झाडाभोवती स्वच्छ गादी ठेवा आणि पाण्यासाठी स्पर्धा करणारे पीक टाळा.'
    ),
    agronomyText(
      'Keep flowering weeds and border plants where safe to support pollinators, but remove diseased fruit and prunings from the orchard.',
      'जहां सुरक्षित हो वहां फूल देने वाले खरपतवार और किनारे के पौधे परागणकों के लिए रखें, लेकिन रोगग्रस्त फल और कटी टहनियां बाग से हटाएं।',
      'सुरक्षित असेल तिथे फुलणारे तण आणि कडेची झाडे परागणकांसाठी ठेवा, पण रोगट फळे व छाटलेल्या फांद्या बागेतून काढा.'
    ),
  ],
  warning: agronomyText(
    'Do not pile mulch against the trunk, and do not spray herbicide near young trees. Check the pre-harvest interval before picking fruit.',
    'मल्च को तने से सटाकर न रखें, और छोटे पेड़ों के पास शाकनाशी न छिड़कें। फल तोड़ने से पहले कटाई से पहले की अवधि जांचें।',
    'आच्छादन खोडाला टेकवून ठेवू नका आणि लहान झाडांजवळ तणनाशक फवारू नका. फळे तोडण्यापूर्वी कापणीपूर्व कालावधी तपासा.'
  ),
  schemeIds: ['pmksy', 'soil-health-card'],
  productIds: [],
  productCategories: ['Bio-Cures & Organics'],
  preferCropDoctor: true,
};

const AGRONOMY_TOPIC_GENERAL: AgronomyTopic = {
  id: 'general',
  terms: [
    ['farming advice', 6],
    ['farm problem', 6],
    ['crop problem', 7],
    ['agriculture advice', 6],
    ['guidance', 5],
    ['problem', 4],
    ['issue', 4],
    ['खेती सलाह', 6],
    ['फसल समस्या', 7],
    ['कृषि सलाह', 6],
    ['समस्या', 4],
    ['शेती सल्ला', 6],
    ['पीक समस्या', 7],
    ['कृषी सल्ला', 6],
    ['मार्गदर्शन', 5],
    ['अडचण', 4],
  ],
  title: agronomyText(
    'Turn the question into a field decision',
    'सवाल को खेत के फैसले में बदलें',
    'प्रश्नाचे शेतातील निर्णयात रूपांतर करा'
  ),
  intro: agronomyText(
    'I may not have live local data, but a good field decision starts with a clear description, a careful inspection and one change at a time. Tell me the crop, stage, location and what changed.',
    'मेरे पास ताजा स्थानीय डेटा नहीं हो सकता, लेकिन अच्छा खेत फैसला साफ विवरण, ध्यान से जांच और एक बार में एक बदलाव से शुरू होता है। फसल, अवस्था, स्थान और क्या बदला, बताएं।',
    'माझ्याकडे ताजा स्थानिक माहिती नसेल, पण चांगला शेत निर्णय स्पष्ट वर्णन, काळजीपूर्वक तपासणी आणि एकावेळी एक बदल यापासून सुरू होतो. पीक, अवस्था, ठिकाण आणि काय बदलले ते सांगा.'
  ),
  assessment: [
    agronomyText(
      'Identify the crop, variety, growth stage and the area affected. A nursery problem and a flowering-stage problem need different answers.',
      'फसल, किस्म, वृद्धि अवस्था और प्रभावित क्षेत्र पहचानें। नर्सरी की समस्या और फूल अवस्था की समस्या के जवाब अलग होते हैं।',
      'पीक, वाण, वाढीची अवस्था आणि बाधित क्षेत्र ओळखा. रोपवाटिकेतील समस्या आणि फुलोऱ्यातील समस्येची उत्तरे वेगळी असतात.'
    ),
    agronomyText(
      'Note when the problem started, whether it spread, and the recent weather, irrigation and input changes.',
      'समस्या कब शुरू हुई, फैली या नहीं, और हाल का मौसम, सिंचाई व इनपुट बदलाव लिखें।',
      'समस्या कधी सुरू झाली, पसरली का आणि अलीकडील हवामान, पाणी व इनपुट बदल नोंदवा.'
    ),
    agronomyText(
      'Compare healthy and affected plants in several spots, including roots, stems, upper and lower leaf surfaces.',
      'कई जगह स्वस्थ और प्रभावित पौधों की तुलना करें, जड़, तना, ऊपरी और निचली पत्ती की सतह सहित।',
      'अनेक ठिकाणी निरोगी व बाधित झाडांची तुलना करा, मुळे, खोड, वरची व खालची पानांची पृष्ठभाग यासह.'
    ),
  ],
  steps: [
    agronomyText(
      'Write a short field note: crop, variety, stage, area, location, weather, last irrigation, last spray and what changed first.',
      'छोटी खेत टिप्पणी लिखें: फसल, किस्म, अवस्था, क्षेत्र, स्थान, मौसम, पिछली सिंचाई, पिछला छिड़काव और सबसे पहले क्या बदला।',
      'लहान शेत नोंद लिहा: पीक, वाण, अवस्था, क्षेत्र, ठिकाण, हवामान, शेवटचे पाणी, शेवटची फवारणी आणि सर्वात आधी काय बदलले.'
    ),
    agronomyText(
      'Take clear photos in daylight and inspect at least five plants or spots. Dig beside one affected plant to check the roots.',
      'दिन की रोशनी में साफ फोटो लें और कम से कम पांच पौधे या जगह देखें। एक प्रभावित पौधे के पास खोदकर जड़ें जांचें।',
      'दिवसाच्या उजेडात स्पष्ट फोटो घ्या आणि किमान पाच झाडे किंवा ठिकाणे तपासा. एका बाधित झाडाजवळ खोदून मुळे तपासा.'
    ),
    agronomyText(
      'Check water, drainage and leaf undersides before buying any input. Confirm the cause with Crop Doctor, your KVK or an agriculture officer when the pattern is unclear.',
      'कोई इनपुट खरीदने से पहले पानी, जल निकास और पत्तियों के नीचे देखें। पैटर्न साफ न हो तो क्रॉप डॉक्टर, KVK या कृषि अधिकारी से कारण की पुष्टि करें।',
      'कोणतेही इनपुट खरेदीपूर्वी पाणी, निचरा आणि पानांची खालील बाजू तपासा. नमुना स्पष्ट नसेल तर क्रॉप डॉक्टर, KVK किंवा कृषी अधिकाऱ्याकडून कारणाची खात्री करा.'
    ),
    agronomyText(
      'Try one change on a small strip and compare it with an untreated strip. Change one factor at a time so you know what worked.',
      'छोटे हिस्से में एक बदलाव आजमाएं और बिना बदलाव वाले हिस्से से तुलना करें। एक बार में एक कारक बदलें ताकि पता चले कि क्या काम आया।',
      'लहान भागात एक बदल करून पहा आणि बदल न केलेल्या भागाशी तुलना करा. एकावेळी एकच घटक बदला, म्हणजे काय उपयोगी ठरले ते कळेल.'
    ),
    agronomyText(
      'Keep a record of the action, cost and result. If the problem affects a large area or causes sudden death, contact the agriculture department early.',
      'किए गए काम, खर्च और परिणाम का रिकॉर्ड रखें। समस्या बड़े क्षेत्र में हो या अचानक मृत्यु हो, तो जल्दी कृषि विभाग से संपर्क करें।',
      'केलेले काम, खर्च आणि परिणाम यांची नोंद ठेवा. समस्या मोठ्या भागात असेल किंवा अचानक मृत्यू होत असेल तर लवकर कृषी विभागाशी संपर्क करा.'
    ),
  ],
  tips: [
    agronomyText(
      'Do not mix several pesticides or fertilisers at once. If something goes wrong, you will not know which product caused it.',
      'एक साथ कई कीटनाशक या खाद न मिलाएं। कुछ गलत होने पर पता नहीं चलेगा कि किस उत्पाद से हुआ।',
      'एकत्र अनेक कीटकनाशके किंवा खते मिसळू नका. काही चुकल्यास कोणत्या उत्पादनामुळे झाले ते कळणार नाही.'
    ),
    agronomyText(
      'A specific question gets a specific answer. Share crop, stage, location and a clear photo whenever possible.',
      'स्पष्ट सवाल से स्पष्ट जवाब मिलता है। जहां संभव हो फसल, अवस्था, स्थान और साफ फोटो साझा करें।',
      'विशिष्ट प्रश्नाला विशिष्ट उत्तर मिळते. शक्य असेल तिथे पीक, अवस्था, ठिकाण आणि स्पष्ट फोटो द्या.'
    ),
  ],
  warning: agronomyText(
    'For a sudden outbreak, unusual animal death or a large-area crop failure, contact your local agriculture or veterinary department instead of relying only on an app.',
    'अचानक प्रकोप, असामान्य पशु मृत्यु या बड़े क्षेत्र में फसल खराब होने पर सिर्फ ऐप पर निर्भर न रहें, स्थानीय कृषि या पशु चिकित्सा विभाग से संपर्क करें।',
    'अचानक उद्रेक, असामान्य पशू मृत्यू किंवा मोठ्या भागात पीक नष्ट झाल्यास केवळ अॅपवर अवलंबून न राहता स्थानिक कृषी किंवा पशुवैद्यकीय विभागाशी संपर्क करा.'
  ),
  schemeIds: [],
  productIds: [],
  productCategories: [],
  preferCropDoctor: false,
};

const AGRONOMY_CROP_GUIDES: AgronomyCropGuide[] = [
  {
    aliases: ['wheat', 'gehu', 'gahu', 'गेहूं', 'गहू', 'गव्ह'],
    label: agronomyText('Wheat', 'गेहूं', 'गहू'),
    sowing: agronomyText(
      'Sow certified, treated seed in the recommended window, usually late October to November in northern India, about 5 cm deep in 20-22 cm rows.',
      'प्रमाणित और उपचारित बीज सही समय पर, उत्तर भारत में आमतौर पर अक्टूबर के अंत से नवंबर तक, लगभग 5 सेमी गहरा और 20-22 सेमी पंक्तियों में बोएं।',
      'प्रमाणित व प्रक्रिया केलेले बियाणे योग्य वेळी, उत्तर भारतात साधारण ऑक्टोबरअखेर ते नोव्हेंबरमध्ये, सुमारे 5 सेमी खोल व 20-22 सेमी ओळींत पेरा.'
    ),
    water: agronomyText(
      'Irrigate at crown-root initiation, tillering, jointing, flowering and grain filling. Avoid water stress at flowering.',
      'क्राउन रूट शुरुआत, कल्ले बनना, गांठ बनना, फूल और दाना भरने पर सिंचाई करें। फूल के समय पानी की कमी न होने दें।',
      'मुकुटमूळ अवस्था, कल्ले फुटणे, गाठ बनणे, फुलोरा आणि दाणे भरणे या वेळी पाणी द्या. फुलोऱ्यात पाण्याचा ताण टाळा.'
    ),
    nutrition: agronomyText(
      'Apply NPK after a soil test and split nitrogen into two or three doses. Add sulphur where the test shows a deficiency.',
      'मिट्टी परीक्षण के बाद NPK दें और नाइट्रोजन दो-तीन विभाजित मात्रा में दें। परीक्षण में कमी हो तो सल्फर दें।',
      'माती परीक्षणानंतर NPK द्या आणि नायट्रोजन दोन-तीन विभागांत द्या. परीक्षणात कमतरता दिसल्यास गंधक द्या.'
    ),
    harvest: agronomyText(
      'Harvest when the grain is hard, the straw is golden and moisture is near 12-14%. Dry and clean before storage.',
      'दाना सख्त, भूसा सुनहरा और नमी लगभग 12-14% होने पर कटाई करें। भंडारण से पहले सुखाएं और साफ करें।',
      'दाणे कडक, पेंढा सोनेरी आणि ओलावा सुमारे 12-14% असताना काढणी करा. साठवणीपूर्वी सुकवा आणि स्वच्छ करा.'
    ),
    watch: agronomyText(
      'Watch for yellow rust, powdery mildew, aphids and lodging after heavy rain or excess nitrogen.',
      'पीला रतुआ, पाउडरी मिल्ड्यू, माहू और भारी बारिश या अधिक नाइट्रोजन के बाद गिरने पर नजर रखें।',
      'पिवळा तांबेरा, भुरी, मावा आणि मुसळधार पाऊस किंवा जास्त नायट्रोजननंतर पिके पडण्याकडे लक्ष द्या.'
    ),
  },
  {
    aliases: ['rice', 'paddy', 'dhan', 'bhat', 'धान', 'भात'],
    label: agronomyText('Rice', 'धान', 'भात'),
    sowing: agronomyText(
      'Transplant 20-25 day old seedlings, two to three per hill, or use the recommended direct-seeded rate. Keep shallow water after establishment.',
      '20-25 दिन की पौध, प्रति पंक्ति दो-तीन, लगाएं या अनुशंसित सीधी बुवाई दर उपयोग करें। जमने के बाद उथला पानी रखें।',
      '20-25 दिवसांची रोपे, प्रत्येक जागी दोन-तीन, लावा किंवा शिफारस केलेला थेट पेरणी दर वापरा. स्थिरावल्यानंतर उथळ पाणी ठेवा.'
    ),
    water: agronomyText(
      'Keep 2-5 cm water during establishment. Alternate wetting and drying can save water; drain the field 7-10 days before harvest.',
      'शुरुआत में 2-5 सेमी पानी रखें। बारी-बारी गीला-सूखा तरीका पानी बचा सकता है; कटाई से 7-10 दिन पहले खेत से पानी निकालें।',
      'सुरुवातीला 2-5 सेमी पाणी ठेवा. आलटून पालटून ओले-कोरडे पद्धत पाणी वाचवू शकते; काढणीच्या 7-10 दिवस आधी शेतातील पाणी काढा.'
    ),
    nutrition: agronomyText(
      'Apply NPK in splits and avoid excess nitrogen. Zinc is a common limitation in lowland rice.',
      'NPK विभाजित मात्रा में दें और अधिक नाइट्रोजन से बचें। निचली धान में जिंक की कमी आम है।',
      'NPK विभागून द्या आणि जास्त नायट्रोजन टाळा. सखल भातात झिंकची कमतरता सामान्य आहे.'
    ),
    harvest: agronomyText(
      'Harvest when 80-85% of grains are straw coloured, then dry to about 12-14% moisture.',
      '80-85% दाने भूसे के रंग के होने पर कटाई करें, फिर लगभग 12-14% नमी तक सुखाएं।',
      '80-85% दाणे पेंढ्याच्या रंगाचे झाल्यावर काढणी करा, नंतर सुमारे 12-14% ओलाव्यापर्यंत सुकवा.'
    ),
    watch: agronomyText(
      'Watch for blast, bacterial blight, stem borer and brown plant hopper.',
      'ब्लास्ट, जीवाणु झुलसा, तना छेदक और भूरा फुदका देखें।',
      'ब्लास्ट, जिवाणू करपा, खोड पोखरणारी अळी आणि तपकिरी तुडतुडे पहा.'
    ),
  },
  {
    aliases: [
      'tomato',
      'tomatoes',
      'tamatar',
      'टमाटर',
      'टोमॅटो',
    ],
    label: agronomyText('Tomato', 'टमाटर', 'टोमॅटो'),
    sowing: agronomyText(
      'Raise the nursery in clean trays, transplant 25-30 day old seedlings on raised beds and stake plants early.',
      'साफ ट्रे में नर्सरी तैयार करें, 25-30 दिन की पौध ऊंची क्यारियों में लगाएं और पौधों को जल्दी सहारा दें।',
      'स्वच्छ ट्रेमध्ये रोपवाटिका तयार करा, 25-30 दिवसांची रोपे उंच गाद्यांवर लावा आणि झाडांना लवकर आधार द्या.'
    ),
    water: agronomyText(
      'Use drip and keep moisture even. Avoid overhead watering and long dry-wet swings that crack fruit.',
      'ठिबक लगाएं और नमी एक समान रखें। ऊपर से सिंचाई और लंबे सूखे-गीले झटके से बचें, जिससे फल फटते हैं।',
      'ठिबक वापरा आणि ओलावा सारखा ठेवा. वरून पाणी देणे आणि फळे फुटण्यास कारणीभूत ठरणारे लांब कोरडे-ओले बदल टाळा.'
    ),
    nutrition: agronomyText(
      'Apply compost and NPK in splits. Keep calcium and boron available and avoid excess nitrogen, which delays fruiting.',
      'कंपोस्ट और NPK विभाजित मात्रा में दें। कैल्शियम और बोरॉन उपलब्ध रखें और अधिक नाइट्रोजन से बचें, जो फलन देर करता है।',
      'कंपोस्ट व NPK विभागून द्या. कॅल्शियम व बोरॉन उपलब्ध ठेवा आणि फळधारणा उशिरा करणारे जास्त नायट्रोजन टाळा.'
    ),
    harvest: agronomyText(
      'Pick at breaker or pink stage for distant markets and fully coloured fruit for local sale. Cool, sort and grade quickly.',
      'दूर बाजार के लिए फल हल्का लाल होने पर और स्थानीय बिक्री के लिए पूरा रंग आने पर तोड़ें। जल्दी ठंडा करें, छांटें और ग्रेड करें।',
      'दूरच्या बाजारासाठी फळ थोडे लाल झाल्यावर आणि स्थानिक विक्रीसाठी पूर्ण रंग आल्यावर तोडा. लवकर थंड करा, वेगळे करा आणि प्रतवारी करा.'
    ),
    watch: agronomyText(
      'Watch for early and late blight, leaf curl, fruit borer and whitefly.',
      'अगेती और पिछेती झुलसा, पत्ती मरोड़, फल छेदक और सफेद मक्खी देखें।',
      'लवकर व उशिरा करपा, पाने मुरडणे, फळ पोखरणारी अळी आणि पांढरी माशी पहा.'
    ),
  },
  {
    aliases: [
      'potato',
      'potatoes',
      'aloo',
      'batata',
      'आलू',
      'बटाटा',
      'बटाट',
    ],
    label: agronomyText('Potato', 'आलू', 'बटाटा'),
    sowing: agronomyText(
      'Use certified disease-free seed tubers, plant 5-7 cm deep on ridges and keep the field free of standing water.',
      'प्रमाणित रोगमुक्त बीज कंद उपयोग करें, 5-7 सेमी गहरे मेड़ पर लगाएं और खेत में पानी न रुकने दें।',
      'प्रमाणित रोगमुक्त बीज कंद वापरा, 5-7 सेमी खोल वरंब्यावर लावा आणि शेतात पाणी साचू देऊ नका.'
    ),
    water: agronomyText(
      'Give light irrigation after planting, then keep steady moisture at tuber initiation and bulking. Stop irrigation before harvest.',
      'लगाने के बाद हल्की सिंचाई करें, फिर कंद बनने और बढ़ने पर लगातार नमी रखें। कटाई से पहले सिंचाई बंद करें।',
      'लागवडीनंतर हलके पाणी द्या, नंतर कंद तयार होणे व वाढ होणे या वेळी सातत्याने ओलावा ठेवा. काढणीपूर्वी पाणी देणे थांबवा.'
    ),
    nutrition: agronomyText(
      'Apply NPK at planting and split nitrogen. Potassium supports tuber quality; avoid excess nitrogen.',
      'रोपण के समय NPK दें और नाइट्रोजन विभाजित करें। पोटैशियम कंद की गुणवत्ता बढ़ाता है; अधिक नाइट्रोजन से बचें।',
      'लागवडीच्या वेळी NPK द्या आणि नायट्रोजन विभागून द्या. पोटॅशियम कंदाची गुणवत्ता वाढवते; जास्त नायट्रोजन टाळा.'
    ),
    harvest: agronomyText(
      'Stop irrigation 7-10 days before harvest, lift when the skin is set and cure tubers in the shade.',
      'कटाई से 7-10 दिन पहले सिंचाई बंद करें, छिलका जमने पर खोदें और कंदों को छाया में सुखाएं।',
      'काढणीच्या 7-10 दिवस आधी पाणी थांबवा, साल तयार झाल्यावर काढा आणि कंद सावलीत सुकवा.'
    ),
    watch: agronomyText(
      'Watch for late blight, early blight, aphids and potato tuber moth.',
      'पिछेती झुलसा, अगेती झुलसा, माहू और आलू कंद पतंगा देखें।',
      'उशिरा करपा, लवकर करपा, मावा आणि बटाटा कंद पतंग पहा.'
    ),
  },
  {
    aliases: ['mango', 'mangoes', 'aam', 'आम', 'आंबा', 'आंब्या'],
    label: agronomyText('Mango', 'आम', 'आंबा'),
    sowing: agronomyText(
      'Plant a grafted sapling with the graft union above soil in a well-drained pit. Keep a clear basin and stake young trees.',
      'कलमी पौधा अच्छे जल निकास वाले गड्ढे में लगाएं और कलम जोड़ मिट्टी से ऊपर रखें। पेड़ के चारों ओर साफ क्यारी रखें और छोटे पेड़ को सहारा दें।',
      'कलमी रोप योग्य निचरा असलेल्या खड्ड्यात लावा आणि कलमाचा जोड मातीच्या वर ठेवा. झाडाभोवती स्वच्छ गादी ठेवा आणि लहान झाडाला आधार द्या.'
    ),
    water: agronomyText(
      'Irrigate the root zone deeply and less often. Avoid waterlogging; steady moisture is important from flowering to fruit development.',
      'जड़ क्षेत्र में गहरी और कम बार सिंचाई करें। जलभराव से बचें; फूल से फल विकास तक लगातार नमी जरूरी है।',
      'मुळांच्या भागात खोल आणि कमी वेळा पाणी द्या. पाणी साचणे टाळा; फुलोऱ्यापासून फळ वाढीपर्यंत सातत्याने ओलावा महत्त्वाचा आहे.'
    ),
    nutrition: agronomyText(
      'Apply FYM and NPK after harvest, and watch zinc and boron. Avoid heavy nitrogen before flowering.',
      'कटाई के बाद गोबर खाद और NPK दें, जिंक व बोरॉन पर ध्यान दें। फूल आने से पहले अधिक नाइट्रोजन न दें।',
      'काढणीनंतर शेणखत व NPK द्या आणि झिंक व बोरॉनकडे लक्ष द्या. फुलोऱ्यापूर्वी जास्त नायट्रोजन देऊ नका.'
    ),
    harvest: agronomyText(
      'Harvest when the shoulders are filled and skin colour changes. Leave a short stalk, do not drop fruit and pack in ventilated crates.',
      'कंधे भर जाने और छिलके का रंग बदलने पर कटाई करें। छोटा डंठल रखें, फल गिराएं नहीं और हवादार टोकरी में पैक करें।',
      'खांदे भरलेले आणि सालीचा रंग बदलल्यावर काढणी करा. थोडी देठ ठेवा, फळे पाडू नका आणि हवा खेळणाऱ्या पेट्यांत भरा.'
    ),
    watch: agronomyText(
      'Watch for mango hopper, fruit fly, anthracnose and powdery mildew.',
      'आम का फुदका, फल मक्खी, एंथ्रेक्नोज और पाउडरी मिल्ड्यू देखें।',
      'आंब्यावरील तुडतुडे, फळमाशी, अँथ्रॅक्नोज आणि भुरी पहा.'
    ),
  },
  {
    aliases: ['cotton', 'kapas', 'कपास', 'कापूस', 'कापस'],
    label: agronomyText('Cotton', 'कपास', 'कापूस'),
    sowing: agronomyText(
      'Sow certified seed at the recommended spacing when soil moisture is adequate. Follow local rules for any genetically modified seed.',
      'मिट्टी में पर्याप्त नमी होने पर अनुशंसित दूरी पर प्रमाणित बीज बोएं। किसी भी आनुवंशिक रूप से संशोधित बीज के लिए स्थानीय नियम मानें।',
      'मातीत पुरेसा ओलावा असताना शिफारस केलेल्या अंतरावर प्रमाणित बियाणे पेरा. कोणत्याही अनुवांशिक बदल केलेल्या बियाण्यासाठी स्थानिक नियम पाळा.'
    ),
    water: agronomyText(
      'Use drip or furrow irrigation and keep moisture steady at flowering and boll development. Avoid late irrigation.',
      'ठिबक या नाली सिंचाई करें और फूल व टिंडा बनने पर नमी स्थिर रखें। देर से सिंचाई से बचें।',
      'ठिबक किंवा सरी पाणी वापरा आणि फुलोरा व बोंड वाढीच्या वेळी ओलावा स्थिर ठेवा. उशिरा पाणी देणे टाळा.'
    ),
    nutrition: agronomyText(
      'Apply NPK after a soil test and split nitrogen. Potassium and boron support boll development; avoid excess nitrogen.',
      'मिट्टी परीक्षण के बाद NPK दें और नाइट्रोजन विभाजित करें। पोटैशियम व बोरॉन टिंडा विकास में मदद करते हैं; अधिक नाइट्रोजन से बचें।',
      'माती परीक्षणानंतर NPK द्या आणि नायट्रोजन विभागून द्या. पोटॅशियम व बोरॉन बोंड वाढीस मदत करतात; जास्त नायट्रोजन टाळा.'
    ),
    harvest: agronomyText(
      'Pick dry bolls in the morning, keep fibre clean and grade separately. Never mix trash or wet cotton.',
      'सूखे टिंडे सुबह तोड़ें, रेशा साफ रखें और अलग ग्रेड करें। कचरा या गीली कपास कभी न मिलाएं।',
      'सुकलेले बोंड सकाळी वेचा, तंतू स्वच्छ ठेवा आणि वेगळी प्रतवारी करा. कचरा किंवा ओले कापूस कधीही मिसळू नका.'
    ),
    watch: agronomyText(
      'Watch for pink bollworm, whitefly, sucking pests and leaf reddening.',
      'गुलाबी सुंडी, सफेद मक्खी, रस चूसने वाले कीट और पत्ती लाल होना देखें।',
      'गुलाबी बोंडअळी, पांढरी माशी, रस शोषणारे कीड आणि पाने लाल होणे पहा.'
    ),
  },
  {
    aliases: ['sugarcane', 'cane', 'ganna', 'गन्ना', 'ऊस', 'ऊसा'],
    label: agronomyText('Sugarcane', 'गन्ना', 'ऊस'),
    sowing: agronomyText(
      'Plant healthy three-bud setts in furrows with compost. Treat the setts and keep the seed material moist before planting.',
      'स्वस्थ तीन-कली सेट फरो में कंपोस्ट के साथ लगाएं। सेट का उपचार करें और लगाने से पहले बीज सामग्री नम रखें।',
      'निरोगी तीन-कळी सेट सरीत कंपोस्टसह लावा. सेटवर प्रक्रिया करा आणि लागवडीपूर्वी बियाणे ओले ठेवा.'
    ),
    water: agronomyText(
      'Sugarcane needs regular irrigation at tillering, grand growth and maturity. Keep furrows drained and avoid waterlogging.',
      'गन्ने को कल्ले बनने, तेज वृद्धि और पकने पर नियमित सिंचाई चाहिए। नालियों में पानी न रुकने दें और जलभराव से बचें।',
      'ऊसाला कल्ले फुटणे, जोरदार वाढ आणि पक्वतेच्या वेळी नियमित पाणी लागते. सरीत पाणी साचू देऊ नका आणि जलभराव टाळा.'
    ),
    nutrition: agronomyText(
      'Apply FYM and NPK, split nitrogen and use press mud where available. A soil test prevents over-fertilising a long-duration crop.',
      'गोबर खाद और NPK दें, नाइट्रोजन विभाजित करें और जहां उपलब्ध हो प्रेस मड डालें। मिट्टी परीक्षण लंबी अवधि की फसल में अधिक खाद रोकता है।',
      'शेणखत व NPK द्या, नायट्रोजन विभागून द्या आणि उपलब्ध असल्यास प्रेस मड वापरा. माती परीक्षण दीर्घकालीन पिकात जास्त खत टाळते.'
    ),
    harvest: agronomyText(
      'Harvest at maturity, usually 10-12 months, cut close to the ground and send cane to the mill within 24-48 hours.',
      'आमतौर पर 10-12 महीने में पकने पर कटाई करें, जमीन के पास से काटें और गन्ना 24-48 घंटे में मिल भेजें।',
      'साधारण 10-12 महिन्यांत पक्वतेवर काढणी करा, जमिनीलगत कापा आणि ऊस 24-48 तासांत कारखान्यात पाठवा.'
    ),
    watch: agronomyText(
      'Watch for red rot, smut, early shoot borer, top borer and woolly aphid.',
      'लाल सड़न, कंडवा, अगेती तना छेदक, शीर्ष छेदक और ऊनी माहू देखें।',
      'लाल कुज, कंडवा, लवकर खोड पोखरणारी अळी, शेंडा पोखरणारी अळी आणि लोकरी मावा पहा.'
    ),
  },
  {
    aliases: ['maize', 'corn', 'makka', 'मक्का', 'मका', 'मक्या'],
    label: agronomyText('Maize', 'मक्का', 'मका'),
    sowing: agronomyText(
      'Sow hybrid seed at the recommended spacing with treated seed and adequate soil moisture. Avoid deep sowing in heavy soil.',
      'उपचारित बीज और पर्याप्त मिट्टी नमी के साथ अनुशंसित दूरी पर हाइब्रिड बीज बोएं। भारी मिट्टी में गहरी बुवाई से बचें।',
      'प्रक्रिया केलेले बियाणे आणि पुरेसा ओलावा यासह शिफारस केलेल्या अंतरावर संकरित बियाणे पेरा. जड मातीत खोल पेरणी टाळा.'
    ),
    water: agronomyText(
      'Irrigate at knee-high, tasseling, silking and grain filling. Water stress at flowering causes major yield loss.',
      'घुटने तक ऊंचाई, नर मंजरी, रेशा और दाना भरने पर सिंचाई करें। फूल के समय पानी की कमी से बड़ी उपज हानि होती है।',
      'गुडघ्याइतकी उंची, नर मंजरी, रेशीम आणि दाणे भरणे या वेळी पाणी द्या. फुलोऱ्यात पाण्याच्या ताणाने मोठे उत्पादन नुकसान होते.'
    ),
    nutrition: agronomyText(
      'Apply NPK and zinc after a soil test, with nitrogen in splits. Add organic matter to improve moisture holding.',
      'मिट्टी परीक्षण के बाद NPK और जिंक दें, नाइट्रोजन विभाजित करें। नमी रोकने के लिए जैविक पदार्थ बढ़ाएं।',
      'माती परीक्षणानंतर NPK व झिंक द्या, नायट्रोजन विभागून द्या. ओलावा टिकवण्यासाठी सेंद्रिय पदार्थ वाढवा.'
    ),
    harvest: agronomyText(
      'Harvest cobs when husks dry and grains are hard, then dry to 12-14% moisture before storage.',
      'भुट्टे पर छिलका सूखने और दाने सख्त होने पर कटाई करें, फिर भंडारण से पहले 12-14% नमी तक सुखाएं।',
      'कोबांवरील पोंगे सुकले आणि दाणे कडक झाले की काढणी करा, नंतर साठवणीपूर्वी 12-14% ओलाव्यापर्यंत सुकवा.'
    ),
    watch: agronomyText(
      'Watch for fall armyworm, stem borer and leaf blight, especially in the whorl stage.',
      'विशेषकर व्होर्ल अवस्था में फॉल आर्मीवर्म, तना छेदक और पत्ती झुलसा देखें।',
      'विशेषतः व्होर्ल अवस्थेत फॉल आर्मीवर्म, खोड पोखरणारी अळी आणि पान करपा पहा.'
    ),
  },
  {
    aliases: ['onion', 'onions', 'pyaz', 'kanda', 'प्याज', 'कांदा', 'कांद'],
    label: agronomyText('Onion', 'प्याज', 'कांदा'),
    sowing: agronomyText(
      'Raise the nursery on raised beds and transplant 40-45 day old seedlings. Plant shallow; do not bury the growing point.',
      'ऊंची क्यारी पर नर्सरी उगाएं और 40-45 दिन की पौध लगाएं। उथला लगाएं; बढ़ने वाला हिस्सा मिट्टी में न दबाएं।',
      'उंच गाद्यांवर रोपवाटिका काढा आणि 40-45 दिवसांची रोपे लावा. उथळ लावा; वाढणारा भाग मातीत गाडू नका.'
    ),
    water: agronomyText(
      'Give light, frequent irrigation and avoid waterlogging. Stop irrigation 10-15 days before harvest.',
      'हल्की, बार-बार सिंचाई करें और जलभराव से बचें। कटाई से 10-15 दिन पहले सिंचाई बंद करें।',
      'हलके, वारंवार पाणी द्या आणि पाणी साचणे टाळा. काढणीच्या 10-15 दिवस आधी पाणी थांबवा.'
    ),
    nutrition: agronomyText(
      'Apply compost and NPK in splits. Sulphur improves pungency; avoid excess nitrogen, which reduces storage life.',
      'कंपोस्ट और NPK विभाजित मात्रा में दें। सल्फर तीखापन बढ़ाता है; अधिक नाइट्रोजन भंडारण अवधि घटाता है।',
      'कंपोस्ट व NPK विभागून द्या. गंधक तिखटपणा वाढवतो; जास्त नायट्रोजन साठवण क्षमता कमी करते.'
    ),
    harvest: agronomyText(
      'Harvest when tops fall and necks dry. Cure in the shade, remove damaged bulbs and store in a dry, ventilated place.',
      'पत्ते गिरने और गर्दन सूखने पर कटाई करें। छाया में सुखाएं, खराब कंद हटाएं और सूखी, हवादार जगह भंडारण करें।',
      'पाने पडली आणि मान सुकली की काढणी करा. सावलीत सुकवा, खराब कंद काढा आणि कोरड्या, हवा खेळणाऱ्या जागी साठवा.'
    ),
    watch: agronomyText(
      'Watch for thrips, purple blotch, downy mildew and basal rot.',
      'थ्रिप्स, बैंगनी धब्बा, डाउनी मिल्ड्यू और तलघन सड़न देखें।',
      'थ्रिप्स, जांभळा ठिपका, डाउनी मिल्ड्यू आणि तळकुज पहा.'
    ),
  },
  {
    aliases: ['banana', 'bananas', 'kela', 'केला', 'केळी', 'केळ'],
    label: agronomyText('Banana', 'केला', 'केळी'),
    sowing: agronomyText(
      'Plant tissue-culture plants or healthy sword suckers in pits with compost and keep the collar above soil level.',
      'टिश्यू कल्चर पौधे या स्वस्थ कल्ले कंपोस्ट के साथ गड्ढे में लगाएं और गर्दन मिट्टी से ऊपर रखें।',
      'टिश्यू कल्चर रोपे किंवा निरोगी कल्ले कंपोस्टसह खड्ड्यात लावा आणि मान मातीच्या वर ठेवा.'
    ),
    water: agronomyText(
      'Use drip with mulch and keep the root zone moist but drained. Avoid waterlogging around the collar.',
      'मल्च के साथ ठिबक लगाएं और जड़ क्षेत्र नम लेकिन जल निकास वाला रखें। गर्दन के पास जलभराव से बचें।',
      'आच्छादनासह ठिबक वापरा आणि मुळांचा भाग ओला पण निचरा होणारा ठेवा. मानाभोवती पाणी साचणे टाळा.'
    ),
    nutrition: agronomyText(
      'Banana responds to potassium. Apply FYM and NPK in splits, and correct zinc and boron where needed.',
      'केला पोटैशियम से अच्छा जवाब देता है। गोबर खाद और NPK विभाजित मात्रा में दें, जरूरत पर जिंक व बोरॉन सुधारें।',
      'केळी पोटॅशियमला चांगला प्रतिसाद देते. शेणखत व NPK विभागून द्या आणि गरजेनुसार झिंक व बोरॉन दुरुस्त करा.'
    ),
    harvest: agronomyText(
      'Harvest bunches at 75-80% maturity for transport, handle them gently and keep them out of direct sun.',
      'ढुलाई के लिए 75-80% पकने पर गुच्छे काटें, सावधानी से संभालें और सीधी धूप से बचाएं।',
      'वाहतुकीसाठी 75-80% पक्वतेवर घड कापा, काळजीपूर्वक हाताळा आणि थेट उन्हापासून वाचवा.'
    ),
    watch: agronomyText(
      'Watch for Panama wilt, bunchy top, Sigatoka leaf spot and pseudostem borer.',
      'पनामा उकठा, बंची टॉप, सिगाटोका पत्ती धब्बा और तना छेदक देखें।',
      'पनामा मर, बंची टॉप, सिगाटोका पान ठिपका आणि खोड पोखरणारी अळी पहा.'
    ),
  },
  {
    aliases: [
      'chilli',
      'chillies',
      'chili',
      'mirch',
      'mirchi',
      'मिर्च',
      'मिरची',
    ],
    label: agronomyText('Chilli', 'मिर्च', 'मिरची'),
    sowing: agronomyText(
      'Raise the nursery in clean media and transplant 30-35 day old seedlings on raised beds. Avoid low-lying fields.',
      'साफ माध्यम में नर्सरी उगाएं और 30-35 दिन की पौध ऊंची क्यारियों में लगाएं। नीचे के जलभराव वाले खेत से बचें।',
      'स्वच्छ माध्यमात रोपवाटिका काढा आणि 30-35 दिवसांची रोपे उंच गाद्यांवर लावा. सखल व पाणी साचणारी शेते टाळा.'
    ),
    water: agronomyText(
      'Use drip and keep moisture even. Avoid overhead irrigation and waterlogging, which spread rot and leaf disease.',
      'ठिबक लगाएं और नमी एक समान रखें। ऊपर से सिंचाई और जलभराव से बचें, जिससे सड़न और पत्ती रोग फैलते हैं।',
      'ठिबक वापरा आणि ओलावा सारखा ठेवा. वरून पाणी देणे व पाणी साचणे टाळा, ज्यामुळे कुज व पान रोग पसरतात.'
    ),
    nutrition: agronomyText(
      'Apply balanced NPK in splits with compost. Keep calcium and boron available and avoid excess nitrogen.',
      'कंपोस्ट के साथ संतुलित NPK विभाजित मात्रा में दें। कैल्शियम व बोरॉन उपलब्ध रखें और अधिक नाइट्रोजन से बचें।',
      'कंपोस्टसह संतुलित NPK विभागून द्या. कॅल्शियम व बोरॉन उपलब्ध ठेवा आणि जास्त नायट्रोजन टाळा.'
    ),
    harvest: agronomyText(
      'Pick green chillies at full size or red fruit when ripe. Dry red chillies quickly in the shade or a dryer.',
      'हरी मिर्च पूरा आकार आने पर या लाल मिर्च पकने पर तोड़ें। लाल मिर्च छाया या ड्रायर में जल्दी सुखाएं।',
      'हिरवी मिरची पूर्ण आकारात किंवा लाल मिरची पिकल्यावर तोडा. लाल मिरची सावलीत किंवा ड्रायरमध्ये लवकर सुकवा.'
    ),
    watch: agronomyText(
      'Watch for thrips, mites, anthracnose and leaf curl virus.',
      'थ्रिप्स, माइट, एंथ्रेक्नोज और पत्ती मरोड़ वायरस देखें।',
      'थ्रिप्स, माइट, अँथ्रॅक्नोज आणि पान मुरडणारा विषाणू पहा.'
    ),
  },
  {
    aliases: ['grapes', 'grape', 'angoor', 'draksha', 'अंगूर', 'द्राक्ष'],
    label: agronomyText('Grapes', 'अंगूर', 'द्राक्ष'),
    sowing: agronomyText(
      'Plant grafted cuttings at the recommended spacing with a trellis. Pruning and canopy timing depend on your region and variety.',
      'अनुशंसित दूरी पर कलमी कटिंग और सहारा संरचना के साथ लगाएं। छंटाई और शाखा प्रबंधन का समय क्षेत्र व किस्म पर निर्भर है।',
      'शिफारस केलेल्या अंतरावर कलमी कलमे आणि आधार रचनेसह लावा. छाटणी व फांदी व्यवस्थापनाची वेळ प्रदेश व वाणावर अवलंबून आहे.'
    ),
    water: agronomyText(
      'Use drip and keep the canopy dry. Avoid water stress at flowering and fruit set, and follow local advice on reducing water near ripening.',
      'ठिबक लगाएं और पत्तों की छतरी सूखी रखें। फूल व फल बनने पर पानी की कमी से बचें, और पकने के पास पानी घटाने पर स्थानीय सलाह मानें।',
      'ठिबक वापरा आणि पानांची छतरी कोरडी ठेवा. फुलोरा व फळधारणेत पाण्याचा ताण टाळा आणि पक्वतेजवळ पाणी कमी करण्याबाबत स्थानिक सल्ला पाळा.'
    ),
    nutrition: agronomyText(
      'Apply FYM and balanced NPK in splits, with micronutrients based on leaf or soil tests. Avoid excess nitrogen.',
      'गोबर खाद और संतुलित NPK विभाजित मात्रा में दें, पत्ती या मिट्टी परीक्षण के अनुसार सूक्ष्म पोषक दें। अधिक नाइट्रोजन से बचें।',
      'शेणखत व संतुलित NPK विभागून द्या, पान किंवा माती परीक्षणानुसार सूक्ष्म अन्नद्रव्ये द्या. जास्त नायट्रोजन टाळा.'
    ),
    harvest: agronomyText(
      'Harvest at the brix and colour required for your market. Cool, sort and pack carefully to protect the bloom on the skin.',
      'अपने बाजार के अनुसार ब्रिक्स और रंग आने पर कटाई करें। ठंडा करें, छांटें और छिलके की परत बचाने के लिए सावधानी से पैक करें।',
      'तुमच्या बाजारासाठी आवश्यक ब्रिक्स व रंग आल्यावर काढणी करा. थंड करा, वेगळे करा आणि सालीवरील पुड बचावण्यासाठी काळजीपूर्वक भरा.'
    ),
    watch: agronomyText(
      'Watch for powdery and downy mildew, thrips and mealybug.',
      'पाउडरी व डाउनी मिल्ड्यू, थ्रिप्स और मिलीबग देखें।',
      'भुरी व डाउनी मिल्ड्यू, थ्रिप्स आणि मिलीबग पहा.'
    ),
  },
];

const AGRONOMY_TOPICS: AgronomyTopic[] = [
  AGRONOMY_TOPIC_SOIL,
  AGRONOMY_TOPIC_WATER,
  AGRONOMY_TOPIC_NUTRIENT,
  AGRONOMY_TOPIC_PEST,
  AGRONOMY_TOPIC_ORGANIC,
  AGRONOMY_TOPIC_HARVEST,
  AGRONOMY_TOPIC_ROTATION,
  AGRONOMY_TOPIC_ESTABLISHMENT,
  AGRONOMY_TOPIC_WEED,
  AGRONOMY_TOPIC_LIVESTOCK,
  AGRONOMY_TOPIC_WEATHER,
  AGRONOMY_TOPIC_MARKET,
  AGRONOMY_TOPIC_PLANNING,
  AGRONOMY_TOPIC_ORCHARD,
  AGRONOMY_TOPIC_GENERAL,
];

function scoreAgronomyTerms(
  normalized: string,
  terms: [string, number][]
): number {
  const padded = ` ${normalized} `;

  return terms.reduce((total, [term, weight]) => {
    const normalizedTerm = normalizeText(term);
    if (!normalizedTerm) return total;
    return padded.includes(` ${normalizedTerm} `)
      ? total + weight
      : total;
  }, 0);
}

function detectAgronomyCrop(
  normalized: string
): AgronomyCropGuide | null {
  const padded = ` ${normalized} `;
  const tokens = normalized.split(' ');
  let bestGuide: AgronomyCropGuide | null = null;
  let bestLength = 0;

  for (const guide of AGRONOMY_CROP_GUIDES) {
    for (const alias of guide.aliases) {
      const normalizedAlias = normalizeText(alias);
      if (!normalizedAlias || normalizedAlias.length <= bestLength) {
        continue;
      }

      const isDevanagari = /[\u0900-\u097F]/.test(normalizedAlias);
      const matches = normalizedAlias.includes(' ')
        ? padded.includes(` ${normalizedAlias} `)
        : tokens.some(
            (token) =>
              token === normalizedAlias ||
              (isDevanagari &&
                normalizedAlias.length >= 3 &&
                token.startsWith(normalizedAlias))
          );

      if (matches) {
        bestGuide = guide;
        bestLength = normalizedAlias.length;
      }
    }
  }

  return bestGuide;
}

function pickAgronomyTopic(query: string): {
  topic: AgronomyTopic;
  crop: AgronomyCropGuide | null;
} {
  const normalized = normalizeText(query);
  const crop = detectAgronomyCrop(normalized);
  let topic = AGRONOMY_TOPIC_GENERAL;
  let bestScore = 0;

  for (const candidate of AGRONOMY_TOPICS) {
    const score = scoreAgronomyTerms(normalized, candidate.terms);
    if (score > bestScore) {
      bestScore = score;
      topic = candidate;
    }
  }

  if (bestScore === 0 && crop) {
    topic = AGRONOMY_TOPIC_ESTABLISHMENT;
  }

  return { topic, crop };
}

function hasAgronomySignal(normalized: string): boolean {
  if (!normalized) return false;
  if (detectAgronomyCrop(normalized)) return true;
  return AGRONOMY_TOPICS.some(
    (topic) => scoreAgronomyTerms(normalized, topic.terms) > 0
  );
}

const SIMPLE_GREETINGS = new Set([
  'hi',
  'hello',
  'hey',
  'namaste',
  'namaskar',
  'हाय',
  'हॅलो',
  'नमस्ते',
  'नमस्कार',
]);

const GREETING_STARTS = [
  'hi',
  'hello',
  'hey',
  'namaste',
  'namaskar',
  'good morning',
  'good afternoon',
  'good evening',
  'नमस्ते',
  'नमस्कार',
  'हाय',
  'हॅलो',
  'सुप्रभात',
];

const CAPABILITY_QUESTIONS = [
  'what can you help',
  'how can you help',
  'what can you do',
  'what do you do',
  'who are you',
  'about you',
  'how do you help',
  'क्या मदद कर',
  'कैसे मदद कर',
  'तुम्ही काय कर',
  'तुम्ही कशी मदत',
];

function isGreetingQuery(query: string): boolean {
  const normalized = normalizeText(query);
  if (!normalized) return true;
  if (SIMPLE_GREETINGS.has(normalized)) return true;

  const signal = hasAgronomySignal(normalized);
  if (
    !signal &&
    CAPABILITY_QUESTIONS.some((phrase) => normalized.includes(phrase))
  ) {
    return true;
  }

  const startsWithGreeting = GREETING_STARTS.some(
    (phrase) =>
      normalized === phrase || normalized.startsWith(`${phrase} `)
  );

  return startsWithGreeting && !signal;
}

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function isSchemeSupportQuery(normalized: string): boolean {
  return includesAny(normalized, [
    'scheme',
    'schemes',
    'subsidy',
    'subsidies',
    'subsidy',
    'apply',
    'application',
    'eligib',
    'benefit',
    'portal',
    'pm kusum',
    'kusum',
    'pmksy',
    'pmfby',
    'pm kisan',
    'kcc',
    'mahadbt',
    'smam',
    'yojana',
    'योजना',
    'सब्सिडी',
    'अनुदान',
    'आवेदन',
    'पात्रता',
    'अर्ज',
    'पात्रता',
  ]);
}

function isIrrigationSupportQuery(normalized: string): boolean {
  return includesAny(normalized, [
    'scheme',
    'subsidy',
    'subsidies',
    'apply',
    'eligib',
    'benefit',
    'portal',
    'pm kusum',
    'kusum',
    'pmksy',
    'finance',
    'loan',
    'credit',
    'cost',
    'quotation',
    'supplier',
    'योजना',
    'सब्सिडी',
    'अनुदान',
    'आवेदन',
    'पात्रता',
    'कर्ज',
    'किंमत',
    'खर्च',
  ]);
}

function isSoilSchemeQuery(normalized: string): boolean {
  return includesAny(normalized, [
    'soil health card',
    'soil health',
    'mahadbt',
    'soil subsidy',
    'soil scheme',
    'soil test scheme',
    'मृदा स्वास्थ्य',
    'मिट्टी स्वास्थ्य',
    'माती आरोग्य',
    'महाडीबीटी',
    'सब्सिडी',
    'अनुदान',
    'योजना',
  ]);
}

function isInsuranceSupportQuery(normalized: string): boolean {
  return includesAny(normalized, [
    'insurance',
    'pmfby',
    'bima',
    'claim',
    'premium',
    'policy',
    'compensation',
    'crop damage',
    'crop damaged',
    'crop was damaged',
    'unseasonal rain',
    'crop loss',
    'बीमा',
    'विमा',
    'दावा',
    'मुआवजा',
    'नुकसान',
    'फसल खराब',
    'पीक खराब',
  ]);
}

function isIncomeSupportQuery(normalized: string): boolean {
  return includesAny(normalized, [
    'pm kisan',
    'pmkisan',
    'kisan samman',
    '6000',
    'income support',
    'cash support',
    'installment',
    'instalment',
    'पीएम किसान',
    'किसान सम्मान',
    'नकद सहायता',
    'आय सहायता',
    'किस्त',
    'हप्ता',
    'हफ्ता',
  ]);
}

function isCreditSupportQuery(normalized: string): boolean {
  return includesAny(normalized, [
    'kcc',
    'kisan credit',
    'crop loan',
    'loan',
    'credit',
    'interest',
    'working capital',
    'केसीसी',
    'किसान क्रेडिट',
    'ऋण',
    'कर्ज',
    'ब्याज',
    'व्याज',
  ]);
}

function isMachinerySupportQuery(normalized: string): boolean {
  return includesAny(normalized, [
    'tractor',
    'drone',
    'machinery',
    'machine',
    'harvester',
    'rotavator',
    'smam',
    'implement',
    'equipment',
    'ट्रैक्टर',
    'ट्रॅक्टर',
    'ड्रोन',
    'यंत्र',
    'मशीनरी',
    'उपकरण',
  ]);
}

function isProductShoppingQuery(normalized: string): boolean {
  return includesAny(normalized, [
    'buy',
    'purchase',
    'order',
    'shop',
    'price',
    'available',
    'stock',
    'which fungicide',
    'which pesticide',
    'which fertilizer',
    'which fertiliser',
    'which spray',
    'recommend a fungicide',
    'recommend a pesticide',
    'खरीद',
    'खरेदी',
    'कीमत',
    'दाम',
    'किंमत',
    'भाव',
    'दुकान',
  ]);
}

function isSpecificDiseaseQuery(query: string): boolean {
  if (canonicalizeDisease(query)) return true;
  const inferred = inferDiseaseFromQuery(query);
  return inferred !== null && inferred !== 'Nitrogen Deficiency';
}

function buildAgronomyProducts(topic: AgronomyTopic): AgriProduct[] {
  const products = new Map<string, AgriProduct>();

  for (const product of getProducts(topic.productIds)) {
    products.set(product.id, product);
  }

  if (products.size < 3 && topic.productCategories.length > 0) {
    for (const product of topProductsByCategory(
      topic.productCategories,
      3
    )) {
      products.set(product.id, product);
    }
  }

  return [...products.values()].slice(0, 3);
}

function buildAgronomySchemes(
  topic: AgronomyTopic,
  normalized: string
): GovtScheme[] {
  const ids = new Set(topic.schemeIds);

  if (topic.id === 'water') {
    ids.add('pm-kusum');
    ids.add('pmksy');
  }

  if (
    includesAny(normalized, [
      'subsidy',
      'subsidies',
      'scheme',
      'apply',
      'eligib',
      'अनुदान',
      'सब्सिडी',
      'योजना',
    ])
  ) {
    ids.add('mahadbt');
  }

  if (
    includesAny(normalized, [
      'loan',
      'credit',
      'finance',
      'money',
      'capital',
      'कर्ज',
      'ऋण',
    ])
  ) {
    ids.add('kcc');
  }

  if (
    includesAny(normalized, [
      'insurance',
      'claim',
      'crop damage',
      'crop loss',
      'बीमा',
      'विमा',
      'दावा',
      'नुकसान',
    ])
  ) {
    ids.add('pmfby');
  }

  if (
    includesAny(normalized, [
      'tractor',
      'drone',
      'machine',
      'machinery',
      'harvester',
      'implement',
      'equipment',
      'ट्रैक्टर',
      'ट्रॅक्टर',
      'ड्रोन',
      'यंत्र',
    ])
  ) {
    ids.add('smam');
  }

  if (
    includesAny(normalized, [
      'water',
      'irrigation',
      'drip',
      'sprinkler',
      'सिंचाई',
      'सिंचन',
      'ठिबक',
      'पाणी',
    ])
  ) {
    ids.add('pmksy');
  }

  return getSchemes([...ids]).slice(0, 3);
}

function buildAgronomyResponse(
  topic: AgronomyTopic,
  crop: AgronomyCropGuide | null,
  query: string,
  language: AssistantLanguage
): AssistantResponse {
  const normalized = normalizeText(query);
  const schemes = buildAgronomySchemes(topic, normalized);
  const products = buildAgronomyProducts(topic);
  const actions = getAssistantActions(language);
  const sections: string[] = [
    topic.title[language],
    topic.intro[language],
    '',
    AGRONOMY_UI.assessment[language],
    ...topic.assessment.map((item) => `- ${item[language]}`),
    '',
    AGRONOMY_UI.actionPlan[language],
    ...topic.steps.map((step, index) => `${index + 1}. ${step[language]}`),
  ];

  const cropFields = AGRONOMY_CROP_FIELDS[topic.id] ?? [];
  if (crop && cropFields.length > 0) {
    sections.push(
      '',
      `${AGRONOMY_UI.cropNote[language]}: ${crop.label[language]}`,
      ...cropFields.map(
        (field) =>
          `- ${AGRONOMY_UI.cropFields[field][language]}: ${crop[field][language]}`
      )
    );
  }

  sections.push(
    '',
    AGRONOMY_UI.expertTips[language],
    ...topic.tips.map((tip) => `- ${tip[language]}`)
  );

  if (schemes.length > 0) {
    sections.push(
      '',
      AGRONOMY_UI.support[language],
      `${AGRONOMY_UI.schemeSupport[language]}:`,
      ...schemes.map(
        (scheme) => `- ${scheme.shortName}: ${scheme.maxBenefit}`
      )
    );
  }

  if (products.length > 0) {
    sections.push(
      '',
      AGRONOMY_UI.inputSupport[language],
      ...products.map(
        (product) =>
          `- ${product.name}: ₹${product.price} / ${product.unit}`
      )
    );
  }

  sections.push(
    '',
    AGRONOMY_UI.safety[language],
    topic.warning[language],
    '',
    AGRONOMY_UI.closing[language]
  );

  const quickActions: AssistantQuickAction[] = [];

  if (products.length > 0) {
    quickActions.push(
      agriShopAction('agronomy-shop', actions.browseInputs)
    );
  }

  if (topic.preferCropDoctor) {
    quickActions.push(cropDoctorAction(language));
  }

  if (schemes.length > 0) {
    quickActions.push(browseSchemesAction(language));
    quickActions.push(
      schemeAction(
        schemes[0].id,
        actions.openScheme(schemes[0].shortName)
      )
    );
  }

  if (quickActions.length === 0) {
    quickActions.push(
      cropDoctorAction(language),
      browseSchemesAction(language),
      agriShopAction('browse-agri-shop', actions.openShop)
    );
  }

  const intent: AssistantIntent =
    topic.id === 'water'
      ? 'irrigation'
      : topic.id === 'soil' || topic.id === 'organic'
        ? 'soil-organic'
        : 'general';

  return {
    intent,
    replyText: sections.join('\n'),
    recommendedSchemes: schemes,
    recommendedProducts: products,
    quickActions: quickActions.slice(0, 3),
    detectedCrop: crop?.label.en,
    source: 'local',
  };
}

function buildGeneralResponse(
  language: AssistantLanguage
): AssistantResponse {
  const actions = getAssistantActions(language);

  return {
    intent: 'general',
    replyText: localize(language, {
      en: `Namaste! I am your Future Farming AI Assistant.

I can help you:
• Find government schemes for irrigation, insurance, machinery, credit and soil health.
• Understand subsidies, eligibility, documents and application steps.
• Match crop symptoms or fertiliser questions to Agri-Shop products.

Ask in your own words, or tap a quick question below to see how I connect advice to schemes and farm inputs.`,
      hi: `नमस्ते! मैं आपका फ्यूचर फार्मिंग AI सहायक हूं।

मैं इनमें मदद कर सकता हूं:
• सिंचाई, बीमा, यंत्र, ऋण और मिट्टी स्वास्थ्य के लिए सरकारी योजनाएं खोजना।
• सब्सिडी, पात्रता, दस्तावेज़ और आवेदन के चरण समझना।
• फसल के लक्षण या उर्वरक सवालों को एग्री-शॉप उत्पादों से जोड़ना।

अपने शब्दों में पूछें, या नीचे किसी सुझाए गए प्रश्न पर टैप करें।`,
      mr: `नमस्कार! मी तुमचा फ्यूचर फार्मिंग AI सहाय्यक आहे.

मी यात मदत करू शकतो:
• सिंचन, विमा, यंत्रे, कर्ज आणि माती आरोग्यासाठी सरकारी योजना शोधणे.
• अनुदान, पात्रता, कागदपत्रे आणि अर्जाचे टप्पे समजून घेणे.
• पिकावरील लक्षणे किंवा खतांविषयीचे प्रश्न ॲग्री-शॉप उत्पादनांशी जोडणे.

तुमच्या शब्दांत विचारा, किंवा खालील सुचवलेल्या प्रश्नावर टॅप करा.`,
    }),
    recommendedSchemes: [],
    recommendedProducts: [],
    quickActions: [
      browseSchemesAction(language),
      cropDoctorAction(language),
      agriShopAction('browse-agri-shop', actions.openShop),
    ],
    source: 'local',
  };
}

export function buildLocalAssistantResponse(
  query: string,
  language: AssistantLanguage = 'en'
): AssistantResponse {
  if (isGreetingQuery(query)) {
    return buildGeneralResponse(language);
  }

  const normalized = normalizeText(query);
  const intent = detectAssistantIntent(query);
  const { topic, crop } = pickAgronomyTopic(query);
  const agronomyResponse = () =>
    buildAgronomyResponse(topic, crop, query, language);

  switch (intent) {
    case 'irrigation':
      return isIrrigationSupportQuery(normalized)
        ? buildIrrigationResponse(language)
        : agronomyResponse();
    case 'income-support':
      return isIncomeSupportQuery(normalized)
        ? buildIncomeResponse(language)
        : agronomyResponse();
    case 'crop-insurance':
      return isInsuranceSupportQuery(normalized)
        ? buildInsuranceResponse(language)
        : agronomyResponse();
    case 'machinery':
      return isMachinerySupportQuery(normalized)
        ? buildMachineryResponse(language)
        : agronomyResponse();
    case 'credit':
      return isCreditSupportQuery(normalized)
        ? buildCreditResponse(language)
        : agronomyResponse();
    case 'soil-organic':
      return isSoilSchemeQuery(normalized)
        ? buildSoilResponse(language)
        : agronomyResponse();
    case 'crop-health': {
      if (isSpecificDiseaseQuery(query)) {
        const diseaseResponse = buildDiseaseResponse(query, language);
        if (diseaseResponse) return diseaseResponse;
      }

      return isProductShoppingQuery(normalized)
        ? buildProductResponse(query, language)
        : agronomyResponse();
    }
    case 'scheme-info':
      return isSchemeSupportQuery(normalized)
        ? buildSchemeInfoResponse(query, language)
        : agronomyResponse();
    default:
      return agronomyResponse();
  }
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is string => typeof item === 'string' && item.trim() !== ''
  );
}

async function getRemoteResponse(
  query: string,
  local: AssistantResponse,
  language: AssistantLanguage
): Promise<AssistantResponse> {
  const endpoint = ASSISTANT_ENDPOINT?.trim();
  if (!endpoint) return local;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        language,
        intent: local.intent,
        matchedSchemeIds: local.recommendedSchemes.map(
          (scheme) => scheme.id
        ),
        matchedProductIds: local.recommendedProducts.map(
          (product) => product.id
        ),
        allowedSchemeIds: GOVT_SCHEMES.map((scheme) => scheme.id),
        allowedProductIds: AGRI_PRODUCTS.map((product) => product.id),
      }),
      signal: controller.signal,
    });

    if (!response.ok) return local;

    const data: unknown = await response.json();
    if (!data || typeof data !== 'object') return local;

    const record = data as Record<string, unknown>;
    const replyText =
      typeof record.replyText === 'string' &&
      record.replyText.trim().length > 0
        ? record.replyText.trim()
        : local.replyText;

    const schemeIds = readStringArray(
      record.schemeIds ?? record.recommendedSchemeIds
    );
    const productIds = readStringArray(
      record.productIds ?? record.recommendedProductIds
    );
    const remoteSchemes = getSchemes(schemeIds);
    const remoteProducts = getProducts(productIds);

    return {
      ...local,
      replyText,
      recommendedSchemes:
        remoteSchemes.length > 0
          ? remoteSchemes
          : local.recommendedSchemes,
      recommendedProducts:
        remoteProducts.length > 0
          ? remoteProducts
          : local.recommendedProducts,
      source: 'remote',
    };
  } catch {
    return local;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getAssistantResponse(
  query: string,
  language: AssistantLanguage = 'en'
): Promise<AssistantResponse> {
  const local = buildLocalAssistantResponse(query, language);
  return getRemoteResponse(query, local, language);
}
