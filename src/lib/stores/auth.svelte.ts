import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '$lib/lib/types';
import { supabase } from '$lib/lib/supabase';

// ── Auth Store (Svelte 5 runes) ──

let session = $state<Session | null>(null);
let user = $state<User | null>(null);
let profile = $state<Profile | null>(null);
let loading = $state(true);

export const auth = {
	get session() {
		return session;
	},
	get user() {
		return user;
	},
	get profile() {
		return profile;
	},
	get isAuthenticated() {
		return !!session?.user;
	},
	get loading() {
		return loading;
	},

	async init() {
		try {
			const {
				data: { session: s }
			} = await supabase.auth.getSession();
			session = s;
			user = s?.user ?? null;

			if (user) {
				await this.fetchProfile();
			}
		} finally {
			loading = false;
		}

		// Listen for auth changes
		supabase.auth.onAuthStateChange(async (_, s) => {
			session = s;
			user = s?.user ?? null;
			if (user) {
				await this.fetchProfile();
			} else {
				profile = null;
			}
		});
	},

	async fetchProfile() {
		if (!user) return;
		const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
		profile = data as Profile | null;
	},

	async signOut() {
		await supabase.auth.signOut();
		session = null;
		user = null;
		profile = null;
	}
};

// ── Theme Store ──

let dark = $state(false);

// Initialize from localStorage or system preference
function initTheme() {
	if (typeof window === 'undefined') return;
	const stored = localStorage.getItem('theme');
	if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
		dark = true;
		document.documentElement.classList.add('dark');
	}
}

function toggleDark() {
	dark = !dark;
	if (typeof window !== 'undefined') {
		document.documentElement.classList.toggle('dark', dark);
		localStorage.setItem('theme', dark ? 'dark' : 'light');
	}
}

export const theme = {
	get dark() {
		return dark;
	},
	init: initTheme,
	toggle: toggleDark
};
