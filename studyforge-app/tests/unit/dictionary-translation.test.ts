import assert from 'node:assert/strict';
import test from 'node:test';
import type { DictionaryResult } from '@studyforge/contracts';
import { DictionaryService } from '../../backend/src/modules/dictionary/dictionary.service.ts';
import { DeepLTranslationClient } from '../../backend/src/modules/dictionary/translation.provider.ts';

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

test('DeepL translation adapter sends a protected EN to VI batch in provider order', async () => {
  let requestedUrl = '';
  let requestedAuthorization = '';
  let requestedBody: unknown;
  const request: typeof fetch = async (input, init) => {
    requestedUrl = String(input);
    requestedAuthorization = String(new Headers(init?.headers).get('authorization'));
    requestedBody = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({ translations: [
      { text: 'học cẩn thận' }, { text: 'xem xét kỹ' },
    ] }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  const client = new DeepLTranslationClient('deepl-test-key', request);
  const translated = await client.translateEnglishToVietnamese(['learn carefully', 'look at closely']);

  assert.equal(requestedUrl, 'https://api-free.deepl.com/v2/translate');
  assert.equal(requestedAuthorization, 'DeepL-Auth-Key deepl-test-key');
  assert.deepEqual(requestedBody, {
    text: ['learn carefully', 'look at closely'], source_lang: 'EN', target_lang: 'VI',
  });
  assert.deepEqual(translated, ['học cẩn thận', 'xem xét kỹ']);
  assert.equal(JSON.stringify(translated).includes('deepl-test-key'), false);
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
    new DeepLTranslationClient(''),
  );
  await assert.rejects(service.lookup('study', undefined, 'vi'), { code: 'TRANSLATION_NOT_CONFIGURED' });
  assert.equal(dictionaryRequests, 0);
});

test('DeepL translation errors distinguish missing configuration, invalid keys, rate limits, exhausted quota and malformed responses', async () => {
  await assert.rejects(new DeepLTranslationClient('').translateEnglishToVietnamese(['study']), {
    code: 'TRANSLATION_NOT_CONFIGURED',
  });
  const invalid: typeof fetch = async () => new Response('', { status: 403 });
  await assert.rejects(new DeepLTranslationClient('key', invalid).translateEnglishToVietnamese(['study']), {
    code: 'TRANSLATION_NOT_CONFIGURED',
  });
  const limited: typeof fetch = async () => new Response('', { status: 429 });
  await assert.rejects(new DeepLTranslationClient('key', limited).translateEnglishToVietnamese(['study']), {
    code: 'TRANSLATION_RATE_LIMITED',
  });
  const exhausted: typeof fetch = async () => new Response('', { status: 456 });
  await assert.rejects(new DeepLTranslationClient('key', exhausted).translateEnglishToVietnamese(['study']), {
    code: 'TRANSLATION_QUOTA_EXCEEDED',
  });
  const malformed: typeof fetch = async () => new Response(JSON.stringify({ translations: [] }));
  await assert.rejects(new DeepLTranslationClient('key', malformed).translateEnglishToVietnamese(['study']), {
    code: 'TRANSLATION_FORMAT_UNSUPPORTED',
  });
});
