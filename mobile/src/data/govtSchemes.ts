export type SchemeTimeline =
  | 'Latest Updates & New Initiatives'
  | 'Ongoing / Previous Flagship Schemes';

export type SchemeTimelineBadge =
  | 'Latest (2025–26 Update)'
  | 'Established Flagship Scheme';

export type SchemeCategory =
  | 'Income Support'
  | 'Crop Insurance'
  | 'Irrigation & Solar'
  | 'Equipment & Drones'
  | 'Credit & Loans'
  | 'Soil & Organic';

export type LandSize =
  | 'small-marginal'
  | 'medium-large'
  | 'landless-tenant';

export type FarmerNeed =
  | 'cash-support'
  | 'equipment-solar'
  | 'crop-loss'
  | 'low-interest-loan';

export interface GovtScheme {
  id: string;
  title: string;
  shortName: string;
  ministry: string;
  launchYear: number;
  timeline: SchemeTimeline;
  timelineBadge: SchemeTimelineBadge;
  category: SchemeCategory;
  maxBenefit: string;
  summary: string;
  detailedDescription: string;
  benefits: string[];
  eligibility: string[];
  requiredDocuments: string[];
  applicationSteps: string[];
  officialPortalUrl: string;
  helplineNumber: string;
  eligibleLandSizes: LandSize[];
  farmerNeeds: FarmerNeed[];
  relatedToAgriShop: boolean;
}

export const NATIONAL_SCHEMES_PORTAL =
  'https://www.myscheme.gov.in/';

export const SCHEME_CATEGORIES: SchemeCategory[] = [
  'Income Support',
  'Crop Insurance',
  'Irrigation & Solar',
  'Equipment & Drones',
  'Credit & Loans',
  'Soil & Organic',
];

export const SCHEME_CATEGORY_META: Record<
  SchemeCategory,
  { emoji: string; tint: string; text: string; shortLabel: string }
> = {
  'Income Support': {
    emoji: '',
    tint: '#FFF5DC',
    text: '#7A5B12',
    shortLabel: 'Income Support',
  },
  'Crop Insurance': {
    emoji: '',
    tint: '#EAF3FB',
    text: '#1E5B8A',
    shortLabel: 'Crop Insurance',
  },
  'Irrigation & Solar': {
    emoji: '',
    tint: '#FFF3D9',
    text: '#8A5B10',
    shortLabel: 'Irrigation & Solar',
  },
  'Equipment & Drones': {
    emoji: '',
    tint: '#F0EDF9',
    text: '#5B4B8A',
    shortLabel: 'Equipment & Drones',
  },
  'Credit & Loans': {
    emoji: '',
    tint: '#E8F5EF',
    text: '#1E7A55',
    shortLabel: 'Credit & Loans',
  },
  'Soil & Organic': {
    emoji: '',
    tint: '#EAF6E7',
    text: '#2D7A31',
    shortLabel: 'Soil & Organic',
  },
};

export const LAND_SIZE_OPTIONS: {
  id: LandSize;
  label: string;
  shortLabel: string;
}[] = [
  {
    id: 'small-marginal',
    label: 'Small/Marginal (< 2 Ha)',
    shortLabel: 'Small / Marginal',
  },
  {
    id: 'medium-large',
    label: 'Medium/Large (> 2 Ha)',
    shortLabel: 'Medium / Large',
  },
  {
    id: 'landless-tenant',
    label: 'Landless/Tenant',
    shortLabel: 'Landless / Tenant',
  },
];

export const FARMER_NEED_OPTIONS: {
  id: FarmerNeed;
  label: string;
  emoji: string;
}[] = [
  { id: 'cash-support', label: 'Cash Support', emoji: '' },
  {
    id: 'equipment-solar',
    label: 'Buy Equipment/Solar',
    emoji: '',
  },
  {
    id: 'crop-loss',
    label: 'Crop Loss Protection',
    emoji: '',
  },
  {
    id: 'low-interest-loan',
    label: 'Low-Interest Loan',
    emoji: '',
  },
];

export const SCHEME_TIMELINE_TABS = [
  {
    id: 'all',
    label: 'All Schemes',
    timeline: null,
  },
  {
    id: 'latest',
    label: 'Latest & Updated (2025–26)',
    timeline: 'Latest Updates & New Initiatives' as SchemeTimeline,
  },
  {
    id: 'flagship',
    label: 'Established Flagship Schemes',
    timeline: 'Ongoing / Previous Flagship Schemes' as SchemeTimeline,
  },
] as const;

