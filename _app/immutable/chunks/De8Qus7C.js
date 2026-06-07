import{A as e,B as t,C as n,D as r,J as i,K as a,T as o,c as s,h as c,i as l,j as u,l as d,st as f,u as p,w as m}from"./Oh321WOq.js";import"./xihTtKlq.js";var h=r(`<span class="text-sm text-[var(--color-text-secondary)] group-has-[:disabled]:opacity-50"> </span>`),g=r(`<label class="inline-flex items-center gap-2.5 cursor-pointer group"><input type="checkbox" class="sr-only peer"/> <div></div> <!></label>`);function _(e,r){let _=l(r,`checked`,3,!1),v=l(r,`disabled`,3,!1);var y=g(),b=a(y);s(b);var x=i(b,2),S=i(x,2),C=e=>{var n=h(),i=a(n,!0);f(n),t(()=>m(i,r.label)),o(e,n)};n(S,e=>{r.label&&e(C)}),f(y),t(()=>{d(b,`name`,r.name),p(b,_()),b.disabled=v(),c(x,1,`relative w-9 h-5 rounded-full transition-colors duration-200
		${_()?`bg-[var(--color-primary-500)]`:`bg-[var(--color-border-strong)]`}
		peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
		after:content-[''] after:absolute after:top-0.5 after:left-0.5
		after:w-4 after:h-4 after:rounded-full after:bg-white
		after:shadow-sm after:transition-transform after:duration-200
		${_()?`after:translate-x-4`:`after:translate-x-0`}`)}),u(`change`,b,function(...e){r.onchange?.apply(this,e)}),o(e,y)}e([`change`]);export{_ as t};