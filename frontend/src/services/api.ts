import type { ApiErrorBody } from '../../../packages/contracts/src/index.ts';

declare global { interface Window { __STUDYFORGE_CONFIG__?: { PUBLIC_API_BASE_URL?: string } } }
export class ApiError extends Error {
  status: number;
  code: string;
  constructor(message: string, status: number, code: string) { super(message); this.name = 'ApiError'; this.status = status; this.code = code; }
}
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const base = window.__STUDYFORGE_CONFIG__?.PUBLIC_API_BASE_URL ?? '';
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      ...options, credentials: 'include',
      headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError('Không kết nối được máy chủ. Hãy kiểm tra kết nối và thử lại.', 0, 'NETWORK_ERROR');
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = (data as ApiErrorBody | null)?.error;
    throw new ApiError(error?.message || 'Yêu cầu chưa thực hiện được. Vui lòng thử lại.', response.status, error?.code || 'REQUEST_FAILED');
  }
  return data as T;
}
