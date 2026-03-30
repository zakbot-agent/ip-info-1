import http from 'http';
import dns from 'dns';

export interface IpInfo {
  ip: string;
  hostname: string;
  isp: string;
  org: string;
  as: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  timezone: string;
  lat: number;
  lon: number;
  proxy: boolean;
  hosting: boolean;
}

interface ApiResponse {
  status: string;
  message?: string;
  query: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
  reverse: string;
  proxy: boolean;
  hosting: boolean;
}

export function resolveHostname(hostname: string): Promise<string> {
  return new Promise((resolve, reject) => {
    dns.resolve4(hostname, (err, addresses) => {
      if (err) return reject(new Error(`Cannot resolve "${hostname}": ${err.code}`));
      resolve(addresses[0]);
    });
  });
}

export function isIpAddress(input: string): boolean {
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6 = /^[0-9a-fA-F:]+$/;
  return ipv4.test(input) || ipv6.test(input);
}

export function lookupIp(ip: string): Promise<IpInfo> {
  return new Promise((resolve, reject) => {
    const url = `http://ip-api.com/json/${ip}?fields=status,message,query,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,reverse,proxy,hosting`;

    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json: ApiResponse = JSON.parse(data);
          if (json.status === 'fail') {
            return reject(new Error(json.message || 'Lookup failed'));
          }
          resolve({
            ip: json.query,
            hostname: json.reverse || 'N/A',
            isp: json.isp || 'N/A',
            org: json.org || 'N/A',
            as: json.as || 'N/A',
            country: json.country || 'N/A',
            countryCode: json.countryCode || '',
            region: json.region || '',
            regionName: json.regionName || 'N/A',
            city: json.city || 'N/A',
            timezone: json.timezone || 'N/A',
            lat: json.lat,
            lon: json.lon,
            proxy: json.proxy,
            hosting: json.hosting,
          });
        } catch (e) {
          reject(new Error('Failed to parse API response'));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout looking up IP'));
    });
  });
}
