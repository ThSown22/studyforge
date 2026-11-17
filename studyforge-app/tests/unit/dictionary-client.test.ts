import test from 'node:test';
import assert from 'node:assert/strict';
import { MerriamClient } from '../../backend/src/modules/dictionary/merriam.client.ts';
import { DictionaryService } from '../../backend/src/modules/dictionary/dictionary.service.ts';

const response = [{ meta: { id: 'study' }, hwi: { hw: 'study' }, fl: 'verb',
  def: [{ sseq: [[['sense', { dt: [['text', '{bc}learn carefully']] }]]] }] }];

test('dictionary lookup uses server key, preserves normalized output and checks saved state', async () => {
  let requestedUrl = '';
  const request: typeof fetch = async input => {
    requestedUrl = String(input);
    return new Response(JSON.stringify(response), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  const service = new DictionaryService(new MerriamClient('test-only-key', request), {
    byTerm: async (userId, term) => {
      assert.equal(userId, 'user-one'); assert.equal(term, 'study'); return null;
    },
  });
  const result = await service.lookup('  STUDY  ', 'user-one');
  assert.equal(result.entries[0].senses[0].definitionEn, 'learn carefully');
  assert.equal(new URL(requestedUrl).pathname, '/api/v3/references/learners/json/study');
  assert.equal(new URL(requestedUrl).searchParams.get('key'), 'test-only-key');
  assert.equal(JSON.stringify(result).includes('test-only-key'), false);
});

test('dictionary errors distinguish missing configuration, provider limit and unsupported content', async () => {
  await assert.rejects(new MerriamClient('').lookup('study'), { code: 'DICTIONARY_NOT_CONFIGURED' });
  const limited: typeof fetch = async () => new Response('', { status: 429 });
  await assert.rejects(new MerriamClient('test-only-key', limited).lookup('study'), { code: 'DICTIONARY_RATE_LIMITED' });
  const broken: typeof fetch = async () => new Response(JSON.stringify([{ meta: { id: 'study' }, hwi: { hw: 'study' },
    def: [{ sseq: [[['sense', { dt: [['unknown', 'meaning']] }]]] }] }]));
  await assert.rejects(new MerriamClient('test-only-key', broken).lookup('study'), { code: 'DICTIONARY_FORMAT_UNSUPPORTED' });
});
