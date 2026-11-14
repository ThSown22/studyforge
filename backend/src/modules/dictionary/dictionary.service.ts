import type { DictionaryEntry, DictionaryResult, SavedWordSummary } from '../../../../packages/contracts/src/index.ts';
import { HttpError } from '../../shared/errors.ts';
import type { TranslationProvider } from './translation.provider.ts';

export interface SavedWordLookup { byTerm(userId: string, normalizedTerm: string): Promise<SavedWordSummary | null> }
export interface DictionaryProvider { lookup(term: string): Promise<DictionaryResult> }
export function normalizeTerm(value: string): string {
  return value.normalize('NFC').trim().replace(/\s+/gu, ' ').toLocaleLowerCase('en');
}

export class DictionaryService {
  private readonly provider: DictionaryProvider;
  private readonly savedWords: SavedWordLookup;
  private readonly translator: TranslationProvider | undefined;
  constructor(provider: DictionaryProvider, savedWords: SavedWordLookup, translator?: TranslationProvider) {
    this.provider = provider;
    this.savedWords = savedWords;
    this.translator = translator;
  }

  async lookup(term: unknown, userId?: string, definitionLanguage: unknown = 'en'): Promise<DictionaryResult> {
    if (typeof term !== 'string') throw new HttpError(400, 'INVALID_TERM', 'Nhập từ cần tra.');
    if (definitionLanguage !== 'en' && definitionLanguage !== 'vi') {
      throw new HttpError(400, 'INVALID_DEFINITION_LANGUAGE', 'Ngôn ngữ định nghĩa không hợp lệ.');
    }
    if (definitionLanguage === 'vi' && (!this.translator || !this.translator.isConfigured())) {
      throw new HttpError(503, 'TRANSLATION_NOT_CONFIGURED', 'Dịch tiếng Việt chưa được cấu hình.');
    }
    const normalized = normalizeTerm(term);
    if (!normalized || normalized.length > 255 || /[\u0000-\u001f]/u.test(normalized)) {
      throw new HttpError(400, 'INVALID_TERM', 'Từ tra cứu không hợp lệ.');
    }
    let result = await this.provider.lookup(normalized);
    if (definitionLanguage === 'vi') result = await this.translateDefinitions(result);
    if (userId) result.savedWord = await this.savedWords.byTerm(userId, normalized);
    return result;
  }

  private async translateDefinitions(result: DictionaryResult): Promise<DictionaryResult> {
    if (!this.translator) throw new HttpError(503, 'TRANSLATION_NOT_CONFIGURED', 'Dịch tiếng Việt chưa được cấu hình.');
    const definitions = [...result.entries, ...result.relatedEntries]
      .flatMap(entry => entry.senses.map(sense => sense.definitionEn));
    const uniqueDefinitions = [...new Set(definitions)];
    const translated = await this.translator.translateEnglishToVietnamese(uniqueDefinitions);
    if (translated.length !== uniqueDefinitions.length) {
      throw new HttpError(502, 'TRANSLATION_FORMAT_UNSUPPORTED', 'Định dạng kết quả dịch không hợp lệ.');
    }
    const byDefinition = new Map(uniqueDefinitions.map((definition, index) => [definition, translated[index]]));
    const translateEntries = (entries: DictionaryEntry[]): DictionaryEntry[] => entries.map(entry => ({
      ...entry,
      senses: entry.senses.map(sense => ({ ...sense, definitionVi: byDefinition.get(sense.definitionEn) ?? null })),
    }));
    return {
      ...result,
      entries: translateEntries(result.entries),
      relatedEntries: translateEntries(result.relatedEntries),
    };
  }
}
