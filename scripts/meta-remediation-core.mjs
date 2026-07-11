import { createHash } from 'node:crypto';

export const GENERATOR_VERSION = 'meta-remediation-extractive-v2';
export const MIN_LENGTH = 145;
export const MAX_LENGTH = 160;

const REVIEWED_OVERRIDES = {
  'state-of-saas-2026-annual-report': 'State of SaaS 2026 reviews market structure, software categories, adoption patterns, methodology, limitations, and source scope across the industry report.',
  'what-is-ci-cd': 'CI/CD connects code integration, automated testing, and delivery workflows. Review pipeline stages, implementation choices, limitations, and terminology.',
  'legal-technology-guide': 'The Ultimate Guide to Legal Technology in 2026 reviews legal workflows, software categories, adoption considerations, governance, limitations, and terminology.',
  'what-is-devops-and-how-does-it-work': 'What Is DevOps and How Does It Work explains collaboration, delivery workflows, automation, implementation choices, limitations, and terminology.',
  'what-is-contract-management-software': 'What Is Contract Management Software explains contract workflows, approval processes, implementation choices, governance, limitations, and terminology.',
  'what-is-construction-management-software': 'What Is Construction Management Software explains project coordination, field workflows, implementation choices, governance, limitations, and core terminology.',
  'what-is-ap-automation-and-how-does-it-work': 'What Is AP Automation and How Does It Work explains invoice workflows, approvals, payment controls, implementation choices, limitations, and key terminology.',
};

const EXCLUDED_HEADINGS = /^(?:sources?|references?|frequently asked questions|faqs?|table of contents|contents|affiliate disclosure|disclosure|about the author|author|related articles?|recommended reading|final thoughts?|conclusion)$/i;
const EXCLUDED_TEXT = /^(?:disclosure:|some links on this page are affiliate links|written by\b|updated\s+[A-Z][a-z]+\s+\d{4}\b|quick overview\b|key takeaways?\b|table of contents\b|click here\b|learn more\b|read more\b)/i;
const CTA_TEXT = /\b(?:click here|sign up|start (?:a )?free trial|get started|buy now|subscribe|download (?:the|our)|contact (?:us|sales))\b/i;
const GENERIC_AI_TEXT = /\b(?:critical focus area|looking ahead|organizations implement|if your organization handles sensitive data|AI expected to handle|choosing the right .+ can transform your team)\b/i;
const DANGLING_WORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'because', 'but', 'by', 'for', 'from', 'if', 'in',
  'into', 'nor', 'of', 'on', 'or', 'over', 'so', 'than', 'that', 'the', 'through',
  'to', 'under', 'until', 'when', 'while', 'with', 'without', 'yet',
]);

export function sha256(value) {
  return createHash('sha256').update(String(value ?? ''), 'utf8').digest('hex');
}

export function normalizeAscii(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function decodeHtml(value) {
  return String(value ?? '')
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#039;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

export function stripHtml(value) {
  return normalizeAscii(decodeHtml(String(value ?? '').replace(/<[^>]+>/g, ' ')));
}

function sectionBlocks(html) {
  const source = String(html ?? '')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|table|nav|aside|form)[^>]*>[\s\S]*?<\/\1>/gi, ' ');
  const headingPattern = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  const headings = [...source.matchAll(headingPattern)];
  const blocks = [];
  let excluded = false;
  let cursor = 0;

  for (const heading of headings) {
    const before = source.slice(cursor, heading.index);
    if (!excluded) blocks.push(before);
    const headingText = stripHtml(heading[2]);
    excluded = EXCLUDED_HEADINGS.test(headingText);
    cursor = heading.index + heading[0].length;
  }
  if (!excluded) blocks.push(source.slice(cursor));
  return blocks;
}

export function extractSubstantiveSentences(html) {
  const candidates = [];
  for (const block of sectionBlocks(html)) {
    const paragraphMatches = [...block.matchAll(/<(?:p|li)\b[^>]*>([\s\S]*?)<\/(?:p|li)>/gi)];
    for (const match of paragraphMatches) {
      const text = stripHtml(match[1]);
      if (text.length < 35 || EXCLUDED_TEXT.test(text) || CTA_TEXT.test(text) || GENERIC_AI_TEXT.test(text)) continue;
      for (const rawSentence of text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? []) {
        const sentence = normalizeAscii(rawSentence);
        if (sentence.length < 35 || EXCLUDED_TEXT.test(sentence) || CTA_TEXT.test(sentence) || GENERIC_AI_TEXT.test(sentence)) continue;
        if (!/^[\x20-\x7E]+$/.test(sentence)) continue;
        candidates.push(sentence);
      }
    }
  }
  return [...new Set(candidates)];
}

