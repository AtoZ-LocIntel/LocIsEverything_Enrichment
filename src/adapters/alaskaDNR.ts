/**
 * Alaska Department of Natural Resources (DNR) Adapter
 * Service: https://arcgis.dnr.alaska.gov/arcgis/rest/services/OpenData
 * Supports proximity queries for various infrastructure and natural resource layers
 */

import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL_ALASKA_DNR = 'https://arcgis.dnr.alaska.gov/arcgis/rest/services/OpenData';

export interface AlaskaDNRFeature {
  objectid: number;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // Distance from query point
  layerId: number; // Which layer this feature came from
  layerName: string; // Human-readable layer name
}

/**
 * Calculate haversine distance between two points in miles
 */
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
 * Query Alaska DNR layer - Generic function for point, polyline, and polygon layers
 */
async function queryAlaskaDNRLayer(
  baseServiceUrl: string,
  layerId: number,
  layerName: string,
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  try {
    const maxRecordCount = 2000;
    console.log(`🏔️ Alaska DNR ${layerName} (Layer ${layerId}) query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`);

    const queryUrl = new URL(`${baseServiceUrl}/${layerId}/query`);
    queryUrl.searchParams.set('f', 'json');
    queryUrl.searchParams.set('where', '1=1');
    queryUrl.searchParams.set('outFields', '*');
    queryUrl.searchParams.set('geometry', JSON.stringify({
      x: lon,
      y: lat,
      spatialReference: { wkid: 4326 }
    }));
    queryUrl.searchParams.set('geometryType', 'esriGeometryPoint');
    queryUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
    queryUrl.searchParams.set('distance', (radiusMiles * 1609.34).toString()); // Convert miles to meters
    queryUrl.searchParams.set('units', 'esriSRUnit_Meter');
    queryUrl.searchParams.set('inSR', '4326');
    queryUrl.searchParams.set('outSR', '4326');
    queryUrl.searchParams.set('returnGeometry', 'true');
    queryUrl.searchParams.set('resultRecordCount', maxRecordCount.toString());

    const response = await fetchJSONSmart(queryUrl.toString());

    if (response.error) {
      throw new Error(`Alaska DNR ${layerName} API error: ${JSON.stringify(response.error)}`);
    }

    const features = response.features || [];

    // Process features and calculate distances
    const processedFeatures: AlaskaDNRFeature[] = features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry;
      const objectid = attributes.OBJECTID || attributes.objectid || attributes.OBJECTID_1 || attributes.FID || 0;

      let distanceMiles = radiusMiles; // Default to max radius

      // Calculate distance using geometry
      if (geometry) {
        let featureLat: number | null = null;
        let featureLon: number | null = null;

        // Handle different geometry types
        if (geometry.x !== undefined && geometry.y !== undefined) {
          // Point geometry
          featureLon = geometry.x;
          featureLat = geometry.y;
        } else if (geometry.paths && geometry.paths.length > 0) {
          // Polyline geometry - use first point
          const firstPath = geometry.paths[0];
          if (firstPath && firstPath.length > 0) {
            featureLon = firstPath[0][0];
            featureLat = firstPath[0][1];
          }
        } else if (geometry.rings && geometry.rings.length > 0) {
          // Polygon geometry - use centroid (first ring, first point as approximation)
          const firstRing = geometry.rings[0];
          if (firstRing && firstRing.length > 0) {
            featureLon = firstRing[0][0];
            featureLat = firstRing[0][1];
          }
        } else if (geometry.coordinates && geometry.coordinates.length >= 2) {
          // GeoJSON-style coordinates
          featureLon = geometry.coordinates[0];
          featureLat = geometry.coordinates[1];
        }

        if (featureLat !== null && featureLon !== null) {
          distanceMiles = calculateHaversineDistance(lat, lon, featureLat, featureLon);
        }
      }

      return {
        objectid,
        attributes,
        geometry,
        distance_miles: distanceMiles,
        layerId,
        layerName,
      };
    });

    // Sort by distance
    processedFeatures.sort((a, b) => {
      const distA = a.distance_miles || Infinity;
      const distB = b.distance_miles || Infinity;
      return distA - distB;
    });

    console.log(`✅ Processed ${processedFeatures.length} Alaska DNR ${layerName} feature(s) within ${radiusMiles} miles`);

    return processedFeatures;
  } catch (error) {
    console.error(`❌ Alaska DNR ${layerName} API Error:`, error);
    throw error;
  }
}

/**
 * Query Alaska DNR Trans Alaska Pipeline System (Layer 0) - Polyline layer
 */
export async function getAlaskaDNRTransAlaskaPipelineData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    `${BASE_SERVICE_URL_ALASKA_DNR}/Infrastructure_TransAlaskaPipeline/MapServer`,
    0,
    'Trans Alaska Pipeline System',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Well Sites (Layer 0) - Point layer
 */
export async function getAlaskaDNRWellSitesData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    `${BASE_SERVICE_URL_ALASKA_DNR}/LandActivity_WellSite/MapServer`,
    0,
    'Well Sites',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

