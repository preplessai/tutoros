<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let {
		open = false,
		onclose,
		onconfirm,
		title = 'Confirm',
		description = '',
		confirmText = 'Confirm',
		cancelText = 'Cancel',
		variant = 'danger' as 'danger' | 'gradient' | 'primary',
		loading = false
	}: {
		open?: boolean;
		onclose?: () => void;
		onconfirm?: () => void | Promise<void>;
		title?: string;
		description?: string;
		confirmText?: string;
		cancelText?: string;
		variant?: 'danger' | 'gradient' | 'primary';
		loading?: boolean;
		//children?: any;
	} = $props();
</script>

<Modal {open} {onclose} {title} size="sm">
	<div class="space-y-4">
		<p class="text-sm text-[var(--color-text-secondary)]">{description}</p>
		<div class="flex justify-end gap-3 pt-2">
			<Button variant="ghost" onclick={onclose}>{cancelText}</Button>
			<Button {variant} onclick={onconfirm} {loading}>{confirmText}</Button>
		</div>
	</div>
</Modal>
