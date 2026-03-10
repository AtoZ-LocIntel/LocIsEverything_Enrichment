/**
 * Adapter for NASA FIRMS (Fire Information for Resource Management System) API
 * Service URL: https://firms.modaps.eosdis.nasa.gov/mapserver/wfs/
 * 
 * Provides wildfire spot data from MODIS and VIIRS satellite sensors
 * - USA contiguous and Hawaii coverage
 * - Canada coverage
 * - Alaska coverage
 * - South America coverage
 * - Central America coverage
 * - Europe coverage
 * - Russia and Asia coverage
 * - Australia and New Zealand coverage
 * - South Asia coverage
 * - Southeast Asia coverage
 * - North and Central Africa coverage
 * - Southern Africa coverage
 * - Updates multiple times per day
 * - MAP KEY: f8de3b4b814f1e82f769dd67d17c9750
 * - Transaction limit: 5000 transactions / 10 minutes
 * 
 * Uses WFS GetCapabilities to discover correct layer names (e.g., ms:fires_viirs_snpp_24hrs)
 */

export interface NASAFIRMSFireInfo {
  id: string;
  latitude: number;
  longitude: number;
  brightness?: number; // Brightness temperature in Kelvin
  scan?: number; // Scan pixel size
  track?: number; // Track pixel size
  acq_date?: string; // Acquisition date
  acq_time?: string; // Acquisition time
  satellite?: string; // Satellite name (MODIS, VIIRS)
  instrument?: string; // Instrument name
  confidence?: number; // Confidence level (0-100)
  version?: string; // Data version
  bright_t31?: number; // Brightness temperature channel 31
  frp?: number; // Fire Radiative Power (MW)
  daynight?: string; // Day or Night detection
  type?: number; // Fire type
  distance?: number; // Distance in miles from query point
}

const FIRMS_MAP_KEY = 'f8de3b4b814f1e82f769dd67d17c9750';

// NASA FIRMS WFS endpoints for different regions
const FIRMS_REGIONS = {
  USA: `https://firms.modaps.eosdis.nasa.gov/mapserver/wfs/USA_contiguous_and_Hawaii/${FIRMS_MAP_KEY}/`,
  Canada: `https://firms.modaps.eosdis.nasa.gov/mapserver/wfs/Canada/${FIRMS_MAP_KEY}/`,
  Alaska: `https://firms.modaps.eosdis.nasa.gov/mapserver/wfs/Alaska/${FIRMS_MAP_KEY}/`,
  SouthAmerica: `https://firms.modaps.eosdis.nasa.gov/mapserver/wfs/South_America/${FIRMS_MAP_KEY}/`,
  CentralAmerica: `https://firms.modaps.eosdis.nasa.gov/mapserver/wfs/Central_America/${FIRMS_MAP_KEY}/`,
  Europe: `https://firms.modaps.eosdis.nasa.gov/mapserver/wfs/Europe/${FIRMS_MAP_KEY}/`,
  RussiaAsia: `https://firms.modaps.eosdis.nasa.gov/mapserver/wfs/Russia_Asia/${FIRMS_MAP_KEY}/`,
  AustraliaNewZealand: `https://firms.modaps.eosdis.nasa.gov/mapserver/wfs/Australia_NewZealand/${FIRMS_MAP_KEY}/`,
  SouthAsia: `https://firms.modaps.eosdis.nasa.gov/mapserver/wfs/South_Asia/${FIRMS_MAP_KEY}/`,
  SoutheastAsia: `https://firms.modaps.eosdis.nasa.gov/mapserver/wfs/SouthEast_Asia/${FIRMS_MAP_KEY}/`,
  NorthCentralAfrica: `https://firms.modaps.eosdis.nasa.gov/mapserver/wfs/Northern_and_Central_Africa/${FIRMS_MAP_KEY}/`,
  SouthernAfrica: `https://firms.modaps.eosdis.nasa.gov/mapserver/wfs/Southern_Africa/${FIRMS_MAP_KEY}/`
};

