import type { DictionaryEntry, DictionaryResult, DictionarySense, RelatedTerm } from '../../../../packages/contracts/src/index.ts';

// The provider's JSON is intentionally handled only on the server. Unsupported sense
// structures fail explicitly so a lookup never appears successful after losing meanings.
type JsonObject = Record<string, unknown>;
const object = (value: unknown, label: string): JsonObject => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`Invalid dictionary ${label}`);
  return value as JsonObject;
};
const array = (value: unknown, label: string): unknown[] => {
  if (!Array.isArray(value)) throw new Error(`Invalid dictionary ${label}`);
  return value;
};
const string = (value: unknown): string => typeof value === 'string' ? value : '';
const labels = (value: unknown): string[] => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

export function dictionaryText(raw: string): string {
  const text = raw.replace(/\{([^{}]+)\}/g, (_match, token: string) => {
    if (token === 'bc') return ': ';
    if (token === 'ldquo') return '“';
    if (token === 'rdquo') return '”';
    if (token === 'p_br') return ' ';
    if (token === 'sdash') return '—';
    if (/^\/?(?:b|bit|it|itsc|rom|sc|sup|inf|wi|phrase|qword|gloss|parahw|dx|dx_def|dx_ety|ma)$/.test(token)) return '';
    const reference = token.match(/^(?:sx|dxt|a_link|d_link|i_link|et_link|mat|ds|phrase)\|([^|]+)/);
    if (reference) return reference[1];
    throw new Error(`Unsupported dictionary text token: ${token}`);
  });
  return text.replace(/\s+/g, ' ').trim().replace(/^:\s*/, '');
}

function audioUrl(value: unknown): string | null {
  const name = string(value);
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) return null;
  const folder = name.startsWith('bix') ? 'bix' : name.startsWith('gg') ? 'gg' : /^[^a-zA-Z]/.test(name) ? 'number' : name[0].toLowerCase();
  return `https://media.merriam-webster.com/audio/prons/en/us/mp3/${folder}/${name}.mp3`;
}

function definingText(value: unknown): { definition: string; examples: string[] } {
  const parts: string[] = [];
  const examples: string[] = [];
  for (const item of array(value, 'dt')) {
    const pair = array(item, 'dt item');
    const kind = string(pair[0]);
    if (kind === 'text') {
      if (typeof pair[1] !== 'string') throw new Error('Invalid dictionary definition');
      parts.push(dictionaryText(pair[1]));
    } else if (kind === 'vis') {
      for (const example of array(pair[1], 'vis')) {
        const text = string(object(example, 'example').t);
        if (text) examples.push(dictionaryText(text));
      }
    } else {
      throw new Error(`Unsupported dictionary defining text: ${kind}`);
    }
  }
  return { definition: parts.join(' ').replace(/\s+/g, ' ').trim(), examples };
}

function parseDefinitions(value: unknown, entryId: string, entryLabels: string[]): DictionarySense[] {
  const result: DictionarySense[] = [];
  let pendingLabels: string[] = [];
  const addSense = (raw: unknown, extraLabels: string[] = []) => {
    const sense = object(raw, 'sense');
    const ownLabels = [...entryLabels, ...pendingLabels, ...extraLabels, ...labels(sense.lbs), ...labels(sense.sls)];
    if (typeof sense.sgram === 'string') ownLabels.push(sense.sgram);
    if (typeof sense.wsgram === 'string') ownLabels.push(sense.wsgram);
    if (sense.dt === undefined) {
      pendingLabels = [...pendingLabels, ...labels(sense.sls), ...labels(sense.lbs)];
      return;
    }
    const content = definingText(sense.dt);
    if (!content.definition) throw new Error('Dictionary sense has no readable definition');
    result.push({ id: `${entryId}:${result.length + 1}`, order: result.length + 1, definitionEn: content.definition,
      definitionVi: null, examplesEn: content.examples, labels: ownLabels });
    pendingLabels = [];
    if (sense.sdsense !== undefined) {
      const divided = object(sense.sdsense, 'sdsense');
      const detail = definingText(divided.dt);
      if (!detail.definition) throw new Error('Dictionary divided sense has no readable definition');
      result.push({ id: `${entryId}:${result.length + 1}`, order: result.length + 1, definitionEn: detail.definition,
        definitionVi: null, examplesEn: detail.examples, labels: [...ownLabels, string(divided.sd)].filter(Boolean) });
    }
  };
  const visit = (node: unknown): void => {
    const pair = array(node, 'sense node');
    if (pair.length === 2 && typeof pair[0] === 'string') {
      const kind = pair[0];
      if (kind === 'sense' || kind === 'sen') { addSense(pair[1]); return; }
      if (kind === 'bs') { addSense(object(pair[1], 'binding substitute').sense); return; }
      if (kind === 'pseq') { array(pair[1], 'pseq').forEach(visit); return; }
      throw new Error(`Unsupported dictionary sense node: ${kind}`);
    }
    pair.forEach(visit);
  };
  for (const sectionValue of array(value, 'def')) {
    const section = object(sectionValue, 'definition section');
    if (section.sseq !== undefined) visit(section.sseq);
  }
  return result;
}

