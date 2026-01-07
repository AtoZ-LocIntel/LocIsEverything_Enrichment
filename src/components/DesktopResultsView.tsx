import React from 'react';
import { MapPin, Download, ArrowLeft } from 'lucide-react';
import { EnrichmentResult } from '../App';

interface DesktopResultsViewProps {
  results: EnrichmentResult[];
  selectedEnrichments: string[];
  onViewMap: () => void;
  onBackToSearch: () => void;
  onDownloadCSV: () => void;
}

const DesktopResultsView: React.FC<DesktopResultsViewProps> = ({
  results,
  selectedEnrichments,
  onViewMap,
  onBackToSearch,
  onDownloadCSV
}) => {
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
        .replace(/^ca_/g, 'CA ')
        .replace(/nws/g, 'NWS')
        .replace(/fws/g, 'FWS')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
        .replace(/\bDe\b/g, 'DE')
        .replace(/\bCa\b/g, 'CA');
    }
    
    return key
      .replace(/^poi_/g, 'POI ')
      .replace(/^at_/g, 'AT ')
      .replace(/^pct_/g, 'PCT ')
      .replace(/^de_/g, 'DE ')
      .replace(/^ca_/g, 'CA ')
      .replace(/nws/g, 'NWS')
      .replace(/fws/g, 'FWS')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace(/\bDe\b/g, 'DE')
      .replace(/\bCa\b/g, 'CA');
  };

  const formatValue = (value: any, key: string): string | null => {
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
      
      // For detailed POI data, show count only in form view
      if (key.includes('_all_pois') || key.includes('_detailed') || key.includes('_elements') || key.includes('_features') || key.includes('nh_key_destinations_all') || key.includes('nh_nursing_homes_all') || key.includes('nh_ems_all') || key.includes('nh_fire_stations_all') || key.includes('nh_places_of_worship_all') || key.includes('nh_hospitals_all') || key.includes('nh_public_waters_access_all') || key.includes('nh_law_enforcement_all') || key.includes('nh_recreation_trails_all') || key.includes('nh_dot_roads_all') || key.includes('nh_railroads_all') || key.includes('nh_transmission_pipelines_all') || key.includes('nh_cell_towers_all') || key.includes('nh_underground_storage_tanks_all') || key.includes('nh_water_wells_all') || key.includes('nh_public_water_supply_wells_all') || key.includes('nh_remediation_sites_all') || key.includes('nh_automobile_salvage_yards_all') || key.includes('nh_solid_waste_facilities_all') || key.includes('nh_nwi_plus_all') || key.includes('ma_dep_wetlands_all') || key.includes('ma_open_space_all') || key.includes('cape_cod_zoning_all') || key.includes('ma_trails_all') || key.includes('ma_nhesp_natural_communities_all') || key.includes('ct_roads_all') || key.includes('ct_building_footprints_all')) {
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
      
      // Special handling for USVI Fire Stations - show count only
      if (key.includes('usvi_fire_stations_all')) {
        return `${value.length} fire stations found (see CSV for details)`;
      }
      
      // Special handling for USVI Police Stations - show count only
      if (key.includes('usvi_police_stations_all')) {
        return null; // Skip the _all array (handled separately)
      }
      
      // Special handling for USVI Health Care Facilities - show count only
      if (key.includes('usvi_health_care_facilities_all')) {
        return null; // Skip the _all array (handled separately)
      }
      
      // Special handling for Guam Villages - show count only
      if (key.includes('guam_villages_all')) {
        return null; // Skip the _all array (handled separately)
      }
      
      // Special handling for Guam State Boundary - show count only
      if (key.includes('guam_state_boundary_all')) {
        return null; // Skip the _all array (handled separately)
      }
      
      // Special handling for TX School Districts 2024 - show count only
      if (key.includes('tx_school_districts_2024_all')) {
        return null; // Skip the _all array (handled separately)
      }
      
      // Special handling for Puerto Rico Hydrology - show count only
      if (key.includes('pr_hydrology_all')) {
        return null; // Skip the _all array (handled separately)
      }
      
      if (key.includes('sc_trout_streams_all')) {
        return null; // Skip the _all array (handled separately)
      }
      
      if (key.includes('sc_scenic_rivers_all')) {
        return null; // Skip the _all array (handled separately)
      }
      
      if (key.includes('sc_game_zones_all')) {
        return null; // Skip the _all array (handled separately)
      }
      
      if (key.includes('sc_coastal_ponds_all')) {
        return null; // Skip the _all array (handled separately)
      }
      
      if (key.includes('sc_lakes_reservoirs_all')) {
        return null; // Skip the _all array (handled separately)
      }
      
      if (key.includes('sc_coastal_well_inventory_all')) {
        return null; // Skip the _all array (handled separately)
      }
      
      if (key.includes('orlando_christmas_lights_all')) {
        return null; // Skip the _all array (handled separately)
      }
      
      if (key.includes('us_drilling_platforms_all')) {
        return null; // Skip the _all array (handled separately)
      }
      
      // Special handling for WRI Aqueduct Water Risk layers - show count only
      if (key.includes('wri_aqueduct_water_risk_future_annual_all') || 
          key.includes('wri_aqueduct_water_risk_baseline_annual_all') || 
          key.includes('wri_aqueduct_water_risk_baseline_monthly_all') ||
          (key.startsWith('acs_') && key.endsWith('_all'))) {
        return null; // Skip the _all array (handled separately)
      }
      
      // Regular array handling for non-POI data
      return value.map((item: any) => {
        if (typeof item === 'object' && item !== null) {
          // Filter out geometry properties from objects in arrays
          const filteredItem = { ...item };
          delete (filteredItem as any).geometry;
          delete (filteredItem as any).__geometry;
          return item.name || item.title || JSON.stringify(filteredItem);
        }
        return String(item);
      }).join('; ');
    }
    
    // Handle objects
    if (typeof value === 'object') {
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
    
    return String(value);
  };

  const groupEnrichments = (enrichments: Record<string, any>) => {
    const grouped = Object.entries(enrichments).reduce((acc, [key, value]) => {
      // Skip POI "All" fields completely - they should not appear in the form
      // This includes any field that contains detailed POI data
      // BUT allow count fields (e.g., ca_fire_perimeters_all_count) to be displayed
      // NOTE: Check for _all as a separate token (not substring like in "halls")
      // Use regex to match _all as complete token: _all followed by _ or end of string
      const hasAllToken = /_all(_|$)/.test(key) || key.endsWith('_all');
      if ((key.includes('_all_pois') || 
          key.includes('_detailed') || 
          key.includes('_elements') ||
          key.includes('_features') ||
          key.endsWith('_all') ||
          key.endsWith(' All') ||
          (hasAllToken && !key.endsWith('_count') && !key.endsWith('_summary')) ||
          (key.includes('poi_') && hasAllToken) ||
          // Catch specific patterns like "Poi Cafes Coffee All" and "Poi Banks All"
          (key.toLowerCase().includes('poi') && /[^a-z]all[^a-z]|all$/.test(key.toLowerCase())) ||
          // Catch any field that ends with "All" regardless of case
          key.toLowerCase().endsWith('all')) && !key.endsWith('_count') && !key.endsWith('_summary')) {
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
        // DC Bike Trails layers - check before DC Urban Tree Canopy to avoid conflicts
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
        
        // NOAA fields - only show if NOAA enrichment is selected
        if (key.startsWith('noaa_') && selected.startsWith('noaa_')) {
          // Match NOAA enrichment IDs to their count/summary fields
          // e.g., 'noaa_weather_radar_impact_zones' matches 'noaa_weather_radar_impact_zones_count'
          return key.includes(selected);
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
        
        // USGS Government Units fields - handle usgs_gov_ prefix in field keys
        if (key.includes('usgs_gov_')) {
          return selectedEnrichments.some(selected => {
            if (selected.includes('usgs_gov_')) {
              // Extract the unit type from selected (e.g., 'usgs_gov_incorporated_place' -> 'incorporated_place')
              const unitType = selected.replace('usgs_gov_', '');
              // Field keys have the same prefix, so check if key includes the unit type
              return key.includes(`usgs_gov_${unitType}`);
            }
            return false;
          });
        }
        
        // USGS Transportation fields - handle usgs_transportation_ prefix in field keys
        if (key.includes('usgs_transportation_')) {
          return selectedEnrichments.some(selected => {
            if (selected.includes('usgs_transportation_')) {
              // Extract the layer type from selected (e.g., 'usgs_transportation_airport' -> 'airport')
              const layerType = selected.replace('usgs_transportation_', '');
              // Field keys have the same prefix, so check if key includes the layer type
              return key.includes(`usgs_transportation_${layerType}`);
            }
            return false;
          });
        }
        
        // USGS GeoNames fields - handle usgs_geonames_ prefix in field keys
        if (key.includes('usgs_geonames_')) {
          return selectedEnrichments.some(selected => {
            if (selected.includes('usgs_geonames_')) {
              // Extract the layer type from selected (e.g., 'usgs_geonames_administrative' -> 'administrative')
              const layerType = selected.replace('usgs_geonames_', '');
              // Field keys have the same prefix, so check if key includes the layer type
              return key.includes(`usgs_geonames_${layerType}`);
            }
            return false;
          });
        }
        
        // USGS Selectable Polygons fields - handle usgs_selectable_polygons_ prefix in field keys
        if (key.includes('usgs_selectable_polygons_')) {
          return selectedEnrichments.some(selected => {
            if (selected.includes('usgs_selectable_polygons_')) {
              // Extract the layer type from selected (e.g., 'usgs_selectable_polygons_congressional_district' -> 'congressional_district')
              const layerType = selected.replace('usgs_selectable_polygons_', '');
              // Field keys have the same prefix, so check if key includes the layer type
              return key.includes(`usgs_selectable_polygons_${layerType}`);
            }
            return false;
          });
        }
        
        // TNM Structures fields
        if (key.includes('tnm_structures')) {
          return selectedEnrichments.includes('tnm_structures');
        }
        
        // NH House District fields - only show if NH House District enrichment is selected
        if (key.includes('nh_house_district')) {
          return selectedEnrichments.includes('nh_house_districts_2022');
        }
        
        // NH Voting Ward fields - only show if NH Voting Ward enrichment is selected
        if (key.includes('nh_voting_ward')) {
          return selectedEnrichments.includes('nh_voting_wards');
        }
        
        // NH Senate District fields - only show if NH Senate District enrichment is selected
        if (key.includes('nh_senate_district')) {
          return selectedEnrichments.includes('nh_senate_districts_2022');
        }
        
        // NH SSURGO fields - only show if NH SSURGO enrichment is selected
        if (key.includes('nh_ssurgo') && key !== 'nh_ssurgo_all') {
          return selectedEnrichments.includes('nh_ssurgo');
        }
        
        // NH Bedrock Geology fields - only show if NH Bedrock Geology enrichment is selected
        if (key.includes('nh_bedrock_geology') && key !== 'nh_bedrock_geology_all') {
          return selectedEnrichments.includes('nh_bedrock_geology');
        }
        
        // NH Geographic Names fields - only show if NH Geographic Names enrichment is selected
        if (key.includes('nh_geographic_names') && key !== 'nh_geographic_names_all') {
          return selectedEnrichments.includes('nh_geographic_names');
        }
        
        // NH Parcels fields - only show if NH Parcels enrichment is selected
        // Skip the _all array (handled separately in display)
        if (key.includes('nh_parcel') && key !== 'nh_parcels_all') {
          return selectedEnrichments.includes('nh_parcels');
        }
        
        // MA Parcels fields - only show if MA Parcels enrichment is selected
        // Skip the _all array (handled separately in display)
        if (key.includes('ma_parcel') && key !== 'ma_parcels_all') {
          return selectedEnrichments.includes('ma_parcels');
        }
        
        // CT Building Footprints fields - only show if CT Building Footprints enrichment is selected
        // Skip the _all array (handled separately in display)
        if (key.includes('ct_building_footprint') && key !== 'ct_building_footprints_all') {
          return selectedEnrichments.includes('ct_building_footprints');
        }
        
        // CT Roads fields - only show if CT Roads enrichment is selected
        // Skip the _all array (handled separately in display)
        if (key.includes('ct_road') && key !== 'ct_roads_all') {
          return selectedEnrichments.includes('ct_roads');
        }
        
        // CT DEEP Properties fields - only show if CT DEEP Properties enrichment is selected
        // Skip the _all array (handled separately in display)
        if (key.includes('ct_deep_propert') && key !== 'ct_deep_properties_all') {
          return selectedEnrichments.includes('ct_deep_properties');
        }
        
        // CT Tribal Lands fields - only show if CT Tribal Lands enrichment is selected
        // Skip the _all array (handled separately in display)
        if (key.includes('ct_tribal_lands') && key !== 'ct_tribal_lands_all') {
          return selectedEnrichments.includes('ct_tribal_lands');
        }
        
        // CT Drinking Water Watersheds fields - only show if CT Drinking Water Watersheds enrichment is selected
        // Skip the _all array (handled separately in display)
        if (key.includes('ct_drinking_water_watersheds') && key !== 'ct_drinking_water_watersheds_all') {
          return selectedEnrichments.includes('ct_drinking_water_watersheds');
        }
        
        // NH Key Destinations fields - only show if NH Key Destinations enrichment is selected
        // Skip the _all array (handled separately in display)
        if (key.includes('nh_key_destinations') && key !== 'nh_key_destinations_all') {
          return selectedEnrichments.includes('nh_key_destinations');
        }
        
        // NH Nursing Homes fields - only show if NH Nursing Homes enrichment is selected
        // Skip the _all array (handled separately in display)
        if (key.includes('nh_nursing_homes') && key !== 'nh_nursing_homes_all') {
          return selectedEnrichments.includes('nh_nursing_homes');
        }
        
        // NH EMS fields - only show if NH EMS enrichment is selected
        // Skip the _all array (handled separately in display)
        if (key.includes('nh_ems') && key !== 'nh_ems_all') {
          return selectedEnrichments.includes('nh_ems');
        }
        
        // NH Fire Stations fields - only show if NH Fire Stations enrichment is selected
        // Skip the _all array (handled separately in display)
        if (key.includes('nh_fire_stations') && key !== 'nh_fire_stations_all') {
          return selectedEnrichments.includes('nh_fire_stations');
        }
        
        // NH Places of Worship fields - only show if NH Places of Worship enrichment is selected
        // Skip the _all array (handled separately in display)
        if (key.includes('nh_places_of_worship') && key !== 'nh_places_of_worship_all') {
          return selectedEnrichments.includes('nh_places_of_worship');
        }
        
        // NH Hospitals fields - only show if NH Hospitals enrichment is selected
        // Skip the _all array (handled separately in display)
        if (key.includes('nh_hospitals') && key !== 'nh_hospitals_all') {
          return selectedEnrichments.includes('nh_hospitals');
        }
        
        // NH Access Sites to Public Waters fields - only show if NH Access Sites to Public Waters enrichment is selected
        // Skip the _all array (handled separately in display)
        if (key.includes('nh_public_waters_access') && key !== 'nh_public_waters_access_all') {
          return selectedEnrichments.includes('nh_public_waters_access');
        }
        
        // NH Law Enforcement fields - only show if NH Law Enforcement enrichment is selected
        // Skip the _all array (handled separately in display)
        if (key.includes('nh_law_enforcement') && key !== 'nh_law_enforcement_all') {
          return selectedEnrichments.includes('nh_law_enforcement');
        }
        
        // NH Recreation Trails fields - only show if NH Recreation Trails enrichment is selected
        // Skip the _all array (handled separately in display)
        if (key.includes('nh_recreation_trails') && key !== 'nh_recreation_trails_all') {
          return selectedEnrichments.includes('nh_recreation_trails');
        }
        
        // NH DOT Roads fields - only show if NH DOT Roads enrichment is selected
        // Skip the _all array (handled separately in display)
        if (key.includes('nh_dot_roads') && key !== 'nh_dot_roads_all') {
          return selectedEnrichments.includes('nh_dot_roads');
        }
        
        // NH Railroads fields - only show if NH Railroads enrichment is selected
        // Skip the _all array (handled separately in display)
        if (key.includes('nh_railroads') && key !== 'nh_railroads_all') {
          return selectedEnrichments.includes('nh_railroads');
        }
        
        // NH Transmission/Pipelines fields - only show if NH Transmission/Pipelines enrichment is selected
        // Skip the _all array (handled separately in display)
        if (key.includes('nh_transmission_pipelines') && key !== 'nh_transmission_pipelines_all') {
          return selectedEnrichments.includes('nh_transmission_pipelines');
        }
        
        // NH Cell Towers fields - only show if NH Cell Towers enrichment is selected
        // Skip the _all array (handled separately in display)
        if (key.includes('nh_cell_towers') && key !== 'nh_cell_towers_all') {
          return selectedEnrichments.includes('nh_cell_towers');
        }
        
        // NH Underground Storage Tank Sites fields - only show if NH Underground Storage Tank Sites enrichment is selected
        // Skip the _all array (handled separately in display)
        if (key.includes('nh_underground_storage_tanks') && key !== 'nh_underground_storage_tanks_all') {
          return selectedEnrichments.includes('nh_underground_storage_tanks');
        }
        
        // NH Water Well Inventory fields - only show if NH Water Well Inventory enrichment is selected
        // Skip the _all array (handled separately in display)
        if (key.includes('nh_water_wells') && key !== 'nh_water_wells_all') {
          return selectedEnrichments.includes('nh_water_wells');
        }
        
        // NH Public Water Supply Wells fields - only show if NH Public Water Supply Wells enrichment is selected
        // Skip the _all array (handled separately in display)
        if (key.includes('nh_public_water_supply_wells') && key !== 'nh_public_water_supply_wells_all') {
          return selectedEnrichments.includes('nh_public_water_supply_wells');
        }
        
        // NH Remediation Sites fields - only show if NH Remediation Sites enrichment is selected
        // Skip the _all array (handled separately in display)
        if (key.includes('nh_remediation_sites') && key !== 'nh_remediation_sites_all') {
          return selectedEnrichments.includes('nh_remediation_sites');
        }
        
        // NH Automobile Salvage Yards fields - only show if NH Automobile Salvage Yards enrichment is selected
        // Skip the _all array (handled separately in display)
        if (key.includes('nh_automobile_salvage_yards') && key !== 'nh_automobile_salvage_yards_all') {
          return selectedEnrichments.includes('nh_automobile_salvage_yards');
        }
        
        // NH Solid Waste Facilities fields - only show if NH Solid Waste Facilities enrichment is selected
        // Skip the _all array (handled separately in display)
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
        
        // CA Power Outage Areas fields - only show if CA Power Outage Areas enrichment is selected
        // Skip the _all array (handled separately in display)
        if (key.includes('ca_power_outage_areas') && key !== 'ca_power_outage_areas_all') {
          return selectedEnrichments.includes('ca_power_outage_areas');
        }
        
        // CA Fire Perimeters (All) fields - only show if CA Fire Perimeters (All) enrichment is selected
        // Skip the _all array (handled separately in display)
        if (key.includes('ca_fire_perimeters_all') && key !== 'ca_fire_perimeters_all_all') {
          return selectedEnrichments.includes('ca_fire_perimeters_all');
        }
        
        // CA Recent Large Fire Perimeters fields - only show if CA Recent Large Fire Perimeters enrichment is selected
        // Skip the _all array (handled separately in display)
        if (key.includes('ca_fire_perimeters_recent_large') && key !== 'ca_fire_perimeters_recent_large_all') {
          return selectedEnrichments.includes('ca_fire_perimeters_recent_large');
        }
        
        // CA Fire Perimeters (1950+) fields - only show if CA Fire Perimeters (1950+) enrichment is selected
        // Skip the _all array (handled separately in display)
        if (key.includes('ca_fire_perimeters_1950') && key !== 'ca_fire_perimeters_1950_all') {
          return selectedEnrichments.includes('ca_fire_perimeters_1950');
        }
        
        // CA Land Ownership fields - only show if CA Land Ownership enrichment is selected
        // Skip the _all array (handled separately in display)
        if (key.includes('ca_land_ownership') && key !== 'ca_land_ownership_all') {
          return selectedEnrichments.includes('ca_land_ownership');
        }
        
        // CA Wildland Fire Direct Protection Areas fields - only show if CA Wildland Fire Direct Protection Areas enrichment is selected
        // Skip the _all array (handled separately in display)
        if (key.includes('ca_wildland_fire_direct_protection') && key !== 'ca_wildland_fire_direct_protection_all') {
          return selectedEnrichments.includes('ca_wildland_fire_direct_protection');
        }
        
        // CA State Parks Entry Points fields - only show if CA State Parks Entry Points enrichment is selected
        // Skip the _all array (handled separately in display)
        if (key.includes('ca_state_parks_entry_points') && key !== 'ca_state_parks_entry_points_all') {
          return selectedEnrichments.includes('ca_state_parks_entry_points');
        }
        
        // CA State Parks Parking Lots fields - only show if CA State Parks Parking Lots enrichment is selected
        // Skip the _all array (handled separately in display)
        if (key.includes('ca_state_parks_parking_lots') && key !== 'ca_state_parks_parking_lots_all') {
          return selectedEnrichments.includes('ca_state_parks_parking_lots');
        }
        
        // CA State Parks Boundaries fields - only show if CA State Parks Boundaries enrichment is selected
        // Skip the _all array (handled separately in display)
        if (key.includes('ca_state_parks_boundaries') && key !== 'ca_state_parks_boundaries_all') {
          return selectedEnrichments.includes('ca_state_parks_boundaries');
        }
        
        // CA State Parks Campgrounds fields - only show if CA State Parks Campgrounds enrichment is selected
        // Skip the _all array (handled separately in display)
        if (key.includes('ca_state_parks_campgrounds') && key !== 'ca_state_parks_campgrounds_all') {
          return selectedEnrichments.includes('ca_state_parks_campgrounds');
        }
        if (key.includes('ca_condor_range') && key !== 'ca_condor_range_all') {
          return selectedEnrichments.includes('ca_condor_range');
        }
        if (key.includes('ca_black_bear_range') && key !== 'ca_black_bear_range_all') {
          return selectedEnrichments.includes('ca_black_bear_range');
        }
        if (key.includes('ca_brush_rabbit_range') && key !== 'ca_brush_rabbit_range_all') {
          return selectedEnrichments.includes('ca_brush_rabbit_range');
        }
        if (key.includes('ca_great_gray_owl_range') && key !== 'ca_great_gray_owl_range_all') {
          return selectedEnrichments.includes('ca_great_gray_owl_range');
        }
        if (key.includes('ca_sandhill_crane_range') && key !== 'ca_sandhill_crane_range_all') {
          return selectedEnrichments.includes('ca_sandhill_crane_range');
        }
        if (key.includes('ca_highway_rest_areas') && key !== 'ca_highway_rest_areas_all') {
          return selectedEnrichments.includes('ca_highway_rest_areas');
        }
        if (key.includes('ca_calvtp_treatment_areas') && key !== 'ca_calvtp_treatment_areas_all') {
          return selectedEnrichments.includes('ca_calvtp_treatment_areas');
        }
        
        return false;
      });
      
      if (!isCoreField && !isSelectedEnrichment) {
        return acc;
      }
      
      let category = 'Other';
      
      // American Community Survey (ACS) layers should always be categorized as American Community Survey
      // (must check before other checks to prevent matching "census" or "ct_" patterns)
      if (key.startsWith('acs_') || key.includes('_acs_')) {
        category = 'American Community Survey';
      } else if (key.includes('nri_') && key.includes('annualized_frequency')) {
        // National Risk Index (NRI) annualized frequency layers should always be categorized as Natural Hazards
        // (tract keys contain "census" which would otherwise match Demographics & Census)
        category = 'Natural Hazards';
      } else if (key.includes('fema_nfhl_') || key.includes('national_seismic_hazard') || key.includes('tornado_tracks') || key.includes('poi_animal_vehicle_collisions') || key.includes('hurricane_evacuation_routes_hazards')) {
        // Natural Hazards layers - check before other categories (including all FEMA NFHL layers)
        category = 'Natural Hazards';
      } else if (key.includes('elev') || key.includes('elevation')) {
        category = 'Elevation & Terrain';
      } else if (key.includes('airq') || key.includes('air_quality')) {
        category = 'Air Quality';
      } else if (key.includes('tiger_')) {
        category = 'TIGER Data';
      } else if (key.includes('usgs_transportation_') || key.includes('usgs_geonames_') || key.includes('usgs_selectable_polygons_') || key.includes('usgs_wbd_') || key.includes('usgs_contours_') || key.includes('us_national_grid_') || key.includes('us_historical_cultural_political_points') || key.includes('us_historical_hydrographic_points') || key.includes('us_historical_physical_points') || (key.includes('hurricane_evacuation_routes') && !key.includes('hurricane_evacuation_routes_hazards')) || key.includes('usgs_gov_') || key.includes('tnm_structures') || key.includes('usgs_trails')) {
        category = 'USGS National Map';
      } else if (key.startsWith('dc_utc_') || key.startsWith('dc_urban_tree_canopy_') || key === 'dc_trees' || key === 'dc_ufa_street_trees' || key === 'dc_arborists_zone' || key.startsWith('dc_bike_') || key.startsWith('dc_property_')) {
        category = 'District of Columbia';
      } else if (key.includes('fema_nfhl_') || key.includes('hurricane_evacuation_routes_hazards') || key.includes('national_seismic_hazard') || key.includes('tornado_tracks') || key.includes('poi_animal_vehicle_collisions')) {
        // Natural Hazards layers - check before other categories to ensure proper categorization (including all FEMA NFHL layers)
        category = 'Natural Hazards';
      } else if (key.includes('ireland_provinces') || key.includes('ireland_built_up_areas') || key.includes('ireland_small_areas') || key.includes('ireland_electoral_divisions') || key.includes('ireland_centres_of_population')) {
        category = 'Ireland Data';
      } else if (key.includes('fips') || key.includes('census') || key.includes('demographic')) {
        category = 'Demographics & Census';
      } else if (key.includes('fws_') || key.includes('usfws_') || key.includes('american_eel_current_range') || key.includes('bighorn_sheep_captures_releases') || key.includes('chinook_salmon_ranges') || key.includes('national_aquatic_barrier_dams') || key.includes('national_marine_sanctuaries')) {
        category = 'Fish and Wildlife';
      } else if (key.includes('poi_epa_') || key.startsWith('tri_')) {
        // Ensure EPA/Toxic Release fields don't get captured by the generic POI count bucket
        category = 'Human Caused Hazards';
      } else if (key.startsWith('noaa_') || key.includes('noaa_critical_fisheries_habitat') || key.includes('noaa_water_temp_') || key.includes('noaa_west_coast_efh') || key.includes('noaa_esa_species_ranges') || key.includes('noaa_nmfs_critical_habitat') || key.includes('noaa_weather_radar') || key.includes('noaa_ocean_temp')) {
        // NOAA layers - check BEFORE Weather & Climate to avoid false matches (e.g., noaa_weather_radar_impact_zones)
        category = 'NOAA';
      } else if (key.startsWith('nws_')) {
        category = 'Watching the Weather';
      } else if (key.includes('weather') || key.includes('climate')) {
        category = 'Weather & Climate';
      } else if (key.includes('hospital') || key.includes('healthcare')) {
        category = 'Healthcare';
      } else if (key.includes('crime') || key.includes('safety')) {
        category = 'Safety & Crime';
      } else if (key.includes('scotland_transport_gritter') || key.includes('scotland_transport_trunk_road_height')) {
        category = 'Scotland Transport';
      } else if (key.includes('poi_gas_stations') || key.includes('transport') || key.includes('transit') || (key.includes('poi_') && (key.includes('bus') || key.includes('train') || key.includes('subway') || key.includes('metro') || key.includes('tram') || key.includes('monorail') || key.includes('aerialway') || key.includes('ferry') || key.includes('airport') || key.includes('taxi') || key.includes('bike') || key.includes('parking') || key.includes('charging')))) {
        category = 'Transportation';
      } else if (key.includes('fema_nfhl_') || key.includes('wildfire') || (key.includes('usda_') && !key.includes('poi_usda_')) || key.includes('poi_fema_flood_zones') || key.includes('poi_wetlands') || key.includes('poi_earthquakes') || key.includes('poi_volcanoes') || key.includes('poi_flood_reference_points') || key.includes('poi_animal_vehicle_collisions') || (key.includes('poi_') && key.includes('count') && key.includes('wildfire')) || key.includes('national_seismic_hazard') || key.includes('tornado_tracks') || key.includes('hurricane_evacuation_routes_hazards')) {
        category = 'Natural Hazards';
      } else if (key.includes('poi_epa_')) {
        category = 'Human Caused Hazards';
      } else if (key.includes('blm_') || key.includes('padus_') || key.includes('usfs_') || key.includes('nps_') || (key.includes('poi_') && (key.includes('national_park') || key.includes('state_park') || key.includes('wildlife') || key.includes('trailhead') || key.includes('picnic') || key.includes('visitor_center') || key.includes('ranger_station')))) {
        category = 'Public Lands & Protected Areas';
      } else if (key.startsWith('at_') || (key.includes('at_') && !key.includes('blm_'))) {
        category = 'Appalachian Trail';
      } else if (key.startsWith('pct_') || (key.includes('pct_') && !key.includes('blm_'))) {
        category = 'Pacific Crest Trail';
      } else if (key.includes('poi_restaurants') || key.includes('poi_osm_fast_food') || key.includes('poi_osm_bars_pubs') || key.includes('poi_osm_bakeries') || key.includes('poi_osm_ice_cream_shops') || key.includes('poi_osm_farmers_markets') || key.includes('poi_osm_food_trucks') || key.includes('poi_grocery') || key.includes('poi_cafes') || key.includes('poi_markets') || key.includes('poi_usda_farmers_market') || key.includes('poi_usda_csa') || key.includes('poi_usda_agritourism') || key.includes('poi_usda_food_hub') || key.includes('poi_usda_onfarm_market')) {
        // Food & Beverage category (check before other POI categories)
        category = 'Food & Beverage';
      } else if (key.includes('poi_osm_banks') || key.includes('poi_osm_atms') || key.includes('poi_osm_credit_unions') || key.includes('poi_osm_financial_institutions')) {
        category = 'Banking & Finance';
      } else if (key.includes('poi_hospitals') || key.includes('poi_doctors_clinics') || key.includes('poi_dentists') || key.includes('poi_urgent_care') || key.includes('poi_pharmacies') || (key.includes('poi_') && (key.includes('gym') || key.includes('chiropractor') || key.includes('optometry') || key.includes('veterinary') || key.includes('hospital') || key.includes('urgent_care'))) || key.includes('poi_osm_health')) {
        category = 'Health & Wellness';
      } else if (key.includes('poi_police_stations') || key.includes('poi_fire_stations') || key.includes('poi_mail_shipping') || key.includes('poi_post_offices') || key.includes('poi_parcel_lockers') || key.includes('poi_osm_city_town_halls') || key.includes('poi_osm_courthouses') || key.includes('poi_osm_dmv_licensing') || key.includes('poi_osm_zoning_planning') || key.includes('poi_osm_public_works') || key.includes('poi_osm_social_services')) {
        category = 'Government & Public Services';
      } else if (key.includes('poi_parks') || key.includes('poi_tnm_trailheads') || key.includes('poi_tnm_trails') || key.includes('poi_mountain_biking') || key.includes('poi_boat_ramps') || key.includes('poi_golf_courses')) {
        category = 'Parks & Recreation';
      } else if (key.includes('poi_cinemas') || key.includes('poi_theatres') || key.includes('poi_museums_historic') || key.includes('poi_bars_nightlife')) {
        category = 'Arts & Entertainment';
      } else if (key.includes('poi_hotels')) {
        category = 'Travel & Accommodations';
      } else if (key.includes('poi_aurora_viewing_sites') || key.includes('poi_ebird_hotspots') || key.includes('ebird_recent_observations') || key.includes('poi_breweries') || key.includes('poi_wikipedia') || key.includes('orlando_christmas_lights') || key.includes('median_sea_ice_extent_antarctic') || key.includes('median_sea_ice_extent_arctic')) {
        // Quirky & Fun category - check before other POI categories
        category = 'Quirky & Fun';
      } else if (key.includes('poi_') && (key.includes('recreation') || key.includes('bowling') || key.includes('arcade') || key.includes('rv_park') || key.includes('campground'))) {
        category = 'Other';
      } else if (key.includes('poi_') && (key.includes('power') || key.includes('substation') || key.includes('grid') || key.includes('cell_tower'))) {
        category = 'Power & Infrastructure';
      } else if (key.includes('poi_') && (key.includes('beach') || key.includes('mountain') || key.includes('lake') || key.includes('water'))) {
        category = 'Natural Resources';
      } else if (key.includes('soil_') && (key.includes('carbon') || key.includes('organic'))) {
        category = 'Natural Resources';
      } else if (key.includes('national_marine_sanctuaries')) {
        category = 'Natural Resources';
      } else if (key.includes('nh_house_district') || key.includes('nh_voting_ward') || key.includes('nh_senate_district') || key.includes('nh_ssurgo') || key.includes('nh_bedrock_geology') || key.includes('nh_geographic_names') || key.includes('nh_parcel') || key.includes('nh_key_destinations') || key.includes('nh_nursing_homes') || key.includes('nh_ems') || key.includes('nh_fire_stations') || key.includes('nh_places_of_worship') || key.includes('nh_hospitals') || key.includes('nh_public_waters_access') || key.includes('nh_law_enforcement') || key.includes('nh_recreation_trails') || key.includes('nh_dot_roads') || key.includes('nh_railroads') || key.includes('nh_transmission_pipelines') || key.includes('nh_cell_towers') || key.includes('nh_underground_storage_tanks') || key.includes('nh_water_wells') || key.includes('nh_public_water_supply_wells') || key.includes('nh_remediation_sites') || key.includes('nh_automobile_salvage_yards') || key.includes('nh_solid_waste_facilities') || key.includes('nh_source_water_protection_area') || key.includes('nh_nwi_plus')) {
        category = 'New Hampshire Data';
      } else if (key.includes('boston_')) {
        category = 'Boston Open Data';
      } else if (key.includes('alaska_dnr_')) {
        category = 'Alaska DNR';
      } else if (key.includes('ma_dep_wetlands') || key.includes('ma_open_space') || key.includes('cape_cod_zoning') || key.includes('ma_trails') || key.includes('ma_nhesp_natural_communities') || key.includes('ma_lakes_and_ponds') || key.includes('ma_rivers_and_streams') || key.includes('ma_regional_planning_agencies') || key.includes('ma_acecs') || key.includes('ma_parcel')) {
        category = 'Massachusetts Data';
      } else if (key.includes('ca_fire_perimeters') || key.includes('ca_wildland_fire') || key.includes('ca_calvtp_treatment_areas') || key.includes('ca_power_outage_areas') || key.includes('ca_')) {
        category = 'California Data';
      } else if (key.includes('nyc_') || key.includes('ny_')) {
        category = 'NYC Data';
      } else if (key.includes('tx_school_districts_2024')) {
        category = 'Texas Education Agency';
      } else if (key.includes('wri_')) {
        category = 'World Resources Institute';
      } else if (key.includes('miami_')) {
        category = 'City of Miami';
      } else if (key.includes('houston_')) {
        category = 'Houston Data';
      } else if (key.includes('tx_')) {
        category = 'Texas Open Data';
      } else if (key.includes('chicago_') || key.includes('lake_county_')) {
        category = 'IL Open Data';
      } else if (key.includes('usvi_')) {
        category = 'USVI Open Data';
      } else if (key.includes('guam_')) {
        category = 'Guam Open Data';
      } else if (key.includes('pr_')) {
        category = 'Puerto Rico Open Data';
      } else if (key.includes('sc_')) {
        category = 'South Carolina Department of Natural Resources';
      } else if (key.includes('ct_parcel') || key.includes('ct_building_footprints') || key.includes('ct_road') || key.includes('ct_')) {
        category = 'Connecticut Data';
      } else if (key.includes('de_state_forest') || key.includes('de_pine_plantations') || key.includes('de_urban_tree_canopy') || key.includes('de_forest_cover_2007') || key.includes('de_')) {
        category = 'DE Data';
      } else if (key.includes('nj_parcel') || key.includes('nj_')) {
        category = 'NJ Data';
      } else if (key.startsWith('nj_')) {
        category = 'NJ Data';
      } else if (key.includes('poi_osm_libraries') || key.includes('poi_osm_prep_schools') || key.includes('poi_osm_middle_schools') || key.includes('poi_osm_high_schools') || (key.includes('poi_') && (key.includes('poi_osm_elementary') || key.includes('elementary') || key.includes('school') || key.includes('college') || key.includes('colleges_universities') || key.includes('poi_osm_daycares') || key.includes('daycares') || key.includes('preschools') || key.includes('poi_osm_vocational') || key.includes('vocational') || key.includes('poi_osm_tutoring') || key.includes('prep') || key.includes('middle') || key.includes('junior') || key.includes('high') || key.includes('secondary') || key.includes('technical') || key.includes('tutoring') || key.includes('library')))) {
        category = 'Education';
      } else if (key.includes('poi_worship') || key.includes('poi_community_centres') || key.includes('poi_community_centers')) {
        category = 'Religious & Community';
      } else if (key.includes('poi_osm_banks') || key.includes('poi_osm_atms') || key.includes('poi_osm_credit_unions') || key.includes('poi_osm_financial_institutions')) {
        category = 'Banking & Finance';
      }
      
      // Generic catch-all for POI counts that don't match any specific category
      // This must be AFTER all specific category checks above
      if (category === 'Other' && key.includes('poi_') && key.includes('count') && !key.includes('wildfire')) {
        category = 'Points of Interest Nearby';
      }

      if (!acc[category]) {
        acc[category] = [];
      }

      acc[category].push({ key, value });
      return acc;
    }, {} as Record<string, Array<{ key: string; value: any }>>);

    // Sort categories to prioritize those containing selected enrichments
    const sortedEntries = Object.entries(grouped).sort(([categoryA, itemsA], [categoryB, itemsB]) => {
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

    // Convert back to object with sorted order
    return Object.fromEntries(sortedEntries);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Action Buttons */}
      <div className="bg-white shadow-lg border-b border-gray-300 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={onBackToSearch}
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors font-semibold"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Search</span>
            </button>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={onViewMap}
                className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md"
              >
                <MapPin className="w-5 h-5" />
                <span>View in Map</span>
              </button>
              
              <button
                onClick={onDownloadCSV}
                className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-md"
              >
                <Download className="w-5 h-5" />
                <span>Download CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="space-y-8 mt-4">
          {results.map((result, index) => {
            const { location, enrichments } = result;
            const groupedEnrichments = groupEnrichments(enrichments);

            return (
              <div key={index} className="space-y-6">
                {/* Location Header */}
                <div className="bg-black rounded-xl shadow-sm border border-gray-200">
                  <div className="p-6">
                    <div className="flex items-center space-x-6">
                      {/* Logo */}
                      <div className="flex-shrink-0">
                        <img 
                          src="/assets/lociseverything.webp"
                          alt="The Location Is Everything Co Logo" 
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      </div>
                      {/* Location Info */}
                      <div className="flex-1 text-center">
                        <h1 className="text-2xl font-bold text-white mb-3">{location.name}</h1>
                        <div className="text-gray-300 space-y-1">
                          <p>Coordinates: {location.lat.toFixed(6)}, {location.lon.toFixed(6)}</p>
                          <p>Source: {location.source}</p>
                          <p>Confidence: {location.confidence}%</p>
                        </div>
                      </div>
                    </div>
                      
                      {/* Key Summary Values */}
                      <div className="mt-4 pt-4 border-t border-gray-600">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-base">
                          {enrichments.elevation_ft && (
                            <div className="text-center">
                              <div className="font-bold text-gray-300 text-sm">Elevation</div>
                              <div className="text-white font-bold text-lg">{enrichments.elevation_ft} ft</div>
                            </div>
                          )}
                          {enrichments.open_meteo_weather_description && (
                            <div className="text-center">
                              <div className="font-bold text-gray-300 text-sm">Weather</div>
                              <div className="text-white font-bold text-lg">{enrichments.open_meteo_weather_description}</div>
                            </div>
                          )}
                          {enrichments.open_meteo_weather_summary && (
                            <div className="text-center">
                              <div className="font-bold text-gray-300 text-sm">Weather Summary</div>
                              <div className="text-white font-bold text-lg">{enrichments.open_meteo_weather_summary}</div>
                            </div>
                          )}
                          {enrichments.nws_alerts_summary && (
                            <div className="text-center">
                              <div className="font-bold text-gray-300 text-sm">Alerts</div>
                              <div className="text-white font-bold text-lg">{enrichments.nws_alerts_summary}</div>
                            </div>
                          )}
                          {enrichments.acs_population && (
                            <div className="text-center">
                              <div className="font-bold text-gray-300 text-sm">Population</div>
                              <div className="text-white font-bold text-lg">{enrichments.acs_population.toLocaleString()}</div>
                            </div>
                          )}
                          {enrichments.acs_name && (
                            <div className="text-center">
                              <div className="font-bold text-gray-300 text-sm">Area</div>
                              <div className="text-white font-bold text-lg">{enrichments.acs_name}</div>
                            </div>
                          )}
                          {enrichments.terrain_slope && (
                            <div className="text-center">
                              <div className="font-bold text-gray-300 text-sm">Slope</div>
                              <div className="text-white font-bold text-lg">{enrichments.terrain_slope}°</div>
                            </div>
                          )}
                          {enrichments.terrain_slope_direction && (
                            <div className="text-center">
                              <div className="font-bold text-gray-300 text-sm">Aspect</div>
                              <div className="text-white font-bold text-lg">{enrichments.terrain_slope_direction}</div>
                            </div>
                          )}
                          {enrichments.open_meteo_weather_timezone_abbreviation && (
                            <div className="text-center">
                              <div className="font-bold text-gray-300 text-sm">Timezone</div>
                              <div className="text-white font-bold text-lg">{enrichments.open_meteo_weather_timezone_abbreviation}</div>
                            </div>
                          )}
                          {enrichments.walkability_index && (
                            <div className="text-center">
                              <div className="font-bold text-gray-300 text-sm">Walkability Index</div>
                              <div className="text-white font-bold text-lg">{Number(enrichments.walkability_index).toFixed(2)}</div>
                            </div>
                          )}
                          {enrichments.walkability_category && (
                            <div className="text-center">
                              <div className="font-bold text-gray-300 text-sm">Walkability Category</div>
                              <div className="text-white font-bold text-lg">{enrichments.walkability_category}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                {/* Enrichment Data */}
                {Object.entries(groupedEnrichments).map(([category, items]) => (
                  <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-xl">
                      <h2 className="text-xl font-bold text-white p-4">{category}</h2>
                    </div>
                    
                    <div className="p-6 space-y-4">
                      {items.map(({ key, value }) => (
                        <div key={key} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
                          <div className="flex flex-col space-y-2">
                            <label className="text-base font-bold text-gray-700 capitalize">
                              {formatFieldName(key)}
                            </label>
                            <div className="text-gray-900 bg-gray-50 p-3 rounded-lg text-base font-bold break-words">
                              {formatValue(value, key)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        
        {/* Bottom Action Buttons */}
        <div className="bg-white border-t border-gray-200 sticky bottom-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-center space-x-4">
              <button
                onClick={onBackToSearch}
                className="flex items-center space-x-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-semibold shadow-md"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Search</span>
              </button>
              
              <button
                onClick={onViewMap}
                className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md"
              >
                <MapPin className="w-5 h-5" />
                <span>View in Map</span>
              </button>
              
              <button
                onClick={onDownloadCSV}
                className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-md"
              >
                <Download className="w-5 h-5" />
                <span>Download CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesktopResultsView;