// Common FIRMS layer names (from GetCapabilities - they use ms: prefix)
const FIRMS_LAYER_NAMES = [
  'ms:fires_viirs_snpp_24hrs',  // VIIRS SNPP 24 hours (most recent)
  'ms:fires_viirs_snpp_7days',  // VIIRS SNPP 7 days
  'ms:fires_modis_24hrs',       // MODIS 24 hours
  'ms:fires_modis_7days',       // MODIS 7 days
  'ms:fires_viirs_noaa20_24hrs', // VIIRS NOAA-20 24 hours
  'ms:fires_viirs_noaa20_7days', // VIIRS NOAA-20 7 days
  'fires_viirs_snpp_24hrs',     // Try without ms: prefix
  'fires_modis_24hrs'            // Try without ms: prefix
];

/**
 * Get available layer names from FIRMS WFS GetCapabilities
 */
async function getFIRMSLayerName(baseUrl: string): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      SERVICE: 'WFS',
      REQUEST: 'GetCapabilities',
      VERSION: '2.0.0'
    });
    
    const response = await fetch(`${baseUrl}?${params.toString()}`);
    const text = await response.text();
    
    // Parse XML to find layer names - FIRMS uses <Name>ms:fires_viirs_snpp_24hrs</Name> format
    // Look for all Name tags and find the most recent fire layer (24hrs preferred)
    const nameMatches = text.matchAll(/<Name[^>]*>([^<]+)<\/Name>/gi);
    const layerNames: string[] = [];
    
    for (const match of nameMatches) {
      const layerName = match[1];
      if (layerName.includes('fires') && (layerName.includes('24hrs') || layerName.includes('7days'))) {
        layerNames.push(layerName);
      }
    }
    
    // Prefer 24hrs layers, then VIIRS SNPP (most common), then MODIS
    const preferred = layerNames.find(n => n.includes('24hrs') && n.includes('viirs_snpp')) ||
                     layerNames.find(n => n.includes('24hrs') && n.includes('viirs')) ||
                     layerNames.find(n => n.includes('24hrs')) ||
                     layerNames.find(n => n.includes('viirs_snpp')) ||
                     layerNames[0];
    
    if (preferred) {
      console.log(`✅ Found FIRMS layer name: ${preferred} (from ${layerNames.length} available layers)`);
      return preferred;
    }
    
    // Fallback to common names
    return FIRMS_LAYER_NAMES[0]; // Default to most common
  } catch (error) {
    console.warn('Could not get FIRMS layer name from GetCapabilities:', error);
    return FIRMS_LAYER_NAMES[0]; // Fallback to default
  }
}

/**
 * Parse CSV data from NASA FIRMS REST API
 */
