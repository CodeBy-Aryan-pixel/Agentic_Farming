// ─────────────────────────────────────────────────────────────────────────────
// FPO Direct-Selling Board — Mock Database
// Future Farming | AgenticFutureFarming
// ─────────────────────────────────────────────────────────────────────────────

export type QualityGrade = 'A' | 'B' | 'C';
export type DealStatus = 'active' | 'pending' | 'completed' | 'expired';

// ─── Verified FPO Organisations ─────────────────────────────────────────────

export interface FPOOrganisation {
  id: string;
  name: string;
  shortName: string;
  district: string;
  state: string;
  regNumber: string;        // Govt registration number
  rating: number;           // out of 5
  totalFarmers: number;
  yearEstablished: number;
  contactPerson: string;
  contactPhone: string;
  whatsappNumber: string;
  tags: string[];           // trust badges
  description: string;
  storageCapacityTons: number;
}

export const FPO_ORGANISATIONS: FPOOrganisation[] = [
  {
    id: 'fpo_kolhapur_kisan',
    name: 'Kolhapur Kisan Producer Organisation',
    shortName: 'KKPO',
    district: 'Kolhapur',
    state: 'Maharashtra',
    regNumber: 'MH-FPO-2019-KLP-0041',
    rating: 4.9,
    totalFarmers: 1842,
    yearEstablished: 2019,
    contactPerson: 'Suresh Patil (Secretary)',
    contactPhone: '+91-98221-45001',
    whatsappNumber: '919822145001',
    tags: ['Govt. Registered FPO', '4.9 Rating', 'Zero Commission', 'Free Pickup'],
    description: 'Maharashtra\'s largest certified wheat and sugarcane FPO, with cold storage and DBT-linked direct payments.',
    storageCapacityTons: 5000,
  },
  {
    id: 'fpo_pune_organic',
    name: 'Pune Organic Farmer Cooperative',
    shortName: 'POFC',
    district: 'Pune',
    state: 'Maharashtra',
    regNumber: 'MH-FPO-2020-PNE-0088',
    rating: 4.8,
    totalFarmers: 920,
    yearEstablished: 2020,
    contactPerson: 'Anita Deshmukh (CEO)',
    contactPhone: '+91-98765-32100',
    whatsappNumber: '919876532100',
    tags: ['Govt. Registered FPO', '4.8 Rating', 'Zero Commission', 'Organic Certified'],
    description: 'Specialises in certified organic vegetables and fruits. Export-grade quality checks. Direct tie-ups with organic retail chains.',
    storageCapacityTons: 2200,
  },
  {
    id: 'fpo_nashik_grape',
    name: 'Nashik Grape & Wine Growers Collective',
    shortName: 'NGWGC',
    district: 'Nashik',
    state: 'Maharashtra',
    regNumber: 'MH-FPO-2018-NSK-0022',
    rating: 4.7,
    totalFarmers: 2350,
    yearEstablished: 2018,
    contactPerson: 'Ramesh Jadhav (Chairman)',
    contactPhone: '+91-94201-78900',
    whatsappNumber: '919420178900',
    tags: ['Govt. Registered FPO', '4.7 Rating', 'Export Ready', 'GI Certified'],
    description: 'Official aggregation hub for Nashik table grapes and raisins. Linked to 18 international export buyers and 6 domestic wineries.',
    storageCapacityTons: 8000,
  },
  {
    id: 'fpo_amravati_soybean',
    name: 'Vidarbha Soybean & Pulses FPO',
    shortName: 'VSPF',
    district: 'Amravati',
    state: 'Maharashtra',
    regNumber: 'MH-FPO-2021-AMR-0063',
    rating: 4.6,
    totalFarmers: 3100,
    yearEstablished: 2021,
    contactPerson: 'Vikram Thakare (Director)',
    contactPhone: '+91-90285-61200',
    whatsappNumber: '919028561200',
    tags: ['Govt. Registered FPO', '4.6 Rating', 'MSP Guaranteed', 'Zero Middleman'],
    description: 'Vidarbha\'s largest aggregator for soybean, tur dal, and urad dal. Connected to NAFED, Cargill, and ITC e-Choupal procurement centres.',
    storageCapacityTons: 12000,
  },
  {
    id: 'fpo_aurangabad_cotton',
    name: 'Marathwada Cotton Growers Federation',
    shortName: 'MCGF',
    district: 'Aurangabad',
    state: 'Maharashtra',
    regNumber: 'MH-FPO-2017-AUR-0015',
    rating: 4.8,
    totalFarmers: 4800,
    yearEstablished: 2017,
    contactPerson: 'Dnyanoba Kale (President)',
    contactPhone: '+91-98600-22150',
    whatsappNumber: '919860022150',
    tags: ['Govt. Registered FPO', '4.8 Rating', 'CCI Empanelled', 'Award Winner'],
    description: 'Empanelled with Cotton Corporation of India. Ensures MSP for every bale. No ginning deductions. DBT payment within 48 hours.',
    storageCapacityTons: 20000,
  },
];

