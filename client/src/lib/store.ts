// DHL Driver Platform – Data Store
// All data is stored in localStorage for persistence without code changes.
// Design: Clean Logistics White – IBM Plex Sans/Mono, DHL Red/Yellow brand colors

export interface FlightData {
  eta: string; // HH:MM format
  etaDate: string; // YYYY-MM-DD
  cny: number;
  flyers: number;
  ulds: number;
  earlyUlds: number;
  ddTd: number;
  lastUpdated: string;
}

export interface RoutePerformance {
  id: string;
  route: string;
  deliveries: {
    onTime: number;
    early: number;
    late: number;
  };
  pickups: {
    onTime: number;
    early: number;
    late: number;
  };
}

export interface GTListItem {
  id: string;
  postalCode: string;
  address: string;
  packages: number;
  physWeight: number;
  volumeWeight: number;
}

const FLIGHT_KEY = "dhl_flight_data";
const ODIN_KEY = "dhl_odin_data";
const GT_KEY = "dhl_gt_data";

const defaultFlightData: FlightData = {
  eta: "14:35",
  etaDate: new Date().toISOString().split("T")[0],
  cny: 1247,
  flyers: 384,
  ulds: 12,
  earlyUlds: 3,
  ddTd: 5,
  lastUpdated: new Date().toISOString(),
};

const defaultOdinData: RoutePerformance[] = [
  { id: "1", route: "R01 – København N", deliveries: { onTime: 87, early: 5, late: 8 }, pickups: { onTime: 91, early: 4, late: 5 } },
  { id: "2", route: "R02 – Frederiksberg", deliveries: { onTime: 92, early: 3, late: 5 }, pickups: { onTime: 88, early: 6, late: 6 } },
  { id: "3", route: "R03 – Østerbro", deliveries: { onTime: 78, early: 8, late: 14 }, pickups: { onTime: 82, early: 7, late: 11 } },
  { id: "4", route: "R04 – Vesterbro", deliveries: { onTime: 95, early: 2, late: 3 }, pickups: { onTime: 94, early: 3, late: 3 } },
  { id: "5", route: "R05 – Nørrebro", deliveries: { onTime: 83, early: 4, late: 13 }, pickups: { onTime: 79, early: 9, late: 12 } },
  { id: "6", route: "R06 – Amager", deliveries: { onTime: 90, early: 4, late: 6 }, pickups: { onTime: 86, early: 5, late: 9 } },
  { id: "7", route: "R07 – Hellerup", deliveries: { onTime: 96, early: 2, late: 2 }, pickups: { onTime: 93, early: 4, late: 3 } },
  { id: "8", route: "R08 – Glostrup", deliveries: { onTime: 74, early: 9, late: 17 }, pickups: { onTime: 77, early: 8, late: 15 } },
];

const defaultGTData: GTListItem[] = [
  { id: "1", postalCode: "2100", address: "Østerbrogade 45, 2100 København Ø", packages: 12, physWeight: 48.5, volumeWeight: 52.0 },
  { id: "2", postalCode: "2200", address: "Nørrebrogade 112, 2200 København N", packages: 8, physWeight: 31.2, volumeWeight: 28.5 },
  { id: "3", postalCode: "2300", address: "Amagerbrogade 78, 2300 København S", packages: 15, physWeight: 67.8, volumeWeight: 71.2 },
  { id: "4", postalCode: "2400", address: "Bispebjerg Parkallé 12, 2400 København NV", packages: 6, physWeight: 22.4, volumeWeight: 19.8 },
  { id: "5", postalCode: "2500", address: "Valby Langgade 34, 2500 Valby", packages: 20, physWeight: 89.5, volumeWeight: 95.0 },
  { id: "6", postalCode: "2600", address: "Glostrup Stationsvej 5, 2600 Glostrup", packages: 9, physWeight: 38.1, volumeWeight: 35.6 },
  { id: "7", postalCode: "2630", address: "Taastrup Hovedgade 22, 2630 Taastrup", packages: 14, physWeight: 55.3, volumeWeight: 60.1 },
  { id: "8", postalCode: "2650", address: "Hvidovre Boulevard 88, 2650 Hvidovre", packages: 7, physWeight: 28.7, volumeWeight: 26.3 },
  { id: "9", postalCode: "2700", address: "Brønshøj Torv 3, 2700 Brønshøj", packages: 11, physWeight: 44.2, volumeWeight: 48.7 },
  { id: "10", postalCode: "2720", address: "Vanløse Allé 56, 2720 Vanløse", packages: 5, physWeight: 18.9, volumeWeight: 17.4 },
  { id: "11", postalCode: "2730", address: "Herlev Ringvej 14, 2730 Herlev", packages: 18, physWeight: 72.6, volumeWeight: 78.3 },
  { id: "12", postalCode: "2750", address: "Ballerup Byvej 101, 2750 Ballerup", packages: 23, physWeight: 95.1, volumeWeight: 102.4 },
  { id: "13", postalCode: "2800", address: "Lyngby Storcenter 4, 2800 Kongens Lyngby", packages: 10, physWeight: 41.5, volumeWeight: 39.2 },
  { id: "14", postalCode: "2860", address: "Søborg Hovedgade 67, 2860 Søborg", packages: 16, physWeight: 63.8, volumeWeight: 68.5 },
  { id: "15", postalCode: "2900", address: "Hellerup Strandvej 29, 2900 Hellerup", packages: 4, physWeight: 15.2, volumeWeight: 14.1 },
];

export function getFlightData(): FlightData {
  try {
    const stored = localStorage.getItem(FLIGHT_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return defaultFlightData;
}

export function saveFlightData(data: FlightData): void {
  data.lastUpdated = new Date().toISOString();
  localStorage.setItem(FLIGHT_KEY, JSON.stringify(data));
}

export function getOdinData(): RoutePerformance[] {
  try {
    const stored = localStorage.getItem(ODIN_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return defaultOdinData;
}

export function saveOdinData(data: RoutePerformance[]): void {
  localStorage.setItem(ODIN_KEY, JSON.stringify(data));
}

export function getGTData(): GTListItem[] {
  try {
    const stored = localStorage.getItem(GT_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return defaultGTData;
}

export function saveGTData(data: GTListItem[]): void {
  localStorage.setItem(GT_KEY, JSON.stringify(data));
}

export function resetAllData(): void {
  localStorage.removeItem(FLIGHT_KEY);
  localStorage.removeItem(ODIN_KEY);
  localStorage.removeItem(GT_KEY);
}
