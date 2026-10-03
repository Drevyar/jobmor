import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createStudentHandler } from '../supabase/functions/_shared/student-handler.ts';
import { getEligibleJobs, parseDiscovery, parseRecommendations } from '../supabase/functions/_shared/student-recommendations.ts';
import { bangkokWindow, AiError } from '../supabase/functions/_shared/ai-contracts.ts';
import { callAiProvider } from '../supabase/functions/_shared/ai-provider.ts';
import { recommendationsSchema } from '../supabase/functions/_shared/student-recommendations.ts';

const first = '30000000-0000-4000-8000-000000000001';
const second = '30000000-0000-4000-8000-000000000002';
const now = Date.parse('2026-10-01T02:00:00Z');
const job = { id:first,title:'Cafe helper',description:'Serve customers',requirements:'Customer service',category:'food-beverage',location:'Sriracha',wage:70,wage_type:'hour',working_date:'2026-10-01',shift:'18:00 - 22:00',workers_required:2,status:'active',created_at:'2026-09-29T00:00:00Z' };
const student = () => ({ skills:'Customer service',experience:'Worked at a cafe',windows:[bangkokWindow('2026-10-01','18:00','22:00')],preferences:{preferred_category:'',preferred_area:'',minimum_wage:0,wage_type:'hour'},applied:new Set(),skipped:new Set(),accepted:[],acceptedCount:new Map() });
const auth = { Authorization:'Bearer student-access-token-long-enough' };
const request = (action,extra={}) => new Request('http://localhost/student-ai',{method:'POST',headers:auth,body:JSON.stringify({action,language:'en',...extra})});
function setup(overrides={}) {
  const calls=[]; const saved=[];
  const deps={now:()=>now,authorize:async()=> 'student-a',context:async()=>({student:student(),jobs:[job,{...job,id:second,title:'Shop helper',created_at:'2026-09-28T00:00:00Z'}]}),budget:async()=>true,
    generate:async(action,_language,data)=>{calls.push({action,data});return action==='discover'
      ? {inferredSkills:[{skill:'Customer service',evidence:'Worked at a cafe'}],jobCategories:[{category:'food-beverage',reasons:['Cafe experience']}]}
      : {recommendations:data.jobs.map(item=>({jobId:item.jobId,reasons:['Stated customer service experience is relevant.']}))};},
    skip:async()=>{},radarRead:async()=>saved,radarSave:async(_id,items)=>{saved.push(...items.map(item=>({...item,status:'new'})))},...overrides};
  return {handler:createStudentHandler(deps),calls,saved};
}

test('deterministic filters reject applied, skipped, full, expired, wrong preference and conflicting shifts',()=>{
  const s=student(); const other={...job,id:second};
  assert.equal(getEligibleJobs([job,other],s,now).length,2);
  for(const change of [
    {applied:new Set([first])},{skipped:new Set([first])},{acceptedCount:new Map([[first,2]])},
    {preferences:{...s.preferences,preferred_category:'retail'}},
    {preferences:{...s.preferences,preferred_area:'Bangkok'}},
    {preferences:{...s.preferences,minimum_wage:90}},
    {accepted:[{jobId:'other',working_date:job.working_date,shift:job.shift}]},
    {windows:[bangkokWindow('2026-10-01','08:00','12:00')]},
  ]) assert.equal(getEligibleJobs([job],{...s,...change},now).length,0);
  assert.equal(getEligibleJobs([{...job,status:'draft'}],s,now).length,0);
  assert.equal(getEligibleJobs([{...job,working_date:'2026-09-30'}],s,now).length,0);
});

test('missing availability is explicit uncertainty, not invented coverage',()=>{
  const result=getEligibleJobs([job],{...student(),windows:[]},now);
  assert.equal(result[0].availability,'unknown'); assert.match(result[0].reasons[0],/confirm/i);
});

test('QuickMatch returns exactly one eligible job and keeps confirmation in client flow',async()=>{
  const {handler,calls}=setup(); const response=await handler(request('quickmatch')); const body=await response.json();
  assert.equal(response.status,200); assert.equal(body.kind,'quickmatch'); assert.equal(body.job.id,first);
  assert.equal(body.availability,'available'); assert.equal(calls.length,1);
  assert.deepEqual(Object.keys(calls[0].data.student).sort(),['experience','skills']);
});

test('no eligible job or missing profile avoids provider usage',async()=>{
  const {handler,calls}=setup({context:async()=>({student:{...student(),applied:new Set([first,second])},jobs:[job,{...job,id:second}]})});
  assert.equal((await (await handler(request('quickmatch'))).json()).job,null); assert.equal(calls.length,0);
  const empty=setup({context:async()=>({student:{...student(),skills:'',experience:'',windows:[]},jobs:[job]})});
  assert.equal((await (await empty.handler(request('quickmatch'))).json()).needsProfile,true); assert.equal(empty.calls.length,0);
  assert.deepEqual((await (await empty.handler(request('radar'))).json()).items,[]); assert.equal(empty.calls.length,0);
});

