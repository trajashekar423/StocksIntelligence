import api from './api';

const BASE = '/api/v1/merchant/rewards-catalog';

export const fetchRewards       = ()         => api.get(`${BASE}/`).then(r => r.data?.results?.data ?? []);
export const fetchActiveRewards = ()         => api.get(`${BASE}/active-rewards/`).then(r => r.data?.results?.data ?? []);
export const fetchReward        = (id)       => api.get(`${BASE}/${id}/`).then(r => r.data);
export const createReward       = (data)     => api.post(`${BASE}/`, data).then(r => r.data);
export const updateReward       = (id, data) => api.put(`${BASE}/${id}/`, data).then(r => r.data);
export const deleteReward       = (id)       => api.delete(`${BASE}/${id}/`);
