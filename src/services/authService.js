import api from './api';
import { removeToken } from '../utils/authStorage';

function normalizeUser(data) {
  const responseData = data?.data ?? data ?? {};
  const user = responseData.user ?? data?.user ?? null;
  if (!user) return null;

  return {
    ...user,
    business_id: user.business_id ?? responseData.business_id,
    program_id: user.program_id ?? responseData.program_id,
    loyalty_program_id: user.loyalty_program_id ?? responseData.loyalty_program_id,
    business: user.business ?? responseData.business,
    businesses: user.businesses ?? responseData.businesses,
    stores: user.stores ?? responseData.stores,
    locations: user.locations ?? responseData.locations,
    program: user.program ?? responseData.program,
    loyalty_program: user.loyalty_program ?? responseData.loyalty_program,
    merchant: user.merchant ?? responseData.merchant,
    role: user.role ?? responseData.role,
    profile: user.profile ?? responseData.profile,
    permissions: user.permissions ?? responseData.permissions,
    client: user.client ?? responseData.client,
    business_ids: user.business_ids ?? responseData.business_ids,
  };
}

export const loginUser = async ({ email, password }) => {
  const { data } = await api.post('/api/v1/auth/login/', { email, password });
  console.log('LOGIN RESPONSE:', data);
  const token =
    data?.data?.tokens?.access ||
    data?.data?.tokens?.token  ||
    data?.tokens?.access       ||
    data?.token;
  const user = normalizeUser(data);
  if (!token) console.warn('TOKEN NOT FOUND in response:', data);
  return { token, user };
};

export const logoutUser = () => removeToken();
