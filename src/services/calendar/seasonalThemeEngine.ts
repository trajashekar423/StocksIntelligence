/**
 * Indian Seasonal & Festival Market Cycle Engine (Jan – Dec)
 *
 * Maps Dalal Street's seasonal, cultural, and festive themes:
 * - 11 Major Cycles (Pongal, Budget, Holi, Akshaya Tritiya, Monsoon, Onam, Ganesh Chaturthi, Navratri, Diwali, Wedding, Year-End)
 * - Mapped NSE Sectors and Stock Baskets
 * - Accumulation Timing (Buy 2–4 weeks prior, take profits 1–2 days before peak festival)
 */

export interface SeasonalStock {
  symbol: string;
  companyName: string;
  sector: string;
  catalyst: string;
  typicalRunupPct: string;
  role: 'LEADER' | 'BENEFICIARY' | 'MONOPOLY';
}

export interface SeasonalCycle {
  id: string;
  name: string;
  hindiName?: string;
  months: number[]; // 1 = Jan, 12 = Dec
  typicalPeriod: string;
  description: string;
  catalyst: string;
  whenToAccumulate: string;
  whenToExit: string;
  sectors: string[];
  stocks: SeasonalStock[];
  festiveIcon: string;
}

export interface SeasonalAnalysisResult {
  currentMonth: number;
  currentMonthName: string;
  activeCycles: SeasonalCycle[];
  upcomingCycles: SeasonalCycle[];
  allCycles: SeasonalCycle[];
  recommendedAccumulationBaskets: SeasonalCycle[];
}

