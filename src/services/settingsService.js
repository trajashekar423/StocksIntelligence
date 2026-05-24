import api from './api';
import { getUser } from '../utils/authStorage';

export const fetchLoyaltyProgram  = ()     => api.get('/api/v1/merchant/loyalty-program/').then(r => r.data?.data);
export const updateLoyaltyProgram = (body) => api.put('/api/v1/merchant/loyalty-program/', body).then(r => r.data);

export function getStoreStatusCounts(stores = []) {
  return stores.reduce((acc, s) => {
    s.status === 'ACTIVE' ? acc.active++ : acc.inactive++;
    acc.total++;
    return acc;
  }, { active: 0, inactive: 0, total: 0 });
}

function unwrapMerchantLocations(data) {
  const payload = data?.results?.data ?? data?.results ?? data?.data ?? data;

  if (Array.isArray(payload)) {
    if (payload.length === 1 && Array.isArray(payload[0]?.locations)) return payload[0].locations;
    return payload;
  }

  if (Array.isArray(payload?.locations)) return payload.locations;
  return payload ? [payload] : [];
}

function buildFullAddress(store) {
  return [
    store.address || store.street,
    store.city,
    store.state,
    store.zip_code || store.zip,
  ].filter(Boolean).join(', ');
}

export async function fetchStoreSettings() {
  const response  = await api.get('/api/v1/merchants/');
  const merchant  = Array.isArray(response.data?.results) ? response.data.results[0] : response.data?.results;
  const locations = unwrapMerchantLocations(response.data);
  const loginUser = getUser();

  return locations.map((loc) => {
    const businessId = loc.business_id ?? loc.id;
    const loginBiz   = loginUser?.businesses?.find(b => b.business_id === businessId);
    const nameParts  = loc.business_name?.split(' - ');
    const city       = loc.city || (nameParts?.length > 1 ? nameParts[nameParts.length - 1].trim() : '-');
    const fullAddress = buildFullAddress(loc);
    const isActive = loc.is_active ?? loginBiz?.website_access_enabled ?? true;

    return {
      id:            businessId,
      business_id:   businessId,
      business_name: loc.business_name       || merchant?.merchant_name || 'Unnamed',
      name:          loc.business_name       || merchant?.merchant_name || 'Unnamed',
      city,
      state:         loc.state               || '',
      zip_code:      loc.zip_code || loc.zip || '',
      fullAddress,
      full_address:  fullAddress,
      address:       fullAddress             || '-',
      phone:         loc.phone_number        || '-',
      email:         loc.business_email      || '-',
      manager:       '',
      managerCount:  0,
      is_active:     isActive,
      status:        isActive ? 'ACTIVE' : 'INACTIVE',
      managerLogin:  loginBiz?.device_login_enabled ?? false,
    };
  });
}
