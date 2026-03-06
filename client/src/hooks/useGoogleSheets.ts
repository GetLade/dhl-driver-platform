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

  // Check if current time is within polling window (05:00-09:00 CET)
  const isWithinPollingWindow = () => {
    const now = new Date();
    // Convert to CET (UTC+1, or UTC+2 during DST)
    const cetTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Copenhagen' }));
    const hour = cetTime.getHours();
    return hour >= 5 && hour < 9;
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
        // Poll every 5 minutes (300000 ms) during 05:00-09:00 CET
        interval = setInterval(fetchData, 5 * 60 * 1000);
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
