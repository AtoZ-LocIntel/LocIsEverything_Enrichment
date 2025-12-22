/**
 * American Community Survey (ACS) Boundaries Adapter
 * Queries ACS boundary data from ArcGIS FeatureServer
 * Supports point-in-polygon and proximity queries
 * Each service has 3 layers:
 * - Layer 0: State
 * - Layer 1: County
 * - Layer 2: Tract
 * 
 * State and County: proximity up to 100 miles
 * Tract: proximity up to 50 miles
 */

export interface ACSBoundaryInfo {
  attributes: Record<string, any>;
  geometry?: any;
  isContaining?: boolean;
  distance_miles?: number;
}

/**
 * Point-in-polygon check using ray casting algorithm
 * Note: ring coordinates are [lon, lat] format
 */
function pointInRing(lat: number, lon: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const lonI = ring[i][0], latI = ring[i][1];
    const lonJ = ring[j][0], latJ = ring[j][1];
    const intersect = ((latI > lat) !== (latJ > lat)) && (lon < (lonJ - lonI) * (lat - latI) / (latJ - latI) + lonI);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Point-in-polygon check for multi-ring polygons
 */
function pointInPolygon(lat: number, lon: number, rings: number[][][]): boolean {
  if (!rings || rings.length === 0) return false;
  // Check if point is in the outer ring (first ring)
  const outerRing = rings[0];
  if (!pointInRing(lat, lon, outerRing)) return false;
  // Check if point is in any inner ring (holes) - if so, it's outside
  for (let i = 1; i < rings.length; i++) {
    if (pointInRing(lat, lon, rings[i])) return false;
  }
  return true;
}

/**
 * Calculate distance from point to polygon edge (in miles)
 * Note: ring coordinates are [lon, lat] format
 */
function distanceToPolygon(lat: number, lon: number, rings: number[][][]): number {
  if (!rings || rings.length === 0) return Infinity;
  let minDistance = Infinity;
  const outerRing = rings[0];
  for (let i = 0; i < outerRing.length; i++) {
    const p1 = outerRing[i];
    const p2 = outerRing[(i + 1) % outerRing.length];
    // p1 and p2 are [lon, lat] format
    const dist = distanceToLineSegment(lat, lon, p1[1], p1[0], p2[1], p2[0]);
    if (dist < minDistance) minDistance = dist;
  }
  return minDistance;
}

/**
 * Calculate distance from point to line segment (in miles)
 */
function distanceToLineSegment(
  lat: number, lon: number,
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const A = lon - lon1;
  const B = lat - lat1;
  const C = lon2 - lon1;
  const D = lat2 - lat1;
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  if (lenSq !== 0) param = dot / lenSq;
  let xx, yy;
  if (param < 0) {
    xx = lon1;
    yy = lat1;
  } else if (param > 1) {
    xx = lon2;
    yy = lat2;
  } else {
    xx = lon1 + param * C;
    yy = lat1 + param * D;
  }
  const R = 3959; // Earth's radius in miles
  const dLat = (yy - lat) * Math.PI / 180;
  const dLon = (xx - lon) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat * Math.PI / 180) * Math.cos(yy * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Query ACS boundary layer for point-in-polygon and proximity
 */
async function getACSBoundaryLayerData(
  baseServiceUrl: string,
  layerId: number,
  layerName: string,
  lat: number,
  lon: number,
  maxRadius: number,
  radiusMiles?: number
): Promise<ACSBoundaryInfo[]> {
  try {
    const { fetchJSONSmart } = await import('../services/EnrichmentService');
    
    const cappedRadius = radiusMiles ? Math.min(radiusMiles, maxRadius) : maxRadius;
    
    const results: ACSBoundaryInfo[] = [];
    
    // Point-in-polygon query first
    try {
      const pointGeometry = {
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 }
      };
      
      const pointInPolyUrl = `${baseServiceUrl}/${layerId}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(pointGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&inSR=4326&outSR=4326&returnGeometry=true`;
      
      console.log(`📊 Querying ACS ${layerName} for point-in-polygon at [${lat}, ${lon}]`);
      
      const pointInPolyData = await fetchJSONSmart(pointInPolyUrl) as any;
      
      if (!pointInPolyData.error && pointInPolyData.features &&
          Array.isArray(pointInPolyData.features) && pointInPolyData.features.length > 0) {
        pointInPolyData.features.forEach((feature: any) => {
          const attributes = feature.attributes || {};
          const geometry = feature.geometry || {};
          const rings = geometry.rings || [];
          
          // Verify point is actually inside polygon (client-side check)
          if (rings.length > 0 && pointInPolygon(lat, lon, rings)) {
            results.push({
              attributes,
              geometry,
              isContaining: true,
              distance_miles: 0
            });
          }
        });
        console.log(`✅ Found ${results.length} ACS ${layerName} feature(s) containing the point`);
      }
    } catch (error) {
      console.error(`❌ Point-in-polygon query failed for ACS ${layerName}:`, error);
    }
    
    // Proximity query (if radius is provided)
    if (cappedRadius > 0) {
      try {
        const radiusMeters = cappedRadius * 1609.34;
        const proximityGeometry = {
          x: lon,
          y: lat,
          spatialReference: { wkid: 4326 }
        };
        
        const allFeatures: any[] = [];
        let resultOffset = 0;
        const batchSize = 2000;
        let hasMore = true;
        
        while (hasMore) {
          const proximityUrl = `${baseServiceUrl}/${layerId}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(proximityGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true&resultRecordCount=${batchSize}&resultOffset=${resultOffset}`;
          
          if (resultOffset === 0) {
            console.log(`📊 Querying ACS ${layerName} for proximity (${cappedRadius} miles) at [${lat}, ${lon}]`);
          }
          
          const proximityData = await fetchJSONSmart(proximityUrl) as any;
          
          if (proximityData.error) {
            console.error(`❌ ACS ${layerName} API Error:`, proximityData.error);
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
        
        console.log(`✅ Fetched ${allFeatures.length} total ACS ${layerName} features for proximity`);
        
        // Process proximity features
        allFeatures.forEach((feature: any) => {
          const attributes = feature.attributes || {};
          const geometry = feature.geometry || {};
          const rings = geometry.rings || [];
          
          // Skip if already in results (from point-in-polygon query)
          const objectId = attributes.OBJECTID || attributes.FID || attributes.fid || null;
          const existingIndex = results.findIndex(r => {
            const rObjectId = r.attributes.OBJECTID || r.attributes.FID || r.attributes.fid || null;
            return rObjectId !== null && objectId !== null && rObjectId === objectId;
          });
          if (existingIndex >= 0) {
            return; // Already added from point-in-polygon query
          }
          
          if (rings.length > 0) {
            const distance = distanceToPolygon(lat, lon, rings);
            
            if (distance <= cappedRadius) {
              results.push({
                attributes,
                geometry,
                isContaining: false,
                distance_miles: distance
              });
            }
          }
        });
        
        console.log(`✅ Found ${results.length} total ACS ${layerName} feature(s) (${results.filter(r => r.isContaining).length} containing, ${results.filter(r => !r.isContaining).length} nearby)`);
      } catch (error) {
        console.error(`❌ Proximity query failed for ACS ${layerName}:`, error);
      }
    }
    
    return results;
  } catch (error) {
    console.error(`❌ Error querying ACS ${layerName}:`, error);
    return [];
  }
}

// Service URLs and layer configurations
const ACS_SERVICES = {
  children_in_grandparent_households: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Children_in_Grandparent_Households_Boundaries/FeatureServer',
    name: 'Children in Grandparent Households'
  },
  children_in_immigrant_families: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Children_in_Immigrant_Families_Boundaries/FeatureServer',
    name: 'Children in Immigrant Families'
  },
  disability_by_age_and_sex: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Disability_by_Age_and_Sex_Boundaries/FeatureServer',
    name: 'Disability by Age and Sex'
  },
  disability_by_type: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Disability_by_Type_Boundaries/FeatureServer',
    name: 'Disability by Type'
  },
  education_by_veteran_status: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Education_by_Veteran_Status_Boundaries/FeatureServer',
    name: 'Education by Veteran Status'
  },
  educational_attainment: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Educational_Attainment_Boundaries/FeatureServer',
    name: 'Educational Attainment'
  },
  employment_status: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Employment_Status_Boundaries/FeatureServer',
    name: 'Employment Status'
  },
  english_ability_and_linguistic_isolation_households: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_English_Ability_and_Lingusitic_Isolation_Households_Boundaries/FeatureServer',
    name: 'English Ability and Linguistic Isolation Households'
  },
  fertility_by_age: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Fertility_by_Age_Boundaries/FeatureServer',
    name: 'Fertility by Age'
  },
  geographical_mobility: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Geographical_Mobility_Boundaries/FeatureServer',
    name: 'Geographical Mobility'
  },
  health_insurance: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Health_Insurance_Boundaries/FeatureServer',
    name: 'Health Insurance'
  },
  health_insurance_by_age_by_race: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Health_Insurance_by_Age_by_Race_Boundaries/FeatureServer',
    name: 'Health Insurance by Age by Race'
  },
  highlights_child_well_being: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Highlights_Child_Well_Being_Boundaries/FeatureServer',
    name: 'Highlights Child Well Being'
  },
  highlights_emergency_response: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Highlights_Emergency_Response_Boundaries/FeatureServer',
    name: 'Highlights Emergency Response'
  },
  highlights_population_housing_basics: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Highlights_Population_Housing_Basics_Boundaries/FeatureServer',
    name: 'Highlights Population Housing Basics'
  },
  highlights_senior_well_being: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Highlights_Senior_Well_Being_Boundaries/FeatureServer',
    name: 'Highlights Senior Well Being'
  },
  household_income_distribution: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Household_Income_Distribution_Boundaries/FeatureServer',
    name: 'Household Income Distribution'
  },
  household_size: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Household_Size_Boundaries/FeatureServer',
    name: 'Household Size'
  },
  housing_costs: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Housing_Costs_Boundaries/FeatureServer',
    name: 'Housing Costs'
  },
  housing_costs_by_age: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Housing_Costs_by_Age_Boundaries/FeatureServer',
    name: 'Housing Costs by Age'
  },
  housing_occupancy_and_tenure_unit_value: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Housing_Occupancy_and_Tenure_Unit_Value_Boundaries/FeatureServer',
    name: 'Housing Occupancy and Tenure Unit Value'
  },
  housing_tenure_by_education_level: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Housing_Tenure_by_Education_Level_Boundaries/FeatureServer',
    name: 'Housing Tenure by Education Level'
  },
  housing_tenure_by_heating_fuel: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Housing_Tenure_by_Heating_Fuel_Boundaries/FeatureServer',
    name: 'Housing Tenure by Heating Fuel'
  },
  housing_tenure_by_race: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Housing_Tenure_by_Race_Boundaries/FeatureServer',
    name: 'Housing Tenure by Race'
  },
  housing_units_by_year_built: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Housing_Units_by_Year_Built_Boundaries/FeatureServer',
    name: 'Housing Units by Year Built'
  },
  housing_units_in_structure: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Housing_Units_in_Structure_Boundaries/FeatureServer',
    name: 'Housing Units in Structure'
  },
  housing_units_vacancy_status: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Housing_Units_Vacancy_Status_Boundaries/FeatureServer',
    name: 'Housing Units Vacancy Status'
  },
  labor_force_participation_by_age: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Labor_Force_Participation_by_Age_Boundaries/FeatureServer',
    name: 'Labor Force Participation by Age'
  },
  language_by_age: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Language_by_Age_Boundaries/FeatureServer',
    name: 'Language by Age'
  },
  marital_status: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Marital_Status_Boundaries/FeatureServer',
    name: 'Marital Status'
  },
  means_of_transportation_to_work: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Means_of_Transportation_to_Work_Boundaries/FeatureServer',
    name: 'Means of Transportation to Work'
  },
  median_age: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Median_Age_Boundaries/FeatureServer',
    name: 'Median Age'
  },
  median_earnings_by_occupation: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Median_Earnings_by_Occupation_Boundaries/FeatureServer',
    name: 'Median Earnings by Occupation'
  },
  median_earnings_by_occupation_by_sex: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Median_Earnings_by_Occupation_by_Sex_Boundaries/FeatureServer',
    name: 'Median Earnings by Occupation by Sex'
  },
  median_income_by_race_and_age_selp_emp: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Median_Income_by_Race_and_Age_Selp_Emp_Boundaries/FeatureServer',
    name: 'Median Income by Race and Age (Self-Employed)'
  },
  nativity_citizenship: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Nativity_Citizenship_Boundaries/FeatureServer',
    name: 'Nativity Citizenship'
  },
  parental_labor_force_participation: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Parental_Labor_Force_Participation_Boundaries/FeatureServer',
    name: 'Parental Labor Force Participation'
  },
  population_by_race_and_hispanic_origin: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Population_by_Race_and_Hispanic_Origin_Boundaries/FeatureServer',
    name: 'Population by Race and Hispanic Origin'
  },
  poverty_by_age: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Poverty_by_Age_Boundaries/FeatureServer',
    name: 'Poverty by Age'
  },
  school_enrollment: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_School_Enrollment_Boundaries/FeatureServer',
    name: 'School Enrollment'
  },
  specific_hispanic_or_latino_origin: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Specific_Hispanic_or_Latino_Origin_Boundaries/FeatureServer',
    name: 'Specific Hispanic or Latino Origin'
  },
  total_population: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_Total_Population_Boundaries/FeatureServer',
    name: 'Total Population'
  },
  travel_time_to_work: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Travel_Time_to_Work_Boundaries/FeatureServer',
    name: 'Travel Time to Work'
  },
  vehicle_availability: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Vehicle_Availability_Boundaries/FeatureServer',
    name: 'Vehicle Availability'
  },
  veteran_status_by_sex_and_age: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Veteran_Status_by_Sex_and_Age_Boundaries/FeatureServer',
    name: 'Veteran Status by Sex and Age'
  },
  youth_activity: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Youth_Activity_Boundaries/FeatureServer',
    name: 'Youth Activity'
  },
  educational_attainment_by_race_by_sex: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_Educational_Attainment_by_Race_by_Sex_Boundaries/FeatureServer',
    name: 'Educational Attainment by Race by Sex'
  },
  fertility_by_age_v2: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_Fertility_by_Age_Boundaries/FeatureServer',
    name: 'Fertility by Age'
  },
  geographical_mobility_v2: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_Geographical_Mobility_Boundaries/FeatureServer',
    name: 'Geographical Mobility'
  },
  health_insurance_v2: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_Health_Insurance_Boundaries/FeatureServer',
    name: 'Health Insurance'
  },
  health_insurance_by_age_by_race_v2: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_Health_Insurance_by_Age_by_Race_Boundaries/FeatureServer',
    name: 'Health Insurance by Age by Race'
  },
  highlights_child_well_being_v2: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_Highlights_Child_Well_Being_Boundaries/FeatureServer',
    name: 'Highlights Child Well Being'
  },
  highlights_emergency_response_v2: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_Highlights_Emergency_Response_Boundaries/FeatureServer',
    name: 'Highlights Emergency Response'
  },
  highlights_population_housing_basics_v2: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_Highlights_Population_Housing_Basics_Boundaries/FeatureServer',
    name: 'Highlights Population Housing Basics'
  },
  highlights_senior_well_being_v2: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_Highlights_Senior_Well_Being_Boundaries/FeatureServer',
    name: 'Highlights Senior Well Being'
  },
  household_income_distribution_v2: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_Household_Income_Distribution_Boundaries/FeatureServer',
    name: 'Household Income Distribution'
  },
  household_size_v2: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_Household_Size_Boundaries/FeatureServer',
    name: 'Household Size'
  },
  housing_costs_v2: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_Housing_Costs_Boundaries/FeatureServer',
    name: 'Housing Costs'
  },
  housing_costs_by_age_v2: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_Housing_Costs_by_Age_Boundaries/FeatureServer',
    name: 'Housing Costs by Age'
  },
  housing_occupancy_and_tenure_unit_value_v2: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_Housing_Occupancy_and_Tenure_Unit_Value_Boundaries/FeatureServer',
    name: 'Housing Occupancy and Tenure Unit Value'
  },
  language_by_age_v2: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_Language_by_Age_Boundaries/FeatureServer',
    name: 'Language by Age'
  },
  living_arrangements: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_Living_Arrangements_Boundaries/FeatureServer',
    name: 'Living Arrangements'
  },
  marital_status_v2: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_Marital_Status_Boundaries/FeatureServer',
    name: 'Marital Status'
  },
  means_of_transportation_to_work_v2: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_Means_of_Transportation_to_Work_Boundaries/FeatureServer',
    name: 'Means of Transportation to Work'
  },
  median_age_v2: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_Median_Age_Boundaries/FeatureServer',
    name: 'Median Age'
  },
  median_earnings_by_occupation_v2: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_Median_Earnings_by_Occupation_Boundaries/FeatureServer',
    name: 'Median Earnings by Occupation'
  },
  median_earnings_by_occupation_by_sex_v2: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_Median_Earnings_by_Occupation_by_Sex_Boundaries/FeatureServer',
    name: 'Median Earnings by Occupation by Sex'
  },
  median_income_by_race_and_age_selp_emp_v2: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_Median_Income_by_Race_and_Age_Selp_Emp_Boundaries/FeatureServer',
    name: 'Median Income by Race and Age (Self-Employed)'
  },
  place_of_birth: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_Place_of_Birth_Boundaries/FeatureServer',
    name: 'Place of Birth'
  },
  specific_asian_groups: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_Specific_Asian_Groups_Boundaries/FeatureServer',
    name: 'Specific Asian Groups'
  },
  specific_language_spoken_by_english_ability: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_Specific_Language_Spoken_by_English_Ability_Boundaries/FeatureServer',
    name: 'Specific Language Spoken by English Ability'
  },
  travel_time_to_work_v2: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_Travel_Time_to_Work_Boundaries/FeatureServer',
    name: 'Travel Time to Work'
  },
  vehicle_availability_v2: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_Vehicle_Availability_Boundaries/FeatureServer',
    name: 'Vehicle Availability'
  },
  youth_activity_v2: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_Youth_Activity_Boundaries/FeatureServer',
    name: 'Youth Activity'
  }
};

