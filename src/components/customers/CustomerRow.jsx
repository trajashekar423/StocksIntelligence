const TIER_CLASS = {
  Gold:   'cm-badge--gold',
  VIP:    'cm-badge--vip',
  Silver: 'cm-badge--silver',
};

const AVATAR_COLOR = {
  Gold:   '#f59e0b',
  VIP:    '#8b5cf6',
  Silver: '#6b7280',
};

export default function CustomerRow({ customer }) {
  const { name, email, phone, visits, points, lastVisit, tier } = customer;
  return (
    <tr className="cm-tr">
      {/* Customer */}
      <td className="cm-td">
        <div className="cm-customer-cell">
          <div className="cm-avatar" style={{ background: AVATAR_COLOR[tier] }}>
            {name.charAt(0)}
          </div>
          <div>
            <div className="cm-name">{name}</div>
            <div className="cm-visits">{visits} visits</div>
          </div>
        </div>
      </td>

      {/* Contact */}
      <td className="cm-td">
        <div className="cm-name">{email}</div>
        <div className="cm-visits">{phone}</div>
      </td>

      {/* Points */}
      <td className="cm-td">
        <div className="cm-points">
          <svg width="13" height="13" fill="#f59e0b" viewBox="0 0 24 24">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          {points}
        </div>
      </td>

      {/* Last Visit */}
      <td className="cm-td cm-visits">{lastVisit}</td>

      {/* Status / Tier */}
      <td className="cm-td">
        <span className={`cm-badge ${TIER_CLASS[tier] ?? ''}`}>{tier}</span>
      </td>

      {/* Actions */}
      <td className="cm-td">
        <button className="cm-view-btn">View Details</button>
      </td>
    </tr>
  );
}
