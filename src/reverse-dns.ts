import dns from 'dns';

export interface ReverseDnsResult {
  ip: string;
  hostnames: string[];
}

export function reverseDns(ip: string): Promise<ReverseDnsResult> {
  return new Promise((resolve, reject) => {
    dns.reverse(ip, (err, hostnames) => {
      if (err) {
        if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') {
          return resolve({ ip, hostnames: [] });
        }
        return reject(new Error(`Reverse DNS failed for ${ip}: ${err.code}`));
      }
      resolve({ ip, hostnames: hostnames || [] });
    });
  });
}
