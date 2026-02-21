/**
 * Device Service
 * Device fingerprinting and trusted device management
 */

import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { supabase } from '@/lib/supabaseClient';
import type { DeviceInfo, TrustedDevice } from '../types/auth.types';

// Cache FingerprintJS agent promise
let fpPromise: ReturnType<typeof FingerprintJS.load> | null = null;

/**
 * Get unique device fingerprint using FingerprintJS
 */
export async function getDeviceFingerprint(): Promise<string> {
  try {
    if (!fpPromise) {
      fpPromise = FingerprintJS.load();
    }
    const fp = await fpPromise;
    if (!fp) {
      throw new Error('FingerprintJS agent not loaded');
    }
    const result = await fp.get();
    return result.visitorId;
  } catch (error) {
    console.error('[DeviceService] Failed to get fingerprint:', error);
    // Fallback to a less reliable but functional fingerprint
    return generateFallbackFingerprint();
  }
}

/**
 * Generate a fallback fingerprint if FingerprintJS fails
 */
function generateFallbackFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 'unknown',
  ];

  // Simple hash function
  const str = components.join('|');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `fallback_${Math.abs(hash).toString(16)}`;
}

/**
 * Get device info from browser
 */
export function getDeviceInfo(): Omit<DeviceInfo, 'fingerprint'> {
  const userAgent = navigator.userAgent;

  // Detect browser
  let browser = 'Unknown';
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';

  // Detect OS
  let os = 'Unknown';
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

  // Generate device name
  const name = `${browser} en ${os}`;

  return { name, browser, os };
}

/**
 * Check if device is trusted for a user
 */
export async function checkDeviceTrusted(
  userId: string,
  fingerprint: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('trusted_devices')
      .select('id, expires_at')
      .eq('user_id', userId)
      .eq('device_fingerprint', fingerprint)
      .single();

    if (error || !data) {
      return false;
    }

    // Check if device trust has expired
    const expiresAt = new Date(data.expires_at);
    if (expiresAt < new Date()) {
      // Device expired, remove it
      await removeTrustedDevice(data.id);
      return false;
    }

    // Update last used timestamp
    await supabase
      .from('trusted_devices')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', data.id);

    return true;
  } catch (error) {
    console.error('[DeviceService] Failed to check trusted device:', error);
    return false;
  }
}

/**
 * Mark device as trusted for a user
 */
export async function trustDevice(
  userId: string,
  fingerprint: string
): Promise<boolean> {
  try {
    const deviceInfo = getDeviceInfo();

    const { error } = await supabase
      .from('trusted_devices')
      .upsert({
        user_id: userId,
        device_fingerprint: fingerprint,
        device_name: deviceInfo.name,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        last_used_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
      }, {
        onConflict: 'user_id,device_fingerprint',
      });

    if (error) {
      console.error('[DeviceService] Failed to trust device:', error);
      return false;
    }

    console.log('[DeviceService] Device trusted successfully');
    return true;
  } catch (error) {
    console.error('[DeviceService] Failed to trust device:', error);
    return false;
  }
}

/**
 * Remove a trusted device by ID
 */
export async function removeTrustedDevice(deviceId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('trusted_devices')
      .delete()
      .eq('id', deviceId);

    if (error) {
      console.error('[DeviceService] Failed to remove device:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[DeviceService] Failed to remove device:', error);
    return false;
  }
}

/**
 * Get all trusted devices for a user
 */
export async function getUserTrustedDevices(userId: string): Promise<TrustedDevice[]> {
  try {
    const { data, error } = await supabase
      .from('trusted_devices')
      .select('*')
      .eq('user_id', userId)
      .order('last_used_at', { ascending: false });

    if (error) {
      console.error('[DeviceService] Failed to get devices:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[DeviceService] Failed to get devices:', error);
    return [];
  }
}

/**
 * Remove all trusted devices for a user (for logout everywhere)
 */
export async function removeAllTrustedDevices(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('trusted_devices')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('[DeviceService] Failed to remove all devices:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[DeviceService] Failed to remove all devices:', error);
    return false;
  }
}
