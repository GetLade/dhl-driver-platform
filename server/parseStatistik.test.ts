import { describe, it, expect } from 'vitest';
import { parseStatistik } from '../client/src/hooks/useGoogleSheets';

describe('parseStatistik', () => {
  it('should parse left section (Stop stats) correctly', () => {
    const data = [
      ['PUD Route', 'Målinger', 'Avg Meldt', 'Avg Total Stops', 'Avg SPORH', 'Avg Break minutes', '', 'Route', 'Avg twAdhDL', 'Avg earlyDL', 'Avg lateDL', 'Avg twAdhPU', 'Avg earlyPU'],
      ['A11A', '1', '1', '25', '27', '4.22', '', 'A11A', '97.87', '2.13', '0', '69.23', '30.77'],
    ];
    
    const result = parseStatistik(data);
    
    expect(result).toHaveLength(1);
    expect(result[0].route).toBe('A11A');
    expect(result[0].avgMeldt).toBe(1);
    expect(result[0].avgTotalStops).toBe(25);
    expect(result[0].avgSporh).toBe(27);
    expect(result[0].avgBreakMinutes).toBe(4.22);
    expect(result[0].avgTwAdhDL).toBe(97.87);
  });

  it('should handle empty cells gracefully', () => {
    const data = [
      ['PUD Route', 'Målinger', 'Avg Meldt', 'Avg Total Stops', 'Avg SPORH', 'Avg Break minutes', '', 'Route', 'Avg twAdhDL', 'Avg earlyDL', 'Avg lateDL', 'Avg twAdhPU', 'Avg earlyPU'],
      ['A11A', '1', '1', '25', '27', '4.22', '', 'A11A', '97.87', '2.13', '0', '69.23', '30.77'],
      ['', '', '', '', '', '', '', '', '', '', '', '', ''],
    ];
    
    const result = parseStatistik(data);
    
    expect(result).toHaveLength(1);
  });

  it('should return empty array for null data', () => {
    const result = parseStatistik(null);
    expect(result).toEqual([]);
  });
});
