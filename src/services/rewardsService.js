import rewardsMock from '../mock/rewardsMock';

// TODO: Replace mock GET API with real endpoint
// e.g. const res = await fetch('/api/rewards'); return res.json();
export async function fetchRewards() {
  return rewardsMock;
}

// TODO: Replace POST API for adding reward
// e.g. const res = await fetch('/api/rewards', { method: 'POST', body: JSON.stringify(data) }); return res.json();
export async function createReward(data) {
  return { ...data, id: Date.now() };
}

// TODO: Replace PUT/PATCH API for updating reward
// e.g. const res = await fetch(`/api/rewards/${data.id}`, { method: 'PUT', body: JSON.stringify(data) }); return res.json();
export async function updateReward(data) {
  return { ...data };
}

// TODO: Replace DELETE API for removing reward
// e.g. await fetch(`/api/rewards/${id}`, { method: 'DELETE' });
export async function deleteReward(id) {
  return id;
}
