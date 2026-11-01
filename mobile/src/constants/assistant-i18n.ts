import type { ProductCategory } from '@/data/agriProducts';
import type { SchemeCategory } from '@/data/govtSchemes';

export type AssistantLanguage = 'en' | 'hi' | 'mr';

export interface AssistantLanguageOption {
  id: AssistantLanguage;
  label: string;
}

export const ASSISTANT_LANGUAGES: AssistantLanguageOption[] = [
  { id: 'en', label: 'EN' },
  { id: 'hi', label: 'हिंदी' },
  { id: 'mr', label: 'मराठी' },
];

export function localize(
  language: AssistantLanguage,
  values: Record<AssistantLanguage, string>
): string {
  return values[language];
}

export interface AssistantVoiceCopy {
  keyboardHint: string;
  keyboardHintButton: string;
  keyboardHintDismiss: string;
  inputHint: string;
}

export interface AssistantCopy {
  headerTitle: string;
  status: string;
  clearChat: string;
  backHome: string;
  today: string;
  assistantLabel: string;
  sourceRemote: string;
  sourceLocal: string;
  recommendedSchemes: (count: number) => string;
  recommendedInputs: (count: number) => string;
  suggestedQuestions: string;
  starterHint: string;
  starterTag: string;
  starterAccessibility: (prompt: string) => string;
  placeholder: string;
  inputAccessibility: string;
  sendMessage: string;
  disclaimer: string;
  typing: string;
  chatError: string;
  languageSelector: string;
  languageOption: (label: string) => string;
  voice: AssistantVoiceCopy;
}

const EN_COPY: AssistantCopy = {
  headerTitle: 'Future Farming AI Assistant',
  status: 'Online • Connected to Govt Schemes & Agri-Shop',
  clearChat: 'Clear Chat',
  backHome: 'Go back to Home',
  today: 'TODAY',
  assistantLabel: 'FUTURE FARMING AI',
  sourceRemote: 'Live AI',
  sourceLocal: 'Farm knowledge',
  recommendedSchemes: (count) => `RECOMMENDED SCHEMES · ${count}`,
  recommendedInputs: (count) => `RECOMMENDED FARM INPUTS · ${count}`,
  suggestedQuestions: 'Suggested Questions',
  starterHint:
    'Tap a question to see how farm advice connects to real schemes and inputs.',
  starterTag: 'ASK',
  starterAccessibility: (prompt) => `Ask: ${prompt}`,
  placeholder: 'Ask a farming question...',
  inputAccessibility: 'Ask the Future Farming AI Assistant',
  sendMessage: 'Send message',
  disclaimer:
    'AI guidance only · Verify scheme deadlines and pesticide doses with the official portal or your local KVK.',
  typing: 'Checking schemes and farm inputs…',
  chatError:
    'I could not complete that answer just now. Please try again, or open Govt. Schemes and the Agri-Shop from Home.',
  languageSelector: 'Response language',
  languageOption: (label) => `Change response language to ${label}`,
  voice: {
    keyboardHint:
      "Tap the microphone icon on your phone's keyboard to speak in English, Hindi, or Marathi!",
    keyboardHintButton: 'Keyboard voice typing help',
    keyboardHintDismiss: 'Dismiss keyboard voice typing tip',
    inputHint:
      'Tap the microphone icon on your software keyboard to speak in English, Hindi, or Marathi, then tap Send.',
  },
};

