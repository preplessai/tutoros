import { PUBLIC_WORKER_API_URL } from '$env/static/public';
import { supabase } from './supabase';
import type {
	GenerateWeeklyPlanRequest,
	AdjustPlanRequest,
	GenerateDayPlanRequest,
	SearchResourcesRequest,
	AiGeneratedPlan,
	AiGeneratedDayPlan,
	AiGeneratedResources
} from './types';

const BASE_URL = PUBLIC_WORKER_API_URL || 'http://localhost:8787';

async function getAuthHeaders(): Promise<Record<string, string>> {
	const headers: Record<string, string> = { 'Content-Type': 'application/json' };
	try {
		const { data } = await supabase.auth.getSession();
		const token = data.session?.access_token;
		if (token) {
			headers['Authorization'] = `Bearer ${token}`;
		}
	} catch {
		/* unauthenticated — let worker reject if required */
	}
	return headers;
}

async function post<T>(path: string, body: unknown): Promise<T> {
	const headers = await getAuthHeaders();
	const res = await fetch(`${BASE_URL}${path}`, {
		method: 'POST',
		headers,
		body: JSON.stringify(body)
	});

	if (!res.ok) {
		const err = await res.json().catch(() => ({ error: res.statusText }));
		throw new Error(err.error || `Request failed with status ${res.status}`);
	}

	return res.json();
}

export const api = {
	generateWeeklyPlan(request: GenerateWeeklyPlanRequest): Promise<AiGeneratedPlan> {
		return post<AiGeneratedPlan>('/api/generate-weekly-plan', request);
	},

	adjustPlan(request: AdjustPlanRequest): Promise<AiGeneratedPlan> {
		return post<AiGeneratedPlan>('/api/adjust-plan', request);
	},

	generateDayPlan(request: GenerateDayPlanRequest): Promise<AiGeneratedDayPlan> {
		return post<AiGeneratedDayPlan>('/api/generate-day-plan', request);
	},

	searchResources(request: SearchResourcesRequest): Promise<AiGeneratedResources> {
		return post<AiGeneratedResources>('/api/search-resources', request);
	}
};
