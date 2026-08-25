/**
 * Groww Server-side Configuration & Header Helpers
 * Strictly server-side: never exposes secrets to the browser.
 */

import type { GrowwCredentials } from '../../types/groww.ts';

export const GROWW_BASE_URL = process.env.GROWW_BASE_URL || 'https://api.groww.in';
export const GROWW_API_VERSION = '1.0';

export function getGrowwCredentials(): GrowwCredentials {
  return {
    apiKey: process.env.GROWW_API_KEY || '',
    apiSecret: process.env.GROWW_API_SECRET || '',
    accessToken: process.env.GROWW_ACCESS_TOKEN || '',
    baseUrl: GROWW_BASE_URL,
  };
}

export function isGrowwConfigured(): boolean {
  const creds = getGrowwCredentials();
  return Boolean(creds.accessToken || (creds.apiKey && creds.apiSecret));
}

export function buildGrowwHeaders(token?: string): Record<string, string> {
  const creds = getGrowwCredentials();
  const bearerToken = token || creds.accessToken || (creds.apiKey?.startsWith('ey') ? creds.apiKey : '');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-API-VERSION': GROWW_API_VERSION,
  };

  if (bearerToken) {
    headers['Authorization'] = `Bearer ${bearerToken}`;
  }
  if (creds.apiKey) {
    headers['X-API-KEY'] = creds.apiKey;
  }
  if (creds.apiSecret) {
    headers['X-API-SECRET'] = creds.apiSecret;
  }

  return headers;
}
