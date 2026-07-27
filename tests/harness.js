const tests = [];

export function test(name, fn) {
  tests.push({ name, fn });
}

export function assert(condition, message) {
  if (!condition) throw new Error(message || 'assertion failed');
}

export function assertEqual(actual, expected, message) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(`${message || 'not equal'} — expected ${e}, got ${a}`);
  }
}

export async function run(report) {
  let passed = 0;
  let failed = 0;
  for (const t of tests) {
    try {
      await t.fn();
      passed += 1;
      report(`PASS  ${t.name}`);
    } catch (error) {
      failed += 1;
      report(`FAIL  ${t.name}\n        ${error.message}`);
    }
  }
  report(`\n${passed} passed, ${failed} failed`);
  return failed;
}
