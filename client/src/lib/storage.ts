export interface BusinessInfo {
  name: string;
  email: string;
  address: string;
  phone: string;
  website: string;
  logo?: string;
  taxRate: number;
}

const BUSINESS_INFO_KEY = 'invoiceflow_business_info';

export const defaultBusinessInfo: BusinessInfo = {
  name: '',
  email: '',
  address: '',
  phone: '',
  website: '',
  taxRate: 0,
};

export function getBusinessInfo(): BusinessInfo {
  try {
    const stored = localStorage.getItem(BUSINESS_INFO_KEY);
    if (stored) {
      return { ...defaultBusinessInfo, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error loading business info:', error);
  }
  return defaultBusinessInfo;
}

export function setBusinessInfo(info: Partial<BusinessInfo>): void {
  try {
    const current = getBusinessInfo();
    const updated = { ...current, ...info };
    localStorage.setItem(BUSINESS_INFO_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving business info:', error);
  }
}
