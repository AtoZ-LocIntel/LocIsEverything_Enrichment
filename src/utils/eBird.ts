const EBIRD_BASE_URL = 'https://api.ebird.org/v2';
const EBIRD_TOKEN =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_EBIRD_API_TOKEN) ||
  'dkifcecl7ouq';

interface RequestOptions extends RequestInit {
  query?: Record<string, string | number | boolean | undefined>;
}

const buildHeaders = (headers?: HeadersInit): HeadersInit => ({
  'X-eBirdApiToken': EBIRD_TOKEN,
  ...(headers || {}),
});

const buildUrl = (path: string, query?: RequestOptions['query']): string => {
  const url = new URL(`${EBIRD_BASE_URL}${path}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
};

export const eBirdRequest = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const url = buildUrl(path, options.query);
  const response = await fetch(url, {
    ...options,
    headers: buildHeaders(options.headers),
  });

  if (!response.ok) {
    throw new Error(`eBird API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
};

export interface EBirdHotspot {
  locId: string;
  name: string;
  lat: number;
  lng: number;
  latestObsDt?: string;
  numSpeciesAllTime?: number;
  countryCode?: string;
  subnational1Code?: string;
  subnational2Code?: string;
  distanceMiles?: number;
}

export const fetchEBirdHotspots = async (
  lat: number,
  lon: number,
  distKm: number,
  maxResults = 50
): Promise<EBirdHotspot[]> => {
  const response = await eBirdRequest<EBirdHotspot[]>('/ref/hotspot/geo', {
    query: {
      lat,
      lng: lon,
      dist: distKm,
      fmt: 'json',
      back: 30,
    },
  });

  const hotspots = Array.isArray(response) ? response : [];

  return hotspots
    .map((spot) => ({
      ...spot,
      distanceMiles: spot.distanceMiles ?? undefined,
    }))
    .slice(0, maxResults);
};

export interface EBirdObservation {
  speciesCode: string;
  comName: string;
  sciName: string;
  obsDt: string;
  howMany?: number;
  locId: string;
  locName: string;
  lat: number;
  lng: number;
  obsId: string;
  checklistId?: string;
  subnational1Code?: string;
  subnational2Code?: string;
  countryCode?: string;
}

export const fetchEBirdRecentObservations = async (
  lat: number,
  lon: number,
  distKm: number,
  lookBackDays = 7
): Promise<EBirdObservation[]> => {
  const response = await eBirdRequest<EBirdObservation[]>(
    '/data/obs/geo/recent',
    {
      query: {
        lat,
        lng: lon,
        dist: distKm,
        back: Math.min(lookBackDays, 30),
        includeProvisional: false,
      },
    }
  );

  return Array.isArray(response) ? response : [];
};


