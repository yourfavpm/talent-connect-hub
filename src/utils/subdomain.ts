/**
 * Subdomain and Zone Management Utility
 * Segments the application into Marketing, Auth Hub, Talent, Client, and Admin portals.
 */

export enum Zone {
  MARKETING = "MARKETING",
  AUTH = "AUTH",
  TALENT = "TALENT",
  CLIENT = "CLIENT",
  ADMIN = "ADMIN",
  ACADEMY = "ACADEMY",
}

export const PRODUCTION_DOMAIN = "opslyhr.com";

/**
 * Identifies the current zone based on the hostname.
 */
export const getCurrentZone = (): Zone => {
  const fullHostname = window.location.hostname.toLowerCase();
  
  // Remove 'www.' prefix for consistent matching
  const hostname = fullHostname.startsWith("www.") 
    ? fullHostname.substring(4) 
    : fullHostname;

  // Development / Localhost Handling
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".localhost")) {
    const params = new URLSearchParams(window.location.search);
    const zoneParam = params.get("zone")?.toUpperCase();
    if (zoneParam && Object.values(Zone).includes(zoneParam as Zone)) {
      return zoneParam as Zone;
    }
    
    // Support local subdomains if configured (e.g., admin.localhost)
    if (hostname.includes(".")) {
      const sub = hostname.split(".")[0];
      if (sub === "admin") return Zone.ADMIN;
      if (sub === "talent") return Zone.TALENT;
      if (sub === "client") return Zone.CLIENT;
      if (sub === "app") return Zone.AUTH;
      if (sub === "academy") return Zone.ACADEMY;
    }
    
    return Zone.AUTH; 
  }

  // Production Handling (opslyhr.com)
  if (hostname === PRODUCTION_DOMAIN) return Zone.MARKETING;
  if (hostname.startsWith("admin.")) return Zone.ADMIN;
  if (hostname.startsWith("talent.")) return Zone.TALENT;
  if (hostname.startsWith("client.")) return Zone.CLIENT;
  if (hostname.startsWith("app.")) return Zone.AUTH;
  if (hostname.startsWith("academy.")) return Zone.ACADEMY;

  return Zone.MARKETING; // Fallback to Marketing
};

/**
 * Returns the domain for cross-subdomain cookies.
 * In production, returns '.opslyhr.com'.
 * In development, returns undefined to use default host-only cookies.
 */
export const getCookieDomain = (): string | undefined => {
  const hostname = window.location.hostname.toLowerCase();
  
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".localhost")) {
    return undefined;
  }
  
  return `.${PRODUCTION_DOMAIN}`;
};

/**
 * Strips portal prefixes (/talent, /client, /admin) from a path if we are in a subdomain zone.
 * This ensures internal links work relative to the current domain.
 */
export const getInternalPath = (path: string): string => {
  const currentZone = getCurrentZone();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  // If we are in any portal zone (TALENT, CLIENT, ADMIN),
  // we want to allow relative paths that don''t include the portal prefix.
  // Example: On talent.opslyhr.com, ''/talent/dashboard'' should become ''/dashboard''.
  if ([Zone.TALENT, Zone.CLIENT, Zone.ADMIN].includes(currentZone)) {
    const prefixes = ["/talent", "/client", "/admin"];
    for (const prefix of prefixes) {
      if (cleanPath.startsWith(prefix)) {
        return cleanPath.substring(prefix.length) || "/";
      }
    }
  }

  return cleanPath;
};

/**
 * Generates an absolute URL for a specific zone.
 */
export const getZoneUrl = (zone: Zone, path: string = "/"): string => {
  const isDev = window.location.hostname === "localhost" || window.location.hostname.endsWith(".localhost");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  if (isDev) {
    // For local dev, we use the current host (port included) to maintain context
    // This handles both 5173 and 8080 automatically.
    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    
    // Add zone parameter if not already present in the source URLs
    if (path.includes("zone=")) return `${baseUrl}${cleanPath}`;
    
    const connector = cleanPath.includes("?") ? "&" : "?";
    return `${baseUrl}${cleanPath}${connector}zone=${zone}`;
  }

  const protocol = "https://";
  let subdomain = "";

  switch (zone) {
    case Zone.AUTH: subdomain = "app."; break;
    case Zone.ADMIN: subdomain = "admin."; break;
    case Zone.TALENT: subdomain = "talent."; break;
    case Zone.CLIENT: subdomain = "client."; break;
    case Zone.MARKETING: subdomain = ""; break;
    case Zone.ACADEMY: subdomain = "academy."; break;
  }

  return `${protocol}${subdomain}${PRODUCTION_DOMAIN}${cleanPath}`;
};

/**
 * High-level helper to redirect to a specific zone.
 */
export const redirectToZone = (zone: Zone, path: string = "/"): void => {
  window.location.href = getZoneUrl(zone, path);
};