export type SchemeTimelineTab =
  (typeof SCHEME_TIMELINE_TABS)[number]['id'];

export const GOVT_SCHEMES: GovtScheme[] = [
  {
    id: 'pm-kisan',
    title: 'PM Kisan Samman Nidhi (PM-KISAN)',
    shortName: 'PM-KISAN',

    ministry:
      'Ministry of Agriculture & Farmers Welfare, Govt. of India',
    launchYear: 2019,
    timeline: 'Latest Updates & New Initiatives',
    timelineBadge: 'Latest (2025–26 Update)',
    category: 'Income Support',
    maxBenefit: '₹6,000 / year in 3 installments',
    summary:
      'PM-KISAN gives eligible landholding farmer families ₹6,000 every year through direct bank transfer. The scheme has been extended through 2026–2031, with money released in three equal instalments.',
    detailedDescription:
      'PM-KISAN is a central-sector income support scheme that helps farmers buy seeds, fertilisers and other inputs at the start of each crop cycle. Aadhaar-linked bank verification and Direct Benefit Transfer reduce leakage and delays. The Union Cabinet has approved continuation of the scheme from 2026–27 to 2030–31 with an outlay of ₹3.15 lakh crore.',
    benefits: [
      '₹6,000 per eligible farmer family every year, paid in three ₹2,000 instalments.',
      'Direct Benefit Transfer into the Aadhaar-linked bank account, with no middlemen.',
      'Useful for seeds, fertilisers, irrigation and other crop-cycle expenses.',
      'Scheme continuity approved through the 2026–27 to 2030–31 period.',
    ],
    eligibility: [
      'Landholding farmer families with cultivable land recorded in their name.',
      'Aadhaar-linked bank account and completed PM-KISAN e-KYC are mandatory.',
      'Institutional landholders, government employees, income-tax payers and specified high-income categories are excluded.',
      'Tenant farmers and landless labourers are generally not eligible unless the state records them as landholders.',
      'The land record and Aadhaar details must match the state beneficiary database.',
    ],
    requiredDocuments: [
      'Aadhaar Card (linked to mobile number)',
      '7/12 Extract / Land Ownership Record (RoR)',
      'Bank Passbook with IFSC code',
      'Passport-size Photograph',
      'Aadhaar-linked mobile number for e-KYC OTP',
    ],
    applicationSteps: [
      'Visit the official PM-KISAN portal and open the Farmers Corner.',
      'Choose New Farmer Registration and select your state.',
      'Enter Aadhaar number, mobile number and the OTP received on the Aadhaar-linked mobile.',
      'Complete e-KYC and upload or verify your land record details.',
      'Enter the bank account number, IFSC code and personal details.',
      'Submit the self-declaration and download the registration acknowledgement.',
      'Track beneficiary status on the portal or complete registration at a Common Service Centre (CSC).',
    ],
    officialPortalUrl: 'https://pmkisan.gov.in/',
    helplineNumber: '155261 / 011-24300606',
    eligibleLandSizes: ['small-marginal', 'medium-large'],
    farmerNeeds: ['cash-support'],
    relatedToAgriShop: true,
  },
  {
    id: 'digital-agriculture-mission',
    title:
      'Digital Agriculture Mission & AgriStack (Farmer Registry 2025–26)',
    shortName: 'AgriStack / Farmer ID',
    ministry:
      'Ministry of Agriculture & Farmers Welfare, Govt. of India',
    launchYear: 2024,
    timeline: 'Latest Updates & New Initiatives',
    timelineBadge: 'Latest (2025–26 Update)',
    category: 'Credit & Loans',
    maxBenefit:
      'Free digital Farmer ID (Kisan Pehchaan Patra) for faster paperless approvals',
    summary:
      'AgriStack creates a unique digital Farmer ID by linking Aadhaar, land records and crop details. The Farmer Registry is being rolled out across states in 2025–26 to make subsidy, insurance and loan approvals faster and paperless.',
    detailedDescription:
      'The Digital Agriculture Mission is building farmer-centric digital public infrastructure for Indian agriculture. Its Farmer Registry gives each farmer a digitally verifiable identity that can be shared with consent for DBT schemes, crop insurance, Kisan Credit Card applications and MSP procurement. Because land and crop records are verified digitally, applications can move faster with fewer repeated document checks.',
    benefits: [
      'Unique Farmer ID (Kisan Pehchaan Patra) linked to Aadhaar and digitised land records.',
      'Consent-based sharing reduces repeated paperwork for loans, insurance and subsidies.',
      'Faster verification for PM-KISAN, PMFBY, KCC and other farmer programmes.',
      'Digital Crop Survey supports crop-loss assessment and MSP procurement.',
      'No fee for creating the Farmer ID; enrolment is handled by the state government.',
    ],
    eligibility: [
      'All farmers with Aadhaar and land records in a participating state or Union Territory.',
      'Tenant farmers and sharecroppers can be enrolled where the state land record system captures them.',
      'Farmer consent is required for creating and sharing the digital identity.',
      'Enrolment is currently state-wise; availability depends on the state Farmer Registry rollout.',
    ],
    requiredDocuments: [
      'Aadhaar Card linked to a mobile number',
      'Land Ownership Record / digitised 7/12 or Khatauni',
      'Mobile number for OTP and consent verification',
      'Bank account details for linked scheme delivery',
      'Tenancy or cultivation proof, where applicable',
    ],
    applicationSteps: [
      'Open the AgriStack or your State Farmer Registry portal through the official agriculture ministry website.',
      'Select your state and choose the farmer enrolment option.',
      'Verify your identity with Aadhaar e-KYC and an OTP.',
      'Confirm the land parcel details shown from state revenue records.',
      'Review your crop and personal details and give consent for data sharing.',
      'Submit the enrolment and download or save your Farmer ID.',
      'Visit the nearest CSC or agriculture office if your land record is not visible online.',
    ],
    officialPortalUrl: 'https://agriwelfare.gov.in/',
    helplineNumber: '1800-180-2117',
    eligibleLandSizes: [
      'small-marginal',
      'medium-large',
      'landless-tenant',
    ],
    farmerNeeds: ['cash-support', 'low-interest-loan'],
    relatedToAgriShop: false,
  },
  {
    id: 'namo-drone-didi',
    title:
      'Namo Drone Didi / Agricultural Drone Subsidy Scheme',
    shortName: 'Namo Drone Didi',
    ministry:
      'Ministry of Agriculture & Farmers Welfare, Govt. of India',
    launchYear: 2023,
    timeline: 'Latest Updates & New Initiatives',
    timelineBadge: 'Latest (2025–26 Update)',
    category: 'Equipment & Drones',
    maxBenefit:
      'Up to 80% subsidy, capped at ₹8 Lakh per drone package',
    summary:
      'Namo Drone Didi provides agricultural drones to selected women Self Help Groups for spraying liquid fertilisers, nano-urea and pesticides on a rental basis. The scheme offers up to 80% central financial assistance, capped at ₹8 lakh per drone package.',
    detailedDescription:
      'The scheme is implemented with DAY-NRLM and lead fertiliser companies to turn women SHGs and Cluster Level Federations into local drone service providers. A woman member receives DGCA-compliant remote pilot training, and the SHG can earn income by renting the drone to nearby farmers. The remaining 20% of the drone cost can be financed through Agriculture Infrastructure Fund loans with interest subvention.',
    benefits: [
      'Up to 80% central financial assistance on the drone package, capped at ₹8 lakh.',
      '3% interest subvention on eligible Agriculture Infrastructure Fund loans up to 7 years.',
      'DGCA-approved drone pilot and assistant training for SHG members.',
      'Rental income for women SHGs and affordable spraying services for farmers.',
      'Efficient application of nano-fertilisers and pesticides with lower water use.',
    ],
    eligibility: [
      'Women Self Help Groups (SHGs) or Cluster Level Federations promoted under DAY-NRLM.',
      'SHGs must be selected by the state or district-level committee for the drone cluster.',
      'At least one woman member must complete the required drone pilot training.',
      'Drones must be used for agricultural spraying and rental services, not personal use.',
      'Individual farmers outside the women SHG structure are not direct beneficiaries.',
    ],
    requiredDocuments: [
      'SHG / CLF registration certificate',
      'Resolution authorising the SHG to purchase and operate a drone',
      'Aadhaar Card of the drone pilot and SHG representative',
      'Bank Passbook with IFSC code of the SHG',
      'Drone package quotation from a DGCA-approved manufacturer',
      'Remote Pilot Certificate or training enrolment proof',
    ],
    applicationSteps: [
      'Confirm that your women SHG or CLF is registered under DAY-NRLM.',
      'Contact the District Rural Development Agency or State Agriculture Department to check cluster selection.',
      'Submit the SHG resolution and beneficiary details through the state nodal agency.',
      'Complete the drone pilot training at a DGCA-approved Remote Pilot Training Organisation.',
      'Obtain approval for the drone package and central financial assistance.',
      'Purchase the approved drone package from the selected vendor.',
      'Submit the invoice and bank details for subsidy release and start rental services.',
    ],
    officialPortalUrl: 'https://agrimachinery.nic.in/',
    helplineNumber: '1800-180-1551 (Kisan Call Centre)',
    eligibleLandSizes: [
      'small-marginal',
      'medium-large',
      'landless-tenant',
    ],
    farmerNeeds: ['cash-support', 'equipment-solar'],
    relatedToAgriShop: true,
  },
  {
    id: 'pm-kusum',
    title:
      'PM-KUSUM (Solar Pump & Grid Connected Solar Scheme)',
    shortName: 'PM-KUSUM',
    ministry:
      'Ministry of New and Renewable Energy, Govt. of India',
    launchYear: 2019,
    timeline: 'Ongoing / Previous Flagship Schemes',
    timelineBadge: 'Established Flagship Scheme',
    category: 'Irrigation & Solar',
    maxBenefit:
      'Up to 60% subsidy on standalone solar agricultural pumps',
    summary:
      'PM-KUSUM helps farmers replace diesel pumps with solar-powered irrigation and set up grid-connected solar plants on barren land. The scheme provides up to 60% subsidy on standalone solar pumps, with the remaining cost met through a bank loan and farmer contribution.',
    detailedDescription:
      'PM-KUSUM works through state-designated agencies and has three components: decentralised solar plants, standalone solar pumps, and solarisation of existing grid-connected pumps. The central government provides 30% of the benchmark cost, the state provides another 30%, and the farmer arranges the balance. Farmers can also earn additional income under the grid-connected component by selling surplus solar power to the local DISCOM.',
    benefits: [
      'Central and state subsidy together covering up to 60% of a standalone solar pump.',
      'Lower diesel bills and reliable daytime irrigation for crops.',
      'Support for grid-connected solar plants up to 2 MW on barren or fallow land.',
      'Five-year repair and maintenance support from empanelled vendors.',
      'Priority-sector bank finance available for the farmer contribution.',
    ],
    eligibility: [
      'Individual farmers, groups of farmers, FPOs, cooperatives, panchayats or water user associations.',
      'Applicant must have agricultural land and a valid electricity connection where required.',
      'State-specific eligibility, pump capacity limits and beneficiary selection rules apply.',
      'Grid-connected solar plants require DISCOM feasibility and land near the interconnection point.',
      'Landless farmers are generally not eligible unless a group or local body applies.',
    ],
    requiredDocuments: [
      'Aadhaar Card',
      '7/12 Extract / Land Ownership Record',
      'Bank Passbook with IFSC code',
      'Latest electricity bill or electricity connection details',
      'Water source and pump details',
      'Quotation from an empanelled solar pump vendor',
    ],
    applicationSteps: [
      'Open your state PM-KUSUM portal through the national PM-KUSUM website.',
      'Register as a farmer or group and select the relevant scheme component.',
      'Enter land, water source, pump and electricity connection details.',
      'Upload the land record, Aadhaar, bank and quotation documents.',
      'Wait for DISCOM feasibility clearance and state nodal agency approval.',
      'Install the solar pump or plant through an empanelled vendor.',
      'Complete joint inspection and receive the subsidy in your bank account.',
    ],
    officialPortalUrl: 'https://pmkusum.mnre.gov.in/',
    helplineNumber: '1800-180-3333',
    eligibleLandSizes: ['small-marginal', 'medium-large'],
    farmerNeeds: ['equipment-solar'],
    relatedToAgriShop: true,
  },
  {
    id: 'pmfby',
    title: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    shortName: 'PMFBY',
    ministry:
      'Ministry of Agriculture & Farmers Welfare, Govt. of India',
    launchYear: 2016,
    timeline: 'Ongoing / Previous Flagship Schemes',
    timelineBadge: 'Established Flagship Scheme',
    category: 'Crop Insurance',
    maxBenefit:
      'Crop insurance at a capped 1.5%–2% farmer premium',
    summary:
      'PMFBY protects farmers against drought, flood, pests, disease and unseasonal rain. Farmers pay only 1.5%–2% of the sum insured for food and oilseed crops, and claims are paid directly into the bank account after loss assessment.',
    detailedDescription:
      'PMFBY is a government-sponsored crop insurance scheme covering notified crops in notified areas from sowing to post-harvest losses. It combines yield-loss insurance with cover for localised calamities and prevents farmers from bearing the full cost of a failed crop. Enrolment is automatic for loanee farmers and optional for non-loanee farmers through banks, CSCs or the national crop insurance portal.',
    benefits: [
      'Farmer premium capped at 2% for Kharif food and oilseed crops and 1.5% for Rabi crops.',
      'Cover for drought, flood, inundation, pests, disease and unseasonal rainfall.',
      'Post-harvest and localised calamity cover, including hailstorm and landslide.',
      'Claims paid directly into the farmer bank account after crop-loss assessment.',
      'Loanee farmers are covered automatically; non-loanee farmers can enrol voluntarily.',
    ],
    eligibility: [
      'All farmers growing a notified crop in a notified area, including tenant farmers and sharecroppers with insurable interest.',
      'Loanee farmers availing crop loans from banks are covered automatically.',
      'Non-loanee farmers must enrol before the state crop-season cut-off date.',
      'Aadhaar, bank account and land or tenancy records must be available.',
      'Crops and areas not notified by the state for the season are not covered.',
    ],
    requiredDocuments: [
      'Aadhaar Card',
      'Land Ownership Record / tenancy agreement',
      'Bank Passbook with IFSC code',
      'Sowing certificate or self-declaration of crop area',
      'Crop loan account details, if enrolled through a bank',
      'Mobile number for claim and status alerts',
    ],
    applicationSteps: [
      'Check the state crop notification and enrolment cut-off date for your crop.',
      'Visit your bank, PACS, CSC or the national crop insurance portal.',
      'Submit the farmer application with crop, village and bank details.',
      'Pay the applicable farmer premium and collect the acknowledgement.',
      'Verify the insured crop area and policy details on the portal.',
      'Report crop loss within 72 hours through the portal or the Krishi Rakshak helpline.',
      'Track the claim and receive payment directly in your bank account.',
    ],
    officialPortalUrl: 'https://pmfby.gov.in/',
    helplineNumber: '14447 (Krishi Rakshak Helpline)',
    eligibleLandSizes: [
      'small-marginal',
      'medium-large',
      'landless-tenant',
    ],
    farmerNeeds: ['crop-loss'],
    relatedToAgriShop: false,
  },
  {
    id: 'pmksy',
    title:
      'Pradhan Mantri Krishi Sinchayee Yojana (PMKSY – Per Drop More Crop)',
    shortName: 'PMKSY',
    ministry:
      'Ministry of Agriculture & Farmers Welfare, Govt. of India',
    launchYear: 2015,
    timeline: 'Ongoing / Previous Flagship Schemes',
    timelineBadge: 'Established Flagship Scheme',
    category: 'Irrigation & Solar',
    maxBenefit:
      '45%–55% subsidy on drip and sprinkler micro-irrigation',
    summary:
      'PMKSY – Per Drop More Crop provides financial assistance to install drip and sprinkler irrigation systems. Small and marginal farmers get 55% subsidy, while other farmers get 45%, helping save water and improve yields.',
    detailedDescription:
      'The scheme focuses on water-use efficiency at farm level through micro-irrigation and supporting water-conservation activities. It is implemented by state agriculture and horticulture departments under the national PMKSY framework. Subsidy is limited to the prescribed unit cost and an overall ceiling of five hectares per beneficiary, with some states adding top-up support.',
    benefits: [
      '55% financial assistance for small and marginal farmers on micro-irrigation systems.',
      '45% assistance for other eligible farmers, subject to scheme norms.',
      'Support for drip and sprinkler systems, including fertigation components.',
      'Better water-use efficiency, lower irrigation costs and healthier crops.',
      'Additional state top-up subsidies are available in several states.',
    ],
    eligibility: [
      'Farmers with cultivable land and a reliable water source.',
      'Small and marginal farmers receive the higher 55% assistance rate.',
      'Subsidy is generally limited to micro-irrigation on up to five hectares per beneficiary.',
      'Tenant farmers may apply where the state permits with landowner consent.',
      'Land must not be under excluded or restricted categories notified by the state.',
    ],
    requiredDocuments: [
      'Aadhaar Card',
      '7/12 Extract / Land Ownership Record',
      'Bank Passbook with IFSC code',
      'Water source proof such as a well, borewell or canal connection',
      'Micro-irrigation design and quotation from an approved supplier',
      'Caste certificate, if claiming a special category benefit',
    ],
    applicationSteps: [
      'Apply through your state agriculture or horticulture department portal.',
      'Select the drip or sprinkler micro-irrigation component.',
      'Enter land, crop and water-source details and upload the documents.',
      'Complete the field survey and system design by the designated agency.',
      'Obtain administrative approval and the subsidy sanction letter.',
      'Install the approved system through an empanelled supplier.',
      'Complete joint inspection and receive the subsidy in your bank account.',
    ],
    officialPortalUrl: 'https://pmksy.gov.in/',
    helplineNumber: '1800-180-1551 (Kisan Call Centre)',
    eligibleLandSizes: ['small-marginal', 'medium-large'],
    farmerNeeds: ['equipment-solar'],
    relatedToAgriShop: false,
  },
  {
    id: 'smam',
    title:
      'Sub-Mission on Agricultural Mechanization (SMAM)',
    shortName: 'SMAM',
    ministry:
      'Ministry of Agriculture & Farmers Welfare, Govt. of India',
    launchYear: 2014,
    timeline: 'Ongoing / Previous Flagship Schemes',
    timelineBadge: 'Established Flagship Scheme',
    category: 'Equipment & Drones',
    maxBenefit:
      '40%–50% subsidy on tractors, tillers, rotavators & harvesters',
    summary:
      'SMAM provides subsidised farm machinery and equipment to individual farmers, groups and custom hiring centres. Assistance usually ranges from 40% to 50%, with higher support for small, marginal, SC/ST and women farmers.',
    detailedDescription:
      'The Sub-Mission on Agricultural Mechanization increases farm mechanisation and makes machinery accessible to farmers who cannot afford individual ownership. It supports tractors, power tillers, rotavators, harvesters, seed drills, sprayers and custom hiring centres. State agriculture departments implement the scheme through the agrimachinery portal, with priority for small and marginal farmers and regions with low farm power availability.',
    benefits: [
      'Financial assistance of 40%–50% on eligible agricultural machinery.',
      'Higher subsidy rates for SC/ST, small, marginal and women farmers.',
      'Support for custom hiring centres and farm machinery banks.',
      'Access to drones and modern spraying equipment through approved channels.',
      'Training, testing and demonstration of modern farm machinery.',
    ],
    eligibility: [
      'Individual farmers, FPOs, cooperatives, SHGs, entrepreneurs and custom hiring centres.',
      'Priority is given to small and marginal farmers, SC/ST farmers, women and North-Eastern states.',
      'Applicant must meet the state-specific landholding and machinery eligibility norms.',
      'One farmer may be limited to a specified number of machines or subsidy claims.',
      'Machinery must be purchased from an approved dealer or manufacturer.',
    ],
    requiredDocuments: [
      'Aadhaar Card',
      '7/12 Extract / Land Ownership Record',
      'Bank Passbook with IFSC code',
      'Caste certificate, if applicable',
      'Passport-size Photograph',
      'Machinery quotation or proforma invoice',
    ],
    applicationSteps: [
      'Register on the agrimachinery portal or your state agriculture department portal.',
      'Select the machinery category or custom hiring centre component.',
      'Enter personal, land and bank details and upload documents.',
      'Submit the application before the state window closes.',
      'Track the application and obtain the subsidy sanction.',
      'Purchase the approved machine from a registered dealer.',
      'Upload the invoice and complete verification to receive the subsidy.',
    ],
    officialPortalUrl: 'https://agrimachinery.nic.in/',
    helplineNumber: '1800-180-1551 (Kisan Call Centre)',
    eligibleLandSizes: [
      'small-marginal',
      'medium-large',
      'landless-tenant',
    ],
    farmerNeeds: ['equipment-solar'],
    relatedToAgriShop: true,
  },
  {
    id: 'kcc',
    title:
      'Kisan Credit Card (KCC) & Modified Interest Subvention Scheme',
    shortName: 'KCC / MISS',
    ministry:
      'Ministry of Agriculture & Farmers Welfare and RBI-regulated banks, Govt. of India',
    launchYear: 1998,
    timeline: 'Ongoing / Previous Flagship Schemes',
    timelineBadge: 'Established Flagship Scheme',
    category: 'Credit & Loans',
    maxBenefit:
      'Short-term crop loans up to ₹3 Lakh at an effective 4% p.a.',
    summary:
      'KCC gives farmers a reusable credit limit for crop production and allied activities. Short-term loans up to ₹3 lakh carry a 7% interest rate, and farmers who repay on time receive an additional 3% subvention, reducing the effective rate to 4% per annum.',
    detailedDescription:
      'The Kisan Credit Card scheme provides timely and affordable institutional credit for seeds, fertilisers, pesticides, labour and post-harvest expenses. The Modified Interest Subvention Scheme supports short-term crop and allied-activity loans up to ₹3 lakh, with an additional prompt-repayment incentive. Banks may sanction higher limits based on landholding, crop pattern and repayment history, while term loans follow separate norms.',
    benefits: [
      'Short-term crop and allied-activity loans up to ₹3 lakh at a concessional rate.',
      '2% interest subvention plus a 3% prompt-repayment incentive, making the effective rate 4% per annum.',
      'Reusable credit limit for seeds, fertilisers, labour, harvesting and post-harvest needs.',
      'Coverage for animal husbandry, dairy, fisheries and bee-keeping activities.',
      'Collateral-free limits are available within RBI and bank norms.',
    ],
    eligibility: [
      'Farmers who own or cultivate land as tenants, oral lessees or sharecroppers.',
      'Self Help Groups and Joint Liability Groups engaged in agriculture.',
      'Farmers involved in animal husbandry, dairy, fisheries and other allied activities.',
      'Applicant should be 18 years or older and have a satisfactory repayment record.',
      'The loan limit and collateral requirement are assessed by the lending bank.',
    ],
    requiredDocuments: [
      'Aadhaar Card',
      '7/12 Extract / Land Ownership or tenancy record',
      'Bank Passbook with IFSC code',
      'Passport-size Photographs',
      'Crop plan or proof of allied activity',
      'Address proof and mobile number',
    ],
    applicationSteps: [
      'Visit your bank branch, PACS or the bank KCC application portal.',
      'Fill the Kisan Credit Card application form.',
      'Submit Aadhaar, land or tenancy records and bank details.',
      'Complete KYC and discuss the crop or allied-activity credit requirement.',
      'The bank assesses the limit and issues the sanction letter.',
      'Receive the KCC card or digital credit facility.',
      'Repay on time to qualify for the 3% prompt-repayment incentive.',
    ],
    officialPortalUrl: 'https://www.myscheme.gov.in/schemes/kcc',
    helplineNumber: '1800-180-1551 (Kisan Call Centre)',
    eligibleLandSizes: [
      'small-marginal',
      'medium-large',
      'landless-tenant',
    ],
    farmerNeeds: ['cash-support', 'low-interest-loan'],
    relatedToAgriShop: false,
  },
  {
    id: 'soil-health-card',
    title:
      'Soil Health Card & PM-PRANAM (Organic/Bio-Fertilizer Push)',
    shortName: 'SHC + PM-PRANAM',
    ministry:
      'Ministry of Agriculture & Farmers Welfare, Govt. of India',
    launchYear: 2015,
    timeline: 'Ongoing / Previous Flagship Schemes',
    timelineBadge: 'Established Flagship Scheme',
    category: 'Soil & Organic',
    maxBenefit:
      'Free soil testing & incentives for balanced or organic fertiliser use',
    summary:
      'The Soil Health Card scheme gives farmers a free report on the nutrient status of their soil, with crop-wise fertiliser recommendations. PM-PRANAM complements it by encouraging states and farmers to reduce chemical fertiliser use and adopt organic or bio-fertilisers.',
    detailedDescription:
      'Soil Health Cards are issued after laboratory testing of soil samples for macro-nutrients, micro-nutrients and physical parameters. The report recommends the right quantity of fertilisers for the crop, which can reduce unnecessary spending and protect soil health. PM-PRANAM supports alternative fertiliser adoption and is implemented through state incentives and awareness programmes, so the exact farmer benefit depends on the state notification.',
    benefits: [
      'Free soil testing and a crop-wise nutrient advisory for the farmer.',
      'Recommendations for nitrogen, phosphorus, potash, sulphur and micronutrients.',
      'Lower fertiliser costs by avoiding over-application and imbalance.',
      'Support for organic, bio-fertiliser and alternative nutrient practices.',
      'Improved soil health, nutrient-use efficiency and long-term productivity.',
    ],
    eligibility: [
      'All farmers with agricultural land can request a Soil Health Card through the district agriculture office.',
      'Soil samples are collected by state agriculture department teams or designated labs.',
      'Farmers should provide accurate field, crop and irrigation information.',
      'PM-PRANAM benefits depend on the state implementation and may be delivered through state programmes.',
      'Institutional or non-agricultural land may not qualify for farmer-level testing.',
    ],
    requiredDocuments: [
      'Aadhaar Card',
      '7/12 Extract / Land Ownership Record',
      'Survey number or field identification details',
      'Mobile number for sample and report updates',
      'Previous Soil Health Card, if available',
      'Bank Passbook, if a state incentive requires DBT',
    ],
    applicationSteps: [
      'Contact your district agriculture office, Krishi Vigyan Kendra or soil testing laboratory.',
      'Register the soil sample request with the survey number and crop details.',
      'Collect the sample as instructed from the representative field area.',
      'Submit the sample at the designated soil testing laboratory.',
      'Receive the Soil Health Card with nutrient status and fertiliser recommendations.',
      'Follow the recommended dose and re-test as advised by the department.',
      'Check state PM-PRANAM or organic-farming notices for additional incentives.',
    ],
    officialPortalUrl: 'https://soilhealth.dac.gov.in/',
    helplineNumber: '011-23381757 / +91 93427 69256',
    eligibleLandSizes: [
      'small-marginal',
      'medium-large',
      'landless-tenant',
    ],
    farmerNeeds: ['cash-support'],
    relatedToAgriShop: true,
  },
  {
    id: 'mahadbt',
    title:
      'MahaDBT Shetkari / State Direct Benefit Transfer Portal',
    shortName: 'MahaDBT',
    ministry:
      'Government of Maharashtra, Department of Agriculture',
    launchYear: 2017,
    timeline: 'Ongoing / Previous Flagship Schemes',
    timelineBadge: 'Established Flagship Scheme',
    category: 'Income Support',
    maxBenefit:
      'Seed, polyhouse, orchard and farm pond subsidies through one state portal',
    summary:
      'MahaDBT is Maharashtra’s single-window portal for farmer subsidies and direct benefit transfer. Farmers can apply for seed, polyhouse, orchard, farm pond and other state agriculture schemes, then track the application and payment online.',
    detailedDescription:
      'MahaDBT brings multiple state agriculture and farmer-welfare schemes onto one digital application platform. Farmers create a profile with Aadhaar, bank and land details, choose an open scheme and upload the required documents. The portal provides application tracking and sends the approved benefit directly to the registered bank account, reducing visits to government offices.',
    benefits: [
      'One registration for multiple Maharashtra farmer subsidy schemes.',
      'Online application and status tracking for seed, polyhouse, orchard and farm pond support.',
      'Direct benefit transfer to the registered bank account after approval.',
      'Scheme-wise eligibility, documents and last dates available in one place.',
      'Reduced paperwork and fewer visits to the agriculture office.',
    ],
    eligibility: [
      'Farmers with land in Maharashtra and an Aadhaar-linked bank account.',
      'Applicant must be a resident of Maharashtra and meet the specific scheme’s eligibility.',
      'Landholding size, crop, irrigation source and category conditions vary by scheme.',
      'Aadhaar and bank account should be linked and active for DBT.',
      'Tenant farmers may be eligible only for schemes that specifically permit tenancy.',
    ],
    requiredDocuments: [
      'Aadhaar Card',
      'Bank Passbook with IFSC code',
      '7/12 Extract / Land Ownership Record',
      'Passport-size Photograph',
      'Caste certificate or income certificate, if applicable',
      'Scheme-specific quotation or project report',
    ],
    applicationSteps: [
      'Open the MahaDBT portal and complete New Applicant Registration.',
      'Login and complete your farmer profile with Aadhaar and bank details.',
      'Select the Agriculture or Farmer schemes section.',
      'Choose an open scheme and read its eligibility and document list.',
      'Upload the required documents and submit the application.',
      'Track the application with the application ID.',
      'Complete field verification and receive the approved benefit by DBT.',
    ],
    officialPortalUrl:
      'https://mahadbt.maharashtra.gov.in/Farmer/Login/Login',
    helplineNumber: '022-49150800',
    eligibleLandSizes: [
      'small-marginal',
      'medium-large',
      'landless-tenant',
    ],
    farmerNeeds: [
      'cash-support',
      'equipment-solar',
      'crop-loss',
    ],
    relatedToAgriShop: false,
  },
];

export function getGovtSchemeById(
  id: string | string[] | undefined
): GovtScheme | undefined {
  const schemeId = Array.isArray(id) ? id[0] : id;
  if (!schemeId) return undefined;

  return GOVT_SCHEMES.find((scheme) => scheme.id === schemeId);
}
