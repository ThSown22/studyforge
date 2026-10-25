import { HttpError } from '../../shared/errors.ts';
import { parseMerriamLearners } from './merriam.parser.ts';
import type { DictionaryResult } from '../../../../packages/contracts/src/index.ts';

const MAX_RESPONSE_BYTES = 2_000_000;

export class MerriamClient {
  private readonly apiKey: string | undefined;
  private readonly request: typeof fetch;
  constructor(apiKey: string | undefined = process.env.MERRIAM_WEBSTER_API_KEY, request: typeof fetch = fetch) {
    this.apiKey = apiKey;
    this.request = request;
  }

  async lookup(term: string): Promise<DictionaryResult> {
    if (!this.apiKey) throw new HttpError(503, 'DICTIONARY_NOT_CONFIGURED', 'Từ điển chưa được cấu hình.');
    const url = new URL(`https://www.dictionaryapi.com/api/v3/references/learners/json/${encodeURIComponent(term)}`);
    url.searchParams.set('key', this.apiKey);
    let response: Response;
    try { response = await this.request(url, { signal: AbortSignal.timeout(8000) }); }
    catch { throw new HttpError(502, 'DICTIONARY_UNAVAILABLE', 'Từ điển tạm thời không kết nối được.'); }
    if (response.status === 429) throw new HttpError(503, 'DICTIONARY_RATE_LIMITED', 'Từ điển đã đạt giới hạn truy vấn.');
    if (!response.ok) throw new HttpError(502, 'DICTIONARY_UNAVAILABLE', 'Từ điển tạm thời không trả kết quả.');
    const length = Number(response.headers.get('content-length') ?? 0);
    if (length > MAX_RESPONSE_BYTES) throw new HttpError(502, 'DICTIONARY_RESPONSE_TOO_LARGE', 'Kết quả từ điển quá lớn.');
    const body = await response.text();
    if (Buffer.byteLength(body, 'utf8') > MAX_RESPONSE_BYTES) throw new HttpError(502, 'DICTIONARY_RESPONSE_TOO_LARGE', 'Kết quả từ điển quá lớn.');
    try { return parseMerriamLearners(term, JSON.parse(body)); }
    catch { throw new HttpError(502, 'DICTIONARY_FORMAT_UNSUPPORTED', 'Định dạng kết quả từ điển chưa được hỗ trợ đầy đủ.'); }
  }
}
