import assert from 'node:assert/strict';
import test from 'node:test';
import type { DictionaryResult } from '../packages/contracts/src/index.ts';
import { DictionaryService } from '../backend/src/modules/dictionary/dictionary.service.ts';
import { GoogleTranslationClient } from '../backend/src/modules/dictionary/translation.provider.ts';

function dictionaryResult(): DictionaryResult {
  return {
    term: 'study', language: 'en', pronunciations: [], savedWord: null, suggestions: [], wordFamily: [],
    entries: [{
      id: 'entry-1', partOfSpeech: 'verb', labels: [],
      senses: [
        { id: 'sense-1', order: 1, definitionEn: 'learn carefully', definitionVi: null, examplesEn: [], labels: [] },
        { id: 'sense-2', order: 2, definitionEn: 'look at closely', definitionVi: null, examplesEn: [], labels: [] },
      ],
    }],
    relatedEntries: [{
      id: 'entry-2', partOfSpeech: 'noun', labels: [],
      senses: [{ id: 'sense-3', order: 1, definitionEn: 'learn carefully', definitionVi: null, examplesEn: [], labels: [] }],
    }],
  };
}

test('Google translation adapter sends a server-side batch and returns translations in provider order', async () => {
  let requestedUrl = '';
  let requestedBody: unknown;
  const request: typeof fetch = async (input, init) => {
    requestedUrl = String(input);
    requestedBody = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({ data: { translations: [
      { translatedText: 'học cẩn thận' }, { translatedText: 'xem xét kỹ' },
    ] } }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  const client = new GoogleTranslationClient('translation-test-key', request);
  const translated = await client.translateEnglishToVietnamese(['learn carefully', 'look at closely']);

  assert.deepEqual(translated, ['học cẩn thận', 'xem xét kỹ']);
  assert.equal(new URL(requestedUrl).origin, 'https://translation.googleapis.com');
  assert.equal(new URL(requestedUrl).searchParams.get('key'), 'translation-test-key');
  assert.deepEqual(requestedBody, {
    q: ['learn carefully', 'look at closely'], source: 'en', target: 'vi', format: 'text',
  });
  assert.equal(JSON.stringify(translated).includes('translation-test-key'), false);
});

test('dictionary translation de-duplicates definitions and does not mutate the English provider result', async () => {
  const source = dictionaryResult();
  let requested: string[] = [];
  const service = new DictionaryService(
    { lookup: async () => source },
    { byTerm: async () => null },
    { isConfigured: () => true, translateEnglishToVietnamese: async texts => {
      requested = texts;
      return ['học cẩn thận', 'xem xét kỹ'];
    } },
  );

  const translated = await service.lookup('study', undefined, 'vi');
  assert.deepEqual(requested, ['learn carefully', 'look at closely']);
  assert.equal(translated.entries[0].senses[0].definitionVi, 'học cẩn thận');
  assert.equal(translated.entries[0].senses[1].definitionVi, 'xem xét kỹ');
  assert.equal(translated.relatedEntries[0].senses[0].definitionVi, 'học cẩn thận');
  assert.equal(source.entries[0].senses[0].definitionVi, null);
});

test('unconfigured translation fails before making a dictionary provider request', async () => {
  let dictionaryRequests = 0;
  const service = new DictionaryService(
    { lookup: async () => { dictionaryRequests++; return dictionaryResult(); } },
    { byTerm: async () => null },
    new GoogleTranslationClient(''),
  );
  await assert.rejects(service.lookup('study', undefined, 'vi'), { code: 'TRANSLATION_NOT_CONFIGURED' });
  assert.equal(dictionaryRequests, 0);
});

test('translation errors distinguish missing configuration, rate limits and malformed responses', async () => {
  await assert.rejects(new GoogleTranslationClient('').translateEnglishToVietnamese(['study']), {
    code: 'TRANSLATION_NOT_CONFIGURED',
  });
  const limited: typeof fetch = async () => new Response('', { status: 429 });
  await assert.rejects(new GoogleTranslationClient('key', limited).translateEnglishToVietnamese(['study']), {
    code: 'TRANSLATION_RATE_LIMITED',
  });
  const malformed: typeof fetch = async () => new Response(JSON.stringify({ data: { translations: [] } }));
  await assert.rejects(new GoogleTranslationClient('key', malformed).translateEnglishToVietnamese(['study']), {
    code: 'TRANSLATION_FORMAT_UNSUPPORTED',
  });
});
