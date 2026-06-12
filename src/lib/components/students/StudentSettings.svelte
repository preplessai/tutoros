<script lang="ts">
	import type { Student } from '$lib/lib/types';
	import { studentStore } from '$lib/stores/student.svelte';
	import Toggle from '$lib/components/ui/Toggle.svelte';

	let { student }: { student: Student } = $props();

	async function toggleSite(index: number) {
		const sites = [...student.preferred_resource_sites];
		sites[index].enabled = !sites[index].enabled;
		await studentStore.update(student.id, { preferred_resource_sites: sites });
	}
</script>

<div class="space-y-4">
	<h3 class="text-lg font-semibold text-[var(--color-text-primary)]">Resource Sites</h3>
	<p class="text-sm text-[var(--color-text-secondary)]">
		Choose which learning sites the AI can search for this student.
	</p>
	<div class="mt-4 space-y-3">
		{#each student.preferred_resource_sites as site, i}
			<div
				class="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-3"
			>
				<div>
					<p class="text-sm font-medium text-[var(--color-text-secondary)]">{site.name}</p>
					<p class="text-xs text-[var(--color-text-tertiary)]">{site.url}</p>
				</div>
				<Toggle checked={site.enabled} onchange={() => toggleSite(i)} />
			</div>
		{/each}
	</div>
</div>
