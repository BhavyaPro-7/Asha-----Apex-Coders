import React, { useState } from 'react';
import {
  AidBatch,
  Delivery,
  ShelterProfile,
  RiderProfile,
  WeatherCondition,
} from '../../types';
import { mockDb } from '../../data/mockDatabase';
import { useTranslation } from '../../i18n/LanguageContext';
import {
  MapPin,
  CloudRain,
  Sun,
  AlertTriangle,
  Building2,
  Package,
  Bike,
  Wind,
  Droplets,
  Thermometer,
  ShieldAlert,
  Info,
  CheckCircle,
  Clock,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

interface CoordinatorMapAndWeatherProps {
  batches: AidBatch[];
  deliveries: Delivery[];
  shelters: ShelterProfile[];
  riders: RiderProfile[];
  weather: WeatherCondition;
  onSelectDelivery: (del: Delivery) => void;
}

export const CoordinatorMapAndWeather: React.FC<CoordinatorMapAndWeatherProps> = ({
  batches,
  deliveries,
  shelters,
  riders,
  weather,
  onSelectDelivery,
}) => {
  const { t } = useTranslation();
  const [selectedEntity, setSelectedEntity] = useState<{
    type: 'donor' | 'shelter' | 'rider';
    data: any;
  } | null>(null);

  // Convert simulated lat/lng to SVG percentage coordinates (Mumbai bounds ~18.96 to 19.08 lat, 72.81 to 72.92 lng)
  const mapMinLat = 18.96;
  const mapMaxLat = 19.08;
  const mapMinLng = 72.81;
  const mapMaxLng = 72.92;

  const projectToMap = (coord: { lat: number; lng: number }) => {
    // Invert lat for Y axis (higher lat = higher up = smaller Y)
    const y = ((mapMaxLat - coord.lat) / (mapMaxLat - mapMinLat)) * 80 + 10;
    const x = ((coord.lng - mapMinLng) / (mapMaxLng - mapMinLng)) * 80 + 10;
    return {
      x: Math.min(92, Math.max(8, x)),
      y: Math.min(92, Math.max(8, y)),
    };
  };

  const handleToggleWeatherAlert = () => {
    mockDb.toggleSimulatedWeatherAlert(!weather.isSimulatedAlert);
  };

  // Find deliveries potentially passing through affected weather sectors
  const affectedDeliveries = weather.isSimulatedAlert
    ? deliveries.filter(
        (d) =>
          d.status === 'IN_TRANSIT' ||
          d.status === 'ASSIGNED' ||
          d.status === 'ACKNOWLEDGED' ||
          d.status === 'BLOCKED'
      )
    : [];

  return (
    <div className="space-y-6">
      {/* WEATHER MONITORING PANEL */}
      <div
        className={`border rounded-lg p-5 transition-all ${
          weather.isSimulatedAlert
            ? 'bg-amber-50/70 border-amber-300 text-amber-950'
            : 'bg-white border-stone-200 text-stone-900'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`p-3 rounded-md shrink-0 ${
                weather.isSimulatedAlert
                  ? 'bg-amber-500 text-white'
                  : 'bg-stone-100 text-stone-700'
              }`}
            >
              {weather.isSimulatedAlert ? (
                <CloudRain className="w-6 h-6 animate-pulse" />
              ) : (
                <Sun className="w-6 h-6 text-amber-500" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">{weather.condition}</span>
                {weather.isSimulatedAlert ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold uppercase tracking-wider">
                    SIMULATED SEVERE ALERT
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                    NORMAL FORECAST
                  </span>
                )}
              </div>

              <p className="text-xs text-stone-600 mt-0.5">
                Source: {weather.source} · {weather.forecastPeriod}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleWeatherAlert}
              className={`px-3.5 py-2 text-xs font-semibold rounded border transition-colors ${
                weather.isSimulatedAlert
                  ? 'bg-white border-amber-400 text-amber-900 hover:bg-amber-100'
                  : 'bg-stone-900 border-stone-900 text-white hover:bg-stone-800'
              }`}
            >
              {weather.isSimulatedAlert
                ? 'Clear Simulated Weather Alert'
                : 'Simulate Severe Monsoon Waterlogging Alert'}
            </button>
          </div>
        </div>

        {/* Weather Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-stone-200/60 text-xs">
          <div className="flex items-center gap-2 text-stone-700">
            <Thermometer className="w-4 h-4 text-stone-400" />
            <span>
              Temperature: <strong>{weather.temperature}°C</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-stone-700">
            <Droplets className="w-4 h-4 text-stone-400" />
            <span>
              Precipitation: <strong>{weather.rainfallMm} mm/h</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-stone-700">
            <Wind className="w-4 h-4 text-stone-400" />
            <span>
              Wind Gusts: <strong>{weather.windSpeedKmh} km/h</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-stone-500 font-mono text-[11px]">
            <Clock className="w-3.5 h-3.5" />
            <span>Updated: {new Date(weather.lastUpdated).toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Severe Alert Operational Response Banner */}
        {weather.isSimulatedAlert && (
          <div className="mt-4 p-4 bg-red-100/80 border border-red-300 rounded text-xs text-red-950 space-y-2">
            <div className="flex items-start gap-2">
              <ShieldAlert className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
              <div>
                <strong>Active Warning: {weather.warningMessage}</strong>
                <p className="mt-1 leading-relaxed text-red-900">
                  Affected Transit Corridors:{' '}
                  <span className="font-semibold">
                    {weather.affectedSectors.join(' · ')}
                  </span>
                  .
                </p>
                <p className="mt-1 text-[11px] text-stone-700">
                  <em>Protocol:</em> Human coordinator review required. Automatic redirection is
                  intentionally disabled to prevent unverified re-routing into flooded bottlenecks.
                </p>
              </div>
            </div>

            {affectedDeliveries.length > 0 && (
              <div className="mt-2 pt-2 border-t border-red-200">
                <span className="font-semibold text-stone-900">
                  {affectedDeliveries.length} Active Missions in Potential Weather Danger Zone:
                </span>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {affectedDeliveries.map((del) => (
                    <button
                      key={del.id}
                      onClick={() => onSelectDelivery(del)}
                      className="px-2.5 py-1 bg-white border border-red-300 rounded font-mono text-[11px] hover:bg-red-50 text-stone-900"
                    >
                      {del.deliveryCode} ({del.riderName}) →
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* GEOSPATIAL MAP PANEL */}
      <div className="bg-white border border-stone-200 rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <span>Coordinator Operations Map (Mumbai Metropolitan Civic Cluster)</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Simulated Civic Geospatial Map (Demo Environment) — Click any node for authorized records.
            </p>
          </div>

          {/* Map Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-600" />
              <span>Donor Kitchen</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-purple-600" />
              <span>Shelter Intake</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-600" />
              <span>Volunteer Courier</span>
            </div>
          </div>
        </div>

        {/* Map Canvas Visualizer */}
        <div className="relative w-full h-[360px] bg-stone-100 border border-stone-200 rounded-lg overflow-hidden">
          {/* Subtle Sector Grid Overlay */}
          <div className="absolute inset-0 grid grid-cols-4 grid-rows-3 opacity-25 pointer-events-none">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="border border-stone-300" />
            ))}
          </div>

          {/* Sector Labels */}
          <div className="absolute top-2 left-3 text-[10px] font-mono text-stone-400">
            WEST SECTOR (Bandra / Khar)
          </div>
          <div className="absolute top-2 right-3 text-[10px] font-mono text-stone-400">
            EAST SECTOR (Chembur / Trombay)
          </div>
          <div className="absolute bottom-2 left-3 text-[10px] font-mono text-stone-400">
            SOUTH SECTOR (Byculla / Lower Parel)
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-mono text-stone-400">
            CENTRAL (Dharavi / Sion)
          </div>

          {/* Simulated Severe Weather Hazard Box if alert is active */}
          {weather.isSimulatedAlert && (
            <div className="absolute top-[35%] left-[40%] w-[28%] h-[30%] bg-red-500/20 border-2 border-dashed border-red-500 rounded flex items-center justify-center pointer-events-none">
              <span className="bg-red-700 text-white font-mono text-[10px] px-2 py-0.5 rounded shadow">
                HAZARD: SION WATERLOGGED
              </span>
            </div>
          )}

          {/* Render Donor Nodes */}
          {batches.map((batch) => {
            const pos = projectToMap(batch.coordinates);
            return (
              <button
                key={batch.id}
                onClick={() => setSelectedEntity({ type: 'donor', data: batch })}
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white border-2 border-emerald-600 shadow-md hover:scale-125 transition-transform z-20 group"
                title={`Donor: ${batch.donorOrganization}`}
              >
                <Package className="w-3.5 h-3.5 text-emerald-700" />
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-stone-900 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap z-30">
                  {batch.donorOrganization} ({batch.remainingQuantity} {batch.quantityUnit})
                </span>
              </button>
            );
          })}

          {/* Render Shelter Nodes */}
          {shelters.map((shelter) => {
            const pos = projectToMap(shelter.coordinates);
            return (
              <button
                key={shelter.id}
                onClick={() => setSelectedEntity({ type: 'shelter', data: shelter })}
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white border-2 shadow-md hover:scale-125 transition-transform z-20 group ${
                  shelter.isTemporarilyClosed ? 'border-red-600' : 'border-purple-600'
                }`}
                title={`Shelter: ${shelter.name}`}
              >
                <Building2
                  className={`w-3.5 h-3.5 ${
                    shelter.isTemporarilyClosed ? 'text-red-700' : 'text-purple-700'
                  }`}
                />
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-stone-900 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap z-30">
                  {shelter.name} ({shelter.totalBedCapacity - shelter.currentOccupants} beds open)
                </span>
              </button>
            );
          })}

          {/* Render Courier Nodes */}
          {riders.map((rider) => {
            const pos = projectToMap(rider.coordinates);
            return (
              <button
                key={rider.id}
                onClick={() => setSelectedEntity({ type: 'rider', data: rider })}
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white border-2 border-blue-600 shadow-md hover:scale-125 transition-transform z-20 group"
                title={`Courier: ${rider.name}`}
              >
                <Bike className="w-3.5 h-3.5 text-blue-700" />
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-stone-900 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap z-30">
                  {rider.name} ({rider.currentCommittedLoad}/{rider.carryingCapacity} cap)
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Entity Card Detail */}
        {selectedEntity && (
          <div className="p-4 bg-stone-50 border border-stone-200 rounded-md text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-900 uppercase tracking-wide">
                Node Inspection: {selectedEntity.type.toUpperCase()}
              </span>
              <button
                onClick={() => setSelectedEntity(null)}
                className="text-stone-400 hover:text-stone-700 font-bold"
              >
                ×
              </button>
            </div>

            {selectedEntity.type === 'donor' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-stone-500">Organization:</span>{' '}
                  <strong className="text-stone-900">{selectedEntity.data.donorOrganization}</strong>
                </div>
                <div>
                  <span className="text-stone-500">Total Available:</span>{' '}
                  <strong className="text-emerald-700">
                    {selectedEntity.data.remainingQuantity} / {selectedEntity.data.quantityValue}{' '}
                    {selectedEntity.data.quantityUnit}
                  </strong>
                </div>
                <div>
                  <span className="text-stone-500">Safe Use Deadline:</span>{' '}
                  <span>
                    {new Date(selectedEntity.data.safeUseDeadline).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            )}

            {selectedEntity.type === 'shelter' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-stone-500">Shelter:</span>{' '}
                  <strong className="text-stone-900">{selectedEntity.data.name}</strong>
                </div>
                <div>
                  <span className="text-stone-500">Beds:</span>{' '}
                  <strong className="text-stone-900">
                    {selectedEntity.data.currentOccupants} / {selectedEntity.data.totalBedCapacity}
                  </strong>
                </div>
                <div>
                  <span className="text-stone-500">Intake Policy:</span>{' '}
                  <span>{selectedEntity.data.vegOnly ? 'Pure Veg' : 'Universal'}</span>
                </div>
              </div>
            )}

            {selectedEntity.type === 'rider' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-stone-500">Courier:</span>{' '}
                  <strong className="text-stone-900">{selectedEntity.data.name}</strong>
                </div>
                <div>
                  <span className="text-stone-500">Carrying Capacity:</span>{' '}
                  <strong className="text-blue-700 font-mono">
                    {selectedEntity.data.currentCommittedLoad} / {selectedEntity.data.carryingCapacity}{' '}
                    units
                  </strong>
                </div>
                <div>
                  <span className="text-stone-500">Vehicle:</span>{' '}
                  <span>{selectedEntity.data.vehicleType}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
