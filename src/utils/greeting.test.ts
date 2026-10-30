import { test, describe } from 'node:test';
import assert from 'node:assert';
import { getTimeGreeting } from './greeting.ts';

describe('getTimeGreeting unit tests', () => {
  test('Morning greeting for male user at 8:00 AM', () => {
    const morningDate = new Date(2025, 0, 1, 8, 0, 0);
    const result = getTimeGreeting('أحمد', 'male', morningDate, 'ar');
    assert.strictEqual(result.period, 'morning');
    assert.ok(result.greeting.includes('صباح الخير يا أحمد'));
    assert.strictEqual(result.salutation, 'عزيزي أحمد');
  });

  test('Morning greeting for female user at 9:30 AM', () => {
    const morningDate = new Date(2025, 0, 1, 9, 30, 0);
    const result = getTimeGreeting('فاطمة', 'female', morningDate, 'ar');
    assert.strictEqual(result.period, 'morning');
    assert.ok(result.greeting.includes('صباح الخير يا فاطمة'));
    assert.strictEqual(result.salutation, 'عزيزتي فاطمة');
    assert.ok(result.subGreeting.includes('صباحكِ'));
  });

  test('Afternoon greeting at 14:00 PM', () => {
    const afternoonDate = new Date(2025, 0, 1, 14, 0, 0);
    const result = getTimeGreeting('سارة', 'female', afternoonDate, 'ar');
    assert.strictEqual(result.period, 'afternoon');
    assert.ok(result.greeting.includes('نهارك سعيد وموسيقي يا سارة'));
    assert.strictEqual(result.salutation, 'عزيزتي سارة');
  });

  test('Evening greeting at 20:00 PM', () => {
    const eveningDate = new Date(2025, 0, 1, 20, 0, 0);
    const result = getTimeGreeting('عمر', 'male', eveningDate, 'ar');
    assert.strictEqual(result.period, 'evening');
    assert.ok(result.greeting.includes('مساء الخير والطرب يا عمر'));
    assert.strictEqual(result.salutation, 'عزيزي عمر');
  });

  test('Late night greeting at 2:00 AM', () => {
    const nightDate = new Date(2025, 0, 1, 2, 0, 0);
    const result = getTimeGreeting('يوسف', 'male', nightDate, 'ar');
    assert.strictEqual(result.period, 'night');
    assert.ok(result.greeting.includes('طابت ليلتك الهادئة يا يوسف'));
    assert.strictEqual(result.salutation, 'عزيزي يوسف');
  });

  test('English greeting fallback works properly', () => {
    const date = new Date(2025, 0, 1, 19, 0, 0);
    const result = getTimeGreeting('Adam', 'male', date, 'en');
    assert.strictEqual(result.period, 'evening');
    assert.strictEqual(result.greeting, 'Good Evening, Adam! 🌙');
    assert.strictEqual(result.salutation, 'Dear Adam');
  });
});
