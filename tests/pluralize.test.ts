import assert from 'node:assert/strict';
import { pluralizeUnit } from '../src/utils/formatters';

let passed = 0;
function check(name: string, fn: () => void) { fn(); passed++; console.log('  ok  ' + name); }

console.log('--- Pluralize tests ---');
check('box becomes boxes', () => assert.equal(pluralizeUnit('box', 15), 'boxes'));
check('kg stays kg', () => assert.equal(pluralizeUnit('kg', 5), 'kg'));
check('piece becomes pieces', () => assert.equal(pluralizeUnit('piece', 2), 'pieces'));
check('quantity 1 stays singular', () => assert.equal(pluralizeUnit('packet', 1), 'packet'));
check('liter becomes liters', () => assert.equal(pluralizeUnit('liter', 3), 'liters'));
console.log(`PLURALIZE TESTS: ${passed} PASSED`);
