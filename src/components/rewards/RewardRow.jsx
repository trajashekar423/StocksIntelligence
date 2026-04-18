import ProgressBar from './ProgressBar';
import ActionButtons from './ActionButtons';

export default function RewardRow({ reward, onEdit, onDelete }) {
  const { title, description, points, redeemed, popularity } = reward;
  return (
    <tr className="rw-tr">
      {/* Reward */}
      <td className="rw-td">
        <div className="rw-reward-cell">
          <div className="rw-icon-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 12 20 22 4 22 4 12" />
              <rect x="2" y="7" width="20" height="5" />
              <line x1="12" y1="22" x2="12" y2="7" />
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
            </svg>
          </div>
          <div>
            <div className="rw-title">{title}</div>
            <div className="rw-desc">{description}</div>
          </div>
        </div>
      </td>

      {/* Points Required */}
      <td className="rw-td">
        <div className="rw-points">
          <svg width="13" height="13" fill="#f59e0b" viewBox="0 0 24 24">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          {points}
        </div>
      </td>

      {/* Redeemed */}
      <td className="rw-td rw-redeemed">{redeemed} times</td>

      {/* Popularity */}
      <td className="rw-td">
        <ProgressBar value={popularity} />
      </td>

      {/* Actions */}
      <td className="rw-td">
        <ActionButtons onEdit={() => onEdit(reward)} onDelete={() => onDelete(reward.id)} />
      </td>
    </tr>
  );
}
