/**
 * Australia National Pollutant Inventory Facilities Adapter
 * Queries Digital Atlas AUS National Pollutant Inventory FeatureServer
 * Point feature service for industrial facilities that report to the NPI
 * Supports proximity queries up to 50 miles
 */

import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL = 'https://services-ap1.arcgis.com/ypkPEy1AmwPKGNNv/arcgis/rest/services/National_Pollutant_Inventory/FeatureServer/0';

export interface AustraliaNPIFacilityInfo {
  objectId: number;
  facilityId: number | null;
  jurisdictionCode: string | null;
  jurisdictionFacilityId: string | null;
  registeredBusinessName: string | null;
  facilityName: string | null;
  abn: string | null;
  acn: string | null;
  streetAddress: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  latitude: number;
  longitude: number;
  primaryAnzsicClassCode: string | null;
  primaryAnzsicClassName: string | null;
  mainActivities: string | null;
  facilityWebsite: string | null;
  firstReportYear: string | null;
  latestReportYear: string | null;
  latestReportId: number | null;
  latestReportUrl: string | null;
  reports: number | null;
  globalId: string | null;
  distance_miles?: number;
  attributes: Record<string, any>;
  [key: string]: any; // For other attributes
}

// Haversine distance calculation
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface AustraliaNPIFacilityData {
  facilities: AustraliaNPIFacilityInfo[];
}

export async function getAustraliaNPIFacilitiesData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AustraliaNPIFacilityData> {
  try {
    console.log(`🏭 Querying Australia NPI Facilities for [${lat}, ${lon}] within ${radiusMiles} miles`);
    
    // Convert radius from miles to meters for ESRI query
    const radiusMeters = radiusMiles * 1609.34;
    
    const facilities: AustraliaNPIFacilityInfo[] = [];
    
    let hasMore = true;
    let resultOffset = 0;
    const resultRecordCount = 2000;
    
    while (hasMore) {
      // Build query URL using URL API for better reliability
      const queryUrl = new URL(`${BASE_SERVICE_URL}/query`);
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
      queryUrl.searchParams.set('distance', radiusMeters.toString());
      queryUrl.searchParams.set('units', 'esriSRUnit_Meter');
      queryUrl.searchParams.set('inSR', '4326');
      queryUrl.searchParams.set('outSR', '4326');
      queryUrl.searchParams.set('returnGeometry', 'true');
      queryUrl.searchParams.set('resultRecordCount', resultRecordCount.toString());
      queryUrl.searchParams.set('resultOffset', resultOffset.toString());
      
      console.log(`🔗 Australia NPI Facilities Query URL: ${queryUrl.toString()}`);
      
      const response = await fetchJSONSmart(queryUrl.toString());
      
      if (response.error) {
        console.error(`❌ Australia NPI Facilities API Error:`, response.error);
        hasMore = false;
        break;
      }
      
      if (!response || !response.features || response.features.length === 0) {
        hasMore = false;
        break;
      }
      
      for (const feature of response.features) {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry;
        
        // Get coordinates from geometry or attributes
        let facilityLat: number | null = null;
        let facilityLon: number | null = null;
        
        if (geometry && geometry.x !== undefined && geometry.y !== undefined) {
          facilityLon = geometry.x;
          facilityLat = geometry.y;
        } else if (attributes.latitude !== undefined && attributes.longitude !== undefined) {
          facilityLat = attributes.latitude;
          facilityLon = attributes.longitude;
        } else if (attributes.LATITUDE !== undefined && attributes.LONGITUDE !== undefined) {
          facilityLat = attributes.LATITUDE;
          facilityLon = attributes.LONGITUDE;
        }
        
        if (facilityLat == null || facilityLon == null || !Number.isFinite(facilityLat) || !Number.isFinite(facilityLon)) {
          console.warn(`⚠️ Skipping NPI facility ${attributes.objectid || attributes.OBJECTID || 'unknown'} - missing coordinates`);
          continue;
        }
        
        // Calculate distance in miles
        const distanceMiles = haversineDistance(lat, lon, facilityLat, facilityLon);
        
        // Only include facilities within the specified radius
        if (Number.isFinite(distanceMiles) && distanceMiles <= radiusMiles) {
          const facilityInfo: AustraliaNPIFacilityInfo = {
            objectId: attributes.objectid || attributes.OBJECTID || attributes.ESRI_OID || 0,
            facilityId: attributes.facility_id || attributes.FACILITY_ID || null,
            jurisdictionCode: attributes.jurisdiction_code || attributes.JURISDICTION_CODE || null,
            jurisdictionFacilityId: attributes.jurisdiction_facility_id || attributes.JURISDICTION_FACILITY_ID || null,
            registeredBusinessName: attributes.registered_business_name || attributes.REGISTERED_BUSINESS_NAME || null,
            facilityName: attributes.facility_name || attributes.FACILITY_NAME || null,
            abn: attributes.abn || attributes.ABN || null,
            acn: attributes.acn || attributes.ACN || null,
            streetAddress: attributes.street_address || attributes.STREET_ADDRESS || null,
            suburb: attributes.suburb || attributes.SUBURB || null,
            state: attributes.state || attributes.STATE || null,
            postcode: attributes.postcode || attributes.POSTCODE || null,
            latitude: facilityLat,
            longitude: facilityLon,
            primaryAnzsicClassCode: attributes.primary_anzsic_class_code || attributes.PRIMARY_ANZSIC_CLASS_CODE || null,
            primaryAnzsicClassName: attributes.primary_anzsic_class_name || attributes.PRIMARY_ANZSIC_CLASS_NAME || null,
            mainActivities: attributes.main_activities || attributes.MAIN_ACTIVITIES || null,
            facilityWebsite: attributes.facility_website || attributes.FACILITY_WEBSITE || null,
            firstReportYear: attributes.first_report_year || attributes.FIRST_REPORT_YEAR || null,
            latestReportYear: attributes.latest_report_year || attributes.LATEST_REPORT_YEAR || null,
            latestReportId: attributes.latest_report_id || attributes.LATEST_REPORT_ID || null,
            latestReportUrl: attributes.latest_report_url || attributes.LATEST_REPORT_URL || null,
            reports: attributes.reports || attributes.REPORTS || null,
            globalId: attributes.globalid || attributes.GLOBALID || null,
            distance_miles: Number(distanceMiles.toFixed(2)),
            attributes,
            ...attributes
          };
          
          facilities.push(facilityInfo);
        }
      }
      
      // Check if there are more results
      if (response.exceededTransferLimit === true || response.features.length === resultRecordCount) {
        resultOffset += resultRecordCount;
      } else {
        hasMore = false;
      }
    }
    
    // Sort by distance (closest first)
    facilities.sort((a, b) => (a.distance_miles || Infinity) - (b.distance_miles || Infinity));
    
    console.log(`✅ Found ${facilities.length} Australia NPI Facilities within ${radiusMiles} miles`);
    
    return {
      facilities
    };
  } catch (error) {
    console.error('❌ Error querying Australia NPI Facilities:', error);
    return {
      facilities: []
    };
  }
}

