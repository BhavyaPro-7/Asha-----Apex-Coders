import { SupportedLanguage } from '../types';

export interface Translations {
  appName: string;
  appTagline: string;
  selectRole: string;
  roleSelectionDesc: string;
  switchRole: string;
  currentRole: string;
  logout: string;
  demoModeNotice: string;
  
  // Roles
  donor: string;
  donorDesc: string;
  rider: string;
  riderDesc: string;
  shelter: string;
  shelterDesc: string;
  coordinator: string;
  coordinatorDesc: string;

  // Registration & Cross-Role
  registerRole: string;
  registerAsShelter: string;
  registerAsRider: string;
  registerAsCoordinator: string;
  crossRoleBanner: string;

  // Scoring
  impactScore: string;
  riderScore: string;
  shelterScore: string;
  matchScore: string;

  // Map & Rider
  nearbyDeliveries: string;
  mapView: string;
  listView: string;
  acceptDelivery: string;
  distanceAway: string;

  // Navigation
  dashboard: string;
  batches: string;
  newDonation: string;
  deliveries: string;
  assignments: string;
  intakeCapacity: string;
  operations: string;
  auditTrail: string;
  notifications: string;
  quickTestFlow: string;

  // Statuses
  AVAILABLE: string;
  RESERVED: string;
  ASSIGNED: string;
  ACKNOWLEDGED: string;
  PICKED_UP: string;
  IN_TRANSIT: string;
  DELIVERED: string;
  PARTIALLY_DELIVERED: string;
  BLOCKED: string;
  REDIRECT_PENDING: string;
  CANCELLED: string;
  RESERVATION_EXPIRED: string;
  FAILED: string;

  // Categories
  cooked_meals: string;
  dry_rations: string;
  fresh_produce: string;
  packaged_food: string;
  baby_essentials: string;
  hygiene_kits: string;
  medical_supplies: string;
  blankets_warmth: string;

  // Storage
  ambient: string;
  hot_holding: string;
  cold_refrigerated: string;
  dry_ventilated: string;

  // Common Actions
  submit: string;
  cancel: string;
  confirm: string;
  saveChanges: string;
  acknowledge: string;
  decline: string;
  confirmArrival: string;
  confirmPickup: string;
  reportDelay: string;
  requestHelp: string;
  completeHandoff: string;
  overrideAction: string;
  reassign: string;
  redirectDestination: string;
  inspectAndAccept: string;
  markAllRead: string;
  viewDetails: string;
  close: string;
  filterByStatus: string;
  all: string;
  searchPlaceholder: string;
  reason: string;
  notes: string;
  
  // Form Labels
  batchTitle: string;
  category: string;
  quantity: string;
  unit: string;
  prepTime: string;
  safeUseDeadline: string;
  storageCondition: string;
  pickupAddress: string;
  pickupLandmark: string;
  contactPhone: string;
  specialInstructions: string;
  dietaryPreference: string;

  // Shelter specific
  totalBeds: string;
  currentOccupancy: string;
  availableIntake: string;
  cleanWater: string;
  cookingFuel: string;
  receivingHours: string;
  tempClosure: string;
  closureNotice: string;
  expectedDeliveries: string;
  receivedDeliveries: string;
  inspectBatch: string;
  acceptedQty: string;
  rejectedQty: string;
  qualityCondition: string;
  verifiedByStaff: string;

  // Rider specific
  noAssignments: string;
  noAssignmentsDesc: string;
  activeMission: string;
  pickupFrom: string;
  deliverTo: string;
  deadline: string;
  delayMinutes: string;

  // Coordinator specific
  overviewStats: string;
  totalActiveBatches: string;
  activeRidersField: string;
  approachingDeadlines: string;
  blockedDeliveries: string;
  totalMealsRescued: string;
  dispatchQueue: string;
  shelterCapacityMatrix: string;
  auditLogHistory: string;
  assignRider: string;
  selectShelter: string;
  overrideReasonPrompt: string;

  // Test Flow
  testFlowTitle: string;
  testFlowDesc: string;
  resetDemoData: string;
  resetSuccess: string;
}

