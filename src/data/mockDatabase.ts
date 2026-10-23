import {
  AidBatch,
  Delivery,
  ShelterProfile,
  RiderProfile,
  UserIdentity,
  InAppNotification,
  DeliveryStatus,
  RoleType,
  AuditLogEntry,
  WeatherCondition,
  OfflineQueuedAction,
} from '../types';
import { evaluateHardSafetyAndScore } from './safetyEngine';

const STORAGE_KEY_PREFIX = 'aidflow_store_v2_';

export const DEMO_IDENTITIES: Record<RoleType, UserIdentity> = {
  donor: {
    id: 'user-donor-01',
    name: 'Pooja Hegde',
    role: 'donor',
    organization: 'Annapurna Community Kitchen, Dadar',
    phone: '+91 98201 44321',
    associatedId: 'donor-01',
  },
  rider: {
    id: 'user-rider-01',
    name: 'Rajesh Kumar',
    role: 'rider',
    organization: 'Civic Two-Wheeler Volunteer Fleet',
    phone: '+91 98190 77654',
    associatedId: 'rider-01',
  },
  shelter: {
    id: 'user-shelter-01',
    name: 'Dr. Suresh Patil (Superintendent)',
    role: 'shelter',
    organization: 'Asha Sadan Night Shelter, Chembur',
    phone: '+91 98332 11987',
    associatedId: 'shelter-01',
  },
  coordinator: {
    id: 'user-coord-01',
    name: 'Vikram Mehta',
    role: 'coordinator',
    organization: 'Central Civic Operations Command',
    phone: '+91 98200 99001',
    associatedId: 'coordinator-01',
  },
};

const INITIAL_SHELTERS: ShelterProfile[] = [
  {
    id: 'shelter-01',
    name: 'Asha Sadan Night Shelter',
    address: 'Plot 44, R.C. Marg, Chembur Colony, Mumbai 400074',
    zone: 'East Zone - Chembur',
    coordinates: { lat: 19.0622, lng: 72.8973 },
    contactPerson: 'Dr. Suresh Patil',
    phone: '+91 98332 11987',
    totalBedCapacity: 140,
    currentOccupants: 115,
    mealIntakeCapacity: 250,
    acceptsPerishables: true,
    coldStorageAvailable: true,
    cleanWaterAvailable: true,
    cookingFuelAvailable: true,
    vegOnly: true,
    medicalClearanceStaffAvailable: true,
    receivingHours: '06:00 - 23:30',
    isTemporarilyClosed: false,
    urgentNeeds: ['Hot Cooked Meals', 'Dry Grains', 'Blankets'],
  },
  {
    id: 'shelter-02',
    name: 'Dharavi Community Relief Refuge',
    address: '90 Feet Road, Near Matunga Labour Camp, Dharavi, Mumbai 400017',
    zone: 'Central Zone - Dharavi',
    coordinates: { lat: 19.0434, lng: 72.855 },
    contactPerson: 'Fatima Sheikh',
    phone: '+91 98204 88712',
    totalBedCapacity: 220,
    currentOccupants: 198,
    mealIntakeCapacity: 450,
    acceptsPerishables: true,
    coldStorageAvailable: false,
    cleanWaterAvailable: true,
    cookingFuelAvailable: false,
    vegOnly: false,
    medicalClearanceStaffAvailable: true,
    receivingHours: '24 Hours Open',
    isTemporarilyClosed: false,
    urgentNeeds: ['Cooked Hot Food (Emergency)', 'Baby Formula', 'Drinking Water'],
  },
  {
    id: 'shelter-03',
    name: 'Bandra Homeless Care & Transit Home',
    address: 'St. Martin Road, Off Hill Road, Bandra West, Mumbai 400050',
    zone: 'West Zone - Bandra',
    coordinates: { lat: 19.0596, lng: 72.8295 },
    contactPerson: 'David D’Souza',
    phone: '+91 98191 33456',
    totalBedCapacity: 85,
    currentOccupants: 78,
    mealIntakeCapacity: 160,
    acceptsPerishables: true,
    coldStorageAvailable: true,
    cleanWaterAvailable: true,
    cookingFuelAvailable: true,
    vegOnly: true,
    medicalClearanceStaffAvailable: false,
    receivingHours: '07:00 - 22:00',
    isTemporarilyClosed: false,
    urgentNeeds: ['Medical / Hygiene Kits', 'Warm Sweaters'],
  },
  {
    id: 'shelter-04',
    name: 'Byculla Women & Children Shelter',
    address: 'Sankli Street, Near Byculla Station East, Mumbai 400008',
    zone: 'South Central - Byculla',
    coordinates: { lat: 18.975, lng: 72.8295 },
    contactPerson: 'Meenakshi Iyer',
    phone: '+91 98202 55432',
    totalBedCapacity: 95,
    currentOccupants: 90,
    mealIntakeCapacity: 180,
    acceptsPerishables: true,
    coldStorageAvailable: true,
    cleanWaterAvailable: true,
    cookingFuelAvailable: true,
    vegOnly: true,
    medicalClearanceStaffAvailable: true,
    receivingHours: '06:00 - 21:00',
    isTemporarilyClosed: false,
    urgentNeeds: ['Baby Essentials', 'Milk & Dairy', 'Sanitary Napkins'],
  },
];

const INITIAL_RIDERS: RiderProfile[] = [
  {
    id: 'rider-01',
    name: 'Rajesh Kumar',
    phone: '+91 98190 77654',
    vehicleType: 'Cargo Motorcycle (40-Meal Insulated Box) #MH-02-EE-4122',
    carryingCapacity: 40,
    currentCommittedLoad: 0,
    zone: 'Bandra / Dadar Cluster',
    coordinates: { lat: 19.021, lng: 72.842 },
    status: 'active',
    activeDeliveryIds: [],
    completedDeliveriesCount: 47,
  },
  {
    id: 'rider-02',
    name: 'Amit Shinde',
    phone: '+91 98210 55112',
    vehicleType: 'Heavy E-Cargo Bike (60-Meal Rack) #MH-01-BK-8890',
    carryingCapacity: 60,
    currentCommittedLoad: 0,
    zone: 'Chembur / Kurla Cluster',
    coordinates: { lat: 19.058, lng: 72.889 },
    status: 'active',
    activeDeliveryIds: [],
    completedDeliveriesCount: 62,
  },
  {
    id: 'rider-03',
    name: 'Priya Gaikwad',
    phone: '+91 98330 66789',
    vehicleType: 'Utility Dispatch Van (80-Meal Insulated Bins) #MH-03-CD-1123',
    carryingCapacity: 80,
    currentCommittedLoad: 0,
    zone: 'Central Transit Dispatches',
    coordinates: { lat: 19.041, lng: 72.861 },
    status: 'active',
    activeDeliveryIds: [],
    completedDeliveriesCount: 89,
  },
  {
    id: 'rider-04',
    name: 'Sunil Mane',
    phone: '+91 98192 44331',
    vehicleType: 'High-Volume Cargo Van (100-Meal Capacity) #MH-04-AX-5510',
    carryingCapacity: 100,
    currentCommittedLoad: 0,
    zone: 'South / Harbor Cluster',
    coordinates: { lat: 18.995, lng: 72.835 },
    status: 'active',
    activeDeliveryIds: [],
    completedDeliveriesCount: 34,
  },
];

const hoursFromNow = (h: number): string => new Date(Date.now() + h * 3600 * 1000).toISOString();
const hoursAgo = (h: number): string => new Date(Date.now() - h * 3600 * 1000).toISOString();

