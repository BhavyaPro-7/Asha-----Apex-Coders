import {
  AidBatch,
  ShelterProfile,
  RiderProfile,
  HardSafetyCheck,
  PrioritizationFactor,
  DispatchSafetyAssessment,
} from '../types';

// Haversine distance helper for realistic travel estimates in Mumbai cluster
export function calculateSimulatedDistanceKm(
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number }
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLon = ((coord2.lng - coord1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.lat * Math.PI) / 180) *
      Math.cos((coord2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dist = R * c;
  return Math.max(1.5, Math.round(dist * 10) / 10);
}

export function estimateDurations(
  pickupCoord: { lat: number; lng: number },
  riderCoord: { lat: number; lng: number },
  shelterCoord: { lat: number; lng: number }
): { pickupMinutes: number; travelMinutes: number } {
  const toPickupDist = calculateSimulatedDistanceKm(riderCoord, pickupCoord);
  const toShelterDist = calculateSimulatedDistanceKm(pickupCoord, shelterCoord);

  // Average urban speed ~ 22 km/h in dense civic clusters + 5m pickup buffer
  const pickupMinutes = Math.max(8, Math.round((toPickupDist / 20) * 60));
  const travelMinutes = Math.max(12, Math.round((toShelterDist / 22) * 60));

  return { pickupMinutes, travelMinutes };
}

export function evaluateHardSafetyAndScore(
  batch: AidBatch,
  shelter: ShelterProfile,
  rider: RiderProfile,
  allocatedQuantity: number
): DispatchSafetyAssessment {
  const { pickupMinutes, travelMinutes } = estimateDurations(
    batch.coordinates,
    rider.coordinates,
    shelter.coordinates
  );

  const hardChecks: HardSafetyCheck[] = [];

  // Check 1: Safe-use window feasibility
  const now = Date.now();
  const deadlineTime = new Date(batch.safeUseDeadline).getTime();
  const bufferMinutes = 15; // 15 mins safety buffer
  const estimatedHandoffTime = now + (pickupMinutes + travelMinutes + bufferMinutes) * 60 * 1000;

  if (deadlineTime <= now) {
    hardChecks.push({
      id: 'deadline_expired',
      name: 'Safe-Use Window',
      passed: false,
      reason: 'Batch safe-use deadline has already expired. Aid cannot be distributed.',
      critical: true,
    });
  } else if (estimatedHandoffTime > deadlineTime) {
    const minOver = Math.round((estimatedHandoffTime - deadlineTime) / 60000);
    hardChecks.push({
      id: 'transit_exceeds_deadline',
      name: 'Feasibility vs Deadline',
      passed: false,
      reason: `Estimated arrival + handoff time (${pickupMinutes + travelMinutes + bufferMinutes}m) exceeds safe-use deadline by ${minOver} minutes.`,
      critical: true,
    });
  } else {
    hardChecks.push({
      id: 'deadline_valid',
      name: 'Safe-Use Feasibility',
      passed: true,
      reason: `Estimated transit (${pickupMinutes + travelMinutes}m) will arrive before safe-use deadline with adequate margin.`,
      critical: true,
    });
  }

  // Check 2: Storage & temperature conditions
  if (batch.storageCondition === 'cold_refrigerated' && !shelter.coldStorageAvailable) {
    hardChecks.push({
      id: 'cold_storage_unavailable',
      name: 'Cold Chain Integrity',
      passed: false,
      reason: 'Batch requires continuous refrigeration (<5°C), but destination shelter has no cold storage.',
      critical: true,
    });
  } else {
    hardChecks.push({
      id: 'storage_compatible',
      name: 'Storage Compatibility',
      passed: true,
      reason: 'Destination shelter satisfies required temperature and storage holding conditions.',
      critical: false,
    });
  }

  // Check 3: Dietary compatibility
  if (shelter.vegOnly && batch.dietaryType === 'non_veg') {
    hardChecks.push({
      id: 'dietary_incompatible',
      name: 'Dietary Compatibility',
      passed: false,
      reason: 'Shelter policy strictly accepts Pure Vegetarian food only. Non-veg items rejected.',
      critical: true,
    });
  } else {
    hardChecks.push({
      id: 'dietary_compatible',
      name: 'Dietary Compatibility',
      passed: true,
      reason: 'Item dietary classification aligns with shelter intake policy.',
      critical: false,
    });
  }

  // Check 4: Destination shelter readiness
  if (shelter.isTemporarilyClosed) {
    hardChecks.push({
      id: 'shelter_closed',
      name: 'Shelter Intake Availability',
      passed: false,
      reason: `Destination shelter has paused intake: "${shelter.closureReason || 'Capacity full / Maintenance'}".`,
      critical: true,
    });
  } else {
    hardChecks.push({
      id: 'shelter_open',
      name: 'Shelter Intake Availability',
      passed: true,
      reason: 'Destination shelter is operational with intake active.',
      critical: false,
    });
  }

  // Check 5: Utilities for raw rations / dry grains
  if (batch.category === 'dry_rations') {
    if (!shelter.cookingFuelAvailable) {
      hardChecks.push({
        id: 'no_cooking_fuel',
        name: 'Cooking Fuel Readiness',
        passed: false,
        reason: 'Dry rations require cooking fuel / LPG which is currently interrupted at destination shelter.',
        critical: true,
      });
    }
    if (!shelter.cleanWaterAvailable) {
      hardChecks.push({
        id: 'no_clean_water',
        name: 'Potable Water Readiness',
        passed: false,
        reason: 'Clean water is required to prepare raw rations, but potable water supply is interrupted.',
        critical: true,
      });
    }
  }

  // Check 6: Medical supplies distinct category protocol
  if (batch.category === 'medical_supplies' || batch.isMedicalSupply) {
    if (!shelter.medicalClearanceStaffAvailable) {
      hardChecks.push({
        id: 'medical_staff_missing',
        name: 'Medical Staff Clearance',
        passed: false,
        reason: 'Medical & hygiene supplies require certified medical triage staff at destination facility.',
        critical: true,
      });
    } else {
      hardChecks.push({
        id: 'medical_staff_present',
        name: 'Medical Staff Clearance',
        passed: true,
        reason: 'Certified staff available for medical supply receipt.',
        critical: false,
      });
    }
  }

  // Check 7: Courier carrying capacity check
  const availableRiderCapacity = rider.carryingCapacity - rider.currentCommittedLoad;
  if (allocatedQuantity > availableRiderCapacity) {
    hardChecks.push({
      id: 'exceeds_rider_capacity',
      name: 'Courier Carrying Capacity',
      passed: false,
      reason: `Allocated quantity (${allocatedQuantity} units) exceeds courier remaining load capacity (${availableRiderCapacity} units).`,
      critical: true,
    });
  } else {
    hardChecks.push({
      id: 'within_rider_capacity',
      name: 'Courier Carrying Capacity',
      passed: true,
      reason: `Allocated payload (${allocatedQuantity} units) fits within courier payload capacity (${rider.carryingCapacity} max).`,
      critical: false,
    });
  }

  // Check 8: Batch remaining stock invariant
  if (allocatedQuantity > batch.remainingQuantity) {
    hardChecks.push({
      id: 'exceeds_batch_stock',
      name: 'Batch Remaining Quantity',
      passed: false,
      reason: `Requested allocation (${allocatedQuantity}) exceeds remaining available batch stock (${batch.remainingQuantity}).`,
      critical: true,
    });
  } else {
    hardChecks.push({
      id: 'within_batch_stock',
      name: 'Batch Remaining Quantity',
      passed: true,
      reason: `Allocated quantity fits within unreserved batch balance (${batch.remainingQuantity} remaining).`,
      critical: false,
    });
  }

  // Overall hard eligibility check
  const criticalFailures = hardChecks.filter((c) => !c.passed);
  const isEligible = criticalFailures.length === 0;
  const hardBlockReason = !isEligible ? criticalFailures[0].reason : undefined;

  // Prioritization factors (0-100)
  const factors: PrioritizationFactor[] = [];

  // Factor 1: Deadline Urgency (Weight 30%)
  const hoursLeft = Math.max(0, (deadlineTime - now) / (3600 * 1000));
  let urgencyScore = 30;
  if (hoursLeft <= 1.5) urgencyScore = 98;
  else if (hoursLeft <= 3) urgencyScore = 88;
  else if (hoursLeft <= 5) urgencyScore = 72;
  else if (hoursLeft <= 8) urgencyScore = 55;
  factors.push({
    id: 'urgency',
    name: 'Safe-Use Deadline Urgency',
    score: urgencyScore,
    weight: 0.3,
    weightedScore: Math.round(urgencyScore * 0.3 * 10) / 10,
    explanation: `${Math.round(hoursLeft * 10) / 10} hours remaining before expiration. High priority for rapid rescue.`,
  });

  // Factor 2: Shelter Vulnerability & Need (Weight 25%)
  const occupancyRate = shelter.currentOccupants / Math.max(1, shelter.totalBedCapacity);
  const isUrgentNeed = shelter.urgentNeeds.some((need) =>
    need.toLowerCase().includes(batch.category.replace('_', ' '))
  );
  let needScore = Math.min(100, Math.round(occupancyRate * 80 + (isUrgentNeed ? 20 : 0)));
  factors.push({
    id: 'need',
    name: 'Shelter Need & Vulnerability',
    score: needScore,
    weight: 0.25,
    weightedScore: Math.round(needScore * 0.25 * 10) / 10,
    explanation: `${Math.round(occupancyRate * 100)}% current bed occupancy${
      isUrgentNeed ? ' + matched shelter urgent needs list' : ''
    }.`,
  });

  // Factor 3: Transit Feasibility & Proximity (Weight 15%)
  const totalDuration = pickupMinutes + travelMinutes;
  let proximityScore = 40;
  if (totalDuration <= 25) proximityScore = 95;
  else if (totalDuration <= 40) proximityScore = 80;
  else if (totalDuration <= 60) proximityScore = 65;
  factors.push({
    id: 'transit_proximity',
    name: 'Courier Proximity & Transit Time',
    score: proximityScore,
    weight: 0.15,
    weightedScore: Math.round(proximityScore * 0.15 * 10) / 10,
    explanation: `Estimated total route time: ${totalDuration} minutes (Pickup: ${pickupMinutes}m + Transit: ${travelMinutes}m).`,
  });

  // Factor 4: Courier Capacity Match (Weight 15%)
  const loadRatio = allocatedQuantity / Math.max(1, rider.carryingCapacity);
  let capacityScore = Math.min(100, Math.round(loadRatio * 90 + 10));
  factors.push({
    id: 'capacity_match',
    name: 'Courier Capacity Match',
    score: capacityScore,
    weight: 0.15,
    weightedScore: Math.round(capacityScore * 0.15 * 10) / 10,
    explanation: `Fills ${Math.round(loadRatio * 100)}% of courier payload capacity (${allocatedQuantity}/${rider.carryingCapacity} ${batch.quantityUnit}).`,
  });

  // Factor 5: Site Infrastructure Confidence (Weight 15%)
  let siteScore = 60;
  if (shelter.cleanWaterAvailable && shelter.cookingFuelAvailable) siteScore = 100;
  else if (shelter.cleanWaterAvailable) siteScore = 85;
  factors.push({
    id: 'site_confidence',
    name: 'Receiving Site Infrastructure',
    score: siteScore,
    weight: 0.15,
    weightedScore: Math.round(siteScore * 0.15 * 10) / 10,
    explanation: `Clean water: ${shelter.cleanWaterAvailable ? 'Available' : 'Unavailable'}, Fuel: ${
      shelter.cookingFuelAvailable ? 'Available' : 'Unavailable'
    }.`,
  });

  const prioritizationScore = Math.round(
    factors.reduce((sum, f) => sum + f.weightedScore, 0)
  );

  return {
    isEligible,
    hardChecks,
    hardBlockReason,
    prioritizationScore,
    factors,
    recommendation: isEligible
      ? 'APPROVED'
      : 'BLOCKED_HARD_SAFETY',
    assessedAt: new Date().toISOString(),
  };
}
