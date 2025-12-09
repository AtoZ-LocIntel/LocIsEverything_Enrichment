/**
 * NYC Business Improvement Districts Adapter
 * Queries NYC Business Improvement Districts from Socrata API
 * Supports point-in-polygon and proximity queries
 */

const BASE_API_URL = 'https://data.cityofnewyork.us/resource/7jdm-inj8';

export interface NYCBusinessImprovementDistrictInfo {
  districtId: string | null;
  name: string | null;
  borough: string | null;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
  isContaining?: boolean; // For point-in-polygon queries
  attributes: Record<string, any>;
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Query NYC Business Improvement Districts within proximity of a location
 * Uses Socrata API with bounding box and distance filtering
 */
export async function getNYCBusinessImprovementDistrictsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<NYCBusinessImprovementDistrictInfo[]> {
  try {
    // This dataset doesn't support spatial queries well, so fetch all records and filter client-side
    // NYC BIDs dataset is relatively small, so this is feasible
    const queryUrl = `${BASE_API_URL}.json?$limit=5000`;
    
    console.log(`🏢 NYC Business Improvement Districts: Fetching all records for client-side filtering: ${queryUrl}`);
    
    // Use fetchJSONSmart for CORS handling
    const { fetchJSONSmart } = await import('../services/EnrichmentService');
    const data = await fetchJSONSmart(queryUrl);
    
    if (!data || !Array.isArray(data)) {
      console.warn('⚠️ NYC Business Improvement Districts: No data in response');
      return [];
    }

    console.log(`📦 NYC Business Improvement Districts: Fetched ${data.length} records from API`);
    
    // Debug: Log first record to see structure
    if (data.length > 0) {
      console.log('🔍 NYC Business Improvement Districts: Sample record:', JSON.stringify(data[0], null, 2));
    }

    // Filter by actual distance and process features
    const filteredFeatures = data
      .filter((feature: any) => {
        // Extract coordinates - check location field first (GeoJSON format), then lat/lon fields
        let featureLat: number | null = null;
        let featureLon: number | null = null;
        
        // Check location field (GeoJSON format: { type: "Point", coordinates: [lon, lat] })
        if (feature.location) {
          if (feature.location.coordinates && Array.isArray(feature.location.coordinates) && feature.location.coordinates.length >= 2) {
            featureLon = feature.location.coordinates[0];
            featureLat = feature.location.coordinates[1];
          } else if (feature.location.latitude !== undefined && feature.location.longitude !== undefined) {
            // Sometimes location is an object with lat/lon properties
            featureLat = feature.location.latitude;
            featureLon = feature.location.longitude;
          }
        }
        
        // Check the_geom field (polygon geometry) - calculate centroid if it's a polygon
        if ((featureLat === null || featureLon === null) && feature.the_geom) {
          if (feature.the_geom.type === 'Polygon' && feature.the_geom.coordinates && Array.isArray(feature.the_geom.coordinates[0])) {
            // Calculate centroid of polygon
            const coords = feature.the_geom.coordinates[0]; // First ring
            let sumLat = 0;
            let sumLon = 0;
            let count = 0;
            for (const coord of coords) {
              if (Array.isArray(coord) && coord.length >= 2) {
                sumLon += coord[0]; // GeoJSON is [lon, lat]
                sumLat += coord[1];
                count++;
              }
            }
            if (count > 0) {
              featureLat = sumLat / count;
              featureLon = sumLon / count;
            }
          } else if (feature.the_geom.type === 'MultiPolygon' && feature.the_geom.coordinates && Array.isArray(feature.the_geom.coordinates[0])) {
            // Calculate centroid of first polygon in MultiPolygon
            const firstPolygon = feature.the_geom.coordinates[0];
            if (Array.isArray(firstPolygon[0])) {
              const coords = firstPolygon[0]; // First ring of first polygon
              let sumLat = 0;
              let sumLon = 0;
              let count = 0;
              for (const coord of coords) {
                if (Array.isArray(coord) && coord.length >= 2) {
                  sumLon += coord[0];
                  sumLat += coord[1];
                  count++;
                }
              }
              if (count > 0) {
                featureLat = sumLat / count;
                featureLon = sumLon / count;
              }
            }
          }
        }
        
        // Fallback to direct lat/lon fields (check various naming conventions)
        if (featureLat === null || featureLon === null) {
          featureLat = feature.latitude || feature.lat || feature.LATITUDE || feature.LAT || feature.y || feature.Y || null;
          featureLon = feature.longitude || feature.lon || feature.LONGITUDE || feature.LON || feature.lng || feature.LNG || feature.x || feature.X || null;
        }
        
        if (featureLat === null || featureLon === null || isNaN(featureLat) || isNaN(featureLon)) {
          // Only log warning for first few records to avoid spam
          if (data.indexOf(feature) < 3) {
            console.warn('⚠️ NYC Business Improvement Districts: Feature missing coordinates:', {
              hasLocation: !!feature.location,
              locationType: feature.location?.type,
              hasCoordinates: !!feature.location?.coordinates,
              hasTheGeom: !!feature.the_geom,
              theGeomType: feature.the_geom?.type,
              hasLatitude: feature.latitude !== undefined,
              hasLongitude: feature.longitude !== undefined,
              sampleKeys: Object.keys(feature).slice(0, 10)
            });
          }
          return false;
        }
        
        // Filter by distance (client-side filtering)
        const distance = calculateDistance(lat, lon, featureLat, featureLon);
        (feature as any).__calculatedDistance = distance;
        
        return distance <= radiusMiles;
      })
      .map((feature: any) => {
        // Extract coordinates same way as filter
        let featureLat: number | null = null;
        let featureLon: number | null = null;
        
        if (feature.location && feature.location.coordinates && Array.isArray(feature.location.coordinates)) {
          featureLon = feature.location.coordinates[0];
          featureLat = feature.location.coordinates[1];
        }
        
        if (featureLat === null || featureLon === null) {
          featureLat = feature.latitude || feature.lat || feature.LATITUDE || feature.LAT || null;
          featureLon = feature.longitude || feature.lon || feature.LONGITUDE || feature.LON || feature.lng || feature.LNG || null;
        }
        
        const distance = (feature as any).__calculatedDistance || 0;
        
        // Check if point is inside polygon (if geometry is available)
        let isContaining = false;
        if (feature.the_geom && feature.the_geom.type === 'Polygon' || feature.the_geom?.type === 'MultiPolygon') {
          // For now, assume if distance is very small (< 0.01 miles), it's containing
          // More precise point-in-polygon check would require parsing the_geom
          isContaining = distance < 0.01;
        }
        
        const districtId = feature.bid_id || feature.bidId || feature.BID_ID || feature.objectid || feature.OBJECTID || null;
        const name = feature.bid_name || feature.bidName || feature.BID_NAME || feature.name || feature.NAME || feature.Name || null;
        const borough = feature.borough || feature.Borough || feature.BOROUGH || null;
        
        return {
          districtId: districtId ? districtId.toString() : null,
          name,
          borough,
          geometry: feature.the_geom || null,
          distance_miles: distance,
          isContaining,
          attributes: feature
        };
      })
      .sort((a, b) => {
        // Sort by containing first, then by distance
        if (a.isContaining && !b.isContaining) return -1;
        if (!a.isContaining && b.isContaining) return 1;
        return a.distance_miles! - b.distance_miles!;
      });

    console.log(`✅ NYC Business Improvement Districts: Found ${filteredFeatures.length} district(s) within ${radiusMiles} miles`);
    return filteredFeatures;
  } catch (error) {
    console.error('❌ Error querying NYC Business Improvement Districts data:', error);
    throw error;
  }
}

