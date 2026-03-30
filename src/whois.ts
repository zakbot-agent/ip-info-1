import net from 'net';

export interface WhoisResult {
  ip: string;
  server: string;
  raw: string;
  referral?: string;
}

function queryWhoisServer(server: string, query: string, port = 43): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let data = '';

    socket.setTimeout(10000);
    socket.connect(port, server, () => {
      socket.write(query + '\r\n');
    });
    socket.on('data', (chunk) => (data += chunk.toString()));
    socket.on('end', () => resolve(data));
    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error(`Timeout connecting to ${server}`));
    });
    socket.on('error', (err) => reject(new Error(`WHOIS error (${server}): ${err.message}`)));
  });
}

function extractReferral(response: string): string | null {
  const patterns = [
    /refer:\s*(\S+)/i,
    /ReferralServer:\s*whois:\/\/(\S+)/i,
    /whois:\s*(\S+)/i,
  ];
  for (const pattern of patterns) {
    const match = response.match(pattern);
    if (match?.[1] && match[1].includes('.')) {
      return match[1];
    }
  }
  return null;
}

export async function whoisLookup(ip: string): Promise<WhoisResult> {
  // Step 1: Query IANA to find the right regional server
  const ianaResponse = await queryWhoisServer('whois.iana.org', ip);
  const referral = extractReferral(ianaResponse);

  if (!referral) {
    return { ip, server: 'whois.iana.org', raw: ianaResponse };
  }

  // Step 2: Query the regional whois server
  try {
    const regionalResponse = await queryWhoisServer(referral, ip);
    const secondReferral = extractReferral(regionalResponse);

    // Step 3: Follow a second referral if present
    if (secondReferral && secondReferral !== referral) {
      try {
        const finalResponse = await queryWhoisServer(secondReferral, ip);
        return { ip, server: secondReferral, raw: finalResponse, referral: secondReferral };
      } catch {
        return { ip, server: referral, raw: regionalResponse, referral };
      }
    }

    return { ip, server: referral, raw: regionalResponse, referral };
  } catch {
    return { ip, server: 'whois.iana.org', raw: ianaResponse };
  }
}