function parseFIRMSCSV(csvText: string, region: string): NASAFIRMSFireInfo[] {
  const lines = csvText.trim().split('\n');
  console.log(`📋 CSV has ${lines.length} lines`);
  
  if (lines.length < 2) {
    console.warn('⚠️ CSV has less than 2 lines (header + data)');
    return [];
  }
  
  // Parse header - FIRMS CSV uses specific column names
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  console.log(`📋 CSV headers:`, headers.slice(0, 10)); // Log first 10 headers
  
  // Find column indices - FIRMS uses lowercase with underscores
  const latIdx = headers.findIndex(h => h.toLowerCase() === 'latitude' || h.toLowerCase() === 'lat');
  const lonIdx = headers.findIndex(h => h.toLowerCase() === 'longitude' || h.toLowerCase() === 'lon' || h.toLowerCase() === 'long');
  const brightnessIdx = headers.findIndex(h => h.toLowerCase().includes('brightness') || h.toLowerCase() === 'brightness');
  const acqDateIdx = headers.findIndex(h => h.toLowerCase().includes('acq_date') || h.toLowerCase() === 'acq_date');
  const acqTimeIdx = headers.findIndex(h => h.toLowerCase().includes('acq_time') || h.toLowerCase() === 'acq_time');
  const satelliteIdx = headers.findIndex(h => h.toLowerCase().includes('satellite') || h.toLowerCase() === 'satellite');
  const instrumentIdx = headers.findIndex(h => h.toLowerCase().includes('instrument') || h.toLowerCase() === 'instrument');
  const confidenceIdx = headers.findIndex(h => h.toLowerCase().includes('confidence') || h.toLowerCase() === 'confidence');
  const frpIdx = headers.findIndex(h => h.toLowerCase() === 'frp');
  const daynightIdx = headers.findIndex(h => h.toLowerCase().includes('daynight') || h.toLowerCase() === 'daynight');
  
  console.log(`📋 Column indices - lat: ${latIdx}, lon: ${lonIdx}, brightness: ${brightnessIdx}, acq_date: ${acqDateIdx}`);
  
  if (latIdx < 0 || lonIdx < 0) {
    console.error('❌ Could not find latitude/longitude columns in CSV');
    return [];
  }
  
  const fires: NASAFIRMSFireInfo[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    // Handle quoted CSV values properly
    const line = lines[i];
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim()); // Add last value
    
    if (values.length < Math.max(latIdx, lonIdx) + 1) {
      console.warn(`⚠️ Line ${i} has insufficient columns: ${values.length}`);
      continue;
    }
    
    const lat = parseFloat(values[latIdx]);
    const lon = parseFloat(values[lonIdx]);
    
    if (isNaN(lat) || isNaN(lon)) {
      console.warn(`⚠️ Line ${i} has invalid coordinates: lat=${values[latIdx]}, lon=${values[lonIdx]}`);
      continue;
    }
    
    fires.push({
      id: `${lat}_${lon}_${i}_${Date.now()}`,
      latitude: lat,
      longitude: lon,
      brightness: brightnessIdx >= 0 && values[brightnessIdx] ? parseFloat(values[brightnessIdx]) : undefined,
      acq_date: acqDateIdx >= 0 ? values[acqDateIdx] : undefined,
      acq_time: acqTimeIdx >= 0 ? values[acqTimeIdx] : undefined,
      satellite: satelliteIdx >= 0 ? values[satelliteIdx] : undefined,
      instrument: instrumentIdx >= 0 ? values[instrumentIdx] : undefined,
      confidence: confidenceIdx >= 0 && values[confidenceIdx] ? parseFloat(values[confidenceIdx]) : undefined,
      frp: frpIdx >= 0 && values[frpIdx] ? parseFloat(values[frpIdx]) : undefined,
      daynight: daynightIdx >= 0 ? values[daynightIdx] : undefined
    });
  }
  
  console.log(`✅ Parsed ${fires.length} NASA FIRMS fire detections from CSV for ${region}`);
  return fires;
}

/**
 * Parse FIRMS feature array into NASAFIRMSFireInfo[]
 */
function parseFIRMSFeatures(features: any[], region: string): NASAFIRMSFireInfo[] {
  const fires: NASAFIRMSFireInfo[] = features
    .map((feature: any) => {
      const props = feature.properties || {};
      const geometry = feature.geometry || {};
      
      // Extract coordinates from geometry (GeoJSON format)
      const coordinates = geometry.coordinates || [];
      const longitude = coordinates[0];
      const latitude = coordinates[1];
      
      if (latitude === null || latitude === undefined || longitude === null || longitude === undefined ||
          isNaN(latitude) || isNaN(longitude)) {
        return null;
      }
      
      return {
        id: feature.id || `${latitude}_${longitude}_${Date.now()}`,
        latitude: parseFloat(String(latitude)),
        longitude: parseFloat(String(longitude)),
        brightness: props.brightness || props.BRIGHTNESS,
        scan: props.scan || props.SCAN,
        track: props.track || props.TRACK,
        acq_date: props.acq_date || props.ACQ_DATE || props.acqDate,
        acq_time: props.acq_time || props.ACQ_TIME || props.acqTime,
        satellite: props.satellite || props.SATELLITE,
        instrument: props.instrument || props.INSTRUMENT,
        confidence: props.confidence || props.CONFIDENCE,
        version: props.version || props.VERSION,
        bright_t31: props.bright_t31 || props.BRIGHT_T31 || props.brightT31,
        frp: props.frp || props.FRP,
        daynight: props.daynight || props.DAYNIGHT || props.dayNight,
        type: props.type || props.TYPE
      };
    })
    .filter((fire: NASAFIRMSFireInfo | null) => fire !== null) as NASAFIRMSFireInfo[];
  
  console.log(`✅ Retrieved ${fires.length} NASA FIRMS fire detections for ${region}`);
  return fires;
}

/**
 * Get FIRMS fires for a specific region using WFS
 */