const HI_COPY: AssistantCopy = {
  headerTitle: 'फ्यूचर फार्मिंग AI सहायक',
  status: 'ऑनलाइन • सरकारी योजनाओं और एग्री-शॉप से जुड़ा',
  clearChat: 'चैट साफ़ करें',
  backHome: 'होम पर वापस जाएं',
  today: 'आज',
  assistantLabel: 'फ्यूचर फार्मिंग AI',
  sourceRemote: 'लाइव AI',
  sourceLocal: 'कृषि ज्ञान',
  recommendedSchemes: (count) => `अनुशंसित योजनाएं · ${count}`,
  recommendedInputs: (count) => `अनुशंसित कृषि इनपुट · ${count}`,
  suggestedQuestions: 'सुझाए गए प्रश्न',
  starterHint:
    'किसी प्रश्न पर टैप करें और देखें कि कृषि सलाह वास्तविक योजनाओं और इनपुट से कैसे जुड़ती है।',
  starterTag: 'पूछें',
  starterAccessibility: (prompt) => `पूछें: ${prompt}`,
  placeholder: 'खेती से जुड़ा सवाल पूछें...',
  inputAccessibility: 'फ्यूचर फार्मिंग AI सहायक से सवाल पूछें',
  sendMessage: 'संदेश भेजें',
  disclaimer:
    'केवल AI मार्गदर्शन · योजना की समय-सीमा और कीटनाशक खुराक की पुष्टि आधिकारिक पोर्टल या अपने नज़दीकी KVK से करें।',
  typing: 'योजनाएं और कृषि इनपुट देखे जा रहे हैं…',
  chatError:
    'अभी यह उत्तर पूरा नहीं हो सका। फिर से कोशिश करें या होम से सरकारी योजनाएं और एग्री-शॉप खोलें।',
  languageSelector: 'उत्तर की भाषा',
  languageOption: (label) => `उत्तर की भाषा ${label} करें`,
  voice: {
    keyboardHint:
      'अंग्रेज़ी, हिंदी या मराठी में बोलने के लिए अपने फ़ोन के कीबोर्ड पर मौजूद माइक्रोफ़ोन आइकन पर टैप करें!',
    keyboardHintButton: 'कीबोर्ड से वॉइस टाइपिंग की मदद',
    keyboardHintDismiss: 'कीबोर्ड वॉइस टाइपिंग टिप बंद करें',
    inputHint:
      'सॉफ़्टवेयर कीबोर्ड पर माइक्रोफ़ोन आइकन टैप करके अंग्रेज़ी, हिंदी या मराठी में बोलें, फिर भेजें टैप करें।',
  },
};

const MR_COPY: AssistantCopy = {
  headerTitle: 'फ्यूचर फार्मिंग AI सहाय्यक',
  status: 'ऑनलाइन • सरकारी योजना आणि ॲग्री-शॉपशी जोडलेले',
  clearChat: 'चॅट साफ करा',
  backHome: 'होमवर परत जा',
  today: 'आज',
  assistantLabel: 'फ्यूचर फार्मिंग AI',
  sourceRemote: 'थेट AI',
  sourceLocal: 'शेती ज्ञान',
  recommendedSchemes: (count) => `शिफारस केलेल्या योजना · ${count}`,
  recommendedInputs: (count) => `शिफारस केलेले शेती साहित्य · ${count}`,
  suggestedQuestions: 'सुचवलेले प्रश्न',
  starterHint:
    'प्रश्नावर टॅप करा आणि शेती सल्ला प्रत्यक्ष योजना व साहित्याशी कसा जोडला जातो ते पहा.',
  starterTag: 'विचारा',
  starterAccessibility: (prompt) => `विचारा: ${prompt}`,
  placeholder: 'शेतीविषयी प्रश्न विचारा...',
  inputAccessibility: 'फ्यूचर फार्मिंग AI सहाय्यकाला प्रश्न विचारा',
  sendMessage: 'संदेश पाठवा',
  disclaimer:
    'फक्त AI मार्गदर्शन · योजनेची अंतिम तारीख आणि कीटकनाशकाची मात्रा अधिकृत पोर्टल किंवा जवळच्या KVK कडून तपासा.',
  typing: 'योजना आणि शेती साहित्य तपासले जात आहे…',
  chatError:
    'हे उत्तर आत्ता पूर्ण करता आले नाही. पुन्हा प्रयत्न करा किंवा होमवरून सरकारी योजना आणि ॲग्री-शॉप उघडा.',
  languageSelector: 'उत्तराची भाषा',
  languageOption: (label) => `उत्तराची भाषा ${label} करा`,
  voice: {
    keyboardHint:
      'इंग्रजी, हिंदी किंवा मराठीत बोलण्यासाठी तुमच्या फोनच्या कीबोर्डवरील माइक्रोफोन चिन्हावर टॅप करा!',
    keyboardHintButton: 'कीबोर्डवरून व्हॉइस टायपिंगसाठी मदत',
    keyboardHintDismiss: 'कीबोर्ड व्हॉइस टायपिंग टीप बंद करा',
    inputHint:
      'सॉफ्टवेअर कीबोर्डवरील मायक्रोफोन चिन्हावर टॅप करून इंग्रजी, हिंदी किंवा मराठीत बोला, नंतर पाठवा टॅप करा.',
  },
};

