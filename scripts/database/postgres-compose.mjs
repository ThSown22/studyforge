import { spawn } from 'node:child_process';
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { root } from '../paths.mjs';

export const postgres = Object.freeze({ service: 'db', user: 'studyforge', database: 'studyforge' });

function spawnCompose(args, stdio) {
  return spawn('docker', ['compose', ...args], { cwd: root, stdio, windowsHide: true });
}

function waitForExit(child, label) {
  return new Promise((resolve, reject) => {
    child.once('error', (error) => reject(new Error(`${label} could not start: ${error.message}`)));
    child.once('close', (code) => code === 0 ? resolve() : reject(new Error(`${label} failed with exit code ${code}`)));
  });
}

export async function runCompose(args, label) {
  await waitForExit(spawnCompose(args, 'inherit'), label);
}

export async function captureCompose(args, label) {
  const child = spawnCompose(args, ['ignore', 'pipe', 'pipe']);
  const stdout = [];
  const stderr = [];
  child.stdout.on('data', (chunk) => stdout.push(chunk));
  child.stderr.on('data', (chunk) => stderr.push(chunk));
  try {
    await waitForExit(child, label);
  } catch (error) {
    const detail = Buffer.concat(stderr).toString('utf8').trim();
    throw new Error(detail ? `${error.message}: ${detail}` : error.message);
  }
  return Buffer.concat(stdout).toString('utf8').trim();
}

export async function writeComposeOutput(args, target, label) {
  const child = spawnCompose(args, ['ignore', 'pipe', 'inherit']);
  await Promise.all([
    pipeline(child.stdout, createWriteStream(target, { flags: 'wx' })),
    waitForExit(child, label),
  ]);
}

export async function sendFileToCompose(source, args, label) {
  const child = spawnCompose(args, ['pipe', 'inherit', 'inherit']);
  await Promise.all([
    pipeline(createReadStream(source), child.stdin),
    waitForExit(child, label),
  ]);
}
