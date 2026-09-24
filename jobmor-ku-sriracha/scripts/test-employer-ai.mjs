import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createAiHandler } from '../supabase/functions/_shared/ai-handler.ts';
import { AiError, bangkokWindow, parseAiRequest, parseInsight, parseReplacementExplanations } from '../supabase/functions/_shared/ai-contracts.ts';
import { availabilityStatus, eligibleReplacements, jobWindow, providerContext } from '../supabase/functions/_shared/ai-matching.ts';
import { callAiProvider } from '../supabase/functions/_shared/ai-provider.ts';
const jobId = '20000000-0000-4000-8000-000000000001';
const applicationId = '20000000-0000-4000-8000-000000000002';
const shift = bangkokWindow('2026-10-01','18:00','22:00');
const now = Date.parse('2026-10-01T02:00:00Z');
const job = { id: jobId, title: 'Restaurant assistant', description: 'Serve guests', requirements: 'Customer service; POS', working_date: '2026-10-01', shift: '18:00 - 22:00', status: 'active' };
const candidate = { id: 'student-a', applicationId, name: 'Private Name', verified: true, status: 'pending',
  skills: 'Customer service', experience: 'Restaurant service for one year', availability: [shift], commitments: [] };
const insight = { summary: 'Restaurant service experience is stated.', strengths: ['Customer service experience is recorded.'], gaps: ['POS experience is not mentioned.'], interviewQuestions: ['Have you used a POS?'] };
function setup(overrides = {}) {
  const calls = [];
  const deps = { configured: true, now: () => now,
    authorize: async () => ({ employerId: 'employer', job }),
    candidates: async () => [candidate], consumeBudget: async () => true,
    generate: async (request, data) => {
      calls.push(data);
      return request.action === 'candidate-insight' ? insight : { candidates: data.candidates.map(c => ({ candidateId: c.candidateId, reasons: ['Work skills may be relevant.'], warnings: ['Confirm availability before hiring.'] })) };
    }, ...overrides };
  return { handler: createAiHandler(deps), calls };
}
function request(action = 'candidate-insight', extra = {}) {
  return new Request('http://localhost/employer-ai', { method: 'POST', headers: { Authorization: 'Bearer test-auth-token-long-enough' },
    body: JSON.stringify({ action, jobId, applicationId, language: 'en', ...(action === 'emergency-replacement' ? { shift } : {}), ...extra }) });
}
test('aligned applicant: structured insight, no identity/contact sent to provider', async () => {
  const { handler, calls } = setup();
  const response = await handler(request()); assert.equal(response.status, 200);
  const body = await response.json(); assert.equal(body.availability, 'available'); assert.deepEqual(body.insight, insight);
  assert.equal(calls.length, 1); assert.ok(!JSON.stringify(calls).includes('Private Name'));
  assert.ok(!JSON.stringify(calls).includes(applicationId)); assert.equal(calls[0].candidate.candidateId, 'candidate-1');
});
test('missing experience stays empty evidence; availability missing is unknown', async () => {
  const { handler, calls } = setup({ candidates: async () => [{ ...candidate, skills: '', experience: '', availability: [] }] });
  const response = await handler(request()); assert.equal(response.status, 200);
  assert.equal((await response.json()).availability, 'unknown');
  assert.equal(calls[0].candidate.experience, ''); assert.equal(calls[0].candidate.skills, '');
});
test('applicant availability conflict is computed before AI', async () => {
  const { handler, calls } = setup({ candidates: async () => [{ ...candidate, availability: [bangkokWindow('2026-10-01','08:00','12:00')] }] });
  const response = await handler(request()); assert.equal((await response.json()).availability, 'conflict');
  assert.equal(calls[0].candidate.availability, 'conflict');
});
test('replacement: multiple eligible applicants are returned in application order', async () => {
  const { handler } = setup({ candidates: async () => [candidate, { ...candidate, id: 'student-b', applicationId: 'application-b', name: 'B' }] });
  const response = await handler(request('emergency-replacement'));
  assert.equal(response.status, 200); const body = await response.json();
  assert.deepEqual(body.candidates.map(c => c.candidateId), ['student-a','student-b']);
});
test('replacement: empty pool does not call AI or consume budget, even without configuration', async () => {
  const { handler, calls } = setup({ configured: false, candidates: async () => [], consumeBudget: async () => { throw new Error('Should not charge'); } });
  const response = await handler(request('emergency-replacement'));
  assert.equal(response.status, 200); assert.deepEqual((await response.json()).candidates, []); assert.equal(calls.length, 0);
});
test('replacement excludes overlaps, unknown shifts, missing availability and nonpending applicants', () => {
  const selection = eligibleReplacements([
    candidate,
    { ...candidate, id: 'overlap', commitments: [{ jobId: 'other', workingDate: '2026-10-01', shift: '20:00-23:00' }] },
    { ...candidate, id: 'unknown', commitments: [{ jobId: 'other', workingDate: '2026-10-01', shift: 'Evening' }] },
    { ...candidate, id: 'missing', availability: [] },
    { ...candidate, id: 'partial', availability: [bangkokWindow('2026-10-01','18:00','20:00')] },
    { ...candidate, id: 'accepted', status: 'accepted' },
    { ...candidate, id: 'rejected', status: 'rejected' },
    { ...candidate, id: 'suspended', verified: false },
  ], shift, jobId);
  assert.deepEqual(selection.eligible.map(c => c.id), ['student-a']);
  assert.deepEqual(selection.excluded, { missingAvailability: 1, unavailable: 1, overlapping: 1, unknownCommitment: 1 });
});
test('overnight work and boundary touching are handled deterministically', () => {
  assert.equal(jobWindow({ working_date: '2026-10-01', shift: '22:00-02:00' }).endsAt, '2026-10-01T19:00:00.000Z');
  assert.equal(availabilityStatus({ ...candidate, commitments: [{ jobId: 'other', workingDate: '2026-10-01', shift: '22:00-23:00' }] }, shift, jobId), 'available');
  assert.equal(bangkokWindow('2026-02-30','18:00','22:00'), null);
  assert.equal(bangkokWindow('2026-10-01','25:00','22:00'), null);
  assert.equal(availabilityStatus(candidate, null, jobId), 'unknown');
});
test('adjacent windows cover the shift, but an availability gap does not', () => {
  const windows = [bangkokWindow('2026-10-01','18:00','20:00'), bangkokWindow('2026-10-01','20:00','22:00')];
  assert.equal(availabilityStatus({ ...candidate, availability: windows }, shift, jobId), 'available');
  windows[1] = bangkokWindow('2026-10-01','20:01','22:00');
  assert.equal(availabilityStatus({ ...candidate, availability: windows }, shift, jobId), 'conflict');
});
test('authorization failure never reads candidates or calls provider', async () => {
  for (const status of [401,403,404]) {
    const { handler, calls } = setup({ authorize: async () => { throw new AiError('forbidden', status); },
      candidates: async () => { throw new Error('Must not read'); } });
    assert.equal((await handler(request())).status, status); assert.equal(calls.length, 0);
  }
  const { handler } = setup(); assert.equal((await handler(new Request('http://localhost', { method: 'POST', body: '{}' }))).status, 401);
});
test('missing AI config gives safe 503 and no fabricated insight', async () => {
  const { handler, calls } = setup({ configured: false }); const response = await handler(request());
  assert.equal(response.status, 503); assert.deepEqual(await response.json(), { error: 'notConfigured' }); assert.equal(calls.length, 0);
});
test('demo IDs, malformed requests and expired shifts are rejected', () => {
  assert.throws(() => parseAiRequest({ action: 'candidate-insight', jobId: 'demo-job', applicationId, language: 'en' }));
  assert.throws(() => parseAiRequest({ action: 'emergency-replacement', jobId, shift, language: 'en' }, now + 2 * 86400000));
});
test('model cannot inject IDs, omit candidates, return scores or extra fields', () => {
  assert.throws(() => parseInsight({ ...insight, score: 92 }));
  assert.throws(() => parseInsight({ ...insight, summary: '92% suitable' }));
  assert.throws(() => parseReplacementExplanations({ candidates: [{ candidateId: 'foreign', reasons: ['x'], warnings: [] }] }, ['candidate-1']));
  assert.throws(() => parseReplacementExplanations({ candidates: [] }, ['candidate-1']));
  assert.throws(() => parseReplacementExplanations({ candidates: [{ candidateId: 'candidate-1', reasons: ['x'], warnings: [], score: 1 }] }, ['candidate-1']));
});
test('rate limiter denies before provider call', async () => {
  const { handler, calls } = setup({ consumeBudget: async () => false }); assert.equal((await handler(request())).status, 429); assert.equal(calls.length, 0);
});
test('context uses a strict allowlist even when source contains sensitive attributes', () => {
  const context = providerContext(job, { ...candidate, gender: 'sensitive', email: 'private@example.com', health: 'sensitive' }, 'available', 'candidate-1');
  assert.deepEqual(Object.keys(context).sort(), ['availability','candidateId','experience','job','skills']);
  assert.ok(!JSON.stringify(context).includes('private@example.com'));
});
const geminiResponse = value => ({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(value) }] } }] });
const providerOptions = { key: 'test-only', model: 'gemini-2.5-flash', action: 'candidate-insight', language: 'en', data: {} };
test('Gemini uses server header authentication, structured JSON and bounded timeout', async () => {
  const options = providerOptions;
  let body;
  const result = await callAiProvider(options, async (url, init) => {
    assert.equal(url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent');
    assert.ok(!url.includes(options.key));
    assert.equal(init.headers['x-goog-api-key'], options.key);
    assert.ok(init.signal instanceof AbortSignal);
    body = JSON.parse(init.body);
    assert.ok(!init.body.includes(options.key));
    return Response.json(geminiResponse(insight));
  });
  assert.deepEqual(result, insight);
  assert.equal(body.generationConfig.responseMimeType, 'application/json');
  assert.equal(body.generationConfig.responseJsonSchema.additionalProperties, false);
  assert.equal(body.generationConfig.candidateCount, 1);
  assert.match(body.systemInstruction.parts[0].text, /employer alone makes hiring decisions/);
  assert.deepEqual(JSON.parse(body.contents[0].parts[0].text), {});
  await assert.rejects(callAiProvider({ ...options, key: undefined }), /notConfigured/);
  await assert.rejects(callAiProvider(options, async () => Response.json({}, { status: 429 })), /rateLimited/);
  await assert.rejects(callAiProvider(options, async () => { throw new Error('secret network detail'); }), /providerUnavailable/);
  await assert.rejects(callAiProvider(options, async () => Response.json({ promptFeedback: { blockReason: 'SAFETY' } })), /refused/);
});
test('Gemini rejects empty, malformed, truncated and blocked output safely', async () => {
  for (const payload of [{}, null, { candidates: [] },
    { candidates: [{ finishReason: 'STOP', content: { parts: [] } }] },
    { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: '{invalid' }] } }] },
    { candidates: [{ ...geminiResponse(insight).candidates[0], finishReason: 'MAX_TOKENS' }] },
    { candidates: [geminiResponse(insight).candidates[0], geminiResponse(insight).candidates[0]] },
  ]) await assert.rejects(callAiProvider(providerOptions, async () => Response.json(payload)), /invalidOutput/);
  await assert.rejects(callAiProvider(providerOptions, async () => new Response('not json')), /invalidOutput/);
  await assert.rejects(callAiProvider(providerOptions, async () => Response.json({ candidates: [{ finishReason: 'SAFETY' }] })), /refused/);
  for (const status of [400,401,403,500,503]) {
    await assert.rejects(callAiProvider(providerOptions, async () => Response.json({ error: 'secret upstream detail' }, { status })), /providerUnavailable/);
  }
  await assert.rejects(callAiProvider(providerOptions, async () => { throw new DOMException('secret', 'TimeoutError'); }), /providerUnavailable/);
});
test('Gemini thought parts are not interpreted as result JSON', async () => {
  const payload = geminiResponse(insight);
  payload.candidates[0].content.parts.unshift({ thought: true, text: 'Internal reasoning' });
  assert.deepEqual(await callAiProvider(providerOptions, async () => Response.json(payload)), insight);
});
test('both handler flows preserve frontend contracts through Gemini adapter', async () => {
  for (const action of ['candidate-insight', 'emergency-replacement']) {
    const { handler } = setup({ generate: (input, data) => callAiProvider({ ...providerOptions, action: input.action, language: 'th', data }, async (_url, init) => {
      const body = JSON.parse(init.body);
      assert.match(body.systemInstruction.parts[0].text, /Thai/);
      const inputData = JSON.parse(body.contents[0].parts[0].text);
      const output = action === 'candidate-insight' ? insight : { candidates: inputData.candidates.map(c => ({ candidateId: c.candidateId, reasons: ['Customer service skill stated.'], warnings: [] })) };
      assert.ok(body.generationConfig.responseJsonSchema.properties[action === 'candidate-insight' ? 'summary' : 'candidates']);
      return Response.json(geminiResponse(output));
    }) });
    const response = await handler(request(action));
    assert.equal(response.status, 200);
    const body = await response.json(); assert.equal(body.kind, action);
    if (action === 'candidate-insight') assert.deepEqual(body.insight, insight);
    else assert.equal(body.candidates[0].candidateId, candidate.id);
  }
});
test('invalid Gemini structure/foreign candidate IDs never reach frontend', async () => {
  for (const action of ['candidate-insight', 'emergency-replacement']) {
    const { handler } = setup({ generate: input => callAiProvider({ ...providerOptions, action: input.action }, async () => Response.json(geminiResponse(
      action === 'candidate-insight' ? { ...insight, score: 90 } : { candidates: [{ candidateId: 'foreign', reasons: ['x'], warnings: [] }] }
    ))) });
    const response = await handler(request(action)); assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), { error: 'invalidOutput' });
  }
});
test('missing applicant returns notFound without calling Gemini', async () => {
  const { handler, calls } = setup({ candidates: async () => [] });
  const response = await handler(request()); assert.equal(response.status, 404); assert.equal(calls.length, 0);
});
test('provider diagnostics log only fixed labels and status, never upstream secrets', async () => {
  const original = console.warn; const logs = [];
  console.warn = (...args) => logs.push(args);
  try {
    const cases = [
      [{ message: 'secret key reported as leaked' }, 'key_blocked'],
      [{ message: 'secret model not found' }, 'model_unavailable'],
      [{ message: 'secret invalid JSON payload' }, 'request_schema'],
      [{ message: 'secret', details: [{ reason: 'API_KEY_INVALID', metadata: { key: 'secret' } }] }, 'API_KEY_INVALID'],
      [{ message: 'secret', details: [{ reason: 'secret' }] }, 'unknown'],
    ];
    for (const [error, label] of cases) {
      await assert.rejects(callAiProvider(providerOptions, async () => Response.json({ error }, { status: 400 })), /providerUnavailable/);
      assert.deepEqual(logs.at(-1), ['employer-ai provider http', 400, label]);
    }
    assert.ok(!JSON.stringify(logs).includes('secret'));
  } finally { console.warn = original; }
});
