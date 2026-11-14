import { HttpError } from '../../shared/errors.ts';

const GOOGLE_TRANSLATE_URL = 'https://translation.googleapis.com/language/translate/v2';
const DEEPL_TRANSLATE_URL = 'https://api-free.deepl.com/v2/translate';
const MAX_BATCH_SIZE = 128;
const MAX_RESPONSE_BYTES = 1_000_000;

export interface TranslationProvider {
  isConfigured(): boolean;
  translateEnglishToVietnamese(texts: string[]): Promise<string[]>;
}

interface GoogleTranslateResponse {
  data?: { translations?: Array<{ translatedText?: unknown }> };
}

interface DeepLTranslateResponse {
  translations?: Array<{ text?: unknown }>;
}

export class DeepLTranslationClient implements TranslationProvider {
  private readonly apiKey: string | undefined;
  private readonly request: typeof fetch;

  constructor(apiKey: string | undefined = process.env.DEEPL_API_KEY, request: typeof fetch = fetch) {
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
    let response: Response;
    try {
      response = await this.request(DEEPL_TRANSLATE_URL, {
        method: 'POST',
        headers: {
          Authorization: `DeepL-Auth-Key ${this.apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ text: texts, source_lang: 'EN', target_lang: 'VI' }),
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      throw new HttpError(502, 'TRANSLATION_UNAVAILABLE', 'Dịch tiếng Việt tạm thời không kết nối được.');
    }

    if (response.status === 403) {
      throw new HttpError(503, 'TRANSLATION_NOT_CONFIGURED', 'DeepL API key không hợp lệ hoặc chưa được kích hoạt.');
    }
    if (response.status === 429) {
      throw new HttpError(503, 'TRANSLATION_RATE_LIMITED', 'Dịch tiếng Việt đang nhận quá nhiều yêu cầu.');
    }
    if (response.status === 456) {
      throw new HttpError(503, 'TRANSLATION_QUOTA_EXCEEDED', 'DeepL đã hết hạn mức dịch của tài khoản.');
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

    let payload: DeepLTranslateResponse;
    try {
      payload = JSON.parse(body) as DeepLTranslateResponse;
    } catch {
      throw new HttpError(502, 'TRANSLATION_FORMAT_UNSUPPORTED', 'Định dạng kết quả dịch không hợp lệ.');
    }
    if (!Array.isArray(payload.translations) || payload.translations.length !== texts.length) {
      throw new HttpError(502, 'TRANSLATION_FORMAT_UNSUPPORTED', 'Định dạng kết quả dịch không hợp lệ.');
    }
    return payload.translations.map(item => {
      if (typeof item.text !== 'string' || !item.text.trim()) {
        throw new HttpError(502, 'TRANSLATION_FORMAT_UNSUPPORTED', 'Định dạng kết quả dịch không hợp lệ.');
      }
      return item.text;
    });
  }
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

export function createTranslationProvider(): TranslationProvider {
  const deepL = new DeepLTranslationClient();
  return deepL.isConfigured() ? deepL : new GoogleTranslationClient();
}