// ─── Active Buyer Demand Listings ────────────────────────────────────────────

export interface BuyerDemandListing {
  id: string;
  fpoId: string;
  cropName: string;
  cropVariety: string;
  cropEmoji: string;
  requiredQuantityQuintals: number;
  availableQuantityQuintals: number;   // how much is still open
  offeredPricePerQuintal: number;      // Rs.
  localMandiPrice: number;             // current mandi modal price
  profitMarginPercent: number;         // vs mandi
  qualityRequired: QualityGrade[];
  pickupLocation: string;
  pickupDistricts: string[];           // districts where free pickup is available
  lastDateToApply: string;             // ISO date string
  deliveryStartDate: string;
  deliveryEndDate: string;
  paymentTerms: string;
  urgencyTag?: 'Urgent' | 'High Demand' | 'Filling Fast' | 'New Listing';
  buyerType: 'FPO' | 'Cooperative' | 'Corporate' | 'Exporter' | 'Retail Chain';
  endBuyerName?: string;               // ultimate buyer if disclosed
  notes?: string;
}

export const BUYER_DEMAND_LISTINGS: BuyerDemandListing[] = [
  {
    id: 'demand_001',
    fpoId: 'fpo_kolhapur_kisan',
    cropName: 'Wheat',
    cropVariety: 'Lokwan Wheat — Grade A',
    cropEmoji: '',
    requiredQuantityQuintals: 2500,
    availableQuantityQuintals: 1080,
    offeredPricePerQuintal: 2650,
    localMandiPrice: 2300,
    profitMarginPercent: 15.2,
    qualityRequired: ['A', 'B'],
    pickupLocation: 'KKPO Cold Hub, MIDC Road, Kolhapur',
    pickupDistricts: ['Kolhapur', 'Sangli', 'Satara'],
    lastDateToApply: '2026-11-10',
    deliveryStartDate: '2026-11-15',
    deliveryEndDate: '2026-11-30',
    paymentTerms: 'DBT within 48 hrs of quality check',
    urgencyTag: 'Filling Fast',
    buyerType: 'Cooperative',
    endBuyerName: 'Nature\'s Basket Retail Chain',
    notes: 'Protein content ≥ 11%. Moisture ≤ 12%.',
  },
  {
    id: 'demand_002',
    fpoId: 'fpo_pune_organic',
    cropName: 'Tomato',
    cropVariety: 'Desi Roma Tomato — Organic Grade A',
    cropEmoji: '',
    requiredQuantityQuintals: 500,
    availableQuantityQuintals: 320,
    offeredPricePerQuintal: 3200,
    localMandiPrice: 2100,
    profitMarginPercent: 52.4,
    qualityRequired: ['A'],
    pickupLocation: 'POFC Aggregation Hub, Urse, Pune',
    pickupDistricts: ['Pune', 'Nashik', 'Ahmednagar'],
    lastDateToApply: '2026-11-05',
    deliveryStartDate: '2026-11-08',
    deliveryEndDate: '2026-11-20',
    paymentTerms: 'DBT within 24 hrs of delivery',
    urgencyTag: 'Urgent',
    buyerType: 'Exporter',
    endBuyerName: 'Organic India GmbH (Germany Export)',
    notes: 'Must hold NPOP organic certification. No pesticide residue allowed.',
  },
  {
    id: 'demand_003',
    fpoId: 'fpo_nashik_grape',
    cropName: 'Grapes',
    cropVariety: 'Thompson Seedless — Export Grade',
    cropEmoji: '',
    requiredQuantityQuintals: 8000,
    availableQuantityQuintals: 5200,
    offeredPricePerQuintal: 9500,
    localMandiPrice: 7200,
    profitMarginPercent: 31.9,
    qualityRequired: ['A'],
    pickupLocation: 'NGWGC Pack House, Dindori, Nashik',
    pickupDistricts: ['Nashik', 'Nandurbar', 'Dhule'],
    lastDateToApply: '2026-12-15',
    deliveryStartDate: '2027-01-10',
    deliveryEndDate: '2027-02-28',
    paymentTerms: 'Advance 30% at listing, 70% DBT within 72 hrs of shipment',
    urgencyTag: 'New Listing',
    buyerType: 'Exporter',
    endBuyerName: 'APEDA-Registered UAE Export Buyer',
    notes: 'Berry size ≥ 17mm. Brix ≥ 16°. EurepGAP compliant farms preferred.',
  },
  {
    id: 'demand_004',
    fpoId: 'fpo_amravati_soybean',
    cropName: 'Soybean',
    cropVariety: 'JS-335 Soybean — Fair Average Quality',
    cropEmoji: '',
    requiredQuantityQuintals: 15000,
    availableQuantityQuintals: 9800,
    offeredPricePerQuintal: 5100,
    localMandiPrice: 4450,
    profitMarginPercent: 14.6,
    qualityRequired: ['A', 'B', 'C'],
    pickupLocation: 'VSPF Warehouse, Nandgaon Peth, Amravati',
    pickupDistricts: ['Amravati', 'Akola', 'Yavatmal', 'Buldhana', 'Washim'],
    lastDateToApply: '2026-11-25',
    deliveryStartDate: '2026-12-01',
    deliveryEndDate: '2026-12-31',
    paymentTerms: 'DBT within 5 working days, NAFED-linked guarantee',
    urgencyTag: 'High Demand',
    buyerType: 'Corporate',
    endBuyerName: 'ITC Agribusiness & Cargill India',
    notes: 'Moisture ≤ 12%. Damaged beans ≤ 1%. All quality grades accepted with proportional pricing.',
  },
  {
    id: 'demand_005',
    fpoId: 'fpo_aurangabad_cotton',
    cropName: 'Cotton',
    cropVariety: 'Medium Staple BT Cotton — CCI Grade 1',
    cropEmoji: '',
    requiredQuantityQuintals: 50000,
    availableQuantityQuintals: 34000,
    offeredPricePerQuintal: 7500,
    localMandiPrice: 6900,
    profitMarginPercent: 8.7,
    qualityRequired: ['A', 'B'],
    pickupLocation: 'MCGF Ginning Centre, Gangapur, Aurangabad',
    pickupDistricts: ['Aurangabad', 'Jalna', 'Nanded', 'Latur', 'Osmanabad'],
    lastDateToApply: '2027-01-31',
    deliveryStartDate: '2026-12-01',
    deliveryEndDate: '2027-03-31',
    paymentTerms: 'MSP guaranteed + 5% FPO bonus. DBT in 48 hrs via CCI',
    urgencyTag: 'High Demand',
    buyerType: 'Corporate',
    endBuyerName: 'Cotton Corporation of India (CCI)',
    notes: 'Staple length 25–28mm. Mic 3.5–4.9. No green bolls or excess moisture.',
  },
  {
    id: 'demand_006',
    fpoId: 'fpo_pune_organic',
    cropName: 'Onion',
    cropVariety: 'Red Onion (Nashik) — Retail Grade',
    cropEmoji: '',
    requiredQuantityQuintals: 3000,
    availableQuantityQuintals: 1650,
    offeredPricePerQuintal: 2800,
    localMandiPrice: 2100,
    profitMarginPercent: 33.3,
    qualityRequired: ['A', 'B'],
    pickupLocation: 'POFC Hub, Lasalgaon Annex, Nashik',
    pickupDistricts: ['Nashik', 'Pune', 'Ahmednagar', 'Satara'],
    lastDateToApply: '2026-11-15',
    deliveryStartDate: '2026-11-20',
    deliveryEndDate: '2026-12-10',
    paymentTerms: 'DBT within 48 hrs',
    urgencyTag: 'Filling Fast',
    buyerType: 'Retail Chain',
    endBuyerName: 'BigBasket & Reliance Fresh',
    notes: 'Diameter 45–65mm. Dry outer skin. No sprouts. Sold in 25kg mesh bags.',
  },
];

