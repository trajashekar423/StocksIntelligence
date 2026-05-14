import {
  RiArrowRightLine,
  RiCloseLine,
  RiEdit2Line,
  RiHistoryLine,
  RiSave3Line,
  RiStore2Line,
} from 'react-icons/ri';
import { useState } from 'react';
import StatusChip from '../common/StatusChip';

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function getAvatarSrc(transaction) {
  return transaction.avatar
    || transaction.avatarUrl
    || transaction.customerAvatar
    || transaction.image
    || '';
}

function getHistory(transaction) {
  return transaction.history
    || transaction.editHistory
    || transaction.pointsHistory
    || transaction.pointHistory
    || [];
}

function formatDateLabel(date) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(parsed);
}

function formatHistoryValue(item, keys, fallback) {
  const value = keys.map((key) => item?.[key]).find((entry) => entry !== undefined && entry !== null);
  return value ?? fallback;
}

export function HistoryModal({ transaction, history, onClose }) {
  return (
    <div className="tx-history-overlay" onClick={onClose}>
      <div
        className="tx-history-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tx-history-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tx-history-header">
          <h6 id="tx-history-title">Edit history</h6>
          <button type="button" className="tx-history-close" onClick={onClose} aria-label="Close history">
            <RiCloseLine size={20} />
          </button>
        </div>

        <div className="tx-history-body">
          <p className="tx-history-context">
            Transaction #{transaction.id} &middot; {transaction.customerName} &middot; {transaction.description}
          </p>

          <div className="tx-history-list">
            {history.map((item, index) => {
              const oldPoints = formatHistoryValue(item, ['oldPoints', 'from', 'previousPoints', 'oldValue'], transaction.points);
              const newPoints = formatHistoryValue(item, ['newPoints', 'to', 'updatedPoints', 'newValue'], transaction.points);
              const editor = item.editor || item.editedBy || item.user || 'Store Manager';
              const timestamp = item.timestamp || item.date || item.editedAt || 'Just now';
              const reason = item.reason || item.note || item.description || '';

              return (
                <div className="tx-history-item" key={item.id || index}>
                  <div className="tx-history-main">
                    <div className="tx-history-points">
                      <span className="tx-history-old">{oldPoints}</span>
                      <RiArrowRightLine size={16} />
                      <span className="tx-history-new">{newPoints} pts</span>
                    </div>
                    {reason && <p className="tx-history-reason">{reason}</p>}
                  </div>
                  <div className="tx-history-meta">
                    <strong>{editor}</strong>
                    <span>{timestamp}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function EditPointsModal({ transaction, onClose, onSave }) {
  const [newPoints, setNewPoints] = useState(transaction.points);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const parsedPoints = Number(newPoints);

    if (!Number.isFinite(parsedPoints)) {
      setError('Enter a valid points value.');
      return;
    }

    if (!reason.trim()) {
      setError('Add a reason for this edit.');
      return;
    }

    onSave({
      transactionId: transaction.id,
      newPoints: parsedPoints,
      reason: reason.trim(),
    });
  };

  return (
    <div className="tx-history-overlay" onClick={onClose}>
      <form
        className="tx-history-modal tx-edit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tx-edit-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="tx-history-header">
          <h6 id="tx-edit-title">Edit points</h6>
          <button type="button" className="tx-history-close" onClick={onClose} aria-label="Close edit points">
            <RiCloseLine size={20} />
          </button>
        </div>

        <div className="tx-history-body tx-edit-body">
          <p className="tx-history-context">
            Transaction #{transaction.id} &middot; {transaction.customerName} &middot; {transaction.description}
          </p>

          <div className="tx-edit-current">
            <span>Current points</span>
            <strong>{transaction.points}</strong>
          </div>

          <label className="tx-edit-field">
            <span>New points</span>
            <input
              type="number"
              value={newPoints}
              onChange={(e) => {
                setNewPoints(e.target.value);
                setError('');
              }}
            />
          </label>

          <label className="tx-edit-field">
            <span>Reason</span>
            <textarea
              rows="4"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError('');
              }}
              placeholder="Add a short reason for the adjustment"
            />
          </label>

          {error && <p className="tx-edit-error">{error}</p>}

          <div className="tx-edit-footer">
            <button type="button" className="tx-edit-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="tx-edit-save">
              <RiSave3Line size={16} />
              Save
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function TransactionRow({ transaction, onOpenHistory, onEditPoints }) {
  const { id, date, time, customerName, phone, type, description, points, location } = transaction;
  const avatarSrc = getAvatarSrc(transaction);
  const history = getHistory(transaction);
  const hasHistory = history.length > 0;
  const pointsClass = points > 0 ? 'tx-points--pos' : 'tx-points--neg';
  const pointsLabel = points > 0 ? `+${points}` : `${points}`;
  const isEdited = hasHistory || transaction.edited || transaction.isEdited;

  return (
    <>
      <tr className="tx-tr">
        <td className="tx-td">
          <div className="tx-customer-cell">
            {avatarSrc ? (
              <img className="tx-avatar" src={avatarSrc} alt="" aria-hidden="true" />
            ) : (
              <div className="tx-avatar tx-avatar--initials" aria-hidden="true">{getInitials(customerName)}</div>
            )}
            <div>
              <div className="tx-customer-name">{customerName}</div>
              <div className="tx-customer-phone">{phone}</div>
            </div>
          </div>
        </td>
        <td className="tx-td">
          <StatusChip type={type} />
        </td>
        <td className="tx-td">
          <span className="tx-points-wrap">
            <span className={`tx-points ${pointsClass}`}>{pointsLabel}</span>
            {isEdited && <span className="tx-edited-badge">edited</span>}
          </span>
        </td>
        <td className="tx-td tx-desc">{description}</td>
        <td className="tx-td">
          <span className="tx-store-pill">
            <RiStore2Line size={14} />
            {location}
          </span>
        </td>
        <td className="tx-td">
          <div className="tx-date">
            {formatDateLabel(date)} <span>&middot;</span> {time}
          </div>
        </td>
        <td className="tx-td">
          {hasHistory ? (
            <button
              type="button"
              className="tx-history-btn"
              onClick={() => onOpenHistory(transaction, history)}
              aria-label={`Open edit history for transaction ${id}`}
            >
              <RiHistoryLine size={16} />
              <span className="tx-history-count">{history.length}</span>
            </button>
          ) : (
            <span className="tx-muted-placeholder">-</span>
          )}
        </td>
        <td className="tx-td">
          <button type="button" className="tx-edit-btn" onClick={() => onEditPoints(transaction)}>
            <RiEdit2Line size={15} />
            Edit pts
          </button>
        </td>
      </tr>

    </>
  );
}
