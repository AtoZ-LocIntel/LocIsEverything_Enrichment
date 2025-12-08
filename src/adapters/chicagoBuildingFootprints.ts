import { fetchJSONSmart } from '../services/EnrichmentService';

// Socrata API endpoint - using SODA2 format (not SODA3)
// Building Footprints dataset ID: syp8-uezg
// SODA2 format: https://data.cityofchicago.org/resource/syp8-uezg.json
// Note: the_geom is a multi-polygon, so we use bounding box filtering and check distance to polygon
const BASE_API_URL = 'https://data.cityofchicago.org/resource/syp8-uezg';

export interface ChicagoBuildingFootprintFeature {
  bldg_id?: string | number;
  bldg_name1?: string;
  bldg_name2?: string;
  unit_name?: string;
  f_add1?: number;
  t_add1?: number;
  pre_dir1?: string;
  st_name1?: string;
  st_type1?: string;
  suf_dir1?: string;
  stories?: number;
  no_stories?: number;
  year_built?: number;
  x_coord?: number; // X_COORD - may be State Plane or lat/lon
  y_coord?: number; // Y_COORD - may be State Plane or lat/lon
  the_geom?: any; // MultiPolygon geometry
  shape_area?: number;
  shape_len?: number;
  latitude?: number; // Will be calculated/assigned
  longitude?: number; // Will be calculated/assigned
  distance_miles?: number;
  [key: string]: any; // Allow for additional fields
}

// Socrata resource API returns an array directly, not wrapped in a 'data' property
export type ChicagoBuildingFootprintsResponse = ChicagoBuildingFootprintFeature[];

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
 * Query Chicago Building Footprints within proximity of a location
 * Uses Socrata API with bounding box and distance filtering
 */
export async function getChicagoBuildingFootprintsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<ChicagoBuildingFootprintFeature[]> {
  try {
    // Since the_geom is a multi-polygon, we use within_circle for spatial filtering
    // X_COORD and Y_COORD are in State Plane Illinois East NAD 1983 (not lat/lon)
    // So we can't filter by lat/lon bounding box directly
    // Instead, we use within_circle on the_geom field and filter client-side after converting coordinates
    
    // SODA2 format: /resource/{dataset-id}.json with query parameters
    // Use within_circle spatial query on the_geom field to fetch only records near the search location
    // Socrata supports within_circle for location/geometry fields
    // Format: within_circle(the_geom, latitude, longitude, radius_in_meters)
    // Convert radius from miles to meters (1 mile ≈ 1609.34 meters)
    const radiusMeters = radiusMiles * 1609.34;
    
    // Build spatial query using within_circle
    // Note: Socrata's within_circle uses lat, lon, radius_in_meters
    // Exclude the_geom from response to reduce payload size (we only need centroids)
    const whereClause = `within_circle(the_geom, ${lat}, ${lon}, ${radiusMeters})`;
    // Use $select to exclude the_geom - we'll calculate centroid once and discard the geometry
    // Note: We still need the_geom in the WHERE clause for spatial filtering, but we exclude it from SELECT
    const queryUrl = `${BASE_API_URL}.json?$where=${encodeURIComponent(whereClause)}&$select=*&$limit=50000`;

    console.log(`🔍 Chicago Building Footprints: Querying with spatial filter (within_circle): ${queryUrl}`);
    const rawResponse = await fetchJSONSmart(queryUrl);
    console.log(`📦 Chicago Building Footprints: Raw response type:`, typeof rawResponse, Array.isArray(rawResponse));
    console.log(`📦 Chicago Building Footprints: Raw response keys:`, rawResponse ? Object.keys(rawResponse).slice(0, 10) : 'null');
    
    // Socrata resource API should return an array directly, but check for different response formats
    let response: ChicagoBuildingFootprintsResponse;
    if (Array.isArray(rawResponse)) {
      response = rawResponse as ChicagoBuildingFootprintsResponse;
    } else if (rawResponse && typeof rawResponse === 'object' && 'data' in rawResponse && Array.isArray((rawResponse as any).data)) {
      // Some Socrata endpoints wrap data in a 'data' property
      response = (rawResponse as any).data as ChicagoBuildingFootprintsResponse;
    } else if (rawResponse && typeof rawResponse === 'object' && 'results' in rawResponse && Array.isArray((rawResponse as any).results)) {
      // Some endpoints use 'results'
      response = (rawResponse as any).results as ChicagoBuildingFootprintsResponse;
    } else {
      console.warn('⚠️ Chicago Building Footprints: Unexpected response format:', rawResponse);
      return [];
    }
    
    console.log(`✅ Chicago Building Footprints: Query succeeded, got ${response?.length || 0} records`);

    console.log(`📊 Chicago Building Footprints: Received ${response.length} records from API`);
    
    // Log first record to see field structure
    if (response.length > 0) {
      console.log('📋 Chicago Building Footprints: First record sample:', JSON.stringify(response[0], null, 2));
      console.log('📋 Chicago Building Footprints: X_COORD:', response[0].x_coord || response[0].X_COORD);
      console.log('📋 Chicago Building Footprints: Y_COORD:', response[0].y_coord || response[0].Y_COORD);
    } else {
      // Try a simple query without filters to see what fields exist
      console.log('⚠️ Chicago Building Footprints: No records returned, trying sample query to inspect fields...');
      try {
        const sampleUrl = `${BASE_API_URL}.json?$limit=1`;
        const sampleResponse = await fetchJSONSmart(sampleUrl) as ChicagoBuildingFootprintsResponse;
        if (sampleResponse && sampleResponse.length > 0) {
          console.log('📋 Chicago Building Footprints: Sample record (no filter):', JSON.stringify(sampleResponse[0], null, 2));
          console.log('📋 Chicago Building Footprints: Available fields:', Object.keys(sampleResponse[0]));
        }
      } catch (sampleError) {
        console.error('❌ Error fetching sample:', sampleError);
      }
    }

    // Filter by actual distance and calculate distance for each feature
    // Extract coordinates from the_geom MultiPolygon (which is in WGS84 lat/lon)
    // Use the first coordinate of the first polygon as the representative point for distance calculation
    console.log(`🔍 Chicago Building Footprints: Filtering ${response.length} records by distance (radius: ${radiusMiles} miles)`);
    
    const filteredFeatures = response
      .filter(feature => {
        // X_COORD and Y_COORD are the coordinate fields
        // Based on GIS conventions: Y_COORD is typically latitude (north), X_COORD is longitude (east)
        // But they might be in State Plane Illinois East NAD 1983 (like Chicago 311's x_coordinate/y_coordinate)
        const featureY = feature.y_coord || feature.Y_COORD;
        const featureX = feature.x_coord || feature.X_COORD;
        
        if (featureY === null || featureY === undefined || featureX === null || featureX === undefined) {
          console.warn('⚠️ Chicago Building Footprints: Feature missing coordinates:', {
            hasYCoord: feature.y_coord !== undefined,
            hasXCoord: feature.x_coord !== undefined,
            keys: Object.keys(feature).slice(0, 10)
          });
          return false;
        }
        
        // X_COORD and Y_COORD are in State Plane Illinois East NAD 1983
        // We need to extract coordinates from the_geom MultiPolygon instead
        // the_geom should be in WGS84 (lat/lon) format
        // For building footprints, check if polygon intersects the search radius
        // We'll check: 1) if point is inside polygon, 2) distance to centroid, 3) distance to nearest vertex
        let isWithinRadius = false;
        let minDistance = Infinity;
        
        if (feature.the_geom) {
          try {
            // the_geom is a MultiPolygon GeoJSON structure
            // Format: { type: "MultiPolygon", coordinates: [[[[lon, lat], ...]]] }
            if (feature.the_geom.type === 'MultiPolygon' && feature.the_geom.coordinates) {
              // Get the first polygon's outer ring (first ring)
              const outerRing = feature.the_geom.coordinates[0]?.[0];
              if (outerRing && Array.isArray(outerRing) && outerRing.length > 0) {
                // Check if search point is inside polygon (point-in-polygon)
                let inside = false;
                for (let i = 0, j = outerRing.length - 1; i < outerRing.length; j = i++) {
                  const coordI = outerRing[i];
                  const coordJ = outerRing[j];
                  if (Array.isArray(coordI) && coordI.length >= 2 && Array.isArray(coordJ) && coordJ.length >= 2) {
                    const xi = coordI[0]; // lon
                    const yi = coordI[1]; // lat
                    const xj = coordJ[0]; // lon
                    const yj = coordJ[1]; // lat
                    const intersect = ((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
                    if (intersect) inside = !inside;
                  }
                }
                
                if (inside) {
                  // Point is inside polygon, distance is 0
                  isWithinRadius = true;
                  minDistance = 0;
                } else {
                  // Calculate centroid for distance
                  let sumLat = 0;
                  let sumLon = 0;
                  let coordCount = 0;
                  
                  outerRing.forEach((coord: number[]) => {
                    if (Array.isArray(coord) && coord.length >= 2) {
                      sumLon += coord[0]; // longitude
                      sumLat += coord[1]; // latitude
                      coordCount++;
                    }
                  });
                  
                  if (coordCount > 0) {
                    const centroidLon = sumLon / coordCount;
                    const centroidLat = sumLat / coordCount;
                    const centroidDistance = calculateDistance(lat, lon, centroidLat, centroidLon);
                    minDistance = centroidDistance;
                    
                    // Also check distance to nearest vertex
                    outerRing.forEach((coord: number[]) => {
                      if (Array.isArray(coord) && coord.length >= 2) {
                        const vertexLon = coord[0];
                        const vertexLat = coord[1];
                        const vertexDistance = calculateDistance(lat, lon, vertexLat, vertexLon);
                        if (vertexDistance < minDistance) {
                          minDistance = vertexDistance;
                        }
                        // If any vertex is within radius, include the building
                        if (vertexDistance <= radiusMiles) {
                          isWithinRadius = true;
                        }
                      }
                    });
                    
                    // Also check centroid
                    if (centroidDistance <= radiusMiles) {
                      isWithinRadius = true;
                    }
                  }
                }
              }
            }
          } catch (geomError) {
            console.warn('⚠️ Chicago Building Footprints: Error extracting from the_geom:', geomError);
          }
        }
        
        // Fallback: If we couldn't get coordinates from the_geom, check if X_COORD/Y_COORD are lat/lon
        if (!isWithinRadius && minDistance === Infinity) {
          if (Math.abs(featureY) <= 90 && Math.abs(featureX) <= 180) {
            // X_COORD/Y_COORD appear to be lat/lon
            const fallbackDistance = calculateDistance(lat, lon, featureY, featureX);
            minDistance = fallbackDistance;
            isWithinRadius = fallbackDistance <= radiusMiles;
          } else {
            // State Plane coordinates - can't use directly for distance calculation
            console.warn('⚠️ Chicago Building Footprints: Cannot extract coordinates, skipping feature:', {
              hasTheGeom: !!feature.the_geom,
              x_coord: featureX,
              y_coord: featureY
            });
            return false;
          }
        }
        
        // Log first few features for debugging
        if (response.indexOf(feature) < 10) {
          console.log(`📍 Chicago Building Footprints: Feature ${response.indexOf(feature) + 1} - Min Distance: ${minDistance.toFixed(3)} miles, Within radius: ${isWithinRadius}`);
        }
        
        return isWithinRadius;
      })
      .map(feature => {
        const featureY = feature.y_coord || feature.Y_COORD;
        const featureX = feature.x_coord || feature.X_COORD;
        
        // Extract coordinates from the_geom MultiPolygon and calculate distance
        // Use the same logic as the filter: check point-in-polygon, centroid, and nearest vertex
        let featureLat: number | null = null;
        let featureLon: number | null = null;
        let distance: number | null = null;
        
        if (feature.the_geom) {
          try {
            if (feature.the_geom.type === 'MultiPolygon' && feature.the_geom.coordinates) {
              const outerRing = feature.the_geom.coordinates[0]?.[0];
              if (outerRing && Array.isArray(outerRing) && outerRing.length > 0) {
                // Check if search point is inside polygon
                let inside = false;
                for (let i = 0, j = outerRing.length - 1; i < outerRing.length; j = i++) {
                  const coordI = outerRing[i];
                  const coordJ = outerRing[j];
                  if (Array.isArray(coordI) && coordI.length >= 2 && Array.isArray(coordJ) && coordJ.length >= 2) {
                    const xi = coordI[0];
                    const yi = coordI[1];
                    const xj = coordJ[0];
                    const yj = coordJ[1];
                    const intersect = ((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
                    if (intersect) inside = !inside;
                  }
                }
                
                if (inside) {
                  distance = 0;
                  // Use centroid for lat/lon
                  let sumLat = 0;
                  let sumLon = 0;
                  let coordCount = 0;
                  outerRing.forEach((coord: number[]) => {
                    if (Array.isArray(coord) && coord.length >= 2) {
                      sumLon += coord[0];
                      sumLat += coord[1];
                      coordCount++;
                    }
                  });
                  if (coordCount > 0) {
                    featureLon = sumLon / coordCount;
                    featureLat = sumLat / coordCount;
                  }
                } else {
                  // Calculate centroid and distance to nearest vertex
                  let sumLat = 0;
                  let sumLon = 0;
                  let coordCount = 0;
                  let minVertexDistance = Infinity;
                  
                  outerRing.forEach((coord: number[]) => {
                    if (Array.isArray(coord) && coord.length >= 2) {
                      sumLon += coord[0];
                      sumLat += coord[1];
                      coordCount++;
                      
                      const vertexDistance = calculateDistance(lat, lon, coord[1], coord[0]);
                      if (vertexDistance < minVertexDistance) {
                        minVertexDistance = vertexDistance;
                      }
                    }
                  });
                  
                  if (coordCount > 0) {
                    featureLon = sumLon / coordCount;
                    featureLat = sumLat / coordCount;
                    const centroidDistance = calculateDistance(lat, lon, featureLat!, featureLon!);
                    // Use the minimum of centroid distance and nearest vertex distance
                    distance = Math.min(centroidDistance, minVertexDistance);
                  }
                }
              }
            } else if (feature.the_geom.coordinates) {
              const coords = feature.the_geom.coordinates;
              if (Array.isArray(coords) && coords.length >= 2) {
                featureLon = coords[0];
                featureLat = coords[1];
                distance = calculateDistance(lat, lon, featureLat!, featureLon!);
              }
            }
          } catch (geomError) {
            // Fall through to X_COORD/Y_COORD check
          }
        }
        
        // Fallback to X_COORD/Y_COORD if they're lat/lon
        if (featureLat === null || featureLon === null || distance === null) {
          if (Math.abs(featureY) <= 90 && Math.abs(featureX) <= 180) {
            featureLat = featureY;
            featureLon = featureX;
            distance = calculateDistance(lat, lon, featureY, featureX);
          } else {
            // Can't determine coordinates - skip this feature
            return null;
          }
        }
        
        // Type guard: ensure all values are non-null before proceeding
        if (featureLat === null || featureLon === null || distance === null) {
          return null;
        }
        
        // Remove the_geom from response to reduce payload size (we only need centroids)
        const { the_geom, ...featureWithoutGeom } = feature;
        return {
          ...featureWithoutGeom,
          latitude: featureLat!,
          longitude: featureLon!,
          distance_miles: distance!
        };
      })
      .filter((feature): feature is NonNullable<typeof feature> => feature !== null)
      .sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
    
    console.log(`✅ Chicago Building Footprints: Filtered to ${filteredFeatures.length} features within ${radiusMiles} miles`);

    return filteredFeatures;
  } catch (error) {
    console.error('❌ Error querying Chicago Building Footprints data:', error);
    return [];
  }
}

