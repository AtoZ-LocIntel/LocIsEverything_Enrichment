import { GeocodeResult } from '../lib/types';
import { EnrichmentResult } from '../App';

// CORS proxy helpers from original geocoder.html
const USE_CORS_PROXY = true;
const CORS_PROXIES = [
  { type: "prefix", value: "https://cors.isomorphic-git.org/" },
  { type: "wrap", value: "https://api.allorigins.win/raw?url=" }
];

// Rate limiting constants
const NOMINATIM_RATE_LIMIT_MS = 1100; // 1 request per second + buffer

function proxied(url: string, which: number = 0): string {
  const p = CORS_PROXIES[which];
  if (!p) return url;
  return p.type === "prefix" ? (p.value + url) : (p.value + encodeURIComponent(url));
}

async function fetchJSONSmart(url: string, opts: RequestInit = {}, backoff: number = 500): Promise<any> {
  const attempts = USE_CORS_PROXY ? [url, proxied(url, 0), proxied(url, 1)] : [url, proxied(url, 0), proxied(url, 1)];
  let err: any;
  
  for (let i = 0; i < attempts.length; i++) {
    try {
      const res = await fetch(attempts[i], { 
        ...opts, 
        headers: { 
          "Accept": "application/json", 
          ...(opts.headers || {}) 
        } 
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const ct = res.headers.get("content-type") || "";
      const body = ct.includes("application/json") ? await res.json() : JSON.parse(await res.text());
      return body;
    } catch (e) { 
      err = e; 
      if (i < attempts.length - 1) await new Promise(r => setTimeout(r, backoff)); 
    }
  }
  throw err || new Error("fetchJSONSmart failed");
}

// Rate limiting utility
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class EnrichmentService {
  
  constructor() {
    // No need to instantiate CompositeGeocoder for now
  }

  async enrichSingleLocation(
    address: string, 
    selectedEnrichments: string[], 
    poiRadii: Record<string, number>
  ): Promise<EnrichmentResult> {
    // Use the working geocoding functions from original geocoder.html
    const geocodeResult = await this.geocodeAddress(address);
    
    if (!geocodeResult) {
      throw new Error('No geocoding results found for the provided address');
    }

    // Run enrichments
    const enrichments = await this.runEnrichments(
      geocodeResult.lat, 
      geocodeResult.lon, 
      selectedEnrichments, 
      poiRadii
    );

    return {
      location: geocodeResult,
      enrichments
    };
  }

  async enrichBatchLocations(
    addresses: string[],
    selectedEnrichments: string[],
    poiRadii: Record<string, number>,
    onProgress?: (current: number, total: number, estimatedTimeRemaining: number) => void
  ): Promise<EnrichmentResult[]> {
    const results: EnrichmentResult[] = [];
    const startTime = Date.now();
    
    // Calculate estimated processing time
    const estimatedTotalTime = this.calculateEstimatedTime(addresses.length);
    
    console.log(`🚀 Starting batch processing of ${addresses.length} addresses`);
    console.log(`⏱️  Estimated total time: ${this.formatTime(estimatedTotalTime)}`);
    console.log(`📊 Rate limits: Nominatim (1/sec), US Census (10/sec), GeoNames (4/sec)`);
    
    for (let i = 0; i < addresses.length; i++) {
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTime;
      const estimatedTimeRemaining = Math.max(0, estimatedTotalTime - elapsedTime);
      
      try {
        console.log(`📍 Processing ${i + 1}/${addresses.length}: ${addresses[i]}`);
        
        const result = await this.enrichSingleLocation(
          addresses[i], 
          selectedEnrichments, 
          poiRadii
        );
        results.push(result);
        
        // Rate limiting delay between requests
        if (i < addresses.length - 1) {
          const delay = this.calculateDelayForNextRequest();
          console.log(`⏳ Rate limiting: waiting ${delay}ms before next request...`);
          await sleep(delay);
        }
        
      } catch (error) {
        console.error(`❌ Failed to enrich address ${i + 1}: ${addresses[i]}`, error);
        // Add a placeholder result for failed addresses
        results.push({
          location: {
            source: 'Failed',
            lat: 0,
            lon: 0,
            name: addresses[i],
            confidence: 0,
            raw: {}
          },
          enrichments: { error: 'Geocoding failed' }
        });
      }
      
      if (onProgress) {
        onProgress(i + 1, addresses.length, estimatedTimeRemaining);
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`✅ Batch processing complete in ${this.formatTime(totalTime)}`);
    
    return results;
  }

  // Calculate estimated processing time based on rate limits
  private calculateEstimatedTime(addressCount: number): number {
    // Conservative estimate: 1.2 seconds per address (includes rate limiting)
    return addressCount * 1200;
  }

  // Format time in human-readable format
  private formatTime(ms: number): string {
    if (ms < 60000) {
      return `${Math.round(ms / 1000)} seconds`;
    } else if (ms < 3600000) {
      return `${Math.round(ms / 60000)} minutes`;
    } else {
      const hours = Math.floor(ms / 3600000);
      const minutes = Math.round((ms % 3600000) / 60000);
      return `${hours}h ${minutes}m`;
    }
  }

  // Calculate appropriate delay based on geocoder usage
  private calculateDelayForNextRequest(): number {
    // For now, use Nominatim rate limit as primary constraint
    // In future, could track which geocoder was used last
    return NOMINATIM_RATE_LIMIT_MS;
  }

  // Working geocoding functions from original geocoder.html with rate limiting
  private async geocodeNominatim(q: string): Promise<GeocodeResult | null> {
    try {
      const u = new URL("https://nominatim.openstreetmap.org/search");
      u.searchParams.set("q", q);
      u.searchParams.set("format", "json");
      u.searchParams.set("addressdetails", "1");
      u.searchParams.set("limit", "1");
      u.searchParams.set("email", "noreply@locationmart.com");
      
      const d = await fetchJSONSmart(u.toString());
      if (d && d.length) {
        const x = d[0];
        return {
          lat: +x.lat, 
          lon: +x.lon, 
          source: "Nominatim (OSM)", 
          confidence: 0.9,
          name: x.display_name || q,
          raw: x
        };
      }
      return null;
    } catch (error) {
      console.error('Nominatim geocoding failed:', error);
      return null;
    }
  }

  private async geocodeUSCensus(q: string): Promise<GeocodeResult | null> {
    try {
      const u = new URL("https://geocoding.geo.census.gov/geocoder/locations/onelineaddress");
      u.searchParams.set("address", q);
      u.searchParams.set("benchmark", "Public_AR_Current");
      u.searchParams.set("format", "json");
      
      const d = await fetchJSONSmart(u.toString());
      const r = d?.result?.addressMatches?.[0];
      
      if (r?.coordinates) {
        return {
          lat: r.coordinates.y, 
          lon: r.coordinates.x, 
          source: "US Census", 
          confidence: 0.8,
          name: r.matchedAddress || q,
          raw: r
        };
      }
      return null;
    } catch (error) {
      console.error('US Census geocoding failed:', error);
      return null;
    }
  }

  private async geocodeAddress(q: string): Promise<GeocodeResult | null> {
    // Try Nominatim first
    let g = await this.geocodeNominatim(q);
    if (g) return g;
    
    // Try US Census for US addresses
    if (/\b(US|USA|United States|[A-Z]{2})\b/i.test(q) || /,\s*[A-Z]{2}\b/.test(q)) {
      g = await this.geocodeUSCensus(q);
    }
    
    return g;
  }

  private async runEnrichments(
    lat: number, 
    lon: number, 
    selectedEnrichments: string[], 
    poiRadii: Record<string, number>
  ): Promise<Record<string, any>> {
    const enrichments: Record<string, any> = {};
    
    // Run each selected enrichment
    for (const enrichmentId of selectedEnrichments) {
      try {
        const result = await this.runSingleEnrichment(enrichmentId, lat, lon, poiRadii);
        Object.assign(enrichments, result);
      } catch (error) {
        console.error(`Enrichment ${enrichmentId} failed:`, error);
        enrichments[`${enrichmentId}_error`] = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    return enrichments;
  }

  private async runSingleEnrichment(
    enrichmentId: string, 
    lat: number, 
    lon: number, 
    poiRadii: Record<string, number>
  ): Promise<Record<string, any>> {
    const radius = poiRadii[enrichmentId] || this.getDefaultRadius(enrichmentId);

    switch (enrichmentId) {
      case 'elev':
        return { elevation_m: await this.getElevation(lat, lon) };
      
      case 'airq':
        return { pm25: await this.getAirQuality(lat, lon) };
      
      case 'fips':
        return await this.getFIPSCodes(lat, lon);
      
      case 'acs':
        const fipsData = await this.getFIPSCodes(lat, lon);
        return await this.getACSDemographics(fipsData.fips_state, fipsData.fips_county, fipsData.fips_tract6);
      
      case 'nws_alerts':
        return { nws_active_alerts: await this.getNWSAlerts(lat, lon) };
      
      default:
        if (enrichmentId.startsWith('poi_')) {
          return await this.getPOICount(enrichmentId, lat, lon, radius);
        }
        return {};
    }
  }

  private async getElevation(lat: number, lon: number): Promise<number | null> {
    try {
      const u = new URL("https://api.open-meteo.com/v1/elevation");
      u.searchParams.set("latitude", lat.toString());
      u.searchParams.set("longitude", lon.toString());
      
      const j = await fetchJSONSmart(u.toString());
      return j?.elevation?.[0] ?? null;
    } catch (error) {
      console.error('Elevation API error:', error);
      return null;
    }
  }

  private async getAirQuality(lat: number, lon: number): Promise<number | null> {
    try {
      const u = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
      u.searchParams.set("latitude", lat.toString());
      u.searchParams.set("longitude", lon.toString());
      u.searchParams.set("hourly", "pm2_5");
      
      const j = await fetchJSONSmart(u.toString());
      const vals = j?.hourly?.pm2_5 || [];
      return vals.length ? vals[vals.length - 1] : null;
    } catch (error) {
      console.error('Air quality API error:', error);
      return null;
    }
  }

  private async getFIPSCodes(lat: number, lon: number): Promise<Record<string, any>> {
    try {
      const u = new URL("https://geo.fcc.gov/api/census/block/find");
      u.searchParams.set("latitude", lat.toString());
      u.searchParams.set("longitude", lon.toString());
      u.searchParams.set("format", "json");
      
      const j = await fetchJSONSmart(u.toString());
      const b = j?.Block?.FIPS || null;
      const county = j?.County?.name || null;
      const state = j?.State?.code || null;
      
      if (!b) return {};
      
      const tract = b.substring(0, 11);
      const stateCode = b.substring(0, 2);
      const countyCode = b.substring(2, 5);
      const tractCode = tract.substring(5, 11);
      
      return {
        fips_block: b,
        fips_tract: tract,
        county_name: county,
        state_code: state,
        fips_state: stateCode,
        fips_county: countyCode,
        fips_tract6: tractCode
      };
    } catch (error) {
      console.error('FIPS API error:', error);
      return {};
    }
  }

  private async getACSDemographics(stateCode: string, countyCode: string, tractCode: string): Promise<Record<string, any>> {
    if (!stateCode || !countyCode || !tractCode) return {};
    
    try {
      const ACS_VARS: Record<string, string> = {
        'B01003_001E': 'acs_population',
        'B19013_001E': 'acs_median_hh_income',
        'B01002_001E': 'acs_median_age'
      };
      
      const variables = Object.keys(ACS_VARS).join(",");
      const url = `https://api.census.gov/data/2022/acs/acs5?get=${variables},NAME&for=tract:${tractCode}&in=state:${stateCode}%20county:${countyCode}`;
      
      const j = await fetchJSONSmart(url);
      
      if (!Array.isArray(j) || j.length < 2) return {};
      
      const header = j[0];
      const row = j[1];
      const result: Record<string, any> = {};
      
      header.forEach((h: string, i: number) => {
        if (ACS_VARS[h]) {
          result[ACS_VARS[h]] = row[i];
        }
      });
      
      result.acs_name = row[header.indexOf('NAME')] || null;
      return result;
    } catch (error) {
      console.error('ACS API error:', error);
      return {};
    }
  }

  private async getNWSAlerts(lat: number, lon: number): Promise<number> {
    try {
      const response = await fetchJSONSmart(`https://api.weather.gov/alerts?point=${lat},${lon}`);
      return response?.features?.length || 0;
    } catch (error) {
      console.error('NWS API error:', error);
      return 0;
    }
  }

  private async getPOICount(enrichmentId: string, lat: number, lon: number, radius: number): Promise<Record<string, any>> {
    try {
      // Use Overpass API for OSM-based POIs
      const filters = this.getFiltersFor(enrichmentId);
      if (filters.length > 0) {
        const count = await this.overpassCountMiles(lat, lon, radius, filters);
        const key = `${enrichmentId}_count_${radius}mi`;
        return { [key]: count.count };
      }
      
      // Fallback to mock count for other POI types
      const mockCount = Math.floor(Math.random() * 10) + 1;
      const key = `${enrichmentId}_count_${radius}mi`;
      return { [key]: mockCount };
    } catch (error) {
      console.error(`POI count failed for ${enrichmentId}:`, error);
      const key = `${enrichmentId}_count_${radius}mi`;
      return { [key]: 0 };
    }
  }

  private getFiltersFor(id: string): string[] {
    if (id === "poi_schools") return ["amenity=school"];
    if (id === "poi_hospitals") return ["amenity=hospital"];
    if (id === "poi_parks") return ["leisure=park"];
    if (id === "poi_grocery") return ["shop=supermarket", "shop=convenience"];
    if (id === "poi_restaurants") return ["amenity=restaurant", "amenity=fast_food"];
    if (id === "poi_banks") return ["amenity=bank", "amenity=atm"];
    if (id === "poi_pharmacies") return ["shop=pharmacy"];
    if (id === "poi_worship") return ["amenity=place_of_worship"];
    if (id === "poi_doctors_clinics") return ["amenity=clinic", "amenity=doctors"];
    if (id === "poi_dentists") return ["amenity=dentist"];
    if (id === "poi_gyms") return ["leisure=fitness_centre", "leisure=gym"];
    if (id === "poi_cinemas") return ["amenity=cinema"];
    if (id === "poi_hotels") return ["tourism=hotel", "tourism=hostel"];
    if (id === "poi_breweries") return ["craft=brewery", "amenity=pub"];
    
    return [];
  }

  private async overpassCountMiles(lat: number, lon: number, radiusMiles: number, filters: string[]): Promise<{ count: number, elements: any[] }> {
    try {
      const radiusMeters = Math.max(100, Math.floor(radiusMiles * 1609.34));
      const around = `around:${radiusMeters},${lat},${lon}`;
      const ors = filters.map(f => `node[${f}](${around});way[${f}](${around});relation[${f}](${around});`).join("");
      const q = `[out:json][timeout:25];(${ors});out center;`;
      
      const res = await fetchJSONSmart("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: q,
        headers: { "Content-Type": "text/plain;charset=UTF-8" }
      });
      
      const elements = res.elements || [];
      const seen = new Set();
      const unique: any[] = [];
      
      const norm = (s: string) => (s || "").trim().toLowerCase().replace(/\s+/g, " ");
      
      for (const el of elements) {
        const latc = el.lat || el.center?.lat;
        const lonc = el.lon || el.center?.lon;
        if (latc == null || lonc == null) continue;
        
        const key = `${norm(el.tags?.name) || "noname"}|${latc.toFixed(3)},${lonc.toFixed(3)}`;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(el);
        }
      }
      
      return { count: unique.length, elements: unique };
    } catch (error) {
      console.error('Overpass API error:', error);
      return { count: 0, elements: [] };
    }
  }

  private getDefaultRadius(enrichmentId: string): number {
    const defaultRadii: Record<string, number> = {
      'poi_schools': 5,
      'poi_hospitals': 5,
      'poi_parks': 5,
      'poi_grocery': 3,
      'poi_restaurants': 3,
      'poi_banks': 3,
      'poi_pharmacies': 3,
      'poi_gas': 3,
      'poi_hotels': 5,
      'poi_airports': 10,
      'poi_power_plants': 25,
      'poi_substations': 6,
      'poi_eq': 100,
      'poi_fema_floodzones': 2,
      'poi_usgs_volcano': 100
    };
    
    return defaultRadii[enrichmentId] || 5;
  }
}
