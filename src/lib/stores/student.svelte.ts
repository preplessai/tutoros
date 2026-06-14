import type { Student } from '$lib/lib/types';
import { supabase } from '$lib/lib/supabase';
import { toast } from './toast.svelte';
import { auth } from './auth.svelte';
import { SUBSCRIPTION_TIERS } from '$lib/lib/constants';

let students = $state<Student[]>([]);
let current = $state<Student | null>(null);
let loading = $state(false);

async function getTutorId(): Promise<string> {
	const { data } = await supabase.auth.getSession();
	const userId = data.session?.user?.id;
	if (!userId) throw new Error('Not authenticated');
	return userId;
}

export const studentStore = {
	get students() {
		return students;
	},
	get current() {
		return current;
	},
	get loading() {
		return loading;
	},

	async fetchAll() {
		loading = true;
		const { data, error } = await supabase
			.from('students')
			.select('*')
			.order('created_at', { ascending: false });
		if (!error) students = data as Student[];
		loading = false;
	},

	async fetchOne(id: string) {
		loading = true;
		try {
			const { data, error } = await supabase.from('students').select('*').eq('id', id).single();
			if (error) throw error;
			if (data) current = data as Student;
			return current;
		} catch (err: unknown) {
			console.error('[studentStore.fetchOne] Failed to fetch student:', err);
			current = null;
			return null;
		} finally {
			loading = false;
		}
	},

	async create(student: Omit<Student, 'id' | 'tutor_id' | 'created_at' | 'updated_at'>) {
		console.log(
			'[studentStore.create] Starting. Input student data:',
			JSON.stringify(student, null, 2)
		);
		let tutorId: string;
		try {
			const { data: sessionData } = await supabase.auth.getSession();
			console.log('[studentStore.create] Auth session check:', {
				hasSession: !!sessionData.session,
				userId: sessionData.session?.user?.id,
				userEmail: sessionData.session?.user?.email,
				expiresAt: sessionData.session?.expires_at
			});
			tutorId = await getTutorId();
			console.log('[studentStore.create] Got tutorId:', tutorId);
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : 'Unknown error';
			console.error('[studentStore.create] getTutorId threw:', msg);
			toast.error('Authentication error: ' + msg);
			return null;
		}

		// Check free tier student limit
		const tier = auth.profile?.subscription_tier || 'free';
		const maxStudents = SUBSCRIPTION_TIERS[tier]?.maxStudents;
		if (maxStudents !== undefined && maxStudents !== Infinity && students.length >= maxStudents) {
			toast.error(
				`You've reached the maximum of ${maxStudents} students for the ${SUBSCRIPTION_TIERS[tier].name} tier. Upgrade to add more.`
			);
			return null;
		}

		const payload = { ...student, tutor_id: tutorId };
		console.log('[studentStore.create] Supabase insert payload:', JSON.stringify(payload, null, 2));

		const { data, error } = await supabase.from('students').insert(payload).select().single();

		if (error) {
			console.error('[studentStore.create] Supabase insert error:', {
				code: error.code,
				message: error.message,
				details: error.details,
				hint: error.hint
			});
			toast.error('Failed to create student: ' + error.message);
			return null;
		}

		console.log(
			'[studentStore.create] Insert succeeded. Returned row:',
			JSON.stringify(data, null, 2)
		);
		toast.success('Student created');
		await this.fetchAll();
		return data as Student;
	},

	async update(id: string, updates: Partial<Student>) {
		const { error } = await supabase.from('students').update(updates).eq('id', id);
		if (error) {
			toast.error('Failed to update student: ' + error.message);
			return;
		}
		toast.success('Student updated');
		if (current?.id === id) current = { ...current, ...updates } as Student;
		await this.fetchAll();
	},

	async remove(id: string) {
		const { error } = await supabase.from('students').delete().eq('id', id);
		if (error) {
			toast.error('Failed to delete student: ' + error.message);
			return;
		}
		toast.success('Student deleted');
		if (current?.id === id) current = null;
		students = students.filter((s) => s.id !== id);
	}
};
