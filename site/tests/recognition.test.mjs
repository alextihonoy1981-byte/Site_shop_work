import test from 'node:test';
import assert from 'node:assert/strict';
import { scryptSync } from 'node:crypto';
import { passwordMatches, recognitionConfigured, issueRecognitionSession, recognitionSessionValid,
  sameRecognitionOrigin, loginLimited, boundedBody } from '../lib/recognition-auth.ts';
import { pngWithinLimits, validCloudResult, recognitionCsv, recognitionModel, recognitionRevision } from '../lib/recognition-result.ts';

const salt = 'a'.repeat(32);
process.env.RECOGNITION_PASSWORD_HASH = `scrypt1:${salt}:${scryptSync('synthetic-only-password',salt,32).toString('hex')}`;

test('recognition rejects missing/malformed server configuration and wrong password', () => {
  assert.equal(recognitionConfigured(), true);
  assert.equal(passwordMatches('synthetic-only-password'), true);
  for (const value of ['', 'wrong', null, 123, 'a'.repeat(257)]) assert.equal(passwordMatches(value), false);
  const saved = process.env.RECOGNITION_PASSWORD_HASH;
  for (const value of ['', 'malformed']) {
    process.env.RECOGNITION_PASSWORD_HASH = value;
    assert.equal(recognitionConfigured(), false);
    assert.equal(passwordMatches('synthetic-only-password'), false);
    assert.equal(recognitionSessionValid('anything'), false);
  }
  process.env.RECOGNITION_PASSWORD_HASH = saved;
});

test('recognition sessions reject tampering, expiry, garbage and password rotation', () => {
  const now = Date.now(); const cookie = issueRecognitionSession(now);
  assert.equal(recognitionSessionValid(cookie,now), true);
  assert.equal(recognitionSessionValid(cookie,now+7_201_000), false);
  assert.equal(recognitionSessionValid(issueRecognitionSession(now+10000),now), false);
  for (const value of [undefined, '', cookie+'x', cookie+'.extra', 'x'.repeat(513), cookie.replace('.', 'x.')]) assert.equal(recognitionSessionValid(value,now), false);
  const saved = process.env.RECOGNITION_PASSWORD_HASH;
  process.env.RECOGNITION_PASSWORD_HASH = `scrypt1:${salt}:${'b'.repeat(64)}`;
  assert.equal(recognitionSessionValid(cookie,now), false);
  process.env.RECOGNITION_PASSWORD_HASH = saved;
  assert.notEqual(issueRecognitionSession(now),cookie);
});

test('recognition rejects cross-origin, cross-site and missing-origin mutations', () => {
  const req = (headers) => new Request('https://example.com/api/recognition', {method:'POST',headers});
  assert.equal(sameRecognitionOrigin(req({Origin:'https://example.com'})), true);
  assert.equal(sameRecognitionOrigin(new Request('http://localhost:3000/api/recognition',{
    method:'POST',headers:{Host:'127.0.0.1:3000',Origin:'http://127.0.0.1:3000'}
  })),true);
  assert.equal(sameRecognitionOrigin(req({Origin:'https://example.com',Host:'evil.test'})),false);
  for (const headers of [{},{Origin:'https://evil.test'},{Origin:'null'}, {Origin:'https://example.com','Sec-Fetch-Site':'cross-site'}]) assert.equal(sameRecognitionOrigin(req(headers)),false);
});

test('recognition login attempts are bounded per instance/key and expire', () => {
  const key = 'synthetic-login'; const now = Date.now();
  for (let i=0;i<5;i++) assert.equal(loginLimited(key,now),false);
  assert.equal(loginLimited(key,now),true);
  assert.equal(loginLimited(key,now+600001),false);
});

test('recognition body limits count actual bytes, not only declared length', async () => {
  const req = (body, headers={}) => new Request('https://example.com',{method:'POST',body,headers});
  assert.equal((await boundedBody(req('abc'),3)).toString(),'abc');
  await assert.rejects(boundedBody(req('four'),3),/body_limit/);
  await assert.rejects(boundedBody(req('x',{'Content-Length':'50'}),3),/body_limit/);
  await assert.rejects(boundedBody(req('x',{'Content-Length':'-1'}),3),/body_limit/);
});

test('PNG header rejects unsupported shape and byte limits before any cloud upload', () => {
  const png = Buffer.alloc(33); Buffer.from([137,80,78,71,13,10,26,10]).copy(png);
  png.writeUInt32BE(13,8); png.write('IHDR',12); png.writeUInt32BE(1000,16); png.writeUInt32BE(450,20);
  assert.equal(pngWithinLimits(png),true); // Full image verification occurs in the private Space.
  const large=Buffer.from(png); large.writeUInt32BE(1801,16); assert.equal(pngWithinLimits(large),false);
  const zero=Buffer.from(png); zero.writeUInt32BE(0,20); assert.equal(pngWithinLimits(zero),false);
  assert.equal(pngWithinLimits(Buffer.alloc(3*1024*1024+1)),false);
  assert.equal(pngWithinLimits(Buffer.from('not a PNG')),false);
});

test('cloud result requires matching image hash, pinned model and unconfirmed output', () => {
  const hash='a'.repeat(64);
  const result={text:'Synthetic text',source_sha256:hash,model:recognitionModel,revision:recognitionRevision,
    gpu_call_seconds:1.4,sku_confirmed:false,synthetic_only:true};
  assert.equal(validCloudResult(result,hash),true);
  for (const [key,value] of [['source_sha256','b'.repeat(64)],['model','unknown'],['revision','main'],['text',''],['text','x'.repeat(16001)],['gpu_call_seconds',NaN],['gpu_call_seconds',Infinity],['gpu_call_seconds',true],['sku_confirmed',true],['synthetic_only',false]]) {
    assert.equal(validCloudResult({...result,[key]:value},hash),false,key);
  }
});

test('OCR and filenames cannot become Excel formulas on CSV export', () => {
  const text=recognitionCsv('=WEBSERVICE("test")',' +1+1\n"quoted"');
  assert.ok(text.startsWith('\uFEFF'));
  assert.ok(text.includes('"\'=WEBSERVICE(""test"")"'));
  assert.ok(text.includes('"\' +1+1\n""quoted"""'));
});
