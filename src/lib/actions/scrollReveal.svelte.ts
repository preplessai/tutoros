/**
 * Svelte 5 action — scroll-triggered reveal animation using IntersectionObserver.
 * Usage: <div use:scrollReveal={{ delay: 0.1 }}>...</div>
 */
type RevealOptions = {
	/** Animation delay in seconds (default 0) */
	delay?: number;
	/** Intersection threshold (default 0.08) */
	threshold?: number;
	/** Root margin for triggering (default "0px 0px -40px 0px") */
	margin?: string;
	/** Animation name: fade-up (default) | fade-in | fade-left | scale */
	direction?: 'fade-up' | 'fade-in' | 'fade-left' | 'scale';
};

const animationStyles: Record<string, string> = {
	'fade-up': 'fade-in-up',
	'fade-in': 'fade-in',
	'fade-left': 'fade-in-left',
	scale: 'scale-in'
};

export function scrollReveal(node: HTMLElement, opts: RevealOptions = {}) {
	const { delay = 0, threshold = 0.08, margin = '0px 0px -40px 0px', direction = 'fade-up' } = opts;
	const animName = animationStyles[direction] || 'fade-in-up';

	node.style.opacity = '0';

	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					node.style.animation = `${animName} 0.5s ease-out ${delay}s both`;
					observer.unobserve(node);
				}
			}
		},
		{ threshold, rootMargin: margin }
	);

	observer.observe(node);

	return {
		update() {
			// Reset and re-observe if options change
			node.style.opacity = '0';
			node.style.animation = '';
			observer.unobserve(node);
			observer.observe(node);
		},
		destroy() {
			observer.disconnect();
		}
	};
}
