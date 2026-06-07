/**
 * Auth middleware — validates Supabase JWT from Authorization header.
 * Uses Web Crypto API + fetch to Supabase JWKS endpoint.
 * Caches JWKS in memory for the Worker instance lifetime.
 */

interface JwtPayload {
	sub: string;       // user id
	email?: string;
	aud: string;
	exp: number;
	iat: number;
}

interface CachedKey {
	key: CryptoKey;
	kid: string;
}

let cachedKeys: CachedKey[] | null = null;
let jwksFetchTime = 0;
const JWKS_TTL = 3600_000; // cache JWKS for 1 hour

function getEnv(name: string): string {
	return ((globalThis as any)[name] as string) || '';
}

// ── Decode base64url ──
function base64UrlDecode(str: string): Uint8Array {
	str = str.replace(/-/g, '+').replace(/_/g, '/');
	while (str.length % 4) str += '=';
	const binary = atob(str);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}

// ── Fetch & parse Supabase JWKS ──
async function getSigningKeys(): Promise<CachedKey[]> {
	if (cachedKeys && Date.now() - jwksFetchTime < JWKS_TTL) {
		return cachedKeys;
	}

	const supabaseUrl = getEnv('SUPABASE_URL');
	const resp = await fetch(`${supabaseUrl}/auth/v1/jwks`);
	if (!resp.ok) throw new Error(`Failed to fetch JWKS: ${resp.status}`);

	const jwks = (await resp.json()) as { keys: Array<{ kid: string; kty: string; n: string; e: string; alg?: string }> };
	cachedKeys = [];

	for (const jwk of jwks.keys) {
		if (jwk.kty !== 'RSA') continue;
		const key = await crypto.subtle.importKey(
			'jwk',
			jwk,
			{ name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
			false,
			['verify']
		);
		cachedKeys.push({ key, kid: jwk.kid });
	}

	jwksFetchTime = Date.now();
	console.log(`[auth] Loaded ${cachedKeys.length} JWKS keys from Supabase`);
	return cachedKeys;
}

// ── Verify JWT signature + claims ──
async function verifyJwt(token: string): Promise<JwtPayload | null> {
	try {
		const parts = token.split('.');
		if (parts.length !== 3) return null;

		const [headerB64, payloadB64, signatureB64] = parts;

		// Decode header to find kid
		const headerJson = new TextDecoder().decode(base64UrlDecode(headerB64));
		const header = JSON.parse(headerJson) as { kid?: string; alg?: string };

		// Fetch signing keys
		const keys = await getSigningKeys();
		const match = keys.find((k) => k.kid === header.kid);
		if (!match) {
			console.warn(`[auth] No matching key for kid: ${header.kid}`);
			return null;
		}

		// Verify signature
		const signature = base64UrlDecode(signatureB64);
		const signedData = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
		const valid = await crypto.subtle.verify(
			'RSASSA-PKCS1-v1_5',
			match.key,
			signature.buffer as ArrayBuffer,
			signedData.buffer as ArrayBuffer
		);

		if (!valid) return null;

		// Decode payload and check expiry
		const payloadJson = new TextDecoder().decode(base64UrlDecode(payloadB64));
		const payload = JSON.parse(payloadJson) as JwtPayload;

		// Check expiry (allow 30s clock skew)
		if (payload.exp && payload.exp < (Date.now() / 1000) - 30) {
			console.log('[auth] Token expired');
			return null;
		}

		return payload;
	} catch (err) {
		console.error('[auth] JWT verification error:', err);
		return null;
	}
}

// ── Extract bearer token from Authorization header ──
function extractToken(request: Request): string | null {
	const auth = request.headers.get('Authorization');
	if (!auth) return null;
	const match = auth.match(/^Bearer\s+(.+)$/i);
	return match ? match[1] : null;
}

// ── Verify request is authenticated ──
export async function authenticate(request: Request): Promise<{ userId: string; email?: string } | null> {
	const token = extractToken(request);
	if (!token) return null;

	const payload = await verifyJwt(token);
	if (!payload) return null;

	return { userId: payload.sub, email: payload.email };
}