test('skip persists through service operation; radar stores and reuses recommendations',async()=>{
  let skipped; const {handler,calls,saved}=setup({skip:async(id,jobId)=>{skipped=[id,jobId]}});
  assert.equal((await handler(request('skip',{jobId:first}))).status,200); assert.deepEqual(skipped,['student-a',first]);
  const radar=await (await handler(request('radar'))).json(); assert.equal(radar.items.length,2); assert.equal(saved.length,2);
  await handler(request('radar')); assert.equal(calls.length,1);
  saved[0].status='dismissed'; const after=await (await handler(request('radar'))).json(); assert.deepEqual(after.items.map(item=>item.job.id),[second]);
});

test('Discovery uses stated experience and live categories without profile write',async()=>{
  const {handler,calls}=setup(); const body=await (await handler(request('discover'))).json();
  assert.equal(body.inferredSkills[0].skill,'Customer service'); assert.equal(body.jobCategories[0].category,'food-beverage');
  assert.deepEqual(calls[0].data.availableCategories,['food-beverage']);
  const noExperience=setup({context:async()=>({student:{...student(),experience:''},jobs:[job]})});
  assert.equal((await (await noExperience.handler(request('discover'))).json()).needsExperience,true);
  assert.equal(noExperience.calls.length,0);
});

test('Discovery can suggest another live category despite a preferred category',async()=>{
  let categories;
  const {handler}=setup({context:async()=>({student:{...student(),preferences:{...student().preferences,preferred_category:'food-beverage'}},jobs:[job,{...job,id:second,category:'retail'}]}),generate:async(_action,_language,data)=>{categories=data.availableCategories;return {inferredSkills:[],jobCategories:[{category:'retail',reasons:['Stated service experience may transfer']}]}}});
  const response=await handler(request('discover'));
  assert.equal(response.status,200); assert.deepEqual(categories,['food-beverage','retail']);
  assert.equal((await response.json()).jobCategories[0].category,'retail');
});

test('unauthorized and missing configuration fail safely before exposing jobs',async()=>{
  const noAuth=setup({authorize:async()=>{throw new AiError('forbidden',403)},context:async()=>{throw Error('must not read')}});
  assert.equal((await noAuth.handler(request('quickmatch'))).status,403);
  const noConfig=setup({generate:async()=>{throw new AiError('notConfigured',503)}});
  assert.deepEqual(await (await noConfig.handler(request('quickmatch'))).json(),{error:'notConfigured'});
  assert.equal((await noConfig.handler(new Request('http://localhost',{method:'POST',body:'{}'}))).status,401);
});

test('invalid model IDs, fabricated percentages and foreign categories are rejected',()=>{
  assert.throws(()=>parseRecommendations({recommendations:[{jobId:second,reasons:['92% match']}]},[first]));
  assert.throws(()=>parseRecommendations({recommendations:[{jobId:first,reasons:['92% match']}]},[first]));
  assert.throws(()=>parseDiscovery({inferredSkills:[],jobCategories:[{category:'not-live',reasons:['Maybe']}]},['food-beverage']));
});

test('database outage returns a safe error without exposing backend details',async()=>{
  const {handler}=setup({context:async()=>{throw new Error('private database connection details')}});
  const response=await handler(request('quickmatch'));
  assert.equal(response.status,503); assert.deepEqual(await response.json(),{error:'unavailable'});
});

test('short experience is handled without inventing categories or skills',async()=>{
  const {handler}=setup({context:async()=>({student:{...student(),experience:'Cafe'},jobs:[job]}),generate:async()=>({inferredSkills:[],jobCategories:[]})});
  const response=await handler(request('discover'));
  assert.deepEqual((await response.json()).jobCategories,[]);
  const invalid=setup({generate:async()=>({inferredSkills:[{skill:'Invented',evidence:'92% likely'}],jobCategories:[]})});
  assert.deepEqual(await (await invalid.handler(request('discover'))).json(),{error:'invalidOutput'});
});

test('empty model recommendation is a real no-match result, never a fabricated job',async()=>{
  const {handler}=setup({generate:async()=>({recommendations:[]})});
  const response=await handler(request('quickmatch'));
  assert.equal(response.status,200); assert.equal((await response.json()).job,null);
});

test('Student recommendation uses Gemini structured JSON server-side',async()=>{
  let providerBody;
  const result=await callAiProvider({key:'test-only',model:'gemini-3.5-flash-lite',action:'recommend',language:'en',data:{jobs:[{jobId:first}]},schema:recommendationsSchema},async(url,init)=>{
    assert.match(url,/gemini-3\.5-flash-lite:generateContent/);
    assert.equal(init.headers['x-goog-api-key'],'test-only');
    providerBody=JSON.parse(init.body);
    return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({recommendations:[{jobId:first,reasons:['Relevant stated experience']}]})}]}}]});
  });
  assert.equal(result.recommendations[0].jobId,first);
  assert.equal(providerBody.generationConfig.responseJsonSchema.properties.recommendations.type,'array');
  assert.ok(!JSON.stringify(providerBody).includes('test-only'));
});
