import customersMock from '../mock/customersMock';

// Replace this function body with a real API call when ready:
// e.g. const res = await fetch('/api/customers'); return res.json();
export async function fetchCustomers() {
  return customersMock;
}
