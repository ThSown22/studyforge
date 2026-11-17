import type { DictionaryResult } from '@studyforge/contracts';
import { api } from './api.ts';

export type DefinitionLanguage = 'en' | 'vi';

export function lookupDictionary(term: string, language: DefinitionLanguage, signal: AbortSignal): Promise<DictionaryResult> {
  const query = language === 'vi' ? '?language=vi' : '';
  return api<DictionaryResult>(`/api/dictionary/${encodeURIComponent(term)}${query}`, { signal });
}
