/**
 * Get the Monday of the week containing the given date.
 */
export function getMonday(d: Date): Date {
	const date = new Date(d);
	const day = date.getDay();
	const diff = date.getDate() - day + (day === 0 ? -6 : 1);
	date.setDate(diff);
	date.setHours(0, 0, 0, 0);
	return date;
}

/**
 * Get the Sunday of the week containing the given date.
 */
export function getSunday(d: Date): Date {
	const monday = getMonday(d);
	const sunday = new Date(monday);
	sunday.setDate(monday.getDate() + 6);
	sunday.setHours(23, 59, 59, 999);
	return sunday;
}

/**
 * Format a date as a short string (e.g. "Jan 15").
 */
export function formatDateShort(d: string | Date): string {
	const date = typeof d === 'string' ? new Date(d) : d;
	return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format a date as a readable string (e.g. "January 15, 2026").
 */
export function formatDateLong(d: string | Date): string {
	const date = typeof d === 'string' ? new Date(d) : d;
	return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

/**
 * Format a date as ISO date string (YYYY-MM-DD).
 */
export function toISODate(d: Date): string {
	return d.toISOString().split('T')[0];
}

/**
 * Get the week number (1-based) relative to a start date.
 */
export function getWeekNumber(startDate: string, targetDate: string): number {
	const start = new Date(startDate);
	const target = new Date(targetDate);
	const diffMs = target.getTime() - getMonday(start).getTime();
	return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;
}

/**
 * Get the date for a specific week number relative to a start date.
 */
export function getWeekStartDate(startDate: string, weekNumber: number): Date {
	const monday = getMonday(new Date(startDate));
	monday.setDate(monday.getDate() + (weekNumber - 1) * 7);
	return monday;
}

/**
 * Get the date range string for a week (e.g. "Jan 5 - Jan 11, 2026").
 */
export function formatWeekRange(startDate: string, endDate: string): string {
	return `${formatDateShort(startDate)} - ${formatDateShort(endDate)}`;
}

/**
 * Get today's date as ISO string.
 */
export function todayISO(): string {
	return toISODate(new Date());
}

/**
 * Check if a date falls within a week range.
 */
export function isDateInWeek(date: string, weekStart: string, weekEnd: string): boolean {
	const d = new Date(date).getTime();
	const start = new Date(weekStart).getTime();
	const end = new Date(weekEnd).getTime();
	return d >= start && d <= end;
}
