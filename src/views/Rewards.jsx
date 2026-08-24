'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchRewards, createReward, updateReward, deleteReward } from '../services/rewardsService';
import { fetchStoreSettings } from '../services/settingsService';
import RewardsTable from '../components/rewards/RewardsTable';
import RewardFormModal from '../components/rewards/RewardFormModal';
import ConfirmDialog from '../components/rewards/ConfirmDialog';

function formatApiError(data, fallback) {
  if (!data) return fallback;
  if (typeof data.detail === 'string') return data.detail;
  if (typeof data.message === 'string') return data.message;
  const validation = data.message && typeof data.message === 'object' ? data.message : data;
  if (validation && typeof validation === 'object') {
    return Object.entries(validation)
      .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
      .join(' ');
  }
  return fallback;
}

function hasRewardContext(formData) {
  return Array.isArray(formData.business_ids) && formData.business_ids.length > 0 && formData.program_id;
}

function getRewardId(reward) {
  return reward.id ?? reward.reward_id ?? reward.catalog_id;
}

function isRewardActive(reward) {
  return reward.is_active ?? reward.isHot ?? false;
}

function withRewardActiveState(reward, active) {
  if (Object.prototype.hasOwnProperty.call(reward, 'is_active')) {
    return { ...reward, is_active: active };
  }

  if (Object.prototype.hasOwnProperty.call(reward, 'isHot')) {
    return { ...reward, isHot: active };
  }

  return { ...reward, is_active: active };
}

export default function Rewards() {
  const [rewards, setRewards]               = useState([]);
  const [activeStores, setActiveStores]     = useState([]);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState(null);
  const [isModalOpen, setIsModalOpen]       = useState(false);
  const [isEditMode, setIsEditMode]         = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [deleteTarget, setDeleteTarget]     = useState(null);
  const [submitting, setSubmitting]         = useState(false);
  const [toast, setToast]                   = useState('');


  const loadRewards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRewards();
      setRewards(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(formatApiError(err.response?.data, 'Failed to load rewards.'));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStores = useCallback(async () => {
    try {
      const stores = await fetchStoreSettings();
      setActiveStores(stores.filter((store) => store.is_active));
    } catch (err) {
      setError(formatApiError(err.response?.data, 'Failed to load stores.'));
    }
  }, []);

  useEffect(() => { loadRewards(); }, [loadRewards]);
  useEffect(() => { loadStores(); }, [loadStores]);

  // ── Add ──────────────────────────────────────────
  function handleAddClick() {
    setIsEditMode(false);
    setSelectedReward(null);
    setIsModalOpen(true);
  }

  async function handleAddReward(formData) {
    if (!hasRewardContext(formData)) {
      setError('Missing business or loyalty program for this account. Please sign out and sign in again, then try creating the reward.');
      return;
    }

    setSubmitting(true);
    try {
      await createReward(formData);
      setIsModalOpen(false);
      await loadRewards();
    } catch (err) {
      setError(formatApiError(err.response?.data, 'Failed to create reward.'));
    } finally {
      setSubmitting(false);
    }
  }

  // ── Edit ─────────────────────────────────────────
  function handleEditClick(reward) {
    setIsEditMode(true);
    setSelectedReward(reward);
    setIsModalOpen(true);
  }

  async function handleUpdateReward(formData) {
    if (!hasRewardContext(formData)) {
      setError('Missing business or loyalty program for this account. Please sign out and sign in again, then try updating the reward.');
      return;
    }

    setSubmitting(true);
    try {
      await updateReward(formData.id, formData);
      setIsModalOpen(false);
      await loadRewards();
    } catch (err) {
      setError(formatApiError(err.response?.data, 'Failed to update reward.'));
    } finally {
      setSubmitting(false);
    }
  }

  // ── Delete ───────────────────────────────────────
  async function handleToggleReward(reward) {
    const rewardId = getRewardId(reward);
    if (!rewardId) return;

    const nextActive = !isRewardActive(reward);
    const updatedReward = withRewardActiveState(reward, nextActive);
    const previousRewards = rewards;

    setRewards((current) => current.map((item) => (
      getRewardId(item) === rewardId ? withRewardActiveState(item, nextActive) : item
    )));

    try {
      await updateReward(rewardId, updatedReward);
      setToast('Reward updated');
      window.setTimeout(() => setToast(''), 2200);
    } catch (err) {
      setRewards(previousRewards);
      setError(formatApiError(err.response?.data, 'Failed to update reward.'));
    }
  }

  function handleDeleteClick(id) { setDeleteTarget(id); }

  async function handleConfirmDelete() {
    setSubmitting(true);
    try {
      await deleteReward(deleteTarget);
      setDeleteTarget(null);
      await loadRewards();
    } catch (err) {
      setError(formatApiError(err.response?.data, 'Failed to delete reward.'));
      setDeleteTarget(null);
    } finally {
      setSubmitting(false);
    }
  }


  const activeCount = rewards.filter((reward) => isRewardActive(reward)).length;
  const inactiveCount = rewards.length - activeCount;

  return (
    <div className="rw-page">
      <div className="rw-header">
        <div className="rw-header-left">
          <h5 className="rw-page-title">Rewards catalog</h5>
          <div className="rw-header-meta">
            <p className="pg-sub">Manage what customers can redeem their points for.</p>
            <div className="rw-counts">{activeCount} active · {inactiveCount} inactive</div>
          </div>
        </div>
        <div className="rw-header-right">
          <button
            className="rw-add-btn rw-add-btn--orange"
            onClick={handleAddClick}
            disabled={loading}
            style={{
              background: '#ff8800',
              color: '#fff',
              borderRadius: '999px',
              boxShadow: '0 2px 8px 0 rgba(255,136,0,0.10)',
              fontWeight: 600,
              fontSize: 16,
              padding: '0.5em 1.5em',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New reward
          </button>
        </div>
      </div>

      {error && (
        <div className="rw-error-banner">
          {error}
          <button onClick={() => setError(null)} aria-label="Dismiss">✕</button>
        </div>
      )}

      {toast && <div className="rw-toast">{toast}</div>}

      {loading ? (
        <div className="rw-loading">Loading rewards…</div>
      ) : (
        <RewardsTable
          rewards={rewards}
          activeStores={activeStores}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          onToggle={handleToggleReward}
        />
      )}

      {isModalOpen && (
        <RewardFormModal
          isEditMode={isEditMode}
          initialData={selectedReward}
          activeStores={activeStores}
          onSubmit={isEditMode ? handleUpdateReward : handleAddReward}
          onClose={() => !submitting && setIsModalOpen(false)}
          submitting={submitting}
        />
      )}

      {deleteTarget !== null && (
        <ConfirmDialog
          message="Are you sure you want to delete this reward? This action cannot be undone."
          onConfirm={handleConfirmDelete}
          onCancel={() => !submitting && setDeleteTarget(null)}
          submitting={submitting}
        />
      )}
    </div>
  );
}