const INITIAL_BATCHES: AidBatch[] = [
  {
    id: 'batch-large-180',
    batchCode: 'BF-2026-180',
    donorId: 'donor-01',
    donorName: 'Pooja Hegde',
    donorOrganization: 'Annapurna Community Kitchen, Dadar',
    donorPhone: '+91 98201 44321',
    title: 'Surplus Afternoon Lunch Batch (Hot Dal, Khichdi & Mixed Sabzi)',
    category: 'cooked_meals',
    quantityValue: 180, // 180 meals total for capacity-aware split test
    quantityUnit: 'meals',
    allocatedQuantity: 0,
    collectedQuantity: 0,
    deliveredQuantity: 0,
    rejectedQuantity: 0,
    remainingQuantity: 180,
    prepTime: hoursAgo(1),
    safeUseDeadline: hoursFromNow(4),
    storageCondition: 'hot_holding',
    pickupAddress: 'Annapurna Kitchen, Senapati Bapat Marg, Dadar West, Mumbai 400028',
    pickupLandmark: 'Loading Bay Gate #1',
    coordinates: { lat: 19.0178, lng: 72.8478 },
    specialInstructions: 'Prepared fresh in thermal canisters. Suitable for multi-rider split dispatch.',
    dietaryType: 'pure_veg',
    createdAt: hoursAgo(1),
    status: 'AVAILABLE',
    linkedDeliveryIds: [],
  },
  {
    id: 'batch-02',
    batchCode: 'BF-2026-082',
    donorId: 'donor-01',
    donorName: 'Pooja Hegde',
    donorOrganization: 'Annapurna Community Kitchen, Dadar',
    donorPhone: '+91 98201 44321',
    title: 'Fresh Chapati Packs & Aloo Matar',
    category: 'cooked_meals',
    quantityValue: 75,
    quantityUnit: 'meals',
    allocatedQuantity: 0,
    collectedQuantity: 0,
    deliveredQuantity: 0,
    rejectedQuantity: 0,
    remainingQuantity: 75,
    prepTime: hoursAgo(0.5),
    safeUseDeadline: hoursFromNow(5),
    storageCondition: 'ambient',
    pickupAddress: 'Annapurna Kitchen, Senapati Bapat Marg, Dadar West, Mumbai 400028',
    pickupLandmark: 'Kitchen loading bay #1',
    coordinates: { lat: 19.0178, lng: 72.8478 },
    specialInstructions: 'Freshly packed in foil bags. Consume within 5 hours.',
    dietaryType: 'pure_veg',
    createdAt: hoursAgo(0.5),
    status: 'AVAILABLE',
    linkedDeliveryIds: [],
  },
  {
    id: 'batch-medical-01',
    batchCode: 'BF-2026-MED',
    donorId: 'donor-01',
    donorName: 'Pooja Hegde',
    donorOrganization: 'Annapurna Community Kitchen, Dadar',
    donorPhone: '+91 98201 44321',
    title: 'First-Aid Wound Dressings & Disinfectant Kits',
    category: 'medical_supplies',
    isMedicalSupply: true,
    quantityValue: 30,
    quantityUnit: 'kits',
    allocatedQuantity: 0,
    collectedQuantity: 0,
    deliveredQuantity: 0,
    rejectedQuantity: 0,
    remainingQuantity: 30,
    prepTime: hoursAgo(4),
    safeUseDeadline: hoursFromNow(720),
    storageCondition: 'dry_ventilated',
    pickupAddress: 'Annapurna Kitchen Medical Dispensary, Dadar West',
    pickupLandmark: 'Emergency First-Aid Store',
    coordinates: { lat: 19.0178, lng: 72.8478 },
    specialInstructions: 'Requires certified medical intake clearance staff upon delivery handoff.',
    dietaryType: 'universal',
    createdAt: hoursAgo(4),
    status: 'AVAILABLE',
    linkedDeliveryIds: [],
  },
];

const INITIAL_WEATHER: WeatherCondition = {
  isSimulatedAlert: false,
  severity: 'normal',
  condition: 'Partly Cloudy · High Humidity',
  temperature: 31,
  rainfallMm: 2.4,
  windSpeedKmh: 14,
  affectedSectors: [],
  forecastPeriod: 'Next 6 Hours (Mumbai Metropolitan Area)',
  lastUpdated: new Date().toISOString(),
  source: 'Civic Meteorological Radar (Simulated Demo Environment)',
  warningMessage: undefined,
};

class MockDatabase {
  private batches: AidBatch[] = [];
  private deliveries: Delivery[] = [];
  private shelters: ShelterProfile[] = [];
  private riders: RiderProfile[] = [];
  private notifications: InAppNotification[] = [];
  private weather: WeatherCondition = INITIAL_WEATHER;
  private offlineQueue: OfflineQueuedAction[] = [];
  private isOnlineState: boolean = true;
  private listeners: Set<() => void> = new Set();
  private timeoutInterval: any = null;

  constructor() {
    this.loadFromStorage();
    // Run authoritative reservation expiration check every 10 seconds
    if (typeof window !== 'undefined') {
      this.timeoutInterval = setInterval(() => {
        this.checkAndExpireReservations();
      }, 10000);
    }
  }

