/**
 * NHDES Wetlands Permit Applications and Notifications
 * ArcGIS MapServer layer — point features, proximity query (buffer)
 * Service: Projects_LRM/NHDES_Wetland_Permits_by_Year (layer 8)
 */

const BASE_SERVICE_URL =
  'https://gis.des.nh.gov/server/rest/services/Projects_LRM/NHDES_Wetland_Permits_by_Year/MapServer';
const LAYER_ID = 8;

export interface NHDesWetlandPermitApplication {
  latitude: number;
  longitude: number;
  attributes: Record<string, any>;
  distance_miles?: number;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Query NHDES wetland permit application/notification points within radius (miles).
 */
export async function getNHDesWetlandPermitApplicationsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<NHDesWetlandPermitApplication[]> {
  try {
    console.log(
      `🔧 Querying NHDES Wetland Permit Applications within ${radiusMiles} miles of [${lat}, ${lon}]`
    );

    const radiusMeters = radiusMiles * 1609.34;
    const queryUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);

    queryUrl.searchParams.set('f', 'json');
    queryUrl.searchParams.set('where', '1=1');
    queryUrl.searchParams.set('outFields', '*');
    queryUrl.searchParams.set('geometry', `${lon},${lat}`);
    queryUrl.searchParams.set('geometryType', 'esriGeometryPoint');
    queryUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
    queryUrl.searchParams.set('distance', radiusMeters.toString());
    queryUrl.searchParams.set('units', 'esriSRUnit_Meter');
    queryUrl.searchParams.set('inSR', '4326');
    queryUrl.searchParams.set('outSR', '4326');
    queryUrl.searchParams.set('returnGeometry', 'true');

    const response = await fetch(queryUrl.toString());

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      console.error('❌ NHDES Wetland Permits API Error:', data.error);
      return [];
    }

    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No NHDES wetland permit points found within ${radiusMiles} miles`);
      return [];
    }

    const out: NHDesWetlandPermitApplication[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || {};

      let latitude = 0;
      let longitude = 0;

      if (geometry.x != null && geometry.y != null) {
        longitude = geometry.x;
        latitude = geometry.y;
      } else if (geometry.latitude != null && geometry.longitude != null) {
        latitude = geometry.latitude;
        longitude = geometry.longitude;
      }

      let distance_miles: number | undefined;
      if (latitude !== 0 && longitude !== 0) {
        distance_miles = calculateDistance(lat, lon, latitude, longitude);
      }

      return {
        latitude,
        longitude,
        attributes,
        distance_miles,
      };
    });

    out.sort((a, b) => (a.distance_miles ?? 0) - (b.distance_miles ?? 0));

    console.log(`✅ Found ${out.length} NHDES wetland permit application/notification point(s)`);
    return out;
  } catch (error) {
    console.error('❌ Error querying NHDES Wetland Permit Applications:', error);
    return [];
  }
}

/** Human-readable summary with counts by year / municipality when those fields exist on attributes. */
export function buildNHDesWetlandPermitApplicationsSummary(
  flatRecords: Array<Record<string, any>>,
  radiusMiles: number
): string {
  const n = flatRecords.length;
  if (n === 0) {
    return `No NHDES wetland permit applications or notifications within ${radiusMiles} mi.`;
  }

  const pickYear = (r: Record<string, any>) =>
    r.RECEIVED_YEAR ??
    r.Received_Year ??
    r.YEAR ??
    r.Year ??
    r.permit_year ??
    r.PERMIT_YEAR ??
    r.APPLICATION_YEAR ??
    r.Application_Year ??
    r.Submitted_Year ??
    r.SUBMITTED_YEAR;

  const pickTown = (r: Record<string, any>) =>
    r.MUNICIPALITY ??
    r.Municipality ??
    r.TOWN ??
    r.Town ??
    r.CITY ??
    r.City ??
    r.GISMUNIC ??
    r.gismunic;

  const byYear: Record<string, number> = {};
  const byTown: Record<string, number> = {};

  for (const r of flatRecords) {
    const y = pickYear(r);
    if (y !== null && y !== undefined && String(y).trim() !== '') {
      const ys = String(y).trim();
      byYear[ys] = (byYear[ys] || 0) + 1;
    }
    const t = pickTown(r);
    if (t !== null && t !== undefined && String(t).trim() !== '') {
      const ts = String(t).trim();
      byTown[ts] = (byTown[ts] || 0) + 1;
    }
  }

  const parts = [
    `${n} permit application or notification point${n === 1 ? '' : 's'} within ${radiusMiles} mi.`,
  ];

  const yKeys = Object.keys(byYear).sort();
  if (yKeys.length > 0 && yKeys.length <= 15) {
    parts.push(`By year: ${yKeys.map((k) => `${k}: ${byYear[k]}`).join('; ')}.`);
  } else if (yKeys.length > 15) {
    parts.push(`${yKeys.length} distinct years represented.`);
  }

  const tKeys = Object.keys(byTown).sort();
  if (tKeys.length > 0 && tKeys.length <= 12) {
    parts.push(`By municipality: ${tKeys.map((k) => `${k}: ${byTown[k]}`).join('; ')}.`);
  } else if (tKeys.length > 12) {
    parts.push(`${tKeys.length} distinct municipalities represented.`);
  }

  return parts.join(' ');
}
