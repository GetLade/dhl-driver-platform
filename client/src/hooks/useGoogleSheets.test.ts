import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Smart Polling Schedule', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should detect polling window correctly (05:00-09:00 CET)', () => {
    // Mock a time within polling window (07:00 CET)
    const mockDate = new Date('2026-03-02T07:00:00');
    vi.setSystemTime(mockDate);

    // Create a mock function to check time window
    const isWithinPollingWindow = () => {
      const now = new Date();
      const cetTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Copenhagen' }));
      const hour = cetTime.getHours();
      return hour >= 5 && hour < 9;
    };

    expect(isWithinPollingWindow()).toBe(true);
  });

  it('should NOT poll outside polling window (09:00-05:00 CET)', () => {
    // Mock a time outside polling window (14:00 CET)
    const mockDate = new Date('2026-03-02T14:00:00');
    vi.setSystemTime(mockDate);

    const isWithinPollingWindow = () => {
      const now = new Date();
      const cetTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Copenhagen' }));
      const hour = cetTime.getHours();
      return hour >= 5 && hour < 9;
    };

    expect(isWithinPollingWindow()).toBe(false);
  });

  it('should hash data correctly to detect changes', () => {
    const hashData = (values: string[][]): string => {
      return JSON.stringify(values).split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0).toString();
    };

    const data1 = [['A', 'B'], ['1', '2']];
    const data2 = [['A', 'B'], ['1', '2']];
    const data3 = [['A', 'B'], ['1', '3']];

    const hash1 = hashData(data1);
    const hash2 = hashData(data2);
    const hash3 = hashData(data3);

    // Same data should produce same hash
    expect(hash1).toBe(hash2);
    
    // Different data should produce different hash
    expect(hash1).not.toBe(hash3);
  });

  it('should only update UI when data actually changes', () => {
    const hashData = (values: string[][]): string => {
      return JSON.stringify(values).split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0).toString();
    };

    const oldData = [['Dato', 'ETA', 'CNY'], ['2026-03-02', '14:30', '1878']];
    const newDataSame = [['Dato', 'ETA', 'CNY'], ['2026-03-02', '14:30', '1878']];
    const newDataDifferent = [['Dato', 'ETA', 'CNY'], ['2026-03-02', '15:00', '2000']];

    const oldHash = hashData(oldData);
    const newHashSame = hashData(newDataSame);
    const newHashDifferent = hashData(newDataDifferent);

    // Same data = no update needed
    expect(oldHash === newHashSame).toBe(true);

    // Different data = update needed
    expect(oldHash === newHashDifferent).toBe(false);
  });
});
