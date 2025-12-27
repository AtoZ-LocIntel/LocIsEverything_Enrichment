/**
 * Bighorn Sheep Captures and Releases Adapter
 * Queries Bighorn Sheep Captures and Releases point features from ArcGIS FeatureServer
 * Supports proximity queries up to 50 miles
 * Layer: Bighorn Sheep Captures and Releases 1947-2013 (Layer 0) - Points
 */

const BASE_SERVICE_URL = 'https://services.arcgis.com/QVENGdaPbd4LUkLV/arcgis/rest/services/Bighorn_Sheep/FeatureServer';
const LAYER_ID = 0;

export interface BighornSheepInfo {
  objectid: number | null;
  year: string | null;
  capRelType: string | null; // Capture or Release
  subspecies: string | null;
  releaseDate: string | null;
  releaseSite: string | null;
  stateRelease: string | null;
  bighornNos: number | null;
  captureSite: string | null;
  capMethod: string | null;
  captureDate: string | null;
  stateCapture: string | null;
  rams: number | null;
  ewes: number | null;
  m_lambs: number | null;
  f_lambs: number | null;
  x: number | null; // Longitude
  y: number | null; // Latitude
  attributes: Record<string, any>;
  distance_miles?: number;
}

// Haversine distance calculation for points
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
 * Query Bighorn Sheep Captures and Releases for proximity
 * Supports proximity queries up to 50 miles
 */
export async function getBighornSheepData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<BighornSheepInfo[]> {
  try {
    const { fetchJSONSmart } = await import('../services/EnrichmentService');

    // Cap radius at 50 miles
    const maxRadius = radiusMiles ? Math.min(radiusMiles, 50.0) : 50.0;

    if (maxRadius <= 0) {
      return [];
    }

    const results: BighornSheepInfo[] = [];
    const processedIds = new Set<number>();

    // Proximity query with pagination
    try {
      const radiusMeters = maxRadius * 1609.34;
      const proximityGeometry = {
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 }
      };

      const allFeatures: any[] = [];
      let resultOffset = 0;
      const batchSize = 2000; // MaxRecordCount for this service
      let hasMore = true;

      while (hasMore) {
        const proximityUrl = `${BASE_SERVICE_URL}/${LAYER_ID}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(proximityGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true&resultRecordCount=${batchSize}&resultOffset=${resultOffset}`;

        if (resultOffset === 0) {
          console.log(`🐑 Querying Bighorn Sheep Captures and Releases for proximity (${maxRadius} miles) at [${lat}, ${lon}]`);
        }

        const proximityData = await fetchJSONSmart(proximityUrl) as any;

        if (proximityData.error) {
          console.error('❌ Bighorn Sheep API Error:', proximityData.error);
          break;
        }

        if (!proximityData.features || proximityData.features.length === 0) {
          hasMore = false;
          break;
        }

        allFeatures.push(...proximityData.features);

        if (proximityData.exceededTransferLimit === true || proximityData.features.length === batchSize) {
          resultOffset += batchSize;
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          hasMore = false;
        }
      }

      console.log(`✅ Fetched ${allFeatures.length} total Bighorn Sheep features for proximity`);

      // Process all features and calculate accurate distances
      allFeatures.forEach((feature: any) => {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry || {};

        const destLon = geometry.x;
        const destLat = geometry.y;

        if (destLat === null || destLon === null || typeof destLat !== 'number' || typeof destLon !== 'number') {
          return; // Skip features without valid coordinates
        }

        const distance = haversineDistance(lat, lon, destLat, destLon);

        // Only include features within the specified radius
        if (distance <= maxRadius) {
          const objectid = attributes.OBJECTID !== null && attributes.OBJECTID !== undefined ? attributes.OBJECTID : null;

          // Skip duplicates
          if (objectid !== null && processedIds.has(objectid)) {
            return;
          }

          // Parse year from date field
          let yearStr: string | null = null;
          if (attributes.Year) {
            if (typeof attributes.Year === 'number') {
              yearStr = attributes.Year.toString();
            } else if (typeof attributes.Year === 'string') {
              yearStr = attributes.Year;
            } else {
              // Try to parse date
              try {
                const date = new Date(attributes.Year);
                if (!isNaN(date.getTime())) {
                  yearStr = date.getFullYear().toString();
                }
              } catch (e) {
                // Ignore
              }
            }
          }

          results.push({
            objectid: objectid,
            year: yearStr,
            capRelType: attributes.CapRelType || null,
            subspecies: attributes.Subspecies || null,
            releaseDate: attributes.ReleseDate ? (typeof attributes.ReleseDate === 'string' ? attributes.ReleseDate : new Date(attributes.ReleseDate).toISOString()) : null,
            releaseSite: attributes.ReleseSite || null,
            stateRelease: attributes.State_Rele || null,
            bighornNos: attributes.BighornNos !== null && attributes.BighornNos !== undefined ? attributes.BighornNos : null,
            captureSite: attributes.CapturSite || null,
            capMethod: attributes.CapMethod || null,
            captureDate: attributes.CapturDate ? (typeof attributes.CapturDate === 'string' ? attributes.CapturDate : new Date(attributes.CapturDate).toISOString()) : null,
            stateCapture: attributes.State_Capt || null,
            rams: attributes.Rams !== null && attributes.Rams !== undefined ? attributes.Rams : null,
            ewes: attributes.Ewes !== null && attributes.Ewes !== undefined ? attributes.Ewes : null,
            m_lambs: attributes.M_lambs !== null && attributes.M_lambs !== undefined ? attributes.M_lambs : null,
            f_lambs: attributes.F_lambs !== null && attributes.F_lambs !== undefined ? attributes.F_lambs : null,
            x: destLon,
            y: destLat,
            attributes: attributes,
            distance_miles: distance
          });

          if (objectid !== null) {
            processedIds.add(objectid);
          }
        }
      });

      // Sort by distance
      results.sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));

      console.log(`✅ Found ${results.length} Bighorn Sheep feature(s) within ${maxRadius} miles`);
    } catch (error) {
      console.error('❌ Proximity query failed for Bighorn Sheep:', error);
    }

    return results;
  } catch (error) {
    console.error('❌ Error querying Bighorn Sheep data:', error);
    return [];
  }
}

