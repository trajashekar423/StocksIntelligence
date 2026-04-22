import { useState, useEffect } from 'react';
import { fetchRewards, createReward, updateReward, deleteReward } from '../services/rewardsService';
import RewardsTable from '../components/rewards/RewardsTable';
import RewardFormModal from '../components/rewards/RewardFormModal';
import ConfirmDialog from '../components/rewards/ConfirmDialog';

// TODO: Add loading and error handling
export default function Rewards() {
  const [rewards, setRewards]           = useState([]);
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [isEditMode, setIsEditMode]     = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    // TODO: Replace mock GET API with real endpoint
    // axios.get('/api/rewards').then(res => setRewards(res.data));
    fetchRewards().then(setRewards);
  }, []);

  // ── Add ──────────────────────────────────────────
  function handleAddClick() {
    setIsEditMode(false);
    setSelectedReward(null);
    setIsModalOpen(true);
  }

  function handleAddReward(newReward) {
    // TODO: Replace POST API for adding reward
    // axios.post('/api/rewards', newReward).then(res => setRewards(prev => [...prev, res.data]));
    createReward(newReward).then((created) =>
      setRewards((prev) => [...prev, created])
    );
    setIsModalOpen(false);
  }

  // ── Edit ─────────────────────────────────────────
  function handleEditClick(reward) {
    setIsEditMode(true);
    setSelectedReward(reward);
    setIsModalOpen(true);
  }

  function handleUpdateReward(updatedReward) {
    // TODO: Replace PUT/PATCH API for updating reward
    // axios.put(`/api/rewards/${updatedReward.id}`, updatedReward).then(...);
    updateReward(updatedReward).then((updated) =>
      setRewards((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
    );
    setIsModalOpen(false);
  }

  // ── Delete ───────────────────────────────────────
  function handleDeleteClick(id) {
    setDeleteTarget(id);
  }

  function handleConfirmDelete() {
    // TODO: Replace DELETE API for removing reward
    // axios.delete(`/api/rewards/${deleteTarget}`).then(...);
    deleteReward(deleteTarget).then(() =>
      setRewards((prev) => prev.filter((r) => r.id !== deleteTarget))
    );
    setDeleteTarget(null);
  }

  return (
    <div>
      {/* Header */}
      <div className="rw-header">
        <div>
          <h5 className="rw-page-title">Manage Rewards</h5>
          <p className="pg-sub">
            {rewards.length} rewards · {rewards.reduce((s, r) => s + (r.redeemedCount || 0), 0)} total redemptions
          </p>
        </div>
        <button className="rw-add-btn" onClick={handleAddClick}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Reward
        </button>
      </div>

      {/* Card list */}
      <RewardsTable
        rewards={rewards}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
      />

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <RewardFormModal
          isEditMode={isEditMode}
          initialData={selectedReward}
          onSubmit={isEditMode ? handleUpdateReward : handleAddReward}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {/* Delete Confirmation */}
      {deleteTarget !== null && (
        <ConfirmDialog
          message="Are you sure you want to delete this reward? This action cannot be undone."
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
