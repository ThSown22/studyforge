import type { LearningStatus, SavedWordSummary, VocabularyStats } from '@studyforge/contracts';
import { HttpError } from '../../shared/errors.ts';
import { record, text } from '../../shared/validation.ts';
import { normalizeTerm } from '../dictionary/dictionary.service.ts';

export interface VocabularyRepository {
  list(userId: string, filter: { collectionId?: string; status?: LearningStatus; query?: string }): Promise<SavedWordSummary[]>;
  byTerm(userId: string, normalizedTerm: string): Promise<SavedWordSummary | null>;
  save(userId: string, term: string, normalizedTerm: string, collectionId: string): Promise<{ word: SavedWordSummary; created: boolean } | null>;
  move(userId: string, id: string, collectionId: string): Promise<SavedWordSummary | null>;
  setStatus(userId: string, id: string, status: LearningStatus): Promise<SavedWordSummary | null>;
  stats(userId: string): Promise<VocabularyStats>;
}

export class VocabularyService {
  repository: VocabularyRepository;
  constructor(repository: VocabularyRepository) { this.repository = repository; }
  list(userId: string, filter: { collectionId?: string; status?: LearningStatus; query?: string }) {
    if (filter.status && !['new', 'learning', 'known'].includes(filter.status)) throw new HttpError(400, 'INVALID_STATUS', 'Trạng thái từ không hợp lệ.');
    if (filter.query && filter.query.length > 255) throw new HttpError(400, 'INVALID_QUERY', 'Từ khóa tìm kiếm quá dài.');
    return this.repository.list(userId, filter);
  }
  stats(userId: string) { return this.repository.stats(userId); }
  async save(userId: string, body: unknown) {
    const input = record(body);
    const term = text(input.term, 'Từ vựng', 1, 255).normalize('NFC').replace(/\s+/gu, ' ');
    const collectionId = text(input.collectionId, 'Bộ sưu tập', 36, 36);
    if (!/^[0-9a-f-]{36}$/i.test(collectionId)) throw new HttpError(400, 'INVALID_ID', 'ID bộ sưu tập không hợp lệ.');
    const saved = await this.repository.save(userId, term, normalizeTerm(term), collectionId);
    if (!saved) throw new HttpError(404, 'COLLECTION_NOT_FOUND', 'Không tìm thấy bộ sưu tập của bạn.');
    return saved;
  }
  async move(userId: string, id: string, body: unknown) {
    const collectionId = text(record(body).collectionId, 'Bộ sưu tập', 36, 36);
    const word = await this.repository.move(userId, id, collectionId);
    if (!word) throw new HttpError(404, 'WORD_OR_COLLECTION_NOT_FOUND', 'Không tìm thấy từ hoặc bộ sưu tập của bạn.');
    return word;
  }
  async setStatus(userId: string, id: string, body: unknown) {
    const status = record(body).status;
    if (!['new', 'learning', 'known'].includes(String(status))) throw new HttpError(400, 'INVALID_STATUS', 'Trạng thái từ không hợp lệ.');
    const word = await this.repository.setStatus(userId, id, status as LearningStatus);
    if (!word) throw new HttpError(404, 'WORD_NOT_FOUND', 'Không tìm thấy từ trong Kho từ của bạn.');
    return word;
  }
}
