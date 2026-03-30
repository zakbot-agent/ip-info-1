#!/usr/bin/env node

import { getPublicIp } from './public-ip';
import { lookupIp, resolveHostname, isIpAddress, type IpInfo } from './lookup';
import { reverseDns } from './reverse-dns';
import { whoisLookup } from './whois';
import {
  formatIpInfo,
  formatIpInfoJson,
  formatReverseDns,
  formatWhois,
  formatBatchTable,
  formatError,
} from './formatter';

// --- Argument parsing ---

interface Args {
  targets: string[];
  reverse: boolean;
  whois: boolean;
  json: boolean;
  list: boolean;
  help: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    targets: [],
    reverse: false,
    whois: false,
    json: false,
    list: false,
    help: false,
  };

  let listMode = false;

  for (const arg of argv) {
    switch (arg) {
      case '--reverse':
      case '-r':
        args.reverse = true;
        break;
      case '--whois':
      case '-w':
        args.whois = true;
        break;
      case '--json':
      case '-j':
        args.json = true;
        break;
      case '--list':
      case '-l':
        args.list = true;
        listMode = true;
        break;
      case '--help':
      case '-h':
        args.help = true;
        break;
      default:
        if (!arg.startsWith('-')) {
          args.targets.push(arg);
        }
    }
  }

  // If --list was given, all subsequent non-flag args are targets (already collected)
  if (listMode && args.targets.length === 0) {
    args.help = true;
  }

  return args;
}

function printHelp(): void {
  console.log(`
\x1b[1m\x1b[36mip-info\x1b[0m — IP address information tool

\x1b[1mUSAGE:\x1b[0m
  ip-info                          Show your public IP + info
  ip-info <ip>                     Lookup a specific IP
  ip-info <domain>                 Resolve domain, then lookup
  ip-info <ip> --reverse           Reverse DNS lookup
  ip-info <ip> --whois             WHOIS data
  ip-info --json [<ip>]            Output as JSON
  ip-info --list <ip1> <ip2> ...   Batch lookup, table format

\x1b[1mOPTIONS:\x1b[0m
  -r, --reverse    Reverse DNS lookup
  -w, --whois      WHOIS lookup
  -j, --json       JSON output
  -l, --list       Batch lookup (table)
  -h, --help       Show this help
`);
}

// --- Resolve target to IP ---

async function resolveTarget(target: string): Promise<string> {
  if (isIpAddress(target)) return target;
  return resolveHostname(target);
}

// --- Rate limiter for ip-api.com (45 req/min) ---

async function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// --- Main ---

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  try {
    // Batch mode
    if (args.list) {
      const results: IpInfo[] = [];
      for (let i = 0; i < args.targets.length; i++) {
        if (i > 0) await delay(1400); // respect rate limit
        const ip = await resolveTarget(args.targets[i]);
        const info = await lookupIp(ip);
        results.push(info);
      }

      if (args.json) {
        console.log(JSON.stringify(results, null, 2));
      } else {
        console.log(formatBatchTable(results));
      }
      return;
    }

    // Determine target IP
    let ip: string;
    if (args.targets.length > 0) {
      ip = await resolveTarget(args.targets[0]);
      if (!isIpAddress(args.targets[0])) {
        console.log(`\x1b[90mResolved ${args.targets[0]} -> ${ip}\x1b[0m\n`);
      }
    } else {
      ip = await getPublicIp();
      console.log(`\x1b[90mYour public IP: ${ip}\x1b[0m\n`);
    }

    // Reverse DNS
    if (args.reverse) {
      const result = await reverseDns(ip);
      if (args.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(formatReverseDns(result));
      }
      return;
    }

    // WHOIS
    if (args.whois) {
      const result = await whoisLookup(ip);
      if (args.json) {
        console.log(JSON.stringify({ ip: result.ip, server: result.server, data: result.raw }, null, 2));
      } else {
        console.log(formatWhois(result));
      }
      return;
    }

    // Default: full lookup
    const info = await lookupIp(ip);
    if (args.json) {
      console.log(JSON.stringify(info, null, 2));
    } else {
      console.log(formatIpInfo(info));
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(formatError(message));
    process.exit(1);
  }
}

main();
