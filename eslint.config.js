import prettier from 'eslint-config-prettier';
import path from 'node:path';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig, includeIgnoreFile } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore');

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	ts.configs.recommended,
	svelte.configs.recommended,
	prettier,
	svelte.configs.prettier,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			'no-undef': 'off',

			// Allow `any` in legacy/rapid-prototype code — type migration is tracked separately.
			'@typescript-eslint/no-explicit-any': 'warn',

			// Ignore comments are validated by TypeScript, lint double-check is noisy here.
			'svelte/no-unused-svelte-ignore': 'warn',

			// SvelteKit's `goto()` + `href` pattern is correct; the rule is overly strict for this codebase.
			'svelte/no-navigation-without-resolve': 'off',

			// Each-block keys are nice-to-have; not fixing 40+ occurrences in this pass.
			'svelte/require-each-key': 'warn',

			// Svelte 5 reactivity helpers (SvelteSet/SvelteMap/SvelteDate) — opt-in migration.
			'svelte/prefer-svelte-reactivity': 'warn'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser,
				svelteConfig
			}
		}
	},
	{
		// Override or add rule settings here, such as:
		// 'svelte/button-has-type': 'error'
		rules: {}
	}
);
