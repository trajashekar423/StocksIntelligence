import api from './api';

export async function fetchCustomers() {
  const { data } = await api.get('/api/v1/customers/');
  return data?.results ?? data ?? [];
}
