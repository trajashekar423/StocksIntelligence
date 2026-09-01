import https from 'https';

export async function growwPostIpv4(urlStr, headers, bodyObj) {
  const url = new URL(urlStr);
  const data = JSON.stringify(bodyObj);

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: 'POST',
        family: 4, // Enforce IPv4 whitelisted address
        headers: {
          ...headers,
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let responseBody = '';
        res.on('data', (chunk) => (responseBody += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseBody);
            resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, data: parsed });
          } catch {
            resolve({ ok: false, status: res.statusCode, data: { error: responseBody } });
          }
        });
      }
    );

    req.on('error', (err) => reject(err));
    req.setTimeout(8000, () => {
      req.destroy(new Error('Groww API request timed out'));
    });
    req.write(data);
    req.end();
  });
}

