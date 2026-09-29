import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source=ts.transpileModule(readFileSync(new URL('../src/features/student-ai/panels.tsx',import.meta.url),'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX},
}).outputText;
const job={id:'30000000-0000-4000-8000-000000000001',title:'Cafe helper',location:'Sriracha',working_date:'2026-10-01',shift:'18:00 - 22:00',wage:70,wage_type:'hour'};
function harness(){
  const cells=[];let cursor=0;const calls=[];const exports={};
  vm.runInNewContext(source,{exports,require:name=>{
    if(name==='react/jsx-runtime')return{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props}),Fragment:'Fragment'};
    if(name==='react')return{useState(value){const i=cursor++;if(!(i in cells))cells[i]=value;return[cells[i],next=>{cells[i]=typeof next==='function'?next(cells[i]):next}]},useRef(value){const i=cursor++;if(!(i in cells))cells[i]={current:value};return cells[i]},useCallback:fn=>fn};
    if(name==='expo-router')return{router:{push:()=>{}},useFocusEffect:()=>{}};
    if(name==='react-native')return{ActivityIndicator:'ActivityIndicator',Modal:'Modal',View:'View'};
    if(name==='@/features/employer/ui')return{Button:'Button',Card:'Card',Copy:'Copy',Field:'Field',Notice:'Notice',styles:{}};
    if(name==='@/providers/localization-provider')return{useTranslation:()=>({language:'en',t:key=>key})};
    if(name==='@/features/student/student-service')return{applyForJob:async id=>{calls.push(['apply',id]);return{id:'application'}}};
    if(name==='./service')return{studentAi:async action=>{calls.push([action]);return{kind:'quickmatch',job,reasons:['Relevant experience'],availability:'unknown',needsProfile:false,missing:{availability:true,skills:false}}}};
    throw Error(`Unexpected import ${name}`);
  }});
  function render(){cursor=0;const nodes=[];function visit(node){if(!node||typeof node!=='object')return;if(Array.isArray(node))return node.forEach(visit);nodes.push(node);visit(node.props?.children)}visit(exports.QuickMatchPanel());return nodes}
  return{calls,render,button:label=>render().find(node=>node.type==='Button'&&node.props.label===`studentAi.${label}`)?.props};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
test('QuickMatch Interested requires confirmation before creating the existing application',async()=>{
  const h=harness();h.button('find').onPress();await settle();
  assert.equal(h.calls.filter(call=>call[0]==='apply').length,0);
  h.button('interested').onPress();
  assert.equal(h.render().find(node=>node.type==='Modal').props.visible,true);
  assert.equal(h.calls.filter(call=>call[0]==='apply').length,0);
  h.button('confirmApply').onPress();await settle();
  assert.deepEqual(h.calls.filter(call=>call[0]==='apply'),[['apply',job.id]]);
  assert.equal(h.render().find(node=>node.type==='Modal').props.visible,false);
});
