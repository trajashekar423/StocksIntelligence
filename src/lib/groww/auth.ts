/**
 * Groww Authentication & Account Verification Service
 * Runs strictly server-side.
 */

import { GROWW_BASE_URL, buildGrowwHeaders, getGrowwCredentials, isGrowwConfigured } from './config.ts';
import type { GrowwAuthStatus, GrowwProfile } from '../../types/groww.ts';

let cachedAuthStatus: {
  status: GrowwAuthStatus;
  cachedAt: number;
} | null = null;

const CACHE_TTL_MS = 60_000; // Cache connection verification for 1 minute

export async function verifyGrowwConnection(forceRefresh = false): Promise<GrowwAuthStatus> {
  const now = Date.now();
  if (!forceRefresh && cachedAuthStatus && now - cachedAuthStatus.cachedAt < CACHE_TTL_MS) {
    return cachedAuthStatus.status;
  }

  const configured = isGrowwConfigured();
  const timestamp = new Date().toISOString();

  if (!configured) {
    const status: GrowwAuthStatus = {
      authenticated: false,
      status: 'DISCONNECTED',
      lastChecked: timestamp,
      error: 'Groww API credentials (GROWW_API_KEY or GROWW_ACCESS_TOKEN) are not configured in environment.',
    };
    cachedAuthStatus = { status, cachedAt: now };
    return status;
  }

  try {
    const creds = getGrowwCredentials();
    const headers = buildGrowwHeaders();

    const response = await fetch(`${creds.baseUrl}/v1/user/detail`, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(6000),
    });

    if (response.ok) {
      const data = await response.json();
      const user = data?.data || data?.user || data;
      const status: GrowwAuthStatus = {
        authenticated: true,
        status: 'CONNECTED',
        lastChecked: timestamp,
        accountName: user?.name || user?.user_name || 'Groww Trader',
        growwUserId: user?.user_id || user?.client_code ? String(user.user_id || user.client_code).slice(-4).padStart(8, '*') : undefined,
      };
      cachedAuthStatus = { status, cachedAt: now };
      return status;
    }

    if (response.status === 401 || response.status === 403) {
      const status: GrowwAuthStatus = {
        authenticated: false,
        status: 'DISCONNECTED',
        lastChecked: timestamp,
        error: 'Invalid or expired Groww Access Token / API Key. Please refresh your Groww API token.',
      };
      cachedAuthStatus = { status, cachedAt: now };
      return status;
    }

    const errText = await response.text().catch(() => '');
    const status: GrowwAuthStatus = {
      authenticated: false,
      status: 'ERROR',
      lastChecked: timestamp,
      error: `Groww API returned HTTP ${response.status}: ${errText.slice(0, 100)}`,
    };
    cachedAuthStatus = { status, cachedAt: now };
    return status;
  } catch (err: any) {
    const status: GrowwAuthStatus = {
      authenticated: false,
      status: 'ERROR',
      lastChecked: timestamp,
      error: err?.message || 'Network error while connecting to Groww API',
    };
    cachedAuthStatus = { status, cachedAt: now };
    return status;
  }
}

export async function getGrowwUserProfile(): Promise<GrowwProfile | null> {
  if (!isGrowwConfigured()) {
    return null;
  }

  try {
    const creds = getGrowwCredentials();
    const headers = buildGrowwHeaders();

    const [userRes, marginRes] = await Promise.allSettled([
      fetch(`${creds.baseUrl}/v1/user/detail`, { headers, signal: AbortSignal.timeout(6000) }),
      fetch(`${creds.baseUrl}/v1/margins/user`, { headers, signal: AbortSignal.timeout(6000) }),
    ]);

    let profileData: any = {};
    if (userRes.status === 'fulfilled' && userRes.value.ok) {
      const json = await userRes.value.json();
      profileData = json?.data || json?.user || json;
    }

    let marginData: any = {};
    if (marginRes.status === 'fulfilled' && marginRes.value.ok) {
      const json = await marginRes.value.json();
      marginData = json?.data || json?.margins || json;
    }

    return {
      name: profileData?.name || profileData?.user_name || 'Groww Trader',
      email: profileData?.email ? profileData.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : 'trader@groww.in',
      clientCode: profileData?.client_code || profileData?.user_id || 'GROWW-USER',
      active: true,
      availableMargin: Number(marginData?.equity_margin_available ?? marginData?.available_margin ?? 50000),
      usedMargin: Number(marginData?.equity_margin_used ?? marginData?.used_margin ?? 0),
      totalBalance: Number(marginData?.total_margin ?? 50000),
    };
  } catch {
    return null;
  }
}
