import { useEffect, useState } from 'react';

const SHEETS_ID = '1uBSJKVFbh_h68Cr5cqhQ743CuAs1Yf63D38zfVYn_jw';
const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;

interface SheetData {
  values: string[][];
}

export function useGoogleSheets(sheetName: string, range: string = 'A:H') {
  const [data, setData] = useState<string[][] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDataHash, setLastDataHash] = useState<string>('');

  // Check if current time is within polling window based on weekday
  // Monday: 05:00-07:00, Tuesday-Friday: 07:00-09:00
  const isWithinPollingWindow = () => {
    const now = new Date();
    // Convert to CET (UTC+1, or UTC+2 during DST)
    const cetTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Copenhagen' }));
    const hour = cetTime.getHours();
    const dayOfWeek = cetTime.getDay(); // 0 = Sunday, 1 = Monday, 5 = Friday, 6 = Saturday
    
    // Monday (1): 05:00-07:00
    if (dayOfWeek === 1) {
      return hour >= 5 && hour < 7;
    }
    // Tuesday-Friday (2-5): 07:00-09:00
    if (dayOfWeek >= 2 && dayOfWeek <= 5) {
      return hour >= 7 && hour < 9;
    }
    // Saturday-Sunday: no polling
    return false;
  };

  // Simple hash function to detect data changes
  const hashData = (values: string[][]): string => {
    return JSON.stringify(values).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a; // Convert to 32bit integer
    }, 0).toString();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEETS_ID}/values/${sheetName}!${range}?key=${API_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Google Sheets API error: ${response.statusText}`);
        }
        
        const result: SheetData = await response.json();
        const newData = result.values || [];
        const newHash = hashData(newData);
        
        // Only update state if data has changed
        if (newHash !== lastDataHash) {
          setData(newData);
          setLastDataHash(newHash);
        }
        
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch Google Sheets data');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchData();

    // Set up polling interval based on time window
    let interval: NodeJS.Timeout | null = null;
    
    const setupPolling = () => {
      if (isWithinPollingWindow()) {
        // Poll every 30 minutes (1800000 ms) during polling window
        interval = setInterval(fetchData, 30 * 60 * 1000);
      } else {
        // No polling outside the window
        interval = null;
      }
    };

    setupPolling();

    // Check every minute if we need to start/stop polling based on time window
    const timeCheckInterval = setInterval(() => {
      setupPolling();
    }, 60 * 1000);

    return () => {
      if (interval) clearInterval(interval);
      clearInterval(timeCheckInterval);
    };
  }, [sheetName, range, lastDataHash]);

  return { data, loading, error };
}

// Parse DagensTal sheet
export function parseDagensTal(data: string[][] | null) {
  if (!data || data.length < 2) return null;
  
  const headers = data[0];
  const row = data[1]; // Get latest row
  
  return {
    date: row[0],
    eta: row[1],
    cny: parseInt(row[2]) || 0,
    flyers: parseInt(row[3]) || 0,
    total: parseInt(row[4]) || 0,
    ulds: parseInt(row[5]) || 0,
    earlyUlds: parseInt(row[6]) || 0,
    ddTd: parseInt(row[7]) || 0,
  };
}

// Parse ODIN sheet
export function parseOdin(data: string[][] | null) {
  if (!data || data.length < 2) return [];
  
  const routes = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[1]) break; // Stop at empty rows
    
    routes.push({
      date: row[0],
      route: row[1],
      twAdhLeveris: parseInt(row[2]) || 0,
      tidligLeveris: parseInt(row[3]) || 0,
      senLeveris: parseInt(row[4]) || 0,
      twAdhAfhent: parseInt(row[5]) || 0,
      tidligAfhent: parseInt(row[6]) || 0,
      senAfhent: parseInt(row[7]) || 0,
    });
  }
  
  return routes;
}

// Parse GTListe sheet
export function parseGTListe(data: string[][] | null) {
  if (!data || data.length < 2) return [];
  
  const packages = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    // Skip completely empty rows (all columns empty)
    if (!row || row.length === 0 || (row.length === 1 && !row[0])) continue;
    // Only skip if postnummer is empty
    if (!row[1]) continue;
    
    packages.push({
      date: row[0],
      postnummer: row[1],
      adresse: row[2],
      pakker: parseInt(row[3]) || 0,
      vaegt: parseFloat(row[4]) || 0,
      volumen: parseFloat(row[5]) || 0,
    });
  }
  
  return packages;
}

// Parse Stop sheet
export function parseStop(data: string[][] | null) {
  if (!data || data.length < 2) return [];
  
  const stops = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    // Skip completely empty rows
    if (!row || row.length === 0 || (row.length === 1 && !row[0])) continue;
    // Only skip if PUD Route is empty
    if (!row[1]) continue;
    
    stops.push({
      date: row[0],
      pudRoute: row[1],
      meldt: parseInt(row[2]) || 0,
      totalStops: parseInt(row[3]) || 0,
      sporh: parseInt(row[4]) || 0,
      breakMinutes: parseInt(row[5]) || 0,
      avgCourierArrivalTm: row[6] || '',
    });
  }
  
  return stops;
}

// Parse Statistik sheet - has two sections: Stop stats (A-F) and ODIN stats (G-M)
export function parseStatistik(data: string[][] | null) {
  if (!data || data.length < 2) return [];
  
  const statisticsMap = new Map();
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    
    // Left section: PUD Route (col 0), Målinger (col 1), Avg Meldt (col 2), Avg Total Stops (col 3), Avg SPORH (col 4), Avg Break minutes (col 5)
    const pudRoute = row[0]?.trim();
    if (pudRoute) {
      const avgMeldt = parseFloat(row[2]) || 0;
      const avgTotalStops = parseFloat(row[3]) || 0;
      const avgSporh = parseFloat(row[4]) || 0;
      const avgBreakMinutes = parseFloat(row[5]) || 0;
      
      if (!statisticsMap.has(pudRoute)) {
        statisticsMap.set(pudRoute, {
          route: pudRoute,
          avgMeldt,
          avgTotalStops,
          avgSporh,
          avgBreakMinutes,
          avgTwAdhDL: 0,
          avgEarlyDL: 0,
          avgLateDL: 0,
          avgTwAdhPU: 0,
          avgEarlyPU: 0,
        });
      } else {
        const existing = statisticsMap.get(pudRoute);
        existing.avgMeldt = avgMeldt;
        existing.avgTotalStops = avgTotalStops;
        existing.avgSporh = avgSporh;
        existing.avgBreakMinutes = avgBreakMinutes;
      }
    }
    
    // Right section: Route (col 7), Målinger (col 8), Avg twAdhDL (col 9), Avg earlyDL (col 10), Avg lateDL (col 11), Avg twAdhPU (col 12), Avg earlyPU (col 13)
    const route = row[7]?.trim();
    if (route) {
      const avgTwAdhDL = parseFloat(row[9]) || 0;
      const avgEarlyDL = parseFloat(row[10]) || 0;
      const avgLateDL = parseFloat(row[11]) || 0;
      const avgTwAdhPU = parseFloat(row[12]) || 0;
      const avgEarlyPU = parseFloat(row[13]) || 0;
      
      if (!statisticsMap.has(route)) {
        statisticsMap.set(route, {
          route,
          avgMeldt: 0,
          avgTotalStops: 0,
          avgSporh: 0,
          avgBreakMinutes: 0,
          avgTwAdhDL,
          avgEarlyDL,
          avgLateDL,
          avgTwAdhPU,
          avgEarlyPU,
        });
      } else {
        const existing = statisticsMap.get(route);
        existing.avgTwAdhDL = avgTwAdhDL;
        existing.avgEarlyDL = avgEarlyDL;
        existing.avgLateDL = avgLateDL;
        existing.avgTwAdhPU = avgTwAdhPU;
        existing.avgEarlyPU = avgEarlyPU;
      }
    }
  }
  
  return Array.from(statisticsMap.values());
}