// ─── Cold Storage Aggregation Hubs ──────────────────────────────────────────

export interface ColdStorageHub {
  id: string;
  name: string;
  district: string;
  address: string;
  capacityTons: number;
  linkedFPOs: string[];
  phone: string;
  freeForFarmers: boolean;
  crops: string[];
}

export const COLD_STORAGE_HUBS: ColdStorageHub[] = [
  {
    id: 'hub_kolhapur',
    name: 'KKPO Cold Hub Kolhapur',
    district: 'Kolhapur',
    address: 'Plot 42, MIDC Phase II, Shiroli, Kolhapur – 416122',
    capacityTons: 5000,
    linkedFPOs: ['fpo_kolhapur_kisan'],
    phone: '+91-98221-45001',
    freeForFarmers: true,
    crops: ['Wheat', 'Sugarcane', 'Jaggery', 'Soybean'],
  },
  {
    id: 'hub_pune_urse',
    name: 'POFC Aggregation Hub Urse',
    district: 'Pune',
    address: 'S.No. 18, Urse Industrial Area, Maval, Pune – 412109',
    capacityTons: 2200,
    linkedFPOs: ['fpo_pune_organic'],
    phone: '+91-98765-32100',
    freeForFarmers: true,
    crops: ['Tomato', 'Onion', 'Capsicum', 'Grapes', 'Strawberry'],
  },
  {
    id: 'hub_nashik_dindori',
    name: 'NGWGC Pack House Dindori',
    district: 'Nashik',
    address: 'Dindori APMC Road, Gat No. 77, Dindori, Nashik – 422202',
    capacityTons: 8000,
    linkedFPOs: ['fpo_nashik_grape'],
    phone: '+91-94201-78900',
    freeForFarmers: false,
    crops: ['Grapes', 'Pomegranate', 'Raisins', 'Onion'],
  },
  {
    id: 'hub_amravati',
    name: 'VSPF Nandgaon Warehouse',
    district: 'Amravati',
    address: 'Nandgaon Peth, NH-6, Amravati – 444708',
    capacityTons: 12000,
    linkedFPOs: ['fpo_amravati_soybean'],
    phone: '+91-90285-61200',
    freeForFarmers: true,
    crops: ['Soybean', 'Tur Dal', 'Urad Dal', 'Cotton', 'Chickpea'],
  },
];

