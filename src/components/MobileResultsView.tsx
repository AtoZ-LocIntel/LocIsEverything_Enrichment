import React from 'react';
import { Download, ArrowLeft, Map } from 'lucide-react';
import { EnrichmentResult } from '../App';

interface MobileResultsViewProps {
  result: EnrichmentResult;
  selectedEnrichments: string[];
  onBackToSearch: () => void;
  onDownloadCSV: () => void;
  onViewMap: () => void;
}

const MobileResultsView: React.FC<MobileResultsViewProps> = ({
  result,
  selectedEnrichments,
  onBackToSearch,
  onDownloadCSV,
  onViewMap
}) => {
  const { location, enrichments } = result;

  const formatFieldName = (key: string): string => {
    // Special case for Lake County Building Footprints count
    if (key === 'lake_county_building_footprints_count') {
      return 'Lake County Buildings Nearby';
    }
    
    // Special case for tornado tracks intersects field
    if (key.includes('tornado_tracks') && key.includes('_intersects')) {
      return key
        .replace(/tornado_tracks_1950_2017_intersects/g, 'Tornado Tracks Intersecting')
        .replace(/^poi_/g, 'POI ')
        .replace(/^at_/g, 'AT ')
        .replace(/^pct_/g, 'PCT ')
        .replace(/^de_/g, 'DE ')
        .replace(/nws/g, 'NWS')
        .replace(/fws/g, 'FWS')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
        .replace(/\bDe\b/g, 'DE');
    }
    
    return key
      .replace(/^poi_/g, 'POI ')
      .replace(/^at_/g, 'AT ')
      .replace(/^pct_/g, 'PCT ')
      .replace(/^de_/g, 'DE ')
      .replace(/nws/g, 'NWS')
      .replace(/fws/g, 'FWS')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace(/\bDe\b/g, 'DE');
  };

  const formatValue = (value: any, key: string): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') {
      if (key.includes('elevation') || key.includes('elev')) {
        return `${value.toLocaleString()} ft`;
      }
      if (key.includes('carbon') && key.includes('density')) {
        // Format soil organic carbon density with units
        return `${value.toFixed(2)} kg/m²`;
      }
      if (key.includes('nh_house_district_2022') && !key.includes('_attributes') && !key.includes('_message') && !key.includes('_error')) {
        // Format NH House District
        return value ? String(value) : 'N/A';
      }
      if (key.includes('nh_voting_ward') && !key.includes('_attributes') && !key.includes('_message') && !key.includes('_error')) {
        // Format NH Voting Ward
        return value ? String(value) : 'N/A';
      }
      if (key.includes('nh_senate_district_2022') && !key.includes('_attributes') && !key.includes('_message') && !key.includes('_error')) {
        // Format NH Senate District
        return value ? String(value) : 'N/A';
      }
      if (key.includes('nh_ssurgo_areasymbol') || key.includes('nh_ssurgo_muname')) {
        // Format NH SSURGO fields
        return value ? String(value) : 'N/A';
      }
      if (key.includes('nh_bedrock_geology_formation') || key.includes('nh_bedrock_geology_symbol')) {
        // Format NH Bedrock Geology fields
        return value ? String(value) : 'N/A';
      }
      if (key.includes('nh_parcel') && !key.includes('_attributes') && !key.includes('_message') && !key.includes('_error')) {
        // Format NH Parcel fields
        if (key.includes('_count')) {
          return value ? `${value} parcel${value === 1 ? '' : 's'}` : '0 parcels';
        }
        return value ? String(value) : 'N/A';
      }
      if (key.includes('ma_parcel') && !key.includes('_attributes') && !key.includes('_message') && !key.includes('_error')) {
        // Format MA Parcel fields
        if (key.includes('_count')) {
          return value ? `${value} parcel${value === 1 ? '' : 's'}` : '0 parcels';
        }
        return value ? String(value) : 'N/A';
      }
      if (key.includes('ct_building_footprint') && !key.includes('_attributes') && !key.includes('_message') && !key.includes('_error')) {
        // Format CT Building Footprint fields
        if (key.includes('_count')) {
          return value ? `${value} building${value === 1 ? '' : 's'}` : '0 buildings';
        }
        return value ? String(value) : 'N/A';
      }
      if (key.includes('radius_km')) {
        return `${value.toLocaleString()} km`;
      }
      if (key.includes('radius') || key.includes('miles')) {
        return `${value} miles`;
      }
      return value.toLocaleString();
    }
    if (Array.isArray(value)) {
      if (value.length === 0) return 'None found';
      
      // Skip geometry arrays (arrays of coordinates or geometry objects)
      // Check if this is a geometry array by looking at the structure
      if (value.length > 0) {
        const firstItem = value[0];
        // Check if it's an array of coordinate pairs (geometry rings/paths)
        if (Array.isArray(firstItem) && (Array.isArray(firstItem[0]) || typeof firstItem[0] === 'number')) {
          return 'N/A'; // Skip geometry coordinate arrays
        }
        // Check if it's an array of objects with geometry properties
        if (typeof firstItem === 'object' && firstItem !== null) {
          if ('geometry' in firstItem || '__geometry' in firstItem || 'rings' in firstItem || 'paths' in firstItem || 'x' in firstItem && 'y' in firstItem) {
            return 'N/A'; // Skip arrays of geometry objects
          }
        }
      }
      
      // For detailed POI data, show count only in mobile form view
      if (key.includes('_all_pois') || key.includes('_detailed') || key.includes('_elements') || key.includes('_features') || key.includes('nh_key_destinations_all') || key.includes('nh_nursing_homes_all') || key.includes('nh_ems_all') || key.includes('nh_fire_stations_all') || key.includes('nh_places_of_worship_all') || key.includes('nh_hospitals_all') || key.includes('nh_public_waters_access_all') || key.includes('nh_law_enforcement_all') || key.includes('nh_recreation_trails_all') || key.includes('nh_dot_roads_all') || key.includes('nh_railroads_all') || key.includes('nh_transmission_pipelines_all') || key.includes('nh_cell_towers_all') || key.includes('nh_underground_storage_tanks_all') || key.includes('nh_water_wells_all') || key.includes('nh_public_water_supply_wells_all') || key.includes('nh_remediation_sites_all') || key.includes('nh_automobile_salvage_yards_all') || key.includes('nh_solid_waste_facilities_all') || key.includes('ma_dep_wetlands_all') || key.includes('ma_open_space_all') || key.includes('cape_cod_zoning_all') || key.includes('ma_trails_all') || key.includes('ma_nhesp_natural_communities_all') || key.includes('ct_roads_all') || key.includes('ct_building_footprints_all')) {
        return `${value.length} found (see CSV for details)`;
      }
      
      // Special handling for AVI data - show count only
      if (key.includes('poi_animal_vehicle_collisions_all_pois')) {
        return `${value.length} incidents found (see CSV for details)`;
      }
      
      // Special handling for Wildfire data - show count only
      if (key.includes('poi_wildfires_all_pois') || key.includes('poi_wildfires_detailed') || key.includes('poi_wildfires_elements')) {
        return `${value.length} fires found (see CSV for details)`;
      }
      
      // Regular array handling for non-POI data
      return value.map((item: any) => {
        if (typeof item === 'object' && item !== null) {
          // Filter out geometry properties before stringifying
          const filteredItem = { ...item };
          delete (filteredItem as any).geometry;
          delete (filteredItem as any).__geometry;
          return item.name || item.title || JSON.stringify(filteredItem);
        }
        return String(item);
      }).join('; ');
    }
    
    // Handle objects
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      if (value.name) return String(value.name);
      if (value.title) return String(value.title);
      if (value.value) return String(value.value);
      
      // Format PADUS count objects nicely
      if (key.includes('padus_') && (key.includes('_counts') || key.includes('_count'))) {
        const entries = Object.entries(value).map(([k, v]) => {
          // Format GAP status codes
          if (key.includes('gap')) {
            const gapLabels: Record<string, string> = {
              '1': 'GAP 1 (Strict Nature Reserve)',
              '2': 'GAP 2 (Wilderness)',
              '3': 'GAP 3 (Protected Habitat)',
              '4': 'GAP 4 (Managed Resource)'
            };
            return `${gapLabels[k] || `GAP ${k}`}: ${v}`;
          }
          // Format IUCN categories
          if (key.includes('iucn')) {
            return `${k}: ${v}`;
          }
          // Format other counts
          return `${k}: ${v}`;
        });
        return entries.join(', ');
      }
      
      // Filter out geometry and __geometry properties before stringifying
      const filteredValue = { ...value };
      delete (filteredValue as any).geometry;
      delete (filteredValue as any).__geometry;
      return JSON.stringify(filteredValue);
    }
    
    // Handle USDA Wildfire Risk data
    if (key === 'usda_wildfire_hazard_potential') {
      return `${value}/5`;
    }
    if (key === 'usda_wildfire_hazard_potential_label') {
      return value || 'Unknown Risk Level';
    }
    if (key === 'usda_burn_probability') {
      return value ? value.toFixed(6) : '0.000000';
    }
    if (key === 'usda_burn_probability_percentage') {
      return value ? `${value.toFixed(3)}%` : '0.000%';
    }
    if (key === 'usda_conditional_flame_length') {
      return value ? `${value.toFixed(1)} feet` : 'N/A';
    }
    if (key === 'usda_conditional_flame_length_label') {
      return value || 'Unknown Flame Category';
    }
    if (key === 'usda_risk_to_structures' || key === 'usda_conditional_risk_to_structures') {
      return value ? `Risk Score: ${value}` : 'N/A';
    }
    if (key === 'usda_exposure_type') {
      return `Type ${value}`;
    }
    if (key === 'usda_exposure_type_label') {
      return value || 'Unknown Exposure';
    }
    if (key === 'usda_wildfire_risk_source') {
      return value || 'USDA Forest Service';
    }
    
    // Handle objects
    if (typeof value === 'object' && value !== null) {
      // Try to extract meaningful information from objects
      if (value.name) return String(value.name);
      if (value.title) return String(value.title);
      if (value.value) return String(value.value);
      
      // For complex objects, show key-value pairs
      const entries = Object.entries(value).slice(0, 3);
      if (entries.length > 0) {
        return entries.map(([k, v]) => `${k}: ${v}`).join(', ');
      }
      
      return JSON.stringify(value);
    }
    
    return String(value);
  };

  const getEnrichmentCategory = (key: string): string => {
    // National Risk Index (NRI) annualized frequency layers - treat as Natural Hazards
    if (key.includes('nri_') && key.includes('annualized_frequency')) {
      return 'Natural Hazards';
    }
    
    // Natural Hazards layers - check early to catch all Natural Hazards layers
    if (key.includes('national_seismic_hazard') || key.includes('tornado_tracks') || key.includes('poi_animal_vehicle_collisions') || key.includes('hurricane_evacuation_routes_hazards')) {
      return 'Natural Hazards';
    }

    // Geographic Information
    if (key.includes('elevation') || key.includes('fips_') || key.includes('county_') || key.includes('state_') || key.includes('census_') || key.includes('city_') || key.includes('urban_area_') || key.includes('metro_area_') || key.includes('subdivision_')) {
      return 'Geographic Info';
    }
    
    // Political Districts (excluding NH layers which go to New Hampshire Data)
    if (key.includes('congressional_') || key.includes('state_senate_') || key.includes('state_house_')) {
      return 'Political Districts';
    }
    
    // New Hampshire Data
    if (key.includes('nh_house_district') || key.includes('nh_voting_ward') || key.includes('nh_senate_district') || key.includes('nh_ssurgo') || key.includes('nh_bedrock_geology') || key.includes('nh_geographic_names') || key.includes('nh_parcel') || key.includes('nh_key_destinations') || key.includes('nh_nursing_homes') || key.includes('nh_ems') || key.includes('nh_fire_stations') || key.includes('nh_places_of_worship') || key.includes('nh_hospitals') || key.includes('nh_public_waters_access') || key.includes('nh_law_enforcement') || key.includes('nh_recreation_trails') || key.includes('nh_dot_roads') || key.includes('nh_railroads') || key.includes('nh_transmission_pipelines') || key.includes('nh_cell_towers') || key.includes('nh_underground_storage_tanks') || key.includes('nh_water_wells') || key.includes('nh_public_water_supply_wells') || key.includes('nh_remediation_sites') || key.includes('nh_automobile_salvage_yards') || key.includes('nh_solid_waste_facilities') || key.includes('nh_source_water_protection_area') || key.includes('nh_nwi_plus')) {
      return 'New Hampshire Data';
    }
    
    if (key.includes('ma_dep_wetlands') || key.includes('ma_open_space') || key.includes('cape_cod_zoning') || key.includes('ma_trails') || key.includes('ma_nhesp_natural_communities') || key.includes('ma_lakes_and_ponds') || key.includes('ma_rivers_and_streams') || key.includes('ma_regional_planning_agencies') || key.includes('ma_acecs') || key.includes('ma_parcel')) {
      return 'Massachusetts Data';
    }
    
    // California Data - check before CT and DE to avoid mis-categorization
    if (key.includes('ca_fire_perimeters') || key.includes('ca_wildland_fire') || key.includes('ca_calvtp_treatment_areas') || key.includes('ca_power_outage_areas') || key.includes('ca_')) {
      return 'California Data';
    }
    
    // NYC Data - check before other state data
    if (key.includes('nyc_') || key.includes('ny_')) {
      return 'NYC Data';
    }
    
    // Houston Data - check before other state data
    if (key.includes('houston_')) {
      return 'Houston Data';
    }
    
    // IL Open Data - check before other state data
    if (key.includes('chicago_') || key.includes('lake_county_')) {
      return 'IL Open Data';
    }
    
    // USVI Open Data
    if (key.includes('usvi_')) {
      return 'USVI Open Data';
    }
    
    // Connecticut Data
    if (key.includes('ct_building_footprints') || key.includes('ct_road') || key.includes('ct_')) {
      return 'Connecticut Data';
    }
    
    // Delaware Data
    if (key.includes('de_state_forest') || key.includes('de_pine_plantations') || key.includes('de_urban_tree_canopy') || key.includes('de_forest_cover_2007') || key.includes('de_')) {
      return 'DE Data';
    }
    
    // New Jersey Data
    if (key.includes('nj_parcel') || key.includes('nj_')) {
      return 'NJ Data';
    }
    
    // TIGER Data - check before other categories
    if (key.includes('tiger_')) {
      return 'TIGER Data';
    }
    
    // US National Grid - The National Map
    if (key.includes('us_national_grid_')) {
      return 'The National Map';
    }
    
    // US Historical Cultural Political Points - The National Map
    if (key.includes('us_historical_cultural_political_points')) {
      return 'The National Map';
    }
    
    // US Historical Hydrographic Points - The National Map
    if (key.includes('us_historical_hydrographic_points')) {
      return 'The National Map';
    }
    
    // US Historical Physical Points - The National Map
    if (key.includes('us_historical_physical_points')) {
      return 'The National Map';
    }
    
    // Hurricane Evacuation Routes - The National Map (but not the Natural Hazards version)
    if (key.includes('hurricane_evacuation_routes') && !key.includes('hurricane_evacuation_routes_hazards')) {
      return 'The National Map';
    }
    
    // Hurricane Evacuation Routes (Natural Hazards) - Natural Hazards
    if (key.includes('hurricane_evacuation_routes_hazards')) {
      return 'Natural Hazards';
    }
    
    // USGS Government Units - The National Map
    if (key.includes('usgs_gov_')) {
      return 'The National Map';
    }
    
    // TNM Structures - The National Map
    if (key.includes('tnm_structures') || key.includes('usgs_trails')) {
      return 'The National Map';
    }
    if (key.startsWith('dc_utc_') || key.startsWith('dc_urban_tree_canopy_') || key === 'dc_trees' || key === 'dc_ufa_street_trees' || key === 'dc_arborists_zone' || key.startsWith('dc_bike_') || key.startsWith('dc_property_')) {
      return 'District of Columbia';
    }
    
    // Ireland Data
    if (key.includes('ireland_provinces') || key.includes('ireland_built_up_areas') || key.includes('ireland_small_areas') || key.includes('ireland_electoral_divisions') || key.includes('ireland_centres_of_population')) {
      return 'Ireland Data';
    }
    
    // UK Open Data (UK Office for National Statistics)
    if (key.startsWith('uk_')) {
      return 'UK Open Data';
    }
    
    // Demographics
    if (key.includes('acs_')) {
      return 'Demographics';
    }
    
    // FWS Species & Wildlife
    if (key.includes('fws_')) {
      return 'FWS Species & Wildlife';
    }
    
    if (key.includes('wildfire') || (key.includes('usda_') && !key.includes('poi_usda_')) || key.includes('poi_fema_flood_zones') || key.includes('poi_wetlands') || key.includes('poi_earthquakes') || key.includes('poi_volcanoes') || key.includes('poi_flood_reference_points') || key.includes('poi_wildfires') || key.includes('poi_animal_vehicle_collisions') || (key.includes('poi_') && key.includes('count') && key.includes('wildfire')) || key.includes('national_seismic_hazard') || key.includes('tornado_tracks') || key.includes('hurricane_evacuation_routes_hazards')) {
      return 'Natural Hazards';
    }
    
    if (key.includes('poi_epa_')) {
      return 'Human Caused Hazards';
    }
                if (key.startsWith('nws_')) {
              return 'Watching the Weather';
            }
            if (key.includes('open_meteo_weather')) {
              return 'Weather & Alerts';
            }
            if (key.includes('nws_weather_alerts')) {
              return 'Weather & Alerts';
            }
    if (key.includes('poi_bus') || key.includes('poi_train') || key.includes('poi_subway_metro') || key.includes('poi_tram') || key.includes('poi_monorail') || key.includes('poi_aerialway') || key.includes('poi_ferry') || key.includes('poi_airport_air') || key.includes('poi_taxi') || key.includes('poi_bike_scooter_share') || key.includes('poi_dockless_hub') || key.includes('poi_electric_charging')) {
      return 'Transportation';
    }
    if (key.includes('poi_beaches') || key.includes('poi_lakes_ponds') || key.includes('poi_rivers_streams') || key.includes('poi_mountains_peaks')) {
      return 'Natural Resources';
    }
    if (key.includes('soil_') && (key.includes('carbon') || key.includes('organic'))) {
      return 'Natural Resources';
    }
    if (key.includes('usfws_') || key.includes('american_eel_current_range') || key.includes('bighorn_sheep_captures_releases') || key.includes('chinook_salmon_ranges') || key.includes('national_aquatic_barrier_dams') || key.includes('national_marine_sanctuaries')) {
      return 'Fish and Wildlife';
    }
    if (key.includes('poi_osm_elementary') || key.includes('poi_colleges') || key.includes('poi_osm_daycares') || key.includes('poi_osm_vocational') || key.includes('poi_osm_tutoring') || key.includes('poi_osm_libraries') || key.includes('elementary') || key.includes('daycares') || key.includes('preschools') || key.includes('vocational') || key.includes('technical') || key.includes('tutoring') || key.includes('library')) {
      return 'Education';
    }
    if (key.includes('poi_hospitals') || key.includes('poi_parks') || key.includes('poi_worship') || key.includes('poi_community_centres') || key.includes('poi_town_halls') || key.includes('poi_courthouses') || key.includes('poi_post_offices') || key.includes('poi_parcel_lockers') || key.includes('poi_childcare') || key.includes('poi_mail_shipping') || key.includes('poi_usda_farmers_market') || key.includes('poi_usda_csa') || key.includes('poi_usda_agritourism') || key.includes('poi_usda_food_hub') || key.includes('poi_usda_onfarm_market')) {
      return 'Community & Services';
    }
    if (key.includes('poi_grocery') || key.includes('poi_restaurants') || key.includes('poi_banks') || key.includes('poi_pharmacies') || key.includes('poi_convenience') || key.includes('poi_hardware') || key.includes('poi_liquor') || key.includes('poi_bakery') || key.includes('poi_butcher') || key.includes('poi_seafood') || key.includes('poi_sporting') || key.includes('poi_bookstore') || key.includes('poi_clothing') || key.includes('poi_shoes') || key.includes('poi_thrift') || key.includes('poi_pet') || key.includes('poi_florist') || key.includes('poi_variety') || key.includes('poi_gas_stations') || key.includes('poi_car_wash') || key.includes('poi_auto_repair') || key.includes('poi_auto_parts') || key.includes('poi_auto_dealers')) {
      return 'Community & Services';
    }
    if (key.includes('poi_doctors_clinics') || key.includes('poi_dentists') || key.includes('poi_gyms') || key.includes('poi_chiropractor') || key.includes('poi_optometry') || key.includes('poi_veterinary') || key.includes('poi_hospitals') || key.includes('poi_police_stations') || key.includes('poi_fire_stations') || key.includes('poi_urgent_care')) {
      return 'Health & Wellness';
    }
    if (key.includes('poi_cinemas') || key.includes('poi_theatres') || key.includes('poi_museums_historic') || key.includes('poi_hotels') || key.includes('poi_breweries') || key.includes('poi_bowling') || key.includes('poi_arcade') || key.includes('poi_rv_park') || key.includes('poi_campground') || key.includes('poi_wikipedia')) {
      return 'Recreation & Leisure';
    }
    if (key.includes('poi_substations') || key.includes('poi_powerlines') || key.includes('poi_power_plants_openei') || key.includes('poi_cell_towers') || key.includes('poi_grid')) {
      return 'Power & Infrastructure';
    }
    if (key.includes('poi_airports') || key.includes('poi_railroads') || key.includes('poi_gas')) {
      return 'Transportation';
    }
    // Check BLM, PADUS, and USFS before AT/PCT to avoid false matches
    if (key.includes('blm_') || key.includes('padus_') || key.includes('usfs_') || key.includes('nps_') || key.includes('poi_padus_public_access') || key.includes('poi_padus_protection_status')) {
      return 'Public Lands';
    }
    if (key.startsWith('at_') || (key.includes('at_') && !key.includes('blm_'))) {
      return 'Appalachian Trail';
    }
    if (key.startsWith('pct_') || (key.includes('pct_') && !key.includes('blm_'))) {
      return 'Pacific Crest Trail';
    }
    
    // Ensure EPA fields don't get captured by the generic POI count bucket
    if (key.includes('poi_epa_') || key.startsWith('tri_')) {
      return 'Human Caused Hazards';
    }

    // Catch-all for POI counts that don't fit other categories
    if (key.includes('poi_') && key.includes('count')) {
      return 'Points of Interest Nearby';
    }
    return 'Other';
  };

  const groupedEnrichments = Object.entries(enrichments).reduce((acc, [key, value]) => {
    // Filter out detailed POI data from mobile form display (same as desktop)
    if (key.includes('_all_pois') ||
        key.includes('_detailed') ||
        key.includes('_elements') ||
        key.includes('_features') ||
        key.endsWith('_all') ||
        key.endsWith(' All') ||
        key.includes('_all') ||
        (key.includes('poi_') && key.includes('_all')) ||
        (key.toLowerCase().includes('poi') && key.toLowerCase().includes('all')) ||
        key.toLowerCase().endsWith('all')) {
      return acc;
    }
    
    // Skip attributes fields (raw JSON data that's not user-friendly)
    if (key.includes('_attributes')) {
      return acc;
    }
    
    // Skip geometry fields (raw JSON data, used for map drawing but not displayed in summary)
    if (key.includes('_geometry') || key.endsWith('_geometry') || key === 'geometry' || key === 'rings' || key === 'paths' || key === 'coordinates') {
      return acc;
    }
    
    // Skip geometry arrays (arrays of coordinates or geometry objects)
    if (Array.isArray(value) && value.length > 0) {
      const firstItem = value[0];
      // Check if it's an array of coordinate pairs (geometry rings/paths)
      if (Array.isArray(firstItem) && (Array.isArray(firstItem[0]) || typeof firstItem[0] === 'number')) {
        return acc; // Skip geometry coordinate arrays
      }
      // Check if it's an array of objects with geometry properties
      if (typeof firstItem === 'object' && firstItem !== null) {
        if ('geometry' in firstItem || '__geometry' in firstItem || 'rings' in firstItem || 'paths' in firstItem || ('x' in firstItem && 'y' in firstItem)) {
          return acc; // Skip arrays of geometry objects
        }
      }
    }
    
    // Only show fields for selected enrichments (plus core fields that are always shown)
    const coreFields = ['elevation', 'air_quality', 'fips_state', 'fips_county', 'fips_tract', 'acs_population', 'acs_median_income', 'weather_summary', 'weather_current', 'nws_alerts'];
    const isCoreField = coreFields.some(core => key.toLowerCase().includes(core.toLowerCase()));
    
    // Check if this field should be shown based on selected enrichments
    const isSelectedEnrichment = selectedEnrichments.some(selected => {
      // Exact match
      if (key.includes(selected)) return true;
      
      // PADUS public lands fields - handle padus_ prefix keys
      if (selected === 'poi_padus_public_access' && key.includes('padus_public_access')) {
        return true;
      }
      if (selected === 'poi_padus_protection_status' && key.includes('padus_protection_status')) {
        return true;
      }
      if (selected === 'usgs_trails' && key.includes('usgs_trails')) {
        return true;
      }
      // DC Urban Tree Canopy layers
      if (key.startsWith('dc_utc_')) {
        const dcEnrichmentIds = [
          'dc_urban_tree_canopy_anc_2020', 'dc_urban_tree_canopy_census_block_2020', 'dc_urban_tree_canopy_census_block_group_2020',
          'dc_urban_tree_canopy_2010_census_block_group_2020', 'dc_urban_tree_canopy_dc_boundary_2020', 'dc_urban_tree_canopy_dc_owned_property_2020',
          'dc_urban_tree_canopy_generalized_ownership_parcel_2020', 'dc_urban_tree_canopy_ownership_lot_2020', 'dc_urban_tree_canopy_2019_right_of_way_2020',
          'dc_urban_tree_canopy_single_member_district_2020', 'dc_urban_tree_canopy_ward_2020', 'dc_trees',
          'dc_urban_tree_canopy_ownership_lot_2015', 'dc_urban_tree_canopy_ward_2015', 'dc_ufa_street_trees',
          'dc_arborists_zone', 'dc_urban_tree_canopy_anc_2015', 'dc_urban_tree_canopy_census_block_group_2015',
          'dc_urban_tree_canopy_census_block_2015', 'dc_urban_tree_canopy_single_member_district_2015', 'dc_urban_tree_canopy_2006_landuse_2015',
          'dc_urban_tree_canopy_2011_landuse_2015', 'dc_urban_tree_canopy_2015_landuse_2015'
        ];
        return dcEnrichmentIds.some(id => {
          if (selected === id) {
            const layerKey = id.replace('dc_urban_tree_canopy_', 'dc_utc_').replace('dc_trees', 'dc_utc_trees').replace('dc_ufa_street_trees', 'dc_utc_ufa_street_trees').replace('dc_arborists_zone', 'dc_utc_arborists_zone');
            return key.includes(layerKey);
          }
          return false;
        });
      }
      // DC Bike Trails layers
      if (key.startsWith('dc_bike_')) {
        const dcBikeEnrichmentIds = [
          'dc_trail_mile_marker', 'dc_planned_multi_use_trails', 'dc_bicycle_lanes',
          'dc_bike_trails', 'dc_capital_bike_share_locations', 'dc_signed_bike_routes',
          'dc_nps_trails', 'dc_public_bike_racks'
        ];
        return dcBikeEnrichmentIds.some(id => {
          if (selected === id) {
            const layerKeyMap: Record<string, string> = {
              'dc_trail_mile_marker': 'dc_bike_trail_mile_marker',
              'dc_planned_multi_use_trails': 'dc_bike_planned_multi_use_trails',
              'dc_bicycle_lanes': 'dc_bike_bicycle_lanes',
              'dc_bike_trails': 'dc_bike_bike_trails',
              'dc_capital_bike_share_locations': 'dc_bike_capital_bike_share_locations',
              'dc_signed_bike_routes': 'dc_bike_signed_bike_routes',
              'dc_nps_trails': 'dc_bike_nps_trails',
              'dc_public_bike_racks': 'dc_bike_public_bike_racks',
            };
            const layerKey = layerKeyMap[id] || id.replace('dc_', 'dc_bike_');
            return key.includes(layerKey);
          }
          return false;
        });
      }
      // DC Property and Land layers
      if (key.startsWith('dc_property_')) {
        const dcPropertyEnrichmentIds = [
          'dc_property_air_rights_lot_points', 'dc_property_alley_frontage_lines', 'dc_property_air_rights_lots_historical',
          'dc_property_air_rights_lots', 'dc_property_appropriation_points', 'dc_property_appropriations',
          'dc_property_assessment_neighborhoods', 'dc_property_assessment_sub_neighborhoods', 'dc_property_district_land_points',
          'dc_property_building_restriction_lines', 'dc_property_certificate_of_occupancy_points', 'dc_property_military_bases',
          'dc_property_parcel_lot_points', 'dc_property_record_lot_points', 'dc_property_reservations_points',
          'dc_property_square_points', 'dc_property_tax_lot_points', 'dc_property_highway_plan_lines',
          'dc_property_parcel_lots_historical', 'dc_property_parcel_lots', 'dc_property_record_lots_historical',
          'dc_property_record_lots', 'dc_property_reservations_historical', 'dc_property_reservations',
          'dc_property_tax_lots_historical', 'dc_property_tax_lots', 'dc_property_owner_polygons',
          'dc_property_square_boundaries', 'dc_property_boundary_stones_location', 'dc_property_condo_approval_lots',
          'dc_property_public_easement_lines', 'dc_property_district_land_rpta_ownership', 'dc_property_federal_land_rpta_ownership',
          'dc_property_owner_lines_dimensions', 'dc_property_district_land', 'dc_property_affordable_housing',
          'dc_property_real_estate_portfolio', 'dc_property_district_land_lines_dimensions', 'dc_property_wdcep_development_point',
          'dc_property_alley_and_street_changes', 'dc_property_district_structures', 'dc_property_land_boundary_changes',
          'dc_property_alley_street_changes_dimensions', 'dc_property_vacant_and_blighted_building_footprints', 'dc_property_vacant_and_blighted_building_addresses'
        ];
        return dcPropertyEnrichmentIds.some(id => {
          if (selected === id) {
            return key.includes(id);
          }
          return false;
        });
      }
      
      // POI fields - only show if the specific POI type is selected
      if (selected.includes('poi_') && key.includes('poi_')) {
        // Extract the POI type from selected (e.g., 'poi_restaurants' from 'poi_restaurants')
        const selectedPoiType = selected.replace('poi_', '');
        return key.includes(`poi_${selectedPoiType}`);
      }
      
      // AT fields - only show if AT is selected
      if (selected.includes('at_') && key.includes('at_')) {
        return selectedEnrichments.includes('at_centerline') || selectedEnrichments.some(s => s.startsWith('at_'));
      }
      
      // PCT fields - only show if PCT is selected
      if (selected.includes('pct_') && key.includes('pct_')) {
        return selectedEnrichments.includes('pct_centerline') || selectedEnrichments.some(s => s.startsWith('pct_'));
      }
      
      // USDA wildfire fields - only show if specific USDA wildfire enrichment is selected
      if (key.includes('usda_') && key.includes('wildfire')) {
        return selectedEnrichments.includes('usda_wildfire_hazard_potential');
      }
      
      // FWS fields - only show if FWS species enrichment is selected
      if (key.includes('fws_')) {
        return selectedEnrichments.includes('poi_fws_species');
      }
      
      // Soil carbon density fields - only show if soil carbon density enrichment is selected
      if (key.includes('soil_') && (key.includes('carbon') || key.includes('organic'))) {
        return selectedEnrichments.includes('soil_organic_carbon_density');
      }
      
      // US National Grid fields - handle usng_ prefix in field keys
      if (key.includes('us_national_grid_')) {
        return selectedEnrichments.some(selected => {
          if (selected.includes('us_national_grid_')) {
            // Extract the grid type from selected (e.g., 'us_national_grid_6x8_zones' -> '6x8_zones')
            const gridType = selected.replace('us_national_grid_', '');
            // Field keys have 'usng_' prefix, so check if key includes the grid type
            return key.includes(gridType);
          }
          return false;
        });
      }
      
      // NH House District fields - only show if NH House District enrichment is selected
      if (key.includes('nh_house_district')) {
        return selectedEnrichments.includes('nh_house_districts_2022');
      }
      
      if (key.includes('nh_voting_ward')) {
        return selectedEnrichments.includes('nh_voting_wards');
      }
      
      if (key.includes('nh_senate_district')) {
        return selectedEnrichments.includes('nh_senate_districts_2022');
      }
      
      // NH Parcels fields - skip the _all array (handled separately)
      if (key.includes('nh_parcel') && key !== 'nh_parcels_all') {
        return selectedEnrichments.includes('nh_parcels');
      }
      
      // MA Parcels fields - skip the _all array (handled separately)
      if (key.includes('ma_parcel') && key !== 'ma_parcels_all') {
        return selectedEnrichments.includes('ma_parcels');
      }
      
      // CT Building Footprints fields - skip the _all array (handled separately)
      if (key.includes('ct_building_footprint') && key !== 'ct_building_footprints_all') {
        return selectedEnrichments.includes('ct_building_footprints');
      }
      
      // CT Roads fields - only show if CT Roads enrichment is selected
      // Skip the _all array (handled separately in display)
      if (key.includes('ct_road') && key !== 'ct_roads_all') {
        return selectedEnrichments.includes('ct_roads');
      }
      
      // NH Key Destinations fields - skip the _all array (handled separately)
      if (key.includes('nh_key_destinations') && key !== 'nh_key_destinations_all') {
        return selectedEnrichments.includes('nh_key_destinations');
      }
      
      // NH Nursing Homes fields - skip the _all array (handled separately)
      if (key.includes('nh_nursing_homes') && key !== 'nh_nursing_homes_all') {
        return selectedEnrichments.includes('nh_nursing_homes');
      }
      
      // NH EMS fields - skip the _all array (handled separately)
      if (key.includes('nh_ems') && key !== 'nh_ems_all') {
        return selectedEnrichments.includes('nh_ems');
      }
      
      // NH Fire Stations fields - skip the _all array (handled separately)
      if (key.includes('nh_fire_stations') && key !== 'nh_fire_stations_all') {
        return selectedEnrichments.includes('nh_fire_stations');
      }
      
      // NH Places of Worship fields - skip the _all array (handled separately)
      if (key.includes('nh_places_of_worship') && key !== 'nh_places_of_worship_all') {
        return selectedEnrichments.includes('nh_places_of_worship');
      }
      
      // NH Hospitals fields - skip the _all array (handled separately)
      if (key.includes('nh_hospitals') && key !== 'nh_hospitals_all') {
        return selectedEnrichments.includes('nh_hospitals');
      }
      
      // NH Access Sites to Public Waters fields - skip the _all array (handled separately)
      if (key.includes('nh_public_waters_access') && key !== 'nh_public_waters_access_all') {
        return selectedEnrichments.includes('nh_public_waters_access');
      }
      
      // NH Law Enforcement fields - skip the _all array (handled separately)
      if (key.includes('nh_law_enforcement') && key !== 'nh_law_enforcement_all') {
        return selectedEnrichments.includes('nh_law_enforcement');
      }
      
      // NH Recreation Trails fields - skip the _all array (handled separately)
      if (key.includes('nh_recreation_trails') && key !== 'nh_recreation_trails_all') {
        return selectedEnrichments.includes('nh_recreation_trails');
      }
      
      // NH DOT Roads fields - skip the _all array (handled separately)
      if (key.includes('nh_dot_roads') && key !== 'nh_dot_roads_all') {
        return selectedEnrichments.includes('nh_dot_roads');
      }
      
      // NH Railroads fields - skip the _all array (handled separately)
      if (key.includes('nh_railroads') && key !== 'nh_railroads_all') {
        return selectedEnrichments.includes('nh_railroads');
      }
      
      // NH Transmission/Pipelines fields - skip the _all array (handled separately)
      if (key.includes('nh_transmission_pipelines') && key !== 'nh_transmission_pipelines_all') {
        return selectedEnrichments.includes('nh_transmission_pipelines');
      }
      
      // NH Cell Towers fields - skip the _all array (handled separately)
      if (key.includes('nh_cell_towers') && key !== 'nh_cell_towers_all') {
        return selectedEnrichments.includes('nh_cell_towers');
      }
      
      // NH Underground Storage Tank Sites fields - skip the _all array (handled separately)
      if (key.includes('nh_underground_storage_tanks') && key !== 'nh_underground_storage_tanks_all') {
        return selectedEnrichments.includes('nh_underground_storage_tanks');
      }
      
      // NH Water Well Inventory fields - skip the _all array (handled separately)
      if (key.includes('nh_water_wells') && key !== 'nh_water_wells_all') {
        return selectedEnrichments.includes('nh_water_wells');
      }
      
      // NH Public Water Supply Wells fields - skip the _all array (handled separately)
      if (key.includes('nh_public_water_supply_wells') && key !== 'nh_public_water_supply_wells_all') {
        return selectedEnrichments.includes('nh_public_water_supply_wells');
      }
      
      // NH Remediation Sites fields - skip the _all array (handled separately)
      if (key.includes('nh_remediation_sites') && key !== 'nh_remediation_sites_all') {
        return selectedEnrichments.includes('nh_remediation_sites');
      }
      
      // NH Automobile Salvage Yards fields - skip the _all array (handled separately)
      if (key.includes('nh_automobile_salvage_yards') && key !== 'nh_automobile_salvage_yards_all') {
        return selectedEnrichments.includes('nh_automobile_salvage_yards');
      }
      
      // NH Solid Waste Facilities fields - skip the _all array (handled separately)
      if (key.includes('nh_solid_waste_facilities') && key !== 'nh_solid_waste_facilities_all') {
        return selectedEnrichments.includes('nh_solid_waste_facilities');
      }
      
      // NH Source Water Protection Areas fields - only show if NH Source Water Protection Areas enrichment is selected
      if (key.includes('nh_source_water_protection_area')) {
        return selectedEnrichments.includes('nh_source_water_protection_areas');
      }
      
      // NH NWI Plus fields - only show if NH NWI Plus enrichment is selected
      // Skip the _all array (handled separately in display)
      if (key.includes('nh_nwi_plus') && key !== 'nh_nwi_plus_all') {
        return selectedEnrichments.includes('nh_nwi_plus');
      }
      
      return false;
    });
    
    if (!isCoreField && !isSelectedEnrichment) {
      return acc;
    }
    
    const category = getEnrichmentCategory(key);
    if (!acc[category]) acc[category] = [];
    acc[category].push({ key, value });
    return acc;
  }, {} as Record<string, Array<{ key: string; value: any }>>);

  // Filter out categories that don't contain any selected enrichments
  const filteredGroupedEnrichments = Object.entries(groupedEnrichments).reduce((acc, [category, items]) => {
    // Check if category contains any selected enrichments
    const hasSelected = items.some(item => 
      selectedEnrichments.some(selected => {
        // Exact match or starts with selected enrichment ID
        if (item.key.includes(selected) || item.key.startsWith(selected + '_')) {
          return true;
        }
        // Handle BLM layers
        if (selected.includes('blm_') && item.key.includes('blm_')) {
          return true;
        }
        // Handle PADUS layers
        if (selected.includes('padus_') && item.key.includes('padus_')) {
          return true;
        }
        // Handle AT layers - must start with at_ or be exact match
        if (selected.startsWith('at_') && (item.key.startsWith('at_') || item.key === selected)) {
          return true;
        }
        // Handle PCT layers - must start with pct_ or be exact match
        if (selected.startsWith('pct_') && (item.key.startsWith('pct_') || item.key === selected)) {
          return true;
        }
        return false;
      })
    );
    
    // Only include categories with selected enrichments
    if (hasSelected) {
      acc[category] = items;
    }
    
    return acc;
  }, {} as Record<string, Array<{ key: string; value: any }>>);

  // Sort categories to prioritize those containing selected enrichments
  const sortedCategories = Object.entries(filteredGroupedEnrichments).sort(([categoryA, itemsA], [categoryB, itemsB]) => {
    // Check if category contains any selected enrichments
    const hasSelectedA = itemsA.some(item => 
      selectedEnrichments.some(selected => 
        item.key.includes(selected) || item.key.startsWith(selected + '_')
      )
    );
    const hasSelectedB = itemsB.some(item => 
      selectedEnrichments.some(selected => 
        item.key.includes(selected) || item.key.startsWith(selected + '_')
      )
    );
    
    // Categories with selected enrichments come first
    if (hasSelectedA && !hasSelectedB) return -1;
    if (!hasSelectedA && hasSelectedB) return 1;
    
    // Within each group, maintain alphabetical order
    return categoryA.localeCompare(categoryB);
  });

  return (
    <div className="min-h-screen bg-gray-50 md:hidden pt-4 mobile-results-container">
      {/* Header with Action Buttons */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40 mobile-header">
        <div className="flex items-center justify-between mobile-header-content">
          <button
            onClick={onBackToSearch}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Search</span>
          </button>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onViewMap}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Map className="w-4 h-4" />
              <span>Map</span>
            </button>
            <button
              onClick={onDownloadCSV}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results Content */}
      <div className="py-4 space-y-4 mobile-content">
        {/* Location Header */}
        <div className="bg-black rounded-xl shadow-sm border border-gray-200 mobile-card">
          <div className="p-4">
            <div className="flex items-center space-x-4 mb-3">
              {/* Logo */}
              <div className="flex-shrink-0">
                <img 
                  src="/assets/lociseverything.webp"
                  alt="The Location Is Everything Co Logo" 
                  className="w-12 h-12 rounded-full object-cover"
                />
              </div>
              {/* Location Info */}
              <div className="flex-1 text-center">
                <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 break-words">{location.name}</h1>
                <div className="text-gray-300 space-y-1 text-sm sm:text-base">
                  <p className="break-all">Coordinates: {location.lat.toFixed(6)}, {location.lon.toFixed(6)}</p>
                  <p className="break-words">Source: {location.source}</p>
                  <p>Confidence: {location.confidence}%</p>
                </div>
              </div>
            </div>
            
            {/* Key Summary Values */}
            <div className="mt-4 pt-4 border-t border-gray-600">
              <div className="grid grid-cols-2 gap-3 text-base sm:text-base">
                {enrichments.elevation_ft && (
                  <div className="text-center">
                    <div className="font-bold text-gray-300 text-sm sm:text-sm">Elevation</div>
                    <div className="text-white font-bold text-base sm:text-base">{enrichments.elevation_ft} ft</div>
                  </div>
                )}
                {enrichments.open_meteo_weather_description && (
                  <div className="text-center">
                    <div className="font-bold text-gray-300 text-sm sm:text-sm">Weather</div>
                    <div className="text-white font-bold text-sm sm:text-sm">{enrichments.open_meteo_weather_description}</div>
                  </div>
                )}
                {enrichments.open_meteo_weather_summary && (
                  <div className="text-center">
                    <div className="font-bold text-gray-300 text-sm sm:text-sm">Weather Summary</div>
                    <div className="text-white font-bold text-sm sm:text-sm">{enrichments.open_meteo_weather_summary}</div>
                  </div>
                )}
                {enrichments.nws_alerts_summary && (
                  <div className="text-center">
                    <div className="font-bold text-gray-300 text-sm sm:text-sm">Alerts</div>
                    <div className="text-white font-bold text-sm sm:text-sm">{enrichments.nws_alerts_summary}</div>
                  </div>
                )}
                {enrichments.acs_population && (
                  <div className="text-center">
                    <div className="font-bold text-gray-300 text-sm sm:text-sm">Population</div>
                    <div className="text-white font-bold text-base sm:text-base">{enrichments.acs_population.toLocaleString()}</div>
                  </div>
                )}
                {enrichments.acs_name && (
                  <div className="text-center col-span-2">
                    <div className="font-bold text-gray-300 text-sm sm:text-sm">Area</div>
                    <div className="text-white font-bold text-sm sm:text-sm">{enrichments.acs_name}</div>
                  </div>
                )}
                {enrichments.terrain_slope && (
                  <div className="text-center">
                    <div className="font-bold text-gray-300 text-sm sm:text-sm">Slope</div>
                    <div className="text-white font-bold text-base sm:text-base">{enrichments.terrain_slope}°</div>
                  </div>
                )}
                {enrichments.terrain_slope_direction && (
                  <div className="text-center">
                    <div className="font-bold text-gray-300 text-sm sm:text-sm">Aspect</div>
                    <div className="text-white font-bold text-base sm:text-base">{enrichments.terrain_slope_direction}</div>
                  </div>
                )}
                {enrichments.open_meteo_weather_timezone_abbreviation && (
                  <div className="text-center">
                    <div className="font-bold text-gray-300 text-sm sm:text-sm">Timezone</div>
                    <div className="text-white font-bold text-base sm:text-base">{enrichments.open_meteo_weather_timezone_abbreviation}</div>
                  </div>
                )}
                {enrichments.walkability_index && (
                  <div className="text-center">
                    <div className="font-bold text-gray-300 text-sm sm:text-sm">Walkability Index</div>
                    <div className="text-white font-bold text-base sm:text-base">{Number(enrichments.walkability_index).toFixed(2)}</div>
                  </div>
                )}
                {enrichments.walkability_category && (
                  <div className="text-center">
                    <div className="font-bold text-gray-300 text-sm sm:text-sm">Walkability Category</div>
                    <div className="text-white font-bold text-sm sm:text-sm">{enrichments.walkability_category}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Enrichment Data */}
        {sortedCategories.map(([category, items]) => (
          <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-200 mobile-card">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-xl mobile-card-header">
              <h2 className="text-lg font-bold text-white">{category}</h2>
            </div>
            
            <div className="space-y-3 mobile-card-body">
              {items.map(({ key, value }) => (
                <div key={key} className="border-b border-gray-100 last:border-b-0 pb-3 sm:pb-4 last:pb-0">
                  <div className="flex flex-col space-y-2">
                    <label className="text-base sm:text-base font-bold text-gray-700 capitalize break-words">
                      {formatFieldName(key)}
                    </label>
                    <div className="text-gray-900 bg-gray-50 p-2 sm:p-3 rounded-lg text-lg sm:text-lg font-bold break-words overflow-hidden">
                      {formatValue(value, key)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Bottom Action Buttons */}
        <div className="flex flex-col gap-3 pb-8 mobile-buttons">
          <button
            onClick={onBackToSearch}
            className="flex-1 bg-gray-600 text-white py-3 sm:py-4 rounded-xl font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Back to Search</span>
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={onViewMap}
              className="flex-1 bg-blue-600 text-white py-3 sm:py-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <Map className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>View Map</span>
            </button>
            
            <button
              onClick={onDownloadCSV}
              className="flex-1 bg-green-600 text-white py-3 sm:py-4 rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileResultsView;
