import React, { useState, useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { router, type Href } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Ionicons from '@expo/vector-icons/Ionicons';

import { UnifiedPageShell } from '@/components/UnifiedPageShell';
import { speakUniversalText, stopAllVoicePlayback } from '@/utils/voiceEngine';
import {
  HOME_ROUTE,
  DASHBOARD_ROUTE,
  CROP_DOCTOR_ROUTE,
  WEATHER_IRRIGATION_ROUTE,
  AGRI_SHOP_ROUTE,
  MARKET_ADVISOR_ROUTE,
  CROP_ADVISOR_ROUTE,
  GOVT_SCHEMES_ROUTE,
  AI_ASSISTANT_ROUTE,
  safeGoBack,
} from '@/utils/navigation';
import { useFarm } from '@/context/FarmContext';
import {
  downloadUserManualPdf,
  type GuideLanguageMap,
} from '@/services/guidePdfService';

/* ─── Design Tokens (Homepage Clean Precision Farming Palette) ───────── */
const BRAND_DARK = '#0F291E';
const BRAND_EMERALD = '#15803D';
const BG_PAGE = '#F7F9F7';
const CARD_BG = '#FFFFFF';
const BORDER_SUBTLE = '#E6ECE6';
const TEXT_PRIMARY = '#111827';
const TEXT_MUTED = '#6B7280';
const SAGE_TINT = '#EDF5EE';

type GuideLanguage = 'en' | 'mr' | 'hi';
type ModuleFilter = 'ALL' | 'DASHBOARD' | 'CROP_DOCTOR' | 'IRRIGATION' | 'AGRI_SHOP' | 'MARKETS' | 'SCHEMES';

interface GuideStep {
  number: string;
  title: string;
  instruction: string;
  proTip: string;
}

interface GuideModule {
  id: string;
  filterKey: ModuleFilter;
  moduleNumber: string;
  title: string;
  summary: string;
  iconName: React.ComponentProps<typeof Feather>['name'];
  iconColor: string;
  route: Href;
  actionButtonText: string;
  steps: GuideStep[];
}

interface FaqItem {
  question: string;
  answer: string;
}

/* ─── Multilingual Content Dictionary (English, Marathi, Hindi) ──────── */
const GUIDE_CONTENT: Record<
  GuideLanguage,
  {
    heroBadge: string;
    heroTitle: string;
    heroSubtitle: string;
    listenAllBtn: string;
    stopAudioBtn: string;
    allModulesTab: string;
    listenModuleBtn: string;
    proTipLabel: string;
    faqSectionTitle: string;
    faqSectionSubtitle: string;
    helpdeskTitle: string;
    helpdeskSub: string;
    callCentreBtn: string;
    chatAssistantBtn: string;
    modules: GuideModule[];
    faqs: FaqItem[];
  }
> = {
  en: {
    heroBadge: 'FARMER USER MANUAL • STEP-BY-STEP TRAINING GUIDE',
    heroTitle: 'How to Use Future Farming (Complete Step-by-Step Guide)',
    heroSubtitle:
      'Simple, step-by-step instructions to scan crop diseases, schedule drip irrigation, buy subsidized farm inputs, and track orders to your farm gate.',
    listenAllBtn: 'Listen to Complete Guide',
    stopAudioBtn: 'Stop Audio Guide',
    allModulesTab: 'All Modules (Complete Manual)',
    listenModuleBtn: 'Listen to Steps',
    proTipLabel: 'Farmer Pro-Tip',
    faqSectionTitle: 'Frequently Asked Questions & Troubleshooting',
    faqSectionSubtitle: 'Quick answers and solutions to common questions faced by farmers in the field',
    helpdeskTitle: 'Need Immediate Field Support?',
    helpdeskSub:
      'Our Kisan AI Assistant and agricultural officers are available 24/7 to solve your farm queries.',
    callCentreBtn: 'Toll-Free Kisan Call Centre: 1800-180-1551',
    chatAssistantBtn: 'Chat with Kisan AI Assistant →',
    modules: [
      {
        id: 'mod1',
        filterKey: 'DASHBOARD',
        moduleNumber: 'MODULE 01',
        title: 'Account Setup, Location & Live Farm Dashboard',
        summary:
          'Learn how to sign in, verify your district, inspect 4-plot soil telemetry, and receive urgent agricultural alerts from district authorities.',
        iconName: 'compass',
        iconColor: '#15803D',
        route: DASHBOARD_ROUTE,
        actionButtonText: 'Open Live Dashboard →',
        steps: [
          {
            number: '01',
            title: 'Sign In or Register Your Farm',
            instruction:
              'Enter your registered 10-digit mobile number or email and password on the login screen. New farmers can click "Create Account" to enter their District, Farm Size (Acres), and Primary Crop.',
            proTip:
              'Always register with your active mobile number so that instant SMS receipts and dispatch alerts reach you reliably.',
          },
          {
            number: '02',
            title: 'Check Your District & Language',
            instruction:
              'Look at the top navigation bar to verify your detected district (e.g., Kolhapur, MH). Tap "EN", "मराठी", or "हिं" to instantly change the language of the entire application.',
            proTip:
              'If you move between farms or districts, tap the location pill to select your exact district for localized mandi rates.',
          },
          {
            number: '03',
            title: 'Read Your 4-Plot Farm Telemetry',
            instruction:
              'Open the Dashboard tab to inspect real-time digital twin data for each of your 4 farm plots: soil moisture percentage, NPK nutrient levels, and crop health health scores.',
            proTip:
              'A green status indicates optimal moisture; amber warns of drying root zones; red indicates critical drought stress requiring immediate valve activation.',
          },
          {
            number: '04',
            title: 'Check Admin Regional Advisories',
            instruction:
              'Watch the top of your Homepage for official pest infestation warnings or weather alerts broadcast live by your District Agriculture Officer.',
            proTip:
              'High-priority critical alerts are outlined in red and offer instant 1-tap protective spray prescriptions.',
          },
        ],
      },
      {
        id: 'mod2',
        filterKey: 'CROP_DOCTOR',
        moduleNumber: 'MODULE 02',
        title: 'Crop Doctor Scanner (AI Leaf Disease Detection & Cure)',
        summary:
          'Use AI computer vision to detect crop diseases from leaf photos and order verified organic or chemical remedies in 1 click.',
        iconName: 'camera',
        iconColor: '#15803D',
        route: CROP_DOCTOR_ROUTE,
        actionButtonText: 'Try Crop Doctor Scanner Now →',
        steps: [
          {
            number: '01',
            title: 'Take or Upload a Clear Leaf Photo',
            instruction:
              'Open Crop Doctor and tap "Take Photo with Camera" or "Upload Crop Image". Position your phone camera 15 to 20 cm from a single leaf showing visible spots or yellowing.',
            proTip:
              'Take photos in bright, natural morning daylight. Avoid blurry motions, dark shadows, or multiple overlapping leaves.',
          },
          {
            number: '02',
            title: 'Click the Green "Analyze Crop" Button',
            instruction:
              'Tap the green "Analyze Crop" button to process the photo through our 128x128 lesion pathology scanner and deep convolutional model.',
            proTip:
              'If your crop species is not auto-detected, tap the "Quick Crop Lock" buttons below the scanner to lock Sugarcane, Cotton, Rice, Soybean, or Tomato.',
          },
          {
            number: '03',
            title: 'Read the Highlighted Diagnosis Verdict',
            instruction:
              'Examine the Diagnosis Result card on the right to inspect the exact Disease Name, Pathogen Classification (Fungal, Bacterial, Viral, or Pest), Severity Score, and Affected Leaf Area.',
            proTip:
              'Severity is rated as Minor, Moderate, or Critical with estimated yield loss percentages if untreated.',
          },
          {
            number: '04',
            title: 'Follow the 4-Step Cure & Order Fungicide',
            instruction:
              'Review the chemical and organic per-acre spray instructions. Tap "Add to Agri-Shop Cart" on the prescribed medicine to order the exact cure with 1 click.',
            proTip:
              'Always spray early in the morning (7 AM - 10 AM) or late afternoon (4 PM - 6 PM) to avoid rapid heat evaporation.',
          },
        ],
      },
      {
        id: 'mod3',
        filterKey: 'IRRIGATION',
        moduleNumber: 'MODULE 03',
        title: 'Weather Forecast & Precision Drip Irrigation',
        summary:
          'Save up to 40% water and electricity with AI evapotranspiration (ETc) calculations and automated rain-locking protection.',
        iconName: 'droplet',
        iconColor: '#15803D',
        route: WEATHER_IRRIGATION_ROUTE,
        actionButtonText: 'Open Weather & Irrigation →',
        steps: [
          {
            number: '01',
            title: 'Check 7-Day Hyper-Local Weather',
            instruction:
              'Open the Irrigation tab to view live temperature, humidity, wind velocity, and 24-hour precipitation forecasts for your exact taluka.',
            proTip:
              'Check the live wind speed before spraying pesticides — wind above 15 km/h causes chemical drift and wastage.',
          },
          {
            number: '02',
            title: 'Inspect Crop Evapotranspiration (ETc)',
            instruction:
              'Review the daily evapotranspiration metrics to see exactly how many millimeters of water your crop lost today and the recommended liters per acre.',
            proTip:
              'Different growth stages demand different water volumes: vegetative stage needs moderate moisture, while flowering requires peak hydration.',
          },
          {
            number: '03',
            title: 'Follow Rain-Lock Alerts',
            instruction:
              'When rain probability exceeds 40%, the system activates "Rain Lock". Drip schedules are automatically deferred to prevent root waterlogging and conserve borewell power.',
            proTip:
              'Respecting Rain Lock prevents nitrogen leaching and protects tender roots from fungal damping-off diseases.',
          },
          {
            number: '04',
            title: 'Toggle Automated Drip Valves',
            instruction:
              'Use the interactive valve toggles on any plot card to start, pause, or schedule precision drip watering cycles from your mobile phone.',
            proTip:
              'Set drip timers to run during off-peak agricultural electricity tariffs to cut electricity bills significantly.',
          },
        ],
      },
      {
        id: 'mod4',
        filterKey: 'AGRI_SHOP',
        moduleNumber: 'MODULE 04',
        title: 'Certified Agri-Shop, Razorpay Payment & Live Order Tracking',
        summary:
          'Order authentic subsidized agrochemicals, seeds, and fertilizers with instant UPI QR payments and real-time live GPS farm gate delivery tracking.',
        iconName: 'shopping-bag',
        iconColor: '#15803D',
        route: AGRI_SHOP_ROUTE,
        actionButtonText: 'Visit Certified Agri-Shop →',
        steps: [
          {
            number: '01',
            title: 'Select Verified Seeds, Fertilizers & Fungicides',
            instruction:
              'Browse the Certified Agri-Shop catalog. Filter by Seeds, Fertilizers, Fungicides, or Bio-Pesticides, and tap "Add to Cart" on genuine FPO-subsidized products.',
            proTip:
              'All items in our shop are verified by agricultural scientists with 100% genuine batch certificates and 5% direct farmer subsidy.',
          },
          {
            number: '02',
            title: 'Enter Detailed Farm Gate Delivery Address',
            instruction:
              'Open your Cart and enter your Full Name, 10-digit Phone, Email, Gat / Survey Number, Village / Taluka, Landmark, District, and 6-digit PIN code.',
            proTip:
              'Your name and contact details pre-fill automatically from your registered profile to save time during checkout.',
          },
          {
            number: '03',
            title: 'Pay Securely via Razorpay, UPI QR or Test Mode',
            instruction:
              'Choose "Pay Online via Razorpay". Scan the dynamic UPI QR code with Google Pay, PhonePe, or Paytm, or use the emerald "[Simulate Successful Razorpay Payment Test]" button for instant verification.',
            proTip:
              'The dynamic UPI QR code uses official test handle success@razorpay and automatically displays your exact cart total.',
          },
          {
            number: '04',
            title: 'Check Email/SMS Receipt & Track Live GPS Delivery',
            instruction:
              'Immediately receive an automated GST invoice via email and SMS confirmation. Watch the 5-Stage Real-Time Order Tracking Dashboard move toward your farm gate.',
            proTip:
              'Use the "Simulate Next Checkpoint" button to preview shipment movement through the regional agro-logistics warehouse and local distribution hub.',
          },
        ],
      },
      {
        id: 'mod5',
        filterKey: 'MARKETS',
        moduleNumber: 'MODULE 05',
        title: 'Live APMC Mandi Prices & Seasonal AI Crop Advisor',
        summary:
          'Compare real-time quintal rates across regional APMC mandis, assess 7-day price trends, and get AI recommendations for maximum harvest profit.',
        iconName: 'trending-up',
        iconColor: '#15803D',
        route: MARKET_ADVISOR_ROUTE,
        actionButtonText: 'Check Live Mandi Markets →',
        steps: [
          {
            number: '01',
            title: 'Select Commodity & Nearest APMC Mandi',
            instruction:
              'Open Market Guard to compare live quintal modal prices across Kolhapur, Sangli, Pune, Solapur, and other regional APMC markets.',
            proTip:
              'Compare multiple mandis within a 50 km radius — transport cost is often outweighed by higher quintal prices at neighboring hubs.',
          },
          {
            number: '02',
            title: 'Check Price Trend & Sell/Hold Advice',
            instruction:
              'Review the 14-day historical trend graph and AI Market Guard indicator to see whether market prices are forecasted to rise or soften over the coming week.',
            proTip:
              'If the system displays a green "HOLD" badge, holding produce for 3 to 5 days can gain you an extra ₹150 to ₹300 per quintal.',
          },
          {
            number: '03',
            title: 'Use AI Crop Advisor for Season Planning',
            instruction:
              'Open Crop Advisor, enter your soil type (Black, Red, Loamy), water access, and upcoming season (Kharif, Rabi, Summer) to receive ranked crop recommendations with expected ROI.',
            proTip:
              'Check the input cost versus profit breakdown to ensure your farm budget supports the chosen crop cycle.',
          },
          {
            number: '04',
            title: 'Download Printable Field Report',
            instruction:
              'Export your tailored crop and market advisory as a clean PDF summary report to present to bank loan officers or FPO collective leadership.',
            proTip:
              'Having an official agronomic advisory report accelerates Kisan Credit Card (KCC) approval processes.',
          },
        ],
      },
      {
        id: 'mod6',
        filterKey: 'SCHEMES',
        moduleNumber: 'MODULE 06',
        title: 'Government Subsidies & PM-KISAN Scheme Matcher',
        summary:
          'Access direct government welfare schemes, solar pump grants, drip subsidies, and crop insurance with direct portal application links.',
        iconName: 'award',
        iconColor: '#15803D',
        route: GOVT_SCHEMES_ROUTE,
        actionButtonText: 'Explore Govt. Subsidies →',
        steps: [
          {
            number: '01',
            title: 'Open Government Schemes Catalog',
            instruction:
              'Navigate to Government Schemes to explore verified central and Maharashtra state welfare programs including PM-KISAN, PMFBY Crop Insurance, and PMKSY Drip Subsidies.',
            proTip:
              'Each scheme card outlines exact subsidy amounts, eligibility requirements, and current application deadline dates.',
          },
          {
            number: '02',
            title: 'Filter by Your Farm Size & Category',
            instruction:
              'Use the top filter pills (Small & Marginal Farmers, Women Farmers, Irrigation Grants, Solar Pumps) to discover programs specifically designed for your land acreage.',
            proTip:
              'Small farmers under 2 hectares (5 acres) often qualify for up to 80% subsidy on micro-drip irrigation systems.',
          },
          {
            number: '03',
            title: 'Check Required Documents Checklist',
            instruction:
              'Review the required documentation list on each scheme card: 7/12 Extract (Satbara), 8-A Record, Aadhaar Card, Bank Passbook, and No-Dues Certificate.',
            proTip:
              'Ensure your bank account has active Aadhaar NPCI seeding so direct DBT installment payments transfer without delays.',
          },
          {
            number: '04',
            title: 'Apply via Official Portal Link',
            instruction:
              'Tap the verified "Apply on Official Portal" button to open the government application page (MahaDBT / PM-KISAN) with all instructions pre-referenced.',
            proTip:
              'Keep your MahaDBT application token number saved for tracking subsidy disbursement status.',
          },
        ],
      },
    ],
    faqs: [
      {
        question: 'How do I take the best leaf photo for accurate disease detection?',
        answer:
          'Hold your camera 15 to 20 cm from a single diseased leaf in natural daylight. Avoid blurry shots, dark shadows, or taking photos of the entire plant from far away. Ensure the camera lens is clean and the spots or yellow lesions are sharply in focus.',
      },
      {
        question: 'What if my UPI app says "Couldn\'t verify UPI ID" in Test Mode?',
        answer:
          'In Razorpay sandbox test mode, third-party UPI apps cannot process arbitrary merchant IDs. Use the official test VPA success@razorpay, or tap the prominent green "[Simulate Successful Razorpay Payment Test]" button right inside the modal. This instantly authorizes payment, sends real confirmation email + SMS receipts, and unlocks the live tracking dashboard without real money.',
      },
      {
        question: 'Where can I see my order confirmation and live delivery status?',
        answer:
          'Immediately upon payment completion, check your registered email inbox (kamataryan328@gmail.com) for the full GST tax invoice and your phone for the SMS dispatch alert. The 5-Stage Real-Time Order Tracking Dashboard also unlocks directly on your screen with live GPS satellite telemetry.',
      },
      {
        question: 'How can I read this manual in Marathi or Hindi?',
        answer:
          'Simply tap the "मराठी (Marathi)" or "हिंदी (Hindi)" toggle button at the top of this user manual! You can also tap the "Listen to Steps" audio button on any module card to hear the instructions read aloud in your preferred language.',
      },
    ],
  },
  mr: {
    heroBadge: 'शेतकरी मार्गदर्शिका • सविस्तर प्रशिक्षण पुस्तिका',
    heroTitle: 'फ्युचर फार्मिंग कसे वापरावे (सविस्तर मार्गदर्शक)',
    heroSubtitle:
      'पिकांवरील रोग ओळखणे, ठिबक सिंचन नियोजन, अनुदानावर कृषी निविष्ठा खरेदी करणे आणि शेतापर्यंत थेट पार्सल ट्रॅकिंगच्या सोप्या पायऱ्या.',
    listenAllBtn: 'संपूर्ण मार्गदर्शक ऐका',
    stopAudioBtn: 'आवाज थांबवा',
    allModulesTab: 'सर्व विभाग (संपूर्ण पुस्तिका)',
    listenModuleBtn: 'पायऱ्या ऐका',
    proTipLabel: 'शेतकरी सल्ला (महत्त्वाची टीप)',
    faqSectionTitle: 'वारंवार विचारले जाणारे प्रश्न आणि उत्तरे',
    faqSectionSubtitle: 'शेतकऱ्यांच्या दैनंदिन वापरातील शंकांचे तातडीने निरसन',
    helpdeskTitle: 'तातडीने शेतीविषयक मदत हवी आहे का?',
    helpdeskSub:
      'आमचे किसान एआय सहाय्यक आणि तालुका कृषी अधिकारी २४ तास उपलब्ध आहेत.',
    callCentreBtn: 'टोल-फ्री किसान कॉल सेंटर: 1800-180-1551',
    chatAssistantBtn: 'किसान एआय सहाय्यकाशी बोला →',
    modules: [
      {
        id: 'mod1',
        filterKey: 'DASHBOARD',
        moduleNumber: 'विभाग ०१',
        title: 'खाते नोंदणी, जिल्हा निवड आणि लाईव्ह शेत डॅशबोर्ड',
        summary:
          'खात्यात लॉगिन करणे, जिल्हा तपासणे, ४ शेत प्लॉट्सची माती-आर्द्रता पाहणे आणि कृषी विभागाच्या सूचना समजून घ्या.',
        iconName: 'compass',
        iconColor: '#15803D',
        route: DASHBOARD_ROUTE,
        actionButtonText: 'थेट डॅशबोर्ड उघडा →',
        steps: [
          {
            number: '०१',
            title: 'लॉगिन करा किंवा नवीन खाते उघडा',
            instruction:
              'आपला नोंदणीकृत १० अंकी मोबाईल नंबर व पासवर्ड टाकून लॉगिन करा. नवीन शेतकऱ्यांनी "नोंदणी करा" वर क्लिक करून जिल्हा, शेतीचे क्षेत्र (एकर) आणि मुख्य पीक नोंदवा.',
            proTip:
              'नेहमी चालू मोबाईल नंबर वापरा जेणेकरून खरेदीची पावती आणि एसएमएस थेट आपल्या फोनवर येईल.',
          },
          {
            number: '०२',
            title: 'आपला जिल्हा व भाषा निवडा',
            instruction:
              'वरच्या पट्टीवर आपला जिल्हा (उदा. कोल्हापूर) अचूक असल्याची खात्री करा. भाषा बदलण्यासाठी "मराठी", "EN", किंवा "हिं" वर क्लिक करा.',
            proTip:
              'जिल्हा अचूक निवडल्यास हवामान अंदाज आणि बाजारभाव थेट आपल्या नजीकच्या बाजार समितीचे दिसतात.',
          },
          {
            number: '०३',
            title: '४ प्लॉट्सची थेट माहिती तपासा',
            instruction:
              'डॅशबोर्डवर जाऊन आपल्या शेतातील प्रत्येक प्लॉटची मातीतील ओलावा, NPK खत पातळी आणि पिकाचे आरोग्य गुण तपासा.',
            proTip:
              'हिरवा रंग पुरेसा ओलावा दर्शवतो, पिवळा रंग पाणी देण्याची गरज दर्शवतो, आणि लाल रंग तीव्र दुष्काळ दर्शवतो.',
          },
          {
            number: '०४',
            title: 'सरकारी व विभागीय सूचना तपासा',
            instruction:
              'होमपेजच्या शीर्षस्थानी तालुका कृषी अधिकाऱ्यांनी जारी केलेल्या कीड किंवा अवकाळी पावसाच्या अधिकृत सूचना पहा.',
            proTip:
              'लाल रंगाच्या धोक्याच्या सूचनेवर क्लिक करून प्रतिबंधक फवारणीचा सल्ला लगेच मिळवा.',
          },
        ],
      },
      {
        id: 'mod2',
        filterKey: 'CROP_DOCTOR',
        moduleNumber: 'विभाग ०२',
        title: 'क्रॉप डॉक्टर स्कॅनर (AI द्वारे पानांवरील रोग निदान आणि उपाय)',
        summary:
          'पानाचा फोटो काढून एआय तंत्रज्ञानाने कीड व रोग ओळखा आणि एका क्लिकवर औषध मागवा.',
        iconName: 'camera',
        iconColor: '#15803D',
        route: CROP_DOCTOR_ROUTE,
        actionButtonText: 'क्रॉप डॉक्टर स्कॅनर वापरा →',
        steps: [
          {
            number: '०१',
            title: 'पानाचा स्वच्छ व स्पष्ट फोटो काढा',
            instruction:
              'क्रॉप डॉक्टर उघडून "कॅमेऱ्याने फोटो काढा" किंवा फोटो अपलोड करा. रोगट किंवा ठिपके पडलेल्या एका पानावर १५ ते २० सेमी अंतरावरून कॅमेरा केंद्रित करा.',
            proTip:
              'सकाळच्या स्वच्छ सूर्यप्रकाशात फोटो काढा. सावली किंवा हलणारे पान टाळा.',
          },
          {
            number: '०२',
            title: 'हिरव्या "पिकाचे विश्लेषण करा" बटणावर क्लिक करा',
            instruction:
              '"Analyze Crop" वर क्लिक करताच १२८x१२८ पिक्सेल स्कॅनर पानाचे सूक्ष्म विश्लेषण सुरू करतो.',
            proTip:
              'पीक योग्य न ओळखल्यास खालील "Quick Crop Lock" मधून ऊस, कापूस, सोयाबीन किंवा टोमॅटो निवडा.',
          },
          {
            number: '०३',
            title: 'रोगाचे अचूक नाव व तीव्रता तपासा',
            instruction:
              'उजव्या बाजूला रोगाचे नाव, बुरशीजन्य/जिवाणूजन्य प्रकार आणि पानाचे किती टक्के नुकसान झाले आहे ते पहा.',
            proTip:
              'तीव्रतेनुसार (Minor, Moderate, Critical) उपचारांची तातडी ठरवली जाते.',
          },
          {
            number: '०४',
            title: 'औषध फवारणीचे प्रमाण पाहून खरेदी करा',
            instruction:
              'प्रति एकर रासायनिक व सेंद्रिय औषधाचे प्रमाण वाचा आणि "Add to Agri-Shop Cart" वर क्लिक करून औषध घरपोच मागवा.',
            proTip:
              'औषध फवारणी नेहमी सकाळी ७ ते १० किंवा संध्याकाळी ४ ते ६ या वेळेतच करावी.',
          },
        ],
      },
      {
        id: 'mod3',
        filterKey: 'IRRIGATION',
        moduleNumber: 'विभाग ०३',
        title: 'हवामान अंदाज आणि अचूक ठिबक सिंचन वेळापत्रक',
        summary:
          'पिकांच्या बाष्पीभवन (ETc) नुसार पाणी देऊन ४०% वीज व पाण्याची बचत करा.',
        iconName: 'droplet',
        iconColor: '#15803D',
        route: WEATHER_IRRIGATION_ROUTE,
        actionButtonText: 'हवामान व सिंचन उघडा →',
        steps: [
          {
            number: '०१',
            title: '७ दिवसांचा स्थानिक हवामान अंदाज पहा',
            instruction:
              'सिंचन टॅबमध्ये जाऊन तापमान, हवेतील आर्द्रता, वाऱ्याचा वेग आणि २४ तासांतील पावसाची शक्यता पहा.',
            proTip:
              'वाऱ्याचा वेग १५ किमी/तास पेक्षा जास्त असल्यास फवारणी टाळा कारण औषध हवेत उडून जाते.',
          },
          {
            number: '०२',
            title: 'पिकाचे पाण्याचे नुकसान (ETc) तपासा',
            instruction:
              'पिकाने आज किती लिटर पाणी गमावले आणि प्रति एकर किती लिटर पाण्याची गरज आहे ते पहा.',
            proTip:
              'वाढीच्या अवस्थेनुसार पाण्याची गरज बदलते — फुलवऱ्याच्या काळात पिकाला जास्त पाण्याची गरज असते.',
          },
          {
            number: '०३',
            title: 'रेन-लॉक (पाऊस संरक्षण) पाळा',
            instruction:
              'पावसाची शक्यता ४०% पेक्षा जास्त असल्यास सिंचन आपोआप स्थगित होते जेणेकरून मुळांमध्ये पाणी साचणार नाही.',
            proTip:
              'रेन-लॉक पाळल्यास पिकांची मुळे कुजण्यापासून वाचतात आणि विहिरीची वीज वाचते.',
          },
          {
            number: '०४',
            title: 'ठिबक सिंचनाचे व्हॉल्व्ह सुरू करा',
            instruction:
              'प्लॉट कार्डवरील व्हॉल्व्ह बटणावर क्लिक करून मोबाईलवरून थेट ठिबक पाणी सुरू करा किंवा वेळापत्रक लावा.',
            proTip:
              'रात्रीच्या स्वस्त वीज दरामध्ये ठिबक सिंचन सुरू केल्यास वीज बिलात मोठी बचत होते.',
          },
        ],
      },
      {
        id: 'mod4',
        filterKey: 'AGRI_SHOP',
        moduleNumber: 'विभाग ०४',
        title: 'प्रमाणित कृषी-शॉप, रेझरपे पेमेंट आणि लाईव्ह ऑर्डर ट्रॅकिंग',
        summary:
          'शासकीय अनुदानावर खरी बियाणे व औषधे मागवा आणि शेताच्या बांधापर्यंत थेट पार्सल ट्रॅकिंग पहा.',
        iconName: 'shopping-bag',
        iconColor: '#15803D',
        route: AGRI_SHOP_ROUTE,
        actionButtonText: 'अ‍ॅग्री-शॉप वर जा →',
        steps: [
          {
            number: '०१',
            title: 'खात्रीशीर बियाणे व औषधे निवडा',
            instruction:
              'अ‍ॅग्री-शॉप उघडून खते, बुरशीनाशके किंवा बियाणे निवडा आणि "Add to Cart" वर क्लिक करा.',
            proTip:
              'आमच्या दुकानातील सर्व उत्पादने कृषी विद्यापीठांनी प्रमाणित असून शेतकऱ्यांना थेट ५% सवलत मिळते.',
          },
          {
            number: '०२',
            title: 'शेताचा संपूर्ण पत्ता नोंदवा',
            instruction:
              'कार्टमध्ये जाऊन आपले नाव, फोन नंबर, गट नंबर, गाव, तालुका, खूण आणि पिन कोड अचूक भरा.',
            proTip:
              'आपले नाव आणि फोन नंबर प्रोफाईलमधून आपोआप भरला जातो, त्यामुळे वेळ वाचतो.',
          },
          {
            number: '०३',
            title: 'Razorpay किंवा UPI QR ने सुरक्षित पैसे भरा',
            instruction:
              'Razorpay निवडून GPay, PhonePe किंवा Paytm ने QR कोड स्कॅन करा किंवा चाचणीसाठी "[Simulate Successful Razorpay Payment Test]" बटण दाबा.',
            proTip:
              'चाचणी करताना success@razorpay वापरा किंवा टेस्ट बटणाने थेट यशस्वी खात्री करा.',
          },
          {
            number: '०४',
            title: 'ईमेल पावती तपासा आणि ५-टप्प्यांचे ट्रॅकिंग पहा',
            instruction:
              'पेमेंट होताच आपल्या ईमेलवर जीएसटी पावती व एसएमएस येतो आणि शेताच्या बांधापर्यंतचे थेट ५ टप्प्यांचे ट्रॅकिंग सुरू होते.',
            proTip:
              '"Simulate Next Checkpoint" बटण दाबून पार्सल वेअरहाऊसमधून कसे पुढे सरकते ते पहा.',
          },
        ],
      },
      {
        id: 'mod5',
        filterKey: 'MARKETS',
        moduleNumber: 'विभाग ०५',
        title: 'लाईव्ह बाजारभाव (मंडी) आणि हंगामी पीक सल्लागार',
        summary:
          'जवळच्या बाजार समित्यांमधील थेट क्विंटल दर तपासा आणि पुढील ७ दिवसांचे भाव अंदाज समजून घ्या.',
        iconName: 'trending-up',
        iconColor: '#15803D',
        route: MARKET_ADVISOR_ROUTE,
        actionButtonText: 'थेट बाजारभाव तपासा →',
        steps: [
          {
            number: '०१',
            title: 'शेतमाल व जवळची बाजार समिती निवडा',
            instruction:
              'मार्केट गार्डमध्ये जाऊन कोल्हापूर, सांगली, पुणे व सोलापूर बाजार समित्यांमधील थेट दर तपासा.',
            proTip:
              '५० किमी परिसरातील बाजार समित्यांची तुलना करा — अनेकदा शेजारच्या बाजारात २०० रुपये जास्त मिळतात.',
          },
          {
            number: '०२',
            title: 'भाववाढ किंवा घसरणीचा सल्ला पहा',
            instruction:
              'पुढील आठवड्यात भाव वाढणार की कमी होणार ते पाहून माल बाजारात नेण्याचा निर्णय घ्या.',
            proTip:
              'जर प्रणालीने "HOLD" चा सल्ला दिला तर २-३ दिवस माल थांबवून विकल्यास जास्त नफा होतो.',
          },
          {
            number: '०३',
            title: 'पीक सल्लागाराकडून हंगामाचे नियोजन करा',
            instruction:
              'मातीचा प्रकार, पाण्याची उपलब्धता आणि हंगाम निवडून कोणत्या पिकातून सर्वाधिक नफा होईल ते पहा.',
            proTip:
              'खर्च आणि अपेक्षित नफा तपासूनच नवीन पिकाची लागवड करावी.',
          },
          {
            number: '०४',
            title: 'शेती अहवाल डाऊनलोड करा',
            instruction:
              'आपल्या पिकाचा व बाजाराचा अहवाल पीडीएफ स्वरूपात डाऊनलोड करून बँक किंवा सोसायटीसाठी वापरा.',
            proTip:
              'हा अहवाल किसान क्रेडिट कार्ड (KCC) कर्ज मंजुरीसाठी अत्यंत उपयुक्त ठरतो.',
          },
        ],
      },
      {
        id: 'mod6',
        filterKey: 'SCHEMES',
        moduleNumber: 'विभाग ०६',
        title: 'शासकीय अनुदान आणि पीएम-किसान योजना (PM-KISAN)',
        summary:
          'पीएम-किसान, पीक विमा, सोलर पंप योजना आणि ठिबक अनुदानाची माहिती व थेट अर्ज करा.',
        iconName: 'award',
        iconColor: '#15803D',
        route: GOVT_SCHEMES_ROUTE,
        actionButtonText: 'सरकारी योजना पहा →',
        steps: [
          {
            number: '०१',
            title: 'सरकारी योजनांची यादी उघडा',
            instruction:
              'शासनाचे विविध अनुदान प्रकल्प, पीएम-किसान, महाडीबीटी योजना आणि पीक विम्याची माहिती पहा.',
            proTip:
              'प्रत्येक योजनेचा अनुदानाचा आकडा आणि अर्जाची शेवटची तारीख स्पष्ट दिलेली असते.',
          },
          {
            number: '०२',
            title: 'आपल्या शेतजमिनीनुसार योजना शोधा',
            instruction:
              'अल्पभूधारक, महिला शेतकरी किंवा ठिबक सिंचन अशा पर्यायांवरून आपल्यासाठी योग्य योजना निवडा.',
            proTip:
              '५ एकरांपेक्षा कमी शेती असणाऱ्या शेतकऱ्यांना ठिबक सिंचनावर ८०% पर्यंत अनुदान मिळते.',
          },
          {
            number: '०३',
            title: 'कागदपत्रांची यादी तपासा',
            instruction:
              '७/१२ उतारा, ८-अ, आधार कार्ड आणि बँक पासबुक तयार असल्याची खात्री करा.',
            proTip:
              'बँक खात्याला आधार लिंक (NPCI Seeding) असणे आवश्यक आहे जेणेकरून पैसे थेट खात्यात जमा होतील.',
          },
          {
            number: '०४',
            title: 'अधिकृत पोर्टलवर थेट अर्ज करा',
            instruction:
              '"Apply on Official Portal" वर क्लिक करून महाडीबीटी किंवा केंद्र शासनाच्या पोर्टलवर अर्ज सादर करा.',
            proTip:
              'अर्जाचा टोकन नंबर सुरक्षित ठेवा जेणेकरून अनुदानाची स्थिती तपासता येईल.',
          },
        ],
      },
    ],
    faqs: [
      {
        question: 'रोगाचे अचूक निदान होण्यासाठी पानाचा फोटो कसा काढावा?',
        answer:
          'सकाळच्या सूर्यप्रकाशात रोगट पानावर १५ ते २० सेमी अंतरावरून कॅमेरा रोखा. सावली किंवा हलणारे पान टाळा. कॅमेऱ्याची लेन्स स्वच्छ ठेवा आणि पानावरील ठिपक्यांवर लक्ष केंद्रित करा.',
      },
      {
        question: 'चाचणी दरम्यान UPI मध्ये "Couldn\'t verify UPI ID" आल्यास काय करावे?',
        answer:
          'रेझरपे चाचणी मोडमध्ये अधिकृत चाचणी आयडी success@razorpay वापरा किंवा विंडोमधील हिरव्या "[Simulate Successful Razorpay Payment Test]" बटणावर क्लिक करा. यामुळे खरे पैसे न कापता लगेच पावती व ट्रॅकिंग सुरू होते.',
      },
      {
        question: 'खरेदी केलेल्या औषधांची पावती आणि ट्रॅकिंग कुठे दिसेल?',
        answer:
          'पेमेंट होताच आपल्या नोंदणीकृत ईमेलवर (kamataryan328@gmail.com) जीएसटी पावती आणि मोबाईलवर एसएमएस येतो. तसेच स्क्रीनवर ५ टप्प्यांचे थेट सॅटेलाइट ट्रॅकिंग सुरू होते.',
      },
      {
        question: 'ही मार्गदर्शिका मराठी किंवा हिंदीत कशी वाचावी किंवा ऐकावी?',
        answer:
          'या पानाच्या शीर्षस्थानी "मराठी" किंवा "हिंदी" बटण दाबा. तसेच कोणत्याही कार्डवरील "पायऱ्या ऐका" बटणावर क्लिक केल्यास सर्व सूचना आवाजात ऐकू येतात.',
      },
    ],
  },
  hi: {
    heroBadge: 'किसान उपयोगकर्ता पुस्तिका • चरण-दर-चरण प्रशिक्षण मार्गदर्शिका',
    heroTitle: 'फ्यूचर फार्मिंग का उपयोग कैसे करें (सम्पूर्ण गाइड)',
    heroSubtitle:
      'फसलों के रोग पहचानने, ड्रिप सिंचाई की योजना बनाने, रियायती कृषि उत्पाद खरीदने और खेत तक लाइव डिलीवरी ट्रैक करने के आसान निर्देश।',
    listenAllBtn: 'पूरी गाइड ऑडियो में सुनें',
    stopAudioBtn: 'ऑडियो बंद करें',
    allModulesTab: 'सभी 6 मॉड्यूल (पूरी पुस्तिका)',
    listenModuleBtn: 'चरण ऑडियो में सुनें',
    proTipLabel: 'किसान प्रो-सलाह',
    faqSectionTitle: 'अक्सर पूछे जाने वाले प्रश्न और समाधान',
    faqSectionSubtitle: 'खेत में काम करते समय किसानों के मन में उठने वाले सवालों के सीधे जवाब',
    helpdeskTitle: 'क्या आपको तत्काल कृषि सहायता चाहिए?',
    helpdeskSub:
      'हमारे किसान एआई सहायक और कृषि विशेषज्ञ आपकी सेवा में २४ घंटे तत्पर हैं।',
    callCentreBtn: 'टोल-फ्री किसान कॉल सेंटर: 1800-180-1551',
    chatAssistantBtn: 'किसान एआई सहायक से बात करें →',
    modules: [
      {
        id: 'mod1',
        filterKey: 'DASHBOARD',
        moduleNumber: 'मॉड्यूल ०१',
        title: 'खाता पंजीकरण, जिला चयन और लाइव फार्म डैशबोर्ड',
        summary:
          'लॉगिन करना, जिला जांचना, ४ खेतों की मिट्टी व नमी देखना और सरकारी कृषि चेतावनियां समझना सीखें।',
        iconName: 'compass',
        iconColor: '#15803D',
        route: DASHBOARD_ROUTE,
        actionButtonText: 'लाइव डैशबोर्ड खोलें →',
        steps: [
          {
            number: '०१',
            title: 'लॉगिन करें या नया खाता बनाएं',
            instruction:
              'अपने १० अंकों के मोबाइल नंबर और पासवर्ड से लॉगिन करें। नए किसान "Create Account" पर क्लिक करके अपना जिला, जमीन (एकड़) और मुख्य फसल दर्ज करें।',
            proTip:
              'हमेशा सक्रिय मोबाइल नंबर दर्ज करें ताकि खरीद की रसीद और एसएमएस तुरंत आपके फोन पर मिल सके।',
          },
          {
            number: '०२',
            title: 'अपना जिला और भाषा जांचें',
            instruction:
              'ऊपरी पट्टी में अपना जिला जांचें। भाषा बदलने के लिए "हिंदी", "मराठी" या "EN" पर क्लिक करें।',
            proTip:
              'जिला सही चुनने पर मौसम का पूर्वानुमान और मंडी के भाव आपके निकटतम बाजार के दिखते हैं।',
          },
          {
            number: '०३',
            title: '४ खेतों का लाइव टेलीमेट्री डेटा देखें',
            instruction:
              'डैशबोर्ड पर जाकर प्रत्येक खेत की मिट्टी की नमी, एनपीके पोषक तत्व और फसल स्वास्थ्य स्कोर का वास्तविक समय डेटा देखें।',
            proTip:
              'हरा रंग पर्याप्त नमी दर्शाता है, पीला रंग पानी की कमी की चेतावनी देता है और लाल रंग गंभीर सूखे की स्थिति दर्शाता है।',
          },
          {
            number: '०४',
            title: 'प्रशासनिक क्षेत्रीय सलाह व चेतावनियां जांचें',
            instruction:
              'होमपेज पर सबसे ऊपर जिला कृषि अधिकारी द्वारा जारी किए गए कीट प्रकोप या मौसम की ताजा चेतावनियों को देखें।',
            proTip:
              'लाल रंग की चेतावनी उच्च प्राथमिकता वाली होती है और तुरंत १-क्लिक में फवारणी दवा की सिफारिश देती है।',
          },
        ],
      },
      {
        id: 'mod2',
        filterKey: 'CROP_DOCTOR',
        moduleNumber: 'मॉड्यूल ०२',
        title: 'क्रॉप डॉक्टर स्कैनर (एआई पत्ती रोग पहचान और उपचार)',
        summary:
          'पत्ती के फोटो से एआई द्वारा फसल के रोगों की पहचान करें और १ क्लिक में प्रमाणित जैविक या रासायनिक दवाएं मंगाएं।',
        iconName: 'camera',
        iconColor: '#15803D',
        route: CROP_DOCTOR_ROUTE,
        actionButtonText: 'क्रॉप डॉक्टर स्कैनर का उपयोग करें →',
        steps: [
          {
            number: '०१',
            title: 'पत्ती का साफ और स्पष्ट फोटो लें',
            instruction:
              'क्रॉप डॉक्टर खोलकर "कैमरे से फोटो लें" या गैलरी से अपलोड करें। रोगग्रस्त या पीले धब्बों वाली एक पत्ती पर १५ से २० सेमी की दूरी से कैमरा फोकस करें।',
            proTip:
              'सुबह की प्राकृतिक धूप में फोटो लें। छाया या हिलती हुई पत्ती का फोटो न लें।',
          },
          {
            number: '०२',
            title: 'हरे "फसल का विश्लेषण करें" बटन पर क्लिक करें',
            instruction:
              '"Analyze Crop" बटन दबाते ही १२८x१२८ घाव विश्लेषक मॉडल पत्ती की सूक्ष्म जांच शुरू करता है।',
            proTip:
              'यदि फसल का नाम सही न आए, तो नीचे दिए गए "Quick Crop Lock" से गन्ना, कपास, सोयाबीन, धान या टमाटर चुनें।',
          },
          {
            number: '०३',
            title: 'रोग का सटीक नाम और गंभीरता देखें',
            instruction:
              'दाईं ओर परिणाम कार्ड में रोग का नाम, रोगजनक प्रकार (फफूंद, बैक्टीरिया, वायरस या कीट) और नुकसान का प्रतिशत जांचें।',
            proTip:
              'गंभीरता (Minor, Moderate, Critical) के आधार पर उपचार की तुरंत योजना बनाएं।',
          },
          {
            number: '०४',
            title: 'दवा छिड़काव की खुराक देखकर ऑर्डर करें',
            instruction:
              'प्रति एकड़ रासायनिक और जैविक दवा छिड़काव का अनुपात देखें और "Add to Agri-Shop Cart" दबाकर सीधे घर पर दवा मंगाएं।',
            proTip:
              'दवा का छिड़काव हमेशा सुबह ७ से १० या शाम ४ से ६ बजे के बीच ही करें ताकि दवा वाष्पीकृत न हो।',
          },
        ],
      },
      {
        id: 'mod3',
        filterKey: 'IRRIGATION',
        moduleNumber: 'मॉड्यूल ०३',
        title: 'मौसम पूर्वानुमान और सटीक ड्रिप सिंचाई समय सारिणी',
        summary:
          'फसल के वाष्पोत्सर्जन (ETc) के अनुसार पानी देकर ४०% पानी और बिजली की बचत करें।',
        iconName: 'droplet',
        iconColor: '#15803D',
        route: WEATHER_IRRIGATION_ROUTE,
        actionButtonText: 'मौसम व सिंचाई खोलें →',
        steps: [
          {
            number: '०१',
            title: '७ दिनों का स्थानीय मौसम पूर्वानुमान देखें',
            instruction:
              'सिंचाई टैब में जाकर अपने ब्लॉक का तापमान, नमी, हवा की गति और २४ घंटों में वर्षा की संभावना देखें।',
            proTip:
              'हवा की गति १५ किमी/घंटा से अधिक हो तो छिड़काव न करें क्योंकि दवा हवा में बह जाती है।',
          },
          {
            number: '०२',
            title: 'फसल का जल ह्रास (ETc) जांचें',
            instruction:
              'दैनिक वाष्पोत्सर्जन माप से देखें कि फसल ने आज कितना पानी खोया और प्रति एकड़ कितने लीटर पानी की आवश्यकता है।',
            proTip:
              'फूल आने के समय फसल को सर्वाधिक पानी की आवश्यकता होती है, जबकि वानस्पतिक अवस्था में सामान्य पानी पर्याप्त होता है।',
          },
          {
            number: '०३',
            title: 'रेन-लॉक (वर्षा सुरक्षा) का पालन करें',
            instruction:
              'बारिश की संभावना ४०% से अधिक होने पर ड्रिप सिंचाई स्वतः स्थगित हो जाती है ताकि जड़ों में जलभराव न हो।',
            proTip:
              'रेन-लॉक का पालन करने से जड़ों में सड़न रोग नहीं लगता और ट्यूबवेल की बिजली बचती है।',
          },
          {
            number: '०४',
            title: 'मोबाइल से ड्रिप वाल्व चालू या शेड्यूल करें',
            instruction:
              'खेत कार्ड पर दिए गए वाल्व बटन से घर बैठे मोबाइल द्वारा ड्रिप सिंचाई चालू, बंद या टाइमर सेट करें।',
            proTip:
              'कृषि बिजली के सस्ते समय में सिंचाई टाइमर सेट करके बिजली बिल में भारी बचत करें।',
          },
        ],
      },
      {
        id: 'mod4',
        filterKey: 'AGRI_SHOP',
        moduleNumber: 'मॉड्यूल ०४',
        title: 'प्रमाणित एग्री-शॉप, रेजरपे भुगतान और लाइव पार्सल ट्रैकिंग',
        summary:
          'सरकारी सब्सिडी पर असली बीज व खाद मंगाएं और खेत के द्वार तक लाइव पार्सल ट्रैकिंग देखें।',
        iconName: 'shopping-bag',
        iconColor: '#15803D',
        route: AGRI_SHOP_ROUTE,
        actionButtonText: 'प्रमाणित एग्री-शॉप देखें →',
        steps: [
          {
            number: '०१',
            title: 'प्रमाणित बीज, खाद व कीटनाशक चुनें',
            instruction:
              'एग्री-शॉप खोलकर दवाइयां, खाद या बीज चुनें और "Add to Cart" पर क्लिक करें।',
            proTip:
              'हमारे सभी उत्पाद १००% असली और सीधे ५% किसान सब्सिडी के साथ मिलते हैं।',
          },
          {
            number: '०२',
            title: 'खेत का पूरा पता भरें',
            instruction:
              'कार्ट में जाकर अपना नाम, मोबाइल नंबर, गट नंबर, गांव, तहसील, पहचान का स्थान और पिन कोड भरें।',
            proTip:
              'आपका नाम और फोन नंबर प्रोफाइल से अपने आप भर जाता है ताकि समय बच सके।',
          },
          {
            number: '०३',
            title: 'Razorpay या UPI QR से सुरक्षित भुगतान करें',
            instruction:
              'Razorpay चुनकर GPay, PhonePe या Paytm से QR कोड स्कैन करें या टेस्टिंग के लिए "[Simulate Successful Razorpay Payment Test]" बटन दबाएं।',
            proTip:
              'टेस्टिंग के दौरान success@razorpay का उपयोग करें या सिम्युलेट बटन दबाएं।',
          },
          {
            number: '०४',
            title: 'ईमेल रसीद देखें और ५-चरणीय लाइव ट्रैकिंग पाएं',
            instruction:
              'भुगतान होते ही ईमेल पर पक्की जीएसटी रसीद और फोन पर एसएमएस आता है और खेत तक लाइव डिलीवरी ट्रैकिंग खुल जाती है।',
            proTip:
              '"Simulate Next Checkpoint" बटन दबाकर देखें कि पार्सल गोदाम से आपके खेत तक कैसे पहुंचता है।',
          },
        ],
      },
      {
        id: 'mod5',
        filterKey: 'MARKETS',
        moduleNumber: 'मॉड्यूल ०५',
        title: 'लाइव मंडी भाव और मौसमी फसल सलाहकार',
        summary:
          'निकटतम मंडियों में आज के क्विंटल भाव देखें और अगले ७ दिनों के तेजी-मंदी पूर्वानुमान जानें।',
        iconName: 'trending-up',
        iconColor: '#15803D',
        route: MARKET_ADVISOR_ROUTE,
        actionButtonText: 'लाइव मंडी भाव देखें →',
        steps: [
          {
            number: '०१',
            title: 'फसल और नजदीकी एपीएमसी मंडी चुनें',
            instruction:
              'मार्केट गार्ड में जाकर कोल्हापुर, सांगली, पुणे व अन्य मंडियों के आज के ताजा भाव देखें।',
            proTip:
              '५० किमी के दायरे की २-३ मंडियों के भाव देखें, कई बार पड़ोसी मंडी में २००-३०० रुपये अधिक मिलते हैं।',
          },
          {
            number: '०२',
            title: 'तेजी-मंदी का रुझान और बेचने की सलाह देखें',
            instruction:
              'अगले सप्ताह भाव बढ़ेंगे या गिरेंगे, यह देखकर ही माल मंडी ले जाने का निर्णय लें।',
            proTip:
              'यदि सिस्टम "HOLD" की सलाह दे, तो ३-४ दिन रुककर माल बेचने से अधिक मुनाफा होता है।',
          },
          {
            number: '०३',
            title: 'फसल सलाहकार से अगले सीजन की योजना बनाएं',
            instruction:
              'मिट्टी का प्रकार, पानी की सुविधा और सीजन चुनकर सर्वाधिक मुनाफे वाली फसलों की सूची देखें।',
            proTip:
              'लागत और मुनाफे का हिसाब देखकर ही नई फसल की बुवाई करें।',
          },
          {
            number: '०४',
            title: 'कृषि रिपोर्ट पीडीएफ में डाउनलोड करें',
            instruction:
              'अपनी फसल और बाजार योजना की रिपोर्ट पीडीएफ में निकालें और बैंक लोन या किसान समूह में उपयोग करें।',
            proTip:
              'यह रिपोर्ट किसान क्रेडिट कार्ड (KCC) लोन पास कराने में सहायक सिद्ध होती है।',
          },
        ],
      },
      {
        id: 'mod6',
        filterKey: 'SCHEMES',
        moduleNumber: 'मॉड्यूल ०६',
        title: 'सरकारी सब्सिडी और पीएम-किसान योजना (PM-KISAN)',
        summary:
          'पीएम-किसान, फसल बीमा, सोलर पंप और ड्रिप सब्सिडी की जानकारी और सीधे आवेदन के लिंक।',
        iconName: 'award',
        iconColor: '#15803D',
        route: GOVT_SCHEMES_ROUTE,
        actionButtonText: 'सरकारी योजनाएं खोजें →',
        steps: [
          {
            number: '०१',
            title: 'सरकारी योजनाओं की सूची देखें',
            instruction:
              'पीएम-किसान, फसल बीमा योजना, सोलर पंप कुसुम योजना और ड्रिप सब्सिडी की पात्रता देखें।',
            proTip:
              'प्रत्येक योजना की सब्सिडी राशि और आवेदन की अंतिम तारीख स्पष्ट लिखी होती है।',
          },
          {
            number: '०२',
            title: 'अपनी जमीन के अनुसार योजना चुनें',
            instruction:
              'लघु किसान, महिला किसान या ड्रिप योजना के फिल्टर से अपने खेत के अनुकूल योजना खोजें।',
            proTip:
              '५ एकड़ से कम जमीन वाले किसानों को ड्रिप सिंचाई पर ८०% तक सब्सिडी मिलती है।',
          },
          {
            number: '०३',
            title: 'जरूरी दस्तावेजों की सूची जांचें',
            instruction:
              'खसरा/खतौनी, आधार कार्ड, बैंक पासबुक और एनओसी तैयार रखें।',
            proTip:
              'बैंक खाते में आधार एनपीसीआई (NPCI Seeding) लिंक होना अनिवार्य है ताकि डीबीटी का पैसा तुरंत आ सके।',
          },
          {
            number: '०४',
            title: 'आधिकारिक पोर्टल पर सीधे आवेदन करें',
            instruction:
              '"Apply on Official Portal" पर क्लिक करके सरकारी वेबसाइट पर ऑनलाइन फॉर्म भरें।',
            proTip:
              'आवेदन का टोकन नंबर संभाल कर रखें ताकि किस्त की स्थिति चेक की जा सके।',
          },
        ],
      },
    ],
    faqs: [
      {
        question: 'सटीक रोग पहचान के लिए पत्ते का फोटो कैसे खींचे?',
        answer:
          'सुबह की प्राकृतिक धूप में प्रभावित पत्ते से १५-२० सेमी दूरी से साफ फोटो लें। हिलता हुआ या छायादार फोटो न लें। कैमरे का लेंस साफ रखें और पत्ते के धब्बों पर फोकस करें।',
      },
      {
        question: 'UPI में "Couldn\'t verify UPI ID" आने पर क्या करें?',
        answer:
          'रेज़रपे टेस्ट मोड में अधिकृत टेस्ट आईडी success@razorpay का उपयोग करें या विंडो में दिए गए हरे "[Simulate Successful Razorpay Payment Test]" बटन को दबाएं। इससे बिना पैसे कटे तुरंत रसीद और लाइव ट्रैकिंग खुल जाती है।',
      },
      {
        question: 'दवाइयों की रसीद और डिलीवरी स्थिति कहां दिखाई देगी?',
        answer:
          'भुगतान पूरा होते ही आपके ईमेल (kamataryan328@gmail.com) पर पक्का जीएसटी बिल और फोन पर एसएमएस आता है। साथ ही स्क्रीन पर ५-चरणीय लाइव डिलीवरी ट्रैकिंग खुल जाती है।',
      },
      {
        question: 'इस मैनुअल को हिंदी या मराठी में कैसे पढ़ें या सुनें?',
        answer:
          'इस पेज के सबसे ऊपर दिए गए "हिंदी" या "मराठी" बटन को दबाएं। आप किसी भी कार्ड पर दिए गए "चरण ऑडियो में सुनें" बटन को दबाकर आवाज में भी निर्देश सुन सकते हैं।',
      },
    ],
  },
};

export default function FarmerGuideScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;
  const isTablet = width >= 600 && width < 860;

  const { language: farmContextLang, setLanguage: setFarmContextLang } = useFarm();
  const [selectedLang, setSelectedLang] = useState<GuideLanguage>(
    farmContextLang === 'mr' || farmContextLang === 'hi' ? farmContextLang : 'en'
  );

  const [activeFilter, setActiveFilter] = useState<ModuleFilter>('ALL');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // PDF Download States
  const [pdfStatus, setPdfStatus] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // ─── Voice engine cleanup when navigating away ─────────────────────────
  useEffect(() => {
    return () => {
      stopAllVoicePlayback();
    };
  }, []);

  // Sync with FarmContext if user toggles language here
  const handleLanguageChange = (newLang: GuideLanguage) => {
    stopAllVoicePlayback();
    setPlayingAudioId(null);
    setSelectedLang(newLang);
    if (setFarmContextLang) {
      setFarmContextLang(newLang);
    }
  };

  const currentContent = useMemo(() => GUIDE_CONTENT[selectedLang], [selectedLang]);

  // ─── Universal speak bridge ────────────────────────────────────────────
  // Tapping again on the same playing button stops audio; otherwise starts.
  const speakText = (text: string, id: string) => {
    if (playingAudioId === id) {
      // Already playing this section → stop it
      stopAllVoicePlayback();
      setPlayingAudioId(null);
      return;
    }
    speakUniversalText(
      text,
      selectedLang,
      () => setPlayingAudioId(id),   // onStart
      () => setPlayingAudioId(null)  // onFinish
    );
  };

  // 7. PDF User Manual Generator Handler
  const handleDownloadPdf = async (mode: 'en' | 'mr' | 'hi' | 'all') => {
    setIsGeneratingPdf(true);
    setPdfStatus(`Preparing PDF (${mode.toUpperCase()})...`);
    try {
      await downloadUserManualPdf(mode, GUIDE_CONTENT as unknown as GuideLanguageMap, (status) => {
        setPdfStatus(status);
      });
      setTimeout(() => {
        setPdfStatus(null);
        setIsGeneratingPdf(false);
      }, 2500);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setPdfStatus('Failed to generate PDF. Please try again.');
      setTimeout(() => {
        setPdfStatus(null);
        setIsGeneratingPdf(false);
      }, 3000);
    }
  };

  // Filter modules
  const filteredModules = useMemo(() => {
    if (activeFilter === 'ALL') return currentContent.modules;
    return currentContent.modules.filter((m) => m.filterKey === activeFilter);
  }, [activeFilter, currentContent.modules]);

  // Read entire guide audio script
  const fullGuideAudioScript = useMemo(() => {
    return `${currentContent.heroTitle}. ${currentContent.heroSubtitle}. ${currentContent.modules
      .map(
        (m, idx) =>
          `Module ${idx + 1}: ${m.title}. ${m.summary}. ` +
          m.steps.map((s) => `Step ${s.number}: ${s.title}. ${s.instruction}`).join(' ')
      )
      .join(' ')}`;
  }, [currentContent]);

  return (
    <UnifiedPageShell
      activeRoute="/guide"
      title="Farmer's User Manual & Guide"
      subtitle="Step-by-step Precision Agriculture Training · EN • मराठी • हिंदी"
      statusPillText="Interactive Guide"
      onBack={() => safeGoBack(HOME_ROUTE)}
      scrollable={true}
    >
      <View style={styles.container}>
        {/* ════════ HERO CARD (Deep Forest #0F291E) ════════ */}
        <View style={styles.heroCard}>
          <View style={styles.heroBadgeRow}>
            <View style={styles.heroEyebrowBadge}>
              <Feather name="book-open" size={13} color="#86EFAC" />
              <Text style={styles.heroEyebrowText}>{currentContent.heroBadge}</Text>
            </View>

            {/* Language Switcher Bar */}
            <View style={styles.langSwitchBar}>
              {(['en', 'mr', 'hi'] as GuideLanguage[]).map((langKey) => {
                const label = langKey === 'en' ? 'English' : langKey === 'mr' ? 'मराठी (Marathi)' : 'हिंदी (Hindi)';
                const isActive = selectedLang === langKey;
                return (
                  <Pressable
                    key={langKey}
                    onPress={() => handleLanguageChange(langKey)}
                    style={[styles.langBtn, isActive && styles.langBtnActive]}
                    accessibilityRole="button"
                    accessibilityLabel={`Switch guide language to ${label}`}
                  >
                    <Text style={[styles.langBtnText, isActive && styles.langBtnTextActive]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Text style={styles.heroTitle}>{currentContent.heroTitle}</Text>
          <Text style={styles.heroSubtitle}>{currentContent.heroSubtitle}</Text>

          {/* Hero Action Row: Audio Read-Aloud & Hotline */}
          <View style={styles.heroActionRow}>
            <TouchableOpacity
              style={[styles.heroAudioButton, playingAudioId === 'full-hero' && styles.heroAudioButtonActive]}
              onPress={() => speakText(fullGuideAudioScript, 'full-hero')}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Listen to complete user manual aloud"
            >
              <Feather
                name={playingAudioId === 'full-hero' ? 'square' : 'volume-2'}
                size={16}
                color={playingAudioId === 'full-hero' ? '#DC2626' : '#0F291E'}
              />
              <Text
                style={[
                  styles.heroAudioButtonText,
                  playingAudioId === 'full-hero' && styles.heroAudioButtonTextActive,
                ]}
              >
                {playingAudioId === 'full-hero'
                  ? `Stop Audio (Playing in ${selectedLang === 'mr' ? 'मराठी' : selectedLang === 'hi' ? 'हिंदी' : 'EN'}...)`
                  : currentContent.listenAllBtn}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.heroSecondaryAction}
              onPress={() => router.push(AI_ASSISTANT_ROUTE)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Ask Kisan Assistant"
            >
              <Feather name="message-circle" size={15} color="#86EFAC" />
              <Text style={styles.heroSecondaryActionText}>Ask Kisan AI Assistant</Text>
            </TouchableOpacity>
          </View>

          {/* Quick PDF Download Strip inside Hero */}
          <View style={styles.heroPdfRow}>
            <View style={styles.heroPdfLabelRow}>
              <Feather name="download" size={13} color="#86EFAC" />
              <Text style={styles.heroPdfLabel}>DOWNLOAD OFFLINE PDF MANUAL:</Text>
            </View>
            <View style={styles.heroPdfButtonsGroup}>
              <TouchableOpacity
                style={styles.heroPdfPill}
                onPress={() => handleDownloadPdf('en')}
                activeOpacity={0.85}
                disabled={isGeneratingPdf}
                accessibilityRole="button"
                accessibilityLabel="Download English PDF"
              >
                <Text style={styles.heroPdfPillText}>English PDF</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.heroPdfPill}
                onPress={() => handleDownloadPdf('mr')}
                activeOpacity={0.85}
                disabled={isGeneratingPdf}
                accessibilityRole="button"
                accessibilityLabel="मराठी PDF डाऊनलोड करा"
              >
                <Text style={styles.heroPdfPillText}>मराठी PDF</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.heroPdfPill}
                onPress={() => handleDownloadPdf('hi')}
                activeOpacity={0.85}
                disabled={isGeneratingPdf}
                accessibilityRole="button"
                accessibilityLabel="हिंदी PDF डाउनलोड करें"
              >
                <Text style={styles.heroPdfPillText}>हिंदी PDF</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.heroPdfPill, styles.heroPdfPillHighlight]}
                onPress={() => handleDownloadPdf('all')}
                activeOpacity={0.85}
                disabled={isGeneratingPdf}
                accessibilityRole="button"
                accessibilityLabel="Download Trilingual PDF"
              >
                <Text style={styles.heroPdfPillHighlightText}>Trilingual (3-in-1) PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ════════ QUICK MODULE FILTER TABS (Jump to Any Topic) ════════ */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>
            {selectedLang === 'mr'
              ? 'कृषी साधन किंवा विभाग निवडा:'
              : selectedLang === 'hi'
              ? 'कृषि टूल या मॉड्यूल चुनें:'
              : 'SELECT A PRECISION FARMING TOOL:'}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterTabsScroll}
          >
            {[
              {
                key: 'ALL' as const,
                icon: 'layers' as const,
                label: currentContent.allModulesTab,
              },
              {
                key: 'DASHBOARD' as const,
                icon: 'compass' as const,
                label:
                  selectedLang === 'mr'
                    ? '१. खाते व डॅशबोर्ड'
                    : selectedLang === 'hi'
                    ? '१. खाता व डैशबोर्ड'
                    : '1. Account & Dashboard',
              },
              {
                key: 'CROP_DOCTOR' as const,
                icon: 'camera' as const,
                label:
                  selectedLang === 'mr'
                    ? '२. क्रॉप डॉक्टर स्कॅनर'
                    : selectedLang === 'hi'
                    ? '२. क्रॉप डॉक्टर स्कैनर'
                    : '2. Crop Doctor Scanner',
              },
              {
                key: 'IRRIGATION' as const,
                icon: 'droplet' as const,
                label:
                  selectedLang === 'mr'
                    ? '३. हवामान व ठिबक'
                    : selectedLang === 'hi'
                    ? '३. मौसम व ड्रिप'
                    : '3. Weather & Drip',
              },
              {
                key: 'AGRI_SHOP' as const,
                icon: 'shopping-bag' as const,
                label:
                  selectedLang === 'mr'
                    ? '४. कृषी-शॉप व ऑर्डर्स'
                    : selectedLang === 'hi'
                    ? '४. एग्री-शॉप व ऑर्डर्स'
                    : '4. Agri-Shop & Orders',
              },
              {
                key: 'MARKETS' as const,
                icon: 'trending-up' as const,
                label:
                  selectedLang === 'mr'
                    ? '५. बाजारभाव व सल्लागार'
                    : selectedLang === 'hi'
                    ? '५. मंडी भाव व सलाहकार'
                    : '5. Mandi & Crop Advisor',
              },
              {
                key: 'SCHEMES' as const,
                icon: 'award' as const,
                label:
                  selectedLang === 'mr'
                    ? '६. शासकीय योजना (अनुदान)'
                    : selectedLang === 'hi'
                    ? '६. सरकारी योजनाएं (सब्सिडी)'
                    : '6. Govt. Schemes (PM-KISAN)',
              },
            ].map((tab) => {
              const isActive = activeFilter === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => setActiveFilter(tab.key)}
                  style={[styles.filterPill, isActive && styles.filterPillActive]}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter: ${tab.label}`}
                >
                  <Feather
                    name={tab.icon}
                    size={13}
                    color={isActive ? '#FFFFFF' : '#15803D'}
                  />
                  <Text
                    style={[
                      styles.filterPillText,
                      isActive && styles.filterPillTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ════════ STRUCTURED MANUAL MODULE CARDS ════════ */}
        <View style={styles.modulesContainer}>
          {filteredModules.map((mod) => {
            const moduleAudioScript = `${mod.moduleNumber}: ${mod.title}. ${mod.summary}. ${mod.steps
              .map((s) => `Step ${s.number}: ${s.title}. ${s.instruction}. ${currentContent.proTipLabel}: ${s.proTip}`)
              .join(' ')}`;

            return (
              <View key={mod.id} style={styles.moduleCard}>
                {/* Module Header */}
                <View style={styles.moduleHeader}>
                  <View style={styles.moduleHeaderLeft}>
                    <View style={styles.moduleIconBox}>
                      <Feather name={mod.iconName} size={22} color={mod.iconColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.moduleNumberBadge}>
                        <Text style={[styles.moduleNumberText, styles.tabularNums]}>
                          {mod.moduleNumber}
                        </Text>
                      </View>
                      <Text style={styles.moduleTitle}>{mod.title}</Text>
                      <Text style={styles.moduleSummary}>{mod.summary}</Text>
                    </View>
                  </View>

                  <View style={styles.moduleHeaderRight}>
                    <TouchableOpacity
                      style={[
                        styles.moduleAudioBtn,
                        playingAudioId === mod.id && styles.moduleAudioBtnActive,
                      ]}
                      onPress={() => speakText(moduleAudioScript, mod.id)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={`Listen to ${mod.title}`}
                    >
                      <Feather
                        name={playingAudioId === mod.id ? 'square' : 'volume-2'}
                        size={14}
                        color={playingAudioId === mod.id ? '#DC2626' : '#15803D'}
                      />
                      <Text
                        style={[
                          styles.moduleAudioBtnText,
                          playingAudioId === mod.id && styles.moduleAudioBtnTextActive,
                        ]}
                      >
                        {playingAudioId === mod.id
                          ? `Stop Audio (Playing in ${selectedLang === 'mr' ? 'मराठी...' : selectedLang === 'hi' ? 'हिंदी...' : 'EN...'})`
                          : currentContent.listenModuleBtn}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 4 Chronological Step Cards */}
                <View style={[styles.stepsGrid, isDesktop && styles.stepsGridDesk]}>
                  {mod.steps.map((step) => (
                    <View
                      key={step.number}
                      style={[
                        styles.stepCard,
                        isDesktop ? styles.stepCardDesk : isTablet ? styles.stepCardTablet : null,
                      ]}
                    >
                      <View style={styles.stepTopRow}>
                        <View style={styles.stepNumberBadge}>
                          <Text style={[styles.stepNumberText, styles.tabularNums]}>
                            {step.number}
                          </Text>
                        </View>
                        <Text style={styles.stepTitle}>{step.title}</Text>
                      </View>

                      <Text style={styles.stepInstruction}>{step.instruction}</Text>

                      {/* Farmer Pro-Tip Box */}
                      <View style={styles.proTipBox}>
                        <View style={styles.proTipHeader}>
                          <Feather name="check-circle" size={12} color="#15803D" />
                          <Text style={styles.proTipLabel}>{currentContent.proTipLabel}</Text>
                        </View>
                        <Text style={styles.proTipText}>{step.proTip}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Direct Action Link to the Module */}
                <View style={styles.moduleFooter}>
                  <TouchableOpacity
                    style={styles.moduleActionButton}
                    onPress={() => router.push(mod.route)}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={mod.actionButtonText}
                  >
                    <Text style={styles.moduleActionButtonText}>{mod.actionButtonText}</Text>
                    <Feather name="arrow-right" size={15} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* ════════ DEDICATED OFFLINE PDF MANUAL DOWNLOAD CARD ════════ */}
        <View style={styles.pdfDownloadCard}>
          <View style={styles.pdfDownloadHeader}>
            <View style={styles.pdfBadgeRow}>
              <View style={styles.pdfBadge}>
                <Feather name="file-text" size={13} color="#15803D" />
                <Text style={styles.pdfBadgeText}>OFFLINE FIELD MANUAL & TRAINING</Text>
              </View>
              {pdfStatus && (
                <View style={styles.pdfStatusPill}>
                  {isGeneratingPdf && (
                    <ActivityIndicator size="small" color="#15803D" style={{ marginRight: 6 }} />
                  )}
                  <Text style={styles.pdfStatusText}>{pdfStatus}</Text>
                </View>
              )}
            </View>

            <Text style={styles.pdfCardTitle}>
              {selectedLang === 'mr'
                ? 'शेतकरी प्रशिक्षण मॅन्युअल (ऑफलाईन PDF डाऊनलोड करा)'
                : selectedLang === 'hi'
                ? 'किसान प्रशिक्षण मैनुअल (ऑफलाइन PDF डाउनलोड करें)'
                : 'Download Step-by-Step PDF User Manual'}
            </Text>
            <Text style={styles.pdfCardSub}>
              {selectedLang === 'mr'
                ? 'इंटरनेट नसतानाही शेतात वापरण्यासाठी संपूर्ण ६ मॉड्यूल्स, औषध फवारणी प्रमाण आणि पायऱ्यांची रंगीत PDF डाऊनलोड करा.'
                : selectedLang === 'hi'
                ? 'बिना इंटरनेट के भी खेत में उपयोग के लिए सभी ६ मॉड्यूल, स्प्रे खुराक और चरणों की रंगीन PDF डाउनलोड करें।'
                : 'Download the complete 6-module step-by-step farming guide with chemical dosages, irrigation timetables, and pro-tips for offline field reference.'}
            </Text>
          </View>

          <View style={[styles.pdfButtonsGrid, isDesktop && styles.pdfButtonsGridDesk]}>
            {/* English PDF Button */}
            <TouchableOpacity
              style={styles.pdfButton}
              onPress={() => handleDownloadPdf('en')}
              disabled={isGeneratingPdf}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Download PDF Manual in English"
            >
              <View style={styles.pdfButtonIcon}>
                <Feather name="download" size={18} color="#15803D" />
              </View>
              <View style={styles.pdfButtonContent}>
                <Text style={styles.pdfButtonTitle}>Download PDF Manual (English)</Text>
                <Text style={styles.pdfButtonDesc}>A4 Printable • 6 Modules • All Step Cards & FAQs</Text>
              </View>
            </TouchableOpacity>

            {/* Marathi PDF Button */}
            <TouchableOpacity
              style={styles.pdfButton}
              onPress={() => handleDownloadPdf('mr')}
              disabled={isGeneratingPdf}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="मराठी PDF मॅन्युअल डाउनलोड करा"
            >
              <View style={styles.pdfButtonIcon}>
                <Feather name="download" size={18} color="#15803D" />
              </View>
              <View style={styles.pdfButtonContent}>
                <Text style={styles.pdfButtonTitle}>मराठी PDF मॅन्युअल डाउनलोड करा (Marathi PDF)</Text>
                <Text style={styles.pdfButtonDesc}>अचूक देवनागरी • ६ विभाग • कृषी विद्यापीठ शिफारशी</Text>
              </View>
            </TouchableOpacity>

            {/* Hindi PDF Button */}
            <TouchableOpacity
              style={styles.pdfButton}
              onPress={() => handleDownloadPdf('hi')}
              disabled={isGeneratingPdf}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="हिंदी PDF मैनुअल डाउनलोड करें"
            >
              <View style={styles.pdfButtonIcon}>
                <Feather name="download" size={18} color="#15803D" />
              </View>
              <View style={styles.pdfButtonContent}>
                <Text style={styles.pdfButtonTitle}>हिंदी PDF मैनुअल डाउनलोड करें (Hindi PDF)</Text>
                <Text style={styles.pdfButtonDesc}>स्पष्ट देवनागरी • ६ मॉड्यूल • स्प्रे मात्रा व चरण</Text>
              </View>
            </TouchableOpacity>

            {/* Trilingual PDF Button */}
            <TouchableOpacity
              style={[styles.pdfButton, styles.pdfButtonHighlight]}
              onPress={() => handleDownloadPdf('all')}
              disabled={isGeneratingPdf}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Download Complete Trilingual PDF"
            >
              <View style={[styles.pdfButtonIcon, styles.pdfButtonIconHighlight]}>
                <Feather name="download" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.pdfButtonContent}>
                <Text style={[styles.pdfButtonTitle, styles.pdfButtonTitleHighlight]}>
                  Download Complete Trilingual PDF (EN + मराठी + हिंदी)
                </Text>
                <Text style={[styles.pdfButtonDesc, styles.pdfButtonDescHighlight]}>
                  All 3 Languages Combined • Comprehensive Field Companion
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ════════ TROUBLESHOOTING & FARMER FAQ ACCORDION ════════ */}
        <View style={styles.faqSectionCard}>
          <View style={styles.faqSectionHeader}>
            <View style={styles.faqBadgeRow}>
              <Feather name="help-circle" size={16} color="#15803D" />
              <Text style={styles.faqBadgeText}>TROUBLESHOOTING & HELP</Text>
            </View>
            <Text style={styles.faqSectionTitle}>{currentContent.faqSectionTitle}</Text>
            <Text style={styles.faqSectionSubtitle}>{currentContent.faqSectionSubtitle}</Text>
          </View>

          <View style={styles.faqList}>
            {currentContent.faqs.map((faq, index) => {
              const isExpanded = expandedFaq === index;
              return (
                <View key={index} style={styles.faqCard}>
                  <Pressable
                    onPress={() => setExpandedFaq(isExpanded ? null : index)}
                    style={styles.faqQuestionRow}
                    accessibilityRole="button"
                    accessibilityLabel={faq.question}
                  >
                    <View style={styles.faqIconPill}>
                      <Text style={[styles.faqIndexNumber, styles.tabularNums]}>
                        Q{index + 1}
                      </Text>
                    </View>
                    <Text style={styles.faqQuestionText}>{faq.question}</Text>
                    <Feather
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color="#15803D"
                    />
                  </Pressable>

                  {isExpanded ? (
                    <View style={styles.faqAnswerBox}>
                      <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>

        {/* ════════ KISAN HELPDESK & TOLL-FREE CARD ════════ */}
        <View style={styles.helpdeskCard}>
          <View style={styles.helpdeskLeft}>
            <View style={styles.helpdeskIconBox}>
              <MaterialCommunityIcons name="phone-classic" size={24} color="#15803D" />
            </View>
            <View style={{ flex: 1, minWidth: 260 }}>
              <Text style={styles.helpdeskTitle}>{currentContent.helpdeskTitle}</Text>
              <Text style={styles.helpdeskSub}>{currentContent.helpdeskSub}</Text>
              <View style={styles.callCentrePill}>
                <Feather name="phone-call" size={13} color="#15803D" />
                <Text style={styles.callCentrePillText}>{currentContent.callCentreBtn}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.helpdeskChatButton}
            onPress={() => router.push(AI_ASSISTANT_ROUTE)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Chat with Kisan AI Assistant"
          >
            <Feather name="message-square" size={15} color="#FFFFFF" />
            <Text style={styles.helpdeskChatButtonText}>{currentContent.chatAssistantBtn}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </UnifiedPageShell>
  );
}

/* ─── Stylesheet ──────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
    paddingBottom: 60,
  },
  tabularNums: {
    fontVariant: ['tabular-nums'],
  },

  /* ─── Hero Surface ─── */
  heroCard: {
    backgroundColor: BRAND_DARK,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1D3B2E',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  heroEyebrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(21, 128, 61, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.3)',
  },
  heroEyebrowText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#86EFAC',
    letterSpacing: 0.8,
  },
  langSwitchBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 3,
    gap: 4,
  },
  langBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  langBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  langBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D1FAE5',
  },
  langBtnTextActive: {
    color: BRAND_DARK,
    fontWeight: '800',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 32,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#A7F3D0',
    lineHeight: 22,
    marginBottom: 20,
    maxWidth: 820,
  },
  heroActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
  heroAudioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#86EFAC',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  heroAudioButtonActive: {
    backgroundColor: '#FEE2E2',
  },
  heroAudioButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: BRAND_DARK,
  },
  heroAudioButtonTextActive: {
    color: '#DC2626',
  },
  heroSecondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  heroSecondaryActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D1FAE5',
  },

  /* ─── Hero Quick PDF Strip ─── */
  heroPdfRow: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroPdfLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroPdfLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#86EFAC',
    letterSpacing: 0.8,
  },
  heroPdfButtonsGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  heroPdfPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  heroPdfPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroPdfPillHighlight: {
    backgroundColor: BRAND_EMERALD,
    borderColor: '#86EFAC',
  },
  heroPdfPillHighlightText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* ─── Filter Tabs Section ─── */
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#6B7A6C',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  filterTabsScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  filterPillActive: {
    backgroundColor: BRAND_EMERALD,
    borderColor: BRAND_EMERALD,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },

  /* ─── Modules Container ─── */
  modulesContainer: {
    gap: 24,
    marginBottom: 28,
  },
  moduleCard: {
    backgroundColor: CARD_BG,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
    padding: 22,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 2,
  },
  moduleHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F0',
    marginBottom: 20,
  },
  moduleHeaderLeft: {
    flex: 1,
    minWidth: 280,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  moduleIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: SAGE_TINT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  moduleNumberBadge: {
    alignSelf: 'flex-start',
    backgroundColor: SAGE_TINT,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  moduleNumberText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: BRAND_EMERALD,
  },
  moduleTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: BRAND_DARK,
    lineHeight: 24,
    marginBottom: 4,
  },
  moduleSummary: {
    fontSize: 13,
    color: TEXT_MUTED,
    lineHeight: 19,
  },
  moduleHeaderRight: {
    alignSelf: 'flex-start',
  },
  moduleAudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  moduleAudioBtnActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  moduleAudioBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: BRAND_EMERALD,
  },
  moduleAudioBtnTextActive: {
    color: '#DC2626',
  },

  /* ─── 4 Steps Grid ─── */
  stepsGrid: {
    gap: 14,
    marginBottom: 18,
  },
  stepsGridDesk: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  stepCard: {
    backgroundColor: '#F8FAF8',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
    padding: 16,
  },
  stepCardDesk: {
    width: '48.8%',
  },
  stepCardTablet: {
    width: '48.5%',
  },
  stepTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  stepNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '800',
    color: BRAND_EMERALD,
  },
  stepTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: BRAND_DARK,
    lineHeight: 20,
  },
  stepInstruction: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 18,
    marginBottom: 12,
  },
  proTipBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6ECE6',
    padding: 10,
  },
  proTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  proTipLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: BRAND_EMERALD,
  },
  proTipText: {
    fontSize: 11,
    color: '#4B5563',
    lineHeight: 16,
  },

  /* ─── Module Action Button ─── */
  moduleFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F0F4F0',
    paddingTop: 14,
  },
  moduleActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BRAND_EMERALD,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
  },
  moduleActionButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* ─── Dedicated Offline PDF Manual Card ─── */
  pdfDownloadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
    padding: 24,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
    elevation: 2,
  },
  pdfDownloadHeader: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F0',
  },
  pdfBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  pdfBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: SAGE_TINT,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  pdfBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: BRAND_EMERALD,
    letterSpacing: 0.8,
  },
  pdfStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  pdfStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  pdfCardTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: BRAND_DARK,
    lineHeight: 26,
    marginBottom: 6,
  },
  pdfCardSub: {
    fontSize: 13,
    color: TEXT_MUTED,
    lineHeight: 19,
  },
  pdfButtonsGrid: {
    gap: 12,
  },
  pdfButtonsGridDesk: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pdfButton: {
    flex: 1,
    minWidth: 260,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#F8FAF8',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
    padding: 16,
  },
  pdfButtonHighlight: {
    backgroundColor: '#0F291E',
    borderColor: '#1D3B2E',
  },
  pdfButtonIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  pdfButtonIconHighlight: {
    backgroundColor: BRAND_EMERALD,
    borderColor: '#86EFAC',
  },
  pdfButtonContent: {
    flex: 1,
  },
  pdfButtonTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: BRAND_DARK,
    marginBottom: 2,
  },
  pdfButtonTitleHighlight: {
    color: '#FFFFFF',
  },
  pdfButtonDesc: {
    fontSize: 11,
    color: '#4B5563',
    lineHeight: 15,
  },
  pdfButtonDescHighlight: {
    color: '#86EFAC',
  },

  /* ─── FAQ Section Card ─── */
  faqSectionCard: {
    backgroundColor: CARD_BG,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
    padding: 22,
    marginBottom: 24,
  },
  faqSectionHeader: {
    marginBottom: 18,
  },
  faqBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  faqBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: BRAND_EMERALD,
  },
  faqSectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: BRAND_DARK,
    marginBottom: 4,
  },
  faqSectionSubtitle: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  faqList: {
    gap: 10,
  },
  faqCard: {
    backgroundColor: '#F8FAF8',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
    overflow: 'hidden',
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  faqIconPill: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: SAGE_TINT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  faqIndexNumber: {
    fontSize: 11,
    fontWeight: '800',
    color: BRAND_EMERALD,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: BRAND_DARK,
  },
  faqAnswerBox: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 2,
    borderTopWidth: 1,
    borderTopColor: '#EEF2EE',
  },
  faqAnswerText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 20,
  },

  /* ─── Helpdesk Card ─── */
  helpdeskCard: {
    backgroundColor: SAGE_TINT,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  helpdeskLeft: {
    flex: 1,
    minWidth: 280,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  helpdeskIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  helpdeskTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: BRAND_DARK,
    marginBottom: 2,
  },
  helpdeskSub: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 18,
    marginBottom: 8,
  },
  callCentrePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  callCentrePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: BRAND_EMERALD,
  },
  helpdeskChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BRAND_EMERALD,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
  helpdeskChatButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export { downloadUserManualPdf };
