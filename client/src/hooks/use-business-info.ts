import { useState, useEffect } from 'react';
import { getBusinessInfo, setBusinessInfo, type BusinessInfo } from '@/lib/storage';

export function useBusinessInfo() {
  const [businessInfo, setBusinessInfoState] = useState<BusinessInfo>(getBusinessInfo);

  const updateBusinessInfo = (updates: Partial<BusinessInfo>) => {
    const updated = { ...businessInfo, ...updates };
    setBusinessInfoState(updated);
    setBusinessInfo(updates);
  };

  useEffect(() => {
    // Listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'invoiceflow_business_info') {
        setBusinessInfoState(getBusinessInfo());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return {
    businessInfo,
    updateBusinessInfo,
  };
}
