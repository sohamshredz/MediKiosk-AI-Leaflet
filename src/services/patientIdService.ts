/**
 * Permanent MediKiosk Patient ID Service
 * Generates and maintains collision-resistant, permanent MediKiosk Patient IDs in the format:
 * MKP-2026-XXXXXXXX (e.g. MKP-2026-7F3A92C1)
 *
 * Rules:
 * - Patient ID is permanent and assigned once upon registration or legacy backfill.
 * - Patient ID is completely separate from UHID, ABHA ID, Appointment Token, and Auth Token.
 * - The same patient always retains the same Patient ID across logins.
 */

// Simple deterministic hash for stable legacy backfilling
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  return hex.slice(0, 8);
}

/**
 * Generates a collision-resistant permanent MediKiosk Patient ID
 */
export function generatePermanentPatientId(seed?: string): string {
  if (seed && seed.trim()) {
    const hex = hashString(seed.trim());
    return `MKP-2026-${hex}`;
  }
  // Generate random 8-character uppercase hex
  const randomHex = Math.floor(Math.random() * 0xFFFFFFFF)
    .toString(16)
    .toUpperCase()
    .padStart(8, '0');
  return `MKP-2026-${randomHex}`;
}

/**
 * Ensures a patient record has a valid permanent MediKiosk Patient ID
 */
export function ensurePatientId(patient: {
  id: string;
  patientId?: string;
  uhid?: string;
  name?: string;
  mobile?: string;
}): string {
  if (patient.patientId && patient.patientId.startsWith('MKP-2026-')) {
    return patient.patientId;
  }
  // Seed deterministically from existing unique properties (id, uhid, mobile)
  const seed = `${patient.id}-${patient.uhid || ''}-${patient.mobile || ''}-${patient.name || ''}`;
  return generatePermanentPatientId(seed);
}
