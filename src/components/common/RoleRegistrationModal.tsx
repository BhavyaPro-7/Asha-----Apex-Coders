import React, { useState } from 'react';
import { useAuthRole } from '../../context/AuthRoleContext';
import { mockDb } from '../../data/mockDatabase';
import { RoleType, UserIdentity } from '../../types';
import {
  Building2,
  Bike,
  ShieldCheck,
  X,
  CheckCircle2,
  ArrowRight,
  PackageCheck,
  UserPlus,
} from 'lucide-react';

interface RoleRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: 'shelter' | 'rider' | 'coordinator';
}

export const RoleRegistrationModal: React.FC<RoleRegistrationModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'shelter',
}) => {
  const { registerAndSwitchRole } = useAuthRole();
  const [targetRole, setTargetRole] = useState<'shelter' | 'rider' | 'coordinator'>(defaultRole);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Shelter Form
  const [shelterForm, setShelterForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    address: '',
    totalBeds: 80,
    mealCapacity: 150,
    hasColdStorage: false,
    vegOnly: true,
  });

  // Rider Form
  const [riderForm, setRiderForm] = useState({
    name: '',
    phone: '',
    vehicleType: 'Motorcycle with Insulated Box',
    carryingCapacity: 40,
    zone: 'Dadar / Central Mumbai',
  });

  // Coordinator Form
  const [coordForm, setCoordForm] = useState({
    name: '',
    organization: 'City Relief Operations',
    phone: '',
  });

  if (!isOpen) return null;

  const handleShelterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shelterForm.name || !shelterForm.phone || !shelterForm.contactPerson) return;

    const shelter = mockDb.registerShelter({
      name: shelterForm.name,
      address: shelterForm.address || `${shelterForm.name}, Mumbai`,
      contactPerson: shelterForm.contactPerson,
      phone: shelterForm.phone,
      totalBedCapacity: Number(shelterForm.totalBeds) || 60,
      mealIntakeCapacity: Number(shelterForm.mealCapacity) || 120,
      coldStorageAvailable: shelterForm.hasColdStorage,
      vegOnly: shelterForm.vegOnly,
    });

    const newIdentity: UserIdentity = {
      id: `user-${shelter.id}`,
      name: shelterForm.contactPerson,
      role: 'shelter',
      organization: shelter.name,
      phone: shelter.phone,
      associatedId: shelter.id,
    };

    setSuccessMsg(`Registered ${shelter.name}! Opening Shelter Console...`);
    setTimeout(() => {
      registerAndSwitchRole(newIdentity);
      onClose();
    }, 800);
  };

  const handleRiderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!riderForm.name || !riderForm.phone) return;

    const rider = mockDb.registerRider({
      name: riderForm.name,
      phone: riderForm.phone,
      vehicleType: riderForm.vehicleType,
      carryingCapacity: Number(riderForm.carryingCapacity) || 40,
      zone: riderForm.zone,
    });

    const newIdentity: UserIdentity = {
      id: `user-${rider.id}`,
      name: rider.name,
      role: 'rider',
      organization: 'Volunteer Courier',
      phone: rider.phone,
      associatedId: rider.id,
    };

    setSuccessMsg(`Welcome, ${rider.name}! Opening Rider Console...`);
    setTimeout(() => {
      registerAndSwitchRole(newIdentity);
      onClose();
    }, 800);
  };

  const handleCoordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coordForm.name || !coordForm.phone) return;

    const identity = mockDb.registerCoordinator({
      name: coordForm.name,
      organization: coordForm.organization,
      phone: coordForm.phone,
    });

    setSuccessMsg(`Welcome, Coordinator ${identity.name}!`);
    setTimeout(() => {
      registerAndSwitchRole(identity);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-stone-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">Register with AIDFLOW</h2>
              <p className="text-xs text-stone-500">Join as a Shelter, Delivery Rider, or Dispatcher</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Tabs */}
        <div className="grid grid-cols-3 p-2 bg-stone-100 border-b border-stone-200 gap-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTargetRole('shelter')}
            className={`py-2 px-3 rounded-md flex items-center justify-center gap-1.5 transition-all ${
              targetRole === 'shelter'
                ? 'bg-white text-stone-900 shadow-xs border border-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Building2 className="w-4 h-4 text-purple-600" />
            <span>Shelter</span>
          </button>
          <button
            type="button"
            onClick={() => setTargetRole('rider')}
            className={`py-2 px-3 rounded-md flex items-center justify-center gap-1.5 transition-all ${
              targetRole === 'rider'
                ? 'bg-white text-stone-900 shadow-xs border border-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Bike className="w-4 h-4 text-blue-600" />
            <span>Rider</span>
          </button>
          <button
            type="button"
            onClick={() => setTargetRole('coordinator')}
            className={`py-2 px-3 rounded-md flex items-center justify-center gap-1.5 transition-all ${
              targetRole === 'coordinator'
                ? 'bg-white text-stone-900 shadow-xs border border-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-stone-800" />
            <span>Coordinator</span>
          </button>
        </div>

        {/* Success Banner */}
        {successMsg && (
          <div className="m-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Forms Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {targetRole === 'shelter' && (
            <form onSubmit={handleShelterSubmit} className="space-y-4">
              <div>
                <label className="block font-medium text-stone-800 mb-1">Shelter / Organization Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bandra Community Night Shelter"
                  value={shelterForm.name}
                  onChange={(e) => setShelterForm({ ...shelterForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-md focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-800 mb-1">Contact Person *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={shelterForm.contactPerson}
                    onChange={(e) => setShelterForm({ ...shelterForm, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-md focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-800 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98200 12345"
                    value={shelterForm.phone}
                    onChange={(e) => setShelterForm({ ...shelterForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-md focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-800 mb-1">Address & Area</label>
                <input
                  type="text"
                  placeholder="e.g. Hill Road, Near Station, Bandra West"
                  value={shelterForm.address}
                  onChange={(e) => setShelterForm({ ...shelterForm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-md focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-800 mb-1">Total Bed Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={shelterForm.totalBeds}
                    onChange={(e) => setShelterForm({ ...shelterForm, totalBeds: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-md focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-800 mb-1">Meal Capacity (Per Day)</label>
                  <input
                    type="number"
                    min="1"
                    value={shelterForm.mealCapacity}
                    onChange={(e) => setShelterForm({ ...shelterForm, mealCapacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-md focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shelterForm.hasColdStorage}
                    onChange={(e) => setShelterForm({ ...shelterForm, hasColdStorage: e.target.checked })}
                    className="rounded text-emerald-600 w-4 h-4"
                  />
                  <span className="text-stone-700">Has refrigerator / cold storage for perishable food</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shelterForm.vegOnly}
                    onChange={(e) => setShelterForm({ ...shelterForm, vegOnly: e.target.checked })}
                    className="rounded text-emerald-600 w-4 h-4"
                  />
                  <span className="text-stone-700">Accept pure vegetarian food only</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 mt-4 text-sm"
              >
                <span>Register & Open Shelter Console</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {targetRole === 'rider' && (
            <form onSubmit={handleRiderSubmit} className="space-y-4">
              <div>
                <label className="block font-medium text-stone-800 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sameer Kulkarni"
                  value={riderForm.name}
                  onChange={(e) => setRiderForm({ ...riderForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-md focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-800 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98111 22334"
                    value={riderForm.phone}
                    onChange={(e) => setRiderForm({ ...riderForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-md focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-800 mb-1">Carry Capacity (Meals) *</label>
                  <input
                    type="number"
                    min="10"
                    max="150"
                    value={riderForm.carryingCapacity}
                    onChange={(e) => setRiderForm({ ...riderForm, carryingCapacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-md focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-800 mb-1">Vehicle / Bag Type</label>
                <select
                  value={riderForm.vehicleType}
                  onChange={(e) => setRiderForm({ ...riderForm, vehicleType: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white focus:border-emerald-600 focus:outline-hidden"
                >
                  <option value="Motorcycle with Insulated Box">Motorcycle with Insulated Box (40 meals)</option>
                  <option value="Electric Cargo Bicycle">Electric Cargo Bicycle (60 meals)</option>
                  <option value="Four-Wheeler / Delivery Van">Four-Wheeler / Delivery Van (100 meals)</option>
                  <option value="Two-Wheeler Backpack">Two-Wheeler Backpack (20 meals)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-stone-800 mb-1">Primary Operating Area</label>
                <input
                  type="text"
                  value={riderForm.zone}
                  onChange={(e) => setRiderForm({ ...riderForm, zone: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-md focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 mt-4 text-sm"
              >
                <span>Register & Open Rider Console</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {targetRole === 'coordinator' && (
            <form onSubmit={handleCoordSubmit} className="space-y-4">
              <div>
                <label className="block font-medium text-stone-800 mb-1">Coordinator Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anita Deshmukh"
                  value={coordForm.name}
                  onChange={(e) => setCoordForm({ ...coordForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-md focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-800 mb-1">Organization / Department *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. City Civic Disaster Response"
                  value={coordForm.organization}
                  onChange={(e) => setCoordForm({ ...coordForm, organization: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-md focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-800 mb-1">Emergency Dispatch Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98200 99999"
                  value={coordForm.phone}
                  onChange={(e) => setCoordForm({ ...coordForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-md focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 mt-4 text-sm"
              >
                <span>Open Dispatch Console</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