// Layer IDs
const STATE_LAYER_ID = 0;
const COUNTY_LAYER_ID = 1;
const TRACT_LAYER_ID = 2;

// Export functions for each service and layer combination
export async function getACSChildrenInGrandparentHouseholdsStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.children_in_grandparent_households.url, STATE_LAYER_ID, 'Children in Grandparent Households - State', lat, lon, 100, radiusMiles);
}

export async function getACSChildrenInGrandparentHouseholdsCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.children_in_grandparent_households.url, COUNTY_LAYER_ID, 'Children in Grandparent Households - County', lat, lon, 100, radiusMiles);
}

export async function getACSChildrenInGrandparentHouseholdsTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.children_in_grandparent_households.url, TRACT_LAYER_ID, 'Children in Grandparent Households - Tract', lat, lon, 50, radiusMiles);
}

export async function getACSChildrenInImmigrantFamiliesStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.children_in_immigrant_families.url, STATE_LAYER_ID, 'Children in Immigrant Families - State', lat, lon, 100, radiusMiles);
}

export async function getACSChildrenInImmigrantFamiliesCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.children_in_immigrant_families.url, COUNTY_LAYER_ID, 'Children in Immigrant Families - County', lat, lon, 100, radiusMiles);
}

export async function getACSChildrenInImmigrantFamiliesTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.children_in_immigrant_families.url, TRACT_LAYER_ID, 'Children in Immigrant Families - Tract', lat, lon, 50, radiusMiles);
}

export async function getACSDisabilityByAgeAndSexStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.disability_by_age_and_sex.url, STATE_LAYER_ID, 'Disability by Age and Sex - State', lat, lon, 100, radiusMiles);
}

export async function getACSDisabilityByAgeAndSexCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.disability_by_age_and_sex.url, COUNTY_LAYER_ID, 'Disability by Age and Sex - County', lat, lon, 100, radiusMiles);
}

export async function getACSDisabilityByAgeAndSexTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.disability_by_age_and_sex.url, TRACT_LAYER_ID, 'Disability by Age and Sex - Tract', lat, lon, 50, radiusMiles);
}

export async function getACSDisabilityByTypeStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.disability_by_type.url, STATE_LAYER_ID, 'Disability by Type - State', lat, lon, 100, radiusMiles);
}

export async function getACSDisabilityByTypeCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.disability_by_type.url, COUNTY_LAYER_ID, 'Disability by Type - County', lat, lon, 100, radiusMiles);
}

export async function getACSDisabilityByTypeTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.disability_by_type.url, TRACT_LAYER_ID, 'Disability by Type - Tract', lat, lon, 50, radiusMiles);
}

export async function getACSEducationByVeteranStatusStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.education_by_veteran_status.url, STATE_LAYER_ID, 'Education by Veteran Status - State', lat, lon, 100, radiusMiles);
}

export async function getACSEducationByVeteranStatusCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.education_by_veteran_status.url, COUNTY_LAYER_ID, 'Education by Veteran Status - County', lat, lon, 100, radiusMiles);
}

export async function getACSEducationByVeteranStatusTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.education_by_veteran_status.url, TRACT_LAYER_ID, 'Education by Veteran Status - Tract', lat, lon, 50, radiusMiles);
}

export async function getACSEducationalAttainmentStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.educational_attainment.url, STATE_LAYER_ID, 'Educational Attainment - State', lat, lon, 100, radiusMiles);
}

export async function getACSEducationalAttainmentCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.educational_attainment.url, COUNTY_LAYER_ID, 'Educational Attainment - County', lat, lon, 100, radiusMiles);
}

export async function getACSEducationalAttainmentTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.educational_attainment.url, TRACT_LAYER_ID, 'Educational Attainment - Tract', lat, lon, 50, radiusMiles);
}

export async function getACSEmploymentStatusStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.employment_status.url, STATE_LAYER_ID, 'Employment Status - State', lat, lon, 100, radiusMiles);
}

export async function getACSEmploymentStatusCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.employment_status.url, COUNTY_LAYER_ID, 'Employment Status - County', lat, lon, 100, radiusMiles);
}

export async function getACSEmploymentStatusTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.employment_status.url, TRACT_LAYER_ID, 'Employment Status - Tract', lat, lon, 50, radiusMiles);
}

export async function getACSEnglishAbilityAndLinguisticIsolationHouseholdsStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.english_ability_and_linguistic_isolation_households.url, STATE_LAYER_ID, 'English Ability and Linguistic Isolation Households - State', lat, lon, 100, radiusMiles);
}

export async function getACSEnglishAbilityAndLinguisticIsolationHouseholdsCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.english_ability_and_linguistic_isolation_households.url, COUNTY_LAYER_ID, 'English Ability and Linguistic Isolation Households - County', lat, lon, 100, radiusMiles);
}

export async function getACSEnglishAbilityAndLinguisticIsolationHouseholdsTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.english_ability_and_linguistic_isolation_households.url, TRACT_LAYER_ID, 'English Ability and Linguistic Isolation Households - Tract', lat, lon, 50, radiusMiles);
}

export async function getACSFertilityByAgeStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.fertility_by_age.url, STATE_LAYER_ID, 'Fertility by Age - State', lat, lon, 100, radiusMiles);
}

export async function getACSFertilityByAgeCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.fertility_by_age.url, COUNTY_LAYER_ID, 'Fertility by Age - County', lat, lon, 100, radiusMiles);
}

export async function getACSFertilityByAgeTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.fertility_by_age.url, TRACT_LAYER_ID, 'Fertility by Age - Tract', lat, lon, 50, radiusMiles);
}

export async function getACSGeographicalMobilityStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.geographical_mobility.url, STATE_LAYER_ID, 'Geographical Mobility - State', lat, lon, 100, radiusMiles);
}

export async function getACSGeographicalMobilityCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.geographical_mobility.url, COUNTY_LAYER_ID, 'Geographical Mobility - County', lat, lon, 100, radiusMiles);
}

export async function getACSGeographicalMobilityTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.geographical_mobility.url, TRACT_LAYER_ID, 'Geographical Mobility - Tract', lat, lon, 50, radiusMiles);
}

