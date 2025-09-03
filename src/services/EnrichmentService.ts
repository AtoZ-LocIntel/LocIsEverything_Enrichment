import { GeocodeResult } from '../lib/types';
import { EnrichmentResult } from '../App';
import { getUSDAWildfireRiskData } from '../adapters/usdaWildfireRisk';
import { getTerrainAnalysis } from './ElevationService';
import { queryATFeatures } from '../adapters/appalachianTrail';
// import { poiConfigManager } from '../lib/poiConfig'; // Temporarily commented out until needed

// CORS proxy helpers from original geocoder.html
const USE_CORS_PROXY = false;
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

export async function fetchJSONSmart(url: string, opts: RequestInit = {}, backoff: number = 200): Promise<any> {
  // When CORS proxy is disabled, only try direct URL
  const attempts = USE_CORS_PROXY ? [url, proxied(url, 0), proxied(url, 1)] : [url];
  let err: any;
  
  for (let i = 0; i < attempts.length; i++) {
    try {
      console.log(`🌐 Attempt ${i + 1}: Fetching from ${attempts[i]}`);
      
      const res = await fetch(attempts[i], { 
        ...opts, 
        headers: { 
          "Accept": "application/json", 
          ...(opts.headers || {}) 
        } 
      });
      
      if (!res.ok) {
        console.warn(`⚠️ HTTP ${res.status} from ${attempts[i]}`);
        throw new Error(`HTTP ${res.status}`);
      }
      
      const text = await res.text();
      
      // Check if response is HTML (error page) instead of JSON
      if (text.trim().startsWith('<html') || text.trim().startsWith('<!DOCTYPE')) {
        console.warn(`⚠️ Received HTML instead of JSON from ${attempts[i]}:`, text.substring(0, 100));
        throw new Error('Received HTML instead of JSON');
      }
      
      // Try to parse as JSON
      try {
        const body = JSON.parse(text);
        console.log(`✅ Successfully parsed JSON from ${attempts[i]}`);
        return body;
      } catch (parseError) {
        console.warn(`⚠️ Failed to parse JSON from ${attempts[i]}:`, text.substring(0, 100));
        throw new Error('Invalid JSON response');
      }
      
    } catch (e) { 
      err = e; 
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.warn(`❌ Attempt ${i + 1} failed:`, errorMessage);
      
      // Don't retry if CORS proxy is disabled and we get certain errors
      if (!USE_CORS_PROXY && (
        errorMessage.includes('403') || 
        errorMessage.includes('CORS') || 
        errorMessage.includes('network')
      )) {
        console.warn(`🚫 Skipping retries due to CORS/network error with proxy disabled`);
        break;
      }
      
      if (i < attempts.length - 1) {
        console.log(`⏳ Waiting ${backoff}ms before retry...`);
        await new Promise(r => setTimeout(r, backoff)); 
      }
    }
  }
  
  console.error(`❌ All attempts failed for ${url}`);
  throw err || new Error("fetchJSONSmart failed");
}