async function getFIRMSFiresForRegion(regionName: string, regionUrl: string): Promise<NASAFIRMSFireInfo[]> {
  try {
    console.log(`🔥 Fetching NASA FIRMS fire detections for ${regionName}...`);
    
    // Get the correct layer name from GetCapabilities
    let layerName = await getFIRMSLayerName(regionUrl);
    if (!layerName) {
      layerName = FIRMS_LAYER_NAMES[0]; // Fallback to default
    }
    
    // Try the layer name, and if it fails, try alternatives
    for (const tryLayerName of [layerName, ...FIRMS_LAYER_NAMES]) {
      const params = new URLSearchParams({
        SERVICE: 'WFS',
        REQUEST: 'GetFeature',
        VERSION: '2.0.0',
        TYPENAMES: tryLayerName,
        OUTPUTFORMAT: 'application/json; subtype=geojson'
      });
      
      const response = await fetch(`${regionUrl}?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.features && Array.isArray(data.features)) {
          console.log(`✅ Successfully fetched ${data.features.length} fires from ${regionName} using layer: ${tryLayerName}`);
          return parseFIRMSFeatures(data.features, regionName);
        }
      } else {
        const errorText = await response.text().catch(() => 'Unknown error');
        if (!errorText.includes('Layer doesn\'t exist')) {
          console.warn(`⚠️ ${regionName} WFS error ${response.status} with layer ${tryLayerName}:`, errorText.substring(0, 200));
        }
      }
    }
    
    console.warn(`⚠️ Could not fetch FIRMS data for ${regionName} with any layer name`);
    return [];
  } catch (error: any) {
    console.error(`❌ Error fetching FIRMS fires for ${regionName}:`, error);
    return [];
  }
}

/**
 * Get NASA FIRMS fire detections for specific regions
 * @param selectedRegions Array of region keys to fetch (e.g., ['USA', 'Europe', 'SouthAmerica'])
 */
export async function getNASAFIRMSForRegions(selectedRegions: string[]): Promise<NASAFIRMSFireInfo[]> {
  try {
    if (!selectedRegions || selectedRegions.length === 0) {
      return [];
    }
    
    // Fetch from selected regions in parallel
    const regionPromises = selectedRegions
      .filter(regionName => FIRMS_REGIONS[regionName as keyof typeof FIRMS_REGIONS])
      .map((regionName) => {
        const regionUrl = FIRMS_REGIONS[regionName as keyof typeof FIRMS_REGIONS];
        return getFIRMSFiresForRegion(regionName, regionUrl);
      });
    
    const allRegionFires = await Promise.all(regionPromises);
    const allFires = allRegionFires.flat();
    
    const regionCounts = selectedRegions.map((name, idx) => {
      return `${name}: ${allRegionFires[idx]?.length || 0}`;
    }).join(', ');
    
    console.log(`✅ Retrieved ${allFires.length} total NASA FIRMS fire detections from selected regions (${regionCounts})`);
    return allFires;
  } catch (error: any) {
    console.error('❌ Error fetching NASA FIRMS fires:', error);
    return [];
  }
}

/**
 * Get all NASA FIRMS fire detections (all regions combined)
 */
export async function getAllNASAFIRMS(): Promise<NASAFIRMSFireInfo[]> {
  try {
    // Fetch from all regions in parallel
    const regionPromises = Object.entries(FIRMS_REGIONS).map(([regionName, regionUrl]) =>
      getFIRMSFiresForRegion(regionName, regionUrl)
    );
    
    const allRegionFires = await Promise.all(regionPromises);
    const allFires = allRegionFires.flat();
    
    const regionCounts = Object.keys(FIRMS_REGIONS).map((name, idx) => 
      `${name}: ${allRegionFires[idx].length}`
    ).join(', ');
    
    console.log(`✅ Retrieved ${allFires.length} total NASA FIRMS fire detections (${regionCounts})`);
    return allFires;
  } catch (error: any) {
    console.error('❌ Error fetching NASA FIRMS fires:', error);
    return [];
  }
}

/**
 * Get all NASA FIRMS fire detections for USA (kept for backward compatibility)
 */
export async function getAllNASAFIRMSUSA(): Promise<NASAFIRMSFireInfo[]> {
  return getFIRMSFiresForRegion('USA', FIRMS_REGIONS.USA);
}

/**
 * Get all NASA FIRMS fire detections for Canada (kept for backward compatibility)
 */
export async function getAllNASAFIRMSCanada(): Promise<NASAFIRMSFireInfo[]> {
  return getFIRMSFiresForRegion('Canada', FIRMS_REGIONS.Canada);
}
