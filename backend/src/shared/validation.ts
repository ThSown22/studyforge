import { HttpError } from './errors.ts';

export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new HttpError(400, 'INVALID_BODY', 'Nội dung gửi lên phải là một đối tượng JSON.');
  return value as Record<string, unknown>;
}
export function text(value: unknown, label: string, min = 1, max = 200): string {
  if (typeof value !== 'string') throw new HttpError(400, 'VALIDATION_ERROR', `${label} không hợp lệ.`);
  const result = value.trim();
  if (result.length < min || result.length > max) throw new HttpError(400, 'VALIDATION_ERROR', `${label} cần từ ${min} đến ${max} ký tự.`);
  return result;
}
export function email(value: unknown): string {
  const result = text(value, 'Email', 3, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) throw new HttpError(400, 'VALIDATION_ERROR', 'Địa chỉ email không hợp lệ.');
  return result;
}
export function password(value: unknown): string {
  if (typeof value !== 'string' || value.length < 8 || value.length > 128) throw new HttpError(400, 'VALIDATION_ERROR', 'Mật khẩu cần từ 8 đến 128 ký tự.');
  return value;
}