// Rate limiting utility
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class EnrichmentService {
  private performanceMetrics: {
    totalQueries: number;
    totalTime: number;
    averageTime: number;
    parallelQueries: number;
  } = {
    totalQueries: 0,
    totalTime: 0,
    averageTime: 0,
    parallelQueries: 0
  };
  
  constructor() {
    // Using your proven working geocoding approach instead of CompositeGeocoder
  }
  
  getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }
  
  logPerformanceSummary() {
    console.log('📊 === PERFORMANCE SUMMARY ===');
    console.log(`Total Queries: ${this.performanceMetrics.totalQueries}`);
    console.log(`Total Time: ${this.performanceMetrics.totalTime}ms`);
    console.log(`Average Time: ${this.performanceMetrics.averageTime}ms`);
    console.log(`Parallel Queries: ${this.performanceMetrics.parallelQueries}`);
    console.log('=============================');
  }

  // Utility methods for coordinate calculations
  private calculateBoundingBox(lat: number, lon: number, radiusMiles: number): string {
    // Convert miles to meters
    const radiusMeters = radiusMiles * 1609.34;
    
    // Use your proven working formula: 111,320 meters per degree
    const latDelta = radiusMeters / 111320;
    const lonDelta = radiusMeters / (111320 * Math.cos(lat * Math.PI / 180));
    
    const south = lat - latDelta;
    const north = lat + latDelta;
    const west = lon - lonDelta;
    const east = lon + lonDelta;
    
    // Return as comma-separated string for Overpass API
    return `${south.toFixed(6)},${west.toFixed(6)},${north.toFixed(6)},${east.toFixed(6)}`;
  }
  
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Haversine formula for calculating distance between two points on Earth
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  }
  
  private async getFEMAFloodZones(lat: number, lon: number, radiusMiles: number): Promise<Record<string, any>> {
    try {
      console.log(`FEMA Flood Zones query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`);
      
      // Use the correct FEMA NFHL endpoint as provided by user
      const baseUrl = 'https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query';
      
      // Use point-based query instead of bounding box (more reliable)
      const queryUrl = `${baseUrl}?f=json&where=1=1&geometry=${lon.toFixed(6)},${lat.toFixed(6)}&geometryType=esriGeometryPoint&inSR=4326&outSR=4326&spatialRel=esriSpatialRelIntersects&outFields=FLD_ZONE,ZONE_SUBTY&returnGeometry=true&resultRecordCount=5`;
      
      console.log(`🔗 FEMA NFHL API URL: ${queryUrl}`);
      
      try {
        const response = await fetch(queryUrl);
        if (response.ok) {
          const data = await response.json();
          console.log(`📊 FEMA NFHL API response:`, data);
          console.log(`🔍 FEMA response structure:`, {
            hasFeatures: !!data.features,
            featuresLength: data.features?.length,
            responseKeys: Object.keys(data),
            firstFeature: data.features?.[0]
          });
          
          if (data && data.features && data.features.length > 0) {
            console.log(`✅ Found ${data.features.length} FEMA flood zones containing the point`);
            
            // Process the features to find zones containing the point
            const zones = data.features.map((feature: any) => {
              const properties = feature.attributes || feature.properties;
              return {
                zone: properties.FLD_ZONE || properties.ZONE || 'Unknown Zone',
                name: properties.ZONE_SUBTY || properties.NAME || 'Unknown',
                risk: properties.RISK || 'Unknown',
                geometry: feature.geometry
              };
            });
            
            // Since we're using a point query, the point should be inside the returned zones
            const currentZone = zones[0].zone;
            const summary = `Location is in FEMA flood zone: ${currentZone}`;
            
            return {
              poi_fema_flood_zones_count: zones.length,
              poi_fema_flood_zones_summary: summary,
              poi_fema_flood_zones_current: currentZone,
              poi_fema_flood_zones_nearby: zones.slice(0, 2), // Top 2 zones
              poi_fema_flood_zones_status: 'Data retrieved successfully'
            };
          } else {
            console.log(`⚠️  No FEMA flood zones found containing the point`);
            return {
              poi_fema_flood_zones_count: 0,
              poi_fema_flood_zones_summary: `No FEMA flood zones found at this location`,
              poi_fema_flood_zones_current: null,
              poi_fema_flood_zones_nearby: [],
              poi_fema_flood_zones_status: 'No zones at location'
            };
          }
        } else {
          throw new Error(`FEMA API HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.log('FEMA NFHL API query failed:', error);
        return {
          poi_fema_flood_zones_count: 0,
          poi_fema_flood_zones_summary: 'FEMA flood zone data temporarily unavailable',
          poi_fema_flood_zones_current: null,
          poi_fema_flood_zones_nearby: [],
          poi_fema_flood_zones_status: 'API query failed'
        };
      }
      
    } catch (error) {
      console.error('Error in FEMA flood zones query:', error);
      return {
        poi_fema_flood_zones_count: 0,
        poi_fema_flood_zones_summary: 'Error querying FEMA flood zones'
      };
    }
  }
  
    private async getWetlands(lat: number, lon: number, radiusMiles: number): Promise<Record<string, any>> {
    try {
      console.log(`USGS Wetlands query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`);
      
      // Official USGS NWI Wetlands MapServer endpoint (preferred service)
      const baseUrl = 'https://fwspublicservices.wim.usgs.gov/wetlandsmapservice/rest/services/Wetlands/MapServer/0/query';
      
      // Use simple comma-separated coordinates for the official MapServer
      const geometryParam = `${lon.toFixed(6)},${lat.toFixed(6)}`;
      
      console.log(`🔍 Geometry parameter: ${geometryParam}`);
      
      // First, check if point is inside any wetland (point-in-polygon query)
      // Use the official MapServer with proper parameters
      const pointQueryUrl = `${baseUrl}?where=1%3D1&geometry=${geometryParam}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=true&f=json`;
      
      console.log(`🔗 USGS NWI Wetlands Point Query URL: ${pointQueryUrl}`);
      
      let pointInWetland = false;
      let currentWetland = null;
      
      try {
        const pointResponse = await fetch(pointQueryUrl);
        if (pointResponse.ok) {
          const pointData = await pointResponse.json();
          console.log(`📊 USGS NWI Wetlands Point Query response:`, pointData);
          
          if (pointData && pointData.features && pointData.features.length > 0) {
            pointInWetland = true;
            const feature = pointData.features[0];
            const properties = feature.attributes || feature.properties;
            currentWetland = {
              type: properties.WETLAND_TY || properties.WETLAND_TYPE || properties.ATTRIBUTE || 'Unknown',
              attribute: properties.ATTRIBUTE || 'Unknown',
              acres: properties.ACRES || null,
              geometry: feature.geometry
            };
            console.log(`✅ Point is inside wetland: ${currentWetland.type}`);
          } else {
            console.log(`⚠️  Point is not inside any wetland`);
          }
        } else {
          console.log(`❌ Point query failed with status: ${pointResponse.status} ${pointResponse.statusText}`);
        }
      } catch (error) {
        console.log('USGS NWI Wetlands point query failed:', error);
      }
      
      // Now check for wetlands nearby within the specified radius using the distance parameter
      // Use the official MapServer with proper distance units
      const nearbyQueryUrl = `${baseUrl}?where=1%3D1&geometry=${geometryParam}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&distance=${radiusMiles}&units=esriSRUnit_StatuteMile&outFields=*&returnGeometry=true&f=json`;
      
      console.log(`🔗 USGS NWI Wetlands Nearby Query URL: ${nearbyQueryUrl}`);
      
      let nearbyWetlands = [];
      let totalNearbyCount = 0;
      
      try {
        const nearbyResponse = await fetch(nearbyQueryUrl);
        if (nearbyResponse.ok) {
          const nearbyData = await nearbyResponse.json();
          console.log(`📊 USGS NWI Wetlands Nearby Query response:`, nearbyData);
          
          if (nearbyData && nearbyData.features && nearbyData.features.length > 0) {
            console.log(`📊 Wetlands found within ${radiusMiles} miles: ${nearbyData.features.length}`);
            
            totalNearbyCount = nearbyData.features.length;
            nearbyWetlands = nearbyData.features.slice(0, 5).map((feature: any) => {
              const properties = feature.attributes || feature.properties;
              return {
                type: properties.WETLAND_TY || properties.WETLAND_TYPE || properties.ATTRIBUTE || 'Unknown',
                attribute: properties.ATTRIBUTE || 'Unknown',
                acres: properties.ACRES || null,
                geometry: feature.geometry
              };
            });
            console.log(`✅ Found ${totalNearbyCount} wetlands within ${radiusMiles} miles`);
          } else {
            console.log(`⚠️  No wetlands found within ${radiusMiles} miles`);
          }
        } else {
          console.log(`❌ Nearby query failed with status: ${nearbyResponse.status} ${nearbyResponse.statusText}`);
        }
      } catch (error) {
        console.log('USGS NWI Wetlands nearby query failed:', error);
      }
      
      // Generate summary and return results
      let summary = '';
      if (pointInWetland && currentWetland) {
        summary = `Location is inside ${currentWetland.type} wetland`;
        if (currentWetland.acres) {
          summary += ` (${currentWetland.acres.toFixed(2)} acres)`;
        }
      } else {
        summary = `Location is not inside any wetland`;
      }
      
      if (totalNearbyCount > 0) {
        summary += `. Found ${totalNearbyCount} wetlands within ${radiusMiles} miles`;
      }
      
      return {
        poi_wetlands_count: totalNearbyCount,
        poi_wetlands_point_in_wetland: pointInWetland,
        poi_wetlands_current: currentWetland,
        poi_wetlands_nearby: nearbyWetlands,
        poi_wetlands_summary: summary,
        poi_wetlands_status: 'Data retrieved successfully',
        poi_wetlands_proximity_distance: radiusMiles
      };
      
    } catch (error) {
      console.error('Error in USGS NWI Wetlands query:', error);
      return {
        poi_wetlands_count: 0,
        poi_wetlands_point_in_wetland: false,
        poi_wetlands_current: null,
        poi_wetlands_nearby: [],
        poi_wetlands_summary: 'Error querying USGS NWI Wetlands data',
        poi_wetlands_status: 'API query failed',
        poi_wetlands_proximity_distance: radiusMiles
      };
    }
  }

  private async getEarthquakes(lat: number, lon: number, radiusMiles: number): Promise<Record<string, any>> {
    try {
      console.log(`USGS Earthquake query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`);
      
      // USGS Earthquake API endpoint
      const baseUrl = 'https://earthquake.usgs.gov/fdsnws/event/1/query';
      
      // Convert miles to kilometers (USGS API uses kilometers)
      const radiusKm = radiusMiles * 1.60934;
      
      // Query for earthquakes within the specified radius
      const queryUrl = `${baseUrl}?format=geojson&starttime=1900-01-01&endtime=2024-12-31&latitude=${lat}&longitude=${lon}&maxradiuskm=${radiusKm}&minmagnitude=2.0&orderby=time`;
      
      console.log(`🔗 USGS Earthquake Query URL: ${queryUrl}`);
      
      let earthquakeCount = 0;
      let largestMagnitude = 0;
      let recentEarthquakes = [];
      
      try {
        const response = await fetch(queryUrl);
        if (response.ok) {
          const data = await response.json();
          console.log(`📊 USGS Earthquake response:`, data);
          
          if (data && data.features && Array.isArray(data.features)) {
            earthquakeCount = data.features.length;
            
            // Get the largest magnitude earthquake
            if (earthquakeCount > 0) {
              largestMagnitude = Math.max(...data.features.map((eq: any) => eq.properties.mag || 0));
              
              // Get the 5 most recent earthquakes
              recentEarthquakes = data.features
                .sort((a: any, b: any) => new Date(b.properties.time).getTime() - new Date(a.properties.time).getTime())
                .slice(0, 5)
                .map((eq: any) => ({
                  magnitude: eq.properties.mag || 0,
                  date: new Date(eq.properties.time).toLocaleDateString(),
                  depth: eq.properties.depth || 0,
                  place: eq.properties.place || 'Unknown location'
                }));
            }
            
            console.log(`✅ Found ${earthquakeCount} earthquakes within ${radiusMiles} miles (${radiusKm.toFixed(1)} km)`);
          } else {
            console.log(`⚠️  No earthquakes found within ${radiusMiles} miles`);
          }
        } else {
          console.log(`❌ USGS Earthquake API error: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.log('USGS Earthquake query failed:', error);
      }
      
      // Generate summary
      let summary = '';
      if (earthquakeCount > 0) {
        summary = `Found ${earthquakeCount} historical earthquakes within ${radiusMiles} miles`;
        if (largestMagnitude > 0) {
          summary += ` (largest: M${largestMagnitude.toFixed(1)})`;
        }
      } else {
        summary = `No historical earthquakes found within ${radiusMiles} miles`;
      }
      
      return {
        poi_earthquakes_count: earthquakeCount,
        poi_earthquakes_largest_magnitude: largestMagnitude,
        poi_earthquakes_recent: recentEarthquakes,
        poi_earthquakes_summary: summary
      };
      
    } catch (error) {
      console.error('Error in USGS Earthquake query:', error);
      return {
        poi_earthquakes_count: 0,
        poi_earthquakes_largest_magnitude: 0,
        poi_earthquakes_recent: [],
        poi_earthquakes_summary: 'Error querying USGS Earthquake data'
      };
    }
  }

  private async getVolcanoes(lat: number, lon: number, radiusMiles: number): Promise<any> {
    try {
      console.log(`🌋 USGS Volcano query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`);
      
      // USGS Volcano API endpoint
      const baseUrl = 'https://volcanoes.usgs.gov/vsc/api/volcanoApi/geojson';
      
      // Download all volcano data and filter by proximity
      const response = await fetch(baseUrl);
      if (!response.ok) {
        throw new Error(`USGS Volcano API failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`🌋 Downloaded ${data.features?.length || 0} volcano features from USGS API`);
      
      if (!data.features || !Array.isArray(data.features)) {
        console.log('🌋 No volcano features found in response');
        return { count: 0, active: 0, summary: 'No volcanoes found' };
      }
      
      // Filter volcanoes by proximity
      const radiusKm = radiusMiles * 1.60934; // Convert miles to km
      const nearbyVolcanoes = data.features.filter((volcano: any) => {
        if (volcano.geometry?.coordinates && volcano.geometry.coordinates.length >= 2) {
          const [volcanoLon, volcanoLat] = volcano.geometry.coordinates;
          const distance = this.calculateDistance(lat, lon, volcanoLat, volcanoLon);
          return distance <= radiusKm;
        }
        return false;
      });
      
      console.log(`🌋 Found ${nearbyVolcanoes.length} volcanoes within ${radiusMiles} miles`);
      
      // Count active volcanoes
      const activeVolcanoes = nearbyVolcanoes.filter((volcano: any) => 
        volcano.properties?.status?.toLowerCase().includes('active') ||
        volcano.properties?.status?.toLowerCase().includes('erupting')
      );
      
      const summary = nearbyVolcanoes.length > 0 
        ? `${nearbyVolcanoes.length} volcano${nearbyVolcanoes.length !== 1 ? 'es' : ''} found within ${radiusMiles} miles`
        : 'No volcanoes found';
      
      return {
        count: nearbyVolcanoes.length,
        active: activeVolcanoes.length,
        summary,
        volcanoes: nearbyVolcanoes
      };
    } catch (error) {
      console.error('🌋 USGS Volcano query failed:', error);
      return { count: 0, active: 0, summary: 'Volcano data unavailable', error: error instanceof Error ? error.message : String(error) };
    }
  }

  private async getFloodReferencePoints(lat: number, lon: number, radiusMiles: number): Promise<any> {
    try {
      console.log(`🌊 USGS Flood Reference Points query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`);
      
      // USGS RTFI API endpoint for flooding reference points
      const baseUrl = 'https://api.waterdata.usgs.gov/rtfi-api/referencepoints/flooding';
      
      // Try to query with proximity parameters first
      let response;
      try {
        // Attempt proximity query (if supported by the API)
        const radiusKm = radiusMiles * 1.60934; // Convert miles to km
        const proximityUrl = `${baseUrl}?latitude=${lat}&longitude=${lon}&radius=${radiusKm}`;
        console.log(`🔗 USGS RTFI Proximity Query URL: ${proximityUrl}`);
        
        response = await fetch(proximityUrl);
        if (response.ok) {
          const data = await response.json();
          console.log(`🌊 Proximity query successful, found ${data.length || 0} reference points`);
          
          if (data && Array.isArray(data) && data.length > 0) {
            // Verify the data actually contains points near our location
            const nearbyPoints = data.filter((point: any) => {
              if (point.latitude && point.longitude) {
                const distance = this.calculateDistance(lat, lon, point.latitude, point.longitude);
                const isNearby = distance <= radiusKm;
                if (isNearby) {
                  console.log(`🌊 Found nearby point: ${point.site_name} at distance ${distance.toFixed(2)} km`);
                }
                return isNearby;
              }
              return false;
            });
            
            console.log(`🌊 After proximity filtering: ${nearbyPoints.length} points within ${radiusKm} km`);
            
            // Filter for actively flooding points
            const activeFloodingPoints = nearbyPoints.filter((point: any) => 
              point.is_flooding === true && point.active === true
            );
            
            console.log(`🌊 Found ${activeFloodingPoints.length} actively flooding reference points`);
            
            const summary = activeFloodingPoints.length > 0 
              ? `${activeFloodingPoints.length} actively flooding reference point${activeFloodingPoints.length !== 1 ? 's' : ''} found within ${radiusMiles} miles`
              : 'No actively flooding reference points found';
            
            return {
              count: nearbyPoints.length,
              active_flooding: activeFloodingPoints.length,
              summary,
              reference_points: activeFloodingPoints
            };
          } else {
            console.log('🌊 Proximity query returned no data or invalid format, falling back to full dataset');
          }
        } else {
          console.log(`🌊 Proximity query failed with status ${response.status}: ${response.statusText}`);
        }
      } catch (proximityError) {
        console.log('🌊 Proximity query failed, falling back to full dataset filtering:', proximityError);
      }
      
      // Fallback: Download all data and filter client-side
      console.log(`🌊 Falling back to full dataset query and client-side filtering`);
      response = await fetch(baseUrl);
      
      if (!response.ok) {
        throw new Error(`USGS RTFI API failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`🌊 Downloaded ${data.length || 0} reference points from USGS RTFI API`);
      
      if (!data || !Array.isArray(data)) {
        console.log('🌊 No reference points found in response');
        return { count: 0, active_flooding: 0, summary: 'No reference points found' };
      }
      
      // Log a few sample points to verify data structure
      if (data.length > 0) {
        console.log('🌊 Sample data structure:', {
          firstPoint: data[0],
          hasLatLon: data[0].latitude !== undefined && data[0].longitude !== undefined,
          latLonType: typeof data[0].latitude
        });
      }
      
      // Filter reference points by proximity and flooding status
      const radiusKm = radiusMiles * 1.60934; // Convert miles to km
      console.log(`🌊 Filtering ${data.length} points for proximity within ${radiusKm} km of [${lat}, ${lon}]`);
      
      const nearbyPoints = data.filter((point: any) => {
        if (point.latitude && point.longitude) {
          const distance = this.calculateDistance(lat, lon, point.latitude, point.longitude);
          const isNearby = distance <= radiusKm;
          
          // Log some debugging info for the first few points
          if (data.indexOf(point) < 5) {
            console.log(`🌊 Point ${point.site_name || 'unnamed'}: [${point.latitude}, ${point.longitude}] - distance: ${distance.toFixed(2)} km - nearby: ${isNearby}`);
          }
          
          return isNearby;
        }
        return false;
      });
      
      console.log(`🌊 Found ${nearbyPoints.length} reference points within ${radiusMiles} miles`);
      
      // Filter for actively flooding points
      const activeFloodingPoints = nearbyPoints.filter((point: any) => 
        point.is_flooding === true && point.active === true
      );
      
      console.log(`🌊 Found ${activeFloodingPoints.length} actively flooding reference points`);
      
      const summary = activeFloodingPoints.length > 0 
        ? `${activeFloodingPoints.length} actively flooding reference point${activeFloodingPoints.length !== 1 ? 's' : ''} found within ${radiusMiles} miles`
        : 'No actively flooding reference points found';
      
      return {
        count: nearbyPoints.length,
        active_flooding: activeFloodingPoints.length,
        summary,
        reference_points: activeFloodingPoints
      };
    } catch (error) {
      console.error('🌊 USGS Flood Reference Points query failed:', error);
      return { count: 0, active_flooding: 0, summary: 'Flood reference points data unavailable', error: error instanceof Error ? error.message : String(error) };
    }
  }




  
  private getCustomPOIData(_enrichmentId: string): any {
    // This method should return custom POI data from poiConfigManager
    // For now, return null
    return null;
  }
  
  private getCustomPOICount(_enrichmentId: string, _lat: number, _lon: number, _radius: number, _customPOI: any): Promise<Record<string, any>> {
    // This method should handle custom POI counting
    // For now, return a placeholder
    return Promise.resolve({
      [`${_enrichmentId}_count`]: 0,
      [`${_enrichmentId}_summary`]: 'Custom POI not yet implemented'
    });
  }
  
  private categorizeWikipediaArticle(title: string, _article: any): string[] {
    // Simple categorization based on title keywords
    const categories: string[] = [];
    
    if (title.toLowerCase().includes('school') || title.toLowerCase().includes('university') || title.toLowerCase().includes('college')) {
      categories.push('Education');
    }
    if (title.toLowerCase().includes('park') || title.toLowerCase().includes('garden') || title.toLowerCase().includes('trail')) {
      categories.push('Recreation');
    }
    if (title.toLowerCase().includes('museum') || title.toLowerCase().includes('theater') || title.toLowerCase().includes('gallery')) {
      categories.push('Culture');
    }
    if (title.toLowerCase().includes('hospital') || title.toLowerCase().includes('clinic') || title.toLowerCase().includes('medical')) {
      categories.push('Healthcare');
    }
    if (title.toLowerCase().includes('church') || title.toLowerCase().includes('temple') || title.toLowerCase().includes('mosque')) {
      categories.push('Religion');
    }
    
    return categories.length > 0 ? categories : ['General'];
  }
  
  private groupArticlesByCategory(categorizedArticles: Array<{title: string, categories: string[], article: any}>): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};
    
    categorizedArticles.forEach(({title, categories, article}) => {
      categories.forEach(category => {
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push({title, article});
      });
    });
    
    return grouped;
  }
  
  private generateWikipediaSummary(articlesByCategory: Record<string, any[]>): string {
    const categorySummaries = Object.entries(articlesByCategory).map(([category, articles]) => {
      return `${category}: ${articles.length} articles`;
    });
    
    return categorySummaries.join(', ');
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
    const startTime = performance.now();
    
    console.log(`🚀 Starting parallel enrichment queries for coordinates [${lat}, ${lon}]`);
    
    // Create parallel promises for all default enrichments
    const defaultEnrichmentPromises = [
      // Weather queries (can run in parallel)
      this.getOpenMeteoWeather(lat, lon).catch(error => {
        console.error('Open-Meteo weather query failed:', error);
        return { open_meteo_weather_error: error instanceof Error ? error.message : 'Unknown error' };
      }),
      
      this.getNWSWeatherAlerts(lat, lon, 25).catch(error => {
        console.error('NWS weather alerts query failed:', error);
        return { nws_weather_alerts_error: error instanceof Error ? error.message : 'Unknown error' };
      }),
      
      // Terrain analysis (includes elevation, so we don't need separate elevation query)
      getTerrainAnalysis(lat, lon).then(terrainAnalysis => {
        console.log(`✅ Terrain analysis complete: ${terrainAnalysis.elevation}m elevation, ${terrainAnalysis.slope.toFixed(1)}° slope, ${terrainAnalysis.aspect.toFixed(0)}° aspect (${terrainAnalysis.slopeDirection})`);
        return {
          terrain_elevation: terrainAnalysis.elevation,
          terrain_slope: Math.round(terrainAnalysis.slope * 10) / 10,
          terrain_aspect: Math.round(terrainAnalysis.aspect),
          terrain_slope_direction: terrainAnalysis.slopeDirection,
          // Also provide elevation_ft for compatibility
          elevation_ft: Math.round(terrainAnalysis.elevation * 3.28084)
        };
      }).catch(error => {
        console.error('Terrain analysis failed:', error);
        return { terrain_analysis_error: error instanceof Error ? error.message : 'Unknown error' };
      }),
      
      // Census/FIPS query
      this.runSingleEnrichment('fips', lat, lon, poiRadii).catch(error => {
        console.error('Census/FIPS query failed:', error);
        return { fips_error: error instanceof Error ? error.message : 'Unknown error' };
      }),
      
      // ACS demographics query
      this.runSingleEnrichment('acs', lat, lon, poiRadii).catch(error => {
        console.error('ACS demographics query failed:', error);
        return { acs_error: error instanceof Error ? error.message : 'Unknown error' };
      })
    ];
    
    // Create parallel promises for selected enrichments
    const selectedEnrichmentPromises = selectedEnrichments.map(enrichmentId => 
      this.runSingleEnrichment(enrichmentId, lat, lon, poiRadii).catch(error => {
        console.error(`Enrichment ${enrichmentId} failed:`, error);
        return { [`${enrichmentId}_error`]: error instanceof Error ? error.message : 'Unknown error' };
      })
    );
    
    // Wait for all enrichments to complete in parallel
    console.log(`⏱️  Running ${defaultEnrichmentPromises.length + selectedEnrichmentPromises.length} enrichment queries in parallel...`);
    
    const allResults = await Promise.allSettled([
      ...defaultEnrichmentPromises,
      ...selectedEnrichmentPromises
    ]);
    
    // Process results
    allResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        Object.assign(enrichments, result.value);
      } else {
        console.error(`Enrichment promise ${index} rejected:`, result.reason);
      }
    });
    
    const endTime = performance.now();
    const totalTime = Math.round(endTime - startTime);
    
    // Update performance metrics
    this.performanceMetrics.totalQueries += 1;
    this.performanceMetrics.totalTime += totalTime;
    this.performanceMetrics.averageTime = Math.round(this.performanceMetrics.totalTime / this.performanceMetrics.totalQueries);
    this.performanceMetrics.parallelQueries += defaultEnrichmentPromises.length + selectedEnrichmentPromises.length;
    
    console.log(`🎯 All enrichments completed in ${totalTime}ms (parallel execution)`);
    console.log(`📊 Performance Stats: ${this.performanceMetrics.totalQueries} total queries, ${this.performanceMetrics.averageTime}ms average`);
    
    return enrichments;
  }

  private async runSingleEnrichment(
    enrichmentId: string, 
    lat: number, 
    lon: number, 
    poiRadii: Record<string, number>
  ): Promise<Record<string, any>> {
    // Cap radii for performance, but allow wildfires up to 50 miles
    let maxRadius = 5; // Default 5 mile cap
    if (enrichmentId === 'poi_wildfires') {
      maxRadius = 50; // Wildfires can be up to 50 miles for risk assessment
    }
    
    const radius = Math.min(poiRadii[enrichmentId] || this.getDefaultRadius(enrichmentId), maxRadius);

    switch (enrichmentId) {
      case 'elev':
        const elevationMeters = await this.getElevation(lat, lon);
        const elevationFeet = elevationMeters ? Math.round(elevationMeters * 3.28084) : null;
        return { elevation_ft: elevationFeet };
      
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
      
      case 'poi_museums_historic':
        return await this.getPOICount('poi_museums_historic', lat, lon, radius);
      
      case 'poi_bars_nightlife':
        return await this.getPOICount('poi_bars_nightlife', lat, lon, radius);
      
      case 'poi_powerlines':
        return await this.getPOICount('poi_powerlines', lat, lon, radius);
      
      case 'poi_cell_towers':
        return await this.getPOICount('poi_cell_towers', lat, lon, radius);
      
      case 'poi_fema_flood_zones':
        return await this.getFEMAFloodZones(lat, lon, radius);
      
      case 'poi_wetlands':
        return await this.getWetlands(lat, lon, radius);
      
      case 'poi_earthquakes':
        return await this.getEarthquakes(lat, lon, radius);
      
      case 'poi_volcanoes':
        const volcanoData = await this.getVolcanoes(lat, lon, radius);
        return {
          poi_volcanoes_count: volcanoData.count,
          poi_volcanoes_active: volcanoData.active,
          poi_volcanoes_summary: volcanoData.summary,
          poi_volcanoes_proximity_distance: radius
        };
      
      case 'poi_flood_reference_points':
        const floodRefData = await this.getFloodReferencePoints(lat, lon, radius);
        return {
          poi_flood_reference_points_count: floodRefData.count,
          poi_flood_reference_points_active_flooding: floodRefData.active_flooding,
          poi_flood_reference_points_summary: floodRefData.summary,
          poi_flood_reference_points_proximity_distance: radius
        };
      
      // EPA FRS Environmental Hazards
      case 'poi_epa_brownfields':
        return await this.getEPAFRSFacilities(lat, lon, radius, 'ACRES');
      case 'poi_epa_superfund':
        return await this.getEPAFRSFacilities(lat, lon, radius, 'SEMS/CERCLIS');
      case 'poi_epa_rcra':
        return await this.getEPAFRSFacilities(lat, lon, radius, 'RCRAInfo');
      case 'poi_epa_tri':
        return await this.getEPAFRSFacilities(lat, lon, radius, 'TRI');
      case 'poi_epa_npdes':
        return await this.getEPAFRSFacilities(lat, lon, radius, 'NPDES');
      case 'poi_epa_air':
        return await this.getEPAFRSFacilities(lat, lon, radius, 'ICIS-AIR');
      case 'poi_epa_radiation':
        return await this.getEPAFRSFacilities(lat, lon, radius, 'RADINFO');
      case 'poi_epa_power':
        return await this.getEPAFRSFacilities(lat, lon, radius, 'EGRID');
      case 'poi_epa_oil_spill':
        return await this.getEPAFRSFacilities(lat, lon, radius, 'SPCC/FRP');
      
      // PAD-US Public Lands & Protected Areas
      case 'poi_padus_public_access':
        return await this.getPADUSPublicAccess(lat, lon, radius);
      case 'poi_padus_protection_status':
        return await this.getPADUSProtectionStatus(lat, lon, radius);
      
      // USDA Local Food Portal - Farmers Markets & Local Food
      case 'poi_usda_agritourism':
        return await this.getUSDALocalFood(lat, lon, radius, 'agritourism');
      case 'poi_usda_csa':
        return await this.getUSDALocalFood(lat, lon, radius, 'csa');
      case 'poi_usda_farmers_market':
        return await this.getUSDALocalFood(lat, lon, radius, 'farmersmarket');
      case 'poi_usda_food_hub':
        return await this.getUSDALocalFood(lat, lon, radius, 'foodhub');
      case 'poi_usda_onfarm_market':
        return await this.getUSDALocalFood(lat, lon, radius, 'onfarmmarket');
      
      // Electric Charging Stations via OpenChargeMap API
              case 'poi_electric_charging':
          return await this.getElectricChargingStations(lat, lon, radius);
        case 'poi_gas_stations':
          return await this.getGasStations(lat, lon, radius);
      
      // USDA Wildfire Risk to Communities (WRC) - Point-based risk assessment
      case 'usda_wildfire_hazard_potential':
      case 'usda_burn_probability':
      case 'usda_conditional_flame_length':
      case 'usda_risk_to_structures':
      case 'usda_conditional_risk_to_structures':
      case 'usda_exposure_type':
        // All USDA wildfire risk layers are handled together for efficiency
        return await this.getUSDAWildfireRisk(lat, lon);
    
    default:
      if (enrichmentId.startsWith('at_')) {
        // Handle Appalachian Trail queries
        if (enrichmentId === 'at_osm_features') {
          // Special handling for OSM AT features
          return await this.getOSMATFeatures(lat, lon, radius);
        }
        return await this.getATFeatures(enrichmentId, lat, lon, radius);
      } else if (enrichmentId.startsWith('poi_')) {
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

  private async getUSDAWildfireRisk(lat: number, lon: number): Promise<Record<string, any>> {
    try {
      console.log(`🔥 Fetching USDA Wildfire Risk data for [${lat}, ${lon}]`);
      
      const wildfireData = await getUSDAWildfireRiskData(lat, lon);
      
      const result: Record<string, any> = {};
      
      // Wildfire Hazard Potential (WHP)
      if (wildfireData.whp !== null) {
        result.usda_wildfire_hazard_potential = wildfireData.whp;
        result.usda_wildfire_hazard_potential_label = wildfireData.whp_label;
      }
      
      // Burn Probability (BP)
      if (wildfireData.bp !== null) {
        result.usda_burn_probability = wildfireData.bp;
        result.usda_burn_probability_percentage = wildfireData.bp_percentage;
      }
      
      // Conditional Flame Length (CFL)
      if (wildfireData.cfl !== null) {
        result.usda_conditional_flame_length = wildfireData.cfl;
        result.usda_conditional_flame_length_label = wildfireData.cfl_label;
      }
      
      // Risk to Potential Structures (RPS)
      if (wildfireData.rps !== null) {
        result.usda_risk_to_structures = wildfireData.rps;
      }
      
      // Conditional Risk to Potential Structures (cRPS)
      if (wildfireData.cRPS !== null) {
        result.usda_conditional_risk_to_structures = wildfireData.cRPS;
      }
      
      // Exposure Type
      if (wildfireData.exposure_type !== null) {
        result.usda_exposure_type = wildfireData.exposure_type;
        result.usda_exposure_type_label = wildfireData.exposure_label;
      }
      
      // Source attribution
      result.usda_wildfire_risk_source = wildfireData.source;
      
      // Handle errors
      if (wildfireData.error) {
        result.usda_wildfire_risk_error = wildfireData.error;
        console.warn(`⚠️ USDA Wildfire Risk API had errors:`, wildfireData.error);
      }
      
      console.log(`✅ USDA Wildfire Risk data processed:`, {
        whp: result.usda_wildfire_hazard_potential_label,
        bp: result.usda_burn_probability_percentage ? `${result.usda_burn_probability_percentage.toFixed(3)}%` : 'N/A',
        cfl: result.usda_conditional_flame_length_label,
        exposure: result.usda_exposure_type_label
      });
      
      return result;
      
    } catch (error) {
      console.error(`❌ Error fetching USDA Wildfire Risk data:`, error);
      return {
        usda_wildfire_risk_error: error instanceof Error ? error.message : 'Unknown error',
        usda_wildfire_risk_source: 'USDA Forest Service - Wildfire Risk to Communities'
      };
    }
  }

  private async getFIPSCodes(lat: number, lon: number): Promise<Record<string, any>> {
    try {
      console.log('🌐 Fetching rich census data from Census Geocoder API...');
      
      // Try direct API first, then CORS proxy if needed
      const directUrl = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${lon}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(directUrl)}`;
      
      console.log('🌐 Census Geocoder Direct URL:', directUrl);
      
      let j;
      try {
        // Try direct first
        j = await fetchJSONSmart(directUrl);
      } catch (corsError) {
        console.warn('⚠️ Direct Census API blocked by CORS, trying proxy...', corsError);
        console.log('🌐 Census Geocoder Proxy URL:', proxyUrl);
        j = await fetchJSONSmart(proxyUrl);
      }
      
      if (!j?.result?.geographies) {
        console.warn('⚠️ Census Geocoder returned no geographic data');
        return {};
      }
      
      const geo = j.result.geographies;
      
      // Extract all the rich geographic data
      const state = geo.States?.[0];
      const county = geo.Counties?.[0];
      const tract = geo['Census Tracts']?.[0];
      const block = geo['2020 Census Blocks']?.[0];
      const place = geo['Incorporated Places']?.[0];
      const urbanArea = geo['Urban Areas']?.[0];
      const csa = geo['Combined Statistical Areas']?.[0];
      const subdivision = geo['County Subdivisions']?.[0];
      const congressionalDistrict = geo['119th Congressional Districts']?.[0];
      const stateSenate = geo['2024 State Legislative Districts - Upper']?.[0];
      const stateHouse = geo['2024 State Legislative Districts - Lower']?.[0];
      
      const result: Record<string, any> = {};
      
      // Basic FIPS codes (for compatibility)
      if (block && tract && county && state) {
        result.fips_block = block.GEOID;
        result.fips_tract = tract.GEOID;
        result.fips_state = state.STATE;
        result.fips_county = county.COUNTY;
        result.fips_tract6 = tract.TRACT;
      }
      
      // Rich State Information
      if (state) {
        result.state_name = state.NAME;
        result.state_code = state.STUSAB;
        result.state_geoid = state.GEOID;
        result.state_region = state.REGION;
        result.state_division = state.DIVISION;
      }
      
      // Rich County Information
      if (county) {
        result.county_name = county.NAME;
        result.county_geoid = county.GEOID;
        result.county_basename = county.BASENAME;
      }
      
      // Census Tract Information
      if (tract) {
        result.census_tract_name = tract.NAME;
        result.census_tract_geoid = tract.GEOID;
        result.census_tract_basename = tract.BASENAME;
      }
      
      // Census Block Information
      if (block) {
        result.census_block_name = block.NAME;
        result.census_block_geoid = block.GEOID;
        result.census_block_basename = block.BASENAME;
        result.census_block_urban_rural = block.UR === 'U' ? 'Urban' : 'Rural';
      }
      
      // Incorporated Place (City/Town)
      if (place) {
        result.city_name = place.NAME;
        result.city_geoid = place.GEOID;
        result.city_basename = place.BASENAME;
        result.city_functional_status = place.FUNCSTAT;
      }
      
      // Urban Area
      if (urbanArea) {
        result.urban_area_name = urbanArea.NAME;
        result.urban_area_geoid = urbanArea.GEOID;
        result.urban_area_basename = urbanArea.BASENAME;
      }
      
      // Combined Statistical Area (Metro Area)
      if (csa) {
        result.metro_area_name = csa.NAME;
        result.metro_area_geoid = csa.GEOID;
        result.metro_area_basename = csa.BASENAME;
      }
      
      // County Subdivision
      if (subdivision) {
        result.subdivision_name = subdivision.NAME;
        result.subdivision_geoid = subdivision.GEOID;
        result.subdivision_basename = subdivision.BASENAME;
      }
      
      // Congressional District
      if (congressionalDistrict) {
        result.congressional_district = congressionalDistrict.NAME;
        result.congressional_district_geoid = congressionalDistrict.GEOID;
        result.congressional_district_number = congressionalDistrict.CD119;
      }
      
      // State Legislative Districts
      if (stateSenate) {
        result.state_senate_district = stateSenate.NAME;
        result.state_senate_district_geoid = stateSenate.GEOID;
      }
      
      if (stateHouse) {
        result.state_house_district = stateHouse.NAME;
        result.state_house_district_geoid = stateHouse.GEOID;
      }
      
      console.log('✅ Rich census/geographic data successfully retrieved:', Object.keys(result).length, 'fields');
      return result;
      
    } catch (error) {
      console.error('❌ Census Geocoder API error:', error);
      console.warn('⚠️ Census/geographic data will be unavailable for this location');
      
      // Return empty object but don't break the entire enrichment process
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
      console.error('❌ Census ACS API error:', error);
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
      console.log(`🔍 getPOICount called for ${enrichmentId} at [${lat}, ${lon}] with ${radius}mi radius`);
      
      // Use Overpass API for OSM-based POIs
      const filters = this.getFiltersFor(enrichmentId);
      console.log(`🔍 Filters found for ${enrichmentId}:`, filters);
      
      if (filters.length > 0) {
        // Handle custom API calls (like Animal Vehicle Collisions and Wildfires)
        if (filters.includes("custom_api")) {
          console.log(`🔍 Calling custom API for ${enrichmentId}...`);
          
          let result;
          if (enrichmentId === "poi_animal_vehicle_collisions") {
            result = await this.getAnimalVehicleCollisions(lat, lon, radius);
          } else if (enrichmentId === "poi_wildfires") {
            result = await this.getWildfires(lat, lon, radius);
          } else {
            console.warn(`Unknown custom API enrichment: ${enrichmentId}`);
            result = { count: 0, elements: [], detailed_pois: [] };
          }
          
          console.log(`🔍 Custom API result for ${enrichmentId}:`, {
            count: result.count,
            elementsCount: result.elements?.length || 0,
            hasDetailedPois: !!(result as any).detailed_pois,
            detailedPoisCount: (result as any).detailed_pois?.length || 0
          });
          
          const countKey = `${enrichmentId}_count_${radius}mi`;
          const poiResult: Record<string, any> = { [countKey]: result.count };
          
          // Include detailed POI data for mapping (if available)
          if ((result as any).detailed_pois && (result as any).detailed_pois.length > 0) {
            poiResult[`${enrichmentId}_detailed`] = (result as any).detailed_pois;
            console.log(`✅ Added ${(result as any).detailed_pois.length} detailed POIs for ${enrichmentId}`);
          } else {
            console.log(`⚠️  No detailed POIs found for ${enrichmentId}`);
          }
          
          // Include ALL POI data for CSV export (complete dataset)
          if ((result as any).all_pois && (result as any).all_pois.length > 0) {
            poiResult[`${enrichmentId}_all_pois`] = (result as any).all_pois;
            console.log(`✅ Added ${(result as any).all_pois.length} ALL POIs for ${enrichmentId} CSV export`);
          } else {
            console.log(`⚠️  No all_pois found for ${enrichmentId}`);
          }
          
          // Include elements data for map display (if available)
          if ((result as any).elements && (result as any).elements.length > 0) {
            poiResult[`${enrichmentId}_elements`] = (result as any).elements;
            console.log(`✅ Added ${(result as any).elements.length} elements for ${enrichmentId} map display`);
          } else {
            console.log(`⚠️  No elements found for ${enrichmentId}`);
          }
          
          console.log(`🔍 Final poiResult for ${enrichmentId}:`, poiResult);
          return poiResult;
        }
        
        // Handle OSM-based POIs
        console.log(`🔍 Calling overpassCountMiles for ${enrichmentId}...`);
        const result = await this.overpassCountMiles(lat, lon, radius, filters);
        console.log(`🔍 overpassCountMiles result for ${enrichmentId}:`, {
          count: result.count,
          elementsCount: result.elements?.length || 0,
          hasDetailedPois: !!(result as any).detailed_pois,
          detailedPoisCount: (result as any).detailed_pois?.length || 0
        });
        
        const countKey = `${enrichmentId}_count_${radius}mi`;
        const poiResult: Record<string, any> = { [countKey]: result.count };
        
        // Include detailed POI data for mapping (if available)
        if ((result as any).detailed_pois && (result as any).detailed_pois.length > 0) {
          poiResult[`${enrichmentId}_detailed`] = (result as any).detailed_pois;
          console.log(`✅ Added ${(result as any).detailed_pois.length} detailed POIs for ${enrichmentId}`);
        } else {
          console.log(`⚠️  No detailed POIs found for ${enrichmentId}`);
        }
        
        // Include ALL POI data for CSV export (complete dataset)
        if ((result as any).all_pois && (result as any).all_pois.length > 0) {
          poiResult[`${enrichmentId}_all_pois`] = (result as any).all_pois;
          console.log(`✅ Added ${(result as any).all_pois.length} ALL POIs for ${enrichmentId} CSV export`);
        } else {
          console.log(`⚠️  No all_pois found for ${enrichmentId}`);
        }
        
        // Include elements data for map display (if available)
        if ((result as any).elements && (result as any).elements.length > 0) {
          poiResult[`${enrichmentId}_elements`] = (result as any).elements;
          console.log(`✅ Added ${(result as any).elements.length} elements for ${enrichmentId} map display`);
        } else {
          console.log(`⚠️  No elements found for ${enrichmentId}`);
        }
        
        console.log(`🔍 Final poiResult for ${enrichmentId}:`, poiResult);
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
    
    if (id === "poi_schools") {
      console.log(`🏫 Schools filter requested - returning ["amenity=school"]`);
      return ["amenity=school"];
    }
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
    if (id === "poi_theatres") return ["amenity=theatre"];
    if (id === "poi_museums_historic") return ["tourism=museum", "historic=memorial", "historic=monument", "historic=castle", "historic=ruins", "historic=archaeological_site"];
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
     if (id === "poi_powerlines") return ["power=line"];
     if (id === "poi_power_plants") return ["power=plant", "power=generator"];
     if (id === "poi_railroads") return ["railway=rail"];
     if (id === "poi_gas") return ["amenity=fuel"];
     
     // The Location Is Everything Company - Animal Vehicle Collisions
     if (id === "poi_animal_vehicle_collisions") return ["custom_api"];
     
     // NIFC/Esri Current Wildfires
     if (id === "poi_wildfires") return ["custom_api"];
     
     // Fix missing POI types showing 0 counts
     if (id === "poi_tnm_airports") return ["aeroway=aerodrome", "aeroway=airport"];
     if (id === "poi_tnm_railroads") return ["railway=rail"];
     if (id === "poi_tnm_trails") return ["route=hiking", "route=foot", "leisure=park"];
     
     // Comprehensive transportation POI types
     if (id === "poi_bus") return ["highway=bus_stop", "amenity=bus_station"];
     if (id === "poi_train") return ["railway=station", "railway=halt", "public_transport=platform"];
     if (id === "poi_subway_metro") return ["railway=station", "railway=subway_entrance", "public_transport=platform"];
     if (id === "poi_tram") return ["railway=tram_stop", "public_transport=platform"];
     if (id === "poi_monorail") return ["railway=monorail", "public_transport=platform"];
     if (id === "poi_aerialway") return ["aerialway=gondola", "aerialway=cable_car", "aerialway=chair_lift", "aerialway=station"];
     if (id === "poi_ferry") return ["amenity=ferry_terminal", "route=ferry"];
     if (id === "poi_airport_air") return ["aeroway=terminal", "aeroway=gate", "public_transport=platform"];
     if (id === "poi_taxi") return ["amenity=taxi"];
     if (id === "poi_bike_scooter_share") return ["amenity=bicycle_rental", "amenity=scooter_rental"];
     if (id === "poi_dockless_hub") return ["amenity=bicycle_rental", "amenity=scooter_rental"];
     
     // Natural Resources
     if (id === "poi_beaches") return ["natural=beach"];
     if (id === "poi_lakes_ponds") return ["water=lake", "water=pond"];
     if (id === "poi_rivers_streams") return ["waterway=river", "waterway=stream", "waterway=brook"];
     if (id === "poi_mountains_peaks") return ["natural=peak", "natural=mountain"];
     
     // Legacy transportation POI types (keeping for backward compatibility)
     if (id === "poi_train_stations") return ["railway=station", "railway=halt", "station=subway"];
     if (id === "poi_bus_stations") return ["amenity=bus_station", "public_transport=station"];
     if (id === "poi_bus_stops") return ["highway=platform", "public_transport=platform"];
     if (id === "poi_cell_towers") return ["man_made=mast", "man_made=tower", "tower:type=communication", "communication:mobile_phone=yes"];
     if (id === "poi_bars_nightlife") return ["amenity=bar", "amenity=pub", "amenity=nightclub", "amenity=biergarten", "amenity=music_venue"];
     
           // Hazards
      if (id === "poi_fema_flood_zones") return ["fema_flood_zones"]; // Special handling for FEMA flood zones
      
      // EPA FRS Environmental Hazards
      if (id === "poi_epa_brownfields") return ["epa_frs_brownfields"];
      if (id === "poi_epa_superfund") return ["epa_frs_superfund"];
      if (id === "poi_epa_rcra") return ["epa_frs_rcra"];
      if (id === "poi_epa_tri") return ["epa_frs_tri"];
      if (id === "poi_epa_npdes") return ["epa_frs_npdes"];
      if (id === "poi_epa_air") return ["epa_frs_air"];
      if (id === "poi_epa_radiation") return ["epa_frs_radiation"];
      if (id === "poi_epa_power") return ["epa_frs_power"];
      if (id === "poi_epa_oil_spill") return ["epa_frs_oil_spill"];
      
      // USDA Local Food Portal - Farmers Markets & Local Food
      if (id === "poi_usda_agritourism") return ["usda_agritourism"];
      if (id === "poi_usda_csa") return ["usda_csa"];
      if (id === "poi_usda_farmers_market") return ["usda_farmers_market"];
      if (id === "poi_usda_food_hub") return ["usda_food_hub"];
      if (id === "poi_usda_onfarm_market") return ["usda_onfarm_market"];
    
    console.log(`⚠️  No OSM filters found for: ${id}`);
    return [];
  }



  private async overpassCountMiles(lat: number, lon: number, radiusMiles: number, filters: string[]): Promise<{ count: number, elements: any[] }> {
    try {
      console.log(`🗺️  overpassCountMiles called with:`, {
        lat,
        lon,
        radiusMiles,
        filters,
        timestamp: new Date().toISOString()
      });
      
      // Calculate accurate bounding box using proven 111,320 meters per degree formula
      const bbox = this.calculateBoundingBox(lat, lon, radiusMiles);
      
          // Build query using your exact working syntax - ALL element types for POIs
    let queryParts: string[] = [];
    filters.forEach(filter => {
      // Fix: Overpass needs separate quotes around key and value: ["key"="value"]
      const [key, value] = filter.split('=');
      // Overpass expects bbox in parentheses: (south,west,north,east)
      // The bbox variable already contains the comma-separated values
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
      console.log(`📦 Formatted Bbox: (${bbox})`);
      console.log(`🔍 Filters: ${filters.join(', ')}`);
      console.log(`🔍 Query Parts:`, queryParts);
      console.log(`📝 Final Query: ${q}`);
      
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
      
      // Process POIs returned by bbox (server has already filtered spatially)
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
        
        // Skip POIs with no name or "unnamed" names
        const poiName = el.tags?.name;
        if (!poiName || poiName.toLowerCase().includes('unnamed')) {
          continue;
        }
        
        // Trust server's bbox filtering - no need to recalculate distance
        const key = `${norm(poiName)}|${latc.toFixed(3)},${lonc.toFixed(3)}`;
        if (!seen.has(key)) {
          seen.add(key);
          nearbyPOIs.push({
            ...el,
            distance_miles: 'Within bbox' // Server already filtered by distance
          });
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

        // TEMPORARY: Show detailed school records for inspection
        if (nearbyPOIs.length > 0 && filters.some(f => f.includes('school'))) {
          // Sort by distance (closest to farthest)
          const sortedPOIs = [...nearbyPOIs].sort((a, b) => a.distance_miles - b.distance_miles);
          
          console.log(`🏫  DETAILED SCHOOL RECORDS (showing ALL by proximity):`);
          console.log(`📊 Total schools found: ${nearbyPOIs.length}`);
          console.log(`📍 Distance range: ${sortedPOIs[0].distance_miles} - ${sortedPOIs[sortedPOIs.length - 1].distance_miles} miles`);
          
          sortedPOIs.forEach((poi, index) => {
            console.log(`\n--- School ${index + 1} (${poi.distance_miles} miles) ---`);
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
      if (nearbyPOIs.length > 0) {
        const sortedPOIs = [...nearbyPOIs].sort((a, b) => a.distance_miles - b.distance_miles);
        
        // Store ALL POIs for CSV export (complete dataset)
        result.all_pois = sortedPOIs.map(poi => ({
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
        
        // Limit to top 50 closest POIs for map display (to avoid overwhelming the map)
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
      'poi_powerlines': 5,
      'poi_cell_towers': 5,
      'poi_eq': 5,
      'poi_fema_floodzones': 2,
      'poi_usgs_volcano': 5,
      'poi_wikipedia': 5,
      'poi_police_stations': 5,
      'poi_fire_stations': 5,
      'poi_urgent_care': 5,
      'poi_golf_courses': 5,
      'poi_bars_nightlife': 2,
      'poi_boat_ramps': 5,
      'poi_cafes_coffee': 3,
       'poi_markets': 5,
       'poi_fema_flood_zones': 5,
       
       // EPA FRS Environmental Hazards
       'poi_epa_brownfields': 5,
       'poi_epa_superfund': 5,
       'poi_epa_rcra': 5,
       'poi_epa_tri': 5,
       'poi_epa_npdes': 5,
       'poi_epa_air': 5,
       'poi_epa_radiation': 5,
       'poi_epa_power': 5,
       'poi_epa_oil_spill': 5,
       
       // USDA Local Food Portal - Farmers Markets & Local Food
       'poi_usda_agritourism': 5,
       'poi_usda_csa': 5,
       'poi_usda_farmers_market': 5,
       'poi_usda_food_hub': 5,
       'poi_usda_onfarm_market': 5
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

     // EPA FRS (Facility Registry Service) Environmental Hazards enrichment
   private async getEPAFRSFacilities(lat: number, lon: number, radiusMiles: number, programType: string): Promise<Record<string, any>> {
    console.log(`🏭 EPA FRS ${programType} query for [${lat}, ${lon}] within ${radiusMiles} miles`);
    
    // Use the correct EPA FRS REST API endpoint as provided by user
    const baseUrl = 'https://ofmpub.epa.gov/frs_public2/frs_rest_services.get_facilities';
    const url = new URL(baseUrl);
    
    // Set query parameters for proximity search using correct parameter names
    url.searchParams.set('latitude83', lat.toString());
    url.searchParams.set('longitude83', lon.toString());
    url.searchParams.set('search_radius', radiusMiles.toString());
    url.searchParams.set('output', 'JSON');
    
    // Add program-specific filters using the correct parameter name
    if (programType !== 'ACRES') {
      url.searchParams.set('pgm_sys_acrnm', programType);
    }
    
    console.log(`🔗 EPA FRS API URL: ${url.toString()}`);
    
    try {
      const response = await fetchJSONSmart(url.toString());
      console.log(`📊 EPA FRS API response:`, response);
    
      if (!response || !response.Results || !response.Results.FRSFacility || !Array.isArray(response.Results.FRSFacility)) {
        console.log(`⚠️  No EPA FRS facilities found for ${programType}`);
        return {
          [`poi_epa_${this.getEPAProgramId(programType)}_count`]: 0,
          [`poi_epa_${this.getEPAProgramId(programType)}_facilities`]: [],
          [`poi_epa_${this.getEPAProgramId(programType)}_summary`]: `No ${this.getEPAProgramLabel(programType)} facilities found within ${radiusMiles} miles`
        };
      }
      
      const facilities = response.Results.FRSFacility;
      console.log(`🏭 Found ${facilities.length} EPA FRS ${programType} facilities`);
      
      // Process and categorize facilities
      const processedFacilities = facilities.map((facility: any) => ({
        id: facility.facility_id || facility.registry_id,
        name: facility.facility_name || 'Unnamed Facility',
        program: programType,
        status: facility.facility_status || 'Unknown',
        address: facility.street_address || 'N/A',
        city: facility.city_name || 'N/A',
        state: facility.state_code || 'N/A',
        zip: facility.zip_code || 'N/A',
        lat: facility.latitude83 || facility.latitude,
        lon: facility.longitude83 || facility.longitude,
        distance_miles: this.calculateDistance(lat, lon, facility.latitude83 || facility.latitude, facility.longitude83 || facility.longitude) * 0.621371,
        raw_data: facility
      }));
      
      // Filter by actual distance and sort by proximity
      const nearbyFacilities = processedFacilities
        .filter((f: any) => f.distance_miles <= radiusMiles)
        .sort((a: any, b: any) => a.distance_miles - b.distance_miles);
      
      console.log(`✅ EPA FRS ${programType}: ${nearbyFacilities.length} facilities within ${radiusMiles} miles`);
      
      // Show detailed facility records for inspection
      if (nearbyFacilities.length > 0) {
        console.log(`🏭 DETAILED EPA FRS ${programType} FACILITIES (showing ALL by proximity):`);
        nearbyFacilities.forEach((facility: any, index: number) => {
          console.log(`\n--- Facility ${index + 1} (${facility.distance_miles.toFixed(2)} miles) ---`);
          console.log(`Name: ${facility.name}`);
          console.log(`Program: ${facility.program}`);
          console.log(`Status: ${facility.status}`);
          console.log(`Address: ${facility.address}, ${facility.city}, ${facility.state} ${facility.zip}`);
          console.log(`Coordinates: ${facility.lat}, ${facility.lon}`);
          console.log(`Distance: ${facility.distance_miles.toFixed(2)} miles`);
        });
      }
      
      const programId = this.getEPAProgramId(programType);
      const programLabel = this.getEPAProgramLabel(programType);
      
      return {
        [`poi_epa_${programId}_count`]: nearbyFacilities.length,
        [`poi_epa_${programId}_facilities`]: nearbyFacilities,
        [`poi_epa_${programId}_summary`]: `Found ${nearbyFacilities.length} ${programLabel} facilities within ${radiusMiles} miles`
      };
      
    } catch (error) {
      console.error(`❌ EPA FRS ${programType} API error:`, error);
      console.error(`🔗 Failed URL: https://ofmpub.epa.gov/frs_public2/frs_rest_services.get_facilities`);
      console.error(`📋 Program Type: ${programType}`);
      console.error(`📍 Coordinates: [${lat}, ${lon}]`);
      console.error(`📏 Radius: ${radiusMiles} miles`);
      
      // Check if this is a CORS error
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isCORSError = errorMessage.includes('CORS') || errorMessage.includes('blocked') || errorMessage.includes('Access-Control');
      
      if (isCORSError) {
        console.log(`🌐 CORS policy blocked EPA FRS API access - this is expected in browser environments`);
        console.log(`💡 EPA FRS data may be available through the ArcGIS fallback service`);
      }
      
      const programId = this.getEPAProgramId(programType);
      return {
        [`poi_epa_${programId}_count`]: 0,
        [`poi_epa_${programId}_facilities`]: [],
        [`poi_epa_${programId}_summary`]: `No ${this.getEPAProgramLabel(programType)} facilities found within ${radiusMiles} miles`
      };
    }
  }
  
  // Helper methods for EPA program identification
  private getEPAProgramId(programType: string): string {
    const programMap: Record<string, string> = {
      'ACRES': 'brownfields',
      'SEMS/CERCLIS': 'superfund',
      'RCRAInfo': 'rcra',
      'TRI': 'tri',
      'NPDES': 'npdes',
      'ICIS-AIR': 'air',
      'RADINFO': 'radiation',
      'EGRID': 'power',
      'SPCC/FRP': 'oil_spill'
    };
        return programMap[programType] || programType.toLowerCase();
 }
  
  // Helper methods for EPA program labels
  private getEPAProgramLabel(programType: string): string {
    const programMap: Record<string, string> = {
      'ACRES': 'Brownfields',
      'SEMS/CERCLIS': 'Superfund',
      'RCRAInfo': 'RCRA',
      'TRI': 'TRI',
      'NPDES': 'NPDES',
      'ICIS-AIR': 'Air Facilities',
      'RADINFO': 'Radiation',
      'EGRID': 'Power Generation',
      'SPCC/FRP': 'Oil Spill Response'
    };
    return programMap[programType] || programType;
  }
  
  // USDA Local Food Portal - Farmers Markets & Local Food enrichment
  private async getUSDALocalFood(lat: number, lon: number, radiusMiles: number, foodType: string): Promise<Record<string, any>> {
    try {
      console.log(`🌾 USDA Local Food Portal ${foodType} query for [${lat}, ${lon}] within ${radiusMiles} miles`);
      
      // USDA Local Food Portal API endpoints
      const apiEndpoints: Record<string, string> = {
        'agritourism': 'https://www.usdalocalfoodportal.com/api/agritourism/',
        'csa': 'https://www.usdalocalfoodportal.com/api/csa/',
        'farmersmarket': 'https://www.usdalocalfoodportal.com/api/farmersmarket/',
        'foodhub': 'https://www.usdalocalfoodportal.com/api/foodhub/',
        'onfarmmarket': 'https://www.usdalocalfoodportal.com/api/onfarmmarket/'
      };
      
      const apiUrl = apiEndpoints[foodType];
      if (!apiUrl) {
        throw new Error(`Unknown USDA food type: ${foodType}`);
      }
      
      // Build URL with correct query parameters
      // Use x, y, and radius parameters for coordinate-based search
      const url = new URL(apiUrl);
      url.searchParams.set('x', lon.toString()); // longitude
      url.searchParams.set('y', lat.toString()); // latitude
      url.searchParams.set('radius', Math.min(radiusMiles, 100).toString()); // max 100 miles
      
      console.log(`🔗 USDA API URL: ${url.toString()}`);
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`USDA API HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`📊 USDA ${foodType} API response:`, data);
      
      if (!data || !Array.isArray(data)) {
        console.log(`⚠️  No USDA ${foodType} data found`);
        return this.createEmptyUSDAResult(foodType, radiusMiles);
      }
      
      const facilities = data;
      console.log(`🌾 Found ${facilities.length} USDA ${foodType} facilities`);
      
      // Process facilities and calculate distances
      const processedFacilities = facilities.map((facility: any) => {
                // Extract coordinates from facility data
        let facilityLat: number | null = null;
        let facilityLon: number | null = null;
        
        // Try different possible coordinate field names from USDA API response
        if (facility.latitude && facility.longitude) {
          facilityLat = parseFloat(facility.latitude);
          facilityLon = parseFloat(facility.longitude);
        } else if (facility.lat && facility.lon) {
          facilityLat = parseFloat(facility.lat);
          facilityLon = parseFloat(facility.lon);
        } else if (facility.x && facility.y) {
          // Handle x,y coordinate format
          facilityLon = parseFloat(facility.x);
          facilityLat = parseFloat(facility.y);
        } else if (facility.geometry && facility.geometry.coordinates) {
          // Handle GeoJSON format if present
          facilityLon = parseFloat(facility.geometry.coordinates[0]);
          facilityLat = parseFloat(facility.geometry.coordinates[1]);
        }
        
        if (facilityLat && facilityLon && !isNaN(facilityLat) && !isNaN(facilityLon)) {
          const distanceMiles = this.calculateDistance(lat, lon, facilityLat, facilityLon) * 0.621371;
          
          return {
            id: facility.id || facility.listing_id || facility.record_id || Math.random().toString(36).substr(2, 9),
            name: facility.listing_name || facility.name || facility.facility_name || facility.market_name || 'Unnamed Facility',
            type: foodType,
            lat: facilityLat,
            lon: facilityLon,
              distance_miles: Math.round(distanceMiles * 100) / 100,
            address: facility.location_address || facility.address || facility.street_address || 'N/A',
            city: facility.location_city || facility.city || facility.city_name || 'N/A',
            state: facility.location_state || facility.state || facility.state_code || 'N/A',
            zip: facility.location_zipcode || facility.zip || facility.zip_code || 'N/A',
            phone: facility.phone || facility.phone_number || 'N/A',
            website: facility.media_website || facility.website || facility.url || 'N/A',
            description: facility.description || facility.notes || '',
            season: facility.season || facility.seasonality || 'N/A',
            raw_data: facility
          };
        }
        
        return null;
      }).filter(Boolean); // Remove null entries
      
            console.log(`🌾 Processed ${processedFacilities.length} USDA ${foodType} facilities with coordinates`);
      
      // Filter by actual distance and sort by proximity
      const nearbyFacilities = processedFacilities
        .filter((f: any) => f.distance_miles <= radiusMiles)
        .sort((a: any, b: any) => a.distance_miles - b.distance_miles);
      
      console.log(`✅ USDA ${foodType}: ${nearbyFacilities.length} facilities within ${radiusMiles} miles`);
      
      // Show detailed facility records for inspection
      if (nearbyFacilities.length > 0) {
        console.log(`🌾 DETAILED USDA ${foodType.toUpperCase()} FACILITIES (showing ALL by proximity):`);
        nearbyFacilities.forEach((facility: any, index: number) => {
          console.log(`\n--- Facility ${index + 1} (${facility.distance_miles.toFixed(2)} miles) ---`);
          console.log(`Name: ${facility.name}`);
          console.log(`Type: ${facility.type}`);
          console.log(`Address: ${facility.address}, ${facility.city}, ${facility.state} ${facility.zip}`);
          console.log(`Coordinates: ${facility.lat}, ${facility.lon}`);
          console.log(`Distance: ${facility.distance_miles.toFixed(2)} miles`);
          console.log(`Phone: ${facility.phone}`);
          console.log(`Website: ${facility.website}`);
          console.log(`Season: ${facility.season}`);
        });
      }
      
      const foodTypeId = this.getUSDAFoodTypeId(foodType);
      const foodTypeLabel = this.getUSDAFoodTypeLabel(foodType);

      return {
        [`poi_usda_${foodTypeId}_count`]: nearbyFacilities.length,
        [`poi_usda_${foodTypeId}_facilities`]: nearbyFacilities,
        [`poi_usda_${foodTypeId}_summary`]: `Found ${nearbyFacilities.length} ${foodTypeLabel} within ${radiusMiles} miles`,
        [`poi_usda_${foodTypeId}_source`]: 'USDA Local Food Portal',
        [`poi_usda_${foodTypeId}_note`]: 'Data from USDA Local Food Portal API'
      };

    } catch (error) {
      console.error(`❌ USDA Local Food Portal ${foodType} API error:`, error);
      
      const foodTypeId = this.getUSDAFoodTypeId(foodType);
      return {
        [`poi_usda_${foodTypeId}_count`]: 0,
        [`poi_usda_${foodTypeId}_facilities`]: [],
        [`poi_usda_${foodTypeId}_error`]: `USDA API error: ${error instanceof Error ? error.message : String(error)}`,
        [`poi_usda_${foodTypeId}_status`]: 'API error'
      };
    }
  }
  
  // Helper methods for USDA food type identification
  private getUSDAFoodTypeId(foodType: string): string {
    const foodTypeMap: Record<string, string> = {
      'agritourism': 'agritourism',
      'csa': 'csa',
      'farmersmarket': 'farmers_market',
      'foodhub': 'food_hub',
      'onfarmmarket': 'onfarm_market'
    };
    return foodTypeMap[foodType] || foodType;
  }
  
  private getUSDAFoodTypeLabel(foodType: string): string {
    const foodTypeMap: Record<string, string> = {
      'agritourism': 'Agritourism',
      'csa': 'CSA Programs',
      'farmersmarket': 'Farmers Markets',
      'foodhub': 'Food Hubs',
      'onfarmmarket': 'On-Farm Markets'
    };
    return foodTypeMap[foodType] || foodType;
  }
  
  // Helper method to create empty USDA results
  private createEmptyUSDAResult(foodType: string, radiusMiles: number): Record<string, any> {
    const foodTypeId = this.getUSDAFoodTypeId(foodType);
    const foodTypeLabel = this.getUSDAFoodTypeLabel(foodType);
    
    return {
      [`poi_usda_${foodTypeId}_count`]: 0,
      [`poi_usda_${foodTypeId}_facilities`]: [],
      [`poi_usda_${foodTypeId}_summary`]: `No ${foodTypeLabel} found within ${radiusMiles} miles`,
      [`poi_usda_${foodTypeId}_source`]: 'USDA Local Food Portal',
      [`poi_usda_${foodTypeId}_note`]: 'No facilities in this area'
    };
  }

  private async getNWSWeatherAlerts(lat: number, lon: number, radiusMiles: number): Promise<Record<string, any>> {
    try {
      console.log(`🌤️  NWS Weather Alerts query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`);

      // NWS Alerts API endpoint with point parameter (lat,lon format)
      // The NWS API will return alerts that intersect with the specified point
      const url = `https://api.weather.gov/alerts/active?point=${lat.toFixed(6)},${lon.toFixed(6)}`;

      console.log(`🔗 NWS Weather Alerts API URL: ${url}`);
      console.log(`📍 Query Point: [${lat}, ${lon}] (${radiusMiles} mile radius)`);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`NWS API failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`📊 NWS API response:`, data);

      if (!data || !data.features || !Array.isArray(data.features)) {
        console.log('🌤️  No weather alerts found in response');
        return {
          nws_weather_alerts_count: 0,
          nws_weather_alerts_active: 0,
          nws_weather_alerts_summary: 'No active weather alerts',
          nws_weather_alerts_details: []
        };
      }

      console.log(`🌤️  Found ${data.features.length} weather alerts at point`);

      // Filter alerts to only include those within the actual radius
      const radiusKm = radiusMiles * 1.60934; // Convert miles to km
      const alertsWithinRadius = data.features.filter((alert: any) => {
        // Check if the alert's area intersects with our radius
        if (alert.geometry && alert.geometry.coordinates) {
          // For simplicity, check if the center of the alert area is within our radius
          // This is a simplified approach - for more precision, you could check polygon intersection
          let alertLat: number, alertLon: number;

          if (alert.geometry.type === 'Point') {
            // Single point alert
            [alertLon, alertLat] = alert.geometry.coordinates;
          } else if (alert.geometry.type === 'Polygon') {
            // Polygon alert - use the centroid (simplified)
            const coords = alert.geometry.coordinates[0]; // First ring
            const centerLon = coords.reduce((sum: number, coord: number[]) => sum + coord[0], 0) / coords.length;
            const centerLat = coords.reduce((sum: number, coord: number[]) => sum + coord[1], 0) / coords.length;
            alertLon = centerLon;
            alertLat = centerLat;
          } else {
            // Other geometry types - skip for now
            return false;
          }

          if (alertLat && alertLon) {
            const distance = this.calculateDistance(lat, lon, alertLat, alertLon);
            return distance <= radiusKm;
          }
        }
        return false;
      });

      console.log(`🌤️  Found ${alertsWithinRadius.length} weather alerts within ${radiusMiles} miles`);

      // Process alert details
      const alertDetails = alertsWithinRadius.map((alert: any) => {
        const properties = alert.properties || {};
        return {
          id: alert.id || 'Unknown',
          event: properties.event || 'Unknown Event',
          severity: properties.severity || 'Unknown',
          urgency: properties.urgency || 'Unknown',
          certainty: properties.certainty || 'Unknown',
          headline: properties.headline || 'No headline',
          description: properties.description || 'No description',
          instruction: properties.instruction || 'No instructions',
          area_desc: properties.areaDesc || 'Unknown area',
          effective: properties.effective ? new Date(properties.effective).toLocaleString() : 'Unknown',
          expires: properties.expires ? new Date(properties.expires).toLocaleString() : 'Unknown',
          status: properties.status || 'Unknown'
        };
      });

      // Count by severity
      const severityCounts = alertDetails.reduce((counts: Record<string, number>, alert: any) => {
        const severity = alert.severity.toLowerCase();
        counts[severity] = (counts[severity] || 0) + 1;
        return counts;
      }, {});

      // Generate summary
      let summary = '';
      if (alertsWithinRadius.length === 0) {
        summary = 'No active weather alerts';
      } else if (alertsWithinRadius.length === 1) {
        summary = `1 active weather alert: ${alertDetails[0].event}`;
      } else {
        summary = `${alertsWithinRadius.length} active weather alerts`;
        if (severityCounts.extreme) {
          summary += ` (${severityCounts.extreme} extreme)`;
        }
        if (severityCounts.severe) {
          summary += ` (${severityCounts.severe} severe)`;
        }
      }

      return {
        nws_weather_alerts_count: alertsWithinRadius.length,
        nws_weather_alerts_active: alertsWithinRadius.length,
        nws_weather_alerts_summary: summary,
        nws_weather_alerts_details: alertDetails,
        nws_weather_alerts_severity_breakdown: severityCounts,
        nws_weather_alerts_radius_miles: radiusMiles
      };

    } catch (error) {
      console.error('🌤️  NWS Weather Alerts query failed:', error);
      return {
        nws_weather_alerts_count: 0,
        nws_weather_alerts_active: 0,
        nws_weather_alerts_summary: 'Weather alert data unavailable',
        nws_weather_alerts_error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async getOpenMeteoWeather(lat: number, lon: number): Promise<Record<string, any>> {
    try {
      console.log(`🌡️  Open-Meteo Weather query for coordinates [${lat}, ${lon}]`);

      // Open-Meteo API endpoint for current weather with timezone
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;

      console.log(`🔗 Open-Meteo Weather API URL: ${url}`);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Open-Meteo API failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`📊 Open-Meteo API response:`, data);

      if (!data || !data.current_weather) {
        console.log('🌡️  No current weather data found in response');
        return {
          open_meteo_weather_error: 'No current weather data available'
        };
      }

      const currentWeather = data.current_weather;
      console.log(`🌡️  Current weather data:`, currentWeather);

      // Convert weather code to human-readable description
      const weatherDescriptions: Record<number, string> = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Foggy',
        48: 'Depositing rime fog',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        56: 'Light freezing drizzle',
        57: 'Dense freezing drizzle',
        61: 'Slight rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        66: 'Light freezing rain',
        67: 'Heavy freezing rain',
        71: 'Slight snow fall',
        73: 'Moderate snow fall',
        75: 'Heavy snow fall',
        77: 'Snow grains',
        80: 'Slight rain showers',
        81: 'Moderate rain showers',
        82: 'Violent rain showers',
        85: 'Slight snow showers',
        86: 'Heavy snow showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with slight hail',
        99: 'Thunderstorm with heavy hail'
      };

      const weatherDescription = weatherDescriptions[currentWeather.weathercode] || 'Unknown weather condition';

      // Convert Celsius to Fahrenheit: (°C × 9/5) + 32
      const temperatureF = (currentWeather.temperature * 9/5) + 32;
      
      // Convert km/h to mph: km/h × 0.621371
      const windspeedMph = currentWeather.windspeed * 0.621371;

      return {
        open_meteo_weather_temperature_c: currentWeather.temperature,
        open_meteo_weather_temperature_f: temperatureF,
        open_meteo_weather_windspeed: currentWeather.windspeed,
        open_meteo_weather_windspeed_mph: windspeedMph,
        open_meteo_weather_winddirection: currentWeather.winddirection,
        open_meteo_weather_weathercode: currentWeather.weathercode,
        open_meteo_weather_weather_description: weatherDescription,
        open_meteo_weather_time: currentWeather.time,
        open_meteo_weather_timezone: data.timezone || 'Unknown',
        open_meteo_weather_timezone_abbreviation: data.timezone_abbreviation || 'Unknown',
        open_meteo_weather_utc_offset_seconds: data.utc_offset_seconds || 0,
        open_meteo_weather_summary: `Current weather: ${weatherDescription}, ${temperatureF.toFixed(1)}°F, ${windspeedMph.toFixed(1)} mph wind`
      };

    } catch (error) {
      console.error('🌡️  Open-Meteo Weather query failed:', error);
      return {
        open_meteo_weather_error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // PAD-US Public Access Query
  private async getPADUSPublicAccess(lat: number, lon: number, radiusMiles: number): Promise<Record<string, any>> {
    try {
      console.log(`🏞️ PAD-US Public Access query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`);
      
      // First, check if point is inside any public land (point-in-polygon)
      const insideQueryUrl = `https://services.arcgis.com/v01gqwM5QqNysAAi/ArcGIS/rest/services/PADUS_Public_Access/FeatureServer/0/query?where=1=1&geometry={"x":${lon},"y":${lat},"spatialReference":{"wkid":4326}}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=OBJECTID,Category,FeatClass,Unit_Nm,Pub_Access,GAP_Sts,IUCN_Cat,MngTp_Desc,MngNm_Desc,DesTp_Desc,BndryName,ST_Name,GIS_AcrsDb&f=json&returnGeometry=false`;
      
      console.log(`🔗 PAD-US Inside Query URL: ${insideQueryUrl}`);
      const insideResponse = await fetch(insideQueryUrl);
      
      if (!insideResponse.ok) {
        throw new Error(`PAD-US API failed: ${insideResponse.status} ${insideResponse.statusText}`);
      }
      
      const insideData = await insideResponse.json();
      console.log(`📊 PAD-US Inside Query response:`, insideData);
      
      // Check if point is inside any public land
      const isInsidePublicLand = insideData.features && insideData.features.length > 0;
      let insideLandInfo = null;
      
      if (isInsidePublicLand) {
        const feature = insideData.features[0];
        insideLandInfo = {
          category: feature.attributes.Category,
          featureClass: feature.attributes.FeatClass,
          unitName: feature.attributes.Unit_Nm,
          publicAccess: feature.attributes.Pub_Access,
          gapStatus: feature.attributes.GAP_Sts,
          iucnCategory: feature.attributes.IUCN_Cat,
          managerType: feature.attributes.MngTp_Desc,
          managerName: feature.attributes.MngNm_Desc,
          designationType: feature.attributes.DesTp_Desc,
          boundaryName: feature.attributes.BndryName,
          state: feature.attributes.ST_Name,
          acres: feature.attributes.GIS_AcrsDb
        };
      }
      
      // Now query for nearby public lands within radius
      const radiusKm = radiusMiles * 1.60934;
      const nearbyQueryUrl = `https://services.arcgis.com/v01gqwM5QqNysAAi/ArcGIS/rest/services/PADUS_Public_Access/FeatureServer/0/query?where=1=1&geometry={"x":${lon},"y":${lat},"spatialReference":{"wkid":4326}}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusKm}&units=esriSRUnit_Kilometer&outFields=OBJECTID,Category,FeatClass,Unit_Nm,Pub_Access,GAP_Sts,IUCN_Cat,MngTp_Desc,MngNm_Desc,DesTp_Desc,BndryName,ST_Name,GIS_AcrsDb&f=json&returnGeometry=false&maxRecordCount=1000`;
      
      console.log(`🔗 PAD-US Nearby Query URL: ${nearbyQueryUrl}`);
      const nearbyResponse = await fetch(nearbyQueryUrl);
      
      if (!nearbyResponse.ok) {
        throw new Error(`PAD-US Nearby API failed: ${nearbyResponse.status} ${nearbyResponse.statusText}`);
      }
      
      const nearbyData = await nearbyResponse.json();
      console.log(`📊 PAD-US Nearby Query response:`, nearbyData);
      
      const nearbyLands = nearbyData.features || [];
      
      // Count by access type
      const accessCounts = {
        open: nearbyLands.filter((f: any) => f.attributes.Pub_Access === 'OA').length,
        restricted: nearbyLands.filter((f: any) => f.attributes.Pub_Access === 'RA').length,
        closed: nearbyLands.filter((f: any) => f.attributes.Pub_Access === 'XA').length
      };
      
      // Count by manager type
      const managerCounts: Record<string, number> = {};
      nearbyLands.forEach((feature: any) => {
        const managerType = feature.attributes.MngTp_Desc || 'Unknown';
        managerCounts[managerType] = (managerCounts[managerType] || 0) + 1;
      });
      
      return {
        padus_public_access_inside: isInsidePublicLand,
        padus_public_access_inside_info: insideLandInfo,
        padus_public_access_nearby_count: nearbyLands.length,
        padus_public_access_nearby_access_counts: accessCounts,
        padus_public_access_nearby_manager_counts: managerCounts,
        padus_public_access_nearby_features: nearbyLands.map((feature: any) => ({
          objectId: feature.attributes.OBJECTID,
          category: feature.attributes.Category,
          featureClass: feature.attributes.FeatClass,
          unitName: feature.attributes.Unit_Nm,
          publicAccess: feature.attributes.Pub_Access,
          gapStatus: feature.attributes.GAP_Sts,
          iucnCategory: feature.attributes.IUCN_Cat,
          managerType: feature.attributes.MngTp_Desc,
          managerName: feature.attributes.MngNm_Desc,
          designationType: feature.attributes.DesTp_Desc,
          boundaryName: feature.attributes.BndryName,
          state: feature.attributes.ST_Name,
          acres: feature.attributes.GIS_AcrsDb
        })),
        padus_public_access_summary: isInsidePublicLand 
          ? `Location is inside ${insideLandInfo?.unitName || 'public land'} (${insideLandInfo?.managerName || 'Unknown Manager'}) - ${insideLandInfo?.publicAccess || 'Unknown'} access`
          : `No public lands at this location. Found ${nearbyLands.length} public lands within ${radiusMiles} miles.`
      };
      
    } catch (error) {
      console.error('🏞️ PAD-US Public Access query failed:', error);
      return { padus_public_access_error: error instanceof Error ? error.message : String(error) };
    }
  }

  // PAD-US Protection Status Query
  private async getPADUSProtectionStatus(lat: number, lon: number, radiusMiles: number): Promise<Record<string, any>> {
    try {
      console.log(`🛡️ PAD-US Protection Status query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`);
      
      const radiusKm = radiusMiles * 1.60934;
      const queryUrl = `https://services.arcgis.com/v01gqwM5QqNysAAi/ArcGIS/rest/services/PADUS_Public_Access/FeatureServer/0/query?where=1=1&geometry={"x":${lon},"y":${lat},"spatialReference":{"wkid":4326}}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusKm}&units=esriSRUnit_Kilometer&outFields=OBJECTID,GAP_Sts,IUCN_Cat,Category,Unit_Nm,Pub_Access&f=json&returnGeometry=false&maxRecordCount=1000`;
      
      console.log(`🔗 PAD-US Protection Status Query URL: ${queryUrl}`);
      const response = await fetch(queryUrl);
      
      if (!response.ok) {
        throw new Error(`PAD-US Protection Status API failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`📊 PAD-US Protection Status response:`, data);
      
      const features = data.features || [];
      
      // Count by GAP status
      const gapStatusCounts: Record<string, number> = {};
      features.forEach((feature: any) => {
        const gapStatus = feature.attributes.GAP_Sts || 'Unknown';
        gapStatusCounts[gapStatus] = (gapStatusCounts[gapStatus] || 0) + 1;
      });
      
      // Count by IUCN category
      const iucnCounts: Record<string, number> = {};
      features.forEach((feature: any) => {
        const iucnCat = feature.attributes.IUCN_Cat || 'Unknown';
        iucnCounts[iucnCat] = (iucnCounts[iucnCat] || 0) + 1;
      });
      
      // Count by category
      const categoryCounts: Record<string, number> = {};
      features.forEach((feature: any) => {
        const category = feature.attributes.Category || 'Unknown';
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });
      
      return {
        padus_protection_status_nearby_count: features.length,
        padus_protection_status_gap_counts: gapStatusCounts,
        padus_protection_status_iucn_counts: iucnCounts,
        padus_protection_status_category_counts: categoryCounts,
        padus_protection_status_nearby_features: features.map((feature: any) => ({
          objectId: feature.attributes.OBJECTID,
          gapStatus: feature.attributes.GAP_Sts,
          iucnCategory: feature.attributes.IUCN_Cat,
          category: feature.attributes.Category,
          unitName: feature.attributes.Unit_Nm,
          publicAccess: feature.attributes.Pub_Access
        })),
        padus_protection_status_summary: `Found ${features.length} protected areas within ${radiusMiles} miles with various protection levels and categories.`
      };
      
    } catch (error) {
      console.error('🛡️ PAD-US Protection Status query failed:', error);
      return { padus_protection_status_error: error instanceof Error ? error.message : String(error) };
    }
  }

  // Electric Charging Stations via OpenChargeMap API
  private async getElectricChargingStations(lat: number, lon: number, radiusMiles: number): Promise<Record<string, any>> {
    try {
      console.log(`🔌 Electric Charging Stations query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`);
      
      const apiKey = '3b819866-3a12-4dac-8ab1-7648e0a6f533';
      const queryUrl = `https://api.openchargemap.io/v3/poi/?output=json&countrycode=US&latitude=${lat}&longitude=${lon}&distance=${radiusMiles}&maxresults=50&key=${apiKey}`;
      
      console.log(`🔗 OpenChargeMap API URL: ${queryUrl}`);
      const response = await fetch(queryUrl);
      
      if (!response.ok) {
        throw new Error(`OpenChargeMap API failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`📊 OpenChargeMap response:`, data);
      
      const stations = data || [];
      const totalStations = stations.length;
      
      // Count by connection type
      const connectionCounts: Record<string, number> = {};
      const levelCounts: Record<string, number> = {};
      
      stations.forEach((station: any) => {
        // Count connection types
        if (station.Connections && Array.isArray(station.Connections)) {
          station.Connections.forEach((conn: any) => {
            const connectionType = conn.ConnectionType?.Title || 'Unknown';
            connectionCounts[connectionType] = (connectionCounts[connectionType] || 0) + 1;
            
            const level = conn.Level?.Title || 'Unknown';
            levelCounts[level] = (levelCounts[level] || 0) + 1;
          });
        }
      });
      
      // Get station details for mapping
      const stationDetails = stations.slice(0, 10).map((station: any) => ({
        id: station.ID,
        name: station.AddressInfo?.Title || 'Unnamed Station',
        address: station.AddressInfo?.AddressLine1 || 'No address',
        city: station.AddressInfo?.Town || 'Unknown city',
        state: station.AddressInfo?.StateOrProvince || 'Unknown state',
        lat: station.AddressInfo?.Latitude,
        lon: station.AddressInfo?.Longitude,
        connections: station.Connections?.length || 0,
        status: station.StatusType?.Title || 'Unknown'
      }));
      
      return {
        poi_electric_charging_count: totalStations,
        poi_electric_charging_connection_types: connectionCounts,
        poi_electric_charging_levels: levelCounts,
        poi_electric_charging_detailed: stationDetails,
        poi_electric_charging_proximity_distance: radiusMiles,
        poi_electric_charging_summary: `Found ${totalStations} electric charging stations within ${radiusMiles} miles with various connection types and charging levels.`
      };
      
    } catch (error) {
      console.error('🔌 Electric Charging Stations query failed:', error);
      return { 
        poi_electric_charging_count: 0,
        poi_electric_charging_error: error instanceof Error ? error.message : String(error) 
      };
    }
  }


  private async getGasStations(lat: number, lon: number, radiusMiles: number): Promise<Record<string, any>> {
    try {
      console.log(`⛽ Gas Stations query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`);
      const radiusMeters = Math.round(radiusMiles * 1609.34);
      const query = `[out:json];(node["amenity"="fuel"](around:${radiusMeters},${lat},${lon});way["amenity"="fuel"](around:${radiusMeters},${lat},${lon});relation["amenity"="fuel"](around:${radiusMeters},${lat},${lon}););out center;`;
      const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      const elements = data.elements || [];
      const count = elements.length;
      
      // Process gas station details for mapping
      const stationDetails = elements.slice(0, 10).map((element: any) => ({
        id: element.id,
        name: element.tags?.name || element.tags?.brand || 'Unnamed Gas Station',
        brand: element.tags?.brand || 'Unknown',
        address: element.tags?.['addr:street'] || 'No address',
        city: element.tags?.['addr:city'] || 'Unknown city',
        state: element.tags?.['addr:state'] || 'Unknown state',
        lat: element.lat || element.center?.lat,
        lon: element.lon || element.center?.lon,
        type: element.type,
        phone: element.tags?.phone,
        website: element.tags?.website,
        self_service: element.tags?.self_service
      }));
      
      return {
        poi_gas_stations_summary: `Found ${count} gas stations within ${radiusMiles} miles.`,
        poi_gas_stations_detailed: stationDetails
      };
    } catch (error) {
      console.error('Gas Stations query failed:', error);
      return { 
        poi_gas_stations_summary: 'No gas stations found due to error.',
        poi_gas_stations_error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // The Location Is Everything Company - Animal Vehicle Collisions API
  private async getAnimalVehicleCollisions(lat: number, lon: number, radiusMiles: number): Promise<Record<string, any>> {
    try {
      console.log(`🦌 Animal Vehicle Collisions query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`);
      
      // Use the working public endpoint with spatial filtering
      const API_BASE = "https://api.locationfriend.com";
      const queryUrl = `${API_BASE}/vehicle_animal_collisions_api`;
      
      // Use simple bounds filtering that your API supports
      const params = new URLSearchParams();
      params.append('select', '*');
      params.append('limit', '1000');
      
      // Add simple lat/lon bounds (much more efficient than fetching all data)
      const latRange = radiusMiles / 69; // Rough conversion: 1 degree ≈ 69 miles
      params.append('lat', `gte.${lat - latRange}`);
      params.append('lat', `lte.${lat + latRange}`);
      params.append('lon', `gte.${lon - latRange}`);
      params.append('lon', `lte.${lon + latRange}`);
      
      const fullUrl = `${queryUrl}?${params.toString()}`;
      console.log(`🔗 Animal Vehicle Collisions API with bounds filter: ${fullUrl}`);
      
      // Use GET method with bounds filtering
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: { 
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Animal Vehicle Collisions API failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`📊 Animal Vehicle Collisions response:`, data);
      console.log(`📊 First collision record structure:`, data[0]);
      console.log(`📊 Available fields:`, data[0] ? Object.keys(data[0]) : 'No data');
      
      // Debug: Check what source values we're actually getting
      if (Array.isArray(data) && data.length > 0) {
        const allSources = data.map(c => c.source).filter(Boolean);
        console.log(`🦌 ALL SOURCES IN RESPONSE:`, allSources);
        console.log(`🦌 UNIQUE SOURCES:`, [...new Set(allSources)]);
        console.log(`🦌 SAMPLE COLLISION WITH SOURCE:`, data.find(c => c.source));
      }
      
      // Server now returns only spatially filtered data - much simpler processing
      const allCollisions = Array.isArray(data) ? data : [];
      console.log(`🦌 Received ${allCollisions.length} collisions from server-side spatial filtering`);
      
      // Process coordinates and track sources (no distance filtering needed)
      const collisionsInUserRadius: any[] = [];
      const collisionsIn2Miles: any[] = [];
      const uniqueSources = new Set<string>();
      
      for (const collision of allCollisions) {
        // Extract coordinates
        let lat: number | null = null;
        let lon: number | null = null;
        
        if (collision.geom && collision.geom.coordinates) {
          // PostGIS geometry format: [lon, lat]
          [lon, lat] = collision.geom.coordinates;
        } else if (collision.lat && collision.lon) {
          // Direct lat/lon format
          lat = collision.lat;
          lon = collision.lon;
        }
        
        if (!lat || !lon) continue; // Skip invalid coordinates
        
        // Add to source tracking
        if (collision.source) {
          uniqueSources.add(collision.source);
        }
        
        // Server already filtered by distance - just categorize by intended use
        collisionsInUserRadius.push({
          ...collision,
          lat,
          lon,
          distance_miles: 'Server filtered'
        });
        
        // For map display, use all data (server already filtered appropriately)
        collisionsIn2Miles.push({
          ...collision,
          lat,
          lon,
          distance_miles: 'Server filtered'
        });
      }
      
      const totalCollisions = collisionsInUserRadius.length;
      const mapCollisions = collisionsIn2Miles.length;
      console.log(`📍 Found ${totalCollisions} collisions within ${radiusMiles} miles (user proximity) for CSV export`);
      console.log(`📍 Found ${mapCollisions} collisions within 2 miles for map display (pattern detection)`);
      
      // Convert Set to array for display
      const uniqueSourcesArray = Array.from(uniqueSources);
      const sourceSummary = uniqueSourcesArray.length > 0 ? uniqueSourcesArray.join(', ') : 'No source data available';
      
      console.log(`🦌 Raw collisions in user radius:`, collisionsInUserRadius.length);
      console.log(`🦌 Sources from collisions:`, collisionsInUserRadius.map(c => c.source));
      console.log(`🦌 Unique sources found:`, uniqueSourcesArray);
      console.log(`🦌 Source summary:`, sourceSummary);
      
      // Create individual source entries for each collision to ensure they appear in popup
      const sourceEntries = collisionsInUserRadius.map((collision: any) => ({
        key: 'poi_animal_vehicle_collisions_source',
        value: collision.source || 'Unknown'
      }));
      
      // Create detailed POI data for mapping (2-mile radius) - ALL POINTS, no limit!
      const collisionDetails = collisionsIn2Miles.map((collision: any, index: number) => {
        const distance = this.calculateDistance(lat, lon, collision.lat, collision.lon) * 0.621371;
        
        return {
          id: `collision_${collision.id || index}`,
          name: `Animal Vehicle Collision`,
          description: `Collision record from ${collision.source || 'FARS'} database`,
          lat: collision.lat,
          lon: collision.lon,
          crash_year: collision.crash_year,
          source: collision.source,
          st_case: collision.st_case,
          distance_miles: distance.toFixed(2),
          // Include all original fields
          ...collision
        };
      });
      
      // Create a result structure that matches the expected POI format
      const result = {
        count: totalCollisions, // Total count for CSV export (user proximity) - KEEP ORIGINAL STRUCTURE
        poi_animal_vehicle_collisions_count: totalCollisions, // ALSO ADD COUNT FIELD FOR DISPLAY
        elements: collisionsIn2Miles, // Elements for map display (2-mile radius)
        detailed_pois: collisionDetails, // Detailed POIs for map (2-mile radius)
        all_pois: collisionsInUserRadius, // ALL POIs for CSV export (user proximity)
        poi_animal_vehicle_collisions_source: sourceSummary, // ADD SOURCE FIELD WITHOUT BREAKING EXISTING CODE
        source_entries: sourceEntries, // ADD INDIVIDUAL SOURCE ENTRIES FOR POPUP DISPLAY
        summary: `Found ${totalCollisions} animal vehicle collision records within ${radiusMiles} miles from The Location Is Everything Company database.`,
        api_source: 'https://api.locationfriend.com/vehicle_animal_collisions_api'
      };
      
      console.log(`🦌 Returning AVI result:`, result);
      console.log(`🦌 Source field value:`, result.poi_animal_vehicle_collisions_source);
      
      return result;
      
    } catch (error) {
      console.error('🦌 Animal Vehicle Collisions query failed:', error);
      return { 
        count: 0, 
        elements: [], 
        detailed_pois: [], 
        all_pois: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        api_source: 'https://api.locationfriend.com/vehicle_animal_collisions_api'
      };
    }
  }

  // NIFC/Esri Current Wildfires API
  private async getWildfires(lat: number, lon: number, radiusMiles: number): Promise<Record<string, any>> {
    try {
      console.log(`🔥 Current Wildfires query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`);
      
      // WFIGS Current Wildfire Incidents service (working service)
      const API_BASE = "https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/WFIGS_Incident_Locations_Current/FeatureServer/0/query";
      
      // Build query parameters for proximity search
      const params = new URLSearchParams({
        where: '1=1',
        geometry: `${lon},${lat}`,
        geometryType: 'esriGeometryPoint',
        inSR: '4326',
        spatialRel: 'esriSpatialRelIntersects',
        distance: radiusMiles.toString(),
        units: 'esriSRUnit_StatuteMile',
        outFields: 'IncidentName,POOState,PercentContained,FireDiscoveryDateTime,IRWINID,ContainmentDateTime,IncidentSize,IncidentTypeCategory',
        returnGeometry: 'true',
        f: 'json'
      });
      
      const queryUrl = `${API_BASE}?${params.toString()}`;
      console.log(`🔗 WFIGS Wildfires API URL: ${queryUrl}`);
      
      const response = await fetch(queryUrl, {
        method: 'GET',
        headers: { 
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`WFIGS Wildfires API failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`📊 WFIGS Wildfires response:`, data);
      
      // Handle the response data structure
      const features = data.features || [];
      console.log(`🔥 Received ${features.length} wildfire incidents from WFIGS API`);
      
      // Process wildfire incidents
      const wildfires: any[] = [];
      const wildfireDetails: any[] = [];
      
      features.forEach((feature: any, index: number) => {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry;
        
        // Extract coordinates (ArcGIS returns different geometry types)
        let fireLat: number | null = null;
        let fireLon: number | null = null;
        
        if (geometry) {
          if (geometry.x && geometry.y) {
            // Point geometry
            fireLon = geometry.x;
            fireLat = geometry.y;
          } else if (geometry.rings && geometry.rings.length > 0) {
            // Polygon geometry - use centroid of first ring
            const ring = geometry.rings[0];
            if (ring.length > 0) {
              fireLon = ring[0][0];
              fireLat = ring[0][1];
            }
          }
        }
        
        if (!fireLat || !fireLon) {
          console.warn(`🔥 Skipping wildfire with invalid coordinates:`, attributes);
          return;
        }
        
        // Calculate distance for display
        const distanceKm = this.calculateDistance(lat, lon, fireLat, fireLon);
        const distanceMiles = distanceKm * 0.621371;
        
        // Format dates
        const discoveryDate = attributes.FireDiscoveryDateTime ? 
          new Date(attributes.FireDiscoveryDateTime).toLocaleDateString() : 'Unknown';
        const containmentDate = attributes.ContainmentDateTime ? 
          new Date(attributes.ContainmentDateTime).toLocaleDateString() : 'Ongoing';
        
        // Create wildfire record
        const wildfire = {
          id: attributes.IRWINID || `wildfire_${index}`,
          name: attributes.IncidentName || 'Unnamed Fire',
          state: attributes.POOState || 'Unknown',
          containment: attributes.PercentContained || 0,
          discovery_date: discoveryDate,
          containment_date: containmentDate,
          size_acres: attributes.IncidentSize || 'Unknown',
          incident_type: attributes.IncidentTypeCategory || 'Wildfire',
          lat: fireLat,
          lon: fireLon,
          distance_miles: distanceMiles.toFixed(2)
        };
        
        wildfires.push(wildfire);
        
        // Create detailed POI data for mapping
        wildfireDetails.push({
          id: wildfire.id,
          name: wildfire.name,
          description: `${wildfire.incident_type} - ${wildfire.containment}% contained, discovered ${wildfire.discovery_date}`,
          lat: fireLat,
          lon: fireLon,
          distance_miles: wildfire.distance_miles,
          containment: wildfire.containment,
          size_acres: wildfire.size_acres,
          state: wildfire.state,
          discovery_date: wildfire.discovery_date
        });
      });
      
      const totalWildfires = wildfires.length;
      console.log(`📍 Found ${totalWildfires} wildfire incidents within ${radiusMiles} miles`);
      
      // Create result structure
      const result = {
        count: totalWildfires,
        elements: wildfires,
        detailed_pois: wildfireDetails,
        all_pois: wildfires,
        poi_wildfires_count: totalWildfires,
        poi_wildfires_proximity_distance: radiusMiles
      };
      
      console.log(`🔥 Wildfire query completed:`, {
        totalIncidents: totalWildfires,
        sampleNames: wildfires.slice(0, 3).map(w => w.name)
      });
      
      return result;
      
    } catch (error) {
      console.error('🔥 NIFC Wildfires query failed:', error);
      return { 
        count: 0,
        elements: [],
        detailed_pois: [],
        all_pois: [],
        poi_wildfires_count: 0
      };
    }
  }

  /**
   * Query OpenStreetMap Appalachian Trail features using Overpass API
   */
  private async getOSMATFeatures(
    lat: number,
    lon: number,
    radiusMiles: number
  ): Promise<Record<string, any>> {
    try {
      console.log(`🗺️ Querying OSM AT features within ${radiusMiles} miles of ${lat}, ${lon}`);

      // Limit radius to prevent timeout - max 2 miles for OSM queries
      const maxRadiusMiles = Math.min(radiusMiles, 2);
      const radiusMeters = Math.round(maxRadiusMiles * 1609.34);
      
      // Simplified Overpass API query - more efficient, shorter timeout
      const overpassQuery = `[out:json][timeout:15];
(
  // AT nodes only - most efficient query
  node["name"="Appalachian Trail"](around:${radiusMeters},${lat},${lon});
  node["amenity"="shelter"]["name"~"Appalachian Trail"](around:${radiusMeters},${lat},${lon});
);
out;`;

      console.log(`🗺️ OSM query: ${overpassQuery}`);

      // Try Overpass API with shorter timeout and retry logic
      let response;
      try {
        response = await fetchJSONSmart('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: overpassQuery,
          headers: {
            'Content-Type': 'text/plain;charset=UTF-8'
          }
        });
      } catch (overpassError) {
        console.warn(`🗺️ Primary Overpass API failed, trying alternative server:`, overpassError);
        // Try alternative Overpass server
        try {
          response = await fetchJSONSmart('https://lz4.overpass-api.de/api/interpreter', {
            method: 'POST',
            body: overpassQuery,
            headers: {
              'Content-Type': 'text/plain;charset=UTF-8'
            }
          });
        } catch (altError) {
          console.warn(`🗺️ Alternative Overpass API also failed:`, altError);
          throw new Error('All Overpass API servers unavailable');
        }
      }

      if (!response || !response.elements) {
        console.log('🗺️ No OSM AT features found');
        return {
          'at_osm_features_count_5mi': 0,
          'at_osm_features_all_pois': [],
          'at_osm_features_detailed': []
        };
      }

      // Process OSM elements into POI format (simplified for nodes only)
      const osmPOIs = response.elements.map((element: any, index: number) => {
        // Only process nodes (simplified query)
        if (element.type !== 'node' || !element.lat || !element.lon) {
          console.warn('🗺️ Skipping invalid OSM element:', element);
          return null;
        }

        const poiLat = element.lat;
        const poiLon = element.lon;
        
        // Extract name from tags
        let name = 'AT Feature';
        if (element.tags) {
          name = element.tags.name || element.tags['name:en'] || element.tags.ref || 'AT Feature';
        }

        // Calculate distance
        const distanceMiles = this.calculateDistance(lat, lon, poiLat, poiLon);

        return {
          id: `osm_at_${element.type}_${element.id}`,
          name: name,
          lat: poiLat,
          lon: poiLon,
          distance_miles: distanceMiles,
          type: element.type.toUpperCase(),
          source: 'OpenStreetMap',
          osm_id: element.id,
          osm_type: element.type,
          tags: element.tags || {}
        };
      }).filter(poi => poi !== null);

      const count = osmPOIs.length;
      console.log(`🗺️ Found ${count} OSM AT features`);

      // Create result structure
      const result = {
        [`at_osm_features_count_${radiusMiles}mi`]: count,
        [`at_osm_features_all_pois`]: osmPOIs,
        [`at_osm_features_detailed`]: osmPOIs,
        [`at_osm_features_elements`]: osmPOIs
      };

      console.log(`🗺️ OSM AT query completed:`, {
        count,
        sampleNames: osmPOIs.slice(0, 3).map(p => p.name),
        resultKeys: Object.keys(result)
      });

      return result;

    } catch (error) {
      console.error(`🗺️ OSM AT query failed:`, error);
      
      // If Overpass API fails, try alternative approach or return empty results gracefully
      console.log(`🗺️ Falling back to empty OSM AT results due to API error`);
      return {
        [`at_osm_features_count_${radiusMiles}mi`]: 0,
        [`at_osm_features_all_pois`]: [],
        [`at_osm_features_detailed`]: [],
        [`at_osm_features_error`]: 'OSM API temporarily unavailable'
      };
    }
  }

  /**
   * Query Appalachian Trail features
   */
  private async getATFeatures(
    enrichmentId: string,
    lat: number,
    lon: number,
    radiusMiles: number
  ): Promise<Record<string, any>> {
    try {
      console.log(`🏔️ Querying AT features for ${enrichmentId} within ${radiusMiles} miles of ${lat}, ${lon}`);
      
      const features = await queryATFeatures(enrichmentId, lat, lon, radiusMiles);
      
      if (!features || features.length === 0) {
        console.log(`🏔️ No AT features found for ${enrichmentId}`);
        return {
          [`${enrichmentId}_count_${radiusMiles}mi`]: 0,
          [`${enrichmentId}_all_pois`]: [],
          [`${enrichmentId}_detailed`]: []
        };
      }

      // Process features into POI format
      const atPOIs = features.map((feature, index) => {
        const attributes = feature.attributes;
        const geometry = feature.geometry;
        
        // Extract coordinates
        let poiLat: number | null = null;
        let poiLon: number | null = null;
        
        if (geometry) {
          if (geometry.x && geometry.y) {
            // Point geometry (facilities)
            poiLon = geometry.x;
            poiLat = geometry.y;
          } else if (geometry.paths && geometry.paths.length > 0) {
            // Polyline geometry (centerline) - use first point of first path
            const firstPath = geometry.paths[0];
            if (firstPath && firstPath.length > 0) {
              const [lon, lat] = firstPath[0];
              poiLon = lon;
              poiLat = lat;
            }
          }
        }
        
        if (!poiLat || !poiLon) {
          console.warn(`🏔️ Skipping AT feature with invalid coordinates:`, attributes);
          return null;
        }
        
        // Create POI record
        const poi = {
          id: attributes.OBJECTID || attributes.FID || `at_${enrichmentId}_${index}`,
          name: attributes.NAME || attributes.FACILITY_NAME || attributes.TRAIL_NAME || `AT ${enrichmentId.replace('at_', '').replace('_', ' ')}`,
          lat: poiLat,
          lon: poiLon,
          distance_miles: feature.distance_miles || 0,
          type: enrichmentId.replace('at_', '').replace('_', ' ').toUpperCase(),
          source: 'Appalachian Trail Conservancy',
          ...attributes // Include all original attributes
        };
        
        return poi;
      }).filter(poi => poi !== null);

      const count = atPOIs.length;
      console.log(`🏔️ Found ${count} AT features for ${enrichmentId}`);
      
      // Create result structure
      const result = {
        [`${enrichmentId}_count_${radiusMiles}mi`]: count,
        [`${enrichmentId}_all_pois`]: atPOIs,
        [`${enrichmentId}_detailed`]: atPOIs,
        [`${enrichmentId}_elements`]: atPOIs
      };
      
      console.log(`🏔️ AT query completed for ${enrichmentId}:`, {
        count,
        sampleNames: atPOIs.slice(0, 3).map(p => p.name),
        resultKeys: Object.keys(result)
      });
      
      return result;
      
    } catch (error) {
      console.error(`🏔️ AT query failed for ${enrichmentId}:`, error);
      return {
        [`${enrichmentId}_count_${radiusMiles}mi`]: 0,
        [`${enrichmentId}_all_pois`]: [],
        [`${enrichmentId}_detailed`]: []
      };
    }
  }
}