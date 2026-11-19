'use strict';
const M=NavigatorModel,key='nomovita-care-navigator-v2';
let state=M.seed(),storageOk=true,startNote='';
try{const raw=localStorage.getItem(key);if(raw){const x=JSON.parse(raw);if(M.valid(x))state=x;}}catch(e){storageOk=false;}
const $=id=>document.getElementById(id),esc=x=>String(x==null?'':x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function save(){try{localStorage.setItem(key,JSON.stringify(state));}catch(e){storageOk=false;$('status').textContent='Storage unavailable. The demo keeps working in memory; changes last only until this page is closed.';}}
if(!storageOk)startNote='Storage unavailable. The demo keeps working in memory; changes last only until this page is closed.';
function options(selected){return '<option value="">Choose coordinator</option>'+M.owners.map(o=>`<option value="${esc(o)}" ${o===selected?'selected':''}>${esc(o)}</option>`).join('');}
function flagsHtml(t){const fl=M.explain(state,t.id);if(!fl.length)return t.status==='closed'?'':'<div class="why"><h4>Why this case is flagged</h4><p class="muted">No rule is triggered on the demo date.</p></div>';
return '<div class="why"><h4>Why this case is flagged</h4>'+fl.map(f=>`<div class="flag"><span class="pill warn">${esc(f.ruleId)} ${esc(f.ruleName)}</span><dl><dt>Why</dt><dd>${esc(f.why)}</dd><dt>Deadline</dt><dd>${esc(f.deadline)}</dd><dt>Next step owner</dt><dd>${esc(f.owner)}</dd><dt>Next step</dt><dd>${esc(f.nextStep)}</dd><dt>Closes when</dt><dd>${esc(f.closesWhen)}</dd></dl></div>`).join('')+'</div>';}
function cardHtml(t){const ty=M.TYPES[t.type],flagged=M.activeRuleIds(t,state.date).length>0,closed=t.status==='closed',pend=t.receiver&&!t.accepted;
return `<article class="card ${closed?'closed':flagged?'flagged':'open'}" data-id="${esc(t.id)}"><small>${esc(t.id)} &middot; ${esc(t.patient)}</small><h3>${esc(t.title)}</h3><p class="muted">${esc(ty.label)} &middot; ${esc(t.stage)}</p><p><span class="pill">${closed?'CLOSED':t.due<state.date?'PAST DUE':'OPEN'}</span>${flagged?'<span class="pill warn">FLAGGED</span>':''} Due ${esc(M.fmtDate(t.due))}</p>${flagsHtml(t)}<p class="ref">${esc(t.ruleRef)}</p>
<label for="owner-${esc(t.id)}">Responsible coordinator</label><select id="owner-${esc(t.id)}" data-action="assign" ${closed?'disabled':''}>${options(t.owner)}</select>
<label for="receiver-${esc(t.id)}">New handoff destination</label><select id="receiver-${esc(t.id)}" ${closed||pend?'disabled':''}>${options('')}</select>
<div class="actions"><button data-action="send" ${closed||pend?'disabled':''}>Send simulated handoff</button></div>
${t.receiver?`<p class="muted">Receiving team: ${esc(t.receiver)}</p><button data-action="accept" ${t.accepted||closed?'disabled':''}>${t.accepted?'Receiving team accepted':'Simulate receiving-team acceptance'}</button>`:''}
<label for="ref-${esc(t.id)}">Synthetic completion reference</label><input id="ref-${esc(t.id)}" maxlength="120" placeholder="e.g. DEMO-RESULT-001" value="${esc(t.evidence)}" ${closed?'disabled':''}>
<div class="actions"><button data-action="evidence" ${closed?'disabled':''}>Record completion</button></div>
<label for="confirm-${esc(t.id)}">Confirming coordinator (simulated identity)</label><select id="confirm-${esc(t.id)}" ${closed?'disabled':''}>${options(t.confirmedBy)}</select>
<div class="actions"><button class="primary" data-action="close" ${closed?'disabled':''}>Confirm closure</button><button data-action="reopen" ${!closed?'disabled':''}>Reopen</button></div></article>`;}
function render(){M.reconcile(state,false);const m=M.metrics(state);
$('demodate').textContent=M.fmtDate(state.date);
$('metrics').innerHTML=Object.entries(m).map(([k,v])=>`<div class="metric"><strong>${v}</strong>${{open:'Open next steps',flagged:'Flagged cases',overdue:'Past due date',handoffs:'Unaccepted handoffs',closed:'Confirmed closures'}[k]}</div>`).join('');
const cur=$('ownerfilter').value;$('ownerfilter').innerHTML='<option value="all">All owners</option><option value="unassigned">Unassigned</option>'+M.owners.map(o=>`<option value="${esc(o)}">${esc(o)}</option>`).join('');$('ownerfilter').value=cur||'all';if($('ownerfilter').value!==(cur||'all'))$('ownerfilter').value='all';
const list=M.filterCases(state,$('filter').value,$('ownerfilter').value);
$('cards').innerHTML=list.length?list.map(cardHtml).join(''):'<p>No cases match this filter.</p>';
$('messages').innerHTML=state.messages.length?[...state.messages].reverse().map(n=>`<div class="entry"><b>${esc(n.caseId)} &middot; ${esc(n.patient)}</b><br>${esc(n.text)}<br><small>Trigger: ${esc(n.trigger)} &middot; Created ${esc(M.fmtDate(n.createdAt))} &middot; ${esc(n.status)}</small></div>`).join(''):'<p>No simulated patient messages yet. They are queued when an owner is assigned, a handoff is accepted, a step is closed, or a reminder rule fires.</p>';
$('notices').innerHTML=state.notices.length?state.notices.map((n,i)=>`<div class="entry">${esc(n.caseId)} &middot; ${esc(n.ruleId||'')} ${esc(n.reason)}<br><small>Recipient: ${esc(n.to)} &middot; ${n.resolved?'Resolved':n.read?'Active, acknowledged':'Active, unread'}</small> <button data-read="${i}" ${n.read||n.resolved?'disabled':''}>Acknowledge</button></div>`).join(''):'<p>No coordinator notifications yet. Check the queue to identify unresolved cases.</p>';
$('audit').innerHTML=state.events.length?[...state.events].reverse().map(e=>`<div class="entry"><b>${esc(e.caseId)} &middot; ${esc(e.action)}</b><br>${esc(e.detail)}<br><small>${esc(e.at)}</small></div>`).join(''):'<p>No actions recorded yet.</p>';
$('rules').innerHTML='<tr><th>Rule</th><th>Condition</th><th>Owner of next step</th><th>Next step</th></tr>'+M.RULES.map(r=>`<tr><td><b>${esc(r.id)}</b> ${esc(r.name)}</td><td>${esc(r.condition)}</td><td>${esc(r.owner)}</td><td>${esc(r.nextStep)}</td></tr>`).join('');}
function action(el){const card=el.closest('[data-id]');if(!card)return;const id=card.dataset.id,a=el.dataset.action;let value=el.value;if(a==='send')value=$('receiver-'+id).value;if(a==='evidence')value=$('ref-'+id).value;if(a==='close')value=$('confirm-'+id).value;
try{M.act(state,id,a,value);$('status').textContent='Saved: '+id+' '+a;save();render();}catch(e){$('status').textContent=e.message;}}
$('cards').addEventListener('change',e=>{if(e.target.dataset.action==='assign')action(e.target);});
$('cards').addEventListener('click',e=>{if(e.target.tagName==='BUTTON'&&e.target.dataset.action)action(e.target);});
$('filter').onchange=render;$('ownerfilter').onchange=render;
$('scan').onclick=()=>{const r=M.scanSummary(state);$('status').textContent=`${r.notices} new coordinator notification(s), ${r.messages} new simulated patient message(s). Nothing was sent.`;save();render();};
$('advance').onclick=()=>{try{M.advance(state,1);const r=M.scanSummary(state);$('status').textContent=`Demo date is now ${M.fmtDate(state.date)}. ${r.notices} new coordinator notification(s), ${r.messages} new simulated patient message(s). Nothing was sent.`;save();render();}catch(e){$('status').textContent=e.message;}};
$('back').onclick=()=>{M.backToStart(state);$('status').textContent='Demo date is back to '+M.fmtDate(state.date)+'.';save();render();};
$('notices').onclick=e=>{if(e.target.dataset.read!==undefined){state.notices[Number(e.target.dataset.read)].read=true;save();render();}};
$('reset').onclick=()=>{if(!confirm('Reset only this synthetic demo, its queues and its local audit log?')){$('status').textContent='Reset cancelled.';return;}state=M.seed();save();render();$('status').textContent='Synthetic demo reset to 18 Nov 2026.';};
$('export').onclick=()=>{try{const u=URL.createObjectURL(new Blob([JSON.stringify(M.exportState(state),null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=u;a.download='nomovita-care-navigator-synthetic-export.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);$('status').textContent='Exported synthetic state as JSON.';}catch(e){$('status').textContent='Export failed: '+e.message;}};
render();if(startNote)$('status').textContent=startNote;
