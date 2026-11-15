import assert from 'node:assert/strict';
import test from 'node:test';
import { CollectionsService } from '../../backend/src/modules/collections/collections.service.ts';
import { VocabularyService } from '../../backend/src/modules/vocabulary/vocabulary.service.ts';
import { DictionaryService } from '../../backend/src/modules/dictionary/dictionary.service.ts';
import { HttpError } from '../../backend/src/shared/errors.ts';
import type { CollectionRepository } from '../../backend/src/modules/collections/collections.service.ts';
import type { VocabularyRepository } from '../../backend/src/modules/vocabulary/vocabulary.service.ts';
import type { DictionaryResult, SavedWordSummary } from '@studyforge/contracts';

const word: SavedWordSummary={id:'word-1',term:'resilient',collectionId:'collection-1',collectionName:'IT',status:'new',savedAt:new Date().toISOString(),personalNote:null};

function createCollectionRepository(overrides: Partial<CollectionRepository> = {}): CollectionRepository {
  return {
    list: async () => [],
    create: async () => null,
    update: async () => null,
    remove: async () => 'not_found',
    ...overrides,
  };
}

function createVocabularyRepository(overrides: Partial<VocabularyRepository> = {}): VocabularyRepository {
  return {
    list: async () => [],
    byTerm: async () => null,
    save: async () => null,
    move: async () => null,
    setStatus: async () => null,
    stats: async () => ({ total: 0, new: 0, learning: 0, known: 0, reviewEvents: 0 }),
    ...overrides,
  };
}

test('collection names normalize before persistence and duplicate names are rejected',async()=>{
  let normalized='';
  const repository=createCollectionRepository({create:async(_user:string,_name:string,key:string)=>{normalized=key;return null;}});
  await assert.rejects(()=>new CollectionsService(repository).create('user-1',{name:'  IT   Terms  '}),(error:unknown)=>error instanceof HttpError&&error.status===409);
  assert.equal(normalized,'it terms');
});
test('saving an already saved word preserves its one collection',async()=>{
  let term='';
  const repository=createVocabularyRepository({save:async(_user:string,_term:string,key:string)=>{term=key;return{word,created:false};}});
  const result=await new VocabularyService(repository).save('user-1',{term:'  Resilient  ',collectionId:'11111111-1111-1111-1111-111111111111'});
  assert.equal(term,'resilient');assert.equal(result.created,false);assert.equal(result.word.collectionId,'collection-1');
});
test('only three learning statuses are accepted',async()=>{
  const service=new VocabularyService(createVocabularyRepository());
  await assert.rejects(()=>service.setStatus('user-1','word-1',{status:'due'}),(error:unknown)=>error instanceof HttpError&&error.status===400);
});
test('dictionary lookup includes user-owned saved state without changing provider senses',async()=>{
  const result:DictionaryResult={term:'resilient',language:'en',pronunciations:[],entries:[{id:'entry',partOfSpeech:'adjective',labels:[],senses:[{id:'sense',order:1,definitionEn:'able to recover',definitionVi:null,examplesEn:['a resilient team'],labels:[]}]}],relatedEntries:[],wordFamily:[],suggestions:[],savedWord:null};
  const provider={lookup:async()=>result};
  const lookup={byTerm:async()=>word};
  const found=await new DictionaryService(provider,lookup).lookup(' Resilient ','user-1');
  assert.equal(found.savedWord?.collectionName,'IT');assert.equal(found.entries[0].senses[0].examplesEn.length,1);
});