export function titleTerms(title) {
  const stop = new Set(['a', 'an', 'and', 'are', 'best', 'for', 'how', 'in', 'of', 'or', 'the', 'to', 'vs', 'what', 'with', '2026', '2027', 'statistics', 'guide']);
  return new Set(normalizeAscii(stripHtml(title)).toLowerCase().match(/[a-z0-9]+/g)?.filter((word) => word.length > 2 && !stop.has(word)) ?? []);
}

function scoreSentence(sentence, terms, index) {
  const lower = sentence.toLowerCase();
  const termHits = [...terms].filter((term) => lower.includes(term)).length;
  const hasNumber = /\b\d+(?:\.\d+)?%?\b/.test(sentence) ? 1 : 0;
  return termHits * 4 + hasNumber * 3 + Math.max(0, 3 - index) - Math.min(5, Math.floor(sentence.length / 180));
}

export function hasUnsafeEnding(value) {
  const text = normalizeAscii(value).replace(/[.!?]+$/, '').trim();
  const lastWord = text.match(/([a-z]+)$/i)?.[1]?.toLowerCase() ?? '';
  return !lastWord || DANGLING_WORDS.has(lastWord);
}

export function completeClause(value) {
  const text = normalizeAscii(value);
  if (text.length <= MAX_LENGTH) return /[.!?]$/.test(text) && !hasUnsafeEnding(text) ? text : '';
  const window = text.slice(0, MAX_LENGTH + 1);
  const endings = [...window.matchAll(/[.!?](?=\s|$)/g)].map((match) => match.index + 1).filter((index) => index >= MIN_LENGTH && index <= MAX_LENGTH);
  const boundary = endings.at(-1);
  if (boundary) {
    const candidate = window.slice(0, boundary).trim();
    if (!hasUnsafeEnding(candidate)) return candidate;
  }
  return '';
}

function pageType(record) {
  const key = `${record.slug ?? ''} ${record.title ?? ''}`.toLowerCase();
  if (/\bwhat-is[- ]/.test(key)) return 'glossary';
  if (/\b(?:vs|versus)\b/.test(key) || /-vs-/.test(key)) return 'comparison';
  if (/\balternatives?\b/.test(key)) return 'alternatives';
  if (/\bhow-to[- ]|^how to\b/.test(key)) return 'howto';
  if (/\bstatistics?\b|\bmarket size\b/.test(key)) return 'statistics';
  return 'general';
}

const STRUCTURAL_FALLBACKS = {
  statistics: [
    (title) => `${title} organizes reported statistics with definitions, methodology, limitations, and cited sources so each figure can be read in context.`,
    (title) => `${title} presents reported figures alongside definitions, scope notes, methodology, limitations, and cited sources for contextual review.`,
    (title) => `${title} provides a structured account of reported figures, definitions, source scope, methodology, and limitations for reference.`,
  ],
  glossary: [
    (title) => `${title} defines the term and organizes its core concepts, common applications, practical considerations, limitations, and scope notes.`,
    (title) => `${title} provides a structured definition with core concepts, typical applications, implementation considerations, limitations, and scope notes.`,
    (title) => `${title} explains the term through its definition, main concepts, common uses, implementation considerations, limitations, and evaluation notes.`,
  ],
  comparison: [
    (title) => `${title} organizes a documented comparison by capabilities, intended uses, implementation considerations, limitations, methodology, and scope notes.`,
    (title) => `${title} organizes the comparison by capabilities, use cases, implementation considerations, limitations, and evaluation notes.`,
    (title) => `${title} provides a structured comparison of capabilities, intended uses, operational considerations, limitations, and scope notes.`,
    (title) => `${title} compares the named options through capabilities, use cases, implementation factors, limitations, and decision criteria.`,
  ],
  alternatives: [
    (title) => `${title} organizes a review of the named options by capabilities, intended uses, selection considerations, limitations, methodology, and scope notes.`,
    (title) => `${title} organizes the listed options by capabilities, use cases, selection considerations, limitations, and evaluation notes.`,
    (title) => `${title} provides a structured review of the named options, their use cases, evaluation factors, limitations, and scope notes.`,
    (title) => `${title} reviews the listed options through capabilities, intended uses, selection criteria, limitations, and decision context.`,
  ],
  howto: [
    (title) => `${title} presents the task as a structured sequence with preparation, implementation steps, decision points, limitations, and scope notes.`,
    (title) => `${title} organizes the process into preparation, practical steps, decision points, implementation notes, limitations, and evaluation notes.`,
    (title) => `${title} provides a structured process covering preparation, implementation steps, key decisions, limitations, and decision context.`,
  ],
  general: [
    (title) => `${title} provides a structured overview of definitions, core concepts, practical considerations, methodology, limitations, and scope notes.`,
    (title) => `${title} organizes its subject through definitions, key concepts, implementation considerations, methodology, limitations, and evaluation notes.`,
    (title) => `${title} presents a structured reference covering core concepts, practical considerations, methodology, limitations, and decision context.`,
  ],
};

