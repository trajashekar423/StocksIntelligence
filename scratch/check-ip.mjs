async function checkMyPublicIp() {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    console.log('Current Public IPv4:', data.ip);
  } catch (e) {
    console.log('Error checking IP:', e.message);
  }

  try {
    const res6 = await fetch('https://api64.ipify.org?format=json');
    const data6 = await res6.json();
    console.log('Current Public IP (v4/v6):', data6.ip);
  } catch (e) {
    console.log('Error checking IPv6:', e.message);
  }
}

checkMyPublicIp();

