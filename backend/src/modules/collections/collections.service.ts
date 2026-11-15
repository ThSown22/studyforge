import type { CollectionSummary } from '@studyforge/contracts';
import { HttpError } from '../../shared/errors.ts';
import { record, text } from '../../shared/validation.ts';

export interface CollectionRepository {
  list(userId: string): Promise<CollectionSummary[]>;
  create(userId: string, name: string, normalizedName: string, description: string | null): Promise<CollectionSummary | null>;
  update(userId: string, id: string, name: string, normalizedName: string, description: string | null): Promise<CollectionSummary | 'duplicate' | null>;
  remove(userId: string, id: string): Promise<'deleted' | 'not_found' | 'not_empty'>;
}

export function normalizeCollectionName(name: string): string {
  return name.normalize('NFC').trim().replace(/\s+/gu, ' ').toLocaleLowerCase('en');
}

export class CollectionsService {
  repository: CollectionRepository;
  constructor(repository: CollectionRepository) { this.repository = repository; }
  list(userId: string) { return this.repository.list(userId); }
  async create(userId: string, body: unknown) {
    const input = record(body);
    const name = text(input.name, 'Tên bộ sưu tập', 1, 100).replace(/\s+/gu, ' ');
    const description = input.description == null ? null : text(input.description, 'Mô tả', 1, 1000);
    const created = await this.repository.create(userId, name, normalizeCollectionName(name), description);
    if (!created) throw new HttpError(409, 'COLLECTION_EXISTS', 'Bộ sưu tập này đã tồn tại.');
    return created;
  }
  async update(userId: string, id: string, body: unknown) {
    const input = record(body);
    const name = text(input.name, 'Tên bộ sưu tập', 1, 100).replace(/\s+/gu, ' ');
    const description = input.description == null ? null : text(input.description, 'Mô tả', 1, 1000);
    const updated = await this.repository.update(userId, id, name, normalizeCollectionName(name), description);
    if (updated === 'duplicate') throw new HttpError(409, 'COLLECTION_EXISTS', 'Bộ sưu tập này đã tồn tại.');
    if (!updated) throw new HttpError(404, 'COLLECTION_NOT_FOUND', 'Không tìm thấy bộ sưu tập.');
    return updated;
  }
  async remove(userId: string, id: string) {
    const result = await this.repository.remove(userId, id);
    if (result === 'not_found') throw new HttpError(404, 'COLLECTION_NOT_FOUND', 'Không tìm thấy bộ sưu tập.');
    if (result === 'not_empty') throw new HttpError(409, 'COLLECTION_NOT_EMPTY', 'Hãy chuyển hoặc xóa các từ trong bộ trước.');
    return { ok: true };
  }
}
