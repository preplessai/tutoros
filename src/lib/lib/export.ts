import type { PlanDay, PlanTask, PlanWeek, ResourceType } from './types';
import { formatDateLong } from './date';

// ── JSON export types ──

export interface ExportDayPlanJson {
	type: 'day_plan';
	version: 1;
	exported_at: string;
	day: {
		date: string;
		day_of_week: string;
		energy_level: string | null;
		recent_progress: string | null;
		struggle_areas: string[] | null;
		grades_context: string | null;
	};
	tasks: {
		section: string;
		title: string;
		description: string | null;
		duration_minutes: number;
	}[];
	resources: {
		title: string;
		url: string;
		source: string;
		type: string;
		description: string | null;
	}[];
}

export interface ExportWeekJson {
	type: 'week_plan';
	version: 1;
	exported_at: string;
	week: {
		week_number: number;
		week_start: string | null;
		week_end: string | null;
		theme: string | null;
		focus_areas: string[];
		notes: string | null;
	};
	days: {
		date: string;
		day_of_week: string;
		energy_level: string | null;
		recent_progress: string | null;
		struggle_areas: string[] | null;
		grades_context: string | null;
		tasks: {
			section: string;
			title: string;
			description: string | null;
			duration_minutes: number;
		}[];
	}[];
}

// ── HTML export (printable page) ──