export const translations: Record<SupportedLanguage, Translations> = {
  en: {
    appName: "AIDFLOW",
    appTagline: "Share Surplus Food & Essential Aid",
    selectRole: "Choose Your Role",
    roleSelectionDesc: "Pick how you want to help today. Each role has its own workspace.",
    switchRole: "Switch Role",
    currentRole: "Current Role",
    logout: "Back to Roles",
    demoModeNotice: "Live Simulation Demo",

    donor: "Donor",
    donorDesc: "Kitchens & caterers donating fresh surplus meals.",
    rider: "Rider",
    riderDesc: "Volunteers picking up and delivering food fast.",
    shelter: "Shelter",
    shelterDesc: "Refuges and relief centers receiving aid.",
    coordinator: "Coordinator",
    coordinatorDesc: "Dispatch team tracking and directing deliveries.",

    registerRole: "Register",
    registerAsShelter: "Register as Shelter",
    registerAsRider: "Register as Rider",
    registerAsCoordinator: "Register as Coordinator",
    crossRoleBanner: "Need food for a shelter, or want to deliver? Register here",

    impactScore: "Impact Score",
    riderScore: "Rider Score",
    shelterScore: "Shelter Score",
    matchScore: "Match Score",

    nearbyDeliveries: "Nearby Deliveries",
    mapView: "Map View",
    listView: "List View",
    acceptDelivery: "Accept Delivery",
    distanceAway: "km away",

    dashboard: "Home",
    batches: "Food Batches",
    newDonation: "Post Food",
    deliveries: "Deliveries",
    assignments: "My Tasks",
    intakeCapacity: "Capacity",
    operations: "Dispatch",
    auditTrail: "History",
    notifications: "Alerts",
    quickTestFlow: "Test Demo Flow",

    AVAILABLE: "Available",
    RESERVED: "Reserved",
    ASSIGNED: "Rider Assigned",
    ACKNOWLEDGED: "Accepted",
    PICKED_UP: "Picked Up",
    IN_TRANSIT: "On The Way",
    DELIVERED: "Delivered",
    PARTIALLY_DELIVERED: "Partially Received",
    BLOCKED: "Need Help",
    REDIRECT_PENDING: "Redirecting",
    CANCELLED: "Cancelled",
    RESERVATION_EXPIRED: "Expired",
    FAILED: "Failed",

    cooked_meals: "Cooked Meals",
    dry_rations: "Dry Grains & Rice",
    fresh_produce: "Fresh Fruits & Veg",
    packaged_food: "Packaged Food",
    baby_essentials: "Baby Food & Diapers",
    hygiene_kits: "Hygiene Kits",
    medical_supplies: "First Aid & Medical",
    blankets_warmth: "Blankets & Clothes",

    ambient: "Room Temp",
    hot_holding: "Keep Hot (>60°C)",
    cold_refrigerated: "Keep Cold (<5°C)",
    dry_ventilated: "Keep Dry",

    submit: "Post Food",
    cancel: "Cancel",
    confirm: "Confirm",
    saveChanges: "Save",
    acknowledge: "Accept Task",
    decline: "Decline",
    confirmArrival: "I Have Arrived",
    confirmPickup: "Food Picked Up",
    reportDelay: "Report Delay",
    requestHelp: "Need Help",
    completeHandoff: "Delivered to Shelter",
    overrideAction: "Override",
    reassign: "Reassign Rider",
    redirectDestination: "Change Shelter",
    inspectAndAccept: "Verify & Receive",
    markAllRead: "Mark read",
    viewDetails: "View",
    close: "Close",
    filterByStatus: "Filter",
    all: "All",
    searchPlaceholder: "Search ID, location, or food...",
    reason: "Reason",
    notes: "Notes",

    batchTitle: "Food Item Name",
    category: "Category",
    quantity: "Quantity",
    unit: "Unit",
    prepTime: "Prepared At",
    safeUseDeadline: "Expires In",
    storageCondition: "Storage",
    pickupAddress: "Pickup Address",
    pickupLandmark: "Landmark",
    contactPhone: "Phone Number",
    specialInstructions: "Special Instructions",
    dietaryPreference: "Food Type",

    totalBeds: "Total Beds",
    currentOccupancy: "Occupied Beds",
    availableIntake: "Open Beds",
    cleanWater: "Drinking Water Ready",
    cookingFuel: "Cooking Fuel Ready",
    receivingHours: "Hours",
    tempClosure: "Pause Intake",
    closureNotice: "This shelter is temporarily not accepting deliveries.",
    expectedDeliveries: "Expected Deliveries",
    receivedDeliveries: "Received Food",
    inspectBatch: "Inspect Delivery",
    acceptedQty: "Accepted Quantity",
    rejectedQty: "Rejected / Spoiled",
    qualityCondition: "Quality Check",
    verifiedByStaff: "Staff Name",

    noAssignments: "No Active Tasks",
    noAssignmentsDesc: "Check nearby deliveries on the map or wait for dispatch.",
    activeMission: "Active Delivery",
    pickupFrom: "Pickup",
    deliverTo: "Deliver To",
    deadline: "Deadline",
    delayMinutes: "Delay (minutes)",

    overviewStats: "Operations Overview",
    totalActiveBatches: "Active Batches",
    activeRidersField: "Riders on Road",
    approachingDeadlines: "Expiring Soon (<2h)",
    blockedDeliveries: "Need Help",
    totalMealsRescued: "Meals Rescued Today",
    dispatchQueue: "Live Deliveries",
    shelterCapacityMatrix: "Shelter Availability",
    auditLogHistory: "Activity History",
    assignRider: "Assign Rider",
    selectShelter: "Select Shelter",
    overrideReasonPrompt: "Reason for override",

    testFlowTitle: "Try the Full Delivery Demo",
    testFlowDesc: "See how food goes from Donor to Rider to Shelter with live tracking.",
    resetDemoData: "Reset Data",
    resetSuccess: "Reset to default demo data.",
  },

  hi: {
    appName: "AIDFLOW",
    appTagline: "अतिरिक्त भोजन और आवश्यक मदद साझा करें",
    selectRole: "अपनी भूमिका चुनें",
    roleSelectionDesc: "चुनें कि आप आज कैसे मदद करना चाहते हैं।",
    switchRole: "भूमिका बदलें",
    currentRole: "वर्तमान भूमिका",
    logout: "भूमिका चयन पर वापस",
    demoModeNotice: "लाइव डेमो सिमुलेशन",

    donor: "दाता (Donor)",
    donorDesc: "रसोई और खानपान सेवाएँ जो भोजन दान करती हैं।",
    rider: "राइडर (Rider)",
    riderDesc: "स्वयंसेवक जो भोजन संकलित कर पहुँचाते हैं।",
    shelter: "आश्रय (Shelter)",
    shelterDesc: "रेन बसेरे और राहत शिविर जहाँ सहायता मिलती है।",
    coordinator: "समन्वयक (Coordinator)",
    coordinatorDesc: "नियंत्रण कक्ष जो वितरण का प्रबंधन करता है।",

    registerRole: "पंजीकरण करें",
    registerAsShelter: "आश्रय के रूप में पंजीकृत हों",
    registerAsRider: "राइडर के रूप में पंजीकृत हों",
    registerAsCoordinator: "समन्वयक के रूप में पंजीकृत हों",
    crossRoleBanner: "आश्रय के लिए भोजन चाहिए या डिलीवरी करना चाहते हैं? यहाँ पंजीकृत हों",

    impactScore: "प्रभाव स्कोर",
    riderScore: "राइडर स्कोर",
    shelterScore: "आश्रय स्कोर",
    matchScore: "प्राथमिकता स्कोर",

    nearbyDeliveries: "आसपास की डिलीवरी",
    mapView: "नक्शा दृश्य (Map)",
    listView: "सूची दृश्य (List)",
    acceptDelivery: "डिलीवरी स्वीकार करें",
    distanceAway: "किमी दूर",

    dashboard: "मुख्य पृष्ठ",
    batches: "भोजन बैच",
    newDonation: "भोजन पोस्ट करें",
    deliveries: "वितरण",
    assignments: "मेरे कार्य",
    intakeCapacity: "क्षमता",
    operations: "नियंत्रण",
    auditTrail: "इतिहास",
    notifications: "सूचनाएँ",
    quickTestFlow: "डेमो टेस्ट करें",

    AVAILABLE: "उपलब्ध",
    RESERVED: "आरक्षित",
    ASSIGNED: "राइडर सौंपा गया",
    ACKNOWLEDGED: "स्वीकृत",
    PICKED_UP: "उठा लिया",
    IN_TRANSIT: "रास्ते में",
    DELIVERED: "पहुँचा दिया गया",
    PARTIALLY_DELIVERED: "आंशिक रूप से प्राप्त",
    BLOCKED: "मदद चाहिए",
    REDIRECT_PENDING: "मार्ग परिवर्तन",
    CANCELLED: "रद्द",
    RESERVATION_EXPIRED: "समय समाप्त",
    FAILED: "विफल",

    cooked_meals: "पका हुआ भोजन",
    dry_rations: "सूखा अनाज और दालें",
    fresh_produce: "ताजे फल और सब्जियाँ",
    packaged_food: "पैक्ड भोजन",
    baby_essentials: "शिशु आहार और डायपर",
    hygiene_kits: "स्वच्छता किट",
    medical_supplies: "प्राथमिक उपचार व दवाइयाँ",
    blankets_warmth: "कंबल और गर्म कपड़े",

    ambient: "सामान्य तापमान",
    hot_holding: "गर्म रखें (>60°C)",
    cold_refrigerated: "ठंडा रखें (<5°C)",
    dry_ventilated: "सूखा रखें",

    submit: "भोजन पोस्ट करें",
    cancel: "रद्द करें",
    confirm: "पुष्टि करें",
    saveChanges: "सहेजें",
    acknowledge: "कार्य स्वीकार करें",
    decline: "अस्वीकार करें",
    confirmArrival: "मैं पहुँच गया हूँ",
    confirmPickup: "भोजन उठा लिया",
    reportDelay: "देरी की सूचना दें",
    requestHelp: "मदद माँगें",
    completeHandoff: "आश्रय को सौंपा गया",
    overrideAction: "बदलाव करें",
    reassign: "राइडर बदलें",
    redirectDestination: "आश्रय बदलें",
    inspectAndAccept: "जाँचें और स्वीकार करें",
    markAllRead: "सभी पढ़ा हुआ चिह्नित करें",
    viewDetails: "विवरण देखें",
    close: "बंद करें",
    filterByStatus: "फ़िल्टर",
    all: "सभी",
    searchPlaceholder: "आईडी, स्थान या भोजन खोजें...",
    reason: "कारण",
    notes: "टिप्पणी",

    batchTitle: "भोजन का नाम",
    category: "श्रेणी",
    quantity: "मात्रा",
    unit: "इकाई",
    prepTime: "तैयार होने का समय",
    safeUseDeadline: "खराब होने की समय-सीमा",
    storageCondition: "भंडारण",
    pickupAddress: "पिकअप का पता",
    pickupLandmark: "लैंडमार्क",
    contactPhone: "फ़ोन नंबर",
    specialInstructions: "विशेष निर्देश",
    dietaryPreference: "आहार प्रकार",

    totalBeds: "कुल बिस्तर",
    currentOccupancy: "भरे हुए बिस्तर",
    availableIntake: "खाली बिस्तर",
    cleanWater: "पीने का स्वच्छ पानी",
    cookingFuel: "रसोई ईंधन उपलब्ध",
    receivingHours: "समय",
    tempClosure: "प्रवेश रोकें",
    closureNotice: "यह आश्रय अभी नया भोजन स्वीकार नहीं कर रहा है।",
    expectedDeliveries: "आने वाले वितरण",
    receivedDeliveries: "प्राप्त भोजन",
    inspectBatch: "जाँच करें",
    acceptedQty: "स्वीकृत मात्रा",
    rejectedQty: "अस्वीकृत मात्रा",
    qualityCondition: "गुणवत्ता जाँच",
    verifiedByStaff: "कर्मचारी का नाम",

    noAssignments: "कोई सक्रिय कार्य नहीं",
    noAssignmentsDesc: "नक्शे पर आसपास की डिलीवरी देखें या प्रेषण की प्रतीक्षा करें।",
    activeMission: "सक्रिय डिलीवरी",
    pickupFrom: "पिकअप स्थान",
    deliverTo: "गंतव्य आश्रय",
    deadline: "अंतिम समय",
    delayMinutes: "देरी (मिनट)",

    overviewStats: "परिचालन स्थिति",
    totalActiveBatches: "सक्रिय बैच",
    activeRidersField: "रास्ते में राइडर्स",
    approachingDeadlines: "जल्द समाप्त (<2 घंटे)",
    blockedDeliveries: "मदद चाहिए",
    totalMealsRescued: "आज बचाए गए भोजन",
    dispatchQueue: "लाइव वितरण",
    shelterCapacityMatrix: "आश्रय उपलब्धता",
    auditLogHistory: "गतिविधि इतिहास",
    assignRider: "राइडर सौंपें",
    selectShelter: "आश्रय चुनें",
    overrideReasonPrompt: "बदलाव का कारण",

    testFlowTitle: "संपूर्ण डिलीवरी टेस्ट करें",
    testFlowDesc: "देखें कि भोजन दाता से राइडर और फिर आश्रय तक कैसे पहुँचता है।",
    resetDemoData: "डेटा रीसेट करें",
    resetSuccess: "डिफ़ॉल्ट डेटा पर रीसेट हो गया।",
  },

  mr: {
    appName: "AIDFLOW",
    appTagline: "अतिरिक्त अन्न आणि मदत गरजूंपर्यंत पोहोचवा",
    selectRole: "तुमची भूमिका निवडा",
    roleSelectionDesc: "तुम्ही कशी मदत करू इच्छिता ते निवडा.",
    switchRole: "भूमिका बदला",
    currentRole: "सध्याची भूमिका",
    logout: "भूमिका निवडीवर परत",
    demoModeNotice: "थेट प्रात्यक्षिक (Demo)",

    donor: "अन्नदाता (Donor)",
    donorDesc: "स्वयंपाकघरे आणि अन्नदान करणाऱ्या संस्था.",
    rider: "रायडर (Rider)",
    riderDesc: "अन्न संकलित करून पोहोचवणारे स्वयंसेवक.",
    shelter: "निवारा (Shelter)",
    shelterDesc: "अन्न आणि मदत स्वीकारणारी आश्रयस्थाने.",
    coordinator: "समन्वयक (Coordinator)",
    coordinatorDesc: "नियंत्रण कक्ष जे वितरणावर देखरेख ठेवते.",

    registerRole: "नोंदणी करा",
    registerAsShelter: "निवारा म्हणून नोंदणी करा",
    registerAsRider: "रायडर म्हणून नोंदणी करा",
    registerAsCoordinator: "समन्वयक म्हणून नोंदणी करा",
    crossRoleBanner: "आश्रयासाठी अन्न हवे आहे किंवा वितरण करायचे आहे? येथे नोंदणी करा",

    impactScore: "प्रभाव गुण",
    riderScore: "रायडर गुण",
    shelterScore: "निवारा गुण",
    matchScore: "प्राधान्य गुण",

    nearbyDeliveries: "जवळपासची कामे",
    mapView: "नकाशा दृश्य (Map)",
    listView: "यादी दृश्य (List)",
    acceptDelivery: "काम स्वीकारा",
    distanceAway: "किमी दूर",

    dashboard: "मुख्यपृष्ठ",
    batches: "अन्न बॅच",
    newDonation: "अन्न नोंदवा",
    deliveries: "वितरण",
    assignments: "माझी कामे",
    intakeCapacity: "क्षमता",
    operations: "नियंत्रण",
    auditTrail: "इतिहास",
    notifications: "सूचना",
    quickTestFlow: "डेमो तपासा",

    AVAILABLE: "उपलब्ध",
    RESERVED: "आरक्षित",
    ASSIGNED: "रायडर नियुक्त",
    ACKNOWLEDGED: "स्वीकृत",
    PICKED_UP: "संकलित केले",
    IN_TRANSIT: "वाटेत आहे",
    DELIVERED: "पोहोचवले",
    PARTIALLY_DELIVERED: "अंशतः प्राप्त",
    BLOCKED: "मदत हवी",
    REDIRECT_PENDING: "मार्ग बदलत आहे",
    CANCELLED: "रद्द",
    RESERVATION_EXPIRED: "मुदत संपली",
    FAILED: "अयशस्वी",

    cooked_meals: "शिजवलेले अन्न",
    dry_rations: "धान्य आणि डाळी",
    fresh_produce: "ताजी फळे व भाज्या",
    packaged_food: "पॅक केलेले अन्न",
    baby_essentials: "लहान मुलांचे अन्न व डायपर",
    hygiene_kits: "स्वच्छता किट",
    medical_supplies: "प्रथमोपचार साहित्य",
    blankets_warmth: "चादरी आणि उबदार कपडे",

    ambient: "सामान्य तापमान",
    hot_holding: "गरम ठेवा (>60°C)",
    cold_refrigerated: "थंड ठेवा (<5°C)",
    dry_ventilated: "कोरडे ठेवा",

    submit: "अन्न नोंदवा",
    cancel: "रद्द करा",
    confirm: "खात्री करा",
    saveChanges: "जतन करा",
    acknowledge: "काम स्वीकारा",
    decline: "नाकारा",
    confirmArrival: "मी पोहोचलो आहे",
    confirmPickup: "अन्न संकलित केले",
    reportDelay: "उशीर कळवा",
    requestHelp: "मदत हवी",
    completeHandoff: "निवार्याला सुपूर्द केले",
    overrideAction: "बदल करा",
    reassign: "रायडर बदला",
    redirectDestination: "निवारा बदला",
    inspectAndAccept: "तपासून स्वीकारा",
    markAllRead: "सर्व वाचले म्हणून खूण करा",
    viewDetails: "तपशील पहा",
    close: "बंद करा",
    filterByStatus: "फिल्टर",
    all: "सर्व",
    searchPlaceholder: "आयडी किंवा ठिकाण शोधा...",
    reason: "कारण",
    notes: "नोंदी",

    batchTitle: "अन्नाचे नाव",
    category: "प्रकार",
    quantity: "प्रमाण",
    unit: "एकक",
    prepTime: "तयार केल्याची वेळ",
    safeUseDeadline: "अंतिम मुदत",
    storageCondition: "साठवणूक",
    pickupAddress: "संकलनाचा पत्ता",
    pickupLandmark: "लँडमार्क",
    contactPhone: "फोन नंबर",
    specialInstructions: "विशेष सूचना",
    dietaryPreference: "आहार प्रकार",

    totalBeds: "एकूण खाटा",
    currentOccupancy: "भरलेल्या खाटा",
    availableIntake: "रिकाम्या खाटा",
    cleanWater: "स्वच्छ पिण्याचे पाणी",
    cookingFuel: "इंधन उपलब्ध",
    receivingHours: "वेळ",
    tempClosure: "प्रवेश थांबवा",
    closureNotice: "हे आश्रयस्थान सध्या नवीन मदत स्वीकारत नाही.",
    expectedDeliveries: "अपेक्षित आवक",
    receivedDeliveries: "मिळालेले अन्न",
    inspectBatch: "तपासणी करा",
    acceptedQty: "स्वीकारलेले प्रमाण",
    rejectedQty: "नाकारलेले प्रमाण",
    qualityCondition: "गुणवत्ता तपासणी",
    verifiedByStaff: "कर्मचाऱ्याचे नाव",

    noAssignments: "सध्या कोणतेही काम नाही",
    noAssignmentsDesc: "नकाशावर जवळपासची कामे शोधा किंवा संदेशाची वाट पहा.",
    activeMission: "सक्रिय काम",
    pickupFrom: "संकलन ठिकाण",
    deliverTo: "गंतव्य निवारा",
    deadline: "अंतिम मुदत",
    delayMinutes: "विलंब (मिनिटे)",

    overviewStats: "परिचालन सारांश",
    totalActiveBatches: "सक्रिय बॅचेस",
    activeRidersField: "वाटेत असलेले रायडर्स",
    approachingDeadlines: "लवकर संपणारे (<2 तास)",
    blockedDeliveries: "मदत हवी",
    totalMealsRescued: "आज वाचवलेले अन्न",
    dispatchQueue: "थेट वितरण",
    shelterCapacityMatrix: "निवारा उपलब्धता",
    auditLogHistory: "इतिहास",
    assignRider: "रायडर नेमा",
    selectShelter: "निवारा निवडा",
    overrideReasonPrompt: "बदलाचे कारण",

    testFlowTitle: "वितरण प्रक्रिया तपासा",
    testFlowDesc: "अन्न दात्याकडून रायडर आणि नंतर निवाऱ्यापर्यंत कसे पोहोचते ते पहा.",
    resetDemoData: "डेटा पूर्ववत करा",
    resetSuccess: "मूळ डेटा पूर्ववत केला.",
  }
};