export async function getACSHealthInsuranceStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.health_insurance.url, STATE_LAYER_ID, 'Health Insurance - State', lat, lon, 100, radiusMiles);
}

export async function getACSHealthInsuranceCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.health_insurance.url, COUNTY_LAYER_ID, 'Health Insurance - County', lat, lon, 100, radiusMiles);
}

export async function getACSHealthInsuranceTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.health_insurance.url, TRACT_LAYER_ID, 'Health Insurance - Tract', lat, lon, 50, radiusMiles);
}

export async function getACSHealthInsuranceByAgeByRaceStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.health_insurance_by_age_by_race.url, STATE_LAYER_ID, 'Health Insurance by Age by Race - State', lat, lon, 100, radiusMiles);
}

export async function getACSHealthInsuranceByAgeByRaceCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.health_insurance_by_age_by_race.url, COUNTY_LAYER_ID, 'Health Insurance by Age by Race - County', lat, lon, 100, radiusMiles);
}

export async function getACSHealthInsuranceByAgeByRaceTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.health_insurance_by_age_by_race.url, TRACT_LAYER_ID, 'Health Insurance by Age by Race - Tract', lat, lon, 50, radiusMiles);
}

export async function getACSHighlightsChildWellBeingStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.highlights_child_well_being.url, STATE_LAYER_ID, 'Highlights Child Well Being - State', lat, lon, 100, radiusMiles);
}

export async function getACSHighlightsChildWellBeingCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.highlights_child_well_being.url, COUNTY_LAYER_ID, 'Highlights Child Well Being - County', lat, lon, 100, radiusMiles);
}

export async function getACSHighlightsChildWellBeingTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.highlights_child_well_being.url, TRACT_LAYER_ID, 'Highlights Child Well Being - Tract', lat, lon, 50, radiusMiles);
}

export async function getACSHighlightsEmergencyResponseStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.highlights_emergency_response.url, STATE_LAYER_ID, 'Highlights Emergency Response - State', lat, lon, 100, radiusMiles);
}

export async function getACSHighlightsEmergencyResponseCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.highlights_emergency_response.url, COUNTY_LAYER_ID, 'Highlights Emergency Response - County', lat, lon, 100, radiusMiles);
}

export async function getACSHighlightsEmergencyResponseTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.highlights_emergency_response.url, TRACT_LAYER_ID, 'Highlights Emergency Response - Tract', lat, lon, 50, radiusMiles);
}

export async function getACSHighlightsPopulationHousingBasicsStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.highlights_population_housing_basics.url, STATE_LAYER_ID, 'Highlights Population Housing Basics - State', lat, lon, 100, radiusMiles);
}

export async function getACSHighlightsPopulationHousingBasicsCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.highlights_population_housing_basics.url, COUNTY_LAYER_ID, 'Highlights Population Housing Basics - County', lat, lon, 100, radiusMiles);
}

export async function getACSHighlightsPopulationHousingBasicsTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.highlights_population_housing_basics.url, TRACT_LAYER_ID, 'Highlights Population Housing Basics - Tract', lat, lon, 50, radiusMiles);
}

export async function getACSHighlightsSeniorWellBeingStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.highlights_senior_well_being.url, STATE_LAYER_ID, 'Highlights Senior Well Being - State', lat, lon, 100, radiusMiles);
}

export async function getACSHighlightsSeniorWellBeingCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.highlights_senior_well_being.url, COUNTY_LAYER_ID, 'Highlights Senior Well Being - County', lat, lon, 100, radiusMiles);
}

export async function getACSHighlightsSeniorWellBeingTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.highlights_senior_well_being.url, TRACT_LAYER_ID, 'Highlights Senior Well Being - Tract', lat, lon, 50, radiusMiles);
}

export async function getACSHouseholdIncomeDistributionStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.household_income_distribution.url, STATE_LAYER_ID, 'Household Income Distribution - State', lat, lon, 100, radiusMiles);
}

export async function getACSHouseholdIncomeDistributionCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.household_income_distribution.url, COUNTY_LAYER_ID, 'Household Income Distribution - County', lat, lon, 100, radiusMiles);
}

export async function getACSHouseholdIncomeDistributionTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.household_income_distribution.url, TRACT_LAYER_ID, 'Household Income Distribution - Tract', lat, lon, 50, radiusMiles);
}

export async function getACSHouseholdSizeStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.household_size.url, STATE_LAYER_ID, 'Household Size - State', lat, lon, 100, radiusMiles);
}

export async function getACSHouseholdSizeCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.household_size.url, COUNTY_LAYER_ID, 'Household Size - County', lat, lon, 100, radiusMiles);
}

export async function getACSHouseholdSizeTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.household_size.url, TRACT_LAYER_ID, 'Household Size - Tract', lat, lon, 50, radiusMiles);
}

export async function getACSHousingCostsStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.housing_costs.url, STATE_LAYER_ID, 'Housing Costs - State', lat, lon, 100, radiusMiles);
}

export async function getACSHousingCostsCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.housing_costs.url, COUNTY_LAYER_ID, 'Housing Costs - County', lat, lon, 100, radiusMiles);
}

export async function getACSHousingCostsTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.housing_costs.url, TRACT_LAYER_ID, 'Housing Costs - Tract', lat, lon, 50, radiusMiles);
}

export async function getACSHousingCostsByAgeStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.housing_costs_by_age.url, STATE_LAYER_ID, 'Housing Costs by Age - State', lat, lon, 100, radiusMiles);
}

export async function getACSHousingCostsByAgeCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.housing_costs_by_age.url, COUNTY_LAYER_ID, 'Housing Costs by Age - County', lat, lon, 100, radiusMiles);
}

export async function getACSHousingCostsByAgeTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.housing_costs_by_age.url, TRACT_LAYER_ID, 'Housing Costs by Age - Tract', lat, lon, 50, radiusMiles);
}

export async function getACSHousingOccupancyAndTenureUnitValueStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.housing_occupancy_and_tenure_unit_value.url, STATE_LAYER_ID, 'Housing Occupancy and Tenure Unit Value - State', lat, lon, 100, radiusMiles);
}

export async function getACSHousingOccupancyAndTenureUnitValueCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.housing_occupancy_and_tenure_unit_value.url, COUNTY_LAYER_ID, 'Housing Occupancy and Tenure Unit Value - County', lat, lon, 100, radiusMiles);
}

export async function getACSHousingOccupancyAndTenureUnitValueTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.housing_occupancy_and_tenure_unit_value.url, TRACT_LAYER_ID, 'Housing Occupancy and Tenure Unit Value - Tract', lat, lon, 50, radiusMiles);
}

export async function getACSHousingTenureByEducationLevelStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.housing_tenure_by_education_level.url, STATE_LAYER_ID, 'Housing Tenure by Education Level - State', lat, lon, 100, radiusMiles);
}

export async function getACSHousingTenureByEducationLevelCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.housing_tenure_by_education_level.url, COUNTY_LAYER_ID, 'Housing Tenure by Education Level - County', lat, lon, 100, radiusMiles);
}

export async function getACSHousingTenureByEducationLevelTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.housing_tenure_by_education_level.url, TRACT_LAYER_ID, 'Housing Tenure by Education Level - Tract', lat, lon, 50, radiusMiles);
}

export async function getACSHousingTenureByHeatingFuelStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.housing_tenure_by_heating_fuel.url, STATE_LAYER_ID, 'Housing Tenure by Heating Fuel - State', lat, lon, 100, radiusMiles);
}

export async function getACSHousingTenureByHeatingFuelCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.housing_tenure_by_heating_fuel.url, COUNTY_LAYER_ID, 'Housing Tenure by Heating Fuel - County', lat, lon, 100, radiusMiles);
}

export async function getACSHousingTenureByHeatingFuelTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.housing_tenure_by_heating_fuel.url, TRACT_LAYER_ID, 'Housing Tenure by Heating Fuel - Tract', lat, lon, 50, radiusMiles);
}

export async function getACSHousingTenureByRaceStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.housing_tenure_by_race.url, STATE_LAYER_ID, 'Housing Tenure by Race - State', lat, lon, 100, radiusMiles);
}

export async function getACSHousingTenureByRaceCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.housing_tenure_by_race.url, COUNTY_LAYER_ID, 'Housing Tenure by Race - County', lat, lon, 100, radiusMiles);
}

export async function getACSHousingTenureByRaceTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.housing_tenure_by_race.url, TRACT_LAYER_ID, 'Housing Tenure by Race - Tract', lat, lon, 50, radiusMiles);
}

export async function getACSHousingUnitsByYearBuiltStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.housing_units_by_year_built.url, STATE_LAYER_ID, 'Housing Units by Year Built - State', lat, lon, 100, radiusMiles);
}

export async function getACSHousingUnitsByYearBuiltCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.housing_units_by_year_built.url, COUNTY_LAYER_ID, 'Housing Units by Year Built - County', lat, lon, 100, radiusMiles);
}

export async function getACSHousingUnitsByYearBuiltTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.housing_units_by_year_built.url, TRACT_LAYER_ID, 'Housing Units by Year Built - Tract', lat, lon, 50, radiusMiles);
}

export async function getACSHousingUnitsInStructureStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.housing_units_in_structure.url, STATE_LAYER_ID, 'Housing Units in Structure - State', lat, lon, 100, radiusMiles);
}

export async function getACSHousingUnitsInStructureCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.housing_units_in_structure.url, COUNTY_LAYER_ID, 'Housing Units in Structure - County', lat, lon, 100, radiusMiles);
}

export async function getACSHousingUnitsInStructureTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.housing_units_in_structure.url, TRACT_LAYER_ID, 'Housing Units in Structure - Tract', lat, lon, 50, radiusMiles);
}

export async function getACSHousingUnitsVacancyStatusStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.housing_units_vacancy_status.url, STATE_LAYER_ID, 'Housing Units Vacancy Status - State', lat, lon, 100, radiusMiles);
}

export async function getACSHousingUnitsVacancyStatusCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.housing_units_vacancy_status.url, COUNTY_LAYER_ID, 'Housing Units Vacancy Status - County', lat, lon, 100, radiusMiles);
}

export async function getACSHousingUnitsVacancyStatusTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.housing_units_vacancy_status.url, TRACT_LAYER_ID, 'Housing Units Vacancy Status - Tract', lat, lon, 50, radiusMiles);
}

// Labor Force Participation by Age
export async function getACSLaborForceParticipationByAgeStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.labor_force_participation_by_age.url, STATE_LAYER_ID, 'Labor Force Participation by Age - State', lat, lon, 100, radiusMiles);
}
export async function getACSLaborForceParticipationByAgeCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.labor_force_participation_by_age.url, COUNTY_LAYER_ID, 'Labor Force Participation by Age - County', lat, lon, 100, radiusMiles);
}
export async function getACSLaborForceParticipationByAgeTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.labor_force_participation_by_age.url, TRACT_LAYER_ID, 'Labor Force Participation by Age - Tract', lat, lon, 50, radiusMiles);
}

// Language by Age
export async function getACSLanguageByAgeStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.language_by_age.url, STATE_LAYER_ID, 'Language by Age - State', lat, lon, 100, radiusMiles);
}
export async function getACSLanguageByAgeCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.language_by_age.url, COUNTY_LAYER_ID, 'Language by Age - County', lat, lon, 100, radiusMiles);
}
export async function getACSLanguageByAgeTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.language_by_age.url, TRACT_LAYER_ID, 'Language by Age - Tract', lat, lon, 50, radiusMiles);
}

// Marital Status
export async function getACSMaritalStatusStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.marital_status.url, STATE_LAYER_ID, 'Marital Status - State', lat, lon, 100, radiusMiles);
}
export async function getACSMaritalStatusCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.marital_status.url, COUNTY_LAYER_ID, 'Marital Status - County', lat, lon, 100, radiusMiles);
}
export async function getACSMaritalStatusTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.marital_status.url, TRACT_LAYER_ID, 'Marital Status - Tract', lat, lon, 50, radiusMiles);
}

// Means of Transportation to Work
export async function getACSMeansOfTransportationToWorkStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.means_of_transportation_to_work.url, STATE_LAYER_ID, 'Means of Transportation to Work - State', lat, lon, 100, radiusMiles);
}
export async function getACSMeansOfTransportationToWorkCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.means_of_transportation_to_work.url, COUNTY_LAYER_ID, 'Means of Transportation to Work - County', lat, lon, 100, radiusMiles);
}
export async function getACSMeansOfTransportationToWorkTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.means_of_transportation_to_work.url, TRACT_LAYER_ID, 'Means of Transportation to Work - Tract', lat, lon, 50, radiusMiles);
}

// Median Age
export async function getACSMedianAgeStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.median_age.url, STATE_LAYER_ID, 'Median Age - State', lat, lon, 100, radiusMiles);
}
export async function getACSMedianAgeCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.median_age.url, COUNTY_LAYER_ID, 'Median Age - County', lat, lon, 100, radiusMiles);
}
export async function getACSMedianAgeTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.median_age.url, TRACT_LAYER_ID, 'Median Age - Tract', lat, lon, 50, radiusMiles);
}

// Median Earnings by Occupation
export async function getACSMedianEarningsByOccupationStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.median_earnings_by_occupation.url, STATE_LAYER_ID, 'Median Earnings by Occupation - State', lat, lon, 100, radiusMiles);
}
export async function getACSMedianEarningsByOccupationCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.median_earnings_by_occupation.url, COUNTY_LAYER_ID, 'Median Earnings by Occupation - County', lat, lon, 100, radiusMiles);
}
export async function getACSMedianEarningsByOccupationTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.median_earnings_by_occupation.url, TRACT_LAYER_ID, 'Median Earnings by Occupation - Tract', lat, lon, 50, radiusMiles);
}

// Median Earnings by Occupation by Sex
export async function getACSMedianEarningsByOccupationBySexStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.median_earnings_by_occupation_by_sex.url, STATE_LAYER_ID, 'Median Earnings by Occupation by Sex - State', lat, lon, 100, radiusMiles);
}
export async function getACSMedianEarningsByOccupationBySexCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.median_earnings_by_occupation_by_sex.url, COUNTY_LAYER_ID, 'Median Earnings by Occupation by Sex - County', lat, lon, 100, radiusMiles);
}
export async function getACSMedianEarningsByOccupationBySexTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.median_earnings_by_occupation_by_sex.url, TRACT_LAYER_ID, 'Median Earnings by Occupation by Sex - Tract', lat, lon, 50, radiusMiles);
}

// Median Income by Race and Age (Self-Employed)
export async function getACSMedianIncomeByRaceAndAgeSelpEmpStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.median_income_by_race_and_age_selp_emp.url, STATE_LAYER_ID, 'Median Income by Race and Age (Self-Employed) - State', lat, lon, 100, radiusMiles);
}
export async function getACSMedianIncomeByRaceAndAgeSelpEmpCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.median_income_by_race_and_age_selp_emp.url, COUNTY_LAYER_ID, 'Median Income by Race and Age (Self-Employed) - County', lat, lon, 100, radiusMiles);
}
export async function getACSMedianIncomeByRaceAndAgeSelpEmpTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.median_income_by_race_and_age_selp_emp.url, TRACT_LAYER_ID, 'Median Income by Race and Age (Self-Employed) - Tract', lat, lon, 50, radiusMiles);
}

// Nativity Citizenship
export async function getACSNativityCitizenshipStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.nativity_citizenship.url, STATE_LAYER_ID, 'Nativity Citizenship - State', lat, lon, 100, radiusMiles);
}
export async function getACSNativityCitizenshipCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.nativity_citizenship.url, COUNTY_LAYER_ID, 'Nativity Citizenship - County', lat, lon, 100, radiusMiles);
}
export async function getACSNativityCitizenshipTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.nativity_citizenship.url, TRACT_LAYER_ID, 'Nativity Citizenship - Tract', lat, lon, 50, radiusMiles);
}

