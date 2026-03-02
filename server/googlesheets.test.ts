import { describe, expect, it } from "vitest";

describe("Google Sheets API Integration", () => {
  const SHEETS_ID = "1uBSJKVFbh_h68Cr5cqhQ743CuAs1Yf63D38zfVYn_jw";
  const API_KEY = process.env.VITE_GOOGLE_SHEETS_API_KEY;

  it("should have Google Sheets API key configured", () => {
    expect(API_KEY).toBeDefined();
    expect(API_KEY).toMatch(/^AIza/); // Google API keys start with AIza
  });

  it("should fetch data from DagensTal sheet", async () => {
    if (!API_KEY) {
      console.warn("Skipping API test - no API key configured");
      return;
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEETS_ID}/values/DagensTal!A:H?key=${API_KEY}`;
    const response = await fetch(url);
    
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.values).toBeDefined();
    expect(data.values.length).toBeGreaterThan(0);
    expect(data.values[0]).toContain("Dato"); // Check header
  });

  it("should fetch data from Odin sheet", async () => {
    if (!API_KEY) {
      console.warn("Skipping API test - no API key configured");
      return;
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEETS_ID}/values/Odin!A:H?key=${API_KEY}`;
    const response = await fetch(url);
    
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.values).toBeDefined();
    expect(data.values[0]).toContain("Rute"); // Check header
  });

  it("should fetch data from GTListe sheet", async () => {
    if (!API_KEY) {
      console.warn("Skipping API test - no API key configured");
      return;
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEETS_ID}/values/GTListe!A:F?key=${API_KEY}`;
    const response = await fetch(url);
    
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.values).toBeDefined();
    expect(data.values[0]).toContain("Postnummer"); // Check header
  });
});
