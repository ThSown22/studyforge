import type { DictionaryResult, SavedWordSummary } from '../../../../packages/contracts/src/index.ts';
import { HttpError } from '../../shared/errors.ts';
import { MerriamClient } from './merriam.client.ts';

export interface SavedWordLookup { byTerm(userId: string, normalizedTerm: string): Promise<SavedWordSummary | null> }
export function normalizeTerm(value: string): string {
  return value.normalize('NFC').trim().replace(/\s+/gu, ' ').toLocaleLowerCase('en');
}

export class DictionaryService {
  private readonly provider: MerriamClient;
  private readonly savedWords: SavedWordLookup;
  constructor(provider: MerriamClient, savedWords: SavedWordLookup) {
    this.provider = provider;
    this.savedWords = savedWords;
  }

  async lookup(term: unknown, userId?: string): Promise<DictionaryResult> {
    if (typeof term !== 'string') throw new HttpError(400, 'INVALID_TERM', 'Nhập từ cần tra.');
    const normalized = normalizeTerm(term);
    if (!normalized || normalized.length > 255 || /[\u0000-\u001f]/u.test(normalized)) {
      throw new HttpError(400, 'INVALID_TERM', 'Từ tra cứu không hợp lệ.');
    }
    const result = await this.provider.lookup(normalized);
    if (userId) result.savedWord = await this.savedWords.byTerm(userId, normalized);
    return result;
  }
}