// Parental Labor Force Participation
export async function getACSParentalLaborForceParticipationStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.parental_labor_force_participation.url, STATE_LAYER_ID, 'Parental Labor Force Participation - State', lat, lon, 100, radiusMiles);
}
export async function getACSParentalLaborForceParticipationCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.parental_labor_force_participation.url, COUNTY_LAYER_ID, 'Parental Labor Force Participation - County', lat, lon, 100, radiusMiles);
}
export async function getACSParentalLaborForceParticipationTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.parental_labor_force_participation.url, TRACT_LAYER_ID, 'Parental Labor Force Participation - Tract', lat, lon, 50, radiusMiles);
}

// Population by Race and Hispanic Origin
export async function getACSPopulationByRaceAndHispanicOriginStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.population_by_race_and_hispanic_origin.url, STATE_LAYER_ID, 'Population by Race and Hispanic Origin - State', lat, lon, 100, radiusMiles);
}
export async function getACSPopulationByRaceAndHispanicOriginCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.population_by_race_and_hispanic_origin.url, COUNTY_LAYER_ID, 'Population by Race and Hispanic Origin - County', lat, lon, 100, radiusMiles);
}
export async function getACSPopulationByRaceAndHispanicOriginTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.population_by_race_and_hispanic_origin.url, TRACT_LAYER_ID, 'Population by Race and Hispanic Origin - Tract', lat, lon, 50, radiusMiles);
}

// Poverty by Age
export async function getACSPovertyByAgeStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.poverty_by_age.url, STATE_LAYER_ID, 'Poverty by Age - State', lat, lon, 100, radiusMiles);
}
export async function getACSPovertyByAgeCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.poverty_by_age.url, COUNTY_LAYER_ID, 'Poverty by Age - County', lat, lon, 100, radiusMiles);
}
export async function getACSPovertyByAgeTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.poverty_by_age.url, TRACT_LAYER_ID, 'Poverty by Age - Tract', lat, lon, 50, radiusMiles);
}

// School Enrollment
export async function getACSSchoolEnrollmentStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.school_enrollment.url, STATE_LAYER_ID, 'School Enrollment - State', lat, lon, 100, radiusMiles);
}
export async function getACSSchoolEnrollmentCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.school_enrollment.url, COUNTY_LAYER_ID, 'School Enrollment - County', lat, lon, 100, radiusMiles);
}
export async function getACSSchoolEnrollmentTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.school_enrollment.url, TRACT_LAYER_ID, 'School Enrollment - Tract', lat, lon, 50, radiusMiles);
}

// Specific Hispanic or Latino Origin
export async function getACSSpecificHispanicOrLatinoOriginStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.specific_hispanic_or_latino_origin.url, STATE_LAYER_ID, 'Specific Hispanic or Latino Origin - State', lat, lon, 100, radiusMiles);
}
export async function getACSSpecificHispanicOrLatinoOriginCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.specific_hispanic_or_latino_origin.url, COUNTY_LAYER_ID, 'Specific Hispanic or Latino Origin - County', lat, lon, 100, radiusMiles);
}
export async function getACSSpecificHispanicOrLatinoOriginTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.specific_hispanic_or_latino_origin.url, TRACT_LAYER_ID, 'Specific Hispanic or Latino Origin - Tract', lat, lon, 50, radiusMiles);
}

// Total Population
export async function getACSTotalPopulationStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.total_population.url, STATE_LAYER_ID, 'Total Population - State', lat, lon, 100, radiusMiles);
}
export async function getACSTotalPopulationCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.total_population.url, COUNTY_LAYER_ID, 'Total Population - County', lat, lon, 100, radiusMiles);
}
export async function getACSTotalPopulationTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.total_population.url, TRACT_LAYER_ID, 'Total Population - Tract', lat, lon, 50, radiusMiles);
}

// Travel Time to Work
export async function getACSTravelTimeToWorkStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.travel_time_to_work.url, STATE_LAYER_ID, 'Travel Time to Work - State', lat, lon, 100, radiusMiles);
}
export async function getACSTravelTimeToWorkCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.travel_time_to_work.url, COUNTY_LAYER_ID, 'Travel Time to Work - County', lat, lon, 100, radiusMiles);
}
export async function getACSTravelTimeToWorkTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.travel_time_to_work.url, TRACT_LAYER_ID, 'Travel Time to Work - Tract', lat, lon, 50, radiusMiles);
}

// Vehicle Availability
export async function getACSVehicleAvailabilityStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.vehicle_availability.url, STATE_LAYER_ID, 'Vehicle Availability - State', lat, lon, 100, radiusMiles);
}
export async function getACSVehicleAvailabilityCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.vehicle_availability.url, COUNTY_LAYER_ID, 'Vehicle Availability - County', lat, lon, 100, radiusMiles);
}
export async function getACSVehicleAvailabilityTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.vehicle_availability.url, TRACT_LAYER_ID, 'Vehicle Availability - Tract', lat, lon, 50, radiusMiles);
}

// Veteran Status by Sex and Age
export async function getACSVeteranStatusBySexAndAgeStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.veteran_status_by_sex_and_age.url, STATE_LAYER_ID, 'Veteran Status by Sex and Age - State', lat, lon, 100, radiusMiles);
}
export async function getACSVeteranStatusBySexAndAgeCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.veteran_status_by_sex_and_age.url, COUNTY_LAYER_ID, 'Veteran Status by Sex and Age - County', lat, lon, 100, radiusMiles);
}
export async function getACSVeteranStatusBySexAndAgeTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.veteran_status_by_sex_and_age.url, TRACT_LAYER_ID, 'Veteran Status by Sex and Age - Tract', lat, lon, 50, radiusMiles);
}

// Youth Activity
export async function getACSYouthActivityStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.youth_activity.url, STATE_LAYER_ID, 'Youth Activity - State', lat, lon, 100, radiusMiles);
}
export async function getACSYouthActivityCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.youth_activity.url, COUNTY_LAYER_ID, 'Youth Activity - County', lat, lon, 100, radiusMiles);
}
export async function getACSYouthActivityTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.youth_activity.url, TRACT_LAYER_ID, 'Youth Activity - Tract', lat, lon, 50, radiusMiles);
}

// Educational Attainment by Race by Sex
export async function getACSEducationalAttainmentByRaceBySexStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.educational_attainment_by_race_by_sex.url, STATE_LAYER_ID, 'Educational Attainment by Race by Sex - State', lat, lon, 100, radiusMiles);
}
export async function getACSEducationalAttainmentByRaceBySexCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.educational_attainment_by_race_by_sex.url, COUNTY_LAYER_ID, 'Educational Attainment by Race by Sex - County', lat, lon, 100, radiusMiles);
}
export async function getACSEducationalAttainmentByRaceBySexTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.educational_attainment_by_race_by_sex.url, TRACT_LAYER_ID, 'Educational Attainment by Race by Sex - Tract', lat, lon, 50, radiusMiles);
}

// Fertility by Age V2
export async function getACSFertilityByAgeV2StateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.fertility_by_age_v2.url, STATE_LAYER_ID, 'Fertility by Age - State', lat, lon, 100, radiusMiles);
}
export async function getACSFertilityByAgeV2CountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.fertility_by_age_v2.url, COUNTY_LAYER_ID, 'Fertility by Age - County', lat, lon, 100, radiusMiles);
}
export async function getACSFertilityByAgeV2TractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.fertility_by_age_v2.url, TRACT_LAYER_ID, 'Fertility by Age - Tract', lat, lon, 50, radiusMiles);
}

// Geographical Mobility V2
export async function getACSGeographicalMobilityV2StateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.geographical_mobility_v2.url, STATE_LAYER_ID, 'Geographical Mobility - State', lat, lon, 100, radiusMiles);
}
export async function getACSGeographicalMobilityV2CountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.geographical_mobility_v2.url, COUNTY_LAYER_ID, 'Geographical Mobility - County', lat, lon, 100, radiusMiles);
}
export async function getACSGeographicalMobilityV2TractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.geographical_mobility_v2.url, TRACT_LAYER_ID, 'Geographical Mobility - Tract', lat, lon, 50, radiusMiles);
}

// Health Insurance V2
export async function getACSHealthInsuranceV2StateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.health_insurance_v2.url, STATE_LAYER_ID, 'Health Insurance - State', lat, lon, 100, radiusMiles);
}
export async function getACSHealthInsuranceV2CountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.health_insurance_v2.url, COUNTY_LAYER_ID, 'Health Insurance - County', lat, lon, 100, radiusMiles);
}
export async function getACSHealthInsuranceV2TractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.health_insurance_v2.url, TRACT_LAYER_ID, 'Health Insurance - Tract', lat, lon, 50, radiusMiles);
}

