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
    
    // 1. Check URL parameter first
    if (zoneParam && Object.values(Zone).includes(zoneParam as Zone)) {
      localStorage.setItem("dev_zone", zoneParam);
      return zoneParam as Zone;
    }
    
    // 2. Support local subdomains (e.g., academy.localhost)
    if (hostname.includes(".")) {
      const sub = hostname.split(".")[0];
      if (sub === "admin") return Zone.ADMIN;
      if (sub === "talent") return Zone.TALENT;
      if (sub === "client") return Zone.CLIENT;
      if (sub === "app") return Zone.AUTH;
      if (sub === "academy") return Zone.ACADEMY;
    }

    // 3. Check localStorage fallback
    const savedZone = localStorage.getItem("dev_zone");
    if (savedZone && Object.values(Zone).includes(savedZone as Zone)) {
      return savedZone as Zone;
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
  if ([Zone.TALENT, Zone.CLIENT, Zone.ADMIN, Zone.ACADEMY].includes(currentZone)) {
    const prefixes = ["/talent", "/client", "/admin", "/academy"];
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
    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    
    // Use current zone from storage if none provided or different
    const currentDevZone = localStorage.getItem("dev_zone") || Zone.AUTH;
    const targetZone = zone || currentDevZone;

    // Add zone parameter if not already present
    if (path.includes("zone=")) return `${baseUrl}${cleanPath}`;
    
    const connector = cleanPath.includes("?") ? "&" : "?";
    return `${baseUrl}${cleanPath}${connector}zone=${targetZone}`;
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

