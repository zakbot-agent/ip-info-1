import type { IpInfo } from './lookup';
import type { ReverseDnsResult } from './reverse-dns';
import type { WhoisResult } from './whois';

// --- ANSI color helpers ---
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  bgCyan: '\x1b[46m',
  bgBlue: '\x1b[44m',
};

function label(text: string): string {
  return `${c.cyan}${c.bold}${text.padEnd(16)}${c.reset}`;
}

function value(text: string): string {
  return `${c.white}${text}${c.reset}`;
}

function separator(): string {
  return `${c.gray}${'─'.repeat(50)}${c.reset}`;
}

function header(text: string): string {
  return `\n${c.bgBlue}${c.white}${c.bold} ${text} ${c.reset}\n${separator()}`;
}

function flagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '';
  const a = 0x1F1E6;
  const cc = countryCode.toUpperCase();
  return String.fromCodePoint(a + cc.charCodeAt(0) - 65, a + cc.charCodeAt(1) - 65);
}

// --- Formatters ---

export function formatIpInfo(info: IpInfo): string {
  const flag = flagEmoji(info.countryCode);
  const proxyStatus = info.proxy
    ? `${c.red}${c.bold}Yes${c.reset}`
    : `${c.green}No${c.reset}`;
  const hostingStatus = info.hosting
    ? `${c.yellow}Yes${c.reset}`
    : `${c.green}No${c.reset}`;

  const lines = [
    header(`IP Info: ${info.ip}`),
    `${label('IP')}${value(info.ip)}`,
    `${label('Hostname')}${value(info.hostname)}`,
    separator(),
    `${label('ISP')}${value(info.isp)}`,
    `${label('Organization')}${value(info.org)}`,
    `${label('ASN')}${value(info.as)}`,
    separator(),
    `${label('Country')}${value(`${info.country} ${flag}`)}`,
    `${label('Region')}${value(info.regionName)}`,
    `${label('City')}${value(info.city)}`,
    `${label('Timezone')}${value(info.timezone)}`,
    `${label('Coordinates')}${value(`${info.lat}, ${info.lon}`)}`,
    separator(),
    `${label('VPN/Proxy')}${proxyStatus}`,
    `${label('Hosting/DC')}${hostingStatus}`,
    '',
  ];

  return lines.join('\n');
}

export function formatIpInfoJson(info: IpInfo): string {
  return JSON.stringify(info, null, 2);
}

export function formatReverseDns(result: ReverseDnsResult): string {
  const lines = [
    header(`Reverse DNS: ${result.ip}`),
  ];

  if (result.hostnames.length === 0) {
    lines.push(`${label('Result')}${c.yellow}No PTR records found${c.reset}`);
  } else {
    result.hostnames.forEach((h, i) => {
      lines.push(`${label(`Host #${i + 1}`)}${value(h)}`);
    });
  }

  lines.push('');
  return lines.join('\n');
}

export function formatWhois(result: WhoisResult): string {
  const lines = [
    header(`WHOIS: ${result.ip}`),
    `${label('Server')}${value(result.server)}`,
    separator(),
    `${c.dim}${result.raw.trim()}${c.reset}`,
    '',
  ];
  return lines.join('\n');
}

export function formatBatchTable(results: IpInfo[]): string {
  const cols = {
    ip: 'IP',
    city: 'City',
    region: 'Region',
    country: 'Country',
    isp: 'ISP',
    as: 'ASN',
  };

  type ColKey = keyof typeof cols;
  const keys: ColKey[] = ['ip', 'city', 'region', 'country', 'isp', 'as'];

  // Calculate column widths
  const widths: Record<string, number> = {};
  for (const key of keys) {
    widths[key] = cols[key].length;
    for (const r of results) {
      const val = String(r[key as keyof IpInfo] ?? '');
      widths[key] = Math.max(widths[key], val.length);
    }
  }

  const pad = (s: string, w: number) => s + ' '.repeat(Math.max(0, w - s.length));
  const divider = keys.map((k) => '─'.repeat(widths[k] + 2)).join('┼');

  const lines = [
    '',
    `${c.bold}${c.cyan}` +
      keys.map((k) => ` ${pad(cols[k], widths[k])} `).join('│') +
      c.reset,
    `${c.gray}${divider}${c.reset}`,
  ];

  for (const r of results) {
    const row = keys
      .map((k) => ` ${pad(String(r[k as keyof IpInfo] ?? ''), widths[k])} `)
      .join('│');
    lines.push(row);
  }

  lines.push('');
  return lines.join('\n');
}

export function formatError(message: string): string {
  return `${c.red}${c.bold}Error:${c.reset} ${message}`;
}
