import React, { createContext, useContext, useState } from 'react';
import { RoleType, UserIdentity, Delivery, AidBatch } from '../types';
import { DEMO_IDENTITIES } from '../data/mockDatabase';

interface AuthRoleContextType {
  activeRole: RoleType | null;
  activeIdentity: UserIdentity | null;
  selectRole: (role: RoleType) => void;
  registerAndSwitchRole: (identity: UserIdentity) => void;
  logout: () => void;
  isAuthorizedForDelivery: (delivery: Delivery) => boolean;
  isAuthorizedForBatch: (batch: AidBatch) => boolean;
}

const AuthRoleContext = createContext<AuthRoleContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'aidflow_active_role_v1';
const CUSTOM_IDENTITIES_KEY = 'aidflow_custom_identities_v1';

export const AuthRoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRole, setActiveRole] = useState<RoleType | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY) as RoleType;
      if (saved && (saved === 'donor' || saved === 'rider' || saved === 'shelter' || saved === 'coordinator')) {
        return saved;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [customIdentities, setCustomIdentities] = useState<Record<string, UserIdentity>>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_IDENTITIES_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const activeIdentity: UserIdentity | null = activeRole
    ? customIdentities[activeRole] || DEMO_IDENTITIES[activeRole]
    : null;

  const selectRole = (role: RoleType) => {
    setActiveRole(role);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, role);
    } catch {
      // ignore
    }
  };

  const registerAndSwitchRole = (identity: UserIdentity) => {
    const updated = { ...customIdentities, [identity.role]: identity };
    setCustomIdentities(updated);
    setActiveRole(identity.role);
    try {
      localStorage.setItem(CUSTOM_IDENTITIES_KEY, JSON.stringify(updated));
      localStorage.setItem(AUTH_STORAGE_KEY, identity.role);
    } catch {
      // ignore
    }
  };

  const logout = () => {
    setActiveRole(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const isAuthorizedForDelivery = (delivery: Delivery): boolean => {
    if (!activeIdentity) return false;
    if (activeIdentity.role === 'coordinator') return true;
    if (activeIdentity.role === 'donor') return delivery.donorId === activeIdentity.associatedId;
    if (activeIdentity.role === 'rider') return delivery.riderId === activeIdentity.associatedId;
    if (activeIdentity.role === 'shelter') return delivery.shelterId === activeIdentity.associatedId;
    return false;
  };

  const isAuthorizedForBatch = (batch: AidBatch): boolean => {
    if (!activeIdentity) return false;
    if (activeIdentity.role === 'coordinator') return true;
    if (activeIdentity.role === 'donor') return batch.donorId === activeIdentity.associatedId;
    return false;
  };

  return (
    <AuthRoleContext.Provider
      value={{
        activeRole,
        activeIdentity,
        selectRole,
        registerAndSwitchRole,
        logout,
        isAuthorizedForDelivery,
        isAuthorizedForBatch,
      }}
    >
      {children}
    </AuthRoleContext.Provider>
  );
};

export const useAuthRole = () => {
  const context = useContext(AuthRoleContext);
  if (!context) {
    throw new Error('useAuthRole must be used within an AuthRoleProvider');
  }
  return context;
};
