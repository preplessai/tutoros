import{A as e,B as t,C as n,D as r,E as i,H as a,J as o,K as s,O as c,P as l,Q as u,S as d,T as f,X as p,Z as m,d as h,h as g,it as _,j as v,k as y,lt as b,n as x,ot as S,q as C,rt as w,st as T,w as E,x as D}from"./BlOJOaBs.js";import{t as O}from"./AaDejIe_.js";import"./xihTtKlq.js";import{t as k}from"./CaZyhCn_.js";import{t as A}from"./BZTu3aZu.js";import{t as j}from"./Dq2cTyJZ.js";import{t as M}from"./6oveTLn-.js";import"./CMRWCDjv.js";import{t as N}from"./gp8TymhS.js";import{t as P}from"./DBMtUykv.js";import{t as F}from"./lX8dDHcr.js";import{t as I}from"./DHLfMAy_.js";import{i as L,r as ee}from"./0RJQ3WgN.js";import{t as R}from"./BZ-YuojU.js";import{t as z}from"./YoYJwmxC.js";import{t as B}from"./BDyhsB8z.js";import{t as V}from"./DmDPGKbu.js";function H(e){return e?e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`):``}var U={review_struggles:`Review Struggle Areas`,homework_help:`Homework Help`,project_help:`Project Help`,learn_new:`Learn Something New`,practice:`Practice`,wrap_up:`Wrap Up`};function W(e){let t=U[e.section]||e.section;return`
		<div style="margin-bottom: 12px; padding: 12px; background: #1a1d1f; border-left: 3px solid #00E5A0; border-radius: 6px;">
			<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
				<strong style="color: #EDEFEF; font-size: 14px;">${H(e.title)}</strong>
				<span style="color: #00E5A0; font-size: 11px; background: rgba(0,229,160,0.1); padding: 2px 8px; border-radius: 10px;">${H(t)}</span>
			</div>
			${e.description?`<p style="color: #a8adad; font-size: 13px; margin: 6px 0 0 0;">${H(e.description)}</p>`:``}
			${e.duration_minutes?`<span style="color: #6e7373; font-size: 11px;">⏱ ${e.duration_minutes} min</span>`:``}
		</div>`}function G(e){return e.length?`
		<div style="margin-top: 16px;">
			<h3 style="color: #00E5A0; font-size: 15px; font-weight: 600; margin-bottom: 8px;">📚 Resources</h3>
			${e.map(e=>`
				<div style="margin-bottom: 6px; font-size: 13px;">
					<a href="${H(e.url)}" style="color: #00E5A0;">${H(e.title)}</a>
					<span style="color: #6e7373;"> — ${H(e.source)} (${e.type})</span>
				</div>
			`).join(``)}
		</div>`:``}function K(){return`
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
	`}function q(e,t,n){let r=`Day Plan — ${I(e.date)}`,i=new Map;for(let e of t){let t=i.get(e.section)||[];t.push(e),i.set(e.section,t)}return`<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>${H(r)}</title><style>${K()}</style></head>
<body>
	<h1>${H(r)}</h1>
	<div class="meta">
		${e.energy_level?`<span class="badge badge-focus">⚡ ${H(e.energy_level)} energy</span>`:``}
		${e.struggle_areas?.length?`<span style="margin-left: 8px; color: #a8adad;">Focus: ${H(e.struggle_areas.join(`, `))}</span>`:``}
	</div>
	${[...i.entries()].map(([e,t])=>`
		<h2>${H(U[e]||e)}</h2>
		${t.map(W).join(``)}
	`).join(``)}
	${G(n)}
</body></html>`}function J(e,t){let n=`Week ${e.week_number} — ${e.theme||`Plan`}`,r=new Date(e.week_start+`T00:00:00`).toLocaleDateString(`en-US`,{month:`short`,day:`numeric`}),i=new Date(e.week_end+`T00:00:00`).toLocaleDateString(`en-US`,{month:`short`,day:`numeric`,year:`numeric`});return`<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>${H(n)}</title><style>${K()}</style></head>
<body>
	<h1>Week ${e.week_number}</h1>
	<div class="meta">
		${r} — ${i}
		${e.theme?`<span class="badge badge-focus">${H(e.theme)}</span>`:``}
	</div>
	${e.focus_areas?.length?`<p class="meta" style="margin-top: 4px;">Focus areas: ${H(e.focus_areas.join(`, `))}</p>`:``}
	${e.notes?`<p class="meta">${H(e.notes)}</p>`:``}

	${t.map(({day:e,tasks:t})=>{let n=new Map;for(let e of t){let t=n.get(e.section)||[];t.push(e),n.set(e.section,t)}return`
		<div class="day-block">
			<div class="day-date">${I(e.date)}</div>
			<div class="day-subtitle">
				${e.energy_level?`<span class="badge badge-focus">⚡ ${H(e.energy_level)}</span>`:``}
				${e.struggle_areas?.length?`<span style="margin-left: 8px;">Focus: ${H(e.struggle_areas.join(`, `))}</span>`:``}
			</div>
			${[...n.entries()].map(([e,t])=>`
				<h3>${H(U[e]||e)}</h3>
				${t.map(W).join(``)}
			`).join(``)}
		</div>`}).join(``)}
</body></html>`}function Y(e){let t=window.open(``,`_blank`,`width=900,height=700`);t&&(t.document.write(e),t.document.close(),t.focus())}var X=r(`<div><span class="text-xs font-semibold tracking-wider text-[var(--color-text-secondary)] uppercase"> </span></div>`);function Z(e,n){_(n,!0);let r=u(()=>L[n.section]||n.section),i=u(()=>ee[n.section]||`border-l-[var(--color-border-strong)] bg-[var(--color-surface-secondary)]`);var a=X(),o=s(a),c=s(o,!0);T(o),T(a),t(()=>{g(a,1,`border-l-2 pl-3 ${l(i)}`),E(c,l(r))}),f(e,a),w()}var Q=r(`<div class="flex-1 space-y-2"><!> <!> <!> <div class="flex gap-2"><button class="cursor-pointer text-sm font-medium text-[var(--color-primary-500)] hover:text-[var(--color-primary-400)]">Save</button> <button class="cursor-pointer text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-secondary)]">Cancel</button></div></div>`),te=r(`<p> </p>`),ne=r(`<div class="min-w-0 flex-1" role="button"><div class="flex items-center gap-2"><h4> </h4> <span class="shrink-0 text-xs text-[var(--color-text-tertiary)]"> </span></div> <!></div> <button class="cursor-pointer p-1 text-[var(--color-text-tertiary)] opacity-0 transition-all group-hover:opacity-100 hover:text-[var(--color-text-secondary)]" title="Edit"><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg></button>`,1),re=r(`<div class="group flex gap-3 rounded-lg p-3 transition-colors hover:bg-[var(--color-surface-secondary)]/50"><!> <!></div>`);function ie(e,r){_(r,!0);let i=m(!1),c=m(``),u=m(``),d=m(0);a(()=>{p(c,r.task.title,!0),p(u,r.task.description||``,!0),p(d,r.task.duration_minutes,!0)});async function y(){await P.updateTask(r.task.id,{title:l(c),description:l(u)||null,duration_minutes:l(d)}),p(i,!1)}async function b(){await P.toggleTaskComplete(r.task.id,!r.task.completed)}var x=re(),S=s(x);R(S,{get checked(){return r.task.completed},onchange:b});var D=o(S,2),O=e=>{var t=Q(),n=s(t);N(n,{name:`editTitle`,get value(){return l(c)},oninput:e=>p(c,e.target.value,!0)});var r=o(n,2);z(r,{name:`editDesc`,get value(){return l(u)},oninput:e=>p(u,e.target.value,!0),rows:2});var a=o(r,2);N(a,{name:`editDuration`,type:`number`,get value(){return l(d)},oninput:e=>p(d,parseInt(e.target.value),!0),label:`Minutes`});var m=o(a,2),h=s(m),g=o(h,2);T(m),T(t),v(`click`,h,y),v(`click`,g,()=>p(i,!1)),f(e,t)},k=e=>{var a=ne(),c=C(a);h(c,`tabindex`,0);var l=s(c),u=s(l),d=s(u,!0);T(u);var m=o(u,2),_=s(m);T(m),T(l);var y=o(l,2),b=e=>{var n=te(),i=s(n,!0);T(n),t(()=>{g(n,1,`mt-0.5 text-xs ${r.task.completed?`text-[var(--color-text-tertiary)] line-through`:`text-[var(--color-text-secondary)]`}`),E(i,r.task.description)}),f(e,n)};n(y,e=>{r.task.description&&e(b)}),T(c);var x=o(c,2);t(()=>{g(u,1,`text-sm font-medium ${r.task.completed?`text-[var(--color-text-tertiary)] line-through`:`text-[var(--color-text-primary)]`}`),E(d,r.task.title),E(_,`${r.task.duration_minutes??``}min`)}),v(`dblclick`,c,()=>p(i,!0)),v(`click`,x,()=>p(i,!0)),f(e,a)};n(D,e=>{l(i)?e(O):e(k,-1)}),T(x),f(e,x),w()}e([`click`,`dblclick`]);var ae=r(`<div class="space-y-2"><!> <div class="space-y-1"></div></div>`),oe=r(`<div class="space-y-6"></div>`);function se(e,t){_(t,!0);let n=u(()=>Object.entries(t.tasks.reduce((e,t)=>(e[t.section]||(e[t.section]=[]),e[t.section].push(t),e),{})));var r=oe();D(r,21,()=>l(n),d,(e,t)=>{var n=u(()=>b(l(t),2));let r=()=>l(n)[0],i=()=>l(n)[1];var a=ae(),c=s(a);Z(c,{get section(){return r()}});var p=o(c,2);D(p,21,i,d,(e,t)=>{ie(e,{get task(){return l(t)}})}),T(p),T(a),f(e,a)}),T(r),f(e,r),w()}var ce=r(`<p class="mt-1 line-clamp-2 text-xs text-[var(--color-text-secondary)]"> </p>`),le=r(`<button class="shrink-0 cursor-pointer p-1 text-[var(--color-error)] opacity-0 transition-all group-hover:opacity-100 hover:text-[var(--color-error)]" title="Remove"><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>`),ue=r(`<div class="group flex items-start gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-3 transition-shadow hover:shadow-sm"><a target="_blank" rel="noopener noreferrer" class="min-w-0 flex-1 no-underline"><div class="flex items-center gap-2"><h5 class="truncate text-sm font-medium text-[var(--color-primary-500)] hover:underline"> </h5> <!></div> <div class="mt-1 flex items-center gap-2 text-xs text-[var(--color-text-secondary)]"><span> </span></div> <!></a> <!></div>`);function de(e,r){_(r,!0);let i={video:`primary`,article:`info`,practice:`success`,interactive:`warning`};var a=ue(),c=s(a),d=s(c),p=s(d),m=s(p,!0);T(p);var g=o(p,2);{let e=u(()=>i[r.resource.type]||`default`);B(g,{get variant(){return l(e)},children:(e,n)=>{S();var i=y();t(()=>E(i,r.resource.type)),f(e,i)},$$slots:{default:!0}})}T(d);var b=o(d,2),x=s(b),C=s(x,!0);T(x),T(b);var D=o(b,2),O=e=>{var n=ce(),i=s(n,!0);T(n),t(()=>E(i,r.resource.description)),f(e,n)};n(D,e=>{r.resource.description&&e(O)}),T(c);var k=o(c,2),A=e=>{var t=le();v(`click`,t,function(...e){r.onremove?.apply(this,e)}),f(e,t)};n(k,e=>{r.onremove&&e(A)}),T(a),t(()=>{h(c,`href`,r.resource.url),E(m,r.resource.title),E(C,r.resource.source)}),f(e,a),w()}e([`click`]);var fe=r(`<div class="space-y-2"><h4 class="text-sm font-semibold text-[var(--color-text-secondary)]">Assigned Resources</h4> <!></div>`);function pe(e,t){_(t,!0);var r=i(),a=C(r),c=e=>{V(e,{icon:`search`,title:`No resources assigned`,description:`Search and assign learning resources to this task.`})},p=e=>{var n=fe();D(o(s(n),2),17,()=>t.resources,d,(e,n)=>{{let r=u(()=>t.onRemove?()=>t.onRemove(l(n).id):void 0);de(e,{get resource(){return l(n)},get onremove(){return l(r)}})}}),T(n),f(e,n)};n(a,e=>{t.resources.length===0?e(c):e(p,-1)}),f(e,r),w()}var $=r(`<div class="flex justify-center py-12"><!></div>`),me=r(`<p class="mt-1 text-sm text-[var(--color-text-secondary)]"> </p>`),he=c(`<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg> Find Resources`,1),ge=c(`<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> Export`,1),_e=r(`<div class="space-y-6"><div><div class="flex items-center gap-2"><h1 class="text-xl font-bold text-[var(--color-text-primary)]"> </h1> <!></div> <!></div> <!> <!> <div class="flex flex-wrap gap-3 border-t border-[var(--color-border)] pt-4"><!> <!></div></div>`);function ve(e,r){_(r,!0),x(async()=>{await P.fetchDay(r.dayId),P.currentDay&&await F.fetchByDay(r.dayId)});function a(){return Object.values(F.resourcesByTask).flat()}async function c(e){await F.remove(e)}function d(){P.currentDay&&Y(q(P.currentDay,P.tasks,a()))}var p=i(),m=C(p),h=e=>{var t=$();j(s(t),{size:`lg`}),T(t),f(e,t)},g=e=>{A(e,{get status(){return P.error.status},get message(){return P.error.message},compact:!0})},v=e=>{var i=_e(),p=s(i),m=s(p),h=s(m),g=s(h,!0);T(h);var _=o(h,2),v=e=>{{let n=u(()=>P.currentDay.energy_level===`high`?`success`:P.currentDay.energy_level===`medium`?`info`:`warning`);B(e,{get variant(){return l(n)},children:(e,n)=>{S();var r=y();t(()=>E(r,P.currentDay.energy_level)),f(e,r)},$$slots:{default:!0}})}};n(_,e=>{P.currentDay.energy_level&&e(v)}),T(m);var b=o(m,2),x=e=>{var n=me(),r=s(n);T(n),t(e=>E(r,`Focus: ${e??``}`),[()=>P.currentDay.struggle_areas.join(`, `)]),f(e,n)};n(b,e=>{P.currentDay.struggle_areas&&e(x)}),T(p);var C=o(p,2);se(C,{get tasks(){return P.tasks}});var w=o(C,2);{let e=u(a);pe(w,{get resources(){return l(e)},onRemove:c})}var D=o(w,2),A=s(D);M(A,{variant:`secondary`,size:`sm`,onclick:()=>O(`/dashboard/resources/search?dayPlanId=${r.dayId}`),children:(e,t)=>{var n=he();S(),f(e,n)},$$slots:{default:!0}});var j=o(A,2),N=e=>{M(e,{variant:`secondary`,size:`sm`,onclick:d,children:(e,t)=>{var n=ge();S(),f(e,n)},$$slots:{default:!0}})};n(j,e=>{k.profile?.subscription_tier!==`free`&&e(N)}),T(D),T(i),t(e=>E(g,e),[()=>I(P.currentDay.date)]),f(e,i)};n(m,e=>{P.loading?e(h):P.error?e(g,1):P.currentDay&&e(v,2)}),f(e,p),w()}export{J as n,Y as r,ve as t};