export const INDIAN_SEASONAL_CYCLES: SeasonalCycle[] = [
  {
    id: 'pongal_sankranti',
    name: 'Makar Sankranti & Pongal',
    hindiName: 'मकर संक्रांति एवं पोंगल',
    months: [1],
    typicalPeriod: 'January',
    festiveIcon: '🪁',
    description: 'Harvest festival across North & South India. Influx of farm cash into rural consumption, two-wheelers, and tractors.',
    catalyst: 'Kharif crop harvest liquidity, rural FMCG uptick, gift retail purchases.',
    whenToAccumulate: 'Mid to Late December (2–3 weeks before Sankranti)',
    whenToExit: 'First week of January upon rural dispatch numbers',
    sectors: ['FMCG', 'Rural Auto', 'Consumer Durables', 'Textiles'],
    stocks: [
      { symbol: 'HINDUNILVR', companyName: 'Hindustan Unilever Ltd', sector: 'FMCG', catalyst: 'Rural FMCG volume recovery', typicalRunupPct: '+3% to +6%', role: 'LEADER' },
      { symbol: 'DABUR', companyName: 'Dabur India Limited', sector: 'FMCG', catalyst: 'Winter health & consumer food items', typicalRunupPct: '+4% to +7%', role: 'BENEFICIARY' },
      { symbol: 'M&M', companyName: 'Mahindra & Mahindra Ltd', sector: 'Auto', catalyst: 'Harvest season farm tractor bookings', typicalRunupPct: '+5% to +8%', role: 'LEADER' },
      { symbol: 'HEROMOTOCO', companyName: 'Hero MotoCorp Ltd', sector: 'Auto', catalyst: 'Rural entry-level 100cc motorcycle sales', typicalRunupPct: '+4% to +8%', role: 'LEADER' },
      { symbol: 'ESCORTS', companyName: 'Escorts Kubota Ltd', sector: 'Auto', catalyst: 'High rural cash flow into farm equipment', typicalRunupPct: '+5% to +10%', role: 'BENEFICIARY' },
    ],
  },
  {
    id: 'union_budget',
    name: 'Union Budget & Capex Push',
    hindiName: 'केंद्रीय बजट',
    months: [1, 2],
    typicalPeriod: 'Late Jan – Early Feb',
    festiveIcon: '💼',
    description: 'Government announces annual fiscal expenditure, infrastructure allocations, defense outlays, and tax revisions.',
    catalyst: 'Capital expenditure (Capex) announcements, railway modernization, defence indigenisation.',
    whenToAccumulate: 'First week of January',
    whenToExit: 'Budget Day or 1 day prior (Sell the news)',
    sectors: ['Railways', 'Defence', 'Infrastructure', 'Capital Goods'],
    stocks: [
      { symbol: 'IRFC', companyName: 'Indian Railway Finance Corp', sector: 'Railways', catalyst: 'Railway budget allocation for rolling stock', typicalRunupPct: '+8% to +18%', role: 'LEADER' },
      { symbol: 'RVNL', companyName: 'Rail Vikas Nigam Limited', sector: 'Railways', catalyst: 'High speed rail & station redevelopment projects', typicalRunupPct: '+10% to +20%', role: 'LEADER' },
      { symbol: 'HAL', companyName: 'Hindustan Aeronautics Ltd', sector: 'Defence', catalyst: 'Indigenous defense budget procurement', typicalRunupPct: '+6% to +12%', role: 'MONOPOLY' },
      { symbol: 'LT', companyName: 'Larsen & Toubro Ltd', sector: 'Infra', catalyst: 'Mega infra order announcements', typicalRunupPct: '+4% to +7%', role: 'LEADER' },
      { symbol: 'TITAGARH', companyName: 'Titagarh Rail Systems', sector: 'Railways', catalyst: 'Vande Bharat trainset contracts', typicalRunupPct: '+8% to +15%', role: 'BENEFICIARY' },
    ],
  },
  {
    id: 'holi_early_summer',
    name: 'Holi & Pre-Summer Build-Up',
    hindiName: 'होली एवं वसंतोत्सव',
    months: [2, 3],
    typicalPeriod: 'Late Feb – March',
    festiveIcon: '🎨',
    description: 'Spring festival of colors, home repainting, and the onset of early Indian summer heatwaves.',
    catalyst: 'Annual home whitewashing & repainting demand, early cooling appliance distribution.',
    whenToAccumulate: 'Early February',
    whenToExit: 'Holi week (Mid-March)',
    sectors: ['Paints', 'Cooling Appliances', 'Consumer Discretionary', 'Insurance'],
    stocks: [
      { symbol: 'ASIANPAINT', companyName: 'Asian Paints Limited', sector: 'Paints', catalyst: 'Peak pre-Holi home painting demand', typicalRunupPct: '+5% to +8%', role: 'LEADER' },
      { symbol: 'BERGEPAINT', companyName: 'Berger Paints India Ltd', sector: 'Paints', catalyst: 'Decorative paint sales volume spike', typicalRunupPct: '+4% to +8%', role: 'BENEFICIARY' },
      { symbol: 'VOLTAS', companyName: 'Voltas Limited', sector: 'Cooling', catalyst: 'Early room air conditioner stocking by dealers', typicalRunupPct: '+6% to +14%', role: 'LEADER' },
      { symbol: 'HDFCLIFE', companyName: 'HDFC Life Insurance Co', sector: 'Insurance', catalyst: 'March financial year-end Section 80C tax saving rush', typicalRunupPct: '+4% to +7%', role: 'BENEFICIARY' },
    ],
  },
  {
    id: 'akshaya_tritiya_summer',
    name: 'Akshaya Tritiya & Peak Summer',
    hindiName: 'अक्षय तृतीया एवं ग्रीष्म काल',
    months: [4, 5],
    typicalPeriod: 'April – May',
    festiveIcon: '☀️',
    description: 'Major auspicious day for gold and property purchases. Peak summer temperatures drive record beverage & ice cream consumption.',
    catalyst: 'Auspicious bullion buying, AC / cooler sell-outs, school summer vacation family travel.',
    whenToAccumulate: 'Late March or early April',
    whenToExit: 'Akshaya Tritiya day or peak heatwave in May',
    sectors: ['Jewellery', 'Beverages', 'Cooling Appliances', 'Travel & Hotels'],
    stocks: [
      { symbol: 'TITAN', companyName: 'Titan Company Limited', sector: 'Jewellery', catalyst: 'Tanishq Akshaya Tritiya gold token advances', typicalRunupPct: '+5% to +9%', role: 'LEADER' },
      { symbol: 'KALYANJEW', companyName: 'Kalyan Jewellers India', sector: 'Jewellery', catalyst: 'Record wedding & gold coin buying', typicalRunupPct: '+8% to +15%', role: 'BENEFICIARY' },
      { symbol: 'VBL', companyName: 'Varun Beverages Limited', sector: 'Beverages', catalyst: 'Record hot weather PepsiCo soft drink volumes', typicalRunupPct: '+8% to +16%', role: 'MONOPOLY' },
      { symbol: 'BLUESTARCO', companyName: 'Blue Star Limited', sector: 'Cooling', catalyst: 'Commercial & residential AC stocking', typicalRunupPct: '+6% to +12%', role: 'BENEFICIARY' },
      { symbol: 'INDHOTEL', companyName: 'The Indian Hotels Co', sector: 'Hotels', catalyst: 'Summer vacation leisure bookings at Taj resorts', typicalRunupPct: '+5% to +10%', role: 'LEADER' },
    ],
  },
  {
    id: 'monsoon_run',
    name: 'South-West Monsoon Sowing',
    hindiName: 'मानसून एवं खरीफ बुवाई',
    months: [6, 7],
    typicalPeriod: 'June – July',
    festiveIcon: '🌧️',
    description: 'Arrival of the monsoon rains across Kerala, Maharashtra, and North India. Vital for 60% of India’s rural economy.',
    catalyst: 'Above-normal monsoon forecasts, kharif crop acreage expansion, pesticide/fertilizer usage.',
    whenToAccumulate: 'Late May (Pre-monsoon forecast)',
    whenToExit: 'Mid-July once rainfall distribution is proven',
    sectors: ['Agrochemicals', 'Fertilizers', 'Pipes & Irrigation', 'Rural Economy'],
    stocks: [
      { symbol: 'COROMANDEL', companyName: 'Coromandel International', sector: 'Agri', catalyst: 'Nutrient-based fertilizer subsidy uptake', typicalRunupPct: '+5% to +10%', role: 'LEADER' },
      { symbol: 'PIIND', companyName: 'PI Industries Limited', sector: 'Agri', catalyst: 'Global agrochemical demand & custom synthesis', typicalRunupPct: '+6% to +11%', role: 'LEADER' },
      { symbol: 'ASTRAL', companyName: 'Astral Limited', sector: 'Pipes', catalyst: 'Agricultural pipe replacement and canal piping', typicalRunupPct: '+5% to +9%', role: 'BENEFICIARY' },
      { symbol: 'FINPIPE', companyName: 'Finolex Industries Ltd', sector: 'Pipes', catalyst: 'Direct agri-PVC pipe sales to farmers', typicalRunupPct: '+4% to +8%', role: 'BENEFICIARY' },
    ],
  },
  {
    id: 'onam_ganesh_chaturthi',
    name: 'Onam & Ganesh Chaturthi (Current)',
    hindiName: 'ओणम एवं गणेश चतुर्थी',
    months: [8, 9],
    typicalPeriod: 'August – September',
    festiveIcon: '🪔',
    description: 'Official kickoff of India’s festive quarter. Major shopping boom across Kerala (Onam) and Western India (Ganesh Chaturthi).',
    catalyst: 'Record gold purchases in Kerala, white goods consumer loans, early festive bonus distributions.',
    whenToAccumulate: 'Mid-August to first week of September',
    whenToExit: 'Anant Chaturdashi (Ganesh Visarjan)',
    sectors: ['Jewellery & Gold', 'Gold Loans', 'Auto', 'Consumer Electronics', 'Retail'],
    stocks: [
      { symbol: 'KALYANJEW', companyName: 'Kalyan Jewellers India', sector: 'Jewellery', catalyst: 'Kerala Onam gold sales represent highest regional market share', typicalRunupPct: '+10% to +22%', role: 'LEADER' },
      { symbol: 'MUTHOOTFIN', companyName: 'Muthoot Finance Limited', sector: 'Gold Loans', catalyst: 'High gold collateral valuation boosts festive loan book (AUM)', typicalRunupPct: '+7% to +14%', role: 'MONOPOLY' },
      { symbol: 'MANAPPURAM', companyName: 'Manappuram Finance Ltd', sector: 'Gold Loans', catalyst: 'Gold loan disbursement expansion and low credit risk', typicalRunupPct: '+6% to +12%', role: 'BENEFICIARY' },
      { symbol: 'TITAN', companyName: 'Titan Company Limited', sector: 'Jewellery', catalyst: 'Tanishq festive collection launch and advance bookings', typicalRunupPct: '+6% to +11%', role: 'LEADER' },
      { symbol: 'SENCO', companyName: 'Senco Gold Limited', sector: 'Jewellery', catalyst: 'Eastern and Pan-India festive wedding gold demand', typicalRunupPct: '+8% to +18%', role: 'BENEFICIARY' },
      { symbol: 'TRENT', companyName: 'Trent Limited (Zudio)', sector: 'Retail', catalyst: 'Festive apparel sales and rapid store network expansion', typicalRunupPct: '+12% to +25%', role: 'LEADER' },
      { symbol: 'TATAMOTORS', companyName: 'Tata Motors Limited', sector: 'Auto', catalyst: 'Festive commercial vehicle and passenger EV delivery rush', typicalRunupPct: '+6% to +12%', role: 'LEADER' },
    ],
  },
  {
    id: 'navratri_dussehra',
    name: 'Navratri & Dussehra Auspicious Buying',
    hindiName: 'नवरात्रि एवं दशहरा',
    months: [9, 10],
    typicalPeriod: 'Late September – October',
    festiveIcon: '🚗',
    description: 'Nine nights of celebration culminating in Vijayadashami. Peak auspicious period for vehicle purchases, real estate registries, and appliances.',
    catalyst: 'Record vehicle delivery registrations on Dussehra, electronics exchange festivals, residential real estate launches.',
    whenToAccumulate: 'First half of September',
    whenToExit: 'Dussehra day',
    sectors: ['Auto (2W & 4W)', 'Consumer Durables', 'Real Estate', 'Logistics'],
    stocks: [
      { symbol: 'MARUTI', companyName: 'Maruti Suzuki India', sector: 'Auto', catalyst: 'Highest vehicle delivery month of the entire fiscal year', typicalRunupPct: '+6% to +10%', role: 'LEADER' },
      { symbol: 'M&M', companyName: 'Mahindra & Mahindra Ltd', sector: 'Auto', catalyst: 'SUV order book dispatch (Scorpio/XUV700) on Dussehra', typicalRunupPct: '+7% to +13%', role: 'LEADER' },
      { symbol: 'BAJAJ-AUTO', companyName: 'Bajaj Auto Limited', sector: 'Auto', catalyst: 'Festive two-wheeler domestic sales volume surge', typicalRunupPct: '+6% to +12%', role: 'LEADER' },
      { symbol: 'TVSMOTOR', companyName: 'TVS Motor Company Ltd', sector: 'Auto', catalyst: 'Jupiter and Raider scooter festive demand', typicalRunupPct: '+7% to +14%', role: 'BENEFICIARY' },
      { symbol: 'HAVELLS', companyName: 'Havells India Limited', sector: 'Consumer', catalyst: 'Lloyd electronics, kitchenware, and lighting sales', typicalRunupPct: '+5% to +9%', role: 'LEADER' },
      { symbol: 'DIXON', companyName: 'Dixon Technologies Ltd', sector: 'Consumer', catalyst: 'Contract manufacturing of smart TVs and mobile phones', typicalRunupPct: '+8% to +18%', role: 'MONOPOLY' },
      { symbol: 'DLF', companyName: 'DLF Limited', sector: 'Real Estate', catalyst: 'New festive luxury housing project launches', typicalRunupPct: '+6% to +12%', role: 'LEADER' },
    ],
  },
  {
    id: 'diwali_dhanteras',
    name: 'Dhanteras, Diwali & Muhurat Trading',
    hindiName: 'धनतेरस, दीपावली एवं मुहूर्त ट्रेडिंग',
    months: [10, 11],
    typicalPeriod: 'October – November',
    festiveIcon: '✨',
    description: 'India’s ultimate consumption super-cycle. Auspicious gold/metal purchase on Dhanteras and special 1-hour festive Muhurat Trading on Diwali.',
    catalyst: 'Annual corporate bonus spending, bullion buying, e-commerce mega sales, gift packages.',
    whenToAccumulate: 'Late September to early October',
    whenToExit: 'Dhanteras / Diwali Muhurat trading session',
    sectors: ['Jewellery & Bullion', 'E-Commerce & Quick-Commerce', 'Retail', 'Logistics'],
    stocks: [
      { symbol: 'TITAN', companyName: 'Titan Company Limited', sector: 'Jewellery', catalyst: 'Dhanteras is Titan’s single highest sales day of the year', typicalRunupPct: '+7% to +14%', role: 'LEADER' },
      { symbol: 'KALYANJEW', companyName: 'Kalyan Jewellers India', sector: 'Jewellery', catalyst: 'Gold coin and heavy bridal jewellery sales volume peak', typicalRunupPct: '+10% to +20%', role: 'BENEFICIARY' },
      { symbol: 'ZOMATO', companyName: 'Zomato Ltd (Blinkit)', sector: 'Quick Commerce', catalyst: 'Record 10-minute delivery orders for sweets, diyas, gold coins, and electronics', typicalRunupPct: '+8% to +16%', role: 'LEADER' },
      { symbol: 'DELHIVERY', companyName: 'Delhivery Limited', sector: 'Logistics', catalyst: 'Festive parcel shipment volume surge for Amazon and Flipkart', typicalRunupPct: '+6% to +12%', role: 'BENEFICIARY' },
      { symbol: 'DMART', companyName: 'Avenue Supermarts Ltd', sector: 'Retail', catalyst: 'Festive grocery and home utility bulk buying', typicalRunupPct: '+5% to +9%', role: 'LEADER' },
    ],
  },
  {
    id: 'wedding_season',
    name: 'The Great Indian Winter Wedding Season',
    hindiName: 'भारतीय विवाह ऋतु',
    months: [11, 12, 1, 2],
    typicalPeriod: 'November – February',
    festiveIcon: '💍',
    description: 'Over 35 lakh weddings take place across India, with an estimated ₹4.5 Lakh Crore spent on bridal apparel, gold, banqueting, and luxury hospitality.',
    catalyst: 'High-ticket bridal jewellery, groom ethnic wear, luxury suite bookings, and catering demand.',
    whenToAccumulate: 'Mid-October',
    whenToExit: 'Mid-January as wedding dates peak',
    sectors: ['Bridal Apparel', 'Wedding Jewellery', 'Luxury Hotels', 'Footwear'],
    stocks: [
      { symbol: 'MANYAVAR', companyName: 'Vedant Fashions Ltd', sector: 'Apparel', catalyst: 'Near-monopoly in groom sherwanis (Manyavar) & bridal lehengas (Mohey)', typicalRunupPct: '+10% to +20%', role: 'MONOPOLY' },
      { symbol: 'RAYMOND', companyName: 'Raymond Limited', sector: 'Apparel', catalyst: 'Suiting fabric and bespoke wedding tailoring', typicalRunupPct: '+8% to +16%', role: 'LEADER' },
      { symbol: 'INDHOTEL', companyName: 'The Indian Hotels Co', sector: 'Hotels', catalyst: 'Premium palace and banquet wedding reservations across Taj & Vivanta', typicalRunupPct: '+6% to +12%', role: 'LEADER' },
      { symbol: 'EIHOTEL', companyName: 'EIH Limited (Oberoi)', sector: 'Hotels', catalyst: 'Ultra-luxury destination wedding banqueting', typicalRunupPct: '+7% to +14%', role: 'BENEFICIARY' },
      { symbol: 'METROBRAND', companyName: 'Metro Brands Limited', sector: 'Footwear', catalyst: 'Wedding formal footwear and festive accessories', typicalRunupPct: '+6% to +12%', role: 'BENEFICIARY' },
    ],
  },
  {
    id: 'christmas_new_year',
    name: 'Christmas, Year-End & Winter Tourism',
    hindiName: 'क्रिसमस एवं नव वर्ष',
    months: [12],
    typicalPeriod: 'December',
    festiveIcon: '🎄',
    description: 'Year-end holiday travel, outdoor parties, social celebrations, dining out, and beverage consumption.',
    catalyst: 'Record domestic flight occupancy, full hotel room inventory, peak celebratory alcohol sales.',
    whenToAccumulate: 'Mid-November',
    whenToExit: 'December 28–30 (Before holiday lull)',
    sectors: ['Aviation', 'Hotels', 'Alco-Beverages', 'QSR & Restaurants'],
    stocks: [
      { symbol: 'INDIGO', companyName: 'InterGlobe Aviation Ltd', sector: 'Aviation', catalyst: '62% domestic aviation market share during peak tourist month', typicalRunupPct: '+6% to +12%', role: 'MONOPOLY' },
      { symbol: 'MCDOWELL-N', companyName: 'United Spirits Limited', sector: 'Spirits', catalyst: 'Peak festive and New Year celebration liquor sales', typicalRunupPct: '+5% to +10%', role: 'LEADER' },
      { symbol: 'RADICO', companyName: 'Radico Khaitan Ltd', sector: 'Spirits', catalyst: 'Premium vodka & whisky sales surge in winter party season', typicalRunupPct: '+7% to +15%', role: 'BENEFICIARY' },
      { symbol: 'JUBLFOOD', companyName: 'Jubilant FoodWorks Ltd', sector: 'QSR', catalyst: 'Domino’s Pizza and party order volume surge on Christmas & NYE', typicalRunupPct: '+4% to +8%', role: 'LEADER' },
      { symbol: 'EASEMYTRIP', companyName: 'Easy Trip Planners Ltd', sector: 'Travel', catalyst: 'Holiday flight, bus, and hotel package bookings', typicalRunupPct: '+6% to +12%', role: 'BENEFICIARY' },
    ],
  },
];

