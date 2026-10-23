import React, { useState, useMemo } from 'react';
import { AidBatch, RiderProfile, ShelterProfile, Delivery } from '../../types';
import { mockDb } from '../../data/mockDatabase';
import { getDeliveryMatchScore } from '../../data/scoringSystem';
import {
  MapPin,
  Bike,
  Building2,
  Navigation,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Maximize2,
  Minimize2,
  Layers,
  Filter,
  Check,
  Package,
} from 'lucide-react';

interface RiderMapViewProps {
  rider: RiderProfile | null;
  onDeliveryClaimed: (delivery: Delivery) => void;
}

export const RiderMapView: React.FC<RiderMapViewProps> = ({
  rider,
  onDeliveryClaimed,
}) => {
  const [batches, setBatches] = useState<AidBatch[]>(() =>
    mockDb.getBatches().filter((b) => b.status === 'AVAILABLE' && b.remainingQuantity > 0)
  );
  const [shelters, setShelters] = useState<ShelterProfile[]>(() =>
    mockDb.getShelters().filter((s) => !s.isTemporarilyClosed)
  );
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(10);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [claimFeedback, setClaimFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Rider coordinates (default to Dadar/Central Mumbai if null)
  const riderCoords = rider?.coordinates || { lat: 19.021, lng: 72.842 };

  // Helper: calculate distance in km using Haversine formula
  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  };

  // Filter batches by distance and available capacity
  const nearbyBatches = useMemo(() => {
    return batches
      .map((batch) => {
        const dist = getDistanceKm(
          riderCoords.lat,
          riderCoords.lng,
          batch.coordinates.lat,
          batch.coordinates.lng
        );
        const match = getDeliveryMatchScore(batch);
        return { ...batch, distanceKm: dist, matchScore: match.score, matchLabel: match.label };
      })
      .filter((b) => b.distanceKm <= maxDistanceKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [batches, riderCoords, maxDistanceKm]);

  // Selected batch
  const selectedBatch = nearbyBatches.find((b) => b.id === selectedBatchId) || nearbyBatches[0] || null;

  // Selected batch's target shelter
  const targetShelter = useMemo(() => {
    if (!selectedBatch) return shelters[0] || null;
    return shelters.find((s) => !s.vegOnly || selectedBatch.dietaryType === 'pure_veg') || shelters[0];
  }, [selectedBatch, shelters]);

  // Map coordinate transformation bounds (Mumbai Region)
  // Lat: 18.96 to 19.09, Lng: 72.81 to 72.91
  const mapBounds = {
    minLat: 18.96,
    maxLat: 19.09,
    minLng: 72.81,
    maxLng: 72.91,
  };

  const projectToMap = (lat: number, lng: number) => {
    // Map to 0-100% SVG coordinates
    const x = ((lng - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng)) * 100;
    // Invert Y because latitude increases northward (upward)
    const y = 100 - ((lat - mapBounds.minLat) / (mapBounds.maxLat - mapBounds.minLat)) * 100;
    return {
      x: Math.max(8, Math.min(92, x)),
      y: Math.max(8, Math.min(92, y)),
    };
  };

  const riderPos = projectToMap(riderCoords.lat, riderCoords.lng);
  const selectedPickupPos = selectedBatch ? projectToMap(selectedBatch.coordinates.lat, selectedBatch.coordinates.lng) : null;
  const selectedShelterPos = targetShelter ? projectToMap(targetShelter.coordinates.lat, targetShelter.coordinates.lng) : null;

  // Handle Accept Delivery
  const handleClaim = (batchId: string) => {
    if (!rider) return;
    setIsClaiming(true);
    setClaimFeedback(null);

    try {
      const delivery = mockDb.claimNearbyBatchByRider(batchId, rider.id);
      setClaimFeedback({
        type: 'success',
        message: `Accepted delivery ${delivery.deliveryCode}! Pick up ${delivery.quantityValue} ${delivery.quantityUnit} at ${delivery.donorOrganization}.`,
      });
      // Refresh local list
      setBatches(mockDb.getBatches().filter((b) => b.status === 'AVAILABLE' && b.remainingQuantity > 0));
      onDeliveryClaimed(delivery);
    } catch (err: any) {
      setClaimFeedback({
        type: 'error',
        message: err.message || 'Failed to claim delivery.',
      });
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="bg-white border border-stone-200 rounded-lg p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-stone-900">Nearby Deliveries Map</h2>
            <p className="text-xs text-stone-500">
              {nearbyBatches.length} surplus batches available near {rider?.zone || 'your location'}
            </p>
          </div>
        </div>

        {/* Filters and View Switcher */}
        <div className="flex items-center gap-2">
          {/* Distance Filter */}
          <div className="flex items-center bg-stone-100 p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => setMaxDistanceKm(3)}
              className={`px-2.5 py-1.5 rounded-md transition-colors ${
                maxDistanceKm === 3 ? 'bg-white text-stone-900 font-bold shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              &lt; 3 km
            </button>
            <button
              onClick={() => setMaxDistanceKm(5)}
              className={`px-2.5 py-1.5 rounded-md transition-colors ${
                maxDistanceKm === 5 ? 'bg-white text-stone-900 font-bold shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              &lt; 5 km
            </button>
            <button
              onClick={() => setMaxDistanceKm(15)}
              className={`px-2.5 py-1.5 rounded-md transition-colors ${
                maxDistanceKm === 15 ? 'bg-white text-stone-900 font-bold shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All
            </button>
          </div>

          {/* Map vs List Toggle */}
          <div className="flex items-center bg-stone-100 p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                viewMode === 'map' ? 'bg-white text-stone-900 font-bold shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Map
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white text-stone-900 font-bold shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Claim Feedback Banner */}
      {claimFeedback && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
            claimFeedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-red-50 border border-red-200 text-red-900'
          }`}
        >
          {claimFeedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{claimFeedback.message}</span>
        </div>
      )}

      {/* Map View Mode */}
      {viewMode === 'map' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Visual Interactive Map Canvas */}
          <div className="lg:col-span-2 bg-stone-900 rounded-xl overflow-hidden shadow-xs relative h-[420px] sm:h-[480px] border border-stone-800">
            {/* Map Legend */}
            <div className="absolute top-3 left-3 z-20 bg-stone-900/90 backdrop-blur-xs border border-stone-700/60 rounded-lg px-3 py-2 text-[11px] text-white flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                <span>You (Rider)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Food Pickup</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                <span>Shelter Dropoff</span>
              </div>
            </div>

            {/* Scale / Zone indicator */}
            <div className="absolute bottom-3 left-3 z-20 bg-stone-900/80 backdrop-blur-xs border border-stone-700/60 rounded px-2.5 py-1 text-[10px] text-stone-300 font-mono">
              Mumbai Central · Live Radius: {maxDistanceKm} km
            </div>

            {/* SVG Map Canvas */}
            <svg className="w-full h-full select-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Background Grid Lines (City Arterials) */}
              <defs>
                <pattern id="roadGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#262626" strokeWidth="0.3" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="#171717" />
              <rect width="100%" height="100%" fill="url(#roadGrid)" />

              {/* Major Transit Lines (Western Express Highway & Eastern Corridor) */}
              <path
                d="M 25 95 Q 35 60 40 40 T 45 5"
                fill="none"
                stroke="#404040"
                strokeWidth="1.2"
                strokeDasharray="2,2"
              />
              <path
                d="M 65 95 Q 60 65 65 35 T 75 5"
                fill="none"
                stroke="#404040"
                strokeWidth="1.2"
                strokeDasharray="2,2"
              />
              <path
                d="M 10 55 Q 45 50 85 45"
                fill="none"
                stroke="#525252"
                strokeWidth="0.8"
              />

              {/* Neighborhood Labels */}
              <text x="28" y="32" fill="#737373" fontSize="2.8" fontWeight="bold">BANDRA</text>
              <text x="36" y="60" fill="#737373" fontSize="2.8" fontWeight="bold">DADAR</text>
              <text x="66" y="52" fill="#737373" fontSize="2.8" fontWeight="bold">CHEMBUR</text>
              <text x="48" y="44" fill="#525252" fontSize="2.4">Dharavi</text>
              <text x="32" y="82" fill="#525252" fontSize="2.4">Byculla</text>

              {/* Rider Radius Circle */}
              <circle
                cx={riderPos.x}
                cy={riderPos.y}
                r={maxDistanceKm * 2.2}
                fill="#3b82f6"
                fillOpacity="0.06"
                stroke="#3b82f6"
                strokeWidth="0.4"
                strokeDasharray="1.5,1.5"
              />

              {/* Active Route Connecting Lines (if selected) */}
              {selectedPickupPos && (
                <>
                  {/* Leg 1: Rider to Pickup */}
                  <line
                    x1={riderPos.x}
                    y1={riderPos.y}
                    x2={selectedPickupPos.x}
                    y2={selectedPickupPos.y}
                    stroke="#10b981"
                    strokeWidth="0.9"
                    strokeDasharray="1.5,1"
                  />
                  {/* Leg 2: Pickup to Shelter */}
                  {selectedShelterPos && (
                    <line
                      x1={selectedPickupPos.x}
                      y1={selectedPickupPos.y}
                      x2={selectedShelterPos.x}
                      y2={selectedShelterPos.y}
                      stroke="#a855f7"
                      strokeWidth="0.9"
                      strokeDasharray="1.5,1"
                    />
                  )}
                </>
              )}

              {/* Shelter Destination Markers */}
              {shelters.map((shelter) => {
                const pos = projectToMap(shelter.coordinates.lat, shelter.coordinates.lng);
                const isTarget = targetShelter?.id === shelter.id;
                return (
                  <g key={shelter.id} className="cursor-pointer">
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={isTarget ? 3.2 : 2.2}
                      fill="#9333ea"
                      stroke="#ffffff"
                      strokeWidth={isTarget ? 0.8 : 0.4}
                    />
                    <text
                      x={pos.x}
                      y={pos.y - 3.5}
                      fill="#e9d5ff"
                      fontSize="2.1"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {shelter.name.split(' ')[0]}
                    </text>
                  </g>
                );
              })}

              {/* Nearby Batch Markers (Food Pickups) */}
              {nearbyBatches.map((batch) => {
                const pos = projectToMap(batch.coordinates.lat, batch.coordinates.lng);
                const isSelected = selectedBatch?.id === batch.id;
                return (
                  <g
                    key={batch.id}
                    onClick={() => setSelectedBatchId(batch.id)}
                    className="cursor-pointer group"
                  >
                    {isSelected && (
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r="4.8"
                        fill="#10b981"
                        fillOpacity="0.25"
                        stroke="#10b981"
                        strokeWidth="0.5"
                      />
                    )}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={isSelected ? 3.4 : 2.6}
                      fill="#059669"
                      stroke="#ffffff"
                      strokeWidth={isSelected ? 0.9 : 0.5}
                    />
                    {/* Badge text on pin */}
                    <text
                      x={pos.x}
                      y={pos.y + 0.8}
                      fill="#ffffff"
                      fontSize="1.8"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {batch.quantityValue}
                    </text>
                  </g>
                );
              })}

              {/* Rider Location Pin (Self) */}
              <g>
                <circle
                  cx={riderPos.x}
                  cy={riderPos.y}
                  r="4"
                  fill="#2563eb"
                  fillOpacity="0.2"
                />
                <circle
                  cx={riderPos.x}
                  cy={riderPos.y}
                  r="2.8"
                  fill="#2563eb"
                  stroke="#ffffff"
                  strokeWidth="0.8"
                />
                <text
                  x={riderPos.x}
                  y={riderPos.y + 4.5}
                  fill="#93c5fd"
                  fontSize="2.2"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  YOU
                </text>
              </g>
            </svg>
          </div>

          {/* Selected Delivery Details Card */}
          <div className="bg-white border border-stone-200 rounded-xl p-5 flex flex-col justify-between shadow-2xs">
            {selectedBatch ? (
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-3">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-stone-500 uppercase tracking-wider">
                      {selectedBatch.batchCode}
                    </span>
                    <h3 className="text-base font-bold text-stone-900 mt-0.5 leading-snug">
                      {selectedBatch.title}
                    </h3>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900">
                      Score {selectedBatch.matchScore}/100
                    </span>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-2 bg-stone-50 p-3 rounded-lg text-xs">
                  <div>
                    <span className="text-stone-500 text-[11px]">Available Food:</span>
                    <div className="font-bold text-stone-900 text-sm">
                      {selectedBatch.remainingQuantity} {selectedBatch.quantityUnit}
                    </div>
                  </div>
                  <div>
                    <span className="text-stone-500 text-[11px]">Distance:</span>
                    <div className="font-bold text-blue-700 text-sm">
                      {selectedBatch.distanceKm} km away
                    </div>
                  </div>
                </div>

                {/* Pickup & Destination Details */}
                <div className="space-y-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-stone-900">Pickup: {selectedBatch.donorOrganization}</div>
                      <div className="text-stone-600 text-[11px] leading-tight mt-0.5">
                        {selectedBatch.pickupAddress}
                      </div>
                    </div>
                  </div>

                  {targetShelter && (
                    <div className="flex items-start gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-purple-600 mt-1.5 shrink-0" />
                      <div>
                        <div className="font-semibold text-stone-900">Destination: {targetShelter.name}</div>
                        <div className="text-stone-600 text-[11px] leading-tight mt-0.5">
                          {targetShelter.address}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-stone-600 text-[11px] pt-1">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span>
                      Expires in:{' '}
                      {Math.max(
                        0,
                        Math.round(
                          (new Date(selectedBatch.safeUseDeadline).getTime() - Date.now()) / (3600 * 1000)
                        )
                      )}{' '}
                      hours
                    </span>
                  </div>
                </div>

                {/* Accept Delivery Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isClaiming || (rider ? rider.currentCommittedLoad >= rider.carryingCapacity : false)}
                    onClick={() => handleClaim(selectedBatch.id)}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-300 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm shadow-2xs"
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {isClaiming
                        ? 'Claiming...'
                        : `Accept Delivery (${Math.min(
                            selectedBatch.remainingQuantity,
                            rider ? rider.carryingCapacity - rider.currentCommittedLoad : 40
                          )} meals)`}
                    </span>
                  </button>
                  <p className="text-[11px] text-stone-500 text-center mt-2">
                    Accepting sets status to Confirmed and adds this to your active deliveries.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-stone-500 text-xs">
                <Package className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <span>No delivery selected. Tap a marker on the map to inspect food details.</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* List View Mode */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {nearbyBatches.map((batch) => (
            <div
              key={batch.id}
              className="bg-white border border-stone-200 rounded-lg p-4 hover:border-stone-400 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-mono font-bold text-stone-900">{batch.batchCode}</span>
                  <span className="px-2 py-0.5 rounded font-bold bg-amber-50 text-amber-900 text-[11px]">
                    Score {batch.matchScore}/100
                  </span>
                </div>
                <h4 className="font-bold text-stone-900 text-sm">{batch.title}</h4>
                <p className="text-xs text-stone-600 mt-1">{batch.donorOrganization}</p>
                <div className="mt-3 flex items-center gap-3 text-xs font-semibold">
                  <span className="text-stone-900 font-mono">
                    {batch.remainingQuantity} {batch.quantityUnit}
                  </span>
                  <span className="text-stone-300">·</span>
                  <span className="text-blue-700">{batch.distanceKm} km away</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBatchId(batch.id);
                    setViewMode('map');
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 rounded"
                >
                  View on Map
                </button>
                <button
                  type="button"
                  disabled={isClaiming}
                  onClick={() => handleClaim(batch.id)}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded transition-colors"
                >
                  Accept
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
