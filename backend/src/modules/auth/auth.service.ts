import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { User } from '../../../../packages/contracts/src/index.ts';
import { AuthRepository, publicUser } from './auth.repository.ts';
import { HttpError } from '../../shared/errors.ts';
import * as validate from '../../shared/validation.ts';

const derive = promisify(scrypt);
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
export class AuthService {
  repository: AuthRepository;
  secureCookies: boolean;
  ttl: number;
  constructor(repository: AuthRepository, secureCookies: boolean, ttlSeconds: number) { this.repository = repository; this.secureCookies = secureCookies; this.ttl = ttlSeconds; }
  async hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const key = await derive(password, salt, 64) as Buffer;
    return `scrypt$${salt}$${key.toString('hex')}`;
  }
  async verifyPassword(password: string, stored: string) {
    const [, salt, hex] = stored.split('$');
    if (!salt || !hex || hex.length !== 128) return false;
    const key = await derive(password, salt, 64) as Buffer;
    return timingSafeEqual(key, Buffer.from(hex, 'hex'));
  }
  token(request: IncomingMessage) {
    const match = (request.headers.cookie ?? '').split(';').map(x => x.trim()).find(x => x.startsWith('studyforge_session='));
    return match?.slice('studyforge_session='.length) ?? null;
  }
  currentUser(request: IncomingMessage): User | null {
    const token = this.token(request);
    if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
    const row = this.repository.sessionUser(hashToken(token));
    return row ? publicUser(row) : null;
  }
  requireUser(request: IncomingMessage) {
    const user = this.currentUser(request);
    if (!user) throw new HttpError(401, 'AUTH_REQUIRED', 'Đăng nhập để lưu tiến độ và mở đầy đủ nội dung học.');
    return user;
  }
  establishSession(user: User, response: ServerResponse) {
    const token = randomBytes(32).toString('hex');
    this.repository.createSession(hashToken(token), user.id, Date.now() + this.ttl * 1000);
    response.setHeader('Set-Cookie', `studyforge_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${this.ttl}${this.secureCookies ? '; Secure' : ''}`);
  }
  async register(body: unknown, response: ServerResponse) {
    const input = validate.record(body);
    const name = validate.text(input.name, 'Tên', 2, 80);
    const email = validate.email(input.email);
    const password = validate.password(input.password);
    if (this.repository.byEmail(email)) throw new HttpError(409, 'EMAIL_EXISTS', 'Email đã được sử dụng. Hãy đăng nhập hoặc dùng email khác.');
    const passwordHash = await this.hashPassword(password);
    const row = { id: randomUUID(), name, email, password_hash: passwordHash, xp: 0, created_at: new Date().toISOString() };
    try { this.repository.insert(row); }
    catch (error) {
      if (this.repository.byEmail(email)) throw new HttpError(409, 'EMAIL_EXISTS', 'Email đã được sử dụng.');
      throw error;
    }
    const user = publicUser(row);
    this.establishSession(user, response);
    return { user };
  }
  async login(body: unknown, response: ServerResponse) {
    const input = validate.record(body);
    const email = validate.email(input.email);
    const password = validate.password(input.password);
    const row = this.repository.byEmail(email);
    const dummy = 'scrypt$studyforge-unknown-user$' + '0'.repeat(128);
    const valid = await this.verifyPassword(password, row?.password_hash ?? dummy);
    if (!row || !valid) throw new HttpError(401, 'INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng.');
    const user = publicUser(row);
    this.establishSession(user, response);
    return { user };
  }
  logout(request: IncomingMessage, response: ServerResponse) {
    const token = this.token(request);
    if (token) this.repository.deleteSession(hashToken(token));
    response.setHeader('Set-Cookie', `studyforge_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${this.secureCookies ? '; Secure' : ''}`);
    return { ok: true };
  }
}
