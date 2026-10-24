import test from 'node:test';
import assert from 'node:assert/strict';
import { dictionaryText, parseMerriamLearners } from '../backend/src/modules/dictionary/merriam.parser.ts';

const sense = (text: string, example: string) => ['sense', { dt: [['text', `{bc}${text}`], ['vis', [{ t: example }]]] }];

test('all entries, nested senses and examples remain in provider order', () => {
  const response = parseMerriamLearners('migrate', [
    { meta: { id: 'migrate:1' }, hwi: { hw: 'mi*grate', prs: [{ ipa: 'ˈmaɪˌgreɪt', sound: { audio: 'migrate01' } }] }, fl: 'verb',
      def: [{ sseq: [[sense('move to a new place', 'People {wi}migrate{/wi}.'), sense('travel seasonally', 'Birds migrate.')]] }],
      uros: [{ ure: 'mi*gra*tion', fl: 'noun' }, { ure: 'mi*gra*tion*al', fl: 'adjective' }],
      dros: [{ drp: 'migrate to', def: [{ sseq: [[sense('move into a new system', 'They migrate to a new system.')]] }] }] },
    { meta: { id: 'migrate:2' }, hwi: { hw: 'mi*grate' }, fl: 'verb',
      def: [{ sseq: [[sense('move from one environment to another', 'Data can migrate.')]] }] },
  ]);
  assert.equal(response.entries.length, 2);
  assert.deepEqual(response.entries.map(entry => entry.senses.length), [2, 1]);
  assert.deepEqual(response.entries[0].senses[0].examplesEn, ['People migrate.']);
  assert.deepEqual(response.wordFamily, [
    { term: 'migration', partOfSpeech: 'noun' },
    { term: 'migrational', partOfSpeech: 'adjective' },
  ]);
  assert.equal(response.pronunciations[0].audioUrl, 'https://media.merriam-webster.com/audio/prons/en/us/mp3/m/migrate01.mp3');
  assert.equal(response.relatedEntries[0].headword, 'migrate to');
  assert.equal(response.relatedEntries[0].senses.length, 1);
  assert.equal(response.entries[0].partOfSpeech, 'verb');
  assert.equal(response.entries[1].partOfSpeech, 'verb');
});

test('parenthesized, binding and divided senses are retained', () => {
  const response = parseMerriamLearners('test', [{ meta: { id: 'test' }, hwi: { hw: 'test' }, fl: 'noun',
    def: [{ sseq: [[['bs', { sense: { dt: [['text', '{bc}main idea']] } }],
      ['pseq', [sense('detail one', 'One.'), sense('detail two', 'Two.')]],
      ['sense', { dt: [['text', '{bc}base meaning']], sdsense: { sd: 'specifically', dt: [['text', '{bc}more precise']] } }]]] }] }]);
  assert.deepEqual(response.entries[0].senses.map(item => item.definitionEn),
    ['main idea', 'detail one', 'detail two', 'base meaning', 'more precise']);
  assert.deepEqual(response.entries[0].senses[4].labels, ['specifically']);
});

test('suggestions remain separate and unknown meaning formats fail visibly', () => {
  assert.deepEqual(parseMerriamLearners('migrat', ['migrate', 'migration']).suggestions, ['migrate', 'migration']);
  assert.throws(() => parseMerriamLearners('word', [{ meta: { id: 'word' }, hwi: { hw: 'word' },
    def: [{ sseq: [[['sense', { dt: [['unknown', 'meaning']] }]]] }] }]), /Unsupported dictionary defining text/);
  assert.equal(dictionaryText('{bc}{it}move{/it} to {sx|another place||}'), 'move to another place');
});