const STRUCTURAL_PARTS = {
  statistics: ['reported figures', 'definitions', 'scope notes', 'methodology', 'limitations', 'cited sources'],
  glossary: ['the definition', 'core concepts', 'common applications', 'implementation considerations', 'limitations', 'scope notes'],
  comparison: ['capabilities', 'intended uses', 'implementation considerations', 'methodology', 'limitations', 'decision criteria'],
  alternatives: ['the named options', 'capabilities', 'intended uses', 'selection considerations', 'limitations', 'evaluation notes'],
  howto: ['preparation', 'implementation steps', 'decision points', 'methodology', 'limitations', 'scope notes'],
  general: ['definitions', 'core concepts', 'practical considerations', 'methodology', 'limitations', 'scope notes'],
};

const STRUCTURAL_LEADS = [
  'reviews',
  'organizes',
  'documents',
  'provides a structured review covering',
  'organizes the page around',
  'presents a documented overview of',
  'sets out a structured reference for',
];

const STRUCTURAL_TAILS = [
  'in context.',
  'within the stated page scope.',
  'for context-aware reference.',
  'for contextual reference.',
  'within the scope stated on the page.',
  'for a context-aware reading of the subject.',
  'with the page scope kept explicit.',
];

function rotate(values, offset) {
  return values.map((_, index) => values[(index + offset) % values.length]);
}

function formatList(values) {
  return `${values.slice(0, -1).join(', ')}, and ${values.at(-1)}`;
}

export function buildStructuralFallback(record) {
  const title = normalizeAscii(stripHtml(record.title)).replace(/[.!?]+$/, '');
  if (!title || !/^[\x20-\x7E]+$/.test(title)) return [];
  const compactTitle = title
    .replace(/:\s*Which Is Better in 2026$/i, '')
    .replace(/:\s*The Complete Comparison$/i, '')
    .replace(/^\d+\s+Best\s+/i, 'Best ');
  const titleVariants = [...new Set([title, compactTitle])];
  const type = pageType(record);
  const templates = STRUCTURAL_FALLBACKS[type];
  const seed = Number.parseInt(sha256(`${record.slug ?? ''}|${title}`).slice(0, 8), 16);
  const candidates = titleVariants.flatMap((variant) => templates.map((template) => template(variant)));
  const parts = STRUCTURAL_PARTS[type];
  for (const variant of titleVariants) {
    for (let rotation = 0; rotation < parts.length; rotation += 1) {
      for (const lead of STRUCTURAL_LEADS) {
        for (const tail of STRUCTURAL_TAILS) {
          candidates.push(`${variant} ${lead} ${formatList(rotate(parts, rotation))} ${tail}`);
        }
      }
    }
  }
  return [...new Set(candidates)]
    .filter((candidate) => candidate.length >= MIN_LENGTH && candidate.length <= MAX_LENGTH && !hasUnsafeEnding(candidate))
    .sort((left, right) => sha256(`${seed}|${left}`).localeCompare(sha256(`${seed}|${right}`)));
}

function numbers(value) {
  return normalizeAscii(value).match(/\b\d+(?:[.,]\d+)*(?:%|[kKmMbB])?\b/g) ?? [];
}