export function getSeasonalAnalysis(targetDate: Date = new Date()): SeasonalAnalysisResult {
  // Use IST month (1-indexed: 1 = Jan, 12 = Dec)
  const monthStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    month: 'numeric',
  }).format(targetDate);
  const currentMonth = Number(monthStr) || (targetDate.getMonth() + 1);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentMonthName = monthNames[currentMonth - 1] || 'September';

  // Active Cycles (Festivals occurring in or spanning this month)
  const activeCycles = INDIAN_SEASONAL_CYCLES.filter((cycle) =>
    cycle.months.includes(currentMonth)
  );

  // Upcoming Cycles (Next 1 to 2 months)
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  const monthAfterNext = nextMonth === 12 ? 1 : nextMonth + 1;
  const upcomingCycles = INDIAN_SEASONAL_CYCLES.filter(
    (cycle) =>
      !activeCycles.some((ac) => ac.id === cycle.id) &&
      (cycle.months.includes(nextMonth) || cycle.months.includes(monthAfterNext))
  );

  // Recommended Accumulation Baskets (Cycles in prime accumulation phase right now)
  const recommendedAccumulationBaskets = [...activeCycles, ...upcomingCycles];

  return {
    currentMonth,
    currentMonthName,
    activeCycles,
    upcomingCycles,
    allCycles: INDIAN_SEASONAL_CYCLES,
    recommendedAccumulationBaskets,
  };
}
