import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { frontendConfig } from '../../frontend/config.mjs';
import { createFrontendServer } from '../../frontend/server.mjs';

test('browser configuration exposes only the explicitly public key', () => {
  const before = process.env.STUDYFORGE_PRIVATE_TEST;
  process.env.STUDYFORGE_PRIVATE_TEST = 'must-not-reach-browser';
  try {
    const { publicConfig } = frontendConfig();
    assert.deepEqual(Object.keys(publicConfig), ['PUBLIC_API_BASE_URL']);
    assert.equal(JSON.stringify(publicConfig).includes('must-not-reach-browser'), false);
    assert.equal('API_PROXY_TARGET' in publicConfig, false);
  } finally {
    if (before === undefined) delete process.env.STUDYFORGE_PRIVATE_TEST;
    else process.env.STUDYFORGE_PRIVATE_TEST = before;
  }
});

test('invalid frontend port and credential-bearing proxy targets fail before listen', () => {
  const beforePort = process.env.FE_PORT;
  const beforeHost = process.env.FE_HOST;
  const beforeTarget = process.env.API_PROXY_TARGET;
  try {
    process.env.FE_PORT = 'not-a-port';
    assert.throws(() => frontendConfig(), /FE_PORT/);
    process.env.FE_PORT = '3000';
    process.env.FE_HOST = 'not a hostname';
    assert.throws(() => frontendConfig(), /FE_HOST/);
    process.env.FE_HOST = '127.0.0.1';
    process.env.API_PROXY_TARGET = 'http://user:password@localhost:3001';
    assert.throws(() => frontendConfig(), /API_PROXY_TARGET/);
  } finally {
    if (beforePort === undefined) delete process.env.FE_PORT; else process.env.FE_PORT = beforePort;
    if (beforeHost === undefined) delete process.env.FE_HOST; else process.env.FE_HOST = beforeHost;
    if (beforeTarget === undefined) delete process.env.API_PROXY_TARGET; else process.env.API_PROXY_TARGET = beforeTarget;
  }
});

test('same-origin dev proxy forwards cookies, JSON and upstream status', async () => {
  const upstream = createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    res.writeHead(201, { 'Content-Type': 'application/json', 'Set-Cookie': 'session=test; HttpOnly; Path=/' });
    res.end(JSON.stringify({ path: req.url, method: req.method, cookie: req.headers.cookie, body: JSON.parse(body) }));
  });
  await new Promise((done) => upstream.listen(0, '127.0.0.1', done));
  const port = upstream.address().port;
  const frontend = createFrontendServer({ port: 0, backend: `http://127.0.0.1:${port}` });
  try {
    await frontend.listen();
    const frontendPort = frontend.server.address().port;
    const response = await fetch(`http://127.0.0.1:${frontendPort}/api/proxy-test`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: 'studyforge_session=abc' }, body: JSON.stringify({ value: 'from browser' }) });
    assert.equal(response.status, 201);
    assert.match(response.headers.get('set-cookie'), /HttpOnly/);
    assert.deepEqual(await response.json(), { path: '/api/proxy-test', method: 'POST', cookie: 'studyforge_session=abc', body: { value: 'from browser' } });
  } finally {
    await new Promise((done) => frontend.server.close(done));
    await new Promise((done) => upstream.close(done));
  }
});

test('frontend serves allowlisted public config from runtime environment', async () => {
  const previous = process.env.PUBLIC_API_BASE_URL;
  process.env.PUBLIC_API_BASE_URL = 'https://studyforge.example/api';
  const frontend = createFrontendServer({ port: 0 });
  try {
    await frontend.listen();
    const port = frontend.server.address().port;
    const response = await fetch(`http://127.0.0.1:${port}/config.js`);
    const script = await response.text();
    assert.equal(response.status, 200);
    assert.match(script, /https:\/\/studyforge\.example\/api/);
    assert.equal(script.includes('API_PROXY_TARGET'), false);
  } finally {
    await new Promise((done) => frontend.server.close(done));
    if (previous === undefined) delete process.env.PUBLIC_API_BASE_URL;
    else process.env.PUBLIC_API_BASE_URL = previous;
  }
});
