import type { Student } from '$lib/lib/types';
import { supabase } from '$lib/lib/supabase';
import { toast } from './toast.svelte';

let students = $state<Student[]>([]);
let current = $state<Student | null>(null);
let loading = $state(false);

export const studentStore = {
	get students() { return students; },
	get current() { return current; },
	get loading() { return loading; },

	async fetchAll() {
		loading = true;
		const { data, error } = await supabase.from('students').select('*').order('created_at', { ascending: false });
		if (!error) students = data as Student[];
		loading = false;
	},

	async fetchOne(id: string) {
		loading = true;
		const { data } = await supabase.from('students').select('*').eq('id', id).single();
		if (data) current = data as Student;
		loading = false;
		return current;
	},

	async create(student: Omit<Student, 'id' | 'tutor_id' | 'created_at' | 'updated_at'>) {
		const { data, error } = await supabase.from('students').insert(student).select().single();
		if (error) { toast.error('Failed to create student: ' + error.message); return null; }
		toast.success('Student created');
		await this.fetchAll();
		return data as Student;
	},

	async update(id: string, updates: Partial<Student>) {
		const { error } = await supabase.from('students').update(updates).eq('id', id);
		if (error) { toast.error('Failed to update student: ' + error.message); return; }
		toast.success('Student updated');
		if (current?.id === id) current = { ...current, ...updates } as Student;
		await this.fetchAll();
	},

	async remove(id: string) {
		const { error } = await supabase.from('students').delete().eq('id', id);
		if (error) { toast.error('Failed to delete student: ' + error.message); return; }
		toast.success('Student deleted');
		if (current?.id === id) current = null;
		students = students.filter(s => s.id !== id);
	}
};
