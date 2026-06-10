/**
 * Auth middleware — validates Supabase JWT by calling Supabase's /auth/v1/user endpoint.
 * Far simpler than manual JWKS/JWT verification and stays correct across Supabase updates.
 */

// ── Extract bearer token from Authorization header ──
function extractToken(request: Request): string | null {
	const auth = request.headers.get('Authorization');
	if (!auth) return null;
	const match = auth.match(/^Bearer\s+(.+)$/i);
	return match ? match[1] : null;
}

// ── Verify request is authenticated ──
// env is the Cloudflare Worker bindings object (Hono c.env)
export async function authenticate(
	request: Request,
	env: Record<string, string>
): Promise<{ userId: string; email?: string } | null> {
	const token = extractToken(request);
	if (!token) {
		console.log('[auth] No Bearer token in Authorization header');
		return null;
	}

	const supabaseUrl = env['SUPABASE_URL'] || '';
	const anonKey = env['SUPABASE_ANON_KEY'] || '';

	if (!supabaseUrl || !anonKey) {
		console.error('[auth] SUPABASE_URL or SUPABASE_ANON_KEY not set');
		return null;
	}

	// Call Supabase's get-user endpoint — validates the token and returns user info
	const resp = await fetch(`${supabaseUrl}/auth/v1/user`, {
		headers: {
			Authorization: `Bearer ${token}`,
			apikey: anonKey
		}
	});

	if (!resp.ok) {
		console.log(`[auth] Supabase /auth/v1/user returned ${resp.status}`);
		return null;
	}

	const user = (await resp.json()) as { id: string; email?: string };

	console.log(`[auth] Authenticated user: ${user.id}`);
	return { userId: user.id, email: user.email };
}