  private loadFromStorage() {
    try {
      const storedBatches = localStorage.getItem(STORAGE_KEY_PREFIX + 'batches');
      const storedDeliveries = localStorage.getItem(STORAGE_KEY_PREFIX + 'deliveries');
      const storedShelters = localStorage.getItem(STORAGE_KEY_PREFIX + 'shelters');
      const storedRiders = localStorage.getItem(STORAGE_KEY_PREFIX + 'riders');
      const storedNotifs = localStorage.getItem(STORAGE_KEY_PREFIX + 'notifications');
      const storedWeather = localStorage.getItem(STORAGE_KEY_PREFIX + 'weather');
      const storedQueue = localStorage.getItem(STORAGE_KEY_PREFIX + 'offline_queue');

      if (storedBatches && storedDeliveries && storedShelters && storedRiders) {
        this.batches = JSON.parse(storedBatches);
        this.deliveries = JSON.parse(storedDeliveries);
        this.shelters = JSON.parse(storedShelters);
        this.riders = JSON.parse(storedRiders);
        this.notifications = storedNotifs ? JSON.parse(storedNotifs) : [];
        this.weather = storedWeather ? JSON.parse(storedWeather) : INITIAL_WEATHER;
        this.offlineQueue = storedQueue ? JSON.parse(storedQueue) : [];
      } else {
        this.resetToDefaults();
      }
    } catch (err) {
      console.warn('Error reading mock database, restoring clean defaults', err);
      this.resetToDefaults();
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'batches', JSON.stringify(this.batches));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'deliveries', JSON.stringify(this.deliveries));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'shelters', JSON.stringify(this.shelters));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'riders', JSON.stringify(this.riders));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'notifications', JSON.stringify(this.notifications));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'weather', JSON.stringify(this.weather));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'offline_queue', JSON.stringify(this.offlineQueue));
    } catch (err) {
      console.error('Failed to persist mock database', err);
    }
    this.notify();
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  public resetToDefaults() {
    this.batches = JSON.parse(JSON.stringify(INITIAL_BATCHES));
    this.deliveries = [];
    this.shelters = JSON.parse(JSON.stringify(INITIAL_SHELTERS));
    this.riders = JSON.parse(JSON.stringify(INITIAL_RIDERS));
    this.notifications = [];
    this.weather = JSON.parse(JSON.stringify(INITIAL_WEATHER));
    this.offlineQueue = [];
    this.isOnlineState = true;
    this.persist();
  }

  // --- Read Operations ---
  public getBatches(): AidBatch[] {
    return [...this.batches];
  }

  public getDeliveries(): Delivery[] {
    return [...this.deliveries];
  }

  public getShelters(): ShelterProfile[] {
    return [...this.shelters];
  }

  public getRiders(): RiderProfile[] {
    return [...this.riders];
  }

  public getNotifications(): InAppNotification[] {
    return [...this.notifications];
  }

  public getWeather(): WeatherCondition {
    return { ...this.weather };
  }

  public getOfflineQueue(): OfflineQueuedAction[] {
    return [...this.offlineQueue];
  }

  public isOnline(): boolean {
    return this.isOnlineState;
  }

  public setOnline(status: boolean) {
    this.isOnlineState = status;
    this.notify();
  }

  public getDeliveryById(id: string): Delivery | undefined {
    return this.deliveries.find((d) => d.id === id);
  }

  public getBatchById(id: string): AidBatch | undefined {
    return this.batches.find((b) => b.id === id);
  }

  public getShelterById(id: string): ShelterProfile | undefined {
    return this.shelters.find((s) => s.id === id);
  }

  public getRiderById(id: string): RiderProfile | undefined {
    return this.riders.find((r) => r.id === id);
  }

  // --- Transactional Capacity-Aware Allocation with Split Support ---
  public allocateDelivery(
    batchId: string,
    riderId: string,
    shelterId: string,
    requestedQuantity: number,
    coordinator: UserIdentity
  ): { delivery: Delivery; safetyAssessment: any } {
    const batch = this.batches.find((b) => b.id === batchId);
    if (!batch) throw new Error('Aid batch not found.');

    const rider = this.riders.find((r) => r.id === riderId);
    if (!rider) throw new Error('Courier not found.');

    const shelter = this.shelters.find((s) => s.id === shelterId);
    if (!shelter) throw new Error('Destination shelter not found.');

    // Invariant Check 1: Quantity must be positive
    if (requestedQuantity <= 0) {
      throw new Error('Allocation quantity must be greater than zero.');
    }

    // Invariant Check 2: Concurrency-Safe Remaining Quantity Check
    if (requestedQuantity > batch.remainingQuantity) {
      throw new Error(
        `Allocation rejected: Requested ${requestedQuantity} exceeds batch remaining quantity (${batch.remainingQuantity} available). Double-booking prevented.`
      );
    }

    // Invariant Check 3: Courier Payload Capacity Check
    const availableRiderPayload = rider.carryingCapacity - rider.currentCommittedLoad;
    if (requestedQuantity > availableRiderPayload) {
      throw new Error(
        `Allocation rejected: Requested ${requestedQuantity} ${batch.quantityUnit} exceeds courier ${rider.name}'s remaining capacity (${availableRiderPayload} available).`
      );
    }

    // Hard Safety Assessment
    const safetyAssessment = evaluateHardSafetyAndScore(
      batch,
      shelter,
      rider,
      requestedQuantity
    );

    if (!safetyAssessment.isEligible) {
      throw new Error(
        `Dispatch Blocked by Hard Safety Policy: ${safetyAssessment.hardBlockReason}`
      );
    }

    // Transactional Update
    batch.remainingQuantity -= requestedQuantity;
    batch.allocatedQuantity += requestedQuantity;
    batch.status = batch.remainingQuantity === 0 ? 'ASSIGNED' : 'AVAILABLE';

    rider.currentCommittedLoad += requestedQuantity;

    const deliveryId = `del-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const deliveryCode = `DEL-${Math.floor(1000 + Math.random() * 9000)}`;
    const reservationDeadline = new Date(Date.now() + 300 * 1000).toISOString(); // 5 min timeout

    const delivery: Delivery = {
      id: deliveryId,
      deliveryCode,
      batchId: batch.id,
      batchTitle: batch.title,
      category: batch.category,
      isMedicalSupply: batch.isMedicalSupply,
      quantityValue: requestedQuantity,
      quantityUnit: batch.quantityUnit,
      donorId: batch.donorId,
      donorName: batch.donorName,
      donorOrganization: batch.donorOrganization,
      donorPhone: batch.donorPhone,
      pickupAddress: batch.pickupAddress,
      pickupLandmark: batch.pickupLandmark,
      pickupCoordinates: batch.coordinates,
      riderId: rider.id,
      riderName: rider.name,
      riderPhone: rider.phone,
      riderVehicle: rider.vehicleType,
      riderCapacity: rider.carryingCapacity,
      riderCoordinates: rider.coordinates,
      shelterId: shelter.id,
      shelterName: shelter.name,
      shelterContactPerson: shelter.contactPerson,
      shelterPhone: shelter.phone,
      destinationAddress: shelter.address,
      destinationCoordinates: shelter.coordinates,
      status: 'ASSIGNED',
      safeUseDeadline: batch.safeUseDeadline,
      handlingInstructions: batch.specialInstructions,
      storageCondition: batch.storageCondition,
      reservationDeadline,
      acknowledgementWindowSeconds: 300,
      createdAt: new Date().toISOString(),
      assignedAt: new Date().toISOString(),
      safetyAssessment,
      auditLogs: [
        {
          id: `log-${Date.now()}-1`,
          deliveryId,
          fromStatus: null,
          toStatus: 'ASSIGNED',
          changedByRole: 'coordinator',
          changedByName: coordinator.name,
          changedById: coordinator.id,
          timestamp: new Date().toISOString(),
          reason: `Capacity-aware allocation: ${requestedQuantity} ${batch.quantityUnit} assigned to ${rider.name}. Safety score: ${safetyAssessment.prioritizationScore}/100.`,
        },
      ],
    };

    batch.linkedDeliveryIds.push(deliveryId);
    rider.activeDeliveryIds.push(deliveryId);

    this.deliveries.unshift(delivery);

    // Notify Rider
    this.addNotification({
      recipientRole: 'rider',
      recipientEntityId: rider.id,
      title: `New Assignment ${deliveryCode} (${requestedQuantity} ${batch.quantityUnit})`,
      message: `Pickup ${requestedQuantity} ${batch.quantityUnit} from ${batch.donorOrganization} for ${shelter.name}. Acknowledge within 5 minutes.`,
      deliveryId,
      deliveryCode,
      severity: 'info',
    });

    // Notify Coordinator
    this.addNotification({
      recipientRole: 'coordinator',
      title: `Dispatch Leg ${deliveryCode} Allocated`,
      message: `${requestedQuantity} ${batch.quantityUnit} allocated to ${rider.name} (Batch remaining: ${batch.remainingQuantity}).`,
      deliveryId,
      deliveryCode,
      severity: 'info',
    });

    this.persist();
    return { delivery, safetyAssessment };
  }

  // --- Authoritative Reservation Timeout Recovery Engine ---
  public checkAndExpireReservations(): number {
    const now = Date.now();
    let expiredCount = 0;

    this.deliveries.forEach((del) => {
      // Only unacknowledged ASSIGNED deliveries are subject to reservation timeout
      if (del.status === 'ASSIGNED') {
        const deadline = new Date(del.reservationDeadline).getTime();
        if (now > deadline) {
          this.expireReservation(del, 'System reservation timeout: Courier did not acknowledge within deadline.');
          expiredCount++;
        }
      }
    });

    if (expiredCount > 0) {
      this.persist();
    }
    return expiredCount;
  }

  public triggerManualTimeoutSweep(deliveryId?: string): number {
    if (deliveryId) {
      const del = this.deliveries.find((d) => d.id === deliveryId);
      if (del && del.status === 'ASSIGNED') {
        this.expireReservation(del, 'Simulated reservation timeout check triggered by coordinator.');
        this.persist();
        return 1;
      }
      return 0;
    }
    return this.checkAndExpireReservations();
  }

  private expireReservation(del: Delivery, reason: string) {
    const fromStatus = del.status;
    del.status = 'RESERVATION_EXPIRED';
    del.isExpired = true;

    // RELEASE ONLY UNCOLLECTED STOCK BACK TO BATCH
    const batch = this.batches.find((b) => b.id === del.batchId);
    if (batch) {
      batch.allocatedQuantity = Math.max(0, batch.allocatedQuantity - del.quantityValue);
      batch.remainingQuantity += del.quantityValue;
      if (batch.status === 'ASSIGNED' && batch.remainingQuantity > 0) {
        batch.status = 'AVAILABLE';
      }
    }

    // Release committed load from courier
    if (del.riderId) {
      const rider = this.riders.find((r) => r.id === del.riderId);
      if (rider) {
        rider.currentCommittedLoad = Math.max(0, rider.currentCommittedLoad - del.quantityValue);
        rider.activeDeliveryIds = rider.activeDeliveryIds.filter((id) => id !== del.id);
      }
    }

    del.auditLogs.push({
      id: `log-${Date.now()}-exp`,
      deliveryId: del.id,
      fromStatus,
      toStatus: 'RESERVATION_EXPIRED',
      changedByRole: 'coordinator',
      changedByName: 'Automated Recovery Engine',
      changedById: 'system-timer',
      timestamp: new Date().toISOString(),
      reason: `${reason} ${del.quantityValue} uncollected units safely recovered and returned to available stock pool.`,
    });

    // Alert Coordinator
    this.addNotification({
      recipientRole: 'coordinator',
      title: `ALERT: Reservation Expired (${del.deliveryCode})`,
      message: `Courier failed to acknowledge task ${del.deliveryCode}. ${del.quantityValue} units released back to donor batch stock.`,
      deliveryId: del.id,
      deliveryCode: del.deliveryCode,
      severity: 'alert',
    });

    // Alert Rider that reservation timed out
    if (del.riderId) {
      this.addNotification({
        recipientRole: 'rider',
        recipientEntityId: del.riderId,
        title: `Reservation ${del.deliveryCode} Expired`,
        message: 'Assignment acknowledgement window closed. Cargo reservation was reclaimed by central command.',
        deliveryId: del.id,
        deliveryCode: del.deliveryCode,
        severity: 'warning',
      });
    }
  }

  // --- Rider Acknowledge (Protected against stale tab revival) ---
  public acknowledgeAssignment(deliveryId: string, rider: UserIdentity): boolean {
    const del = this.deliveries.find((d) => d.id === deliveryId && d.riderId === rider.associatedId);
    if (!del) throw new Error('Delivery not found or not allocated to this courier.');

    // Prevent revival of expired reservation
    if (del.status === 'RESERVATION_EXPIRED') {
      throw new Error(
        'Action rejected: This reservation expired and its cargo was already reclaimed by central dispatch. Cannot revive stale reservation.'
      );
    }

    // Check if timeout has elapsed right now
    if (Date.now() > new Date(del.reservationDeadline).getTime()) {
      this.expireReservation(del, 'Timeout check triggered on acknowledgement attempt.');
      this.persist();
      throw new Error(
        'Action rejected: Acknowledgement deadline passed. Cargo reservation has timed out and returned to available pool.'
      );
    }

    if (del.status !== 'ASSIGNED') {
      throw new Error(`Cannot acknowledge delivery in status ${del.status}`);
    }

    del.status = 'ACKNOWLEDGED';
    del.acknowledgedAt = new Date().toISOString();

    del.auditLogs.push({
      id: `log-${Date.now()}`,
      deliveryId: del.id,
      fromStatus: 'ASSIGNED',
      toStatus: 'ACKNOWLEDGED',
      changedByRole: 'rider',
      changedByName: rider.name,
      changedById: rider.id,
      timestamp: new Date().toISOString(),
      reason: 'Courier acknowledged assignment within reservation window.',
    });

    this.addNotification({
      recipientRole: 'coordinator',
      title: `Assignment ${del.deliveryCode} Acknowledged`,
      message: `Courier ${rider.name} accepted route for ${del.shelterName}.`,
      deliveryId: del.id,
      deliveryCode: del.deliveryCode,
      severity: 'success',
    });

    this.persist();
    return true;
  }

  // --- Rider Decline Assignment ---
  public declineAssignment(deliveryId: string, reason: string, rider: UserIdentity): boolean {
    const del = this.deliveries.find((d) => d.id === deliveryId && d.riderId === rider.associatedId);
    if (!del) throw new Error('Delivery not found.');

    const fromStatus = del.status;
    del.status = 'AVAILABLE';
    const oldRiderName = del.riderName;
    del.riderId = undefined;
    del.riderName = undefined;
    del.riderPhone = undefined;
    del.riderVehicle = undefined;

    // Release courier committed load and return allocated balance to batch
    const riderProfile = this.riders.find((r) => r.id === rider.associatedId);
    if (riderProfile) {
      riderProfile.currentCommittedLoad = Math.max(0, riderProfile.currentCommittedLoad - del.quantityValue);
      riderProfile.activeDeliveryIds = riderProfile.activeDeliveryIds.filter((id) => id !== del.id);
    }

    const batch = this.batches.find((b) => b.id === del.batchId);
    if (batch) {
      batch.allocatedQuantity = Math.max(0, batch.allocatedQuantity - del.quantityValue);
      batch.remainingQuantity += del.quantityValue;
      batch.status = 'AVAILABLE';
    }

    del.auditLogs.push({
      id: `log-${Date.now()}-decl`,
      deliveryId: del.id,
      fromStatus,
      toStatus: 'AVAILABLE',
      changedByRole: 'rider',
      changedByName: rider.name,
      changedById: rider.id,
      timestamp: new Date().toISOString(),
      reason: `Courier declined assignment: ${reason}. Quantity returned to available pool.`,
    });

    this.addNotification({
      recipientRole: 'coordinator',
      title: `ALERT: Courier Declined Task (${del.deliveryCode})`,
      message: `${oldRiderName} declined task: "${reason}". Requires reallocation.`,
      deliveryId: del.id,
      deliveryCode: del.deliveryCode,
      severity: 'alert',
    });

    this.persist();
    return true;
  }

  // --- Rider Report Delay ---
  public reportDelay(deliveryId: string, delayMinutes: number, reason: string, rider: UserIdentity): boolean {
    const del = this.deliveries.find((d) => d.id === deliveryId && d.riderId === rider.associatedId);
    if (!del) throw new Error('Delivery not found.');

    del.estimatedDelayMinutes = delayMinutes;
    del.delayReason = reason;

    del.auditLogs.push({
      id: `log-${Date.now()}-delay`,
      deliveryId: del.id,
      fromStatus: del.status,
      toStatus: del.status,
      changedByRole: 'rider',
      changedByName: rider.name,
      changedById: rider.id,
      timestamp: new Date().toISOString(),
      reason: `Transit delay reported (+${delayMinutes}m): ${reason}`,
    });

    this.addNotification({
      recipientRole: 'coordinator',
      title: `Delay Reported: ${del.deliveryCode} (+${delayMinutes}m)`,
      message: `Courier ${rider.name}: "${reason}"`,
      deliveryId: del.id,
      deliveryCode: del.deliveryCode,
      severity: 'warning',
    });

    this.addNotification({
      recipientRole: 'shelter',
      recipientEntityId: del.shelterId,
      title: `Transit Delay Notice for ${del.deliveryCode}`,
      message: `Estimated arrival postponed by ${delayMinutes} minutes: "${reason}"`,
      deliveryId: del.id,
      deliveryCode: del.deliveryCode,
      severity: 'warning',
    });

    this.persist();
    return true;
  }

  // --- Rider Flag Blocked ---
  public flagBlocked(deliveryId: string, reason: string, rider: UserIdentity): boolean {
    const del = this.deliveries.find((d) => d.id === deliveryId && d.riderId === rider.associatedId);
    if (!del) throw new Error('Delivery not found.');

    const fromStatus = del.status;
    del.status = 'BLOCKED';
    del.blockedReason = reason;

    del.auditLogs.push({
      id: `log-${Date.now()}-block`,
      deliveryId: del.id,
      fromStatus,
      toStatus: 'BLOCKED',
      changedByRole: 'rider',
      changedByName: rider.name,
      changedById: rider.id,
      timestamp: new Date().toISOString(),
      reason: `Route blocked / Assistance requested: ${reason}`,
    });

    this.addNotification({
      recipientRole: 'coordinator',
      title: `CRITICAL ALERT: Courier Blocked on ${del.deliveryCode}`,
      message: `${rider.name} requested intervention: "${reason}"`,
      deliveryId: del.id,
      deliveryCode: del.deliveryCode,
      severity: 'alert',
    });

    this.persist();
    return true;
  }

  // --- Coordinator Cancel Delivery with Reason ---
  public cancelDeliveryByCoordinator(deliveryId: string, reason: string, coordinator: UserIdentity): boolean {
    if (!reason || reason.trim().length < 4) {
      throw new Error('A logged cancellation reason (min 4 characters) is required.');
    }

    const del = this.deliveries.find((d) => d.id === deliveryId);
    if (!del) throw new Error('Delivery not found.');

    const fromStatus = del.status;
    del.status = 'CANCELLED';
    del.cancellationReason = reason;

    // Release uncollected stock if not yet collected
    if (fromStatus === 'ASSIGNED' || fromStatus === 'ACKNOWLEDGED' || fromStatus === 'RESERVED') {
      const batch = this.batches.find((b) => b.id === del.batchId);
      if (batch) {
        batch.allocatedQuantity = Math.max(0, batch.allocatedQuantity - del.quantityValue);
        batch.remainingQuantity += del.quantityValue;
        if (batch.status === 'ASSIGNED' && batch.remainingQuantity > 0) {
          batch.status = 'AVAILABLE';
        }
      }
    }

    // Release courier load
    if (del.riderId) {
      const rider = this.riders.find((r) => r.id === del.riderId);
      if (rider) {
        rider.currentCommittedLoad = Math.max(0, rider.currentCommittedLoad - del.quantityValue);
        rider.activeDeliveryIds = rider.activeDeliveryIds.filter((id) => id !== del.id);
      }
    }

    del.auditLogs.push({
      id: `log-${Date.now()}-coord-cancel`,
      deliveryId: del.id,
      fromStatus,
      toStatus: 'CANCELLED',
      changedByRole: 'coordinator',
      changedByName: coordinator.name,
      changedById: coordinator.id,
      timestamp: new Date().toISOString(),
      reason: `Cancelled by Coordinator: ${reason}`,
    });

    if (del.riderId) {
      this.addNotification({
        recipientRole: 'rider',
        recipientEntityId: del.riderId,
        title: `Task ${del.deliveryCode} Cancelled by Coordinator`,
        message: `Reason: ${reason}`,
        deliveryId: del.id,
        deliveryCode: del.deliveryCode,
        severity: 'warning',
      });
    }

    this.persist();
    return true;
  }

  // --- Rider Confirm Pickup (Transfers custody to courier; stock cannot be reclaimed) ---
  public confirmPickup(deliveryId: string, notes: string, rider: UserIdentity): boolean {
    const del = this.deliveries.find((d) => d.id === deliveryId && d.riderId === rider.associatedId);
    if (!del) throw new Error('Delivery not found.');

    if (del.status !== 'ACKNOWLEDGED') {
      throw new Error(`Cannot confirm pickup for delivery in status ${del.status}`);
    }

    del.status = 'PICKED_UP';
    del.pickedUpAt = new Date().toISOString();

    const batch = this.batches.find((b) => b.id === del.batchId);
    if (batch) {
      batch.collectedQuantity += del.quantityValue;
      batch.allocatedQuantity = Math.max(0, batch.allocatedQuantity - del.quantityValue);
      batch.status = 'PICKED_UP';
    }

    del.auditLogs.push({
      id: `log-${Date.now()}`,
      deliveryId: del.id,
      fromStatus: 'ACKNOWLEDGED',
      toStatus: 'PICKED_UP',
      changedByRole: 'rider',
      changedByName: rider.name,
      changedById: rider.id,
      timestamp: new Date().toISOString(),
      reason: `Cargo collected at pickup point. In courier custody. ${notes ? `Notes: ${notes}` : ''}`,
    });

    // Automatically transition to IN_TRANSIT
    del.status = 'IN_TRANSIT';
    del.inTransitAt = new Date().toISOString();
    if (batch) batch.status = 'IN_TRANSIT';

    del.auditLogs.push({
      id: `log-${Date.now()}-2`,
      deliveryId: del.id,
      fromStatus: 'PICKED_UP',
      toStatus: 'IN_TRANSIT',
      changedByRole: 'rider',
      changedByName: rider.name,
      changedById: rider.id,
      timestamp: new Date().toISOString(),
      reason: 'Courier en route towards destination shelter.',
    });

    // Notify Donor & Shelter
    this.addNotification({
      recipientRole: 'donor',
      recipientEntityId: del.donorId,
      title: 'Aid Cargo Picked Up & In Transit',
      message: `Courier ${rider.name} has safely collected ${del.quantityValue} ${del.quantityUnit} of "${del.batchTitle}".`,
      deliveryId: del.id,
      deliveryCode: del.deliveryCode,
      severity: 'success',
    });

    this.addNotification({
      recipientRole: 'shelter',
      recipientEntityId: del.shelterId,
      title: 'Incoming Aid Shipment In Transit',
      message: `Courier ${rider.name} is en route with ${del.quantityValue} ${del.quantityUnit} of ${del.batchTitle}. Prepare intake.`,
      deliveryId: del.id,
      deliveryCode: del.deliveryCode,
      severity: 'info',
    });

    this.persist();
    return true;
  }

  // --- Courier Complete Handoff at Shelter ---
  public completeHandoff(
    deliveryId: string,
    staffName: string,
    notes: string,
    rider: UserIdentity
  ): boolean {
    const del = this.deliveries.find((d) => d.id === deliveryId && d.riderId === rider.associatedId);
    if (!del) throw new Error('Delivery not found.');

    const fromStatus = del.status;
    del.status = 'DELIVERED';
    del.deliveredAt = new Date().toISOString();
    del.receivedByStaffName = staffName;
    del.receiptNotes = notes;
    del.acceptedQuantity = del.quantityValue;

    const batch = this.batches.find((b) => b.id === del.batchId);
    if (batch) {
      batch.deliveredQuantity += del.quantityValue;
      if (batch.remainingQuantity === 0 && batch.allocatedQuantity === 0) {
        batch.status = 'DELIVERED';
      }
    }

    const riderProfile = this.riders.find((r) => r.id === rider.associatedId);
    if (riderProfile) {
      riderProfile.currentCommittedLoad = Math.max(0, riderProfile.currentCommittedLoad - del.quantityValue);
      riderProfile.activeDeliveryIds = riderProfile.activeDeliveryIds.filter((id) => id !== del.id);
      riderProfile.completedDeliveriesCount += 1;
    }

    del.auditLogs.push({
      id: `log-${Date.now()}-handoff`,
      deliveryId: del.id,
      fromStatus,
      toStatus: 'DELIVERED',
      changedByRole: 'rider',
      changedByName: rider.name,
      changedById: rider.id,
      timestamp: new Date().toISOString(),
      reason: `Courier completed delivery handoff to ${staffName}. Notes: ${notes}`,
    });

    this.addNotification({
      recipientRole: 'shelter',
      recipientEntityId: del.shelterId,
      title: `Shipment Arrived (${del.deliveryCode})`,
      message: `Courier ${rider.name} completed handoff with ${staffName}.`,
      deliveryId: del.id,
      deliveryCode: del.deliveryCode,
      severity: 'success',
    });

    this.addNotification({
      recipientRole: 'coordinator',
      title: `Delivery Completed: ${del.deliveryCode}`,
      message: `Courier ${rider.name} delivered ${del.quantityValue} ${del.quantityUnit} to ${del.shelterName}.`,
      deliveryId: del.id,
      deliveryCode: del.deliveryCode,
      severity: 'success',
    });

    this.persist();
    return true;
  }

  // --- Shelter Receipt Confirmation (Final custody handoff) ---
  public confirmReceiptByShelter(
    deliveryId: string,
    acceptedQty: number,
    rejectedQty: number,
    qualityCheck: 'passed' | 'minor_discrepancy' | 'rejected',
    staffName: string,
    notes: string,
    shelterUser: UserIdentity
  ): boolean {
    const del = this.deliveries.find((d) => d.id === deliveryId && d.shelterId === shelterUser.associatedId);
    if (!del) throw new Error('Delivery not found or not addressed to this shelter.');

    const fromStatus = del.status;
    const isFullPass = rejectedQty === 0 && qualityCheck === 'passed';
    const newStatus: DeliveryStatus = isFullPass ? 'DELIVERED' : 'PARTIALLY_DELIVERED';

    del.status = newStatus;
    del.deliveredAt = new Date().toISOString();
    del.acceptedQuantity = acceptedQty;
    del.rejectedQuantity = rejectedQty;
    del.qualityCheck = qualityCheck;
    del.receivedByStaffName = staffName;
    del.receiptNotes = notes;

    const batch = this.batches.find((b) => b.id === del.batchId);
    if (batch) {
      batch.deliveredQuantity += acceptedQty;
      batch.rejectedQuantity += rejectedQty;
      if (batch.remainingQuantity === 0 && batch.allocatedQuantity === 0) {
        batch.status = newStatus;
      }
    }

    // Release load from courier
    if (del.riderId) {
      const rider = this.riders.find((r) => r.id === del.riderId);
      if (rider) {
        rider.currentCommittedLoad = Math.max(0, rider.currentCommittedLoad - del.quantityValue);
        rider.activeDeliveryIds = rider.activeDeliveryIds.filter((id) => id !== del.id);
        rider.completedDeliveriesCount += 1;
      }
    }

    del.auditLogs.push({
      id: `log-${Date.now()}`,
      deliveryId: del.id,
      fromStatus,
      toStatus: newStatus,
      changedByRole: 'shelter',
      changedByName: `${staffName} (${shelterUser.organization || 'Shelter Staff'})`,
      changedById: shelterUser.id,
      timestamp: new Date().toISOString(),
      reason: `Intake verified: Accepted ${acceptedQty} ${del.quantityUnit}, Rejected ${rejectedQty}. Quality: ${qualityCheck}. Notes: ${notes}`,
    });

    this.addNotification({
      recipientRole: 'donor',
      recipientEntityId: del.donorId,
      title: `Aid Delivered & Verified at ${del.shelterName}`,
      message: `Your donation "${del.batchTitle}" was accepted (${acceptedQty} ${del.quantityUnit}). Thank you!`,
      deliveryId: del.id,
      deliveryCode: del.deliveryCode,
      severity: 'success',
    });

    if (del.riderId) {
      this.addNotification({
        recipientRole: 'rider',
        recipientEntityId: del.riderId,
        title: `Mission ${del.deliveryCode} Completed`,
        message: `Shelter staff ${staffName} verified intake. Payload cleared.`,
        deliveryId: del.id,
        deliveryCode: del.deliveryCode,
        severity: 'success',
      });
    }

    this.addNotification({
      recipientRole: 'coordinator',
      title: `Delivery ${del.deliveryCode} Completed (${newStatus})`,
      message: `Verified by ${staffName} at ${del.shelterName}. Accepted: ${acceptedQty}, Rejected: ${rejectedQty}.`,
      deliveryId: del.id,
      deliveryCode: del.deliveryCode,
      severity: 'success',
    });

    this.persist();
    return true;
  }

  // --- Shelter Closure & Redirection with Cargo Custody Preservation ---
  public updateShelterProfile(
    shelterId: string,
    updates: Partial<ShelterProfile>,
    user: UserIdentity
  ): ShelterProfile {
    const shelter = this.shelters.find((s) => s.id === shelterId);
    if (!shelter) throw new Error('Shelter not found.');

    const previousClosed = shelter.isTemporarilyClosed;
    Object.assign(shelter, updates);

    // If shelter just closed, flag any deliveries currently in transit to this shelter!
    if (!previousClosed && updates.isTemporarilyClosed) {
      this.deliveries.forEach((del) => {
        if (del.shelterId === shelterId && (del.status === 'IN_TRANSIT' || del.status === 'ASSIGNED' || del.status === 'ACKNOWLEDGED')) {
          del.status = 'REDIRECT_PENDING';
          del.auditLogs.push({
            id: `log-${Date.now()}-closure`,
            deliveryId: del.id,
            fromStatus: 'IN_TRANSIT',
            toStatus: 'REDIRECT_PENDING',
            changedByRole: 'shelter',
            changedByName: shelter.name,
            changedById: shelter.id,
            timestamp: new Date().toISOString(),
            reason: `Destination shelter paused intake (${updates.closureReason || 'Capacity full'}). Cargo remains in courier custody awaiting coordinator redirection.`,
          });

          this.addNotification({
            recipientRole: 'coordinator',
            title: `URGENT: Destination Shelter Closed (${del.deliveryCode})`,
            message: `${shelter.name} closed during transit. Courier has custody of ${del.quantityValue} units. Immediate redirection required!`,
            deliveryId: del.id,
            deliveryCode: del.deliveryCode,
            severity: 'alert',
          });

          if (del.riderId) {
            this.addNotification({
              recipientRole: 'rider',
              recipientEntityId: del.riderId,
              title: `ROUTE ON HOLD: ${del.deliveryCode}`,
              message: `${shelter.name} intake is paused. Hold cargo. Central dispatch will reroute you shortly.`,
              deliveryId: del.id,
              deliveryCode: del.deliveryCode,
              severity: 'warning',
            });
          }
        }
      });
    }

    this.persist();
    return shelter;
  }

  // --- Coordinator Safe Redirection (re-validating hard safety for new shelter) ---
  public redirectShelterByCoordinator(
    deliveryId: string,
    newShelterId: string,
    overrideReason: string,
    coordinator: UserIdentity
  ): boolean {
    if (!overrideReason || overrideReason.trim().length < 4) {
      throw new Error('A logged override reason (min 4 characters) is mandatory.');
    }

    const del = this.deliveries.find((d) => d.id === deliveryId);
    if (!del) throw new Error('Delivery not found.');

    const newShelter = this.shelters.find((s) => s.id === newShelterId);
    if (!newShelter) throw new Error('New destination shelter not found.');

    if (newShelter.isTemporarilyClosed) {
      throw new Error('Cannot redirect to a shelter that is currently closed.');
    }

    const batch = this.batches.find((b) => b.id === del.batchId) || {
      coordinates: del.pickupCoordinates,
      safeUseDeadline: del.safeUseDeadline,
      storageCondition: del.storageCondition,
      category: del.category,
      dietaryType: 'pure_veg',
      remainingQuantity: 0,
      isMedicalSupply: del.isMedicalSupply,
    } as any;

    const rider = del.riderId ? this.riders.find((r) => r.id === del.riderId) : undefined;
    if (rider) {
      const assessment = evaluateHardSafetyAndScore(batch, newShelter, rider, del.quantityValue);
      if (!assessment.isEligible) {
        throw new Error(`Redirection blocked: ${assessment.hardBlockReason}`);
      }
      del.safetyAssessment = assessment;
    }

    const oldShelterName = del.shelterName;
    del.shelterId = newShelter.id;
    del.shelterName = newShelter.name;
    del.shelterContactPerson = newShelter.contactPerson;
    del.shelterPhone = newShelter.phone;
    del.destinationAddress = newShelter.address;
    del.destinationCoordinates = newShelter.coordinates;
    del.status = 'IN_TRANSIT'; // resumed towards new destination
    del.overrideReason = overrideReason;

    del.auditLogs.push({
      id: `log-${Date.now()}-redir`,
      deliveryId: del.id,
      fromStatus: 'REDIRECT_PENDING',
      toStatus: 'IN_TRANSIT',
      changedByRole: 'coordinator',
      changedByName: coordinator.name,
      changedById: coordinator.id,
      timestamp: new Date().toISOString(),
      reason: `Destination redirected from ${oldShelterName} to ${newShelter.name}. Cargo preserved in courier custody. Reason: ${overrideReason}`,
    });

    if (del.riderId) {
      this.addNotification({
        recipientRole: 'rider',
        recipientEntityId: del.riderId,
        title: `NEW ROUTE AUTHORIZED: ${del.deliveryCode}`,
        message: `Rerouted to ${newShelter.name} (${newShelter.address}). Contact: ${newShelter.contactPerson}.`,
        deliveryId: del.id,
        deliveryCode: del.deliveryCode,
        severity: 'info',
      });
    }

    this.addNotification({
      recipientRole: 'shelter',
      recipientEntityId: newShelter.id,
      title: `Redirected Aid Incoming: ${del.deliveryCode}`,
      message: `${del.quantityValue} ${del.quantityUnit} of ${del.batchTitle} rerouted to your facility.`,
      deliveryId: del.id,
      deliveryCode: del.deliveryCode,
      severity: 'info',
    });

    this.persist();
    return true;
  }

  // --- Reassign Rider ---
  public reassignRiderByCoordinator(
    deliveryId: string,
    newRiderId: string,
    overrideReason: string,
    coordinator: UserIdentity
  ): boolean {
    if (!overrideReason || overrideReason.trim().length < 4) {
      throw new Error('A logged override reason is mandatory.');
    }

    const del = this.deliveries.find((d) => d.id === deliveryId);
    if (!del) throw new Error('Delivery not found.');

    const newRider = this.riders.find((r) => r.id === newRiderId);
    if (!newRider) throw new Error('Target courier not found.');

    const availablePayload = newRider.carryingCapacity - newRider.currentCommittedLoad;
    if (del.quantityValue > availablePayload) {
      throw new Error(`New courier has only ${availablePayload} capacity available for this ${del.quantityValue}-unit cargo.`);
    }

    const oldRiderId = del.riderId;
    if (oldRiderId) {
      const oldRider = this.riders.find((r) => r.id === oldRiderId);
      if (oldRider) {
        oldRider.currentCommittedLoad = Math.max(0, oldRider.currentCommittedLoad - del.quantityValue);
        oldRider.activeDeliveryIds = oldRider.activeDeliveryIds.filter((id) => id !== del.id);
      }
    }

    del.riderId = newRider.id;
    del.riderName = newRider.name;
    del.riderPhone = newRider.phone;
    del.riderVehicle = newRider.vehicleType;
    del.riderCapacity = newRider.carryingCapacity;
    del.riderCoordinates = newRider.coordinates;
    del.status = 'ASSIGNED';
    del.reservationDeadline = new Date(Date.now() + 300 * 1000).toISOString();
    del.overrideReason = overrideReason;

    newRider.currentCommittedLoad += del.quantityValue;
    newRider.activeDeliveryIds.push(del.id);

    del.auditLogs.push({
      id: `log-${Date.now()}-reassign`,
      deliveryId: del.id,
      fromStatus: del.status,
      toStatus: 'ASSIGNED',
      changedByRole: 'coordinator',
      changedByName: coordinator.name,
      changedById: coordinator.id,
      timestamp: new Date().toISOString(),
      reason: `Courier reassigned to ${newRider.name}. Reason: ${overrideReason}`,
    });

    this.addNotification({
      recipientRole: 'rider',
      recipientEntityId: newRider.id,
      title: `Assignment Reallocated: ${del.deliveryCode}`,
      message: `${del.quantityValue} ${del.quantityUnit} allocated to you. Acknowledge within 5 minutes.`,
      deliveryId: del.id,
      deliveryCode: del.deliveryCode,
      severity: 'info',
    });

    this.persist();
    return true;
  }

  // --- Donor Batch Creation ---
  public createBatch(
    batchData: Omit<AidBatch, 'id' | 'batchCode' | 'createdAt' | 'status' | 'allocatedQuantity' | 'collectedQuantity' | 'deliveredQuantity' | 'rejectedQuantity' | 'remainingQuantity' | 'linkedDeliveryIds' | 'coordinates'>,
    donor: UserIdentity
  ): AidBatch {
    const newId = `batch-${Date.now()}`;
    const code = `BF-2026-${Math.floor(100 + Math.random() * 900)}`;

    const newBatch: AidBatch = {
      ...batchData,
      id: newId,
      batchCode: code,
      donorId: donor.associatedId,
      donorName: donor.name,
      donorOrganization: donor.organization || 'Civic Donor',
      donorPhone: donor.phone,
      allocatedQuantity: 0,
      collectedQuantity: 0,
      deliveredQuantity: 0,
      rejectedQuantity: 0,
      remainingQuantity: batchData.quantityValue,
      coordinates: { lat: 19.0178, lng: 72.8478 },
      createdAt: new Date().toISOString(),
      status: 'AVAILABLE',
      linkedDeliveryIds: [],
    };

    this.batches.unshift(newBatch);

    this.addNotification({
      recipientRole: 'coordinator',
      title: 'New Aid Batch Published',
      message: `${newBatch.quantityValue} ${newBatch.quantityUnit} of "${newBatch.title}" available at ${newBatch.donorOrganization}.`,
      severity: 'info',
    });

    this.persist();
    return newBatch;
  }

  // --- Cancel Batch by Donor ---
  public cancelBatchByDonor(batchId: string, reason: string, donor: UserIdentity): boolean {
    const batch = this.batches.find((b) => b.id === batchId && b.donorId === donor.associatedId);
    if (!batch) return false;

    if (batch.collectedQuantity > 0 || batch.deliveredQuantity > 0) {
      throw new Error('Cargo has already been collected or delivered. Cannot be cancelled by donor.');
    }

    batch.status = 'CANCELLED';
    batch.remainingQuantity = 0;

    // Cancel all linked uncollected deliveries
    batch.linkedDeliveryIds.forEach((delId) => {
      const del = this.deliveries.find((d) => d.id === delId);
      if (del && (del.status === 'ASSIGNED' || del.status === 'ACKNOWLEDGED' || del.status === 'RESERVED')) {
        del.status = 'CANCELLED';
        del.cancellationReason = reason;

        if (del.riderId) {
          const rider = this.riders.find((r) => r.id === del.riderId);
          if (rider) {
            rider.currentCommittedLoad = Math.max(0, rider.currentCommittedLoad - del.quantityValue);
            rider.activeDeliveryIds = rider.activeDeliveryIds.filter((id) => id !== del.id);
          }
        }
      }
    });

    this.persist();
    return true;
  }

  // --- Weather System ---
  public toggleSimulatedWeatherAlert(enable: boolean, conditionMessage?: string) {
    if (enable) {
      this.weather = {
        isSimulatedAlert: true,
        severity: 'severe',
        condition: 'Severe Monsoon Cloudburst & Waterlogging Warning',
        temperature: 26,
        rainfallMm: 68.5,
        windSpeedKmh: 48,
        affectedSectors: ['Sion Underpass', 'Kurla West', 'Matunga East'],
        forecastPeriod: 'Next 3 Hours (Simulated Monsoon Protocol)',
        lastUpdated: new Date().toISOString(),
        source: 'Mumbai Civic Emergency Radar (Simulated Demo Event)',
        warningMessage:
          conditionMessage ||
          'ALERT: Extreme rainfall and low-lying waterlogging near Sion flyover. Couriers urged to halt or coordinate alternate routes.',
      };

      this.addNotification({
        recipientRole: 'coordinator',
        title: 'WEATHER ALERT: Severe Waterlogging in Central Sector',
        message: 'Monsoon flash alert triggered. Review active routes passing through Sion/Kurla.',
        severity: 'alert',
      });
    } else {
      this.weather = {
        isSimulatedAlert: false,
        severity: 'normal',
        condition: 'Partly Cloudy · Moderate Humidity',
        temperature: 30,
        rainfallMm: 2.1,
        windSpeedKmh: 12,
        affectedSectors: [],
        forecastPeriod: 'Standard City Forecast',
        lastUpdated: new Date().toISOString(),
        source: 'Civic Meteorological Radar (Simulated Demo Environment)',
      };
    }
    this.persist();
  }

  // --- Offline Action Queuing & Reconnection Sync ---
  public queueOfflineAction(action: Omit<OfflineQueuedAction, 'operationId' | 'queuedAt' | 'status'>): OfflineQueuedAction {
    const item: OfflineQueuedAction = {
      ...action,
      operationId: `op-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      queuedAt: new Date().toISOString(),
      status: 'pending',
    };
    this.offlineQueue.push(item);
    this.persist();
    return item;
  }

  public syncOfflineQueue(): { synchronized: number; conflicts: number } {
    let synced = 0;
    let conflicts = 0;

    for (const action of this.offlineQueue) {
      if (action.status !== 'pending') continue;

      const del = this.deliveries.find((d) => d.id === action.deliveryId);
      if (!del) {
        action.status = 'rejected';
        action.errorMessage = 'Delivery record no longer exists on server.';
        conflicts++;
        continue;
      }

      // Check for stale state / conflict
      if (del.status === 'RESERVATION_EXPIRED' || del.status === 'CANCELLED') {
        action.status = 'conflict';
        action.errorMessage = `Authoritative Conflict: Delivery is already ${del.status}. Offline update cannot be applied.`;
        conflicts++;
        continue;
      }

      try {
        if (action.type === 'acknowledge') {
          this.acknowledgeAssignment(del.id, action.performedBy);
        } else if (action.type === 'pickup') {
          this.confirmPickup(del.id, action.payload.notes || 'Offline pickup sync', action.performedBy);
        } else if (action.type === 'handoff' || action.type === 'confirm_receipt') {
          this.confirmReceiptByShelter(
            del.id,
            del.quantityValue,
            0,
            'passed',
            action.payload.staffName || 'Shelter Staff',
            'Synchronized from offline device queue',
            action.performedBy
          );
        }
        action.status = 'synchronized';
        synced++;
      } catch (err: any) {
        action.status = 'rejected';
        action.errorMessage = err.message || 'Validation failed on server sync.';
        conflicts++;
      }
    }

    this.persist();
    return { synchronized: synced, conflicts };
  }

  // --- Nearby Delivery Map Claim ---
  public claimNearbyBatchByRider(
    batchId: string,
    riderId: string,
    quantity?: number
  ): Delivery {
    const batch = this.batches.find((b) => b.id === batchId);
    if (!batch) throw new Error('Aid batch not found.');
    if (batch.remainingQuantity <= 0) throw new Error('No surplus meals remaining in this batch.');

    const rider = this.riders.find((r) => r.id === riderId);
    if (!rider) throw new Error('Rider profile not found.');

    const availablePayload = rider.carryingCapacity - rider.currentCommittedLoad;
    if (availablePayload <= 0) {
      throw new Error(`Your carrying capacity (${rider.carryingCapacity}) is already fully committed.`);
    }

    const allocateQty = Math.min(
      quantity && quantity > 0 ? quantity : batch.remainingQuantity,
      availablePayload,
      batch.remainingQuantity
    );

    // Pick best eligible shelter
    const openShelters = this.shelters.filter((s) => !s.isTemporarilyClosed);
    const vegMatching = batch.dietaryType === 'non_veg' 
      ? openShelters.filter((s) => !s.vegOnly)
      : openShelters;
    const eligibleShelters = vegMatching.length > 0 ? vegMatching : openShelters;
    const targetShelter = eligibleShelters[0] || this.shelters[0];

    // Transactional allocation
    batch.remainingQuantity -= allocateQty;
    batch.allocatedQuantity += allocateQty;
    batch.status = batch.remainingQuantity === 0 ? 'ASSIGNED' : 'AVAILABLE';

    rider.currentCommittedLoad += allocateQty;

    const deliveryId = `del-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const deliveryCode = `DEL-${Math.floor(1000 + Math.random() * 9000)}`;
    const reservationDeadline = new Date(Date.now() + 300 * 1000).toISOString();

    const delivery: Delivery = {
      id: deliveryId,
      deliveryCode,
      batchId: batch.id,
      batchTitle: batch.title,
      category: batch.category,
      isMedicalSupply: batch.isMedicalSupply,
      quantityValue: allocateQty,
      quantityUnit: batch.quantityUnit,
      donorId: batch.donorId,
      donorName: batch.donorName,
      donorOrganization: batch.donorOrganization,
      donorPhone: batch.donorPhone,
      pickupAddress: batch.pickupAddress,
      pickupLandmark: batch.pickupLandmark,
      pickupCoordinates: batch.coordinates,
      riderId: rider.id,
      riderName: rider.name,
      riderPhone: rider.phone,
      riderVehicle: rider.vehicleType,
      riderCapacity: rider.carryingCapacity,
      riderCoordinates: rider.coordinates,
      shelterId: targetShelter.id,
      shelterName: targetShelter.name,
      shelterContactPerson: targetShelter.contactPerson,
      shelterPhone: targetShelter.phone,
      destinationAddress: targetShelter.address,
      destinationCoordinates: targetShelter.coordinates,
      status: 'ACKNOWLEDGED', // Accepted directly by rider!
      safeUseDeadline: batch.safeUseDeadline,
      handlingInstructions: batch.specialInstructions,
      storageCondition: batch.storageCondition,
      reservationDeadline,
      acknowledgementWindowSeconds: 300,
      createdAt: new Date().toISOString(),
      assignedAt: new Date().toISOString(),
      acknowledgedAt: new Date().toISOString(),
      auditLogs: [
        {
          id: `log-${Date.now()}-claim`,
          deliveryId,
          fromStatus: null,
          toStatus: 'ACKNOWLEDGED',
          changedByRole: 'rider',
          changedByName: rider.name,
          changedById: rider.id,
          timestamp: new Date().toISOString(),
          reason: `Rider accepted nearby delivery directly from map (${allocateQty} ${batch.quantityUnit}).`,
        },
      ],
    };

    batch.linkedDeliveryIds.push(deliveryId);
    rider.activeDeliveryIds.push(deliveryId);
    this.deliveries.unshift(delivery);

    this.addNotification({
      recipientRole: 'coordinator',
      title: 'Delivery Claimed by Rider',
      message: `${rider.name} accepted ${deliveryCode} (${allocateQty} ${batch.quantityUnit}) for ${targetShelter.name}.`,
      deliveryId,
      deliveryCode,
      severity: 'info',
    });

    this.persist();
    return delivery;
  }

  // --- Registration Operations ---
  public registerShelter(data: {
    name: string;
    address: string;
    contactPerson: string;
    phone: string;
    totalBedCapacity: number;
    mealIntakeCapacity: number;
    coldStorageAvailable: boolean;
    vegOnly: boolean;
    zone?: string;
  }): ShelterProfile {
    const id = `shelter-reg-${Date.now()}`;
    const newShelter: ShelterProfile = {
      id,
      name: data.name,
      address: data.address,
      zone: data.zone || 'Mumbai Central / Western',
      coordinates: { lat: 19.03 + (Math.random() * 0.04 - 0.02), lng: 72.84 + (Math.random() * 0.04 - 0.02) },
      contactPerson: data.contactPerson,
      phone: data.phone,
      totalBedCapacity: data.totalBedCapacity,
      currentOccupants: Math.floor(data.totalBedCapacity * 0.5),
      mealIntakeCapacity: data.mealIntakeCapacity,
      acceptsPerishables: true,
      coldStorageAvailable: data.coldStorageAvailable,
      cleanWaterAvailable: true,
      cookingFuelAvailable: true,
      vegOnly: data.vegOnly,
      receivingHours: '06:00 - 23:00',
      isTemporarilyClosed: false,
      urgentNeeds: ['Hot Cooked Meals', 'Blankets'],
    };
    this.shelters.push(newShelter);
    this.persist();
    return newShelter;
  }

  public registerRider(data: {
    name: string;
    phone: string;
    vehicleType: string;
    carryingCapacity: number;
    zone?: string;
  }): RiderProfile {
    const id = `rider-reg-${Date.now()}`;
    const newRider: RiderProfile = {
      id,
      name: data.name,
      phone: data.phone,
      vehicleType: data.vehicleType,
      carryingCapacity: data.carryingCapacity,
      currentCommittedLoad: 0,
      zone: data.zone || 'Dadar / Central Mumbai',
      coordinates: { lat: 19.02 + (Math.random() * 0.03 - 0.015), lng: 72.845 + (Math.random() * 0.03 - 0.015) },
      status: 'active',
      activeDeliveryIds: [],
      completedDeliveriesCount: 0,
    };
    this.riders.push(newRider);
    this.persist();
    return newRider;
  }

  public registerCoordinator(data: {
    name: string;
    organization: string;
    phone: string;
  }): UserIdentity {
    const id = `coord-reg-${Date.now()}`;
    return {
      id: `user-${id}`,
      name: data.name,
      role: 'coordinator',
      organization: data.organization,
      phone: data.phone,
      associatedId: id,
    };
  }

  public clearOfflineQueue() {
    this.offlineQueue = [];
    this.persist();
  }

  // --- Notifications Helper ---
  public addNotification(notif: Omit<InAppNotification, 'id' | 'timestamp' | 'read'>) {
    const item: InAppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    this.notifications.unshift(item);
  }

  public markNotificationAsRead(id: string) {
    const n = this.notifications.find((notif) => notif.id === id);
    if (n) {
      n.read = true;
      this.persist();
    }
  }

  public markAllNotificationsAsRead(role: RoleType, associatedId?: string) {
    this.notifications.forEach((n) => {
      if (n.recipientRole === role) {
        if (!associatedId || !n.recipientEntityId || n.recipientEntityId === associatedId) {
          n.read = true;
        }
      }
    });
    this.persist();
  }
}

export const mockDb = new MockDatabase();
