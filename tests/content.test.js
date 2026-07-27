import { readFileSync } from 'node:fs';
import { test, assert, assertEqual } from './harness.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('content: page declares English', () => {
  assert(/<html[^>]*\slang="en"/.test(html), 'html lang="en" missing');
});

test('content: exactly one h1', () => {
  const matches = html.match(/<h1[\s>]/g) || [];
  assertEqual(matches.length, 1, 'h1 count');
});

test('content: name is present', () => {
  assert(html.includes('Robin Elvius'), 'name missing');
});

test('content: every employer appears', () => {
  for (const employer of [
    'Guidelight',
    'Elvius Betongvaror',
    'Gimlit',
    'Lingon Mobil',
    'LupinusUF',
    'Uppsala Municipality',
  ]) {
    assert(html.includes(employer), `employer missing: ${employer}`);
  }
});

test('content: every school appears', () => {
  for (const school of [
    'Uppsala University',
    'Katedralskolan',
    'Luleå University of Technology',
    'Linköping University',
    'Stockholm University',
  ]) {
    assert(html.includes(school), `school missing: ${school}`);
  }
});

test('content: project is present', () => {
  assert(html.includes('Polymarket'), 'Polymarket missing');
  assert(html.includes('calibration'), 'calibration detail missing');
});

test('content: every skill name is in the markup, not injected by JS', () => {
  for (const skill of [
    'Python',
    'Git',
    'HTML',
    'CSS',
    'JavaScript',
    'LaTeX',
    'Microsoft 365',
    'Sales',
  ]) {
    assert(html.includes(skill), `skill missing: ${skill}`);
  }
});

test('content: languages are plain text, not a pullable', () => {
  assert(html.includes('Swedish and English'), 'languages missing');
});

test('content: contact links are real anchors', () => {
  assert(
    html.includes('mailto:robin.c.elvius@gmail.com'),
    'mailto link missing',
  );
  assert(
    html.includes('linkedin.com/in/robin-elvius-132368252'),
    'LinkedIn link missing',
  );
  assert(html.includes('CV__V_2_.pdf'), 'CV PDF link missing');
});

test('content: phone number appears nowhere in any format', () => {
  const digitsOnly = html.replace(/\D/g, '');
  assert(!digitsOnly.includes('46763069622'), 'international phone leaked');
  assert(!digitsOnly.includes('0763069622'), 'national phone leaked');
});

test('content: five cherries are placed', () => {
  const matches = html.match(/data-cherry-id="/g) || [];
  assertEqual(matches.length, 5, 'cherry count');
});

test('content: six experience doors', () => {
  const matches = html.match(/class="door"/g) || [];
  assertEqual(matches.length, 6, 'door count');
});

test('content: decorative sprites are hidden from assistive tech', () => {
  const uses = html.match(/<svg class="sprite[^"]*"[^>]*>/g) || [];
  assert(uses.length > 0, 'no sprites found to check');
  for (const tag of uses) {
    assert(tag.includes('aria-hidden="true"'), `sprite not aria-hidden: ${tag}`);
  }
});