export function parseMerriamLearners(term: string, payload: unknown): DictionaryResult {
  const response: DictionaryResult = { term: term.trim(), language: 'en', pronunciations: [], entries: [], relatedEntries: [],
    wordFamily: [], suggestions: [], savedWord: null };
  const rows = array(payload, 'response');
  if (rows.every(row => typeof row === 'string')) {
    response.suggestions = rows as string[];
    return response;
  }
  const seenRelated = new Set<string>();
  rows.forEach((raw, index) => {
    const entry = object(raw, 'entry');
    const meta = object(entry.meta, 'metadata');
    const headword = object(entry.hwi, 'headword');
    const entryId = string(meta.id) || `${term}:${index + 1}`;
    const partOfSpeech = string(entry.fl) || 'unknown';
    const entryLabels = [...labels(entry.lbs), ...labels(entry.sls)];
    if (entry.def !== undefined) {
      const senses = parseDefinitions(entry.def, entryId, entryLabels);
      if (senses.length) response.entries.push({ id: entryId, partOfSpeech, labels: entryLabels, senses });
    }
    const pronunciations = Array.isArray(headword.prs) ? headword.prs : [];
    for (const rawPronunciation of pronunciations) {
      const pronunciation = object(rawPronunciation, 'pronunciation');
      const sound = pronunciation.sound && typeof pronunciation.sound === 'object' && !Array.isArray(pronunciation.sound)
        ? pronunciation.sound as JsonObject : null;
      const value = { ipa: string(pronunciation.ipa) || null, audioUrl: audioUrl(sound?.audio) };
      if ((value.ipa || value.audioUrl) && !response.pronunciations.some(item => item.ipa === value.ipa && item.audioUrl === value.audioUrl)) {
        response.pronunciations.push(value);
      }
    }
    for (const rawRelated of Array.isArray(entry.uros) ? entry.uros : []) {
      const related = object(rawRelated, 'undefined run-on');
      const relatedTerm = string(related.ure).replace(/\*/g, '').trim();
      if (relatedTerm && !seenRelated.has(relatedTerm.toLowerCase())) {
        const item: RelatedTerm = { term: relatedTerm, partOfSpeech: string(related.fl) || null };
        response.wordFamily.push(item);
        seenRelated.add(relatedTerm.toLowerCase());
      }
    }
    // Defined run-ons are separate phrases with definitions, not a POS of the queried headword.
    for (const rawRunOn of Array.isArray(entry.dros) ? entry.dros : []) {
      const runOn = object(rawRunOn, 'defined run-on');
      const runOnTerm = string(runOn.drp).replace(/\*/g, '').trim();
      if (runOnTerm) {
        const senses = parseDefinitions(runOn.def, `${entryId}:run-on:${response.relatedEntries.length + 1}`, entryLabels);
        if (senses.length) response.relatedEntries.push({ id: `${entryId}:run-on:${response.relatedEntries.length + 1}`,
          headword: runOnTerm, partOfSpeech, labels: entryLabels, senses });
      }
    }
  });
  return response;
}
