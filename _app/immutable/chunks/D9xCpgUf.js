import{t as e}from"./DjVrrERs.js";function t(e){return e?e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`):``}var n={review_struggles:`Review Struggle Areas`,homework_help:`Homework Help`,project_help:`Project Help`,learn_new:`Learn Something New`,practice:`Practice`,wrap_up:`Wrap Up`};function r(e){let r=n[e.section]||e.section;return`
		<div style="margin-bottom: 12px; padding: 12px; background: #1a1d1f; border-left: 3px solid #00E5A0; border-radius: 6px;">
			<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
				<strong style="color: #EDEFEF; font-size: 14px;">${t(e.title)}</strong>
				<span style="color: #00E5A0; font-size: 11px; background: rgba(0,229,160,0.1); padding: 2px 8px; border-radius: 10px;">${t(r)}</span>
			</div>
			${e.description?`<p style="color: #a8adad; font-size: 13px; margin: 6px 0 0 0;">${t(e.description)}</p>`:``}
			${e.duration_minutes?`<span style="color: #6e7373; font-size: 11px;">⏱ ${e.duration_minutes} min</span>`:``}
		</div>`}function i(e){return e.length?`
		<div style="margin-top: 16px;">
			<h3 style="color: #00E5A0; font-size: 15px; font-weight: 600; margin-bottom: 8px;">📚 Resources</h3>
			${e.map(e=>`
				<div style="margin-bottom: 6px; font-size: 13px;">
					<a href="${t(e.url)}" style="color: #00E5A0;">${t(e.title)}</a>
					<span style="color: #6e7373;"> — ${t(e.source)} (${e.type})</span>
				</div>
			`).join(``)}
		</div>`:``}function a(){return`
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
	`}function o(o,s,c){let l=`Day Plan — ${e(o.date)}`,u=new Map;for(let e of s){let t=u.get(e.section)||[];t.push(e),u.set(e.section,t)}return`<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>${t(l)}</title><style>${a()}</style></head>
<body>
	<h1>${t(l)}</h1>
	<div class="meta">
		${o.energy_level?`<span class="badge badge-focus">⚡ ${t(o.energy_level)} energy</span>`:``}
		${o.struggle_areas?.length?`<span style="margin-left: 8px; color: #a8adad;">Focus: ${t(o.struggle_areas.join(`, `))}</span>`:``}
	</div>
	${[...u.entries()].map(([e,i])=>`
		<h2>${t(n[e]||e)}</h2>
		${i.map(r).join(``)}
	`).join(``)}
	${i(c)}
</body></html>`}function s(e){let t=window.open(``,`_blank`,`width=900,height=700`);t&&(t.document.write(e),t.document.close(),t.focus())}function c(e,t,n){return{type:`day_plan`,version:1,exported_at:new Date().toISOString(),day:{date:e.date,day_of_week:e.day_of_week,energy_level:e.energy_level,recent_progress:e.recent_progress,struggle_areas:e.struggle_areas,grades_context:e.grades_context},tasks:t.map(e=>({section:e.section,title:e.title,description:e.description,duration_minutes:e.duration_minutes})),resources:n.map(e=>({title:e.title,url:e.url,source:e.source,type:e.type,description:e.description}))}}function l(e,t){let n=new Blob([e],{type:`application/json`}),r=URL.createObjectURL(n),i=document.createElement(`a`);i.href=r,i.download=t,document.body.appendChild(i),i.click(),document.body.removeChild(i),URL.revokeObjectURL(r)}function u(e){let t;try{t=JSON.parse(e)}catch{throw Error(`Invalid JSON file.`)}let n=t;if(!n.type||!n.version)throw Error(`Not a valid Prepless AI export file. Missing type or version.`);if(n.type!==`day_plan`&&n.type!==`week_plan`)throw Error(`Unknown export type: "${n.type}". Expected "day_plan" or "week_plan".`);return{type:n.type,data:n}}export{u as a,s as i,o as n,c as r,l as t};