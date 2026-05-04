/**
 * Encryption Module – AES-256-GCM with PBKDF2 Key Derivation
 *
 * All passwords are encrypted locally before being stored anywhere.
 * The encryption key is derived from the user's login password using PBKDF2.
 * The key is held in memory only – never persisted.
 */

const ITERATIONS = 100_000;

/**
 * Deterministically derive a salt from the userId.
 * This ensures the same user always gets the same salt
 * regardless of which device/browser they use.
 */
async function getSalt(userId: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`sampass-salt-${userId}-v1`);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(hash).slice(0, 16);
}

/**
 * Derive an AES-256-GCM encryption key from a password and userId.
 */
export async function deriveKey(password: string, userId: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const rawSalt = await getSalt(userId);
  const salt = new Uint8Array(rawSalt) as unknown as BufferSource;

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns a base64-encoded string containing IV + ciphertext.
 */
export async function encrypt(plaintext: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );
  const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return arrayBufferToBase64(combined);
}

/**
 * Decrypt a base64-encoded AES-256-GCM ciphertext.
 */
export async function decrypt(ciphertext: string, key: CryptoKey): Promise<string> {
  const combined = base64ToArrayBuffer(ciphertext);
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  return new TextDecoder().decode(decrypted);
}

/**
 * Generate a random password with specified options.
 */
export function generatePassword(
  length: number = 20,
  options: { upper?: boolean; lower?: boolean; numbers?: boolean; symbols?: boolean } = {}
): string {
  const { upper = true, lower = true, numbers = true, symbols = true } = options;
  let chars = '';
  if (upper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (lower) chars += 'abcdefghijklmnopqrstuvwxyz';
  if (numbers) chars += '0123456789';
  if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (chars.length === 0) chars = 'abcdefghijklmnopqrstuvwxyz0123456789';

  const array = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(array).map((b) => chars[b % chars.length]).join('');
}

/**
 * Evaluate password strength (0–4 scale).
 */
export function getPasswordStrength(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4);
}

// ─── Helpers ────────────────────────────────────

function arrayBufferToBase64(buffer: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
