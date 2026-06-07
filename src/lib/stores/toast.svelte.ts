// ── Toast Store (Svelte 5 runes) ──

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
	id: string;
	type: ToastType;
	message: string;
	duration?: number; // auto-dismiss after ms, 0 = sticky
}

let toasts = $state<Toast[]>([]);

let counter = 0;

function add(type: ToastType, message: string, duration = 5000): string {
	const id = `toast-${++counter}`;
	toasts = [...toasts, { id, type, message, duration }];

	if (duration > 0) {
		setTimeout(() => remove(id), duration);
	}

	return id;
}

function remove(id: string) {
	toasts = toasts.filter((t) => t.id !== id);
}

function success(message: string, duration?: number) {
	return add('success', message, duration);
}

function error(message: string, duration?: number) {
	return add('error', message, duration);
}

function warning(message: string, duration?: number) {
	return add('warning', message, duration);
}

function info(message: string, duration?: number) {
	return add('info', message, duration);
}

export const toast = {
	get toasts() {
		return toasts;
	},
	add,
	remove,
	success,
	error,
	warning,
	info
};
