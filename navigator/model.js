(function(root){
'use strict';
var VERSION='1.0';
var DEMO_DATE='2026-11-18';
var STORAGE_VERSION=2;
var owners=['Care navigator A','Clinic coordinator B','Hospital coordinator C','Specialist coordinator D'];
var QUEUED='Queued, not sent (simulation)';
var REF_SWITCH='Open switch ';
var REF_MODULE=' of the NomoVita Pregnancy Pathway module';

/* Rules are data. Every flag shown in the interface comes from one row of this table. */
var RULES=[
{id:'R1',name:'No owner',condition:'The case is open and no coordinator is assigned.',owner:'Unassigned queue',nextStep:'Assign a coordinator, then {action}.'},
{id:'R2',name:'Past due',condition:'The case is open and its due date is before the demo date. The wording depends on the case type: result not received, visit not recorded, referral not completed, handoff not closed, follow-up not done.',owner:'Assigned coordinator',nextStep:'{owner} to {action}.'},
{id:'R3',name:'Handoff not accepted by receiving team',condition:'A handoff was sent and the receiving team has not recorded acceptance.',owner:'Receiving team',nextStep:'Ask {receiver} to accept the handoff and record acceptance; if there is no response, {owner} sends it to another team.'},
{id:'R4',name:'Due within 2 days',condition:'The case is open, no completion is recorded and the due date is the demo date or falls within the next 2 days.',owner:'Assigned coordinator',nextStep:'{owner} to {action} before the due date.'}
];

/* Case types: wording used by the rules and by the simulated patient messages. */
var TYPES={
result:{label:'Screening result',pastDue:'Result not received',step:'your screening result',action:'request the result from the laboratory and record the reference',closing:'The result is received, a completion reference is recorded and a coordinator confirms closure'},
visit:{label:'Antenatal visit',pastDue:'Visit not recorded',step:'your antenatal visit',action:'make contact, assess urgency, set a new visit date and record the contact',closing:'A new contact or a documented exception is recorded and a coordinator confirms closure'},
referral:{label:'Specialist referral',pastDue:'Referral not completed',step:'your specialist referral',action:'confirm the specialist appointment with the receiving team and record the reference',closing:'The receiving team accepts the referral, a completion reference is recorded and a coordinator confirms closure'},
handoff:{label:'Hospital to primary care handoff',pastDue:'Handoff not closed',step:'your move from hospital care to primary care',action:'confirm that the discharge summary has reached the receiving team and record the reference',closing:'The receiving team accepts the handoff, a completion reference is recorded and a coordinator confirms closure'},
followup:{label:'Postnatal follow-up',pastDue:'Follow-up not done',step:'your postnatal follow-up',action:'arrange the follow-up contact and record its completion',closing:'The follow-up is recorded as done and a coordinator confirms closure'}
};

function ruleRefFor(n){return REF_SWITCH+n+REF_MODULE;}

function seed(){return {version:STORAGE_VERSION,date:DEMO_DATE,tasks:[
{id:'SYN-101',type:'result',patient:'Synthetic patient 01',stage:'First-trimester screening',title:'Confirm screening result received',due:'2026-11-17',owner:'',status:'open',receiver:'',accepted:false,evidence:'',confirmedBy:'',ruleRef:'No open switch of the module matches this case; the rules R1 and R2 of this demo apply.'},
{id:'SYN-102',type:'handoff',patient:'Synthetic patient 02',stage:'Maternity hospital to primary care',title:'Close discharge handoff',due:'2026-11-18',owner:owners[2],status:'open',receiver:owners[1],accepted:false,evidence:'',confirmedBy:'',ruleRef:ruleRefFor(44)+' (hospital discharge summary received)'},
{id:'SYN-103',type:'followup',patient:'Synthetic patient 03',stage:'Postnatal follow-up',title:'Confirm postnatal home visit completed',due:'2026-11-20',owner:owners[0],status:'open',receiver:'',accepted:false,evidence:'',confirmedBy:'',ruleRef:'No open switch of the module matches this case; the rules R2 and R4 of this demo apply.'},
{id:'SYN-104',type:'visit',patient:'Synthetic patient 04',stage:'Planned antenatal visit',title:'Confirm planned visit took place',due:'2026-11-16',owner:owners[1],status:'open',receiver:'',accepted:false,evidence:'',confirmedBy:'',ruleRef:ruleRefFor(26)+' (scheduled visit missed)'},
{id:'SYN-105',type:'referral',patient:'Synthetic patient 05',stage:'Specialist consultation',title:'Confirm specialist referral accepted',due:'2026-11-19',owner:owners[0],status:'open',receiver:owners[3],accepted:false,evidence:'',confirmedBy:'',ruleRef:'No open switch of the module matches this case; the rules R3 and R4 of this demo apply.'}
],events:[],notices:[],messages:[]};}

/* Dates */
function dayNum(iso){var p=iso.split('-').map(Number);return Math.round(Date.UTC(p[0],p[1]-1,p[2])/86400000);}
function addDays(iso,n){return new Date((dayNum(iso)+n)*86400000).toISOString().slice(0,10);}
var MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function fmtDate(iso){var p=iso.split('-').map(Number);return p[2]+' '+MONTHS[p[1]-1]+' '+p[0];}
function plural(n,w){return n+' '+w+(n===1?'':'s');}

function task(s,id){var t=s.tasks.find(function(t){return t.id===id;});if(!t)throw Error('Unknown case');return t;}
function log(s,t,action,detail){s.events.push({id:s.events.length+1,at:new Date().toISOString(),caseId:t.id,action:action,detail:detail});}
function ruleById(id){return RULES.find(function(r){return r.id===id;});}

/* Flags: computed only from the rules and the data of the case. */
function activeRuleIds(t,date){
if(t.status==='closed')return [];
var ids=[],diff=dayNum(t.due)-dayNum(date);
if(!t.owner)ids.push('R1');
if(diff<0)ids.push('R2');
if(t.receiver&&!t.accepted)ids.push('R3');
if(diff>=0&&diff<=2&&!t.evidence)ids.push('R4');
return ids;}

function deadlineText(t,date){
var diff=dayNum(t.due)-dayNum(date);
if(diff<0)return 'Due '+fmtDate(t.due)+'; '+plural(-diff,'day')+' past due on the demo date '+fmtDate(date);
if(diff===0)return 'Due '+fmtDate(t.due)+'; due on the demo date '+fmtDate(date);
return 'Due '+fmtDate(t.due)+'; '+plural(diff,'day')+' left on the demo date '+fmtDate(date);}

function fill(tpl,vars){return tpl.replace(/\{(\w+)\}/g,function(m,k){return vars[k];});}

function explain(s,caseId){
var t=task(s,caseId),ty=TYPES[t.type],out=[];
activeRuleIds(t,s.date).forEach(function(id){
var r=ruleById(id),diff=dayNum(t.due)-dayNum(s.date),owner=t.owner||'Unassigned queue',why,who=owner,vars;
var comp=t.evidence?'completion reference recorded, closure not yet confirmed':'no completion recorded';
if(id==='R1'){why='No coordinator is assigned to this open case. Due '+fmtDate(t.due)+'; '+comp+'.';who='Unassigned queue';}
else if(id==='R2'){why=ty.pastDue+': due '+fmtDate(t.due)+'; '+comp+'; '+plural(-diff,'day')+' past due on the demo date '+fmtDate(s.date)+'.';}
else if(id==='R3'){why='Handoff sent to '+t.receiver+'; acceptance not recorded. Due '+fmtDate(t.due)+'; '+comp+'.';who=t.receiver;}
else{why='Due '+fmtDate(t.due)+'; no completion recorded; '+(diff===0?'due on the demo date '+fmtDate(s.date):plural(diff,'day')+' left on the demo date '+fmtDate(s.date))+'.';}
vars={action:ty.action,owner:owner,receiver:t.receiver||''};
var step=fill(r.nextStep,vars);
if(id==='R4'&&!t.owner)step='Assign a coordinator, then '+ty.action+' before the due date.';
if(id==='R2'&&!t.owner)step='Assign a coordinator, then '+ty.action+'.';
if(id==='R3'&&!t.owner)step='Assign a coordinator, then ask '+t.receiver+' to accept the handoff and record acceptance.';
out.push({ruleId:id,ruleName:r.name,why:why,deadline:deadlineText(t,s.date),owner:who,nextStep:step.charAt(0).toUpperCase()+step.slice(1),closesWhen:ty.closing+'. Closure needs an assigned owner'+(t.receiver?', acceptance by the receiving team':'')+', a completion reference and a confirming coordinator.'});
});
return out;}

/* Patient notification queue (simulation): messages are queued, never sent. */
function queueMessage(s,t,trigger,keyPart,text){
var key=[t.id,trigger,keyPart].join('|');
if(s.messages.some(function(m){return m.key===key;}))return 0;
s.messages.push({key:key,caseId:t.id,patient:t.patient,trigger:trigger,text:text,status:QUEUED,createdAt:s.date});return 1;}
function closureCount(s,t){return s.events.filter(function(e){return e.caseId===t.id&&e.action==='Closure confirmed';}).length;}
function assignedMessage(s,t){return queueMessage(s,t,'Owner assigned',t.owner,'Your care coordinator for '+TYPES[t.type].step+' is '+t.owner+'. They are responsible for this step and will keep you informed.');}
function acceptedMessage(s,t){return queueMessage(s,t,'Handoff accepted',t.receiver,t.receiver+' has accepted the handoff for '+TYPES[t.type].step+'. '+t.owner+' remains responsible for this step.');}
function closedMessage(s,t){return queueMessage(s,t,'Step closed',String(closureCount(s,t)),'This step is complete: '+TYPES[t.type].step+'. Thank you. If anything changes, please contact your clinic.');}
function reminderMessages(s){
var added=0;
s.tasks.forEach(function(t){
if(t.status==='closed'||(t.type!=='visit'&&t.type!=='followup'))return;
var ids=activeRuleIds(t,s.date),who=t.owner?'Your care coordinator is '+t.owner+'.':'A care coordinator will be assigned and will contact you.';
if(ids.indexOf('R4')>=0)added+=queueMessage(s,t,'R4 Due within 2 days',t.due,'Reminder: '+TYPES[t.type].step+' is planned for '+fmtDate(t.due)+'. '+who+' If you have questions, please contact your clinic.');
if(ids.indexOf('R2')>=0)added+=queueMessage(s,t,'R2 Past due',t.due,'The planned date for '+TYPES[t.type].step+' ('+fmtDate(t.due)+') has passed and no completion is recorded. '+who+' You will be contacted to agree the next date.');
});
return added;}

function act(s,id,action,value){var t=task(s,id);value=(value||'').trim();
if(action==='assign'){if(owners.indexOf(value)<0)throw Error('Choose a responsible owner');if(t.status==='closed')throw Error('Reopen before reassignment');if(t.owner===value)return t;t.owner=value;log(s,t,'Owner assigned',value);assignedMessage(s,t);}
else if(action==='send'){if(t.status==='closed')throw Error('Reopen before sending a handoff');if(!t.owner)throw Error('Assign owner first');if(owners.indexOf(value)<0||value===t.owner)throw Error('Choose a different receiving coordinator');if(t.receiver&&!t.accepted)throw Error('Resolve the pending handoff first');t.receiver=value;t.accepted=false;t.evidence='';t.confirmedBy='';log(s,t,'Handoff sent',t.owner+' to '+value);}
else if(action==='accept'){if(t.status==='closed'||!t.receiver)throw Error('No pending handoff');if(!t.owner)throw Error('Assign owner first');if(t.accepted)return t;t.accepted=true;log(s,t,'Handoff accepted',t.receiver);acceptedMessage(s,t);}
else if(action==='evidence'){if(t.status==='closed')throw Error('Reopen before changing evidence');if(!t.owner)throw Error('Assign owner first');if(!value)throw Error('Enter a synthetic completion reference');t.evidence=value;log(s,t,'Completion recorded',value);}
else if(action==='close'){if(t.status==='closed')return t;if(!t.owner)throw Error('Assign owner first');if(t.receiver&&!t.accepted)throw Error('Receiving team must accept handoff');if(!t.evidence)throw Error('Record completion evidence first');if(owners.indexOf(value)<0)throw Error('Choose a confirming coordinator');t.status='closed';t.confirmedBy=value;log(s,t,'Closure confirmed',value);closedMessage(s,t);}
else if(action==='reopen'){if(t.status!=='closed')return t;t.status='open';t.evidence='';t.confirmedBy='';t.accepted=false;log(s,t,'Reopened','Previous completion retained in audit log');}
else throw Error('Unsupported action');reconcile(s,false);return t;
}

/* Internal coordinator queue: one notice per case and rule, rerouted when ownership changes. */
function reconcile(s,create){var added=0;
s.tasks.forEach(function(t){var ids=activeRuleIds(t,s.date);
function recipient(rid){return rid==='R3'?t.receiver:(t.owner||'Unassigned queue');}
function reasonOf(rid){return ruleById(rid).name;}
s.notices.filter(function(n){return n.caseId===t.id;}).forEach(function(n){var active=ids.some(function(rid){return reasonOf(rid)===n.reason;});var rid=ids.find(function(r){return reasonOf(r)===n.reason;});
if(active){var to=recipient(rid);if(n.resolved||n.to!==to)n.read=false;n.to=to;n.resolved=false;n.resolvedAt=null;}
else if(!n.resolved){n.resolved=true;n.resolvedAt=new Date().toISOString();}});
if(create)ids.forEach(function(rid){var reason=reasonOf(rid);
if(!s.notices.some(function(n){return n.caseId===t.id&&n.reason===reason;})){s.notices.push({key:[t.id,reason].join('|'),caseId:t.id,ruleId:rid,reason:reason,to:recipient(rid),read:false,resolved:false,resolvedAt:null});added++;}});
});
return added;}

function scan(s){var n=reconcile(s,true);reminderMessages(s);return n;}
function scanSummary(s){var before=s.messages.length;var n=reconcile(s,true);reminderMessages(s);return {notices:n,messages:s.messages.length-before};}

function advance(s,days){days=Number(days);if(!isFinite(days)||Math.floor(days)!==days)throw Error('Days must be a whole number');var next=addDays(s.date,days);if(dayNum(next)<dayNum(DEMO_DATE))throw Error('The demo date cannot go before '+fmtDate(DEMO_DATE));s.date=next;reconcile(s,false);return s.date;}
function backToStart(s){s.date=DEMO_DATE;reconcile(s,false);return s.date;}

function metrics(s){var open=s.tasks.filter(function(t){return t.status!=='closed';});
return {open:open.length,flagged:open.filter(function(t){return activeRuleIds(t,s.date).length>0;}).length,overdue:open.filter(function(t){return t.due<s.date;}).length,handoffs:open.filter(function(t){return t.receiver&&!t.accepted;}).length,closed:s.tasks.length-open.length};}

function filterCases(s,status,owner){return s.tasks.filter(function(t){
var okStatus=status==='all'||!status||(status==='open'&&t.status!=='closed')||(status==='closed'&&t.status==='closed')||(status==='flagged'&&activeRuleIds(t,s.date).length>0);
var okOwner=!owner||owner==='all'||(owner==='unassigned'?!t.owner:t.owner===owner);
return okStatus&&okOwner;});}

function exportState(s){
return {version:VERSION,storageVersion:s.version,demoDate:s.date,note:'Synthetic data only. Rules, not AI. Nothing was sent.',
cases:s.tasks,
flags:s.tasks.map(function(t){return {caseId:t.id,flags:explain(s,t.id)};}),
internalQueue:s.notices,
patientNotificationQueue:s.messages,
auditLog:s.events};}

function valid(x){return !!x&&x.version===STORAGE_VERSION&&Array.isArray(x.tasks)&&Array.isArray(x.events)&&Array.isArray(x.notices)&&Array.isArray(x.messages)&&typeof x.date==='string';}

var api={seed:seed,act:act,scan:scan,scanSummary:scanSummary,metrics:metrics,owners:owners,reconcile:reconcile,RULES:RULES,TYPES:TYPES,explain:explain,activeRuleIds:activeRuleIds,advance:advance,backToStart:backToStart,filterCases:filterCases,exportState:exportState,valid:valid,fmtDate:fmtDate,addDays:addDays,DEMO_DATE:DEMO_DATE,VERSION:VERSION,QUEUED:QUEUED,STORAGE_VERSION:STORAGE_VERSION};
if(typeof module!=='undefined')module.exports=api;root.NavigatorModel=api;
})(typeof window!=='undefined'?window:globalThis);
