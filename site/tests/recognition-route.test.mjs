import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { scryptSync } from 'node:crypto';
import * as crypto from 'node:crypto';
import * as auth from '../lib/recognition-auth.ts';
import * as validation from '../lib/recognition-result.ts';

const salt='b'.repeat(32);
process.env.RECOGNITION_PASSWORD_HASH=`scrypt1:${salt}:${scryptSync('synthetic-route-password',salt,32).toString('hex')}`;
process.env.SHELFDATA_HF_TOKEN='hf_SYNTHETIC_NOT_A_REAL_TOKEN';
const code=ts.transpileModule(fs.readFileSync(new URL('../app/api/recognition/route.ts',import.meta.url),'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText;
function png(){const p=Buffer.alloc(33);Buffer.from([137,80,78,71,13,10,26,10]).copy(p);p.writeUInt32BE(13,8);p.write('IHDR',12);p.writeUInt32BE(10,16);p.writeUInt32BE(10,20);return p;}
function request(consent='1') {return new Request('https://example.com/api/recognition',{
  method:'POST',headers:{Origin:'https://example.com','Content-Type':'image/png','X-Synthetic-Consent':consent},body:png()
});}
function setup(connect,{signedIn=true}={}) {
  const timers=new Map();let id=0;const loadedModule={exports:{}};
  const require=name=>{
    if(name==='next/headers')return {cookies:async()=>({get:()=>signedIn?{value:auth.issueRecognitionSession()}:undefined})};
    if(name==='node:crypto')return crypto;
    if(name==='@gradio/client')return {Client:{connect},handle_file:value=>value};
    if(name==='@/lib/recognition-auth')return auth;
    if(name==='@/lib/recognition-result')return validation;
    throw new Error('Unexpected import '+name);
  };
  vm.runInNewContext('(function(require,module,exports){'+code+'})',{
    Buffer,Response,ReadableStream,TextEncoder,File,Uint8Array,process,Promise,
    setTimeout:callback=>{timers.set(++id,callback);return id;},clearTimeout:key=>timers.delete(key),
  })(require,loadedModule,loadedModule.exports);
  return {post:loadedModule.exports.POST,timers};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));

test('recognition route authenticates and checks consent before cloud connection',async()=>{
  let connected=0;const connect=async()=>{connected++;throw new Error('must not connect');};
  assert.equal((await setup(connect,{signedIn:false}).post(request())).status,401);
  assert.equal((await setup(connect).post(request('0'))).status,422);
  assert.equal(connected,0);
});

test('consumer cancel releases the slot even if private Space connection is still pending',async()=>{
  const resolvers=[];let closed=0,submitted=0;
  const {post,timers}=setup(()=>new Promise(resolve=>resolvers.push(resolve)));
  const first=await post(request());const reader=first.body.getReader();await reader.read();await reader.cancel();
  assert.equal(timers.size,0);
  const second=await post(request());assert.equal(second.status,200);await second.body.cancel();
  for(const resolve of resolvers)resolve({close(){closed++;},submit(){submitted++;throw new Error('late submit');}});
  await tick();assert.equal(submitted,0);assert.equal(closed,2);assert.equal(timers.size,0);
});

test('deadline releases the slot and a late connection never starts cloud processing',async()=>{
  let resolve;let submitted=0;
  const {post,timers}=setup(()=>new Promise(r=>{resolve=r;}));
  const first=await post(request());const reader=first.body.getReader();await reader.read();
  const expire=[...timers.values()][0];assert.doesNotThrow(()=>expire());
  const line=new TextDecoder().decode((await reader.read()).value);assert.match(line,/"type":"error"/);
  const previous=resolve;
  const second=await post(request());assert.equal(second.status,200);await second.body.cancel();
  previous({close(){},submit(){submitted++;}});resolve({close(){},submit(){submitted++;}});
  await tick();assert.equal(submitted,0);
});

test('only allowlisted checked cloud result fields reach browser output',async()=>{
  const sourceHash=crypto.createHash('sha256').update(png()).digest('hex');
  let closed=0;
  const connect=async()=>({close(){closed++;},submit(endpoint,args){
    assert.equal(endpoint,'/cloud_ocr');assert.equal(args[0].name,'input.png');
    return {
    cancel:async()=>{},async *[Symbol.asyncIterator](){yield {type:'data',data:[{
      text:'Synthetic OCR',source_sha256:sourceHash,model:validation.recognitionModel,revision:validation.recognitionRevision,
      gpu_call_seconds:1,sku_confirmed:false,synthetic_only:true,private_url:'do-not-forward',token:'do-not-forward'
    }]};yield {type:'status',stage:'complete'};}
  };}});
  const response=await setup(connect).post(request());const text=await response.text();
  assert.match(text,/Synthetic OCR/);assert.doesNotMatch(text,/do-not-forward|private_url|"token"/);assert.equal(closed,1);
  const events=text.trim().split('\n').map(line=>JSON.parse(line));
  assert.equal(events.at(-1).type,'result');
});
