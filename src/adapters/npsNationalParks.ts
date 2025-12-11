/**
 * NPS National Parks Adapter
 * Queries National Park Service API for national parks
 * Supports proximity queries up to 50 miles
 * API: https://developer.nps.gov/api/v1/parks
 */

const BASE_API_URL = 'https://developer.nps.gov/api/v1';

export interface NPSNationalParkInfo {
  parkCode: string | null;
  fullName: string | null;
  name: string | null;
  designation: string | null;
  states: string | null;
  description: string | null;
  lat: number;
  lon: number;
  url: string | null;
  distance_miles?: number;
  geometry?: any; // ESRI geometry for drawing park boundaries
  attributes: Record<string, any>;
}

/**
 * Parse latLong string from NPS API (format: "lat:44.59824417, long:-110.5471695")
 */
function parseLatLong(latLong: string): { lat: number; lon: number } | null {
  if (!latLong) return null;
  
  try {
    const parts = latLong.split(',');
    const latMatch = parts[0]?.match(/lat:\s*([-\d.]+)/);
    const lonMatch = parts[1]?.match(/long:\s*([-\d.]+)/);
    
    if (latMatch && lonMatch) {
      const lat = parseFloat(latMatch[1]);
      const lon = parseFloat(lonMatch[1]); // Fixed: was using latMatch[1] instead of lonMatch[1]
      
      if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        return { lat, lon };
      }
    }
  } catch (error) {
    console.error('Error parsing latLong:', error);
  }
  
  return null;
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Query NPS National Parks API for proximity search
 * Supports proximity queries up to 50 miles
 */
