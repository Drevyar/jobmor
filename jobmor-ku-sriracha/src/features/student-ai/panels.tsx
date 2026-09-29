import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Modal, View } from 'react-native';
import { Button, Card, Copy, Field, Notice, SuccessDialog, styles } from '@/features/employer/ui';
import { useTranslation } from '@/providers/localization-provider';
import { applyForJob } from '@/features/student/student-service';
import { studentAi, updateRadarStatus, getPreferences, savePreferences } from './service';
import type { DiscoveryResult, PreferenceForm, QuickResult, RadarResult } from './service';

const errorCode=(error:unknown)=>error instanceof Error&&'code' in error&&typeof error.code==='string'?error.code:'unavailable';
const Reasons=({items}:{items:string[]})=><>{items.map((reason,i)=><Copy key={i}>• {reason}</Copy>)}</>;

export function QuickMatchPanel({ compact = false }: { compact?: boolean } = {}){
  const {t,language}=useTranslation(),a=(key:string)=>t('studentAi.'+key);
  const [result,setResult]=useState<QuickResult|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[confirm,setConfirm]=useState(false);
  const locked=useRef(false);
  const run=async()=>{if(locked.current)return;locked.current=true;setBusy(true);setError('');setNotice('');setResult(null);
    try{const value=await studentAi('quickmatch',language);if(value.kind==='quickmatch')setResult(value)}catch(e){setError(errorCode(e))}finally{locked.current=false;setBusy(false)}};
  const skip=async()=>{if(locked.current||!result?.job)return;locked.current=true;setBusy(true);setError('');
    try{await studentAi('skip',language,result.job.id);setResult(null)}catch{setError('skipFailed')}finally{locked.current=false;setBusy(false)}};
  const apply=async()=>{if(locked.current||!result?.job)return;locked.current=true;setBusy(true);setError('');
    try{await applyForJob(result.job.id);setConfirm(false);setResult(null);setNotice('applied')}catch(e){setError(e instanceof Error&&'key' in e&&e.key==='duplicate'?'invalidRequest':'unavailable')}finally{locked.current=false;setBusy(false)}};
  return <Card><Copy strong>{a('quick')}</Copy>{!compact&&<Copy>{a('quickHint')}</Copy>}<Button label={busy?a('finding'):a('find')} disabled={busy} onPress={()=>void run()}/>
    {busy&&<ActivityIndicator accessibilityLabel={a('finding')}/>}<Notice text={error?a(error):notice?a(notice):''} error={!!error}/>
    {result&&(result.needsProfile?<Copy>{a('needsProfile')}</Copy>:!result.job?<Copy>{a('noJob')}</Copy>:<>
      <Copy strong>{result.job.title}</Copy><Copy>{result.job.location} · {result.job.working_date} {result.job.shift}</Copy><Copy>{result.job.wage} THB / {result.job.wage_type}</Copy>
      <Copy strong>{a('why')}</Copy><Reasons items={result.reasons}/>{result.missing.availability&&<Copy>{a('missingAvailability')}</Copy>}{result.missing.skills&&<Copy>{a('missingSkills')}</Copy>}
      <View style={styles.row}><Button label={a('skip')} disabled={busy} onPress={()=>void skip()}/><Button label={a('interested')} variant="primary" disabled={busy} onPress={()=>setConfirm(true)}/></View>
    </>)}
    <Modal transparent visible={confirm} animationType="fade" onRequestClose={()=>{if(!busy)setConfirm(false)}}><View style={styles.overlay}><View style={styles.dialog}><Card>
      <Copy strong>{a('confirmTitle')}</Copy><Copy>{a('confirmBody')}</Copy><Notice text={error?a(error):''} error/>
      <Button label={a('viewJob')} disabled={busy} onPress={()=>{setConfirm(false);if(result?.job)router.push({pathname:'/(student)/job-detail',params:{jobId:result.job.id}})}}/>
      <Button label={a('confirmApply')} variant="primary" disabled={busy} onPress={()=>void apply()}/><Button label={t('employerFlow.cancel')} disabled={busy} onPress={()=>setConfirm(false)}/>
    </Card></View></View></Modal>
  </Card>;
}
export function RadarPanel(){
  const {t,language}=useTranslation(),a=(key:string)=>t('studentAi.'+key);
  const [data,setData]=useState<RadarResult|null>(null),[busy,setBusy]=useState(true),[error,setError]=useState('');const sequence=useRef(0);
  const refresh=useCallback(async()=>{const id=++sequence.current;setBusy(true);setError('');try{const result=await studentAi('radar',language);if(id===sequence.current&&result.kind==='radar')setData(result)}catch(e){if(id===sequence.current)setError(errorCode(e))}finally{if(id===sequence.current)setBusy(false)}},[language]);
  useFocusEffect(useCallback(()=>{void refresh();return()=>{sequence.current++}},[refresh]));
  const dismiss=async(jobId:string)=>{try{await updateRadarStatus(jobId,'dismissed');setData(current=>current?{...current,items:current.items.filter(item=>item.job.id!==jobId)}:null)}catch{setError('radarFailed')}};
  const view=async(jobId:string)=>{try{await updateRadarStatus(jobId,'seen');setData(current=>current?{...current,items:current.items.map(item=>item.job.id===jobId?{...item,status:'seen'}:item)}:null)}catch{setError('radarFailed')}router.push({pathname:'/(student)/job-detail',params:{jobId}})};
  return <Card><Copy strong>{a('radar')}</Copy><Copy>{a('radarHint')}</Copy><Button label={a('refresh')} disabled={busy} onPress={()=>void refresh()}/>
    {busy&&<ActivityIndicator accessibilityLabel={a('finding')}/>}<Notice text={error?a(error):''} error/>{data&&!data.items.length&&<Copy>{data.missing.availability&&data.missing.skills?a('needsProfile'):a('noRadar')}</Copy>}
    {data?.items.map(item=><Card key={item.job.id}><Copy strong>{item.job.title}</Copy><Copy>{a(item.status==='seen'?'seen':'new')}</Copy><Copy>{item.job.working_date} {item.job.shift} · {item.job.wage} THB / {item.job.wage_type}</Copy><Reasons items={item.reasons}/>
      <View style={styles.row}><Button label={a('viewJob')} onPress={()=>void view(item.job.id)}/><Button label={a('dismiss')} onPress={()=>void dismiss(item.job.id)}/></View>
    </Card>)}
  </Card>;
}
export function DiscoveryPanel(){
  const {t,language}=useTranslation(),a=(key:string)=>t('studentAi.'+key);
  const [data,setData]=useState<DiscoveryResult|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const run=async()=>{if(busy)return;setBusy(true);setError('');setData(null);try{const result=await studentAi('discover',language);if(result.kind==='discover')setData(result)}catch(e){setError(errorCode(e))}finally{setBusy(false)}};
  return <Card><Copy strong>{a('discovery')}</Copy><Copy>{a('discoveryHint')}</Copy><Button label={busy?a('finding'):a('discover')} disabled={busy} onPress={()=>void run()}/>
    {busy&&<ActivityIndicator accessibilityLabel={a('finding')}/>}<Notice text={error?a(error):''} error/>
    {data?.needsExperience?<Copy>{a('noExperience')}</Copy>:data&&!data.jobCategories.length?<Copy>{a('noCategories')}</Copy>:null}
    {data&&!!data.inferredSkills.length&&<><Copy strong>{a('possibleSkills')}</Copy>{data.inferredSkills.map((item,i)=><Copy key={i}>{item.skill}: {item.evidence}</Copy>)}</>}
    {data&&!!data.jobCategories.length&&<><Copy strong>{a('possibleJobs')}</Copy>{data.jobCategories.map((item,i)=><Card key={`${item.category}-${i}`}><Copy strong>{item.category}</Copy><Reasons items={item.reasons}/><Button label={a('viewJobs')} onPress={()=>router.push({pathname:'/(student)/explore',params:{category:item.category}})}/></Card>)}</>}
  </Card>;
}
const categoryLabels:Record<string,string>={'food-beverage':'food',retail:'retail',hospitality:'hospitality',education:'education',events:'events',office:'office',technology:'technology',logistics:'logistics'};
export function PreferencesPanel(){
  const {t}=useTranslation(),a=(key:string)=>t('studentAi.'+key);
  const [form,setForm]=useState<PreferenceForm|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState(false);
  useFocusEffect(useCallback(()=>{let alive=true;void getPreferences().then(value=>{if(alive)setForm(value)}).catch(e=>{if(alive)setError(errorCode(e))});return()=>{alive=false}},[]));
  const set=(key:keyof PreferenceForm,value:string)=>setForm(current=>current?{...current,[key]:value}:null);
  const save=async()=>{if(!form||busy)return;setBusy(true);setError('');setSaved(false);try{await savePreferences(form);setSaved(true)}catch(e){setError(errorCode(e))}finally{setBusy(false)}};
  return <Card><Copy strong>{a('preferences')}</Copy><Copy>{a('preferenceHint')}</Copy><Notice text={error?a(error):saved?a('saved'):''} error={!!error}/>
    <SuccessDialog visible={saved} message={a('saved')} close={()=>setSaved(false)}/>
    {!form?<Button label={a('retry')} onPress={()=>{setError('');void getPreferences().then(setForm).catch(e=>setError(errorCode(e)))}}/>:<><Copy>{a('category')}</Copy><View style={styles.row}>{['',...Object.keys(categoryLabels)].map(value=><Button key={value||'all'} label={value?t('auth.categories.'+categoryLabels[value]):a('all')} selected={form.preferred_category===value} disabled={busy} onPress={()=>set('preferred_category',value)}/>)}</View>
      <Field label={a('area')} value={form.preferred_area} maxLength={100} onChange={value=>set('preferred_area',value)} disabled={busy}/><Field label={a('minimumWage')} value={form.minimum_wage} numeric onChange={value=>set('minimum_wage',value)} disabled={busy}/>
      <Copy>{a('wageType')}</Copy><View style={styles.row}>{['hour','day','month','job'].map(value=><Button key={value} label={t('employerFlow.'+value)} selected={form.wage_type===value} disabled={busy} onPress={()=>set('wage_type',value)}/>)}</View>
      <Button label={a('save')} variant="primary" onPress={()=>void save()} disabled={busy}/></>}
  </Card>;
}
