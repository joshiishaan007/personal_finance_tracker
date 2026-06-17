// Local biometric gate via the WebAuthn platform authenticator (fingerprint /
// Face unlock). This is a device-local privacy check, NOT server-verified auth:
// we don't store or transmit biometric data — the OS handles the sensor and we
// keep only an opaque credential id. It layers on top of the PIN, which remains
// the required fallback. Needs a secure context (HTTPS / localhost).

function bufToB64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlToBuf(s: string): ArrayBuffer {
  const pad = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

// True only on a device with an enrolled platform authenticator (fingerprint/face).
export async function biometricAvailable(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

// Register a platform credential; returns its id (to store) or null if the user
// cancels / it isn't supported. Must be called from a user gesture.
export async function enrollBiometric(): Promise<string | null> {
  if (!(await biometricAvailable())) return null;
  try {
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: 'xpensr' }, // rp.id defaults to the current origin's domain
        user: { id: crypto.getRandomValues(new Uint8Array(16)), name: 'app-lock', displayName: 'App Lock' },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },   // ES256
          { type: 'public-key', alg: -257 }, // RS256
        ],
        authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'preferred' },
        timeout: 60_000,
        attestation: 'none',
      },
    });
    if (!cred || !('rawId' in cred)) return null;
    return bufToB64url((cred as PublicKeyCredential).rawId);
  } catch {
    return null;
  }
}

// Prompt the OS biometric sheet for the stored credential. Resolving means the
// user verified — we treat that as unlock (no signature is sent anywhere).
export async function verifyBiometric(credentialId: string): Promise<boolean> {
  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [{ type: 'public-key', id: b64urlToBuf(credentialId) }],
        userVerification: 'required',
        timeout: 60_000,
      },
    });
    return !!assertion;
  } catch {
    return false;
  }
}
