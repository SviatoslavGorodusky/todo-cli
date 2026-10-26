import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ValidationError } from '../src/errors.js';
import {
  validateDue,
  validateId,
  validatePriority,
  validateTags,
  validateTitle,
} from '../src/validators.js';

test('validateTitle: обрізає пробіли по краях', () => {
  assert.equal(validateTitle('  Купити каву  '), 'Купити каву');
});

test('validateTitle: порожня назва і лише пробіли — ValidationError', () => {
  assert.throws(() => validateTitle(''), ValidationError);
  assert.throws(() => validateTitle('   '), ValidationError);
  assert.throws(() => validateTitle(undefined), ValidationError);
});

test('validateTitle: межа — 200 символів можна, 201 ні', () => {
  assert.equal(validateTitle('x'.repeat(200)).length, 200);
  assert.throws(() => validateTitle('x'.repeat(201)), /зараз: 201/);
});

test('validatePriority: приймає low/medium/high, відхиляє інше', () => {
  for (const p of ['low', 'medium', 'high']) {
    assert.equal(validatePriority(p), p);
  }
  assert.throws(() => validatePriority('urgent'), ValidationError);
});

test('validateDue: коректні дати, зокрема 29 лютого у високосному році', () => {
  assert.equal(validateDue('2026-11-02'), '2026-11-02');
  assert.equal(validateDue('2028-02-29'), '2028-02-29');
});

test('validateDue: неіснуючі дати та чужі формати відхиляються', () => {
  assert.throws(() => validateDue('2026-13-01'), ValidationError);
  assert.throws(() => validateDue('2026-02-30'), ValidationError);
  assert.throws(() => validateDue('2026-02-29'), ValidationError); // 2026 не високосний
  assert.throws(() => validateDue('01.11.2026'), ValidationError);
  assert.throws(() => validateDue(''), ValidationError);
});

test('validateId: приймає лише цілі додатні числа', () => {
  assert.equal(validateId('5'), 5);
  for (const bad of ['abc', '-1', '1.5', '0', '', ' 5 ', undefined]) {
    assert.throws(() => validateId(bad), ValidationError, `мало бути помилкою: ${bad}`);
  }
});

test('validateTags: прибирає #, нижній регістр, дублікати', () => {
  assert.deepEqual(validateTags(['#QA', 'qa', 'Home']), ['qa', 'home']);
  assert.throws(() => validateTags(['#']), ValidationError);
});
