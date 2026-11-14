import { HttpError } from '../../shared/errors.ts';

const GOOGLE_TRANSLATE_URL = 'https://translation.googleapis.com/language/translate/v2';
const MAX_BATCH_SIZE = 128;
const MAX_RESPONSE_BYTES = 1_000_000;

export interface TranslationProvider {
  isConfigured(): boolean;
  translateEnglishToVietnamese(texts: string[]): Promise<string[]>;
}

interface GoogleTranslateResponse {
  data?: { translations?: Array<{ translatedText?: unknown }> };
}

export class GoogleTranslationClient implements TranslationProvider {
  private readonly apiKey: string | undefined;
  private readonly request: typeof fetch;

  constructor(apiKey: string | undefined = process.env.GOOGLE_TRANSLATE_API_KEY, request: typeof fetch = fetch) {
    this.apiKey = apiKey;
    this.request = request;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async translateEnglishToVietnamese(texts: string[]): Promise<string[]> {
    if (!texts.length) return [];
    if (!this.apiKey) {
      throw new HttpError(503, 'TRANSLATION_NOT_CONFIGURED', 'Dịch tiếng Việt chưa được cấu hình.');
    }

    const translated: string[] = [];
    for (let offset = 0; offset < texts.length; offset += MAX_BATCH_SIZE) {
      const batch = texts.slice(offset, offset + MAX_BATCH_SIZE);
      translated.push(...await this.translateBatch(batch));
    }
    return translated;
  }

  private async translateBatch(texts: string[]): Promise<string[]> {
    const url = new URL(GOOGLE_TRANSLATE_URL);
    url.searchParams.set('key', this.apiKey!);

    let response: Response;
    try {
      response = await this.request(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ q: texts, source: 'en', target: 'vi', format: 'text' }),
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      throw new HttpError(502, 'TRANSLATION_UNAVAILABLE', 'Dịch tiếng Việt tạm thời không kết nối được.');
    }

    if (response.status === 429) {
      throw new HttpError(503, 'TRANSLATION_RATE_LIMITED', 'Dịch tiếng Việt đã đạt giới hạn truy vấn.');
    }
    if (!response.ok) {
      throw new HttpError(502, 'TRANSLATION_UNAVAILABLE', 'Dịch tiếng Việt tạm thời chưa sẵn sàng.');
    }

    const length = Number(response.headers.get('content-length') ?? 0);
    if (length > MAX_RESPONSE_BYTES) {
      throw new HttpError(502, 'TRANSLATION_RESPONSE_TOO_LARGE', 'Kết quả dịch quá lớn.');
    }
    const body = await response.text();
    if (Buffer.byteLength(body, 'utf8') > MAX_RESPONSE_BYTES) {
      throw new HttpError(502, 'TRANSLATION_RESPONSE_TOO_LARGE', 'Kết quả dịch quá lớn.');
    }

    let payload: GoogleTranslateResponse;
    try {
      payload = JSON.parse(body) as GoogleTranslateResponse;
    } catch {
      throw new HttpError(502, 'TRANSLATION_FORMAT_UNSUPPORTED', 'Định dạng kết quả dịch không hợp lệ.');
    }
    const translations = payload.data?.translations;
    if (!Array.isArray(translations) || translations.length !== texts.length) {
      throw new HttpError(502, 'TRANSLATION_FORMAT_UNSUPPORTED', 'Định dạng kết quả dịch không hợp lệ.');
    }
    return translations.map(item => {
      if (typeof item.translatedText !== 'string' || !item.translatedText.trim()) {
        throw new HttpError(502, 'TRANSLATION_FORMAT_UNSUPPORTED', 'Định dạng kết quả dịch không hợp lệ.');
      }
      return item.translatedText;
    });
  }
}