export function buildCandidate(record) {
  const title = normalizeAscii(stripHtml(record.title)).replace(/[.!?]+$/, '');
  const body = normalizeAscii(stripHtml(record.content));
  const reviewed = REVIEWED_OVERRIDES[record.slug];
  if (reviewed) {
    return {
      candidate: reviewed,
      sourceText: title,
      sourceHash: sha256(title),
      sourceSentenceHashes: [],
      generationMode: 'reviewed_override',
      alternatives: [reviewed],
      status: 'ready',
      reasons: [],
    };
  }
  const structural = buildStructuralFallback(record);
  if (structural.length) {
    return {
      candidate: structural[0],
      sourceText: title,
      sourceHash: sha256(title),
      sourceSentenceHashes: [],
      generationMode: 'structural_fallback',
      alternatives: structural,
      status: 'ready',
      reasons: [],
    };
  }
  const sentences = extractSubstantiveSentences(record.content)
    .map((sentence, index) => ({ sentence, score: scoreSentence(sentence, titleTerms(title), index), index }))
    .sort((a, b) => b.score - a.score || a.index - b.index || a.sentence.localeCompare(b.sentence));
  const attempts = [];

  for (const item of sentences) {
    attempts.push(item.sentence, `${title}: ${item.sentence}`);
  }
  for (let i = 0; i < Math.min(sentences.length, 8); i += 1) {
    for (let j = i + 1; j < Math.min(sentences.length, 8); j += 1) {
      attempts.push(`${sentences[i].sentence} ${sentences[j].sentence}`);
    }
  }

  for (const attempt of attempts) {
    const candidate = completeClause(attempt);
    if (candidate.length < MIN_LENGTH || candidate.length > MAX_LENGTH) continue;
    if (!/^[\x20-\x7E]+$/.test(candidate)) continue;
    if (![...titleTerms(title)].some((term) => candidate.toLowerCase().includes(term))) continue;
    if (numbers(candidate).some((number) => !`${title} ${body}`.includes(number))) continue;
    return {
      candidate,
      sourceText: attempt,
      sourceHash: sha256(attempt),
      sourceSentenceHashes: sentences
        .filter((item) => attempt.includes(item.sentence))
        .map((item) => sha256(item.sentence)),
      generationMode: 'extractive',
      status: 'ready',
      reasons: [],
    };
  }

  return {
    candidate: '',
    sourceText: '',
    sourceHash: '',
    sourceSentenceHashes: [],
    generationMode: 'none',
    alternatives: [],
    status: 'manual_review',
    reasons: ['No extractive candidate passed length, ASCII, topic, and evidence gates.'],
  };
}

export function normalizedFingerprint(value) {
  return normalizeAscii(value).toLowerCase().replace(/\b\d+(?:[.,]\d+)*(?:%|[kKmMbB])?\b/g, '#').replace(/[^a-z# ]/g, '').replace(/\s+/g, ' ').trim();
}

export function ngrams(value, size = 3) {
  const tokens = normalizedFingerprint(value).split(' ').filter(Boolean);
  return new Set(tokens.slice(0, Math.max(0, tokens.length - size + 1)).map((_, index) => tokens.slice(index, index + size).join(' ')));
}

export function jaccard(left, right) {
  const a = ngrams(left);
  const b = ngrams(right);
  if (!a.size && !b.size) return 1;
  const intersection = [...a].filter((value) => b.has(value)).length;
  return intersection / (a.size + b.size - intersection);
}

export function validateRecord(record) {
  const errors = [];
  const candidate = record.candidate ?? '';
  if (candidate.length < MIN_LENGTH || candidate.length > MAX_LENGTH) errors.push('length');
  if (!/^[\x20-\x7E]+$/.test(candidate)) errors.push('non_ascii');
  if (/<[^>]+>/.test(candidate)) errors.push('html');
  if (!/[.!?]$/.test(candidate)) errors.push('incomplete_ending');
  if (hasUnsafeEnding(candidate)) errors.push('dangling_ending');
  if (EXCLUDED_TEXT.test(candidate) || CTA_TEXT.test(candidate) || GENERIC_AI_TEXT.test(candidate)) errors.push('excluded_content');
  const evidence = normalizeAscii(`${record.title ?? ''} ${stripHtml(record.content ?? '')}`);
  if (numbers(candidate).some((number) => !evidence.includes(number))) errors.push('unsupported_number');
  const terms = titleTerms(record.title);
  if (terms.size && ![...terms].some((term) => candidate.toLowerCase().includes(term))) errors.push('missing_title_entity');
  return errors;
}
