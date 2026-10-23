/**
 * AIDFLOW Core Types & Domain Interfaces
 */

export type RoleType = 'donor' | 'rider' | 'shelter' | 'coordinator';

export type AidCategory =
  | 'cooked_meals'
  | 'dry_rations'
  | 'fresh_produce'
  | 'packaged_food'
  | 'baby_essentials'
  | 'hygiene_kits'
  | 'medical_supplies'
  | 'blankets_warmth';

export type StorageCondition =
  | 'ambient'
  | 'hot_holding'
  | 'cold_refrigerated'
  | 'dry_ventilated';

export type DeliveryStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'ASSIGNED'
  | 'ACKNOWLEDGED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'PARTIALLY_DELIVERED'
  | 'BLOCKED'
  | 'REDIRECT_PENDING'
  | 'CANCELLED'
  | 'RESERVATION_EXPIRED'
  | 'FAILED';

export interface AuditLogEntry {
  id: string;
  deliveryId: string;
  fromStatus: DeliveryStatus | null;
  toStatus: DeliveryStatus;
  changedByRole: RoleType;
  changedByName: string;
  changedById: string;
  timestamp: string; // ISO string
  reason?: string;
  metadata?: Record<string, any>;
}

export interface AidBatch {
  id: string;
  batchCode: string; // e.g. "BF-2026-081"
  donorId: string;
  donorName: string;
  donorOrganization: string;
  donorPhone: string;
  title: string;
  category: AidCategory;
  isMedicalSupply?: boolean; // Distinct medical supplies category
  quantityValue: number; // Initial total batch quantity
  quantityUnit: string; // "meals", "kg", "boxes", "kits"
  
  // Capacity-aware split quantities
  allocatedQuantity: number; // currently assigned across active delivery legs
  collectedQuantity: number; // picked up by couriers
  deliveredQuantity: number; // verified delivered at shelters
  rejectedQuantity: number;  // spoiled or rejected during intake
  remainingQuantity: number; // total - (allocated + delivered + rejected)

  prepTime: string; // ISO string
  safeUseDeadline: string; // ISO string
  storageCondition: StorageCondition;
  pickupAddress: string;
  pickupLandmark: string;
  coordinates: { lat: number; lng: number }; // Clearly labeled simulated coordinates
  specialInstructions: string;
  dietaryType: 'pure_veg' | 'non_veg' | 'universal' | 'halal';
  createdAt: string;
  status: DeliveryStatus;
  linkedDeliveryIds: string[]; // Supports 1 batch split across multiple couriers
}

export interface Delivery {
  id: string;
  deliveryCode: string; // e.g. "DEL-9402"
  batchId: string;
  batchTitle: string;
  category: AidCategory;
  isMedicalSupply?: boolean;
  
  // Split allocation tracking for this leg
  quantityValue: number; // allocated portion of batch
  quantityUnit: string;
  
  // Linked entities
  donorId: string;
  donorName: string;
  donorOrganization: string;
  donorPhone: string;
  pickupAddress: string;
  pickupLandmark: string;
  pickupCoordinates: { lat: number; lng: number };
  
  riderId?: string;
  riderName?: string;
  riderPhone?: string;
  riderVehicle?: string;
  riderCapacity?: number;
  riderCoordinates?: { lat: number; lng: number };
  
  shelterId: string;
  shelterName: string;
  shelterContactPerson: string;
  shelterPhone: string;
  destinationAddress: string;
  destinationCoordinates: { lat: number; lng: number };
  
  status: DeliveryStatus;
  safeUseDeadline: string;
  handlingInstructions: string;
  storageCondition: StorageCondition;
  
  // Reservation Timeout & Recovery
  reservationDeadline: string; // ISO string by which rider must acknowledge
  acknowledgementWindowSeconds: number; // e.g. 300s (5m)
  isExpired?: boolean;
  
  // Delivery Feasibility & ETA
  estimatedTravelMinutes?: number;
  estimatedPickupMinutes?: number;
  feasibilityChecked?: boolean;
  feasibilityPassed?: boolean;
  feasibilityNote?: string;
  
