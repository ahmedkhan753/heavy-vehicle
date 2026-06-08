/**
 * Monetization constants (frontend mirror of backend/src/config/pricing.js).
 * Keep these two in sync. The backend is authoritative for any calculation;
 * these values are only for display and for sending the agreed TC version.
 */

// Bump alongside backend TC_VERSION whenever the Terms text changes.
export const TC_VERSION = "2026-06-04";

// 0.2% seller success fee on a completed sale.
export const COMMISSION_RATE = 0.002;

// Human label for UI copy (e.g. "0.2%").
export const COMMISSION_LABEL = `${COMMISSION_RATE * 100}%`;