// Health Insurance by Age by Race V2
export async function getACSHealthInsuranceByAgeByRaceV2StateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.health_insurance_by_age_by_race_v2.url, STATE_LAYER_ID, 'Health Insurance by Age by Race - State', lat, lon, 100, radiusMiles);
}
export async function getACSHealthInsuranceByAgeByRaceV2CountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.health_insurance_by_age_by_race_v2.url, COUNTY_LAYER_ID, 'Health Insurance by Age by Race - County', lat, lon, 100, radiusMiles);
}
export async function getACSHealthInsuranceByAgeByRaceV2TractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.health_insurance_by_age_by_race_v2.url, TRACT_LAYER_ID, 'Health Insurance by Age by Race - Tract', lat, lon, 50, radiusMiles);
}

// Highlights Child Well Being V2
export async function getACSHighlightsChildWellBeingV2StateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.highlights_child_well_being_v2.url, STATE_LAYER_ID, 'Highlights Child Well Being - State', lat, lon, 100, radiusMiles);
}
export async function getACSHighlightsChildWellBeingV2CountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.highlights_child_well_being_v2.url, COUNTY_LAYER_ID, 'Highlights Child Well Being - County', lat, lon, 100, radiusMiles);
}
export async function getACSHighlightsChildWellBeingV2TractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.highlights_child_well_being_v2.url, TRACT_LAYER_ID, 'Highlights Child Well Being - Tract', lat, lon, 50, radiusMiles);
}

// Highlights Emergency Response V2
export async function getACSHighlightsEmergencyResponseV2StateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.highlights_emergency_response_v2.url, STATE_LAYER_ID, 'Highlights Emergency Response - State', lat, lon, 100, radiusMiles);
}
export async function getACSHighlightsEmergencyResponseV2CountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.highlights_emergency_response_v2.url, COUNTY_LAYER_ID, 'Highlights Emergency Response - County', lat, lon, 100, radiusMiles);
}
export async function getACSHighlightsEmergencyResponseV2TractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.highlights_emergency_response_v2.url, TRACT_LAYER_ID, 'Highlights Emergency Response - Tract', lat, lon, 50, radiusMiles);
}

// Highlights Population Housing Basics V2
export async function getACSHighlightsPopulationHousingBasicsV2StateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.highlights_population_housing_basics_v2.url, STATE_LAYER_ID, 'Highlights Population Housing Basics - State', lat, lon, 100, radiusMiles);
}
export async function getACSHighlightsPopulationHousingBasicsV2CountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.highlights_population_housing_basics_v2.url, COUNTY_LAYER_ID, 'Highlights Population Housing Basics - County', lat, lon, 100, radiusMiles);
}
export async function getACSHighlightsPopulationHousingBasicsV2TractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.highlights_population_housing_basics_v2.url, TRACT_LAYER_ID, 'Highlights Population Housing Basics - Tract', lat, lon, 50, radiusMiles);
}

// Highlights Senior Well Being V2
export async function getACSHighlightsSeniorWellBeingV2StateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.highlights_senior_well_being_v2.url, STATE_LAYER_ID, 'Highlights Senior Well Being - State', lat, lon, 100, radiusMiles);
}
export async function getACSHighlightsSeniorWellBeingV2CountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.highlights_senior_well_being_v2.url, COUNTY_LAYER_ID, 'Highlights Senior Well Being - County', lat, lon, 100, radiusMiles);
}
export async function getACSHighlightsSeniorWellBeingV2TractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.highlights_senior_well_being_v2.url, TRACT_LAYER_ID, 'Highlights Senior Well Being - Tract', lat, lon, 50, radiusMiles);
}

// Household Income Distribution V2
export async function getACSHouseholdIncomeDistributionV2StateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.household_income_distribution_v2.url, STATE_LAYER_ID, 'Household Income Distribution - State', lat, lon, 100, radiusMiles);
}
export async function getACSHouseholdIncomeDistributionV2CountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.household_income_distribution_v2.url, COUNTY_LAYER_ID, 'Household Income Distribution - County', lat, lon, 100, radiusMiles);
}
export async function getACSHouseholdIncomeDistributionV2TractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.household_income_distribution_v2.url, TRACT_LAYER_ID, 'Household Income Distribution - Tract', lat, lon, 50, radiusMiles);
}

// Household Size V2
export async function getACSHouseholdSizeV2StateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.household_size_v2.url, STATE_LAYER_ID, 'Household Size - State', lat, lon, 100, radiusMiles);
}
export async function getACSHouseholdSizeV2CountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.household_size_v2.url, COUNTY_LAYER_ID, 'Household Size - County', lat, lon, 100, radiusMiles);
}
export async function getACSHouseholdSizeV2TractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.household_size_v2.url, TRACT_LAYER_ID, 'Household Size - Tract', lat, lon, 50, radiusMiles);
}

// Housing Costs V2
export async function getACSHousingCostsV2StateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.housing_costs_v2.url, STATE_LAYER_ID, 'Housing Costs - State', lat, lon, 100, radiusMiles);
}
export async function getACSHousingCostsV2CountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.housing_costs_v2.url, COUNTY_LAYER_ID, 'Housing Costs - County', lat, lon, 100, radiusMiles);
}
export async function getACSHousingCostsV2TractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.housing_costs_v2.url, TRACT_LAYER_ID, 'Housing Costs - Tract', lat, lon, 50, radiusMiles);
}

// Housing Costs by Age V2
export async function getACSHousingCostsByAgeV2StateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.housing_costs_by_age_v2.url, STATE_LAYER_ID, 'Housing Costs by Age - State', lat, lon, 100, radiusMiles);
}
export async function getACSHousingCostsByAgeV2CountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.housing_costs_by_age_v2.url, COUNTY_LAYER_ID, 'Housing Costs by Age - County', lat, lon, 100, radiusMiles);
}
export async function getACSHousingCostsByAgeV2TractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.housing_costs_by_age_v2.url, TRACT_LAYER_ID, 'Housing Costs by Age - Tract', lat, lon, 50, radiusMiles);
}

// Housing Occupancy and Tenure Unit Value V2
export async function getACSHousingOccupancyAndTenureUnitValueV2StateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.housing_occupancy_and_tenure_unit_value_v2.url, STATE_LAYER_ID, 'Housing Occupancy and Tenure Unit Value - State', lat, lon, 100, radiusMiles);
}
export async function getACSHousingOccupancyAndTenureUnitValueV2CountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.housing_occupancy_and_tenure_unit_value_v2.url, COUNTY_LAYER_ID, 'Housing Occupancy and Tenure Unit Value - County', lat, lon, 100, radiusMiles);
}
export async function getACSHousingOccupancyAndTenureUnitValueV2TractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.housing_occupancy_and_tenure_unit_value_v2.url, TRACT_LAYER_ID, 'Housing Occupancy and Tenure Unit Value - Tract', lat, lon, 50, radiusMiles);
}

// Language by Age V2
export async function getACSLanguageByAgeV2StateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.language_by_age_v2.url, STATE_LAYER_ID, 'Language by Age - State', lat, lon, 100, radiusMiles);
}
export async function getACSLanguageByAgeV2CountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.language_by_age_v2.url, COUNTY_LAYER_ID, 'Language by Age - County', lat, lon, 100, radiusMiles);
}
export async function getACSLanguageByAgeV2TractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.language_by_age_v2.url, TRACT_LAYER_ID, 'Language by Age - Tract', lat, lon, 50, radiusMiles);
}

// Living Arrangements
export async function getACSLivingArrangementsStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.living_arrangements.url, STATE_LAYER_ID, 'Living Arrangements - State', lat, lon, 100, radiusMiles);
}
export async function getACSLivingArrangementsCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.living_arrangements.url, COUNTY_LAYER_ID, 'Living Arrangements - County', lat, lon, 100, radiusMiles);
}
export async function getACSLivingArrangementsTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.living_arrangements.url, TRACT_LAYER_ID, 'Living Arrangements - Tract', lat, lon, 50, radiusMiles);
}