function escapeHtml(text: string | null | undefined): string {
	if (!text) return '';
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

const SECTION_LABELS: Record<string, string> = {
	review_struggles: 'Review Struggle Areas',
	homework_help: 'Homework Help',
	project_help: 'Project Help',
	learn_new: 'Learn Something New',
	practice: 'Practice',
	wrap_up: 'Wrap Up'
};

function taskToHtml(task: PlanTask): string {
	const section = SECTION_LABELS[task.section] || task.section;
	return `
		<div style="margin-bottom: 12px; padding: 12px; background: #1a1d1f; border-left: 3px solid #00E5A0; border-radius: 6px;">
			<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
				<strong style="color: #EDEFEF; font-size: 14px;">${escapeHtml(task.title)}</strong>
				<span style="color: #00E5A0; font-size: 11px; background: rgba(0,229,160,0.1); padding: 2px 8px; border-radius: 10px;">${escapeHtml(section)}</span>
			</div>
			${task.description ? `<p style="color: #a8adad; font-size: 13px; margin: 6px 0 0 0;">${escapeHtml(task.description)}</p>` : ''}
			${task.duration_minutes ? `<span style="color: #6e7373; font-size: 11px;">⏱ ${task.duration_minutes} min</span>` : ''}
		</div>`;
}

function resourcesToHtml(resources: { title: string; url: string; source: string; type: string }[]): string {
	if (!resources.length) return '';
	return `
		<div style="margin-top: 16px;">
			<h3 style="color: #00E5A0; font-size: 15px; font-weight: 600; margin-bottom: 8px;">📚 Resources</h3>
			${resources.map(r => `
				<div style="margin-bottom: 6px; font-size: 13px;">
					<a href="${escapeHtml(r.url)}" style="color: #00E5A0;">${escapeHtml(r.title)}</a>
					<span style="color: #6e7373;"> — ${escapeHtml(r.source)} (${r.type})</span>
				</div>
			`).join('')}
		</div>`;
}

function css(): string {
	return `
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body {
			font-family: 'DM Sans', -apple-system, sans-serif;
			background: #0C0E0F;
			color: #EDEFEF;
			padding: 40px;
			line-height: 1.6;
		}
		h1 { font-family: 'Instrument Serif', Georgia, serif; font-size: 28px; color: #00E5A0; margin-bottom: 4px; }
		h2 { font-family: 'Instrument Serif', Georgia, serif; font-size: 22px; color: #EDEFEF; margin: 24px 0 12px 0; border-bottom: 1px solid rgba(237,239,239,0.1); padding-bottom: 8px; }
		h3 { font-size: 16px; color: #a8adad; margin-bottom: 8px; }
		.meta { color: #6e7373; font-size: 13px; margin-bottom: 20px; }
		.day-block { background: #141718; border-radius: 10px; padding: 20px; margin-bottom: 16px; border: 1px solid rgba(237,239,239,0.06); }
		.day-date { font-size: 18px; color: #EDEFEF; font-weight: 600; margin-bottom: 4px; }
		.day-subtitle { font-size: 13px; color: #a8adad; margin-bottom: 16px; }
		.badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; margin-left: 8px; }
		.badge-focus { background: rgba(0,229,160,0.1); color: #00E5A0; }
		@media print {
			body { background: #fff; color: #000; padding: 20px; }
			h1 { color: #000; }
			.day-block { background: #f8f8f8; border: 1px solid #ddd; break-inside: avoid; }
		}
	`;
}

export function exportDayPlan(
	day: PlanDay,
	tasks: PlanTask[],
	resources: { title: string; url: string; source: string; type: string }[]
): string {
	const title = `Day Plan — ${formatDateLong(day.date)}`;
	const tasksBySection = new Map<string, PlanTask[]>();
	for (const t of tasks) {
		const list = tasksBySection.get(t.section) || [];
		list.push(t);
		tasksBySection.set(t.section, list);
	}

	return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>${css()}</style></head>
<body>
	<h1>${escapeHtml(title)}</h1>
	<div class="meta">
		${day.energy_level ? `<span class="badge badge-focus">⚡ ${escapeHtml(day.energy_level)} energy</span>` : ''}
		${day.struggle_areas?.length ? `<span style="margin-left: 8px; color: #a8adad;">Focus: ${escapeHtml(day.struggle_areas.join(', '))}</span>` : ''}
	</div>
	${[...tasksBySection.entries()].map(([section, sectionTasks]) => `
		<h2>${escapeHtml(SECTION_LABELS[section] || section)}</h2>
		${sectionTasks.map(taskToHtml).join('')}
	`).join('')}
	${resourcesToHtml(resources)}
</body></html>`;
}

export function exportWeek(
	week: PlanWeek,
	days: { day: PlanDay; tasks: PlanTask[] }[]
): string {
	const title = `Week ${week.week_number} — ${week.theme || 'Plan'}`;
	const dateLine = week.week_start && week.week_end
		? `${new Date(week.week_start + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${new Date(week.week_end + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
		: `Week ${week.week_number}`;

	return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>${css()}</style></head>
<body>
	<h1>Week ${week.week_number}</h1>
	<div class="meta">
		${dateLine}
		${week.theme ? `<span class="badge badge-focus">${escapeHtml(week.theme)}</span>` : ''}
	</div>
	${week.focus_areas?.length ? `<p class="meta" style="margin-top: 4px;">Focus areas: ${escapeHtml(week.focus_areas.join(', '))}</p>` : ''}
	${week.notes ? `<p class="meta">${escapeHtml(week.notes)}</p>` : ''}

	${days.map(({ day, tasks }) => {
		const tasksBySection = new Map<string, PlanTask[]>();
		for (const t of tasks) {
			const list = tasksBySection.get(t.section) || [];
			list.push(t);
			tasksBySection.set(t.section, list);
		}

		return `
		<div class="day-block">
			<div class="day-date">${formatDateLong(day.date)}</div>
			<div class="day-subtitle">
				${day.energy_level ? `<span class="badge badge-focus">⚡ ${escapeHtml(day.energy_level)}</span>` : ''}
				${day.struggle_areas?.length ? `<span style="margin-left: 8px;">Focus: ${escapeHtml(day.struggle_areas.join(', '))}</span>` : ''}
			</div>
			${[...tasksBySection.entries()].map(([section, sectionTasks]) => `
				<h3>${escapeHtml(SECTION_LABELS[section] || section)}</h3>
				${sectionTasks.map(taskToHtml).join('')}
			`).join('')}
		</div>`;
	}).join('')}
</body></html>`;
}

/**
 * Open export in a new window for printing.
 */
export function openExport(html: string) {
	const w = window.open('', '_blank', 'width=900,height=700');
	if (!w) return;
	w.document.write(html);
	w.document.close();
	w.focus();
}

// ── JSON export ──

export function exportDayPlanJson(
	day: PlanDay,
	tasks: PlanTask[],
	resources: { title: string; url: string; source: string; type: string; description: string | null }[]
): ExportDayPlanJson {
	return {
		type: 'day_plan',
		version: 1,
		exported_at: new Date().toISOString(),
		day: {
			date: day.date,
			day_of_week: day.day_of_week,
			energy_level: day.energy_level,
			recent_progress: day.recent_progress,
			struggle_areas: day.struggle_areas,
			grades_context: day.grades_context
		},
		tasks: tasks.map((t) => ({
			section: t.section,
			title: t.title,
			description: t.description,
			duration_minutes: t.duration_minutes
		})),
		resources: resources.map((r) => ({
			title: r.title,
			url: r.url,
			source: r.source,
			type: r.type,
			description: r.description
		}))
	};
}

export function exportWeekJson(
	week: PlanWeek,
	days: { day: PlanDay; tasks: PlanTask[] }[]
): ExportWeekJson {
	return {
		type: 'week_plan',
		version: 1,
		exported_at: new Date().toISOString(),
		week: {
			week_number: week.week_number,
			week_start: week.week_start,
			week_end: week.week_end,
			theme: week.theme,
			focus_areas: week.focus_areas,
			notes: week.notes
		},
		days: days.map(({ day, tasks }) => ({
			date: day.date,
			day_of_week: day.day_of_week,
			energy_level: day.energy_level,
			recent_progress: day.recent_progress,
			struggle_areas: day.struggle_areas,
			grades_context: day.grades_context,
			tasks: tasks.map((t) => ({
				section: t.section,
				title: t.title,
				description: t.description,
				duration_minutes: t.duration_minutes
			}))
		}))
	};
}

/**
 * Trigger a browser file download for a JSON string.
 */
export function downloadJson(json: string, filename: string) {
	const blob = new Blob([json], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

// ── JSON import (parse + validate) ──

export interface ParsedImport {
	type: 'day_plan' | 'week_plan';
	data: ExportDayPlanJson | ExportWeekJson;
}

export function parseImportJson(json: string): ParsedImport {
	let parsed: unknown;
	try {
		parsed = JSON.parse(json);
	} catch {
		throw new Error('Invalid JSON file.');
	}

	const obj = parsed as Record<string, unknown>;

	if (!obj.type || !obj.version) {
		throw new Error('Not a valid Prepless AI export file. Missing type or version.');
	}

	if (obj.type !== 'day_plan' && obj.type !== 'week_plan') {
		throw new Error(`Unknown export type: "${obj.type}". Expected "day_plan" or "week_plan".`);
	}

	return { type: obj.type, data: obj as ExportDayPlanJson | ExportWeekJson };
}
