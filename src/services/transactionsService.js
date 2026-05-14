import api from './api';

export async function getTransactions() {
  const { data } = await api.get('/api/v1/transactions/');
  return data?.results ?? data ?? [];
}

export async function filterTransactions({ store, type } = {}) {
  const transactions = await getTransactions();
  return transactions.filter((t) => {
    if (store && store !== 'All Stores' && t.location !== store) return false;
    if (type  && type  !== 'all'        && t.type     !== type)  return false;
    return true;
  });
}

export function exportTransactions(data) {
  const headers = ['Date', 'Time', 'Customer', 'Phone', 'Type', 'Description', 'Points', 'Location'];
  const rows = data.map((t) =>
    [t.date, t.time, t.customerName, t.phone, t.type, t.description, t.points, t.location].join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: 'transactions.csv' });
  a.click();
  URL.revokeObjectURL(url);
}