export async function getNPSNationalParksData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<NPSNationalParkInfo[]> {
  try {
    const apiKey = import.meta.env.VITE_NPS_API_KEY;
    if (!apiKey) {
      throw new Error('NPS API key not configured. Please set VITE_NPS_API_KEY environment variable.');
    }
    
    const { fetchJSONSmart } = await import('../services/EnrichmentService');
    
    // Cap radius at 50 miles
    const maxRadius = radiusMiles ? Math.min(radiusMiles, 50.0) : 50.0;
    
    const results: NPSNationalParkInfo[] = [];
    const allParks: any[] = [];
    
    // Fetch all parks (paginated)
    let start = 0;
    const limit = 50;
    let hasMore = true;
    
    while (hasMore) {
      const url = `${BASE_API_URL}/parks?limit=${limit}&start=${start}`;
      
      if (start === 0) {
        console.log(`🏞️ Querying NPS National Parks API for proximity (${maxRadius} miles) at [${lat}, ${lon}]`);
      }
      
      const data = await fetchJSONSmart(url, {
        headers: {
          'X-Api-Key': apiKey
        }
      }) as any;
      
      if (data.error) {
        console.error('❌ NPS National Parks API Error:', data.error);
        break;
      }
      
      if (!data.data || data.data.length === 0) {
        hasMore = false;
        break;
      }
      
      allParks.push(...data.data);
      
      // Check if there are more results
      const total = parseInt(data.total || '0', 10);
      if (start + data.data.length >= total) {
        hasMore = false;
      } else {
        start += limit;
        await new Promise(resolve => setTimeout(resolve, 100)); // Rate limiting
      }
    }
    
    console.log(`✅ Fetched ${allParks.length} total NPS National Parks`);
    
    // Filter parks by distance and fetch geometry for each
    let parksWithoutCoords = 0;
    let parksWithInvalidCoords = 0;
    
    // Process parks and fetch boundaries for those within radius
    for (const park of allParks) {
      const latLong = park.latLong;
      if (!latLong) {
        parksWithoutCoords++;
        // Log first few missing parks for debugging
        if (parksWithoutCoords <= 5) {
          console.log(`⚠️ Park "${park.fullName || park.name || 'Unknown'}" (${park.parkCode || 'no code'}) missing latLong field`);
        }
        continue;
      }
      
      const coords = parseLatLong(latLong);
      if (!coords) {
        parksWithInvalidCoords++;
        if (parksWithInvalidCoords <= 5) {
          console.log(`⚠️ Park "${park.fullName || park.name || 'Unknown'}" (${park.parkCode || 'no code'}) has invalid latLong: "${latLong}"`);
        }
        continue;
      }
      
      const distance = calculateDistance(lat, lon, coords.lat, coords.lon);
      
      if (distance <= maxRadius) {
        // Fetch park boundary geometry if parkCode is available
        // Try NPS API first, then fall back to PAD-US if needed
        let geometry = null;
        if (park.parkCode) {
          try {
            const boundaryUrl = `${BASE_API_URL}/mapdata/parkboundaries/${park.parkCode}`;
            console.log(`🔍 Fetching boundary geometry for ${park.fullName || park.name} (${park.parkCode}) from NPS API: ${boundaryUrl}`);
            
            const boundaryData = await fetchJSONSmart(boundaryUrl, {
              headers: {
                'X-Api-Key': apiKey
              }
            }) as any;
            
            console.log(`🔍 NPS Boundary API response for ${park.parkCode}:`, {
              hasData: !!boundaryData,
              dataKeys: boundaryData ? Object.keys(boundaryData) : [],
              geometryType: boundaryData?.geometry?.type,
              geometryKeys: boundaryData?.geometry ? Object.keys(boundaryData.geometry) : [],
              hasRings: !!boundaryData?.geometry?.rings,
              hasCoordinates: !!boundaryData?.geometry?.coordinates,
              sampleData: boundaryData ? JSON.stringify(boundaryData).substring(0, 500) : 'none'
            });
            
            // Handle different geometry formats from NPS API
            if (boundaryData) {
              // Check for ESRI geometry format (rings)
              if (boundaryData.geometry && boundaryData.geometry.rings) {
                geometry = boundaryData.geometry;
                console.log(`✅ Fetched ESRI geometry (rings) from NPS API for ${park.fullName || park.name} (${park.parkCode})`);
              }
              // Check for GeoJSON format (coordinates)
              else if (boundaryData.geometry && boundaryData.geometry.coordinates) {
                // Convert GeoJSON to ESRI format for consistency
                const geoJsonGeometry = boundaryData.geometry;
                if (geoJsonGeometry.type === 'Polygon' && Array.isArray(geoJsonGeometry.coordinates)) {
                  // GeoJSON Polygon: coordinates[0] is outer ring, coordinates[1+] are holes
                  // Convert to ESRI rings format: [[[lon, lat], ...], ...]
                  const rings = geoJsonGeometry.coordinates.map((ring: number[][]) => 
                    ring.map((coord: number[]) => [coord[0], coord[1]]) // [lon, lat] -> [x, y]
                  );
                  geometry = { rings: rings };
                  console.log(`✅ Converted GeoJSON to ESRI geometry from NPS API for ${park.fullName || park.name} (${park.parkCode})`);
                } else if (geoJsonGeometry.type === 'MultiPolygon' && Array.isArray(geoJsonGeometry.coordinates)) {
                  // MultiPolygon: coordinates[0][0] is first polygon's outer ring
                  // For now, use the first polygon
                  const firstPolygon = geoJsonGeometry.coordinates[0];
                  const rings = firstPolygon.map((ring: number[][]) => 
                    ring.map((coord: number[]) => [coord[0], coord[1]])
                  );
                  geometry = { rings: rings };
                  console.log(`✅ Converted GeoJSON MultiPolygon to ESRI geometry from NPS API for ${park.fullName || park.name} (${park.parkCode})`);
                }
              }
              // Check if geometry is at root level
              else if (boundaryData.rings) {
                geometry = { rings: boundaryData.rings };
                console.log(`✅ Found rings at root level from NPS API for ${park.fullName || park.name} (${park.parkCode})`);
              }
              // Check if coordinates are at root level
              else if (boundaryData.coordinates) {
                if (Array.isArray(boundaryData.coordinates[0]) && Array.isArray(boundaryData.coordinates[0][0])) {
                  // Polygon format
                  const rings = boundaryData.coordinates.map((ring: number[][]) => 
                    ring.map((coord: number[]) => [coord[0], coord[1]])
                  );
                  geometry = { rings: rings };
                  console.log(`✅ Converted root-level coordinates to ESRI geometry from NPS API for ${park.fullName || park.name} (${park.parkCode})`);
                }
              }
            }
            
            // If NPS API didn't return geometry, try PAD-US as fallback
            if (!geometry) {
              console.log(`⚠️ NPS API did not return geometry for ${park.parkCode}, trying PAD-US fallback...`);
              try {
                // Query PAD-US for National Park Service managed areas matching this park name
                const parkName = park.fullName || park.name || '';
                // Escape single quotes for SQL WHERE clause
                const escapedName = parkName.replace(/'/g, "''");
                const padusQueryUrl = `https://services.arcgis.com/v01gqwM5QqNysAAi/ArcGIS/rest/services/PADUS_Public_Access/FeatureServer/0/query?where=MngNm_Desc='National Park Service' AND (Unit_Nm LIKE '%${encodeURIComponent(escapedName)}%' OR BndryName LIKE '%${encodeURIComponent(escapedName)}%')&geometry={"x":${coords.lon},"y":${coords.lat},"spatialReference":{"wkid":4326}}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${maxRadius * 1.60934}&units=esriSRUnit_Kilometer&outFields=OBJECTID,Unit_Nm,BndryName,MngNm_Desc&f=json&returnGeometry=true&outSR=4326&maxRecordCount=10`;
                
                console.log(`🔍 Querying PAD-US for NPS boundaries matching "${parkName}"`);
                const padusData = await fetchJSONSmart(padusQueryUrl) as any;
                
                if (padusData && padusData.features && padusData.features.length > 0) {
                  // Find the best match by name similarity
                  const bestMatch = padusData.features.find((f: any) => {
                    const unitName = (f.attributes.Unit_Nm || '').toLowerCase();
                    const boundaryName = (f.attributes.BndryName || '').toLowerCase();
                    const searchName = parkName.toLowerCase();
                    return unitName.includes(searchName) || boundaryName.includes(searchName) || searchName.includes(unitName);
                  }) || padusData.features[0];
                  
                  if (bestMatch && bestMatch.geometry && bestMatch.geometry.rings) {
                    geometry = bestMatch.geometry;
                    console.log(`✅ Fetched geometry from PAD-US for ${park.fullName || park.name} (${park.parkCode})`);
                  }
                }
              } catch (padusError) {
                console.warn(`⚠️ PAD-US fallback also failed for ${park.parkCode}:`, padusError);
              }
            }
            
            if (!geometry) {
              console.warn(`⚠️ Could not fetch boundary geometry for ${park.parkCode} from either NPS API or PAD-US`);
            }
          } catch (error) {
            console.warn(`⚠️ Could not fetch boundary geometry for ${park.parkCode}:`, error);
          }
        }
        
        results.push({
          parkCode: park.parkCode || null,
          fullName: park.fullName || null,
          name: park.name || null,
          designation: park.designation || null,
          states: park.states || null,
          description: park.description || null,
          lat: coords.lat,
          lon: coords.lon,
          url: park.url || null,
          distance_miles: Number(distance.toFixed(2)),
          geometry: geometry,
          attributes: park
        });
      }
    }
    
    if (parksWithoutCoords > 0 || parksWithInvalidCoords > 0) {
      console.log(`⚠️ NPS Parks: ${parksWithoutCoords} without coordinates, ${parksWithInvalidCoords} with invalid coordinates`);
    }
    
    // Sort by distance
    results.sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
    
    console.log(`✅ NPS National Parks: Found ${results.length} park(s) within ${maxRadius} miles`);
    return results;
  } catch (error) {
    console.error('❌ Error querying NPS National Parks data:', error);
    throw error;
  }
}

