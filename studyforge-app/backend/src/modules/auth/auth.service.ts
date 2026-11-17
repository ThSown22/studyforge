import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { HttpError } from '../../shared/errors.ts';
import * as validate from '../../shared/validation.ts';
import { PostgresAuthRepository, publicUser } from './auth.repository.ts';

const derive = promisify(scrypt);
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export class AuthService {
  private readonly repository: PostgresAuthRepository;
  private readonly secureCookies: boolean;
  private readonly ttlSeconds: number;
  constructor(repository: PostgresAuthRepository, secureCookies: boolean, ttlSeconds: number) {
    this.repository = repository; this.secureCookies = secureCookies; this.ttlSeconds = ttlSeconds;
  }
  private async hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const key = await derive(password, salt, 64) as Buffer;
    return `scrypt$${salt}$${key.toString('hex')}`;
  }
  private async verifyPassword(password: string, stored: string) {
    const [, salt, hex] = stored.split('$');
    if (!salt || !hex || hex.length !== 128) return false;
    const key = await derive(password, salt, 64) as Buffer;
    return timingSafeEqual(key, Buffer.from(hex, 'hex'));
  }
  private token(request: IncomingMessage) {
    const match = (request.headers.cookie ?? '').split(';').map(x => x.trim()).find(x => x.startsWith('studyforge_session='));
    return match?.slice('studyforge_session='.length) ?? null;
  }
  async currentUser(request: IncomingMessage) {
    const token = this.token(request);
    if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
    const row = await this.repository.sessionUser(hashToken(token));
    return row ? publicUser(row) : null;
  }
  async requireUser(request: IncomingMessage) {
    const user = await this.currentUser(request);
    if (!user) throw new HttpError(401, 'AUTH_REQUIRED', 'Đăng nhập để sử dụng Kho từ.');
    return user;
  }
  private async establishSession(userId: string, response: ServerResponse) {
    const token = randomBytes(32).toString('hex');
    await this.repository.createSession(hashToken(token), userId, new Date(Date.now() + this.ttlSeconds * 1000));
    response.setHeader('Set-Cookie', `studyforge_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${this.ttlSeconds}${this.secureCookies ? '; Secure' : ''}`);
  }
  async register(body: unknown, response: ServerResponse) {
    const input = validate.record(body);
    const name = validate.text(input.name, 'Tên', 2, 80);
    const email = validate.email(input.email);
    const password = validate.password(input.password);
    if (await this.repository.byEmail(email)) throw new HttpError(409, 'EMAIL_EXISTS', 'Email đã được sử dụng.');
    const hash = await this.hashPassword(password);
    let row;
    try { row = await this.repository.insert(name, email, hash); }
    catch (error) {
      if ((error as { code?: string }).code === '23505') throw new HttpError(409, 'EMAIL_EXISTS', 'Email đã được sử dụng.');
      throw error;
    }
    await this.establishSession(row.id, response);
    return { user: publicUser(row) };
  }
  async login(body: unknown, response: ServerResponse) {
    const input = validate.record(body);
    const email = validate.email(input.email);
    const password = validate.password(input.password);
    const row = await this.repository.byEmail(email);
    const dummy = 'scrypt$studyforge-unknown-user$' + '0'.repeat(128);
    if (!await this.verifyPassword(password, row?.password_hash ?? dummy) || !row) throw new HttpError(401, 'INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng.');
    await this.establishSession(row.id, response);
    return { user: publicUser(row) };
  }
  async logout(request: IncomingMessage, response: ServerResponse) {
    const token = this.token(request);
    if (token && /^[a-f0-9]{64}$/.test(token)) await this.repository.revokeSession(hashToken(token));
    response.setHeader('Set-Cookie', `studyforge_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${this.secureCookies ? '; Secure' : ''}`);
    return { ok: true };
  }
}
