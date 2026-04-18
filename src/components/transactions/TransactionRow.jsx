import StatusChip from '../common/StatusChip';

export default function TransactionRow({ transaction }) {
  const { date, time, customerName, phone, type, description, points, location } = transaction;
  const pointsClass = points > 0 ? 'tx-points--pos' : 'tx-points--neg';
  const pointsLabel = points > 0 ? `+${points}` : `${points}`;

  return (
    <tr className="tx-tr">
      <td className="tx-td">
        <div className="tx-date">{date}</div>
        <div className="tx-time">{time}</div>
      </td>
      <td className="tx-td">
        <div className="tx-customer-name">{customerName}</div>
        <div className="tx-customer-phone">{phone}</div>
      </td>
      <td className="tx-td">
        <StatusChip type={type} />
      </td>
      <td className="tx-td tx-desc">{description}</td>
      <td className="tx-td">
        <span className={`tx-points ${pointsClass}`}>{pointsLabel}</span>
      </td>
      <td className="tx-td tx-location">{location}</td>
    </tr>
  );
}