export const ASSISTANT_COPY: Record<AssistantLanguage, AssistantCopy> = {
  en: EN_COPY,
  hi: HI_COPY,
  mr: MR_COPY,
};

export function getAssistantCopy(language: AssistantLanguage): AssistantCopy {
  return ASSISTANT_COPY[language];
}

export const ASSISTANT_STARTERS: Record<
  AssistantLanguage,
  readonly string[]
> = {
  en: [
    'How do I get a subsidy for drip irrigation or solar pumps?',
    'How to apply for ₹6,000 PM-KISAN cash support?',
    'Is there a government subsidy for agricultural drones or tractors?',
    'My crop was damaged by unseasonal rain. Which insurance covers this?',
    'My tomato leaves have dark spots (Late Blight). What fertilizer/spray should I buy?',
    'How do I get a 4% interest Kisan Credit Card loan?',
  ],
  hi: [
    'ड्रिप सिंचाई या सोलर पंप के लिए सब्सिडी कैसे मिलेगी?',
    '₹6,000 PM-KISAN किस्त के लिए आवेदन कैसे करें?',
    'क्या कृषि ड्रोन या ट्रैक्टर के लिए सरकारी सब्सिडी है?',
    'बेमौसम बारिश से फसल खराब हुई है। कौन-सा बीमा इसे कवर करता है?',
    'मेरे टमाटर के पत्तों पर गहरे धब्बे (लेट ब्लाइट) हैं। कौन-सा छिड़काव खरीदूं?',
    '4% ब्याज वाला किसान क्रेडिट कार्ड लोन कैसे मिलेगा?',
  ],
  mr: [
    'ठिबक सिंचन किंवा सोलर पंपासाठी अनुदान कसे मिळवायचे?',
    'PM-KISAN चा ₹6,000 चा हफ्ता कसा मिळवायचा?',
    'कृषी ड्रोन किंवा ट्रॅक्टरसाठी सरकारी अनुदान आहे का?',
    'अवेळी पाऊस झाल्यामुळे पीक खराब झाले. कोणता विमा यासाठी लागू होतो?',
    'माझ्या टोमॅटोच्या पानांवर काळे ठिपके (लेट ब्लाइट) आहेत. कोणती फवारणी घ्यावी?',
    '4% व्याजाचे किसान क्रेडिट कार्ड कर्ज कसे मिळवायचे?',
  ],
};

export function getAssistantStarterPrompts(
  language: AssistantLanguage
): readonly string[] {
  return ASSISTANT_STARTERS[language];
}

export interface AssistantCardCopy {
  scheme: {
    latest: string;
    flagship: string;
    since: (year: number) => string;
    keyBenefit: string;
    viewDetails: string;
    viewDetailsAccessibility: (schemeName: string) => string;
    officialPortal: string;
    officialPortalAccessibility: (
      domain: string,
      schemeName: string
    ) => string;
    portalErrorTitle: string;
    portalErrorBody: (domain: string) => string;
  };
  product: {
    recommendedFor: (context: string) => string;
    dosagePerAcre: string;
    buy: string;
    buyAccessibility: (productName: string) => string;
  };
  schemeCategories: Record<SchemeCategory, string>;
  productCategories: Record<ProductCategory, string>;
  diseases: Record<string, string>;
  crops: Record<string, string>;
  severities: Record<'Low' | 'Moderate' | 'High', string>;
  roles: Record<'primary' | 'recovery' | 'organic', string>;
}