// ─── Farmer's Own Harvest Listings (posted by the farmer) ────────────────────

export interface HarvestListing {
  id: string;
  farmerId: string;
  farmerName: string;
  cropName: string;
  cropVariety: string;
  quantityQuintals: number;
  qualityGrade: QualityGrade;
  expectedHarvestDate: string;
  district: string;
  contactPhone: string;
  description?: string;
  status: 'active' | 'matched' | 'sold';
  postedAt: string;
  matchedFPOId?: string;
  bidReceivedPerQuintal?: number;
}

// Seeded sample listings that appear in "My Direct Deals"
export const MY_HARVEST_LISTINGS: HarvestListing[] = [
  {
    id: 'my_listing_001',
    farmerId: 'farmer_self',
    farmerName: 'Rajendra Shinde',
    cropName: 'Soybean',
    cropVariety: 'JS-335',
    quantityQuintals: 45,
    qualityGrade: 'A',
    expectedHarvestDate: '2026-12-05',
    district: 'Akola',
    contactPhone: '+91-99234-00001',
    description: 'Well-sorted, low moisture soybean from 3-acre organic plot.',
    status: 'matched',
    postedAt: '2026-10-20T09:00:00+05:30',
    matchedFPOId: 'fpo_amravati_soybean',
    bidReceivedPerQuintal: 5050,
  },
  {
    id: 'my_listing_002',
    farmerId: 'farmer_self',
    farmerName: 'Rajendra Shinde',
    cropName: 'Onion',
    cropVariety: 'Red Nashik',
    quantityQuintals: 80,
    qualityGrade: 'B',
    expectedHarvestDate: '2026-11-18',
    district: 'Nashik',
    contactPhone: '+91-99234-00001',
    description: 'Standard grade red onion. Harvested dry. Ready for pickup.',
    status: 'active',
    postedAt: '2026-10-22T14:30:00+05:30',
  },
];