// Marital Status V2
export async function getACSMaritalStatusV2StateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.marital_status_v2.url, STATE_LAYER_ID, 'Marital Status - State', lat, lon, 100, radiusMiles);
}
export async function getACSMaritalStatusV2CountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.marital_status_v2.url, COUNTY_LAYER_ID, 'Marital Status - County', lat, lon, 100, radiusMiles);
}
export async function getACSMaritalStatusV2TractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.marital_status_v2.url, TRACT_LAYER_ID, 'Marital Status - Tract', lat, lon, 50, radiusMiles);
}

// Means of Transportation to Work V2
export async function getACSMeansOfTransportationToWorkV2StateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.means_of_transportation_to_work_v2.url, STATE_LAYER_ID, 'Means of Transportation to Work - State', lat, lon, 100, radiusMiles);
}
export async function getACSMeansOfTransportationToWorkV2CountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.means_of_transportation_to_work_v2.url, COUNTY_LAYER_ID, 'Means of Transportation to Work - County', lat, lon, 100, radiusMiles);
}
export async function getACSMeansOfTransportationToWorkV2TractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.means_of_transportation_to_work_v2.url, TRACT_LAYER_ID, 'Means of Transportation to Work - Tract', lat, lon, 50, radiusMiles);
}

// Median Age V2
export async function getACSMedianAgeV2StateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.median_age_v2.url, STATE_LAYER_ID, 'Median Age - State', lat, lon, 100, radiusMiles);
}
export async function getACSMedianAgeV2CountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.median_age_v2.url, COUNTY_LAYER_ID, 'Median Age - County', lat, lon, 100, radiusMiles);
}
export async function getACSMedianAgeV2TractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.median_age_v2.url, TRACT_LAYER_ID, 'Median Age - Tract', lat, lon, 50, radiusMiles);
}

// Median Earnings by Occupation V2
export async function getACSMedianEarningsByOccupationV2StateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.median_earnings_by_occupation_v2.url, STATE_LAYER_ID, 'Median Earnings by Occupation - State', lat, lon, 100, radiusMiles);
}
export async function getACSMedianEarningsByOccupationV2CountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.median_earnings_by_occupation_v2.url, COUNTY_LAYER_ID, 'Median Earnings by Occupation - County', lat, lon, 100, radiusMiles);
}
export async function getACSMedianEarningsByOccupationV2TractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.median_earnings_by_occupation_v2.url, TRACT_LAYER_ID, 'Median Earnings by Occupation - Tract', lat, lon, 50, radiusMiles);
}

// Median Earnings by Occupation by Sex V2
export async function getACSMedianEarningsByOccupationBySexV2StateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.median_earnings_by_occupation_by_sex_v2.url, STATE_LAYER_ID, 'Median Earnings by Occupation by Sex - State', lat, lon, 100, radiusMiles);
}
export async function getACSMedianEarningsByOccupationBySexV2CountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.median_earnings_by_occupation_by_sex_v2.url, COUNTY_LAYER_ID, 'Median Earnings by Occupation by Sex - County', lat, lon, 100, radiusMiles);
}
export async function getACSMedianEarningsByOccupationBySexV2TractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.median_earnings_by_occupation_by_sex_v2.url, TRACT_LAYER_ID, 'Median Earnings by Occupation by Sex - Tract', lat, lon, 50, radiusMiles);
}

// Median Income by Race and Age (Self-Employed) V2
export async function getACSMedianIncomeByRaceAndAgeSelpEmpV2StateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.median_income_by_race_and_age_selp_emp_v2.url, STATE_LAYER_ID, 'Median Income by Race and Age (Self-Employed) - State', lat, lon, 100, radiusMiles);
}
export async function getACSMedianIncomeByRaceAndAgeSelpEmpV2CountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.median_income_by_race_and_age_selp_emp_v2.url, COUNTY_LAYER_ID, 'Median Income by Race and Age (Self-Employed) - County', lat, lon, 100, radiusMiles);
}
export async function getACSMedianIncomeByRaceAndAgeSelpEmpV2TractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.median_income_by_race_and_age_selp_emp_v2.url, TRACT_LAYER_ID, 'Median Income by Race and Age (Self-Employed) - Tract', lat, lon, 50, radiusMiles);
}

// Place of Birth
export async function getACSPlaceOfBirthStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.place_of_birth.url, STATE_LAYER_ID, 'Place of Birth - State', lat, lon, 100, radiusMiles);
}
export async function getACSPlaceOfBirthCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.place_of_birth.url, COUNTY_LAYER_ID, 'Place of Birth - County', lat, lon, 100, radiusMiles);
}
export async function getACSPlaceOfBirthTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.place_of_birth.url, TRACT_LAYER_ID, 'Place of Birth - Tract', lat, lon, 50, radiusMiles);
}

// Specific Asian Groups
export async function getACSSpecificAsianGroupsStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.specific_asian_groups.url, STATE_LAYER_ID, 'Specific Asian Groups - State', lat, lon, 100, radiusMiles);
}
export async function getACSSpecificAsianGroupsCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.specific_asian_groups.url, COUNTY_LAYER_ID, 'Specific Asian Groups - County', lat, lon, 100, radiusMiles);
}
export async function getACSSpecificAsianGroupsTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.specific_asian_groups.url, TRACT_LAYER_ID, 'Specific Asian Groups - Tract', lat, lon, 50, radiusMiles);
}

// Specific Language Spoken by English Ability
export async function getACSSpecificLanguageSpokenByEnglishAbilityStateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.specific_language_spoken_by_english_ability.url, STATE_LAYER_ID, 'Specific Language Spoken by English Ability - State', lat, lon, 100, radiusMiles);
}
export async function getACSSpecificLanguageSpokenByEnglishAbilityCountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.specific_language_spoken_by_english_ability.url, COUNTY_LAYER_ID, 'Specific Language Spoken by English Ability - County', lat, lon, 100, radiusMiles);
}
export async function getACSSpecificLanguageSpokenByEnglishAbilityTractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.specific_language_spoken_by_english_ability.url, TRACT_LAYER_ID, 'Specific Language Spoken by English Ability - Tract', lat, lon, 50, radiusMiles);
}


// Travel Time to Work V2
export async function getACSTravelTimeToWorkV2StateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.travel_time_to_work_v2.url, STATE_LAYER_ID, 'Travel Time to Work - State', lat, lon, 100, radiusMiles);
}
export async function getACSTravelTimeToWorkV2CountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.travel_time_to_work_v2.url, COUNTY_LAYER_ID, 'Travel Time to Work - County', lat, lon, 100, radiusMiles);
}
export async function getACSTravelTimeToWorkV2TractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.travel_time_to_work_v2.url, TRACT_LAYER_ID, 'Travel Time to Work - Tract', lat, lon, 50, radiusMiles);
}

// Vehicle Availability V2
export async function getACSVehicleAvailabilityV2StateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.vehicle_availability_v2.url, STATE_LAYER_ID, 'Vehicle Availability - State', lat, lon, 100, radiusMiles);
}
export async function getACSVehicleAvailabilityV2CountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.vehicle_availability_v2.url, COUNTY_LAYER_ID, 'Vehicle Availability - County', lat, lon, 100, radiusMiles);
}
export async function getACSVehicleAvailabilityV2TractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.vehicle_availability_v2.url, TRACT_LAYER_ID, 'Vehicle Availability - Tract', lat, lon, 50, radiusMiles);
}

// Youth Activity V2
export async function getACSYouthActivityV2StateData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.youth_activity_v2.url, STATE_LAYER_ID, 'Youth Activity - State', lat, lon, 100, radiusMiles);
}
export async function getACSYouthActivityV2CountyData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.youth_activity_v2.url, COUNTY_LAYER_ID, 'Youth Activity - County', lat, lon, 100, radiusMiles);
}
export async function getACSYouthActivityV2TractData(lat: number, lon: number, radiusMiles?: number): Promise<ACSBoundaryInfo[]> {
  return getACSBoundaryLayerData(ACS_SERVICES.youth_activity_v2.url, TRACT_LAYER_ID, 'Youth Activity - Tract', lat, lon, 50, radiusMiles);
}