const EN_CARD_COPY: AssistantCardCopy = {
  scheme: {
    latest: 'Latest',
    flagship: 'Flagship',
    since: (year) => `Since ${year}`,
    keyBenefit: 'KEY BENEFIT',
    viewDetails: 'View Scheme Details →',
    viewDetailsAccessibility: (schemeName) =>
      `View full details for ${schemeName}`,
    officialPortal: 'Official .gov.in Portal ↗',
    officialPortalAccessibility: (domain, schemeName) =>
      `Open official portal ${domain} for ${schemeName}`,
    portalErrorTitle: 'Unable to open portal',
    portalErrorBody: (domain) =>
      `Please open ${domain} manually in your browser.`,
  },
  product: {
    recommendedFor: (context) => `Recommended for ${context}`,
    dosagePerAcre: 'DOSAGE PER ACRE',
    buy: 'Buy in Agri-Shop →',
    buyAccessibility: (productName) =>
      `Buy ${productName} in Agri-Shop`,
  },
  schemeCategories: {
    'Income Support': 'Income Support',
    'Crop Insurance': 'Crop Insurance',
    'Irrigation & Solar': 'Irrigation & Solar',
    'Equipment & Drones': 'Equipment & Drones',
    'Credit & Loans': 'Credit & Loans',
    'Soil & Organic': 'Soil & Organic',
  },
  productCategories: {
    Fertilizers: 'Fertilizers',
    Fungicides: 'Fungicides',
    Pesticides: 'Pesticides',
    'Bio-Cures & Organics': 'Bio-Cures',
    'Micronutrients & Seeds': 'Micronutrients',
  },
  diseases: {
    'Late Blight': 'Late Blight',
    'Powdery Mildew': 'Powdery Mildew',
    'Bacterial Leaf Blight': 'Bacterial Leaf Blight',
    'Leaf Rust': 'Leaf Rust',
    'Aphid Infestation': 'Aphid Infestation',
    'Nitrogen Deficiency': 'Nitrogen Deficiency',
  },
  crops: {
    Tomato: 'Tomato',
    Potato: 'Potato',
    Wheat: 'Wheat',
    Rice: 'Rice',
    Cotton: 'Cotton',
    Sugarcane: 'Sugarcane',
    Grapes: 'Grapes',
    Chilli: 'Chilli',
    Maize: 'Maize',
  },
  severities: {
    Low: 'Low',
    Moderate: 'Moderate',
    High: 'High',
  },
  roles: {
    primary: 'Primary Cure',
    recovery: 'Recovery & Soil Nutrition',
    organic: 'Organic Alternative',
  },
};

const HI_CARD_COPY: AssistantCardCopy = {
  scheme: {
    latest: 'नवीनतम',
    flagship: 'प्रमुख',
    since: (year) => `${year} से`,
    keyBenefit: 'मुख्य लाभ',
    viewDetails: 'योजना का विवरण देखें →',
    viewDetailsAccessibility: (schemeName) =>
      `${schemeName} की पूरी जानकारी देखें`,
    officialPortal: 'आधिकारिक .gov.in पोर्टल ↗',
    officialPortalAccessibility: (domain, schemeName) =>
      `${schemeName} के लिए आधिकारिक पोर्टल ${domain} खोलें`,
    portalErrorTitle: 'पोर्टल नहीं खुल सका',
    portalErrorBody: (domain) =>
      `कृपया ${domain} को अपने ब्राउज़र में मैन्युअल रूप से खोलें।`,
  },
  product: {
    recommendedFor: (context) => `${context} के लिए अनुशंसित`,
    dosagePerAcre: 'प्रति एकड़ खुराक',
    buy: 'एग्री-शॉप में खरीदें →',
    buyAccessibility: (productName) =>
      `${productName} एग्री-शॉप में खरीदें`,
  },
  schemeCategories: {
    'Income Support': 'आय सहायता',
    'Crop Insurance': 'फसल बीमा',
    'Irrigation & Solar': 'सिंचाई और सोलर',
    'Equipment & Drones': 'उपकरण और ड्रोन',
    'Credit & Loans': 'ऋण और लोन',
    'Soil & Organic': 'मिट्टी और जैविक',
  },
  productCategories: {
    Fertilizers: 'उर्वरक',
    Fungicides: 'फफूंदनाशक',
    Pesticides: 'कीटनाशक',
    'Bio-Cures & Organics': 'जैविक और बायो',
    'Micronutrients & Seeds': 'बीज और सूक्ष्म पोषक',
  },
  diseases: {
    'Late Blight': 'लेट ब्लाइट',
    'Powdery Mildew': 'पाउडरी मिल्ड्यू',
    'Bacterial Leaf Blight': 'बैक्टीरियल लीफ ब्लाइट',
    'Leaf Rust': 'लीफ रस्ट',
    'Aphid Infestation': 'माहू का प्रकोप',
    'Nitrogen Deficiency': 'नाइट्रोजन की कमी',
  },
  crops: {
    Tomato: 'टमाटर',
    Potato: 'आलू',
    Wheat: 'गेहूं',
    Rice: 'धान',
    Cotton: 'कपास',
    Sugarcane: 'गन्ना',
    Grapes: 'अंगूर',
    Chilli: 'मिर्च',
    Maize: 'मक्का',
  },
  severities: {
    Low: 'कम',
    Moderate: 'मध्यम',
    High: 'उच्च',
  },
  roles: {
    primary: 'मुख्य उपचार',
    recovery: 'रिकवरी और मिट्टी पोषण',
    organic: 'जैविक विकल्प',
  },
};

