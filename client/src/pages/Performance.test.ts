import { describe, it, expect } from 'vitest';
import { parseOdin, parseStop } from '@/hooks/useGoogleSheets';

describe('Performance Page - Data Combination', () => {
  describe('parseOdin', () => {
    it('should parse ODIN data correctly', () => {
      const data = [
        ['Dato', 'Rute', 'TW Adh Leveris', 'Tidlig Leveris', 'Sen Leveris', 'TW Adh Afhent', 'Tidlig Afhent', 'Sen Afhent'],
        ['2026-03-06', 'A11A', '97', '2', '0', '69', '30', '0'],
      ];
      
      const result = parseOdin(data);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        date: '2026-03-06',
        route: 'A11A',
        twAdhLeveris: 97,
        tidligLeveris: 2,
        senLeveris: 0,
        twAdhAfhent: 69,
        tidligAfhent: 30,
        senAfhent: 0,
      });
    });

    it('should handle empty ODIN data', () => {
      const result = parseOdin(null);
      expect(result).toEqual([]);
    });

    it('should skip empty rows in ODIN data', () => {
      const data = [
        ['Dato', 'Rute', 'TW Adh Leveris', 'Tidlig Leveris', 'Sen Leveris', 'TW Adh Afhent', 'Tidlig Afhent', 'Sen Afhent'],
        ['2026-03-06', 'A11A', '97', '2', '0', '69', '30', '0'],
        ['', '', '', '', '', '', '', ''],
      ];
      
      const result = parseOdin(data);
      expect(result).toHaveLength(1);
    });
  });

  describe('parseStop', () => {
    it('should parse Stop data correctly', () => {
      const data = [
        ['Dato', 'PUD Route', 'Meldt', 'Total Stops', 'SPORH', 'Break minutes', 'Avg Courier Arrival Tm'],
        ['2026-03-06', 'A11A', '25', '27', '4', '0', '17:16'],
      ];
      
      const result = parseStop(data);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        date: '2026-03-06',
        pudRoute: 'A11A',
        meldt: 25,
        totalStops: 27,
        sporh: 4,
        breakMinutes: 0,
        avgCourierArrivalTm: '17:16',
      });
    });

    it('should handle empty Stop data', () => {
      const result = parseStop(null);
      expect(result).toEqual([]);
    });

    it('should skip empty rows in Stop data', () => {
      const data = [
        ['Dato', 'PUD Route', 'Meldt', 'Total Stops', 'SPORH', 'Break minutes', 'Avg Courier Arrival Tm'],
        ['2026-03-06', 'A11A', '25', '27', '4', '0', '17:16'],
        ['', '', '', '', '', '', ''],
      ];
      
      const result = parseStop(data);
      expect(result).toHaveLength(1);
    });

    it('should handle missing numeric values in Stop data', () => {
      const data = [
        ['Dato', 'PUD Route', 'Meldt', 'Total Stops', 'SPORH', 'Break minutes', 'Avg Courier Arrival Tm'],
        ['2026-03-06', 'A11A', '', '', '', '', '17:16'],
      ];
      
      const result = parseStop(data);
      
      expect(result).toHaveLength(1);
      expect(result[0].meldt).toBe(0);
      expect(result[0].totalStops).toBe(0);
      expect(result[0].sporh).toBe(0);
      expect(result[0].breakMinutes).toBe(0);
      expect(result[0].avgCourierArrivalTm).toBe('17:16');
    });
  });

  describe('Data Combination Scenarios', () => {
    it('should handle routes with both ODIN and Stop data', () => {
      const odinData = [
        ['Dato', 'Rute', 'TW Adh Leveris', 'Tidlig Leveris', 'Sen Leveris', 'TW Adh Afhent', 'Tidlig Afhent', 'Sen Afhent'],
        ['2026-03-06', 'A11A', '97', '2', '0', '69', '30', '0'],
      ];
      
      const stopData = [
        ['Dato', 'PUD Route', 'Meldt', 'Total Stops', 'SPORH', 'Break minutes', 'Avg Courier Arrival Tm'],
        ['2026-03-06', 'A11A', '25', '27', '4', '0', '17:16'],
      ];
      
      const odinRoutes = parseOdin(odinData);
      const stops = parseStop(stopData);
      
      expect(odinRoutes).toHaveLength(1);
      expect(stops).toHaveLength(1);
      expect(odinRoutes[0].route).toBe(stops[0].pudRoute);
    });

    it('should handle routes with only ODIN data', () => {
      const odinData = [
        ['Dato', 'Rute', 'TW Adh Leveris', 'Tidlig Leveris', 'Sen Leveris', 'TW Adh Afhent', 'Tidlig Afhent', 'Sen Afhent'],
        ['2026-03-06', 'A11B', '72', '0', '27', '90', '0', '10'],
      ];
      
      const stopData = [
        ['Dato', 'PUD Route', 'Meldt', 'Total Stops', 'SPORH', 'Break minutes', 'Avg Courier Arrival Tm'],
      ];
      
      const odinRoutes = parseOdin(odinData);
      const stops = parseStop(stopData);
      
      expect(odinRoutes).toHaveLength(1);
      expect(stops).toHaveLength(0);
    });

    it('should handle routes with only Stop data', () => {
      const odinData = [
        ['Dato', 'Rute', 'TW Adh Leveris', 'Tidlig Leveris', 'Sen Leveris', 'TW Adh Afhent', 'Tidlig Afhent', 'Sen Afhent'],
      ];
      
      const stopData = [
        ['Dato', 'PUD Route', 'Meldt', 'Total Stops', 'SPORH', 'Break minutes', 'Avg Courier Arrival Tm'],
        ['2026-03-06', 'A81G', '51', '70', '11', '31', '17:11'],
      ];
      
      const odinRoutes = parseOdin(odinData);
      const stops = parseStop(stopData);
      
      expect(odinRoutes).toHaveLength(0);
      expect(stops).toHaveLength(1);
    });
  });
});
