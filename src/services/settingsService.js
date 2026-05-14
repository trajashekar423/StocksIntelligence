import api from './api';
import { getUser } from '../utils/authStorage';

export function getStoreStatusCounts(stores = []) {
  return stores.reduce((acc, s) => {
    s.status === 'ACTIVE' ? acc.active++ : acc.inactive++;
    acc.total++;
    return acc;
  }, { active: 0, inactive: 0, total: 0 });
}

export async function fetchStoreSettings() {
  const response  = await api.get('/api/v1/merchants/');
  const merchant  = response.data?.results?.[0];
  const locations = merchant?.locations ?? [];
  const loginUser = getUser();

  return locations.map((loc) => {
    const loginBiz   = loginUser?.businesses?.find(b => b.business_id === loc.business_id);
    const nameParts  = loc.business_name?.split(' - ');
    const city       = loc.city || (nameParts?.length > 1 ? nameParts[nameParts.length - 1].trim() : '—');
    const addressParts = [loc.address || loc.street, loc.city, loc.state, loc.zip].filter(Boolean);

    return {
      id:           loc.business_id,
      name:         loc.business_name        || merchant?.merchant_name || 'Unnamed',
      city,
      address:      addressParts.length      ? addressParts.join(', ') : '—',
      phone:        loc.phone_number         || '—',
      email:        loc.business_email       || '—',
      manager:      '',
      managerCount: 0,
      status:       loginBiz?.website_access_enabled ? 'ACTIVE' : 'INACTIVE',
      managerLogin: loginBiz?.device_login_enabled   ?? false,
    };
  });
}