const MR_CARD_COPY: AssistantCardCopy = {
  scheme: {
    latest: 'नवीन',
    flagship: 'प्रमुख',
    since: (year) => `${year} पासून`,
    keyBenefit: 'मुख्य फायदा',
    viewDetails: 'योजनेचे तपशील पहा →',
    viewDetailsAccessibility: (schemeName) =>
      `${schemeName} ची संपूर्ण माहिती पहा`,
    officialPortal: 'अधिकृत .gov.in पोर्टल ↗',
    officialPortalAccessibility: (domain, schemeName) =>
      `${schemeName} साठी अधिकृत पोर्टल ${domain} उघडा`,
    portalErrorTitle: 'पोर्टल उघडता आले नाही',
    portalErrorBody: (domain) =>
      `कृपया ${domain} तुमच्या ब्राउझरमध्ये स्वतः उघडा.`,
  },
  product: {
    recommendedFor: (context) => `${context} साठी शिफारस`,
    dosagePerAcre: 'प्रति एकर मात्रा',
    buy: 'ॲग्री-शॉपमध्ये खरेदी करा →',
    buyAccessibility: (productName) =>
      `${productName} ॲग्री-शॉपमध्ये खरेदी करा`,
  },
  schemeCategories: {
    'Income Support': 'उत्पन्न सहाय्य',
    'Crop Insurance': 'पीक विमा',
    'Irrigation & Solar': 'सिंचन आणि सोलर',
    'Equipment & Drones': 'उपकरणे आणि ड्रोन',
    'Credit & Loans': 'कर्ज आणि वित्त',
    'Soil & Organic': 'माती आणि सेंद्रिय',
  },
  productCategories: {
    Fertilizers: 'खते',
    Fungicides: 'बुरशीनाशके',
    Pesticides: 'कीटकनाशके',
    'Bio-Cures & Organics': 'सेंद्रिय आणि जैविक',
    'Micronutrients & Seeds': 'बियाणे आणि सूक्ष्म अन्नद्रव्ये',
  },
  diseases: {
    'Late Blight': 'लेट ब्लाइट',
    'Powdery Mildew': 'भुरी रोग',
    'Bacterial Leaf Blight': 'जिवाणूजन्य पान करपा',
    'Leaf Rust': 'पानावरील तांबेरा',
    'Aphid Infestation': 'मावा प्रादुर्भाव',
    'Nitrogen Deficiency': 'नायट्रोजनची कमतरता',
  },
  crops: {
    Tomato: 'टोमॅटो',
    Potato: 'बटाटा',
    Wheat: 'गहू',
    Rice: 'भात',
    Cotton: 'कापूस',
    Sugarcane: 'ऊस',
    Grapes: 'द्राक्ष',
    Chilli: 'मिरची',
    Maize: 'मका',
  },
  severities: {
    Low: 'कमी',
    Moderate: 'मध्यम',
    High: 'जास्त',
  },
  roles: {
    primary: 'मुख्य उपचार',
    recovery: 'पुनर्प्राप्ती आणि माती पोषण',
    organic: 'सेंद्रिय पर्याय',
  },
};

