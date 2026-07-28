import assert from 'node:assert/strict';
import test from 'node:test';
import { parseHospital, parseHospitals } from '../src/utils/medicalValidation.ts';

const validHospital = {
  id: 'hospital-1',
  name: '<img src=x onerror=alert(1)>',
  address: '서울시',
  tel: '02-000-0000',
  lat: '37.5',
  lng: '127.0',
  fee: '20,000원',
  tips: '',
  tags: ['이비인후과'],
  lastUpdated: '2026-07',
  status: 'active',
  reviews: []
};

test('normalizes valid hospital coordinates without interpreting text as markup', () => {
  const hospital = parseHospital(validHospital);
  assert.equal(hospital?.lat, 37.5);
  assert.equal(hospital?.lng, 127);
  assert.equal(hospital?.name, '<img src=x onerror=alert(1)>');
});

test('rejects hospitals missing identity, address, or finite coordinates', () => {
  assert.equal(parseHospital({ ...validHospital, id: '' }), null);
  assert.equal(parseHospital({ ...validHospital, address: '' }), null);
  assert.equal(parseHospital({ ...validHospital, lat: 'not-a-number' }), null);
});

test('rejects malformed collection responses and all-invalid non-empty feeds', () => {
  assert.throws(() => parseHospitals({}), /응답 형식/);
  assert.throws(() => parseHospitals([{ name: 'invalid' }]), /유효한 데이터/);
});

test('drops malformed reviews while preserving valid reviews', () => {
  const hospitals = parseHospitals([{
    ...validHospital,
    reviews: [
      { author: 'diver', date: '2026-07-28', content: 'ok', isSuccess: true },
      { author: '', content: 'invalid' }
    ]
  }]);
  assert.equal(hospitals[0].reviews.length, 1);
});
