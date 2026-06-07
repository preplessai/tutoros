<script lang="ts">
	let { padding = true, hover = false, href, children, onclick, ...rest }: Record<string, any> = $props();
</script>

{#if href}
	<a {href} class={`block clay-card
		${hover ? 'clay-card-hover clay-card-pressed cursor-pointer' : ''}
		${padding ? 'p-5' : ''}`} {...rest}>
		{@render children?.()}
	</a>
{:else}
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div class={`clay-card
		${hover ? 'clay-card-hover clay-card-pressed cursor-pointer' : ''}
		${padding ? 'p-5' : ''}`} {onclick} role={onclick ? 'button' : undefined} tabindex={onclick ? 0 : undefined} {...rest}>
		{@render children?.()}
	</div>
{/if}
