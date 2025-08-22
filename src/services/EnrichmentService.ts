import { GeocodeResult } from '../lib/types';
import { EnrichmentResult } from '../App';
import { poiConfigManager } from '../lib/poiConfig';

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
    // Using your proven working geocoding approach instead of CompositeGeocoder
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
    // Use your proven working geocoding approach
    console.log(`🔍 Geocoding address: ${q}`);
    
    // Try Nominatim first (most reliable)
    let g = await this.geocodeNominatim(q);
    if (g) {
      console.log(`✅ Geocoded via Nominatim: ${g.lat}, ${g.lon}`);
      return g;
    }
    
    // Try US Census for US addresses
    if (/\b(US|USA|United States|[A-Z]{2})\b/i.test(q) || /,\s*[A-Z]{2}\b/.test(q)) {
      g = await this.geocodeUSCensus(q);
      if (g) {
        console.log(`✅ Geocoded via US Census: ${g.lat}, ${g.lon}`);
        return g;
      }
    }
    
    console.log(`❌ Geocoding failed for: ${q}`);
    return null;
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
    // Cap all radii at 5 miles maximum for performance and accuracy
    const radius = Math.min(poiRadii[enrichmentId] || this.getDefaultRadius(enrichmentId), 5);

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
      
      case 'poi_wikipedia':
        return await this.getWikipediaPOIs(lat, lon, radius);
      
      default:
        if (enrichmentId.startsWith('poi_')) {
          // Check if this is a custom POI type
          const customPOI = this.getCustomPOIData(enrichmentId);
          if (customPOI) {
            return await this.getCustomPOICount(enrichmentId, lat, lon, radius, customPOI);
          }
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
        const result = await this.overpassCountMiles(lat, lon, radius, filters);
        const countKey = `${enrichmentId}_count_${radius}mi`;
        const poiResult: Record<string, any> = { [countKey]: result.count };
        
        // Include detailed POI data for mapping (if available)
        if ((result as any).detailed_pois && (result as any).detailed_pois.length > 0) {
          poiResult[`${enrichmentId}_detailed`] = (result as any).detailed_pois;
        }
        
        return poiResult;
      }
      
      // Return 0 for POI types without proper OSM filters
      // This prevents fake random numbers from appearing
      const key = `${enrichmentId}_count_${radius}mi`;
      console.log(`⚠️  No OSM filters found for ${enrichmentId}, returning 0`);
      return { [key]: 0 };
    } catch (error) {
      console.error(`POI count failed for ${enrichmentId}:`, error);
      const key = `${enrichmentId}_count_${radius}mi`;
      return { [key]: 0 };
    }
  }

  private getFiltersFor(id: string): string[] {
    // Add comprehensive logging to debug POI filter issues
    console.log(`🔍 Looking for OSM filters for: ${id}`);
    
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
    
    // Updated police and fire station filters using canonical OSM tags
    if (id === "poi_police_stations") return ["amenity=police"];
    if (id === "poi_fire_stations") return ["amenity=fire_station"];
    
    if (id === "poi_urgent_care") return ["amenity=clinic"];
    if (id === "poi_golf_courses") return ["leisure=golf_course"];
    if (id === "poi_boat_ramps") return ["leisure=boat_ramp"];
    if (id === "poi_cafes_coffee") return ["amenity=cafe", "shop=coffee"];
    if (id === "poi_markets") return ["shop=marketplace", "amenity=marketplace"];
    
         // Add missing POI types that were showing up in your results
     if (id === "poi_airports") return ["aeroway=aerodrome", "aeroway=airport"];
     if (id === "poi_substations") return ["power=substation"];
     if (id === "poi_power_plants") return ["power=plant", "power=generator"];
     if (id === "poi_railroads") return ["railway=rail"];
     if (id === "poi_gas") return ["amenity=fuel"];
     
     // Fix missing POI types showing 0 counts
     if (id === "poi_tnm_airports") return ["aeroway=aerodrome", "aeroway=airport"];
     if (id === "poi_tnm_railroads") return ["railway=rail"];
     if (id === "poi_tnm_trails") return ["route=hiking", "route=foot", "leisure=park"];
    
    console.log(`⚠️  No OSM filters found for: ${id}`);
    return [];
  }



  private async overpassCountMiles(lat: number, lon: number, radiusMiles: number, filters: string[]): Promise<{ count: number, elements: any[] }> {
    try {
      // Calculate accurate bounding box using proven 111,320 meters per degree formula
      const bbox = this.calculateBoundingBox(lat, lon, radiusMiles);
      
          // Build query using your exact working syntax - ALL element types for POIs
    let queryParts: string[] = [];
    filters.forEach(filter => {
      // Fix: Overpass needs separate quotes around key and value: ["key"="value"]
      const [key, value] = filter.split('=');
      queryParts.push(`  node["${key}"="${value}"](${bbox});`);
      queryParts.push(`  way["${key}"="${value}"](${bbox});`);
      queryParts.push(`  relation["${key}"="${value}"](${bbox});`);
    });
      
             const q = `[out:json][timeout:60];
 (
 ${queryParts.join('\n')}
 );
 out center;`;
      
      console.log(`🗺️  Overpass API Query for ${radiusMiles}mi radius:`);
      console.log(`📍 Location: ${lat}, ${lon}`);
      console.log(`📦 Bounding Box: ${bbox}`);
      console.log(`🔍 Filters: ${filters.join(', ')}`);
      console.log(`📝 Query: ${q}`);
      
      const res = await fetchJSONSmart("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: q,
        headers: { "Content-Type": "text/plain;charset=UTF-8" }
      });
      
      console.log(`📊 Overpass API response:`, res);
      
      if (!res || !res.elements) {
        console.error(`❌ Invalid Overpass API response:`, res);
        return { count: 0, elements: [] };
      }
      
      const elements = res.elements || [];
      console.log(`📊 Overpass API returned ${elements.length} elements within bbox`);
      
             // Filter POIs by actual distance from center point (not just bbox)
       const nearbyPOIs: any[] = [];
       const seen = new Set();
       
       const norm = (s: string) => (s || "").trim().toLowerCase().replace(/\s+/g, " ");
       
       for (const el of elements) {
         // Handle different element types with out center format
         let latc: number | null = null;
         let lonc: number | null = null;
         
         if (el.type === 'node') {
           // Nodes have direct lat/lon coordinates
           latc = el.lat;
           lonc = el.lon;
         } else if (el.type === 'way' || el.type === 'relation') {
           // Ways and relations use center coordinates with out center
           latc = el.center?.lat;
           lonc = el.center?.lon;
         }
         
         if (latc == null || lonc == null) continue;
         
         // Calculate actual distance from center point
         const distanceMiles = Math.round(this.calculateDistance(lat, lon, latc, lonc) * 0.621371 * 100) / 100;
         
                   // Only include POIs within the specified radius
          if (distanceMiles <= radiusMiles) {
            // Skip POIs with no name or "unnamed" names
            const poiName = el.tags?.name;
            if (!poiName || poiName.toLowerCase().includes('unnamed')) {
              continue;
            }
            
            const key = `${norm(poiName)}|${latc.toFixed(3)},${lonc.toFixed(3)}`;
            if (!seen.has(key)) {
              seen.add(key);
              nearbyPOIs.push({
                ...el,
                distance_miles: distanceMiles
              });
            }
          }
       }
      
             console.log(`✅ Bbox query results: ${nearbyPOIs.length} unique POIs within ${radiusMiles} miles`);
       
               // TEMPORARY: Show detailed restaurant records for inspection
        if (nearbyPOIs.length > 0 && filters.some(f => f.includes('restaurant') || f.includes('fast_food'))) {
          // Sort by distance (closest to farthest)
          const sortedPOIs = [...nearbyPOIs].sort((a, b) => a.distance_miles - b.distance_miles);
          
          console.log(`🍽️  DETAILED RESTAURANT RECORDS (showing top 250 by proximity):`);
          console.log(`📊 Total restaurants found: ${nearbyPOIs.length}`);
          console.log(`📍 Distance range: ${sortedPOIs[0].distance_miles} - ${sortedPOIs[sortedPOIs.length - 1].distance_miles} miles`);
          
          sortedPOIs.slice(0, 250).forEach((poi, index) => {
            console.log(`\n--- Restaurant ${index + 1} (${poi.distance_miles} miles) ---`);
            console.log(`Name: ${poi.tags?.name || 'Unnamed'}`);
            console.log(`Type: ${poi.tags?.amenity || 'Unknown'}`);
            console.log(`OSM ID: ${poi.id}`);
            console.log(`Element Type: ${poi.type}`);
            console.log(`Coordinates: ${poi.lat || poi.center?.lat}, ${poi.lon || poi.center?.lon}`);
            console.log(`Distance: ${poi.distance_miles} miles`);
            console.log(`Address: ${poi.tags?.['addr:street'] || 'N/A'} ${poi.tags?.['addr:housenumber'] || ''}`);
            console.log(`City: ${poi.tags?.['addr:city'] || 'N/A'}`);
            console.log(`All Tags:`, poi.tags);
          });
          
          if (nearbyPOIs.length > 250) {
            console.log(`\n... and ${nearbyPOIs.length - 250} more restaurants`);
          }
        }
        
        // TEMPORARY: Show detailed police and fire station records for inspection
        if (nearbyPOIs.length > 0 && filters.some(f => f.includes('police') || f.includes('fire_station'))) {
          // Sort by distance (closest to farthest)
          const sortedPOIs = [...nearbyPOIs].sort((a, b) => a.distance_miles - b.distance_miles);
          
          const poiType = filters.some(f => f.includes('police')) ? 'POLICE STATIONS' : 'FIRE STATIONS';
          console.log(`🚔  DETAILED ${poiType} RECORDS (showing ALL by proximity):`);
          console.log(`📊 Total ${poiType.toLowerCase()} found: ${nearbyPOIs.length}`);
          console.log(`📍 Distance range: ${sortedPOIs[0].distance_miles} - ${sortedPOIs[sortedPOIs.length - 1].distance_miles} miles`);
          
          sortedPOIs.forEach((poi, index) => {
            console.log(`\n--- ${poiType.slice(0, -1)} ${index + 1} (${poi.distance_miles} miles) ---`);
            console.log(`Name: ${poi.tags?.name || 'Unnamed'}`);
            console.log(`Type: ${poi.tags?.amenity || 'Unknown'}`);
            console.log(`OSM ID: ${poi.id}`);
            console.log(`Element Type: ${poi.type}`);
            console.log(`Coordinates: ${poi.lat || poi.center?.lat}, ${poi.lon || poi.center?.lon}`);
            console.log(`Distance: ${poi.distance_miles} miles`);
            console.log(`Address: ${poi.tags?.['addr:street'] || 'N/A'} ${poi.tags?.['addr:housenumber'] || ''}`);
            console.log(`City: ${poi.tags?.['addr:city'] || 'N/A'}`);
            console.log(`All Tags:`, poi.tags);
          });
        }
       
       if (nearbyPOIs.length > 0) {
         const distances = nearbyPOIs.map(p => p.distance_miles).sort((a, b) => a - b);
         console.log(`📍 Distance range: ${distances[0]} - ${distances[distances.length - 1]} miles`);
         
         // Show some sample POIs
         const samplePOIs = nearbyPOIs.slice(0, 3).map(p => ({
           name: p.tags?.name || 'Unnamed',
           distance: p.distance_miles,
           type: p.tags?.amenity || p.tags?.shop || p.tags?.tourism || 'Unknown'
         }));
         console.log(`🔍 Sample POIs:`, samplePOIs);
       }
      
      // Return both count and detailed POI data for mapping
      const result: any = { count: nearbyPOIs.length, elements: nearbyPOIs };
      
      // Add detailed POI data for single search results (to enable mapping)
      // We'll include up to 50 POIs for mapping to avoid overwhelming the map
      if (nearbyPOIs.length > 0) {
        const sortedPOIs = [...nearbyPOIs].sort((a, b) => a.distance_miles - b.distance_miles);
        result.detailed_pois = sortedPOIs.slice(0, 50).map(poi => ({
          id: poi.id,
          type: poi.type,
          name: poi.tags?.name || 'Unnamed',
          lat: poi.lat || poi.center?.lat,
          lon: poi.lon || poi.center?.lon,
          distance_miles: poi.distance_miles,
          tags: poi.tags,
          amenity: poi.tags?.amenity,
          shop: poi.tags?.shop,
          tourism: poi.tags?.tourism,
          address: poi.tags?.['addr:street'] || poi.tags?.['addr:full'],
          phone: poi.tags?.phone,
          website: poi.tags?.website
        }));
      }
      
      return result;
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
      'poi_airports': 5,
      'poi_power_plants': 5,
      'poi_substations': 5,
      'poi_eq': 5,
      'poi_fema_floodzones': 2,
      'poi_usgs_volcano': 5,
      'poi_wikipedia': 5,
      'poi_police_stations': 5,
      'poi_fire_stations': 5,
      'poi_urgent_care': 5,
      'poi_golf_courses': 5,
      'poi_boat_ramps': 5,
      'poi_cafes_coffee': 3,
      'poi_markets': 5
    };
    
    // Cap all radii at 5 miles maximum
    const radius = defaultRadii[enrichmentId] || 5;
    return Math.min(radius, 5);
  }

  
  
  // Enhanced Wikipedia/Wikidata POI enrichment for quirky and interesting sites
  private async getWikipediaPOIs(lat: number, lon: number, radiusMiles: number): Promise<Record<string, any>> {
    try {
      console.log(`🔍 Wikipedia POI: Searching for articles near ${lat}, ${lon} within ${radiusMiles} miles`);
      
      // Wikipedia API requires radius in meters, minimum 10,000 (10km)
      // Convert miles to meters and ensure minimum 10km radius
      const radiusMeters = Math.max(10000, Math.floor(radiusMiles * 1609.34));
      
      // Use Wikipedia's geosearch API to find nearby articles
      const wikiUrl = new URL('https://en.wikipedia.org/w/api.php');
      wikiUrl.searchParams.set('action', 'query');
      wikiUrl.searchParams.set('list', 'geosearch');
      wikiUrl.searchParams.set('gscoord', `${lat}|${lon}`);
      wikiUrl.searchParams.set('gsradius', radiusMeters.toString());
      wikiUrl.searchParams.set('gslimit', '50');
      wikiUrl.searchParams.set('format', 'json');
      wikiUrl.searchParams.set('origin', '*');
      
      console.log(`🔗 Wikipedia API URL: ${wikiUrl.toString()}`);
      console.log(`📏 Radius: ${radiusMeters}m (${Math.round(radiusMeters * 0.000621371 * 100) / 100} miles)`);
      
      const wikiData = await fetchJSONSmart(wikiUrl.toString());
      console.log(`📊 Wikipedia API response:`, wikiData);
      
      const articles = wikiData?.query?.geosearch || [];
      console.log(`📚 Found ${articles.length} Wikipedia articles`);
      
      if (articles.length === 0) {
        console.log(`⚠️  No Wikipedia articles found for this location`);
        return { poi_wikipedia_count: 0, poi_wikipedia_articles: [] };
      }

      // Categorize articles by interesting tags and types
      const categorizedArticles = articles.map((article: any) => {
        const title = article.title;
        const distance = article.dist;
        const pageId = article.pageid;
        
        // Detect interesting categories and types
        const categories = this.categorizeWikipediaArticle(title, article);
        
        return {
          title,
          distance_km: distance,
          distance_miles: Math.round(distance * 0.621371 * 100) / 100,
          page_id: pageId,
          categories,
          lat: article.lat,
          lon: article.lon,
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`
        };
      });

      // Group by category for better organization
      const articlesByCategory = this.groupArticlesByCategory(categorizedArticles);
      
      return {
        poi_wikipedia_count: articles.length,
        poi_wikipedia_articles: categorizedArticles,
        poi_wikipedia_by_category: articlesByCategory,
        poi_wikipedia_summary: this.generateWikipediaSummary(articlesByCategory)
      };
      
    } catch (error) {
      console.error('Wikipedia POI enrichment failed:', error);
      return { poi_wikipedia_count: 0, poi_wikipedia_error: 'Failed to fetch Wikipedia data' };
    }
  }


  
  // Calculate accurate bounding box using proven 111,320 meters per degree formula
  private calculateBoundingBox(lat: number, lon: number, radiusMiles: number): string {
    // Convert miles to meters
    const radiusMeters = radiusMiles * 1609.34;
    
    // Your proven working formula: 111,320 meters per degree latitude
    const latDelta = radiusMeters / 111320;
    const lonDelta = radiusMeters / (111320 * Math.cos(lat * Math.PI / 180)); // Adjusted for longitude
    
    // Create bounding box: south,west,north,east
    const south = Math.max(-90, lat - latDelta);
    const west = Math.max(-180, lon - lonDelta);
    const north = Math.min(90, lat + latDelta);
    const east = Math.min(180, lon + lonDelta);
    
    console.log(`📦 Proven bbox calculation:`);
    console.log(`📍 Location: ${lat.toFixed(6)}, ${lon.toFixed(6)}`);
    console.log(`📏 Radius: ${radiusMiles} miles (${Math.round(radiusMeters)}m)`);
    console.log(`📐 Lat delta: ${latDelta.toFixed(6)}°, Lon delta: ${lonDelta.toFixed(6)}°`);
    console.log(`📦 Bbox: ${south.toFixed(6)}, ${west.toFixed(6)}, ${north.toFixed(6)}, ${east.toFixed(6)}`);
    
    return `${south},${west},${north},${east}`;
  }

  // Calculate distance between two points using Haversine formula
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  // Categorize Wikipedia articles for quirky and interesting discovery
  private categorizeWikipediaArticle(title: string, _article: any): string[] {
    const titleLower = title.toLowerCase();
    const categories: string[] = [];
    
    // Historic and Cultural Sites
    if (titleLower.includes('historic') || titleLower.includes('heritage') || titleLower.includes('landmark')) {
      categories.push('historic_landmark');
    }
    if (titleLower.includes('museum') || titleLower.includes('gallery') || titleLower.includes('exhibit')) {
      categories.push('museum_gallery');
    }
    if (titleLower.includes('theater') || titleLower.includes('theatre') || titleLower.includes('opera')) {
      categories.push('performing_arts');
    }
    
    // Haunted and Paranormal
    if (titleLower.includes('haunted') || titleLower.includes('ghost') || titleLower.includes('paranormal')) {
      categories.push('haunted_paranormal');
    }
    if (titleLower.includes('cemetery') || titleLower.includes('graveyard') || titleLower.includes('burial')) {
      categories.push('cemetery_burial');
    }
    
    // Oddities and Curiosities
    if (titleLower.includes('oddity') || titleLower.includes('curiosity') || titleLower.includes('unusual')) {
      categories.push('oddity_curiosity');
    }
    if (titleLower.includes('mystery') || titleLower.includes('legend') || titleLower.includes('folklore')) {
      categories.push('mystery_legend');
    }
    
    // Architecture and Engineering
    if (titleLower.includes('bridge') || titleLower.includes('tunnel') || titleLower.includes('viaduct')) {
      categories.push('infrastructure');
    }
    if (titleLower.includes('skyscraper') || titleLower.includes('tower') || titleLower.includes('building')) {
      categories.push('architecture');
    }
    
    // Natural Wonders
    if (titleLower.includes('park') || titleLower.includes('garden') || titleLower.includes('reserve')) {
      categories.push('natural_area');
    }
    if (titleLower.includes('mountain') || titleLower.includes('hill') || titleLower.includes('peak')) {
      categories.push('geographic_feature');
    }
    
    // Entertainment and Recreation
    if (titleLower.includes('amusement') || titleLower.includes('theme park') || titleLower.includes('zoo')) {
      categories.push('entertainment');
    }
    if (titleLower.includes('stadium') || titleLower.includes('arena') || titleLower.includes('field')) {
      categories.push('sports_venue');
    }
    
    // Food and Culture
    if (titleLower.includes('restaurant') || titleLower.includes('cafe') || titleLower.includes('diner')) {
      categories.push('food_culture');
    }
    if (titleLower.includes('market') || titleLower.includes('bazaar') || titleLower.includes('fair')) {
      categories.push('market_fair');
    }
    
    // Religious and Spiritual
    if (titleLower.includes('church') || titleLower.includes('temple') || titleLower.includes('mosque')) {
      categories.push('religious_site');
    }
    
    // Transportation
    if (titleLower.includes('station') || titleLower.includes('terminal') || titleLower.includes('hub')) {
      categories.push('transportation');
    }
    
    // If no specific categories found, add general
    if (categories.length === 0) {
      categories.push('general_poi');
    }
    
    return categories;
  }

  // Group articles by category for better organization
  private groupArticlesByCategory(articles: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};
    
    articles.forEach(article => {
      article.categories.forEach((category: string) => {
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(article);
      });
    });
    
    return grouped;
  }

  // Generate a human-readable summary of Wikipedia findings
  private generateWikipediaSummary(articlesByCategory: Record<string, any[]>): string {
    const categoryCounts = Object.entries(articlesByCategory).map(([category, articles]) => ({
      category: this.formatCategoryName(category),
      count: articles.length
    }));
    

    const uniqueArticles = new Set(Object.values(articlesByCategory).flat().map(a => a.title)).size;
    
    let summary = `Found ${uniqueArticles} unique Wikipedia articles within ${this.getDefaultRadius('poi_wikipedia')} miles. `;
    
    if (categoryCounts.length > 0) {
      const topCategories = categoryCounts
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .map(c => `${c.category} (${c.count})`);
      
      summary += `Top categories: ${topCategories.join(', ')}.`;
    }
    
    return summary;
  }

  // Format category names for display
  private formatCategoryName(category: string): string {
    const nameMap: Record<string, string> = {
      'historic_landmark': 'Historic Landmarks',
      'museum_gallery': 'Museums & Galleries',
      'performing_arts': 'Performing Arts',
      'haunted_paranormal': 'Haunted & Paranormal',
      'cemetery_burial': 'Cemeteries & Burial Sites',
      'oddity_curiosity': 'Oddities & Curiosities',
      'mystery_legend': 'Mysteries & Legends',
      'infrastructure': 'Infrastructure',
      'architecture': 'Architecture',
      'natural_area': 'Natural Areas',
      'geographic_feature': 'Geographic Features',
      'entertainment': 'Entertainment',
      'sports_venue': 'Sports Venues',
      'food_culture': 'Food & Culture',
      'market_fair': 'Markets & Fairs',
      'religious_site': 'Religious Sites',
      'transportation': 'Transportation',
      'general_poi': 'General Points of Interest'
    };
    
    return nameMap[category] || category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  // Custom POI handling methods
  private getCustomPOIData(poiId: string): any {
    return poiConfigManager.getCustomPOIData(poiId);
  }

  private async getCustomPOICount(poiId: string, lat: number, lon: number, radiusMiles: number, customPOIData: any): Promise<Record<string, any>> {
    try {
      const { data, mapping } = customPOIData;
      if (!data || !Array.isArray(data)) {
        return { [`${poiId}_count`]: 0, [`${poiId}_error`]: 'No data available' };
      }

      let count = 0;
      const nearbyPOIs: any[] = [];

      for (const poi of data) {
        let poiLat: number | null = null;
        let poiLon: number | null = null;

        // Try to get coordinates from the POI data
        if (mapping.lat && mapping.lon && poi[mapping.lat] && poi[mapping.lon]) {
          poiLat = parseFloat(poi[mapping.lat]);
          poiLon = parseFloat(poi[mapping.lon]);
        } else if (poi.lat && poi.lon) {
          poiLat = parseFloat(poi.lat);
          poiLon = parseFloat(poi.lon);
        }

        if (poiLat && poiLon && !isNaN(poiLat) && !isNaN(poiLon)) {
          // Calculate distance using Haversine formula
          const distance = this.calculateDistance(lat, lon, poiLat, poiLon);
          const distanceMiles = distance * 0.621371; // Convert km to miles

          if (distanceMiles <= radiusMiles) {
            count++;
            nearbyPOIs.push({
              name: poi[mapping.name] || poi.name || 'Unnamed',
              address: poi[mapping.address] || poi.address || '',
              lat: poiLat,
              lon: poiLon,
              distance_miles: Math.round(distanceMiles * 100) / 100,
              raw_data: poi
            });
          }
        }
      }

      return {
        [`${poiId}_count`]: count,
        [`${poiId}_pois`]: nearbyPOIs,
        [`${poiId}_summary`]: `Found ${count} ${customPOIData.poi.label} within ${radiusMiles} miles`
      };

    } catch (error) {
      console.error(`Custom POI enrichment failed for ${poiId}:`, error);
      return { [`${poiId}_count`]: 0, [`${poiId}_error`]: String(error) };
    }
  }
}
