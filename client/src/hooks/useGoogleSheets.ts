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
        setData(result.values || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch Google Sheets data');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Poll every 5 seconds for updates
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [sheetName, range]);

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
    if (!row[1]) break; // Stop at empty rows
    
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
