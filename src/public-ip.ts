import http from 'http';

export function getPublicIp(): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = http.get('http://api.ipify.org', (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data.trim()));
    });
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Timeout fetching public IP'));
    });
  });
}