export const ASSISTANT_CARD_COPY: Record<
  AssistantLanguage,
  AssistantCardCopy
> = {
  en: EN_CARD_COPY,
  hi: HI_CARD_COPY,
  mr: MR_CARD_COPY,
};

export function getAssistantCardCopy(
  language: AssistantLanguage
): AssistantCardCopy {
  return ASSISTANT_CARD_COPY[language];
}

export interface AssistantActionCopy {
  browseSchemes: string;
  openCropDoctor: string;
  viewTreatment: string;
  browseInputs: string;
  browseSoilInputs: string;
  openShop: string;
  openScheme: (name: string) => string;
  openPmKusum: string;
  openPmKisan: string;
  openNamoDroneDidi: string;
  openKcc: string;
}

const EN_ACTIONS: AssistantActionCopy = {
  browseSchemes: 'Browse All Govt Schemes',
  openCropDoctor: 'Open Crop Doctor',
  viewTreatment: 'View Full Treatment in Agri-Shop',
  browseInputs: 'Browse Agri-Shop Inputs',
  browseSoilInputs: 'Browse Soil & Organic Inputs',
  openShop: 'Open Agri-Shop',
  openScheme: (name) => `Open ${name}`,
  openPmKusum: 'Open PM-KUSUM',
  openPmKisan: 'Open PM-KISAN',
  openNamoDroneDidi: 'Open Namo Drone Didi',
  openKcc: 'Open Kisan Credit Card',
};

const HI_ACTIONS: AssistantActionCopy = {
  browseSchemes: 'सभी सरकारी योजनाएं देखें',
  openCropDoctor: 'क्रॉप डॉक्टर खोलें',
  viewTreatment: 'एग्री-शॉप में पूरा उपचार देखें',
  browseInputs: 'एग्री-शॉप इनपुट देखें',
  browseSoilInputs: 'मिट्टी और जैविक इनपुट देखें',
  openShop: 'एग्री-शॉप खोलें',
  openScheme: (name) => `${name} खोलें`,
  openPmKusum: 'PM-KUSUM खोलें',
  openPmKisan: 'PM-KISAN खोलें',
  openNamoDroneDidi: 'नमो ड्रोन दीदी खोलें',
  openKcc: 'किसान क्रेडिट कार्ड खोलें',
};

const MR_ACTIONS: AssistantActionCopy = {
  browseSchemes: 'सर्व सरकारी योजना पहा',
  openCropDoctor: 'क्रॉप डॉक्टर उघडा',
  viewTreatment: 'ॲग्री-शॉपमध्ये संपूर्ण उपचार पहा',
  browseInputs: 'ॲग्री-शॉप साहित्य पहा',
  browseSoilInputs: 'माती व सेंद्रिय साहित्य पहा',
  openShop: 'ॲग्री-शॉप उघडा',
  openScheme: (name) => `${name} उघडा`,
  openPmKusum: 'PM-KUSUM उघडा',
  openPmKisan: 'PM-KISAN उघडा',
  openNamoDroneDidi: 'नमो ड्रोन दीदी उघडा',
  openKcc: 'किसान क्रेडिट कार्ड उघडा',
};

export const ASSISTANT_ACTIONS: Record<
  AssistantLanguage,
  AssistantActionCopy
> = {
  en: EN_ACTIONS,
  hi: HI_ACTIONS,
  mr: MR_ACTIONS,
};

export function getAssistantActions(
  language: AssistantLanguage
): AssistantActionCopy {
  return ASSISTANT_ACTIONS[language];
}

export function getDiseaseLabel(
  language: AssistantLanguage,
  disease: string
): string {
  return getAssistantCardCopy(language).diseases[disease] ?? disease;
}

export function getCropLabel(
  language: AssistantLanguage,
  crop: string
): string {
  return getAssistantCardCopy(language).crops[crop] ?? crop;
}

export function getProductCategoryLabel(
  language: AssistantLanguage,
  category: ProductCategory
): string {
  return getAssistantCardCopy(language).productCategories[category];
}

export function getSchemeCategoryLabel(
  language: AssistantLanguage,
  category: SchemeCategory
): string {
  return getAssistantCardCopy(language).schemeCategories[category];
}
