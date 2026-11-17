import dns from 'dns';
import net from 'net';

/**
 * Validates whether an IP address belongs to private, loopback, link-local,
 * or cloud metadata IP ranges.
 */
export function isPrivateOrReservedIp(ip: string): boolean {
  if (!net.isIP(ip)) return true;

  // IPv6 checks
  if (net.isIPv6(ip)) {
    const cleanIp = ip.toLowerCase();
    if (cleanIp === '::1' || cleanIp === '::') return true;
    if (cleanIp.startsWith('fe80:') || cleanIp.startsWith('fe9') || cleanIp.startsWith('fea') || cleanIp.startsWith('feb')) return true; // Link-local
    if (cleanIp.startsWith('fc') || cleanIp.startsWith('fd')) return true; // Unique local
    return false;
  }

  // IPv4 checks
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return true;

  const [p0, p1] = parts;

  // 127.0.0.0/8 - Loopback
  if (p0 === 127) return true;
  // 0.0.0.0/8 - Current network
  if (p0 === 0) return true;
  // 10.0.0.0/8 - Private
  if (p0 === 10) return true;
  // 172.16.0.0/12 - Private
  if (p0 === 172 && p1 >= 16 && p1 <= 31) return true;
  // 192.168.0.0/16 - Private
  if (p0 === 192 && p1 === 168) return true;
  // 169.254.0.0/16 - Link-local / Cloud Metadata (169.254.169.254)
  if (p0 === 169 && p1 === 254) return true;
  // 100.64.0.0/10 - Carrier-grade NAT
  if (p0 === 100 && p1 >= 64 && p1 <= 127) return true;
  // 224.0.0.0/4 - Multicast
  if (p0 >= 224) return true;

  return false;
}

/**
 * Validates a target URL against SSRF attacks.
 * Resolves the hostname and ensures it does not point to internal resources.
 */
export async function validateRemoteMediaUrl(rawUrl: string): Promise<{ ok: boolean; error?: string; parsedUrl?: URL }> {
  try {
    const parsed = new URL(rawUrl);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { ok: false, error: 'Only HTTP and HTTPS protocols are permitted.' };
    }

    const hostname = parsed.hostname;

    // Check if hostname is an explicit IP
    if (net.isIP(hostname)) {
      if (isPrivateOrReservedIp(hostname)) {
        return { ok: false, error: 'Access to private, loopback, or cloud metadata IP ranges is prohibited.' };
      }
      return { ok: true, parsedUrl: parsed };
    }

    // Block common internal aliases
    if (hostname === 'localhost' || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
      return { ok: false, error: 'Access to localhost and internal domain names is prohibited.' };
    }

    // Resolve DNS to verify destination IP
    const addresses = await dns.promises.resolve(hostname);
    for (const addr of addresses) {
      if (isPrivateOrReservedIp(addr)) {
        return { ok: false, error: `Resolved address ${addr} for host ${hostname} belongs to a restricted private range.` };
      }
    }

    return { ok: true, parsedUrl: parsed };
  } catch (err: any) {
    return { ok: false, error: `Invalid or unresolvable media URL: ${err.message}` };
  }
}

/**
 * Safe HTTP fetch for remote media with redirect validation and streaming size caps.
 */
export async function safeFetchRemoteMedia(
  url: string,
  maxSizeBytes: number = 18 * 1024 * 1024,
  timeoutMs: number = 7000
): Promise<{ buffer: Buffer; contentType: string } | null> {
  let currentUrl = url;
  let redirectsCount = 0;
  const maxRedirects = 3;

  while (redirectsCount <= maxRedirects) {
    const validation = await validateRemoteMediaUrl(currentUrl);
    if (!validation.ok || !validation.parsedUrl) {
      console.warn(`[SSRF Guard] Blocked unsafe URL: ${currentUrl} (${validation.error})`);
      return null;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const resp = await fetch(currentUrl, {
        signal: controller.signal,
        redirect: 'manual',
        headers: {
          'Accept': 'image/*,video/*,*/*',
          'User-Agent': 'TRACE-Sentinel-Media-Audit/2.0',
        },
      });

      // Handle Redirects safely
      if ([301, 302, 303, 307, 308].includes(resp.status)) {
        const location = resp.headers.get('location');
        if (!location) return null;
        currentUrl = new URL(location, currentUrl).href;
        redirectsCount++;
        continue;
      }

      if (!resp.ok) return null;

      const contentType = (resp.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
      if (contentType && !contentType.startsWith('image/') && !contentType.startsWith('video/')) {
        return null;
      }

      // Stream and cap size while reading
      if (!resp.body) return null;
      const reader = resp.body.getReader();
      const chunks: Uint8Array[] = [];
      let totalBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          totalBytes += value.byteLength;
          if (totalBytes > maxSizeBytes) {
            controller.abort();
            console.warn(`[SSRF Guard] Remote media exceeded size limit: ${totalBytes} > ${maxSizeBytes}`);
            return null;
          }
          chunks.push(value);
        }
      }

      const fullBuffer = Buffer.concat(chunks.map((c) => Buffer.from(c)));
      return { buffer: fullBuffer, contentType: contentType || 'application/octet-stream' };
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn(`[SSRF Guard] Media fetch failure for ${currentUrl}:`, err.message);
      }
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  return null;
}