// ─── Direct Deals & Contract Status ─────────────────────────────────────────

export interface DirectDeal {
  id: string;
  listingId: string;
  fpoId: string;
  cropName: string;
  cropVariety: string;
  quantityQuintals: number;
  agreedPricePerQuintal: number;
  totalValue: number;
  status: DealStatus;
  paymentStatus: 'pending' | 'processing' | 'paid' | 'failed';
  contractDate: string;
  deliveryDate?: string;
  utrNumber?: string;       // DBT transaction reference
  notes?: string;
}

export const MY_DIRECT_DEALS: DirectDeal[] = [
  {
    id: 'deal_001',
    listingId: 'my_listing_001',
    fpoId: 'fpo_amravati_soybean',
    cropName: 'Soybean',
    cropVariety: 'JS-335',
    quantityQuintals: 45,
    agreedPricePerQuintal: 5050,
    totalValue: 227250,
    status: 'active',
    paymentStatus: 'processing',
    contractDate: '2026-10-21',
    deliveryDate: '2026-12-07',
    utrNumber: 'HDFC26102200041122',
    notes: 'Pickup arranged by VSPF from Akola on delivery date. DBT to Aadhaar-linked account.',
  },
];

// ─── Crop options for the listing form ──────────────────────────────────────

export const CROP_OPTIONS = [
  { id: 'wheat', label: 'Wheat', varieties: ['Lokwan', 'GW-322', 'Shalimar', 'HI-8498', 'Other'] },
  { id: 'tomato', label: 'Tomato', varieties: ['Desi Roma', 'Hybrid F1', 'Nattu Tomato', 'Other'] },
  { id: 'onion', label: 'Onion', varieties: ['Red Nashik', 'White Onion', 'Bellary Red', 'Other'] },
  { id: 'soybean', label: 'Soybean', varieties: ['JS-335', 'JS-9305', 'NRC-37', 'Other'] },
  { id: 'cotton', label: 'Cotton', varieties: ['BT Hybrid', 'Narayanrao', 'Medium Staple', 'Other'] },
  { id: 'grapes', label: 'Grapes', varieties: ['Thompson Seedless', 'Sharad Seedless', 'Flame Seedless', 'Other'] },
  { id: 'sugarcane', label: 'Sugarcane', varieties: ['Co-86032', 'CoM-265', 'MS-10001', 'Other'] },
  { id: 'pomegranate', label: 'Pomegranate', varieties: ['Bhagwa', 'Ganesh', 'Ruby', 'Other'] },
  { id: 'tur_dal', label: 'Tur Dal', varieties: ['BSMR-853', 'Maruti', 'BDN-711', 'Other'] },
  { id: 'chickpea', label: 'Chickpea', varieties: ['Vikas', 'JG-11', 'Digvijay', 'Other'] },
  { id: 'maize', label: 'Maize', varieties: ['DKC-9144', 'Pioneer 30B11', 'NMH-803', 'Other'] },
  { id: 'other', label: 'Other', varieties: ['Other'] },
];

export const MAHARASHTRA_DISTRICTS = [
  'Ahmednagar', 'Akola', 'Amravati', 'Aurangabad', 'Beed', 'Bhandara',
  'Buldhana', 'Chandrapur', 'Dhule', 'Gadchiroli', 'Gondia', 'Hingoli',
  'Jalgaon', 'Jalna', 'Kolhapur', 'Latur', 'Mumbai', 'Nagpur', 'Nanded',
  'Nandurbar', 'Nashik', 'Osmanabad', 'Palghar', 'Parbhani', 'Pune',
  'Raigad', 'Ratnagiri', 'Sangli', 'Satara', 'Sindhudurg', 'Solapur',
  'Thane', 'Wardha', 'Washim', 'Yavatmal',
];