  // Lifecycle timestamps & field tracking
  createdAt: string;
  assignedAt?: string;
  acknowledgedAt?: string;
  pickedUpAt?: string;
  inTransitAt?: string;
  deliveredAt?: string;
  
  // Field event details
  estimatedDelayMinutes?: number;
  delayReason?: string;
  blockedReason?: string;
  cancellationReason?: string;
  failureReason?: string;
  overrideReason?: string;
  
  // Shelter receipt inspection
  acceptedQuantity?: number;
  rejectedQuantity?: number;
  qualityCheck?: 'passed' | 'minor_discrepancy' | 'rejected';
  receiptNotes?: string;
  receivedByStaffName?: string;
  
  // Safety Assessment & Prioritization
  safetyAssessment?: DispatchSafetyAssessment;
  
  // Audit trail
  auditLogs: AuditLogEntry[];
}

export interface HardSafetyCheck {
  id: string;
  name: string;
  passed: boolean;
  reason: string;
  critical: boolean;
}

export interface PrioritizationFactor {
  id: string;
  name: string;
  score: number; // 0-100
  weight: number; // 0.0 - 1.0
  weightedScore: number;
  explanation: string;
}

export interface DispatchSafetyAssessment {
  isEligible: boolean;
  hardChecks: HardSafetyCheck[];
  hardBlockReason?: string;
  prioritizationScore: number; // 0-100
  factors: PrioritizationFactor[];
  recommendation: 'APPROVED' | 'BLOCKED_HARD_SAFETY' | 'AWAITING_REVIEW';
  assessedAt: string;
}

export interface ShelterProfile {
  id: string;
  name: string;
  address: string;
  zone: string;
  coordinates: { lat: number; lng: number }; // Simulated coordinates
  contactPerson: string;
  phone: string;
  totalBedCapacity: number;
  currentOccupants: number;
  mealIntakeCapacity: number;
  acceptsPerishables: boolean;
  coldStorageAvailable: boolean;
  cleanWaterAvailable: boolean;
  cookingFuelAvailable: boolean;
  vegOnly: boolean;
  medicalClearanceStaffAvailable?: boolean;
  receivingHours: string;
  isTemporarilyClosed: boolean;
  closureReason?: string;
  urgentNeeds: string[];
}

export interface RiderProfile {
  id: string;
  name: string;
  phone: string;
  vehicleType: string;
  carryingCapacity: number; // Max payload units (e.g. 40, 60, 80 meals)
  currentCommittedLoad: number; // Active carrying load
  zone: string;
  coordinates: { lat: number; lng: number }; // Simulated courier coordinates
  status: 'active' | 'on_break' | 'busy';
  activeDeliveryIds: string[]; // Supports multiple split cargo assignments
  completedDeliveriesCount: number;
}

export interface UserIdentity {
  id: string;
  name: string;
  role: RoleType;
  organization?: string;
  phone: string;
  associatedId: string;
}

export interface InAppNotification {
  id: string;
  recipientRole: RoleType;
  recipientEntityId?: string;
  title: string;
  message: string;
  deliveryId?: string;
  deliveryCode?: string;
  timestamp: string;
  read: boolean;
  severity: 'info' | 'success' | 'warning' | 'alert';
}

export interface WeatherCondition {
  isSimulatedAlert: boolean;
  severity: 'normal' | 'advisory' | 'warning' | 'severe';
  condition: string;
  temperature: number;
  rainfallMm: number;
  windSpeedKmh: number;
  affectedSectors: string[];
  forecastPeriod: string;
  lastUpdated: string;
  source: string;
  warningMessage?: string;
}

export interface OfflineQueuedAction {
  operationId: string;
  type: 'acknowledge' | 'pickup' | 'delay' | 'handoff' | 'confirm_receipt';
  deliveryId: string;
  payload: Record<string, any>;
  queuedAt: string;
  status: 'pending' | 'synchronized' | 'rejected' | 'conflict';
  errorMessage?: string;
  performedBy: UserIdentity;
}

export type SupportedLanguage = 'en' | 'hi' | 'mr';
