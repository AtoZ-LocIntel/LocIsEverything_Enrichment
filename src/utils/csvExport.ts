// Shared CSV export utility for consistent CSV generation across all views
import { EnrichmentResult } from '../App';

/**
 * Filter out personal names from display text
 * Removes patterns like "Home of [Name]" or similar personal information
 */
function filterPersonalNames(text: string | null | undefined): string | null {
  if (!text || typeof text !== 'string') {
    return text || null;
  }
  
  // Remove patterns like "Home of [Name]" or "Home of [Name] & [Name]"
  const personalNamePatterns = [
    /^Home\s+of\s+[^,]+(?:,\s*[^,]+)*/i, // "Home of Name" or "Home of Name & Name"
    /^Home\s+of\s+[^&]+(?:\s*&\s*[^&]+)*/i, // "Home of Name & Name"
  ];
  
  let filtered = text;
  for (const pattern of personalNamePatterns) {
    filtered = filtered.replace(pattern, '').trim();
  }
  
  // If the entire text was just a personal name pattern, return null
  if (!filtered || filtered.length === 0) {
    return null;
  }
  
  return filtered;
}

export const exportEnrichmentResultsToCSV = (results: EnrichmentResult[]): void => {
  if (!results.length) return;

  console.log('📥 Starting shared CSV export for enrichment results...');
  console.log('📍 Results count:', results.length);

  // Create comprehensive CSV with all data
  const headers = ['Address', 'Latitude', 'Longitude', 'Source', 'Confidence', 'POI_Type', 'POI_Name', 'POI_Latitude', 'POI_Longitude', 'Distance_Miles', 'POI_Category', 'POI_Address', 'POI_Phone', 'POI_Website', 'POI_Source'];
  const allHeaders = headers;
  
  const rows: string[][] = [];
  
  // Track exported schools, businesses, routes, and traffic points across ALL results to prevent duplicates
  const exportedPrivateSchoolIds = new Set<string>();
  const exportedPublicSchoolIds = new Set<string>();
  const exportedBusinessIds = new Set<string>();
  const exportedRouteIds = new Set<string>();
  const exportedTrafficIds = new Set<string>();

  results.forEach(result => {
    console.log(`🔍 Processing result for ${result.location.name}`);
    
    // Add ALL enrichment data as rows (not just POIs)
    addAllEnrichmentDataRows(result, rows);
    
    // Add summary data rows (like FWS species counts, etc.)
    addSummaryDataRows(result, rows);
    
    // Add POI data rows
    addPOIDataRows(result, rows, exportedPrivateSchoolIds, exportedPublicSchoolIds, exportedBusinessIds, exportedRouteIds, exportedTrafficIds);
  });

  console.log(`📊 CSV will contain ${rows.length} rows with headers:`, allHeaders);

  const csvContent = [
    allHeaders.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Generate filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const cleanName = results[0].location.name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 50);
  const filename = `enrichment_${cleanName}_${timestamp}.csv`;
  
  console.log(`💾 Downloading CSV file: ${filename}`);
  
  try {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    console.log('✅ CSV download completed successfully');
  } catch (error) {
    console.error('❌ Error downloading CSV:', error);
    // Fallback: try to open in new window
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(csvContent);
      newWindow.document.close();
    }
  }
};

const addSummaryDataRows = (result: EnrichmentResult, rows: string[][]): void => {
  const { location, enrichments } = result;

  // Add FWS Species data
  if (enrichments.fws_species_count !== undefined) {
    rows.push([
      location.name,
      location.lat.toString(),
      location.lon.toString(),
      'FWS API',
      (location.confidence || 'N/A').toString(),
      'FWS_SPECIES',
      'FWS Species & Critical Habitat',
      location.lat.toString(),
      location.lon.toString(),
      (enrichments.fws_search_radius_miles || 5.0).toFixed(1),
      'Wildlife Assessment',
      `${enrichments.fws_species_count || 0} species found`,
      '',
      '',
      'FWS API'
    ]);
  }

  // Add USGS Earthquake data - individual earthquakes
  if (enrichments.poi_earthquakes_all && Array.isArray(enrichments.poi_earthquakes_all)) {
    enrichments.poi_earthquakes_all.forEach((eq: any) => {
      rows.push([
        location.name,
        location.lat.toString(),
        location.lon.toString(),
        'USGS',
        (location.confidence || 'N/A').toString(),
        'USGS_EARTHQUAKES',
        'Historical Earthquakes',
        (eq.lat || '').toString(),
        (eq.lon || '').toString(),
        (eq.distance_miles || 0).toFixed(2),
        'Seismic Assessment',
        `Magnitude: ${eq.magnitude || 'N/A'}`,
        eq.place || 'Unknown location',
        eq.dateFormatted || eq.date || '',
        'USGS',
        `Depth: ${eq.depth || 'N/A'} km`,
        eq.url || '',
        eq.type || '',
        eq.magType || ''
      ]);
    });
  } else if (enrichments.poi_earthquakes_count !== undefined) {
    // Fallback to summary row if no individual earthquakes
    rows.push([
      location.name,
      location.lat.toString(),
      location.lon.toString(),
      'USGS',
      (location.confidence || 'N/A').toString(),
      'USGS_EARTHQUAKES',
      'Historical Earthquakes',
      location.lat.toString(),
      location.lon.toString(),
      (enrichments.poi_earthquakes_proximity_distance || 25.0).toFixed(1),
      'Seismic Assessment',
      `${enrichments.poi_earthquakes_count || 0} found`,
      '',
      '',
      'USGS'
    ]);
  }

  // Add USGS Volcano data
  if (enrichments.poi_volcanoes_count !== undefined) {
    rows.push([
      location.name,
      location.lat.toString(),
      location.lon.toString(),
      'USGS',
      (location.confidence || 'N/A').toString(),
      'USGS_VOLCANOES',
      'Volcanoes',
      location.lat.toString(),
      location.lon.toString(),
      (enrichments.poi_volcanoes_proximity_distance || 50.0).toFixed(1),
      'Volcanic Assessment',
      `${enrichments.poi_volcanoes_count || 0} found`,
      '',
      '',
      'USGS'
    ]);
  }

  // Add USGS Wildfire data
  if (enrichments.poi_wildfires_count !== undefined) {
    rows.push([
      location.name,
      location.lat.toString(),
      location.lon.toString(),
      'USGS',
      (location.confidence || 'N/A').toString(),
      'USGS_WILDFIRES',
      'Current Wildfires',
      location.lat.toString(),
      location.lon.toString(),
      (enrichments.poi_wildfires_proximity_distance || 50.0).toFixed(1),
      'Fire Assessment',
      `${enrichments.poi_wildfires_count || 0} found`,
      '',
      '',
      'USGS'
    ]);
  }

  // Add USGS Wetlands data
  if (enrichments.poi_wetlands_count !== undefined) {
    rows.push([
      location.name,
      location.lat.toString(),
      location.lon.toString(),
      'USGS',
      (location.confidence || 'N/A').toString(),
      'USGS_WETLANDS',
      'Wetlands Within Distance',
      location.lat.toString(),
      location.lon.toString(),
      (enrichments.poi_wetlands_proximity_distance || 2.0).toFixed(1),
      'Wetland Assessment',
      (enrichments.poi_wetlands_count || 0) > 0 ? 'Yes' : 'No',
      '',
      '',
      'USGS'
    ]);
  }

  // Add PADUS Public Lands data
  if (enrichments.padus_public_access_nearby_count !== undefined) {
    rows.push([
      location.name,
      location.lat.toString(),
      location.lon.toString(),
      'PAD-US',
      (location.confidence || 'N/A').toString(),
      'PADUS_PUBLIC_ACCESS',
      `Nearby Count: ${enrichments.padus_public_access_nearby_count || 0}`,
      '', '', '', '', '', '', '',
      'PAD-US'
    ]);
  }
  if (enrichments.padus_public_access_summary) {
    rows.push([
      location.name,
      location.lat.toString(),
      location.lon.toString(),
      'PAD-US',
      (location.confidence || 'N/A').toString(),
      'PADUS_PUBLIC_ACCESS',
      enrichments.padus_public_access_summary,
      '', '', '', '', '', '', '',
      'PAD-US'
    ]);
  }
  if (enrichments.padus_protection_status_nearby_count !== undefined) {
    rows.push([
      location.name,
      location.lat.toString(),
      location.lon.toString(),
      'PAD-US',
      (location.confidence || 'N/A').toString(),
      'PADUS_PROTECTION_STATUS',
      `Nearby Count: ${enrichments.padus_protection_status_nearby_count || 0}`,
      '', '', '', '', '', '', '',
      'PAD-US'
    ]);
  }
  if (enrichments.padus_protection_status_summary) {
    rows.push([
      location.name,
      location.lat.toString(),
      location.lon.toString(),
      'PAD-US',
      (location.confidence || 'N/A').toString(),
      'PADUS_PROTECTION_STATUS',
      enrichments.padus_protection_status_summary,
      '', '', '', '', '', '', '',
      'PAD-US'
    ]);
  }

  // Add more summary data as needed...
};

const addAllEnrichmentDataRows = (result: EnrichmentResult, rows: string[][]): void => {
  const { location, enrichments } = result;

  // Add ALL enrichment fields as rows (excluding arrays and detailed POI data)
  Object.entries(enrichments).forEach(([key, value]) => {
    // Skip detailed POI arrays (handled separately)
    if (key.includes('_all_pois') || 
        key.includes('_detailed') || 
        key.includes('_elements') || 
        key.includes('_features') ||
        key.includes('_nearby_features') ||
        key === 'nh_parcels_all' ||
        key === 'nh_key_destinations_all' ||
        key === 'nh_nursing_homes_all' ||
        key === 'nh_ems_all' ||
        key === 'nh_fire_stations_all' ||
        key === 'usvi_fire_stations_all' ||
        key === 'usvi_police_stations_all' ||
        key === 'usvi_health_care_facilities_all' ||
        key === 'guam_villages_all' || // Skip Guam Villages array (handled separately)
        key === 'guam_state_boundary_all' || // Skip Guam State Boundary array (handled separately)
        key === 'nh_places_of_worship_all' ||
        key === 'nh_hospitals_all' ||
        key === 'nh_public_waters_access_all' ||
        key === 'nh_law_enforcement_all' ||
        key === 'nh_recreation_trails_all' ||
        key === 'nh_stone_walls_all' ||
        key === 'nh_dot_roads_all' ||
        key === 'nh_railroads_all' ||
        key === 'nh_transmission_pipelines_all' ||
        key === 'nh_cell_towers_all' ||
        key === 'nh_underground_storage_tanks_all' ||
        key === 'nh_water_wells_all' ||
        key === 'nh_public_water_supply_wells_all' ||
        key === 'nh_remediation_sites_all' ||
        key === 'nh_automobile_salvage_yards_all' ||
        key === 'nh_solid_waste_facilities_all' ||
        key === 'nh_nwi_plus_all' ||
        key === 'nh_ssurgo_all' || // Skip _all array (handled separately)
        key === 'nh_bedrock_geology_all' || // Skip _all array (handled separately)
        key === 'nh_geographic_names_all' || // Skip _all array (handled separately)
        key === 'nh_source_water_protection_area_geometry' || // Skip geometry field (raw JSON, not user-friendly)
        key === 'nh_nwi_plus_geometry' || // Skip geometry field (raw JSON, not user-friendly)
        key === 'ma_dep_wetlands_all' || // Skip _all arrays (handled separately)
        key === 'ma_open_space_all' || // Skip _all arrays (handled separately)
        key === 'cape_cod_zoning_all' || // Skip _all arrays (handled separately)
        key === 'ma_trails_all' || // Skip _all arrays (handled separately)
        key === 'ma_parcels_all' || // Skip _all arrays (handled separately)
        key === 'ct_parcels_all' || // Skip _all arrays (handled separately)
        key === 'de_parcels_all' || // Skip _all arrays (handled separately)
        key === 'de_lulc_2007_all' || // Skip _all arrays (handled separately)
        key === 'de_lulc_2007_revised_all' || // Skip _all arrays (handled separately)
        key === 'de_lulc_2012_all' || // Skip _all arrays (handled separately)
        key === 'de_lulc_2017_all' || // Skip _all arrays (handled separately)
        key === 'de_lulc_2022_all' || // Skip _all arrays (handled separately)
        key === 'ct_building_footprints_all' || // Skip _all arrays (handled separately)
        key === 'ct_roads_all' || // Skip _all arrays (handled separately)
        key === 'ct_urgent_care_all' || // Skip _all arrays (handled separately)
        key === 'ct_deep_properties_all' || // Skip _all arrays (handled separately)
        key === 'ct_tribal_lands_all' || // Skip CT Tribal Lands array (handled separately)
        key === 'ct_drinking_water_watersheds_all' || // Skip CT Drinking Water Watersheds array (handled separately)
        key === 'ct_broadband_availability_all' || // Skip CT Broadband Availability array (handled separately)
        key === 'ct_water_pollution_control_all' || // Skip CT Water Pollution Control array (handled separately)
        key === 'ct_boat_launches_all' || // Skip CT Boat Launches array (handled separately)
        key === 'ct_federal_open_space_all' || // Skip CT Federal Open Space array (handled separately)
        key === 'ct_huc_watersheds_all' || // Skip CT HUC Watersheds array (handled separately)
        key === 'ct_soils_parent_material_all' || // Skip CT Soils Parent Material array (handled separately)
        key === 'ma_nhesp_natural_communities_all' ||
        key === 'ma_lakes_and_ponds_all' ||
        key === 'ma_rivers_and_streams_all' ||
        key === 'de_state_forest_all' ||
        key === 'de_pine_plantations_all' ||
        key === 'de_urban_tree_canopy_all' ||
        key === 'de_forest_cover_2007_all' ||
        key === 'de_no_build_points_bay_all' ||
        key === 'de_no_build_line_bay_all' ||
        key === 'de_no_build_points_ocean_all' ||
        key === 'de_no_build_line_ocean_all' ||
        key === 'de_park_facilities_all' || // Skip DE Park Facilities array (handled separately)
        key === 'de_child_care_centers_all' || // Skip DE Child Care Centers array (handled separately)
        key === 'de_fishing_access_all' || // Skip DE Fishing Access array (handled separately)
        key === 'de_trout_streams_all' || // Skip DE Trout Streams array (handled separately)
        key === 'de_public_schools_all' || // Skip DE Public Schools array (handled separately)
        key === 'de_private_schools_all' || // Skip DE Private Schools array (handled separately)
        key === 'de_votech_districts_all' || // Skip DE VoTech Districts array (handled separately)
        key === 'de_school_districts_all' || // Skip DE School Districts array (handled separately)
        key === 'de_stands_blinds_fields_all' || // Skip DE Stands Blinds Fields array (handled separately)
        key === 'de_boat_ramps_all' || // Skip DE Boat Ramps array (handled separately)
        key === 'de_facilities_all' || // Skip DE Facilities array (handled separately)
        key === 'de_parking_all' || // Skip DE Parking array (handled separately)
        key === 'de_restrooms_all' || // Skip DE Restrooms array (handled separately)
        key === 'de_safety_zones_all' || // Skip DE Safety Zones array (handled separately)
        key === 'de_wildlife_management_zones_all' || // Skip DE Wildlife Management Zones array (handled separately)
        key === 'de_rail_lines_all' || // Skip DE Rail Lines array (handled separately)
        key === 'nj_parcels_all' || // Skip NJ Parcels array (handled separately)
        key === 'nj_address_points_all' || // Skip NJ Address Points array (handled separately)
        key === 'nj_bus_stops_all' || // Skip NJ Bus Stops array (handled separately)
        key === 'nj_safety_service_patrol_all' || // Skip NJ Safety Service Patrol array (handled separately)
        key === 'nj_service_areas_all' || // Skip NJ Service Areas array (handled separately)
        key === 'nj_roadway_network_all' || // Skip NJ Roadway Network array (handled separately)
        key === 'nj_known_contaminated_sites_all' || // Skip NJ Known Contaminated Sites array (handled separately)
        key === 'nj_alternative_fuel_stations_all' || // Skip NJ Alternative Fuel Stations array (handled separately)
        key === 'nj_power_plants_all' || // Skip NJ Power Plants array (handled separately)
        key === 'nj_public_solar_facilities_all' || // Skip NJ Public Solar Facilities array (handled separately)
        key === 'nj_public_places_to_keep_cool_all' || // Skip NJ Public Places to Keep Cool array (handled separately)
        key === 'tiger_primary_roads_interstates_5m_all' || // Skip TIGER Primary Roads Interstates 5M array (handled separately)
        key === 'tiger_primary_roads_2_1m_all' || // Skip TIGER Primary Roads 2_1M array (handled separately)
        key === 'tiger_primary_roads_all' || // Skip TIGER Primary Roads array (handled separately)
        key === 'tiger_secondary_roads_interstates_us_all' || // Skip TIGER Secondary Roads Interstates and US Highways array (handled separately)
        key === 'tiger_secondary_roads_578k_all' || // Skip TIGER Secondary Roads 578k array (handled separately)
        key === 'tiger_secondary_roads_289_144k_all' || // Skip TIGER Secondary Roads 289_144k array (handled separately)
        key === 'tiger_secondary_roads_72_1k_all' || // Skip TIGER Secondary Roads 72_1k array (handled separately)
        key === 'tiger_local_roads_72k_all' || // Skip TIGER Local Roads 72k array (handled separately)
        key === 'tiger_local_roads_all' || // Skip TIGER Local Roads array (handled separately)
        key === 'tiger_railroads_all' || // Skip TIGER Railroads array (handled separately)
        key === 'tiger_unified_school_districts_containing' || // Skip TIGER Unified School Districts containing (handled separately)
        key === 'tiger_unified_school_districts_all' || // Skip TIGER Unified School Districts array (handled separately)
        key === 'tiger_secondary_school_districts_containing' || // Skip TIGER Secondary School Districts containing (handled separately)
        key === 'tiger_secondary_school_districts_all' || // Skip TIGER Secondary School Districts array (handled separately)
        key === 'tiger_elementary_school_districts_containing' || // Skip TIGER Elementary School Districts containing (handled separately)
        key === 'tiger_elementary_school_districts_all' || // Skip TIGER Elementary School Districts array (handled separately)
        key === 'tiger_school_district_admin_areas_containing' || // Skip TIGER School District Administrative Areas containing (handled separately)
        key === 'tiger_school_district_admin_areas_all' || // Skip TIGER School District Administrative Areas array (handled separately)
        key === 'tiger_bas2025_unified_school_districts_containing' || // Skip TIGER BAS 2025 Unified School Districts containing (handled separately)
        key === 'tiger_bas2025_unified_school_districts_all' || // Skip TIGER BAS 2025 Unified School Districts array (handled separately)
        key === 'tiger_bas2025_secondary_school_districts_containing' || // Skip TIGER BAS 2025 Secondary School Districts containing (handled separately)
        key === 'tiger_bas2025_secondary_school_districts_all' || // Skip TIGER BAS 2025 Secondary School Districts array (handled separately)
        key === 'tiger_bas2025_elementary_school_districts_containing' || // Skip TIGER BAS 2025 Elementary School Districts containing (handled separately)
        key === 'tiger_bas2025_elementary_school_districts_all' || // Skip TIGER BAS 2025 Elementary School Districts array (handled separately)
        key === 'tiger_bas2025_school_district_admin_areas_containing' || // Skip TIGER BAS 2025 School District Administrative Areas containing (handled separately)
        key === 'tiger_bas2025_school_district_admin_areas_all' || // Skip TIGER BAS 2025 School District Administrative Areas array (handled separately)
        key === 'tiger_acs2024_unified_school_districts_containing' || // Skip TIGER ACS 2024 Unified School Districts containing (handled separately)
        key === 'tiger_acs2024_unified_school_districts_all' || // Skip TIGER ACS 2024 Unified School Districts array (handled separately)
        key === 'tiger_acs2024_secondary_school_districts_containing' || // Skip TIGER ACS 2024 Secondary School Districts containing (handled separately)
        key === 'tiger_acs2024_secondary_school_districts_all' || // Skip TIGER ACS 2024 Secondary School Districts array (handled separately)
        key === 'tiger_acs2024_elementary_school_districts_containing' || // Skip TIGER ACS 2024 Elementary School Districts containing (handled separately)
        key === 'tiger_acs2024_elementary_school_districts_all' || // Skip TIGER ACS 2024 Elementary School Districts array (handled separately)
        key === 'tiger_acs2024_school_district_admin_areas_containing' || // Skip TIGER ACS 2024 School District Administrative Areas containing (handled separately)
        key === 'tiger_acs2024_school_district_admin_areas_all' || // Skip TIGER ACS 2024 School District Administrative Areas array (handled separately)
        key === 'tiger_census2020_unified_school_districts_containing' || // Skip TIGER Census 2020 Unified School Districts containing (handled separately)
        key === 'tiger_census2020_unified_school_districts_all' || // Skip TIGER Census 2020 Unified School Districts array (handled separately)
        key === 'tiger_census2020_secondary_school_districts_containing' || // Skip TIGER Census 2020 Secondary School Districts containing (handled separately)
        key === 'tiger_census2020_secondary_school_districts_all' || // Skip TIGER Census 2020 Secondary School Districts array (handled separately)
        key === 'tiger_census2020_elementary_school_districts_containing' || // Skip TIGER Census 2020 Elementary School Districts containing (handled separately)
        key === 'tiger_census2020_elementary_school_districts_all' || // Skip TIGER Census 2020 Elementary School Districts array (handled separately)
        key === 'tiger_nps_areas_containing' || // Skip TIGER National Park Service Areas containing (handled separately)
        key === 'tiger_nps_areas_all' || // Skip TIGER National Park Service Areas array (handled separately)
        key === 'tiger_correctional_facilities_containing' || // Skip TIGER Correctional Facilities containing (handled separately)
        key === 'tiger_correctional_facilities_all' || // Skip TIGER Correctional Facilities array (handled separately)
        key === 'tiger_colleges_universities_containing' || // Skip TIGER Colleges and Universities containing (handled separately)
        key === 'tiger_colleges_universities_all' || // Skip TIGER Colleges and Universities array (handled separately)
        key === 'tiger_military_installations_containing' || // Skip TIGER Military Installations containing (handled separately)
        key === 'tiger_military_installations_all' || // Skip TIGER Military Installations array (handled separately)
        // TIGER Native Lands skip list - Base layers
        key === 'tiger_anrc_containing' || key === 'tiger_anrc_all' ||
        key === 'tiger_tribal_subdivisions_containing' || key === 'tiger_tribal_subdivisions_all' ||
        key === 'tiger_federal_air_containing' || key === 'tiger_federal_air_all' ||
        key === 'tiger_off_reservation_trust_containing' || key === 'tiger_off_reservation_trust_all' ||
        key === 'tiger_state_air_containing' || key === 'tiger_state_air_all' ||
        key === 'tiger_hhl_containing' || key === 'tiger_hhl_all' ||
        key === 'tiger_anvsa_containing' || key === 'tiger_anvsa_all' ||
        key === 'tiger_otsa_containing' || key === 'tiger_otsa_all' ||
        key === 'tiger_sdtsa_containing' || key === 'tiger_sdtsa_all' ||
        key === 'tiger_tdsa_containing' || key === 'tiger_tdsa_all' ||
        key === 'tiger_aijua_containing' || key === 'tiger_aijua_all' ||
        // TIGER Native Lands skip list - BAS 2025
        key === 'tiger_bas2025_anrc_containing' || key === 'tiger_bas2025_anrc_all' ||
        key === 'tiger_bas2025_tribal_subdivisions_containing' || key === 'tiger_bas2025_tribal_subdivisions_all' ||
        key === 'tiger_bas2025_federal_air_containing' || key === 'tiger_bas2025_federal_air_all' ||
        key === 'tiger_bas2025_off_reservation_trust_containing' || key === 'tiger_bas2025_off_reservation_trust_all' ||
        key === 'tiger_bas2025_state_air_containing' || key === 'tiger_bas2025_state_air_all' ||
        key === 'tiger_bas2025_hhl_containing' || key === 'tiger_bas2025_hhl_all' ||
        key === 'tiger_bas2025_anvsa_containing' || key === 'tiger_bas2025_anvsa_all' ||
        key === 'tiger_bas2025_otsa_containing' || key === 'tiger_bas2025_otsa_all' ||
        key === 'tiger_bas2025_sdtsa_containing' || key === 'tiger_bas2025_sdtsa_all' ||
        key === 'tiger_bas2025_tdsa_containing' || key === 'tiger_bas2025_tdsa_all' ||
        key === 'tiger_bas2025_aijua_containing' || key === 'tiger_bas2025_aijua_all' ||
        // TIGER Native Lands skip list - ACS 2024
        key === 'tiger_acs2024_anrc_containing' || key === 'tiger_acs2024_anrc_all' ||
        key === 'tiger_acs2024_tribal_subdivisions_containing' || key === 'tiger_acs2024_tribal_subdivisions_all' ||
        key === 'tiger_acs2024_federal_air_containing' || key === 'tiger_acs2024_federal_air_all' ||
        key === 'tiger_acs2024_off_reservation_trust_containing' || key === 'tiger_acs2024_off_reservation_trust_all' ||
        key === 'tiger_acs2024_state_air_containing' || key === 'tiger_acs2024_state_air_all' ||
        key === 'tiger_acs2024_hhl_containing' || key === 'tiger_acs2024_hhl_all' ||
        key === 'tiger_acs2024_anvsa_containing' || key === 'tiger_acs2024_anvsa_all' ||
        key === 'tiger_acs2024_otsa_containing' || key === 'tiger_acs2024_otsa_all' ||
        key === 'tiger_acs2024_sdtsa_containing' || key === 'tiger_acs2024_sdtsa_all' ||
        key === 'tiger_acs2024_tdsa_containing' || key === 'tiger_acs2024_tdsa_all' ||
        key === 'tiger_acs2024_aijua_containing' || key === 'tiger_acs2024_aijua_all' ||
        // TIGER Native Lands skip list - Census 2020
        key === 'tiger_census2020_anrc_containing' || key === 'tiger_census2020_anrc_all' ||
        key === 'tiger_census2020_tribal_subdivisions_containing' || key === 'tiger_census2020_tribal_subdivisions_all' ||
        key === 'tiger_census2020_federal_air_containing' || key === 'tiger_census2020_federal_air_all' ||
        key === 'tiger_census2020_off_reservation_trust_containing' || key === 'tiger_census2020_off_reservation_trust_all' ||
        key === 'tiger_census2020_state_air_containing' || key === 'tiger_census2020_state_air_all' ||
        key === 'tiger_census2020_hhl_containing' || key === 'tiger_census2020_hhl_all' ||
        key === 'tiger_census2020_anvsa_containing' || key === 'tiger_census2020_anvsa_all' ||
        key === 'tiger_census2020_otsa_containing' || key === 'tiger_census2020_otsa_all' ||
        key === 'tiger_census2020_sdtsa_containing' || key === 'tiger_census2020_sdtsa_all' ||
        key === 'tiger_census2020_tdsa_containing' || key === 'tiger_census2020_tdsa_all' ||
        key === 'tiger_census2020_aijua_containing' || key === 'tiger_census2020_aijua_all' ||
        // TIGER CBSA skip list - Base layers
        key === 'tiger_cbsa_combined_statistical_areas_containing' || key === 'tiger_cbsa_combined_statistical_areas_all' ||
        key === 'tiger_cbsa_metro_micropolitan_statistical_areas_containing' || key === 'tiger_cbsa_metro_micropolitan_statistical_areas_all' ||
        key === 'tiger_cbsa_metropolitan_divisions_containing' || key === 'tiger_cbsa_metropolitan_divisions_all' ||
        key === 'tiger_cbsa_metropolitan_statistical_areas_containing' || key === 'tiger_cbsa_metropolitan_statistical_areas_all' ||
        key === 'tiger_cbsa_micropolitan_statistical_areas_containing' || key === 'tiger_cbsa_micropolitan_statistical_areas_all' ||
        // TIGER Urban Areas skip list
        key === 'tiger_urban_2020_urban_areas_containing' || key === 'tiger_urban_2020_urban_areas_all' ||
        key === 'tiger_urban_bas2025_2020_urban_areas_containing' || key === 'tiger_urban_bas2025_2020_urban_areas_all' ||
        key === 'tiger_urban_acs2024_2020_urban_areas_containing' || key === 'tiger_urban_acs2024_2020_urban_areas_all' ||
        key === 'tiger_urban_census2020_2020_urban_areas_corrected_containing' || key === 'tiger_urban_census2020_2020_urban_areas_corrected_all' ||
        key === 'tiger_urban_census2020_2020_urban_areas_containing' || key === 'tiger_urban_census2020_2020_urban_areas_all' ||
        key === 'tiger_urban_urban_areas_containing' || key === 'tiger_urban_urban_areas_all' ||
        // Ireland Provinces skip list
        key === 'ireland_provinces_containing' || key === 'ireland_provinces_nearby_features' || key === 'ireland_provinces_all' ||
        // UK Local Authority Districts skip list
        key === 'uk_local_authority_districts_containing' || key === 'uk_local_authority_districts_nearby' || key === 'uk_local_authority_districts_all' ||
        // Ireland Built-Up Areas skip list
        key === 'ireland_built_up_areas_containing' || key === 'ireland_built_up_areas_nearby_features' || key === 'ireland_built_up_areas_all' ||
        // Ireland Small Areas skip list
        key === 'ireland_small_areas_containing' || key === 'ireland_small_areas_nearby_features' || key === 'ireland_small_areas_all' ||
        key === 'ireland_electoral_divisions_containing' || key === 'ireland_electoral_divisions_nearby_features' || key === 'ireland_electoral_divisions_all' ||
        key === 'ireland_nuts3_boundaries_containing' || key === 'ireland_nuts3_boundaries_nearby_features' || key === 'ireland_nuts3_boundaries_all' ||
        key === 'ireland_civil_parishes_containing' || key === 'ireland_civil_parishes_nearby_features' || key === 'ireland_civil_parishes_all' ||
        key === 'ireland_buildings_residential_containing' || key === 'ireland_buildings_residential_nearby_features' || key === 'ireland_buildings_residential_all' ||
        key === 'ireland_buildings_residential_commercial_containing' || key === 'ireland_buildings_residential_commercial_nearby_features' || key === 'ireland_buildings_residential_commercial_all' ||
        key === 'ireland_buildings_commercial_containing' || key === 'ireland_buildings_commercial_nearby_features' || key === 'ireland_buildings_commercial_all' ||
        // Ireland Centres of Population skip list
        key === 'ireland_centres_of_population_all' ||
        key === 'ireland_mountains_all' ||
        key === 'ireland_high_water_marks_all' ||
        key === 'ireland_vegetation_areas_all' ||
        key === 'ireland_pois_all' ||
        key === 'australia_railways_all' ||
        key === 'australia_trams_all' ||
        key === 'australia_bushfires_all' ||
        key === 'australia_operating_mines_all_pois' ||
        key === 'australia_developing_mines_all_pois' ||
        key === 'australia_care_maintenance_mines_all_pois' ||
        key === 'australia_built_up_areas_all' ||
        key === 'australia_built_up_areas_containing' ||
        key === 'australia_built_up_areas_nearby_features' ||
        key === 'australia_npi_facilities_all_pois' ||
        key === 'australia_waste_management_facilities_all' ||
        key === 'australia_maritime_ports_all' ||
        key === 'australia_national_roads_all' ||
        key === 'australia_major_roads_all' ||
        key === 'australia_bushfires_containing' ||
        key === 'australia_bushfires_nearby_features' ||
        // TIGER CBSA skip list - BAS 2025
        key === 'tiger_bas2025_cbsa_combined_statistical_areas_containing' || key === 'tiger_bas2025_cbsa_combined_statistical_areas_all' ||
        key === 'tiger_bas2025_cbsa_metro_micropolitan_statistical_areas_containing' || key === 'tiger_bas2025_cbsa_metro_micropolitan_statistical_areas_all' ||
        key === 'tiger_bas2025_cbsa_metropolitan_divisions_containing' || key === 'tiger_bas2025_cbsa_metropolitan_divisions_all' ||
        key === 'tiger_bas2025_cbsa_metropolitan_statistical_areas_containing' || key === 'tiger_bas2025_cbsa_metropolitan_statistical_areas_all' ||
        key === 'tiger_bas2025_cbsa_micropolitan_statistical_areas_containing' || key === 'tiger_bas2025_cbsa_micropolitan_statistical_areas_all' ||
        // TIGER CBSA skip list - ACS 2024
        key === 'tiger_acs2024_cbsa_combined_statistical_areas_containing' || key === 'tiger_acs2024_cbsa_combined_statistical_areas_all' ||
        key === 'tiger_acs2024_cbsa_metro_micropolitan_statistical_areas_containing' || key === 'tiger_acs2024_cbsa_metro_micropolitan_statistical_areas_all' ||
        key === 'tiger_acs2024_cbsa_metropolitan_divisions_containing' || key === 'tiger_acs2024_cbsa_metropolitan_divisions_all' ||
        key === 'tiger_acs2024_cbsa_metropolitan_statistical_areas_containing' || key === 'tiger_acs2024_cbsa_metropolitan_statistical_areas_all' ||
        key === 'tiger_acs2024_cbsa_micropolitan_statistical_areas_containing' || key === 'tiger_acs2024_cbsa_micropolitan_statistical_areas_all' ||
        // TIGER CBSA skip list - Census 2020
        key === 'tiger_census2020_cbsa_combined_new_england_city_town_areas_containing' || key === 'tiger_census2020_cbsa_combined_new_england_city_town_areas_all' ||
        key === 'tiger_census2020_cbsa_new_england_city_town_areas_containing' || key === 'tiger_census2020_cbsa_new_england_city_town_areas_all' ||
        key === 'tiger_census2020_cbsa_new_england_city_town_area_divisions_containing' || key === 'tiger_census2020_cbsa_new_england_city_town_area_divisions_all' ||
        key === 'tiger_census2020_cbsa_metropolitan_new_england_city_town_areas_containing' || key === 'tiger_census2020_cbsa_metropolitan_new_england_city_town_areas_all' ||
        key === 'tiger_census2020_cbsa_micropolitan_new_england_city_town_areas_containing' || key === 'tiger_census2020_cbsa_micropolitan_new_england_city_town_areas_all' ||
        key === 'tiger_census2020_cbsa_combined_statistical_areas_containing' || key === 'tiger_census2020_cbsa_combined_statistical_areas_all' ||
        key === 'tiger_census2020_cbsa_metro_micropolitan_statistical_areas_containing' || key === 'tiger_census2020_cbsa_metro_micropolitan_statistical_areas_all' ||
        key === 'tiger_census2020_cbsa_metropolitan_divisions_containing' || key === 'tiger_census2020_cbsa_metropolitan_divisions_all' ||
        key === 'tiger_census2020_cbsa_metropolitan_statistical_areas_containing' || key === 'tiger_census2020_cbsa_metropolitan_statistical_areas_all' ||
        key === 'tiger_census2020_cbsa_micropolitan_statistical_areas_containing' || key === 'tiger_census2020_cbsa_micropolitan_statistical_areas_all' || // Skip TIGER CBSA arrays (handled separately)
        key === 'de_natural_areas_all' ||
        key === 'de_outdoor_recreation_parks_trails_lands_all' ||
        key === 'de_land_water_conservation_fund_all' ||
        key === 'de_nature_preserves_all' ||
        key === 'de_outdoor_recreation_areas_all' ||
        key === 'de_outdoor_recreation_parks_trails_open_space_all' ||
        key === 'de_public_protected_lands_all' ||
        key === 'de_conservation_easements_all' ||
        key === 'de_trails_pathways_all' ||
        key === 'de_seasonal_restricted_areas_all' ||
        key === 'de_permanent_restricted_areas_all' ||
        key === 'de_wildlife_area_boundaries_all' || // Skip _all arrays (handled separately)
        key === 'la_county_arts_recreation_all' || // Skip LA County arrays (handled separately)
        key === 'la_county_education_all' ||
        key === 'la_county_hospitals_all' ||
        key === 'la_county_municipal_services_all' ||
        key === 'la_county_physical_features_all' ||
        key === 'la_county_public_safety_all' ||
        key === 'la_county_transportation_all' ||
        key === 'la_county_fire_hydrants_all' ||
        key === 'chicago_311_all' ||
        key === 'chicago_traffic_crashes_all' ||
        key === 'chicago_speed_cameras_all' ||
        key === 'chicago_red_light_cameras_all' ||
        key === 'nyc_mappluto_all' ||
        key === 'nyc_mappluto_commercial_mixed_use_all' ||
        key === 'nyc_mappluto_retail_all' ||
        key === 'nyc_mappluto_office_all' ||
        key === 'nyc_mappluto_industrial_all' ||
        key === 'nyc_mappluto_warehouses_all' ||
        key === 'nyc_mappluto_hotels_all' ||
        key === 'nyc_mappluto_auto_commercial_all' ||
        key === 'nyc_mappluto_large_commercial_all' ||
        key === 'nyc_mappluto_residential_all' ||
        key === 'nyc_bike_routes_all' ||
        key === 'nyc_neighborhoods_all' ||
        key === 'nyc_zoning_districts_all' ||
        key === 'nyc_waterfront_hpb_launch_site_all' ||
        key === 'nyc_waterfront_parks_all' ||
        key === 'nyc_waterfront_paws_all' ||
        key === 'nyc_business_improvement_districts_all' ||
        key === 'nyc_community_districts_all' ||
        key === 'houston_neighborhoods_all' ||
        key === 'houston_neighborhoods_2021_all' ||
        key === 'houston_site_addresses_all' ||
        key === 'houston_roads_centerline_all' ||
        key === 'houston_olc_grid_6digit_all' ||
        key === 'houston_olc_grid_8digit_all' ||
        key === 'houston_fire_stations_all' ||
        key === 'houston_metro_bus_routes_all' ||
        key === 'houston_metro_park_and_ride_all' ||
        key === 'houston_metro_transit_centers_all' ||
        key === 'houston_metro_rail_stations_all' ||
        key === 'houston_airports_all' ||
        key === 'houston_bikeways_all' ||
        key === 'blm_national_trails_all' ||
        key === 'blm_national_motorized_trails_all' ||
        key === 'blm_national_nonmotorized_trails_all' ||
        key === 'blm_national_limited_motorized_roads_all' ||
        key === 'blm_national_public_motorized_roads_all' ||
        key === 'blm_national_grazing_pastures_all' ||
        key === 'blm_national_acec_all' ||
        key === 'blm_national_sheep_goat_grazing_all' ||
        key === 'blm_national_sheep_goat_authorized_grazing_all' ||
        key === 'blm_national_nlcs_monuments_ncas_all' ||
        key === 'blm_national_wild_horse_burro_herd_areas_all' ||
        key === 'blm_national_recreation_sites_all' ||
        key === 'blm_national_fire_perimeters_all' ||
        key === 'blm_national_lwcf_all' ||
        key === 'usfs_forest_boundaries_all' ||
        key === 'usfs_wilderness_areas_all' ||
        key === 'chinook_salmon_ranges_all' ||
        key === 'tx_school_districts_2024_all' || // Skip TX School Districts 2024 array (handled separately)
        key === 'wri_aqueduct_water_risk_future_annual_all' || // Skip WRI Aqueduct Water Risk Future Annual array (handled separately)
        key === 'wri_aqueduct_water_risk_baseline_annual_all' || // Skip WRI Aqueduct Water Risk Baseline Annual array (handled separately)
        key === 'wri_aqueduct_water_risk_baseline_monthly_all' || // Skip WRI Aqueduct Water Risk Baseline Monthly array (handled separately)
        (key.startsWith('acs_') && key.endsWith('_all')) || // Skip all ACS boundary arrays (handled separately)
        key === 'pr_hydrology_all' || // Skip Puerto Rico Hydrology array (handled separately)
        key === 'sc_trout_streams_all' || // Skip SC Trout Streams array (handled separately)
        key === 'sc_scenic_rivers_all' || // Skip SC Scenic Rivers array (handled separately)
        key === 'sc_game_zones_all' || // Skip SC Game Zones array (handled separately)
        key === 'sc_coastal_ponds_all' || // Skip SC Coastal Ponds array (handled separately)
        key === 'sc_lakes_reservoirs_all' || // Skip SC Lakes and Reservoirs array (handled separately)
        key === 'sc_coastal_well_inventory_all' || // Skip SC Coastal Well Inventory array (handled separately)
        key === 'usfws_final_critical_habitat_all' || // Skip USFWS Final Critical Habitat array (handled separately)
        key === 'usfws_proposed_critical_habitat_all' || // Skip USFWS Proposed Critical Habitat array (handled separately)
        key === 'national_aquatic_barrier_dams_all' || // Skip National Aquatic Barrier Dam Inventory array (handled separately)
        key === 'american_eel_current_range_all' || // Skip American Eel Current Range array (handled separately)
        key === 'bighorn_sheep_captures_releases_all' || // Skip Bighorn Sheep Captures and Releases array (handled separately)
        key === 'orlando_christmas_lights_all' || // Skip Orlando Christmas Lights array (handled separately)
        key === 'us_drilling_platforms_all' || // Skip US Drilling Platforms array (handled separately)
        key === 'guam_villages_all' || // Skip Guam Villages array (handled separately)
        key === 'guam_state_boundary_all' || // Skip Guam State Boundary array (handled separately)
        key === 'usfs_national_grasslands_all' ||
        key === 'usfs_hazardous_sites_all' ||
        key === 'usfs_office_locations_all' ||
        key === 'usfs_special_uses_communications_sites_all' ||
        key === 'usfs_administrative_boundaries_all' ||
        key === 'usfs_recreation_opportunities_all' ||
        key === 'usfs_recreation_area_activities_all' ||
        key === 'usfs_roads_closed_to_motorized_all' ||
        key === 'usfs_system_roads_all' ||
        key === 'usfs_mvum_all' ||
        key === 'usfs_co_roadless_areas_all' ||
        key === 'houston_tirz_all' ||
        key === 'houston_affordability_all' ||
        key === 'houston_fire_hydrants_all' ||
        key === 'poi_osm_health_medical_care_elements' ||
        key === 'poi_osm_health_medical_care_all_pois' ||
        key === 'poi_osm_health_mental_behavioral_elements' ||
        key === 'poi_osm_health_mental_behavioral_all_pois' ||
        key === 'poi_osm_health_pharmacy_diagnostics_elements' ||
        key === 'poi_osm_health_pharmacy_diagnostics_all_pois' ||
        key === 'poi_osm_health_fitness_movement_elements' ||
        key === 'poi_osm_health_fitness_movement_all_pois' ||
        key === 'poi_osm_health_wellness_alternative_elements' ||
        key === 'poi_osm_health_wellness_alternative_all_pois' ||
        key === 'poi_osm_health_dental_vision_elements' ||
        key === 'poi_osm_health_dental_vision_all_pois' ||
        key === 'poi_osm_health_public_community_elements' ||
        key === 'poi_osm_health_public_community_all_pois' ||
        key === 'poi_osm_health_senior_assisted_elements' ||
        key === 'poi_osm_health_senior_assisted_all_pois' ||
        key === 'la_county_historic_cultural_monuments_all' ||
        key === 'la_county_housing_lead_risk_all' ||
        key === 'la_county_school_district_boundaries_all' ||
        key === 'la_county_metro_lines_all' ||
        key === 'la_county_street_inventory_all' || // Skip LA County Hazards arrays (handled separately)
        key === 'national_seismic_hazard_2023_all' || // Skip seismic hazard array (handled separately)
        key === 'tornado_tracks_1950_2017_all' || // Skip tornado tracks array (handled separately)
        key === 'la_county_fire_hazards_all' ||
        key === 'la_county_fire_hazard_responsibility_areas_all' ||
        key === 'la_county_fire_hazard_severity_zones_all' ||
        key === 'la_county_fire_hazard_severity_zones_lra_all' ||
        key === 'la_county_fire_hazard_severity_zones_sra_all' ||
        key === 'la_county_earthquake_hazards_all' ||
        key === 'la_county_alquist_priolo_fault_traces_all' ||
        key === 'la_county_alquist_priolo_fault_zones_all' ||
        key === 'la_county_usgs_faults_all' ||
        key === 'la_county_tsunami_inundation_runup_line_all' ||
        key === 'la_county_tsunami_inundation_zones_all' ||
        key === 'la_county_landslide_zones_all' ||
        key === 'la_county_liquefaction_zones_all' ||
        key === 'la_county_flood_hazards_all' ||
        key === 'la_county_100_year_flood_plain_all' ||
        key === 'la_county_500_year_flood_plain_all' ||
        key === 'la_county_dam_inundation_eta_all' ||
        key === 'la_county_dam_inundation_areas_all' || // Skip LA County Basemaps and Grids arrays (handled separately)
        key === 'la_county_us_national_grid_all' ||
        key === 'la_county_usng_100k_all' ||
        key === 'la_county_usng_10000m_all' ||
        key === 'la_county_usng_1000m_all' ||
        key === 'la_county_usng_100m_all' ||
        key === 'la_county_township_range_section_rancho_boundaries_all' ||
        key === 'us_national_grid_usng_6x8_zones_all' || // Skip US National Grid arrays (handled separately)
        key === 'us_national_grid_usng_100000m_all' ||
        key === 'us_national_grid_usng_10000m_all' ||
        key === 'us_national_grid_usng_1000m_all' ||
        key === 'us_national_grid_usng_100m_all' ||
        key === 'us_historical_cultural_political_points_all' || // Skip US Historical Cultural Political Points array (handled separately)
        key === 'us_historical_hydrographic_points_all' || // Skip US Historical Hydrographic Points array (handled separately)
        key === 'us_historical_physical_points_all' || // Skip US Historical Physical Points array (handled separately)
        key === 'hurricane_evacuation_routes_all' || // Skip Hurricane Evacuation Routes array (handled separately)
        key === 'hurricane_evacuation_routes_hazards_all' || // Skip Hurricane Evacuation Routes (Natural Hazards) array (handled separately)
        (key.startsWith('usgs_gov_') && key.endsWith('_all')) || // Skip USGS Government Units arrays (handled separately)
        key === 'tnm_structures_all' || // Skip TNM Structures array (handled separately)
        key === 'usgs_trails_all' || // Skip USGS Trails array (handled separately)
        (key.startsWith('usgs_transportation_') && key.endsWith('_all')) || // Skip USGS Transportation arrays (handled separately)
        (key.startsWith('usgs_geonames_') && key.endsWith('_all')) || // Skip USGS GeoNames arrays (handled separately)
        (key.startsWith('usgs_selectable_polygons_') && key.endsWith('_all')) || // Skip USGS Selectable Polygons arrays (handled separately)
        (key.startsWith('usgs_wbd_') && key.endsWith('_all')) || // Skip USGS WBD arrays (handled separately)
        (key.startsWith('usgs_contours_') && key.endsWith('_all')) || // Skip USGS Contours arrays (handled separately)
        (key === 'noaa_critical_fisheries_habitat_all') || // Skip NOAA Critical Fisheries Habitat array (handled separately)
        (key === 'noaa_weather_radar_impact_zones_all') || // Skip NOAA Weather Radar Impact Zones array (handled separately)
        (key.startsWith('noaa_maritime_') && key.endsWith('_all')) || // Skip NOAA Maritime Limits arrays (handled separately)
        (key.startsWith('noaa_west_coast_efh_') && key.endsWith('_all')) || // Skip NOAA West Coast EFH arrays (handled separately)
        (key.startsWith('noaa_esa_species_ranges_') && key.endsWith('_all')) || // Skip NOAA ESA Species Ranges arrays (handled separately)
        (key.startsWith('noaa_nmfs_critical_habitat_') && key.endsWith('_all')) || // Skip NOAA NMFS Critical Habitat arrays (handled separately)
        (key.startsWith('noaa_water_temp_') && key.endsWith('_all')) || // Skip NOAA Water Temperature arrays (handled separately)
        (key.startsWith('boston_') && key.endsWith('_all')) || // Skip Boston Open Data arrays (handled separately)
        (key.startsWith('alaska_dnr_') && key.endsWith('_all')) || // Skip Alaska DNR arrays (handled separately)
        (key.startsWith('dc_utc_') && key.endsWith('_all')) || // Skip DC Urban Tree Canopy arrays (handled separately)
        (key.startsWith('dc_bike_') && key.endsWith('_all')) || // Skip DC Bike Trails arrays (handled separately)
        (key.startsWith('dc_property_') && key.endsWith('_all')) || // Skip DC Property and Land arrays (handled separately)
        (key.startsWith('la_county_hydrology_') && key.endsWith('_all')) || // Skip LA County Infrastructure arrays (handled separately)
        (key.startsWith('la_county_infrastructure_') && key.endsWith('_all')) || // Skip LA County Administrative Boundaries arrays (handled separately)
        (key.startsWith('la_county_admin_boundaries_') && key.endsWith('_all')) || // Skip LA County Elevation arrays (handled separately)
        (key.startsWith('la_county_elevation_') && key.endsWith('_all')) || // Skip LA County Elevation raster flags (handled separately)
        (key.startsWith('la_county_elevation_') && key.endsWith('_enabled')) || // Skip LA County Demographics arrays (handled separately)
        (key.startsWith('la_county_demographics_') && key.endsWith('_all')) || // Skip LA County LMS arrays (handled separately)
        (key.startsWith('la_county_lms_') && key.endsWith('_all')) || // Skip LA County Political Boundaries arrays (handled separately)
        (key.startsWith('la_county_political_boundaries_') && key.endsWith('_all')) || // Skip LA County Redistricting arrays (handled separately)
        (key.startsWith('la_county_redistricting_') && key.endsWith('_all')) || // Skip LA County Transportation arrays (handled separately)
        (key.startsWith('la_county_transportation') && key.endsWith('_all')) || // Skip LA County Transportation arrays (handled separately)
        (key.startsWith('la_county_milepost_markers') && key.endsWith('_all')) || // Skip LA County Transportation arrays (handled separately)
        (key.startsWith('la_county_rail_transportation') && key.endsWith('_all')) || // Skip LA County Transportation arrays (handled separately)
        (key.startsWith('la_county_freeways') && key.endsWith('_all')) || // Skip LA County Transportation arrays (handled separately)
        (key.startsWith('la_county_disaster_routes') && key.endsWith('_all')) || // Skip LA County Transportation arrays (handled separately)
        (key.startsWith('la_county_highway_shields') && key.endsWith('_all')) || // Skip LA County Transportation arrays (handled separately)
        (key.startsWith('la_county_metro_park_ride') && key.endsWith('_all')) || // Skip LA County Transportation arrays (handled separately)
        (key.startsWith('la_county_metro_stations') && key.endsWith('_all')) || // Skip LA County Transportation arrays (handled separately)
        (key.startsWith('la_county_metrolink') && key.endsWith('_all')) || // Skip LA County Transportation arrays (handled separately)
        (key.startsWith('la_county_metro_lines') && key.endsWith('_all')) || // Skip LA County Transportation arrays (handled separately)
        (key.startsWith('la_county_railroads') && key.endsWith('_all'))) { // Skip _all arrays (handled separately)
      return;
    }
    
    // Skip already handled fields
    if (key === 'fws_species_count' || 
        key === 'poi_earthquakes_count' || 
        key === 'poi_volcanoes_count' ||
        key === 'poi_wildfires_count' ||
        key === 'poi_wetlands_count' ||
        key === 'padus_public_access_nearby_count' ||
        key === 'padus_public_access_summary' ||
        key === 'padus_protection_status_nearby_count' ||
        key === 'padus_protection_status_summary') {
      return;
    }

    // Format the value
    let formattedValue = '';
    if (value === null || value === undefined) {
      formattedValue = 'N/A';
    } else if (typeof value === 'boolean') {
      formattedValue = value ? 'Yes' : 'No';
    } else if (typeof value === 'number') {
      formattedValue = value.toString();
    } else if (Array.isArray(value)) {
      formattedValue = `${value.length} items`;
    } else if (typeof value === 'object') {
      // Format objects as readable strings
      if (value.name) {
        formattedValue = String(value.name);
      } else if (value.title) {
        formattedValue = String(value.title);
      } else {
        // For count objects, format nicely
        if (key.includes('_counts') || (key.includes('_count') && !key.includes('nearby_count') && !key.includes('summary'))) {
          // Format PADUS count objects with labels
          if (key.includes('padus_')) {
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
              // Format other counts
              return `${k}: ${v}`;
            });
            formattedValue = entries.join(', ');
          } else {
            formattedValue = Object.entries(value)
              .map(([k, v]) => `${k}: ${v}`)
              .join(', ');
          }
        } else {
          formattedValue = JSON.stringify(value);
        }
      }
    } else {
      formattedValue = String(value);
    }

    // Determine data source based on enrichment key
    let dataSource = '';
    if (key.includes('alaska_dnr_')) {
      dataSource = 'Alaska DNR';
    } else if (key.includes('nh_')) {
      if (key.includes('nwi_plus') || key.includes('source_water') || key.includes('underground_storage') || 
          key.includes('water_well') || key.includes('remediation') || key.includes('automobile_salvage') || 
          key.includes('solid_waste')) {
        dataSource = 'NH DES';
      } else {
        dataSource = 'NH GRANIT';
      }
    } else if (key.includes('ma_') || key.includes('cape_cod')) {
      if (key.includes('cape_cod')) {
        dataSource = 'Cape Cod Commission';
      } else {
        dataSource = 'MassGIS';
      }
    } else if (key.includes('fws_')) {
      dataSource = 'FWS API';
    } else if (key.includes('usgs_') || key.includes('poi_earthquakes') || key.includes('poi_volcanoes') || 
               key.includes('poi_wildfires') || key.includes('poi_wetlands')) {
      dataSource = 'USGS';
    } else if (key.includes('padus_')) {
      dataSource = 'PAD-US';
    } else if (key.includes('soil_')) {
      dataSource = 'ESRI Living Atlas / ISRIC';
    } else if (key.includes('usda_')) {
      dataSource = 'USDA Forest Service';
    } else if (key.includes('epa_')) {
      dataSource = 'EPA';
    } else if (key.includes('noaa_')) {
      dataSource = 'NOAA';
    } else if (key.includes('census_')) {
      dataSource = 'US Census Bureau';
    } else if (key.includes('fema_')) {
      dataSource = 'FEMA';
    } else if (key.includes('wikipedia')) {
      dataSource = 'Wikipedia';
    } else if (key.includes('poi_') || key.includes('_pois')) {
      dataSource = 'OpenStreetMap';
    }

    rows.push([
      location.name,
      location.lat.toString(),
      location.lon.toString(),
      dataSource || location.source, // Use data source if available, otherwise geocoding source
      (location.confidence || 'N/A').toString(),
      key, // POI_Type
      formattedValue, // POI_Name
      '', // POI_Latitude
      '', // POI_Longitude
      '', // Distance_Miles
      '', // POI_Category
      '', // POI_Address
      '', // POI_Phone
      '', // POI_Website
      dataSource // POI_Source
    ]);
  });
};

const addPOIDataRows = (result: EnrichmentResult, rows: string[][], exportedPrivateSchoolIds: Set<string>, exportedPublicSchoolIds: Set<string>, exportedBusinessIds: Set<string>, exportedRouteIds: Set<string>, exportedTrafficIds: Set<string>): void => {
  const { location, enrichments } = result;

  // Add all POI data as individual rows
  Object.entries(enrichments).forEach(([key, value]) => {
    // NRI Hurricane Annualized Frequency - County (polygons)
    if (key === 'nri_hurricane_annualized_frequency_county_all' && Array.isArray(value)) {
      value.forEach((feat: any) => {
        const attrs = feat?.attributes || feat || {};
        const objectId = attrs.OBJECTID || attrs.objectId || attrs.objectid || feat.objectId || 'Unknown';
        const distance = feat.distance_miles !== null && feat.distance_miles !== undefined
          ? Number(feat.distance_miles).toFixed(2)
          : (feat.isContaining ? '0.00' : '');

        const attributesJson = JSON.stringify(attrs);
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'FEMA National Risk Index (ArcGIS)',
          (location.confidence || 'N/A').toString(),
          'NRI_HURRICANE_ANNUALIZED_FREQUENCY_COUNTY',
          `County (ID ${objectId})`,
          location.lat.toString(),
          location.lon.toString(),
          distance,
          'Natural Hazards',
          feat.isContaining ? 'Containing County' : `Nearby County (${distance} miles)`,
          '',
          attributesJson,
          'ArcGIS FeatureServer'
        ]);
      });
      return;
    }

    // NRI Hurricane Annualized Frequency - Census Tract (polygons)
    if (key === 'nri_hurricane_annualized_frequency_census_tract_all' && Array.isArray(value)) {
      value.forEach((feat: any) => {
        const attrs = feat?.attributes || feat || {};
        const objectId = attrs.OBJECTID || attrs.objectId || attrs.objectid || feat.objectId || 'Unknown';
        const distance = feat.distance_miles !== null && feat.distance_miles !== undefined
          ? Number(feat.distance_miles).toFixed(2)
          : (feat.isContaining ? '0.00' : '');

        const attributesJson = JSON.stringify(attrs);
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'FEMA National Risk Index (ArcGIS)',
          (location.confidence || 'N/A').toString(),
          'NRI_HURRICANE_ANNUALIZED_FREQUENCY_CENSUS_TRACT',
          `Census Tract (ID ${objectId})`,
          location.lat.toString(),
          location.lon.toString(),
          distance,
          'Natural Hazards',
          feat.isContaining ? 'Containing Tract' : `Nearby Tract (${distance} miles)`,
          '',
          attributesJson,
          'ArcGIS FeatureServer'
        ]);
      });
      return;
    }

    // NRI Hail Annualized Frequency - County (polygons)
    if (key === 'nri_hail_annualized_frequency_county_all' && Array.isArray(value)) {
      value.forEach((feat: any) => {
        const attrs = feat?.attributes || feat || {};
        const objectId = attrs.OBJECTID || attrs.objectId || attrs.objectid || feat.objectId || 'Unknown';
        const distance = feat.distance_miles !== null && feat.distance_miles !== undefined
          ? Number(feat.distance_miles).toFixed(2)
          : (feat.isContaining ? '0.00' : '');
        const attributesJson = JSON.stringify(attrs);
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'FEMA National Risk Index (ArcGIS)',
          (location.confidence || 'N/A').toString(),
          'NRI_HAIL_ANNUALIZED_FREQUENCY_COUNTY',
          `County (ID ${objectId})`,
          location.lat.toString(),
          location.lon.toString(),
          distance,
          'Natural Hazards',
          feat.isContaining ? 'Containing County' : `Nearby County (${distance} miles)`,
          '',
          attributesJson,
          'ArcGIS FeatureServer'
        ]);
      });
      return;
    }

    // NRI Hail Annualized Frequency - Census Tract (polygons)
    if (key === 'nri_hail_annualized_frequency_census_tract_all' && Array.isArray(value)) {
      value.forEach((feat: any) => {
        const attrs = feat?.attributes || feat || {};
        const objectId = attrs.OBJECTID || attrs.objectId || attrs.objectid || feat.objectId || 'Unknown';
        const distance = feat.distance_miles !== null && feat.distance_miles !== undefined
          ? Number(feat.distance_miles).toFixed(2)
          : (feat.isContaining ? '0.00' : '');
        const attributesJson = JSON.stringify(attrs);
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'FEMA National Risk Index (ArcGIS)',
          (location.confidence || 'N/A').toString(),
          'NRI_HAIL_ANNUALIZED_FREQUENCY_CENSUS_TRACT',
          `Census Tract (ID ${objectId})`,
          location.lat.toString(),
          location.lon.toString(),
          distance,
          'Natural Hazards',
          feat.isContaining ? 'Containing Tract' : `Nearby Tract (${distance} miles)`,
          '',
          attributesJson,
          'ArcGIS FeatureServer'
        ]);
      });
      return;
    }

    // NRI Tornado Annualized Frequency - County (polygons)
    if (key === 'nri_tornado_annualized_frequency_county_all' && Array.isArray(value)) {
      value.forEach((feat: any) => {
        const attrs = feat?.attributes || feat || {};
        const objectId = attrs.OBJECTID || attrs.objectId || attrs.objectid || feat.objectId || 'Unknown';
        const distance = feat.distance_miles !== null && feat.distance_miles !== undefined
          ? Number(feat.distance_miles).toFixed(2)
          : (feat.isContaining ? '0.00' : '');
        const attributesJson = JSON.stringify(attrs);
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'FEMA National Risk Index (ArcGIS)',
          (location.confidence || 'N/A').toString(),
          'NRI_TORNADO_ANNUALIZED_FREQUENCY_COUNTY',
          `County (ID ${objectId})`,
          location.lat.toString(),
          location.lon.toString(),
          distance,
          'Natural Hazards',
          feat.isContaining ? 'Containing County' : `Nearby County (${distance} miles)`,
          '',
          attributesJson,
          'ArcGIS FeatureServer'
        ]);
      });
      return;
    }

    // NRI Tornado Annualized Frequency - Census Tract (polygons)
    if (key === 'nri_tornado_annualized_frequency_census_tract_all' && Array.isArray(value)) {
      value.forEach((feat: any) => {
        const attrs = feat?.attributes || feat || {};
        const objectId = attrs.OBJECTID || attrs.objectId || attrs.objectid || feat.objectId || 'Unknown';
        const distance = feat.distance_miles !== null && feat.distance_miles !== undefined
          ? Number(feat.distance_miles).toFixed(2)
          : (feat.isContaining ? '0.00' : '');
        const attributesJson = JSON.stringify(attrs);
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'FEMA National Risk Index (ArcGIS)',
          (location.confidence || 'N/A').toString(),
          'NRI_TORNADO_ANNUALIZED_FREQUENCY_CENSUS_TRACT',
          `Census Tract (ID ${objectId})`,
          location.lat.toString(),
          location.lon.toString(),
          distance,
          'Natural Hazards',
          feat.isContaining ? 'Containing Tract' : `Nearby Tract (${distance} miles)`,
          '',
          attributesJson,
          'ArcGIS FeatureServer'
        ]);
      });
      return;
    }

    // NRI Earthquake Annualized Frequency - County (polygons)
    if (key === 'nri_earthquake_annualized_frequency_county_all' && Array.isArray(value)) {
      value.forEach((feat: any) => {
        const attrs = feat?.attributes || feat || {};
        const objectId = attrs.OBJECTID || attrs.objectId || attrs.objectid || feat.objectId || 'Unknown';
        const distance = feat.distance_miles !== null && feat.distance_miles !== undefined
          ? Number(feat.distance_miles).toFixed(2)
          : (feat.isContaining ? '0.00' : '');
        const attributesJson = JSON.stringify(attrs);
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'FEMA National Risk Index (ArcGIS)',
          (location.confidence || 'N/A').toString(),
          'NRI_EARTHQUAKE_ANNUALIZED_FREQUENCY_COUNTY',
          `County (ID ${objectId})`,
          location.lat.toString(),
          location.lon.toString(),
          distance,
          'Natural Hazards',
          feat.isContaining ? 'Containing County' : `Nearby County (${distance} miles)`,
          '',
          attributesJson,
          'ArcGIS FeatureServer'
        ]);
      });
      return;
    }

    // NRI Earthquake Annualized Frequency - Census Tract (polygons)
    if (key === 'nri_earthquake_annualized_frequency_census_tract_all' && Array.isArray(value)) {
      value.forEach((feat: any) => {
        const attrs = feat?.attributes || feat || {};
        const objectId = attrs.OBJECTID || attrs.objectId || attrs.objectid || feat.objectId || 'Unknown';
        const distance = feat.distance_miles !== null && feat.distance_miles !== undefined
          ? Number(feat.distance_miles).toFixed(2)
          : (feat.isContaining ? '0.00' : '');
        const attributesJson = JSON.stringify(attrs);
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'FEMA National Risk Index (ArcGIS)',
          (location.confidence || 'N/A').toString(),
          'NRI_EARTHQUAKE_ANNUALIZED_FREQUENCY_CENSUS_TRACT',
          `Census Tract (ID ${objectId})`,
          location.lat.toString(),
          location.lon.toString(),
          distance,
          'Natural Hazards',
          feat.isContaining ? 'Containing Tract' : `Nearby Tract (${distance} miles)`,
          '',
          attributesJson,
          'ArcGIS FeatureServer'
        ]);
      });
      return;
    }

    // NRI Drought Annualized Frequency - County (polygons)
    if (key === 'nri_drought_annualized_frequency_county_all' && Array.isArray(value)) {
      value.forEach((feat: any) => {
        const attrs = feat?.attributes || feat || {};
        const objectId = attrs.OBJECTID || attrs.objectId || attrs.objectid || feat.objectId || 'Unknown';
        const distance = feat.distance_miles !== null && feat.distance_miles !== undefined
          ? Number(feat.distance_miles).toFixed(2)
          : (feat.isContaining ? '0.00' : '');
        const attributesJson = JSON.stringify(attrs);
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'FEMA National Risk Index (ArcGIS)',
          (location.confidence || 'N/A').toString(),
          'NRI_DROUGHT_ANNUALIZED_FREQUENCY_COUNTY',
          `County (ID ${objectId})`,
          location.lat.toString(),
          location.lon.toString(),
          distance,
          'Natural Hazards',
          feat.isContaining ? 'Containing County' : `Nearby County (${distance} miles)`,
          '',
          attributesJson,
          'ArcGIS FeatureServer'
        ]);
      });
      return;
    }

    // NRI Drought Annualized Frequency - Census Tract (polygons)
    if (key === 'nri_drought_annualized_frequency_census_tract_all' && Array.isArray(value)) {
      value.forEach((feat: any) => {
        const attrs = feat?.attributes || feat || {};
        const objectId = attrs.OBJECTID || attrs.objectId || attrs.objectid || feat.objectId || 'Unknown';
        const distance = feat.distance_miles !== null && feat.distance_miles !== undefined
          ? Number(feat.distance_miles).toFixed(2)
          : (feat.isContaining ? '0.00' : '');
        const attributesJson = JSON.stringify(attrs);
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'FEMA National Risk Index (ArcGIS)',
          (location.confidence || 'N/A').toString(),
          'NRI_DROUGHT_ANNUALIZED_FREQUENCY_CENSUS_TRACT',
          `Census Tract (ID ${objectId})`,
          location.lat.toString(),
          location.lon.toString(),
          distance,
          'Natural Hazards',
          feat.isContaining ? 'Containing Tract' : `Nearby Tract (${distance} miles)`,
          '',
          attributesJson,
          'ArcGIS FeatureServer'
        ]);
      });
      return;
    }

    // NRI Wildfire Annualized Frequency - County (polygons)
    if (key === 'nri_wildfire_annualized_frequency_county_all' && Array.isArray(value)) {
      value.forEach((feat: any) => {
        const attrs = feat?.attributes || feat || {};
        const objectId = attrs.OBJECTID || attrs.objectId || attrs.objectid || feat.objectId || 'Unknown';
        const distance = feat.distance_miles !== null && feat.distance_miles !== undefined
          ? Number(feat.distance_miles).toFixed(2)
          : (feat.isContaining ? '0.00' : '');
        const attributesJson = JSON.stringify(attrs);
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'FEMA National Risk Index (ArcGIS)',
          (location.confidence || 'N/A').toString(),
          'NRI_WILDFIRE_ANNUALIZED_FREQUENCY_COUNTY',
          `County (ID ${objectId})`,
          location.lat.toString(),
          location.lon.toString(),
          distance,
          'Natural Hazards',
          feat.isContaining ? 'Containing County' : `Nearby County (${distance} miles)`,
          '',
          attributesJson,
          'ArcGIS FeatureServer'
        ]);
      });
      return;
    }

    // NRI Wildfire Annualized Frequency - Census Tract (polygons)
    if (key === 'nri_wildfire_annualized_frequency_census_tract_all' && Array.isArray(value)) {
      value.forEach((feat: any) => {
        const attrs = feat?.attributes || feat || {};
        const objectId = attrs.OBJECTID || attrs.objectId || attrs.objectid || feat.objectId || 'Unknown';
        const distance = feat.distance_miles !== null && feat.distance_miles !== undefined
          ? Number(feat.distance_miles).toFixed(2)
          : (feat.isContaining ? '0.00' : '');
        const attributesJson = JSON.stringify(attrs);
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'FEMA National Risk Index (ArcGIS)',
          (location.confidence || 'N/A').toString(),
          'NRI_WILDFIRE_ANNUALIZED_FREQUENCY_CENSUS_TRACT',
          `Census Tract (ID ${objectId})`,
          location.lat.toString(),
          location.lon.toString(),
          distance,
          'Natural Hazards',
          feat.isContaining ? 'Containing Tract' : `Nearby Tract (${distance} miles)`,
          '',
          attributesJson,
          'ArcGIS FeatureServer'
        ]);
      });
      return;
    }

    // Helper function to add NRI Annualized Frequency CSV rows
    const addNriAfreqRows = (keyPrefix: string, layerType: 'County' | 'Census Tract') => {
      const countyKey = `${keyPrefix}_county_all`;
      const tractKey = `${keyPrefix}_census_tract_all`;
      const targetKey = layerType === 'County' ? countyKey : tractKey;
      const codePrefix = keyPrefix.toUpperCase().replace(/_/g, '_');
      const codeSuffix = layerType === 'County' ? 'COUNTY' : 'CENSUS_TRACT';
      const entityName = layerType === 'County' ? 'County' : 'Census Tract';
      const containingText = layerType === 'County' ? 'Containing County' : 'Containing Tract';
      const nearbyText = layerType === 'County' ? 'Nearby County' : 'Nearby Tract';

      if (key === targetKey && Array.isArray(value)) {
        value.forEach((feat: any) => {
          const attrs = feat?.attributes || feat || {};
          const objectId = attrs.OBJECTID || attrs.objectId || attrs.objectid || feat.objectId || 'Unknown';
          const distance = feat.distance_miles !== null && feat.distance_miles !== undefined
            ? Number(feat.distance_miles).toFixed(2)
            : (feat.isContaining ? '0.00' : '');
          const attributesJson = JSON.stringify(attrs);
          rows.push([
            location.name,
            location.lat.toString(),
            location.lon.toString(),
            'FEMA National Risk Index (ArcGIS)',
            (location.confidence || 'N/A').toString(),
            `NRI_${codePrefix}_${codeSuffix}`,
            `${entityName} (ID ${objectId})`,
            location.lat.toString(),
            location.lon.toString(),
            distance,
            'Natural Hazards',
            feat.isContaining ? containingText : `${nearbyText} (${distance} miles)`,
            '',
            attributesJson,
            'ArcGIS FeatureServer'
          ]);
        });
        return true;
      }
      return false;
    };

    // Add all 24 new NRI Annualized Frequency layers
    if (addNriAfreqRows('nri_lightning_annualized_frequency', 'County')) return;
    if (addNriAfreqRows('nri_lightning_annualized_frequency', 'Census Tract')) return;
    if (addNriAfreqRows('nri_ice_storm_annualized_frequency', 'County')) return;
    if (addNriAfreqRows('nri_ice_storm_annualized_frequency', 'Census Tract')) return;
    if (addNriAfreqRows('nri_coastal_flooding_annualized_frequency', 'County')) return;
    if (addNriAfreqRows('nri_coastal_flooding_annualized_frequency', 'Census Tract')) return;
    if (addNriAfreqRows('nri_riverine_flooding_annualized_frequency', 'County')) return;
    if (addNriAfreqRows('nri_riverine_flooding_annualized_frequency', 'Census Tract')) return;
    if (addNriAfreqRows('nri_landslide_annualized_frequency', 'County')) return;
    if (addNriAfreqRows('nri_landslide_annualized_frequency', 'Census Tract')) return;
    if (addNriAfreqRows('nri_strong_wind_annualized_frequency', 'County')) return;
    if (addNriAfreqRows('nri_strong_wind_annualized_frequency', 'Census Tract')) return;
    if (addNriAfreqRows('nri_winter_weather_annualized_frequency', 'County')) return;
    if (addNriAfreqRows('nri_winter_weather_annualized_frequency', 'Census Tract')) return;
    if (addNriAfreqRows('nri_cold_wave_annualized_frequency', 'County')) return;
    if (addNriAfreqRows('nri_cold_wave_annualized_frequency', 'Census Tract')) return;
    if (addNriAfreqRows('nri_heat_wave_annualized_frequency', 'County')) return;
    if (addNriAfreqRows('nri_heat_wave_annualized_frequency', 'Census Tract')) return;
    if (addNriAfreqRows('nri_avalanche_annualized_frequency', 'County')) return;
    if (addNriAfreqRows('nri_avalanche_annualized_frequency', 'Census Tract')) return;
    if (addNriAfreqRows('nri_tsunami_annualized_frequency', 'County')) return;
    if (addNriAfreqRows('nri_tsunami_annualized_frequency', 'Census Tract')) return;
    if (addNriAfreqRows('nri_volcanic_activity_annualized_frequency', 'County')) return;
    if (addNriAfreqRows('nri_volcanic_activity_annualized_frequency', 'Census Tract')) return;

    // Add all 24 new NRI Census Tract Risk Index Rating and Expected Annual Loss Rating layers
    if (addNriAfreqRows('nri_avalanche_hazard_type_risk_index_rating', 'Census Tract')) return;
    if (addNriAfreqRows('nri_coastal_flooding_expected_annual_loss_rating', 'Census Tract')) return;
    if (addNriAfreqRows('nri_coastal_flooding_hazard_type_risk_index_rating', 'Census Tract')) return;
    if (addNriAfreqRows('nri_cold_wave_expected_annual_loss_rating', 'Census Tract')) return;
    if (addNriAfreqRows('nri_cold_wave_hazard_type_risk_index_rating', 'Census Tract')) return;
    if (addNriAfreqRows('nri_drought_expected_annual_loss_rating', 'Census Tract')) return;
    if (addNriAfreqRows('nri_drought_hazard_type_risk_index_rating', 'Census Tract')) return;
    if (addNriAfreqRows('nri_earthquake_expected_annual_loss_rating', 'Census Tract')) return;
    if (addNriAfreqRows('nri_earthquake_hazard_type_risk_index_rating', 'Census Tract')) return;
    if (addNriAfreqRows('nri_expected_annual_loss_rating_composite', 'Census Tract')) return;
    if (addNriAfreqRows('nri_hail_expected_annual_loss_rating', 'Census Tract')) return;
    if (addNriAfreqRows('nri_hail_hazard_type_risk_index_rating', 'Census Tract')) return;
    if (addNriAfreqRows('nri_heat_wave_expected_annual_loss_rating', 'Census Tract')) return;
    if (addNriAfreqRows('nri_heat_wave_hazard_type_risk_index_rating', 'Census Tract')) return;
    if (addNriAfreqRows('nri_ice_storm_expected_annual_loss_rating', 'Census Tract')) return;
    if (addNriAfreqRows('nri_ice_storm_hazard_type_risk_index_rating', 'Census Tract')) return;
    if (addNriAfreqRows('nri_inland_flooding_expected_annual_loss_rating', 'Census Tract')) return;
    if (addNriAfreqRows('nri_inland_flooding_hazard_type_risk_index_rating', 'Census Tract')) return;
    if (addNriAfreqRows('nri_landslide_expected_annual_loss_rating', 'Census Tract')) return;
    if (addNriAfreqRows('nri_landslide_hazard_type_risk_index_rating', 'Census Tract')) return;
    if (addNriAfreqRows('nri_lightning_expected_annual_loss_rating', 'Census Tract')) return;
    if (addNriAfreqRows('nri_lightning_hazard_type_risk_index_rating', 'Census Tract')) return;
    if (addNriAfreqRows('nri_social_vulnerability_rating', 'Census Tract')) return;
    if (addNriAfreqRows('nri_strong_wind_expected_annual_loss_rating', 'Census Tract')) return;
    if (addNriAfreqRows('nri_strong_wind_hazard_type_risk_index_rating', 'Census Tract')) return;
    if (addNriAfreqRows('nri_tornado_expected_annual_loss_rating', 'Census Tract')) return;
    if (addNriAfreqRows('nri_tornado_hazard_type_risk_index_rating', 'Census Tract')) return;
    if (addNriAfreqRows('nri_tsunami_expected_annual_loss_rating', 'Census Tract')) return;
    if (addNriAfreqRows('nri_tsunami_hazard_type_risk_index_rating', 'Census Tract')) return;
    if (addNriAfreqRows('nri_volcanic_activity_expected_annual_loss_rating', 'Census Tract')) return;
    if (addNriAfreqRows('nri_volcanic_activity_hazard_type_risk_index_rating', 'Census Tract')) return;
    if (addNriAfreqRows('nri_wildfire_expected_annual_loss_rating', 'Census Tract')) return;
    if (addNriAfreqRows('nri_wildfire_hazard_type_risk_index_rating', 'Census Tract')) return;
    if (addNriAfreqRows('nri_winter_weather_expected_annual_loss_rating', 'Census Tract')) return;
    if (addNriAfreqRows('nri_winter_weather_hazard_type_risk_index_rating', 'Census Tract')) return;
    if (addNriAfreqRows('nri_avalanche_expected_annual_loss_rating', 'County')) return;
    if (addNriAfreqRows('nri_avalanche_hazard_type_risk_index_rating', 'County')) return;
    if (addNriAfreqRows('nri_coastal_flooding_expected_annual_loss_rating', 'County')) return;
    if (addNriAfreqRows('nri_coastal_flooding_hazard_type_risk_index_rating', 'County')) return;
    if (addNriAfreqRows('nri_cold_wave_expected_annual_loss_rating', 'County')) return;
    if (addNriAfreqRows('nri_cold_wave_hazard_type_risk_index_rating', 'County')) return;
    if (addNriAfreqRows('nri_community_resilience_rating', 'County')) return;
    if (addNriAfreqRows('nri_drought_expected_annual_loss_rating', 'County')) return;
    if (addNriAfreqRows('nri_drought_hazard_type_risk_index_rating', 'County')) return;
    if (addNriAfreqRows('nri_earthquake_expected_annual_loss_rating', 'County')) return;
    if (addNriAfreqRows('nri_earthquake_hazard_type_risk_index_rating', 'County')) return;
    if (addNriAfreqRows('nri_hail_expected_annual_loss_rating', 'County')) return;
    if (addNriAfreqRows('nri_hail_hazard_type_risk_index_rating', 'County')) return;
    if (addNriAfreqRows('nri_heat_wave_expected_annual_loss_rating', 'County')) return;
    if (addNriAfreqRows('nri_heat_wave_hazard_type_risk_index_rating', 'County')) return;
    if (addNriAfreqRows('nri_hurricane_expected_annual_loss_rating', 'County')) return;
    if (addNriAfreqRows('nri_hurricane_hazard_type_risk_index_rating', 'County')) return;
    if (addNriAfreqRows('nri_ice_storm_expected_annual_loss_rating', 'County')) return;
    if (addNriAfreqRows('nri_ice_storm_hazard_type_risk_index_rating', 'County')) return;
    if (addNriAfreqRows('nri_inland_flooding_expected_annual_loss_rating', 'County')) return;
    if (addNriAfreqRows('nri_inland_flooding_hazard_type_risk_index_rating', 'County')) return;
    if (addNriAfreqRows('nri_landslide_expected_annual_loss_rating', 'County')) return;
    if (addNriAfreqRows('nri_landslide_hazard_type_risk_index_rating', 'County')) return;
    if (addNriAfreqRows('nri_lightning_expected_annual_loss_rating', 'County')) return;
    if (addNriAfreqRows('nri_national_risk_index_rating_composite', 'County')) return;
    if (addNriAfreqRows('nri_strong_wind_expected_annual_loss_rating', 'County')) return;
    if (addNriAfreqRows('nri_strong_wind_hazard_type_risk_index_rating', 'County')) return;
    if (addNriAfreqRows('nri_tornado_expected_annual_loss_rating', 'County')) return;
    if (addNriAfreqRows('nri_tornado_hazard_type_risk_index_rating', 'County')) return;
    if (addNriAfreqRows('nri_tsunami_expected_annual_loss_rating', 'County')) return;
    if (addNriAfreqRows('nri_tsunami_hazard_type_risk_index_rating', 'County')) return;
    if (addNriAfreqRows('nri_volcanic_activity_expected_annual_loss_rating', 'County')) return;
    if (addNriAfreqRows('nri_volcanic_activity_hazard_type_risk_index_rating', 'County')) return;
    if (addNriAfreqRows('nri_wildfire_expected_annual_loss_rating', 'County')) return;
    if (addNriAfreqRows('nri_wildfire_hazard_type_risk_index_rating', 'County')) return;
    if (addNriAfreqRows('nri_winter_weather_expected_annual_loss_rating', 'County')) return;
    if (addNriAfreqRows('nri_winter_weather_hazard_type_risk_index_rating', 'County')) return;

    // Tornado Tracks 1950-2017 (polyline dataset) - export each track as its own row with full attributes
    if (key === 'tornado_tracks_1950_2017_all' && Array.isArray(value)) {
      value.forEach((track: any) => {
        const attrs = track?.attributes || track || {};
        const objectId = attrs.OBJECTID || attrs.objectId || attrs.objectid || track.objectId || track.objectid || 'Unknown';

        const year = attrs.yr ?? attrs.YR ?? attrs.Year ?? '';
        const mag = attrs.mag ?? attrs.MAG ?? attrs.Magnitude ?? '';
        const lenMiles = attrs.len ?? attrs.LEN ?? attrs.Length ?? '';
        const widthYds = attrs.wid ?? attrs.WID ?? attrs.Width ?? '';

        const startLat = attrs.slat ?? attrs.SLAT ?? '';
        const startLon = attrs.slon ?? attrs.SLON ?? '';
        const endLat = attrs.elat ?? attrs.ELAT ?? '';
        const endLon = attrs.elon ?? attrs.ELON ?? '';

        const distance = track.distance !== null && track.distance !== undefined
          ? Number(track.distance).toFixed(2)
          : '';

        const name = year
          ? `Tornado Track ${year} (ID ${objectId})`
          : `Tornado Track (ID ${objectId})`;

        const details = [
          mag !== '' ? `Mag: ${mag}` : null,
          lenMiles !== '' ? `Len(mi): ${lenMiles}` : null,
          widthYds !== '' ? `Wid(yd): ${widthYds}` : null,
          (startLat !== '' && startLon !== '' && endLat !== '' && endLon !== '') ? `Start: ${startLat},${startLon} End: ${endLat},${endLon}` : null,
        ].filter(Boolean).join(' | ');

        // Full attributes for analytics/debugging
        const attributesJson = JSON.stringify(attrs);

        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'ArcGIS (NOAA/SPC Tornado Tracks)',
          (location.confidence || 'N/A').toString(),
          'TORNADO_TRACKS_1950_2017',
          name,
          (startLat ?? '').toString(),
          (startLon ?? '').toString(),
          distance,
          'Natural Hazards',
          details,
          '',
          attributesJson,
          'ArcGIS FeatureServer'
        ]);
      });
      return;
    }

    // Handle PADUS nearby features arrays
    if ((key.includes('padus_public_access_nearby_features') || key.includes('padus_protection_status_nearby_features')) && Array.isArray(value)) {
      value.forEach((feature: any) => {
        const featureName = feature.Unit_Nm || feature.BndryName || feature.name || 'Unnamed Public Land';
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'PAD-US',
          (location.confidence || 'N/A').toString(),
          key.includes('public_access') ? 'PADUS_PUBLIC_ACCESS' : 'PADUS_PROTECTION_STATUS',
          featureName,
          '', // POI_Latitude
          '', // POI_Longitude
          '', // Distance_Miles
          feature.Category || feature.GAP_Sts || feature.IUCN_Cat || 'Public Land',
          feature.MngNm_Desc || feature.MngTp_Desc || '',
          '', // POI_Phone
          '', // POI_Website
          'PAD-US'
        ]);
      });
      return;
    }
    
    // Handle 2023 National Seismic Hazard Model
    if (key === 'national_seismic_hazard_2023_all' && Array.isArray(value)) {
      value.forEach((feature: any) => {
        const attrs = feature.attributes || feature;
        const objectId = attrs.OBJECTID || attrs.objectId || attrs.objectid || 'Unknown';
        
        // Map fields using csvMapping: hazard_zone: 'MMI', modified_mercalli_intensity: 'low_c', etc.
        const mmi = attrs.MMI || attrs.mmi || '';
        const modifiedMercalliIntensity = attrs.low_c || attrs.low_c || '';
        const range = attrs.range_cont || attrs.range || '';
        const low = attrs.low_cont || attrs.low || '';
        const high = attrs.high_cont || attrs.high || '';
        const valley = attrs.valley || '';
        const shapeArea = attrs.Shape__Area || attrs.Shape_Area || attrs.SHAPE__AREA || '';
        
        // Build a readable name/description
        const hazardZoneName = mmi ? `Seismic Hazard Zone - MMI: ${mmi}` : `Seismic Hazard Zone - ID: ${objectId}`;
        
        // Collect all attributes as JSON for full data access
        const allAttributes = { ...attrs };
        delete allAttributes.geometry;
        const attributesJson = JSON.stringify(allAttributes);
        
        // Calculate centroid for lat/lon if available
        let featureLat = '';
        let featureLon = '';
        if (feature.lat !== undefined && feature.lon !== undefined) {
          featureLat = feature.lat.toString();
          featureLon = feature.lon.toString();
        } else if (feature.geometry && feature.geometry.rings && feature.geometry.rings.length > 0) {
          // Calculate centroid from first ring
          const ring = feature.geometry.rings[0];
          if (ring && ring.length > 0) {
            let sumLat = 0, sumLon = 0, count = 0;
            ring.forEach((coord: any) => {
              if (Array.isArray(coord) && coord.length >= 2) {
                sumLon += coord[0];
                sumLat += coord[1];
                count++;
              }
            });
            if (count > 0) {
              featureLat = (sumLat / count).toString();
              featureLon = (sumLon / count).toString();
            }
          }
        }
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'USGS',
          (location.confidence || 'N/A').toString(),
          'NATIONAL_SEISMIC_HAZARD_2023',
          hazardZoneName,
          featureLat,
          featureLon,
          feature.containing ? '0' : '', // Distance is 0 for containing, empty for PIP only
          mmi || 'N/A', // POI_Category - use MMI as category
          `MMI: ${mmi || 'N/A'}, Modified Mercalli Intensity: ${modifiedMercalliIntensity || 'N/A'}, Range: ${range || 'N/A'}, Low: ${low || 'N/A'}, High: ${high || 'N/A'}${valley ? `, Valley: ${valley}` : ''}`, // POI_Address - use for key fields
          shapeArea ? `Area: ${shapeArea}` : '', // POI_Phone - use for area
          attributesJson, // POI_Website - full attributes JSON
          'USGS'
        ]);
      });
      return;
    }
    
    // Handle POI arrays: _all_pois, or _all (for gas stations, mail shipping, etc.)
    // Skip _detailed arrays - they're for map display only, use _all for CSV export
    if ((key.includes('_all_pois') || (key.endsWith('_all') && key.includes('poi_'))) && Array.isArray(value)) {
      // Handle ALL POI arrays (complete dataset for CSV)
      value.forEach((poi: any) => {
        // Special handling for AVI data
        if (key.includes('animal_vehicle_collisions')) {
          const aviName = `AVI-${poi.case_id || poi.id || 'Unknown'}`;
          const aviType = `${poi.source || 'AVI'} ${poi.year || ''}`.trim();
          rows.push([
            location.name,
            location.lat.toString(),
            location.lon.toString(),
            poi.source || 'N/A',
            (location.confidence || 'N/A').toString(),
            'ANIMAL_VEHICLE_COLLISION',
            aviName,
            poi.lat || '',
            poi.lon || '',
            poi.distance_miles || 'Unknown',
            aviType,
            poi.location || poi.address || '',
            '',
            '',
            poi.source || 'N/A'
          ]);
        } else {
          // Regular POI handling - extract POI type from key
          const poiType = key
            .replace('_all_pois', '')
            .replace('_detailed', '')
            .replace('_all', '')
            .replace('poi_', '')
            .toUpperCase()
            .replace(/_/g, ' ');
          
          // Get source - prefer specific source, otherwise default to OpenStreetMap
          const source = poi.source || 'OpenStreetMap';
          
          // Extract name, coordinates, and other details
          const poiName = poi.name || poi.title || poi.tags?.name || poi.tags?.brand || 'Unnamed';
          const poiLat = poi.lat || poi.center?.lat || '';
          const poiLon = poi.lon || poi.center?.lon || '';
          const distance = poi.distance_miles !== null && poi.distance_miles !== undefined ? poi.distance_miles.toString() : 'Unknown';
          const poiCategory = poi.tags?.amenity || poi.tags?.shop || poi.tags?.tourism || poi.type || 'POI';
          const poiAddress = poi.tags?.['addr:street'] || poi.address || poi.tags?.['addr:full'] || '';
          const poiPhone = poi.tags?.phone || poi.phone || '';
          const poiWebsite = poi.tags?.website || poi.website || '';
          
          rows.push([
            location.name,
            location.lat.toString(),
            location.lon.toString(),
            source,
            (location.confidence || 'N/A').toString(),
            poiType,
            poiName,
            poiLat.toString(),
            poiLon.toString(),
            distance,
            poiCategory,
            poiAddress,
            poiPhone,
            poiWebsite,
            source
          ]);
        }
      });
    } else if (key === 'poi_wikipedia_articles' && Array.isArray(value)) {
      // Handle Wikipedia articles
      value.forEach((article: any) => {
        const articleLat = article.lat !== null && article.lat !== undefined ? article.lat.toString() : location.lat.toString();
        const articleLon = article.lon !== null && article.lon !== undefined ? article.lon.toString() : location.lon.toString();
        const distanceMiles = article.distance_miles !== null && article.distance_miles !== undefined ? article.distance_miles.toString() : '0';
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'Wikipedia',
          (location.confidence || 'N/A').toString(),
          'WIKIPEDIA_ARTICLE',
          article.title || 'Unnamed Article',
          articleLat,
          articleLon,
          distanceMiles,
          'WIKIPEDIA',
          '',
          '',
          article.url || '',
          'Wikipedia'
        ]);
      });
    } else if (key === 'nh_parcels_all' && Array.isArray(value)) {
      // Handle NH Parcels - each parcel gets its own row with all attributes
      value.forEach((parcel: any) => {
        // Extract parcel ID and type
        const parcelId = parcel.parcelId || parcel.PARCELID || parcel.parcelid || parcel.OBJECTID || parcel.objectid || 'Unknown';
        const parcelType = parcel.isContaining ? 'Containing Parcel' : 'Nearby Parcel';
        
        // Extract common parcel attributes that might be useful
        const ownerName = parcel.OWNER || parcel.owner || parcel.OWNER_NAME || parcel.owner_name || '';
        const address = parcel.ADDRESS || parcel.address || parcel.SITE_ADDR || parcel.site_addr || '';
        const city = parcel.CITY || parcel.city || parcel.MUNICIPALITY || parcel.municipality || '';
        const state = parcel.STATE || parcel.state || 'NH';
        const zip = parcel.ZIP || parcel.zip || parcel.ZIP_CODE || parcel.zip_code || '';
        const fullAddress = [address, city, state, zip].filter(Boolean).join(', ');
        
        // Collect all other attributes as a JSON string for full data access
        const allAttributes = { ...parcel };
        delete allAttributes.parcelId;
        delete allAttributes.isContaining;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NH GRANIT',
          (location.confidence || 'N/A').toString(),
          'NH_PARCEL',
          `${parcelType} - ${parcelId}`,
          location.lat.toString(),
          location.lon.toString(),
          parcel.distance_miles !== null && parcel.distance_miles !== undefined ? parcel.distance_miles.toString() : (parcel.isContaining ? '0' : ''),
          'NH GRANIT',
          fullAddress || attributesJson, // Use address if available, otherwise full JSON
          ownerName,
          '', // Phone (not applicable for parcels)
          attributesJson, // Full attributes in Website field for easy access
          'NH GRANIT'
        ]);
      });
    } else if (key === 'ma_parcels_all' && Array.isArray(value)) {
      // Handle MA Parcels - each parcel gets its own row with all attributes
      value.forEach((parcel: any) => {
        // Extract parcel ID and type
        const parcelId = parcel.parcelId || parcel.MAP_PAR_ID || parcel.map_par_id || parcel.PROP_ID || parcel.prop_id || parcel.OBJECTID || parcel.objectid || 'Unknown';
        const parcelType = parcel.isContaining ? 'Containing Parcel' : 'Nearby Parcel';
        
        // Extract common parcel attributes that might be useful
        const ownerName = parcel.OWNER1 || parcel.owner1 || parcel.OWNER || parcel.owner || '';
        const address = parcel.SITE_ADDR || parcel.site_addr || parcel.ADDRESS || parcel.address || '';
        const city = parcel.CITY || parcel.city || '';
        const state = parcel.STATE || parcel.state || 'MA';
        const zip = parcel.ZIP || parcel.zip || '';
        const fullAddress = [address, city, state, zip].filter(Boolean).join(', ');
        
        // Collect all other attributes as a JSON string for full data access
        const allAttributes = { ...parcel };
        delete allAttributes.parcelId;
        delete allAttributes.isContaining;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'MassGIS',
          (location.confidence || 'N/A').toString(),
          'MA_PARCEL',
          `${parcelType} - ${parcelId}`,
          location.lat.toString(),
          location.lon.toString(),
          parcel.distance_miles !== null && parcel.distance_miles !== undefined ? parcel.distance_miles.toFixed(2) : (parcel.isContaining ? '0.00' : ''),
          parcelType,
          fullAddress || attributesJson, // Use address if available, otherwise full JSON
          ownerName || '', // Owner
          '', // Phone (not applicable for parcels)
          attributesJson, // Full attributes in Website field for easy access
          'MassGIS'
        ]);
      });
    } else if (key === 'de_parcels_all' && Array.isArray(value)) {
      // Handle DE Parcels - each parcel gets its own row with all attributes
      value.forEach((parcel: any) => {
        const parcelId = parcel.parcelId || parcel.PIN || parcel.pin || parcel.OBJECTID || parcel.objectid || 'Unknown';
        const parcelType = parcel.isContaining ? 'Containing Parcel' : 'Nearby Parcel';
        
        const pin = parcel.PIN || parcel.pin || '';
        const acres = parcel.ACRES || parcel.acres || null;
        const county = parcel.COUNTY || parcel.county || '';
        
        const allAttributes = { ...parcel };
        delete allAttributes.parcelId;
        delete allAttributes.isContaining;
        delete allAttributes.distance_miles;
        delete allAttributes.geometry;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'DE FirstMap',
          (location.confidence || 'N/A').toString(),
          'DE_PARCEL',
          `${parcelType} - ${parcelId}`,
          location.lat.toString(),
          location.lon.toString(),
          parcel.distance_miles !== null && parcel.distance_miles !== undefined ? parcel.distance_miles.toFixed(2) : (parcel.isContaining ? '0.00' : ''),
          parcelType,
          `${pin ? `PIN: ${pin}` : ''}${county ? `${pin ? ', ' : ''}County: ${county}` : ''}${acres !== null ? `${pin || county ? ', ' : ''}Acres: ${acres.toFixed(2)}` : ''}` || attributesJson,
          '', // Owner (not in basic fields)
          '', // Phone (not applicable for parcels)
          attributesJson,
          'DE FirstMap'
        ]);
      });
    } else if (key === 'de_lulc_2007_all' && Array.isArray(value)) {
      value.forEach((lulc: any) => {
        const lulcCode = lulc.lulcCode || lulc.LULC_CODE2007 || null;
        const lulcCategory = lulc.lulcCategory || lulc.LULC_CATEGORY2007 || 'Unknown';
        const allAttributes = { ...lulc };
        delete allAttributes.lulcCode;
        delete allAttributes.lulcCategory;
        delete allAttributes.geometry;
        const attributesJson = JSON.stringify(allAttributes);
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(),
          'DE FirstMap', (location.confidence || 'N/A').toString(),
          'DE_LULC_2007', `${lulcCode !== null ? `Code ${lulcCode}: ` : ''}${lulcCategory}`,
          location.lat.toString(), location.lon.toString(), '0.00',
          lulcCategory, `${lulcCode !== null ? `Code: ${lulcCode}` : ''}` || attributesJson,
          '', '', attributesJson, 'DE FirstMap'
        ]);
      });
    } else if (key === 'de_lulc_2007_revised_all' && Array.isArray(value)) {
      value.forEach((lulc: any) => {
        const lulcCode = lulc.lulcCode || lulc.LULC_CODE2007 || null;
        const lulcCategory = lulc.lulcCategory || lulc.LULC_CATEGORY2007 || 'Unknown';
        const allAttributes = { ...lulc };
        delete allAttributes.lulcCode;
        delete allAttributes.lulcCategory;
        delete allAttributes.geometry;
        const attributesJson = JSON.stringify(allAttributes);
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(),
          'DE FirstMap', (location.confidence || 'N/A').toString(),
          'DE_LULC_2007_REVISED', `${lulcCode !== null ? `Code ${lulcCode}: ` : ''}${lulcCategory}`,
          location.lat.toString(), location.lon.toString(), '0.00',
          lulcCategory, `${lulcCode !== null ? `Code: ${lulcCode}` : ''}` || attributesJson,
          '', '', attributesJson, 'DE FirstMap'
        ]);
      });
    } else if (key === 'de_lulc_2012_all' && Array.isArray(value)) {
      value.forEach((lulc: any) => {
        const lulcCode = lulc.lulcCode || lulc.LULC_CODE2012 || null;
        const lulcCategory = lulc.lulcCategory || lulc.LULC_CATEGORY2012 || 'Unknown';
        const allAttributes = { ...lulc };
        delete allAttributes.lulcCode;
        delete allAttributes.lulcCategory;
        delete allAttributes.geometry;
        const attributesJson = JSON.stringify(allAttributes);
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(),
          'DE FirstMap', (location.confidence || 'N/A').toString(),
          'DE_LULC_2012', `${lulcCode !== null ? `Code ${lulcCode}: ` : ''}${lulcCategory}`,
          location.lat.toString(), location.lon.toString(), '0.00',
          lulcCategory, `${lulcCode !== null ? `Code: ${lulcCode}` : ''}` || attributesJson,
          '', '', attributesJson, 'DE FirstMap'
        ]);
      });
    } else if (key === 'de_lulc_2017_all' && Array.isArray(value)) {
      value.forEach((lulc: any) => {
        const lulcCode = lulc.lulcCode || lulc.LULC_CODE2017 || null;
        const lulcCategory = lulc.lulcCategory || lulc.LULC_CATEGORY2017 || 'Unknown';
        const allAttributes = { ...lulc };
        delete allAttributes.lulcCode;
        delete allAttributes.lulcCategory;
        delete allAttributes.geometry;
        const attributesJson = JSON.stringify(allAttributes);
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(),
          'DE FirstMap', (location.confidence || 'N/A').toString(),
          'DE_LULC_2017', `${lulcCode !== null ? `Code ${lulcCode}: ` : ''}${lulcCategory}`,
          location.lat.toString(), location.lon.toString(), '0.00',
          lulcCategory, `${lulcCode !== null ? `Code: ${lulcCode}` : ''}` || attributesJson,
          '', '', attributesJson, 'DE FirstMap'
        ]);
      });
    } else if (key === 'de_lulc_2022_all' && Array.isArray(value)) {
      value.forEach((lulc: any) => {
        const lulcCode = lulc.lulcCode || lulc.LULC_CODE2022 || null;
        const lulcCategory = lulc.lulcCategory || lulc.LULC_CATEGORY2022 || 'Unknown';
        const allAttributes = { ...lulc };
        delete allAttributes.lulcCode;
        delete allAttributes.lulcCategory;
        delete allAttributes.geometry;
        const attributesJson = JSON.stringify(allAttributes);
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(),
          'DE FirstMap', (location.confidence || 'N/A').toString(),
          'DE_LULC_2022', `${lulcCode !== null ? `Code ${lulcCode}: ` : ''}${lulcCategory}`,
          location.lat.toString(), location.lon.toString(), '0.00',
          lulcCategory, `${lulcCode !== null ? `Code: ${lulcCode}` : ''}` || attributesJson,
          '', '', attributesJson, 'DE FirstMap'
        ]);
      });
    } else if (key === 'ct_building_footprints_all' && Array.isArray(value)) {
      // Handle CT Building Footprints - each building gets its own row with all attributes
      value.forEach((building: any) => {
        // Extract building ID and type
        const buildingId = building.buildingId || building.OBJECTID || building.objectid || building.OBJECTID_1 || 'Unknown';
        const buildingType = building.isContaining ? 'Containing Building' : 'Nearby Building';
        
        // Extract common building attributes
        const municipality = building.Municipality || building.municipality || '';
        const county = building.County || building.county || '';
        const planningRegion = building.PlanningRegion || building.planningRegion || building.Planning_Region || '';
        
        // Collect all other attributes as a JSON string for full data access
        const allAttributes = { ...building };
        delete allAttributes.buildingId;
        delete allAttributes.isContaining;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'CT Geodata Portal',
          (location.confidence || 'N/A').toString(),
          'CT_BUILDING_FOOTPRINT',
          `${buildingType} - ${buildingId}`,
          location.lat.toString(),
          location.lon.toString(),
          building.distance_miles !== null && building.distance_miles !== undefined ? building.distance_miles.toFixed(2) : (building.isContaining ? '0.00' : ''),
          buildingType,
          municipality || county || planningRegion || attributesJson, // Use location info if available, otherwise full JSON
          '', // Owner (not applicable for buildings)
          '', // Phone (not applicable for buildings)
          attributesJson, // Full attributes in Website field for easy access
          'CT Geodata Portal'
        ]);
      });
    } else if (key === 'ct_roads_all' && Array.isArray(value)) {
      // Handle CT Roads and Trails - each road/trail gets its own row with all attributes
      value.forEach((road: any) => {
        const roadClass = road.roadClass || road.ROAD_CLASS || road.RoadClass || 'Unknown Road';
        const avLegend = road.avLegend || road.AV_LEGEND || road.AvLegend || '';
        const imsLegend = road.imsLegend || road.IMS_LEGEND || road.ImsLegend || '';
        const lengthMiles = road.lengthMiles !== null && road.lengthMiles !== undefined ? road.lengthMiles : (road.LENGTH_MI !== undefined ? road.LENGTH_MI : null);
        
        const allAttributes = { ...road };
        delete allAttributes.roadClass;
        delete allAttributes.ROAD_CLASS;
        delete allAttributes.RoadClass;
        delete allAttributes.avLegend;
        delete allAttributes.AV_LEGEND;
        delete allAttributes.AvLegend;
        delete allAttributes.imsLegend;
        delete allAttributes.IMS_LEGEND;
        delete allAttributes.ImsLegend;
        delete allAttributes.lengthMiles;
        delete allAttributes.LENGTH_MI;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'CT Geodata Portal',
          (location.confidence || 'N/A').toString(),
          'CT_ROAD',
          roadClass,
          location.lat.toString(), // Use search location for road (it's a line, not a point)
          location.lon.toString(),
          road.distance_miles !== null && road.distance_miles !== undefined ? road.distance_miles.toFixed(2) : '',
          avLegend || imsLegend || 'Road/Trail',
          lengthMiles !== null ? `${lengthMiles.toFixed(2)} miles` : attributesJson,
          '',
          '',
          attributesJson,
          'CT Geodata Portal'
        ]);
      });
    } else if (key === 'ct_deep_properties_all' && Array.isArray(value)) {
      // Handle CT DEEP Properties - each property gets its own row with all attributes
      value.forEach((property: any) => {
        const propertyName = property.propertyName || property.PROPERTY || property.property || 'Unknown Property';
        const propertyType = property.isContaining ? 'Containing Property' : 'Nearby Property';
        const avLegend = property.avLegend || property.AV_LEGEND || property.AvLegend || '';
        const imsLegend = property.imsLegend || property.IMS_LEGEND || property.ImsLegend || '';
        const depId = property.depId || property.DEP_ID || property.dep_id || '';
        const agencyFunctionCode = property.agencyFunctionCode || property.AGNCYFN_CD || property.agncyfn_cd || '';
        const acreage = property.acreage !== null && property.acreage !== undefined ? property.acreage : (property.ACRE_GIS !== undefined ? property.ACRE_GIS : null);
        
        const allAttributes = { ...property };
        delete allAttributes.propertyId;
        delete allAttributes.propertyName;
        delete allAttributes.PROPERTY;
        delete allAttributes.property;
        delete allAttributes.isContaining;
        delete allAttributes.avLegend;
        delete allAttributes.AV_LEGEND;
        delete allAttributes.AvLegend;
        delete allAttributes.imsLegend;
        delete allAttributes.IMS_LEGEND;
        delete allAttributes.ImsLegend;
        delete allAttributes.depId;
        delete allAttributes.DEP_ID;
        delete allAttributes.agencyFunctionCode;
        delete allAttributes.AGNCYFN_CD;
        delete allAttributes.acreage;
        delete allAttributes.ACRE_GIS;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'CT Geodata Portal',
          (location.confidence || 'N/A').toString(),
          'CT_DEEP_PROPERTY',
          `${propertyType} - ${propertyName}`,
          location.lat.toString(),
          location.lon.toString(),
          property.distance_miles !== null && property.distance_miles !== undefined ? property.distance_miles.toFixed(2) : (property.isContaining ? '0.00' : ''),
          avLegend || imsLegend || 'CT DEEP Property',
          `${propertyName}${depId ? ` (DEP ID: ${depId})` : ''}${agencyFunctionCode ? ` [${agencyFunctionCode}]` : ''}${acreage !== null ? ` - ${acreage.toFixed(2)} acres` : ''}`,
          '', // Phone (not applicable)
          attributesJson, // Full attributes in Website field
          'CT Geodata Portal'
        ]);
      });
    } else if (key === 'ct_tribal_lands_all' && Array.isArray(value)) {
      // Handle CT Tribal Lands - each tribal land gets its own row with all attributes
      value.forEach((tribalLand: any) => {
        const name = tribalLand.name || tribalLand.NAME || 'Unknown Tribal Land';
        const nameLsad = tribalLand.nameLsad || tribalLand.NAMELSAD || name;
        const recognitionType = tribalLand.recognitionType || '';
        const featureType = tribalLand.isContaining ? 'Containing Tribal Land' : 'Nearby Tribal Land';
        
        const allAttributes = { ...tribalLand };
        delete allAttributes.tribalLandId;
        delete allAttributes.name;
        delete allAttributes.NAME;
        delete allAttributes.nameLsad;
        delete allAttributes.NAMELSAD;
        delete allAttributes.recognitionType;
        delete allAttributes.isContaining;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'CT Geodata Portal',
          (location.confidence || 'N/A').toString(),
          'CT_TRIBAL_LAND',
          `${featureType} - ${name}`,
          location.lat.toString(),
          location.lon.toString(),
          tribalLand.distance_miles !== null && tribalLand.distance_miles !== undefined ? tribalLand.distance_miles.toFixed(2) : (tribalLand.isContaining ? '0.00' : ''),
          recognitionType || 'Tribal Land',
          `${name}${nameLsad && nameLsad !== name ? ` (${nameLsad})` : ''}${recognitionType ? ` - ${recognitionType}` : ''}`,
          '', // Phone (not applicable)
          attributesJson, // Full attributes in Website field
          'CT Geodata Portal'
        ]);
      });
    } else if (key === 'ct_drinking_water_watersheds_all' && Array.isArray(value)) {
      // Handle CT Drinking Water Watersheds - each watershed gets its own row with all attributes
      value.forEach((watershed: any) => {
        const pwsName = watershed.pwsName || watershed.pws_name || watershed.PWS_NAME || 'Unknown Watershed';
        const pwsId = watershed.pwsId || watershed.pws_id || watershed.PWS_ID || '';
        const shed = watershed.shed || watershed.SHED || '';
        const status = watershed.status || watershed.STATUS || '';
        const acres = watershed.acres !== null && watershed.acres !== undefined ? watershed.acres : null;
        const featureType = watershed.isContaining ? 'Containing Watershed' : 'Nearby Watershed';
        
        const allAttributes = { ...watershed };
        delete allAttributes.watershedId;
        delete allAttributes.pwsName;
        delete allAttributes.pws_name;
        delete allAttributes.PWS_NAME;
        delete allAttributes.pwsId;
        delete allAttributes.pws_id;
        delete allAttributes.PWS_ID;
        delete allAttributes.shed;
        delete allAttributes.SHED;
        delete allAttributes.status;
        delete allAttributes.STATUS;
        delete allAttributes.acres;
        delete allAttributes.ACRES;
        delete allAttributes.st_area_sh;
        delete allAttributes.ST_AREA_SH;
        delete allAttributes.isContaining;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'CT Geodata Portal',
          (location.confidence || 'N/A').toString(),
          'CT_DRINKING_WATER_WATERSHED',
          `${featureType} - ${pwsName}`,
          location.lat.toString(),
          location.lon.toString(),
          watershed.distance_miles !== null && watershed.distance_miles !== undefined ? watershed.distance_miles.toFixed(2) : (watershed.isContaining ? '0.00' : ''),
          status || 'Drinking Water Watershed',
          `${pwsName}${pwsId ? ` (PWS ID: ${pwsId})` : ''}${shed ? ` - ${shed}` : ''}${acres !== null ? ` - ${acres.toFixed(2)} acres` : ''}`,
          '', // Phone (not applicable)
          attributesJson, // Full attributes in Website field
          'CT Geodata Portal'
        ]);
      });
    } else if (key === 'ct_broadband_availability_all' && Array.isArray(value)) {
      // Handle CT Broadband Availability - each block gets its own row with all attributes
      value.forEach((block: any) => {
        const blockName = block.blockName || block.block_name || block.BLOCK_NAME || 'Unknown Block';
        const blockGeoid = block.blockGeoid || block.block_geoid || block.BLOCK_GEOID || '';
        const featureType = block.isContaining ? 'Containing Block' : 'Nearby Block';
        const townName = block.townName || block.town_name || block.TOWN_NAME || '';
        const countyName = block.countyName || block.county_name || block.COUNTY_NAME || '';
        const pctUnserved = block.pctUnserved !== null && block.pctUnserved !== undefined ? block.pctUnserved : null;
        const maxDownload = block.maxDownload !== null && block.maxDownload !== undefined ? block.maxDownload : null;
        const nProviders = block.nProviders !== null && block.nProviders !== undefined ? block.nProviders : null;
        
        const allAttributes = { ...block };
        delete allAttributes.blockId;
        delete allAttributes.blockGeoid;
        delete allAttributes.block_geoid;
        delete allAttributes.BLOCK_GEOID;
        delete allAttributes.blockName;
        delete allAttributes.block_name;
        delete allAttributes.BLOCK_NAME;
        delete allAttributes.isContaining;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat,
          location.lon,
          '',
          'CT Broadband Availability',
          blockName,
          blockGeoid || '',
          townName || '',
          countyName || '',
          '',
          '',
          block.distance_miles !== null && block.distance_miles !== undefined ? block.distance_miles.toFixed(2) : (block.isContaining ? '0.00' : ''),
          featureType,
          `${blockName}${blockGeoid ? ` (GEOID: ${blockGeoid})` : ''}${townName ? ` - ${townName}` : ''}${countyName ? `, ${countyName}` : ''}${pctUnserved !== null ? ` - ${pctUnserved.toFixed(2)}% unserved` : ''}${maxDownload !== null ? ` - Max: ${maxDownload.toFixed(2)} Mbps` : ''}${nProviders !== null ? ` - ${nProviders} providers` : ''}`,
          '', // Phone (not applicable)
          attributesJson, // Full attributes in Website field
          'CT Geodata Portal'
        ]);
      });
    } else if (key === 'ct_water_pollution_control_all' && Array.isArray(value)) {
      // Handle CT Water Pollution Control Facilities - each facility gets its own row with all attributes
      value.forEach((facility: any) => {
        const facilityName = facility.facilityName || facility.FACILITY_Name || facility.facility_name || 'Unknown Facility';
        const permittee = facility.permittee || facility.Permitte || '';
        const address = facility.address || facility.FACILITY_Address || '';
        const city = facility.city || facility.TOWN || facility.town || '';
        const phone = facility.phone || facility.PHONE || '';
        const permitId = facility.permitId || facility.Permit_ID || '';
        const receivingWaterbody = facility.receivingWaterbody || facility.Receiving_Waterbody || '';
        
        const allAttributes = { ...facility };
        delete allAttributes.facilityId;
        delete allAttributes.facilityName;
        delete allAttributes.permittee;
        delete allAttributes.address;
        delete allAttributes.city;
        delete allAttributes.zip;
        delete allAttributes.phone;
        delete allAttributes.permitId;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.lat;
        delete allAttributes.lon;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat,
          location.lon,
          '',
          'CT Water Pollution Control',
          facilityName,
          permitId || '',
          city || '',
          '',
          '',
          '',
          facility.distance_miles !== null && facility.distance_miles !== undefined ? facility.distance_miles.toFixed(2) : '',
          'Water Pollution Control Facility',
          `${facilityName}${permittee ? ` - ${permittee}` : ''}${address ? ` - ${address}` : ''}${city ? `, ${city}` : ''}${receivingWaterbody ? ` - ${receivingWaterbody}` : ''}`,
          phone || '',
          attributesJson,
          'CT Geodata Portal'
        ]);
      });
    } else if (key === 'ct_boat_launches_all' && Array.isArray(value)) {
      // Handle CT Boat Launches - each launch gets its own row with all attributes
      value.forEach((launch: any) => {
        const name = launch.name || launch.NAME || launch.Name || 'Unknown Boat Launch';
        const address = launch.address || launch.ADDRESS || launch.Address || '';
        const city = launch.city || launch.CITY || launch.City || '';
        const state = launch.state || launch.STATE || launch.State || 'CT';
        const zip = launch.zip || launch.ZIP || launch.Zip || '';
        const phone = launch.phone || launch.PHONE || launch.Phone || '';
        
        const allAttributes = { ...launch };
        delete allAttributes.launchId;
        delete allAttributes.name;
        delete allAttributes.address;
        delete allAttributes.city;
        delete allAttributes.state;
        delete allAttributes.zip;
        delete allAttributes.phone;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.lat;
        delete allAttributes.lon;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat,
          location.lon,
          '',
          'CT Boat Launches',
          name,
          '',
          city || '',
          '',
          '',
          '',
          launch.distance_miles !== null && launch.distance_miles !== undefined ? launch.distance_miles.toFixed(2) : '',
          'Boat Launch',
          `${name}${address ? ` - ${address}` : ''}${city ? `, ${city}` : ''}${state ? ` ${state}` : ''}${zip ? ` ${zip}` : ''}`,
          phone || '',
          attributesJson,
          'CT Geodata Portal'
        ]);
      });
    } else if (key === 'ct_federal_open_space_all' && Array.isArray(value)) {
      // Handle CT Federal Open Space - each open space gets its own row with all attributes
      value.forEach((openSpace: any) => {
        const name = openSpace.name || openSpace.NAME || openSpace.Name || 'Unknown Open Space';
        const agency = openSpace.agency || openSpace.AGENCY || openSpace.Agency || '';
        const featureType = openSpace.isContaining ? 'Containing Open Space' : 'Nearby Open Space';
        
        const allAttributes = { ...openSpace };
        delete allAttributes.openSpaceId;
        delete allAttributes.name;
        delete allAttributes.agency;
        delete allAttributes.isContaining;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat,
          location.lon,
          '',
          'CT Federal Open Space',
          name,
          '',
          '',
          '',
          '',
          '',
          openSpace.distance_miles !== null && openSpace.distance_miles !== undefined ? openSpace.distance_miles.toFixed(2) : (openSpace.isContaining ? '0.00' : ''),
          featureType,
          `${name}${agency ? ` - ${agency}` : ''}`,
          '', // Phone (not applicable)
          attributesJson,
          'CT Geodata Portal'
        ]);
      });
    } else if (key === 'ct_huc_watersheds_all' && Array.isArray(value)) {
      // Handle CT HUC Watershed Boundaries - each watershed gets its own row with all attributes
      value.forEach((watershed: any) => {
        const huc12Name = watershed.huc12Name || watershed.HU_12_NAME || watershed.hu_12_name || null;
        const huc10Name = watershed.huc10Name || watershed.HU_10_NAME || watershed.hu_10_name || null;
        const huc12 = watershed.huc12 || watershed.HUC_12 || watershed.huc_12 || null;
        const huc10 = watershed.huc10 || watershed.HUC_10 || watershed.huc_10 || null;
        const huc8 = watershed.huc8 || watershed.HUC_8 || watershed.huc_8 || null;
        const watershedName = huc12Name || huc10Name || `HUC ${huc12 || huc10 || huc8 || 'Unknown'}`;
        const acres = watershed.acres !== null && watershed.acres !== undefined ? watershed.acres : (watershed.ACRES !== undefined ? watershed.ACRES : null);
        const states = watershed.states || watershed.STATES || '';
        
        const allAttributes = { ...watershed };
        delete allAttributes.watershedId;
        delete allAttributes.huc8;
        delete allAttributes.huc10;
        delete allAttributes.huc12;
        delete allAttributes.huc10Name;
        delete allAttributes.huc12Name;
        delete allAttributes.isContaining;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat,
          location.lon,
          '',
          'CT HUC Watershed Boundaries',
          watershedName,
          huc12 || '',
          '',
          '',
          '',
          '',
          '0.00', // Always containing, so distance is 0
          'Containing Watershed',
          `${watershedName}${huc12 ? ` (HUC-12: ${huc12})` : ''}${huc10 ? ` (HUC-10: ${huc10})` : ''}${huc8 ? ` (HUC-8: ${huc8})` : ''}${acres !== null ? ` - ${acres.toFixed(2)} acres` : ''}${states ? ` - ${states}` : ''}`,
          '', // Phone (not applicable)
          attributesJson,
          'CT Geodata Portal'
        ]);
      });
    } else if (key === 'ct_soils_parent_material_all' && Array.isArray(value)) {
      // Handle CT Soils Parent Material Name - each soil polygon gets its own row with all attributes
      value.forEach((soil: any) => {
        const parentMaterialName = soil.parentMaterialName || soil.ParMatNm || soil.parmatnm || 'Unknown Soil';
        const mukey = soil.mukey || soil.MUKEY || '';
        const musym = soil.musym || soil.MUSYM || '';
        const areaSymbol = soil.areaSymbol || soil.AREASYMBOL || soil.areasymbol || '';
        
        const allAttributes = { ...soil };
        delete allAttributes.soilId;
        delete allAttributes.parentMaterialName;
        delete allAttributes.ParMatNm;
        delete allAttributes.parmatnm;
        delete allAttributes.mukey;
        delete allAttributes.MUKEY;
        delete allAttributes.musym;
        delete allAttributes.MUSYM;
        delete allAttributes.areaSymbol;
        delete allAttributes.AREASYMBOL;
        delete allAttributes.areasymbol;
        delete allAttributes.isContaining;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat,
          location.lon,
          '',
          'CT Soils Parent Material',
          parentMaterialName,
          mukey || '',
          '',
          '',
          '',
          '',
          '0.00', // Always containing, so distance is 0
          'Containing Soil Polygon',
          `${parentMaterialName}${mukey ? ` (MUKEY: ${mukey})` : ''}${musym ? ` (MUSYM: ${musym})` : ''}${areaSymbol ? ` - Area: ${areaSymbol}` : ''}`,
          '', // Phone (not applicable)
          attributesJson,
          'CT Geodata Portal'
        ]);
      });
    } else if (key === 'ca_power_outage_areas_all' && Array.isArray(value)) {
      // Handle CA Power Outage Areas - each outage area gets its own row with all attributes
      value.forEach((outage: any) => {
        const incidentId = outage.incidentId || outage.IncidentId || outage.outageId || 'Unknown';
        const utilityCompany = outage.utilityCompany || outage.UtilityCompany || '';
        const outageStatus = outage.outageStatus || outage.OutageStatus || '';
        const outageType = outage.outageType || outage.OutageType || '';
        const impactedCustomers = outage.impactedCustomers !== null && outage.impactedCustomers !== undefined 
          ? outage.impactedCustomers 
          : (outage.ImpactedCustomers !== null && outage.ImpactedCustomers !== undefined 
            ? outage.ImpactedCustomers 
            : null);
        const county = outage.county || outage.County || '';
        const distance = outage.distance_miles !== null && outage.distance_miles !== undefined ? outage.distance_miles.toFixed(2) : '0.00';
        const statusText = outage.isContaining ? 'Containing Outage Area' : `Nearby Outage Area (${distance} miles)`;
        
        const allAttributes = { ...outage };
        delete allAttributes.outageId;
        delete allAttributes.incidentId;
        delete allAttributes.utilityCompany;
        delete allAttributes.outageStatus;
        delete allAttributes.outageType;
        delete allAttributes.impactedCustomers;
        delete allAttributes.county;
        delete allAttributes.cause;
        delete allAttributes.startDate;
        delete allAttributes.estimatedRestoreDate;
        delete allAttributes.isContaining;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat,
          location.lon,
          '',
          'CA Power Outage Areas',
          incidentId,
          utilityCompany || '',
          '',
          '',
          '',
          '',
          distance,
          statusText,
          `${incidentId}${utilityCompany ? ` - ${utilityCompany}` : ''}${outageStatus ? ` (${outageStatus})` : ''}${outageType ? ` - ${outageType}` : ''}${impactedCustomers !== null ? ` - ${impactedCustomers.toLocaleString()} customers` : ''}${county ? ` - ${county} County` : ''}`,
          '', // Phone (not applicable)
          attributesJson,
          'CA Open Data Portal'
        ]);
      });
    } else if (key === 'ca_fire_perimeters_all_all' && Array.isArray(value)) {
      // Handle CA Fire Perimeters (All) - each fire perimeter gets its own row with all attributes
      value.forEach((fire: any) => {
        const fireName = fire.fireName || fire.FIRE_NAME || fire.Name || fire.name || 'Unknown Fire';
        const fireYear = fire.fireYear !== null && fire.fireYear !== undefined ? fire.fireYear : (fire.YEAR_ !== null && fire.YEAR_ !== undefined ? fire.YEAR_ : null);
        const acres = fire.acres !== null && fire.acres !== undefined ? fire.acres : (fire.ACRES !== null && fire.ACRES !== undefined ? fire.ACRES : null);
        const distance = fire.distance_miles !== null && fire.distance_miles !== undefined ? fire.distance_miles.toFixed(2) : '0.00';
        const statusText = fire.isContaining ? 'Containing Fire Perimeter' : `Nearby Fire Perimeter (${distance} miles)`;
        
        const allAttributes = { ...fire };
        delete allAttributes.fireId;
        delete allAttributes.fireName;
        delete allAttributes.fireYear;
        delete allAttributes.acres;
        delete allAttributes.isContaining;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat,
          location.lon,
          '',
          'CA Fire Perimeters (All)',
          fireName,
          fireYear ? fireYear.toString() : '',
          '',
          '',
          '',
          '',
          distance,
          statusText,
          `${fireName}${fireYear ? ` (${fireYear})` : ''}${acres !== null ? ` - ${acres.toLocaleString(undefined, { maximumFractionDigits: 0 })} acres` : ''}`,
          '',
          attributesJson,
          'CA Open Data Portal'
        ]);
      });
    } else if (key === 'ca_fire_perimeters_recent_large_all' && Array.isArray(value)) {
      // Handle CA Recent Large Fire Perimeters - each fire perimeter gets its own row with all attributes
      value.forEach((fire: any) => {
        const fireName = fire.fireName || fire.FIRE_NAME || fire.Name || fire.name || 'Unknown Fire';
        const fireYear = fire.fireYear !== null && fire.fireYear !== undefined ? fire.fireYear : (fire.YEAR_ !== null && fire.YEAR_ !== undefined ? fire.YEAR_ : null);
        const acres = fire.acres !== null && fire.acres !== undefined ? fire.acres : (fire.ACRES !== null && fire.ACRES !== undefined ? fire.ACRES : null);
        const distance = fire.distance_miles !== null && fire.distance_miles !== undefined ? fire.distance_miles.toFixed(2) : '0.00';
        const statusText = fire.isContaining ? 'Containing Fire Perimeter' : `Nearby Fire Perimeter (${distance} miles)`;
        
        const allAttributes = { ...fire };
        delete allAttributes.fireId;
        delete allAttributes.fireName;
        delete allAttributes.fireYear;
        delete allAttributes.acres;
        delete allAttributes.isContaining;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat,
          location.lon,
          '',
          'CA Recent Large Fire Perimeters',
          fireName,
          fireYear ? fireYear.toString() : '',
          '',
          '',
          '',
          '',
          distance,
          statusText,
          `${fireName}${fireYear ? ` (${fireYear})` : ''}${acres !== null ? ` - ${acres.toLocaleString(undefined, { maximumFractionDigits: 0 })} acres` : ''}`,
          '',
          attributesJson,
          'CA Open Data Portal'
        ]);
      });
    } else if (key === 'ca_fire_perimeters_1950_all' && Array.isArray(value)) {
      // Handle CA Fire Perimeters (1950+) - each fire perimeter gets its own row with all attributes
      value.forEach((fire: any) => {
        const fireName = fire.fireName || fire.FIRE_NAME || fire.Name || fire.name || 'Unknown Fire';
        const fireYear = fire.fireYear !== null && fire.fireYear !== undefined ? fire.fireYear : (fire.YEAR_ !== null && fire.YEAR_ !== undefined ? fire.YEAR_ : null);
        const acres = fire.acres !== null && fire.acres !== undefined ? fire.acres : (fire.ACRES !== null && fire.ACRES !== undefined ? fire.ACRES : null);
        const distance = fire.distance_miles !== null && fire.distance_miles !== undefined ? fire.distance_miles.toFixed(2) : '0.00';
        const statusText = fire.isContaining ? 'Containing Fire Perimeter' : `Nearby Fire Perimeter (${distance} miles)`;
        
        const allAttributes = { ...fire };
        delete allAttributes.fireId;
        delete allAttributes.fireName;
        delete allAttributes.fireYear;
        delete allAttributes.acres;
        delete allAttributes.isContaining;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat,
          location.lon,
          '',
          'CA Fire Perimeters (1950+)',
          fireName,
          fireYear ? fireYear.toString() : '',
          '',
          '',
          '',
          '',
          distance,
          statusText,
          `${fireName}${fireYear ? ` (${fireYear})` : ''}${acres !== null ? ` - ${acres.toLocaleString(undefined, { maximumFractionDigits: 0 })} acres` : ''}`,
          '',
          attributesJson,
          'CA Open Data Portal'
        ]);
      });
    } else if (key === 'ca_land_ownership_all' && Array.isArray(value)) {
      // Handle CA Land Ownership - each ownership polygon gets its own row with all attributes
      value.forEach((ownership: any) => {
        const ownGroup = ownership.ownGroup || ownership.OWN_GROUP || ownership.own_group || 'Unknown';
        const ownAgency = ownership.ownAgency || ownership.OWN_AGENCY || ownership.own_agency || '';
        const ownLevel = ownership.ownLevel || ownership.OWN_LEVEL || ownership.own_level || '';
        
        const allAttributes = { ...ownership };
        delete allAttributes.ownershipId;
        delete allAttributes.ownLevel;
        delete allAttributes.ownAgency;
        delete allAttributes.ownGroup;
        delete allAttributes.isContaining;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat,
          location.lon,
          '',
          'CA Land Ownership',
          ownGroup,
          ownAgency || '',
          '',
          '',
          '',
          '',
          '0.00', // Always containing, so distance is 0
          'Containing Ownership Polygon',
          `${ownGroup}${ownAgency ? ` - ${ownAgency}` : ''}${ownLevel ? ` (${ownLevel})` : ''}`,
          '', // Phone (not applicable)
          attributesJson,
          'CA Open Data Portal'
        ]);
      });
    } else if (key === 'ca_wildland_fire_direct_protection_all' && Array.isArray(value)) {
      // Handle CA Wildland Fire Direct Protection Areas - each protection area gets its own row with all attributes
      value.forEach((protection: any) => {
        const dpaAgency = protection.dpaAgency || protection.DPA_AGENCY || protection.dpa_agency || 'Unknown';
        const dpaGroup = protection.dpaGroup || protection.DPA_GROUP || protection.dpa_group || '';
        const respondId = protection.respondId || protection.RESPOND_ID || protection.respond_id || '';
        const nwcgUnitId = protection.nwcgUnitId || protection.NWCG_UNITID || protection.nwcg_unitid || '';
        
        const allAttributes = { ...protection };
        delete allAttributes.protectionAreaId;
        delete allAttributes.dpaAgency;
        delete allAttributes.dpaGroup;
        delete allAttributes.respondId;
        delete allAttributes.nwcgUnitId;
        delete allAttributes.agreements;
        delete allAttributes.costAppor;
        delete allAttributes.comments;
        delete allAttributes.isContaining;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat,
          location.lon,
          '',
          'CA Wildland Fire Direct Protection Areas',
          dpaAgency,
          dpaGroup || '',
          '',
          '',
          '',
          '',
          '0.00', // Always containing, so distance is 0
          'Containing Protection Area',
          `${dpaAgency}${dpaGroup ? ` - ${dpaGroup}` : ''}${respondId ? ` (${respondId})` : ''}${nwcgUnitId ? ` - NWCG: ${nwcgUnitId}` : ''}`,
          '', // Phone (not applicable)
          attributesJson,
          'CA Open Data Portal'
        ]);
      });
    } else if (key === 'ca_state_parks_entry_points_all' && Array.isArray(value)) {
      // Handle CA State Parks Entry Points - each entry point gets its own row with all attributes
      value.forEach((entryPoint: any) => {
        const parkUnitName = entryPoint.parkUnitName || entryPoint.PARK_NAME || entryPoint.park_name || entryPoint.ParkName || entryPoint.NAME || entryPoint.name || 'Unknown Park';
        const streetAddress = entryPoint.streetAddress || entryPoint.ADDRESS || entryPoint.address || entryPoint.Address || '';
        const city = entryPoint.city || entryPoint.CITY || entryPoint.City || '';
        const zipCode = entryPoint.zipCode || entryPoint.ZIP || entryPoint.zip || entryPoint.ZIP_CODE || entryPoint.zip_code || '';
        const phone = entryPoint.phone || entryPoint.PHONE || entryPoint.Phone || '';
        const distance = entryPoint.distance_miles !== null && entryPoint.distance_miles !== undefined ? entryPoint.distance_miles.toFixed(2) : '0.00';
        const fullAddress = [streetAddress, city, zipCode].filter(Boolean).join(', ');
        
        const allAttributes = { ...entryPoint };
        delete allAttributes.entryPointId;
        delete allAttributes.parkUnitName;
        delete allAttributes.streetAddress;
        delete allAttributes.city;
        delete allAttributes.zipCode;
        delete allAttributes.phone;
        delete allAttributes.website;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat,
          location.lon,
          '',
          'CA State Parks Entry Points',
          parkUnitName,
          fullAddress || '',
          city || '',
          '',
          zipCode || '',
          '',
          distance,
          `Nearby Entry Point (${distance} miles)`,
          `${parkUnitName}${fullAddress ? ` - ${fullAddress}` : ''}`,
          phone || '',
          attributesJson,
          'CA Open Data Portal'
        ]);
      });
    } else if (key === 'ca_state_parks_parking_lots_all' && Array.isArray(value)) {
      // Handle CA State Parks Parking Lots - each parking lot gets its own row with all attributes
      value.forEach((parkingLot: any) => {
        const name = parkingLot.name || parkingLot.NAME || parkingLot.Name || 'Unknown Parking Lot';
        const unitName = parkingLot.unitName || parkingLot.UNITNAME || parkingLot.unitName || '';
        const type = parkingLot.type || parkingLot.TYPE || parkingLot.Type || '';
        const distance = parkingLot.distance_miles !== null && parkingLot.distance_miles !== undefined ? parkingLot.distance_miles.toFixed(2) : '0.00';
        
        const allAttributes = { ...parkingLot };
        delete allAttributes.parkingLotId;
        delete allAttributes.name;
        delete allAttributes.unitName;
        delete allAttributes.type;
        delete allAttributes.subType;
        delete allAttributes.useType;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat,
          location.lon,
          '',
          'CA State Parks Parking Lots',
          name,
          unitName || '',
          '',
          '',
          '',
          '',
          distance,
          `Nearby Parking Lot (${distance} miles)`,
          `${name}${unitName ? ` - ${unitName}` : ''}${type ? ` (${type})` : ''}`,
          '',
          attributesJson,
          'CA Open Data Portal'
        ]);
      });
    } else if (key === 'ca_state_parks_boundaries_all' && Array.isArray(value)) {
      // Handle CA State Parks Boundaries - each boundary gets its own row with all attributes
      value.forEach((boundary: any) => {
        const unitName = boundary.unitName || boundary.UNITNAME || boundary.unitName || 'Unknown Park';
        const subType = boundary.subType || boundary.SUBTYPE || boundary.subType || '';
        const unitNbr = boundary.unitNbr || boundary.UNITNBR || boundary.unitNbr || '';
        const distance = boundary.distance_miles !== null && boundary.distance_miles !== undefined ? boundary.distance_miles.toFixed(2) : '0.00';
        const statusText = boundary.isContaining ? 'Containing Park Boundary' : `Nearby Park Boundary (${distance} miles)`;
        
        const allAttributes = { ...boundary };
        delete allAttributes.boundaryId;
        delete allAttributes.unitName;
        delete allAttributes.subType;
        delete allAttributes.unitNbr;
        delete allAttributes.isContaining;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat,
          location.lon,
          '',
          'CA State Parks Boundaries',
          unitName,
          subType || '',
          '',
          '',
          '',
          '',
          distance,
          statusText,
          `${unitName}${subType ? ` (${subType})` : ''}${unitNbr ? ` - Unit #${unitNbr}` : ''}`,
          '',
          attributesJson,
          'CA Open Data Portal'
        ]);
      });
    } else if (key === 'ca_state_parks_campgrounds_all' && Array.isArray(value)) {
      // Handle CA State Parks Campgrounds - each campground gets its own row with all attributes
      value.forEach((campground: any) => {
        const name = campground.name || campground.NAME || campground.Name || 'Unknown Campground';
        const unitName = campground.unitName || campground.UNITNAME || campground.unitName || '';
        const type = campground.type || campground.TYPE || campground.Type || '';
        const distance = campground.distance_miles !== null && campground.distance_miles !== undefined ? campground.distance_miles.toFixed(2) : '0.00';
        
        const allAttributes = { ...campground };
        delete allAttributes.campgroundId;
        delete allAttributes.name;
        delete allAttributes.unitName;
        delete allAttributes.type;
        delete allAttributes.subType;
        delete allAttributes.useType;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat,
          location.lon,
          '',
          'CA State Parks Campgrounds',
          name,
          unitName || '',
          '',
          '',
          '',
          '',
          distance,
          `Nearby Campground (${distance} miles)`,
          `${name}${unitName ? ` - ${unitName}` : ''}${type ? ` (${type})` : ''}`,
          '',
          attributesJson,
          'CA Open Data Portal'
        ]);
      });
    } else if (key === 'ca_condor_range_all' && Array.isArray(value)) {
      // Handle CA Condor Range - each range gets its own row with all attributes
      value.forEach((range: any) => {
        const shapeName = range.shapeName || range.Shape_Name || range.ShapeName || 'Unknown Range';
        const commonName = range.commonName || range.CName || range.cname || '';
        const scientificName = range.scientificName || range.SName || range.sname || '';
        const symbol = range.symbol || range.Symbol || '';
        const occYears = range.occYears || range.Occ_Years || range.OccYears || '';
        const rangeStart = range.rangeStart || range.RangeStart || range.range_start || '';
        const rangeEnd = range.rangeEnd || range.RangeEnd || range.range_end || '';
        const distance = range.distance_miles !== null && range.distance_miles !== undefined ? range.distance_miles.toFixed(2) : '0.00';
        
        const allAttributes = { ...range };
        delete allAttributes.rangeId;
        delete allAttributes.shapeName;
        delete allAttributes.commonName;
        delete allAttributes.scientificName;
        delete allAttributes.symbol;
        delete allAttributes.occYears;
        delete allAttributes.rangeStart;
        delete allAttributes.rangeEnd;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat,
          location.lon,
          '',
          'CA Condor Range',
          shapeName,
          commonName || '',
          scientificName || '',
          symbol || '',
          occYears || '',
          rangeStart || '',
          rangeEnd || '',
          distance,
          distance === '0.00' ? 'Within Range' : `Nearby Range (${distance} miles)`,
          `${shapeName}${commonName ? ` - ${commonName}` : ''}${scientificName ? ` (${scientificName})` : ''}`,
          '',
          attributesJson,
          'CDFW BIOS'
        ]);
      });
    } else if (key === 'ca_black_bear_range_all' && Array.isArray(value)) {
      // Handle CA Black Bear Range - each range gets its own row with all attributes
      value.forEach((range: any) => {
        const shapeName = range.shapeName || range.Shape_Name || range.ShapeName || 'Unknown Range';
        const commonName = range.commonName || range.CName || range.cname || '';
        const scientificName = range.scientificName || range.SName || range.sname || '';
        const symbol = range.symbol || range.Symbol || '';
        const occYears = range.occYears || range.Occ_Years || range.OccYears || '';
        const rangeStart = range.rangeStart || range.RangeStart || range.range_start || '';
        const rangeEnd = range.rangeEnd || range.RangeEnd || range.range_end || '';
        const distance = range.distance_miles !== null && range.distance_miles !== undefined ? range.distance_miles.toFixed(2) : '0.00';
        
        const allAttributes = { ...range };
        delete allAttributes.rangeId;
        delete allAttributes.shapeName;
        delete allAttributes.commonName;
        delete allAttributes.scientificName;
        delete allAttributes.symbol;
        delete allAttributes.occYears;
        delete allAttributes.rangeStart;
        delete allAttributes.rangeEnd;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat,
          location.lon,
          '',
          'CA Black Bear Range',
          shapeName,
          commonName || '',
          scientificName || '',
          symbol || '',
          occYears || '',
          rangeStart || '',
          rangeEnd || '',
          distance,
          distance === '0.00' ? 'Within Range' : `Nearby Range (${distance} miles)`,
          `${shapeName}${commonName ? ` - ${commonName}` : ''}${scientificName ? ` (${scientificName})` : ''}`,
          '',
          attributesJson,
          'CDFW BIOS'
        ]);
      });
    } else if (key === 'ca_brush_rabbit_range_all' && Array.isArray(value)) {
      // Handle CA Brush Rabbit Range - each range gets its own row with all attributes
      value.forEach((range: any) => {
        const shapeName = range.shapeName || range.Shape_Name || range.ShapeName || 'Unknown Range';
        const commonName = range.commonName || range.CName || range.cname || '';
        const scientificName = range.scientificName || range.SName || range.sname || '';
        const symbol = range.symbol || range.Symbol || '';
        const occYears = range.occYears || range.Occ_Years || range.OccYears || '';
        const rangeStart = range.rangeStart || range.RangeStart || range.range_start || '';
        const rangeEnd = range.rangeEnd || range.RangeEnd || range.range_end || '';
        const distance = range.distance_miles !== null && range.distance_miles !== undefined ? range.distance_miles.toFixed(2) : '0.00';
        
        const allAttributes = { ...range };
        delete allAttributes.rangeId;
        delete allAttributes.shapeName;
        delete allAttributes.commonName;
        delete allAttributes.scientificName;
        delete allAttributes.symbol;
        delete allAttributes.occYears;
        delete allAttributes.rangeStart;
        delete allAttributes.rangeEnd;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat,
          location.lon,
          '',
          'CA Brush Rabbit Range',
          shapeName,
          commonName || '',
          scientificName || '',
          symbol || '',
          occYears || '',
          rangeStart || '',
          rangeEnd || '',
          distance,
          distance === '0.00' ? 'Within Range' : `Nearby Range (${distance} miles)`,
          `${shapeName}${commonName ? ` - ${commonName}` : ''}${scientificName ? ` (${scientificName})` : ''}`,
          '',
          attributesJson,
          'CDFW BIOS'
        ]);
      });
    } else if (key === 'ca_great_gray_owl_range_all' && Array.isArray(value)) {
      // Handle CA Great Gray Owl Range - each range gets its own row with all attributes
      value.forEach((range: any) => {
        const shapeName = range.shapeName || range.Shape_Name || range.ShapeName || 'Unknown Range';
        const commonName = range.commonName || range.CName || range.cname || '';
        const scientificName = range.scientificName || range.SName || range.sname || '';
        const symbol = range.symbol || range.Symbol || '';
        const occYears = range.occYears || range.Occ_Years || range.OccYears || '';
        const rangeStart = range.rangeStart || range.RangeStart || range.range_start || '';
        const rangeEnd = range.rangeEnd || range.RangeEnd || range.range_end || '';
        const distance = range.distance_miles !== null && range.distance_miles !== undefined ? range.distance_miles.toFixed(2) : '0.00';
        
        const allAttributes = { ...range };
        delete allAttributes.rangeId;
        delete allAttributes.shapeName;
        delete allAttributes.commonName;
        delete allAttributes.scientificName;
        delete allAttributes.symbol;
        delete allAttributes.occYears;
        delete allAttributes.rangeStart;
        delete allAttributes.rangeEnd;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat,
          location.lon,
          '',
          'CA Great Gray Owl Range',
          shapeName,
          commonName || '',
          scientificName || '',
          symbol || '',
          occYears || '',
          rangeStart || '',
          rangeEnd || '',
          distance,
          distance === '0.00' ? 'Within Range' : `Nearby Range (${distance} miles)`,
          `${shapeName}${commonName ? ` - ${commonName}` : ''}${scientificName ? ` (${scientificName})` : ''}`,
          '',
          attributesJson,
          'CDFW BIOS'
        ]);
      });
    } else if (key === 'ca_sandhill_crane_range_all' && Array.isArray(value)) {
      // Handle CA Sandhill Crane Range - each range gets its own row with all attributes
      value.forEach((range: any) => {
        const shapeName = range.shapeName || range.Shape_Name || range.ShapeName || 'Unknown Range';
        const commonName = range.commonName || range.CName || range.cname || '';
        const scientificName = range.scientificName || range.SName || range.sname || '';
        const symbol = range.symbol || range.Symbol || '';
        const occYears = range.occYears || range.Occ_Years || range.OccYears || '';
        const rangeStart = range.rangeStart || range.RangeStart || range.range_start || '';
        const rangeEnd = range.rangeEnd || range.RangeEnd || range.range_end || '';
        const distance = range.distance_miles !== null && range.distance_miles !== undefined ? range.distance_miles.toFixed(2) : '0.00';
        
        const allAttributes = { ...range };
        delete allAttributes.rangeId;
        delete allAttributes.shapeName;
        delete allAttributes.commonName;
        delete allAttributes.scientificName;
        delete allAttributes.symbol;
        delete allAttributes.occYears;
        delete allAttributes.rangeStart;
        delete allAttributes.rangeEnd;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat,
          location.lon,
          '',
          'CA Sandhill Crane Range',
          shapeName,
          commonName || '',
          scientificName || '',
          symbol || '',
          occYears || '',
          rangeStart || '',
          rangeEnd || '',
          distance,
          distance === '0.00' ? 'Within Range' : `Nearby Range (${distance} miles)`,
          `${shapeName}${commonName ? ` - ${commonName}` : ''}${scientificName ? ` (${scientificName})` : ''}`,
          '',
          attributesJson,
          'CDFW BIOS'
        ]);
      });
    } else if (key === 'ca_calvtp_treatment_areas_all' && Array.isArray(value)) {
      // Handle CA CalVTP Treatment Areas - each treatment area gets its own row with all attributes
      value.forEach((area: any) => {
        const projectId = area.projectId || area.Project_ID || area.project_id || 'Unknown Project';
        const treatmentStage = area.treatmentStage || area.TreatmentStage || area.treatment_stage || '';
        const treatmentAcres = area.treatmentAcres || area.Treatment_Acres || area.treatment_acres || null;
        const county = area.county || area.County || '';
        const fuelType = area.fuelType || area.Fuel_Type || area.fuel_type || '';
        const dateCompleted = area.dateCompleted || area.Date_Completed || area.date_completed || '';
        const treatmentType = area.treatmentType || area.Treatment_Type || area.treatment_type || '';
        const treatmentActivity = area.treatmentActivity || area.Treatment_Activity || area.treatment_activity || '';
        const grantType = area.grantType || area.Grant_Type || area.grant_type || '';
        const status = area.status || area.Status || '';
        const affiliation = area.affiliation || area.Affiliation || '';
        const contactName = area.contactName || area.ContactName || area.contact_name || '';
        const contactNumber = area.contactNumber || area.ContactNumber || area.contact_number || '';
        const contactEmail = area.contactEmail || area.ContactEmail || area.contact_email || '';
        const contactAddress = area.contactAddress || area.ContactAddress || area.contact_address || '';
        const distance = area.distance_miles !== null && area.distance_miles !== undefined ? area.distance_miles.toFixed(2) : '0.00';
        
        const allAttributes = { ...area };
        delete allAttributes.treatmentAreaId;
        delete allAttributes.projectId;
        delete allAttributes.treatmentStage;
        delete allAttributes.treatmentAcres;
        delete allAttributes.county;
        delete allAttributes.fuelType;
        delete allAttributes.dateCompleted;
        delete allAttributes.treatmentType;
        delete allAttributes.treatmentActivity;
        delete allAttributes.grantType;
        delete allAttributes.status;
        delete allAttributes.affiliation;
        delete allAttributes.contactName;
        delete allAttributes.contactNumber;
        delete allAttributes.contactEmail;
        delete allAttributes.contactAddress;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat,
          location.lon,
          '',
          'CA CalVTP Treatment Areas',
          projectId,
          treatmentStage || '',
          treatmentAcres ? treatmentAcres.toFixed(2) : '',
          county || '',
          fuelType || '',
          dateCompleted || '',
          treatmentType || '',
          treatmentActivity || '',
          grantType || '',
          status || '',
          affiliation || '',
          contactName || '',
          contactNumber || '',
          contactEmail || '',
          contactAddress || '',
          distance,
          distance === '0.00' ? 'Within Treatment Area' : `Nearby Treatment Area (${distance} miles)`,
          `${projectId}${treatmentStage ? ` - ${treatmentStage}` : ''}${county ? ` (${county})` : ''}`,
          '',
          attributesJson,
          'CAL FIRE'
        ]);
      });
    } else if (key === 'ca_highway_rest_areas_all' && Array.isArray(value)) {
      // Handle CA Highway Rest Areas - each rest area gets its own row with all attributes
      value.forEach((restArea: any) => {
        const name = restArea.name || restArea.Name || restArea.NAME || restArea.REST_AREA_NAME || restArea.rest_area_name || 'Unknown Rest Area';
        const route = restArea.route || restArea.Route || restArea.ROUTE || '';
        const direction = restArea.direction || restArea.Direction || restArea.DIRECTION || '';
        const county = restArea.county || restArea.County || restArea.COUNTY || '';
        const city = restArea.city || restArea.City || restArea.CITY || '';
        const amenities = restArea.amenities || restArea.Amenities || restArea.AMENITIES || '';
        const distance = restArea.distance_miles !== null && restArea.distance_miles !== undefined ? restArea.distance_miles.toFixed(2) : '0.00';
        
        const allAttributes = { ...restArea };
        delete allAttributes.restAreaId;
        delete allAttributes.name;
        delete allAttributes.route;
        delete allAttributes.direction;
        delete allAttributes.county;
        delete allAttributes.city;
        delete allAttributes.amenities;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat,
          location.lon,
          '',
          'CA Highway Rest Areas',
          name,
          route || '',
          direction || '',
          county || '',
          city || '',
          amenities || '',
          distance,
          distance === '0.00' ? 'At Rest Area' : `Nearby Rest Area (${distance} miles)`,
          `${name}${route ? ` - Route ${route}` : ''}${direction ? ` ${direction}` : ''}`,
          '',
          attributesJson,
          'Caltrans GIS'
        ]);
      });
    } else if (key === 'de_child_care_centers_all' && Array.isArray(value)) {
      // Handle DE Child Care Centers - each center gets its own row with all attributes
      value.forEach((center: any) => {
        const name = center.name || center.RSR_RESO_1 || center.rsr_reso_1 || 'Unknown Child Care Center';
        const type = center.type || center.RSR_TYPE_T || center.rsr_type_t || '';
        const address = center.address || center.ADR_STREET || center.adr_street || '';
        const city = center.city || center.ADR_CITYNA || center.adr_cityna || '';
        const state = center.state || center.ADR_STAECO || center.adr_staeco || 'DE';
        const zip = center.zip || center.ADR_ZIP || center.ZIPCODE || center.zipcode || '';
        const phone = center.phone || center.ADR_PHONE_ || center.adr_phone_ || '';
        const county = center.county || center.ADR_COUNTY || center.adr_county || '';
        const capacity = center.capacity || center.RSR_CPCT_N || center.rsr_cpct_n || null;
        const starLevel = center.starLevel || center.DSI_STAR_LEVEL || center.dsi_star_level || center.STARLEVEL || center.starlevel || null;
        const ageRange = center.ageRange || center.RSR_AGE_RA || center.rsr_age_ra || center.AGE_GROUP || center.age_group || '';
        const opens = center.opens || center.RSR_OPENS_ || center.rsr_opens_ || '';
        const closes = center.closes || center.RSR_CLOSES || center.rsr_closes || '';
        const fullAddress = [address, city, state, zip].filter(Boolean).join(', ');
        
        // Get coordinates from geometry or attributes
        const centerLat = center.geometry?.y || center.LATITUDE || center.latitude || location.lat;
        const centerLon = center.geometry?.x || center.LONGITUDE || center.longitude || location.lon;
        
        const allAttributes = { ...center };
        delete allAttributes.name;
        delete allAttributes.type;
        delete allAttributes.address;
        delete allAttributes.city;
        delete allAttributes.state;
        delete allAttributes.zip;
        delete allAttributes.phone;
        delete allAttributes.county;
        delete allAttributes.capacity;
        delete allAttributes.starLevel;
        delete allAttributes.ageRange;
        delete allAttributes.opens;
        delete allAttributes.closes;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'DE FirstMap',
          (location.confidence || 'N/A').toString(),
          'DE_CHILD_CARE_CENTER',
          `${name}${type ? ` - ${type}` : ''}`,
          centerLat.toString(),
          centerLon.toString(),
          center.distance_miles !== null && center.distance_miles !== undefined ? center.distance_miles.toFixed(2) : '',
          type || 'Child Care Center',
          `${fullAddress}${county ? ` (${county})` : ''}${capacity !== null ? ` - Capacity: ${capacity}` : ''}${starLevel !== null ? ` - Star Level: ${starLevel}` : ''}${ageRange ? ` - Ages: ${ageRange}` : ''}${opens && closes ? ` - Hours: ${opens}-${closes}` : ''}`,
          phone || '',
          attributesJson, // Full attributes in Website field
          'DE FirstMap'
        ]);
      });
    } else if (key === 'de_fishing_access_all' && Array.isArray(value)) {
      // Handle DE Fishing Access - each access point gets its own row with all attributes
      value.forEach((access: any) => {
        const name = access.name || access.GNIS_NAME || access.gnis_name || 'Fishing Access';
        const facility = access.facility || access.FACILITY || access.facility || '';
        const division = access.division || access.DIVISION || access.division || '';
        const county = access.county || access.COUNTY || access.county || '';
        const tidal = access.tidal || access.TIDAL || access.tidal || '';
        
        const accessLat = access.geometry?.y || access.LATITUDE || access.latitude || location.lat;
        const accessLon = access.geometry?.x || access.LONGITUDE || access.longitude || location.lon;
        
        const allAttributes = { ...access };
        delete allAttributes.accessId;
        delete allAttributes.name;
        delete allAttributes.GNIS_NAME;
        delete allAttributes.gnis_name;
        delete allAttributes.facility;
        delete allAttributes.FACILITY;
        delete allAttributes.division;
        delete allAttributes.DIVISION;
        delete allAttributes.county;
        delete allAttributes.COUNTY;
        delete allAttributes.tidal;
        delete allAttributes.TIDAL;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'DE FirstMap',
          (location.confidence || 'N/A').toString(),
          'DE_FISHING_ACCESS',
          `${name}${facility ? ` - ${facility}` : ''}`,
          accessLat.toString(),
          accessLon.toString(),
          access.distance_miles !== null && access.distance_miles !== undefined ? access.distance_miles.toFixed(2) : '',
          facility || 'Fishing Access',
          `${name}${division ? ` (${division})` : ''}${county ? ` - ${county}` : ''}${tidal ? ` - Tidal: ${tidal}` : ''}`,
          '', // Phone (not applicable)
          attributesJson, // Full attributes in Website field
          'DE FirstMap'
        ]);
      });
    } else if (key === 'de_trout_streams_all' && Array.isArray(value)) {
      // Handle DE Trout Streams - each stream gets its own row with all attributes
      value.forEach((stream: any) => {
        const waterBodyName = stream.waterBodyName || stream.WATERBODYNAME || stream.waterBodyName || 'Trout Stream';
        const restriction = stream.restriction || stream.RESTRICTION || stream.restriction || '';
        const description = stream.description || stream.DESCRIPTION || stream.description || '';
        const gnisName = stream.gnisName || stream.GNIS_NAME || stream.gnis_name || '';
        
        const allAttributes = { ...stream };
        delete allAttributes.streamId;
        delete allAttributes.waterBodyName;
        delete allAttributes.WATERBODYNAME;
        delete allAttributes.restriction;
        delete allAttributes.RESTRICTION;
        delete allAttributes.description;
        delete allAttributes.DESCRIPTION;
        delete allAttributes.gnisName;
        delete allAttributes.GNIS_NAME;
        delete allAttributes.gnisId;
        delete allAttributes.GNIS_ID;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'DE FirstMap',
          (location.confidence || 'N/A').toString(),
          'DE_TROUT_STREAM',
          `${waterBodyName}${restriction ? ` - ${restriction}` : ''}`,
          location.lat.toString(), // Use search location for stream (it's a polyline, not a point)
          location.lon.toString(),
          stream.distance_miles !== null && stream.distance_miles !== undefined ? stream.distance_miles.toFixed(2) : '',
          restriction || 'Trout Stream',
          `${waterBodyName}${gnisName ? ` (${gnisName})` : ''}${description ? ` - ${description}` : ''}`,
          '', // Phone (not applicable)
          attributesJson, // Full attributes in Website field
          'DE FirstMap'
        ]);
      });
    } else if (key === 'de_public_schools_all' && Array.isArray(value)) {
      // Handle DE Public Schools - each school gets its own row with all attributes
      value.forEach((school: any) => {
        const name = school.name || school.NAME || school.SCHOOL_NAME || school.school_name || 'Public School';
        const schoolType = school.schoolType || school.TYPE || school.SCHOOL_TYPE || school.school_type || '';
        const district = school.district || school.DISTRICT || school.DISTRICT_NAME || school.district_name || '';
        const address = school.address || school.ADDRESS || school.STREET || school.street || '';
        const city = school.city || school.CITY || '';
        const state = school.state || school.STATE || 'DE';
        const zip = school.zip || school.ZIP || school.ZIP_CODE || school.zip_code || '';
        const phone = school.phone || school.PHONE || school.TELEPHONE || school.telephone || '';
        const fullAddress = [address, city, state, zip].filter(Boolean).join(', ');
        
        const schoolLat = school.geometry?.y || school.LATITUDE || school.latitude || location.lat;
        const schoolLon = school.geometry?.x || school.LONGITUDE || school.longitude || location.lon;
        
        const allAttributes = { ...school };
        delete allAttributes.schoolId;
        delete allAttributes.name;
        delete allAttributes.NAME;
        delete allAttributes.SCHOOL_NAME;
        delete allAttributes.school_name;
        delete allAttributes.schoolType;
        delete allAttributes.TYPE;
        delete allAttributes.SCHOOL_TYPE;
        delete allAttributes.district;
        delete allAttributes.DISTRICT;
        delete allAttributes.DISTRICT_NAME;
        delete allAttributes.address;
        delete allAttributes.ADDRESS;
        delete allAttributes.city;
        delete allAttributes.CITY;
        delete allAttributes.state;
        delete allAttributes.STATE;
        delete allAttributes.zip;
        delete allAttributes.ZIP;
        delete allAttributes.phone;
        delete allAttributes.PHONE;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'DE FirstMap',
          (location.confidence || 'N/A').toString(),
          'DE_PUBLIC_SCHOOL',
          `${name}${schoolType ? ` - ${schoolType}` : ''}`,
          schoolLat.toString(),
          schoolLon.toString(),
          school.distance_miles !== null && school.distance_miles !== undefined ? school.distance_miles.toFixed(2) : '',
          schoolType || 'Public School',
          `${fullAddress}${district ? ` - District: ${district}` : ''}`,
          phone || '',
          attributesJson, // Full attributes in Website field
          'DE FirstMap'
        ]);
      });
    } else if (key === 'de_private_schools_all' && Array.isArray(value)) {
      // Handle DE Private Schools - each school gets its own row with all attributes
      value.forEach((school: any) => {
        const name = school.name || school.NAME || school.SCHOOL_NAME || school.school_name || 'Private School';
        const schoolType = school.schoolType || school.TYPE || school.SCHOOL_TYPE || school.school_type || '';
        const district = school.district || school.DISTRICT || school.DISTRICT_NAME || school.district_name || '';
        const address = school.address || school.ADDRESS || school.STREET || school.street || '';
        const city = school.city || school.CITY || '';
        const state = school.state || school.STATE || 'DE';
        const zip = school.zip || school.ZIP || school.ZIP_CODE || school.zip_code || '';
        const phone = school.phone || school.PHONE || school.TELEPHONE || school.telephone || '';
        const fullAddress = [address, city, state, zip].filter(Boolean).join(', ');
        
        const schoolLat = school.geometry?.y || school.LATITUDE || school.latitude || location.lat;
        const schoolLon = school.geometry?.x || school.LONGITUDE || school.longitude || location.lon;
        
        const allAttributes = { ...school };
        delete allAttributes.schoolId;
        delete allAttributes.name;
        delete allAttributes.NAME;
        delete allAttributes.SCHOOL_NAME;
        delete allAttributes.school_name;
        delete allAttributes.schoolType;
        delete allAttributes.TYPE;
        delete allAttributes.SCHOOL_TYPE;
        delete allAttributes.district;
        delete allAttributes.DISTRICT;
        delete allAttributes.DISTRICT_NAME;
        delete allAttributes.address;
        delete allAttributes.ADDRESS;
        delete allAttributes.city;
        delete allAttributes.CITY;
        delete allAttributes.state;
        delete allAttributes.STATE;
        delete allAttributes.zip;
        delete allAttributes.ZIP;
        delete allAttributes.phone;
        delete allAttributes.PHONE;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'DE FirstMap',
          (location.confidence || 'N/A').toString(),
          'DE_PRIVATE_SCHOOL',
          `${name}${schoolType ? ` - ${schoolType}` : ''}`,
          schoolLat.toString(),
          schoolLon.toString(),
          school.distance_miles !== null && school.distance_miles !== undefined ? school.distance_miles.toFixed(2) : '',
          schoolType || 'Private School',
          `${fullAddress}${district ? ` - District: ${district}` : ''}`,
          phone || '',
          attributesJson, // Full attributes in Website field
          'DE FirstMap'
        ]);
      });
    } else if (key === 'de_votech_districts_all' && Array.isArray(value)) {
      // Handle DE VoTech Districts - each district gets its own row
      value.forEach((district: any) => {
        const name = district.name || district.NAME || district.DISTRICT_NAME || district.district_name || 'VoTech District';
        const featureType = district.isContaining ? 'Containing VoTech District' : 'VoTech District';
        
        const allAttributes = { ...district };
        delete allAttributes.districtId;
        delete allAttributes.name;
        delete allAttributes.NAME;
        delete allAttributes.DISTRICT_NAME;
        delete allAttributes.district_name;
        delete allAttributes.districtType;
        delete allAttributes.isContaining;
        delete allAttributes.geometry;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'DE FirstMap',
          (location.confidence || 'N/A').toString(),
          'DE_VOTECH_DISTRICT',
          `${featureType}${name ? ` - ${name}` : ''}`,
          location.lat.toString(), // Use search location for district (it's a polygon, not a point)
          location.lon.toString(),
          district.isContaining ? '0.00' : '',
          'VoTech School District',
          name || 'VoTech District',
          '', // Phone (not applicable)
          attributesJson, // Full attributes in Website field
          'DE FirstMap'
        ]);
      });
    } else if (key === 'de_school_districts_all' && Array.isArray(value)) {
      // Handle DE School Districts - each district gets its own row
      value.forEach((district: any) => {
        const name = district.name || district.NAME || district.DISTRICT_NAME || district.district_name || 'School District';
        const featureType = district.isContaining ? 'Containing School District' : 'School District';
        
        const allAttributes = { ...district };
        delete allAttributes.districtId;
        delete allAttributes.name;
        delete allAttributes.NAME;
        delete allAttributes.DISTRICT_NAME;
        delete allAttributes.district_name;
        delete allAttributes.districtType;
        delete allAttributes.isContaining;
        delete allAttributes.geometry;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'DE FirstMap',
          (location.confidence || 'N/A').toString(),
          'DE_SCHOOL_DISTRICT',
          `${featureType}${name ? ` - ${name}` : ''}`,
          location.lat.toString(), // Use search location for district (it's a polygon, not a point)
          location.lon.toString(),
          district.isContaining ? '0.00' : '',
          'Public School District',
          name || 'School District',
          '', // Phone (not applicable)
          attributesJson, // Full attributes in Website field
          'DE FirstMap'
        ]);
      });
    } else if (key === 'de_stands_blinds_fields_all' && Array.isArray(value)) {
      // Handle DE Wildlife Areas Stands Blinds and Fields - each feature gets its own row
      value.forEach((feature: any) => {
        const name = feature.name || feature.NAME || 'Stands/Blinds/Fields';
        const type = feature.type || feature.TYPE || '';
        const featureLat = feature.geometry?.y || feature.LATITUDE || feature.latitude || location.lat;
        const featureLon = feature.geometry?.x || feature.LONGITUDE || feature.longitude || location.lon;
        
        const allAttributes = { ...feature };
        delete allAttributes.featureId;
        delete allAttributes.name;
        delete allAttributes.NAME;
        delete allAttributes.type;
        delete allAttributes.TYPE;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'DE FirstMap',
          (location.confidence || 'N/A').toString(),
          'DE_STANDS_BLINDS_FIELDS',
          `${name}${type ? ` - ${type}` : ''}`,
          featureLat.toString(),
          featureLon.toString(),
          feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : '',
          type || 'Stands/Blinds/Fields',
          name,
          '', // Phone (not applicable)
          attributesJson, // Full attributes in Website field
          'DE FirstMap'
        ]);
      });
    } else if (key === 'de_boat_ramps_all' && Array.isArray(value)) {
      // Handle DE Wildlife Areas Boat Ramps - each ramp gets its own row
      value.forEach((feature: any) => {
        const name = feature.name || feature.NAME || 'Boat Ramp';
        const type = feature.type || feature.TYPE || '';
        const featureLat = feature.geometry?.y || feature.LATITUDE || feature.latitude || location.lat;
        const featureLon = feature.geometry?.x || feature.LONGITUDE || feature.longitude || location.lon;
        
        const allAttributes = { ...feature };
        delete allAttributes.featureId;
        delete allAttributes.name;
        delete allAttributes.NAME;
        delete allAttributes.type;
        delete allAttributes.TYPE;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'DE FirstMap',
          (location.confidence || 'N/A').toString(),
          'DE_BOAT_RAMPS',
          `${name}${type ? ` - ${type}` : ''}`,
          featureLat.toString(),
          featureLon.toString(),
          feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : '',
          type || 'Boat Ramp',
          name,
          '', // Phone (not applicable)
          attributesJson, // Full attributes in Website field
          'DE FirstMap'
        ]);
      });
    } else if (key === 'de_facilities_all' && Array.isArray(value)) {
      // Handle DE Wildlife Areas Facilities - each facility gets its own row
      value.forEach((feature: any) => {
        const name = feature.name || feature.NAME || 'Facility';
        const type = feature.type || feature.TYPE || '';
        const featureLat = feature.geometry?.y || feature.LATITUDE || feature.latitude || location.lat;
        const featureLon = feature.geometry?.x || feature.LONGITUDE || feature.longitude || location.lon;
        
        const allAttributes = { ...feature };
        delete allAttributes.featureId;
        delete allAttributes.name;
        delete allAttributes.NAME;
        delete allAttributes.type;
        delete allAttributes.TYPE;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'DE FirstMap',
          (location.confidence || 'N/A').toString(),
          'DE_FACILITIES',
          `${name}${type ? ` - ${type}` : ''}`,
          featureLat.toString(),
          featureLon.toString(),
          feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : '',
          type || 'Facility',
          name,
          '', // Phone (not applicable)
          attributesJson, // Full attributes in Website field
          'DE FirstMap'
        ]);
      });
    } else if (key === 'de_parking_all' && Array.isArray(value)) {
      // Handle DE Wildlife Areas Parking - each parking area gets its own row
      value.forEach((feature: any) => {
        const name = feature.name || feature.NAME || 'Parking';
        const type = feature.type || feature.TYPE || '';
        const featureLat = feature.geometry?.y || feature.LATITUDE || feature.latitude || location.lat;
        const featureLon = feature.geometry?.x || feature.LONGITUDE || feature.longitude || location.lon;
        
        const allAttributes = { ...feature };
        delete allAttributes.featureId;
        delete allAttributes.name;
        delete allAttributes.NAME;
        delete allAttributes.type;
        delete allAttributes.TYPE;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'DE FirstMap',
          (location.confidence || 'N/A').toString(),
          'DE_PARKING',
          `${name}${type ? ` - ${type}` : ''}`,
          featureLat.toString(),
          featureLon.toString(),
          feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : '',
          type || 'Parking',
          name,
          '', // Phone (not applicable)
          attributesJson, // Full attributes in Website field
          'DE FirstMap'
        ]);
      });
    } else if (key === 'de_restrooms_all' && Array.isArray(value)) {
      // Handle DE Wildlife Areas Restrooms - each restroom gets its own row
      value.forEach((feature: any) => {
        const name = feature.name || feature.NAME || 'Restroom';
        const type = feature.type || feature.TYPE || '';
        const featureLat = feature.geometry?.y || feature.LATITUDE || feature.latitude || location.lat;
        const featureLon = feature.geometry?.x || feature.LONGITUDE || feature.longitude || location.lon;
        
        const allAttributes = { ...feature };
        delete allAttributes.featureId;
        delete allAttributes.name;
        delete allAttributes.NAME;
        delete allAttributes.type;
        delete allAttributes.TYPE;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'DE FirstMap',
          (location.confidence || 'N/A').toString(),
          'DE_RESTROOMS',
          `${name}${type ? ` - ${type}` : ''}`,
          featureLat.toString(),
          featureLon.toString(),
          feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : '',
          type || 'Restroom',
          name,
          '', // Phone (not applicable)
          attributesJson, // Full attributes in Website field
          'DE FirstMap'
        ]);
      });
    } else if (key === 'de_safety_zones_all' && Array.isArray(value)) {
      // Handle DE Wildlife Areas Safety Zones - each zone gets its own row
      value.forEach((zone: any) => {
        const name = zone.name || zone.NAME || 'Safety Zone';
        const type = zone.type || zone.TYPE || '';
        const featureType = zone.isContaining ? 'Containing Safety Zone' : 'Safety Zone';
        
        const allAttributes = { ...zone };
        delete allAttributes.featureId;
        delete allAttributes.name;
        delete allAttributes.NAME;
        delete allAttributes.type;
        delete allAttributes.TYPE;
        delete allAttributes.isContaining;
        delete allAttributes.geometry;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'DE FirstMap',
          (location.confidence || 'N/A').toString(),
          'DE_SAFETY_ZONES',
          `${featureType}${name ? ` - ${name}` : ''}`,
          location.lat.toString(), // Use search location for zone (it's a polygon, not a point)
          location.lon.toString(),
          zone.isContaining ? '0.00' : '',
          type || 'Safety Zone',
          name || 'Safety Zone',
          '', // Phone (not applicable)
          attributesJson, // Full attributes in Website field
          'DE FirstMap'
        ]);
      });
    } else if (key === 'de_wildlife_management_zones_all' && Array.isArray(value)) {
      // Handle DE Wildlife Management Zones - each zone gets its own row
      value.forEach((zone: any) => {
        const name = zone.name || zone.NAME || zone.ZONE || zone.zone || 'Wildlife Management Zone';
        const type = zone.type || zone.TYPE || zone.ZONE_TYPE || zone.zone_type || '';
        const featureType = zone.isContaining ? 'Containing Wildlife Management Zone' : 'Wildlife Management Zone';
        
        const allAttributes = { ...zone };
        delete allAttributes.featureId;
        delete allAttributes.name;
        delete allAttributes.NAME;
        delete allAttributes.ZONE;
        delete allAttributes.zone;
        delete allAttributes.type;
        delete allAttributes.TYPE;
        delete allAttributes.ZONE_TYPE;
        delete allAttributes.zone_type;
        delete allAttributes.isContaining;
        delete allAttributes.geometry;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'DE FirstMap',
          (location.confidence || 'N/A').toString(),
          'DE_WILDLIFE_MANAGEMENT_ZONES',
          `${featureType}${name ? ` - ${name}` : ''}`,
          location.lat.toString(), // Use search location for zone (it's a polygon, not a point)
          location.lon.toString(),
          zone.isContaining ? '0.00' : '',
          type || 'Wildlife Management Zone',
          name || 'Wildlife Management Zone',
          '', // Phone (not applicable)
          attributesJson, // Full attributes in Website field
          'DE FirstMap'
        ]);
      });
    } else if (key === 'de_rail_lines_all' && Array.isArray(value)) {
      // Handle DE Rail Lines - each rail line gets its own row with all attributes
      value.forEach((railLine: any) => {
        const railId = railLine.railId || railLine.RAIL_ID || railLine.rail_id || '';
        const trackType = railLine.trackType || railLine.TRACK_TYPE || railLine.track_type || '';
        const status = railLine.status || railLine.STATUS || railLine.status || '';
        const lineId = railLine.lineId || railLine.LINE_ID || railLine.line_id || '';
        const owner = railLine.owner || railLine.OWNER || railLine.owner || '';
        const operators = railLine.operators || [];
        const operatorsStr = operators.length > 0 ? operators.join(', ') : '';
        
        const allAttributes = { ...railLine };
        delete allAttributes.railId;
        delete allAttributes.RAIL_ID;
        delete allAttributes.rail_id;
        delete allAttributes.trackType;
        delete allAttributes.TRACK_TYPE;
        delete allAttributes.track_type;
        delete allAttributes.status;
        delete allAttributes.STATUS;
        delete allAttributes.lineId;
        delete allAttributes.LINE_ID;
        delete allAttributes.line_id;
        delete allAttributes.owner;
        delete allAttributes.OWNER;
        delete allAttributes.operators;
        delete allAttributes.OPERATOR1;
        delete allAttributes.OPERATOR2;
        delete allAttributes.OPERATOR3;
        delete allAttributes.OPERATOR4;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'DE FirstMap',
          (location.confidence || 'N/A').toString(),
          'DE_RAIL_LINE',
          `Rail Line${railId ? ` ${railId}` : ''}${lineId ? ` - ${lineId}` : ''}`,
          location.lat.toString(), // Use search location for rail line (it's a polyline, not a point)
          location.lon.toString(),
          railLine.distance_miles !== null && railLine.distance_miles !== undefined ? railLine.distance_miles.toFixed(2) : '',
          trackType || 'Rail Line',
          `${status ? `Status: ${status}` : ''}${owner ? `${status ? ' - ' : ''}Owner: ${owner}` : ''}${operatorsStr ? `${owner || status ? ' - ' : ''}Operator${operators.length > 1 ? 's' : ''}: ${operatorsStr}` : ''}`,
          '', // Phone (not applicable)
          attributesJson, // Full attributes in Website field
          'DE FirstMap'
        ]);
      });
    } else if (key === 'nj_parcels_all' && Array.isArray(value)) {
      // Handle NJ Parcels - each parcel gets its own row with all attributes
      value.forEach((parcel: any) => {
        const pin = parcel.pin || parcel.PAMS_PIN || parcel.pams_pin || parcel.GIS_PIN || parcel.gis_pin || parcel.PIN_NODUP || parcel.pin_nodup || '';
        const municipality = parcel.municipality || parcel.MUN_NAME || parcel.mun_name || '';
        const county = parcel.county || parcel.COUNTY || parcel.county || '';
        const block = parcel.block || parcel.PCLBLOCK || parcel.pclblock || '';
        const lot = parcel.lot || parcel.PCLLOT || parcel.pcllot || '';
        const ownerName = parcel.ownerName || parcel.OWNER_NAME || parcel.owner_name || '';
        const streetAddress = parcel.streetAddress || parcel.ST_ADDRESS || parcel.st_address || '';
        const cityState = parcel.cityState || parcel.CITY_STATE || parcel.city_state || '';
        const zipCode = parcel.zipCode || parcel.ZIP_CODE || parcel.zip_code || parcel.ZIP5 || parcel.zip5 || '';
        const landValue = parcel.landValue || parcel.LAND_VAL || parcel.land_val || null;
        const improvementValue = parcel.improvementValue || parcel.IMPRVT_VAL || parcel.imprvt_val || null;
        const netValue = parcel.netValue || parcel.NET_VALUE || parcel.net_value || null;
        const acres = parcel.acres || parcel.CALC_ACRE || parcel.calc_acre || null;
        const parcelType = parcel.isContaining ? 'Containing Parcel' : 'Nearby Parcel';
        const fullAddress = [streetAddress, cityState, zipCode].filter(Boolean).join(', ');
        
        const allAttributes = { ...parcel };
        delete allAttributes.parcelId;
        delete allAttributes.pin;
        delete allAttributes.municipality;
        delete allAttributes.county;
        delete allAttributes.block;
        delete allAttributes.lot;
        delete allAttributes.ownerName;
        delete allAttributes.streetAddress;
        delete allAttributes.cityState;
        delete allAttributes.zipCode;
        delete allAttributes.landValue;
        delete allAttributes.improvementValue;
        delete allAttributes.netValue;
        delete allAttributes.acres;
        delete allAttributes.isContaining;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NJGIN',
          (location.confidence || 'N/A').toString(),
          'NJ_PARCEL',
          `${parcelType}${pin ? ` - ${pin}` : ''}${block && lot ? ` (Block ${block}, Lot ${lot})` : ''}`,
          location.lat.toString(), // Use search location for parcel (it's a polygon, not a point)
          location.lon.toString(),
          parcel.distance_miles !== null && parcel.distance_miles !== undefined ? parcel.distance_miles.toFixed(2) : (parcel.isContaining ? '0.00' : ''),
          `${municipality || ''}${county ? `, ${county}` : ''}`,
          `${fullAddress || ''}${ownerName ? ` - Owner: ${ownerName}` : ''}${landValue !== null ? ` - Land Value: $${landValue.toLocaleString()}` : ''}${improvementValue !== null ? ` - Improvement Value: $${improvementValue.toLocaleString()}` : ''}${netValue !== null ? ` - Net Value: $${netValue.toLocaleString()}` : ''}${acres !== null ? ` - Acres: ${acres.toFixed(2)}` : ''}`,
          '', // Phone (not applicable)
          attributesJson, // Full attributes in Website field
          'NJGIN'
        ]);
      });
    } else if (key === 'nj_address_points_all' && Array.isArray(value)) {
      // Handle NJ Address Points - each address point gets its own row with all attributes
      value.forEach((point: any) => {
        const fullAddress = point.fullAddress || point.FULL_ADDRESS || point.full_address || '';
        const streetName = point.streetName || point.ST_NAME || point.st_name || point.LST_NAME || point.lst_name || '';
        const streetNumber = point.streetNumber || point.ST_NUMBER || point.st_number || point.LST_NUMBER || point.lst_number || '';
        const municipality = point.municipality || point.INC_MUNI || point.inc_muni || '';
        const county = point.county || point.COUNTY || point.county || '';
        const zipCode = point.zipCode || point.POST_CODE || point.post_code || point.ZIP_CODE || point.zip_code || point.ZIP5 || point.zip5 || '';
        const subtype = point.subtype || point.SUBTYPE || point.subtype || '';
        const placement = point.placement || point.PLACEMENT || point.placement || '';
        const addressId = point.addressId || point.OBJECTID || point.objectid || point.ADDR_PT_ID || point.addr_pt_id || '';
        
        const allAttributes = { ...point };
        delete allAttributes.addressId;
        delete allAttributes.fullAddress;
        delete allAttributes.streetName;
        delete allAttributes.streetNumber;
        delete allAttributes.municipality;
        delete allAttributes.county;
        delete allAttributes.zipCode;
        delete allAttributes.subtype;
        delete allAttributes.placement;
        delete allAttributes.lat;
        delete allAttributes.lon;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NJGIN',
          (location.confidence || 'N/A').toString(),
          'NJ_ADDRESS_POINT',
          `${fullAddress || 'Address Point'}${addressId ? ` (ID: ${addressId})` : ''}`,
          point.lat ? point.lat.toString() : location.lat.toString(),
          point.lon ? point.lon.toString() : location.lon.toString(),
          point.distance_miles !== null && point.distance_miles !== undefined ? point.distance_miles.toFixed(2) : '',
          `${municipality || ''}${county ? `, ${county}` : ''}`,
          `${streetNumber ? `${streetNumber} ` : ''}${streetName || ''}${zipCode ? `, ${zipCode}` : ''}${subtype ? ` - Type: ${subtype}` : ''}${placement ? ` - Placement: ${placement}` : ''}`,
          '', // Phone (not applicable)
          attributesJson, // Full attributes in Website field
          'NJGIN'
        ]);
      });
    } else if (key === 'nj_bus_stops_all' && Array.isArray(value)) {
      // Handle NJ Bus Stops - each bus stop gets its own row with all attributes
      value.forEach((stop: any) => {
        const description = stop.description || stop.DESCRIPTION_BSL || stop.description_bsl || 'Bus Stop';
        const stopNumber = stop.stopNumber || stop.STOP_NUM || stop.stop_num || '';
        const county = stop.county || stop.COUNTY || stop.county || '';
        const municipality = stop.municipality || stop.MUNICIPALITY || stop.municipality || '';
        const stopType = stop.stopType || stop.STOP_TYPE || stop.stop_type || '';
        const direction = stop.direction || stop.DIRECTION_OP || stop.direction_op || '';
        const streetDirection = stop.streetDirection || stop.STREET_DIR || stop.street_dir || '';
        const allLines = stop.allLines || stop.ALL_LINES || stop.all_lines || '';
        
        const allAttributes = { ...stop };
        delete allAttributes.stopId;
        delete allAttributes.stopNumber;
        delete allAttributes.description;
        delete allAttributes.county;
        delete allAttributes.municipality;
        delete allAttributes.stopType;
        delete allAttributes.direction;
        delete allAttributes.streetDirection;
        delete allAttributes.allLines;
        delete allAttributes.lat;
        delete allAttributes.lon;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NJGIN',
          (location.confidence || 'N/A').toString(),
          'NJ_BUS_STOP',
          `${description}${stopNumber ? ` (Stop #${stopNumber})` : ''}`,
          stop.lat ? stop.lat.toString() : location.lat.toString(),
          stop.lon ? stop.lon.toString() : location.lon.toString(),
          stop.distance_miles !== null && stop.distance_miles !== undefined ? stop.distance_miles.toFixed(2) : '',
          `${municipality || ''}${county ? `, ${county}` : ''}`,
          `${description || ''}${stopType ? ` - Type: ${stopType}` : ''}${direction ? ` - Direction: ${direction}` : ''}${streetDirection ? ` - Street Dir: ${streetDirection}` : ''}${allLines ? ` - Lines: ${allLines}` : ''}`,
          '', // Phone (not applicable)
          attributesJson, // Full attributes in Website field
          'NJGIN'
        ]);
      });
    } else if (key === 'nj_safety_service_patrol_all' && Array.isArray(value)) {
      // Handle NJ Safety Service Patrol - each route gets its own row with all attributes
      value.forEach((route: any) => {
        const routeName = route.routeName || route.SRI_ || route.sri_ || route.ROUTE || route.route || 'Safety Service Patrol Route';
        const sri = route.sri || route.SRI || route.sri || '';
        const beginMile = route.beginMile !== null && route.beginMile !== undefined ? route.beginMile : null;
        const endMile = route.endMile !== null && route.endMile !== undefined ? route.endMile : null;
        const totalMiles = route.totalMiles !== null && route.totalMiles !== undefined ? route.totalMiles : null;
        const category = route.category || route.CAT || route.cat || '';
        const categoryType = route.categoryType || route.CAT_1 || route.cat_1 || '';
        
        const allAttributes = { ...route };
        delete allAttributes.routeId;
        delete allAttributes.routeName;
        delete allAttributes.sri;
        delete allAttributes.beginMile;
        delete allAttributes.endMile;
        delete allAttributes.totalMiles;
        delete allAttributes.category;
        delete allAttributes.categoryType;
        delete allAttributes.locationError;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NJGIN',
          (location.confidence || 'N/A').toString(),
          'NJ_SAFETY_SERVICE_PATROL',
          `${routeName}${sri ? ` (${sri})` : ''}`,
          location.lat.toString(), // Use search location (route is a line, not a point)
          location.lon.toString(),
          route.distance_miles !== null && route.distance_miles !== undefined ? route.distance_miles.toFixed(2) : '',
          category || '',
          `${routeName || ''}${beginMile !== null ? ` - Begin: ${beginMile.toFixed(2)} mi` : ''}${endMile !== null ? ` - End: ${endMile.toFixed(2)} mi` : ''}${totalMiles !== null ? ` - Total: ${totalMiles.toFixed(2)} mi` : ''}${categoryType ? ` - Type: ${categoryType}` : ''}`,
          '', // Phone (not applicable)
          attributesJson, // Full attributes in Website field
          'NJGIN'
        ]);
      });
    } else if (key === 'nj_service_areas_all' && Array.isArray(value)) {
      // Handle NJ Service Areas - each service area gets its own row with all attributes
      value.forEach((area: any) => {
        const name = area.name || area.NAME || area.name || 'Service Area';
        const route = area.route || area.ROUTE || area.route || '';
        const milepost = area.milepost !== null && area.milepost !== undefined ? area.milepost : null;
        const lineType = area.lineType || area.LINETYPE || area.linetype || '';
        const rotation = area.rotation !== null && area.rotation !== undefined ? area.rotation : null;
        
        const allAttributes = { ...area };
        delete allAttributes.name;
        delete allAttributes.route;
        delete allAttributes.milepost;
        delete allAttributes.lineType;
        delete allAttributes.rotation;
        delete allAttributes.lat;
        delete allAttributes.lon;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NJGIN',
          (location.confidence || 'N/A').toString(),
          'NJ_SERVICE_AREA',
          `${name}${route ? ` (${route})` : ''}${milepost !== null ? ` - Milepost ${milepost.toFixed(2)}` : ''}`,
          area.lat ? area.lat.toString() : location.lat.toString(),
          area.lon ? area.lon.toString() : location.lon.toString(),
          area.distance_miles !== null && area.distance_miles !== undefined ? area.distance_miles.toFixed(2) : '',
          route || '',
          `${name || ''}${milepost !== null ? ` - Milepost: ${milepost.toFixed(2)}` : ''}${lineType ? ` - Line Type: ${lineType}` : ''}${rotation !== null ? ` - Rotation: ${rotation}°` : ''}`,
          '', // Phone (not applicable)
          attributesJson, // Full attributes in Website field
          'NJGIN'
        ]);
      });
    } else if (key === 'nj_roadway_network_all' && Array.isArray(value)) {
      // Handle NJ Roadway Network - each roadway segment gets its own row with all attributes
      value.forEach((roadway: any) => {
        const sldName = roadway.sldName || roadway.SLD_NAME || roadway.sld_name || roadway.NAME || roadway.name || 'Roadway Segment';
        const sri = roadway.sri || roadway.SRI || roadway.sri || '';
        const parentSRI = roadway.parentSRI || roadway.PARENT_SRI || roadway.parent_sri || '';
        const mpStart = roadway.mpStart !== null && roadway.mpStart !== undefined ? roadway.mpStart : null;
        const mpEnd = roadway.mpEnd !== null && roadway.mpEnd !== undefined ? roadway.mpEnd : null;
        const measuredLength = roadway.measuredLength !== null && roadway.measuredLength !== undefined ? roadway.measuredLength : null;
        const direction = roadway.direction || roadway.DIRECTION || roadway.direction || '';
        const active = roadway.active || roadway.ACTIVE || roadway.active || '';
        const routeSubtype = roadway.routeSubtype !== null && roadway.routeSubtype !== undefined ? roadway.routeSubtype : null;
        const roadNum = roadway.roadNum || roadway.ROAD_NUM || roadway.road_num || '';
        
        const allAttributes = { ...roadway };
        delete allAttributes.roadwayId;
        delete allAttributes.sri;
        delete allAttributes.sldName;
        delete allAttributes.parentSRI;
        delete allAttributes.mpStart;
        delete allAttributes.mpEnd;
        delete allAttributes.parentMpStart;
        delete allAttributes.parentMpEnd;
        delete allAttributes.measuredLength;
        delete allAttributes.direction;
        delete allAttributes.active;
        delete allAttributes.routeSubtype;
        delete allAttributes.roadNum;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NJGIN',
          (location.confidence || 'N/A').toString(),
          'NJ_ROADWAY_NETWORK',
          `${sldName}${sri ? ` (${sri})` : ''}`,
          location.lat.toString(), // Use search location (roadway is a line, not a point)
          location.lon.toString(),
          roadway.distance_miles !== null && roadway.distance_miles !== undefined ? roadway.distance_miles.toFixed(2) : '',
          parentSRI || sri || '',
          `${sldName || ''}${mpStart !== null ? ` - MP Start: ${mpStart.toFixed(3)}` : ''}${mpEnd !== null ? ` - MP End: ${mpEnd.toFixed(3)}` : ''}${measuredLength !== null ? ` - Length: ${measuredLength.toFixed(3)} mi` : ''}${direction ? ` - Direction: ${direction}` : ''}${active ? ` - Active: ${active}` : ''}${routeSubtype !== null ? ` - Route Subtype: ${routeSubtype}` : ''}${roadNum ? ` - Road #: ${roadNum}` : ''}`,
          '', // Phone (not applicable)
          attributesJson, // Full attributes in Website field
          'NJGIN'
        ]);
      });
    } else if (key === 'nj_known_contaminated_sites_all' && Array.isArray(value)) {
      // Handle NJ Known Contaminated Sites - each site gets its own row with all attributes
      value.forEach((site: any) => {
        const siteName = site.siteName || site.SITE_NAME || site.site_name || site.NAME || site.name || site.SITE || site.site || 'Unknown Site';
        const address = site.address || site.ADDRESS || site.address || '';
        const municipality = site.municipality || site.MUNICIPALITY || site.municipality || '';
        const county = site.county || site.COUNTY || site.county || '';
        const zipCode = site.zipCode || site.ZIP_CODE || site.zip_code || site.ZIP || site.zip || '';
        const siteType = site.siteType || site.SITE_TYPE || site.site_type || site.TYPE || site.type || '';
        const status = site.status || site.STATUS || site.status || site.SITE_STATUS || site.site_status || '';
        
        const allAttributes = { ...site };
        delete allAttributes.siteId;
        delete allAttributes.siteName;
        delete allAttributes.address;
        delete allAttributes.municipality;
        delete allAttributes.county;
        delete allAttributes.zipCode;
        delete allAttributes.siteType;
        delete allAttributes.status;
        delete allAttributes.lat;
        delete allAttributes.lon;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NJDEP',
          (location.confidence || 'N/A').toString(),
          'NJ_KNOWN_CONTAMINATED_SITES',
          `${siteName}${siteType ? ` (${siteType})` : ''}`,
          site.lat ? site.lat.toString() : location.lat.toString(),
          site.lon ? site.lon.toString() : location.lon.toString(),
          site.distance_miles !== null && site.distance_miles !== undefined ? site.distance_miles.toFixed(2) : '',
          siteType || '',
          `${siteName || ''}${address ? ` - ${address}` : ''}${municipality ? `, ${municipality}` : ''}${county ? `, ${county}` : ''}${zipCode ? ` ${zipCode}` : ''}${status ? ` - Status: ${status}` : ''}`,
          '', // Phone (not applicable)
          attributesJson, // Full attributes in Website field
          'NJDEP'
        ]);
      });
    } else if (key === 'nj_alternative_fuel_stations_all' && Array.isArray(value)) {
      // Handle NJ Alternative Fueled Vehicle Fueling Stations - each station gets its own row with all attributes
      value.forEach((station: any) => {
        const stationName = station.stationName || station.STATION_NAME || station.station_name || station.NAME || station.name || station.FACILITY_NAME || station.facility_name || 'Unknown Station';
        const address = station.address || station.ADDRESS || station.address || '';
        const municipality = station.municipality || station.MUNICIPALITY || station.municipality || '';
        const county = station.county || station.COUNTY || station.county || '';
        const zipCode = station.zipCode || station.ZIP_CODE || station.zip_code || station.ZIP || station.zip || '';
        const fuelType = station.fuelType || station.FUEL_TYPE || station.fuel_type || station.TYPE || station.type || station.ALTERNATIVE_FUEL || station.alternative_fuel || '';
        const stationType = station.stationType || station.STATION_TYPE || station.station_type || station.FACILITY_TYPE || station.facility_type || '';
        
        const allAttributes = { ...station };
        delete allAttributes.stationId;
        delete allAttributes.stationName;
        delete allAttributes.address;
        delete allAttributes.municipality;
        delete allAttributes.county;
        delete allAttributes.zipCode;
        delete allAttributes.fuelType;
        delete allAttributes.stationType;
        delete allAttributes.lat;
        delete allAttributes.lon;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NJDEP',
          (location.confidence || 'N/A').toString(),
          'NJ_ALTERNATIVE_FUEL_STATIONS',
          `${stationName}${fuelType ? ` (${fuelType})` : ''}`,
          station.lat ? station.lat.toString() : location.lat.toString(),
          station.lon ? station.lon.toString() : location.lon.toString(),
          station.distance_miles !== null && station.distance_miles !== undefined ? station.distance_miles.toFixed(2) : '',
          fuelType || '',
          `${stationName || ''}${address ? ` - ${address}` : ''}${municipality ? `, ${municipality}` : ''}${county ? `, ${county}` : ''}${zipCode ? ` ${zipCode}` : ''}${stationType ? ` - Type: ${stationType}` : ''}`,
          '', // Phone (not applicable)
          attributesJson, // Full attributes in Website field
          'NJDEP'
        ]);
      });
    } else if (key === 'nj_power_plants_all' && Array.isArray(value)) {
      // Handle NJ Power Plants - each plant gets its own row with all attributes
      value.forEach((plant: any) => {
        const plantName = plant.plantName || plant.PLANT_NAME || plant.plant_name || plant.NAME || plant.name || 'Unknown Power Plant';
        const utilityName = plant.utilityName || plant.UTILITY_NAME || plant.utility_name || '';
        const city = plant.city || plant.CITY || plant.city || '';
        const county = plant.county || plant.COUNTY || plant.county || '';
        const streetAddress = plant.streetAddress || plant.STREET_ADD || plant.street_add || plant.ADDRESS || plant.address || '';
        const primarySource = plant.primarySource || plant.PRIMSOURCE || plant.primsource || plant.PRIMARY_SOURCE || plant.primary_source || '';
        const installMW = plant.installMW !== null && plant.installMW !== undefined ? plant.installMW : null;
        const totalMW = plant.totalMW !== null && plant.totalMW !== undefined ? plant.totalMW : null;
        const sourceDescription = plant.sourceDescription || plant.SOURCE_DES || plant.source_des || '';
        const technical = plant.technical || plant.TECHNICAL || plant.technical || '';
        const edc = plant.edc || plant.EDC || plant.edc || '';
        const gridSupply = plant.gridSupply || plant.GRIDSUPPLY || plant.gridsupply || '';
        
        const allAttributes = { ...plant };
        delete allAttributes.plantId;
        delete allAttributes.plantCode;
        delete allAttributes.plantName;
        delete allAttributes.utilityName;
        delete allAttributes.siteId;
        delete allAttributes.airPi;
        delete allAttributes.city;
        delete allAttributes.county;
        delete allAttributes.streetAddress;
        delete allAttributes.primarySource;
        delete allAttributes.installMW;
        delete allAttributes.totalMW;
        delete allAttributes.sourceDescription;
        delete allAttributes.technical;
        delete allAttributes.edc;
        delete allAttributes.gridSupply;
        delete allAttributes.dmrLink;
        delete allAttributes.lat;
        delete allAttributes.lon;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NJDEP',
          (location.confidence || 'N/A').toString(),
          'NJ_POWER_PLANTS',
          `${plantName}${primarySource ? ` (${primarySource})` : ''}`,
          plant.lat ? plant.lat.toString() : location.lat.toString(),
          plant.lon ? plant.lon.toString() : location.lon.toString(),
          plant.distance_miles !== null && plant.distance_miles !== undefined ? plant.distance_miles.toFixed(2) : '',
          primarySource || '',
          `${plantName || ''}${utilityName ? ` - Utility: ${utilityName}` : ''}${streetAddress ? ` - ${streetAddress}` : ''}${city ? `, ${city}` : ''}${county ? `, ${county}` : ''}${installMW !== null ? ` - Installed: ${installMW.toFixed(1)} MW` : ''}${totalMW !== null ? ` - Total: ${totalMW.toFixed(1)} MW` : ''}${sourceDescription ? ` - ${sourceDescription}` : ''}${technical ? ` - ${technical}` : ''}${edc ? ` - EDC: ${edc}` : ''}${gridSupply ? ` - Grid Supply: ${gridSupply}` : ''}`,
          '', // Phone (not applicable)
          attributesJson, // Full attributes in Website field
          'NJDEP'
        ]);
      });
    } else if (key === 'nj_public_solar_facilities_all' && Array.isArray(value)) {
      // Handle NJ Public Solar Facilities - each facility gets its own row with all attributes
      value.forEach((facility: any) => {
        const companyName = facility.companyName || facility.COMPNAME || facility.compname || facility.COMPANY_NAME || facility.company_name || facility.NAME || facility.name || 'Unknown Facility';
        const systemSize = facility.systemSize !== null && facility.systemSize !== undefined ? facility.systemSize : null;
        const customerType = facility.customerType || facility.CUSTOMERTYPE || facility.customertype || facility.CUSTOMER_TYPE || facility.customer_type || '';
        const installAddress = facility.installAddress || facility.INSTALLADD || facility.installadd || facility.INSTALL_ADDRESS || facility.install_address || facility.ADDRESS || facility.address || '';
        const installCity = facility.installCity || facility.INSTALLCITY || facility.installcity || facility.INSTALL_CITY || facility.install_city || facility.CITY || facility.city || '';
        const installZip = facility.installZip || facility.INSTALLZIP || facility.installzip || facility.INSTALL_ZIP || facility.install_zip || facility.ZIP || facility.zip || '';
        const installer = facility.installer || facility.INSTALLER || facility.installer || '';
        const statusDate = facility.statusDate !== null && facility.statusDate !== undefined ? facility.statusDate : null;
        
        // Format status date if available
        let statusDateFormatted = '';
        if (statusDate !== null) {
          try {
            const date = new Date(statusDate);
            statusDateFormatted = date.toLocaleDateString();
          } catch (e) {
            statusDateFormatted = statusDate.toString();
          }
        }
        
        const allAttributes = { ...facility };
        delete allAttributes.facilityId;
        delete allAttributes.accountNumber;
        delete allAttributes.companyName;
        delete allAttributes.systemSize;
        delete allAttributes.customerType;
        delete allAttributes.installAddress;
        delete allAttributes.installCity;
        delete allAttributes.installZip;
        delete allAttributes.installer;
        delete allAttributes.statusDate;
        delete allAttributes.lat;
        delete allAttributes.lon;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NJDEP',
          (location.confidence || 'N/A').toString(),
          'NJ_PUBLIC_SOLAR_FACILITIES',
          `${companyName}${systemSize !== null ? ` (${systemSize.toFixed(2)} kW)` : ''}`,
          facility.lat ? facility.lat.toString() : location.lat.toString(),
          facility.lon ? facility.lon.toString() : location.lon.toString(),
          facility.distance_miles !== null && facility.distance_miles !== undefined ? facility.distance_miles.toFixed(2) : '',
          customerType || '',
          `${companyName || ''}${installAddress ? ` - ${installAddress}` : ''}${installCity ? `, ${installCity}` : ''}${installZip ? ` ${installZip}` : ''}${systemSize !== null ? ` - System Size: ${systemSize.toFixed(2)} kW` : ''}${installer ? ` - Installer: ${installer}` : ''}${statusDateFormatted ? ` - Status Date: ${statusDateFormatted}` : ''}`,
          '', // Phone (not applicable)
          attributesJson, // Full attributes in Website field
          'NJDEP'
        ]);
      });
    } else if (key === 'nj_public_places_to_keep_cool_all' && Array.isArray(value)) {
      // Handle NJ Public Places to Keep Cool - each place gets its own row with all attributes
      value.forEach((place: any) => {
        const featureName = place.featureName || place.FEATURE_NAME || place.feature_name || place.NAME || place.name || 'Unknown Place';
        const featureType = place.featureType || place.FEATURE_TYPE || place.feature_type || place.FeatureType || '';
        const address = place.address || place.ADDRESS || place.address || '';
        const city = place.city || place.CITY || place.city || '';
        const zip = place.zip || place.ZIP || place.zip || '';
        const municipality = place.municipality || place.MUNICIPALITY || place.municipality || '';
        const county = place.county || place.COUNTY || place.county || '';
        const website = place.website || place.WEBSITE || place.website || '';
        const phoneNumber = place.phoneNumber || place.PHONE_NUMBER || place.phone_number || place.PHONE || place.phone || '';
        const admission = place.admission || place.ADMISSION || place.admission || '';
        const in211 = place.in211 || place.IN_211 || place.in_211 || place.IN211 || place.in211 || '';
        const notes = place.notes || place.NOTES || place.notes || '';
        
        const allAttributes = { ...place };
        delete allAttributes.placeId;
        delete allAttributes.featureType;
        delete allAttributes.featureName;
        delete allAttributes.address;
        delete allAttributes.city;
        delete allAttributes.zip;
        delete allAttributes.municipality;
        delete allAttributes.county;
        delete allAttributes.website;
        delete allAttributes.phoneNumber;
        delete allAttributes.admission;
        delete allAttributes.in211;
        delete allAttributes.notes;
        delete allAttributes.lat;
        delete allAttributes.lon;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NJDEP',
          (location.confidence || 'N/A').toString(),
          'NJ_PUBLIC_PLACES_TO_KEEP_COOL',
          featureName,
          place.lat ? place.lat.toString() : location.lat.toString(),
          place.lon ? place.lon.toString() : location.lon.toString(),
          place.distance_miles !== null && place.distance_miles !== undefined ? place.distance_miles.toFixed(2) : '',
          featureType || 'Public Place to Keep Cool',
          `${address ? `${address}` : ''}${city ? `, ${city}` : ''}${zip ? ` ${zip}` : ''}${municipality ? ` (${municipality})` : ''}${county ? `, ${county}` : ''}${phoneNumber ? ` - Phone: ${phoneNumber}` : ''}${website ? ` - Website: ${website}` : ''}${admission ? ` - Admission: ${admission}` : ''}${in211 ? ` - In 211: ${in211}` : ''}${notes ? ` - Notes: ${notes}` : ''}`,
          phoneNumber || '',
          attributesJson, // Full attributes in Website field
          'NJDEP'
        ]);
      });
    } else if (key === 'de_state_forest_all' && Array.isArray(value)) {
      // Handle DE State Forest - each feature gets its own row with all attributes
      value.forEach((feature: any) => {
        const featureType = feature.isContaining ? 'Containing State Forest' : 'Nearby State Forest';
        const county = feature.COUNTY || feature.county || '';
        const acres = feature.ACRES || feature.acres;
        const tract = feature.TRACT || feature.tract || '';
        const forest = feature.FOREST || feature.forest || '';
        const label = feature.LABEL || feature.label || '';
        
        const allAttributes = { ...feature };
        delete allAttributes.isContaining;
        delete allAttributes.distance_miles;
        delete allAttributes.geometry;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'DE FirstMap',
          (location.confidence || 'N/A').toString(),
          'DE_STATE_FOREST',
          `${featureType}${label ? ` - ${label}` : ''}${forest ? ` (${forest})` : ''}`,
          location.lat.toString(),
          location.lon.toString(),
          feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : (feature.isContaining ? '0.00' : ''),
          'State Forest',
          `${county}${tract ? ` - Tract: ${tract}` : ''}${acres !== null ? ` (${acres.toFixed(2)} acres)` : ''}`,
          '',
          attributesJson,
          'DE FirstMap'
        ]);
      });
    } else if (key === 'de_pine_plantations_all' && Array.isArray(value)) {
      // Handle DE Pine Plantations - each feature gets its own row with all attributes
      value.forEach((feature: any) => {
        const featureType = feature.isContaining ? 'Containing Pine Plantation' : 'Nearby Pine Plantation';
        const acres = feature.ACRES || feature.acres;
        
        const allAttributes = { ...feature };
        delete allAttributes.isContaining;
        delete allAttributes.distance_miles;
        delete allAttributes.geometry;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'DE FirstMap',
          (location.confidence || 'N/A').toString(),
          'DE_PINE_PLANTATION',
          featureType,
          location.lat.toString(),
          location.lon.toString(),
          feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : (feature.isContaining ? '0.00' : ''),
          'Pine Plantation',
          acres !== null ? `${acres.toFixed(2)} acres` : '',
          '',
          attributesJson,
          'DE FirstMap'
        ]);
      });
    } else if (key === 'de_urban_tree_canopy_all' && Array.isArray(value)) {
      // Handle DE Urban Tree Canopy - each feature gets its own row with all attributes
      value.forEach((feature: any) => {
        const featureType = feature.isContaining ? 'Containing Urban Tree Canopy' : 'Nearby Urban Tree Canopy';
        const name = feature.NAME || feature.name || '';
        const totalAcres = feature.TOTALACRES || feature.totalAcres || feature.TotalAcres;
        const canopyAcres = feature.CANOPYACRES || feature.canopyAcres || feature.CanopyAcres;
        const canopyPercent = feature.CANOPYPERCENT || feature.canopyPercent || feature.CanopyPercent;
        const areaType = feature.AREATYPE || feature.areaType || feature.AreaType;
        const areaTypeLabel = areaType === 0 ? 'Municipality' : areaType === 1 ? 'Community' : areaType === 2 ? 'Park' : areaType !== null ? String(areaType) : '';
        
        const allAttributes = { ...feature };
        delete allAttributes.isContaining;
        delete allAttributes.distance_miles;
        delete allAttributes.geometry;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'DE FirstMap',
          (location.confidence || 'N/A').toString(),
          'DE_URBAN_TREE_CANOPY',
          `${featureType}${name ? ` - ${name}` : ''}`,
          location.lat.toString(),
          location.lon.toString(),
          feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : (feature.isContaining ? '0.00' : ''),
          areaTypeLabel || 'Urban Tree Canopy',
          `${totalAcres !== null ? `Total: ${totalAcres.toFixed(2)} acres` : ''}${canopyAcres !== null ? `, Canopy: ${canopyAcres.toFixed(2)} acres` : ''}${canopyPercent !== null ? ` (${canopyPercent.toFixed(1)}%)` : ''}`,
          '',
          attributesJson,
          'DE FirstMap'
        ]);
      });
    } else if (key === 'de_forest_cover_2007_all' && Array.isArray(value)) {
      // Handle DE Forest Cover 2007 - each feature gets its own row with all attributes
      value.forEach((feature: any) => {
        const featureType = feature.isContaining ? 'Containing Forest Cover 2007' : 'Nearby Forest Cover 2007';
        const type = feature.TYPE || feature.type || '';
        const acres = feature.ACRES || feature.acres;
        
        const allAttributes = { ...feature };
        delete allAttributes.isContaining;
        delete allAttributes.distance_miles;
        delete allAttributes.geometry;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'DE FirstMap',
          (location.confidence || 'N/A').toString(),
          'DE_FOREST_COVER_2007',
          `${featureType}${type ? ` - ${type}` : ''}`,
          location.lat.toString(),
          location.lon.toString(),
          feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : (feature.isContaining ? '0.00' : ''),
          type || 'Forest Cover 2007',
          acres !== null ? `${acres.toFixed(2)} acres` : '',
          '',
          attributesJson,
          'DE FirstMap'
        ]);
      });
    } else if (key === 'de_no_build_points_bay_all' && Array.isArray(value)) {
      value.forEach((feature: any) => {
        const allAttributes = { ...feature };
        delete allAttributes.distance_miles;
        delete allAttributes.geometry;
        const attributesJson = JSON.stringify(allAttributes);
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(), 'DE FirstMap',
          (location.confidence || 'N/A').toString(), 'DE_NO_BUILD_POINTS_BAY', 'No Build Point - Bay',
          location.lat.toString(), location.lon.toString(),
          feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : '',
          'No Build Point - Bay', '', attributesJson, 'DE FirstMap'
        ]);
      });
    } else if (key === 'de_no_build_line_bay_all' && Array.isArray(value)) {
      value.forEach((feature: any) => {
        const allAttributes = { ...feature };
        delete allAttributes.distance_miles;
        delete allAttributes.geometry;
        const attributesJson = JSON.stringify(allAttributes);
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(), 'DE FirstMap',
          (location.confidence || 'N/A').toString(), 'DE_NO_BUILD_LINE_BAY', 'No Build Line - Bay',
          location.lat.toString(), location.lon.toString(),
          feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : '',
          'No Build Line - Bay', '', attributesJson, 'DE FirstMap'
        ]);
      });
    } else if (key === 'de_no_build_points_ocean_all' && Array.isArray(value)) {
      value.forEach((feature: any) => {
        const allAttributes = { ...feature };
        delete allAttributes.distance_miles;
        delete allAttributes.geometry;
        const attributesJson = JSON.stringify(allAttributes);
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(), 'DE FirstMap',
          (location.confidence || 'N/A').toString(), 'DE_NO_BUILD_POINTS_OCEAN', 'No Build Point - Ocean',
          location.lat.toString(), location.lon.toString(),
          feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : '',
          'No Build Point - Ocean', '', attributesJson, 'DE FirstMap'
        ]);
      });
    } else if (key === 'de_no_build_line_ocean_all' && Array.isArray(value)) {
      value.forEach((feature: any) => {
        const allAttributes = { ...feature };
        delete allAttributes.distance_miles;
        delete allAttributes.geometry;
        const attributesJson = JSON.stringify(allAttributes);
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(), 'DE FirstMap',
          (location.confidence || 'N/A').toString(), 'DE_NO_BUILD_LINE_OCEAN', 'No Build Line - Ocean',
          location.lat.toString(), location.lon.toString(),
          feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : '',
          'No Build Line - Ocean', '', attributesJson, 'DE FirstMap'
        ]);
      });
    } else if (key === 'de_park_facilities_all' && Array.isArray(value)) {
      value.forEach((feature: any) => {
        const park = feature.PARK || feature.park || '';
        const facility = feature.FACILITY || feature.facility || '';
        const allAttributes = { ...feature };
        delete allAttributes.distance_miles;
        delete allAttributes.geometry;
        const attributesJson = JSON.stringify(allAttributes);
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(), 'DE FirstMap',
          (location.confidence || 'N/A').toString(), 'DE_PARK_FACILITIES', `${park || 'Park Facility'}${facility ? ` - ${facility}` : ''}`,
          location.lat.toString(), location.lon.toString(),
          feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : '',
          facility || 'Park Facility', park || '', attributesJson, 'DE FirstMap'
        ]);
      });
    } else if (key === 'de_natural_areas_all' && Array.isArray(value)) {
      value.forEach((feature: any) => {
        const featureType = feature.isContaining ? 'Containing Natural Area' : 'Nearby Natural Area';
        const name = feature.NAME || feature.name || '';
        const acres = feature.ACRES || feature.acres;
        const allAttributes = { ...feature };
        delete allAttributes.isContaining;
        delete allAttributes.distance_miles;
        delete allAttributes.geometry;
        const attributesJson = JSON.stringify(allAttributes);
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(), 'DE FirstMap',
          (location.confidence || 'N/A').toString(), 'DE_NATURAL_AREAS', `${featureType}${name ? ` - ${name}` : ''}`,
          location.lat.toString(), location.lon.toString(),
          feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : (feature.isContaining ? '0.00' : ''),
          name || 'Natural Area', acres !== null ? `${acres.toFixed(2)} acres` : '', attributesJson, 'DE FirstMap'
        ]);
      });
    } else if (key === 'de_outdoor_recreation_parks_trails_lands_all' && Array.isArray(value)) {
      value.forEach((feature: any) => {
        const featureType = feature.isContaining ? 'Containing Parks & Trails Program Land' : 'Nearby Parks & Trails Program Land';
        const name = feature.NAME || feature.name || '';
        const acres = feature.ACRES || feature.acres;
        const allAttributes = { ...feature };
        delete allAttributes.isContaining;
        delete allAttributes.distance_miles;
        delete allAttributes.geometry;
        const attributesJson = JSON.stringify(allAttributes);
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(), 'DE FirstMap',
          (location.confidence || 'N/A').toString(), 'DE_PARKS_TRAILS_PROGRAM_LANDS', `${featureType}${name ? ` - ${name}` : ''}`,
          location.lat.toString(), location.lon.toString(),
          feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : (feature.isContaining ? '0.00' : ''),
          name || 'Parks & Trails Program Land', acres !== null ? `${acres.toFixed(2)} acres` : '', attributesJson, 'DE FirstMap'
        ]);
      });
    } else if (key === 'de_land_water_conservation_fund_all' && Array.isArray(value)) {
      value.forEach((feature: any) => {
        const featureType = feature.isContaining ? 'Containing Land & Water Conservation Fund' : 'Nearby Land & Water Conservation Fund';
        const name = feature.NAME || feature.name || '';
        const acres = feature.ACRES || feature.acres;
        const allAttributes = { ...feature };
        delete allAttributes.isContaining;
        delete allAttributes.distance_miles;
        delete allAttributes.geometry;
        const attributesJson = JSON.stringify(allAttributes);
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(), 'DE FirstMap',
          (location.confidence || 'N/A').toString(), 'DE_LAND_WATER_CONSERVATION_FUND', `${featureType}${name ? ` - ${name}` : ''}`,
          location.lat.toString(), location.lon.toString(),
          feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : (feature.isContaining ? '0.00' : ''),
          name || 'Land & Water Conservation Fund', acres !== null ? `${acres.toFixed(2)} acres` : '', attributesJson, 'DE FirstMap'
        ]);
      });
    } else if (key === 'de_nature_preserves_all' && Array.isArray(value)) {
      value.forEach((feature: any) => {
        const featureType = feature.isContaining ? 'Containing Nature Preserve' : 'Nearby Nature Preserve';
        const name = feature.NAME || feature.name || '';
        const acres = feature.ACRES || feature.acres;
        const allAttributes = { ...feature };
        delete allAttributes.isContaining;
        delete allAttributes.distance_miles;
        delete allAttributes.geometry;
        const attributesJson = JSON.stringify(allAttributes);
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(), 'DE FirstMap',
          (location.confidence || 'N/A').toString(), 'DE_NATURE_PRESERVES', `${featureType}${name ? ` - ${name}` : ''}`,
          location.lat.toString(), location.lon.toString(),
          feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : (feature.isContaining ? '0.00' : ''),
          name || 'Nature Preserve', acres !== null ? `${acres.toFixed(2)} acres` : '', attributesJson, 'DE FirstMap'
        ]);
      });
    } else if (key === 'de_outdoor_recreation_areas_all' && Array.isArray(value)) {
      value.forEach((feature: any) => {
        const featureType = feature.isContaining ? 'Containing Outdoor Recreation Area' : 'Nearby Outdoor Recreation Area';
        const name = feature.NAME || feature.name || '';
        const acres = feature.ACRES || feature.acres;
        const allAttributes = { ...feature };
        delete allAttributes.isContaining;
        delete allAttributes.distance_miles;
        delete allAttributes.geometry;
        const attributesJson = JSON.stringify(allAttributes);
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(), 'DE FirstMap',
          (location.confidence || 'N/A').toString(), 'DE_OUTDOOR_RECREATION_AREAS', `${featureType}${name ? ` - ${name}` : ''}`,
          location.lat.toString(), location.lon.toString(),
          feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : (feature.isContaining ? '0.00' : ''),
          name || 'Outdoor Recreation Area', acres !== null ? `${acres.toFixed(2)} acres` : '', attributesJson, 'DE FirstMap'
        ]);
      });
    } else if (key === 'de_outdoor_recreation_parks_trails_open_space_all' && Array.isArray(value)) {
      value.forEach((feature: any) => {
        const featureType = feature.isContaining ? 'Containing Parks & Trails Open Space' : 'Nearby Parks & Trails Open Space';
        const agency = feature.AGENCY || feature.agency || '';
        const acres = feature.ACRES || feature.acres;
        const allAttributes = { ...feature };
        delete allAttributes.isContaining;
        delete allAttributes.distance_miles;
        delete allAttributes.geometry;
        const attributesJson = JSON.stringify(allAttributes);
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(), 'DE FirstMap',
          (location.confidence || 'N/A').toString(), 'DE_PARKS_TRAILS_OPEN_SPACE', `${featureType}${agency ? ` - ${agency}` : ''}`,
          location.lat.toString(), location.lon.toString(),
          feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : (feature.isContaining ? '0.00' : ''),
          agency || 'Parks & Trails Open Space', acres !== null ? `${acres.toFixed(2)} acres` : '', attributesJson, 'DE FirstMap'
        ]);
      });
    } else if (key === 'de_public_protected_lands_all' && Array.isArray(value)) {
      value.forEach((feature: any) => {
        const featureType = feature.isContaining ? 'Containing Public Protected Land' : 'Nearby Public Protected Land';
        const name = feature.NAME || feature.name || '';
        const acres = feature.ACRES || feature.acres;
        const allAttributes = { ...feature };
        delete allAttributes.isContaining;
        delete allAttributes.distance_miles;
        delete allAttributes.geometry;
        const attributesJson = JSON.stringify(allAttributes);
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(), 'DE FirstMap',
          (location.confidence || 'N/A').toString(), 'DE_PUBLIC_PROTECTED_LANDS', `${featureType}${name ? ` - ${name}` : ''}`,
          location.lat.toString(), location.lon.toString(),
          feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : (feature.isContaining ? '0.00' : ''),
          name || 'Public Protected Land', acres !== null ? `${acres.toFixed(2)} acres` : '', attributesJson, 'DE FirstMap'
        ]);
      });
    } else if (key === 'de_conservation_easements_all' && Array.isArray(value)) {
      value.forEach((feature: any) => {
        const featureType = feature.isContaining ? 'Containing Conservation Easement' : 'Nearby Conservation Easement';
        const grantor = feature.GRANTOR || feature.grantor || '';
        const acres = feature.ACRES || feature.acres;
        const allAttributes = { ...feature };
        delete allAttributes.isContaining;
        delete allAttributes.distance_miles;
        delete allAttributes.geometry;
        const attributesJson = JSON.stringify(allAttributes);
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(), 'DE FirstMap',
          (location.confidence || 'N/A').toString(), 'DE_CONSERVATION_EASEMENTS', `${featureType}${grantor ? ` - ${grantor}` : ''}`,
          location.lat.toString(), location.lon.toString(),
          feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : (feature.isContaining ? '0.00' : ''),
          grantor || 'Conservation Easement', acres !== null ? `${acres.toFixed(2)} acres` : '', attributesJson, 'DE FirstMap'
        ]);
      });
    } else if (key === 'de_trails_pathways_all' && Array.isArray(value)) {
      value.forEach((feature: any) => {
        const trailName = feature.TRAIL_NAME || feature.trailName || feature.trail_name || '';
        const managedUse = feature.MANAGED_USE || feature.managedUse || feature.managed_use || '';
        const allAttributes = { ...feature };
        delete allAttributes.distance_miles;
        delete allAttributes.geometry;
        const attributesJson = JSON.stringify(allAttributes);
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(), 'DE FirstMap',
          (location.confidence || 'N/A').toString(), 'DE_TRAILS_PATHWAYS', trailName || 'Trail',
          location.lat.toString(), location.lon.toString(),
          feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : '',
          trailName || 'Trail', managedUse || '', attributesJson, 'DE FirstMap'
        ]);
      });
    } else if (key === 'de_seasonal_restricted_areas_all' && Array.isArray(value)) {
      value.forEach((feature: any) => {
        const featureType = feature.isContaining ? 'Containing Seasonal Restricted Area' : 'Nearby Seasonal Restricted Area';
        const park = feature.PARK || feature.park || '';
        const closure = feature.CLOSURE || feature.closure || '';
        const allAttributes = { ...feature };
        delete allAttributes.isContaining;
        delete allAttributes.distance_miles;
        delete allAttributes.geometry;
        const attributesJson = JSON.stringify(allAttributes);
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(), 'DE FirstMap',
          (location.confidence || 'N/A').toString(), 'DE_SEASONAL_RESTRICTED_AREAS', `${featureType}${park ? ` - ${park}` : ''}`,
          location.lat.toString(), location.lon.toString(),
          feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : (feature.isContaining ? '0.00' : ''),
          park || 'Seasonal Restricted Area', closure || '', attributesJson, 'DE FirstMap'
        ]);
      });
    } else if (key === 'de_permanent_restricted_areas_all' && Array.isArray(value)) {
      value.forEach((feature: any) => {
        const featureType = feature.isContaining ? 'Containing Permanent Restricted Area' : 'Nearby Permanent Restricted Area';
        const park = feature.PARK || feature.park || '';
        const closure = feature.CLOSURE || feature.closure || '';
        const allAttributes = { ...feature };
        delete allAttributes.isContaining;
        delete allAttributes.distance_miles;
        delete allAttributes.geometry;
        const attributesJson = JSON.stringify(allAttributes);
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(), 'DE FirstMap',
          (location.confidence || 'N/A').toString(), 'DE_PERMANENT_RESTRICTED_AREAS', `${featureType}${park ? ` - ${park}` : ''}`,
          location.lat.toString(), location.lon.toString(),
          feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : (feature.isContaining ? '0.00' : ''),
          park || 'Permanent Restricted Area', closure || '', attributesJson, 'DE FirstMap'
        ]);
      });
    } else if (key === 'de_wildlife_area_boundaries_all' && Array.isArray(value)) {
      value.forEach((feature: any) => {
        const featureType = feature.isContaining ? 'Containing Wildlife Area' : 'Nearby Wildlife Area';
        const areaName = feature.AREA_NAME || feature.areaName || feature.area_name || '';
        const tractName = feature.TRACT_NAME || feature.tractName || feature.tract_name || '';
        const acres = feature.GIS_ACRES || feature.gisAcres || feature.gis_acres;
        const allAttributes = { ...feature };
        delete allAttributes.isContaining;
        delete allAttributes.distance_miles;
        delete allAttributes.geometry;
        const attributesJson = JSON.stringify(allAttributes);
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(), 'DE FirstMap',
          (location.confidence || 'N/A').toString(), 'DE_WILDLIFE_AREA_BOUNDARIES', `${featureType}${areaName ? ` - ${areaName}` : ''}`,
          location.lat.toString(), location.lon.toString(),
          feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : (feature.isContaining ? '0.00' : ''),
          areaName || 'Wildlife Area', `${tractName ? `${tractName}, ` : ''}${acres !== null ? `${acres.toFixed(2)} acres` : ''}`, attributesJson, 'DE FirstMap'
        ]);
      });
    } else if (key === 'nh_key_destinations_all' && Array.isArray(value)) {
      // Handle NH Key Destinations - each destination gets its own row with all attributes
      value.forEach((dest: any) => {
        // Extract name and type
        const destName = dest.name || dest.NAME || dest.Name || dest._name || 'Unknown Destination';
        const destType = dest.type || dest.TYPE || dest.Type || dest._type || 'Unknown Type';
        
        // Extract common destination attributes
        const address = dest.address || dest.ADDRESS || dest.SITE_ADDR || dest.site_addr || '';
        const city = dest.city || dest.CITY || dest.MUNICIPALITY || dest.municipality || dest.town || dest.TOWN || '';
        const state = dest.state || dest.STATE || 'NH';
        const zip = dest.zip || dest.ZIP || dest.ZIP_CODE || dest.zip_code || '';
        const fullAddress = [address, city, state, zip].filter(Boolean).join(', ');
        
        // Collect all other attributes as a JSON string for full data access
        const allAttributes = { ...dest };
        delete allAttributes.name;
        delete allAttributes.type;
        delete allAttributes.lat;
        delete allAttributes.lon;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NH GRANIT',
          (location.confidence || 'N/A').toString(),
          'NH_KEY_DESTINATION',
          destName,
          (dest.lat || location.lat).toString(),
          (dest.lon || location.lon).toString(),
          dest.distance_miles !== null && dest.distance_miles !== undefined ? dest.distance_miles.toFixed(2) : '',
          destType,
          fullAddress || attributesJson, // Use address if available, otherwise full JSON
          '', // Owner (not applicable for destinations)
          '', // Phone (not applicable for destinations)
          attributesJson, // Full attributes in Website field for easy access
          'NH GRANIT'
        ]);
      });
    } else if (key === 'nh_nursing_homes_all' && Array.isArray(value)) {
      // Handle NH Nursing Homes - each nursing home gets its own row with all attributes
      value.forEach((home: any) => {
        // Extract name and facility type
        const homeName = home.name || home.NAME || home.Name || home._name || 'Unknown Nursing Home';
        const facType = home.fac_type || home.FAC_TYPE || home.FacType || home._fac_type || 'Unknown Type';
        
        // Extract address information
        const address = home.address || home.ADDRESS || home.Address || '';
        const city = home.city || home.CITY || home.City || '';
        const state = home.state || home.STATE || home.State || 'NH';
        const zip = home.zip || home.ZIP || home.Zip || '';
        const telephone = home.telephone || home.TELEPHONE || home.Telephone || '';
        const fullAddress = [address, city, state, zip].filter(Boolean).join(', ');
        
        // Collect all other attributes as a JSON string for full data access
        const allAttributes = { ...home };
        delete allAttributes.name;
        delete allAttributes.fac_type;
        delete allAttributes.address;
        delete allAttributes.city;
        delete allAttributes.state;
        delete allAttributes.zip;
        delete allAttributes.telephone;
        delete allAttributes.beds;
        delete allAttributes.lat;
        delete allAttributes.lon;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NH GRANIT',
          (location.confidence || 'N/A').toString(),
          'NH_NURSING_HOME',
          homeName,
          (home.lat || location.lat).toString(),
          (home.lon || location.lon).toString(),
          home.distance_miles !== null && home.distance_miles !== undefined ? home.distance_miles.toFixed(2) : '',
          facType,
          fullAddress || attributesJson, // Use address if available, otherwise full JSON
          telephone,
          '', // Website (not typically available for nursing homes)
          attributesJson, // Full attributes in Website field for easy access
          'NH GRANIT'
        ]);
      });
    } else if (key === 'nh_ems_all' && Array.isArray(value)) {
      // Handle NH EMS - each EMS facility gets its own row with all attributes
      value.forEach((facility: any) => {
        const facilityName = facility.name || facility.NAME || facility.Name || facility._name || 'Unknown EMS Facility';
        const facilityType = facility.type || facility.TYPE || facility.Type || facility._type || 'Unknown Type';
        
        const address = facility.address || facility.ADDRESS || facility.Address || '';
        const city = facility.city || facility.CITY || facility.City || '';
        const state = facility.state || facility.STATE || facility.State || 'NH';
        const zip = facility.zip || facility.ZIP || facility.Zip || '';
        const telephone = facility.telephone || facility.TELEPHONE || facility.Telephone || '';
        const fullAddress = [address, city, state, zip].filter(Boolean).join(', ');
        
        const allAttributes = { ...facility };
        delete allAttributes.name;
        delete allAttributes.type;
        delete allAttributes.address;
        delete allAttributes.city;
        delete allAttributes.state;
        delete allAttributes.zip;
        delete allAttributes.telephone;
        delete allAttributes.owner;
        delete allAttributes.lat;
        delete allAttributes.lon;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NH GRANIT',
          (location.confidence || 'N/A').toString(),
          'NH_EMS',
          facilityName,
          (facility.lat || location.lat).toString(),
          (facility.lon || location.lon).toString(),
          facility.distance_miles !== null && facility.distance_miles !== undefined ? facility.distance_miles.toFixed(2) : '',
          facilityType,
          fullAddress || attributesJson,
          telephone,
          '',
          attributesJson,
          'NH GRANIT'
        ]);
      });
    } else if (key === 'nh_fire_stations_all' && Array.isArray(value)) {
      // Handle NH Fire Stations - each fire station gets its own row with all attributes
      value.forEach((station: any) => {
        const stationName = station.name || station.NAME || station.Name || station._name || 'Unknown Fire Station';
        const stationType = station.type || station.TYPE || station.Type || station._type || 'Unknown Type';
        
        const address = station.address || station.ADDRESS || station.Address || '';
        const city = station.city || station.CITY || station.City || '';
        const state = station.state || station.STATE || station.State || 'NH';
        const zip = station.zip || station.ZIP || station.Zip || '';
        const telephone = station.telephone || station.TELEPHONE || station.Telephone || '';
        const fullAddress = [address, city, state, zip].filter(Boolean).join(', ');
        
        const allAttributes = { ...station };
        delete allAttributes.name;
        delete allAttributes.type;
        delete allAttributes.address;
        delete allAttributes.city;
        delete allAttributes.state;
        delete allAttributes.zip;
        delete allAttributes.telephone;
        delete allAttributes.owner;
        delete allAttributes.fdid;
        delete allAttributes.lat;
        delete allAttributes.lon;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NH GRANIT',
          (location.confidence || 'N/A').toString(),
          'NH_FIRE_STATION',
          stationName,
          (station.lat || location.lat).toString(),
          (station.lon || location.lon).toString(),
          station.distance_miles !== null && station.distance_miles !== undefined ? station.distance_miles.toFixed(2) : '',
          stationType,
          fullAddress || attributesJson,
          telephone,
          '',
          attributesJson,
          'NH GRANIT'
        ]);
      });
    } else if (key === 'usvi_fire_stations_all' && Array.isArray(value)) {
      // Handle USVI Fire Stations - each fire station gets its own row with all attributes
      value.forEach((station: any) => {
        const stationName = station.fac_name || station.FAC_NAME || station.Fac_Name || 'Unknown Fire Station';
        const stationType = station.fac_type || station.FAC_TYPE || station.Fac_Type || 'Unknown Type';
        const territory = station.territory || station.TERRITORY || station.Territory || '';
        const county = station.county || station.COUNTY || station.County || '';
        const usng = station.usng || station.USNG || station.Usng || '';
        const floodZone = station.flood_zone || station.FLOOD_ZONE || station.Flood_Zone || '';
        
        const allAttributes = { ...station };
        delete allAttributes.fac_name;
        delete allAttributes.fac_type;
        delete allAttributes.territory;
        delete allAttributes.county;
        delete allAttributes.x;
        delete allAttributes.y;
        delete allAttributes.usng;
        delete allAttributes.flood_zone;
        delete allAttributes.lat;
        delete allAttributes.lon;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        const locationInfo = [territory, county].filter(Boolean).join(', ');
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'USVI Open Data',
          (location.confidence || 'N/A').toString(),
          'USVI_FIRE_STATION',
          stationName,
          (station.lat || location.lat).toString(),
          (station.lon || location.lon).toString(),
          station.distance_miles !== null && station.distance_miles !== undefined ? station.distance_miles.toFixed(2) : '',
          stationType,
          locationInfo || attributesJson,
          '',
          usng || floodZone || '',
          attributesJson,
          'USVI Open Data'
        ]);
      });
    } else if (key === 'usvi_police_stations_all' && Array.isArray(value)) {
      // Handle USVI Police Stations - each police station gets its own row with all attributes
      value.forEach((station: any) => {
        const stationName = station.fac_name || station.FAC_NAME || station.Fac_Name || 'Unknown Police Station';
        const stationType = station.fac_type || station.FAC_TYPE || station.Fac_Type || 'Unknown Type';
        const territory = station.territory || station.TERRITORY || station.Territory || '';
        const county = station.county || station.COUNTY || station.County || '';
        const usng = station.usng || station.USNG || station.Usng || '';
        const floodZone = station.flood_zone || station.FLOOD_ZONE || station.Flood_Zone || '';
        
        const allAttributes = { ...station };
        delete allAttributes.fac_name;
        delete allAttributes.fac_type;
        delete allAttributes.territory;
        delete allAttributes.county;
        delete allAttributes.x;
        delete allAttributes.y;
        delete allAttributes.usng;
        delete allAttributes.flood_zone;
        delete allAttributes.lat;
        delete allAttributes.lon;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        const locationInfo = [territory, county].filter(Boolean).join(', ');
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'USVI Open Data',
          (location.confidence || 'N/A').toString(),
          'USVI_POLICE_STATION',
          stationName,
          (station.lat || location.lat).toString(),
          (station.lon || location.lon).toString(),
          station.distance_miles !== null && station.distance_miles !== undefined ? station.distance_miles.toFixed(2) : '',
          stationType,
          locationInfo || attributesJson,
          '',
          usng || floodZone || '',
          attributesJson,
          'USVI Open Data'
        ]);
      });
    } else if (key === 'usvi_health_care_facilities_all' && Array.isArray(value)) {
      // Handle USVI Health Care Facilities - each facility gets its own row with all attributes
      value.forEach((facility: any) => {
        const facilityName = facility.facilityName || facility.FacilityName || facility.facility_name || 'Unknown Health Care Facility';
        const facilityType = facility.fac_type || facility.FAC_TYPE || facility.Fac_Type || 'Unknown Type';
        const territory = facility.territory || facility.TERRITORY || facility.Territory || '';
        const county = facility.county || facility.COUNTY || facility.County || '';
        const address = facility.address || facility.Address || facility.ADDRESS || '';
        const usng = facility.usng || facility.USNG || facility.Usng || '';
        const genCapaci = facility.gen_capaci || facility.GEN_CAPACI || facility.Gen_Capaci || '';
        const dieselGal = facility.diesel_gal || facility.DIESEL_GAL || facility.Diesel_Gal || '';
        
        const allAttributes = { ...facility };
        delete allAttributes.facilityName;
        delete allAttributes.fac_type;
        delete allAttributes.territory;
        delete allAttributes.county;
        delete allAttributes.address;
        delete allAttributes.latitude;
        delete allAttributes.longitude;
        delete allAttributes.usng;
        delete allAttributes.gen_capaci;
        delete allAttributes.diesel_gal;
        delete allAttributes.watch_warning;
        delete allAttributes.hurricane_force_wind_prob;
        delete allAttributes.cone_intersection;
        delete allAttributes.upload_time;
        delete allAttributes.lat;
        delete allAttributes.lon;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        const locationInfo = [territory, county, address].filter(Boolean).join(', ');
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'USVI Open Data',
          (location.confidence || 'N/A').toString(),
          'USVI_HEALTH_CARE_FACILITY',
          facilityName,
          (facility.lat || location.lat).toString(),
          (facility.lon || location.lon).toString(),
          facility.distance_miles !== null && facility.distance_miles !== undefined ? facility.distance_miles.toFixed(2) : '',
          facilityType,
          locationInfo || attributesJson,
          '',
          usng || genCapaci || dieselGal || '',
          attributesJson,
          'USVI Open Data'
        ]);
      });
    } else if (key === 'guam_villages_all' && Array.isArray(value)) {
      // Handle Guam Villages - each village gets its own row with all attributes
      value.forEach((village: any) => {
        const villageName = village.NAME || village.name || village.Name || 'Unknown Village';
        const isContaining = village.isContaining ? 'Yes' : 'No';
        const distance = village.distance_miles !== null && village.distance_miles !== undefined ? village.distance_miles.toFixed(2) : (village.isContaining ? '0.00' : '');
        
        // Extract coordinates from geometry (polygon - use first coordinate)
        let lat = '';
        let lon = '';
        if (village.geometry && village.geometry.rings && village.geometry.rings.length > 0) {
          const outerRing = village.geometry.rings[0];
          if (outerRing && outerRing.length > 0) {
            lat = outerRing[0][1].toString();
            lon = outerRing[0][0].toString();
          }
        }
        
        const allAttributes = { ...village };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.NAME;
        delete allAttributes.name;
        delete allAttributes.Name;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'Guam Open Data',
          (location.confidence || 'N/A').toString(),
          'GUAM_VILLAGE',
          villageName,
          lat || location.lat.toString(),
          lon || location.lon.toString(),
          distance,
          'Village',
          isContaining,
          '',
          '',
          attributesJson,
          'Guam Open Data'
        ]);
      });
    } else if (key === 'guam_state_boundary_all' && Array.isArray(value)) {
      // Handle Guam State Boundary - each boundary gets its own row with all attributes
      value.forEach((boundary: any) => {
        const isContaining = boundary.isContaining ? 'Yes' : 'No';
        const distance = boundary.distance_miles !== null && boundary.distance_miles !== undefined ? boundary.distance_miles.toFixed(2) : (boundary.isContaining ? '0.00' : '');
        
        // Extract coordinates from geometry (polygon - use first coordinate)
        let lat = '';
        let lon = '';
        if (boundary.geometry && boundary.geometry.rings && boundary.geometry.rings.length > 0) {
          const outerRing = boundary.geometry.rings[0];
          if (outerRing && outerRing.length > 0) {
            lat = outerRing[0][1].toString();
            lon = outerRing[0][0].toString();
          }
        }
        
        const allAttributes = { ...boundary };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'Guam Open Data',
          (location.confidence || 'N/A').toString(),
          'GUAM_STATE_BOUNDARY',
          'Guam State Boundary',
          lat || location.lat.toString(),
          lon || location.lon.toString(),
          distance,
          'State Boundary',
          isContaining,
          '',
          '',
          attributesJson,
          'Guam Open Data'
        ]);
      });
    } else if (key === 'nh_places_of_worship_all' && Array.isArray(value)) {
      // Handle NH Places of Worship - each place gets its own row with all attributes
      value.forEach((place: any) => {
        const placeName = place.name || place.NAME || place.Name || place._name || 'Unknown Place of Worship';
        const subtype = place.subtype || place.SUBTYPE || place.Subtype || place._subtype || 'Unknown Type';
        const denom = place.denom || place.DENOM || place.Denom || place._denom || '';
        
        const address = place.address || place.ADDRESS || place.Address || '';
        const city = place.city || place.CITY || place.City || '';
        const state = place.state || place.STATE || place.State || 'NH';
        const zip = place.zip || place.ZIP || place.Zip || '';
        const telephone = place.telephone || place.TELEPHONE || place.Telephone || '';
        const fullAddress = [address, city, state, zip].filter(Boolean).join(', ');
        
        const allAttributes = { ...place };
        delete allAttributes.name;
        delete allAttributes.subtype;
        delete allAttributes.denom;
        delete allAttributes.address;
        delete allAttributes.city;
        delete allAttributes.state;
        delete allAttributes.zip;
        delete allAttributes.telephone;
        delete allAttributes.attendance;
        delete allAttributes.lat;
        delete allAttributes.lon;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NH GRANIT',
          (location.confidence || 'N/A').toString(),
          'NH_PLACE_OF_WORSHIP',
          placeName,
          (place.lat || location.lat).toString(),
          (place.lon || location.lon).toString(),
          place.distance_miles !== null && place.distance_miles !== undefined ? place.distance_miles.toFixed(2) : '',
          `${subtype}${denom ? ` - ${denom}` : ''}`,
          fullAddress || attributesJson,
          telephone,
          '',
          attributesJson,
          'NH GRANIT'
        ]);
      });
    } else if (key === 'nh_hospitals_all' && Array.isArray(value)) {
      // Handle NH Hospitals - each hospital gets its own row with all attributes
      value.forEach((hospital: any) => {
        const hospitalName = hospital.name || hospital.NAME || hospital.Name || hospital._name || 'Unknown Hospital';
        const facType = hospital.fac_type || hospital.FAC_TYPE || hospital.FacType || hospital._fac_type || 'Unknown Type';
        
        const address = hospital.address || hospital.ADDRESS || hospital.Address || '';
        const city = hospital.city || hospital.CITY || hospital.City || '';
        const state = hospital.state || hospital.STATE || hospital.State || 'NH';
        const zip = hospital.zip || hospital.ZIP || hospital.Zip || '';
        const telephone = hospital.telephone || hospital.TELEPHONE || hospital.Telephone || '';
        const fullAddress = [address, city, state, zip].filter(Boolean).join(', ');
        
        const allAttributes = { ...hospital };
        delete allAttributes.name;
        delete allAttributes.fac_type;
        delete allAttributes.address;
        delete allAttributes.city;
        delete allAttributes.state;
        delete allAttributes.zip;
        delete allAttributes.telephone;
        delete allAttributes.beds;
        delete allAttributes.owner;
        delete allAttributes.lat;
        delete allAttributes.lon;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NH GRANIT',
          (location.confidence || 'N/A').toString(),
          'NH_HOSPITAL',
          hospitalName,
          (hospital.lat || location.lat).toString(),
          (hospital.lon || location.lon).toString(),
          hospital.distance_miles !== null && hospital.distance_miles !== undefined ? hospital.distance_miles.toFixed(2) : '',
          facType,
          fullAddress || attributesJson,
          telephone,
          '',
          attributesJson,
          'NH GRANIT'
        ]);
      });
    } else if (key === 'nh_public_waters_access_all' && Array.isArray(value)) {
      // Handle NH Access Sites to Public Waters - each site gets its own row with all attributes
      value.forEach((site: any) => {
        const facilityName = site.facility || site.FACILITY || site.Facility || site._facility || 'Unknown Access Site';
        const waterBody = site.water_body || site.WATER_BODY || site.WaterBody || site._water_body || 'Unknown Water Body';
        const wbType = site.wb_type || site.WB_TYPE || site.WbType || site._wb_type || '';
        const accessTyp = site.access_typ || site.ACCESS_TYP || site.AccessTyp || site._access_typ || '';
        
        const town = site.town || site.TOWN || site.Town || '';
        const county = site.county || site.COUNTY || site.County || '';
        const ownership = site.ownership || site.OWNERSHIP || site.Ownership || '';
        const fullLocation = [town, county, 'NH'].filter(Boolean).join(', ');
        
        // Build amenities string
        const amenities = [];
        if (site.boat === 'Yes') amenities.push('Boat');
        if (site.swim === 'Yes') amenities.push('Swim');
        if (site.fish === 'Yes') amenities.push('Fish');
        if (site.picnic === 'Yes') amenities.push('Picnic');
        if (site.camp === 'Yes') amenities.push('Camp');
        const amenitiesStr = amenities.length > 0 ? amenities.join(', ') : 'None';
        
        const allAttributes = { ...site };
        delete allAttributes.facility;
        delete allAttributes.water_body;
        delete allAttributes.wb_type;
        delete allAttributes.access_typ;
        delete allAttributes.town;
        delete allAttributes.county;
        delete allAttributes.ownership;
        delete allAttributes.boat;
        delete allAttributes.swim;
        delete allAttributes.fish;
        delete allAttributes.picnic;
        delete allAttributes.camp;
        delete allAttributes.lat;
        delete allAttributes.lon;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NH GRANIT',
          (location.confidence || 'N/A').toString(),
          'NH_PUBLIC_WATERS_ACCESS',
          facilityName,
          (site.lat || location.lat).toString(),
          (site.lon || location.lon).toString(),
          site.distance_miles !== null && site.distance_miles !== undefined ? site.distance_miles.toFixed(2) : '',
          `${waterBody}${wbType ? ` (${wbType})` : ''}${accessTyp ? ` - ${accessTyp}` : ''}`,
          fullLocation || attributesJson,
          amenitiesStr,
          ownership,
          attributesJson,
          'NH GRANIT'
        ]);
      });
    } else if (key === 'nh_law_enforcement_all' && Array.isArray(value)) {
      // Handle NH Law Enforcement - each facility gets its own row with all attributes
      value.forEach((facility: any) => {
        const facilityName = facility.name || facility.NAME || facility.Name || facility._name || 'Unknown Law Enforcement Facility';
        const facilityType = facility.type || facility.TYPE || facility.Type || facility._type || 'Unknown Type';
        
        const address = facility.address || facility.ADDRESS || facility.Address || '';
        const city = facility.city || facility.CITY || facility.City || '';
        const state = facility.state || facility.STATE || facility.State || 'NH';
        const zip = facility.zip || facility.ZIP || facility.Zip || '';
        const telephone = facility.telephone || facility.TELEPHONE || facility.Telephone || '';
        const fullAddress = [address, city, state, zip].filter(Boolean).join(', ');
        
        const allAttributes = { ...facility };
        delete allAttributes.name;
        delete allAttributes.type;
        delete allAttributes.address;
        delete allAttributes.city;
        delete allAttributes.state;
        delete allAttributes.zip;
        delete allAttributes.telephone;
        delete allAttributes.owner;
        delete allAttributes.lat;
        delete allAttributes.lon;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NH GRANIT',
          (location.confidence || 'N/A').toString(),
          'NH_LAW_ENFORCEMENT',
          facilityName,
          (facility.lat || location.lat).toString(),
          (facility.lon || location.lon).toString(),
          facility.distance_miles !== null && facility.distance_miles !== undefined ? facility.distance_miles.toFixed(2) : '',
          facilityType,
          fullAddress || attributesJson,
          telephone,
          '',
          attributesJson,
          'NH GRANIT'
        ]);
      });
    } else if (key === 'nh_recreation_trails_all' && Array.isArray(value)) {
      // Handle NH Recreation Trails - each trail gets its own row with all attributes
      value.forEach((trail: any) => {
        const trailName = trail.name || trail.NAME || trail.Name || trail._name || trail.trail_name || trail.TRAIL_NAME || 'Unknown Trail';
        const trailType = trail.trail_type || trail.TRAIL_TYPE || trail.TrailType || trail._trail_type || trail.type || trail.TYPE || 'Unknown Type';
        const lengthMiles = trail.length_miles || trail.LENGTH_MILES || trail.LengthMiles || trail.length || trail.LENGTH || '';
        
        const allAttributes = { ...trail };
        delete allAttributes.name;
        delete allAttributes.trail_name;
        delete allAttributes.trail_type;
        delete allAttributes.type;
        delete allAttributes.length_miles;
        delete allAttributes.length;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NH GRANIT',
          (location.confidence || 'N/A').toString(),
          'NH_RECREATION_TRAIL',
          trailName,
          location.lat.toString(), // Use search location for trail (it's a line, not a point)
          location.lon.toString(),
          trail.distance_miles !== null && trail.distance_miles !== undefined ? trail.distance_miles.toFixed(2) : '',
          trailType,
          lengthMiles ? `${lengthMiles} miles` : attributesJson,
          '',
          '',
          attributesJson,
          'NH GRANIT'
        ]);
      });
    } else if (key === 'nh_stone_walls_all' && Array.isArray(value)) {
      // Handle NH Stone Walls - each stone wall gets its own row with all attributes
      value.forEach((wall: any) => {
        const town = wall.TOWN || wall.town || 'Unknown Town';
        const user = wall.USER_ || wall.user || '';
        const shapeLength = wall.Shape__Length || wall.shapeLength || null;
        const lengthFeet = shapeLength ? (shapeLength * 3.28084).toFixed(1) : '';
        
        const allAttributes = { ...wall };
        delete allAttributes.TOWN;
        delete allAttributes.town;
        delete allAttributes.USER_;
        delete allAttributes.user;
        delete allAttributes.Shape__Length;
        delete allAttributes.shapeLength;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NH GRANIT',
          (location.confidence || 'N/A').toString(),
          'NH_STONE_WALL',
          `Stone Wall - ${town}`,
          location.lat.toString(), // Use search location for stone wall (it's a line, not a point)
          location.lon.toString(),
          wall.distance_miles !== null && wall.distance_miles !== undefined ? wall.distance_miles.toFixed(2) : '',
          town,
          lengthFeet ? `${lengthFeet} ft` : attributesJson,
          user || '',
          '',
          attributesJson,
          'NH Stone Wall Layer'
        ]);
      });
    } else if (key === 'nh_dot_roads_all' && Array.isArray(value)) {
      // Handle NH DOT Roads - each road gets its own row with all attributes
      value.forEach((road: any) => {
        const roadName = road.name || road.NAME || road.Name || road._name || road.road_name || road.ROAD_NAME || road.street_name || road.STREET_NAME || 'Unknown Road';
        const roadType = road.road_type || road.ROAD_TYPE || road.RoadType || road._road_type || road.type || road.TYPE || road.fclass || road.FCLASS || 'Unknown Type';
        const routeNumber = road.route_number || road.ROUTE_NUMBER || road.RouteNumber || road.route || road.ROUTE || road.rt_number || road.RT_NUMBER || '';
        
        const allAttributes = { ...road };
        delete allAttributes.name;
        delete allAttributes.road_name;
        delete allAttributes.street_name;
        delete allAttributes.road_type;
        delete allAttributes.type;
        delete allAttributes.fclass;
        delete allAttributes.route_number;
        delete allAttributes.route;
        delete allAttributes.rt_number;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NH GRANIT',
          (location.confidence || 'N/A').toString(),
          'NH_DOT_ROAD',
          roadName,
          location.lat.toString(), // Use search location for road (it's a line, not a point)
          location.lon.toString(),
          road.distance_miles !== null && road.distance_miles !== undefined ? road.distance_miles.toFixed(2) : '',
          roadType,
          routeNumber || attributesJson,
          '',
          '',
          attributesJson,
          'NH GRANIT'
        ]);
      });
    } else if (key === 'nh_railroads_all' && Array.isArray(value)) {
      // Handle NH Railroads - each railroad gets its own row with all attributes
      value.forEach((railroad: any) => {
        const railroadName = railroad.name || railroad.NAME || railroad.Name || railroad._name || 'Unknown Railroad';
        const status = railroad.status || railroad.STATUS || railroad.Status || railroad._status || '';
        const ownership = railroad.ownership || railroad.OWNERSHIP || railroad.Ownership || railroad._ownership || '';
        const operator = railroad.operator || railroad.OPERATOR || railroad.Operator || railroad._operator || '';
        const lengthMiles = railroad.length_miles || railroad.LENGTH_MILES || railroad.LengthMiles || railroad._length_miles || railroad.length || railroad.LENGTH || '';
        
        const allAttributes = { ...railroad };
        delete allAttributes.name;
        delete allAttributes.status;
        delete allAttributes.ownership;
        delete allAttributes.operator;
        delete allAttributes.length_miles;
        delete allAttributes.length;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NH GRANIT',
          (location.confidence || 'N/A').toString(),
          'NH_RAILROAD',
          railroadName,
          location.lat.toString(), // Use search location for railroad (it's a line, not a point)
          location.lon.toString(),
          railroad.distance_miles !== null && railroad.distance_miles !== undefined ? railroad.distance_miles.toFixed(2) : '',
          status || attributesJson,
          ownership || '',
          operator || '',
          lengthMiles ? `${lengthMiles} miles` : attributesJson,
          attributesJson,
          'NH GRANIT'
        ]);
      });
    } else if (key === 'nh_transmission_pipelines_all' && Array.isArray(value)) {
      // Handle NH Transmission/Pipelines - each line gets its own row with all attributes
      value.forEach((tp: any) => {
        const tpType = tp.type || tp.TYPE || tp.Type || tp._type || tp.pipeline_type || tp.PIPELINE_TYPE || 'Unknown Type';
        const pia = tp.pia || tp.PIA || tp._pia || '';
        const granitid = tp.granitid || tp.GRANITID || tp.GranitId || tp._granitid || '';
        
        const allAttributes = { ...tp };
        delete allAttributes.type;
        delete allAttributes.pia;
        delete allAttributes.granitid;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NH GRANIT',
          (location.confidence || 'N/A').toString(),
          'NH_TRANSMISSION_PIPELINE',
          tpType || 'Transmission/Pipeline',
          location.lat.toString(), // Use search location for line (it's a line, not a point)
          location.lon.toString(),
          tp.distance_miles !== null && tp.distance_miles !== undefined ? tp.distance_miles.toFixed(2) : '',
          tpType || attributesJson,
          pia ? `PIA: ${pia}` : '',
          granitid ? `GRANIT ID: ${granitid}` : '',
          attributesJson,
          attributesJson,
          'NH GRANIT'
        ]);
      });
    } else if (key === 'nh_cell_towers_all' && Array.isArray(value)) {
      // Handle NH Cell Towers - each tower gets its own row with all attributes
      value.forEach((tower: any) => {
        const entityName = tower.entity_name || tower.ENTITY_NAM || tower.EntityName || tower._entity_nam || tower.owner || tower.OWNER || 'Unknown Entity';
        const structureType = tower.structure_type || tower.STRUCTURE_TYPE || tower.StrTyp || tower.str_typ || tower.STR_TYP || tower._str_typ || '';
        const city = tower.city || tower.CITY || tower.City || tower._city || tower.gismunic || tower.GISMUNIC || '';
        const state = tower.state || tower.ST || tower.State || tower._st || 'NH';
        const address = tower.address || tower.ADDRESS || tower.Address || tower.street || tower.STREET || tower.str_street || tower.STR_STREET || '';
        const heightFt = tower.height_above_ground_ft || tower.HGTABVGR_F || tower.HgtAbvGrF || tower._hgtabvgr_f || tower.height || tower.HEIGHT || '';
        const elevationFt = tower.elevation_ft || tower.ELEV_FT || tower.ElevFt || tower._elev_ft || tower.elevation || tower.ELEVATION || '';
        const fullAddress = [address, city, state].filter(Boolean).join(', ');
        
        const allAttributes = { ...tower };
        delete allAttributes.entity_name;
        delete allAttributes.structure_type;
        delete allAttributes.city;
        delete allAttributes.state;
        delete allAttributes.address;
        delete allAttributes.height_above_ground_ft;
        delete allAttributes.elevation_ft;
        delete allAttributes.lat;
        delete allAttributes.lon;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NH GRANIT',
          (location.confidence || 'N/A').toString(),
          'NH_CELL_TOWER',
          entityName,
          (tower.lat || location.lat).toString(),
          (tower.lon || location.lon).toString(),
          tower.distance_miles !== null && tower.distance_miles !== undefined ? tower.distance_miles.toFixed(2) : '',
          structureType || attributesJson,
          fullAddress || '',
          heightFt ? `${heightFt} ft` : '',
          elevationFt ? `${elevationFt} ft` : '',
          attributesJson,
          'NH GRANIT'
        ]);
      });
    } else if (key === 'nh_underground_storage_tanks_all' && Array.isArray(value)) {
      // Handle NH Underground Storage Tank Sites - each site gets its own row with all attributes
      value.forEach((site: any) => {
        const facilityName = site.facility_name || site.FACILITY_NAME || site.FacilityName || site._facility_name || site.name || site.NAME || site.Name || 'Unknown Facility';
        const facilityAddress = site.facility_address || site.FACILITY_ADDRESS || site.FacilityAddress || site._facility_address || site.address || site.ADDRESS || site.Address || site.street || site.STREET || '';
        const city = site.city || site.CITY || site.City || site._city || site.gismunic || site.GISMUNIC || '';
        const state = site.state || site.ST || site.State || site._st || 'NH';
        const tankCount = site.tank_count || site.TANK_COUNT || site.TankCount || site._tank_count || site.num_tanks || site.NUM_TANKS || site.count || site.COUNT || '';
        const fullAddress = [facilityAddress, city, state].filter(Boolean).join(', ');
        
        const allAttributes = { ...site };
        delete allAttributes.facility_name;
        delete allAttributes.facility_address;
        delete allAttributes.city;
        delete allAttributes.state;
        delete allAttributes.tank_count;
        delete allAttributes.lat;
        delete allAttributes.lon;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NH DES',
          (location.confidence || 'N/A').toString(),
          'NH_UNDERGROUND_STORAGE_TANK',
          facilityName,
          (site.lat || location.lat).toString(),
          (site.lon || location.lon).toString(),
          site.distance_miles !== null && site.distance_miles !== undefined ? site.distance_miles.toFixed(2) : '',
          tankCount ? `Tanks: ${tankCount}` : attributesJson,
          fullAddress || '',
          '',
          '',
          attributesJson,
          'NH DES'
        ]);
      });
    } else if (key === 'nh_water_wells_all' && Array.isArray(value)) {
      // Handle NH Water Well Inventory - each well gets its own row with all attributes
      value.forEach((well: any) => {
        const wellId = well.well_id || well.WELL_ID || well.WellId || well._well_id || well.id || well.ID || well.Id || well.objectid || well.OBJECTID || 'Unknown Well';
        const ownerName = well.owner_name || well.OWNER_NAME || well.OwnerName || well._owner_name || well.owner || well.OWNER || well.Owner || '';
        const address = well.address || well.ADDRESS || well.Address || well._address || well.street || well.STREET || well.street_address || well.STREET_ADDRESS || '';
        const city = well.city || well.CITY || well.City || well._city || well.gismunic || well.GISMUNIC || well.municipality || well.MUNICIPALITY || '';
        const state = well.state || well.ST || well.State || well._st || 'NH';
        const wellDepthFt = well.well_depth_ft || well.WELL_DEPTH_FT || well.WellDepthFt || well._well_depth_ft || well.depth || well.DEPTH || well.well_depth || well.WELL_DEPTH || '';
        const waterDepthFt = well.water_depth_ft || well.WATER_DEPTH_FT || well.WaterDepthFt || well._water_depth_ft || well.water_depth || well.WATER_DEPTH || well.static_water_level || well.STATIC_WATER_LEVEL || '';
        const fullAddress = [address, city, state].filter(Boolean).join(', ');
        
        const allAttributes = { ...well };
        delete allAttributes.well_id;
        delete allAttributes.owner_name;
        delete allAttributes.address;
        delete allAttributes.city;
        delete allAttributes.state;
        delete allAttributes.well_depth_ft;
        delete allAttributes.water_depth_ft;
        delete allAttributes.lat;
        delete allAttributes.lon;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NH DES',
          (location.confidence || 'N/A').toString(),
          'NH_WATER_WELL',
          wellId ? String(wellId) : 'Unknown Well',
          (well.lat || location.lat).toString(),
          (well.lon || location.lon).toString(),
          well.distance_miles !== null && well.distance_miles !== undefined ? well.distance_miles.toFixed(2) : '',
          ownerName || attributesJson,
          fullAddress || '',
          wellDepthFt ? `${wellDepthFt} ft` : '',
          waterDepthFt ? `${waterDepthFt} ft` : '',
          attributesJson,
          'NH DES'
        ]);
      });
    } else if (key === 'nh_public_water_supply_wells_all' && Array.isArray(value)) {
      // Handle NH Public Water Supply Wells - each well gets its own row with all attributes
      value.forEach((well: any) => {
        const wellId = well.well_id || well.WELL_ID || well.WellId || well._well_id || well.id || well.ID || well.Id || well.objectid || well.OBJECTID || 'Unknown Well';
        const facilityName = well.facility_name || well.FACILITY_NAME || well.FacilityName || well._facility_name || well.name || well.NAME || well.Name || '';
        const ownerName = well.owner_name || well.OWNER_NAME || well.OwnerName || well._owner_name || well.owner || well.OWNER || well.Owner || '';
        const address = well.address || well.ADDRESS || well.Address || well._address || well.street || well.STREET || well.street_address || well.STREET_ADDRESS || '';
        const city = well.city || well.CITY || well.City || well._city || well.gismunic || well.GISMUNIC || well.municipality || well.MUNICIPALITY || '';
        const state = well.state || well.ST || well.State || well._st || 'NH';
        const wellDepthFt = well.well_depth_ft || well.WELL_DEPTH_FT || well.WellDepthFt || well._well_depth_ft || well.depth || well.DEPTH || well.well_depth || well.WELL_DEPTH || '';
        const waterDepthFt = well.water_depth_ft || well.WATER_DEPTH_FT || well.WaterDepthFt || well._water_depth_ft || well.water_depth || well.WATER_DEPTH || well.static_water_level || well.STATIC_WATER_LEVEL || '';
        const fullAddress = [address, city, state].filter(Boolean).join(', ');
        
        const allAttributes = { ...well };
        delete allAttributes.well_id;
        delete allAttributes.facility_name;
        delete allAttributes.owner_name;
        delete allAttributes.address;
        delete allAttributes.city;
        delete allAttributes.state;
        delete allAttributes.well_depth_ft;
        delete allAttributes.water_depth_ft;
        delete allAttributes.lat;
        delete allAttributes.lon;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NH DES',
          (location.confidence || 'N/A').toString(),
          'NH_PUBLIC_WATER_SUPPLY_WELL',
          wellId ? String(wellId) : 'Unknown Well',
          (well.lat || location.lat).toString(),
          (well.lon || location.lon).toString(),
          well.distance_miles !== null && well.distance_miles !== undefined ? well.distance_miles.toFixed(2) : '',
          facilityName || ownerName || attributesJson,
          fullAddress || '',
          wellDepthFt ? `${wellDepthFt} ft` : '',
          waterDepthFt ? `${waterDepthFt} ft` : '',
          attributesJson,
          'NH DES'
        ]);
      });
    } else if (key === 'nh_remediation_sites_all' && Array.isArray(value)) {
      // Handle NH Remediation Sites - each site gets its own row with all attributes
      value.forEach((site: any) => {
        const siteId = site.site_id || site.SITE_ID || site.SiteId || site._site_id || site.id || site.ID || site.Id || site.objectid || site.OBJECTID || 'Unknown Site';
        const siteName = site.site_name || site.SITE_NAME || site.SiteName || site._site_name || site.name || site.NAME || site.Name || '';
        const facilityName = site.facility_name || site.FACILITY_NAME || site.FacilityName || site._facility_name || site.facility || site.FACILITY || '';
        const address = site.address || site.ADDRESS || site.Address || site._address || site.street || site.STREET || site.street_address || site.STREET_ADDRESS || '';
        const city = site.city || site.CITY || site.City || site._city || site.gismunic || site.GISMUNIC || site.municipality || site.MUNICIPALITY || '';
        const state = site.state || site.ST || site.State || site._st || 'NH';
        const siteStatus = site.site_status || site.SITE_STATUS || site.SiteStatus || site._site_status || site.status || site.STATUS || site.Status || '';
        const fullAddress = [address, city, state].filter(Boolean).join(', ');
        
        const allAttributes = { ...site };
        delete allAttributes.site_id;
        delete allAttributes.site_name;
        delete allAttributes.facility_name;
        delete allAttributes.address;
        delete allAttributes.city;
        delete allAttributes.state;
        delete allAttributes.site_status;
        delete allAttributes.lat;
        delete allAttributes.lon;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NH DES',
          (location.confidence || 'N/A').toString(),
          'NH_REMEDIATION_SITE',
          siteId ? String(siteId) : 'Unknown Site',
          (site.lat || location.lat).toString(),
          (site.lon || location.lon).toString(),
          site.distance_miles !== null && site.distance_miles !== undefined ? site.distance_miles.toFixed(2) : '',
          siteName || facilityName || attributesJson,
          fullAddress || '',
          siteStatus || '',
          '',
          attributesJson,
          'NH DES'
        ]);
      });
    } else if (key === 'nh_automobile_salvage_yards_all' && Array.isArray(value)) {
      // Handle NH Automobile Salvage Yards - each yard gets its own row with all attributes
      value.forEach((yard: any) => {
        const facilityId = yard.facility_id || yard.FACILITY_ID || yard.FacilityId || yard._facility_id || yard.id || yard.ID || yard.Id || 'Unknown Facility';
        const siteName = yard.site_name || yard.SITE_NAME || yard.SiteName || yard._site_name || yard.name || yard.NAME || yard.Name || '';
        const address = yard.address || yard.ADDRESS || yard.Address || yard._address || yard.street || yard.STREET || '';
        const address2 = yard.address2 || yard.ADD2 || yard.Add2 || yard._add2 || yard.address2 || yard.ADDRESS2 || yard.Address2 || '';
        const town = yard.town || yard.TOWN || yard.Town || yard._town || yard.city || yard.CITY || yard.City || yard.municipality || yard.MUNICIPALITY || '';
        const state = yard.state || yard.ST || yard.State || yard._st || 'NH';
        const status = yard.status || yard.STATUS || yard.Status || yard._status || yard.site_status || yard.SITE_STATUS || '';
        const onestopLink = yard.onestop_link || yard.ONESTOP_LINK || yard.OneStopLink || yard._onestop_link || '';
        const fullAddress = [address, address2, town, state].filter(Boolean).join(', ');
        
        const allAttributes = { ...yard };
        delete allAttributes.facility_id;
        delete allAttributes.site_name;
        delete allAttributes.address;
        delete allAttributes.address2;
        delete allAttributes.town;
        delete allAttributes.state;
        delete allAttributes.status;
        delete allAttributes.onestop_link;
        delete allAttributes.lat;
        delete allAttributes.lon;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NH DES',
          (location.confidence || 'N/A').toString(),
          'NH_AUTOMOBILE_SALVAGE_YARD',
          facilityId ? String(facilityId) : 'Unknown Facility',
          (yard.lat || location.lat).toString(),
          (yard.lon || location.lon).toString(),
          yard.distance_miles !== null && yard.distance_miles !== undefined ? yard.distance_miles.toFixed(2) : '',
          siteName || attributesJson,
          fullAddress || '',
          status || '',
          onestopLink || '',
          attributesJson,
          'NH DES'
        ]);
      });
    } else if (key === 'nh_solid_waste_facilities_all' && Array.isArray(value)) {
      // Handle NH Solid Waste Facilities - each facility gets its own row with all attributes
      value.forEach((facility: any) => {
        const swfLid = facility.swf_lid || facility.SWF_LID || facility.SwfLid || facility._swf_lid || facility.facility_id || facility.FACILITY_ID || facility.id || facility.ID || facility.Id || 'Unknown Facility';
        const swfName = facility.swf_name || facility.SWF_NAME || facility.SwfName || facility._swf_name || facility.name || facility.NAME || facility.Name || '';
        const swfType = facility.swf_type || facility.SWF_TYPE || facility.SwfType || facility._swf_type || facility.type || facility.TYPE || facility.Type || '';
        const swfStatus = facility.swf_status || facility.SWF_STATUS || facility.SwfStatus || facility._swf_status || facility.status || facility.STATUS || facility.Status || '';
        const swfPermit = facility.swf_permit || facility.SWF_PERMIT || facility.SwfPermit || facility._swf_permit || facility.permit || facility.PERMIT || '';
        const address = facility.address || facility.ADDRESS || facility.Address || facility._address || facility.swf_add_1 || facility.SWF_ADD_1 || facility.street || facility.STREET || '';
        const address2 = facility.address2 || facility.ADDRESS2 || facility.Address2 || facility._address2 || facility.swf_add_2 || facility.SWF_ADD_2 || facility.add2 || facility.ADD2 || '';
        const city = facility.city || facility.CITY || facility.City || facility._city || facility.swf_city || facility.SWF_CITY || facility.town || facility.TOWN || facility.municipality || facility.MUNICIPALITY || '';
        const state = facility.state || facility.ST || facility.State || facility._st || 'NH';
        const onestopLink = facility.onestop_link || facility.ONESTOP_LINK || facility.OneStopLink || facility._onestop_link || '';
        const fullAddress = [address, address2, city, state].filter(Boolean).join(', ');
        
        const allAttributes = { ...facility };
        delete allAttributes.swf_lid;
        delete allAttributes.swf_name;
        delete allAttributes.swf_type;
        delete allAttributes.swf_status;
        delete allAttributes.swf_permit;
        delete allAttributes.address;
        delete allAttributes.address2;
        delete allAttributes.city;
        delete allAttributes.state;
        delete allAttributes.onestop_link;
        delete allAttributes.lat;
        delete allAttributes.lon;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NH DES',
          (location.confidence || 'N/A').toString(),
          'NH_SOLID_WASTE_FACILITY',
          swfName || (swfLid ? String(swfLid) : 'Unknown Facility'),
          (facility.lat || location.lat).toString(),
          (facility.lon || location.lon).toString(),
          facility.distance_miles !== null && facility.distance_miles !== undefined ? facility.distance_miles.toFixed(2) : '',
          swfType || swfStatus || attributesJson,
          fullAddress || '',
          swfPermit || '',
          onestopLink || '',
          attributesJson,
          'NH DES'
        ]);
      });
    }
    
    // Add NH NWI Plus wetlands data rows
    // Add NH SSURGO soils data rows
    if (enrichments.nh_ssurgo_all && Array.isArray(enrichments.nh_ssurgo_all)) {
      enrichments.nh_ssurgo_all.forEach((soil: any) => {
        const areasymbol = soil.areasymbol || 'N/A';
        const muname = soil.muname || 'N/A';
        const mukey = soil.mukey || '';
        const musym = soil.musym || '';
        const hydgrpdcd = soil.hydgrpdcd || '';
        const drclassdcd = soil.drclassdcd || '';
        const slopegradd = soil.slopegradd !== null && soil.slopegradd !== undefined ? soil.slopegradd.toString() : '';
        const farmlndcl = soil.farmlndcl || '';
        const acres = soil.acres !== null && soil.acres !== undefined ? soil.acres.toFixed(2) : '';
        
        // Create allAttributes object excluding specific fields we're extracting
        const allAttributes = { ...soil };
        delete allAttributes.areasymbol;
        delete allAttributes.muname;
        delete allAttributes.mukey;
        delete allAttributes.musym;
        delete allAttributes.hydgrpdcd;
        delete allAttributes.drclassdcd;
        delete allAttributes.slopegradd;
        delete allAttributes.farmlndcl;
        delete allAttributes.acres;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NH GRANIT',
          (location.confidence || 'N/A').toString(),
          'NH_SSURGO',
          `${areasymbol} - ${muname}`,
          location.lat.toString(),
          location.lon.toString(),
          '0', // Point is inside polygon
          'Soil Survey',
          '', // POI_Address
          '', // POI_Phone
          '', // POI_Website
          'NH GRANIT'
        ]);
        
        // Add a second row with detailed attributes
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NH GRANIT',
          (location.confidence || 'N/A').toString(),
          'NH_SSURGO_DETAILS',
          `Map Unit Key: ${mukey}, Symbol: ${musym}, Hydrologic Group: ${hydgrpdcd}, Drainage: ${drclassdcd}, Slope: ${slopegradd}%, Farmland: ${farmlndcl}, Acres: ${acres}`,
          location.lat.toString(),
          location.lon.toString(),
          '0',
          'Soil Survey Details',
          attributesJson,
          '',
          '',
          'NH GRANIT'
        ]);
      });
    }

    // Add NH Bedrock Geology data rows
    if (enrichments.nh_bedrock_geology_all && Array.isArray(enrichments.nh_bedrock_geology_all)) {
      enrichments.nh_bedrock_geology_all.forEach((formation: any) => {
        const code = formation.code || 'N/A';
        const fullname = formation.fullname || '';
        const major = formation.major || '';
        const formation1 = formation.formation1 || '';
        const formation2 = formation.formation2 || '';
        const plutonAge = formation.pluton_age || '';
        const rockType = formation.rock_type || '';
        const geologicHistory = formation.geologichistory || '';
        const lithology = formation.lithology || '';
        const source = formation.source || '';
        
        // Create allAttributes object excluding specific fields we're extracting
        const allAttributes = { ...formation };
        delete allAttributes.code;
        delete allAttributes.major;
        delete allAttributes.formation1;
        delete allAttributes.formation2;
        delete allAttributes.pluton_age;
        delete allAttributes.rock_type;
        delete allAttributes.fullname;
        delete allAttributes.geologichistory;
        delete allAttributes.lithology;
        delete allAttributes.source;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NH GRANIT',
          (location.confidence || 'N/A').toString(),
          'NH_BEDROCK_GEOLOGY',
          `${code}${fullname ? ` - ${fullname}` : ''}`,
          location.lat.toString(),
          location.lon.toString(),
          '0', // Point is inside polygon
          'Bedrock Geology',
          major || formation1 || rockType || attributesJson,
          '',
          '',
          'NH GRANIT'
        ]);
        
        // Add a second row with detailed attributes
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NH GRANIT',
          (location.confidence || 'N/A').toString(),
          'NH_BEDROCK_GEOLOGY_DETAILS',
          `Code: ${code}, Major: ${major}, Formation1: ${formation1}, Formation2: ${formation2}, Pluton Age: ${plutonAge}, Rock Type: ${rockType}, Geologic History: ${geologicHistory}, Lithology: ${lithology}, Source: ${source}`,
          location.lat.toString(),
          location.lon.toString(),
          '0',
          'Bedrock Geology Details',
          attributesJson,
          '',
          '',
          'NH GRANIT'
        ]);
      });
    }

    // Add NH Geographic Names data rows
    if (enrichments.nh_geographic_names_all && Array.isArray(enrichments.nh_geographic_names_all)) {
      enrichments.nh_geographic_names_all.forEach((place: any) => {
        const placeName = place.feature || 'Unknown Place';
        const featType = place.feattype || '';
        const county = place.county || '';
        const quad = place.quad || '';
        const distance = place.distance_miles !== null && place.distance_miles !== undefined ? place.distance_miles.toFixed(2) : '';
        const placeLat = place.lat || '';
        const placeLon = place.lon || '';
        
        // Create allAttributes object excluding specific fields we're extracting
        const allAttributes = { ...place };
        delete allAttributes.feature;
        delete allAttributes.feattype;
        delete allAttributes.county;
        delete allAttributes.quad;
        delete allAttributes.lat;
        delete allAttributes.lon;
        delete allAttributes.distance_miles;
        delete allAttributes.geometry;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NH GRANIT',
          (location.confidence || 'N/A').toString(),
          'NH_GEOGRAPHIC_NAME',
          placeName,
          placeLat.toString(),
          placeLon.toString(),
          distance,
          featType || 'Place of Interest',
          county || quad || attributesJson,
          '',
          '',
          'NH GRANIT'
        ]);
      });
    }

    if (enrichments.nh_nwi_plus_all && Array.isArray(enrichments.nh_nwi_plus_all)) {
      enrichments.nh_nwi_plus_all.forEach((wetland: any) => {
        const wetlandId = wetland.wetland_id || wetland.WETLAND_ID || wetland.id || 'Unknown';
        const wetlandType = wetland.wetland_type || wetland.WETLAND_TYPE || wetland.type || '';
        const wetlandClass = wetland.wetland_class || wetland.WETLAND_CLASS || wetland.class || '';
        const distance = wetland.distance_miles !== null && wetland.distance_miles !== undefined ? wetland.distance_miles.toFixed(2) : '';
        const isContaining = wetland.isContaining ? 'Yes' : 'No';
        
        // Create allAttributes object excluding specific fields we're extracting
        const allAttributes = { ...wetland };
        delete allAttributes.wetland_id;
        delete allAttributes.wetland_type;
        delete allAttributes.wetland_class;
        delete allAttributes.isContaining;
        delete allAttributes.distance_miles;
        delete allAttributes.geometry;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NH DES',
          (location.confidence || 'N/A').toString(),
          'NH_NWI_PLUS',
          String(wetlandId),
          location.lat.toString(), // Wetland centroid would be better, but using location for now
          location.lon.toString(),
          distance,
          wetlandType || wetlandClass || attributesJson,
          isContaining,
          wetlandClass || '',
          attributesJson,
          'NH DES'
        ]);
      });
    }
    
    // Add MA DEP Wetlands data rows
    if (enrichments.ma_dep_wetlands_all && Array.isArray(enrichments.ma_dep_wetlands_all)) {
      enrichments.ma_dep_wetlands_all.forEach((wetland: any) => {
        const wetCode = wetland.WETCODE || wetland.wetCode || '';
        const itValDesc = wetland.IT_VALDESC || wetland.itValDesc || 'Unknown Wetland';
        const itValc = wetland.IT_VALC || wetland.itValc || '';
        const source = wetland.SOURCE || wetland.source || '';
        const areaAcres = wetland.AREAACRES || wetland.areaAcres || '';
        
        const allAttributes = { ...wetland };
        delete allAttributes.WETCODE;
        delete allAttributes.wetCode;
        delete allAttributes.IT_VALC;
        delete allAttributes.itValc;
        delete allAttributes.IT_VALDESC;
        delete allAttributes.itValDesc;
        delete allAttributes.POLY_CODE;
        delete allAttributes.polyCode;
        delete allAttributes.SOURCE;
        delete allAttributes.source;
        delete allAttributes.AREAACRES;
        delete allAttributes.areaAcres;
        delete allAttributes.AREASQMI;
        delete allAttributes.areaSqMi;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'MassGIS',
          (location.confidence || 'N/A').toString(),
          'MA_DEP_WETLAND',
          itValDesc,
          location.lat.toString(), // Use search location for wetland (it's a polygon, not a point)
          location.lon.toString(),
          wetland.distance_miles !== null && wetland.distance_miles !== undefined ? wetland.distance_miles.toFixed(2) : '',
          itValc || wetCode || attributesJson,
          areaAcres ? `${areaAcres} acres` : attributesJson,
          source || '',
          '',
          attributesJson,
          'MassGIS'
        ]);
      });
    }
    
    // Add FLDEP Landuse data rows
    if (enrichments.fldep_landuse_all && Array.isArray(enrichments.fldep_landuse_all)) {
      enrichments.fldep_landuse_all.forEach((landuse: any) => {
        const description = landuse.DESCRIPTION || landuse.description || 'Unknown Landuse';
        const level3Value = landuse.LEVEL3_VALUE !== null && landuse.LEVEL3_VALUE !== undefined ? landuse.LEVEL3_VALUE : landuse.level3Value;
        const ldi = landuse.LDI !== null && landuse.LDI !== undefined ? landuse.LDI : landuse.ldi;
        const lsi = landuse.LSI !== null && landuse.LSI !== undefined ? landuse.LSI : landuse.lsi;
        const wmdDistrict = landuse.WMD_DISTRICT || landuse.wmdDistrict || '';
        const landuseYear = landuse.LANDUSE_YEAR !== null && landuse.LANDUSE_YEAR !== undefined ? landuse.LANDUSE_YEAR : landuse.landuseYear;
        const shapeArea = landuse['SHAPE.AREA'] !== null && landuse['SHAPE.AREA'] !== undefined ? landuse['SHAPE.AREA'] : landuse.shapeArea;
        
        const allAttributes = { ...landuse };
        delete allAttributes.DESCRIPTION;
        delete allAttributes.description;
        delete allAttributes.LEVEL3_VALUE;
        delete allAttributes.level3Value;
        delete allAttributes.LDI;
        delete allAttributes.ldi;
        delete allAttributes.LSI;
        delete allAttributes.lsi;
        delete allAttributes.WMD_DISTRICT;
        delete allAttributes.wmdDistrict;
        delete allAttributes.LANDUSE_YEAR;
        delete allAttributes.landuseYear;
        delete allAttributes['SHAPE.AREA'];
        delete allAttributes.shapeArea;
        delete allAttributes['SHAPE.LEN'];
        delete allAttributes.shapeLength;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectId;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'FLDEP',
          (location.confidence || 'N/A').toString(),
          'FLDEP_LANDUSE',
          description,
          location.lat.toString(), // Use search location for landuse (it's a polygon, not a point)
          location.lon.toString(),
          landuse.distance_miles !== null && landuse.distance_miles !== undefined ? landuse.distance_miles.toFixed(2) : '',
          level3Value !== null && level3Value !== undefined ? String(level3Value) : attributesJson,
          ldi !== null && ldi !== undefined ? `LDI: ${ldi.toFixed(2)}` : (lsi !== null && lsi !== undefined ? `LSI: ${lsi.toFixed(2)}` : attributesJson),
          wmdDistrict || (landuseYear ? String(landuseYear) : ''),
          shapeArea !== null && shapeArea !== undefined ? `${shapeArea.toLocaleString()} sq units` : '',
          attributesJson,
          'FLDEP'
        ]);
      });
    }
    
    // Add MA Open Space data rows
    if (enrichments.ma_open_space_all && Array.isArray(enrichments.ma_open_space_all)) {
      enrichments.ma_open_space_all.forEach((openSpace: any) => {
        const siteName = openSpace.SITE_NAME || openSpace.siteName || openSpace.SiteName || 'Unknown Open Space';
        const siteType = openSpace.SITE_TYPE || openSpace.siteType || openSpace.SiteType || '';
        const ownerType = openSpace.OWNER_TYPE || openSpace.ownerType || openSpace.OwnerType || '';
        const ownerName = openSpace.OWNER_NAME || openSpace.ownerName || openSpace.OwnerName || '';
        const acres = openSpace.ACRES || openSpace.acres || openSpace.Acres || '';
        
        const allAttributes = { ...openSpace };
        delete allAttributes.SITE_NAME;
        delete allAttributes.siteName;
        delete allAttributes.SiteName;
        delete allAttributes.SITE_TYPE;
        delete allAttributes.siteType;
        delete allAttributes.SiteType;
        delete allAttributes.OWNER_TYPE;
        delete allAttributes.ownerType;
        delete allAttributes.OwnerType;
        delete allAttributes.OWNER_NAME;
        delete allAttributes.ownerName;
        delete allAttributes.OwnerName;
        delete allAttributes.ACRES;
        delete allAttributes.acres;
        delete allAttributes.Acres;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'MassGIS',
          (location.confidence || 'N/A').toString(),
          'MA_OPEN_SPACE',
          siteName,
          location.lat.toString(), // Use search location for open space (it's a polygon, not a point)
          location.lon.toString(),
          openSpace.distance_miles !== null && openSpace.distance_miles !== undefined ? openSpace.distance_miles.toFixed(2) : '',
          siteType || ownerType || attributesJson,
          acres ? `${acres} acres` : attributesJson,
          ownerName || '',
          '',
          attributesJson,
          'MassGIS'
        ]);
      });
    }
    
    // Add Cape Cod Zoning data rows
    if (enrichments.cape_cod_zoning_all && Array.isArray(enrichments.cape_cod_zoning_all)) {
      enrichments.cape_cod_zoning_all.forEach((zoning: any) => {
        const zoneCode = zoning.ZONECODE || zoning.ZoneCode || zoning.zonecode || 'Unknown Zone';
        const primUse = zoning.PRIM_USE || zoning.Prim_Use || zoning.prim_use || '';
        const townCode = zoning.TOWNCODE || zoning.TownCode || zoning.towncode || '';
        const primUse2 = zoning.PRIM_USE2 || zoning.Prim_Use2 || zoning.prim_use2 || '';
        const acres = zoning.ACRES || zoning.Acres || zoning.acres || '';
        const townId = zoning.TOWN_ID || zoning.Town_ID || zoning.town_id || '';
        
        const allAttributes = { ...zoning };
        delete allAttributes.ZONECODE;
        delete allAttributes.ZoneCode;
        delete allAttributes.zonecode;
        delete allAttributes.PRIM_USE;
        delete allAttributes.Prim_Use;
        delete allAttributes.prim_use;
        delete allAttributes.PRIM_USE2;
        delete allAttributes.Prim_Use2;
        delete allAttributes.prim_use2;
        delete allAttributes.TOWNCODE;
        delete allAttributes.TownCode;
        delete allAttributes.towncode;
        delete allAttributes.TOWN_ID;
        delete allAttributes.Town_ID;
        delete allAttributes.town_id;
        delete allAttributes.ACRES;
        delete allAttributes.Acres;
        delete allAttributes.acres;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'Cape Cod Commission',
          (location.confidence || 'N/A').toString(),
          'CAPE_COD_ZONING',
          zoneCode,
          location.lat.toString(), // Use search location for zoning (it's a polygon, not a point)
          location.lon.toString(),
          zoning.distance_miles !== null && zoning.distance_miles !== undefined ? zoning.distance_miles.toFixed(2) : '',
          primUse || primUse2 || attributesJson,
          acres ? `${acres} acres` : attributesJson,
          townCode || townId || '',
          '',
          attributesJson,
          'Cape Cod Commission'
        ]);
      });
    }
    
    // Add MA Trails data rows
    if (enrichments.ma_trails_all && Array.isArray(enrichments.ma_trails_all)) {
      enrichments.ma_trails_all.forEach((trail: any) => {
        const trailName = trail.TRAIL_NAME || trail.Trail_Name || trail.trail_name || trail.altName || trail.ALT_NAME || trail.Alt_Name || 'Unnamed Trail';
        const town = trail.TOWN || trail.Town || trail.town || '';
        const siteName = trail.SITE_NAME || trail.Site_Name || trail.site_name || '';
        const shapeLength = trail.Shape__Length || trail.Shape_Length || trail.shape_length;
        const lengthMiles = shapeLength ? (shapeLength * 0.000621371).toFixed(2) : '';
        
        const allAttributes = { ...trail };
        delete allAttributes.TRAIL_NAME;
        delete allAttributes.Trail_Name;
        delete allAttributes.trail_name;
        delete allAttributes.ALT_NAME;
        delete allAttributes.Alt_Name;
        delete allAttributes.altName;
        delete allAttributes.TOWN;
        delete allAttributes.Town;
        delete allAttributes.town;
        delete allAttributes.SITE_NAME;
        delete allAttributes.Site_Name;
        delete allAttributes.site_name;
        delete allAttributes.Shape__Length;
        delete allAttributes.Shape_Length;
        delete allAttributes.shape_length;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'MassGIS',
          (location.confidence || 'N/A').toString(),
          'MA_TRAILS',
          trailName,
          location.lat.toString(), // Use search location for trail (it's a polyline, not a point)
          location.lon.toString(),
          trail.distance_miles !== null && trail.distance_miles !== undefined ? trail.distance_miles.toFixed(2) : '',
          town || siteName || attributesJson,
          lengthMiles ? `${lengthMiles} miles` : attributesJson,
          siteName || '',
          '',
          attributesJson,
          'MassGIS'
        ]);
      });
    }
    
    // Add MA NHESP Natural Communities data rows
    if (enrichments.ma_nhesp_natural_communities_all && Array.isArray(enrichments.ma_nhesp_natural_communities_all)) {
      enrichments.ma_nhesp_natural_communities_all.forEach((community: any) => {
        const communNam = community.COMMUN_NAM || community.Commun_Nam || community.commun_nam || community.communNam || 'Unnamed Community';
        const communRan = community.COMMUN_RAN || community.Commun_Ran || community.commun_ran || community.communRan || '';
        const specificD = community.SPECIFIC_D || community.Specific_D || community.specific_d || community.specificD || '';
        const communDes = community.COMMUN_DES || community.Commun_Des || community.commun_des || community.communDes || '';
        const shapeArea = community['SHAPE.AREA'] || community.Shape_Area || community.shape_area || community.shapeArea;
        const areaAcres = shapeArea ? (shapeArea * 0.000247105).toFixed(2) : '';
        
        const allAttributes = { ...community };
        delete allAttributes.COMMUN_NAM;
        delete allAttributes.Commun_Nam;
        delete allAttributes.commun_nam;
        delete allAttributes.communNam;
        delete allAttributes.COMMUN_RAN;
        delete allAttributes.Commun_Ran;
        delete allAttributes.commun_ran;
        delete allAttributes.communRan;
        delete allAttributes.SPECIFIC_D;
        delete allAttributes.Specific_D;
        delete allAttributes.specific_d;
        delete allAttributes.specificD;
        delete allAttributes.COMMUN_DES;
        delete allAttributes.Commun_Des;
        delete allAttributes.commun_des;
        delete allAttributes.communDes;
        delete allAttributes['SHAPE.AREA'];
        delete allAttributes.Shape_Area;
        delete allAttributes.shape_area;
        delete allAttributes.shapeArea;
        delete allAttributes['SHAPE.LEN'];
        delete allAttributes.Shape_Len;
        delete allAttributes.shape_len;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'MassGIS',
          (location.confidence || 'N/A').toString(),
          'MA_NHESP_NATURAL_COMMUNITY',
          communNam,
          location.lat.toString(), // Use search location for community (it's a polygon, not a point)
          location.lon.toString(),
          community.distance_miles !== null && community.distance_miles !== undefined ? community.distance_miles.toFixed(2) : '',
          communRan || communDes || attributesJson,
          areaAcres ? `${areaAcres} acres` : attributesJson,
          specificD || '',
          '',
          attributesJson,
          'MassGIS'
        ]);
      });
    }
    
    // Add MA Rivers and Streams data rows
    if (enrichments.ma_rivers_and_streams_all && Array.isArray(enrichments.ma_rivers_and_streams_all)) {
      enrichments.ma_rivers_and_streams_all.forEach((river: any) => {
        const objectId = river.OBJECTID || river.objectId || '';
        const distance = river.distance_miles;
        
        const allAttributes = { ...river };
        delete allAttributes.OBJECTID;
        delete allAttributes.objectId;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'MassGIS',
          (location.confidence || 'N/A').toString(),
          'MA_RIVERS_STREAMS',
          objectId || 'River/Stream',
          location.lat.toString(), // Use search location for river (it's a line, not a point)
          location.lon.toString(),
          distance !== null && distance !== undefined ? distance.toFixed(2) : '',
          attributesJson,
          '',
          '',
          '',
          attributesJson,
          'MassGIS'
        ]);
      });
    }
    
    // Add MA Lakes and Ponds data rows
    if (enrichments.ma_lakes_and_ponds_all && Array.isArray(enrichments.ma_lakes_and_ponds_all)) {
      enrichments.ma_lakes_and_ponds_all.forEach((lake: any) => {
        const name = lake.NAME || lake.Name || lake.name || 'Unnamed Lake/Pond';
        const type = lake.TYPE || lake.Type || lake.type || '';
        const sqMeters = lake.SQ_METERS || lake.Sq_Meters || lake.sq_meters || lake['SQ.METERS'];
        const areaAcres = sqMeters ? (sqMeters * 0.000247105).toFixed(2) : '';
        
        const allAttributes = { ...lake };
        delete allAttributes.NAME;
        delete allAttributes.Name;
        delete allAttributes.name;
        delete allAttributes.TYPE;
        delete allAttributes.Type;
        delete allAttributes.type;
        delete allAttributes.SQ_METERS;
        delete allAttributes.Sq_Meters;
        delete allAttributes.sq_meters;
        delete allAttributes['SQ.METERS'];
        delete allAttributes.FEATURE;
        delete allAttributes.Feature;
        delete allAttributes.feature;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'MassGIS',
          (location.confidence || 'N/A').toString(),
          'MA_LAKE_POND',
          name,
          location.lat.toString(), // Use search location for lake (it's a polygon, not a point)
          location.lon.toString(),
          lake.distance_miles !== null && lake.distance_miles !== undefined ? lake.distance_miles.toFixed(2) : '',
          type || attributesJson,
          areaAcres ? `${areaAcres} acres` : attributesJson,
          '',
          '',
          attributesJson,
          'MassGIS'
        ]);
      });
    }
    
    // Add MA Regional Planning Agencies data rows
    if (enrichments.ma_regional_planning_agencies_all && Array.isArray(enrichments.ma_regional_planning_agencies_all)) {
      enrichments.ma_regional_planning_agencies_all.forEach((agency: any) => {
        const rpaName = agency.RPA_NAME || agency.rpa_name || 'Unknown Regional Planning Agency';
        const acronym = agency.ACRONYM || agency.acronym || '';
        const website = agency.WEBSITE || agency.website || '';
        
        const allAttributes = { ...agency };
        delete allAttributes.RPA_NAME;
        delete allAttributes.rpa_name;
        delete allAttributes.ACRONYM;
        delete allAttributes.acronym;
        delete allAttributes.RPA_ID;
        delete allAttributes.rpa_id;
        delete allAttributes.WEBSITE;
        delete allAttributes.website;
        delete allAttributes.RPA_ID;
        delete allAttributes.rpa_id;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'MassGIS',
          (location.confidence || 'N/A').toString(),
          'MA_REGIONAL_PLANNING_AGENCY',
          rpaName,
          location.lat.toString(), // Use search location (it's a polygon, not a point)
          location.lon.toString(),
          agency.distance_miles !== null && agency.distance_miles !== undefined ? agency.distance_miles.toFixed(2) : '0.00',
          acronym || attributesJson,
          website || attributesJson,
          '',
          '',
          attributesJson,
          'MassGIS'
        ]);
      });
    }
    
    // Add National Marine Sanctuaries data rows
    if (enrichments.national_marine_sanctuaries_all && Array.isArray(enrichments.national_marine_sanctuaries_all)) {
      enrichments.national_marine_sanctuaries_all.forEach((sanctuary: any) => {
        const siteName = sanctuary.sitename || sanctuary.SITENAME || 'Unknown Marine Sanctuary';
        const unitName = sanctuary.unitname || sanctuary.UNITNAME || '';
        const siteUrl = sanctuary.siteurl || sanctuary.SITEURL || '';
        const citation = sanctuary.citation || sanctuary.CITATION || '';
        const cfrSection = sanctuary.cfrsection || sanctuary.CFRSECTION || '';
        
        const allAttributes = { ...sanctuary };
        delete allAttributes.sitename;
        delete allAttributes.SITENAME;
        delete allAttributes.SHAPE__Area;
        delete allAttributes.SHAPE__AREA;
        delete allAttributes.SHAPE__Length;
        delete allAttributes.SHAPE__LENGTH;
        delete allAttributes.unitname;
        delete allAttributes.UNITNAME;
        delete allAttributes.siteurl;
        delete allAttributes.SITEURL;
        delete allAttributes.citation;
        delete allAttributes.CITATION;
        delete allAttributes.cfrsection;
        delete allAttributes.CFRSECTION;
        delete allAttributes.SHAPE__Area;
        delete allAttributes.SHAPE__AREA;
        delete allAttributes.SHAPE__Length;
        delete allAttributes.SHAPE__LENGTH;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NOAA',
          (location.confidence || 'N/A').toString(),
          'NATIONAL_MARINE_SANCTUARY',
          siteName,
          location.lat.toString(), // Use search location (it's a polygon, not a point)
          location.lon.toString(),
          sanctuary.distance_miles !== null && sanctuary.distance_miles !== undefined ? sanctuary.distance_miles.toFixed(2) : '0.00',
          unitName || attributesJson,
          siteUrl || attributesJson,
          citation || '',
          cfrSection || '',
          attributesJson,
          'NOAA'
        ]);
      });
    }
    
    // Add TIGER Transportation data rows
    const tigerTransportationLayers = [
      { key: 'tiger_primary_roads_interstates_5m_all', source: 'US Census TIGER', category: 'TIGER_PRIMARY_ROADS_INTERSTATES_5M' },
      { key: 'tiger_primary_roads_2_1m_all', source: 'US Census TIGER', category: 'TIGER_PRIMARY_ROADS_2_1M' },
      { key: 'tiger_primary_roads_all', source: 'US Census TIGER', category: 'TIGER_PRIMARY_ROADS' },
      { key: 'tiger_secondary_roads_interstates_us_all', source: 'US Census TIGER', category: 'TIGER_SECONDARY_ROADS_INTERSTATES_US' },
      { key: 'tiger_secondary_roads_578k_all', source: 'US Census TIGER', category: 'TIGER_SECONDARY_ROADS_578K' },
      { key: 'tiger_secondary_roads_289_144k_all', source: 'US Census TIGER', category: 'TIGER_SECONDARY_ROADS_289_144K' },
      { key: 'tiger_secondary_roads_72_1k_all', source: 'US Census TIGER', category: 'TIGER_SECONDARY_ROADS_72_1K' },
      { key: 'tiger_local_roads_72k_all', source: 'US Census TIGER', category: 'TIGER_LOCAL_ROADS_72K' },
      { key: 'tiger_local_roads_all', source: 'US Census TIGER', category: 'TIGER_LOCAL_ROADS' },
      { key: 'tiger_railroads_all', source: 'US Census TIGER', category: 'TIGER_RAILROADS' }
    ];

    tigerTransportationLayers.forEach(({ key, source, category }) => {
      if (enrichments[key] && Array.isArray(enrichments[key])) {
        enrichments[key].forEach((feature: any) => {
          const fullName = feature.fullName || 'Unknown Road/Railroad';
          const rttyp = feature.rttyp || '';
          const mtfcc = feature.mtfcc || '';
          const linearId = feature.linearId || '';
          const objectId = feature.objectId || '';
          const distance = feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : '';
          
          const allAttributes = { ...feature };
          delete allAttributes.fullName;
          delete allAttributes.rttyp;
          delete allAttributes.mtfcc;
          delete allAttributes.linearId;
          delete allAttributes.objectId;
          delete allAttributes.__geometry;
          delete allAttributes.geometry;
          delete allAttributes.distance_miles;
          const attributesJson = JSON.stringify(allAttributes);
          
          rows.push([
            location.name,
            location.lat.toString(),
            location.lon.toString(),
            source,
            (location.confidence || 'N/A').toString(),
            category,
            fullName,
            location.lat.toString(), // Use search location (it's a line, not a point)
            location.lon.toString(),
            distance,
            rttyp || attributesJson,
            mtfcc || attributesJson,
            linearId || '',
            objectId || '',
            attributesJson,
            source
          ]);
        });
      }
    });
    
    // Add TIGER School Districts data rows
    const tigerSchoolDistrictLayers = [
      { containingKey: 'tiger_unified_school_districts_containing', allKey: 'tiger_unified_school_districts_all', source: 'US Census TIGER', category: 'TIGER_UNIFIED_SCHOOL_DISTRICTS' },
      { containingKey: 'tiger_secondary_school_districts_containing', allKey: 'tiger_secondary_school_districts_all', source: 'US Census TIGER', category: 'TIGER_SECONDARY_SCHOOL_DISTRICTS' },
      { containingKey: 'tiger_elementary_school_districts_containing', allKey: 'tiger_elementary_school_districts_all', source: 'US Census TIGER', category: 'TIGER_ELEMENTARY_SCHOOL_DISTRICTS' },
      { containingKey: 'tiger_school_district_admin_areas_containing', allKey: 'tiger_school_district_admin_areas_all', source: 'US Census TIGER', category: 'TIGER_SCHOOL_DISTRICT_ADMIN_AREAS' },
      { containingKey: 'tiger_bas2025_unified_school_districts_containing', allKey: 'tiger_bas2025_unified_school_districts_all', source: 'US Census TIGER', category: 'TIGER_BAS2025_UNIFIED_SCHOOL_DISTRICTS' },
      { containingKey: 'tiger_bas2025_secondary_school_districts_containing', allKey: 'tiger_bas2025_secondary_school_districts_all', source: 'US Census TIGER', category: 'TIGER_BAS2025_SECONDARY_SCHOOL_DISTRICTS' },
      { containingKey: 'tiger_bas2025_elementary_school_districts_containing', allKey: 'tiger_bas2025_elementary_school_districts_all', source: 'US Census TIGER', category: 'TIGER_BAS2025_ELEMENTARY_SCHOOL_DISTRICTS' },
      { containingKey: 'tiger_bas2025_school_district_admin_areas_containing', allKey: 'tiger_bas2025_school_district_admin_areas_all', source: 'US Census TIGER', category: 'TIGER_BAS2025_SCHOOL_DISTRICT_ADMIN_AREAS' },
      { containingKey: 'tiger_acs2024_unified_school_districts_containing', allKey: 'tiger_acs2024_unified_school_districts_all', source: 'US Census TIGER', category: 'TIGER_ACS2024_UNIFIED_SCHOOL_DISTRICTS' },
      { containingKey: 'tiger_acs2024_secondary_school_districts_containing', allKey: 'tiger_acs2024_secondary_school_districts_all', source: 'US Census TIGER', category: 'TIGER_ACS2024_SECONDARY_SCHOOL_DISTRICTS' },
      { containingKey: 'tiger_acs2024_elementary_school_districts_containing', allKey: 'tiger_acs2024_elementary_school_districts_all', source: 'US Census TIGER', category: 'TIGER_ACS2024_ELEMENTARY_SCHOOL_DISTRICTS' },
      { containingKey: 'tiger_acs2024_school_district_admin_areas_containing', allKey: 'tiger_acs2024_school_district_admin_areas_all', source: 'US Census TIGER', category: 'TIGER_ACS2024_SCHOOL_DISTRICT_ADMIN_AREAS' },
      { containingKey: 'tiger_census2020_unified_school_districts_containing', allKey: 'tiger_census2020_unified_school_districts_all', source: 'US Census TIGER', category: 'TIGER_CENSUS2020_UNIFIED_SCHOOL_DISTRICTS' },
      { containingKey: 'tiger_census2020_secondary_school_districts_containing', allKey: 'tiger_census2020_secondary_school_districts_all', source: 'US Census TIGER', category: 'TIGER_CENSUS2020_SECONDARY_SCHOOL_DISTRICTS' },
      { containingKey: 'tiger_census2020_elementary_school_districts_containing', allKey: 'tiger_census2020_elementary_school_districts_all', source: 'US Census TIGER', category: 'TIGER_CENSUS2020_ELEMENTARY_SCHOOL_DISTRICTS' }
    ];

    // Add TIGER Special Land Use Areas data rows
    const tigerSpecialLandUseLayers = [
      { containingKey: 'tiger_nps_areas_containing', nearbyKey: 'tiger_nps_areas_nearby_features', source: 'US Census TIGER', category: 'TIGER_NPS_AREAS' },
      { containingKey: 'tiger_correctional_facilities_containing', nearbyKey: 'tiger_correctional_facilities_nearby_features', source: 'US Census TIGER', category: 'TIGER_CORRECTIONAL_FACILITIES' },
      { containingKey: 'tiger_colleges_universities_containing', nearbyKey: 'tiger_colleges_universities_nearby_features', source: 'US Census TIGER', category: 'TIGER_COLLEGES_UNIVERSITIES' },
      { containingKey: 'tiger_military_installations_containing', nearbyKey: 'tiger_military_installations_nearby_features', source: 'US Census TIGER', category: 'TIGER_MILITARY_INSTALLATIONS' }
    ];

    tigerSpecialLandUseLayers.forEach(({ containingKey, nearbyKey, source, category }) => {
      // Add containing area
      if (enrichments[containingKey] && enrichments[containingKey] !== null) {
        const feature = enrichments[containingKey];
        const featureName = feature.name || 'Unknown';
        const stateFips = feature.stateFips || '';
        const countyFips = feature.countyFips || '';
        const landUseType = feature.landUseType || '';
        const objectId = feature.objectId || '';
        const attributesJson = JSON.stringify({
          stateFips,
          countyFips,
          landUseType,
          objectId,
          ...feature
        });

        rows.push([
          result.location.name,
          result.location.lat.toString(),
          result.location.lon.toString(),
          source,
          result.location.confidence?.toString() || '',
          category,
          featureName,
          result.location.lat.toString(), // Use search location (it's a polygon, not a point)
          result.location.lon.toString(),
          '0.00', // Containing area has distance 0
          stateFips || attributesJson,
          countyFips || attributesJson,
          landUseType || '',
          objectId || '',
          attributesJson,
          source
        ]);
      }

      // Add nearby features
      if (enrichments[nearbyKey] && Array.isArray(enrichments[nearbyKey])) {
        enrichments[nearbyKey].forEach((feature: any) => {
          const featureName = feature.name || 'Unknown';
          const distance = feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : '';
          const stateFips = feature.stateFips || '';
          const countyFips = feature.countyFips || '';
          const landUseType = feature.landUseType || '';
          const objectId = feature.objectId || '';
          const attributesJson = JSON.stringify({
            stateFips,
            countyFips,
            landUseType,
            objectId,
            ...feature
          });

          rows.push([
            result.location.name,
            result.location.lat.toString(),
            result.location.lon.toString(),
            source,
            result.location.confidence?.toString() || '',
            category,
            featureName,
            result.location.lat.toString(), // Use search location (it's a polygon, not a point)
            result.location.lon.toString(),
            distance,
            stateFips || attributesJson,
            countyFips || attributesJson,
            landUseType || '',
            objectId || '',
            attributesJson,
            source
          ]);
        });
      }
    });

    // Add TIGER Native Lands data rows
    const tigerNativeLandsLayers = [
      // Base layers (0-10)
      { containingKey: 'tiger_anrc_containing', nearbyKey: 'tiger_anrc_nearby_features', source: 'US Census TIGER', category: 'TIGER_ANRC' },
      { containingKey: 'tiger_tribal_subdivisions_containing', nearbyKey: 'tiger_tribal_subdivisions_nearby_features', source: 'US Census TIGER', category: 'TIGER_TRIBAL_SUBDIVISIONS' },
      { containingKey: 'tiger_federal_air_containing', nearbyKey: 'tiger_federal_air_nearby_features', source: 'US Census TIGER', category: 'TIGER_FEDERAL_AIR' },
      { containingKey: 'tiger_off_reservation_trust_containing', nearbyKey: 'tiger_off_reservation_trust_nearby_features', source: 'US Census TIGER', category: 'TIGER_OFF_RESERVATION_TRUST' },
      { containingKey: 'tiger_state_air_containing', nearbyKey: 'tiger_state_air_nearby_features', source: 'US Census TIGER', category: 'TIGER_STATE_AIR' },
      { containingKey: 'tiger_hhl_containing', nearbyKey: 'tiger_hhl_nearby_features', source: 'US Census TIGER', category: 'TIGER_HHL' },
      { containingKey: 'tiger_anvsa_containing', nearbyKey: 'tiger_anvsa_nearby_features', source: 'US Census TIGER', category: 'TIGER_ANVSA' },
      { containingKey: 'tiger_otsa_containing', nearbyKey: 'tiger_otsa_nearby_features', source: 'US Census TIGER', category: 'TIGER_OTSA' },
      { containingKey: 'tiger_sdtsa_containing', nearbyKey: 'tiger_sdtsa_nearby_features', source: 'US Census TIGER', category: 'TIGER_SDTSA' },
      { containingKey: 'tiger_tdsa_containing', nearbyKey: 'tiger_tdsa_nearby_features', source: 'US Census TIGER', category: 'TIGER_TDSA' },
      { containingKey: 'tiger_aijua_containing', nearbyKey: 'tiger_aijua_nearby_features', source: 'US Census TIGER', category: 'TIGER_AIJUA' },
      // BAS 2025 layers (12-22)
      { containingKey: 'tiger_bas2025_anrc_containing', nearbyKey: 'tiger_bas2025_anrc_nearby_features', source: 'US Census TIGER', category: 'TIGER_BAS2025_ANRC' },
      { containingKey: 'tiger_bas2025_tribal_subdivisions_containing', nearbyKey: 'tiger_bas2025_tribal_subdivisions_nearby_features', source: 'US Census TIGER', category: 'TIGER_BAS2025_TRIBAL_SUBDIVISIONS' },
      { containingKey: 'tiger_bas2025_federal_air_containing', nearbyKey: 'tiger_bas2025_federal_air_nearby_features', source: 'US Census TIGER', category: 'TIGER_BAS2025_FEDERAL_AIR' },
      { containingKey: 'tiger_bas2025_off_reservation_trust_containing', nearbyKey: 'tiger_bas2025_off_reservation_trust_nearby_features', source: 'US Census TIGER', category: 'TIGER_BAS2025_OFF_RESERVATION_TRUST' },
      { containingKey: 'tiger_bas2025_state_air_containing', nearbyKey: 'tiger_bas2025_state_air_nearby_features', source: 'US Census TIGER', category: 'TIGER_BAS2025_STATE_AIR' },
      { containingKey: 'tiger_bas2025_hhl_containing', nearbyKey: 'tiger_bas2025_hhl_nearby_features', source: 'US Census TIGER', category: 'TIGER_BAS2025_HHL' },
      { containingKey: 'tiger_bas2025_anvsa_containing', nearbyKey: 'tiger_bas2025_anvsa_nearby_features', source: 'US Census TIGER', category: 'TIGER_BAS2025_ANVSA' },
      { containingKey: 'tiger_bas2025_otsa_containing', nearbyKey: 'tiger_bas2025_otsa_nearby_features', source: 'US Census TIGER', category: 'TIGER_BAS2025_OTSA' },
      { containingKey: 'tiger_bas2025_sdtsa_containing', nearbyKey: 'tiger_bas2025_sdtsa_nearby_features', source: 'US Census TIGER', category: 'TIGER_BAS2025_SDTSA' },
      { containingKey: 'tiger_bas2025_tdsa_containing', nearbyKey: 'tiger_bas2025_tdsa_nearby_features', source: 'US Census TIGER', category: 'TIGER_BAS2025_TDSA' },
      { containingKey: 'tiger_bas2025_aijua_containing', nearbyKey: 'tiger_bas2025_aijua_nearby_features', source: 'US Census TIGER', category: 'TIGER_BAS2025_AIJUA' },
      // ACS 2024 layers (24-34)
      { containingKey: 'tiger_acs2024_anrc_containing', nearbyKey: 'tiger_acs2024_anrc_nearby_features', source: 'US Census TIGER', category: 'TIGER_ACS2024_ANRC' },
      { containingKey: 'tiger_acs2024_tribal_subdivisions_containing', nearbyKey: 'tiger_acs2024_tribal_subdivisions_nearby_features', source: 'US Census TIGER', category: 'TIGER_ACS2024_TRIBAL_SUBDIVISIONS' },
      { containingKey: 'tiger_acs2024_federal_air_containing', nearbyKey: 'tiger_acs2024_federal_air_nearby_features', source: 'US Census TIGER', category: 'TIGER_ACS2024_FEDERAL_AIR' },
      { containingKey: 'tiger_acs2024_off_reservation_trust_containing', nearbyKey: 'tiger_acs2024_off_reservation_trust_nearby_features', source: 'US Census TIGER', category: 'TIGER_ACS2024_OFF_RESERVATION_TRUST' },
      { containingKey: 'tiger_acs2024_state_air_containing', nearbyKey: 'tiger_acs2024_state_air_nearby_features', source: 'US Census TIGER', category: 'TIGER_ACS2024_STATE_AIR' },
      { containingKey: 'tiger_acs2024_hhl_containing', nearbyKey: 'tiger_acs2024_hhl_nearby_features', source: 'US Census TIGER', category: 'TIGER_ACS2024_HHL' },
      { containingKey: 'tiger_acs2024_anvsa_containing', nearbyKey: 'tiger_acs2024_anvsa_nearby_features', source: 'US Census TIGER', category: 'TIGER_ACS2024_ANVSA' },
      { containingKey: 'tiger_acs2024_otsa_containing', nearbyKey: 'tiger_acs2024_otsa_nearby_features', source: 'US Census TIGER', category: 'TIGER_ACS2024_OTSA' },
      { containingKey: 'tiger_acs2024_sdtsa_containing', nearbyKey: 'tiger_acs2024_sdtsa_nearby_features', source: 'US Census TIGER', category: 'TIGER_ACS2024_SDTSA' },
      { containingKey: 'tiger_acs2024_tdsa_containing', nearbyKey: 'tiger_acs2024_tdsa_nearby_features', source: 'US Census TIGER', category: 'TIGER_ACS2024_TDSA' },
      { containingKey: 'tiger_acs2024_aijua_containing', nearbyKey: 'tiger_acs2024_aijua_nearby_features', source: 'US Census TIGER', category: 'TIGER_ACS2024_AIJUA' },
      // Census 2020 layers (36-46)
      { containingKey: 'tiger_census2020_anrc_containing', nearbyKey: 'tiger_census2020_anrc_nearby_features', source: 'US Census TIGER', category: 'TIGER_CENSUS2020_ANRC' },
      { containingKey: 'tiger_census2020_tribal_subdivisions_containing', nearbyKey: 'tiger_census2020_tribal_subdivisions_nearby_features', source: 'US Census TIGER', category: 'TIGER_CENSUS2020_TRIBAL_SUBDIVISIONS' },
      { containingKey: 'tiger_census2020_federal_air_containing', nearbyKey: 'tiger_census2020_federal_air_nearby_features', source: 'US Census TIGER', category: 'TIGER_CENSUS2020_FEDERAL_AIR' },
      { containingKey: 'tiger_census2020_off_reservation_trust_containing', nearbyKey: 'tiger_census2020_off_reservation_trust_nearby_features', source: 'US Census TIGER', category: 'TIGER_CENSUS2020_OFF_RESERVATION_TRUST' },
      { containingKey: 'tiger_census2020_state_air_containing', nearbyKey: 'tiger_census2020_state_air_nearby_features', source: 'US Census TIGER', category: 'TIGER_CENSUS2020_STATE_AIR' },
      { containingKey: 'tiger_census2020_hhl_containing', nearbyKey: 'tiger_census2020_hhl_nearby_features', source: 'US Census TIGER', category: 'TIGER_CENSUS2020_HHL' },
      { containingKey: 'tiger_census2020_anvsa_containing', nearbyKey: 'tiger_census2020_anvsa_nearby_features', source: 'US Census TIGER', category: 'TIGER_CENSUS2020_ANVSA' },
      { containingKey: 'tiger_census2020_otsa_containing', nearbyKey: 'tiger_census2020_otsa_nearby_features', source: 'US Census TIGER', category: 'TIGER_CENSUS2020_OTSA' },
      { containingKey: 'tiger_census2020_sdtsa_containing', nearbyKey: 'tiger_census2020_sdtsa_nearby_features', source: 'US Census TIGER', category: 'TIGER_CENSUS2020_SDTSA' },
      { containingKey: 'tiger_census2020_tdsa_containing', nearbyKey: 'tiger_census2020_tdsa_nearby_features', source: 'US Census TIGER', category: 'TIGER_CENSUS2020_TDSA' },
      { containingKey: 'tiger_census2020_aijua_containing', nearbyKey: 'tiger_census2020_aijua_nearby_features', source: 'US Census TIGER', category: 'TIGER_CENSUS2020_AIJUA' }
    ];

    tigerNativeLandsLayers.forEach(({ containingKey, nearbyKey, source, category }) => {
      // Add containing area
      if (enrichments[containingKey] && enrichments[containingKey] !== null) {
        const feature = enrichments[containingKey];
        const featureName = feature.name || 'Unknown';
        const stateFips = feature.stateFips || '';
        const countyFips = feature.countyFips || '';
        const areaType = feature.areaType || '';
        const objectId = feature.objectId || '';
        const attributesJson = JSON.stringify({
          stateFips,
          countyFips,
          areaType,
          objectId,
          ...feature
        });

        rows.push([
          result.location.name,
          result.location.lat.toString(),
          result.location.lon.toString(),
          source,
          result.location.confidence?.toString() || '',
          category,
          featureName,
          result.location.lat.toString(), // Use search location (it's a polygon, not a point)
          result.location.lon.toString(),
          '0.00', // Containing area has distance 0
          stateFips || attributesJson,
          countyFips || attributesJson,
          areaType || '',
          objectId || '',
          attributesJson,
          source
        ]);
      }

      // Add nearby features
      if (enrichments[nearbyKey] && Array.isArray(enrichments[nearbyKey])) {
        enrichments[nearbyKey].forEach((feature: any) => {
          const featureName = feature.name || 'Unknown';
          const distance = feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : '';
          const stateFips = feature.stateFips || '';
          const countyFips = feature.countyFips || '';
          const areaType = feature.areaType || '';
          const objectId = feature.objectId || '';
          const attributesJson = JSON.stringify({
            stateFips,
            countyFips,
            areaType,
            objectId,
            ...feature
          });

          rows.push([
            result.location.name,
            result.location.lat.toString(),
            result.location.lon.toString(),
            source,
            result.location.confidence?.toString() || '',
            category,
            featureName,
            result.location.lat.toString(), // Use search location (it's a polygon, not a point)
            result.location.lon.toString(),
            distance,
            stateFips || attributesJson,
            countyFips || attributesJson,
            areaType || '',
            objectId || '',
            attributesJson,
            source
          ]);
        });
      }
    });

    // Add TIGER CBSA data rows
    // Track all processed CBSA features by GEOID to prevent duplicates
    // Use GEOID as the unique key since it's stable across all TIGER versions (base, BAS 2025, ACS 2024, Census 2020)
    // The same geographic feature will have the same GEOID even if it appears in multiple layer types
    // or has different objectIds in different TIGER versions
    const processedCBSAFeatures = new Set<string>();
    
    const tigerCBSALayers = [
      // Base layers (0-4)
      { containingKey: 'tiger_cbsa_combined_statistical_areas_containing', nearbyKey: 'tiger_cbsa_combined_statistical_areas_nearby_features', source: 'US Census TIGER', category: 'TIGER_CBSA_COMBINED_STATISTICAL_AREAS' },
      { containingKey: 'tiger_cbsa_metro_micropolitan_statistical_areas_containing', nearbyKey: 'tiger_cbsa_metro_micropolitan_statistical_areas_nearby_features', source: 'US Census TIGER', category: 'TIGER_CBSA_METRO_MICROPOLITAN_STATISTICAL_AREAS' },
      { containingKey: 'tiger_cbsa_metropolitan_divisions_containing', nearbyKey: 'tiger_cbsa_metropolitan_divisions_nearby_features', source: 'US Census TIGER', category: 'TIGER_CBSA_METROPOLITAN_DIVISIONS' },
      { containingKey: 'tiger_cbsa_metropolitan_statistical_areas_containing', nearbyKey: 'tiger_cbsa_metropolitan_statistical_areas_nearby_features', source: 'US Census TIGER', category: 'TIGER_CBSA_METROPOLITAN_STATISTICAL_AREAS' },
      { containingKey: 'tiger_cbsa_micropolitan_statistical_areas_containing', nearbyKey: 'tiger_cbsa_micropolitan_statistical_areas_nearby_features', source: 'US Census TIGER', category: 'TIGER_CBSA_MICROPOLITAN_STATISTICAL_AREAS' },
      // BAS 2025 layers (6-10)
      { containingKey: 'tiger_bas2025_cbsa_combined_statistical_areas_containing', nearbyKey: 'tiger_bas2025_cbsa_combined_statistical_areas_nearby_features', source: 'US Census TIGER', category: 'TIGER_BAS2025_CBSA_COMBINED_STATISTICAL_AREAS' },
      { containingKey: 'tiger_bas2025_cbsa_metro_micropolitan_statistical_areas_containing', nearbyKey: 'tiger_bas2025_cbsa_metro_micropolitan_statistical_areas_nearby_features', source: 'US Census TIGER', category: 'TIGER_BAS2025_CBSA_METRO_MICROPOLITAN_STATISTICAL_AREAS' },
      { containingKey: 'tiger_bas2025_cbsa_metropolitan_divisions_containing', nearbyKey: 'tiger_bas2025_cbsa_metropolitan_divisions_nearby_features', source: 'US Census TIGER', category: 'TIGER_BAS2025_CBSA_METROPOLITAN_DIVISIONS' },
      { containingKey: 'tiger_bas2025_cbsa_metropolitan_statistical_areas_containing', nearbyKey: 'tiger_bas2025_cbsa_metropolitan_statistical_areas_nearby_features', source: 'US Census TIGER', category: 'TIGER_BAS2025_CBSA_METROPOLITAN_STATISTICAL_AREAS' },
      { containingKey: 'tiger_bas2025_cbsa_micropolitan_statistical_areas_containing', nearbyKey: 'tiger_bas2025_cbsa_micropolitan_statistical_areas_nearby_features', source: 'US Census TIGER', category: 'TIGER_BAS2025_CBSA_MICROPOLITAN_STATISTICAL_AREAS' },
      // ACS 2024 layers (12-16)
      { containingKey: 'tiger_acs2024_cbsa_combined_statistical_areas_containing', nearbyKey: 'tiger_acs2024_cbsa_combined_statistical_areas_nearby_features', source: 'US Census TIGER', category: 'TIGER_ACS2024_CBSA_COMBINED_STATISTICAL_AREAS' },
      { containingKey: 'tiger_acs2024_cbsa_metro_micropolitan_statistical_areas_containing', nearbyKey: 'tiger_acs2024_cbsa_metro_micropolitan_statistical_areas_nearby_features', source: 'US Census TIGER', category: 'TIGER_ACS2024_CBSA_METRO_MICROPOLITAN_STATISTICAL_AREAS' },
      { containingKey: 'tiger_acs2024_cbsa_metropolitan_divisions_containing', nearbyKey: 'tiger_acs2024_cbsa_metropolitan_divisions_nearby_features', source: 'US Census TIGER', category: 'TIGER_ACS2024_CBSA_METROPOLITAN_DIVISIONS' },
      { containingKey: 'tiger_acs2024_cbsa_metropolitan_statistical_areas_containing', nearbyKey: 'tiger_acs2024_cbsa_metropolitan_statistical_areas_nearby_features', source: 'US Census TIGER', category: 'TIGER_ACS2024_CBSA_METROPOLITAN_STATISTICAL_AREAS' },
      { containingKey: 'tiger_acs2024_cbsa_micropolitan_statistical_areas_containing', nearbyKey: 'tiger_acs2024_cbsa_micropolitan_statistical_areas_nearby_features', source: 'US Census TIGER', category: 'TIGER_ACS2024_CBSA_MICROPOLITAN_STATISTICAL_AREAS' },
      // Census 2020 layers (18-27)
      { containingKey: 'tiger_census2020_cbsa_combined_new_england_city_town_areas_containing', nearbyKey: 'tiger_census2020_cbsa_combined_new_england_city_town_areas_nearby_features', source: 'US Census TIGER', category: 'TIGER_CENSUS2020_CBSA_COMBINED_NEW_ENGLAND_CITY_TOWN_AREAS' },
      { containingKey: 'tiger_census2020_cbsa_new_england_city_town_areas_containing', nearbyKey: 'tiger_census2020_cbsa_new_england_city_town_areas_nearby_features', source: 'US Census TIGER', category: 'TIGER_CENSUS2020_CBSA_NEW_ENGLAND_CITY_TOWN_AREAS' },
      { containingKey: 'tiger_census2020_cbsa_new_england_city_town_area_divisions_containing', nearbyKey: 'tiger_census2020_cbsa_new_england_city_town_area_divisions_nearby_features', source: 'US Census TIGER', category: 'TIGER_CENSUS2020_CBSA_NEW_ENGLAND_CITY_TOWN_AREA_DIVISIONS' },
      { containingKey: 'tiger_census2020_cbsa_metropolitan_new_england_city_town_areas_containing', nearbyKey: 'tiger_census2020_cbsa_metropolitan_new_england_city_town_areas_nearby_features', source: 'US Census TIGER', category: 'TIGER_CENSUS2020_CBSA_METROPOLITAN_NEW_ENGLAND_CITY_TOWN_AREAS' },
      { containingKey: 'tiger_census2020_cbsa_micropolitan_new_england_city_town_areas_containing', nearbyKey: 'tiger_census2020_cbsa_micropolitan_new_england_city_town_areas_nearby_features', source: 'US Census TIGER', category: 'TIGER_CENSUS2020_CBSA_MICROPOLITAN_NEW_ENGLAND_CITY_TOWN_AREAS' },
      { containingKey: 'tiger_census2020_cbsa_combined_statistical_areas_containing', nearbyKey: 'tiger_census2020_cbsa_combined_statistical_areas_nearby_features', source: 'US Census TIGER', category: 'TIGER_CENSUS2020_CBSA_COMBINED_STATISTICAL_AREAS' },
      { containingKey: 'tiger_census2020_cbsa_metro_micropolitan_statistical_areas_containing', nearbyKey: 'tiger_census2020_cbsa_metro_micropolitan_statistical_areas_nearby_features', source: 'US Census TIGER', category: 'TIGER_CENSUS2020_CBSA_METRO_MICROPOLITAN_STATISTICAL_AREAS' },
      { containingKey: 'tiger_census2020_cbsa_metropolitan_divisions_containing', nearbyKey: 'tiger_census2020_cbsa_metropolitan_divisions_nearby_features', source: 'US Census TIGER', category: 'TIGER_CENSUS2020_CBSA_METROPOLITAN_DIVISIONS' },
      { containingKey: 'tiger_census2020_cbsa_metropolitan_statistical_areas_containing', nearbyKey: 'tiger_census2020_cbsa_metropolitan_statistical_areas_nearby_features', source: 'US Census TIGER', category: 'TIGER_CENSUS2020_CBSA_METROPOLITAN_STATISTICAL_AREAS' },
      { containingKey: 'tiger_census2020_cbsa_micropolitan_statistical_areas_containing', nearbyKey: 'tiger_census2020_cbsa_micropolitan_statistical_areas_nearby_features', source: 'US Census TIGER', category: 'TIGER_CENSUS2020_CBSA_MICROPOLITAN_STATISTICAL_AREAS' }
    ];

    tigerCBSALayers.forEach(({ containingKey, nearbyKey, source, category }) => {
      // Add containing area
      if (enrichments[containingKey] && enrichments[containingKey] !== null) {
        const feature = enrichments[containingKey];
        const geoid = feature.GEOID || feature.geoid || '';
        const featureName = feature.name || 'Unknown';
        const objectId = feature.objectId || feature.OBJECTID || feature.FID || null;
        
        // Create a unique signature using GEOID (primary) since it's stable across all TIGER versions
        // If GEOID is not available, use objectId + name as fallback
        // This prevents the same feature from being exported multiple times, even if it appears
        // in multiple layer types or in both containing and nearby_features arrays
        const featureSignature = geoid
          ? `cbsa_${geoid}`
          : objectId !== null
          ? `cbsa_${objectId}_${featureName}`
          : `cbsa_${featureName}_${JSON.stringify(feature).substring(0, 100)}`;
        
        // Skip if we've already processed this feature
        if (processedCBSAFeatures.has(featureSignature)) {
          return;
        }
        
        processedCBSAFeatures.add(featureSignature);
        
        const stateFips = feature.stateFips || '';
        const countyFips = feature.countyFips || '';
        const cbsaType = feature.cbsaType || '';
        const attributesJson = JSON.stringify({
          stateFips,
          countyFips,
          cbsaType,
          objectId,
          ...feature
        });

        rows.push([
          result.location.name,
          result.location.lat.toString(),
          result.location.lon.toString(),
          source,
          result.location.confidence?.toString() || '',
          category,
          featureName,
          result.location.lat.toString(), // Use search location (it's a polygon, not a point)
          result.location.lon.toString(),
          '0.00', // Containing area has distance 0
          stateFips || attributesJson,
          countyFips || attributesJson,
          cbsaType || '',
          objectId || '',
          attributesJson,
          source
        ]);
      }

      // Add nearby features (excluding any that are already processed)
      if (enrichments[nearbyKey] && Array.isArray(enrichments[nearbyKey])) {
        enrichments[nearbyKey].forEach((feature: any) => {
          const geoid = feature.GEOID || feature.geoid || '';
          const featureName = feature.name || 'Unknown';
          const objectId = feature.objectId || feature.OBJECTID || feature.FID || null;
          
          // Create a unique signature using GEOID (primary) since it's stable across all TIGER versions
          // If GEOID is not available, use objectId + name as fallback
          // This prevents the same feature from being exported multiple times, even if it appears
          // multiple times in the array or was already processed as a containing feature
          const featureSignature = geoid
            ? `cbsa_${geoid}`
            : objectId !== null
            ? `cbsa_${objectId}_${featureName}`
            : `cbsa_${featureName}_${JSON.stringify(feature).substring(0, 100)}`;
          
          // Skip if we've already processed this feature (could be duplicate or same as containing)
          if (processedCBSAFeatures.has(featureSignature)) {
            return;
          }
          
          processedCBSAFeatures.add(featureSignature);
          
          const distance = feature.distance_miles ? feature.distance_miles.toFixed(2) : '0.00';
          const stateFips = feature.stateFips || '';
          const countyFips = feature.countyFips || '';
          const cbsaType = feature.cbsaType || '';
          const attributesJson = JSON.stringify({
            stateFips,
            countyFips,
            cbsaType,
            objectId,
            ...feature
          });

          rows.push([
            result.location.name,
            result.location.lat.toString(),
            result.location.lon.toString(),
            source,
            result.location.confidence?.toString() || '',
            category,
            featureName,
            result.location.lat.toString(), // Use search location (it's a polygon, not a point)
            result.location.lon.toString(),
            distance,
            stateFips || attributesJson,
            countyFips || attributesJson,
            cbsaType || '',
            objectId || '',
            attributesJson,
            source
          ]);
        });
      }
    });

    // Add TIGER Urban Areas data rows
    const tigerUrbanLayers = [
      { containingKey: 'tiger_urban_2020_urban_areas_containing', nearbyKey: 'tiger_urban_2020_urban_areas_nearby_features', source: 'US Census TIGER', category: 'TIGER_URBAN_2020_URBAN_AREAS' },
      { containingKey: 'tiger_urban_bas2025_2020_urban_areas_containing', nearbyKey: 'tiger_urban_bas2025_2020_urban_areas_nearby_features', source: 'US Census TIGER', category: 'TIGER_URBAN_BAS2025_2020_URBAN_AREAS' },
      { containingKey: 'tiger_urban_acs2024_2020_urban_areas_containing', nearbyKey: 'tiger_urban_acs2024_2020_urban_areas_nearby_features', source: 'US Census TIGER', category: 'TIGER_URBAN_ACS2024_2020_URBAN_AREAS' },
      { containingKey: 'tiger_urban_census2020_2020_urban_areas_corrected_containing', nearbyKey: 'tiger_urban_census2020_2020_urban_areas_corrected_nearby_features', source: 'US Census TIGER', category: 'TIGER_URBAN_CENSUS2020_2020_URBAN_AREAS_CORRECTED' },
      { containingKey: 'tiger_urban_census2020_2020_urban_areas_containing', nearbyKey: 'tiger_urban_census2020_2020_urban_areas_nearby_features', source: 'US Census TIGER', category: 'TIGER_URBAN_CENSUS2020_2020_URBAN_AREAS' },
      { containingKey: 'tiger_urban_urban_areas_containing', nearbyKey: 'tiger_urban_urban_areas_nearby_features', source: 'US Census TIGER', category: 'TIGER_URBAN_URBAN_AREAS' }
    ];

    tigerUrbanLayers.forEach(({ containingKey, nearbyKey, source, category }) => {
      // Add containing area
      if (enrichments[containingKey] && enrichments[containingKey] !== null) {
        const urban = enrichments[containingKey];
        const urbanName = urban.name || 'Unknown Urban Area';
        const urbanType = urban.urbanType || '';
        const objectId = urban.objectId || '';
        
        const allAttributes = { ...urban };
        delete allAttributes.name;
        delete allAttributes.urbanType;
        delete allAttributes.objectId;
        delete allAttributes.__geometry;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          source,
          (location.confidence || 'N/A').toString(),
          category,
          urbanName,
          location.lat.toString(),
          location.lon.toString(),
          '0.00', // Containing area has distance 0
          urbanType || attributesJson,
          '',
          '',
          objectId || '',
          attributesJson,
          source
        ]);
      }

      // Add nearby features
      if (enrichments[nearbyKey] && Array.isArray(enrichments[nearbyKey])) {
        enrichments[nearbyKey].forEach((urban: any) => {
          const urbanName = urban.name || 'Unknown Urban Area';
          const urbanType = urban.urbanType || '';
          const distance = urban.distance_miles ? urban.distance_miles.toFixed(2) : '0.00';
          const objectId = urban.objectId || '';
          
          const allAttributes = { ...urban };
          delete allAttributes.name;
          delete allAttributes.urbanType;
          delete allAttributes.objectId;
          delete allAttributes.__geometry;
          delete allAttributes.geometry;
          delete allAttributes.distance_miles;
          const attributesJson = JSON.stringify(allAttributes);
          
          rows.push([
            location.name,
            location.lat.toString(),
            location.lon.toString(),
            source,
            (location.confidence || 'N/A').toString(),
            category,
            urbanName,
            location.lat.toString(),
            location.lon.toString(),
            distance,
            urbanType || attributesJson,
            '',
            '',
            objectId || '',
            attributesJson,
            source
          ]);
        });
      }
    });

    tigerSchoolDistrictLayers.forEach(({ containingKey, allKey, source, category }) => {
      // Add containing district
      if (enrichments[containingKey] && enrichments[containingKey] !== null) {
        const district = enrichments[containingKey];
        const districtName = district.name || 'Unknown School District';
        const stateFips = district.stateFips || '';
        const countyFips = district.countyFips || '';
        const districtCode = district.districtCode || '';
        const objectId = district.objectId || '';
        
        const allAttributes = { ...district };
        delete allAttributes.name;
        delete allAttributes.stateFips;
        delete allAttributes.countyFips;
        delete allAttributes.districtCode;
        delete allAttributes.objectId;
        delete allAttributes.__geometry;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          source,
          (location.confidence || 'N/A').toString(),
          category,
          districtName,
          location.lat.toString(), // Use search location (it's a polygon, not a point)
          location.lon.toString(),
          '0.00', // Containing district has distance 0
          stateFips || attributesJson,
          countyFips || attributesJson,
          districtCode || '',
          objectId || '',
          attributesJson,
          source
        ]);
      }

      // Add nearby districts
      if (enrichments[allKey] && Array.isArray(enrichments[allKey])) {
        enrichments[allKey].forEach((district: any) => {
          const districtName = district.name || 'Unknown School District';
          const stateFips = district.stateFips || '';
          const countyFips = district.countyFips || '';
          const districtCode = district.districtCode || '';
          const objectId = district.objectId || '';
          const distance = district.distance_miles !== null && district.distance_miles !== undefined ? district.distance_miles.toFixed(2) : '';
          
          const allAttributes = { ...district };
          delete allAttributes.name;
          delete allAttributes.stateFips;
          delete allAttributes.countyFips;
          delete allAttributes.districtCode;
          delete allAttributes.objectId;
          delete allAttributes.__geometry;
          delete allAttributes.geometry;
          delete allAttributes.distance_miles;
          const attributesJson = JSON.stringify(allAttributes);
          
          rows.push([
            location.name,
            location.lat.toString(),
            location.lon.toString(),
            source,
            (location.confidence || 'N/A').toString(),
            category,
            districtName,
            location.lat.toString(), // Use search location (it's a polygon, not a point)
            location.lon.toString(),
            distance,
            stateFips || attributesJson,
            countyFips || attributesJson,
            districtCode || '',
            objectId || '',
            attributesJson,
            source
          ]);
        });
      }
    });
    
    // Add MA ACECs data rows
    if (enrichments.ma_acecs_all && Array.isArray(enrichments.ma_acecs_all)) {
      enrichments.ma_acecs_all.forEach((acec: any) => {
        const name = acec.NAME || acec.name || 'Unknown ACEC';
        const acecId = acec.ACECID || acec.acecid || '';
        const desDate = acec.DES_DATE || acec.des_date || '';
        const secretary = acec.SECRETARY || acec.secretary || '';
        const adminBy = acec.ADMIN_BY || acec.admin_by || '';
        const region = acec.REGION || acec.region || '';
        const polyAcres = acec.POLY_ACRES || acec.poly_acres || '';
        const acecAcres = acec.ACEC_ACRES || acec.acec_acres || '';
        
        const allAttributes = { ...acec };
        delete allAttributes.NAME;
        delete allAttributes.name;
        delete allAttributes.ACECID;
        delete allAttributes.acecid;
        delete allAttributes.DES_DATE;
        delete allAttributes.des_date;
        delete allAttributes.SECRETARY;
        delete allAttributes.secretary;
        delete allAttributes.ADMIN_BY;
        delete allAttributes.admin_by;
        delete allAttributes.REGION;
        delete allAttributes.region;
        delete allAttributes.POLY_ACRES;
        delete allAttributes.poly_acres;
        delete allAttributes.ACEC_ACRES;
        delete allAttributes.acec_acres;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'MassGIS',
          (location.confidence || 'N/A').toString(),
          'MA_ACEC',
          name,
          location.lat.toString(), // Use search location (it's a polygon, not a point)
          location.lon.toString(),
          acec.distance_miles !== null && acec.distance_miles !== undefined ? acec.distance_miles.toFixed(2) : '0.00',
          acecId || attributesJson,
          desDate || '',
          secretary || '',
          adminBy || '',
          region || '',
          polyAcres ? polyAcres.toString() : '',
          acecAcres ? acecAcres.toString() : '',
          attributesJson,
          'MassGIS'
        ]);
      });
    }
    
    // Add CT Urgent Care data rows
    if (enrichments.ct_urgent_care_all && Array.isArray(enrichments.ct_urgent_care_all)) {
      enrichments.ct_urgent_care_all.forEach((facility: any) => {
        const name = facility.name || facility.NAME || 'Unnamed Urgent Care';
        const address = facility.address || facility.ADDRESS || '';
        const city = facility.city || facility.CITY || '';
        const state = facility.state || facility.STATE || 'CT';
        const zip = facility.zip || facility.ZIP || '';
        const phone = facility.phone || facility.PHONE || '';
        const fullAddress = [address, city, state, zip].filter(Boolean).join(', ');
        
        const allAttributes = { ...facility };
        delete allAttributes.name;
        delete allAttributes.NAME;
        delete allAttributes.address;
        delete allAttributes.ADDRESS;
        delete allAttributes.city;
        delete allAttributes.CITY;
        delete allAttributes.state;
        delete allAttributes.STATE;
        delete allAttributes.zip;
        delete allAttributes.ZIP;
        delete allAttributes.phone;
        delete allAttributes.PHONE;
        delete allAttributes.lat;
        delete allAttributes.lon;
        delete allAttributes.LATITUDE;
        delete allAttributes.LONGITUDE;
        delete allAttributes.distance_miles;
        delete allAttributes.attributes;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'CT Geodata Portal',
          (location.confidence || 'N/A').toString(),
          'CT_URGENT_CARE',
          name,
          facility.lat?.toString() || location.lat.toString(),
          facility.lon?.toString() || location.lon.toString(),
          facility.distance_miles !== null && facility.distance_miles !== undefined ? facility.distance_miles.toFixed(2) : '',
          'Urgent Care',
          fullAddress || attributesJson,
          phone,
          '',
          attributesJson,
          'CT Geodata Portal'
        ]);
      });
    }
    
    // Add LA County POI data rows
    if (key === 'la_county_arts_recreation_all' && Array.isArray(value)) {
      value.forEach((poi: any) => {
        const poiId = poi.poiId || poi.OBJECTID || poi.objectid || 'Unknown';
        const distance = poi.distance_miles !== null && poi.distance_miles !== undefined ? poi.distance_miles.toFixed(2) : '';
        const lat = poi.geometry?.y || poi.LATITUDE || poi.latitude || poi.LAT || poi.lat || '';
        const lon = poi.geometry?.x || poi.LONGITUDE || poi.longitude || poi.LON || poi.lon || '';
        
        const allAttributes = { ...poi };
        delete allAttributes.poiId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'LA County GeoHub',
          (location.confidence || 'N/A').toString(),
          'LA_COUNTY_ARTS_RECREATION',
          `POI ${poiId}`,
          lat.toString(),
          lon.toString(),
          distance,
          'Arts and Recreation',
          attributesJson,
          '',
          '',
          'LA County GeoHub'
        ]);
      });
    } else if (key === 'la_county_education_all' && Array.isArray(value)) {
      value.forEach((poi: any) => {
        const poiId = poi.poiId || poi.OBJECTID || poi.objectid || 'Unknown';
        const distance = poi.distance_miles !== null && poi.distance_miles !== undefined ? poi.distance_miles.toFixed(2) : '';
        const lat = poi.geometry?.y || poi.LATITUDE || poi.latitude || poi.LAT || poi.lat || '';
        const lon = poi.geometry?.x || poi.LONGITUDE || poi.longitude || poi.LON || poi.lon || '';
        
        const allAttributes = { ...poi };
        delete allAttributes.poiId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'LA County GeoHub',
          (location.confidence || 'N/A').toString(),
          'LA_COUNTY_EDUCATION',
          `POI ${poiId}`,
          lat.toString(),
          lon.toString(),
          distance,
          'Education',
          attributesJson,
          '',
          '',
          'LA County GeoHub'
        ]);
      });
    } else if (key === 'la_county_hospitals_all' && Array.isArray(value)) {
      value.forEach((poi: any) => {
        const poiId = poi.poiId || poi.OBJECTID || poi.objectid || 'Unknown';
        const distance = poi.distance_miles !== null && poi.distance_miles !== undefined ? poi.distance_miles.toFixed(2) : '';
        const lat = poi.geometry?.y || poi.LATITUDE || poi.latitude || poi.LAT || poi.lat || '';
        const lon = poi.geometry?.x || poi.LONGITUDE || poi.longitude || poi.LON || poi.lon || '';
        
        const allAttributes = { ...poi };
        delete allAttributes.poiId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'LA County GeoHub',
          (location.confidence || 'N/A').toString(),
          'LA_COUNTY_HOSPITALS',
          `POI ${poiId}`,
          lat.toString(),
          lon.toString(),
          distance,
          'Hospitals',
          attributesJson,
          '',
          '',
          'LA County GeoHub'
        ]);
      });
    } else if (key === 'la_county_municipal_services_all' && Array.isArray(value)) {
      value.forEach((poi: any) => {
        const poiId = poi.poiId || poi.OBJECTID || poi.objectid || 'Unknown';
        const distance = poi.distance_miles !== null && poi.distance_miles !== undefined ? poi.distance_miles.toFixed(2) : '';
        const lat = poi.geometry?.y || poi.LATITUDE || poi.latitude || poi.LAT || poi.lat || '';
        const lon = poi.geometry?.x || poi.LONGITUDE || poi.longitude || poi.LON || poi.lon || '';
        
        const allAttributes = { ...poi };
        delete allAttributes.poiId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'LA County GeoHub',
          (location.confidence || 'N/A').toString(),
          'LA_COUNTY_MUNICIPAL_SERVICES',
          `POI ${poiId}`,
          lat.toString(),
          lon.toString(),
          distance,
          'Municipal Services',
          attributesJson,
          '',
          '',
          'LA County GeoHub'
        ]);
      });
    } else if (key === 'la_county_physical_features_all' && Array.isArray(value)) {
      value.forEach((poi: any) => {
        const poiId = poi.poiId || poi.OBJECTID || poi.objectid || 'Unknown';
        const distance = poi.distance_miles !== null && poi.distance_miles !== undefined ? poi.distance_miles.toFixed(2) : '';
        const lat = poi.geometry?.y || poi.LATITUDE || poi.latitude || poi.LAT || poi.lat || '';
        const lon = poi.geometry?.x || poi.LONGITUDE || poi.longitude || poi.LON || poi.lon || '';
        
        const allAttributes = { ...poi };
        delete allAttributes.poiId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'LA County GeoHub',
          (location.confidence || 'N/A').toString(),
          'LA_COUNTY_PHYSICAL_FEATURES',
          `POI ${poiId}`,
          lat.toString(),
          lon.toString(),
          distance,
          'Physical Features',
          attributesJson,
          '',
          '',
          'LA County GeoHub'
        ]);
      });
    } else if (key === 'la_county_public_safety_all' && Array.isArray(value)) {
      value.forEach((poi: any) => {
        const poiId = poi.poiId || poi.OBJECTID || poi.objectid || 'Unknown';
        const distance = poi.distance_miles !== null && poi.distance_miles !== undefined ? poi.distance_miles.toFixed(2) : '';
        const lat = poi.geometry?.y || poi.LATITUDE || poi.latitude || poi.LAT || poi.lat || '';
        const lon = poi.geometry?.x || poi.LONGITUDE || poi.longitude || poi.LON || poi.lon || '';
        
        const allAttributes = { ...poi };
        delete allAttributes.poiId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'LA County GeoHub',
          (location.confidence || 'N/A').toString(),
          'LA_COUNTY_PUBLIC_SAFETY',
          `POI ${poiId}`,
          lat.toString(),
          lon.toString(),
          distance,
          'Public Safety',
          attributesJson,
          '',
          '',
          'LA County GeoHub'
        ]);
      });
    } else if (key === 'la_county_transportation_all' && Array.isArray(value)) {
      value.forEach((poi: any) => {
        const poiId = poi.poiId || poi.OBJECTID || poi.objectid || 'Unknown';
        const distance = poi.distance_miles !== null && poi.distance_miles !== undefined ? poi.distance_miles.toFixed(2) : '';
        const lat = poi.geometry?.y || poi.LATITUDE || poi.latitude || poi.LAT || poi.lat || '';
        const lon = poi.geometry?.x || poi.LONGITUDE || poi.longitude || poi.LON || poi.lon || '';
        
        const allAttributes = { ...poi };
        delete allAttributes.poiId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'LA County GeoHub',
          (location.confidence || 'N/A').toString(),
          'LA_COUNTY_TRANSPORTATION',
          `POI ${poiId}`,
          lat.toString(),
          lon.toString(),
          distance,
          'Transportation',
          attributesJson,
          '',
          '',
          'LA County GeoHub'
        ]);
      });
    } else if (key === 'lake_county_parcel_points_all' && Array.isArray(value)) {
      value.forEach((point: any) => {
        const objectId = point.objectId || '';
        const lat = point.lat || '';
        const lon = point.lon || '';
        const distance = point.distance !== null && point.distance !== undefined ? point.distance.toFixed(3) : '';
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'Lake County, Illinois',
          (location.confidence || 'N/A').toString(),
          'LAKE_COUNTY_PARCEL_POINT',
          `Parcel Point ${objectId}`,
          lat.toString(),
          lon.toString(),
          distance,
          'Parcel Point',
          '',
          '',
          '',
          JSON.stringify(point.attributes || {}),
          'Lake County, Illinois'
        ]);
      });
    } else if (key === 'lake_county_high_school_districts_all' && Array.isArray(value)) {
      value.forEach((district: any) => {
        const objectId = district.objectId || '';
        const distId = district.distId || '';
        const hsdid = district.hsdid || '';
        const highName = district.highName || district.name || '';
        const highDist = district.highDist || '';
        const districtNum = district.district || '';
        const name = district.name || '';
        const addr = district.addr || '';
        const addr2 = district.addr2 || '';
        const city = district.city || '';
        const zip = district.zip || '';
        const phone = district.phone || '';
        const fax = district.fax || '';
        const email = district.email || '';
        const url = district.url || '';
        const mapUrl = district.mapUrl || '';
        const shapeArea = district.shapeArea || '';
        const shapeLength = district.shapeLength || '';
        const distance = district.distance !== null && district.distance !== undefined ? district.distance.toFixed(3) : (district.containing ? '0' : '');
        // Calculate centroid from geometry if needed for CSV
        let lat = '';
        let lon = '';
        if (district.geometry && district.geometry.rings && district.geometry.rings[0] && district.geometry.rings[0].length > 0) {
          const rings = district.geometry.rings[0];
          let sumLat = 0;
          let sumLon = 0;
          let count = 0;
          rings.forEach((coord: number[]) => {
            if (Array.isArray(coord) && coord.length >= 2) {
              sumLon += coord[0]; // ESRI format is [lon, lat]
              sumLat += coord[1];
              count++;
            }
          });
          if (count > 0) {
            lat = (sumLat / count).toString();
            lon = (sumLon / count).toString();
          }
        }
        const containing = district.containing ? 'Yes' : 'No';
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'Lake County, Illinois',
          (location.confidence || 'N/A').toString(),
          'LAKE_COUNTY_HIGH_SCHOOL_DISTRICT',
          highName || name,
          lat,
          lon,
          distance,
          'High School District',
          containing,
          objectId.toString(),
          distId,
          hsdid,
          highName,
          highDist,
          districtNum,
          name,
          addr,
          addr2,
          city,
          zip,
          phone,
          fax,
          email,
          url,
          mapUrl,
          shapeArea.toString(),
          shapeLength.toString()
        ]);
      });
    } else if (key === 'nws_drought_current_all' && Array.isArray(value)) {
      value.forEach((drought: any) => {
        const objectId = drought.objectId || '';
        const period = drought.period || '';
        const dm = drought.dm !== undefined && drought.dm !== null ? drought.dm.toString() : '';
        const droughtLabel = drought.dm !== undefined && drought.dm !== null 
          ? (drought.dm === 0 ? 'Abnormally Dry' : 
             drought.dm === 1 ? 'Drought - Moderate' :
             drought.dm === 2 ? 'Drought - Severe' :
             drought.dm === 3 ? 'Drought - Extreme' :
             drought.dm === 4 ? 'Drought - Exceptional' : 'Unknown')
          : 'Unknown';
        const filename = drought.filename || '';
        const endyear = drought.endyear !== undefined ? drought.endyear.toString() : '';
        const endmonth = drought.endmonth !== undefined ? drought.endmonth.toString() : '';
        const endday = drought.endday !== undefined ? drought.endday.toString() : '';
        const ddate = drought.ddate || '';
        const zipname = drought.zipname || '';
        const source = drought.source || '';
        const nothing = drought.nothing !== undefined ? drought.nothing.toString() : '';
        const d0 = drought.d0 !== undefined ? drought.d0.toString() : '';
        const d1 = drought.d1 !== undefined ? drought.d1.toString() : '';
        const d2 = drought.d2 !== undefined ? drought.d2.toString() : '';
        const d3 = drought.d3 !== undefined ? drought.d3.toString() : '';
        const d4 = drought.d4 !== undefined ? drought.d4.toString() : '';
        const d0_d4 = drought.d0_d4 !== undefined ? drought.d0_d4.toString() : '';
        const d1_d4 = drought.d1_d4 !== undefined ? drought.d1_d4.toString() : '';
        const d2_d4 = drought.d2_d4 !== undefined ? drought.d2_d4.toString() : '';
        const d3_d4 = drought.d3_d4 !== undefined ? drought.d3_d4.toString() : '';
        const shapeArea = drought.shapeArea !== undefined ? drought.shapeArea.toString() : '';
        const shapeLength = drought.shapeLength !== undefined ? drought.shapeLength.toString() : '';
        const containing = drought.containing ? 'Yes' : 'No';
        
        // Calculate centroid from geometry if needed for CSV
        let lat = '';
        let lon = '';
        if (drought.geometry && drought.geometry.rings && drought.geometry.rings[0] && drought.geometry.rings[0].length > 0) {
          const rings = drought.geometry.rings[0];
          let sumLat = 0;
          let sumLon = 0;
          let count = 0;
          rings.forEach((coord: number[]) => {
            if (Array.isArray(coord) && coord.length >= 2) {
              // Check if Web Mercator or WGS84
              const isWebMercator = Math.abs(coord[0]) > 180 || Math.abs(coord[1]) > 90;
              if (isWebMercator) {
                // Convert from Web Mercator to WGS84
                const lon_merc = (coord[0] / 20037508.34) * 180;
                let lat_merc = (coord[1] / 20037508.34) * 180;
                lat_merc = 180 / Math.PI * (2 * Math.atan(Math.exp(lat_merc * Math.PI / 180)) - Math.PI / 2);
                sumLon += lon_merc;
                sumLat += lat_merc;
              } else {
                // Already in WGS84 - ESRI format is [lon, lat]
                sumLon += coord[0];
                sumLat += coord[1];
              }
              count++;
            }
          });
          if (count > 0) {
            lat = (sumLat / count).toString();
            lon = (sumLon / count).toString();
          }
        }
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'National Weather Service',
          (location.confidence || 'N/A').toString(),
          'NWS_DROUGHT_CURRENT',
          droughtLabel,
          lat,
          lon,
          '0', // Distance is always 0 for point-in-polygon
          'Drought Condition',
          containing,
          objectId.toString(),
          period,
          dm,
          filename,
          endyear,
          endmonth,
          endday,
          ddate,
          zipname,
          source,
          nothing,
          d0,
          d1,
          d2,
          d3,
          d4,
          d0_d4,
          d1_d4,
          d2_d4,
          d3_d4,
          shapeArea,
          shapeLength
        ]);
      });
    } else if (key.startsWith('nws_') && key.endsWith('_all') && Array.isArray(value)) {
      const layerName = key.replace('_all', '').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      value.forEach((feature: any) => {
        const objectId = feature.objectId || '';
        const distance = feature.distance !== null && feature.distance !== undefined ? feature.distance.toFixed(3) : (feature.containing ? '0' : '');
        const containing = feature.containing ? 'Yes' : 'No';
        const attrs = feature.attributes || {};
        const layerNameField = feature.layerName || layerName;
        
        // Calculate centroid from geometry if needed for CSV
        let lat = '';
        let lon = '';
        if (feature.geometry) {
          if (feature.geometry.rings && feature.geometry.rings[0] && feature.geometry.rings[0].length > 0) {
            // Polygon geometry
            const rings = feature.geometry.rings[0];
            let sumLat = 0;
            let sumLon = 0;
            let count = 0;
            rings.forEach((coord: number[]) => {
              if (Array.isArray(coord) && coord.length >= 2) {
                sumLon += coord[0]; // ESRI format is [lon, lat]
                sumLat += coord[1];
                count++;
              }
            });
            if (count > 0) {
              lat = (sumLat / count).toString();
              lon = (sumLon / count).toString();
            }
          } else if (feature.geometry.points && Array.isArray(feature.geometry.points) && feature.geometry.points.length > 0) {
            // Multipoint geometry - use first point
            const firstPoint = feature.geometry.points[0];
            if (firstPoint && firstPoint.length >= 2) {
              let pointLon = firstPoint[0];
              let pointLat = firstPoint[1];
              
              // Check if Web Mercator or WGS84
              const isWebMercator = Math.abs(pointLon) > 180 || Math.abs(pointLat) > 90;
              if (isWebMercator) {
                // Convert from Web Mercator to WGS84
                pointLon = (pointLon / 20037508.34) * 180;
                let mercLat = (pointLat / 20037508.34) * 180;
                pointLat = 180 / Math.PI * (2 * Math.atan(Math.exp(mercLat * Math.PI / 180)) - Math.PI / 2);
              }
              lat = pointLat.toString();
              lon = pointLon.toString();
            }
          } else if (feature.geometry.x !== undefined && feature.geometry.y !== undefined) {
            // Point geometry
            lat = feature.geometry.y.toString();
            lon = feature.geometry.x.toString();
          } else if (feature.geometry.paths && feature.geometry.paths[0] && feature.geometry.paths[0].length > 0) {
            // Polyline geometry - use first point of first path
            const firstPath = feature.geometry.paths[0];
            const firstCoord = firstPath[0];
            if (firstCoord && firstCoord.length >= 2) {
              lat = firstCoord[1].toString(); // ESRI format is [lon, lat]
              lon = firstCoord[0].toString();
            }
          }
        }
        
        // Build attribute string
        const attrString = Object.keys(attrs).slice(0, 10).map(k => `${k}: ${attrs[k]}`).join('; ');
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'National Weather Service',
          (location.confidence || 'N/A').toString(),
          layerNameField.toUpperCase().replace(/\s+/g, '_'),
          layerNameField,
          lat,
          lon,
          distance,
          'NWS Feature',
          containing,
          objectId.toString(),
          attrString
        ]);
      });
    } else if (key === 'lake_county_facility_site_polygons_all' && Array.isArray(value)) {
      value.forEach((facility: any) => {
        const objectId = facility.objectId || '';
        const facilityId = facility.facilityId || '';
        const name = facility.name || '';
        const fcode = facility.fcode || '';
        const ownType = facility.ownType || '';
        const lastUpdate = facility.lastUpdate || '';
        const subTypeField = facility.subTypeField || '';
        const shapeArea = facility.shapeArea || '';
        const shapeLength = facility.shapeLength || '';
        const distance = facility.distance !== null && facility.distance !== undefined ? facility.distance.toFixed(3) : (facility.containing ? '0' : '');
        // Calculate centroid from geometry if needed for CSV
        let lat = '';
        let lon = '';
        if (facility.geometry && facility.geometry.rings && facility.geometry.rings[0] && facility.geometry.rings[0].length > 0) {
          const rings = facility.geometry.rings[0];
          let sumLat = 0;
          let sumLon = 0;
          let count = 0;
          rings.forEach((coord: number[]) => {
            if (Array.isArray(coord) && coord.length >= 2) {
              sumLon += coord[0]; // ESRI format is [lon, lat]
              sumLat += coord[1];
              count++;
            }
          });
          if (count > 0) {
            lat = (sumLat / count).toString();
            lon = (sumLon / count).toString();
          }
        }
        const containing = facility.containing ? 'Yes' : 'No';
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'Lake County, Illinois',
          (location.confidence || 'N/A').toString(),
          'LAKE_COUNTY_FACILITY_SITE_POLYGON',
          name || fcode,
          lat,
          lon,
          distance,
          'Facility Site',
          containing,
          objectId.toString(),
          facilityId,
          fcode,
          ownType,
          lastUpdate,
          subTypeField.toString(),
          shapeArea.toString(),
          shapeLength.toString()
        ]);
      });
    } else if (key === 'lake_county_parcels_all' && Array.isArray(value)) {
      value.forEach((parcel: any) => {
        const objectId = parcel.objectId || '';
        const distance = parcel.distance !== null && parcel.distance !== undefined ? parcel.distance.toFixed(3) : (parcel.containing ? '0' : '');
        // Calculate centroid from geometry if needed for CSV
        let lat = '';
        let lon = '';
        if (parcel.geometry && parcel.geometry.rings && parcel.geometry.rings[0] && parcel.geometry.rings[0].length > 0) {
          const rings = parcel.geometry.rings[0];
          let sumLat = 0;
          let sumLon = 0;
          let count = 0;
          rings.forEach((coord: number[]) => {
            if (Array.isArray(coord) && coord.length >= 2) {
              sumLon += coord[0]; // ESRI format is [lon, lat]
              sumLat += coord[1];
              count++;
            }
          });
          if (count > 0) {
            lat = (sumLat / count).toString();
            lon = (sumLon / count).toString();
          }
        }
        const containing = parcel.containing ? 'Yes' : 'No';
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'Lake County, Illinois',
          (location.confidence || 'N/A').toString(),
          'LAKE_COUNTY_PARCEL',
          `Parcel ${objectId}`,
          lat,
          lon,
          distance,
          'Parcel',
          containing,
          objectId.toString(),
          '',
          '',
          '',
          'Lake County, Illinois'
        ]);
      });
    } else if (key === 'lake_county_pavement_boundaries_all' && Array.isArray(value)) {
      value.forEach((boundary: any) => {
        const objectId = boundary.objectId || '';
        const type = boundary.type || '';
        const shapeArea = boundary.shapeArea || '';
        const shapeLength = boundary.shapeLength || '';
        const distance = boundary.distance !== null && boundary.distance !== undefined ? boundary.distance.toFixed(3) : (boundary.containing ? '0' : '');
        // Calculate centroid from geometry if needed for CSV
        let lat = '';
        let lon = '';
        if (boundary.geometry && boundary.geometry.rings && boundary.geometry.rings[0] && boundary.geometry.rings[0].length > 0) {
          const rings = boundary.geometry.rings[0];
          let sumLat = 0;
          let sumLon = 0;
          let count = 0;
          rings.forEach((coord: number[]) => {
            if (Array.isArray(coord) && coord.length >= 2) {
              sumLon += coord[0]; // ESRI format is [lon, lat]
              sumLat += coord[1];
              count++;
            }
          });
          if (count > 0) {
            lat = (sumLat / count).toString();
            lon = (sumLon / count).toString();
          }
        }
        const containing = boundary.containing ? 'Yes' : 'No';
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'Lake County, Illinois',
          (location.confidence || 'N/A').toString(),
          'LAKE_COUNTY_PAVEMENT_BOUNDARY',
          type,
          lat,
          lon,
          distance,
          'Pavement Boundary',
          containing,
          objectId.toString(),
          type,
          shapeArea.toString(),
          shapeLength.toString()
        ]);
      });
    } else if (key === 'lake_county_building_footprints_all' && Array.isArray(value)) {
      value.forEach((footprint: any) => {
        const objectId = footprint.objectId || '';
        const buildingClass = footprint.buildingClass || '';
        const featureCode = footprint.featureCode || '';
        const shapeArea = footprint.shapeArea || '';
        const shapeLength = footprint.shapeLength || '';
        const distance = footprint.distance !== null && footprint.distance !== undefined ? footprint.distance.toFixed(3) : (footprint.containing ? '0' : '');
        // Calculate centroid from geometry if needed for CSV
        let lat = '';
        let lon = '';
        if (footprint.geometry && footprint.geometry.rings && footprint.geometry.rings[0] && footprint.geometry.rings[0].length > 0) {
          const rings = footprint.geometry.rings[0];
          let sumLat = 0;
          let sumLon = 0;
          let count = 0;
          rings.forEach((coord: number[]) => {
            if (Array.isArray(coord) && coord.length >= 2) {
              sumLon += coord[0]; // ESRI format is [lon, lat]
              sumLat += coord[1];
              count++;
            }
          });
          if (count > 0) {
            lat = (sumLat / count).toString();
            lon = (sumLon / count).toString();
          }
        }
        const containing = footprint.containing ? 'Yes' : 'No';
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'Lake County, Illinois',
          (location.confidence || 'N/A').toString(),
          'LAKE_COUNTY_BUILDING_FOOTPRINT',
          `${featureCode}${buildingClass ? ` (Class ${buildingClass})` : ''}`,
          lat.toString(),
          lon.toString(),
          distance,
          'Building Footprint',
          containing,
          objectId.toString(),
          buildingClass.toString(),
          featureCode,
          shapeArea.toString(),
          shapeLength.toString()
        ]);
      });
    } else if (key === 'chicago_building_footprints_all' && Array.isArray(value)) {
      value.forEach((footprint: any) => {
        const bldgId = footprint.bldg_id || footprint.BLDG_ID || 'Unknown';
        const bldgName = footprint.bldg_name || footprint.BLDG_NAME || '';
        const address = footprint.address || footprint.ADDRESS || '';
        const buildingType = footprint.building_type || footprint.BUILDING_TYPE || footprint.building_use || footprint.BUILDING_USE || '';
        const distance = footprint.distance_miles !== null && footprint.distance_miles !== undefined ? footprint.distance_miles.toFixed(2) : '';
        const lat = footprint.latitude || footprint.geometry?.y || '';
        const lon = footprint.longitude || footprint.geometry?.x || '';
        
        const allAttributes = { ...footprint };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.latitude;
        delete allAttributes.longitude;
        delete allAttributes.location;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'City of Chicago',
          (location.confidence || 'N/A').toString(),
          'CHICAGO_BUILDING_CENTROID',
          `${bldgName || bldgId}${buildingType ? ` - ${buildingType}` : ''}`,
          lat.toString(),
          lon.toString(),
          distance,
          'Building Centroid',
          address || bldgName || bldgId || attributesJson,
          '', // Owner
          '', // Phone
          attributesJson,
          'City of Chicago'
        ]);
      });
    } else if (key === 'la_county_fire_hydrants_all' && Array.isArray(value)) {
      value.forEach((hydrant: any) => {
        const hydrantId = hydrant.OBJECTID_1 || hydrant.OBJECTID || hydrant.objectid || 'Unknown';
        const config = hydrant.HYDR_CONFG || hydrant.hydr_confg || '';
        const distance = hydrant.distance_miles !== null && hydrant.distance_miles !== undefined ? hydrant.distance_miles.toFixed(2) : '';
        const lat = hydrant.geometry?.y || '';
        const lon = hydrant.geometry?.x || '';
        
        const allAttributes = { ...hydrant };
        delete allAttributes.OBJECTID_1;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'LA County Fire Department',
          (location.confidence || 'N/A').toString(),
          'LA_COUNTY_FIRE_HYDRANTS',
          `Fire Hydrant ${hydrantId}${config ? ` (${config})` : ''}`,
          lat.toString(),
          lon.toString(),
          distance,
          'Fire Hydrant',
          attributesJson,
          '',
          '',
          'LA County Fire Department'
        ]);
      });
    } else if (key === 'chicago_311_all' && Array.isArray(value)) {
      value.forEach((request: any) => {
        const srNumber = request.sr_number || request.SR_NUMBER || 'Unknown';
        const srType = request.sr_type || request.SR_TYPE || '';
        const address = request.street_address || '';
        const city = request.city || 'Chicago';
        const zip = request.zip_code || '';
        const distance = request.distance_miles !== null && request.distance_miles !== undefined ? request.distance_miles.toFixed(2) : '';
        const lat = request.latitude || request.geometry?.y || '';
        const lon = request.longitude || request.geometry?.x || '';
        
        const allAttributes = { ...request };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.latitude;
        delete allAttributes.longitude;
        delete allAttributes.location;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'City of Chicago',
          (location.confidence || 'N/A').toString(),
          'CHICAGO_311',
          `${srNumber}${srType ? ` - ${srType}` : ''}`,
          lat.toString(),
          lon.toString(),
          distance,
          srType || 'Service Request',
          `${address}${city ? `, ${city}` : ''}${zip ? ` ${zip}` : ''}`,
          '',
          attributesJson,
          'City of Chicago Data Portal'
        ]);
      });
    } else if (key === 'chicago_traffic_crashes_all' && Array.isArray(value)) {
      value.forEach((crash: any) => {
        const crashId = crash.crash_record_id || crash.CRASH_RECORD_ID || 'Unknown';
        const crashType = crash.crash_type || crash.CRASH_TYPE || '';
        const streetName = crash.street_name || crash.STREET_NAME || '';
        const streetNo = crash.street_no || crash.STREET_NO || '';
        const streetDir = crash.street_direction || crash.STREET_DIRECTION || '';
        const distance = crash.distance_miles !== null && crash.distance_miles !== undefined ? crash.distance_miles.toFixed(2) : '';
        const lat = crash.latitude || crash.geometry?.y || '';
        const lon = crash.longitude || crash.geometry?.x || '';
        
        // Build address
        let address = '';
        if (streetNo) address += streetNo;
        if (streetDir) address += ` ${streetDir}`;
        if (streetName) address += ` ${streetName}`;
        
        const allAttributes = { ...crash };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.latitude;
        delete allAttributes.longitude;
        delete allAttributes.location;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'City of Chicago',
          (location.confidence || 'N/A').toString(),
          'CHICAGO_TRAFFIC_CRASH',
          `${crashId}${crashType ? ` - ${crashType}` : ''}`,
          lat.toString(),
          lon.toString(),
          distance,
          crashType || 'Traffic Crash',
          address.trim() || crashId,
          '', // Owner
          '', // Phone
          attributesJson,
          'City of Chicago Data Portal'
        ]);
      });
    } else if (key === 'chicago_speed_cameras_all' && Array.isArray(value)) {
      value.forEach((camera: any) => {
        const cameraId = camera.camera_id || camera.CAMERA_ID || 'Unknown';
        const address = camera.address || camera.ADDRESS || '';
        const distance = camera.distance_miles !== null && camera.distance_miles !== undefined ? camera.distance_miles.toFixed(2) : '';
        const lat = camera.latitude || camera.geometry?.y || '';
        const lon = camera.longitude || camera.geometry?.x || '';

        const allAttributes = { ...camera };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.latitude;
        delete allAttributes.longitude;
        delete allAttributes.location;
        const attributesJson = JSON.stringify(allAttributes);

        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'City of Chicago',
          (location.confidence || 'N/A').toString(),
          'CHICAGO_SPEED_CAMERA',
          cameraId,
          lat.toString(),
          lon.toString(),
          distance,
          'Speed Camera',
          address || cameraId,
          '', // Owner
          '', // Phone
          attributesJson,
          'City of Chicago Data Portal'
        ]);
      });
    } else if (key === 'chicago_red_light_cameras_all' && Array.isArray(value)) {
      value.forEach((camera: any) => {
        const cameraId = camera.camera_id || camera.CAMERA_ID || 'Unknown';
        const address = camera.address || camera.ADDRESS || '';
        const distance = camera.distance_miles !== null && camera.distance_miles !== undefined ? camera.distance_miles.toFixed(2) : '';
        const lat = camera.latitude || camera.geometry?.y || '';
        const lon = camera.longitude || camera.geometry?.x || '';

        const allAttributes = { ...camera };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.latitude;
        delete allAttributes.longitude;
        delete allAttributes.location;
        const attributesJson = JSON.stringify(allAttributes);

        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'City of Chicago',
          (location.confidence || 'N/A').toString(),
          'CHICAGO_RED_LIGHT_CAMERA',
          cameraId,
          lat.toString(),
          lon.toString(),
          distance,
          'Red Light Camera',
          address || cameraId,
          '', // Owner
          '', // Phone
          attributesJson,
          'City of Chicago Data Portal'
        ]);
      });
    } else if (key === 'nyc_mappluto_all' && Array.isArray(value)) {
      value.forEach((taxLot: any) => {
        const bbl = taxLot.bbl || taxLot.BBL || 'Unknown';
        const address = taxLot.address || taxLot.Address || taxLot.ADDRESS || '';
        const ownerName = taxLot.ownerName || taxLot.OwnerName || taxLot.OWNERNAME || '';
        const distance = taxLot.distance_miles !== null && taxLot.distance_miles !== undefined ? taxLot.distance_miles.toFixed(2) : (taxLot.isContaining ? '0.00' : '');

        const allAttributes = { ...taxLot };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.bbl;
        delete allAttributes.BBL;
        delete allAttributes.address;
        delete allAttributes.Address;
        delete allAttributes.ADDRESS;
        delete allAttributes.borough;
        delete allAttributes.Borough;
        delete allAttributes.BOROUGH;
        delete allAttributes.block;
        delete allAttributes.Block;
        delete allAttributes.BLOCK;
        delete allAttributes.lot;
        delete allAttributes.Lot;
        delete allAttributes.LOT;
        delete allAttributes.zipCode;
        delete allAttributes.ZipCode;
        delete allAttributes.ZIPCODE;
        delete allAttributes.ownerName;
        delete allAttributes.OwnerName;
        delete allAttributes.OWNERNAME;
        delete allAttributes.landUse;
        delete allAttributes.LandUse;
        delete allAttributes.LANDUSE;
        delete allAttributes.yearBuilt;
        delete allAttributes.YearBuilt;
        delete allAttributes.YEARBUILT;
        delete allAttributes.bldgClass;
        delete allAttributes.BldgClass;
        delete allAttributes.BLDGCLASS;
        delete allAttributes.lotArea;
        delete allAttributes.LotArea;
        delete allAttributes.LOTAREA;
        delete allAttributes.bldgArea;
        delete allAttributes.BldgArea;
        delete allAttributes.BLDGAREA;
        delete allAttributes.numBldgs;
        delete allAttributes.NumBldgs;
        delete allAttributes.NUMBLDGS;
        delete allAttributes.numFloors;
        delete allAttributes.NumFloors;
        delete allAttributes.NUMFLOORS;
        delete allAttributes.unitsRes;
        delete allAttributes.UnitsRes;
        delete allAttributes.UNITSRES;
        delete allAttributes.unitsTotal;
        delete allAttributes.UnitsTotal;
        delete allAttributes.UNITSTOTAL;
        delete allAttributes.assessLand;
        delete allAttributes.AssessLand;
        delete allAttributes.ASSESSLAND;
        delete allAttributes.assessTot;
        delete allAttributes.AssessTot;
        delete allAttributes.ASSESSTOT;
        delete allAttributes.zoneDist1;
        delete allAttributes.ZoneDist1;
        delete allAttributes.ZONEDIST1;
        const attributesJson = JSON.stringify(allAttributes);

        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'New York City',
          (location.confidence || 'N/A').toString(),
          'NYC_MAPPLUTO_TAX_LOT',
          `${bbl}${address ? ` - ${address}` : ''}`,
          '', // Lat (polygon, no single point)
          '', // Lon (polygon, no single point)
          distance,
          taxLot.isContaining ? 'Within Tax Lot' : `Nearby Tax Lot (${distance} miles)`,
          address || bbl,
          ownerName || '',
          '', // Phone
          attributesJson,
          'NYC Department of City Planning'
        ]);
      });
    } else if (key === 'nyc_mappluto_commercial_mixed_use_all' && Array.isArray(value)) {
      value.forEach((taxLot: any) => {
        const bbl = taxLot.bbl || taxLot.BBL || 'Unknown';
        const address = taxLot.address || taxLot.Address || taxLot.ADDRESS || '';
        const ownerName = taxLot.ownerName || taxLot.OwnerName || taxLot.OWNERNAME || '';
        const distance = taxLot.distance_miles !== null && taxLot.distance_miles !== undefined ? taxLot.distance_miles.toFixed(2) : (taxLot.isContaining ? '0.00' : '');

        const allAttributes = { ...taxLot };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.bbl;
        delete allAttributes.BBL;
        delete allAttributes.address;
        delete allAttributes.Address;
        delete allAttributes.ADDRESS;
        delete allAttributes.borough;
        delete allAttributes.Borough;
        delete allAttributes.BOROUGH;
        delete allAttributes.block;
        delete allAttributes.Block;
        delete allAttributes.BLOCK;
        delete allAttributes.lot;
        delete allAttributes.Lot;
        delete allAttributes.LOT;
        delete allAttributes.zipCode;
        delete allAttributes.ZipCode;
        delete allAttributes.ZIPCODE;
        delete allAttributes.ownerName;
        delete allAttributes.OwnerName;
        delete allAttributes.OWNERNAME;
        delete allAttributes.landUse;
        delete allAttributes.LandUse;
        delete allAttributes.LANDUSE;
        delete allAttributes.yearBuilt;
        delete allAttributes.YearBuilt;
        delete allAttributes.YEARBUILT;
        delete allAttributes.bldgClass;
        delete allAttributes.BldgClass;
        delete allAttributes.BLDGCLASS;
        delete allAttributes.lotArea;
        delete allAttributes.LotArea;
        delete allAttributes.LOTAREA;
        delete allAttributes.bldgArea;
        delete allAttributes.BldgArea;
        delete allAttributes.BLDGAREA;
        delete allAttributes.numBldgs;
        delete allAttributes.NumBldgs;
        delete allAttributes.NUMBLDGS;
        delete allAttributes.numFloors;
        delete allAttributes.NumFloors;
        delete allAttributes.NUMFLOORS;
        delete allAttributes.unitsRes;
        delete allAttributes.UnitsRes;
        delete allAttributes.UNITSRES;
        delete allAttributes.unitsTotal;
        delete allAttributes.UnitsTotal;
        delete allAttributes.UNITSTOTAL;
        delete allAttributes.assessLand;
        delete allAttributes.AssessLand;
        delete allAttributes.ASSESSLAND;
        delete allAttributes.assessTot;
        delete allAttributes.AssessTot;
        delete allAttributes.ASSESSTOT;
        delete allAttributes.zoneDist1;
        delete allAttributes.ZoneDist1;
        delete allAttributes.ZONEDIST1;
        const attributesJson = JSON.stringify(allAttributes);

        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'New York City',
          (location.confidence || 'N/A').toString(),
          'NYC_MAPPLUTO_COMMERCIAL_MIXED_USE_LOT',
          `${bbl}${address ? ` - ${address}` : ''}`,
          '', // Lat (polygon, no single point)
          '', // Lon (polygon, no single point)
          distance,
          taxLot.isContaining ? 'Within Commercial/Mixed Use Lot' : `Nearby Commercial/Mixed Use Lot (${distance} miles)`,
          address || bbl,
          ownerName || '',
          '', // Phone
          attributesJson,
          'NYC Department of City Planning'
        ]);
      });
    } else if (key === 'nyc_mappluto_retail_all' && Array.isArray(value)) {
      value.forEach((taxLot: any) => {
        const bbl = taxLot.bbl || taxLot.BBL || 'Unknown';
        const address = taxLot.address || taxLot.Address || taxLot.ADDRESS || '';
        const distance = taxLot.distance_miles !== null && taxLot.distance_miles !== undefined ? taxLot.distance_miles.toFixed(2) : (taxLot.isContaining ? '0.00' : '');
        const allAttributes = { ...taxLot };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        const attributesJson = JSON.stringify(allAttributes);
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(), 'New York City',
          (location.confidence || 'N/A').toString(), 'NYC_MAPPLUTO_RETAIL',
          `${bbl}${address ? ` - ${address}` : ''}`, '', '', distance,
          taxLot.isContaining ? 'Within Retail Lot' : `Nearby Retail Lot (${distance} miles)`,
          address || bbl, '', '', attributesJson, 'NYC Department of City Planning'
        ]);
      });
    } else if (key === 'nyc_mappluto_office_all' && Array.isArray(value)) {
      value.forEach((taxLot: any) => {
        const bbl = taxLot.bbl || taxLot.BBL || 'Unknown';
        const address = taxLot.address || taxLot.Address || taxLot.ADDRESS || '';
        const distance = taxLot.distance_miles !== null && taxLot.distance_miles !== undefined ? taxLot.distance_miles.toFixed(2) : (taxLot.isContaining ? '0.00' : '');
        const allAttributes = { ...taxLot };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        const attributesJson = JSON.stringify(allAttributes);
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(), 'New York City',
          (location.confidence || 'N/A').toString(), 'NYC_MAPPLUTO_OFFICE',
          `${bbl}${address ? ` - ${address}` : ''}`, '', '', distance,
          taxLot.isContaining ? 'Within Office Lot' : `Nearby Office Lot (${distance} miles)`,
          address || bbl, '', '', attributesJson, 'NYC Department of City Planning'
        ]);
      });
    } else if (key === 'nyc_mappluto_industrial_all' && Array.isArray(value)) {
      value.forEach((taxLot: any) => {
        const bbl = taxLot.bbl || taxLot.BBL || 'Unknown';
        const address = taxLot.address || taxLot.Address || taxLot.ADDRESS || '';
        const distance = taxLot.distance_miles !== null && taxLot.distance_miles !== undefined ? taxLot.distance_miles.toFixed(2) : (taxLot.isContaining ? '0.00' : '');
        const allAttributes = { ...taxLot };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        const attributesJson = JSON.stringify(allAttributes);
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(), 'New York City',
          (location.confidence || 'N/A').toString(), 'NYC_MAPPLUTO_INDUSTRIAL',
          `${bbl}${address ? ` - ${address}` : ''}`, '', '', distance,
          taxLot.isContaining ? 'Within Industrial Lot' : `Nearby Industrial Lot (${distance} miles)`,
          address || bbl, '', '', attributesJson, 'NYC Department of City Planning'
        ]);
      });
    } else if (key === 'nyc_mappluto_warehouses_all' && Array.isArray(value)) {
      value.forEach((taxLot: any) => {
        const bbl = taxLot.bbl || taxLot.BBL || 'Unknown';
        const address = taxLot.address || taxLot.Address || taxLot.ADDRESS || '';
        const distance = taxLot.distance_miles !== null && taxLot.distance_miles !== undefined ? taxLot.distance_miles.toFixed(2) : (taxLot.isContaining ? '0.00' : '');
        const allAttributes = { ...taxLot };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        const attributesJson = JSON.stringify(allAttributes);
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(), 'New York City',
          (location.confidence || 'N/A').toString(), 'NYC_MAPPLUTO_WAREHOUSES',
          `${bbl}${address ? ` - ${address}` : ''}`, '', '', distance,
          taxLot.isContaining ? 'Within Warehouse Lot' : `Nearby Warehouse Lot (${distance} miles)`,
          address || bbl, '', '', attributesJson, 'NYC Department of City Planning'
        ]);
      });
    } else if (key === 'nyc_mappluto_hotels_all' && Array.isArray(value)) {
      value.forEach((taxLot: any) => {
        const bbl = taxLot.bbl || taxLot.BBL || 'Unknown';
        const address = taxLot.address || taxLot.Address || taxLot.ADDRESS || '';
        const distance = taxLot.distance_miles !== null && taxLot.distance_miles !== undefined ? taxLot.distance_miles.toFixed(2) : (taxLot.isContaining ? '0.00' : '');
        const allAttributes = { ...taxLot };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        const attributesJson = JSON.stringify(allAttributes);
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(), 'New York City',
          (location.confidence || 'N/A').toString(), 'NYC_MAPPLUTO_HOTELS',
          `${bbl}${address ? ` - ${address}` : ''}`, '', '', distance,
          taxLot.isContaining ? 'Within Hotel Lot' : `Nearby Hotel Lot (${distance} miles)`,
          address || bbl, '', '', attributesJson, 'NYC Department of City Planning'
        ]);
      });
    } else if (key === 'nyc_mappluto_auto_commercial_all' && Array.isArray(value)) {
      value.forEach((taxLot: any) => {
        const bbl = taxLot.bbl || taxLot.BBL || 'Unknown';
        const address = taxLot.address || taxLot.Address || taxLot.ADDRESS || '';
        const distance = taxLot.distance_miles !== null && taxLot.distance_miles !== undefined ? taxLot.distance_miles.toFixed(2) : (taxLot.isContaining ? '0.00' : '');
        const allAttributes = { ...taxLot };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        const attributesJson = JSON.stringify(allAttributes);
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(), 'New York City',
          (location.confidence || 'N/A').toString(), 'NYC_MAPPLUTO_AUTO_COMMERCIAL',
          `${bbl}${address ? ` - ${address}` : ''}`, '', '', distance,
          taxLot.isContaining ? 'Within Auto Commercial Lot' : `Nearby Auto Commercial Lot (${distance} miles)`,
          address || bbl, '', '', attributesJson, 'NYC Department of City Planning'
        ]);
      });
    } else if (key === 'nyc_mappluto_large_commercial_all' && Array.isArray(value)) {
      value.forEach((taxLot: any) => {
        const bbl = taxLot.bbl || taxLot.BBL || 'Unknown';
        const address = taxLot.address || taxLot.Address || taxLot.ADDRESS || '';
        const distance = taxLot.distance_miles !== null && taxLot.distance_miles !== undefined ? taxLot.distance_miles.toFixed(2) : (taxLot.isContaining ? '0.00' : '');
        const allAttributes = { ...taxLot };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        const attributesJson = JSON.stringify(allAttributes);
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(), 'New York City',
          (location.confidence || 'N/A').toString(), 'NYC_MAPPLUTO_LARGE_COMMERCIAL',
          `${bbl}${address ? ` - ${address}` : ''}`, '', '', distance,
          taxLot.isContaining ? 'Within Large Commercial Lot' : `Nearby Large Commercial Lot (${distance} miles)`,
          address || bbl, '', '', attributesJson, 'NYC Department of City Planning'
        ]);
      });
    } else if (key === 'nyc_mappluto_residential_all' && Array.isArray(value)) {
      value.forEach((taxLot: any) => {
        const bbl = taxLot.bbl || taxLot.BBL || 'Unknown';
        const address = taxLot.address || taxLot.Address || taxLot.ADDRESS || '';
        const distance = taxLot.distance_miles !== null && taxLot.distance_miles !== undefined ? taxLot.distance_miles.toFixed(2) : (taxLot.isContaining ? '0.00' : '');
        const allAttributes = { ...taxLot };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        const attributesJson = JSON.stringify(allAttributes);
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(), 'New York City',
          (location.confidence || 'N/A').toString(), 'NYC_MAPPLUTO_RESIDENTIAL',
          `${bbl}${address ? ` - ${address}` : ''}`, '', '', distance,
          taxLot.isContaining ? 'Within Residential Lot' : `Nearby Residential Lot (${distance} miles)`,
          address || bbl, '', '', attributesJson, 'NYC Department of City Planning'
        ]);
      });
    } else if (key === 'scotland_transport_gritter_locations_all' && Array.isArray(value)) {
      value.forEach((location: any) => {
        const vehicleId = location.vehicleId || location.VehicleID || location.vehicle_id || 'Unknown';
        const vehicleName = location.vehicleName || location.VehicleName || location.vehicle_name || '';
        const distance = location.distance_miles !== null && location.distance_miles !== undefined ? location.distance_miles.toFixed(2) : '';
        const allAttributes = { ...location };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        const lat = location.geometry?.y || location.lat || '';
        const lon = location.geometry?.x || location.lon || '';
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(), 'Scotland',
          (location.confidence || 'N/A').toString(), 'SCOTLAND_GRITTER_LOCATION',
          `${vehicleId}${vehicleName ? ` - ${vehicleName}` : ''}`, lat, lon, distance,
          `Gritter Vehicle Location (${distance} miles)`,
          vehicleName || vehicleId, '', '', attributesJson, 'Scotland Transport'
        ]);
      });
    } else if (key === 'scotland_transport_trunk_road_height_all' && Array.isArray(value)) {
      value.forEach((segment: any) => {
        const maxHeight = segment.maxHeight !== null && segment.maxHeight !== undefined ? segment.maxHeight : 'N/A';
        const meanHeight = segment.meanHeight !== null && segment.meanHeight !== undefined ? segment.meanHeight : 'N/A';
        const distance = segment.distance_miles !== null && segment.distance_miles !== undefined ? segment.distance_miles.toFixed(2) : '';
        const allAttributes = { ...segment };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        // For polylines, use first coordinate or centroid
        let lat = '';
        let lon = '';
        if (segment.geometry && segment.geometry.paths && segment.geometry.paths.length > 0) {
          const firstPath = segment.geometry.paths[0];
          if (firstPath && firstPath.length > 0) {
            lon = firstPath[0][0]?.toString() || '';
            lat = firstPath[0][1]?.toString() || '';
          }
        }
        const heightInfo = `Max: ${maxHeight}m, Mean: ${meanHeight}m`;
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(), 'Scotland',
          (location.confidence || 'N/A').toString(), 'SCOTLAND_TRUNK_ROAD_HEIGHT',
          heightInfo, lat, lon, distance,
          `Trunk Road Height Segment (${distance} miles)`,
          `${maxHeight}m max height`, '', '', attributesJson, 'Scotland Transport'
        ]);
      });
    } else if (key === 'miami_business_fd_inspected_all' && Array.isArray(value)) {
      value.forEach((business: any) => {
        // Deduplicate: use objectId or coordinates to track exported businesses
        const businessId = business.objectId ? String(business.objectId) : 
                        (business.geometry && typeof business.geometry.x === 'number' && typeof business.geometry.y === 'number') ?
                        `${business.geometry.x.toFixed(6)}_${business.geometry.y.toFixed(6)}` : null;
        if (businessId && exportedBusinessIds.has(businessId)) {
          return; // Skip - already exported from a previous result
        }
        if (businessId) exportedBusinessIds.add(businessId);
        
        const businessName = business.businessName || business.BusinessNa || business.business_name || 'Unknown Business';
        const businessAddress = business.businessAddress || business.BusinessAd || business.business_address || '';
        const city = business.city || business.City || '';
        const zipCode = business.zipCode || business.ZipCode || business.zip_code || '';
        const distance = business.distance_miles !== null && business.distance_miles !== undefined ? business.distance_miles.toFixed(2) : '';
        const allAttributes = { ...business };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        const lat = business.geometry?.y || business.lat || '';
        const lon = business.geometry?.x || business.lon || '';
        const addressLine = `${businessAddress}${city ? `, ${city}` : ''}${zipCode ? ` ${zipCode}` : ''}`;
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(), 'City of Miami',
          (location.confidence || 'N/A').toString(), 'MIAMI_BUSINESS_FD_INSPECTED',
          `🏢 ${businessName}`, lat, lon, distance,
          `Business Location (FD Inspected) (${distance} miles)`,
          addressLine || businessName, '', '', attributesJson, 'City of Miami'
        ]);
      });
    } else if (key === 'miami_public_schools_all' && Array.isArray(value)) {
      value.forEach((school: any) => {
        // Deduplicate: use objectId or coordinates to track exported schools
        const schoolId = school.objectId ? String(school.objectId) : 
                        (school.geometry && typeof school.geometry.x === 'number' && typeof school.geometry.y === 'number') ?
                        `${school.geometry.x.toFixed(6)}_${school.geometry.y.toFixed(6)}` : null;
        if (schoolId && exportedPublicSchoolIds.has(schoolId)) {
          return; // Skip - already exported from a previous result
        }
        if (schoolId) exportedPublicSchoolIds.add(schoolId);
        
        const name = school.name || school.NAME || school.Name || 'Unknown School';
        const address = school.address || school.ADDRESS || school.Address || '';
        const city = school.city || school.CITY || school.City || '';
        const zipCode = school.zipCode || school.ZIPCODE || school.zip_code || '';
        const phone = school.phone || school.PHONE || school.Phone || '';
        const distance = school.distance_miles !== null && school.distance_miles !== undefined ? school.distance_miles.toFixed(2) : '';
        const allAttributes = { ...school };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        const lat = school.geometry?.y || school.lat || '';
        const lon = school.geometry?.x || school.lon || '';
        const addressLine = `${address}${city ? `, ${city}` : ''}${zipCode ? ` ${zipCode}` : ''}`;
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(), 'City of Miami',
          (location.confidence || 'N/A').toString(), 'MIAMI_PUBLIC_SCHOOLS',
          `🎓 ${name}`, lat, lon, distance,
          `Public School (${distance} miles)`,
          addressLine || name, phone || '', '', attributesJson, 'City of Miami'
        ]);
      });
    } else if (key === 'miami_private_schools_all' && Array.isArray(value)) {
      value.forEach((school: any) => {
        // Deduplicate: use objectId or coordinates to track exported schools
        const schoolId = school.objectId ? String(school.objectId) : 
                        (school.geometry && typeof school.geometry.x === 'number' && typeof school.geometry.y === 'number') ?
                        `${school.geometry.x.toFixed(6)}_${school.geometry.y.toFixed(6)}` : null;
        if (schoolId && exportedPrivateSchoolIds.has(schoolId)) {
          return; // Skip - already exported from a previous result
        }
        if (schoolId) exportedPrivateSchoolIds.add(schoolId);
        
        const name = school.name || school.NAME || school.Name || 'Unknown School';
        const address = school.address || school.ADDRESS || school.Address || '';
        const city = school.city || school.CITY || school.City || '';
        const zipCode = school.zipCode || school.ZIPCODE || school.zip_code || '';
        const phone = school.phone || school.PHONE || school.Phone || '';
        const website = school.website || school.WEBSITE || school.Website || '';
        const distance = school.distance_miles !== null && school.distance_miles !== undefined ? school.distance_miles.toFixed(2) : '';
        const allAttributes = { ...school };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        const lat = school.geometry?.y || school.lat || '';
        const lon = school.geometry?.x || school.lon || '';
        const addressLine = `${address}${city ? `, ${city}` : ''}${zipCode ? ` ${zipCode}` : ''}`;
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(), 'City of Miami',
          (location.confidence || 'N/A').toString(), 'MIAMI_PRIVATE_SCHOOLS',
          `🏫 ${name}`, lat, lon, distance,
          `Private School (${distance} miles)`,
          addressLine || name, phone || '', website || '', attributesJson, 'City of Miami'
        ]);
      });
    } else if (key === 'fldot_bike_routes_all' && Array.isArray(value)) {
      value.forEach((route: any) => {
        // Deduplicate: use objectId to track exported routes
        const routeId = route.objectId ? String(route.objectId) : 
                       (route.attributes && route.attributes.OBJECTID_1) ? String(route.attributes.OBJECTID_1) :
                       (route.geometry && route.geometry.paths) ? 
                       `${JSON.stringify(route.geometry.paths).substring(0, 50)}` : null;
        if (routeId && exportedRouteIds.has(routeId)) {
          return; // Skip - already exported from a previous result
        }
        if (routeId) exportedRouteIds.add(routeId);
        
        const routeName = route.route || route.ROUTE || 'Unknown Route';
        const routeNum = route.routeNum !== null && route.routeNum !== undefined ? route.routeNum : route.ROUTENUM || null;
        const fname = route.fname || route.FNAME || '';
        const cntyname = route.cntyname || route.CNTYNAME || '';
        const fdotdist = route.fdotdist || route.FDOTDIST || '';
        const distance = route.distance_miles !== null && route.distance_miles !== undefined ? route.distance_miles.toFixed(2) : '';
        const allAttributes = { ...route };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        // Use center point for lat/lon if available, otherwise use first coordinate of first path
        let lat = route.lat || '';
        let lon = route.lon || '';
        if (!lat || !lon) {
          if (route.geometry && route.geometry.paths && Array.isArray(route.geometry.paths) && route.geometry.paths.length > 0) {
            const firstPath = route.geometry.paths[0];
            if (Array.isArray(firstPath) && firstPath.length > 0) {
              const firstCoord = firstPath[0];
              if (Array.isArray(firstCoord) && firstCoord.length >= 2) {
                lat = firstCoord[1];
                lon = firstCoord[0];
              }
            }
          }
        }
        const routeInfo = `${routeName}${routeNum !== null ? ` (Route ${routeNum})` : ''}${fname ? ` - ${fname}` : ''}`;
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(), 'FLDOT',
          (location.confidence || 'N/A').toString(), 'FLDOT_BIKE_ROUTES',
          `🚴 ${routeInfo}`, lat, lon, distance,
          `Bike Route (${distance} miles)`,
          `${fname || routeName}${cntyname ? `, ${cntyname} County` : ''}${fdotdist ? ` (${fdotdist})` : ''}`, '', '', attributesJson, 'FLDOT'
        ]);
      });
    } else if (key === 'fldot_real_time_traffic_all' && Array.isArray(value)) {
      value.forEach((point: any) => {
        // Deduplicate: use cosite to track exported traffic points
        const trafficId = point.cosite ? String(point.cosite) : 
                         (point.latitude && point.longitude) ?
                         `${point.latitude.toFixed(6)}_${point.longitude.toFixed(6)}` : null;
        if (trafficId && exportedTrafficIds.has(trafficId)) {
          return; // Skip - already exported from a previous result
        }
        if (trafficId) exportedTrafficIds.add(trafficId);
        
        const localName = point.localName || point.LOCALNAM || '';
        const countyName = point.countyName || point.COUNTYNM || '';
        const direction = point.direction || point.DIRECTION || '';
        const distance = point.distance_miles !== null && point.distance_miles !== undefined ? point.distance_miles.toFixed(2) : '';
        const allAttributes = { ...point };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        const lat = point.latitude || point.lat || (point.geometry && point.geometry.y) || '';
        const lon = point.longitude || point.lon || (point.geometry && point.geometry.x) || '';
        const roadInfo = `${localName}${direction ? ` (${direction})` : ''}${countyName ? `, ${countyName} County` : ''}`;
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(), 'FLDOT',
          (location.confidence || 'N/A').toString(), 'FLDOT_REAL_TIME_TRAFFIC',
          `🚦 ${roadInfo}`, lat, lon, distance,
          `Real-Time Traffic (${distance} miles)`,
          `${localName || 'Traffic Monitoring Point'}${direction ? ` - Direction: ${direction}` : ''}${countyName ? ` (${countyName} County)` : ''}`, '', '', attributesJson, 'FLDOT'
        ]);
      });
    } else if (key === 'fldot_facilities_all' && Array.isArray(value)) {
      value.forEach((facility: any) => {
        // Deduplicate: use FID to track exported facilities
        const facilityId = facility.fid !== null && facility.fid !== undefined ? String(facility.fid) : 
                          (facility.lat && facility.lon) ?
                          `${facility.lat.toFixed(6)}_${facility.lon.toFixed(6)}` : null;
        if (facilityId && exportedTrafficIds.has(facilityId)) {
          return; // Skip - already exported from a previous result
        }
        if (facilityId) exportedTrafficIds.add(facilityId);
        
        const facName = facility.facName || facility.Fac_Name || facility.FAC_NAME || '';
        const facType = facility.facType || facility.Fac_Type || facility.FAC_TYPE || '';
        const city = facility.city || facility.City || facility.CITY || '';
        const county = facility.county || facility.County || facility.COUNTY || '';
        const district = facility.district || facility.District || facility.DISTRICT || '';
        const phone = facility.phone || facility.Phone || facility.PHONE || '';
        const longAddress = facility.longAddress || facility.Long_Addre || facility.LONG_ADDRE || '';
        const distance = facility.distance_miles !== null && facility.distance_miles !== undefined ? facility.distance_miles.toFixed(2) : '';
        const allAttributes = { ...facility };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        const lat = facility.lat || (facility.geometry && facility.geometry.y) || '';
        const lon = facility.lon || (facility.geometry && facility.geometry.x) || '';
        const facilityInfo = `${facName}${facType ? ` (${facType})` : ''}${district ? ` - ${district}` : ''}`;
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(), 'FLDOT',
          (location.confidence || 'N/A').toString(), 'FLDOT_FACILITIES',
          `🏢 ${facilityInfo}`, lat, lon, distance,
          `FDOT Facility${facType ? ` - ${facType}` : ''} (${distance} miles)`,
          longAddress || `${city}${county ? `, ${county} County` : ''}`,
          phone || '',
          '',
          attributesJson, 'FLDOT'
        ]);
      });
    } else if (key === 'fldot_bike_slots_all' && Array.isArray(value)) {
      value.forEach((slot: any) => {
        // Deduplicate: use FID to track exported bike slots
        const slotId = slot.fid !== null && slot.fid !== undefined ? String(slot.fid) : null;
        if (slotId && exportedRouteIds.has(slotId)) {
          return; // Skip - already exported from a previous result
        }
        if (slotId) exportedRouteIds.add(slotId);
        
        const roadway = slot.roadway || slot.ROADWAY || '';
        const roadSide = slot.roadSide || slot.ROAD_SIDE || '';
        const county = slot.county || slot.COUNTY || '';
        const district = slot.district !== null && slot.district !== undefined ? String(slot.district) : '';
        const description = slot.description || slot.DESCR || '';
        const beginPost = slot.beginPost !== null && slot.beginPost !== undefined ? slot.beginPost.toFixed(3) : '';
        const endPost = slot.endPost !== null && slot.endPost !== undefined ? slot.endPost.toFixed(3) : '';
        const shapeLength = slot.shapeLength !== null && slot.shapeLength !== undefined ? slot.shapeLength.toFixed(2) : '';
        const distance = slot.distance_miles !== null && slot.distance_miles !== undefined ? slot.distance_miles.toFixed(2) : '';
        const allAttributes = { ...slot };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        const lat = slot.lat || '';
        const lon = slot.lon || '';
        const slotInfo = `Roadway ${roadway}${roadSide ? ` (${roadSide} side)` : ''}${county ? `, ${county} County` : ''}`;
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(), 'FLDOT',
          (location.confidence || 'N/A').toString(), 'FLDOT_BIKE_SLOTS',
          `🚴 ${slotInfo}`, lat, lon, distance,
          `Bike Slot${description ? ` - ${description}` : ''}${district ? ` (District ${district})` : ''} (${distance} miles)`,
          `${roadway ? `Roadway: ${roadway}` : ''}${beginPost ? `, Mile Post: ${beginPost}-${endPost}` : ''}${shapeLength ? `, Length: ${shapeLength}m` : ''}${district ? `, District: ${district}` : ''}`,
          '',
          '',
          attributesJson, 'FLDOT'
        ]);
      });
    } else if (key === 'fldot_bike_lanes_all' && Array.isArray(value)) {
      value.forEach((lane: any) => {
        // Deduplicate: use FID to track exported bike lanes
        const laneId = lane.fid !== null && lane.fid !== undefined ? String(lane.fid) : null;
        if (laneId && exportedRouteIds.has(laneId)) {
          return; // Skip - already exported from a previous result
        }
        if (laneId) exportedRouteIds.add(laneId);
        
        const roadway = lane.roadway || lane.ROADWAY || '';
        const roadSide = lane.roadSide || lane.ROAD_SIDE || '';
        const county = lane.county || lane.COUNTY || '';
        const district = lane.district !== null && lane.district !== undefined ? String(lane.district) : '';
        const description = lane.description || lane.DESCR || '';
        const beginPost = lane.beginPost !== null && lane.beginPost !== undefined ? lane.beginPost.toFixed(3) : '';
        const endPost = lane.endPost !== null && lane.endPost !== undefined ? lane.endPost.toFixed(3) : '';
        const shapeLength = lane.shapeLength !== null && lane.shapeLength !== undefined ? lane.shapeLength.toFixed(2) : '';
        const lncd = lane.lncd !== null && lane.lncd !== undefined ? String(lane.lncd) : '';
        const distance = lane.distance_miles !== null && lane.distance_miles !== undefined ? lane.distance_miles.toFixed(2) : '';
        const allAttributes = { ...lane };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        const lat = lane.lat || '';
        const lon = lane.lon || '';
        const laneInfo = `Roadway ${roadway}${roadSide ? ` (${roadSide} side)` : ''}${county ? `, ${county} County` : ''}`;
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(), 'FLDOT',
          (location.confidence || 'N/A').toString(), 'FLDOT_BIKE_LANES',
          `🚴 ${laneInfo}`, lat, lon, distance,
          `Bike Lane${description ? ` - ${description}` : ''}${district ? ` (District ${district})` : ''} (${distance} miles)`,
          `${roadway ? `Roadway: ${roadway}` : ''}${beginPost ? `, Mile Post: ${beginPost}-${endPost}` : ''}${shapeLength ? `, Length: ${shapeLength}m` : ''}${district ? `, District: ${district}` : ''}${lncd ? `, Lane Code: ${lncd}` : ''}`,
          '',
          '',
          attributesJson, 'FLDOT'
        ]);
      });
    } else if (key === 'fldot_railroad_crossings_all' && Array.isArray(value)) {
      value.forEach((crossing: any) => {
        // Deduplicate: use crossing number to track exported crossings
        const crossingId = crossing.crossingNumber ? String(crossing.crossingNumber) : 
                          (crossing.fid !== null && crossing.fid !== undefined) ? String(crossing.fid) :
                          (crossing.lat && crossing.lon) ?
                          `${crossing.lat.toFixed(6)}_${crossing.lon.toFixed(6)}` : null;
        if (crossingId && exportedTrafficIds.has(crossingId)) {
          return; // Skip - already exported from a previous result
        }
        if (crossingId) exportedTrafficIds.add(crossingId);
        
        const roadway = crossing.roadway || crossing.ROADWAY || '';
        const crossingNumber = crossing.crossingNumber || crossing.CROSSING_N || '';
        const checkDigit = crossing.checkDigit || crossing.CHECK_DIGI || '';
        const county = crossing.county || crossing.COUNTY || '';
        const district = crossing.district !== null && crossing.district !== undefined ? String(crossing.district) : '';
        const beginPost = crossing.beginPost !== null && crossing.beginPost !== undefined ? crossing.beginPost.toFixed(3) : '';
        const distance = crossing.distance_miles !== null && crossing.distance_miles !== undefined ? crossing.distance_miles.toFixed(2) : '';
        const allAttributes = { ...crossing };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        const lat = crossing.lat || (crossing.geometry && crossing.geometry.y) || '';
        const lon = crossing.lon || (crossing.geometry && crossing.geometry.x) || '';
        const crossingInfo = `Crossing ${crossingNumber}${roadway ? ` - Roadway: ${roadway}` : ''}${county ? `, ${county} County` : ''}`;
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(), 'FLDOT',
          (location.confidence || 'N/A').toString(), 'FLDOT_RAILROAD_CROSSINGS',
          `🚂 ${crossingInfo}`, lat, lon, distance,
          `Railroad Crossing${district ? ` (District ${district})` : ''} (${distance} miles)`,
          `${crossingNumber ? `Crossing Number: ${crossingNumber}${checkDigit ? ` (Check Digit: ${checkDigit})` : ''}` : ''}${roadway ? `${crossingNumber ? ', ' : ''}Roadway: ${roadway}` : ''}${beginPost ? `${roadway || crossingNumber ? ', ' : ''}Mile Post: ${beginPost}` : ''}${district ? `${roadway || crossingNumber || beginPost ? ', ' : ''}District: ${district}` : ''}`,
          '',
          '',
          attributesJson, 'FLDOT'
        ]);
      });
    } else if (key === 'fldot_number_of_lanes_all' && Array.isArray(value)) {
      value.forEach((lane: any) => {
        // Deduplicate: use FID to track exported segments
        const laneId = (lane.fid !== null && lane.fid !== undefined) ? String(lane.fid) :
                      (lane.lat && lane.lon) ?
                      `${lane.lat.toFixed(6)}_${lane.lon.toFixed(6)}` : null;
        if (laneId && exportedRouteIds.has(laneId)) {
          return; // Skip - already exported from a previous result
        }
        if (laneId) exportedRouteIds.add(laneId);
        
        const roadway = lane.roadway || lane.ROADWAY || '';
        const roadSide = lane.roadSide || lane.ROAD_SIDE || '';
        const laneCount = lane.laneCount !== null && lane.laneCount !== undefined ? String(lane.laneCount) : '';
        const county = lane.county || lane.COUNTY || '';
        const district = lane.district !== null && lane.district !== undefined ? String(lane.district) : '';
        const beginPost = lane.beginPost !== null && lane.beginPost !== undefined ? lane.beginPost.toFixed(3) : '';
        const endPost = lane.endPost !== null && lane.endPost !== undefined ? lane.endPost.toFixed(3) : '';
        const shapeLength = lane.shapeLength !== null && lane.shapeLength !== undefined ? lane.shapeLength.toFixed(2) : '';
        const distance = lane.distance_miles !== null && lane.distance_miles !== undefined ? lane.distance_miles.toFixed(2) : '';
        const allAttributes = { ...lane };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        const lat = lane.lat || (lane.geometry && lane.geometry.paths && lane.geometry.paths[0] && lane.geometry.paths[0][0] && lane.geometry.paths[0][0][1]) || '';
        const lon = lane.lon || (lane.geometry && lane.geometry.paths && lane.geometry.paths[0] && lane.geometry.paths[0][0] && lane.geometry.paths[0][0][0]) || '';
        const laneInfo = `${laneCount} lane${laneCount && laneCount !== '1' ? 's' : ''}${roadway ? ` - Roadway: ${roadway}` : ''}${county ? `, ${county} County` : ''}`;
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(), 'FLDOT',
          (location.confidence || 'N/A').toString(), 'FLDOT_NUMBER_OF_LANES',
          `🛣️ ${laneInfo}`, lat, lon, distance,
          `Number of Lanes${laneCount ? `: ${laneCount} lane${laneCount !== '1' ? 's' : ''}` : ''}${district ? ` (District ${district})` : ''} (${distance} miles)`,
          `${roadway ? `Roadway: ${roadway}` : ''}${roadSide ? `${roadway ? ', ' : ''}Road Side: ${roadSide}` : ''}${beginPost && endPost ? `${roadway || roadSide ? ', ' : ''}Mile Post: ${beginPost}-${endPost}` : ''}${shapeLength ? `${roadway || roadSide || (beginPost && endPost) ? ', ' : ''}Length: ${shapeLength}m` : ''}${district ? `${roadway || roadSide || (beginPost && endPost) || shapeLength ? ', ' : ''}District: ${district}` : ''}`,
          '',
          '',
          attributesJson, 'FLDOT'
        ]);
      });
    } else if (key === 'fldot_rest_areas_all' && Array.isArray(value)) {
      value.forEach((restArea: any) => {
        // Deduplicate: use FID to track exported rest areas
        const restAreaId = (restArea.fid !== null && restArea.fid !== undefined) ? String(restArea.fid) :
                          (restArea.lat && restArea.lon) ?
                          `${restArea.lat.toFixed(6)}_${restArea.lon.toFixed(6)}` : null;
        if (restAreaId && exportedTrafficIds.has(restAreaId)) {
          return; // Skip - already exported from a previous result
        }
        if (restAreaId) exportedTrafficIds.add(restAreaId);
        
        const roadway = restArea.roadway || restArea.ROADWAY || '';
        const type = restArea.type || restArea.TYPE_ || '';
        const direction = restArea.direction || restArea.DIR || '';
        const county = restArea.county || restArea.COUNTY || '';
        const district = restArea.district !== null && restArea.district !== undefined ? String(restArea.district) : '';
        const beginPost = restArea.beginPost !== null && restArea.beginPost !== undefined ? restArea.beginPost.toFixed(3) : '';
        const numFacilities = restArea.numFacilities !== null && restArea.numFacilities !== undefined ? String(restArea.numFacilities) : '';
        const distance = restArea.distance_miles !== null && restArea.distance_miles !== undefined ? restArea.distance_miles.toFixed(2) : '';
        const allAttributes = { ...restArea };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        const lat = restArea.lat || (restArea.geometry && restArea.geometry.y) || '';
        const lon = restArea.lon || (restArea.geometry && restArea.geometry.x) || '';
        let typeLabel = type;
        if (type === 'RSTAREAS') typeLabel = 'Rest Areas';
        else if (type === 'RSTARFAC') typeLabel = 'Rest Area Facilities';
        else if (type === 'WAYSDPKS') typeLabel = 'Wayside Parks';
        else if (type === 'WEIGHSTA') typeLabel = 'Weigh Stations';
        else if (type === 'WELCMSTA') typeLabel = 'Welcome Stations';
        const restAreaInfo = `${typeLabel || 'Rest Area/Welcome Center'}${roadway ? ` - Roadway: ${roadway}` : ''}${county ? `, ${county} County` : ''}`;
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(), 'FLDOT',
          (location.confidence || 'N/A').toString(), 'FLDOT_REST_AREAS',
          `🚻 ${restAreaInfo}`, lat, lon, distance,
          `${typeLabel || 'Rest Area/Welcome Center'}${district ? ` (District ${district})` : ''} (${distance} miles)`,
          `${roadway ? `Roadway: ${roadway}` : ''}${direction ? `${roadway ? ', ' : ''}Direction: ${direction}` : ''}${beginPost ? `${roadway || direction ? ', ' : ''}Mile Post: ${beginPost}` : ''}${numFacilities ? `${roadway || direction || beginPost ? ', ' : ''}Number of Facilities: ${numFacilities}` : ''}${district ? `${roadway || direction || beginPost || numFacilities ? ', ' : ''}District: ${district}` : ''}`,
          '',
          '',
          attributesJson, 'FLDOT'
        ]);
      });
    } else if (key === 'fldot_functional_classification_all' && Array.isArray(value)) {
      value.forEach((feature: any) => {
        // Deduplicate: use objectId/FID to track exported segments
        const featureId = (feature.objectId !== null && feature.objectId !== undefined) ? String(feature.objectId) :
                         (feature.FID !== null && feature.FID !== undefined) ? String(feature.FID) :
                         (feature.lat && feature.lon) ?
                         `${feature.lat.toFixed(6)}_${feature.lon.toFixed(6)}` : null;
        if (featureId && exportedRouteIds.has(featureId)) {
          return; // Skip - already exported from a previous result
        }
        if (featureId) exportedRouteIds.add(featureId);

        const roadway = feature.roadway || feature.ROADWAY || '';
        const funclass = feature.funclass || feature.FUNCLASS || '';
        const county = feature.county || feature.COUNTY || '';
        const district = feature.district !== null && feature.district !== undefined ? String(feature.district) : '';
        const countydot = feature.countydot !== null && feature.countydot !== undefined ? String(feature.countydot) : '';
        const mngDist = feature.mngDist !== null && feature.mngDist !== undefined ? String(feature.mngDist) : '';
        const beginPost = feature.beginPost !== null && feature.beginPost !== undefined ? feature.beginPost.toFixed(3) : '';
        const endPost = feature.endPost !== null && feature.endPost !== undefined ? feature.endPost.toFixed(3) : '';
        const shapeLength = feature.shapeLength !== null && feature.shapeLength !== undefined ? feature.shapeLength.toFixed(2) : '';
        const distance = feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : '';
        const allAttributes = { ...feature };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        const lat = feature.lat || (feature.geometry && feature.geometry.paths && feature.geometry.paths[0] && feature.geometry.paths[0][0] && feature.geometry.paths[0][0][1]) || '';
        const lon = feature.lon || (feature.geometry && feature.geometry.paths && feature.geometry.paths[0] && feature.geometry.paths[0][0] && feature.geometry.paths[0][0][0]) || '';
        const featureInfo = `FUNCLASS ${funclass || 'Unknown'}${roadway ? ` - Roadway: ${roadway}` : ''}${county ? `, ${county} County` : ''}`;
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(), 'FLDOT',
          (location.confidence || 'N/A').toString(), 'FLDOT_FUNCTIONAL_CLASSIFICATION',
          `🛣️ ${featureInfo}`, lat, lon, distance,
          `Functional Classification${funclass ? `: FUNCLASS ${funclass}` : ''}${district ? ` (District ${district})` : ''} (${distance} miles)`,
          `${roadway ? `Roadway: ${roadway}` : ''}${funclass ? `${roadway ? ', ' : ''}Functional Class: ${funclass}` : ''}${beginPost && endPost ? `${roadway || funclass ? ', ' : ''}Mile Post: ${beginPost}-${endPost}` : ''}${shapeLength ? `${roadway || funclass || (beginPost && endPost) ? ', ' : ''}Length: ${shapeLength}m` : ''}${district ? `${roadway || funclass || (beginPost && endPost) || shapeLength ? ', ' : ''}District: ${district}` : ''}${county ? `${roadway || funclass || (beginPost && endPost) || shapeLength || district ? ', ' : ''}County: ${county}` : ''}`,
          '',
          '',
          attributesJson, 'FLDOT'
        ]);
      });
    } else if (key === 'miami_water_bodies_all' && Array.isArray(value)) {
      value.forEach((waterBody: any) => {
        const type = waterBody.type || waterBody.TYPE || waterBody.Type || 'Water Body';
        const shapeArea = waterBody.shapeArea !== null && waterBody.shapeArea !== undefined ? waterBody.shapeArea : null;
        const isContaining = waterBody.isContaining || false;
        const distance = waterBody.distance_miles !== null && waterBody.distance_miles !== undefined ? waterBody.distance_miles.toFixed(2) : '';
        const allAttributes = { ...waterBody };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        // For polygons, use centroid or first coordinate
        let lat = '';
        let lon = '';
        if (waterBody.geometry && waterBody.geometry.rings && waterBody.geometry.rings.length > 0) {
          const firstRing = waterBody.geometry.rings[0];
          if (firstRing && firstRing.length > 0) {
            lon = firstRing[0][0]?.toString() || '';
            lat = firstRing[0][1]?.toString() || '';
          }
        }
        const waterBodyInfo = `${type}${shapeArea !== null ? ` - Area: ${shapeArea.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : ''}${isContaining ? ' (Containing)' : ''}`;
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(), 'City of Miami',
          (location.confidence || 'N/A').toString(), 'MIAMI_WATER_BODIES',
          `💧 ${waterBodyInfo}`, lat || location.lat.toString(), lon || location.lon.toString(), distance,
          `Water Body (${isContaining ? 'containing' : distance + ' miles'})`,
          type, '', '', attributesJson, 'City of Miami'
        ]);
      });
    } else if (key === 'wy_bighorn_sheep_crucial_range_all' && Array.isArray(value)) {
      value.forEach((range: any) => {
        // Deduplicate: use OBJECTID to track exported ranges (lat/lon not included to prevent point markers)
        const rangeId = (range.objectId !== null && range.objectId !== undefined) ? String(range.objectId) :
                       (range.OBJECTID !== null && range.OBJECTID !== undefined) ? String(range.OBJECTID) : null;
        if (rangeId && exportedRouteIds.has(rangeId)) {
          return; // Skip - already exported from a previous result
        }
        if (rangeId) exportedRouteIds.add(rangeId);

        const species = range.species || range.SPECIES || '';
        const rangeType = range.range || range.RANGE || '';
        const acres = range.acres !== null && range.acres !== undefined ? range.acres : range.Acres;
        const sqMiles = range.sqMiles !== null && range.sqMiles !== undefined ? range.sqMiles : range.SQMiles;
        const isContaining = range.isContaining || false;
        const distance = range.distance_miles !== null && range.distance_miles !== undefined ? range.distance_miles.toFixed(2) : '';
        const allAttributes = { ...range };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        // For polygons, calculate centroid from geometry (lat/lon not included in output to prevent point markers)
        let lat = '';
        let lon = '';
        if (range.geometry && range.geometry.rings && range.geometry.rings.length > 0) {
          const firstRing = range.geometry.rings[0];
          if (firstRing && firstRing.length > 0) {
            // Calculate centroid from polygon rings
            let sumLat = 0;
            let sumLon = 0;
            let count = 0;
            firstRing.forEach((coord: number[]) => {
              if (coord && coord.length >= 2) {
                sumLon += coord[0]; // ESRI geometry: [lon, lat] = [x, y]
                sumLat += coord[1];
                count++;
              }
            });
            if (count > 0) {
              lon = (sumLon / count).toString();
              lat = (sumLat / count).toString();
            } else {
              // Fallback to first coordinate if calculation fails
              lon = firstRing[0][0]?.toString() || '';
              lat = firstRing[0][1]?.toString() || '';
            }
          }
        }
        const rangeInfo = `${species ? `${species} ` : ''}${rangeType || 'Crucial Range'}${acres !== null && acres !== undefined ? ` - ${acres.toLocaleString(undefined, { maximumFractionDigits: 2 })} acres` : ''}${isContaining ? ' (Containing)' : ''}`;
        rows.push([
          location.name, location.lat.toString(), location.lon.toString(), 'Wyoming Geospatial Hub',
          (location.confidence || 'N/A').toString(), 'WY_BIGHORN_SHEEP_CRUCIAL_RANGE',
          `🐑 ${rangeInfo}`, lat || location.lat.toString(), lon || location.lon.toString(), distance,
          `Bighorn Sheep Crucial Range${rangeType ? `: ${rangeType}` : ''} (${isContaining ? 'containing' : distance + ' miles'})`,
          `${species ? `Species: ${species}` : ''}${rangeType ? `${species ? ', ' : ''}Range Type: ${rangeType}` : ''}${acres !== null && acres !== undefined ? `${species || rangeType ? ', ' : ''}Acres: ${acres.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : ''}${sqMiles !== null && sqMiles !== undefined ? `${species || rangeType || acres !== null ? ', ' : ''}Square Miles: ${sqMiles.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : ''}`,
          '',
          '',
          attributesJson, 'Wyoming Geospatial Hub'
        ]);
      });
    } else if (key === 'nyc_bike_routes_all' && Array.isArray(value)) {
      value.forEach((route: any) => {
        const routeName = route.name || route.NAME || route.Name || route.ROUTE_NAME || route.route_name || 'Unknown Route';
        const routeType = route.routeType || route.ROUTE_TYPE || route.route_type || route.TYPE || route.type || '';
        const distance = route.distance_miles !== null && route.distance_miles !== undefined ? route.distance_miles.toFixed(2) : '';

        const allAttributes = { ...route };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.routeId;
        delete allAttributes.ROUTE_ID;
        delete allAttributes.route_id;
        delete allAttributes.name;
        delete allAttributes.NAME;
        delete allAttributes.Name;
        delete allAttributes.ROUTE_NAME;
        delete allAttributes.route_name;
        delete allAttributes.routeType;
        delete allAttributes.ROUTE_TYPE;
        delete allAttributes.route_type;
        delete allAttributes.TYPE;
        delete allAttributes.type;
        delete allAttributes.status;
        delete allAttributes.STATUS;
        delete allAttributes.Status;
        const attributesJson = JSON.stringify(allAttributes);

        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'New York City',
          (location.confidence || 'N/A').toString(),
          'NYC_BIKE_ROUTE',
          `${routeName}${routeType ? ` - ${routeType}` : ''}`,
          '', // Lat (polyline, no single point)
          '', // Lon (polyline, no single point)
          distance,
          'Bike Route',
          routeName,
          '', // Owner
          '', // Phone
          attributesJson,
          'NYC Department of Transportation'
        ]);
      });
    } else if (key === 'nyc_neighborhoods_all' && Array.isArray(value)) {
      value.forEach((neighborhood: any) => {
        const ntaName = neighborhood.ntaName || neighborhood.NTAName || neighborhood.NTA_NAME || neighborhood.nta_name || neighborhood.Name || neighborhood.name || 'Unknown Neighborhood';
        const ntaCode = neighborhood.ntaCode || neighborhood.NTACode || neighborhood.NTA_CODE || neighborhood.nta_code || '';
        const distance = neighborhood.distance_miles !== null && neighborhood.distance_miles !== undefined ? neighborhood.distance_miles.toFixed(2) : (neighborhood.isContaining ? '0.00' : '');

        const allAttributes = { ...neighborhood };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.neighborhoodId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.ntaCode;
        delete allAttributes.NTACode;
        delete allAttributes.NTA_CODE;
        delete allAttributes.nta_code;
        delete allAttributes.ntaName;
        delete allAttributes.NTAName;
        delete allAttributes.NTA_NAME;
        delete allAttributes.nta_name;
        delete allAttributes.Name;
        delete allAttributes.name;
        delete allAttributes.borough;
        delete allAttributes.Borough;
        delete allAttributes.BOROUGH;
        const attributesJson = JSON.stringify(allAttributes);

        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'New York City',
          (location.confidence || 'N/A').toString(),
          'NYC_NEIGHBORHOOD',
          `${ntaName}${ntaCode ? ` (${ntaCode})` : ''}`,
          '', // Lat (polygon, no single point)
          '', // Lon (polygon, no single point)
          distance,
          neighborhood.isContaining ? 'Within Neighborhood' : `Nearby Neighborhood (${distance} miles)`,
          ntaName,
          '', // Owner
          '', // Phone
          attributesJson,
          'NYC Department of City Planning'
        ]);
      });
    } else if (key === 'nyc_zoning_districts_all' && Array.isArray(value)) {
      value.forEach((district: any) => {
        const zoneDistrict = district.zoneDistrict || district.ZONEDIST || district.zonedist || 'Unknown';
        const zoneSubdistrict = district.zoneSubdistrict || district.ZONESUBDIST || district.zonesubdist || '';
        const distance = district.distance_miles !== null && district.distance_miles !== undefined ? district.distance_miles.toFixed(2) : (district.isContaining ? '0.00' : '');

        const allAttributes = { ...district };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.districtId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.zoneDistrict;
        delete allAttributes.ZONEDIST;
        delete allAttributes.zonedist;
        delete allAttributes.ZoneDist;
        delete allAttributes.ZONE_DIST;
        delete allAttributes.zoneSubdistrict;
        delete allAttributes.ZONESUBDIST;
        delete allAttributes.zonesubdist;
        delete allAttributes.ZoneSubdist;
        delete allAttributes.ZONE_SUBDIST;
        const attributesJson = JSON.stringify(allAttributes);

        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'New York City',
          (location.confidence || 'N/A').toString(),
          'NYC_ZONING_DISTRICT',
          `${zoneDistrict}${zoneSubdistrict ? ` - ${zoneSubdistrict}` : ''}`,
          '', // Lat (polygon, no single point)
          '', // Lon (polygon, no single point)
          distance,
          district.isContaining ? 'Within Zoning District' : `Nearby Zoning District (${distance} miles)`,
          zoneDistrict,
          '', // Owner
          '', // Phone
          attributesJson,
          'NYC Department of City Planning'
        ]);
      });
    } else if (key === 'nyc_waterfront_hpb_launch_site_all' && Array.isArray(value)) {
      value.forEach((site: any) => {
        const name = site.name || site.NAME || site.Name || site.SITE_NAME || site.site_name || 'Unknown Launch Site';
        const distance = site.distance_miles !== null && site.distance_miles !== undefined ? site.distance_miles.toFixed(2) : '';
        const lat = site.geometry?.y || '';
        const lon = site.geometry?.x || '';

        const allAttributes = { ...site };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.featureId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.name;
        delete allAttributes.NAME;
        delete allAttributes.Name;
        delete allAttributes.SITE_NAME;
        delete allAttributes.site_name;
        delete allAttributes.type;
        delete allAttributes.TYPE;
        delete allAttributes.Type;
        delete allAttributes.layerId;
        delete allAttributes.isContaining;
        const attributesJson = JSON.stringify(allAttributes);

        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'New York City',
          (location.confidence || 'N/A').toString(),
          'NYC_HPB_LAUNCH_SITE',
          name,
          lat.toString(),
          lon.toString(),
          distance,
          'HPB Launch Site',
          name,
          '', // Owner
          '', // Phone
          attributesJson,
          'NYC Department of City Planning'
        ]);
      });
    } else if (key === 'nyc_waterfront_parks_all' && Array.isArray(value)) {
      value.forEach((park: any) => {
        const name = park.name || park.NAME || park.Name || park.PARK_NAME || park.park_name || 'Unknown Park';
        const distance = park.distance_miles !== null && park.distance_miles !== undefined ? park.distance_miles.toFixed(2) : (park.isContaining ? '0.00' : '');

        const allAttributes = { ...park };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.featureId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.name;
        delete allAttributes.NAME;
        delete allAttributes.Name;
        delete allAttributes.PARK_NAME;
        delete allAttributes.park_name;
        delete allAttributes.type;
        delete allAttributes.TYPE;
        delete allAttributes.Type;
        delete allAttributes.layerId;
        const attributesJson = JSON.stringify(allAttributes);

        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'New York City',
          (location.confidence || 'N/A').toString(),
          'NYC_WATERFRONT_PARK',
          name,
          '', // Lat (polygon, no single point)
          '', // Lon (polygon, no single point)
          distance,
          park.isContaining ? 'Within Waterfront Park' : `Nearby Waterfront Park (${distance} miles)`,
          name,
          '', // Owner
          '', // Phone
          attributesJson,
          'NYC Department of City Planning'
        ]);
      });
    } else if (key === 'nyc_waterfront_paws_all' && Array.isArray(value)) {
      value.forEach((paws: any) => {
        const name = paws.name || paws.NAME || paws.Name || paws.SITE_NAME || paws.site_name || 'Unknown PAWS';
        const distance = paws.distance_miles !== null && paws.distance_miles !== undefined ? paws.distance_miles.toFixed(2) : (paws.isContaining ? '0.00' : '');

        const allAttributes = { ...paws };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.featureId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.name;
        delete allAttributes.NAME;
        delete allAttributes.Name;
        delete allAttributes.SITE_NAME;
        delete allAttributes.site_name;
        delete allAttributes.type;
        delete allAttributes.TYPE;
        delete allAttributes.Type;
        delete allAttributes.layerId;
        const attributesJson = JSON.stringify(allAttributes);

        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'New York City',
          (location.confidence || 'N/A').toString(),
          'NYC_PAWS',
          name,
          '', // Lat (polygon, no single point)
          '', // Lon (polygon, no single point)
          distance,
          paws.isContaining ? 'Within PAWS' : `Nearby PAWS (${distance} miles)`,
          name,
          '', // Owner
          '', // Phone
          attributesJson,
          'NYC Department of City Planning'
        ]);
      });
    } else if (key === 'nyc_business_improvement_districts_all' && Array.isArray(value)) {
      value.forEach((bid: any) => {
        const name = bid.name || bid.bid_name || bid.bidName || bid.BID_NAME || bid.NAME || bid.Name || 'Unknown BID';
        const distance = bid.distance_miles !== null && bid.distance_miles !== undefined ? bid.distance_miles.toFixed(2) : (bid.isContaining ? '0.00' : '');
        const lat = bid.latitude || bid.lat || bid.LATITUDE || bid.LAT || '';
        const lon = bid.longitude || bid.lon || bid.LONGITUDE || bid.LON || bid.lng || bid.LNG || '';

        const allAttributes = { ...bid };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.districtId;
        delete allAttributes.bid_id;
        delete allAttributes.bidId;
        delete allAttributes.BID_ID;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.name;
        delete allAttributes.bid_name;
        delete allAttributes.bidName;
        delete allAttributes.BID_NAME;
        delete allAttributes.NAME;
        delete allAttributes.Name;
        delete allAttributes.borough;
        delete allAttributes.Borough;
        delete allAttributes.BOROUGH;
        delete allAttributes.latitude;
        delete allAttributes.lat;
        delete allAttributes.LATITUDE;
        delete allAttributes.LAT;
        delete allAttributes.longitude;
        delete allAttributes.lon;
        delete allAttributes.LONGITUDE;
        delete allAttributes.LON;
        delete allAttributes.lng;
        delete allAttributes.LNG;
        delete allAttributes.__calculatedDistance;
        const attributesJson = JSON.stringify(allAttributes);

        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'New York City',
          (location.confidence || 'N/A').toString(),
          'NYC_BUSINESS_IMPROVEMENT_DISTRICT',
          name,
          lat.toString() || '', // Lat (may be point or polygon)
          lon.toString() || '', // Lon (may be point or polygon)
          distance,
          bid.isContaining ? 'Within Business Improvement District' : `Nearby Business Improvement District (${distance} miles)`,
          name,
          '', // Owner
          '', // Phone
          attributesJson,
          'NYC Department of Small Business Services'
        ]);
      });
    } else if (key === 'nyc_community_districts_all' && Array.isArray(value)) {
      value.forEach((district: any) => {
        const boroCD = district.boroCD || district.BoroCD || district.BOROCD || district.districtId || 'Unknown';
        const distance = district.distance_miles !== null && district.distance_miles !== undefined ? district.distance_miles.toFixed(2) : (district.isContaining ? '0.00' : '');
        const lat = district.latitude || district.lat || district.LATITUDE || district.LAT || '';
        const lon = district.longitude || district.lon || district.LONGITUDE || district.LON || district.lng || district.LNG || '';

        const allAttributes = { ...district };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.districtId;
        delete allAttributes.boroCD;
        delete allAttributes.BoroCD;
        delete allAttributes.BOROCD;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.latitude;
        delete allAttributes.lat;
        delete allAttributes.LATITUDE;
        delete allAttributes.LAT;
        delete allAttributes.longitude;
        delete allAttributes.lon;
        delete allAttributes.LONGITUDE;
        delete allAttributes.LON;
        delete allAttributes.lng;
        delete allAttributes.LNG;
        delete allAttributes.__calculatedDistance;
        const attributesJson = JSON.stringify(allAttributes);

        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'New York City',
          (location.confidence || 'N/A').toString(),
          'NYC_COMMUNITY_DISTRICT',
          boroCD,
          lat.toString() || '', // Lat (may be point or polygon)
          lon.toString() || '', // Lon (may be point or polygon)
          distance,
          district.isContaining ? 'Within Community District' : `Nearby Community District (${distance} miles)`,
          boroCD,
          '', // Owner
          '', // Phone
          attributesJson,
          'NYC Department of City Planning'
        ]);
      });
    } else if (key === 'houston_neighborhoods_all' && Array.isArray(value)) {
      value.forEach((neighborhood: any) => {
        const nameLabel = neighborhood.nameLabel || neighborhood.NAME_LABEL || neighborhood.name_label || '';
        const nname = neighborhood.nname || neighborhood.NNAME || '';
        const name1 = neighborhood.name1 || neighborhood.NAME_1 || '';
        const name2 = neighborhood.name2 || neighborhood.NAME_2 || '';
        const displayName = nameLabel || nname || name1 || name2 || 'Unknown Neighborhood';
        const codeNum = neighborhood.codeNum !== null && neighborhood.codeNum !== undefined ? neighborhood.codeNum.toString() : (neighborhood.CODE_NUM !== null && neighborhood.CODE_NUM !== undefined ? neighborhood.CODE_NUM.toString() : '');
        const comment = neighborhood.comment || neighborhood.COMMENT || '';
        const distance = neighborhood.distance_miles !== null && neighborhood.distance_miles !== undefined ? neighborhood.distance_miles.toFixed(2) : (neighborhood.isContaining ? '0.00' : '');
        const isContaining = neighborhood.isContaining ? 'Yes' : 'No';
        const lat = neighborhood.latitude || neighborhood.lat || neighborhood.LATITUDE || neighborhood.LAT || '';
        const lon = neighborhood.longitude || neighborhood.lon || neighborhood.LONGITUDE || neighborhood.LON || neighborhood.lng || neighborhood.LNG || '';

        const allAttributes = { ...neighborhood };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.nname;
        delete allAttributes.NNAME;
        delete allAttributes.nameLabel;
        delete allAttributes.NAME_LABEL;
        delete allAttributes.name_label;
        delete allAttributes.name1;
        delete allAttributes.NAME_1;
        delete allAttributes.name_1;
        delete allAttributes.name2;
        delete allAttributes.NAME_2;
        delete allAttributes.name_2;
        delete allAttributes.codeNum;
        delete allAttributes.CODE_NUM;
        delete allAttributes.code_num;
        delete allAttributes.comment;
        delete allAttributes.COMMENT;
        delete allAttributes.latitude;
        delete allAttributes.lat;
        delete allAttributes.LATITUDE;
        delete allAttributes.LAT;
        delete allAttributes.longitude;
        delete allAttributes.lon;
        delete allAttributes.LONGITUDE;
        delete allAttributes.LON;
        delete allAttributes.lng;
        delete allAttributes.LNG;
        delete allAttributes.__calculatedDistance;
        const attributesJson = JSON.stringify(allAttributes);

        rows.push([
          'HoustonCO Neighborhoods',
          displayName,
          codeNum || 'N/A',
          comment || 'N/A',
          distance || '0.00',
          isContaining,
          lat || '',
          lon || '',
          attributesJson,
          'City of Houston'
        ]);
      });
    } else if (key === 'houston_neighborhoods_2021_all' && Array.isArray(value)) {
      value.forEach((neighborhood: any) => {
        const objName = neighborhood.objName || neighborhood.OBJ_NAME || '';
        const objTyp = neighborhood.objTyp || neighborhood.OBJ_TYP || '';
        const objSubtcd = neighborhood.objSubtcd || neighborhood.OBJ_SUBTCD || '';
        const objSubtyp = neighborhood.objSubtyp || neighborhood.OBJ_SUBTYP || '';
        const country = neighborhood.country || neighborhood.COUNTRY || '';
        const metro = neighborhood.metro || neighborhood.METRO || '';
        const reldate = neighborhood.reldate || neighborhood.RELDATE || '';
        const objArea = neighborhood.objArea !== null && neighborhood.objArea !== undefined ? neighborhood.objArea.toString() : '';
        const distance = neighborhood.distance_miles !== null && neighborhood.distance_miles !== undefined ? neighborhood.distance_miles.toFixed(2) : '';
        const isContaining = neighborhood.isContaining ? 'Yes' : 'No';
        const allAttributes = { ...neighborhood };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.objectId;
        delete allAttributes.objName;
        delete allAttributes.OBJ_NAME;
        delete allAttributes.objTyp;
        delete allAttributes.OBJ_TYP;
        delete allAttributes.objSubtcd;
        delete allAttributes.OBJ_SUBTCD;
        delete allAttributes.objSubtyp;
        delete allAttributes.OBJ_SUBTYP;
        delete allAttributes.country;
        delete allAttributes.COUNTRY;
        delete allAttributes.metro;
        delete allAttributes.METRO;
        delete allAttributes.lat;
        delete allAttributes.LAT;
        delete allAttributes.lon;
        delete allAttributes.LON;
        delete allAttributes.reldate;
        delete allAttributes.RELDATE;
        delete allAttributes.objArea;
        delete allAttributes.OBJ_AREA;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          'Houston Neighborhoods',
          objName || 'N/A',
          objTyp || 'N/A',
          objSubtcd || 'N/A',
          objSubtyp || 'N/A',
          country || 'N/A',
          metro || 'N/A',
          reldate || 'N/A',
          objArea || 'N/A',
          distance || '0.00',
          isContaining,
          '', // Address
          '', // Phone
          attributesJson,
          'City of Houston'
        ]);
      });
    } else if (key === 'houston_site_addresses_all' && Array.isArray(value)) {
      value.forEach((address: any) => {
        const fulladdr = address.fulladdr || address.FULLADDR || '';
        const addrnum = address.addrnum || address.ADDRNUM || '';
        const roadname = address.roadname || address.ROADNAME || '';
        const roadtype = address.roadtype || address.ROADTYPE || '';
        const unitid = address.unitid || address.UNITID || '';
        const unittype = address.unittype || address.UNITTYPE || '';
        const municipality = address.municipality || address.MUNICIPALITY || '';
        const zipcode = address.zipcode || address.ZIPCODE || '';
        const county = address.county || address.COUNTY || '';
        const addrtype = address.addrtype || address.ADDRTYPE || '';
        const status = address.status || address.STATUS || '';
        const source = address.source || address.SOURCE || '';
        const siteaddid = address.siteaddid !== null && address.siteaddid !== undefined ? address.siteaddid.toString() : '';
        const distance = address.distance_miles !== null && address.distance_miles !== undefined ? address.distance_miles.toFixed(2) : '';
        const allAttributes = { ...address };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.objectId;
        delete allAttributes.siteaddid;
        delete allAttributes.fulladdr;
        delete allAttributes.FULLADDR;
        delete allAttributes.addrnum;
        delete allAttributes.ADDRNUM;
        delete allAttributes.roadname;
        delete allAttributes.ROADNAME;
        delete allAttributes.roadtype;
        delete allAttributes.ROADTYPE;
        delete allAttributes.unitid;
        delete allAttributes.UNITID;
        delete allAttributes.unittype;
        delete allAttributes.UNITTYPE;
        delete allAttributes.municipality;
        delete allAttributes.MUNICIPALITY;
        delete allAttributes.zipcode;
        delete allAttributes.ZIPCODE;
        delete allAttributes.county;
        delete allAttributes.COUNTY;
        delete allAttributes.addrtype;
        delete allAttributes.ADDRTYPE;
        delete allAttributes.status;
        delete allAttributes.STATUS;
        delete allAttributes.source;
        delete allAttributes.SOURCE;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          'Houston Site Addresses',
          fulladdr || 'N/A',
          addrnum || 'N/A',
          roadname || 'N/A',
          roadtype || 'N/A',
          unitid || 'N/A',
          unittype || 'N/A',
          municipality || 'N/A',
          zipcode || 'N/A',
          county || 'N/A',
          addrtype || 'N/A',
          status || 'N/A',
          source || 'N/A',
          siteaddid || 'N/A',
          distance || '0.00',
          '', // Address (already in fulladdr)
          '', // Phone
          attributesJson,
          'City of Houston'
        ]);
      });
    } else if (key === 'houston_olc_grid_6digit_all' && Array.isArray(value)) {
      value.forEach((grid: any) => {
        const olcCode = grid.olcCode || grid.OLC_CODE || grid.olc_code || grid.CODE || grid.code || grid.GRID_CODE || grid.grid_code || 'Unknown';
        const gridId = grid.objectId || grid.OBJECTID || grid.objectid || '';
        const gridSize = grid.gridSize || '6-digit';
        const distance = grid.distance_miles !== null && grid.distance_miles !== undefined ? grid.distance_miles.toFixed(2) : (grid.isContaining ? '0.00' : '');
        const isContaining = grid.isContaining ? 'Yes' : 'No';
        
        const allAttributes = { ...grid };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.olcCode;
        delete allAttributes.OLC_CODE;
        delete allAttributes.olc_code;
        delete allAttributes.CODE;
        delete allAttributes.code;
        delete allAttributes.GRID_CODE;
        delete allAttributes.grid_code;
        delete allAttributes.gridSize;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'City of Houston',
          (location.confidence || 'N/A').toString(),
          'Houston_OLC_Grid_6Digit',
          olcCode,
          '', // POI_Latitude
          '', // POI_Longitude
          distance,
          gridSize,
          gridId || 'N/A',
          isContaining,
          attributesJson,
          'City of Houston'
        ]);
      });
    } else if (key === 'houston_olc_grid_8digit_all' && Array.isArray(value)) {
      value.forEach((grid: any) => {
        const olcCode = grid.olcCode || grid.OLC_CODE || grid.olc_code || grid.CODE || grid.code || grid.GRID_CODE || grid.grid_code || 'Unknown';
        const gridId = grid.objectId || grid.OBJECTID || grid.objectid || '';
        const gridSize = grid.gridSize || '8-digit';
        const distance = grid.distance_miles !== null && grid.distance_miles !== undefined ? grid.distance_miles.toFixed(2) : (grid.isContaining ? '0.00' : '');
        const isContaining = grid.isContaining ? 'Yes' : 'No';
        
        const allAttributes = { ...grid };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.olcCode;
        delete allAttributes.OLC_CODE;
        delete allAttributes.olc_code;
        delete allAttributes.CODE;
        delete allAttributes.code;
        delete allAttributes.GRID_CODE;
        delete allAttributes.grid_code;
        delete allAttributes.gridSize;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'City of Houston',
          (location.confidence || 'N/A').toString(),
          'Houston_OLC_Grid_8Digit',
          olcCode,
          '', // POI_Latitude
          '', // POI_Longitude
          distance,
          gridSize,
          gridId || 'N/A',
          isContaining,
          attributesJson,
          'City of Houston'
        ]);
      });
    } else if (key === 'houston_fire_stations_all' && Array.isArray(value)) {
      value.forEach((station: any) => {
        const distSta = station.distSta || station.DIST_STA || '';
        const label = station.label !== null && station.label !== undefined ? station.label.toString() : '';
        const text = station.text || station.TEXT_ || '';
        const admin = station.admin || station.Admin || station.ADMIN || '';
        const inDist = station.inDist !== null && station.inDist !== undefined ? station.inDist.toString() : '';
        const ladders = station.ladders || station.LADDERS || '';
        const stationId = station.objectId || station.OBJECTID || station.objectid || '';
        const lat = station.lat !== null && station.lat !== undefined ? station.lat.toString() : (station.geometry?.y || '');
        const lon = station.long !== null && station.long !== undefined ? station.long.toString() : (station.geometry?.x || '');
        const distance = station.distance_miles !== null && station.distance_miles !== undefined ? station.distance_miles.toFixed(2) : '';
        
        const allAttributes = { ...station };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.distSta;
        delete allAttributes.DIST_STA;
        delete allAttributes.label;
        delete allAttributes.LABEL;
        delete allAttributes.text;
        delete allAttributes.TEXT_;
        delete allAttributes.admin;
        delete allAttributes.Admin;
        delete allAttributes.ADMIN;
        delete allAttributes.inDist;
        delete allAttributes.IN_DIST;
        delete allAttributes.ladders;
        delete allAttributes.LADDERS;
        delete allAttributes.lat;
        delete allAttributes.LAT;
        delete allAttributes.long;
        delete allAttributes.LONG;
        delete allAttributes.xCoord;
        delete allAttributes.X_COORD;
        delete allAttributes.yCoord;
        delete allAttributes.Y_COORD;
        delete allAttributes.globalId;
        delete allAttributes.GlobalID;
        delete allAttributes.GLOBALID;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'City of Houston',
          (location.confidence || 'N/A').toString(),
          'Houston_Fire_Stations',
          text || distSta || label || 'Fire Station',
          lat,
          lon,
          distance,
          admin || 'N/A',
          distSta || 'N/A',
          label || 'N/A',
          inDist || 'N/A',
          ladders || 'N/A',
          stationId || 'N/A',
          attributesJson,
          'City of Houston'
        ]);
      });
    } else if (key === 'houston_metro_bus_routes_all' && Array.isArray(value)) {
      value.forEach((route: any) => {
        const routeName = route.routeName || route.ROUTE_NAME || route.route_name || route.RouteName || route.NAME || route.name || route.Route || route.route || 'Unknown Route';
        const routeNumber = route.routeNumber || route.ROUTE_NUMBER || route.route_number || route.RouteNumber || route.ROUTE || route.Route || route.NUMBER || route.number || '';
        const routeType = route.routeType || route.ROUTE_TYPE || route.route_type || route.RouteType || route.TYPE || route.type || '';
        const routeId = route.objectId || route.OBJECTID || route.objectid || '';
        const distance = route.distance_miles !== null && route.distance_miles !== undefined ? route.distance_miles.toFixed(2) : '';
        
        // Extract coordinates from geometry (polyline - use first coordinate)
        let lat = '';
        let lon = '';
        if (route.geometry) {
          // Line geometry (use first coordinate)
          if (route.geometry.paths && route.geometry.paths.length > 0 && route.geometry.paths[0].length > 0) {
            const firstCoord = route.geometry.paths[0][0];
            lat = firstCoord[1].toString();
            lon = firstCoord[0].toString();
          }
        }
        
        const allAttributes = { ...route };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.routeName;
        delete allAttributes.ROUTE_NAME;
        delete allAttributes.route_name;
        delete allAttributes.RouteName;
        delete allAttributes.NAME;
        delete allAttributes.name;
        delete allAttributes.Route;
        delete allAttributes.route;
        delete allAttributes.routeNumber;
        delete allAttributes.ROUTE_NUMBER;
        delete allAttributes.route_number;
        delete allAttributes.RouteNumber;
        delete allAttributes.ROUTE;
        delete allAttributes.NUMBER;
        delete allAttributes.number;
        delete allAttributes.routeType;
        delete allAttributes.ROUTE_TYPE;
        delete allAttributes.route_type;
        delete allAttributes.RouteType;
        delete allAttributes.TYPE;
        delete allAttributes.type;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'City of Houston',
          (location.confidence || 'N/A').toString(),
          'Houston_Metro_Bus_Routes',
          routeName,
          lat,
          lon,
          distance,
          routeType || 'N/A',
          routeNumber || 'N/A',
          routeId || 'N/A',
          attributesJson,
          'City of Houston'
        ]);
      });
    } else if (key === 'houston_metro_park_and_ride_all' && Array.isArray(value)) {
      value.forEach((location: any) => {
        const name = location.name || location.NAME1 || 'Unknown Park and Ride';
        const address = location.address || location.ADDRESS || '';
        const parkingSpaces = location.parkingSpaces !== null && location.parkingSpaces !== undefined ? location.parkingSpaces.toString() : (location.PSPACES !== null && location.PSPACES !== undefined ? location.PSPACES.toString() : '');
        const routesServed = location.routesServed || location.ROUTES_SER || '';
        const fareZone = location.fareZone !== null && location.fareZone !== undefined ? location.fareZone.toString() : (location.FareZone !== null && location.FareZone !== undefined ? location.FareZone.toString() : '');
        const busStopId = location.busStopId !== null && location.busStopId !== undefined ? location.busStopId.toString() : (location.BusStopID !== null && location.BusStopID !== undefined ? location.BusStopID.toString() : '');
        const locationId = location.objectId || location.OBJECTID || location.objectid || '';
        const lat = location.geometry?.y || '';
        const lon = location.geometry?.x || '';
        const distance = location.distance_miles !== null && location.distance_miles !== undefined ? location.distance_miles.toFixed(2) : '';
        
        const allAttributes = { ...location };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.name;
        delete allAttributes.NAME1;
        delete allAttributes.address;
        delete allAttributes.ADDRESS;
        delete allAttributes.parkingSpaces;
        delete allAttributes.PSPACES;
        delete allAttributes.routesServed;
        delete allAttributes.ROUTES_SER;
        delete allAttributes.fareZone;
        delete allAttributes.FareZone;
        delete allAttributes.busStopId;
        delete allAttributes.BusStopID;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'City of Houston',
          (location.confidence || 'N/A').toString(),
          'Houston_METRO_Park_and_Ride',
          name,
          lat,
          lon,
          distance,
          fareZone || 'N/A',
          address || 'N/A',
          parkingSpaces || 'N/A',
          routesServed || 'N/A',
          busStopId || 'N/A',
          locationId || 'N/A',
          attributesJson,
          'City of Houston'
        ]);
      });
    } else if (key === 'houston_metro_transit_centers_all' && Array.isArray(value)) {
      value.forEach((center: any) => {
        const name = center.name || center.NAME1 || 'Unknown Transit Center';
        const address = center.address || center.ADDRESS || '';
        const parkingSpaces = center.parkingSpaces !== null && center.parkingSpaces !== undefined ? center.parkingSpaces.toString() : (center.PSPACES !== null && center.PSPACES !== undefined ? center.PSPACES.toString() : '');
        const busBays = center.busBays !== null && center.busBays !== undefined ? center.busBays.toString() : (center.B_BAYS !== null && center.B_BAYS !== undefined ? center.B_BAYS.toString() : '');
        const routesServed = center.routesServed || center.ROUTES_SER || '';
        const transitCenterId = center.transitCenterId !== null && center.transitCenterId !== undefined ? center.transitCenterId.toString() : (center.TRANCTR_ID !== null && center.TRANCTR_ID !== undefined ? center.TRANCTR_ID.toString() : '');
        const busStopId = center.busStopId !== null && center.busStopId !== undefined ? center.busStopId.toString() : (center.BusStopID !== null && center.BusStopID !== undefined ? center.BusStopID.toString() : '');
        const centerId = center.objectId || center.OBJECTID || center.objectid || '';
        const lat = center.geometry?.y || '';
        const lon = center.geometry?.x || '';
        const distance = center.distance_miles !== null && center.distance_miles !== undefined ? center.distance_miles.toFixed(2) : '';
        
        const allAttributes = { ...center };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.name;
        delete allAttributes.NAME1;
        delete allAttributes.name2;
        delete allAttributes.NAME2;
        delete allAttributes.address;
        delete allAttributes.ADDRESS;
        delete allAttributes.parkingSpaces;
        delete allAttributes.PSPACES;
        delete allAttributes.busBays;
        delete allAttributes.B_BAYS;
        delete allAttributes.routesServed;
        delete allAttributes.ROUTES_SER;
        delete allAttributes.transitCenterId;
        delete allAttributes.TRANCTR_ID;
        delete allAttributes.busStopId;
        delete allAttributes.BusStopID;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'City of Houston',
          (location.confidence || 'N/A').toString(),
          'Houston_METRO_Transit_Centers',
          name,
          lat,
          lon,
          distance,
          transitCenterId || 'N/A',
          address || 'N/A',
          busBays || 'N/A',
          parkingSpaces || 'N/A',
          routesServed || 'N/A',
          busStopId || 'N/A',
          centerId || 'N/A',
          attributesJson,
          'City of Houston'
        ]);
      });
    } else if (key === 'houston_metro_rail_stations_all' && Array.isArray(value)) {
      value.forEach((station: any) => {
        const stationName = station.stationName || station.Stat_Name || station.STAT_NAME || 'Unknown Rail Station';
        const corridorName = station.corridorName || station.Corr_Name || station.CORR_NAME || '';
        const stationLocation = station.stationLocation || station.Stat_Loc || station.STAT_LOC || '';
        const lineColor = station.lineColor || station.LineColor || station.LINECOLOR || '';
        const status = station.status || station.Status || station.STATUS || '';
        const stationId = station.objectId || station.OBJECTID || station.objectid || '';
        const id = station.id !== null && station.id !== undefined ? station.id.toString() : '';
        const lat = station.geometry?.y || '';
        const lon = station.geometry?.x || '';
        const distance = station.distance_miles !== null && station.distance_miles !== undefined ? station.distance_miles.toFixed(2) : '';
        
        const allAttributes = { ...station };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.stationName;
        delete allAttributes.Stat_Name;
        delete allAttributes.STAT_NAME;
        delete allAttributes.corridorName;
        delete allAttributes.Corr_Name;
        delete allAttributes.CORR_NAME;
        delete allAttributes.stationLocation;
        delete allAttributes.Stat_Loc;
        delete allAttributes.STAT_LOC;
        delete allAttributes.lineColor;
        delete allAttributes.LineColor;
        delete allAttributes.LINECOLOR;
        delete allAttributes.status;
        delete allAttributes.Status;
        delete allAttributes.STATUS;
        delete allAttributes.id;
        delete allAttributes.Id;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'City of Houston',
          (location.confidence || 'N/A').toString(),
          'Houston_METRO_Rail_Stations',
          stationName,
          lat,
          lon,
          distance,
          corridorName || 'N/A',
          stationLocation || 'N/A',
          lineColor || 'N/A',
          status || 'N/A',
          id || 'N/A',
          stationId || 'N/A',
          attributesJson,
          'City of Houston'
        ]);
      });
    } else if (key === 'houston_airports_all' && Array.isArray(value)) {
      value.forEach((airport: any) => {
        const airportName = airport.airportName || airport.NAME || airport.name || airport.NAME1 || airport.name1 || 'Unknown Airport';
        const airportId = airport.objectId || airport.OBJECTID || airport.objectid || '';
        const isContaining = airport.isContaining ? 'Yes' : 'No';
        const distance = airport.distance_miles !== null && airport.distance_miles !== undefined ? airport.distance_miles.toFixed(2) : (airport.isContaining ? '0.00' : '');
        
        // Extract coordinates from geometry (polygon - use centroid or first coordinate)
        let lat = '';
        let lon = '';
        if (airport.geometry && airport.geometry.rings && airport.geometry.rings.length > 0) {
          const outerRing = airport.geometry.rings[0];
          if (outerRing && outerRing.length > 0) {
            // Use first coordinate as approximate location
            lat = outerRing[0][1].toString();
            lon = outerRing[0][0].toString();
          }
        }
        
        const allAttributes = { ...airport };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.airportName;
        delete allAttributes.NAME;
        delete allAttributes.name;
        delete allAttributes.NAME1;
        delete allAttributes.name1;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'City of Houston',
          (location.confidence || 'N/A').toString(),
          'Houston_Airports',
          airportName,
          lat,
          lon,
          distance,
          isContaining,
          airportId || 'N/A',
          attributesJson,
          'City of Houston'
        ]);
      });
    } else if (key === 'blm_national_trails_all' && Array.isArray(value)) {
      value.forEach((trail: any) => {
        const routeName = trail.routeName || trail.ROUTE_PRMRY_NM || trail.Route_Prmry_Nm || 'Unknown Trail';
        const adminState = trail.adminState || trail.ADMIN_ST || trail.Admin_St || '';
        const assetClass = trail.assetClass || trail.PLAN_ASSET_CLASS || trail.Plan_Asset_Class || '';
        const modeTransport = trail.modeTransport || trail.PLAN_MODE_TRNSPRT || trail.Plan_Mode_Trnsprt || '';
        const routeUseClass = trail.routeUseClass || trail.OBSRVE_ROUTE_USE_CLASS || trail.Obsrve_Route_Use_Class || '';
        const gisMiles = trail.gisMiles !== null && trail.gisMiles !== undefined ? trail.gisMiles.toFixed(2) : '';
        const trailId = trail.objectId || trail.OBJECTID || trail.objectid || '';
        const distance = trail.distance_miles !== null && trail.distance_miles !== undefined ? trail.distance_miles.toFixed(2) : '';
        
        // Extract coordinates from geometry (polyline - use first coordinate)
        let lat = '';
        let lon = '';
        if (trail.geometry) {
          // Line geometry (use first coordinate)
          if (trail.geometry.paths && trail.geometry.paths.length > 0 && trail.geometry.paths[0].length > 0) {
            const firstCoord = trail.geometry.paths[0][0];
            lat = firstCoord[1].toString();
            lon = firstCoord[0].toString();
          }
        }
        
        const allAttributes = { ...trail };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.routeName;
        delete allAttributes.ROUTE_PRMRY_NM;
        delete allAttributes.Route_Prmry_Nm;
        delete allAttributes.adminState;
        delete allAttributes.ADMIN_ST;
        delete allAttributes.Admin_St;
        delete allAttributes.assetClass;
        delete allAttributes.PLAN_ASSET_CLASS;
        delete allAttributes.Plan_Asset_Class;
        delete allAttributes.modeTransport;
        delete allAttributes.PLAN_MODE_TRNSPRT;
        delete allAttributes.Plan_Mode_Trnsprt;
        delete allAttributes.routeUseClass;
        delete allAttributes.OBSRVE_ROUTE_USE_CLASS;
        delete allAttributes.Obsrve_Route_Use_Class;
        delete allAttributes.gisMiles;
        delete allAttributes.GIS_MILES;
        delete allAttributes.blmMiles;
        delete allAttributes.BLM_MILES;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'BLM',
          (location.confidence || 'N/A').toString(),
          'BLM_National_Trails',
          routeName,
          lat,
          lon,
          distance,
          adminState || 'N/A',
          assetClass || 'N/A',
          modeTransport || 'N/A',
          routeUseClass || 'N/A',
          gisMiles || 'N/A',
          trailId || 'N/A',
          attributesJson,
          'BLM'
        ]);
      });
    } else if (key === 'blm_national_motorized_trails_all' && Array.isArray(value)) {
      value.forEach((trail: any) => {
        const routeName = trail.routeName || trail.ROUTE_PRMRY_NM || trail.Route_Prmry_Nm || 'Unknown Motorized Trail';
        const adminState = trail.adminState || trail.ADMIN_ST || trail.Admin_St || '';
        const assetClass = trail.assetClass || trail.PLAN_ASSET_CLASS || trail.Plan_Asset_Class || '';
        const modeTransport = trail.modeTransport || trail.PLAN_MODE_TRNSPRT || trail.Plan_Mode_Trnsprt || '';
        const routeUseClass = trail.routeUseClass || trail.OBSRVE_ROUTE_USE_CLASS || trail.Obsrve_Route_Use_Class || '';
        const ohvRouteDesignation = trail.ohvRouteDesignation || trail.PLAN_OHV_ROUTE_DSGNTN || trail.Plan_Ohv_Route_Dsgntn || '';
        const gisMiles = trail.gisMiles !== null && trail.gisMiles !== undefined ? trail.gisMiles.toFixed(2) : '';
        const trailId = trail.objectId || trail.OBJECTID || trail.objectid || '';
        const distance = trail.distance_miles !== null && trail.distance_miles !== undefined ? trail.distance_miles.toFixed(2) : '';
        
        // Extract coordinates from geometry (polyline - use first coordinate)
        let lat = '';
        let lon = '';
        if (trail.geometry) {
          if (trail.geometry.paths && trail.geometry.paths.length > 0 && trail.geometry.paths[0].length > 0) {
            const firstCoord = trail.geometry.paths[0][0];
            lat = firstCoord[1].toString();
            lon = firstCoord[0].toString();
          }
        }
        
        const allAttributes = { ...trail };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.routeName;
        delete allAttributes.ROUTE_PRMRY_NM;
        delete allAttributes.Route_Prmry_Nm;
        delete allAttributes.adminState;
        delete allAttributes.ADMIN_ST;
        delete allAttributes.Admin_St;
        delete allAttributes.assetClass;
        delete allAttributes.PLAN_ASSET_CLASS;
        delete allAttributes.Plan_Asset_Class;
        delete allAttributes.modeTransport;
        delete allAttributes.PLAN_MODE_TRNSPRT;
        delete allAttributes.Plan_Mode_Trnsprt;
        delete allAttributes.routeUseClass;
        delete allAttributes.OBSRVE_ROUTE_USE_CLASS;
        delete allAttributes.Obsrve_Route_Use_Class;
        delete allAttributes.ohvRouteDesignation;
        delete allAttributes.PLAN_OHV_ROUTE_DSGNTN;
        delete allAttributes.Plan_Ohv_Route_Dsgntn;
        delete allAttributes.gisMiles;
        delete allAttributes.GIS_MILES;
        delete allAttributes.blmMiles;
        delete allAttributes.BLM_MILES;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'BLM',
          (location.confidence || 'N/A').toString(),
          'BLM_National_Motorized_Trails',
          routeName,
          lat,
          lon,
          distance,
          adminState || 'N/A',
          assetClass || 'N/A',
          modeTransport || 'N/A',
          routeUseClass || 'N/A',
          ohvRouteDesignation || 'N/A',
          gisMiles || 'N/A',
          trailId || 'N/A',
          attributesJson,
          'BLM'
        ]);
      });
    } else if (key === 'blm_national_nonmotorized_trails_all' && Array.isArray(value)) {
      value.forEach((trail: any) => {
        const routeName = trail.routeName || trail.ROUTE_PRMRY_NM || trail.Route_Prmry_Nm || 'Unknown Nonmotorized Trail';
        const adminState = trail.adminState || trail.ADMIN_ST || trail.Admin_St || '';
        const assetClass = trail.assetClass || trail.PLAN_ASSET_CLASS || trail.Plan_Asset_Class || '';
        const modeTransport = trail.modeTransport || trail.PLAN_MODE_TRNSPRT || trail.Plan_Mode_Trnsprt || '';
        const routeUseClass = trail.routeUseClass || trail.OBSRVE_ROUTE_USE_CLASS || trail.Obsrve_Route_Use_Class || '';
        const ohvRouteDesignation = trail.ohvRouteDesignation || trail.PLAN_OHV_ROUTE_DSGNTN || trail.Plan_Ohv_Route_Dsgntn || '';
        const gisMiles = trail.gisMiles !== null && trail.gisMiles !== undefined ? trail.gisMiles.toFixed(2) : '';
        const trailId = trail.objectId || trail.OBJECTID || trail.objectid || '';
        const distance = trail.distance_miles !== null && trail.distance_miles !== undefined ? trail.distance_miles.toFixed(2) : '';
        
        // Extract coordinates from geometry (polyline - use first coordinate)
        let lat = '';
        let lon = '';
        if (trail.geometry) {
          if (trail.geometry.paths && trail.geometry.paths.length > 0 && trail.geometry.paths[0].length > 0) {
            const firstCoord = trail.geometry.paths[0][0];
            lat = firstCoord[1].toString();
            lon = firstCoord[0].toString();
          }
        }
        
        const allAttributes = { ...trail };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.routeName;
        delete allAttributes.ROUTE_PRMRY_NM;
        delete allAttributes.Route_Prmry_Nm;
        delete allAttributes.adminState;
        delete allAttributes.ADMIN_ST;
        delete allAttributes.Admin_St;
        delete allAttributes.assetClass;
        delete allAttributes.PLAN_ASSET_CLASS;
        delete allAttributes.Plan_Asset_Class;
        delete allAttributes.modeTransport;
        delete allAttributes.PLAN_MODE_TRNSPRT;
        delete allAttributes.Plan_Mode_Trnsprt;
        delete allAttributes.routeUseClass;
        delete allAttributes.OBSRVE_ROUTE_USE_CLASS;
        delete allAttributes.Obsrve_Route_Use_Class;
        delete allAttributes.ohvRouteDesignation;
        delete allAttributes.PLAN_OHV_ROUTE_DSGNTN;
        delete allAttributes.Plan_Ohv_Route_Dsgntn;
        delete allAttributes.gisMiles;
        delete allAttributes.GIS_MILES;
        delete allAttributes.blmMiles;
        delete allAttributes.BLM_MILES;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'BLM',
          (location.confidence || 'N/A').toString(),
          'BLM_National_Nonmotorized_Trails',
          routeName,
          lat,
          lon,
          distance,
          adminState || 'N/A',
          assetClass || 'N/A',
          modeTransport || 'N/A',
          routeUseClass || 'N/A',
          ohvRouteDesignation || 'N/A',
          gisMiles || 'N/A',
          trailId || 'N/A',
          attributesJson,
          'BLM'
        ]);
      });
    } else if (key === 'blm_national_grazing_pastures_all' && Array.isArray(value)) {
      value.forEach((pasture: any) => {
        const pastureName = pasture.pastureName || pasture.PAST_NAME || pasture.Past_Name || 'Unknown Pasture';
        const allotName = pasture.allotName || pasture.ALLOT_NAME || pasture.Allot_Name || '';
        const allotNumber = pasture.allotNumber || pasture.ALLOT_NO || pasture.Allot_No || '';
        const pastureNumber = pasture.pastureNumber || pasture.PAST_NO || pasture.Past_No || '';
        const gisAcres = pasture.gisAcres !== null && pasture.gisAcres !== undefined ? pasture.gisAcres.toFixed(2) : '';
        const adminState = pasture.adminState || pasture.ADMIN_ST || pasture.Admin_St || '';
        const pastureId = pasture.objectId || pasture.OBJECTID || pasture.objectid || '';
        const isContaining = pasture.isContaining ? 'Yes' : 'No';
        const distance = pasture.distance_miles !== null && pasture.distance_miles !== undefined ? pasture.distance_miles.toFixed(2) : (pasture.isContaining ? '0.00' : '');
        
        // Extract coordinates from geometry (polygon - use first coordinate)
        let lat = '';
        let lon = '';
        if (pasture.geometry && pasture.geometry.rings && pasture.geometry.rings.length > 0) {
          const outerRing = pasture.geometry.rings[0];
          if (outerRing && outerRing.length > 0) {
            lat = outerRing[0][1].toString();
            lon = outerRing[0][0].toString();
          }
        }
        
        const allAttributes = { ...pasture };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.pastureName;
        delete allAttributes.PAST_NAME;
        delete allAttributes.Past_Name;
        delete allAttributes.allotName;
        delete allAttributes.ALLOT_NAME;
        delete allAttributes.Allot_Name;
        delete allAttributes.allotNumber;
        delete allAttributes.ALLOT_NO;
        delete allAttributes.Allot_No;
        delete allAttributes.pastureNumber;
        delete allAttributes.PAST_NO;
        delete allAttributes.Past_No;
        delete allAttributes.gisAcres;
        delete allAttributes.GIS_ACRES;
        delete allAttributes.adminState;
        delete allAttributes.ADMIN_ST;
        delete allAttributes.Admin_St;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'BLM',
          (location.confidence || 'N/A').toString(),
          'BLM_National_Grazing_Pastures',
          pastureName,
          lat,
          lon,
          distance,
          isContaining,
          allotName || 'N/A',
          allotNumber || 'N/A',
          pastureNumber || 'N/A',
          gisAcres || 'N/A',
          adminState || 'N/A',
          pastureId || 'N/A',
          attributesJson,
          'BLM'
        ]);
      });
    } else if (key === 'blm_national_acec_all' && Array.isArray(value)) {
      value.forEach((acec: any) => {
        const acecName = acec.acecName || acec.ACEC_NAME || acec.Acec_Name || 'Unknown ACEC';
        const lupName = acec.lupName || acec.LUP_NAME || acec.Lup_Name || '';
        const nepaNum = acec.nepaNum || acec.NEPA_NUM || acec.Nepa_Num || '';
        const rodDate = acec.rodDate || acec.ROD_DATE || '';
        const gisAcres = acec.gisAcres !== null && acec.gisAcres !== undefined ? acec.gisAcres.toFixed(2) : '';
        const adminState = acec.adminState || acec.ADMIN_ST || acec.Admin_St || '';
        const acecId = acec.objectId || acec.OBJECTID || acec.objectid || '';
        const isContaining = acec.isContaining ? 'Yes' : 'No';
        const distance = acec.distance_miles !== null && acec.distance_miles !== undefined ? acec.distance_miles.toFixed(2) : (acec.isContaining ? '0.00' : '');
        
        // Build relevance flags
        const relevanceFlags: string[] = [];
        if (acec.relevanceCultural === 'YES') relevanceFlags.push('Cultural');
        if (acec.relevanceForestry === 'YES') relevanceFlags.push('Forestry');
        if (acec.relevanceHistoric === 'YES') relevanceFlags.push('Historic');
        if (acec.relevanceNaturalHazards === 'YES') relevanceFlags.push('Natural Hazards');
        if (acec.relevanceNaturalProcesses === 'YES') relevanceFlags.push('Natural Processes');
        if (acec.relevanceNaturalSystems === 'YES') relevanceFlags.push('Natural Systems');
        if (acec.relevanceScenic === 'YES') relevanceFlags.push('Scenic');
        if (acec.relevanceWildlife === 'YES') relevanceFlags.push('Wildlife');
        const relevanceStr = relevanceFlags.join('; ');
        
        // Extract coordinates from geometry (polygon - use first coordinate)
        let lat = '';
        let lon = '';
        if (acec.geometry && acec.geometry.rings && acec.geometry.rings.length > 0) {
          const outerRing = acec.geometry.rings[0];
          if (outerRing && outerRing.length > 0) {
            lat = outerRing[0][1].toString();
            lon = outerRing[0][0].toString();
          }
        }
        
        const allAttributes = { ...acec };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.acecName;
        delete allAttributes.ACEC_NAME;
        delete allAttributes.Acec_Name;
        delete allAttributes.lupName;
        delete allAttributes.LUP_NAME;
        delete allAttributes.Lup_Name;
        delete allAttributes.nepaNum;
        delete allAttributes.NEPA_NUM;
        delete allAttributes.Nepa_Num;
        delete allAttributes.rodDate;
        delete allAttributes.ROD_DATE;
        delete allAttributes.gisAcres;
        delete allAttributes.GIS_ACRES;
        delete allAttributes.adminState;
        delete allAttributes.ADMIN_ST;
        delete allAttributes.Admin_St;
        delete allAttributes.relevanceCultural;
        delete allAttributes.relevanceForestry;
        delete allAttributes.relevanceHistoric;
        delete allAttributes.relevanceNaturalHazards;
        delete allAttributes.relevanceNaturalProcesses;
        delete allAttributes.relevanceNaturalSystems;
        delete allAttributes.relevanceScenic;
        delete allAttributes.relevanceWildlife;
        delete allAttributes.importanceQuality;
        delete allAttributes.importanceImportance;
        delete allAttributes.importanceContribution;
        delete allAttributes.importanceThreat;
        delete allAttributes.specialMgmtProtect;
        delete allAttributes.specialMgmtPrevent;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'BLM',
          (location.confidence || 'N/A').toString(),
          'BLM_National_ACEC',
          acecName,
          lat,
          lon,
          distance,
          isContaining,
          lupName || 'N/A',
          nepaNum || 'N/A',
          rodDate || 'N/A',
          gisAcres || 'N/A',
          adminState || 'N/A',
          relevanceStr || 'N/A',
          acecId || 'N/A',
          attributesJson,
          'BLM'
        ]);
      });
    } else if (key === 'blm_national_sheep_goat_grazing_all' && Array.isArray(value)) {
      value.forEach((allotment: any) => {
        const allotName = allotment.allotName || allotment.ALLOT_NAME || allotment.Allot_Name || 'Unknown Allotment';
        const stateAllotNum = allotment.stateAllotNum || allotment.ST_ALLOT_NUM || allotment.St_Allot_Num || '';
        const status = allotment.status || allotment.Status || '';
        const sumAcres = allotment.sumAcres !== null && allotment.sumAcres !== undefined ? allotment.sumAcres.toFixed(2) : '';
        const allotId = allotment.objectId || allotment.OBJECTID || allotment.objectid || '';
        const isContaining = allotment.isContaining ? 'Yes' : 'No';
        const distance = allotment.distance_miles !== null && allotment.distance_miles !== undefined ? allotment.distance_miles.toFixed(2) : (allotment.isContaining ? '0.00' : '');
        
        // Extract coordinates from geometry (polygon - use first coordinate)
        let lat = '';
        let lon = '';
        if (allotment.geometry && allotment.geometry.rings && allotment.geometry.rings.length > 0) {
          const outerRing = allotment.geometry.rings[0];
          if (outerRing && outerRing.length > 0) {
            lat = outerRing[0][1].toString();
            lon = outerRing[0][0].toString();
          }
        }
        
        const allAttributes = { ...allotment };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.allotName;
        delete allAttributes.ALLOT_NAME;
        delete allAttributes.Allot_Name;
        delete allAttributes.stateAllotNum;
        delete allAttributes.ST_ALLOT_NUM;
        delete allAttributes.St_Allot_Num;
        delete allAttributes.status;
        delete allAttributes.Status;
        delete allAttributes.source;
        delete allAttributes.Source;
        delete allAttributes.trAllotNum;
        delete allAttributes.TR_ALLOT_NUM;
        delete allAttributes.Tr_Allot_Num;
        delete allAttributes.sumAcres;
        delete allAttributes.SUM_ACRES;
        delete allAttributes.pastureName;
        delete allAttributes.PAST_NAME;
        delete allAttributes.Past_Name;
        delete allAttributes.stateAllotPastNum;
        delete allAttributes.ST_ALLOT_PAST_NUM;
        delete allAttributes.St_Allot_Past_Num;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'BLM',
          (location.confidence || 'N/A').toString(),
          'BLM_National_Sheep_Goat_Billed_Grazing',
          allotName,
          lat,
          lon,
          distance,
          isContaining,
          stateAllotNum || 'N/A',
          status || 'N/A',
          sumAcres || 'N/A',
          allotId || 'N/A',
          attributesJson,
          'BLM'
        ]);
      });
    } else if (key === 'blm_national_sheep_goat_authorized_grazing_all' && Array.isArray(value)) {
      value.forEach((allotment: any) => {
        const allotName = allotment.allotName || allotment.ALLOT_NAME || allotment.Allot_Name || 'Unknown Allotment';
        const stateAllotNum = allotment.stateAllotNum || allotment.ST_ALLOT_NUM || allotment.St_Allot_Num || '';
        const status = allotment.status || allotment.Status || '';
        const sumAcres = allotment.sumAcres !== null && allotment.sumAcres !== undefined ? allotment.sumAcres.toFixed(2) : '';
        const allotId = allotment.objectId || allotment.OBJECTID || allotment.objectid || '';
        const isContaining = allotment.isContaining ? 'Yes' : 'No';
        const distance = allotment.distance_miles !== null && allotment.distance_miles !== undefined ? allotment.distance_miles.toFixed(2) : (allotment.isContaining ? '0.00' : '');
        
        // Extract coordinates from geometry (polygon - use first coordinate)
        let lat = '';
        let lon = '';
        if (allotment.geometry && allotment.geometry.rings && allotment.geometry.rings.length > 0) {
          const outerRing = allotment.geometry.rings[0];
          if (outerRing && outerRing.length > 0) {
            lat = outerRing[0][1].toString();
            lon = outerRing[0][0].toString();
          }
        }
        
        const allAttributes = { ...allotment };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.allotName;
        delete allAttributes.ALLOT_NAME;
        delete allAttributes.Allot_Name;
        delete allAttributes.stateAllotNum;
        delete allAttributes.ST_ALLOT_NUM;
        delete allAttributes.St_Allot_Num;
        delete allAttributes.status;
        delete allAttributes.Status;
        delete allAttributes.source;
        delete allAttributes.Source;
        delete allAttributes.trAllotNum;
        delete allAttributes.TR_ALLOT_NUM;
        delete allAttributes.Tr_Allot_Num;
        delete allAttributes.sumAcres;
        delete allAttributes.SUM_ACRES;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'BLM',
          (location.confidence || 'N/A').toString(),
          'BLM_National_Sheep_Goat_Authorized_Grazing',
          allotName,
          lat,
          lon,
          distance,
          isContaining,
          stateAllotNum || 'N/A',
          status || 'N/A',
          sumAcres || 'N/A',
          allotId || 'N/A',
          attributesJson,
          'BLM'
        ]);
      });
    } else if (key === 'blm_national_nlcs_monuments_ncas_all' && Array.isArray(value)) {
      value.forEach((monumentNCA: any) => {
        const ncaName = monumentNCA.ncaName || monumentNCA.NCA_NAME || monumentNCA.Nca_Name || null;
        const label = monumentNCA.label || monumentNCA.Label || null;
        const displayName = ncaName || label || 'Unknown Monument/NCA';
        const smaCode = monumentNCA.smaCode || monumentNCA.sma_code || monumentNCA.SMA_CODE || '';
        const stateAdmin = monumentNCA.stateAdmin || monumentNCA.STATE_ADMN || monumentNCA.State_Admn || '';
        const nlcsId = monumentNCA.nlcsId || monumentNCA.NLCS_ID || monumentNCA.Nlcs_Id || '';
        const monumentNCAId = monumentNCA.objectId || monumentNCA.OBJECTID || monumentNCA.objectid || '';
        const isContaining = monumentNCA.isContaining ? 'Yes' : 'No';
        const distance = monumentNCA.distance_miles !== null && monumentNCA.distance_miles !== undefined ? monumentNCA.distance_miles.toFixed(2) : (monumentNCA.isContaining ? '0.00' : '');
        
        // Extract coordinates from geometry (polygon - use first coordinate)
        let lat = '';
        let lon = '';
        if (monumentNCA.geometry && monumentNCA.geometry.rings && monumentNCA.geometry.rings.length > 0) {
          const outerRing = monumentNCA.geometry.rings[0];
          if (outerRing && outerRing.length > 0) {
            lat = outerRing[0][1].toString();
            lon = outerRing[0][0].toString();
          }
        }
        
        const allAttributes = { ...monumentNCA };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.smaCode;
        delete allAttributes.sma_code;
        delete allAttributes.SMA_CODE;
        delete allAttributes.stateAdmin;
        delete allAttributes.STATE_ADMN;
        delete allAttributes.State_Admn;
        delete allAttributes.stateGeog;
        delete allAttributes.STATE_GEOG;
        delete allAttributes.State_Geog;
        delete allAttributes.label;
        delete allAttributes.Label;
        delete allAttributes.ncaName;
        delete allAttributes.NCA_NAME;
        delete allAttributes.Nca_Name;
        delete allAttributes.nlcsId;
        delete allAttributes.NLCS_ID;
        delete allAttributes.Nlcs_Id;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'BLM',
          (location.confidence || 'N/A').toString(),
          'BLM_National_NLCS_Monuments_NCAs',
          displayName,
          lat,
          lon,
          distance,
          isContaining,
          smaCode || 'N/A',
          nlcsId || 'N/A',
          stateAdmin || 'N/A',
          monumentNCAId || 'N/A',
          attributesJson,
          'BLM'
        ]);
      });
    } else if (key === 'blm_national_wild_horse_burro_herd_areas_all' && Array.isArray(value)) {
      value.forEach((herdArea: any) => {
        const herdAreaName = herdArea.herdAreaName || herdArea.HA_NAME || herdArea.Ha_Name || 'Unknown Herd Area';
        const herdAreaNumber = herdArea.herdAreaNumber || herdArea.HA_NO || herdArea.Ha_No || '';
        const herdType = herdArea.herdType || herdArea.HERD_TYPE || herdArea.Herd_Type || '';
        const adminState = herdArea.adminState || herdArea.ADMIN_ST || herdArea.Admin_St || '';
        const blmAcres = herdArea.blmAcres !== null && herdArea.blmAcres !== undefined ? herdArea.blmAcres.toFixed(2) : '';
        const totalAcres = herdArea.totalAcres !== null && herdArea.totalAcres !== undefined ? herdArea.totalAcres.toFixed(2) : '';
        const estHorsePop = herdArea.estHorsePop !== null && herdArea.estHorsePop !== undefined ? herdArea.estHorsePop.toString() : '';
        const estBurroPop = herdArea.estBurroPop !== null && herdArea.estBurroPop !== undefined ? herdArea.estBurroPop.toString() : '';
        const herdAreaId = herdArea.objectId || herdArea.OBJECTID || herdArea.objectid || '';
        const isContaining = herdArea.isContaining ? 'Yes' : 'No';
        const distance = herdArea.distance_miles !== null && herdArea.distance_miles !== undefined ? herdArea.distance_miles.toFixed(2) : (herdArea.isContaining ? '0.00' : '');
        
        // Extract coordinates from geometry (polygon - use first coordinate)
        let lat = '';
        let lon = '';
        if (herdArea.geometry && herdArea.geometry.rings && herdArea.geometry.rings.length > 0) {
          const outerRing = herdArea.geometry.rings[0];
          if (outerRing && outerRing.length > 0) {
            lat = outerRing[0][1].toString();
            lon = outerRing[0][0].toString();
          }
        }
        
        const allAttributes = { ...herdArea };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.herdAreaName;
        delete allAttributes.HA_NAME;
        delete allAttributes.Ha_Name;
        delete allAttributes.herdAreaNumber;
        delete allAttributes.HA_NO;
        delete allAttributes.Ha_No;
        delete allAttributes.adminState;
        delete allAttributes.ADMIN_ST;
        delete allAttributes.Admin_St;
        delete allAttributes.adminAgency;
        delete allAttributes.ADMIN_AGCY;
        delete allAttributes.Admin_Agcy;
        delete allAttributes.herdType;
        delete allAttributes.HERD_TYPE;
        delete allAttributes.Herd_Type;
        delete allAttributes.blmAcres;
        delete allAttributes.BLM_ACRES;
        delete allAttributes.totalAcres;
        delete allAttributes.TOTAL_ACRES;
        delete allAttributes.transferAcres;
        delete allAttributes.TRANSFER_ACRES;
        delete allAttributes.estHorsePop;
        delete allAttributes.EST_HORSE_POP;
        delete allAttributes.estBurroPop;
        delete allAttributes.EST_BURRO_POP;
        delete allAttributes.lastGatherDate;
        delete allAttributes.LAST_GATHER_DT;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'BLM',
          (location.confidence || 'N/A').toString(),
          'BLM_National_Wild_Horse_Burro_Herd_Areas',
          herdAreaName,
          lat,
          lon,
          distance,
          isContaining,
          herdAreaNumber || 'N/A',
          herdType || 'N/A',
          adminState || 'N/A',
          blmAcres || 'N/A',
          totalAcres || 'N/A',
          estHorsePop || 'N/A',
          estBurroPop || 'N/A',
          herdAreaId || 'N/A',
          attributesJson,
          'BLM'
        ]);
      });
    } else if (key === 'blm_national_recreation_sites_all' && Array.isArray(value)) {
      value.forEach((site: any) => {
        const siteName = site.fetName || site.FET_NAME || site.Fet_Name || 'Unknown Recreation Site';
        const fetSubtype = site.fetSubtype || site.FET_SUBTYPE || site.Fet_Subtype || '';
        const fetType = site.fetType !== null && site.fetType !== undefined ? site.fetType.toString() : '';
        const unitName = site.unitName || site.UNIT_NAME || site.Unit_Name || '';
        const adminState = site.adminState || site.ADMIN_ST || site.Admin_St || '';
        const gisAcres = site.gisAcres !== null && site.gisAcres !== undefined ? site.gisAcres.toFixed(2) : '';
        const description = site.description || site.DESCRIPTION || site.Description || '';
        const webLink = site.webLink || site.WEB_LINK || site.Web_Link || '';
        const siteId = site.objectId || site.OBJECTID || site.objectid || '';
        const isContaining = site.isContaining ? 'Yes' : 'No';
        const distance = site.distance_miles !== null && site.distance_miles !== undefined ? site.distance_miles.toFixed(2) : (site.isContaining ? '0.00' : '');
        
        // Extract coordinates from geometry (polygon - use first coordinate)
        let lat = '';
        let lon = '';
        if (site.geometry && site.geometry.rings && site.geometry.rings.length > 0) {
          const outerRing = site.geometry.rings[0];
          if (outerRing && outerRing.length > 0) {
            lat = outerRing[0][1].toString();
            lon = outerRing[0][0].toString();
          }
        }
        
        const allAttributes = { ...site };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.fetType;
        delete allAttributes.FET_TYPE;
        delete allAttributes.fetSubtype;
        delete allAttributes.FET_SUBTYPE;
        delete allAttributes.Fet_Subtype;
        delete allAttributes.fetName;
        delete allAttributes.FET_NAME;
        delete allAttributes.Fet_Name;
        delete allAttributes.admUnitCode;
        delete allAttributes.ADM_UNIT_CD;
        delete allAttributes.Adm_Unit_Cd;
        delete allAttributes.adminState;
        delete allAttributes.ADMIN_ST;
        delete allAttributes.Admin_St;
        delete allAttributes.gisAcres;
        delete allAttributes.GIS_ACRES;
        delete allAttributes.description;
        delete allAttributes.DESCRIPTION;
        delete allAttributes.Description;
        delete allAttributes.webLink;
        delete allAttributes.WEB_LINK;
        delete allAttributes.Web_Link;
        delete allAttributes.photoLink;
        delete allAttributes.PHOTO_LINK;
        delete allAttributes.Photo_Link;
        delete allAttributes.unitName;
        delete allAttributes.UNIT_NAME;
        delete allAttributes.Unit_Name;
        delete allAttributes.source;
        delete allAttributes.SOURCE;
        delete allAttributes.webDisplay;
        delete allAttributes.WEB_DISPLAY;
        delete allAttributes.Web_Display;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'BLM',
          (location.confidence || 'N/A').toString(),
          'BLM_National_Recreation_Sites',
          siteName,
          lat,
          lon,
          distance,
          isContaining,
          fetSubtype || 'N/A',
          fetType || 'N/A',
          unitName || 'N/A',
          adminState || 'N/A',
          gisAcres || 'N/A',
          description || 'N/A',
          webLink || 'N/A',
          siteId || 'N/A',
          attributesJson,
          'BLM'
        ]);
      });
    } else if (key === 'blm_national_fire_perimeters_all' && Array.isArray(value)) {
      value.forEach((perimeter: any) => {
        const incidentName = perimeter.incidentName || perimeter.INCDNT_NM || perimeter.Incdnt_Nm || 'Unknown Fire';
        const fireDiscoveryYear = perimeter.fireDiscoveryYear !== null && perimeter.fireDiscoveryYear !== undefined ? perimeter.fireDiscoveryYear.toString() : '';
        const fireDiscoveryDate = perimeter.fireDiscoveryDate || perimeter.FIRE_DSCVR_DT || '';
        const fireControlDate = perimeter.fireControlDate || perimeter.FIRE_CNTRL_DT || '';
        const fireCauseName = perimeter.fireCauseName || perimeter.FIRE_CAUSE_NM || perimeter.Fire_Cause_Nm || '';
        const gisAcres = perimeter.gisAcres !== null && perimeter.gisAcres !== undefined ? perimeter.gisAcres.toFixed(2) : '';
        const totalReportedAcres = perimeter.totalReportedAcres !== null && perimeter.totalReportedAcres !== undefined ? perimeter.totalReportedAcres.toFixed(2) : '';
        const adminState = perimeter.adminState || perimeter.ADMIN_ST || perimeter.Admin_St || '';
        const complexName = perimeter.complexName || perimeter.CMPLX_NM || perimeter.Cmplx_Nm || '';
        const uniqueFireId = perimeter.uniqueFireId || perimeter.UNQE_FIRE_ID || perimeter.Unqe_Fire_Id || '';
        const perimeterId = perimeter.objectId || perimeter.OBJECTID || perimeter.objectid || '';
        const isContaining = perimeter.isContaining ? 'Yes' : 'No';
        const distance = perimeter.distance_miles !== null && perimeter.distance_miles !== undefined ? perimeter.distance_miles.toFixed(2) : (perimeter.isContaining ? '0.00' : '');
        
        // Extract coordinates from geometry (polygon - use first coordinate)
        let lat = '';
        let lon = '';
        if (perimeter.geometry && perimeter.geometry.rings && perimeter.geometry.rings.length > 0) {
          const outerRing = perimeter.geometry.rings[0];
          if (outerRing && outerRing.length > 0) {
            lat = outerRing[0][1].toString();
            lon = outerRing[0][0].toString();
          }
        }
        
        const allAttributes = { ...perimeter };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.incidentName;
        delete allAttributes.INCDNT_NM;
        delete allAttributes.Incdnt_Nm;
        delete allAttributes.fireDiscoveryYear;
        delete allAttributes.FIRE_DSCVR_CY;
        delete allAttributes.fireDiscoveryDate;
        delete allAttributes.FIRE_DSCVR_DT;
        delete allAttributes.fireDiscoveryDateEstFlag;
        delete allAttributes.FIRE_DSCVR_DT_EST_FLAG;
        delete allAttributes.fireControlDate;
        delete allAttributes.FIRE_CNTRL_DT;
        delete allAttributes.fireControlDateEstFlag;
        delete allAttributes.FIRE_CNTRL_DT_EST_FLAG;
        delete allAttributes.fireCauseName;
        delete allAttributes.FIRE_CAUSE_NM;
        delete allAttributes.Fire_Cause_Nm;
        delete allAttributes.collectionMethodName;
        delete allAttributes.CLCTN_MTHD_NM;
        delete allAttributes.Clctn_Mthd_Nm;
        delete allAttributes.totalReportedAcres;
        delete allAttributes.TOTAL_RPT_ACRES_NR;
        delete allAttributes.gisAcres;
        delete allAttributes.GIS_ACRES;
        delete allAttributes.complexName;
        delete allAttributes.CMPLX_NM;
        delete allAttributes.Cmplx_Nm;
        delete allAttributes.irwinId;
        delete allAttributes.IRWIN_ID;
        delete allAttributes.Irwin_Id;
        delete allAttributes.comment;
        delete allAttributes.COMMENT;
        delete allAttributes.Comment;
        delete allAttributes.admUnitCode;
        delete allAttributes.ADM_UNIT_CD;
        delete allAttributes.Adm_Unit_Cd;
        delete allAttributes.adminState;
        delete allAttributes.ADMIN_ST;
        delete allAttributes.Admin_St;
        delete allAttributes.uniqueFireId;
        delete allAttributes.UNQE_FIRE_ID;
        delete allAttributes.Unqe_Fire_Id;
        delete allAttributes.fireCodeId;
        delete allAttributes.FIRE_CODE_ID;
        delete allAttributes.Fire_Code_Id;
        delete allAttributes.localIncidentId;
        delete allAttributes.LOCAL_INCDNT_ID;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'BLM',
          (location.confidence || 'N/A').toString(),
          'BLM_National_Fire_Perimeters',
          incidentName,
          lat,
          lon,
          distance,
          isContaining,
          fireDiscoveryYear || 'N/A',
          fireDiscoveryDate || 'N/A',
          fireControlDate || 'N/A',
          fireCauseName || 'N/A',
          gisAcres || 'N/A',
          totalReportedAcres || 'N/A',
          adminState || 'N/A',
          complexName || 'N/A',
          uniqueFireId || 'N/A',
          perimeterId || 'N/A',
          attributesJson,
          'BLM'
        ]);
      });
    } else if (key === 'blm_national_lwcf_all' && Array.isArray(value)) {
      value.forEach((polygon: any) => {
        const projectName = polygon.projectName || polygon.Prjt_Name || polygon.Prjt_Name || 'Unknown LWCF Project';
        const snFull = polygon.snFull || polygon.SN_Full || polygon.Sn_Full || '';
        const caseId = polygon.caseId !== null && polygon.caseId !== undefined ? polygon.caseId.toString() : '';
        const geoState = polygon.geoState || polygon.Geo_State || polygon.Geo_State || '';
        const refNum = polygon.refNum || polygon.Ref_Num || polygon.Ref_Num || '';
        const acqFund = polygon.acqFund || polygon.Acq_Fund || polygon.Acq_Fund || '';
        const fundYear = polygon.fundYear || polygon.Fund_Year || polygon.Fund_Year || '';
        const purpose = polygon.purpose || polygon.Purpose || polygon.Purpose || '';
        const areaAcq = polygon.areaAcq !== null && polygon.areaAcq !== undefined ? polygon.areaAcq.toFixed(2) : '';
        const paymentMade = polygon.paymentMade || polygon.Pmnt_Made || polygon.Pmnt_Made || '';
        const acqValue = polygon.acqValue || polygon.Acq_Value || polygon.Acq_Value || '';
        const deedSignDate = polygon.deedSignDate || polygon.Deed_Sign || '';
        const recorded = polygon.recorded || polygon.Recorded || polygon.Recorded || '';
        const countyRec = polygon.countyRec || polygon.County_Rec || polygon.County_Rec || '';
        const administratingAgency = polygon.administratingAgency || polygon.Administrating_Agency || polygon.Administrating_Agency || '';
        const isContaining = polygon.isContaining ? 'Yes' : 'No';
        const distance = polygon.distance_miles !== null && polygon.distance_miles !== undefined ? polygon.distance_miles.toFixed(2) : (polygon.isContaining ? '0.00' : '');
        
        // Extract coordinates from geometry (polygon - use first coordinate)
        let lat = '';
        let lon = '';
        if (polygon.geometry && polygon.geometry.rings && polygon.geometry.rings.length > 0) {
          const outerRing = polygon.geometry.rings[0];
          if (outerRing && outerRing.length > 0) {
            lat = outerRing[0][1].toString();
            lon = outerRing[0][0].toString();
          }
        }
        
        const allAttributes = { ...polygon };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.projectName;
        delete allAttributes.Prjt_Name;
        delete allAttributes.Prjt_Name;
        delete allAttributes.snFull;
        delete allAttributes.SN_Full;
        delete allAttributes.Sn_Full;
        delete allAttributes.caseId;
        delete allAttributes.Case_id;
        delete allAttributes.Case_Id;
        delete allAttributes.geoState;
        delete allAttributes.Geo_State;
        delete allAttributes.Geo_State;
        delete allAttributes.refNum;
        delete allAttributes.Ref_Num;
        delete allAttributes.Ref_Num;
        delete allAttributes.acqFund;
        delete allAttributes.Acq_Fund;
        delete allAttributes.Acq_Fund;
        delete allAttributes.fundYear;
        delete allAttributes.Fund_Year;
        delete allAttributes.Fund_Year;
        delete allAttributes.purpose;
        delete allAttributes.Purpose;
        delete allAttributes.Purpose;
        delete allAttributes.areaAcq;
        delete allAttributes.Area_Acq;
        delete allAttributes.Area_Acq;
        delete allAttributes.paymentMade;
        delete allAttributes.Pmnt_Made;
        delete allAttributes.Pmnt_Made;
        delete allAttributes.acqValue;
        delete allAttributes.Acq_Value;
        delete allAttributes.Acq_Value;
        delete allAttributes.deedSignDate;
        delete allAttributes.Deed_Sign;
        delete allAttributes.Deed_Sign;
        delete allAttributes.recorded;
        delete allAttributes.Recorded;
        delete allAttributes.Recorded;
        delete allAttributes.countyRec;
        delete allAttributes.County_Rec;
        delete allAttributes.County_Rec;
        delete allAttributes.administratingAgency;
        delete allAttributes.Administrating_Agency;
        delete allAttributes.Administrating_Agency;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'BLM',
          (location.confidence || 'N/A').toString(),
          'BLM_National_LWCF',
          projectName,
          lat,
          lon,
          distance,
          isContaining,
          snFull || 'N/A',
          caseId || 'N/A',
          geoState || 'N/A',
          refNum || 'N/A',
          acqFund || 'N/A',
          fundYear || 'N/A',
          purpose || 'N/A',
          areaAcq || 'N/A',
          paymentMade || 'N/A',
          acqValue || 'N/A',
          deedSignDate || 'N/A',
          recorded || 'N/A',
          countyRec || 'N/A',
          administratingAgency || 'N/A',
          attributesJson,
          'BLM'
        ]);
      });
    } else if (key === 'usfs_forest_boundaries_all' && Array.isArray(value)) {
      value.forEach((forest: any) => {
        const forestName = forest.forestName || forest.FORESTNAME || forest.ForestName || forest.FOREST_NM || forest.Forest_Nm || 'Unknown Forest';
        const forestCode = forest.forestCode || forest.FORESTCODE || forest.ForestCode || forest.FOREST_CD || forest.Forest_Cd || '';
        const regionCode = forest.regionCode || forest.REGIONCODE || forest.RegionCode || forest.REGION_CD || forest.Region_Cd || '';
        const regionName = forest.regionName || forest.REGIONNAME || forest.RegionName || forest.REGION_NM || forest.Region_Nm || '';
        const forestId = forest.objectId || forest.OBJECTID || forest.objectid || '';
        const isContaining = forest.isContaining ? 'Yes' : 'No';
        const distance = forest.distance_miles !== null && forest.distance_miles !== undefined ? forest.distance_miles.toFixed(2) : (forest.isContaining ? '0.00' : '');
        
        // Extract coordinates from geometry (polygon - use first coordinate)
        let lat = '';
        let lon = '';
        if (forest.geometry && forest.geometry.rings && forest.geometry.rings.length > 0) {
          const outerRing = forest.geometry.rings[0];
          if (outerRing && outerRing.length > 0) {
            lat = outerRing[0][1].toString();
            lon = outerRing[0][0].toString();
          }
        }
        
        const allAttributes = { ...forest };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.forestName;
        delete allAttributes.FORESTNAME;
        delete allAttributes.ForestName;
        delete allAttributes.FOREST_NM;
        delete allAttributes.Forest_Nm;
        delete allAttributes.forestCode;
        delete allAttributes.FORESTCODE;
        delete allAttributes.ForestCode;
        delete allAttributes.FOREST_CD;
        delete allAttributes.Forest_Cd;
        delete allAttributes.regionCode;
        delete allAttributes.REGIONCODE;
        delete allAttributes.RegionCode;
        delete allAttributes.REGION_CD;
        delete allAttributes.Region_Cd;
        delete allAttributes.regionName;
        delete allAttributes.REGIONNAME;
        delete allAttributes.RegionName;
        delete allAttributes.REGION_NM;
        delete allAttributes.Region_Nm;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'USFS',
          (location.confidence || 'N/A').toString(),
          'USFS_Forest_Boundaries',
          forestName,
          lat,
          lon,
          distance,
          isContaining,
          forestCode || 'N/A',
          regionName || 'N/A',
          regionCode || 'N/A',
          forestId || 'N/A',
          attributesJson,
          'USFS'
        ]);
      });
    } else if (key === 'chinook_salmon_ranges_all' && Array.isArray(value)) {
      value.forEach((range: any) => {
        const esuDps = range.esu_dps || range.ESU_DPS || range.Esu_Dps || '';
        const status = range.status || range.Status || '';
        const classValue = range.class || range.Class || '';
        const fid = range.fid !== null && range.fid !== undefined ? range.fid.toString() : '';
        const isContaining = range.isContaining ? 'Yes' : 'No';
        const distance = range.distance_miles !== null && range.distance_miles !== undefined ? range.distance_miles.toFixed(2) : (range.isContaining ? '0.00' : '');
        
        // Extract coordinates from geometry (polygon - use first coordinate)
        let lat = '';
        let lon = '';
        if (range.geometry && range.geometry.rings && range.geometry.rings.length > 0) {
          const outerRing = range.geometry.rings[0];
          if (outerRing && outerRing.length > 0) {
            lat = outerRing[0][1].toString();
            lon = outerRing[0][0].toString();
          }
        }
        
        const allAttributes = { ...range };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.fid;
        delete allAttributes.FID;
        delete allAttributes.esu_dps;
        delete allAttributes.ESU_DPS;
        delete allAttributes.Esu_Dps;
        delete allAttributes.status;
        delete allAttributes.Status;
        delete allAttributes.class;
        delete allAttributes.Class;
        delete allAttributes.shape_area;
        delete allAttributes.Shape__Area;
        delete allAttributes.Shape_Area;
        delete allAttributes.shape_length;
        delete allAttributes.Shape__Length;
        delete allAttributes.Shape_Length;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'ArcGIS FeatureServer',
          (location.confidence || 'N/A').toString(),
          'CHINOOK_SALMON_RANGES',
          esuDps || `Range ${fid}`,
          lat,
          lon,
          distance,
          isContaining,
          status || 'N/A',
          classValue || 'N/A',
          fid || 'N/A',
          attributesJson,
          'ArcGIS FeatureServer'
        ]);
      });
    } else if (key === 'tx_school_districts_2024_all' && Array.isArray(value)) {
      // Handle TX School Districts 2024 - each district gets its own row with all attributes
      value.forEach((district: any) => {
        const districtName = district.name20 || district.name || district.name2 || `District ${district.district || district.fid}`;
        const isContaining = district.isContaining ? 'Yes' : 'No';
        const distance = district.distance_miles !== null && district.distance_miles !== undefined ? district.distance_miles.toFixed(2) : (district.isContaining ? '0.00' : '');
        
        // Extract coordinates from geometry (polygon - use first coordinate)
        let lat = '';
        let lon = '';
        if (district.geometry && district.geometry.rings && district.geometry.rings.length > 0) {
          const outerRing = district.geometry.rings[0];
          if (outerRing && outerRing.length > 0) {
            lat = outerRing[0][1].toString();
            lon = outerRing[0][0].toString();
          }
        }
        
        const allAttributes = { ...district };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.fid;
        delete allAttributes.FID;
        delete allAttributes.name20;
        delete allAttributes.NAME20;
        delete allAttributes.name;
        delete allAttributes.NAME;
        delete allAttributes.name2;
        delete allAttributes.NAME2;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'Texas Education Agency',
          (location.confidence || 'N/A').toString(),
          'TX_SCHOOL_DISTRICT_2024',
          districtName,
          lat || location.lat.toString(),
          lon || location.lon.toString(),
          distance,
          'School District',
          isContaining,
          district.district || '',
          district.nces_distr || '',
          attributesJson,
          'Texas Education Agency'
        ]);
      });
    } else if (key === 'wri_aqueduct_water_risk_future_annual_all' && Array.isArray(value)) {
      // Handle WRI Aqueduct Water Risk Future Annual - each feature gets its own row with all attributes
      value.forEach((feature: any) => {
        const isContaining = feature.isContaining ? 'Yes' : 'No';
        const distance = feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : (feature.isContaining ? '0.00' : '');
        
        // Extract coordinates from geometry (polygon - use first coordinate)
        let lat = '';
        let lon = '';
        if (feature.geometry && feature.geometry.rings && feature.geometry.rings.length > 0) {
          const outerRing = feature.geometry.rings[0];
          if (outerRing && outerRing.length > 0) {
            lat = outerRing[0][1].toString();
            lon = outerRing[0][0].toString();
          }
        }
        
        const allAttributes = { ...feature };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        const attributesJson = JSON.stringify(allAttributes);
        
        const objectId = feature.OBJECTID || feature.FID || feature.fid || '';
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'World Resources Institute',
          (location.confidence || 'N/A').toString(),
          'WRI_AQUEDUCT_WATER_RISK_FUTURE_ANNUAL',
          `Feature ${objectId || 'Unknown'}`,
          lat || location.lat.toString(),
          lon || location.lon.toString(),
          distance,
          'Water Risk Feature',
          isContaining,
          '',
          '',
          attributesJson,
          'World Resources Institute'
        ]);
      });
    } else if (key === 'wri_aqueduct_water_risk_baseline_annual_all' && Array.isArray(value)) {
      // Handle WRI Aqueduct Water Risk Baseline Annual - each feature gets its own row with all attributes
      value.forEach((feature: any) => {
        const isContaining = feature.isContaining ? 'Yes' : 'No';
        const distance = feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : (feature.isContaining ? '0.00' : '');
        
        // Extract coordinates from geometry (polygon - use first coordinate)
        let lat = '';
        let lon = '';
        if (feature.geometry && feature.geometry.rings && feature.geometry.rings.length > 0) {
          const outerRing = feature.geometry.rings[0];
          if (outerRing && outerRing.length > 0) {
            lat = outerRing[0][1].toString();
            lon = outerRing[0][0].toString();
          }
        }
        
        const allAttributes = { ...feature };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        const attributesJson = JSON.stringify(allAttributes);
        
        const objectId = feature.OBJECTID || feature.FID || feature.fid || '';
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'World Resources Institute',
          (location.confidence || 'N/A').toString(),
          'WRI_AQUEDUCT_WATER_RISK_BASELINE_ANNUAL',
          `Feature ${objectId || 'Unknown'}`,
          lat || location.lat.toString(),
          lon || location.lon.toString(),
          distance,
          'Water Risk Feature',
          isContaining,
          '',
          '',
          attributesJson,
          'World Resources Institute'
        ]);
      });
    } else if (key === 'pr_hydrology_all' && Array.isArray(value)) {
      // Handle Puerto Rico Hydrology - each feature gets its own row with all attributes
      value.forEach((feature: any) => {
        const distance = feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : '';
        
        // Extract coordinates from geometry (polyline - use first coordinate)
        let lat = '';
        let lon = '';
        if (feature.geometry && feature.geometry.paths && feature.geometry.paths.length > 0) {
          const firstPath = feature.geometry.paths[0];
          if (firstPath && firstPath.length > 0) {
            // ESRI paths are [lon, lat] format
            lat = firstPath[0][1].toString();
            lon = firstPath[0][0].toString();
          }
        }
        
        const allAttributes = { ...feature };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        const name = feature.name || feature.NAME || feature.Name || 'Unnamed';
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'Puerto Rico Open Data',
          (location.confidence || 'N/A').toString(),
          'PR_HYDROLOGY',
          name,
          lat || location.lat.toString(),
          lon || location.lon.toString(),
          distance,
          feature.tipo || feature.TIPO || feature.type || feature.Type || 'Unknown',
          '',
          '',
          '',
          attributesJson,
          'Puerto Rico Open Data'
        ]);
      });
    } else if (key === 'sc_trout_streams_all' && Array.isArray(value)) {
      // Handle SC Trout Streams - each feature gets its own row with all attributes
      value.forEach((feature: any) => {
        const distance = feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : '';
        
        // Extract coordinates from geometry (polyline - use first coordinate)
        let lat = '';
        let lon = '';
        if (feature.geometry && feature.geometry.paths && feature.geometry.paths.length > 0) {
          const firstPath = feature.geometry.paths[0];
          if (firstPath && firstPath.length > 0) {
            // ESRI paths are [lon, lat] format
            lat = firstPath[0][1].toString();
            lon = firstPath[0][0].toString();
          }
        }
        
        const allAttributes = { ...feature };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.fid;
        delete allAttributes.objectid;
        const attributesJson = JSON.stringify(allAttributes);
        
        const objectId = feature.objectid || feature.OBJECTID || feature.fid || feature.FID || '';
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'South Carolina Department of Natural Resources',
          (location.confidence || 'N/A').toString(),
          'SC_TROUT_STREAMS',
          `Feature ${objectId || 'Unknown'}`,
          lat || location.lat.toString(),
          lon || location.lon.toString(),
          distance,
          'Trout Stream',
          '',
          '',
          '',
          attributesJson,
          'South Carolina Department of Natural Resources'
        ]);
      });
    } else if (key === 'sc_scenic_rivers_all' && Array.isArray(value)) {
      // Handle SC Scenic Rivers - each feature gets its own row with all attributes
      value.forEach((river: any) => {
        const distance = river.distance_miles !== null && river.distance_miles !== undefined ? river.distance_miles.toFixed(2) : '';
        
        // Extract coordinates from geometry (polyline - use first coordinate)
        let lat = '';
        let lon = '';
        if (river.geometry && river.geometry.paths && river.geometry.paths.length > 0) {
          const firstPath = river.geometry.paths[0];
          if (firstPath && firstPath.length > 0) {
            // ESRI paths are [lon, lat] format
            lat = firstPath[0][1].toString();
            lon = firstPath[0][0].toString();
          }
        }
        
        const allAttributes = { ...river };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.objectid;
        const attributesJson = JSON.stringify(allAttributes);
        
        const name = river.name || river.NAME || river.Name || 'Scenic River';
        const dnrMiles = river.dnrMiles !== null && river.dnrMiles !== undefined ? river.dnrMiles : (river.DNR_miles !== null && river.DNR_miles !== undefined ? river.DNR_miles : null);
        const dateEst = river.dateEst || river.date_est || river.Date_Est || '';
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'South Carolina Department of Natural Resources',
          (location.confidence || 'N/A').toString(),
          'SC_SCENIC_RIVERS',
          `${name}${dnrMiles !== null ? ` (${dnrMiles} miles)` : ''}${dateEst ? ` - ${dateEst}` : ''}`,
          lat || location.lat.toString(),
          lon || location.lon.toString(),
          distance,
          'Scenic River Polyline',
          '',
          '',
          '',
          attributesJson,
          'South Carolina Department of Natural Resources'
        ]);
      });
    } else if (key === 'sc_game_zones_all' && Array.isArray(value)) {
      // Handle SC Game Zones - each feature gets its own row with all attributes
      value.forEach((feature: any) => {
        const isContaining = feature.isContaining ? 'Yes' : 'No';
        const distance = feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : (feature.isContaining ? '0.00' : '');
        
        // Extract coordinates from geometry (polygon - use first coordinate of outer ring)
        let lat = '';
        let lon = '';
        if (feature.geometry && feature.geometry.rings && feature.geometry.rings.length > 0) {
          const outerRing = feature.geometry.rings[0];
          if (outerRing && outerRing.length > 0) {
            // ESRI rings are [lon, lat] format
            lat = outerRing[0][1].toString();
            lon = outerRing[0][0].toString();
          }
        }
        
        const allAttributes = { ...feature };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        const attributesJson = JSON.stringify(allAttributes);
        
        const objectId = feature.objectid || feature.OBJECTID || '';
        const gameZone = feature.gameZone || feature.GameZone || feature.GAMEZONE || 'Unknown';
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'South Carolina Department of Natural Resources',
          (location.confidence || 'N/A').toString(),
          'SC_GAME_ZONES',
          `Game Zone ${gameZone}${objectId ? ` (${objectId})` : ''}`,
          lat || location.lat.toString(),
          lon || location.lon.toString(),
          distance,
          'Game Zone',
          isContaining,
          '',
          '',
          attributesJson,
          'South Carolina Department of Natural Resources'
        ]);
      });
    } else if (key === 'sc_coastal_ponds_all' && Array.isArray(value)) {
      // Handle SC Coastal Ponds - each feature gets its own row with all attributes
      value.forEach((feature: any) => {
        const isContaining = feature.isContaining ? 'Yes' : 'No';
        const distance = feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : (feature.isContaining ? '0.00' : '');
        
        // Extract coordinates from geometry (polygon - use first coordinate of outer ring)
        let lat = '';
        let lon = '';
        if (feature.geometry && feature.geometry.rings && feature.geometry.rings.length > 0) {
          const outerRing = feature.geometry.rings[0];
          if (outerRing && outerRing.length > 0) {
            // ESRI rings are [lon, lat] format
            lat = outerRing[0][1].toString();
            lon = outerRing[0][0].toString();
          }
        }
        
        const allAttributes = { ...feature };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        const attributesJson = JSON.stringify(allAttributes);
        
        const fid = feature.fid || feature.FID || '';
        const objectId = feature.objectid || feature.OBJECTID || '';
        const pondId = feature.pondId || feature.Pond_ID || feature.POND_ID || 'Unknown';
        const countyName = feature.countyName || feature.County_Nam || feature.County_Name || '';
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'South Carolina Department of Natural Resources',
          (location.confidence || 'N/A').toString(),
          'SC_COASTAL_PONDS',
          `Pond ${pondId}${countyName ? ` - ${countyName}` : ''}${objectId ? ` (${objectId})` : fid ? ` (FID: ${fid})` : ''}`,
          lat || location.lat.toString(),
          lon || location.lon.toString(),
          distance,
          'Coastal Pond',
          isContaining,
          '',
          '',
          attributesJson,
          'South Carolina Department of Natural Resources'
        ]);
      });
    } else if (key === 'sc_lakes_reservoirs_all' && Array.isArray(value)) {
      // Handle SC Lakes and Reservoirs - each feature gets its own row with all attributes
      value.forEach((feature: any) => {
        const isContaining = feature.isContaining ? 'Yes' : 'No';
        const distance = feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : (feature.isContaining ? '0.00' : '');
        
        // Extract coordinates from geometry (polygon - use first coordinate of outer ring)
        let lat = '';
        let lon = '';
        if (feature.geometry && feature.geometry.rings && feature.geometry.rings.length > 0) {
          const outerRing = feature.geometry.rings[0];
          if (outerRing && outerRing.length > 0) {
            // ESRI rings are [lon, lat] format
            lat = outerRing[0][1].toString();
            lon = outerRing[0][0].toString();
          }
        }
        
        const allAttributes = { ...feature };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        const attributesJson = JSON.stringify(allAttributes);
        
        const objectId = feature.objectid || feature.OBJECTID || '';
        const name = feature.name || feature.NAME || feature.Name || 'Unnamed';
        const acres = feature.acres !== null && feature.acres !== undefined ? feature.acres : null;
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'South Carolina Department of Natural Resources',
          (location.confidence || 'N/A').toString(),
          'SC_LAKES_RESERVOIRS',
          `${name}${acres !== null ? ` (${acres.toLocaleString()} acres)` : ''}${objectId ? ` (${objectId})` : ''}`,
          lat || location.lat.toString(),
          lon || location.lon.toString(),
          distance,
          'Lake/Reservoir',
          isContaining,
          '',
          '',
          attributesJson,
          'South Carolina Department of Natural Resources'
        ]);
      });
    } else if (key === 'sc_coastal_well_inventory_all' && Array.isArray(value)) {
      // Handle SC Coastal Well Inventory - each well gets its own row with all attributes
      value.forEach((well: any) => {
        const distance = well.distance_miles !== null && well.distance_miles !== undefined ? well.distance_miles.toFixed(2) : '';
        
        const wellLat = well.lat || well.latDDNAD83 || location.lat.toString();
        const wellLon = well.lon || well.lonDDNAD83 || location.lon.toString();
        
        const allAttributes = { ...well };
        delete allAttributes.lat;
        delete allAttributes.lon;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        const wellId = well.wellId || well.WELL_ID || 'Unknown';
        const owner = well.owner || well.OWNER || '';
        const wellUse = well.wellUse || well.WELL_USE || '';
        const county = well.county || well.COUNTY || '';
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'South Carolina Department of Natural Resources',
          (location.confidence || 'N/A').toString(),
          'SC_COASTAL_WELL_INVENTORY',
          `${wellId}${owner ? ` - ${owner}` : ''}${wellUse ? ` (${wellUse})` : ''}${county ? ` - ${county}` : ''}`,
          wellLat,
          wellLon,
          distance,
          'Well Point',
          '',
          '',
          '',
          attributesJson,
          'South Carolina Department of Natural Resources'
        ]);
      });
    } else if (key === 'usfws_final_critical_habitat_all' && Array.isArray(value)) {
      // Handle USFWS Final Critical Habitat - each feature gets its own row with all attributes
      value.forEach((feature: any) => {
        const isContaining = feature.isContaining ? 'Yes' : 'No';
        const distance = feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : (feature.isContaining ? '0.00' : '');
        
        // Extract coordinates from geometry (polygon - use first coordinate of outer ring)
        let lat = '';
        let lon = '';
        if (feature.geometry && feature.geometry.rings && feature.geometry.rings.length > 0) {
          const outerRing = feature.geometry.rings[0];
          if (outerRing && outerRing.length > 0) {
            // ESRI rings are [lon, lat] format
            lat = outerRing[0][1].toString();
            lon = outerRing[0][0].toString();
          }
        }
        
        const allAttributes = { ...feature };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.speciesName;
        delete allAttributes.commonName;
        delete allAttributes.status;
        const attributesJson = JSON.stringify(allAttributes);
        
        const objectId = feature.objectid || feature.OBJECTID || '';
        const speciesName = feature.speciesName || feature.SCIENTIFIC_NAME || feature.scientific_name || 'Unknown Species';
        const commonName = feature.commonName || feature.COMMON_NAME || feature.common_name || '';
        const status = feature.status || 'Final';
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'US Fish and Wildlife Service',
          (location.confidence || 'N/A').toString(),
          'USFWS_FINAL_CRITICAL_HABITAT',
          `${commonName ? `${commonName} (${speciesName})` : speciesName}${objectId ? ` (ID ${objectId})` : ''}`,
          lat || location.lat.toString(),
          lon || location.lon.toString(),
          distance,
          'Critical Habitat',
          isContaining,
          status,
          '',
          attributesJson,
          'US Fish and Wildlife Service'
        ]);
      });
    } else if (key === 'usfws_proposed_critical_habitat_all' && Array.isArray(value)) {
      // Handle USFWS Proposed Critical Habitat - each feature gets its own row with all attributes
      value.forEach((feature: any) => {
        const isContaining = feature.isContaining ? 'Yes' : 'No';
        const distance = feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : (feature.isContaining ? '0.00' : '');
        
        // Extract coordinates from geometry (polygon - use first coordinate of outer ring)
        let lat = '';
        let lon = '';
        if (feature.geometry && feature.geometry.rings && feature.geometry.rings.length > 0) {
          const outerRing = feature.geometry.rings[0];
          if (outerRing && outerRing.length > 0) {
            // ESRI rings are [lon, lat] format
            lat = outerRing[0][1].toString();
            lon = outerRing[0][0].toString();
          }
        }
        
        const allAttributes = { ...feature };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.speciesName;
        delete allAttributes.commonName;
        delete allAttributes.status;
        const attributesJson = JSON.stringify(allAttributes);
        
        const objectId = feature.objectid || feature.OBJECTID || '';
        const speciesName = feature.speciesName || feature.SCIENTIFIC_NAME || feature.scientific_name || 'Unknown Species';
        const commonName = feature.commonName || feature.COMMON_NAME || feature.common_name || '';
        const status = feature.status || 'Proposed';
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'US Fish and Wildlife Service',
          (location.confidence || 'N/A').toString(),
          'USFWS_PROPOSED_CRITICAL_HABITAT',
          `${commonName ? `${commonName} (${speciesName})` : speciesName}${objectId ? ` (ID ${objectId})` : ''}`,
          lat || location.lat.toString(),
          lon || location.lon.toString(),
          distance,
          'Critical Habitat',
          isContaining,
          status,
          '',
          attributesJson,
          'US Fish and Wildlife Service'
        ]);
      });
    } else if (key === 'american_eel_current_range_all' && Array.isArray(value)) {
      // Handle American Eel Current Range - each feature gets its own row with all attributes
      value.forEach((feature: any) => {
        const isContaining = feature.isContaining ? 'Yes' : 'No';
        const distance = feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : (feature.isContaining ? '0.00' : '');
        
        // Extract coordinates from geometry (polygon - use first coordinate of outer ring)
        let lat = '';
        let lon = '';
        if (feature.geometry && feature.geometry.rings && feature.geometry.rings.length > 0) {
          const outerRing = feature.geometry.rings[0];
          if (outerRing && outerRing.length > 0) {
            // ESRI rings are [lon, lat] format
            lat = outerRing[0][1].toString();
            lon = outerRing[0][0].toString();
          }
        }
        
        const allAttributes = { ...feature };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.region;
        delete allAttributes.subregion;
        delete allAttributes.basin;
        delete allAttributes.subbasin;
        delete allAttributes.huc8;
        delete allAttributes.acres;
        delete allAttributes.sqMiles;
        const attributesJson = JSON.stringify(allAttributes);
        
        const objectId = feature.objectid || feature.OBJECTID || '';
        const region = feature.region || feature.REGION || '';
        const subregion = feature.subregion || feature.SUBREGION || '';
        const basin = feature.basin || feature.BASIN || '';
        const subbasin = feature.subbasin || feature.SUBBASIN || '';
        const huc8 = feature.huc8 || feature.HUC_8 || feature.HUC8_dbl || '';
        const rangeLabel = region || basin || subbasin || `Range ${objectId}`;
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'US Fish and Wildlife Service',
          (location.confidence || 'N/A').toString(),
          'AMERICAN_EEL_CURRENT_RANGE',
          `American Eel Current Range${rangeLabel ? ` - ${rangeLabel}` : ''}${objectId ? ` (ID ${objectId})` : ''}`,
          lat || location.lat.toString(),
          lon || location.lon.toString(),
          distance,
          'Fish and Wildlife',
          isContaining,
          region || '',
          subregion || '',
          attributesJson,
          'US Fish and Wildlife Service',
          basin || '',
          subbasin || '',
          huc8 || ''
        ]);
      });
    } else if (key === 'bighorn_sheep_captures_releases_all' && Array.isArray(value)) {
      // Handle Bighorn Sheep Captures and Releases - each event gets its own row with all attributes
      value.forEach((sheep: any) => {
        const distance = sheep.distance_miles !== null && sheep.distance_miles !== undefined ? sheep.distance_miles.toFixed(2) : '';

        const sheepLat = sheep.y !== null && sheep.y !== undefined ? sheep.y.toString() : location.lat.toString();
        const sheepLon = sheep.x !== null && sheep.x !== undefined ? sheep.x.toString() : location.lon.toString();

        const allAttributes = { ...sheep };
        delete allAttributes.geometry; // Point geometry is simple x,y, so it's already handled by sheep.x, sheep.y
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);

        const objectId = sheep.objectid || sheep.OBJECTID || '';
        const capRelType = sheep.capRelType || sheep.CapRelType || 'Unknown';
        const year = sheep.year || sheep.Year || '';
        const subspecies = sheep.subspecies || sheep.Subspecies || '';
        const eventLabel = `${capRelType}${year ? ` (${year})` : ''}${subspecies ? ` - ${subspecies}` : ''}`;

        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'US Fish and Wildlife Service',
          (location.confidence || 'N/A').toString(),
          'BIGHORN_SHEEP_CAPTURES_RELEASES',
          `Bighorn Sheep ${eventLabel}${objectId ? ` (ID ${objectId})` : ''}`,
          sheepLat,
          sheepLon,
          distance,
          'Fish and Wildlife', // Category for display in CSV
          '', // isContaining not applicable for point proximity
          '',
          '',
          attributesJson,
          'US Fish and Wildlife Service'
        ]);
      });
    } else if (key === 'national_aquatic_barrier_dams_all' && Array.isArray(value)) {
      // Handle National Aquatic Barrier Dam Inventory - each dam gets its own row with all attributes
      value.forEach((dam: any) => {
        const distance = dam.distance_miles !== null && dam.distance_miles !== undefined ? dam.distance_miles.toFixed(2) : '';
        
        const damLat = dam.lat || location.lat.toString();
        const damLon = dam.lon || location.lon.toString();
        
        const allAttributes = { ...dam };
        delete allAttributes.lat;
        delete allAttributes.lon;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        const objectId = dam.objectid || dam.OBJECTID || '';
        const barrierName = dam.barrierName || dam.Barrier_Name || dam.barrier_name || 'Unnamed Dam';
        const otherBarrierName = dam.otherBarrierName || dam.Other_Barrier_Name || dam.other_barrier_name || null;
        const stateAbbreviation = dam.stateAbbreviation || dam.StateAbbreviation || dam.state_abbreviation || null;
        const county = dam.county || dam.COUNTY || dam.County || null;
        const river = dam.river || dam.RIVER || dam.River || null;
        const height = dam.height !== null && dam.height !== undefined ? dam.height : null;
        const width = dam.width !== null && dam.width !== undefined ? dam.width : null;
        const length = dam.length !== null && dam.length !== undefined ? dam.length : null;
        const yearCompleted = dam.yearCompleted !== null && dam.yearCompleted !== undefined ? dam.yearCompleted : null;
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'National Aquatic Barrier Inventory',
          (location.confidence || 'N/A').toString(),
          'NATIONAL_AQUATIC_BARRIER_DAM',
          `${barrierName}${otherBarrierName ? ` (${otherBarrierName})` : ''}${stateAbbreviation ? ` - ${stateAbbreviation}` : ''}${county ? `, ${county}` : ''}${river ? ` on ${river}` : ''}${objectId ? ` (ID ${objectId})` : ''}`,
          damLat,
          damLon,
          distance,
          'Dam',
          '',
          height !== null ? `Height: ${height} ft` : '',
          width !== null ? `Width: ${width} ft` : '',
          attributesJson,
          'National Aquatic Barrier Inventory',
          length !== null ? `Length: ${length} ft` : '',
          yearCompleted !== null ? `Year: ${yearCompleted}` : ''
        ]);
      });
    } else if (key === 'orlando_christmas_lights_all' && Array.isArray(value)) {
      // Handle Orlando Christmas Light Displays - each display gets its own row with all attributes
      value.forEach((display: any) => {
        const distance = display.distance_miles !== null && display.distance_miles !== undefined ? display.distance_miles.toFixed(2) : '';
        
        const displayLat = display.lat || location.lat.toString();
        const displayLon = display.lon || location.lon.toString();
        
        // Filter out personal names from name and description
        const nameRaw = display.name || display.Name || display.NAME || null;
        const name = filterPersonalNames(nameRaw) || 'Christmas Light Display';
        const address = display.address || display.Address || display.ADDRESS || '';
        
        // Also filter personal names from the attributes JSON
        const allAttributes = { ...display };
        delete allAttributes.lat;
        delete allAttributes.lon;
        delete allAttributes.distance_miles;
        
        // Filter personal names from name and description in attributes
        if (allAttributes.name) {
          allAttributes.name = filterPersonalNames(allAttributes.name) || allAttributes.name;
        }
        if (allAttributes.Name) {
          allAttributes.Name = filterPersonalNames(allAttributes.Name) || allAttributes.Name;
        }
        if (allAttributes.NAME) {
          allAttributes.NAME = filterPersonalNames(allAttributes.NAME) || allAttributes.NAME;
        }
        if (allAttributes.description) {
          allAttributes.description = filterPersonalNames(allAttributes.description) || allAttributes.description;
        }
        if (allAttributes.Description) {
          allAttributes.Description = filterPersonalNames(allAttributes.Description) || allAttributes.Description;
        }
        if (allAttributes.DESCRIPTION) {
          allAttributes.DESCRIPTION = filterPersonalNames(allAttributes.DESCRIPTION) || allAttributes.DESCRIPTION;
        }
        
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'Quirky & Fun',
          (location.confidence || 'N/A').toString(),
          'ORLANDO_CHRISTMAS_LIGHTS',
          `${name}${address ? ` - ${address}` : ''}`,
          displayLat,
          displayLon,
          distance,
          'Christmas Light Display Point',
          '',
          '',
          '',
          attributesJson,
          'Quirky & Fun'
        ]);
      });
    } else if (key === 'us_drilling_platforms_all' && Array.isArray(value)) {
      // Handle US Drilling Platforms - each platform gets its own row with all attributes
      value.forEach((platform: any) => {
        const distance = platform.distance_miles !== null && platform.distance_miles !== undefined ? platform.distance_miles.toFixed(2) : '';
        
        const platformLat = platform.lat || location.lat.toString();
        const platformLon = platform.lon || location.lon.toString();
        
        const allAttributes = { ...platform };
        delete allAttributes.lat;
        delete allAttributes.lon;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        const structureName = platform.structureName || platform.STRUCTURE_NAME || platform.Structure_Name || 'Drilling Platform';
        const structureNumber = platform.structureNumber || platform.STRUCTURE_NUMBER || platform.Structure_Number || '';
        const areaCode = platform.areaCode || platform.AREA_CODE || platform.Area_Code || '';
        const blockNumber = platform.blockNumber || platform.BLOCK_NUMBER || platform.Block_Number || '';
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'Power & Infrastructure',
          (location.confidence || 'N/A').toString(),
          'US_DRILLING_PLATFORMS',
          `${structureName}${structureNumber ? ` - ${structureNumber}` : ''}${areaCode && blockNumber ? ` (${areaCode} ${blockNumber})` : ''}`,
          platformLat,
          platformLon,
          distance,
          'Drilling Platform Point',
          '',
          '',
          '',
          attributesJson,
          'Power & Infrastructure'
        ]);
      });
    } else if (key === 'wri_aqueduct_water_risk_baseline_monthly_all' && Array.isArray(value)) {
      // Handle WRI Aqueduct Water Risk Baseline Monthly - each feature gets its own row with all attributes
      value.forEach((feature: any) => {
        const isContaining = feature.isContaining ? 'Yes' : 'No';
        const distance = feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : (feature.isContaining ? '0.00' : '');
        
        // Extract coordinates from geometry (polygon - use first coordinate)
        let lat = '';
        let lon = '';
        if (feature.geometry && feature.geometry.rings && feature.geometry.rings.length > 0) {
          const outerRing = feature.geometry.rings[0];
          if (outerRing && outerRing.length > 0) {
            lat = outerRing[0][1].toString();
            lon = outerRing[0][0].toString();
          }
        }
        
        const allAttributes = { ...feature };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        const attributesJson = JSON.stringify(allAttributes);
        
        const objectId = feature.OBJECTID || feature.FID || feature.fid || '';
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'World Resources Institute',
          (location.confidence || 'N/A').toString(),
          'WRI_AQUEDUCT_WATER_RISK_BASELINE_MONTHLY',
          `Feature ${objectId || 'Unknown'}`,
          lat || location.lat.toString(),
          lon || location.lon.toString(),
          distance,
          'Water Risk Feature',
          isContaining,
          '',
          '',
          attributesJson,
          'World Resources Institute'
        ]);
      });
    } else if (key.startsWith('acs_') && key.endsWith('_all') && Array.isArray(value)) {
      // Generic handler for all ACS boundary layers - each feature gets its own row with all attributes
      const layerName = key.replace('_all', '').replace(/^acs_/, '').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      value.forEach((feature: any) => {
        const isContaining = feature.isContaining ? 'Yes' : 'No';
        const distance = feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : (feature.isContaining ? '0.00' : '');
        
        // Extract coordinates from geometry (polygon - use first coordinate)
        let lat = '';
        let lon = '';
        if (feature.geometry && feature.geometry.rings && feature.geometry.rings.length > 0) {
          const outerRing = feature.geometry.rings[0];
          if (outerRing && outerRing.length > 0) {
            lat = outerRing[0][1].toString();
            lon = outerRing[0][0].toString();
          }
        }
        
        const allAttributes = { ...feature };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        const attributesJson = JSON.stringify(allAttributes);
        
        const objectId = feature.OBJECTID || feature.FID || feature.fid || '';
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'American Community Survey',
          (location.confidence || 'N/A').toString(),
          `ACS_${key.replace('_all', '').toUpperCase()}`,
          `ACS ${layerName} - Feature ${objectId || 'Unknown'}`,
          lat || location.lat.toString(),
          lon || location.lon.toString(),
          distance,
          'ACS Boundary',
          isContaining,
          '',
          '',
          attributesJson,
          'American Community Survey'
        ]);
      });
    } else if (key === 'usfs_office_locations_all' && Array.isArray(value)) {
      value.forEach((office: any) => {
        const officeName = office.officeName || office.OFFICENAME || office.OfficeName || 'Unknown Office';
        const officeType = office.officeType || office.OFFICETYPE || office.OfficeType || '';
        const forestName = office.forestName || office.FORESTNAME || office.ForestName || '';
        const address = office.address || office.ADDRESS || office.Address || '';
        const phone = office.phone || office.PHONE || office.Phone || '';
        const officeId = office.objectId || office.OBJECTID || office.objectid || '';
        const distance = office.distance_miles !== null && office.distance_miles !== undefined ? office.distance_miles.toFixed(2) : '';
        
        let lat = '';
        let lon = '';
        if (office.geometry && office.geometry.x !== undefined && office.geometry.y !== undefined) {
          lat = office.geometry.y.toString();
          lon = office.geometry.x.toString();
        }
        
        const allAttributes = { ...office };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.officeName;
        delete allAttributes.OFFICENAME;
        delete allAttributes.OfficeName;
        delete allAttributes.officeType;
        delete allAttributes.OFFICETYPE;
        delete allAttributes.OfficeType;
        delete allAttributes.forestName;
        delete allAttributes.FORESTNAME;
        delete allAttributes.ForestName;
        delete allAttributes.address;
        delete allAttributes.ADDRESS;
        delete allAttributes.Address;
        delete allAttributes.phone;
        delete allAttributes.PHONE;
        delete allAttributes.Phone;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'USFS',
          (location.confidence || 'N/A').toString(),
          'USFS_Office_Locations',
          officeName,
          lat,
          lon,
          distance,
          officeType || 'N/A',
          forestName || 'N/A',
          address || 'N/A',
          phone || 'N/A',
          officeId || 'N/A',
          attributesJson,
          'USFS'
        ]);
      });
    } else if (key === 'usfs_special_uses_communications_sites_all' && Array.isArray(value)) {
      value.forEach((site: any) => {
        const siteName = site.siteName || site.SITENAME || site.SiteName || 'Unknown Communications Site';
        const siteType = site.siteType || site.SITETYPE || site.SiteType || '';
        const forestName = site.forestName || site.FORESTNAME || site.ForestName || '';
        const siteId = site.objectId || site.OBJECTID || site.objectid || '';
        const distance = site.distance_miles !== null && site.distance_miles !== undefined ? site.distance_miles.toFixed(2) : '';
        
        let lat = '';
        let lon = '';
        if (site.geometry && site.geometry.x !== undefined && site.geometry.y !== undefined) {
          lat = site.geometry.y.toString();
          lon = site.geometry.x.toString();
        }
        
        const allAttributes = { ...site };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.siteName;
        delete allAttributes.SITENAME;
        delete allAttributes.SiteName;
        delete allAttributes.siteType;
        delete allAttributes.SITETYPE;
        delete allAttributes.SiteType;
        delete allAttributes.forestName;
        delete allAttributes.FORESTNAME;
        delete allAttributes.ForestName;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'USFS',
          (location.confidence || 'N/A').toString(),
          'USFS_Special_Uses_Communications_Sites',
          siteName,
          lat,
          lon,
          distance,
          siteType || 'N/A',
          forestName || 'N/A',
          siteId || 'N/A',
          attributesJson,
          'USFS'
        ]);
      });
    } else if (key === 'usfs_administrative_boundaries_all' && Array.isArray(value)) {
      value.forEach((boundary: any) => {
        const boundaryName = boundary.boundaryName || boundary.BOUNDARYNAME || boundary.BoundaryName || boundary.forestName || boundary.FORESTNAME || 'Unknown Boundary';
        const boundaryType = boundary.boundaryType || boundary.BOUNDARYTYPE || boundary.BoundaryType || '';
        const forestName = boundary.forestName || boundary.FORESTNAME || boundary.ForestName || '';
        const boundaryId = boundary.objectId || boundary.OBJECTID || boundary.objectid || '';
        const isContaining = boundary.isContaining ? 'Yes' : 'No';
        const distance = boundary.distance_miles !== null && boundary.distance_miles !== undefined ? boundary.distance_miles.toFixed(2) : (boundary.isContaining ? '0.00' : '');
        
        let lat = '';
        let lon = '';
        if (boundary.geometry && boundary.geometry.rings && boundary.geometry.rings.length > 0) {
          const outerRing = boundary.geometry.rings[0];
          if (outerRing && outerRing.length > 0) {
            lat = outerRing[0][1].toString();
            lon = outerRing[0][0].toString();
          }
        }
        
        const allAttributes = { ...boundary };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.boundaryName;
        delete allAttributes.BOUNDARYNAME;
        delete allAttributes.BoundaryName;
        delete allAttributes.boundaryType;
        delete allAttributes.BOUNDARYTYPE;
        delete allAttributes.BoundaryType;
        delete allAttributes.forestName;
        delete allAttributes.FORESTNAME;
        delete allAttributes.ForestName;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'USFS',
          (location.confidence || 'N/A').toString(),
          'USFS_Administrative_Boundaries',
          boundaryName,
          lat,
          lon,
          distance,
          isContaining,
          boundaryType || 'N/A',
          forestName || 'N/A',
          boundaryId || 'N/A',
          attributesJson,
          'USFS'
        ]);
      });
    } else if (key === 'usfs_recreation_opportunities_all' && Array.isArray(value)) {
      value.forEach((opp: any) => {
        const recAreaName = opp.recAreaName || opp.RECAREANAME || opp.RecAreaName || 'Unknown Recreation Area';
        const forestName = opp.forestName || opp.FORESTNAME || opp.ForestName || '';
        const markerActivity = opp.markerActivity || opp.MARKERACTIVITY || opp.MarkerActivity || '';
        const markerActivityGroup = opp.markerActivityGroup || opp.MARKERACTIVITYGROUP || opp.MarkerActivityGroup || '';
        const openSeasonStart = opp.openSeasonStart || opp.OPEN_SEASON_START || opp.Open_Season_Start || '';
        const openSeasonEnd = opp.openSeasonEnd || opp.OPEN_SEASON_END || opp.Open_Season_End || '';
        const recAreaUrl = opp.recAreaUrl || opp.RECAREAURL || opp.RecAreaUrl || '';
        const recAreaId = opp.recAreaId || opp.RECAREAID || opp.RecAreaId || '';
        const oppId = opp.objectId || opp.OBJECTID || opp.objectid || '';
        const distance = opp.distance_miles !== null && opp.distance_miles !== undefined ? opp.distance_miles.toFixed(2) : '';
        
        let lat = '';
        let lon = '';
        if (opp.geometry && opp.geometry.x !== undefined && opp.geometry.y !== undefined) {
          lat = opp.geometry.y.toString();
          lon = opp.geometry.x.toString();
        }
        
        const allAttributes = { ...opp };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.recAreaName;
        delete allAttributes.RECAREANAME;
        delete allAttributes.RecAreaName;
        delete allAttributes.forestName;
        delete allAttributes.FORESTNAME;
        delete allAttributes.ForestName;
        delete allAttributes.markerActivity;
        delete allAttributes.MARKERACTIVITY;
        delete allAttributes.MarkerActivity;
        delete allAttributes.markerActivityGroup;
        delete allAttributes.MARKERACTIVITYGROUP;
        delete allAttributes.MarkerActivityGroup;
        delete allAttributes.openSeasonStart;
        delete allAttributes.OPEN_SEASON_START;
        delete allAttributes.Open_Season_Start;
        delete allAttributes.openSeasonEnd;
        delete allAttributes.OPEN_SEASON_END;
        delete allAttributes.Open_Season_End;
        delete allAttributes.recAreaUrl;
        delete allAttributes.RECAREAURL;
        delete allAttributes.RecAreaUrl;
        delete allAttributes.recAreaId;
        delete allAttributes.RECAREAID;
        delete allAttributes.RecAreaId;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'USFS',
          (location.confidence || 'N/A').toString(),
          'USFS_Recreation_Opportunities',
          recAreaName,
          lat,
          lon,
          distance,
          forestName || 'N/A',
          markerActivity || 'N/A',
          markerActivityGroup || 'N/A',
          openSeasonStart || 'N/A',
          openSeasonEnd || 'N/A',
          recAreaUrl || 'N/A',
          recAreaId || 'N/A',
          oppId || 'N/A',
          attributesJson,
          'USFS'
        ]);
      });
    } else if (key === 'usfs_recreation_area_activities_all' && Array.isArray(value)) {
      value.forEach((activity: any) => {
        const recAreaName = activity.recAreaName || activity.RECAREANAME || activity.RecAreaName || 'Unknown Recreation Area';
        const forestName = activity.forestName || activity.FORESTNAME || activity.ForestName || '';
        const markerActivity = activity.markerActivity || activity.MARKERACTIVITY || activity.MarkerActivity || '';
        const markerActivityGroup = activity.markerActivityGroup || activity.MARKERACTIVITYGROUP || activity.MarkerActivityGroup || '';
        const activityName = activity.activityName || activity.ACTIVITYNAME || activity.ActivityName || '';
        const parentActivityName = activity.parentActivityName || activity.PARENTACTIVITYNAME || activity.ParentActivityName || '';
        const openSeasonStart = activity.openSeasonStart || activity.OPEN_SEASON_START || activity.Open_Season_Start || '';
        const openSeasonEnd = activity.openSeasonEnd || activity.OPEN_SEASON_END || activity.Open_Season_End || '';
        const recAreaUrl = activity.recAreaUrl || activity.RECAREAURL || activity.RecAreaUrl || '';
        const recAreaId = activity.recAreaId || activity.RECAREAID || activity.RecAreaId || '';
        const activityId = activity.objectId || activity.OBJECTID || activity.objectid || '';
        const distance = activity.distance_miles !== null && activity.distance_miles !== undefined ? activity.distance_miles.toFixed(2) : '';
        
        let lat = '';
        let lon = '';
        if (activity.geometry && activity.geometry.x !== undefined && activity.geometry.y !== undefined) {
          lat = activity.geometry.y.toString();
          lon = activity.geometry.x.toString();
        }
        
        const allAttributes = { ...activity };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.recAreaName;
        delete allAttributes.RECAREANAME;
        delete allAttributes.RecAreaName;
        delete allAttributes.forestName;
        delete allAttributes.FORESTNAME;
        delete allAttributes.ForestName;
        delete allAttributes.markerActivity;
        delete allAttributes.MARKERACTIVITY;
        delete allAttributes.MarkerActivity;
        delete allAttributes.markerActivityGroup;
        delete allAttributes.MARKERACTIVITYGROUP;
        delete allAttributes.MarkerActivityGroup;
        delete allAttributes.activityName;
        delete allAttributes.ACTIVITYNAME;
        delete allAttributes.ActivityName;
        delete allAttributes.parentActivityName;
        delete allAttributes.PARENTACTIVITYNAME;
        delete allAttributes.ParentActivityName;
        delete allAttributes.openSeasonStart;
        delete allAttributes.OPEN_SEASON_START;
        delete allAttributes.Open_Season_Start;
        delete allAttributes.openSeasonEnd;
        delete allAttributes.OPEN_SEASON_END;
        delete allAttributes.Open_Season_End;
        delete allAttributes.recAreaUrl;
        delete allAttributes.RECAREAURL;
        delete allAttributes.RecAreaUrl;
        delete allAttributes.recAreaId;
        delete allAttributes.RECAREAID;
        delete allAttributes.RecAreaId;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'USFS',
          (location.confidence || 'N/A').toString(),
          'USFS_Recreation_Area_Activities',
          recAreaName,
          lat,
          lon,
          distance,
          forestName || 'N/A',
          activityName || 'N/A',
          parentActivityName || 'N/A',
          markerActivity || 'N/A',
          markerActivityGroup || 'N/A',
          openSeasonStart || 'N/A',
          openSeasonEnd || 'N/A',
          recAreaUrl || 'N/A',
          recAreaId || 'N/A',
          activityId || 'N/A',
          attributesJson,
          'USFS'
        ]);
      });
    } else if (key === 'usfs_roads_closed_to_motorized_all' && Array.isArray(value)) {
      value.forEach((road: any) => {
        const roadName = road.roadName || road.ROADNAME || road.RoadName || road.roadNumber || road.ROADNUMBER || 'Unknown Road';
        const roadNumber = road.roadNumber || road.ROADNUMBER || road.RoadNumber || '';
        const forestName = road.forestName || road.FORESTNAME || road.ForestName || '';
        const roadId = road.objectId || road.OBJECTID || road.objectid || '';
        const distance = road.distance_miles !== null && road.distance_miles !== undefined ? road.distance_miles.toFixed(2) : '';
        
        let lat = '';
        let lon = '';
        if (road.geometry && road.geometry.paths && road.geometry.paths.length > 0 && road.geometry.paths[0].length > 0) {
          const firstCoord = road.geometry.paths[0][0];
          lat = firstCoord[1].toString();
          lon = firstCoord[0].toString();
        }
        
        const allAttributes = { ...road };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.roadName;
        delete allAttributes.ROADNAME;
        delete allAttributes.RoadName;
        delete allAttributes.roadNumber;
        delete allAttributes.ROADNUMBER;
        delete allAttributes.RoadNumber;
        delete allAttributes.forestName;
        delete allAttributes.FORESTNAME;
        delete allAttributes.ForestName;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'USFS',
          (location.confidence || 'N/A').toString(),
          'USFS_Roads_Closed_to_Motorized_Uses',
          roadName,
          lat,
          lon,
          distance,
          roadNumber || 'N/A',
          forestName || 'N/A',
          'Closed to Motorized Uses',
          roadId || 'N/A',
          attributesJson,
          'USFS'
        ]);
      });
    } else if (key === 'usfs_system_roads_all' && Array.isArray(value)) {
      value.forEach((road: any) => {
        const roadName = road.roadName || road.ROADNAME || road.RoadName || road.roadNumber || road.ROADNUMBER || 'Unknown Road';
        const roadNumber = road.roadNumber || road.ROADNUMBER || road.RoadNumber || '';
        const forestName = road.forestName || road.FORESTNAME || road.ForestName || '';
        const roadType = road.roadType || road.ROADTYPE || road.RoadType || '';
        const roadId = road.objectId || road.OBJECTID || road.objectid || '';
        const distance = road.distance_miles !== null && road.distance_miles !== undefined ? road.distance_miles.toFixed(2) : '';
        
        let lat = '';
        let lon = '';
        if (road.geometry && road.geometry.paths && road.geometry.paths.length > 0 && road.geometry.paths[0].length > 0) {
          const firstCoord = road.geometry.paths[0][0];
          lat = firstCoord[1].toString();
          lon = firstCoord[0].toString();
        }
        
        const allAttributes = { ...road };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.roadName;
        delete allAttributes.ROADNAME;
        delete allAttributes.RoadName;
        delete allAttributes.roadNumber;
        delete allAttributes.ROADNUMBER;
        delete allAttributes.RoadNumber;
        delete allAttributes.forestName;
        delete allAttributes.FORESTNAME;
        delete allAttributes.ForestName;
        delete allAttributes.roadType;
        delete allAttributes.ROADTYPE;
        delete allAttributes.RoadType;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'USFS',
          (location.confidence || 'N/A').toString(),
          'USFS_System_Roads',
          roadName,
          lat,
          lon,
          distance,
          roadNumber || 'N/A',
          forestName || 'N/A',
          roadType || 'N/A',
          roadId || 'N/A',
          attributesJson,
          'USFS'
        ]);
      });
    } else if (key === 'usfs_mvum_all' && Array.isArray(value)) {
      value.forEach((route: any) => {
        const routeName = route.routeName || route.ROUTENAME || route.RouteName || route.routeNumber || route.ROUTENUMBER || 'Unknown Route';
        const routeNumber = route.routeNumber || route.ROUTENUMBER || route.RouteNumber || '';
        const forestName = route.forestName || route.FORESTNAME || route.ForestName || '';
        const vehicleType = route.vehicleType || route.VEHICLETYPE || route.VehicleType || '';
        const seasonOfUse = route.seasonOfUse || route.SEASONOFUSE || route.SeasonOfUse || '';
        const routeId = route.objectId || route.OBJECTID || route.objectid || '';
        const distance = route.distance_miles !== null && route.distance_miles !== undefined ? route.distance_miles.toFixed(2) : '';
        
        let lat = '';
        let lon = '';
        if (route.geometry && route.geometry.paths && route.geometry.paths.length > 0 && route.geometry.paths[0].length > 0) {
          const firstCoord = route.geometry.paths[0][0];
          lat = firstCoord[1].toString();
          lon = firstCoord[0].toString();
        }
        
        const allAttributes = { ...route };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.routeName;
        delete allAttributes.ROUTENAME;
        delete allAttributes.RouteName;
        delete allAttributes.routeNumber;
        delete allAttributes.ROUTENUMBER;
        delete allAttributes.RouteNumber;
        delete allAttributes.forestName;
        delete allAttributes.FORESTNAME;
        delete allAttributes.ForestName;
        delete allAttributes.vehicleType;
        delete allAttributes.VEHICLETYPE;
        delete allAttributes.VehicleType;
        delete allAttributes.seasonOfUse;
        delete allAttributes.SEASONOFUSE;
        delete allAttributes.SeasonOfUse;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'USFS',
          (location.confidence || 'N/A').toString(),
          'USFS_MVUM',
          routeName,
          lat,
          lon,
          distance,
          routeNumber || 'N/A',
          forestName || 'N/A',
          vehicleType || 'N/A',
          seasonOfUse || 'N/A',
          routeId || 'N/A',
          attributesJson,
          'USFS'
        ]);
      });
    } else if (key === 'usfs_co_roadless_areas_all' && Array.isArray(value)) {
      value.forEach((area: any) => {
        const areaName = area.areaName || area.AREANAME || area.AreaName || 'Unknown Roadless Area';
        const areaType = area.areaType || area.AREATYPE || area.AreaType || '';
        const forestName = area.forestName || area.FORESTNAME || area.ForestName || '';
        const areaId = area.objectId || area.OBJECTID || area.objectid || '';
        const isContaining = area.isContaining ? 'Yes' : 'No';
        const distance = area.distance_miles !== null && area.distance_miles !== undefined ? area.distance_miles.toFixed(2) : (area.isContaining ? '0.00' : '');
        
        let lat = '';
        let lon = '';
        if (area.geometry && area.geometry.rings && area.geometry.rings.length > 0) {
          const outerRing = area.geometry.rings[0];
          if (outerRing && outerRing.length > 0) {
            lat = outerRing[0][1].toString();
            lon = outerRing[0][0].toString();
          }
        }
        
        const allAttributes = { ...area };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.areaName;
        delete allAttributes.AREANAME;
        delete allAttributes.AreaName;
        delete allAttributes.areaType;
        delete allAttributes.AREATYPE;
        delete allAttributes.AreaType;
        delete allAttributes.forestName;
        delete allAttributes.FORESTNAME;
        delete allAttributes.ForestName;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'USFS',
          (location.confidence || 'N/A').toString(),
          'USFS_Colorado_Roadless_Areas',
          areaName,
          lat,
          lon,
          distance,
          isContaining,
          areaType || 'N/A',
          forestName || 'N/A',
          areaId || 'N/A',
          attributesJson,
          'USFS'
        ]);
      });
    } else if (key === 'houston_bikeways_all' && Array.isArray(value)) {
      value.forEach((bikeway: any) => {
        const bikewayName = bikeway.bikewayName || bikeway.NAME || bikeway.name || bikeway.NAME1 || bikeway.name1 || bikeway.BIKEWAY_NAME || bikeway.bikeway_name || bikeway.STREET_NAME || bikeway.street_name || 'Unknown Bikeway';
        const bikewayType = bikeway.bikewayType || bikeway.TYPE || bikeway.type || bikeway.BIKEWAY_TYPE || bikeway.bikeway_type || bikeway.TYPE_DESC || bikeway.type_desc || '';
        const bikewayId = bikeway.objectId || bikeway.OBJECTID || bikeway.objectid || '';
        const distance = bikeway.distance_miles !== null && bikeway.distance_miles !== undefined ? bikeway.distance_miles.toFixed(2) : '';
        
        // Extract coordinates from geometry (polyline - use first coordinate)
        let lat = '';
        let lon = '';
        if (bikeway.geometry) {
          // Line geometry (use first coordinate)
          if (bikeway.geometry.paths && bikeway.geometry.paths.length > 0 && bikeway.geometry.paths[0].length > 0) {
            const firstCoord = bikeway.geometry.paths[0][0];
            lat = firstCoord[1].toString();
            lon = firstCoord[0].toString();
          }
        }
        
        const allAttributes = { ...bikeway };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.bikewayName;
        delete allAttributes.NAME;
        delete allAttributes.name;
        delete allAttributes.NAME1;
        delete allAttributes.name1;
        delete allAttributes.BIKEWAY_NAME;
        delete allAttributes.bikeway_name;
        delete allAttributes.STREET_NAME;
        delete allAttributes.street_name;
        delete allAttributes.bikewayType;
        delete allAttributes.TYPE;
        delete allAttributes.type;
        delete allAttributes.BIKEWAY_TYPE;
        delete allAttributes.bikeway_type;
        delete allAttributes.TYPE_DESC;
        delete allAttributes.type_desc;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'City of Houston',
          (location.confidence || 'N/A').toString(),
          'Houston_Bikeways',
          bikewayName,
          lat,
          lon,
          distance,
          bikewayType || 'N/A',
          bikewayId || 'N/A',
          attributesJson,
          'City of Houston'
        ]);
      });
    } else if (key === 'houston_tirz_all' && Array.isArray(value)) {
      value.forEach((zone: any) => {
        const name = zone.name || zone.NAME || 'Unknown Zone';
        const siteNo = zone.siteNo !== null && zone.siteNo !== undefined ? zone.siteNo.toString() : (zone.SITENO !== null && zone.SITENO !== undefined ? zone.SITENO.toString() : '');
        const zoneId = zone.objectId || zone.OBJECTID || zone.objectid || '';
        const perimeter = zone.perimeter !== null && zone.perimeter !== undefined ? zone.perimeter.toFixed(2) : (zone.PERIMETER !== null && zone.PERIMETER !== undefined ? zone.PERIMETER.toFixed(2) : '');
        const shapeArea = zone.shapeArea !== null && zone.shapeArea !== undefined ? zone.shapeArea : (zone.Shape__Area !== null && zone.Shape__Area !== undefined ? zone.Shape__Area : null);
        const areaAcres = shapeArea ? (shapeArea * 0.000247105).toFixed(2) : '';
        const shapeLength = zone.shapeLength !== null && zone.shapeLength !== undefined ? zone.shapeLength.toFixed(2) : (zone.Shape__Length !== null && zone.Shape__Length !== undefined ? zone.Shape__Length.toFixed(2) : '');
        const distance = zone.distance_miles !== null && zone.distance_miles !== undefined ? zone.distance_miles.toFixed(2) : (zone.isContaining ? '0.00' : '');
        const isContaining = zone.isContaining ? 'Yes' : 'No';
        
        const allAttributes = { ...zone };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.name;
        delete allAttributes.NAME;
        delete allAttributes.siteNo;
        delete allAttributes.SITENO;
        delete allAttributes.perimeter;
        delete allAttributes.PERIMETER;
        delete allAttributes.shapeArea;
        delete allAttributes.Shape__Area;
        delete allAttributes.shape_area;
        delete allAttributes.shapeLength;
        delete allAttributes.Shape__Length;
        delete allAttributes.shape_length;
        delete allAttributes.globalId;
        delete allAttributes.GlobalID;
        delete allAttributes.GLOBALID;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'City of Houston',
          (location.confidence || 'N/A').toString(),
          'Houston_TIRZ',
          name,
          '', // POI_Latitude
          '', // POI_Longitude
          distance,
          siteNo || 'N/A',
          zoneId || 'N/A',
          perimeter || 'N/A',
          areaAcres || 'N/A',
          shapeLength || 'N/A',
          isContaining,
          attributesJson,
          'City of Houston'
        ]);
      });
    } else if (key === 'houston_affordability_all' && Array.isArray(value)) {
      value.forEach((tract: any) => {
        const tractId = tract.tractId || tract.TRACT || tract.tract || tract.TRACTCE || tract.tractce || `Tract ${tract.objectId || 'Unknown'}`;
        const htaIndex = tract.htaIndex !== null && tract.htaIndex !== undefined ? tract.htaIndex.toFixed(2) : (tract.HTA_INDEX !== null && tract.HTA_INDEX !== undefined ? tract.HTA_INDEX.toFixed(2) : 'N/A');
        const distance = tract.distance_miles !== null && tract.distance_miles !== undefined ? tract.distance_miles.toFixed(2) : (tract.isContaining ? '0.00' : '');
        const isContaining = tract.isContaining ? 'Yes' : 'No';
        
        // Extract coordinates from geometry (polygon - use first coordinate)
        let lat = '';
        let lon = '';
        if (tract.geometry && tract.geometry.rings && tract.geometry.rings.length > 0) {
          const outerRing = tract.geometry.rings[0];
          if (outerRing && outerRing.length > 0) {
            lat = outerRing[0][1].toString();
            lon = outerRing[0][0].toString();
          }
        }
        
        const allAttributes = { ...tract };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.tractId;
        delete allAttributes.TRACT;
        delete allAttributes.tract;
        delete allAttributes.TRACTCE;
        delete allAttributes.tractce;
        delete allAttributes.htaIndex;
        delete allAttributes.HTA_INDEX;
        delete allAttributes.hta_index;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'City of Houston',
          (location.confidence || 'N/A').toString(),
          'HOUSTON_AFFORDABILITY_TRACT',
          tractId,
          lat || location.lat.toString(),
          lon || location.lon.toString(),
          distance,
          htaIndex,
          isContaining,
          '', '', '', '', '', '',
          attributesJson,
          'City of Houston'
        ]);
      });
    } else if (key === 'satellite_viirs_fire_activity_all' && Array.isArray(value)) {
      value.forEach((hotspot: any) => {
        const objectId = hotspot.objectId || hotspot.OBJECTID || hotspot.attributes?.OBJECTID || 'Unknown';
        const distance = hotspot.distance !== null && hotspot.distance !== undefined ? hotspot.distance.toFixed(2) : '';
        
        // Extract coordinates from geometry (point)
        let lat = '';
        let lon = '';
        if (hotspot.geometry && hotspot.geometry.x !== undefined && hotspot.geometry.y !== undefined) {
          lat = hotspot.geometry.y.toString();
          lon = hotspot.geometry.x.toString();
        }
        
        // Extract attributes
        const attributes = hotspot.attributes || {};
        const confidence = attributes.CONFIDENCE || attributes.confidence || '';
        
        rows.push([
          result.location.name || '',
          result.location.lat?.toString() || '',
          result.location.lon?.toString() || '',
          'Satellite VIIRS Fire Activity',
          confidence,
          'Satellite VIIRS Fire Activity',
          `Hotspot ${objectId}`,
          lat,
          lon,
          distance,
          'Natural Hazards',
          '',
          '',
          '',
          'Satellite VIIRS Thermal Hotspots and Fire Activity'
        ]);
      });
    } else if (key === 'houston_fire_hydrants_all' && Array.isArray(value)) {
      value.forEach((hydrant: any) => {
        const address = hydrant.address || hydrant.ADDRESS || 'Unknown Location';
        const hydrantNumber = hydrant.hydrantNumber || hydrant.HYDRANTNUMBER || 'Unknown';
        const distance = hydrant.distance_miles !== null && hydrant.distance_miles !== undefined ? hydrant.distance_miles.toFixed(2) : '';
        
        // Extract coordinates from geometry (point)
        let lat = '';
        let lon = '';
        if (hydrant.geometry && hydrant.geometry.x !== undefined && hydrant.geometry.y !== undefined) {
          lat = hydrant.geometry.y.toString();
          lon = hydrant.geometry.x.toString();
        }
        
        const allAttributes = { ...hydrant };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.facilityId;
        delete allAttributes.FACILITYID;
        delete allAttributes.address;
        delete allAttributes.ADDRESS;
        delete allAttributes.hydrantNumber;
        delete allAttributes.HYDRANTNUMBER;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'City of Houston',
          (location.confidence || 'N/A').toString(),
          'HOUSTON_FIRE_HYDRANTS',
          hydrantNumber,
          lat || location.lat.toString(),
          lon || location.lon.toString(),
          distance,
          address,
          attributesJson,
          '',
          '',
          'City of Houston'
        ]);
      });
    } else if (key === 'la_county_historic_cultural_monuments_all' && Array.isArray(value)) {
      value.forEach((monument: any) => {
        const name = monument.name || monument.NAME || monument.Name || 'Unknown Monument';
        const distance = monument.distance_miles !== null && monument.distance_miles !== undefined ? monument.distance_miles.toFixed(2) : (monument.isContaining ? '0.00' : '');
        
        const allAttributes = { ...monument };
        delete allAttributes.monumentId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'City of Los Angeles',
          (location.confidence || 'N/A').toString(),
          'LA_COUNTY_HISTORIC_CULTURAL_MONUMENTS',
          name,
          location.lat.toString(),
          location.lon.toString(),
          distance,
          monument.isContaining ? 'Within Monument' : `Nearby Monument (${distance} miles)`,
          attributesJson,
          '',
          '',
          'City of Los Angeles'
        ]);
      });
    } else if (key === 'la_county_housing_lead_risk_all' && Array.isArray(value)) {
      value.forEach((area: any) => {
        const ct20 = area.ct20 || area.CT20 || area.Ct20 || 'Unknown';
        const housingRisk = area.housingRisk !== null && area.housingRisk !== undefined ? area.housingRisk.toFixed(1) : 'N/A';
        const distance = area.distance_miles !== null && area.distance_miles !== undefined ? area.distance_miles.toFixed(2) : (area.isContaining ? '0.00' : '');
        
        const allAttributes = { ...area };
        delete allAttributes.housingId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'LA County GeoHub',
          (location.confidence || 'N/A').toString(),
          'LA_COUNTY_HOUSING_LEAD_RISK',
          `Census Tract ${ct20} (Risk: ${housingRisk}%)`,
          location.lat.toString(),
          location.lon.toString(),
          distance,
          area.isContaining ? 'Within Risk Area' : `Nearby Risk Area (${distance} miles)`,
          attributesJson,
          '',
          '',
          'LA County GeoHub'
        ]);
      });
    } else if (key === 'la_county_school_district_boundaries_all' && Array.isArray(value)) {
      value.forEach((district: any) => {
        const districtName = district.districtName || district.LABEL || district.label || district.Name || district.NAME || 'Unknown District';
        const distance = district.isContaining ? '0.00' : '';
        
        const allAttributes = { ...district };
        delete allAttributes.districtId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.geometry;
        delete allAttributes.isContaining;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'LA County GeoHub',
          (location.confidence || 'N/A').toString(),
          'LA_COUNTY_SCHOOL_DISTRICT_BOUNDARIES',
          districtName,
          location.lat.toString(),
          location.lon.toString(),
          distance,
          district.isContaining ? 'Within District' : 'Nearby District',
          attributesJson,
          '',
          '',
          'LA County GeoHub'
        ]);
      });
    } else if (key === 'la_county_metro_lines_all' && Array.isArray(value)) {
      value.forEach((line: any) => {
        const name = line.name || line.NAME || line.Name || 'Unknown Line';
        const label = line.label || line.LABEL || line.Label || '';
        const status = line.status || line.STATUS || line.Status || '';
        const type = line.type || line.TYPE || line.Type || '';
        const distance = line.distance_miles !== null && line.distance_miles !== undefined ? line.distance_miles.toFixed(2) : '';
        
        const allAttributes = { ...line };
        delete allAttributes.lineId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'LA County Metro',
          (location.confidence || 'N/A').toString(),
          'LA_COUNTY_METRO_LINES',
          `${name}${label ? ` (${label})` : ''}`,
          location.lat.toString(),
          location.lon.toString(),
          distance,
          `${type || 'Metro'}${status ? ` - ${status}` : ''}`,
          attributesJson,
          '',
          '',
          'LA County Metro'
        ]);
      });
    } else if (key === 'la_county_street_inventory_all' && Array.isArray(value)) {
      value.forEach((street: any) => {
        const streetName = street.streetName || street.ST_NAME || street.st_name || street.Name || street.NAME || 'Unknown Street';
        const streetDir = street.streetDir || street.ST_DIR || street.st_dir || '';
        const streetType = street.streetType || street.ST_TYPE || street.st_type || '';
        const fullStreetName = [streetDir, streetName, streetType].filter(Boolean).join(' ').trim() || streetName;
        const pciStatus = street.pciStatus || street.PCI_STATUS || street.pci_status || '';
        const distance = street.distance_miles !== null && street.distance_miles !== undefined ? street.distance_miles.toFixed(2) : '';
        
        const allAttributes = { ...street };
        delete allAttributes.streetId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'LA County StreetsLA',
          (location.confidence || 'N/A').toString(),
          'LA_COUNTY_STREET_INVENTORY',
          fullStreetName,
          location.lat.toString(),
          location.lon.toString(),
          distance,
          pciStatus ? `PCI Status: ${pciStatus}` : 'Street Segment',
          attributesJson,
          '',
          '',
          'LA County StreetsLA'
        ]);
      });
    }
    
    // LA County LMS Data - Generic handler for all 193 layers
    if (key.startsWith('la_county_lms_') && key.endsWith('_all') && Array.isArray(value)) {
      const layerName = key.replace('la_county_', '').replace('_all', '').toUpperCase().replace(/_/g, '_');
      value.forEach((lmsFeature: any) => {
        const lmsId = lmsFeature.lmsId || lmsFeature.OBJECTID || lmsFeature.objectid || lmsFeature.ID || lmsFeature.id || lmsFeature.NAME || lmsFeature.Name || lmsFeature.name || 'Unknown';
        const distance = lmsFeature.distance_miles !== null && lmsFeature.distance_miles !== undefined ? lmsFeature.distance_miles.toFixed(2) : (lmsFeature.isContaining ? '0.00' : '');
        
        // Extract coordinates based on geometry type
        let lat = '';
        let lon = '';
        if (lmsFeature.geometry) {
          if (lmsFeature.geometry.x && lmsFeature.geometry.y) {
            // Point geometry
            lat = lmsFeature.geometry.y.toString();
            lon = lmsFeature.geometry.x.toString();
          } else if (lmsFeature.geometry.rings && lmsFeature.geometry.rings.length > 0) {
            // Polygon geometry - use first coordinate
            const firstCoord = lmsFeature.geometry.rings[0][0];
            lat = firstCoord[1].toString();
            lon = firstCoord[0].toString();
          } else if (lmsFeature.geometry.paths && lmsFeature.geometry.paths.length > 0) {
            // Polyline geometry - use first coordinate
            const firstCoord = lmsFeature.geometry.paths[0][0];
            lat = firstCoord[1].toString();
            lon = firstCoord[0].toString();
          }
        }
        
        const allAttributes = { ...lmsFeature };
        delete allAttributes.lmsId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.ID;
        delete allAttributes.id;
        delete allAttributes.NAME;
        delete allAttributes.Name;
        delete allAttributes.name;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'LA County LMS Data',
          (location.confidence || 'N/A').toString(),
          layerName,
          lmsId,
          lat || location.lat.toString(),
          lon || location.lon.toString(),
          distance,
          lmsFeature.isContaining ? 'Within Feature' : `Nearby Feature (${distance} miles)`,
          attributesJson,
          '',
          '',
          'LA County LMS Data'
        ]);
      });
    }
    
    // LA County Redistricting Data - Generic handler for all layers
    if (key.startsWith('la_county_redistricting_') && key.endsWith('_all') && Array.isArray(value)) {
      const layerName = key.replace('la_county_', '').replace('_all', '').toUpperCase().replace(/_/g, '_');
      value.forEach((redistricting: any) => {
        const redistrictingId = redistricting.redistrictingId || redistricting.COMMUNITY || redistricting.community || redistricting.COMMUNITY_NAME || redistricting.community_name || redistricting.NAME || redistricting.Name || redistricting.name || 'Unknown';
        const distance = redistricting.isContaining ? '0.00' : (redistricting.distance_miles !== null && redistricting.distance_miles !== undefined ? redistricting.distance_miles.toFixed(2) : '');
        
        // Extract coordinates from polygon geometry
        let lat = '';
        let lon = '';
        if (redistricting.geometry && redistricting.geometry.rings && redistricting.geometry.rings.length > 0) {
          const firstCoord = redistricting.geometry.rings[0][0];
          lat = firstCoord[1].toString();
          lon = firstCoord[0].toString();
        }
        
        const allAttributes = { ...redistricting };
        delete allAttributes.redistrictingId;
        delete allAttributes.COMMUNITY;
        delete allAttributes.community;
        delete allAttributes.COMMUNITY_NAME;
        delete allAttributes.community_name;
        delete allAttributes.NAME;
        delete allAttributes.Name;
        delete allAttributes.name;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.geometry;
        delete allAttributes.isContaining;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'LA County Redistricting Data',
          (location.confidence || 'N/A').toString(),
          layerName,
          redistrictingId,
          lat || location.lat.toString(),
          lon || location.lon.toString(),
          distance,
          redistricting.isContaining ? 'Within Boundary' : (distance ? `Nearby Boundary (${distance} miles)` : 'Nearby Boundary'),
          attributesJson,
          '',
          '',
          'LA County Redistricting Data 2011'
        ]);
      });
    }
    
    // LA County Transportation - Generic handler for all layers
    if ((key.startsWith('la_county_transportation') || 
         key.startsWith('la_county_milepost_markers') ||
         key.startsWith('la_county_rail_transportation') ||
         key.startsWith('la_county_freeways') ||
         key.startsWith('la_county_disaster_routes') ||
         key.startsWith('la_county_highway_shields') ||
         key.startsWith('la_county_metro_park_ride') ||
         key.startsWith('la_county_metro_stations') ||
         key.startsWith('la_county_metrolink') ||
         key.startsWith('la_county_metro_lines') ||
         key.startsWith('la_county_railroads')) && key.endsWith('_all') && Array.isArray(value)) {
      const layerName = key.replace('la_county_', '').replace('_all', '').toUpperCase().replace(/_/g, '_');
      value.forEach((transportation: any) => {
        const transportationId = transportation.transportationId || transportation.STATION_NAME || transportation.station_name || transportation.STATION || transportation.station || transportation.LINE || transportation.line || transportation.ROUTE || transportation.route || transportation.NAME || transportation.Name || transportation.name || 'Unknown';
        const distance = transportation.distance_miles !== null && transportation.distance_miles !== undefined ? transportation.distance_miles.toFixed(2) : '';
        
        // Extract coordinates from geometry
        let lat = '';
        let lon = '';
        if (transportation.geometry) {
          // Point geometry
          if (transportation.geometry.x !== undefined && transportation.geometry.y !== undefined) {
            lat = transportation.geometry.y.toString();
            lon = transportation.geometry.x.toString();
          }
          // Line geometry (use first coordinate)
          else if (transportation.geometry.paths && transportation.geometry.paths.length > 0 && transportation.geometry.paths[0].length > 0) {
            const firstCoord = transportation.geometry.paths[0][0];
            lat = firstCoord[1].toString();
            lon = firstCoord[0].toString();
          }
        }
        
        const allAttributes = { ...transportation };
        delete allAttributes.transportationId;
        delete allAttributes.STATION_NAME;
        delete allAttributes.station_name;
        delete allAttributes.STATION;
        delete allAttributes.station;
        delete allAttributes.LINE;
        delete allAttributes.line;
        delete allAttributes.ROUTE;
        delete allAttributes.route;
        delete allAttributes.NAME;
        delete allAttributes.Name;
        delete allAttributes.name;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'LA County Transportation',
          (location.confidence || 'N/A').toString(),
          layerName,
          transportationId,
          lat || location.lat.toString(),
          lon || location.lon.toString(),
          distance,
          distance ? `Nearby Feature (${distance} miles)` : 'Nearby Feature',
          attributesJson,
          '',
          '',
          'LA County Transportation'
        ]);
      });
    }
    
    // LA County Political Boundaries - Generic handler for all layers
    if (key.startsWith('la_county_political_boundaries_') && key.endsWith('_all') && Array.isArray(value)) {
      const layerName = key.replace('la_county_', '').replace('_all', '').toUpperCase().replace(/_/g, '_');
      value.forEach((boundary: any) => {
        const boundaryId = boundary.boundaryId || boundary.DISTRICT || boundary.district || boundary.DISTRICT_NUM || boundary.district_num || boundary.DISTRICT_NUMBER || boundary.district_number || boundary.NAME || boundary.Name || boundary.name || 'Unknown';
        const distance = boundary.isContaining ? '0.00' : '';
        
        // Extract coordinates from polygon geometry
        let lat = '';
        let lon = '';
        if (boundary.geometry && boundary.geometry.rings && boundary.geometry.rings.length > 0) {
          const firstCoord = boundary.geometry.rings[0][0];
          lat = firstCoord[1].toString();
          lon = firstCoord[0].toString();
        }
        
        const allAttributes = { ...boundary };
        delete allAttributes.boundaryId;
        delete allAttributes.DISTRICT;
        delete allAttributes.district;
        delete allAttributes.DISTRICT_NUM;
        delete allAttributes.district_num;
        delete allAttributes.DISTRICT_NUMBER;
        delete allAttributes.district_number;
        delete allAttributes.NAME;
        delete allAttributes.Name;
        delete allAttributes.name;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.geometry;
        delete allAttributes.isContaining;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'LA County Registrar/Recorder',
          (location.confidence || 'N/A').toString(),
          layerName,
          boundaryId,
          lat || location.lat.toString(),
          lon || location.lon.toString(),
          distance,
          boundary.isContaining ? 'Within Boundary' : 'Nearby Boundary',
          attributesJson,
          '',
          '',
          'LA County Registrar/Recorder'
        ]);
      });
    }
    
    // Add LA County Basemaps and Grids data rows
    const basemapsGridsLayerMap: Record<string, { name: string, icon: string }> = {
      'la_county_us_national_grid_all': { name: 'LA_COUNTY_US_NATIONAL_GRID', icon: '🗺️' },
      'la_county_usng_100k_all': { name: 'LA_COUNTY_USNG_100K', icon: '🗺️' },
      'la_county_usng_10000m_all': { name: 'LA_COUNTY_USNG_10000M', icon: '🗺️' },
      'la_county_usng_1000m_all': { name: 'LA_COUNTY_USNG_1000M', icon: '🗺️' },
      'la_county_usng_100m_all': { name: 'LA_COUNTY_USNG_100M', icon: '🗺️' },
      'la_county_township_range_section_rancho_boundaries_all': { name: 'LA_COUNTY_TOWNSHIP_RANGE_SECTION_RANCHO_BOUNDARIES', icon: '📐' },
      'us_national_grid_usng_6x8_zones_all': { name: 'US_NATIONAL_GRID_USNG_6X8_ZONES', icon: '🗺️' },
      'us_national_grid_usng_100000m_all': { name: 'US_NATIONAL_GRID_USNG_100000M', icon: '🗺️' },
      'us_national_grid_usng_10000m_all': { name: 'US_NATIONAL_GRID_USNG_10000M', icon: '🗺️' },
      'us_national_grid_usng_1000m_all': { name: 'US_NATIONAL_GRID_USNG_1000M', icon: '🗺️' },
      'us_national_grid_usng_100m_all': { name: 'US_NATIONAL_GRID_USNG_100M', icon: '🗺️' }
    };
    
    // LA County Demographics - Generic handler for all 17 layers
    if (key.startsWith('la_county_demographics_') && key.endsWith('_all') && Array.isArray(value)) {
      const layerName = key.replace('la_county_', '').replace('_all', '').toUpperCase().replace(/_/g, '_');
      value.forEach((demographic: any) => {
        const demographicId = demographic.demographicId || demographic.GEOID || demographic.geoid || demographic.TRACT || demographic.tract || demographic.BLOCK_GROUP || demographic.block_group || demographic.BLOCK || demographic.block || 'Unknown';
        const distance = demographic.distance_miles !== null && demographic.distance_miles !== undefined ? demographic.distance_miles.toFixed(2) : (demographic.isContaining ? '0.00' : '');
        
        const allAttributes = { ...demographic };
        delete allAttributes.demographicId;
        delete allAttributes.GEOID;
        delete allAttributes.geoid;
        delete allAttributes.TRACT;
        delete allAttributes.tract;
        delete allAttributes.BLOCK_GROUP;
        delete allAttributes.block_group;
        delete allAttributes.BLOCK;
        delete allAttributes.block;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'LA County Public GIS',
          (location.confidence || 'N/A').toString(),
          `LA_COUNTY_${layerName}`,
          `📊 Demographic ${demographicId}`,
          location.lat.toString(),
          location.lon.toString(),
          distance,
          demographic.isContaining ? 'Within Boundary' : 'Nearby Boundary',
          attributesJson,
          '',
          '',
          'LA County Public GIS'
        ]);
      });
    } else if (key.startsWith('la_county_elevation_') && key.endsWith('_all') && Array.isArray(value)) {
      const layerName = key.replace('la_county_', '').replace('_all', '').toUpperCase().replace(/_/g, '_');
      value.forEach((elevation: any) => {
        const elevationId = elevation.elevationId || elevation.ELEVATION || elevation.Elevation || elevation.CONTOUR || elevation.Contour || 'Unknown';
        const distance = elevation.distance_miles !== null && elevation.distance_miles !== undefined ? elevation.distance_miles.toFixed(2) : '';
        
        const allAttributes = { ...elevation };
        delete allAttributes.elevationId;
        delete allAttributes.ELEVATION;
        delete allAttributes.Elevation;
        delete allAttributes.elevation;
        delete allAttributes.CONTOUR;
        delete allAttributes.Contour;
        delete allAttributes.contour;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'LA County Public GIS',
          (location.confidence || 'N/A').toString(),
          `LA_COUNTY_${layerName}`,
          `⛰️ Elevation ${elevationId}`,
          location.lat.toString(),
          location.lon.toString(),
          distance,
          'Nearby',
          attributesJson,
          '',
          '',
          'LA County Public GIS'
        ]);
      });
    } else if (key.startsWith('la_county_admin_boundaries_') && key.endsWith('_all') && Array.isArray(value)) {
      const layerName = key.replace('la_county_', '').replace('_all', '').toUpperCase().replace(/_/g, '_');
      value.forEach((boundary: any) => {
        const boundaryId = boundary.boundaryId || boundary.NAME || boundary.Name || boundary.name || boundary.OBJECTID || boundary.objectid || 'Unknown';
        const distance = boundary.distance_miles !== null && boundary.distance_miles !== undefined ? boundary.distance_miles.toFixed(2) : (boundary.isContaining ? '0.00' : '');
        
        const allAttributes = { ...boundary };
        delete allAttributes.boundaryId;
        delete allAttributes.NAME;
        delete allAttributes.Name;
        delete allAttributes.name;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'LA County Public GIS',
          (location.confidence || 'N/A').toString(),
          `LA_COUNTY_${layerName}`,
          `🗺️ Administrative Boundary ${boundaryId}`,
          location.lat.toString(),
          location.lon.toString(),
          distance,
          boundary.isContaining ? 'Within Boundary' : 'Nearby Boundary',
          attributesJson,
          '',
          '',
          'LA County Public GIS'
        ]);
      });
    } else if (key.startsWith('la_county_infrastructure_') && key.endsWith('_all') && Array.isArray(value)) {
      const layerName = key.replace('la_county_', '').replace('_all', '').toUpperCase().replace(/_/g, '_');
      value.forEach((infrastructure: any) => {
        const infrastructureId = infrastructure.infrastructureId || infrastructure.LACO || infrastructure.laco || infrastructure.OBJECTID || infrastructure.objectid || 'Unknown';
        const distance = infrastructure.distance_miles !== null && infrastructure.distance_miles !== undefined ? infrastructure.distance_miles.toFixed(2) : (infrastructure.isContaining ? '0.00' : '');
        
        const allAttributes = { ...infrastructure };
        delete allAttributes.infrastructureId;
        delete allAttributes.LACO;
        delete allAttributes.laco;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'LA County Public GIS',
          (location.confidence || 'N/A').toString(),
          `LA_COUNTY_${layerName}`,
          `🏛️ Infrastructure Feature ${infrastructureId}`,
          location.lat.toString(),
          location.lon.toString(),
          distance,
          infrastructure.isContaining ? 'Within Feature' : 'Nearby Feature',
          attributesJson,
          '',
          '',
          'LA County Public GIS'
        ]);
      });
    } else if (key.startsWith('la_county_hydrology_') && key.endsWith('_all') && Array.isArray(value)) {
      const layerName = key.replace('la_county_', '').replace('_all', '').toUpperCase().replace(/_/g, '_');
      value.forEach((hydrology: any) => {
        const hydrologyId = hydrology.hydrologyId || hydrology.OBJECTID || hydrology.objectid || 'Unknown';
        const distance = hydrology.distance_miles !== null && hydrology.distance_miles !== undefined ? hydrology.distance_miles.toFixed(2) : (hydrology.isContaining ? '0.00' : '');
        
        const allAttributes = { ...hydrology };
        delete allAttributes.hydrologyId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'LA County Public GIS',
          (location.confidence || 'N/A').toString(),
          `LA_COUNTY_${layerName}`,
          `💧 Hydrology Feature ${hydrologyId}`,
          location.lat.toString(),
          location.lon.toString(),
          distance,
          hydrology.isContaining ? 'Within Feature' : 'Nearby Feature',
          attributesJson,
          '',
          '',
          'LA County Public GIS'
        ]);
      });
    } else if (basemapsGridsLayerMap[key] && Array.isArray(value)) {
      const layerInfo = basemapsGridsLayerMap[key];
      const isUSNationalGrid = key.startsWith('us_national_grid_');
      const dataSource = isUSNationalGrid ? 'USGS The National Map' : 'LA County Public GIS';
      value.forEach((grid: any) => {
        const gridId = grid.gridId || grid.OBJECTID || grid.objectid || 'Unknown';
        const distance = grid.distance_miles !== null && grid.distance_miles !== undefined 
          ? grid.distance_miles.toFixed(2) 
          : (grid.isContaining ? '0.00' : '');
        
        const allAttributes = { ...grid };
        delete allAttributes.gridId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.geometry;
        delete allAttributes.isContaining;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          dataSource,
          (location.confidence || 'N/A').toString(),
          layerInfo.name,
          `Grid ${gridId}`,
          location.lat.toString(),
          location.lon.toString(),
          distance,
          grid.isContaining ? 'Within Grid/Boundary' : 'Nearby Grid/Boundary',
          attributesJson,
          '',
          '',
          dataSource
        ]);
      });
    }
    
    // Add US Historical Cultural Political Points data rows
    if (key === 'us_historical_cultural_political_points_all' && Array.isArray(value)) {
      value.forEach((point: any) => {
        const pointName = point.gaz_name || point.GAZ_NAME || point.name || 'Unknown';
        const distance = point.distance_miles !== null && point.distance_miles !== undefined ? point.distance_miles.toFixed(2) : '';
        
        // Extract coordinates from geometry
        let pointLat = '';
        let pointLon = '';
        if (point.geometry) {
          if (point.geometry.points && point.geometry.points.length > 0) {
            pointLon = point.geometry.points[0][0].toString();
            pointLat = point.geometry.points[0][1].toString();
          } else if (point.geometry.x !== undefined && point.geometry.y !== undefined) {
            pointLon = point.geometry.x.toString();
            pointLat = point.geometry.y.toString();
          }
        }
        
        const allAttributes = { ...point };
        delete allAttributes.pointId;
        delete allAttributes.gaz_id;
        delete allAttributes.GAZ_ID;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'USGS The National Map',
          (location.confidence || 'N/A').toString(),
          'US_HISTORICAL_CULTURAL_POLITICAL_POINTS',
          `🏛️ ${pointName}`,
          pointLat || location.lat.toString(),
          pointLon || location.lon.toString(),
          distance,
          'Nearby Point',
          attributesJson,
          '',
          '',
          'USGS The National Map'
        ]);
      });
    }
    
    // Add US Historical Hydrographic Points data rows
    if (key === 'us_historical_hydrographic_points_all' && Array.isArray(value)) {
      value.forEach((point: any) => {
        const pointName = point.gaz_name || point.GAZ_NAME || point.name || 'Unknown';
        const distance = point.distance_miles !== null && point.distance_miles !== undefined ? point.distance_miles.toFixed(2) : '';
        
        // Extract coordinates from geometry
        let pointLat = '';
        let pointLon = '';
        if (point.geometry) {
          if (point.geometry.points && point.geometry.points.length > 0) {
            pointLon = point.geometry.points[0][0].toString();
            pointLat = point.geometry.points[0][1].toString();
          } else if (point.geometry.x !== undefined && point.geometry.y !== undefined) {
            pointLon = point.geometry.x.toString();
            pointLat = point.geometry.y.toString();
          }
        }
        
        const allAttributes = { ...point };
        delete allAttributes.pointId;
        delete allAttributes.gaz_id;
        delete allAttributes.GAZ_ID;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'USGS The National Map',
          (location.confidence || 'N/A').toString(),
          'US_HISTORICAL_HYDROGRAPHIC_POINTS',
          `💧 ${pointName}`,
          pointLat || location.lat.toString(),
          pointLon || location.lon.toString(),
          distance,
          'Nearby Point',
          attributesJson,
          '',
          '',
          'USGS The National Map'
        ]);
      });
    }
    
    // Add US Historical Physical Points data rows
    if (key === 'us_historical_physical_points_all' && Array.isArray(value)) {
      value.forEach((point: any) => {
        const pointName = point.gaz_name || point.GAZ_NAME || point.name || 'Unknown';
        const distance = point.distance_miles !== null && point.distance_miles !== undefined ? point.distance_miles.toFixed(2) : '';
        
        // Extract coordinates from geometry
        let pointLat = '';
        let pointLon = '';
        if (point.geometry) {
          if (point.geometry.points && point.geometry.points.length > 0) {
            pointLon = point.geometry.points[0][0].toString();
            pointLat = point.geometry.points[0][1].toString();
          } else if (point.geometry.x !== undefined && point.geometry.y !== undefined) {
            pointLon = point.geometry.x.toString();
            pointLat = point.geometry.y.toString();
          }
        }
        
        const allAttributes = { ...point };
        delete allAttributes.pointId;
        delete allAttributes.gaz_id;
        delete allAttributes.GAZ_ID;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'USGS The National Map',
          (location.confidence || 'N/A').toString(),
          'US_HISTORICAL_PHYSICAL_POINTS',
          `🏔️ ${pointName}`,
          pointLat || location.lat.toString(),
          pointLon || location.lon.toString(),
          distance,
          'Nearby Point',
          attributesJson,
          '',
          '',
          'USGS The National Map'
        ]);
      });
    }
    
    // Add Hurricane Evacuation Routes data rows
    if (key === 'hurricane_evacuation_routes_all' && Array.isArray(value)) {
      value.forEach((route: any) => {
        const routeName = route.NAME || route.name || route.ROUTE_NAME || route.route_name || 'Unknown Route';
        const distance = route.distance_miles !== null && route.distance_miles !== undefined ? route.distance_miles.toFixed(2) : '';
        
        // Extract coordinates from geometry (polyline paths)
        let routeCoords = '';
        if (route.geometry && route.geometry.paths && route.geometry.paths.length > 0) {
          // Get first point of first path for CSV coordinate representation
          const firstPath = route.geometry.paths[0];
          if (firstPath && firstPath.length > 0) {
            const firstPoint = firstPath[0];
            routeCoords = `${firstPoint[1]},${firstPoint[0]}`; // lat,lon
          }
        }
        
        const allAttributes = { ...route };
        delete allAttributes.routeId;
        delete allAttributes.ROUTE_ID;
        delete allAttributes.route_id;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'USGS The National Map',
          (location.confidence || 'N/A').toString(),
          'HURRICANE_EVACUATION_ROUTES',
          `🌀 ${routeName}`,
          routeCoords ? routeCoords.split(',')[0] : location.lat.toString(),
          routeCoords ? routeCoords.split(',')[1] : location.lon.toString(),
          distance,
          'Nearby Route',
          attributesJson,
          '',
          '',
          'USGS The National Map'
        ]);
      });
    }
    
    // Add Hurricane Evacuation Routes (Natural Hazards) data rows
    if (key === 'hurricane_evacuation_routes_hazards_all' && Array.isArray(value)) {
      value.forEach((route: any) => {
        const routeName = route.NAME || route.name || route.ROUTE_NAME || route.route_name || 'Unknown Route';
        const distance = route.distance_miles !== null && route.distance_miles !== undefined ? route.distance_miles.toFixed(2) : '';
        
        // Extract coordinates from geometry (polyline paths)
        let routeCoords = '';
        if (route.geometry && route.geometry.paths && route.geometry.paths.length > 0) {
          // Get first point of first path for CSV coordinate representation
          const firstPath = route.geometry.paths[0];
          if (firstPath && firstPath.length > 0) {
            const firstPoint = firstPath[0];
            routeCoords = `${firstPoint[1]},${firstPoint[0]}`; // lat,lon
          }
        }
        
        const allAttributes = { ...route };
        delete allAttributes.routeId;
        delete allAttributes.ROUTE_ID;
        delete allAttributes.route_id;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'USGS The National Map',
          (location.confidence || 'N/A').toString(),
          'HURRICANE_EVACUATION_ROUTES',
          `🌀 ${routeName}`,
          routeCoords ? routeCoords.split(',')[0] : location.lat.toString(),
          routeCoords ? routeCoords.split(',')[1] : location.lon.toString(),
          distance,
          'Nearby Route',
          attributesJson,
          '',
          '',
          'USGS The National Map'
        ]);
      });
    }
    
    // Add USGS Government Units data rows
    if (key.startsWith('usgs_gov_') && key.endsWith('_all') && Array.isArray(value)) {
      const layerName = key.replace('usgs_gov_', '').replace('_all', '').toUpperCase().replace(/_/g, '_');
      const layerDisplayNames: Record<string, string> = {
        'INCORPORATED_PLACE': 'USGS_INCORPORATED_PLACE',
        'UNINCORPORATED_PLACE': 'USGS_UNINCORPORATED_PLACE',
        'MINOR_CIVIL_DIVISION': 'USGS_MINOR_CIVIL_DIVISION',
        'NATIVE_AMERICAN_AREA': 'USGS_NATIVE_AMERICAN_AREA',
        'NATIONAL_PARK': 'USGS_NATIONAL_PARK',
        'NATIONAL_FOREST': 'USGS_NATIONAL_FOREST',
        'NATIONAL_WILDERNESS': 'USGS_NATIONAL_WILDERNESS',
        'FISH_WILDLIFE_SERVICE': 'USGS_FISH_WILDLIFE_SERVICE',
        'NATIONAL_GRASSLAND': 'USGS_NATIONAL_GRASSLAND',
        'NATIONAL_CEMETERY': 'USGS_NATIONAL_CEMETERY',
        'MILITARY_RESERVE': 'USGS_MILITARY_RESERVE',
        'NASA_FACILITY': 'USGS_NASA_FACILITY',
        'MET_WASHINGTON_AIRPORT': 'USGS_MET_WASHINGTON_AIRPORT',
        'TENNESSEE_VALLEY_AUTHORITY': 'USGS_TENNESSEE_VALLEY_AUTHORITY',
        'BUREAU_LAND_MANAGEMENT': 'USGS_BUREAU_LAND_MANAGEMENT',
        'CONGRESSIONAL_DISTRICT': 'USGS_CONGRESSIONAL_DISTRICT',
        'COUNTY_EQUIVALENT': 'USGS_COUNTY_EQUIVALENT',
        'STATE_TERRITORY_SMALL_SCALE': 'USGS_STATE_TERRITORY_SMALL_SCALE',
        'STATE_TERRITORY_LARGE_SCALE': 'USGS_STATE_TERRITORY_LARGE_SCALE'
      };
      const displayName = layerDisplayNames[layerName] || `USGS_${layerName}`;
      
      value.forEach((unit: any) => {
        const unitId = unit.unitId || unit.OBJECTID || unit.objectid || 'Unknown';
        const unitName = unit.NAME || unit.name || unit.FULL_NAME || unit.full_name || unitId;
        const distance = unit.distance_miles !== null && unit.distance_miles !== undefined 
          ? unit.distance_miles.toFixed(2) 
          : (unit.isContaining ? '0.00' : '');
        
        const allAttributes = { ...unit };
        delete allAttributes.unitId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.geometry;
        delete allAttributes.isContaining;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'USGS The National Map',
          (location.confidence || 'N/A').toString(),
          displayName,
          `🏛️ ${unitName}`,
          location.lat.toString(),
          location.lon.toString(),
          distance,
          unit.isContaining ? 'Within Boundary' : 'Nearby Boundary',
          attributesJson,
          '',
          '',
          'USGS The National Map'
        ]);
      });
    }
    
    // Add DC Urban Tree Canopy data rows
    if (key.startsWith('dc_utc_') && key.endsWith('_all') && Array.isArray(value)) {
      value.forEach((feature: any) => {
        const featureName = feature.NAME || feature.name || feature.OBJECTID || feature.objectid || 'Unknown Feature';
        const distance = feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : '';
        
        // Extract coordinates from geometry
        let featureLat = '';
        let featureLon = '';
        if (feature.geometry) {
          if (feature.geometry.rings && feature.geometry.rings.length > 0) {
            // Polygon - use centroid of first ring
            const ring = feature.geometry.rings[0];
            if (ring && ring.length > 0) {
              let sumLat = 0;
              let sumLon = 0;
              ring.forEach((coord: number[]) => {
                sumLon += coord[0];
                sumLat += coord[1];
              });
              featureLat = (sumLat / ring.length).toString();
              featureLon = (sumLon / ring.length).toString();
            }
          } else if (feature.geometry.x !== undefined && feature.geometry.y !== undefined) {
            featureLon = feature.geometry.x.toString();
            featureLat = feature.geometry.y.toString();
          } else if (feature.geometry.points && feature.geometry.points.length > 0) {
            const firstPoint = feature.geometry.points[0];
            featureLon = firstPoint[0].toString();
            featureLat = firstPoint[1].toString();
          }
        }
        
        const allAttributes = { ...feature };
        delete allAttributes.objectid;
        delete allAttributes.OBJECTID;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        const attributesJson = JSON.stringify(allAttributes);
        
        const layerName = key.replace('dc_utc_', '').replace('_all', '').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'DC Urban Tree Canopy',
          (location.confidence || 'N/A').toString(),
          `DC_URBAN_TREE_CANOPY_${layerName.toUpperCase().replace(/\s+/g, '_')}`,
          `🌳 ${featureName}`,
          featureLat || location.lat.toString(),
          featureLon || location.lon.toString(),
          distance,
          feature.isContaining ? 'Containing Feature' : 'Nearby Feature',
          attributesJson,
          '',
          '',
          'DC Urban Tree Canopy'
        ]);
      });
    }
    
    // Add DC Bike Trails data rows
    if (key.startsWith('dc_bike_') && key.endsWith('_all') && Array.isArray(value)) {
      value.forEach((feature: any) => {
        const featureName = feature.NAME || feature.name || feature.LOCATION || feature.location || feature.ROUTE_NAME || feature.route_name || feature.OBJECTID || feature.objectid || 'Unknown Feature';
        const distance = feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : '';
        
        // Extract coordinates from geometry (polyline or point)
        let featureLat = '';
        let featureLon = '';
        if (feature.geometry) {
          if (feature.geometry.paths && feature.geometry.paths.length > 0) {
            // Polyline - use first point of first path
            const firstPath = feature.geometry.paths[0];
            if (firstPath && firstPath.length > 0) {
              featureLon = firstPath[0][0].toString();
              featureLat = firstPath[0][1].toString();
            }
          } else if (feature.geometry.x !== undefined && feature.geometry.y !== undefined) {
            featureLon = feature.geometry.x.toString();
            featureLat = feature.geometry.y.toString();
          } else if (feature.geometry.points && feature.geometry.points.length > 0) {
            const firstPoint = feature.geometry.points[0];
            featureLon = firstPoint[0].toString();
            featureLat = firstPoint[1].toString();
          }
        }
        
        const allAttributes = { ...feature };
        delete allAttributes.objectid;
        delete allAttributes.OBJECTID;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        const layerName = key.replace('dc_bike_', '').replace('_all', '').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'District of Columbia Open Data',
          (location.confidence || 'N/A').toString(),
          `DC_BIKE_TRAILS_${layerName.toUpperCase().replace(/\s+/g, '_')}`,
          `🚴 ${featureName}`,
          featureLat || location.lat.toString(),
          featureLon || location.lon.toString(),
          distance,
          'Nearby Feature',
          attributesJson,
          '',
          '',
          'DCGIS FeatureServer'
        ]);
      });
    }
    
    // Add DC Property and Land data rows
    if (key.startsWith('dc_property_') && key.endsWith('_all') && Array.isArray(value)) {
      value.forEach((feature: any) => {
        const featureName = feature.NAME || feature.name || feature.LOCATION || feature.location || feature.ROUTE_NAME || feature.route_name || feature.OBJECTID || feature.objectid || 'Unknown Feature';
        const distance = feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : '';
        
        // Extract coordinates from geometry (polygon, polyline, or point)
        let featureLat = '';
        let featureLon = '';
        if (feature.geometry) {
          if (feature.geometry.rings && feature.geometry.rings.length > 0) {
            // Polygon - use centroid of first ring
            const ring = feature.geometry.rings[0];
            if (ring && ring.length > 0) {
              let sumLat = 0;
              let sumLon = 0;
              ring.forEach((coord: number[]) => {
                sumLon += coord[0];
                sumLat += coord[1];
              });
              featureLat = (sumLat / ring.length).toString();
              featureLon = (sumLon / ring.length).toString();
            }
          } else if (feature.geometry.paths && feature.geometry.paths.length > 0) {
            // Polyline - use first point of first path
            const firstPath = feature.geometry.paths[0];
            if (firstPath && firstPath.length > 0) {
              featureLon = firstPath[0][0].toString();
              featureLat = firstPath[0][1].toString();
            }
          } else if (feature.geometry.x !== undefined && feature.geometry.y !== undefined) {
            featureLon = feature.geometry.x.toString();
            featureLat = feature.geometry.y.toString();
          } else if (feature.geometry.points && feature.geometry.points.length > 0) {
            const firstPoint = feature.geometry.points[0];
            featureLon = firstPoint[0].toString();
            featureLat = firstPoint[1].toString();
          }
        }
        
        const allAttributes = { ...feature };
        delete allAttributes.objectid;
        delete allAttributes.OBJECTID;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        const attributesJson = JSON.stringify(allAttributes);
        
        const layerName = key.replace('dc_property_', '').replace('_all', '').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'District of Columbia Open Data',
          (location.confidence || 'N/A').toString(),
          `DC_PROPERTY_LAND_${layerName.toUpperCase().replace(/\s+/g, '_')}`,
          `🏢 ${featureName}`,
          featureLat || location.lat.toString(),
          featureLon || location.lon.toString(),
          distance,
          feature.isContaining ? 'Containing Feature' : 'Nearby Feature',
          attributesJson,
          '',
          '',
          'DCGIS FeatureServer'
        ]);
      });
    }
    
    // Add TNM Structures data rows
    if (key === 'tnm_structures_all' && Array.isArray(value)) {
      value.forEach((structure: any) => {
        const structureName = structure.NAME || structure.name || structure.STRUCTURE_NAME || structure.structure_name || 'Unknown Structure';
        const structureType = structure.TYPE || structure.type || structure.STRUCTURE_TYPE || structure.structure_type || structure.FUNCTION || structure.function || 'Unknown';
        const distance = structure.distance_miles !== null && structure.distance_miles !== undefined ? structure.distance_miles.toFixed(2) : '';
        
        // Extract coordinates from geometry
        let structureLat = '';
        let structureLon = '';
        if (structure.geometry) {
          if (structure.geometry.points && structure.geometry.points.length > 0) {
            structureLon = structure.geometry.points[0][0].toString();
            structureLat = structure.geometry.points[0][1].toString();
          } else if (structure.geometry.x !== undefined && structure.geometry.y !== undefined) {
            structureLon = structure.geometry.x.toString();
            structureLat = structure.geometry.y.toString();
          }
        }
        
        const allAttributes = { ...structure };
        delete allAttributes.structureId;
        delete allAttributes.STRUCTURE_ID;
        delete allAttributes.structure_id;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'USGS The National Map',
          (location.confidence || 'N/A').toString(),
          'TNM_STRUCTURES',
          `🏢 ${structureName} (${structureType})`,
          structureLat || location.lat.toString(),
          structureLon || location.lon.toString(),
          distance,
          'Nearby Structure',
          attributesJson,
          '',
          '',
          'USGS The National Map'
        ]);
      });
    }
    
    // Add USGS Trails data rows
    if (key === 'usgs_trails_all' && Array.isArray(value)) {
      value.forEach((trail: any) => {
        const trailName = trail.name || trail.namealternate || 'Unknown Trail';
        const trailType = trail.trailtype || 'Unknown Type';
        const distance = trail.distance_miles !== null && trail.distance_miles !== undefined ? trail.distance_miles.toFixed(2) : '';
        
        // Extract coordinates from geometry (polyline paths)
        let trailCoords = '';
        if (trail.geometry && trail.geometry.paths && trail.geometry.paths.length > 0) {
          // Get first point of first path for CSV coordinate representation
          const firstPath = trail.geometry.paths[0];
          if (firstPath && firstPath.length > 0) {
            const firstPoint = firstPath[0];
            trailCoords = `${firstPoint[1]},${firstPoint[0]}`; // lat,lon
          }
        }
        
        const allAttributes = { ...trail };
        delete allAttributes.objectid;
        delete allAttributes.OBJECTID;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'USGS The National Map',
          (location.confidence || 'N/A').toString(),
          'USGS_TRAILS',
          `🥾 ${trailName} (${trailType})`,
          trailCoords ? trailCoords.split(',')[0] : location.lat.toString(),
          trailCoords ? trailCoords.split(',')[1] : location.lon.toString(),
          distance,
          'Nearby Trail',
          attributesJson,
          '',
          '',
          'USGS The National Map'
        ]);
      });
    }
    
    // Add USGS Transportation data rows
    const transportationLayerMap: Record<string, { name: string, icon: string }> = {
      'usgs_transportation_airport_all': { name: 'USGS_TRANSPORTATION_AIRPORT', icon: '✈️' },
      'usgs_transportation_airport_runway_all': { name: 'USGS_TRANSPORTATION_AIRPORT_RUNWAY', icon: '🛫' },
      'usgs_transportation_interstate_all': { name: 'USGS_TRANSPORTATION_INTERSTATE', icon: '🛣️' },
      'usgs_transportation_us_route_all': { name: 'USGS_TRANSPORTATION_US_ROUTE', icon: '🛣️' },
      'usgs_transportation_state_route_all': { name: 'USGS_TRANSPORTATION_STATE_ROUTE', icon: '🛣️' },
      'usgs_transportation_us_railroad_all': { name: 'USGS_TRANSPORTATION_US_RAILROAD', icon: '🚂' },
      'usgs_transportation_local_road_all': { name: 'USGS_TRANSPORTATION_LOCAL_ROAD', icon: '🛣️' },
      'usgs_transportation_trails_all': { name: 'USGS_TRANSPORTATION_TRAILS', icon: '🥾' }
    };
    
    if (transportationLayerMap[key] && Array.isArray(value)) {
      const layerInfo = transportationLayerMap[key];
      value.forEach((feature: any) => {
        // Try to find a name/identifier from common attribute fields
        const featureName = feature.name || feature.fullname || feature.route || feature.rtnumber || 
          feature.rtname || feature.rtnum || feature.facname || feature.facilityname || 
          feature.airportname || feature.runwayname || feature.trailname || 
          (feature.attributes ? (feature.attributes.name || feature.attributes.fullname || feature.attributes.route) : null) ||
          feature.layerName || 'Unknown';
        const distance = feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : '';
        
        // Extract coordinates from geometry
        let featureCoords = '';
        if (feature.geometry) {
          if (feature.geometry.paths && feature.geometry.paths.length > 0) {
            // Polyline geometry (roads, railroads, trails)
            const firstPath = feature.geometry.paths[0];
            if (firstPath && firstPath.length > 0) {
              const firstPoint = firstPath[0];
              featureCoords = `${firstPoint[1]},${firstPoint[0]}`; // lat,lon
            }
          } else if (feature.geometry.rings && feature.geometry.rings.length > 0) {
            // Polygon geometry (airports)
            const firstRing = feature.geometry.rings[0];
            if (firstRing && firstRing.length > 0) {
              const firstPoint = firstRing[0];
              featureCoords = `${firstPoint[1]},${firstPoint[0]}`; // lat,lon
            }
          } else if (feature.geometry.x && feature.geometry.y) {
            // Point geometry
            featureCoords = `${feature.geometry.y},${feature.geometry.x}`; // lat,lon
          }
        }
        
        const allAttributes = { ...feature };
        delete allAttributes.objectid;
        delete allAttributes.OBJECTID;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.layerId;
        delete allAttributes.layerName;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'USGS The National Map',
          (location.confidence || 'N/A').toString(),
          layerInfo.name,
          featureName,
          featureCoords ? featureCoords.split(',')[0] : location.lat.toString(),
          featureCoords ? featureCoords.split(',')[1] : location.lon.toString(),
          distance,
          `Nearby ${feature.layerName || layerInfo.name.replace('USGS_TRANSPORTATION_', '').replace(/_/g, ' ')}`,
          attributesJson,
          '',
          '',
          'USGS The National Map'
        ]);
      });
    }
    
    // Add USGS GeoNames data rows
    const geonamesLayerMap: Record<string, { name: string, icon: string }> = {
      'usgs_geonames_administrative_all': { name: 'USGS_GEONAMES_ADMINISTRATIVE', icon: '📍' },
      'usgs_geonames_transportation_all': { name: 'USGS_GEONAMES_TRANSPORTATION', icon: '🚗' },
      'usgs_geonames_landform_all': { name: 'USGS_GEONAMES_LANDFORM', icon: '⛰️' },
      'usgs_geonames_hydro_lines_all': { name: 'USGS_GEONAMES_HYDRO_LINES', icon: '💧' },
      'usgs_geonames_hydro_points_all': { name: 'USGS_GEONAMES_HYDRO_POINTS', icon: '💧' },
      'usgs_geonames_antarctica_all': { name: 'USGS_GEONAMES_ANTARCTICA', icon: '🧊' },
      'usgs_geonames_historical_all': { name: 'USGS_GEONAMES_HISTORICAL', icon: '📜' }
    };
    
    if (geonamesLayerMap[key] && Array.isArray(value)) {
      const layerInfo = geonamesLayerMap[key];
      value.forEach((feature: any) => {
        // Try to find a name/identifier from common attribute fields
        const featureName = feature.name || feature.FEATURE_NAME || feature.feature_name || 
          feature.GNIS_NAME || feature.gnis_name || feature.NAME || feature.NAME1 || 
          feature.NAME2 || feature.PRIMARY_NAME || feature.primary_name ||
          (feature.attributes ? (feature.attributes.name || feature.attributes.FEATURE_NAME || feature.attributes.GNIS_NAME) : null) ||
          feature.layerName || 'Unknown';
        const distance = feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : '';
        
        // Extract coordinates from geometry
        let featureCoords = '';
        if (feature.geometry) {
          if (feature.geometry.paths && feature.geometry.paths.length > 0) {
            // Polyline geometry (hydro lines, transportation)
            const firstPath = feature.geometry.paths[0];
            if (firstPath && firstPath.length > 0) {
              const firstPoint = firstPath[0];
              featureCoords = `${firstPoint[1]},${firstPoint[0]}`; // lat,lon
            }
          } else if (feature.geometry.rings && feature.geometry.rings.length > 0) {
            // Polygon geometry
            const firstRing = feature.geometry.rings[0];
            if (firstRing && firstRing.length > 0) {
              const firstPoint = firstRing[0];
              featureCoords = `${firstPoint[1]},${firstPoint[0]}`; // lat,lon
            }
          } else if (feature.geometry.x && feature.geometry.y) {
            // Point geometry
            featureCoords = `${feature.geometry.y},${feature.geometry.x}`; // lat,lon
          }
        }
        
        const allAttributes = { ...feature };
        delete allAttributes.objectid;
        delete allAttributes.OBJECTID;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.layerId;
        delete allAttributes.layerName;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'USGS The National Map',
          (location.confidence || 'N/A').toString(),
          layerInfo.name,
          featureName,
          featureCoords ? featureCoords.split(',')[0] : location.lat.toString(),
          featureCoords ? featureCoords.split(',')[1] : location.lon.toString(),
          distance,
          `Nearby ${feature.layerName || layerInfo.name.replace('USGS_GEONAMES_', '').replace(/_/g, ' ')}`,
          attributesJson,
          '',
          '',
          'USGS The National Map'
        ]);
      });
    }
    
    // Add USGS Selectable Polygons data rows
    const selectablePolygonsLayerMap: Record<string, { name: string, icon: string }> = {
      'usgs_selectable_polygons_state_territory_all': { name: 'USGS_SELECTABLE_POLYGONS_STATE_TERRITORY', icon: '🗺️' },
      'usgs_selectable_polygons_congressional_district_all': { name: 'USGS_SELECTABLE_POLYGONS_CONGRESSIONAL_DISTRICT', icon: '🏛️' },
      'usgs_selectable_polygons_county_equivalent_all': { name: 'USGS_SELECTABLE_POLYGONS_COUNTY_EQUIVALENT', icon: '🏘️' },
      'usgs_selectable_polygons_incorporated_place_all': { name: 'USGS_SELECTABLE_POLYGONS_INCORPORATED_PLACE', icon: '🏙️' },
      'usgs_selectable_polygons_unincorporated_place_all': { name: 'USGS_SELECTABLE_POLYGONS_UNINCORPORATED_PLACE', icon: '🏘️' },
      'usgs_selectable_polygons_1x1_degree_index_all': { name: 'USGS_SELECTABLE_POLYGONS_1X1_DEGREE_INDEX', icon: '🗺️' },
      'usgs_selectable_polygons_100k_index_all': { name: 'USGS_SELECTABLE_POLYGONS_100K_INDEX', icon: '🗺️' },
      'usgs_selectable_polygons_63k_index_all': { name: 'USGS_SELECTABLE_POLYGONS_63K_INDEX', icon: '🗺️' },
      'usgs_selectable_polygons_24k_index_all': { name: 'USGS_SELECTABLE_POLYGONS_24K_INDEX', icon: '🗺️' },
      'usgs_selectable_polygons_region_all': { name: 'USGS_SELECTABLE_POLYGONS_REGION', icon: '💧' },
      'usgs_selectable_polygons_subregion_all': { name: 'USGS_SELECTABLE_POLYGONS_SUBREGION', icon: '💧' },
      'usgs_selectable_polygons_subbasin_all': { name: 'USGS_SELECTABLE_POLYGONS_SUBBASIN', icon: '💧' }
    };
    
    if (selectablePolygonsLayerMap[key] && Array.isArray(value)) {
      const layerInfo = selectablePolygonsLayerMap[key];
      value.forEach((feature: any) => {
        // Try to find a name/identifier from common attribute fields
        const featureName = feature.name || feature.NAME || feature.NAME1 || feature.NAME2 || 
          feature.STATE_NAME || feature.state_name || feature.COUNTY_NAME || feature.county_name ||
          feature.PLACE_NAME || feature.place_name || feature.DISTRICT || feature.district ||
          feature.HUC || feature.huc || feature.REGION || feature.region ||
          feature.SUBREGION || feature.subregion || feature.SUBBASIN || feature.subbasin ||
          feature.INDEX || feature.index || feature.CELL_ID || feature.cell_id ||
          (feature.attributes ? (feature.attributes.name || feature.attributes.NAME || feature.attributes.NAME1) : null) ||
          feature.layerName || 'Unknown';
        const distance = feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : (feature.isContaining ? '0.00' : '');
        const isContaining = feature.isContaining ? 'Yes' : 'No';
        
        // Extract coordinates from polygon geometry (centroid of first ring)
        let featureCoords = '';
        if (feature.geometry && feature.geometry.rings && feature.geometry.rings.length > 0) {
          const firstRing = feature.geometry.rings[0];
          if (firstRing && firstRing.length > 0) {
            // Calculate centroid (simplified - use first point)
            const firstPoint = firstRing[0];
            featureCoords = `${firstPoint[1]},${firstPoint[0]}`; // lat,lon
          }
        }
        
        const allAttributes = { ...feature };
        delete allAttributes.objectid;
        delete allAttributes.OBJECTID;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.layerId;
        delete allAttributes.layerName;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'USGS The National Map',
          (location.confidence || 'N/A').toString(),
          layerInfo.name,
          `${featureName}${feature.isContaining ? ' (Contains Point)' : ''}`,
          featureCoords ? featureCoords.split(',')[0] : location.lat.toString(),
          featureCoords ? featureCoords.split(',')[1] : location.lon.toString(),
          distance,
          `Nearby ${feature.layerName || layerInfo.name.replace('USGS_SELECTABLE_POLYGONS_', '').replace(/_/g, ' ')}`,
          `${attributesJson} | Contains Point: ${isContaining}`,
          '',
          '',
          'USGS The National Map'
        ]);
      });
    }
    
    // Add USGS WBD (Watershed Boundary Dataset) data rows
    const wbdLayerMap: Record<string, { name: string, icon: string }> = {
      'usgs_wbd_line_all': { name: 'USGS_WBD_LINE', icon: '💧' },
      'usgs_wbd_2_digit_hu_all': { name: 'USGS_WBD_2_DIGIT_HU_REGION', icon: '💧' },
      'usgs_wbd_4_digit_hu_all': { name: 'USGS_WBD_4_DIGIT_HU_SUBREGION', icon: '💧' },
      'usgs_wbd_6_digit_hu_all': { name: 'USGS_WBD_6_DIGIT_HU_BASIN', icon: '💧' },
      'usgs_wbd_8_digit_hu_all': { name: 'USGS_WBD_8_DIGIT_HU_SUBBASIN', icon: '💧' },
      'usgs_wbd_10_digit_hu_all': { name: 'USGS_WBD_10_DIGIT_HU_WATERSHED', icon: '💧' },
      'usgs_wbd_12_digit_hu_all': { name: 'USGS_WBD_12_DIGIT_HU_SUBWATERSHED', icon: '💧' },
      'usgs_wbd_14_digit_hu_all': { name: 'USGS_WBD_14_DIGIT_HU', icon: '💧' },
      'usgs_wbd_16_digit_hu_all': { name: 'USGS_WBD_16_DIGIT_HU', icon: '💧' }
    };
    
    if (wbdLayerMap[key] && Array.isArray(value)) {
      const layerInfo = wbdLayerMap[key];
      value.forEach((feature: any) => {
        // Try to find a name/identifier from common attribute fields
        const featureName = feature.name || feature.NAME || feature.NAME1 || feature.NAME2 || 
          feature.HUC || feature.huc || feature.HUC8 || feature.huc8 || feature.HUC12 || feature.huc12 ||
          feature.HUC16 || feature.huc16 || feature.REGION || feature.region ||
          feature.SUBREGION || feature.subregion || feature.BASIN || feature.basin ||
          feature.SUBBASIN || feature.subbasin || feature.WATERSHED || feature.watershed ||
          feature.SUBWATERSHED || feature.subwatershed ||
          (feature.attributes ? (feature.attributes.name || feature.attributes.NAME || feature.attributes.HUC) : null) ||
          feature.layerName || 'Unknown';
        const distance = feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : (feature.isContaining ? '0.00' : '');
        const isContaining = feature.isContaining ? 'Yes' : 'No';
        
        // Extract coordinates from geometry
        let featureCoords = '';
        if (feature.geometry) {
          if (feature.geometry.rings && feature.geometry.rings.length > 0) {
            // Polygon geometry - use first point of first ring
            const firstRing = feature.geometry.rings[0];
            if (firstRing && firstRing.length > 0) {
              const firstPoint = firstRing[0];
              featureCoords = `${firstPoint[1]},${firstPoint[0]}`; // lat,lon
            }
          } else if (feature.geometry.paths && feature.geometry.paths.length > 0) {
            // Polyline geometry (WBDLine) - use first point of first path
            const firstPath = feature.geometry.paths[0];
            if (firstPath && firstPath.length > 0) {
              const firstPoint = firstPath[0];
              featureCoords = `${firstPoint[1]},${firstPoint[0]}`; // lat,lon
            }
          }
        }
        
        const allAttributes = { ...feature };
        delete allAttributes.objectid;
        delete allAttributes.OBJECTID;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.layerId;
        delete allAttributes.layerName;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'USGS The National Map',
          (location.confidence || 'N/A').toString(),
          layerInfo.name,
          `${featureName}${feature.isContaining ? ' (Contains Point)' : ''}`,
          featureCoords ? featureCoords.split(',')[0] : location.lat.toString(),
          featureCoords ? featureCoords.split(',')[1] : location.lon.toString(),
          distance,
          `Nearby ${feature.layerName || layerInfo.name.replace('USGS_WBD_', '').replace(/_/g, ' ')}`,
          `${attributesJson} | Contains Point: ${isContaining}`,
          '',
          '',
          'USGS The National Map'
        ]);
      });
    }
    
    // Add USGS Contours data rows
    const contoursLayerMap: Record<string, { name: string, icon: string }> = {
      'usgs_contours_100_foot_all': { name: 'USGS_CONTOURS_100_FOOT', icon: '⛰️' },
      'usgs_contours_100_foot_lines_all': { name: 'USGS_CONTOURS_100_FOOT_LINES', icon: '⛰️' },
      'usgs_contours_50_foot_all': { name: 'USGS_CONTOURS_50_FOOT', icon: '⛰️' },
      'usgs_contours_50_foot_lines_all': { name: 'USGS_CONTOURS_50_FOOT_LINES', icon: '⛰️' },
      'usgs_contours_large_scale_all': { name: 'USGS_CONTOURS_LARGE_SCALE', icon: '⛰️' },
      'usgs_contours_large_scale_lines_all': { name: 'USGS_CONTOURS_LARGE_SCALE_LINES', icon: '⛰️' }
    };
    
    if (contoursLayerMap[key] && Array.isArray(value)) {
      const layerInfo = contoursLayerMap[key];
      value.forEach((feature: any) => {
        // Try to find elevation or identifier from common attribute fields
        const featureName = feature.ELEV || feature.elev || feature.ELEVATION || feature.elevation ||
          feature.CONTOUR || feature.contour || feature.INDEX || feature.index ||
          feature.OBJECTID || feature.objectid ||
          (feature.attributes ? (feature.attributes.ELEV || feature.attributes.elev || feature.attributes.ELEVATION) : null) ||
          feature.layerName || 'Unknown';
        const distance = feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : '';
        
        // Extract coordinates from geometry (polylines)
        let featureCoords = '';
        if (feature.geometry) {
          if (feature.geometry.paths && feature.geometry.paths.length > 0) {
            // Polyline geometry - use first point of first path
            const firstPath = feature.geometry.paths[0];
            if (firstPath && firstPath.length > 0) {
              const firstPoint = firstPath[0];
              featureCoords = `${firstPoint[1]},${firstPoint[0]}`; // lat,lon
            }
          } else if (feature.geometry.rings && feature.geometry.rings.length > 0) {
            // Some contours might have rings - use first point of first ring
            const firstRing = feature.geometry.rings[0];
            if (firstRing && firstRing.length > 0) {
              const firstPoint = firstRing[0];
              featureCoords = `${firstPoint[1]},${firstPoint[0]}`; // lat,lon
            }
          }
        }
        
        const allAttributes = { ...feature };
        delete allAttributes.objectid;
        delete allAttributes.OBJECTID;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.layerId;
        delete allAttributes.layerName;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'USGS The National Map',
          (location.confidence || 'N/A').toString(),
          layerInfo.name,
          `${featureName}${feature.ELEV || feature.elev || feature.ELEVATION ? ` (${feature.ELEV || feature.elev || feature.ELEVATION} ft)` : ''}`,
          featureCoords ? featureCoords.split(',')[0] : location.lat.toString(),
          featureCoords ? featureCoords.split(',')[1] : location.lon.toString(),
          distance,
          `Nearby ${feature.layerName || layerInfo.name.replace('USGS_CONTOURS_', '').replace(/_/g, ' ')}`,
          attributesJson,
          '',
          '',
          'USGS The National Map'
        ]);
      });
    }
    
    // Add NOAA Critical Fisheries Habitat data rows
    if (key === 'noaa_critical_fisheries_habitat_all' && Array.isArray(value)) {
      value.forEach((feature: any) => {
        // Try to find identifier from common attribute fields
        const featureName = feature.HABITAT || feature.habitat || feature.NAME || feature.name ||
          feature.SPECIES || feature.species || feature.COMMON_NAME || feature.common_name ||
          feature.OBJECTID || feature.objectid ||
          (feature.attributes ? (feature.attributes.HABITAT || feature.attributes.habitat || feature.attributes.NAME || feature.attributes.name) : null) ||
          'Unknown';
        const distance = feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : '';
        const isContaining = feature.isContaining ? 'Yes' : 'No';
        
        // Extract coordinates from geometry (polygons)
        let featureCoords = '';
        if (feature.geometry) {
          if (feature.geometry.rings && feature.geometry.rings.length > 0) {
            // Polygon geometry - use first point of first ring
            const firstRing = feature.geometry.rings[0];
            if (firstRing && firstRing.length > 0) {
              const firstPoint = firstRing[0];
              featureCoords = `${firstPoint[1]},${firstPoint[0]}`; // lat,lon
            }
          }
        }
        
        const allAttributes = { ...feature };
        delete allAttributes.objectid;
        delete allAttributes.OBJECTID;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NOAA',
          (location.confidence || 'N/A').toString(),
          'NOAA_CRITICAL_FISHERIES_HABITAT',
          `${featureName}${isContaining === 'Yes' ? ' (Containing)' : ''}`,
          featureCoords ? featureCoords.split(',')[0] : location.lat.toString(),
          featureCoords ? featureCoords.split(',')[1] : location.lon.toString(),
          distance,
          `Critical Fisheries Habitat${isContaining === 'Yes' ? ' - Containing Point' : ' - Nearby'}`,
          attributesJson,
          '',
          '',
          'NOAA'
        ]);
      });
    }

    // Add NOAA Weather Radar Impact Zones data rows
    if (key === 'noaa_weather_radar_impact_zones_all' && Array.isArray(value)) {
      value.forEach((feature: any) => {
        const featureName = feature.sitename || feature.SiteName || feature.siteidentifier || feature.SiteIdentifier || 
          feature.impactzone || feature.ImpactZone || feature.OBJECTID || feature.objectid || 'Unknown';
        const distance = feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : '';
        const isContaining = feature.isContaining ? 'Yes' : 'No';
        
        // Extract coordinates from geometry (polygons)
        let featureCoords = '';
        if (feature.geometry) {
          if (feature.geometry.rings && feature.geometry.rings.length > 0) {
            // Polygon geometry - use first point of first ring
            const firstRing = feature.geometry.rings[0];
            if (firstRing && firstRing.length > 0) {
              const firstPoint = firstRing[0];
              featureCoords = `${firstPoint[1]},${firstPoint[0]}`; // lat,lon
            }
          }
        }
        
        const allAttributes = { ...feature };
        delete allAttributes.objectid;
        delete allAttributes.OBJECTID;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NOAA',
          (location.confidence || 'N/A').toString(),
          'NOAA_WEATHER_RADAR_IMPACT_ZONES',
          `${featureName}${isContaining === 'Yes' ? ' (Containing)' : ''}`,
          featureCoords ? featureCoords.split(',')[0] : location.lat.toString(),
          featureCoords ? featureCoords.split(',')[1] : location.lon.toString(),
          distance,
          `Weather Radar Impact Zones - ${feature.impactzone || feature.ImpactZone || 'Unknown'}${isContaining === 'Yes' ? ' - Containing Point' : ' - Nearby'}`,
          attributesJson,
          '',
          '',
          'NOAA'
        ]);
      });
    }

    // Handle NOAA Maritime Limits and Boundaries layers (polylines)
    if (key.startsWith('noaa_maritime_') && key.endsWith('_all') && Array.isArray(value)) {
      const layerKey = key.replace('_all', '');
      const layerNameMap: Record<string, string> = {
        'noaa_maritime_overview': 'Overview',
        'noaa_maritime_12nm': '12NM Territorial Sea',
        'noaa_maritime_24nm': '24NM Contiguous Zone',
        'noaa_maritime_200nm': '200NM EEZ and Maritime Boundaries',
        'noaa_maritime_us_canada_boundary': 'US/Canada Land Boundary'
      };
      const layerName = layerNameMap[layerKey] || layerKey.replace('noaa_maritime_', '').replace(/_/g, ' ');
      
      value.forEach((feature: any) => {
        const featureName = feature.NAME || feature.name || feature.OBJECTID || feature.objectid || 'Unknown';
        const distance = feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : '';
        
        // Extract coordinates from geometry (polylines)
        let featureCoords = '';
        if (feature.geometry) {
          if (feature.geometry.paths && feature.geometry.paths.length > 0) {
            // Polyline geometry - use first point of first path
            const firstPath = feature.geometry.paths[0];
            if (firstPath && firstPath.length > 0) {
              const firstPoint = firstPath[0];
              featureCoords = `${firstPoint[1]},${firstPoint[0]}`; // lat,lon
            }
          }
        }
        
        const allAttributes = { ...feature };
        delete allAttributes.objectid;
        delete allAttributes.OBJECTID;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.layerId;
        delete allAttributes.layerName;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NOAA',
          (location.confidence || 'N/A').toString(),
          `NOAA_MARITIME_${layerKey.toUpperCase().replace('NOAA_MARITIME_', '')}`,
          featureName,
          featureCoords ? featureCoords.split(',')[0] : location.lat.toString(),
          featureCoords ? featureCoords.split(',')[1] : location.lon.toString(),
          distance,
          `Maritime Limits - ${layerName}`,
          attributesJson,
          '',
          '',
          'NOAA'
        ]);
      });
    }
    
    // Add NOAA West Coast EFH data rows
    const noaaWestCoastEFHLayerMap: Record<string, { name: string, icon: string }> = {
      'noaa_west_coast_efh_hapc_all': { name: 'NOAA_WEST_COAST_EFH_HAPC', icon: '🐟' },
      'noaa_west_coast_efh_efha_all': { name: 'NOAA_WEST_COAST_EFH_EFHA', icon: '🐟' },
      'noaa_west_coast_efh_salmon_all': { name: 'NOAA_WEST_COAST_EFH_SALMON', icon: '🐟' },
      'noaa_west_coast_efh_hms_cps_gfish_all': { name: 'NOAA_WEST_COAST_EFH_HMS_CPS_GFISH', icon: '🐟' }
    };
    
    if (noaaWestCoastEFHLayerMap[key] && Array.isArray(value)) {
      const layerInfo = noaaWestCoastEFHLayerMap[key];
      value.forEach((feature: any) => {
        // Try to find identifier from common attribute fields
        const featureName = feature.HABITAT || feature.habitat || feature.NAME || feature.name ||
          feature.SPECIES || feature.species || feature.COMMON_NAME || feature.common_name ||
          feature.OBJECTID || feature.objectid ||
          (feature.attributes ? (feature.attributes.HABITAT || feature.attributes.habitat || feature.attributes.NAME || feature.attributes.name) : null) ||
          feature.layerName || 'Unknown';
        const distance = feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : '';
        const isContaining = feature.isContaining ? 'Yes' : 'No';
        
        // Extract coordinates from geometry (polygons)
        let featureCoords = '';
        if (feature.geometry) {
          if (feature.geometry.rings && feature.geometry.rings.length > 0) {
            // Polygon geometry - use first point of first ring
            const firstRing = feature.geometry.rings[0];
            if (firstRing && firstRing.length > 0) {
              const firstPoint = firstRing[0];
              featureCoords = `${firstPoint[1]},${firstPoint[0]}`; // lat,lon
            }
          }
        }
        
        const allAttributes = { ...feature };
        delete allAttributes.objectid;
        delete allAttributes.OBJECTID;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.layerId;
        delete allAttributes.layerName;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NOAA',
          (location.confidence || 'N/A').toString(),
          layerInfo.name,
          `${featureName}${isContaining === 'Yes' ? ' (Containing)' : ''}`,
          featureCoords ? featureCoords.split(',')[0] : location.lat.toString(),
          featureCoords ? featureCoords.split(',')[1] : location.lon.toString(),
          distance,
          `${feature.layerName || layerInfo.name.replace('NOAA_WEST_COAST_EFH_', '').replace(/_/g, ' ')}${isContaining === 'Yes' ? ' - Containing Point' : ' - Nearby'}`,
          attributesJson,
          '',
          '',
          'NOAA'
        ]);
      });
    }
    
    // Add NOAA ESA Species Ranges data rows (handle all dynamically)
    if (key.startsWith('noaa_esa_species_ranges_') && key.endsWith('_all') && Array.isArray(value)) {
      value.forEach((feature: any) => {
        // Try to find identifier from common attribute fields
        const featureName = feature.SPECIES || feature.species || feature.NAME || feature.name ||
          feature.COMMON_NAME || feature.common_name || feature.ESU || feature.DPS ||
          feature.OBJECTID || feature.objectid ||
          (feature.attributes ? (feature.attributes.SPECIES || feature.attributes.species || feature.attributes.NAME || feature.attributes.name) : null) ||
          feature.layerName || 'Unknown';
        const distance = feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : '';
        const isContaining = feature.isContaining ? 'Yes' : 'No';
        
        // Extract coordinates from geometry (polygons)
        let featureCoords = '';
        if (feature.geometry) {
          if (feature.geometry.rings && feature.geometry.rings.length > 0) {
            // Polygon geometry - use first point of first ring
            const firstRing = feature.geometry.rings[0];
            if (firstRing && firstRing.length > 0) {
              const firstPoint = firstRing[0];
              featureCoords = `${firstPoint[1]},${firstPoint[0]}`; // lat,lon
            }
          }
        }
        
        const allAttributes = { ...feature };
        delete allAttributes.objectid;
        delete allAttributes.OBJECTID;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.layerId;
        delete allAttributes.layerName;
        const attributesJson = JSON.stringify(allAttributes);
        
        const layerKey = key.replace('_all', '');
        const layerName = feature.layerName || layerKey.replace('noaa_esa_species_ranges_', '').replace(/_/g, ' ');
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NOAA',
          (location.confidence || 'N/A').toString(),
          `NOAA_ESA_${layerKey.toUpperCase().replace(/NOAA_ESA_SPECIES_RANGES_/g, '')}`,
          `${featureName}${isContaining === 'Yes' ? ' (Containing)' : ''}`,
          featureCoords ? featureCoords.split(',')[0] : location.lat.toString(),
          featureCoords ? featureCoords.split(',')[1] : location.lon.toString(),
          distance,
          `${layerName}${isContaining === 'Yes' ? ' - Containing Point' : ' - Nearby'}`,
          attributesJson,
          '',
          '',
          'NOAA'
        ]);
      });
    }

    // Handle NOAA NMFS Critical Habitat layers (polygons and polylines)
    if (key.startsWith('noaa_nmfs_critical_habitat_') && key.endsWith('_all') && Array.isArray(value)) {
      const layerKey = key.replace('_all', '');
      value.forEach((feature: any) => {
        // Try to find identifier from common attribute fields
        const featureName = feature.SPECIES || feature.species || feature.NAME || feature.name ||
          feature.COMMON_NAME || feature.common_name || feature.ESU || feature.DPS ||
          feature.OBJECTID || feature.objectid ||
          (feature.attributes ? (feature.attributes.SPECIES || feature.attributes.species || feature.attributes.NAME || feature.attributes.name) : null) ||
          feature.layerName || 'Unknown';
        const distance = feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : '';
        const isContaining = feature.isContaining ? 'Yes' : 'No';
        
        // Extract coordinates from geometry (polygons or polylines)
        let featureCoords = '';
        if (feature.geometry) {
          if (feature.geometry.rings && feature.geometry.rings.length > 0) {
            // Polygon geometry - use first point of first ring
            const firstRing = feature.geometry.rings[0];
            if (firstRing && firstRing.length > 0) {
              const firstPoint = firstRing[0];
              featureCoords = `${firstPoint[1]},${firstPoint[0]}`; // lat,lon
            }
          } else if (feature.geometry.paths && feature.geometry.paths.length > 0) {
            // Polyline geometry - use first point of first path
            const firstPath = feature.geometry.paths[0];
            if (firstPath && firstPath.length > 0) {
              const firstPoint = firstPath[0];
              featureCoords = `${firstPoint[1]},${firstPoint[0]}`; // lat,lon
            }
          }
        }
        
        // Extract all attributes as JSON
        const excludeFields = ['geometry', 'distance_miles', 'objectid', 'OBJECTID', 'isContaining', 'layerId', 'layerName', 'geometryType'];
        const attributes: Record<string, any> = {};
        Object.entries(feature).forEach(([key, val]) => {
          if (!excludeFields.includes(key) && val !== null && val !== undefined && val !== '') {
            attributes[key] = val;
          }
        });
        const attributesJson = JSON.stringify(attributes);
        
        const layerName = feature.layerName || layerKey.replace('noaa_nmfs_critical_habitat_', '').replace(/_/g, ' ');
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NOAA',
          (location.confidence || 'N/A').toString(),
          'NOAA NMFS Critical Habitat',
          `${featureName}${isContaining === 'Yes' ? ' (Containing)' : ''}`,
          featureCoords ? featureCoords.split(',')[0] : location.lat.toString(),
          featureCoords ? featureCoords.split(',')[1] : location.lon.toString(),
          distance,
          `${layerName}${isContaining === 'Yes' ? ' - Containing Point' : ' - Nearby'}`,
          attributesJson,
          '',
          '',
          'NOAA'
        ]);
      });
    }
    
    // Add NOAA Water Temperature data rows
    const noaaWaterTempLayerMap: Record<string, { name: string, icon: string }> = {
      'noaa_water_temp_january_all': { name: 'NOAA_WATER_TEMP_JANUARY', icon: '🌊' },
      'noaa_water_temp_february_all': { name: 'NOAA_WATER_TEMP_FEBRUARY', icon: '🌊' },
      'noaa_water_temp_march_all': { name: 'NOAA_WATER_TEMP_MARCH', icon: '🌊' },
      'noaa_water_temp_april_all': { name: 'NOAA_WATER_TEMP_APRIL', icon: '🌊' },
      'noaa_water_temp_may_all': { name: 'NOAA_WATER_TEMP_MAY', icon: '🌊' },
      'noaa_water_temp_june_all': { name: 'NOAA_WATER_TEMP_JUNE', icon: '🌊' },
      'noaa_water_temp_july_all': { name: 'NOAA_WATER_TEMP_JULY', icon: '🌊' },
      'noaa_water_temp_august_all': { name: 'NOAA_WATER_TEMP_AUGUST', icon: '🌊' },
      'noaa_water_temp_september_all': { name: 'NOAA_WATER_TEMP_SEPTEMBER', icon: '🌊' },
      'noaa_water_temp_october_all': { name: 'NOAA_WATER_TEMP_OCTOBER', icon: '🌊' },
      'noaa_water_temp_november_all': { name: 'NOAA_WATER_TEMP_NOVEMBER', icon: '🌊' },
      'noaa_water_temp_december_all': { name: 'NOAA_WATER_TEMP_DECEMBER', icon: '🌊' }
    };
    
    if (noaaWaterTempLayerMap[key] && Array.isArray(value)) {
      const layerInfo = noaaWaterTempLayerMap[key];
      value.forEach((feature: any) => {
        // Try to find identifier from common attribute fields
        const featureName = feature.TEMP || feature.temp || feature.TEMPERATURE || feature.temperature ||
          feature.CONTOUR || feature.contour || feature.INDEX || feature.index ||
          feature.OBJECTID || feature.objectid ||
          (feature.attributes ? (feature.attributes.TEMP || feature.attributes.temp || feature.attributes.TEMPERATURE) : null) ||
          feature.layerName || 'Unknown';
        const distance = feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : '';
        
        // Extract coordinates from geometry (polylines)
        let featureCoords = '';
        if (feature.geometry) {
          if (feature.geometry.paths && feature.geometry.paths.length > 0) {
            // Polyline geometry - use first point of first path
            const firstPath = feature.geometry.paths[0];
            if (firstPath && firstPath.length > 0) {
              const firstPoint = firstPath[0];
              featureCoords = `${firstPoint[1]},${firstPoint[0]}`; // lat,lon
            }
          } else if (feature.geometry.rings && feature.geometry.rings.length > 0) {
            // Some layers might have rings - use first point of first ring
            const firstRing = feature.geometry.rings[0];
            if (firstRing && firstRing.length > 0) {
              const firstPoint = firstRing[0];
              featureCoords = `${firstPoint[1]},${firstPoint[0]}`; // lat,lon
            }
          }
        }
        
        const allAttributes = { ...feature };
        delete allAttributes.objectid;
        delete allAttributes.OBJECTID;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.layerId;
        delete allAttributes.layerName;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'NOAA',
          (location.confidence || 'N/A').toString(),
          layerInfo.name,
          `${featureName}${feature.TEMP || feature.temp || feature.TEMPERATURE ? ` (${feature.TEMP || feature.temp || feature.TEMPERATURE}°C)` : ''}`,
          featureCoords ? featureCoords.split(',')[0] : location.lat.toString(),
          featureCoords ? featureCoords.split(',')[1] : location.lon.toString(),
          distance,
          `Nearby ${feature.layerName || layerInfo.name.replace('NOAA_WATER_TEMP_', '').replace(/_/g, ' ')}`,
          attributesJson,
          '',
          '',
          'NOAA'
        ]);
      });
    }
    
    // Add Boston Open Data data rows
    const bostonLayerMap: Record<string, { name: string, icon: string }> = {
      'boston_approved_building_permits_all': { name: 'BOSTON_APPROVED_BUILDING_PERMITS', icon: '🏗️' },
      'boston_isd_inspector_districts_all': { name: 'BOSTON_ISD_INSPECTOR_DISTRICTS', icon: '🏛️' },
      'boston_parcels_2023_all': { name: 'BOSTON_PARCELS_2023', icon: '🏘️' },
      'boston_charging_stations_all': { name: 'BOSTON_CHARGING_STATIONS', icon: '🔌' },
      'boston_blue_bike_stations_all': { name: 'BOSTON_BLUE_BIKE_STATIONS', icon: '🚴' },
      'boston_bicycle_network_2023_all': { name: 'BOSTON_BICYCLE_NETWORK_2023', icon: '🚴' },
      'boston_managed_streets_all': { name: 'BOSTON_MANAGED_STREETS', icon: '🛣️' },
      'boston_public_open_space_all': { name: 'BOSTON_PUBLIC_OPEN_SPACE', icon: '🌳' },
      'boston_park_features_all': { name: 'BOSTON_PARK_FEATURES', icon: '🌳' },
      'boston_school_zones_all': { name: 'BOSTON_SCHOOL_ZONES', icon: '🏫' },
      'boston_crosswalks_all': { name: 'BOSTON_CROSSWALKS', icon: '🚶' },
      'boston_yellow_centerlines_all': { name: 'BOSTON_YELLOW_CENTERLINES', icon: '🟡' },
      'boston_parcels_2025_all': { name: 'BOSTON_PARCELS_2025', icon: '🏘️' },
      'boston_population_estimates_2025_all': { name: 'BOSTON_POPULATION_ESTIMATES_2025_CENSUS_TRACTS', icon: '📊' },
      'boston_population_estimates_2025_neighborhoods_all': { name: 'BOSTON_POPULATION_ESTIMATES_2025_NEIGHBORHOODS', icon: '🏘️' },
      'boston_population_estimates_2025_city_all': { name: 'BOSTON_POPULATION_ESTIMATES_2025_CITY', icon: '🏙️' },
      'boston_mbta_stops_all': { name: 'BOSTON_MBTA_STOPS', icon: '🚇' },
      'boston_pwd_districts_all': { name: 'BOSTON_PWD_DISTRICTS', icon: '🏛️' },
      'boston_snow_districts_all': { name: 'BOSTON_SNOW_DISTRICTS', icon: '❄️' },
      'boston_wifi_locations_all': { name: 'BOSTON_WIFI_LOCATIONS', icon: '📶' },
      'boston_wifi_collector_all': { name: 'BOSTON_WIFI_COLLECTOR', icon: '📡' },
      'boston_budget_facilities_all': { name: 'BOSTON_BUDGET_FACILITIES', icon: '💰' },
      'boston_hubway_stations_all': { name: 'BOSTON_HUBWAY_STATIONS', icon: '🚴' },
      'boston_polling_locations_all': { name: 'BOSTON_POLLING_LOCATIONS', icon: '🗳️' },
      'boston_public_libraries_all': { name: 'BOSTON_PUBLIC_LIBRARIES', icon: '📚' },
      'boston_bike_network_existing_facility_all': { name: 'BOSTON_BIKE_NETWORK_EXISTING_FACILITY', icon: '🚴' },
      'boston_bike_network_5yr_plan_all': { name: 'BOSTON_BIKE_NETWORK_5YR_PLAN', icon: '🚴' },
      'boston_bike_network_30yr_plan_all': { name: 'BOSTON_BIKE_NETWORK_30YR_PLAN', icon: '🚴' },
      'boston_311_addresses_all': { name: 'BOSTON_311_BULK_ITEM_PICKUP_LOCATIONS', icon: '📞' },
      'boston_public_schools_all': { name: 'BOSTON_PUBLIC_SCHOOLS', icon: '🏫' },
      'boston_non_public_schools_all': { name: 'BOSTON_NON_PUBLIC_SCHOOLS', icon: '🏫' },
      'boston_colleges_universities_all': { name: 'BOSTON_COLLEGES_UNIVERSITIES', icon: '🎓' },
      'boston_historic_districts_all': { name: 'BOSTON_HISTORIC_DISTRICTS', icon: '🏛️' },
      'boston_impervious_other_all': { name: 'BOSTON_IMPERVIOUS_OTHER', icon: '🏗️' },
      'boston_municipal_building_energy_reporting_all': { name: 'BOSTON_MUNICIPAL_BUILDING_ENERGY_REPORTING', icon: '⚡' },
      'boston_historic_districts_environment_energy_all': { name: 'BOSTON_HISTORIC_DISTRICTS_ENVIRONMENT_ENERGY', icon: '🏛️' },
      'boston_hydrography_poly_all': { name: 'BOSTON_HYDROGRAPHY_POLY', icon: '💧' },
      'boston_open_space_environment_energy_all': { name: 'BOSTON_OPEN_SPACE_ENVIRONMENT_ENERGY', icon: '🌳' },
      'boston_open_space_planning_neighborhoods_all': { name: 'BOSTON_OPEN_SPACE_PLANNING_NEIGHBORHOODS', icon: '🌳' },
      'boston_green_links_existing_lines_all': { name: 'BOSTON_GREEN_LINKS_EXISTING_LINES', icon: '🟢' },
      'boston_green_links_in_progress_lines_all': { name: 'BOSTON_GREEN_LINKS_IN_PROGRESS_LINES', icon: '🟡' },
      'boston_green_links_proposed_lines_all': { name: 'BOSTON_GREEN_LINKS_PROPOSED_LINES', icon: '🔵' },
      'boston_green_links_crossings_all': { name: 'BOSTON_GREEN_LINKS_CROSSINGS', icon: '🚶' },
      'boston_green_links_greenway_all': { name: 'BOSTON_GREEN_LINKS_GREENWAY', icon: '🌿' },
      'boston_fiber_sites_all': { name: 'BOSTON_FIBER_SITES', icon: '📡' },
      'boston_fiber_segments_all': { name: 'BOSTON_FIBER_SEGMENTS', icon: '🔌' },
      'boston_fiber_other_assets_all': { name: 'BOSTON_FIBER_OTHER_ASSETS', icon: '🔧' },
      'boston_planning_main_street_districts_all': { name: 'BOSTON_PLANNING_MAIN_STREET_DISTRICTS', icon: '🏪' },
      'boston_planning_zip_codes_all': { name: 'BOSTON_PLANNING_ZIP_CODES', icon: '📮' },
      'boston_planning_public_works_districts_all': { name: 'BOSTON_PLANNING_PUBLIC_WORKS_DISTRICTS', icon: '🔧' },
      'boston_planning_parcels_2015_all': { name: 'BOSTON_PLANNING_PARCELS_2015', icon: '🏘️' },
      'boston_planning_city_council_districts_all': { name: 'BOSTON_PLANNING_CITY_COUNCIL_DISTRICTS', icon: '🏛️' },
      'boston_planning_btd_districts_all': { name: 'BOSTON_PLANNING_BTD_DISTRICTS', icon: '🚌' },
      'boston_planning_article80_projects_active_all': { name: 'BOSTON_PLANNING_ARTICLE80_PROJECTS_ACTIVE', icon: '🏗️' },
      'boston_planning_precincts_all': { name: 'BOSTON_PLANNING_PRECINCTS', icon: '👮' },
      'boston_planning_wards_all': { name: 'BOSTON_PLANNING_WARDS', icon: '🗳️' },
      'boston_planning_boston_boundary_all': { name: 'BOSTON_PLANNING_BOSTON_BOUNDARY', icon: '📍' },
      'boston_public_safety_fire_hydrants_all': { name: 'BOSTON_PUBLIC_SAFETY_FIRE_HYDRANTS', icon: '🚒' },
      'boston_public_safety_fire_boxes_all': { name: 'BOSTON_PUBLIC_SAFETY_FIRE_BOXES', icon: '📞' },
      'boston_public_safety_fire_departments_all': { name: 'BOSTON_PUBLIC_SAFETY_FIRE_DEPARTMENTS', icon: '🏢' },
      'boston_public_safety_fire_districts_all': { name: 'BOSTON_PUBLIC_SAFETY_FIRE_DISTRICTS', icon: '🔥' },
      'boston_public_safety_fire_subdistricts_all': { name: 'BOSTON_PUBLIC_SAFETY_FIRE_SUBDISTRICTS', icon: '🛡️' },
      'boston_public_safety_police_districts_all': { name: 'BOSTON_PUBLIC_SAFETY_POLICE_DISTRICTS', icon: '👮' },
      'boston_public_safety_police_departments_all': { name: 'BOSTON_PUBLIC_SAFETY_POLICE_DEPARTMENTS', icon: '🚔' },
      'boston_pwd_cartegraph_street_lights_all': { name: 'BOSTON_PWD_CARTEGRAPH_STREET_LIGHTS', icon: '💡' },
      'boston_pwd_cartegraph_bus_shelters_all': { name: 'BOSTON_PWD_CARTEGRAPH_BUS_SHELTERS', icon: '🚏' },
      'boston_pwd_cartegraph_hydrants_all': { name: 'BOSTON_PWD_CARTEGRAPH_HYDRANTS', icon: '🚰' },
      'boston_pwd_cartegraph_waste_receptacles_all': { name: 'BOSTON_PWD_CARTEGRAPH_WASTE_RECEPTACLES', icon: '🗑️' },
      'boston_pwd_cartegraph_street_light_cabinets_all': { name: 'BOSTON_PWD_CARTEGRAPH_STREET_LIGHT_CABINETS', icon: '📦' },
      'boston_pwd_cartegraph_access_point_all': { name: 'BOSTON_PWD_CARTEGRAPH_ACCESS_POINT', icon: '📍' },
      'boston_pwd_cartegraph_street_light_control_box_all': { name: 'BOSTON_PWD_CARTEGRAPH_STREET_LIGHT_CONTROL_BOX', icon: '⚡' },
      'boston_pwd_cartegraph_fire_alarm_light_all': { name: 'BOSTON_PWD_CARTEGRAPH_FIRE_ALARM_LIGHT', icon: '🚨' },
      'boston_pwd_pavement_sidewalk_condition_ramp_condition_all': { name: 'BOSTON_PWD_PAVEMENT_SIDEWALK_CONDITION_RAMP_CONDITION', icon: '♿' },
      'boston_pwd_pavement_sidewalk_condition_intersection_condition_all': { name: 'BOSTON_PWD_PAVEMENT_SIDEWALK_CONDITION_INTERSECTION_CONDITION', icon: '🚦' },
      'boston_pwd_pavement_sidewalk_condition_sidewalk_condition_all': { name: 'BOSTON_PWD_PAVEMENT_SIDEWALK_CONDITION_SIDEWALK_CONDITION', icon: '🚶' },
      'boston_pwd_pavement_sidewalk_condition_pavement_condition_all': { name: 'BOSTON_PWD_PAVEMENT_SIDEWALK_CONDITION_PAVEMENT_CONDITION', icon: '🛣️' },
      'boston_cooling_centers_all': { name: 'BOSTON_COOLING_CENTERS', icon: '❄️' },
      'boston_bprd_sporting_activity_locations_all': { name: 'BOSTON_BPRD_SPORTING_ACTIVITY_LOCATIONS', icon: '⚽' },
      'boston_doit_buildings_all': { name: 'BOSTON_DOIT_BUILDINGS', icon: '🏢' },
      'boston_doit_hydro_all': { name: 'BOSTON_DOIT_HYDRO', icon: '💧' },
      'boston_doit_mbta_rapid_transit_all': { name: 'BOSTON_DOIT_MBTA_RAPID_TRANSIT', icon: '🚇' },
      'boston_doit_rail_all': { name: 'BOSTON_DOIT_RAIL', icon: '🚂' },
      'boston_fiber_pic_conduit_all': { name: 'BOSTON_FIBER_PIC_CONDUIT', icon: '🔌' },
      'boston_fiber_rcn_fiber_all': { name: 'BOSTON_FIBER_RCN_FIBER', icon: '🔌' },
      'boston_fiber_nstar_conduit_all': { name: 'BOSTON_FIBER_NSTAR_CONDUIT', icon: '🔌' },
      'boston_fiber_btd_all': { name: 'BOSTON_FIBER_BTD', icon: '🚗' },
      'boston_fiber_lit_fiber_all': { name: 'BOSTON_FIBER_LIT_FIBER', icon: '💡' },
      'boston_fiber_core_fiber_all': { name: 'BOSTON_FIBER_CORE_FIBER', icon: '🔷' },
      'boston_fiber_wireless_all': { name: 'BOSTON_FIBER_WIRELESS', icon: '📶' },
      'boston_fiber_planning_areas_all': { name: 'BOSTON_FIBER_PLANNING_AREAS', icon: '🗺️' },
      'boston_infrastructure_sidewalk_inventory_all': { name: 'BOSTON_SIDEWALK_INVENTORY', icon: '🚶' },
      'boston_infrastructure_mbta_stops_all': { name: 'BOSTON_MBTA_STOPS_INFRASTRUCTURE', icon: '🚇' },
      'boston_infrastructure_hospitals_all': { name: 'BOSTON_HOSPITALS', icon: '🏥' },
      'boston_infrastructure_ramp_inventory_all': { name: 'BOSTON_RAMP_INVENTORY', icon: '♿' },
      'boston_infrastructure_mbta_bus_stops_all': { name: 'BOSTON_MBTA_BUS_STOPS', icon: '🚌' },
      'boston_infrastructure_sidewalk_centerline_all': { name: 'BOSTON_SIDEWALK_CENTERLINE', icon: '🚶' },
      'boston_infrastructure_curbs_all': { name: 'BOSTON_CURBS', icon: '🛣️' },
      'boston_infrastructure_snow_emergency_routes_all': { name: 'BOSTON_SNOW_EMERGENCY_ROUTES', icon: '❄️' },
      'boston_infrastructure_segments_all': { name: 'BOSTON_SEGMENTS', icon: '🛣️' },
      'boston_infrastructure_parking_meters_all': { name: 'BOSTON_PARKING_METERS', icon: '🅿️' },
      'boston_infrastructure_trash_collection_days_all': { name: 'BOSTON_TRASH_COLLECTION_DAYS', icon: '🗑️' },
      'boston_infrastructure_street_lights_all': { name: 'BOSTON_STREET_LIGHTS', icon: '💡' },
      'boston_infrastructure_traffic_signals_all': { name: 'BOSTON_TRAFFIC_SIGNALS', icon: '🚦' },
      'boston_infrastructure_curbs2_all': { name: 'BOSTON_CURBS_LAYER_13', icon: '🛣️' },
      'boston_infrastructure_massdot_road_inventory_all': { name: 'BOSTON_MASSDOT_ROAD_INVENTORY', icon: '🛣️' },
      'boston_infrastructure_mbta_bus_routes_all': { name: 'BOSTON_MBTA_BUS_ROUTES', icon: '🚌' },
      'boston_infrastructure_mbcr_train_routes_all': { name: 'BOSTON_MBCR_TRAIN_ROUTES', icon: '🚂' },
      'boston_infrastructure_mbcr_train_stations_all': { name: 'BOSTON_MBCR_TRAIN_STATIONS', icon: '🚉' }
    };
    
    // Add Alaska DNR data rows - separate handler to avoid Boston Open Data categorization
    const alaskaDNRLayerMap: Record<string, { name: string, icon: string }> = {
      'alaska_dnr_trans_alaska_pipeline_all': { name: 'ALASKA_DNR_TRANS_ALASKA_PIPELINE', icon: '🛢️' },
      'alaska_dnr_well_sites_all': { name: 'ALASKA_DNR_WELL_SITES', icon: '⛽' },
      'alaska_dnr_oil_gas_lease_sale_tract_all': { name: 'ALASKA_DNR_OIL_GAS_LEASE_SALE_TRACT', icon: '🛢️' },
      'alaska_dnr_state_park_roads_all': { name: 'ALASKA_DNR_STATE_PARK_ROADS', icon: '🛣️' },
      'alaska_dnr_state_park_trails_all': { name: 'ALASKA_DNR_STATE_PARK_TRAILS', icon: '🥾' },
      'alaska_dnr_state_park_boundaries_all': { name: 'ALASKA_DNR_STATE_PARK_BOUNDARIES', icon: '🏞️' },
      'alaska_dnr_state_park_facilities_all': { name: 'ALASKA_DNR_STATE_PARK_FACILITIES', icon: '🏕️' },
      'alaska_dnr_controlled_livestock_districts_all': { name: 'ALASKA_DNR_CONTROLLED_LIVESTOCK_DISTRICTS', icon: '🐄' },
      'alaska_dnr_land_capacity_classification_all': { name: 'ALASKA_DNR_LAND_CAPACITY_CLASSIFICATION', icon: '🌾' },
      'alaska_dnr_shore_fishery_leases_all': { name: 'ALASKA_DNR_SHORE_FISHERY_LEASES', icon: '🐟' },
      'alaska_dnr_aquatic_farm_leases_all': { name: 'ALASKA_DNR_AQUATIC_FARM_LEASES', icon: '🌊' },
      'alaska_dnr_welts_all': { name: 'ALASKA_DNR_WELTS', icon: '💧' },
      'alaska_dnr_plss_section_all': { name: 'ALASKA_DNR_PLSS_SECTION', icon: '🗺️' },
      'alaska_dnr_plss_township_all': { name: 'ALASKA_DNR_PLSS_TOWNSHIP', icon: '🗺️' },
      'alaska_dnr_surface_water_right_location_all': { name: 'ALASKA_DNR_SURFACE_WATER_RIGHT_LOCATION', icon: '💧' },
      'alaska_dnr_subsurface_water_right_location_all': { name: 'ALASKA_DNR_SUBSURFACE_WATER_RIGHT_LOCATION', icon: '💧' },
      'alaska_dnr_surface_water_rights_all': { name: 'ALASKA_DNR_SURFACE_WATER_RIGHTS', icon: '🌊' },
      'alaska_dnr_subsurface_water_rights_all': { name: 'ALASKA_DNR_SUBSURFACE_WATER_RIGHTS', icon: '🌊' },
      'alaska_dnr_instream_flow_water_reservations_point_all': { name: 'ALASKA_DNR_INSTREAM_FLOW_WATER_RESERVATIONS_POINT', icon: '💧' },
      'alaska_dnr_instream_flow_water_reservations_line_all': { name: 'ALASKA_DNR_INSTREAM_FLOW_WATER_RESERVATIONS_LINE', icon: '🌊' },
      'alaska_dnr_instream_flow_water_reservations_polygon_all': { name: 'ALASKA_DNR_INSTREAM_FLOW_WATER_RESERVATIONS_POLYGON', icon: '🌊' },
      'alaska_dnr_shore_fishery_leases_line_all': { name: 'ALASKA_DNR_SHORE_FISHERY_LEASES_LINE', icon: '🐟' },
      'alaska_dnr_shore_fishery_leases_polygon_waterestate_all': { name: 'ALASKA_DNR_SHORE_FISHERY_LEASES_POLYGON_WATERESTATE', icon: '🐟' },
      'alaska_dnr_aquatic_farm_leases_waterestate_all': { name: 'ALASKA_DNR_AQUATIC_FARM_LEASES_WATERESTATE', icon: '🌊' },
      'alaska_dnr_lease_line_all': { name: 'ALASKA_DNR_LEASE_LINE', icon: '📏' },
      'alaska_dnr_lease_area_all': { name: 'ALASKA_DNR_LEASE_AREA', icon: '📐' },
      'alaska_dnr_hatchers_pass_plan_boundary_all': { name: 'ALASKA_DNR_HATCHERS_PASS_PLAN_BOUNDARY', icon: '🏔️' },
      'alaska_dnr_hatchers_pass_non_motorized_summer_all': { name: 'ALASKA_DNR_HATCHERS_PASS_NON_MOTORIZED_SUMMER', icon: '🚫' },
      'alaska_dnr_hatchers_pass_non_motorized_year_round_all': { name: 'ALASKA_DNR_HATCHERS_PASS_NON_MOTORIZED_YEAR_ROUND', icon: '🚫' },
      'alaska_dnr_national_geodetic_survey_pt_all': { name: 'ALASKA_DNR_NATIONAL_GEODETIC_SURVEY_PT', icon: '📍' },
      'alaska_dnr_state_control_monuments_all': { name: 'ALASKA_DNR_STATE_CONTROL_MONUMENTS', icon: '🗿' },
      'alaska_dnr_blm_monuments_gcdb_all': { name: 'ALASKA_DNR_BLM_MONUMENTS_GCDB', icon: '🗿' },
      'alaska_dnr_blm_monuments_sdms_all': { name: 'ALASKA_DNR_BLM_MONUMENTS_SDMS', icon: '🗿' },
      'alaska_dnr_survey_boundary_pt_all': { name: 'ALASKA_DNR_SURVEY_BOUNDARY_PT', icon: '📍' },
      'alaska_dnr_simple_coastline_all': { name: 'ALASKA_DNR_SIMPLE_COASTLINE', icon: '🌊' },
      'alaska_dnr_survey_tract_line_all': { name: 'ALASKA_DNR_SURVEY_TRACT_LINE', icon: '📏' },
      'alaska_dnr_survey_block_line_all': { name: 'ALASKA_DNR_SURVEY_BLOCK_LINE', icon: '📐' },
      'alaska_dnr_survey_boundary_line_all': { name: 'ALASKA_DNR_SURVEY_BOUNDARY_LINE', icon: '📏' },
      'alaska_dnr_section_all': { name: 'ALASKA_DNR_SECTION', icon: '🗺️' },
      'alaska_dnr_survey_lot_poly_all': { name: 'ALASKA_DNR_SURVEY_LOT_POLY', icon: '📋' },
      'alaska_dnr_survey_tract_poly_all': { name: 'ALASKA_DNR_SURVEY_TRACT_POLY', icon: '📋' },
      'alaska_dnr_survey_block_poly_all': { name: 'ALASKA_DNR_SURVEY_BLOCK_POLY', icon: '📋' },
      'alaska_dnr_survey_boundary_poly_all': { name: 'ALASKA_DNR_SURVEY_BOUNDARY_POLY', icon: '📋' },
      'alaska_dnr_township_all': { name: 'ALASKA_DNR_TOWNSHIP', icon: '🏘️' },
      'alaska_dnr_incorporated_city_boundary_all': { name: 'ALASKA_DNR_INCORPORATED_CITY_BOUNDARY', icon: '🏙️' },
      'alaska_dnr_recording_district_boundary_all': { name: 'ALASKA_DNR_RECORDING_DISTRICT_BOUNDARY', icon: '🏛️' },
      'alaska_dnr_dcced_cra_borough_boundary_all': { name: 'ALASKA_DNR_DCCED_CRA_BOROUGH_BOUNDARY', icon: '🏛️' },
      'alaska_dnr_agreement_settlement_reconvey_pt_all': { name: 'ALASKA_DNR_AGREEMENT_SETTLEMENT_RECONVEY_PT', icon: '📍' },
      'alaska_dnr_restricted_use_authorization_pt_all': { name: 'ALASKA_DNR_RESTRICTED_USE_AUTHORIZATION_PT', icon: '🚫' },
      'alaska_dnr_potential_hazardous_sites_pt_all': { name: 'ALASKA_DNR_POTENTIAL_HAZARDOUS_SITES_PT', icon: '⚠️' },
      'alaska_dnr_trespass_pt_all': { name: 'ALASKA_DNR_TRESPASS_PT', icon: '🚧' },
      'alaska_dnr_permit_lease_le_pt_all': { name: 'ALASKA_DNR_PERMIT_LEASE_LE_PT', icon: '📄' },
      'alaska_dnr_easement_pt_all': { name: 'ALASKA_DNR_EASEMENT_PT', icon: '🛤️' },
      'alaska_dnr_land_disposal_other_pt_all': { name: 'ALASKA_DNR_LAND_DISPOSAL_OTHER_PT', icon: '🏘️' },
      'alaska_dnr_land_estate_survey_boundary_pt_all': { name: 'ALASKA_DNR_LAND_ESTATE_SURVEY_BOUNDARY_PT', icon: '📍' },
      'alaska_dnr_land_estate_simple_coastline_all': { name: 'ALASKA_DNR_LAND_ESTATE_SIMPLE_COASTLINE', icon: '🌊' },
      'alaska_dnr_agreement_settlement_reconvey_line_all': { name: 'ALASKA_DNR_AGREEMENT_SETTLEMENT_RECONVEY_LINE', icon: '📏' },
      'alaska_dnr_restricted_use_authorization_line_all': { name: 'ALASKA_DNR_RESTRICTED_USE_AUTHORIZATION_LINE', icon: '🚫' },
      'alaska_dnr_potential_hazardous_sites_line_all': { name: 'ALASKA_DNR_POTENTIAL_HAZARDOUS_SITES_LINE', icon: '⚠️' },
      'alaska_dnr_trespass_line_all': { name: 'ALASKA_DNR_TRESPASS_LINE', icon: '🚧' },
      'alaska_dnr_permit_lease_le_line_all': { name: 'ALASKA_DNR_PERMIT_LEASE_LE_LINE', icon: '📄' },
      'alaska_dnr_easement_line_all': { name: 'ALASKA_DNR_EASEMENT_LINE', icon: '🛤️' },
      'alaska_dnr_resource_sale_line_all': { name: 'ALASKA_DNR_RESOURCE_SALE_LINE', icon: '💰' },
      'alaska_dnr_federal_action_line_all': { name: 'ALASKA_DNR_FEDERAL_ACTION_LINE', icon: '🏛️' },
      'alaska_dnr_land_disposal_available_line_all': { name: 'ALASKA_DNR_LAND_DISPOSAL_AVAILABLE_LINE', icon: '🏘️' },
      'alaska_dnr_land_disposal_conveyed_line_all': { name: 'ALASKA_DNR_LAND_DISPOSAL_CONVEYED_LINE', icon: '📋' },
      'alaska_dnr_land_disposal_other_line_all': { name: 'ALASKA_DNR_LAND_DISPOSAL_OTHER_LINE', icon: '📝' },
      'alaska_dnr_management_agreement_line_all': { name: 'ALASKA_DNR_MANAGEMENT_AGREEMENT_LINE', icon: '🤝' },
      'alaska_dnr_other_state_acquired_le_line_all': { name: 'ALASKA_DNR_OTHER_STATE_ACQUIRED_LE_LINE', icon: '🏛️' },
      'alaska_dnr_rs2477_line_all': { name: 'ALASKA_DNR_RS2477_LINE', icon: '🛣️' },
      'alaska_dnr_state_selected_land_le_line_all': { name: 'ALASKA_DNR_STATE_SELECTED_LAND_LE_LINE', icon: '🗺️' },
      'alaska_dnr_state_ta_patented_le_line_all': { name: 'ALASKA_DNR_STATE_TA_PATENTED_LE_LINE', icon: '📜' },
      'alaska_dnr_land_estate_survey_boundary_line_all': { name: 'ALASKA_DNR_LAND_ESTATE_SURVEY_BOUNDARY_LINE', icon: '📏' },
      'alaska_dnr_land_estate_section_all': { name: 'ALASKA_DNR_LAND_ESTATE_SECTION', icon: '🗺️' },
      'alaska_dnr_agreement_settlement_recon_poly_all': { name: 'ALASKA_DNR_AGREEMENT_SETTLEMENT_RECON_POLY', icon: '📋' },
      'alaska_dnr_restricted_use_authorization_poly_all': { name: 'ALASKA_DNR_RESTRICTED_USE_AUTHORIZATION_POLY', icon: '🚫' },
      'alaska_dnr_potential_hazardous_sites_poly_all': { name: 'ALASKA_DNR_POTENTIAL_HAZARDOUS_SITES_POLY', icon: '⚠️' },
      'alaska_dnr_trespass_poly_all': { name: 'ALASKA_DNR_TRESPASS_POLY', icon: '🚧' },
      'alaska_dnr_permit_lease_le_poly_all': { name: 'ALASKA_DNR_PERMIT_LEASE_LE_POLY', icon: '📄' },
      'alaska_dnr_easement_poly_all': { name: 'ALASKA_DNR_EASEMENT_POLY', icon: '🛤️' },
      'alaska_dnr_resource_sale_poly_all': { name: 'ALASKA_DNR_RESOURCE_SALE_POLY', icon: '💰' },
      'alaska_dnr_federal_action_poly_all': { name: 'ALASKA_DNR_FEDERAL_ACTION_POLY', icon: '🏛️' },
      'alaska_dnr_land_disposal_available_poly_all': { name: 'ALASKA_DNR_LAND_DISPOSAL_AVAILABLE_POLY', icon: '🏘️' },
      'alaska_dnr_land_disposal_conveyed_poly_all': { name: 'ALASKA_DNR_LAND_DISPOSAL_CONVEYED_POLY', icon: '📋' },
      'alaska_dnr_land_disposal_other_poly_all': { name: 'ALASKA_DNR_LAND_DISPOSAL_OTHER_POLY', icon: '📝' },
      'alaska_dnr_management_agreement_poly_all': { name: 'ALASKA_DNR_MANAGEMENT_AGREEMENT_POLY', icon: '🤝' },
      'alaska_dnr_mental_health_trust_land_poly_all': { name: 'ALASKA_DNR_MENTAL_HEALTH_TRUST_LAND_POLY', icon: '🏥' },
      'alaska_dnr_municipal_entitlement_poly_all': { name: 'ALASKA_DNR_MUNICIPAL_ENTITLEMENT_POLY', icon: '🏙️' },
      'alaska_dnr_municipal_tideland_poly_all': { name: 'ALASKA_DNR_MUNICIPAL_TIDELAND_POLY', icon: '🌊' },
      'alaska_dnr_state_interest_native_allotment_poly_all': { name: 'ALASKA_DNR_STATE_INTEREST_NATIVE_ALLOTMENT_POLY', icon: '🏘️' },
      'alaska_dnr_other_state_acquired_le_poly_all': { name: 'ALASKA_DNR_OTHER_STATE_ACQUIRED_LE_POLY', icon: '🏛️' },
      'alaska_dnr_state_selected_or_anilca_topfiled_land_le_poly_all': { name: 'ALASKA_DNR_STATE_SELECTED_OR_ANILCA_TOPFILED_LAND_LE_POLY', icon: '🗺️' },
      'alaska_dnr_state_ta_patented_le_poly_all': { name: 'ALASKA_DNR_STATE_TA_PATENTED_LE_POLY', icon: '📜' },
      'alaska_dnr_land_estate_survey_boundary_poly_all': { name: 'ALASKA_DNR_LAND_ESTATE_SURVEY_BOUNDARY_POLY', icon: '📋' },
      'alaska_dnr_land_estate_recording_district_boundary_all': { name: 'ALASKA_DNR_LAND_ESTATE_RECORDING_DISTRICT_BOUNDARY', icon: '🏛️' },
      'alaska_dnr_land_estate_township_all': { name: 'ALASKA_DNR_LAND_ESTATE_TOWNSHIP', icon: '🏘️' },
      'alaska_dnr_mineral_estate_agreement_settlement_recon_point_all': { name: 'ALASKA_DNR_MINERAL_ESTATE_AGREEMENT_SETTLEMENT_RECON_POINT', icon: '📋' },
      'alaska_dnr_mineral_estate_agreement_settlement_recon_line_all': { name: 'ALASKA_DNR_MINERAL_ESTATE_AGREEMENT_SETTLEMENT_RECON_LINE', icon: '📏' },
      'alaska_dnr_mineral_estate_federal_action_line_all': { name: 'ALASKA_DNR_MINERAL_ESTATE_FEDERAL_ACTION_LINE', icon: '🏛️' },
      'alaska_dnr_mineral_estate_leasehold_location_line_all': { name: 'ALASKA_DNR_MINERAL_ESTATE_LEASEHOLD_LOCATION_LINE', icon: '📍' },
      'alaska_dnr_mineral_estate_management_agreement_line_all': { name: 'ALASKA_DNR_MINERAL_ESTATE_MANAGEMENT_AGREEMENT_LINE', icon: '📄' },
      'alaska_dnr_mineral_estate_mineral_order_line_all': { name: 'ALASKA_DNR_MINERAL_ESTATE_MINERAL_ORDER_LINE', icon: '⛏️' },
      'alaska_dnr_mineral_estate_agreement_settlement_recon_poly_all': { name: 'ALASKA_DNR_MINERAL_ESTATE_AGREEMENT_SETTLEMENT_RECON_POLY', icon: '📋' },
      'alaska_dnr_mineral_estate_federal_action_poly_all': { name: 'ALASKA_DNR_MINERAL_ESTATE_FEDERAL_ACTION_POLY', icon: '🏛️' },
      'alaska_dnr_mineral_estate_leasehold_location_poly_all': { name: 'ALASKA_DNR_MINERAL_ESTATE_LEASEHOLD_LOCATION_POLY', icon: '📍' },
      'alaska_dnr_mineral_estate_management_agreement_poly_all': { name: 'ALASKA_DNR_MINERAL_ESTATE_MANAGEMENT_AGREEMENT_POLY', icon: '📄' },
      'alaska_dnr_mineral_estate_mental_health_trust_land_poly_all': { name: 'ALASKA_DNR_MINERAL_ESTATE_MENTAL_HEALTH_TRUST_LAND_POLY', icon: '🏥' },
      'alaska_dnr_mineral_estate_mineral_order_poly_all': { name: 'ALASKA_DNR_MINERAL_ESTATE_MINERAL_ORDER_POLY', icon: '⛏️' },
      'alaska_dnr_mineral_estate_state_interest_native_allotment_poly_all': { name: 'ALASKA_DNR_MINERAL_ESTATE_STATE_INTEREST_NATIVE_ALLOTMENT_POLY', icon: '🏛️' },
      'alaska_dnr_mineral_estate_oil_gas_lease_sale_tract_current_all': { name: 'ALASKA_DNR_MINERAL_ESTATE_OIL_GAS_LEASE_SALE_TRACT_CURRENT', icon: '🛢️' },
      'alaska_dnr_mineral_estate_other_state_acquired_me_line_all': { name: 'ALASKA_DNR_MINERAL_ESTATE_OTHER_STATE_ACQUIRED_ME_LINE', icon: '📍' },
      'alaska_dnr_mineral_estate_other_state_acquired_me_poly_all': { name: 'ALASKA_DNR_MINERAL_ESTATE_OTHER_STATE_ACQUIRED_ME_POLY', icon: '📍' },
      'alaska_dnr_mineral_estate_permit_lease_me_poly_all': { name: 'ALASKA_DNR_MINERAL_ESTATE_PERMIT_LEASE_ME_POLY', icon: '📄' },
      'alaska_dnr_mineral_estate_state_mining_claim_poly_all': { name: 'ALASKA_DNR_MINERAL_ESTATE_STATE_MINING_CLAIM_POLY', icon: '⛏️' },
      'alaska_dnr_mineral_estate_state_mining_claim_pending_poly_all': { name: 'ALASKA_DNR_MINERAL_ESTATE_STATE_MINING_CLAIM_PENDING_POLY', icon: '⏳' },
      'alaska_dnr_mineral_estate_state_mining_claim_closed_poly_all': { name: 'ALASKA_DNR_MINERAL_ESTATE_STATE_MINING_CLAIM_CLOSED_POLY', icon: '🔒' },
      'alaska_dnr_mineral_estate_state_prospecting_site_poly_all': { name: 'ALASKA_DNR_MINERAL_ESTATE_STATE_PROSPECTING_SITE_POLY', icon: '🔍' },
      'alaska_dnr_mineral_estate_municipal_entitlement_poly_all': { name: 'ALASKA_DNR_MINERAL_ESTATE_MUNICIPAL_ENTITLEMENT_POLY', icon: '🏙️' },
      'alaska_dnr_mineral_estate_state_selected_land_me_line_all': { name: 'ALASKA_DNR_MINERAL_ESTATE_STATE_SELECTED_LAND_ME_LINE', icon: '🗺️' },
      'alaska_dnr_mineral_estate_state_selected_or_anilca_topfiled_land_me_poly_all': { name: 'ALASKA_DNR_MINERAL_ESTATE_STATE_SELECTED_OR_ANILCA_TOPFILED_LAND_ME_POLY', icon: '🗺️' },
      'alaska_dnr_mineral_estate_state_ta_patented_me_line_all': { name: 'ALASKA_DNR_MINERAL_ESTATE_STATE_TA_PATENTED_ME_LINE', icon: '📜' },
      'alaska_dnr_mineral_estate_state_ta_patented_me_poly_all': { name: 'ALASKA_DNR_MINERAL_ESTATE_STATE_TA_PATENTED_ME_POLY', icon: '📜' },
      'alaska_dnr_mineral_estate_survey_boundary_pt_all': { name: 'ALASKA_DNR_MINERAL_ESTATE_SURVEY_BOUNDARY_PT', icon: '📍' },
      'alaska_dnr_mineral_estate_survey_boundary_line_all': { name: 'ALASKA_DNR_MINERAL_ESTATE_SURVEY_BOUNDARY_LINE', icon: '📏' },
      'alaska_dnr_mineral_estate_survey_boundary_poly_all': { name: 'ALASKA_DNR_MINERAL_ESTATE_SURVEY_BOUNDARY_POLY', icon: '🗺️' },
      'alaska_dnr_mineral_estate_recording_district_boundary_all': { name: 'ALASKA_DNR_MINERAL_ESTATE_RECORDING_DISTRICT_BOUNDARY', icon: '🏛️' },
      'alaska_dnr_mineral_estate_well_site_point_all': { name: 'ALASKA_DNR_MINERAL_ESTATE_WELL_SITE_POINT', icon: '⛽' },
      'alaska_dnr_mineral_estate_dcced_cra_borough_boundary_all': { name: 'ALASKA_DNR_MINERAL_ESTATE_DCCED_CRA_BOROUGH_BOUNDARY', icon: '🏛️' },
      'alaska_dnr_mineral_estate_township_all': { name: 'ALASKA_DNR_MINERAL_ESTATE_TOWNSHIP', icon: '🏘️' },
      'alaska_dnr_mht_trust_land_survey_all': { name: 'ALASKA_DNR_MHT_TRUST_LAND_SURVEY', icon: '🗺️' },
      'alaska_dnr_mht_other_activity_all': { name: 'ALASKA_DNR_MHT_OTHER_ACTIVITY', icon: '📋' },
      'alaska_dnr_mht_trespass_point_all': { name: 'ALASKA_DNR_MHT_TRESPASS_POINT', icon: '📍' },
      'alaska_dnr_mht_trespass_line_all': { name: 'ALASKA_DNR_MHT_TRESPASS_LINE', icon: '📏' },
      'alaska_dnr_mht_trespass_area_all': { name: 'ALASKA_DNR_MHT_TRESPASS_AREA', icon: '🚫' },
      'alaska_dnr_mht_easements_all': { name: 'ALASKA_DNR_MHT_EASEMENTS', icon: '🛤️' },
      'alaska_dnr_mht_easement_point_all': { name: 'ALASKA_DNR_MHT_EASEMENT_POINT', icon: '📍' },
      'alaska_dnr_mht_easement_line_all': { name: 'ALASKA_DNR_MHT_EASEMENT_LINE', icon: '📏' },
      'alaska_dnr_mht_easement_area_all': { name: 'ALASKA_DNR_MHT_EASEMENT_AREA', icon: '🛤️' },
      'alaska_dnr_mht_land_sales_all': { name: 'ALASKA_DNR_MHT_LAND_SALES', icon: '🏠' },
      'alaska_dnr_mht_land_sale_conveyed_all': { name: 'ALASKA_DNR_MHT_LAND_SALE_CONVEYED', icon: '✅' },
      'alaska_dnr_mht_land_sale_contract_all': { name: 'ALASKA_DNR_MHT_LAND_SALE_CONTRACT', icon: '📝' },
      'alaska_dnr_mht_land_sale_available_otc_all': { name: 'ALASKA_DNR_MHT_LAND_SALE_AVAILABLE_OTC', icon: '🛒' },
      'alaska_dnr_mht_land_sale_pending_interest_all': { name: 'ALASKA_DNR_MHT_LAND_SALE_PENDING_INTEREST', icon: '⏳' },
      'alaska_dnr_mht_land_sale_potential_reoffer_all': { name: 'ALASKA_DNR_MHT_LAND_SALE_POTENTIAL_REOFFER', icon: '🔄' },
      'alaska_dnr_mht_land_sale_new_inventory_all': { name: 'ALASKA_DNR_MHT_LAND_SALE_NEW_INVENTORY', icon: '🆕' },
      'alaska_dnr_mht_land_sale_predisposal_all': { name: 'ALASKA_DNR_MHT_LAND_SALE_PREDISPOSAL', icon: '📦' },
      'alaska_dnr_mht_land_sale_all_all': { name: 'ALASKA_DNR_MHT_LAND_SALE_ALL', icon: '🏘️' },
      'alaska_dnr_mht_resource_sales_all': { name: 'ALASKA_DNR_MHT_RESOURCE_SALES', icon: '💰' },
      'alaska_dnr_mht_material_sale_all': { name: 'ALASKA_DNR_MHT_MATERIAL_SALE', icon: '⛏️' },
      'alaska_dnr_mht_timber_sale_all': { name: 'ALASKA_DNR_MHT_TIMBER_SALE', icon: '🌲' },
      'alaska_dnr_mht_land_leases_licenses_all': { name: 'ALASKA_DNR_MHT_LAND_LEASES_LICENSES', icon: '📄' },
      'alaska_dnr_mht_land_use_license_line_all': { name: 'ALASKA_DNR_MHT_LAND_USE_LICENSE_LINE', icon: '📏' },
      'alaska_dnr_mht_land_use_license_area_all': { name: 'ALASKA_DNR_MHT_LAND_USE_LICENSE_AREA', icon: '📋' },
      'alaska_dnr_mht_land_lease_all': { name: 'ALASKA_DNR_MHT_LAND_LEASE', icon: '🏢' },
      'alaska_dnr_mht_mineral_leases_licenses_all': { name: 'ALASKA_DNR_MHT_MINERAL_LEASES_LICENSES', icon: '💎' },
      'alaska_dnr_mht_mineral_lease_all': { name: 'ALASKA_DNR_MHT_MINERAL_LEASE', icon: '⛏️' },
      'alaska_dnr_mht_oil_gas_lease_all': { name: 'ALASKA_DNR_MHT_OIL_GAS_LEASE', icon: '🛢️' },
      'alaska_dnr_mht_coal_lease_all': { name: 'ALASKA_DNR_MHT_COAL_LEASE', icon: '⚫' },
      'alaska_dnr_mht_mineral_exploration_license_all': { name: 'ALASKA_DNR_MHT_MINERAL_EXPLORATION_LICENSE', icon: '🔍' },
      'alaska_dnr_mht_oil_gas_exploration_license_all': { name: 'ALASKA_DNR_MHT_OIL_GAS_EXPLORATION_LICENSE', icon: '🔎' },
      'alaska_dnr_mht_coal_exploration_license_all': { name: 'ALASKA_DNR_MHT_COAL_EXPLORATION_LICENSE', icon: '🔬' },
      'alaska_dnr_mht_other_exploration_license_all': { name: 'ALASKA_DNR_MHT_OTHER_EXPLORATION_LICENSE', icon: '🔭' },
      'alaska_dnr_tundra_area_stations_all': { name: 'ALASKA_DNR_TUNDRA_AREA_STATIONS', icon: '📍' },
      'alaska_dnr_tundra_area_dalton_highway_all': { name: 'ALASKA_DNR_TUNDRA_AREA_DALTON_HIGHWAY', icon: '🛣️' },
      'alaska_dnr_tundra_area_tundra_regions_all': { name: 'ALASKA_DNR_TUNDRA_AREA_TUNDRA_REGIONS', icon: '🏔️' },
      'alaska_dnr_soil_water_conservation_districts_all': { name: 'ALASKA_DNR_SOIL_WATER_CONSERVATION_DISTRICTS', icon: '💧' },
      'alaska_dnr_astar_public_airports_0_all': { name: 'ALASKA_DNR_ASTAR_PUBLIC_AIRPORTS', icon: '✈️' },
      'alaska_dnr_astar_alaska_ports_harbors_all': { name: 'ALASKA_DNR_ASTAR_ALASKA_PORTS_HARBORS', icon: '⚓' },
      'alaska_dnr_astar_public_airports_2_all': { name: 'ALASKA_DNR_ASTAR_PUBLIC_AIRPORTS_2', icon: '🛫' },
      'alaska_dnr_astar_dew_line_sites_all': { name: 'ALASKA_DNR_ASTAR_DEW_LINE_SITES', icon: '📡' },
      'alaska_dnr_astar_roads_dot_all': { name: 'ALASKA_DNR_ASTAR_ROADS_DOT', icon: '🛣️' },
      'alaska_dnr_astar_all_roads_nssi_all': { name: 'ALASKA_DNR_ASTAR_ALL_ROADS_NSSI', icon: '🛣️' },
      'alaska_dnr_astar_village_roads_nsb_all': { name: 'ALASKA_DNR_ASTAR_VILLAGE_ROADS_NSB', icon: '🛣️' },
      'alaska_dnr_astar_trails_state_of_alaska_all': { name: 'ALASKA_DNR_ASTAR_TRAILS_STATE_OF_ALASKA', icon: '🥾' },
      'alaska_dnr_astar_airport_runway_usgs_all': { name: 'ALASKA_DNR_ASTAR_AIRPORT_RUNWAY_USGS', icon: '🛬' },
      'alaska_dnr_astar_easements_nsb_all': { name: 'ALASKA_DNR_ASTAR_EASEMENTS_NSB', icon: '🛤️' },
      'alaska_dnr_astar_parcels_nsb_all': { name: 'ALASKA_DNR_ASTAR_PARCELS_NSB', icon: '🏘️' },
      'alaska_dnr_astar_map_north_slope_communities_all': { name: 'ALASKA_DNR_ASTAR_MAP_NORTH_SLOPE_COMMUNITIES', icon: '🏘️' },
      'alaska_dnr_astar_map_existing_mineral_resource_all': { name: 'ALASKA_DNR_ASTAR_MAP_EXISTING_MINERAL_RESOURCE', icon: '⛏️' },
      'alaska_dnr_astar_map_potential_marine_facilities_all': { name: 'ALASKA_DNR_ASTAR_MAP_POTENTIAL_MARINE_FACILITIES', icon: '⚓' },
      'alaska_dnr_astar_map_resource_areas_all': { name: 'ALASKA_DNR_ASTAR_MAP_RESOURCE_AREAS', icon: '🗺️' },
      'alaska_dnr_astar_map_transportation_corridors_potential_all': { name: 'ALASKA_DNR_ASTAR_MAP_TRANSPORTATION_CORRIDORS_POTENTIAL', icon: '🛣️' },
      'alaska_dnr_astar_map_asap_proposed_all': { name: 'ALASKA_DNR_ASTAR_MAP_ASAP_PROPOSED', icon: '📋' },
      'alaska_dnr_astar_map_existing_roads_all': { name: 'ALASKA_DNR_ASTAR_MAP_EXISTING_ROADS', icon: '🛣️' },
      'alaska_dnr_astar_map_existing_infrastructure_all': { name: 'ALASKA_DNR_ASTAR_MAP_EXISTING_INFRASTRUCTURE', icon: '🏗️' },
      'alaska_dnr_astar_map_anwr_1002_boundary_all': { name: 'ALASKA_DNR_ASTAR_MAP_ANWR_1002_BOUNDARY', icon: '🗺️' },
      'alaska_dnr_astar_map_csu_all': { name: 'ALASKA_DNR_ASTAR_MAP_CSU', icon: '📐' },
      'alaska_dnr_astar_map_usgs_mining_tracts_all': { name: 'ALASKA_DNR_ASTAR_MAP_USGS_MINING_TRACT', icon: '⛏️' },
      'alaska_dnr_astar_map_ownership_all': { name: 'ALASKA_DNR_ASTAR_MAP_OWNERSHIP', icon: '🏛️' },
      'alaska_dnr_ws_hydro_base_glacier_1mil_py_all': { name: 'ALASKA_DNR_WS_HYDRO_BASE_GLACIER_1MIL_PY', icon: '🧊' },
      'alaska_dnr_infrastructure_power_line_all': { name: 'ALASKA_DNR_INFRASTRUCTURE_POWER_LINE', icon: '⚡' },
      'alaska_dnr_infrastructure_pipeline_all': { name: 'ALASKA_DNR_INFRASTRUCTURE_PIPELINE', icon: '🛢️' },
      'alaska_dnr_infrastructure_fiberoptic_cable_all': { name: 'ALASKA_DNR_INFRASTRUCTURE_FIBEROPTIC_CABLE', icon: '📡' },
      'alaska_dnr_ws_hydro_base_river_1mil_ln_all': { name: 'ALASKA_DNR_WS_HYDRO_BASE_RIVER_1MIL_LN', icon: '🌊' },
      'alaska_dnr_ws_hydro_base_lake_1mil_py_all': { name: 'ALASKA_DNR_WS_HYDRO_BASE_LAKE_1MIL_PY', icon: '💧' },
      'alaska_dnr_mht_tlo_land_exchange_all': { name: 'ALASKA_DNR_MHT_TLO_LAND_EXCHANGE', icon: '🔄' },
      'alaska_dnr_mht_tlo_agreement_all': { name: 'ALASKA_DNR_MHT_TLO_AGREEMENT', icon: '📜' },
      'alaska_dnr_mht_title_all': { name: 'ALASKA_DNR_MHT_TITLE', icon: '📑' },
      'alaska_dnr_mht_mental_health_parcel_all': { name: 'ALASKA_DNR_MHT_MENTAL_HEALTH_PARCEL', icon: '🏥' },
      'alaska_dnr_mht_mental_health_land_qcd_all': { name: 'ALASKA_DNR_MHT_MENTAL_HEALTH_LAND_QCD', icon: '🏥' }
    };
    
    if (alaskaDNRLayerMap[key] && Array.isArray(value)) {
      const layerInfo = alaskaDNRLayerMap[key];
      value.forEach((feature: any) => {
        // Handle Alaska DNR features - points, polylines, and polygons
        const featureName = feature.name || feature.NAME || feature.NAME1 || feature.NAME2 ||
          feature.Station_Name || feature.station_name || feature.STATION_NAME ||
          feature.SITE_NAME || feature.site_name || feature.SITE_NAME_ ||
          feature.layerName || feature.LAYER_NAME || feature.LayerName ||
          feature.OBJECTID || feature.objectid || feature.ObjectId || 'Unknown';
        const distance = feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : '';
        const isContaining = feature.isContaining ? 'Yes' : 'No';
        
        // Extract coordinates from geometry or attributes
        let lat = '';
        let lon = '';
        if (feature.Latitude && feature.Longitude) {
          lat = feature.Latitude.toString();
          lon = feature.Longitude.toString();
        } else if (feature.geometry) {
          if (feature.geometry.x !== undefined && feature.geometry.y !== undefined) {
            lat = feature.geometry.y.toString();
            lon = feature.geometry.x.toString();
          } else if (feature.geometry.paths && feature.geometry.paths.length > 0) {
            // Polyline - use first point of first path
            const firstPath = feature.geometry.paths[0];
            if (firstPath && firstPath.length > 0) {
              const firstPoint = firstPath[0];
              lat = firstPoint[1].toString();
              lon = firstPoint[0].toString();
            }
          } else if (feature.geometry.rings && feature.geometry.rings.length > 0) {
            // Polygon - use first point of first ring
            const firstRing = feature.geometry.rings[0];
            if (firstRing && firstRing.length > 0) {
              const firstPoint = firstRing[0];
              lat = firstPoint[1].toString();
              lon = firstPoint[0].toString();
            }
          }
        }
        
        if (!lat || !lon) {
          lat = location.lat.toString();
          lon = location.lon.toString();
        }
        
        const allAttributes = { ...feature };
        delete allAttributes.objectid;
        delete allAttributes.OBJECTID;
        delete allAttributes.ObjectId;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.layerId;
        delete allAttributes.layerName;
        delete allAttributes.Latitude;
        delete allAttributes.Longitude;
        delete allAttributes.latitude;
        delete allAttributes.longitude;
        delete allAttributes.isContaining;
        const attributesJson = JSON.stringify(allAttributes);
        
        // Build description
        let description = featureName;
        if (feature.isContaining) description += ' (Contains Point)';
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'Alaska DNR',
          (location.confidence || 'N/A').toString(),
          layerInfo.name,
          description,
          lat || location.lat.toString(),
          lon || location.lon.toString(),
          distance,
          featureName,
          isContaining,
          '',
          '',
          attributesJson,
          'Alaska DNR'
        ]);
      });
    }
    
    if (bostonLayerMap[key] && Array.isArray(value)) {
      const layerInfo = bostonLayerMap[key];
      value.forEach((feature: any) => {
        // Handle charging stations, blue bike stations, bicycle network, managed streets, open space, park features, pavement markings, parcels, census tracts, and MBTA stops
        const stationName = feature.Station_Name || feature.station_name || feature.STATION_NAME || 
          feature.STATION || feature.station || feature.Station ||
          feature.Name || feature.name || feature.NAME || feature.NAME10 || feature.name10 ||
          feature.STREET_NAM || feature.street_nam || feature.STREET_NAME || 
          feature.STREETNAME || feature.streetname ||
          feature.SITE_NAME || feature.site_name || feature.SITE_NAME_ ||
          feature.Park_Name || feature.park_name || feature.PARK_NAME || 
          feature.Play_Name || feature.play_name || feature.PLAY_NAME ||
          feature.School_Name || feature.school_name || feature.SCHOOL_NAME ||
          feature.Crosswalk_ID || feature.crosswalk_id || feature.CROSSWALK_ID ||
          feature.Segment_ID || feature.segment_id || feature.SEGMENT_ID ||
          feature.MAP_PAR_ID || feature.map_par_id || feature.MAP_PAR_ID_ ||
          feature.Tract || feature.tract || feature.TRACT || 
          feature.GEOID || feature.geoid || feature.GEOID10 || feature.geoid10 || 
          feature.Neighborhood || feature.neighborhood || feature.NEIGHBORHOOD ||
          feature.City || feature.city || feature.CITY ||
          feature.DISTRICT_NAME || feature.district_name || feature.District_Name ||
          feature.District || feature.district || feature.DISTRICT ||
          feature.PWD_DISTRICT || feature.pwd_district || feature.PWD_District ||
          feature.SNOW_DISTRICT || feature.snow_district || feature.Snow_District || 'Unknown';
        const streetAddress = feature.Street_Address || feature.street_address || feature.STREET_ADDRESS || feature.address || '';
        const city = feature.City || feature.city || feature.CITY || feature.District || feature.district || 'Boston';
        const distance = feature.distance_miles !== null && feature.distance_miles !== undefined ? feature.distance_miles.toFixed(2) : '';
        
        // Extract coordinates from geometry or attributes
        let lat = '';
        let lon = '';
        if (feature.Latitude && feature.Longitude) {
          lat = feature.Latitude.toString();
          lon = feature.Longitude.toString();
        } else if (feature.geometry) {
          if (feature.geometry.x !== undefined && feature.geometry.y !== undefined) {
            lat = feature.geometry.y.toString();
            lon = feature.geometry.x.toString();
          } else if (feature.geometry.paths && feature.geometry.paths.length > 0) {
            // Polyline - use first point of first path
            const firstPath = feature.geometry.paths[0];
            if (firstPath && firstPath.length > 0) {
              const firstPoint = firstPath[0];
              lat = firstPoint[1].toString();
              lon = firstPoint[0].toString();
            }
          } else if (feature.geometry.rings && feature.geometry.rings.length > 0) {
            // Polygon - use first point of first ring
            const firstRing = feature.geometry.rings[0];
            if (firstRing && firstRing.length > 0) {
              const firstPoint = firstRing[0];
              lat = firstPoint[1].toString();
              lon = firstPoint[0].toString();
            }
          }
        }
        
        if (!lat || !lon) {
          lat = location.lat.toString();
          lon = location.lon.toString();
        }
        
        const allAttributes = { ...feature };
        delete allAttributes.objectid;
        delete allAttributes.OBJECTID;
        delete allAttributes.ObjectId;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.layerId;
        delete allAttributes.layerName;
        delete allAttributes.Latitude;
        delete allAttributes.Longitude;
        delete allAttributes.latitude;
        delete allAttributes.longitude;
        delete allAttributes.isContaining;
        const attributesJson = JSON.stringify(allAttributes);
        
        // Get phone/website for charging stations, total_docks for blue bike stations, facility type for bicycle network, length for managed streets, acres for open space, asset for park features, population for census tracts
        const phone = feature.Station_Phone || feature.station_phone || '';
        const website = feature.EV_Network_Web || feature.ev_network_web || '';
        const totalDocks = feature.Total_docks || feature.total_docks || feature.Total_Docks || '';
        const existingFacility = feature.ExisFacil || feature.exis_facil || feature.EXIS_FACIL || '';
        const lengthMi = feature.LENGTH_MI || feature.length_mi || feature.Length_Mi || '';
        const acres = feature.ACRES || feature.acres || feature.ACRES_ || '';
        const asset = feature.Asset || feature.asset || feature.ASSET || feature.Asset_ || '';
        const neighbor = feature.Neighbor || feature.neighbor || feature.NEIGHBOR || feature.Neighbor_ || '';
        const population = feature.Population || feature.population || feature.POPULATION || feature.POP2025 || feature.pop2025 || '';
        const households = feature.Households || feature.households || feature.HOUSEHOLDS || feature.HH2025 || feature.hh2025 || '';
        const housingUnits = feature.Housing_Units || feature.housing_units || feature.HOUSING_UNITS || feature.HU2025 || feature.hu2025 || '';
        const mbtaLine = feature.LINE || feature.line || feature.Line || '';
        const mbtaRoute = feature.ROUTE || feature.route || feature.Route || '';
        const isContaining = feature.isContaining ? 'Yes' : 'No';
        
        // Build description with relevant fields
        let description = stationName;
        if (mbtaLine) description += ` (${mbtaLine} Line)`;
        else if (mbtaRoute) description += ` (${mbtaRoute})`;
        else if (totalDocks) description += ` (${totalDocks} docks)`;
        else if (existingFacility) description += ` (${existingFacility})`;
        else if (lengthMi) description += ` (${lengthMi} mi)`;
        else if (acres) description += ` (${acres} acres)`;
        else if (asset) description += ` (${asset})`;
        else if (population) {
          const popValue = typeof population === 'number' ? population.toLocaleString() : population;
          description += ` (Pop: ${popValue})`;
        } else if (households) {
          const hhValue = typeof households === 'number' ? households.toLocaleString() : households;
          description += ` (HH: ${hhValue})`;
        } else if (housingUnits) {
          const huValue = typeof housingUnits === 'number' ? housingUnits.toLocaleString() : housingUnits;
          description += ` (HU: ${huValue})`;
        }
        if (feature.isContaining) description += ' (Contains Point)';
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'Boston Open Data',
          (location.confidence || 'N/A').toString(),
          layerInfo.name,
          description,
          lat || location.lat.toString(),
          lon || location.lon.toString(),
          distance,
          streetAddress ? `${streetAddress}, ${city}` : neighbor ? neighbor : city,
          `${attributesJson}${feature.isContaining !== undefined ? ` | Contains Point: ${isContaining}` : ''}`,
          phone,
          website,
          'Boston Open Data'
        ]);
      });
    }
    
    // Add LA County Hazards data rows
    const hazardsLayerMap: Record<string, { name: string, icon: string }> = {
      'la_county_fire_hazards_all': { name: 'LA_COUNTY_FIRE_HAZARDS', icon: '🔥' },
      'la_county_fire_hazard_responsibility_areas_all': { name: 'LA_COUNTY_FIRE_HAZARD_RESPONSIBILITY_AREAS', icon: '🔥' },
      'la_county_fire_hazard_severity_zones_all': { name: 'LA_COUNTY_FIRE_HAZARD_SEVERITY_ZONES', icon: '🔥' },
      'la_county_fire_hazard_severity_zones_lra_all': { name: 'LA_COUNTY_FIRE_HAZARD_SEVERITY_ZONES_LRA', icon: '🔥' },
      'la_county_fire_hazard_severity_zones_sra_all': { name: 'LA_COUNTY_FIRE_HAZARD_SEVERITY_ZONES_SRA', icon: '🔥' },
      'la_county_earthquake_hazards_all': { name: 'LA_COUNTY_EARTHQUAKE_HAZARDS', icon: '🌍' },
      'la_county_alquist_priolo_fault_traces_all': { name: 'LA_COUNTY_ALQUIST_PRIOLO_FAULT_TRACES', icon: '⚡' },
      'la_county_alquist_priolo_fault_zones_all': { name: 'LA_COUNTY_ALQUIST_PRIOLO_FAULT_ZONES', icon: '⚡' },
      'la_county_usgs_faults_all': { name: 'LA_COUNTY_USGS_FAULTS', icon: '⚡' },
      'la_county_tsunami_inundation_runup_line_all': { name: 'LA_COUNTY_TSUNAMI_INUNDATION_RUNUP_LINE', icon: '🌊' },
      'la_county_tsunami_inundation_zones_all': { name: 'LA_COUNTY_TSUNAMI_INUNDATION_ZONES', icon: '🌊' },
      'la_county_landslide_zones_all': { name: 'LA_COUNTY_LANDSLIDE_ZONES', icon: '⛰️' },
      'la_county_liquefaction_zones_all': { name: 'LA_COUNTY_LIQUEFACTION_ZONES', icon: '🌋' },
      'la_county_flood_hazards_all': { name: 'LA_COUNTY_FLOOD_HAZARDS', icon: '💧' },
      'la_county_100_year_flood_plain_all': { name: 'LA_COUNTY_100_YEAR_FLOOD_PLAIN', icon: '💧' },
      'la_county_500_year_flood_plain_all': { name: 'LA_COUNTY_500_YEAR_FLOOD_PLAIN', icon: '💧' },
      'la_county_dam_inundation_eta_all': { name: 'LA_COUNTY_DAM_INUNDATION_ETA', icon: '🏗️' },
      'la_county_dam_inundation_areas_all': { name: 'LA_COUNTY_DAM_INUNDATION_AREAS', icon: '🏗️' }
    };
    
    if (hazardsLayerMap[key] && Array.isArray(value)) {
      const layerInfo = hazardsLayerMap[key];
      value.forEach((hazard: any) => {
        const hazardId = hazard.hazardId || hazard.OBJECTID || hazard.objectid || 'Unknown';
        const distance = hazard.distance_miles !== null && hazard.distance_miles !== undefined ? hazard.distance_miles.toFixed(2) : (hazard.isContaining ? '0.00' : '');
        
        const allAttributes = { ...hazard };
        delete allAttributes.hazardId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'LA County Public GIS',
          (location.confidence || 'N/A').toString(),
          layerInfo.name,
          `Hazard ${hazardId}`,
          location.lat.toString(),
          location.lon.toString(),
          distance,
          hazard.isContaining ? 'Within Hazard Area' : `Nearby Hazard (${distance} miles)`,
          attributesJson,
          '',
          '',
          'LA County Public GIS'
        ]);
      });
    }
    
    // Export UK Local Authority Districts data
    if (key === 'uk_local_authority_districts_all' && Array.isArray(value)) {
      value.forEach((district: any) => {
        const districtName = district.lad25nm || district.LAD25NM || 'Unknown District';
        const districtCode = district.lad25cd || district.LAD25CD || '';
        const bngE = district.bngE !== null && district.bngE !== undefined ? district.bngE.toString() : (district.BNG_E !== null && district.BNG_E !== undefined ? district.BNG_E.toString() : '');
        const bngN = district.bngN !== null && district.bngN !== undefined ? district.bngN.toString() : (district.BNG_N !== null && district.BNG_N !== undefined ? district.BNG_N.toString() : '');
        const distance = district.distance_miles !== null && district.distance_miles !== undefined ? district.distance_miles.toFixed(2) : (district.isContaining ? '0.00' : '');
        const isContaining = district.isContaining ? 'Yes' : 'No';
        
        // Extract coordinates from geometry (polygon - use first coordinate)
        let lat = '';
        let lon = '';
        if (district.geometry && district.geometry.rings && district.geometry.rings.length > 0) {
          const outerRing = district.geometry.rings[0];
          if (outerRing && outerRing.length > 0) {
            lat = outerRing[0][1].toString();
            lon = outerRing[0][0].toString();
          }
        } else if (district.lat !== null && district.lat !== undefined && district.long !== null && district.long !== undefined) {
          lat = district.lat.toString();
          lon = district.long.toString();
        } else {
          lat = location.lat.toString();
          lon = location.lon.toString();
        }
        
        const allAttributes = { ...district };
        delete allAttributes.geometry;
        delete allAttributes.__geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.FID;
        delete allAttributes.fid;
        delete allAttributes.lad25cd;
        delete allAttributes.LAD25CD;
        delete allAttributes.lad25nm;
        delete allAttributes.LAD25NM;
        delete allAttributes.lad25nmw;
        delete allAttributes.LAD25NMW;
        delete allAttributes.bngE;
        delete allAttributes.BNG_E;
        delete allAttributes.bngN;
        delete allAttributes.BNG_N;
        delete allAttributes.shapeArea;
        delete allAttributes.Shape__Area;
        delete allAttributes.shapeLength;
        delete allAttributes.Shape__Length;
        delete allAttributes.globalId;
        delete allAttributes.GlobalID;
        delete allAttributes.GLOBALID;
        delete allAttributes.lat;
        delete allAttributes.LAT;
        delete allAttributes.long;
        delete allAttributes.LONG;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'UK Office for National Statistics',
          (location.confidence || 'N/A').toString(),
          'UK_LOCAL_AUTHORITY_DISTRICTS',
          districtCode || districtName,
          lat || location.lat.toString(),
          lon || location.lon.toString(),
          distance,
          districtName,
          isContaining,
          bngE || '',
          bngN || '',
          '',
          '',
          attributesJson,
          'UK Office for National Statistics'
        ]);
      });
    }

    // Export UK Counties & Unitary Authorities data
    if (key === 'uk_counties_unitary_authorities_all' && Array.isArray(value)) {
      value.forEach((unit: any) => {
        const unitName = unit.ctyua21nm || unit.CTYUA21NM || 'Unknown County / Unitary Authority';
        const unitCode = unit.ctyua21cd || unit.CTYUA21CD || '';
        const bngE = unit.bngE !== null && unit.bngE !== undefined
          ? unit.bngE.toString()
          : (unit.BNG_E !== null && unit.BNG_E !== undefined ? unit.BNG_E.toString() : '');
        const bngN = unit.bngN !== null && unit.bngN !== undefined
          ? unit.bngN.toString()
          : (unit.BNG_N !== null && unit.BNG_N !== undefined ? unit.BNG_N.toString() : '');
        const distance = unit.distance_miles !== null && unit.distance_miles !== undefined
          ? unit.distance_miles.toFixed(2)
          : (unit.isContaining ? '0.00' : '');
        const isContaining = unit.isContaining ? 'Yes' : 'No';

        // Extract coordinates from geometry (polygon - use first coordinate) or lat/long, else location
        let lat = '';
        let lon = '';
        if (unit.geometry && unit.geometry.rings && unit.geometry.rings.length > 0) {
          const outerRing = unit.geometry.rings[0];
          if (outerRing && outerRing.length > 0) {
            lat = outerRing[0][1].toString();
            lon = outerRing[0][0].toString();
          }
        } else if (unit.lat !== null && unit.lat !== undefined && unit.long !== null && unit.long !== undefined) {
          lat = unit.lat.toString();
          lon = unit.long.toString();
        } else {
          lat = location.lat.toString();
          lon = location.lon.toString();
        }

        const allAttributes = { ...unit };
        delete allAttributes.geometry;
        delete allAttributes.__geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.FID;
        delete allAttributes.fid;
        delete allAttributes.ctyua21cd;
        delete allAttributes.CTYUA21CD;
        delete allAttributes.ctyua21nm;
        delete allAttributes.CTYUA21NM;
        delete allAttributes.ctyua21nmw;
        delete allAttributes.CTYUA21NMW;
        delete allAttributes.bngE;
        delete allAttributes.BNG_E;
        delete allAttributes.bngN;
        delete allAttributes.BNG_N;
        delete allAttributes.shapeArea;
        delete allAttributes.Shape__Area;
        delete allAttributes.shapeLength;
        delete allAttributes.Shape__Length;
        delete allAttributes.globalId;
        delete allAttributes.GlobalID;
        delete allAttributes.GLOBALID;
        delete allAttributes.lat;
        delete allAttributes.LAT;
        delete allAttributes.long;
        delete allAttributes.LONG;
        const attributesJson = JSON.stringify(allAttributes);

        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'UK Office for National Statistics',
          (location.confidence || 'N/A').toString(),
          'UK_COUNTIES_UNITARY_AUTHORITIES',
          unitCode || unitName,
          lat || location.lat.toString(),
          lon || location.lon.toString(),
          distance,
          unitName,
          isContaining,
          bngE || '',
          bngN || '',
          '',
          '',
          attributesJson,
          'UK Office for National Statistics'
        ]);
      });
    }

    // Export UK Workplace Zones data
    if (key === 'uk_workplace_zones_all' && Array.isArray(value)) {
      value.forEach((zone: any) => {
        const wzCode = zone.wz11cd || zone.WZ11CD || 'Unknown Workplace Zone';
        const ladCode = zone.lad11cd || zone.LAD11CD || '';
        const ladName = zone.lad11nm || zone.LAD11NM || '';
        const distance = zone.distance_miles !== null && zone.distance_miles !== undefined
          ? zone.distance_miles.toFixed(2)
          : (zone.isContaining ? '0.00' : '');
        const isContaining = zone.isContaining ? 'Yes' : 'No';

        // Use feature centroid if available, else location
        let lat = '';
        let lon = '';
        if (zone.lat !== null && zone.lat !== undefined && zone.long !== null && zone.long !== undefined) {
          lat = zone.lat.toString();
          lon = zone.long.toString();
        } else {
          lat = location.lat.toString();
          lon = location.lon.toString();
        }

        const allAttributes = { ...zone };
        delete allAttributes.geometry;
        delete allAttributes.__geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.FID;
        delete allAttributes.fid;
        delete allAttributes.wz11cd;
        delete allAttributes.WZ11CD;
        delete allAttributes.lad11cd;
        delete allAttributes.LAD11CD;
        delete allAttributes.lad11nm;
        delete allAttributes.LAD11NM;
        delete allAttributes.lad11nmw;
        delete allAttributes.LAD11NMW;
        delete allAttributes.shapeArea;
        delete allAttributes.Shape__Area;
        delete allAttributes.shapeLength;
        delete allAttributes.Shape__Length;
        delete allAttributes.globalId;
        delete allAttributes.GlobalID;
        delete allAttributes.GLOBALID;
        const attributesJson = JSON.stringify(allAttributes);

        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'UK Office for National Statistics',
          (location.confidence || 'N/A').toString(),
          'UK_WORKPLACE_ZONES_2011',
          wzCode,
          lat || location.lat.toString(),
          lon || location.lon.toString(),
          distance,
          ladName || ladCode,
          isContaining,
          '',
          '',
          '',
          '',
          attributesJson,
          'UK Office for National Statistics'
        ]);
      });
    }

    // Export UK LSOA 2021 (RUC) data
    if (key === 'uk_lsoa_2021_ruc_all' && Array.isArray(value)) {
      value.forEach((lsoa: any) => {
        const lsoaCode = lsoa.lsoa21cd || lsoa.LSOA21CD || 'Unknown LSOA';
        const lsoaName = lsoa.lsoa21nm || lsoa.LSOA21NM || '';
        const rucName = lsoa.ruc21nm || lsoa.RUC21NM || '';
        const urbanRural = lsoa.urban_rural || lsoa.Urban_rura || '';
        const distance = lsoa.distance_miles !== null && lsoa.distance_miles !== undefined
          ? lsoa.distance_miles.toFixed(2)
          : (lsoa.isContaining ? '0.00' : '');
        const isContaining = lsoa.isContaining ? 'Yes' : 'No';

        // Use feature lat/long if available, else location
        let lat = '';
        let lon = '';
        if (lsoa.lat !== null && lsoa.lat !== undefined && lsoa.long !== null && lsoa.long !== undefined) {
          lat = lsoa.lat.toString();
          lon = lsoa.long.toString();
        } else {
          lat = location.lat.toString();
          lon = location.lon.toString();
        }

        const allAttributes = { ...lsoa };
        delete allAttributes.geometry;
        delete allAttributes.__geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.FID;
        delete allAttributes.fid;
        delete allAttributes.lsoa21cd;
        delete allAttributes.LSOA21CD;
        delete allAttributes.lsoa21nm;
        delete allAttributes.LSOA21NM;
        delete allAttributes.lsoa21nmw;
        delete allAttributes.LSOA21NMW;
        delete allAttributes.ruc21cd;
        delete allAttributes.RUC21CD;
        delete allAttributes.ruc21nm;
        delete allAttributes.RUC21NM;
        delete allAttributes.Urban_rura;
        delete allAttributes.urban_rural;
        delete allAttributes.shapeArea;
        delete allAttributes.Shape__Area;
        delete allAttributes.shapeLength;
        delete allAttributes.Shape__Length;
        delete allAttributes.globalId;
        delete allAttributes.GlobalID;
        delete allAttributes.GLOBALID;
        delete allAttributes.lat;
        delete allAttributes.LAT;
        delete allAttributes.long;
        delete allAttributes.LONG;
        const attributesJson = JSON.stringify(allAttributes);

        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'UK Office for National Statistics',
          (location.confidence || 'N/A').toString(),
          'UK_LSOA_2021_RUC',
          lsoaCode,
          lat || location.lat.toString(),
          lon || location.lon.toString(),
          distance,
          lsoaName || lsoaCode,
          isContaining,
          rucName || '',
          urbanRural || '',
          '',
          '',
          attributesJson,
          'UK Office for National Statistics'
        ]);
      });
    }

    // Export UK Wales Local Health Boards data
    if (key === 'uk_wales_local_health_boards_all' && Array.isArray(value)) {
      value.forEach((board: any) => {
        const lhbCode = board.lhb23cd || board.LHB23CD || 'Unknown Health Board';
        const lhbName = board.lhb23nm || board.LHB23NM || '';
        const distance = board.distance_miles !== null && board.distance_miles !== undefined
          ? board.distance_miles.toFixed(2)
          : (board.isContaining ? '0.00' : '');
        const isContaining = board.isContaining ? 'Yes' : 'No';

        let lat = '';
        let lon = '';
        if (board.geometry && board.geometry.rings && board.geometry.rings.length > 0) {
          const outerRing = board.geometry.rings[0];
          if (outerRing && outerRing.length > 0) {
            lat = outerRing[0][1].toString();
            lon = outerRing[0][0].toString();
          }
        } else {
          lat = location.lat.toString();
          lon = location.lon.toString();
        }

        const allAttributes = { ...board };
        delete allAttributes.geometry;
        delete allAttributes.__geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.FID;
        delete allAttributes.fid;
        delete allAttributes.lhb23cd;
        delete allAttributes.LHB23CD;
        delete allAttributes.lhb23nm;
        delete allAttributes.LHB23NM;
        delete allAttributes.shapeArea;
        delete allAttributes.Shape__Area;
        delete allAttributes.shapeLength;
        delete allAttributes.Shape__Length;
        delete allAttributes.globalId;
        delete allAttributes.GlobalID;
        delete allAttributes.GLOBALID;
        const attributesJson = JSON.stringify(allAttributes);

        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'UK Office for National Statistics',
          (location.confidence || 'N/A').toString(),
          'UK_WALES_LOCAL_HEALTH_BOARDS',
          lhbCode,
          lat || location.lat.toString(),
          lon || location.lon.toString(),
          distance,
          lhbName || lhbCode,
          isContaining,
          '',
          '',
          '',
          '',
          attributesJson,
          'UK Office for National Statistics'
        ]);
      });
      return;
    }
    
    // Export UK NSPL Postcode Centroids data
    if (key === 'uk_nspl_postcode_centroids_all' && Array.isArray(value)) {
      value.forEach((postcode: any) => {
        const pcd7 = postcode.pcd7 || postcode.PCD7 || 'Unknown Postcode';
        const pcd8 = postcode.pcd8 || postcode.PCD8 || '';
        const pcds = postcode.pcds || postcode.PCDS || '';
        const distance = postcode.distance_miles !== null && postcode.distance_miles !== undefined
          ? postcode.distance_miles.toFixed(2)
          : '';
        const lat = postcode.lat !== null && postcode.lat !== undefined ? postcode.lat.toString() : '';
        const lon = (postcode.lon !== null && postcode.lon !== undefined) ? postcode.lon.toString() : 
                    (postcode.long !== null && postcode.long !== undefined ? postcode.long.toString() : '');
        const oa21cd = postcode.oa21cd || postcode.OA21CD || '';
        const lad25cd = postcode.lad25cd || postcode.LAD25CD || '';
        const lsoa21cd = postcode.lsoa21cd || postcode.LSOA21CD || '';
        const msoa21cd = postcode.msoa21cd || postcode.MSOA21CD || '';

        const allAttributes = { ...postcode };
        delete allAttributes.geometry;
        delete allAttributes.__geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.FID;
        delete allAttributes.fid;
        delete allAttributes.pcd7;
        delete allAttributes.PCD7;
        delete allAttributes.pcd8;
        delete allAttributes.PCD8;
        delete allAttributes.pcds;
        delete allAttributes.PCDS;
        delete allAttributes.lat;
        delete allAttributes.LAT;
        delete allAttributes.long;
        delete allAttributes.LONG;
        delete allAttributes.oa21cd;
        delete allAttributes.OA21CD;
        delete allAttributes.lad25cd;
        delete allAttributes.LAD25CD;
        delete allAttributes.lsoa21cd;
        delete allAttributes.LSOA21CD;
        delete allAttributes.msoa21cd;
        delete allAttributes.MSOA21CD;
        const attributesJson = JSON.stringify(allAttributes);

        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'UK Office for National Statistics',
          (location.confidence || 'N/A').toString(),
          'UK_NSPL_POSTCODE_CENTROIDS',
          pcd7,
          lat || location.lat.toString(),
          lon || location.lon.toString(),
          distance,
          pcd8 || pcds || pcd7,
          '',
          oa21cd || '',
          lad25cd || '',
          lsoa21cd || '',
          msoa21cd || '',
          attributesJson,
          'UK Office for National Statistics'
        ]);
      });
      return;
    }
    
    // Export UK National Parks data
    if (key === 'uk_national_parks_all' && Array.isArray(value)) {
      value.forEach((park: any) => {
        const parkCode = park.npark22cd || park.NPARK22CD || 'Unknown Park';
        const parkName = park.npark22nm || park.NPARK22NM || '';
        const parkNameW = park.npark22nmw || park.NPARK22NMW || '';
        const distance = park.distance_miles !== null && park.distance_miles !== undefined
          ? park.distance_miles.toFixed(2)
          : (park.isContaining ? '0.00' : '');
        const isContaining = park.isContaining ? 'Yes' : 'No';

        let lat = '';
        let lon = '';
        if (park.geometry && park.geometry.rings && park.geometry.rings.length > 0) {
          const outerRing = park.geometry.rings[0];
          if (outerRing && outerRing.length > 0) {
            lat = outerRing[0][1].toString();
            lon = outerRing[0][0].toString();
          }
        } else if (park.lat !== null && park.lat !== undefined && park.long !== null && park.long !== undefined) {
          lat = park.lat.toString();
          lon = park.long.toString();
        } else {
          lat = location.lat.toString();
          lon = location.lon.toString();
        }

        const allAttributes = { ...park };
        delete allAttributes.geometry;
        delete allAttributes.__geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.FID;
        delete allAttributes.fid;
        delete allAttributes.npark22cd;
        delete allAttributes.NPARK22CD;
        delete allAttributes.npark22nm;
        delete allAttributes.NPARK22NM;
        delete allAttributes.npark22nmw;
        delete allAttributes.NPARK22NMW;
        delete allAttributes.bngE;
        delete allAttributes.BNG_E;
        delete allAttributes.bngN;
        delete allAttributes.BNG_N;
        delete allAttributes.lat;
        delete allAttributes.LAT;
        delete allAttributes.long;
        delete allAttributes.LONG;
        delete allAttributes.shapeArea;
        delete allAttributes.Shape__Area;
        delete allAttributes.shapeLength;
        delete allAttributes.Shape__Length;
        delete allAttributes.globalId;
        delete allAttributes.GlobalID;
        delete allAttributes.GLOBALID;
        const attributesJson = JSON.stringify(allAttributes);

        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'UK Office for National Statistics',
          (location.confidence || 'N/A').toString(),
          'UK_NATIONAL_PARKS',
          parkCode,
          lat || location.lat.toString(),
          lon || location.lon.toString(),
          distance,
          parkName || parkCode,
          isContaining,
          parkNameW || '',
          '',
          '',
          '',
          attributesJson,
          'UK Office for National Statistics'
        ]);
      });
      return;
    }
    
    if (key === 'uk_built_up_areas_2024_all' && Array.isArray(value)) {
      value.forEach((area: any) => {
        const buaCode = area.bua24cd || area.BUA24CD || 'Unknown Built-Up Area';
        const buaName = area.bua24nm || area.BUA24NM || '';
        const gsscode = area.gsscode || area.GSSCODE || '';
        const areaHectares = area.areahectar !== null && area.areahectar !== undefined
          ? area.areahectar.toString()
          : '';
        const distance = area.distance_miles !== null && area.distance_miles !== undefined
          ? area.distance_miles.toFixed(2)
          : (area.isContaining ? '0.00' : '');
        const isContaining = area.isContaining ? 'Yes' : 'No';

        let lat = '';
        let lon = '';
        if (area.geometry && area.geometry.rings && area.geometry.rings.length > 0) {
          const outerRing = area.geometry.rings[0];
          if (outerRing && outerRing.length > 0) {
            lat = outerRing[0][1].toString();
            lon = outerRing[0][0].toString();
          }
        } else {
          lat = location.lat.toString();
          lon = location.lon.toString();
        }

        const allAttributes = { ...area };
        delete allAttributes.geometry;
        delete allAttributes.__geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.FID;
        delete allAttributes.fid;
        delete allAttributes.gsscode;
        delete allAttributes.GSSCODE;
        delete allAttributes.bua24cd;
        delete allAttributes.BUA24CD;
        delete allAttributes.bua24nm;
        delete allAttributes.BUA24NM;
        delete allAttributes.bua24nmw;
        delete allAttributes.BUA24NMW;
        delete allAttributes.areahectar;
        delete allAttributes.geometry_a;
        delete allAttributes.geometry_A;
        delete allAttributes.Shape__Area;
        delete allAttributes.Shape__Length;
        delete allAttributes.shapeArea;
        delete allAttributes.shapeLength;
        delete allAttributes.globalId;
        delete allAttributes.GlobalID;
        delete allAttributes.GLOBALID;
        const attributesJson = JSON.stringify(allAttributes);

        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'UK Office for National Statistics',
          (location.confidence || 'N/A').toString(),
          'UK_BUILT_UP_AREAS_2024',
          buaCode,
          lat || location.lat.toString(),
          lon || location.lon.toString(),
          distance,
          buaName || buaCode,
          isContaining,
          gsscode || '',
          areaHectares,
          '',
          '',
          attributesJson,
          'UK Office for National Statistics'
        ]);
      });
    }

    // Export UK European Electoral Regions data
    if (key === 'uk_european_electoral_regions_all' && Array.isArray(value)) {
      value.forEach((region: any) => {
        const regionCode = region.eurg18cd || region.EURG18CD || 'Unknown Region';
        const regionName = region.eurg18nm || region.EURG18NM || '';
        const bngE = region.bngE !== null && region.bngE !== undefined
          ? region.bngE.toString()
          : (region.BNG_E !== null && region.BNG_E !== undefined ? region.BNG_E.toString() : '');
        const bngN = region.bngN !== null && region.bngN !== undefined
          ? region.bngN.toString()
          : (region.BNG_N !== null && region.BNG_N !== undefined ? region.BNG_N.toString() : '');
        const distance = region.distance_miles !== null && region.distance_miles !== undefined
          ? region.distance_miles.toFixed(2)
          : (region.isContaining ? '0.00' : '');
        const isContaining = region.isContaining ? 'Yes' : 'No';

        let lat = '';
        let lon = '';
        if (region.geometry && region.geometry.rings && region.geometry.rings.length > 0) {
          const outerRing = region.geometry.rings[0];
          if (outerRing && outerRing.length > 0) {
            lat = outerRing[0][1].toString();
            lon = outerRing[0][0].toString();
          }
        } else if (region.lat !== null && region.lat !== undefined && region.long !== null && region.long !== undefined) {
          lat = region.lat.toString();
          lon = region.long.toString();
        } else {
          lat = location.lat.toString();
          lon = location.lon.toString();
        }

        const allAttributes = { ...region };
        delete allAttributes.geometry;
        delete allAttributes.__geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.FID;
        delete allAttributes.fid;
        delete allAttributes.eurg18cd;
        delete allAttributes.EURG18CD;
        delete allAttributes.eurg18nm;
        delete allAttributes.EURG18NM;
        delete allAttributes.bngE;
        delete allAttributes.BNG_E;
        delete allAttributes.bngN;
        delete allAttributes.BNG_N;
        delete allAttributes.shapeArea;
        delete allAttributes.Shape__Area;
        delete allAttributes.shapeLength;
        delete allAttributes.Shape__Length;
        delete allAttributes.globalId;
        delete allAttributes.GlobalID;
        delete allAttributes.GLOBALID;
        delete allAttributes.lat;
        delete allAttributes.LAT;
        delete allAttributes.long;
        delete allAttributes.LONG;
        const attributesJson = JSON.stringify(allAttributes);

        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'UK Office for National Statistics',
          (location.confidence || 'N/A').toString(),
          'UK_EUROPEAN_ELECTORAL_REGIONS_2018',
          regionCode,
          lat || location.lat.toString(),
          lon || location.lon.toString(),
          distance,
          regionName || regionCode,
          isContaining,
          bngE || '',
          bngN || '',
          '',
          '',
          attributesJson,
          'UK Office for National Statistics'
        ]);
      });
    }

    // Export UK Cancer Alliances data
    if (key === 'uk_cancer_alliances_all' && Array.isArray(value)) {
      value.forEach((alliance: any) => {
        const allianceName = alliance.cal23nm || alliance.CAL23NM || 'Unknown Cancer Alliance';
        const allianceCode = alliance.cal23cd || alliance.CAL23CD || '';
        const bngE = alliance.bngE !== null && alliance.bngE !== undefined
          ? alliance.bngE.toString()
          : (alliance.BNG_E !== null && alliance.BNG_E !== undefined ? alliance.BNG_E.toString() : '');
        const bngN = alliance.bngN !== null && alliance.bngN !== undefined
          ? alliance.bngN.toString()
          : (alliance.BNG_N !== null && alliance.BNG_N !== undefined ? alliance.BNG_N.toString() : '');
        const distance = alliance.distance_miles !== null && alliance.distance_miles !== undefined
          ? alliance.distance_miles.toFixed(2)
          : (alliance.isContaining ? '0.00' : '');
        const isContaining = alliance.isContaining ? 'Yes' : 'No';

        // Extract coordinates from geometry (polygon - use first coordinate) or lat/long, else location
        let lat = '';
        let lon = '';
        if (alliance.geometry && alliance.geometry.rings && alliance.geometry.rings.length > 0) {
          const outerRing = alliance.geometry.rings[0];
          if (outerRing && outerRing.length > 0) {
            lat = outerRing[0][1].toString();
            lon = outerRing[0][0].toString();
          }
        } else if (alliance.lat !== null && alliance.lat !== undefined && alliance.long !== null && alliance.long !== undefined) {
          lat = alliance.lat.toString();
          lon = alliance.long.toString();
        } else {
          lat = location.lat.toString();
          lon = location.lon.toString();
        }

        const allAttributes = { ...alliance };
        delete allAttributes.geometry;
        delete allAttributes.__geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.FID;
        delete allAttributes.fid;
        delete allAttributes.cal23cd;
        delete allAttributes.CAL23CD;
        delete allAttributes.cal23nm;
        delete allAttributes.CAL23NM;
        delete allAttributes.bngE;
        delete allAttributes.BNG_E;
        delete allAttributes.bngN;
        delete allAttributes.BNG_N;
        delete allAttributes.shapeArea;
        delete allAttributes.Shape__Area;
        delete allAttributes.shapeLength;
        delete allAttributes.Shape__Length;
        delete allAttributes.globalId;
        delete allAttributes.GlobalID;
        delete allAttributes.GLOBALID;
        delete allAttributes.lat;
        delete allAttributes.LAT;
        delete allAttributes.long;
        delete allAttributes.LONG;
        const attributesJson = JSON.stringify(allAttributes);

        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'UK Office for National Statistics',
          (location.confidence || 'N/A').toString(),
          'UK_CANCER_ALLIANCES_2023',
          allianceCode || allianceName,
          lat || location.lat.toString(),
          lon || location.lon.toString(),
          distance,
          allianceName,
          isContaining,
          bngE || '',
          bngN || '',
          '',
          '',
          attributesJson,
          'UK Office for National Statistics'
        ]);
      });
    }

    // Export UK Fire & Rescue Authorities data
    if (key === 'uk_fire_rescue_authorities_all' && Array.isArray(value)) {
      value.forEach((area: any) => {
        const areaName = area.fra23nm || area.FRA23NM || 'Unknown Fire & Rescue Authority';
        const areaCode = area.fra23cd || area.FRA23CD || '';
        const bngE = area.bngE !== null && area.bngE !== undefined
          ? area.bngE.toString()
          : (area.BNG_E !== null && area.BNG_E !== undefined ? area.BNG_E.toString() : '');
        const bngN = area.bngN !== null && area.bngN !== undefined
          ? area.bngN.toString()
          : (area.BNG_N !== null && area.BNG_N !== undefined ? area.BNG_N.toString() : '');
        const distance = area.distance_miles !== null && area.distance_miles !== undefined
          ? area.distance_miles.toFixed(2)
          : (area.isContaining ? '0.00' : '');
        const isContaining = area.isContaining ? 'Yes' : 'No';

        let lat = '';
        let lon = '';
        if (area.geometry && area.geometry.rings && area.geometry.rings.length > 0) {
          const outerRing = area.geometry.rings[0];
          if (outerRing && outerRing.length > 0) {
            lat = outerRing[0][1].toString();
            lon = outerRing[0][0].toString();
          }
        } else if (area.lat !== null && area.lat !== undefined && area.long !== null && area.long !== undefined) {
          lat = area.lat.toString();
          lon = area.long.toString();
        } else {
          lat = location.lat.toString();
          lon = location.lon.toString();
        }

        const allAttributes = { ...area };
        delete allAttributes.geometry;
        delete allAttributes.__geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.FID;
        delete allAttributes.fid;
        delete allAttributes.fra23cd;
        delete allAttributes.FRA23CD;
        delete allAttributes.fra23nm;
        delete allAttributes.FRA23NM;
        delete allAttributes.bngE;
        delete allAttributes.BNG_E;
        delete allAttributes.bngN;
        delete allAttributes.BNG_N;
        delete allAttributes.shapeArea;
        delete allAttributes.Shape__Area;
        delete allAttributes.shapeLength;
        delete allAttributes.Shape__Length;
        delete allAttributes.globalId;
        delete allAttributes.GlobalID;
        delete allAttributes.GLOBALID;
        delete allAttributes.lat;
        delete allAttributes.LAT;
        delete allAttributes.long;
        delete allAttributes.LONG;
        const attributesJson = JSON.stringify(allAttributes);

        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'UK Office for National Statistics',
          (location.confidence || 'N/A').toString(),
          'UK_FIRE_RESCUE_AUTHORITIES_2023',
          areaCode || areaName,
          lat || location.lat.toString(),
          lon || location.lon.toString(),
          distance,
          areaName,
          isContaining,
          bngE || '',
          bngN || '',
          '',
          '',
          attributesJson,
          'UK Office for National Statistics'
        ]);
      });
    }

    // Export UK Police Force Areas data
    if (key === 'uk_police_force_areas_all' && Array.isArray(value)) {
      value.forEach((area: any) => {
        const areaName = area.pfa23nm || area.PFA23NM || 'Unknown Police Force Area';
        const areaCode = area.pfa23cd || area.PFA23CD || '';
        const bngE = area.bngE !== null && area.bngE !== undefined
          ? area.bngE.toString()
          : (area.BNG_E !== null && area.BNG_E !== undefined ? area.BNG_E.toString() : '');
        const bngN = area.bngN !== null && area.bngN !== undefined
          ? area.bngN.toString()
          : (area.BNG_N !== null && area.BNG_N !== undefined ? area.BNG_N.toString() : '');
        const distance = area.distance_miles !== null && area.distance_miles !== undefined
          ? area.distance_miles.toFixed(2)
          : (area.isContaining ? '0.00' : '');
        const isContaining = area.isContaining ? 'Yes' : 'No';

        let lat = '';
        let lon = '';
        if (area.geometry && area.geometry.rings && area.geometry.rings.length > 0) {
          const outerRing = area.geometry.rings[0];
          if (outerRing && outerRing.length > 0) {
            lat = outerRing[0][1].toString();
            lon = outerRing[0][0].toString();
          }
        } else if (area.lat !== null && area.lat !== undefined && area.long !== null && area.long !== undefined) {
          lat = area.lat.toString();
          lon = area.long.toString();
        } else {
          lat = location.lat.toString();
          lon = location.lon.toString();
        }

        const allAttributes = { ...area };
        delete allAttributes.geometry;
        delete allAttributes.__geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.FID;
        delete allAttributes.fid;
        delete allAttributes.pfa23cd;
        delete allAttributes.PFA23CD;
        delete allAttributes.pfa23nm;
        delete allAttributes.PFA23NM;
        delete allAttributes.bngE;
        delete allAttributes.BNG_E;
        delete allAttributes.bngN;
        delete allAttributes.BNG_N;
        delete allAttributes.shapeArea;
        delete allAttributes.Shape__Area;
        delete allAttributes.shapeLength;
        delete allAttributes.Shape__Length;
        delete allAttributes.globalId;
        delete allAttributes.GlobalID;
        delete allAttributes.GLOBALID;
        delete allAttributes.lat;
        delete allAttributes.LAT;
        delete allAttributes.long;
        delete allAttributes.LONG;
        const attributesJson = JSON.stringify(allAttributes);

        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'UK Office for National Statistics',
          (location.confidence || 'N/A').toString(),
          'UK_POLICE_FORCE_AREAS_2023',
          areaCode || areaName,
          lat || location.lat.toString(),
          lon || location.lon.toString(),
          distance,
          areaName,
          isContaining,
          bngE || '',
          bngN || '',
          '',
          '',
          attributesJson,
          'UK Office for National Statistics'
        ]);
      });
    }

    // Export UK GEOSTAT Grid data
    if (key === 'uk_geostat_grid_all' && Array.isArray(value)) {
      value.forEach((cell: any) => {
        const gridId = cell.grd_newid || cell.GRD_NEWID || cell.grd_fixid || cell.GRD_FIXID || 'Unknown Grid Cell';
        const pcdCount = cell.pcd_count !== null && cell.pcd_count !== undefined ? cell.pcd_count : null;
        const totP = cell.tot_p !== null && cell.tot_p !== undefined ? cell.tot_p : null;
        const totHH = cell.tot_hh !== null && cell.tot_hh !== undefined ? cell.tot_hh : null;
        const distance = cell.distance_miles !== null && cell.distance_miles !== undefined
          ? cell.distance_miles.toFixed(2)
          : (cell.isContaining ? '0.00' : '');
        const isContaining = cell.isContaining ? 'Yes' : 'No';

        // Use approximate cell coordinate from geometry, else location
        let lat = '';
        let lon = '';
        if (cell.geometry && cell.geometry.rings && cell.geometry.rings.length > 0) {
          const outerRing = cell.geometry.rings[0];
          if (outerRing && outerRing.length > 0) {
            lat = outerRing[0][1].toString();
            lon = outerRing[0][0].toString();
          }
        } else {
          lat = location.lat.toString();
          lon = location.lon.toString();
        }

        const allAttributes = { ...cell };
        delete allAttributes.geometry;
        delete allAttributes.__geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.FID;
        delete allAttributes.fid;
        delete allAttributes.grd_fixid;
        delete allAttributes.GRD_FIXID;
        delete allAttributes.grd_floaid;
        delete allAttributes.GRD_FLOAID;
        delete allAttributes.grd_newid;
        delete allAttributes.GRD_NEWID;
        delete allAttributes.shapeArea;
        delete allAttributes.Shape__Area;
        delete allAttributes.shapeLength;
        delete allAttributes.Shape__Length;
        delete allAttributes.globalId;
        delete allAttributes.GlobalID;
        delete allAttributes.GLOBALID;
        const attributesJson = JSON.stringify(allAttributes);

        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'UK Office for National Statistics / Eurostat',
          (location.confidence || 'N/A').toString(),
          'UK_GEOSTAT_GRID_2011',
          gridId,
          lat || location.lat.toString(),
          lon || location.lon.toString(),
          distance,
          totP !== null ? totP.toString() : '',
          isContaining,
          pcdCount !== null ? pcdCount.toString() : '',
          totHH !== null ? totHH.toString() : '',
          '',
          '',
          attributesJson,
          'UK Office for National Statistics / Eurostat'
        ]);
      });
    }
    
    // Export Ireland Provinces data
    if (key === 'ireland_provinces_all' && Array.isArray(value)) {
      value.forEach((province: any) => {
        const provinceName = province.name || 'Unknown Province';
        const provinceId = province.provinceId || '';
        const area = province.area || 0;
        const distance = province.distance_miles !== null && province.distance_miles !== undefined ? province.distance_miles.toFixed(2) : '0.00';
        
        // Extract centroid coordinates if available
        let lat = '';
        let lon = '';
        if (province.centroidY && province.centroidX) {
          // Note: These are in ITM (Irish Transverse Mercator) coordinates, not lat/lon
          // For CSV, we'll use the location coordinates as approximation
          lat = location.lat.toString();
          lon = location.lon.toString();
        } else {
          lat = location.lat.toString();
          lon = location.lon.toString();
        }
        
        const allAttributes = { ...province };
        delete allAttributes.name;
        delete allAttributes.provinceId;
        delete allAttributes.area;
        delete allAttributes.distance_miles;
        delete allAttributes.objectId;
        delete allAttributes.geometry;
        delete allAttributes.__geometry;
        delete allAttributes.centroidX;
        delete allAttributes.centroidY;
        delete allAttributes.guid;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'Tailte Éireann (OSi)',
          (location.confidence || 'N/A').toString(),
          'IRELAND_PROVINCE',
          provinceName,
          lat,
          lon,
          distance,
          distance === '0.00' ? 'Containing Province' : `Nearby Province (${distance} miles)`,
          provinceId ? `Province ID: ${provinceId}` : '',
          area ? `Area: ${area.toLocaleString()} sq units` : '',
          attributesJson,
          'Tailte Éireann (OSi)'
        ]);
      });
    }
    
    // Export Ireland Built-Up Areas data
    if (key === 'ireland_built_up_areas_all' && Array.isArray(value)) {
      value.forEach((area: any) => {
        const fCode = area.fCode || area.F_CODE || '';
        const fcSubtype = area.fcSubtype !== null && area.fcSubtype !== undefined ? area.fcSubtype : '';
        const shapeArea = area.shapeArea || area.Shape__Area || 0;
        const distance = area.distance_miles !== null && area.distance_miles !== undefined ? area.distance_miles.toFixed(2) : '0.00';
        
        // Extract centroid coordinates if available
        let lat = '';
        let lon = '';
        // For built-up areas, use the location coordinates as approximation
        lat = location.lat.toString();
        lon = location.lon.toString();
        
        const allAttributes = { ...area };
        delete allAttributes.fCode;
        delete allAttributes.F_CODE;
        delete allAttributes.fcSubtype;
        delete allAttributes.FCsubtype;
        delete allAttributes.shapeArea;
        delete allAttributes.Shape__Area;
        delete allAttributes.shapeLength;
        delete allAttributes.Shape__Length;
        delete allAttributes.distance_miles;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.geometry;
        delete allAttributes.__geometry;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'Tailte Éireann (OSi)',
          (location.confidence || 'N/A').toString(),
          'IRELAND_BUILT_UP_AREA',
          fCode ? `F Code: ${fCode}` : 'Built-Up Area',
          lat,
          lon,
          distance,
          distance === '0.00' ? 'Containing Built-Up Area' : `Nearby Built-Up Area (${distance} miles)`,
          fcSubtype !== '' ? `FC Subtype: ${fcSubtype}` : '',
          shapeArea ? `Area: ${shapeArea.toLocaleString()} sq units` : '',
          attributesJson,
          'Tailte Éireann (OSi)'
        ]);
      });
    }
    
    // Export Ireland Small Areas data
    if (key === 'ireland_small_areas_all' && Array.isArray(value)) {
      value.forEach((area: any) => {
        const smallArea = area.smallArea || area.SMALL_AREA || '';
        const countyName = area.countyName || area.COUNTYNAME || '';
        const edName = area.edName || area.EDNAME || '';
        const nuts3Name = area.nuts3Name || area.NUTS3NAME || '';
        const geogId = area.geogId || area.GEOGID || '';
        const distance = area.distance_miles !== null && area.distance_miles !== undefined ? area.distance_miles.toFixed(2) : '0.00';
        
        // Extract centroid coordinates if available
        let lat = '';
        let lon = '';
        // For small areas, use the location coordinates as approximation
        lat = location.lat.toString();
        lon = location.lon.toString();
        
        const allAttributes = { ...area };
        delete allAttributes.smallArea;
        delete allAttributes.SMALL_AREA;
        delete allAttributes.countyName;
        delete allAttributes.COUNTYNAME;
        delete allAttributes.edName;
        delete allAttributes.EDNAME;
        delete allAttributes.nuts3Name;
        delete allAttributes.NUTS3NAME;
        delete allAttributes.geogId;
        delete allAttributes.GEOGID;
        delete allAttributes.shapeArea;
        delete allAttributes.Shape__Area;
        delete allAttributes.shapeLength;
        delete allAttributes.Shape__Length;
        delete allAttributes.distance_miles;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID_1;
        delete allAttributes.ESRI_OID;
        delete allAttributes.geometry;
        delete allAttributes.__geometry;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'Tailte Éireann (OSi)',
          (location.confidence || 'N/A').toString(),
          'IRELAND_SMALL_AREA',
          smallArea || geogId || 'Small Area',
          lat,
          lon,
          distance,
          distance === '0.00' ? 'Containing Small Area' : `Nearby Small Area (${distance} miles)`,
          countyName ? `County: ${countyName}` : '',
          edName ? `ED: ${edName}` : (nuts3Name ? `NUTS3: ${nuts3Name}` : ''),
          attributesJson,
          'Tailte Éireann (OSi)'
        ]);
      });
    }
    
    // Export Ireland Centres of Population data
    if (key === 'ireland_centres_of_population_all' && Array.isArray(value)) {
      value.forEach((centre: any) => {
        const englishName = centre.englishName || centre.English_Na || 'Unknown Centre';
        const irishName = centre.irishName || centre.Irish_Name || '';
        const county = centre.county || centre.County || '';
        const contae = centre.contae || centre.Contae || '';
        const distance = centre.distance_miles !== null && centre.distance_miles !== undefined ? centre.distance_miles.toFixed(2) : '0.00';
        const lat = centre.lat ? centre.lat.toString() : location.lat.toString();
        const lon = centre.lon ? centre.lon.toString() : location.lon.toString();
        
        const allAttributes = { ...centre };
        delete allAttributes.englishName;
        delete allAttributes.English_Na;
        delete allAttributes.irishName;
        delete allAttributes.Irish_Name;
        delete allAttributes.county;
        delete allAttributes.County;
        delete allAttributes.contae;
        delete allAttributes.Contae;
        delete allAttributes.townClass;
        delete allAttributes.Town_Class;
        delete allAttributes.classification;
        delete allAttributes.Classifica;
        delete allAttributes.distance_miles;
        delete allAttributes.lat;
        delete allAttributes.lon;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID_1;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'Tailte Éireann (OSi)',
          (location.confidence || 'N/A').toString(),
          'IRELAND_CENTRE_OF_POPULATION',
          englishName,
          lat,
          lon,
          distance,
          `Centre of Population (${distance} miles)`,
          irishName ? `Irish Name: ${irishName}` : '',
          county ? `County: ${county}` : (contae ? `Contae: ${contae}` : ''),
          attributesJson,
          'Tailte Éireann (OSi)'
        ]);
      });
    }
    
    // Export Ireland Electoral Divisions data
    if (key === 'ireland_electoral_divisions_all' && Array.isArray(value)) {
      value.forEach((ed: any) => {
        const edId = ed.edId || ed.ED_ID || '';
        const edEnglish = ed.edEnglish || ed.ED_ENGLISH || '';
        const edGaeilge = ed.edGaeilge || ed.ED_GAEILGE || '';
        const county = ed.county || ed.COUNTY || '';
        const contae = ed.contae || ed.CONTAE || '';
        const province = ed.province || ed.PROVINCE || '';
        const distance = ed.distance_miles !== null && ed.distance_miles !== undefined ? ed.distance_miles.toFixed(2) : '0.00';
        
        // Extract centroid coordinates if available
        let lat = '';
        let lon = '';
        if (ed.centroidX && ed.centroidY) {
          // These are in ITM projection, but for CSV we'll use location coordinates as approximation
          lat = location.lat.toString();
          lon = location.lon.toString();
        } else {
          lat = location.lat.toString();
          lon = location.lon.toString();
        }
        
        const allAttributes = { ...ed };
        delete allAttributes.edId;
        delete allAttributes.ED_ID;
        delete allAttributes.edEnglish;
        delete allAttributes.ED_ENGLISH;
        delete allAttributes.edGaeilge;
        delete allAttributes.ED_GAEILGE;
        delete allAttributes.county;
        delete allAttributes.COUNTY;
        delete allAttributes.contae;
        delete allAttributes.CONTAE;
        delete allAttributes.province;
        delete allAttributes.PROVINCE;
        delete allAttributes.centroidX;
        delete allAttributes.CENTROID_X;
        delete allAttributes.centroidY;
        delete allAttributes.CENTROID_Y;
        delete allAttributes.guid;
        delete allAttributes.GUID_;
        delete allAttributes.csoed3409;
        delete allAttributes.CSOED_3409;
        delete allAttributes.osied3441;
        delete allAttributes.OSIED_3441;
        delete allAttributes.csoed34_1;
        delete allAttributes.CSOED_34_1;
        delete allAttributes.shapeArea;
        delete allAttributes.Shape__Area;
        delete allAttributes.shapeLength;
        delete allAttributes.Shape__Length;
        delete allAttributes.distance_miles;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID_1;
        delete allAttributes.ESRI_OID;
        delete allAttributes.geometry;
        delete allAttributes.__geometry;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'Central Statistics Office (CSO)',
          (location.confidence || 'N/A').toString(),
          'IRELAND_ELECTORAL_DIVISION',
          edEnglish || edGaeilge || edId || 'Electoral Division',
          lat,
          lon,
          distance,
          distance === '0.00' ? 'Containing Electoral Division' : `Nearby Electoral Division (${distance} miles)`,
          edId ? `ED ID: ${edId}` : '',
          county ? `County: ${county}` : (contae ? `Contae: ${contae}` : ''),
          province ? `Province: ${province}` : '',
          attributesJson,
          'Central Statistics Office (CSO)'
        ]);
      });
    }
    
    // Export Ireland NUTS3 Boundaries data
    if (key === 'ireland_nuts3_boundaries_all' && Array.isArray(value)) {
      value.forEach((nuts3: any) => {
        const nuts1Name = nuts3.nuts1Name || nuts3.NUTS1NAME || '';
        const nuts2Name = nuts3.nuts2Name || nuts3.NUTS2NAME || '';
        const nuts3Code = nuts3.nuts3 || nuts3.NUTS3 || '';
        const nuts3Name = nuts3.nuts3Name || nuts3.NUTS3NAME || '';
        const distance = nuts3.distance_miles !== null && nuts3.distance_miles !== undefined ? nuts3.distance_miles.toFixed(2) : '0.00';
        const lat = location.lat.toString();
        const lon = location.lon.toString();
        
        const allAttributes = { ...nuts3 };
        delete allAttributes.nuts1;
        delete allAttributes.NUTS1;
        delete allAttributes.nuts1Name;
        delete allAttributes.NUTS1NAME;
        delete allAttributes.nuts2;
        delete allAttributes.NUTS2;
        delete allAttributes.nuts2Name;
        delete allAttributes.NUTS2NAME;
        delete allAttributes.nuts3;
        delete allAttributes.NUTS3;
        delete allAttributes.nuts3Name;
        delete allAttributes.NUTS3NAME;
        delete allAttributes.guid;
        delete allAttributes.GUID;
        delete allAttributes.shapeArea;
        delete allAttributes.Shape__Area;
        delete allAttributes.shapeLength;
        delete allAttributes.Shape__Length;
        delete allAttributes.distance_miles;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.geometry;
        delete allAttributes.__geometry;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'Tailte Éireann (OSi)',
          (location.confidence || 'N/A').toString(),
          'IRELAND_NUTS3_BOUNDARY',
          nuts3Name || nuts3Code || 'NUTS3 Boundary',
          lat,
          lon,
          distance,
          distance === '0.00' ? 'Containing NUTS3 Boundary' : `Nearby NUTS3 Boundary (${distance} miles)`,
          nuts3Name ? `NUTS3 Name: ${nuts3Name}` : '',
          nuts3Code ? `NUTS3 Code: ${nuts3Code}` : '',
          nuts2Name ? `NUTS2 Name: ${nuts2Name}` : '',
          nuts1Name ? `NUTS1 Name: ${nuts1Name}` : '',
          attributesJson,
          'Tailte Éireann (OSi)'
        ]);
      });
    }
    
    // Export Ireland Civil Parishes data
    if (key === 'ireland_civil_parishes_all' && Array.isArray(value)) {
      value.forEach((parish: any) => {
        const engName = parish.engName || parish.ENG_NAME_VALUE || '';
        const gleName = parish.gleName || parish.GLE_NAME_VALUE || '';
        const gaeltachtArea = parish.gaeltachtArea || parish.GAELTACHT_AREA || '';
        const distance = parish.distance_miles !== null && parish.distance_miles !== undefined ? parish.distance_miles.toFixed(2) : '0.00';
        const lat = location.lat.toString();
        const lon = location.lon.toString();
        
        const allAttributes = { ...parish };
        delete allAttributes.engName;
        delete allAttributes.ENG_NAME_VALUE;
        delete allAttributes.gleName;
        delete allAttributes.GLE_NAME_VALUE;
        delete allAttributes.gaeltachtArea;
        delete allAttributes.GAELTACHT_AREA;
        delete allAttributes.guid;
        delete allAttributes.GUID;
        delete allAttributes.shapeArea;
        delete allAttributes.Shape__Area;
        delete allAttributes.shapeLength;
        delete allAttributes.Shape__Length;
        delete allAttributes.distance_miles;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.geometry;
        delete allAttributes.__geometry;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'Tailte Éireann (OSi)',
          (location.confidence || 'N/A').toString(),
          'IRELAND_CIVIL_PARISH',
          engName || gleName || 'Civil Parish',
          lat,
          lon,
          distance,
          distance === '0.00' ? 'Containing Civil Parish' : `Nearby Civil Parish (${distance} miles)`,
          engName ? `English Name: ${engName}` : '',
          gleName ? `Gaeilge Name: ${gleName}` : '',
          gaeltachtArea ? `Gaeltacht Area: ${gaeltachtArea}` : '',
          attributesJson,
          'Tailte Éireann (OSi)'
        ]);
      });
    }
    
    // Export Ireland Buildings - Residential data
    if (key === 'ireland_buildings_residential_all' && Array.isArray(value)) {
      value.forEach((building: any) => {
        const buildingType = building.buildingType || 'Residential';
        const distance = building.distance_miles !== null && building.distance_miles !== undefined ? building.distance_miles.toFixed(2) : '0.00';
        const lat = location.lat.toString();
        const lon = location.lon.toString();
        
        const allAttributes = { ...building };
        delete allAttributes.buildingType;
        delete allAttributes.distance_miles;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.ESRI_OID;
        delete allAttributes.geometry;
        delete allAttributes.__geometry;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'Tailte Éireann (OSi)',
          (location.confidence || 'N/A').toString(),
          'IRELAND_BUILDING_RESIDENTIAL',
          buildingType,
          lat,
          lon,
          distance,
          distance === '0.00' ? 'Containing Building' : `Nearby Building (${distance} miles)`,
          `Building Type: ${buildingType}`,
          '',
          '',
          attributesJson,
          'Tailte Éireann (OSi)'
        ]);
      });
    }
    
    // Export Ireland Buildings - Residential/Commercial data
    if (key === 'ireland_buildings_residential_commercial_all' && Array.isArray(value)) {
      value.forEach((building: any) => {
        const buildingType = building.buildingType || 'Residential/Commercial';
        const distance = building.distance_miles !== null && building.distance_miles !== undefined ? building.distance_miles.toFixed(2) : '0.00';
        const lat = location.lat.toString();
        const lon = location.lon.toString();
        
        const allAttributes = { ...building };
        delete allAttributes.buildingType;
        delete allAttributes.distance_miles;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.ESRI_OID;
        delete allAttributes.geometry;
        delete allAttributes.__geometry;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'Tailte Éireann (OSi)',
          (location.confidence || 'N/A').toString(),
          'IRELAND_BUILDING_RESIDENTIAL_COMMERCIAL',
          buildingType,
          lat,
          lon,
          distance,
          distance === '0.00' ? 'Containing Building' : `Nearby Building (${distance} miles)`,
          `Building Type: ${buildingType}`,
          '',
          '',
          attributesJson,
          'Tailte Éireann (OSi)'
        ]);
      });
    } else if (key === 'australia_operating_mines_all_pois' && Array.isArray(value)) {
      // Handle Australia Operating Mines - each mine gets its own row with all attributes
      value.forEach((mine: any) => {
        const name = mine.mineName || mine.name || mine.Name || 'Unknown Mine';
        const status = mine.status || 'Operating';
        const commodity = mine.commodity || mine.COMMODITY || '';
        const state = mine.state || mine.STATE || '';
        const distance = mine.distance_miles !== null && mine.distance_miles !== undefined ? mine.distance_miles.toFixed(2) : '';
        
        const allAttributes = { ...mine };
        delete allAttributes.mineName;
        delete allAttributes.name;
        delete allAttributes.Name;
        delete allAttributes.status;
        delete allAttributes.commodity;
        delete allAttributes.COMMODITY;
        delete allAttributes.state;
        delete allAttributes.STATE;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.objectId;
        delete allAttributes.ObjectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.lat;
        delete allAttributes.lon;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'Geoscience Australia',
          (location.confidence || 'N/A').toString(),
          'AUSTRALIA_OPERATING_MINE',
          name,
          (mine.lat || location.lat).toString(),
          (mine.lon || location.lon).toString(),
          distance,
          status,
          commodity,
          state,
          attributesJson,
          'Geoscience Australia'
        ]);
      });
    } else if (key === 'australia_developing_mines_all_pois' && Array.isArray(value)) {
      // Handle Australia Developing Mines - each mine gets its own row with all attributes
      value.forEach((mine: any) => {
        const name = mine.mineName || mine.name || mine.Name || 'Unknown Mine';
        const status = mine.status || 'Developing';
        const commodity = mine.commodity || mine.COMMODITY || '';
        const state = mine.state || mine.STATE || '';
        const distance = mine.distance_miles !== null && mine.distance_miles !== undefined ? mine.distance_miles.toFixed(2) : '';
        
        const allAttributes = { ...mine };
        delete allAttributes.mineName;
        delete allAttributes.name;
        delete allAttributes.Name;
        delete allAttributes.status;
        delete allAttributes.commodity;
        delete allAttributes.COMMODITY;
        delete allAttributes.state;
        delete allAttributes.STATE;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.objectId;
        delete allAttributes.ObjectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.lat;
        delete allAttributes.lon;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'Geoscience Australia',
          (location.confidence || 'N/A').toString(),
          'AUSTRALIA_DEVELOPING_MINE',
          name,
          (mine.lat || location.lat).toString(),
          (mine.lon || location.lon).toString(),
          distance,
          status,
          commodity,
          state,
          attributesJson,
          'Geoscience Australia'
        ]);
      });
    } else if (key === 'australia_care_maintenance_mines_all_pois' && Array.isArray(value)) {
      // Handle Australia Care/Maintenance Mines - each mine gets its own row with all attributes
      value.forEach((mine: any) => {
        const name = mine.mineName || mine.name || mine.Name || 'Unknown Mine';
        const status = mine.status || 'Care/Maintenance';
        const commodity = mine.commodity || mine.COMMODITY || '';
        const state = mine.state || mine.STATE || '';
        const distance = mine.distance_miles !== null && mine.distance_miles !== undefined ? mine.distance_miles.toFixed(2) : '';
        
        const allAttributes = { ...mine };
        delete allAttributes.mineName;
        delete allAttributes.name;
        delete allAttributes.Name;
        delete allAttributes.status;
        delete allAttributes.commodity;
        delete allAttributes.COMMODITY;
        delete allAttributes.state;
        delete allAttributes.STATE;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.objectId;
        delete allAttributes.ObjectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.lat;
        delete allAttributes.lon;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'Geoscience Australia',
          (location.confidence || 'N/A').toString(),
          'AUSTRALIA_CARE_MAINTENANCE_MINE',
          name,
          (mine.lat || location.lat).toString(),
          (mine.lon || location.lon).toString(),
          distance,
          status,
          commodity,
          state,
          attributesJson,
          'Geoscience Australia'
        ]);
      });
    } else if (key === 'ireland_mountains_all' && Array.isArray(value)) {
      // Handle Ireland Mountains - each mountain gets its own row with all attributes
      value.forEach((mountain: any) => {
        const mountainName = mountain.name || mountain.NAMN1 || mountain.NAME || 'Unknown Mountain';
        const fCode = mountain.fCode || mountain.F_CODE || '';
        const distance = mountain.distance_miles !== null && mountain.distance_miles !== undefined ? mountain.distance_miles.toFixed(2) : '';
        
        const allAttributes = { ...mountain };
        delete allAttributes.name;
        delete allAttributes.NAMN1;
        delete allAttributes.NAME;
        delete allAttributes.fCode;
        delete allAttributes.F_CODE;
        delete allAttributes.lat;
        delete allAttributes.lon;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'Tailte Éireann',
          (location.confidence || 'N/A').toString(),
          'IRELAND_MOUNTAIN',
          mountainName,
          (mountain.lat || '').toString(),
          (mountain.lon || '').toString(),
          distance,
          fCode || 'Mountain Peak',
          attributesJson,
          '',
          '',
          'Tailte Éireann (OSi)'
        ]);
      });
    } else if (key === 'ireland_high_water_marks_all' && Array.isArray(value)) {
      // Handle Ireland High Water Marks - each water mark gets its own row with all attributes
      value.forEach((waterMark: any) => {
        const guid = waterMark.guid || waterMark.GUID || 'Unknown';
        const bdyTypeValue = waterMark.bdyTypeValue || waterMark.BDY_TYPE_VALUE || '';
        const shapeLength = waterMark.shapeLength || waterMark.Shape__Length || waterMark.SHAPE__LENGTH || null;
        const lengthMeters = shapeLength ? shapeLength.toFixed(2) : '';
        const distance = waterMark.distance_miles !== null && waterMark.distance_miles !== undefined ? waterMark.distance_miles.toFixed(2) : '';
        
        const allAttributes = { ...waterMark };
        delete allAttributes.guid;
        delete allAttributes.GUID;
        delete allAttributes.bdyTypeValue;
        delete allAttributes.BDY_TYPE_VALUE;
        delete allAttributes.shapeLength;
        delete allAttributes.Shape__Length;
        delete allAttributes.SHAPE__LENGTH;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'Tailte Éireann (OSi)',
          (location.confidence || 'N/A').toString(),
          'IRELAND_HIGH_WATER_MARK',
          `High Water Mark - ${bdyTypeValue || guid}`,
          location.lat.toString(), // Use search location for water mark (it's a line, not a point)
          location.lon.toString(),
          distance,
          bdyTypeValue || 'High Water Mark',
          lengthMeters ? `${lengthMeters} m` : attributesJson,
          '',
          '',
          attributesJson,
          'Tailte Éireann (OSi)'
        ]);
      });
    } else if (key === 'australia_railways_all' && Array.isArray(value)) {
      // Handle Australia Railways - each railway gets its own row with all attributes
      value.forEach((railway: any) => {
        const name = railway.name || railway.Name || 'Unknown Railway';
        const operationalStatus = railway.operationalStatus || railway.operational_status || railway.OPERATIONAL_STATUS || '';
        const trackGauge = railway.trackGauge || railway.track_gauge || railway.TRACK_GAUGE || '';
        const tracks = railway.tracks || railway.Tracks || '';
        const lengthKm = railway.lengthKm || railway.length_km || railway.LENGTH_KM || null;
        const lengthKmStr = lengthKm !== null && lengthKm !== undefined ? lengthKm.toFixed(2) : '';
        const distance = railway.distance_miles !== null && railway.distance_miles !== undefined ? railway.distance_miles.toFixed(2) : '';
        
        const allAttributes = { ...railway };
        delete allAttributes.name;
        delete allAttributes.Name;
        delete allAttributes.operationalStatus;
        delete allAttributes.operational_status;
        delete allAttributes.OPERATIONAL_STATUS;
        delete allAttributes.trackGauge;
        delete allAttributes.track_gauge;
        delete allAttributes.TRACK_GAUGE;
        delete allAttributes.tracks;
        delete allAttributes.Tracks;
        delete allAttributes.lengthKm;
        delete allAttributes.length_km;
        delete allAttributes.LENGTH_KM;
        delete allAttributes.alternativeName;
        delete allAttributes.alternative_name;
        delete allAttributes.ALTERNATIVE_NAME;
        delete allAttributes.owner;
        delete allAttributes.Owner;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.objectId;
        delete allAttributes.ObjectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.lat;
        delete allAttributes.lon;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'Digital Atlas AUS',
          (location.confidence || 'N/A').toString(),
          'AUSTRALIA_RAILWAY',
          name,
          location.lat.toString(), // Use search location for railway (it's a line, not a point)
          location.lon.toString(),
          distance,
          operationalStatus || 'Railway Line',
          lengthKmStr ? `${lengthKmStr} km` : attributesJson,
          trackGauge || '',
          tracks || '',
          attributesJson,
          'Digital Atlas AUS'
        ]);
      });
    } else if (key === 'australia_trams_all' && Array.isArray(value)) {
      // Handle Australia Trams - each tram gets its own row with all attributes
      value.forEach((tram: any) => {
        const name = tram.name || tram.Name || 'Unknown Tram';
        const operationalStatus = tram.operationalStatus || tram.operational_status || tram.OPERATIONAL_STATUS || '';
        const trackGauge = tram.trackGauge || tram.track_gauge || tram.TRACK_GAUGE || '';
        const tracks = tram.tracks || tram.Tracks || '';
        const lengthKm = tram.lengthKm || tram.length_km || tram.LENGTH_KM || null;
        const lengthKmStr = lengthKm !== null && lengthKm !== undefined ? lengthKm.toFixed(2) : '';
        const distance = tram.distance_miles !== null && tram.distance_miles !== undefined ? tram.distance_miles.toFixed(2) : '';
        
        const allAttributes = { ...tram };
        delete allAttributes.name;
        delete allAttributes.Name;
        delete allAttributes.operationalStatus;
        delete allAttributes.operational_status;
        delete allAttributes.OPERATIONAL_STATUS;
        delete allAttributes.trackGauge;
        delete allAttributes.track_gauge;
        delete allAttributes.TRACK_GAUGE;
        delete allAttributes.tracks;
        delete allAttributes.Tracks;
        delete allAttributes.lengthKm;
        delete allAttributes.length_km;
        delete allAttributes.LENGTH_KM;
        delete allAttributes.alternativeName;
        delete allAttributes.alternative_name;
        delete allAttributes.ALTERNATIVE_NAME;
        delete allAttributes.owner;
        delete allAttributes.Owner;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.objectId;
        delete allAttributes.ObjectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.lat;
        delete allAttributes.lon;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'Digital Atlas AUS',
          (location.confidence || 'N/A').toString(),
          'AUSTRALIA_TRAM',
          name,
          location.lat.toString(), // Use search location for tram (it's a line, not a point)
          location.lon.toString(),
          distance,
          operationalStatus || 'Tram Line',
          lengthKmStr ? `${lengthKmStr} km` : attributesJson,
          trackGauge || '',
          tracks || '',
          attributesJson,
          'Digital Atlas AUS'
        ]);
      });
    } else if (key === 'australia_bushfires_all' && Array.isArray(value)) {
      // Handle Australia Bushfires - each bushfire gets its own row with all attributes
      value.forEach((bushfire: any) => {
        const isContaining = bushfire.isContaining || bushfire.distance_miles === 0;
        const distance = bushfire.distance_miles !== null && bushfire.distance_miles !== undefined ? bushfire.distance_miles.toFixed(2) : (isContaining ? '0.00' : '');
        const featureType = bushfire.geometry && bushfire.geometry.rings ? 'Extent' : 'Location Point';
        
        const allAttributes = { ...bushfire };
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        delete allAttributes.objectId;
        delete allAttributes.ObjectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.lat;
        delete allAttributes.lon;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'Digital Atlas AUS',
          (location.confidence || 'N/A').toString(),
          'AUSTRALIA_BUSHFIRE',
          `${isContaining ? 'Containing' : 'Nearby'} - ${featureType}`,
          (bushfire.lat || location.lat).toString(),
          (bushfire.lon || location.lon).toString(),
          distance,
          featureType,
          attributesJson,
          '',
          '',
          attributesJson,
          'Digital Atlas AUS'
        ]);
      });
    } else if (key === 'australia_national_roads_all' && Array.isArray(value)) {
      // Handle Australia National Roads - each road gets its own row
      value.forEach((road: any) => {
        const name = road.fullStreetName || `${road.streetName || 'Unnamed'} ${road.streetType || ''}`.trim() || 'Unnamed Road';
        const fullStreetName = road.fullStreetName || '';
        const streetName = road.streetName || '';
        const streetType = road.streetType || '';
        const hierarchy = road.hierarchy || '';
        const status = road.status || '';
        const surface = road.surface || '';
        const state = road.state || '';
        const oneWay = road.oneWay || '';
        const laneDescription = road.laneDescription || '';
        const distance = road.distance_miles !== null && road.distance_miles !== undefined ? road.distance_miles.toFixed(2) : '';
        
        const allAttributes = { ...road };
        delete allAttributes.fullStreetName;
        delete allAttributes.streetName;
        delete allAttributes.streetType;
        delete allAttributes.hierarchy;
        delete allAttributes.status;
        delete allAttributes.surface;
        delete allAttributes.state;
        delete allAttributes.oneWay;
        delete allAttributes.laneDescription;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.objectId;
        delete allAttributes.ObjectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.lat;
        delete allAttributes.lon;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'Digital Atlas AUS',
          (location.confidence || 'N/A').toString(),
          'AUSTRALIA_NATIONAL_ROAD',
          name,
          fullStreetName,
          streetName,
          streetType,
          hierarchy,
          status,
          surface,
          state,
          oneWay,
          laneDescription,
          distance,
          road.lat?.toString() || '',
          road.lon?.toString() || '',
          attributesJson,
          'Digital Atlas AUS'
        ]);
      });
    } else if (key === 'australia_major_roads_all' && Array.isArray(value)) {
      // Handle Australia Major Roads - each road gets its own row
      value.forEach((road: any) => {
        const name = road.fullStreetName || `${road.streetName || 'Unnamed'} ${road.streetType || ''}`.trim() || 'Unnamed Road';
        const fullStreetName = road.fullStreetName || '';
        const streetName = road.streetName || '';
        const streetType = road.streetType || '';
        const hierarchy = road.hierarchy || '';
        const status = road.status || '';
        const surface = road.surface || '';
        const state = road.state || '';
        const oneWay = road.oneWay || '';
        const laneDescription = road.laneDescription || '';
        const distance = road.distance_miles !== null && road.distance_miles !== undefined ? road.distance_miles.toFixed(2) : '';
        
        const allAttributes = { ...road };
        delete allAttributes.fullStreetName;
        delete allAttributes.streetName;
        delete allAttributes.streetType;
        delete allAttributes.hierarchy;
        delete allAttributes.status;
        delete allAttributes.surface;
        delete allAttributes.state;
        delete allAttributes.oneWay;
        delete allAttributes.laneDescription;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.objectId;
        delete allAttributes.ObjectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.lat;
        delete allAttributes.lon;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'Digital Atlas AUS',
          (location.confidence || 'N/A').toString(),
          'AUSTRALIA_MAJOR_ROAD',
          name,
          fullStreetName,
          streetName,
          streetType,
          hierarchy,
          status,
          surface,
          state,
          oneWay,
          laneDescription,
          distance,
          road.lat?.toString() || '',
          road.lon?.toString() || '',
          attributesJson,
          'Digital Atlas AUS'
        ]);
      });
    } else if (key === 'australia_npi_facilities_all_pois' && Array.isArray(value)) {
      // Handle Australia NPI Facilities - each facility gets its own row with all attributes
      value.forEach((facility: any) => {
        const name = facility.facilityName || facility.registeredBusinessName || facility.name || 'Unknown Facility';
        const facilityName = facility.facilityName || '';
        const registeredBusinessName = facility.registeredBusinessName || '';
        const primaryAnzsicClassName = facility.primaryAnzsicClassName || '';
        const mainActivities = facility.mainActivities || '';
        const state = facility.state || '';
        const suburb = facility.suburb || '';
        const streetAddress = facility.streetAddress || '';
        const postcode = facility.postcode || '';
        const latestReportYear = facility.latestReportYear || '';
        const distance = facility.distance_miles !== null && facility.distance_miles !== undefined ? facility.distance_miles.toFixed(2) : '';
        
        const allAttributes = { ...facility };
        delete allAttributes.facilityName;
        delete allAttributes.registeredBusinessName;
        delete allAttributes.name;
        delete allAttributes.Name;
        delete allAttributes.primaryAnzsicClassName;
        delete allAttributes.mainActivities;
        delete allAttributes.state;
        delete allAttributes.suburb;
        delete allAttributes.streetAddress;
        delete allAttributes.postcode;
        delete allAttributes.latestReportYear;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.objectId;
        delete allAttributes.ObjectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.latitude;
        delete allAttributes.longitude;
        delete allAttributes.lat;
        delete allAttributes.lon;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'Digital Atlas AUS',
          (location.confidence || 'N/A').toString(),
          'AUSTRALIA_NPI_FACILITY',
          name,
          (facility.latitude || facility.lat || location.lat).toString(),
          (facility.longitude || facility.lon || location.lon).toString(),
          distance,
          facilityName,
          registeredBusinessName,
          primaryAnzsicClassName,
          mainActivities,
          state,
          suburb,
          streetAddress,
          postcode,
          latestReportYear,
          attributesJson,
          'Digital Atlas AUS'
        ]);
      });
    } else if (key === 'australia_waste_management_facilities_all' && Array.isArray(value)) {
      // Handle Australia Waste Management Facilities - each facility gets its own row with all attributes
      value.forEach((facility: any) => {
        const name = facility.name || facility.Name || facility.NAME || facility.facilityName || 'Unknown Facility';
        const distance = facility.distance_miles !== null && facility.distance_miles !== undefined ? facility.distance_miles.toFixed(2) : '';
        
        const allAttributes = { ...facility };
        delete allAttributes.name;
        delete allAttributes.Name;
        delete allAttributes.NAME;
        delete allAttributes.facilityName;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.objectId;
        delete allAttributes.ObjectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.latitude;
        delete allAttributes.longitude;
        delete allAttributes.lat;
        delete allAttributes.lon;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'Geoscience Australia',
          (location.confidence || 'N/A').toString(),
          'AUSTRALIA_WASTE_MANAGEMENT_FACILITY',
          name,
          (facility.latitude || facility.lat || location.lat).toString(),
          (facility.longitude || facility.lon || location.lon).toString(),
          distance,
          '', '', '', '', '', '', '', '', '',
          attributesJson,
          'Geoscience Australia'
        ]);
      });
    } else if (key === 'australia_maritime_ports_all' && Array.isArray(value)) {
      // Handle Australia Maritime Ports - each port gets its own row with all attributes
      value.forEach((port: any) => {
        const name = port.name || port.Name || port.NAME || port.portName || 'Unknown Port';
        const distance = port.distance_miles !== null && port.distance_miles !== undefined ? port.distance_miles.toFixed(2) : '';
        
        const allAttributes = { ...port };
        delete allAttributes.name;
        delete allAttributes.Name;
        delete allAttributes.NAME;
        delete allAttributes.portName;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.objectId;
        delete allAttributes.ObjectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.latitude;
        delete allAttributes.longitude;
        delete allAttributes.lat;
        delete allAttributes.lon;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'Digital Atlas AUS',
          (location.confidence || 'N/A').toString(),
          'AUSTRALIA_MARITIME_PORT',
          name,
          (port.latitude || port.lat || location.lat).toString(),
          (port.longitude || port.lon || location.lon).toString(),
          distance,
          '', '', '', '', '', '', '', '', '',
          attributesJson,
          'Digital Atlas AUS'
        ]);
      });
    } else if (key === 'ireland_vegetation_areas_all' && Array.isArray(value)) {
      // Handle Ireland Vegetation Areas - each area gets its own row with all attributes
      value.forEach((area: any) => {
        const areaName = area.name || area.NAMN1 || area.NAME || 'Vegetation Area';
        const fcSubtype = area.fcSubtype || area.FCsubtype || area.FCSUBTYPE || '';
        const shapeArea = area.shapeArea || area.Shape__Area || area.SHAPE__AREA || null;
        const areaMeters = shapeArea ? shapeArea.toFixed(2) : '';
        const distance = area.distance_miles !== null && area.distance_miles !== undefined ? area.distance_miles.toFixed(2) : (area.isContaining ? '0.00' : '');
        const isContaining = area.isContaining || distance === '0.00' ? 'Containing' : 'Nearby';
        
        const allAttributes = { ...area };
        delete allAttributes.name;
        delete allAttributes.NAMN1;
        delete allAttributes.NAME;
        delete allAttributes.fcSubtype;
        delete allAttributes.FCsubtype;
        delete allAttributes.FCSUBTYPE;
        delete allAttributes.shapeArea;
        delete allAttributes.Shape__Area;
        delete allAttributes.SHAPE__AREA;
        delete allAttributes.shapeLength;
        delete allAttributes.Shape__Length;
        delete allAttributes.SHAPE__LENGTH;
        delete allAttributes.geometry;
        delete allAttributes.__geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.isContaining;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'Tailte Éireann',
          (location.confidence || 'N/A').toString(),
          'IRELAND_VEGETATION_AREA',
          `${isContaining} - ${areaName}`,
          location.lat.toString(),
          location.lon.toString(),
          distance,
          fcSubtype || 'Vegetation Area',
          areaMeters ? `${areaMeters} m²` : attributesJson,
          '',
          '',
          attributesJson,
          'Tailte Éireann (OSi)'
        ]);
      });
    } else if (key === 'ireland_pois_all' && Array.isArray(value)) {
      // Handle Ireland POIs - each POI gets its own row with all attributes
      value.forEach((poi: any) => {
        const orgName = poi.orgName || poi.ORG_NAME || '';
        const category = poi.category || poi.Category || '';
        const name = poi.name || poi.Name || '';
        const address = poi.address || poi.Address || '';
        const eircode = poi.eircode || poi.EIRCODE || '';
        const town = poi.town || poi.Town || '';
        const distance = poi.distance_miles !== null && poi.distance_miles !== undefined ? poi.distance_miles.toFixed(2) : '';
        
        // Use ORG_NAME and Category for display as requested
        const displayName = orgName || name || 'Unknown POI';
        const displayCategory = category || 'Point of Interest';
        
        const allAttributes = { ...poi };
        delete allAttributes.orgName;
        delete allAttributes.ORG_NAME;
        delete allAttributes.category;
        delete allAttributes.Category;
        delete allAttributes.name;
        delete allAttributes.Name;
        delete allAttributes.address;
        delete allAttributes.Address;
        delete allAttributes.eircode;
        delete allAttributes.EIRCODE;
        delete allAttributes.town;
        delete allAttributes.Town;
        delete allAttributes.county;
        delete allAttributes.County;
        delete allAttributes.lat;
        delete allAttributes.lon;
        delete allAttributes.latitude;
        delete allAttributes.Latitude;
        delete allAttributes.longitude;
        delete allAttributes.Longitude;
        delete allAttributes.geometry;
        delete allAttributes.distance_miles;
        delete allAttributes.objectId;
        delete allAttributes.ObjectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.ESRI_OID;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'Tailte Éireann (OSi)',
          (location.confidence || 'N/A').toString(),
          'IRELAND_POI',
          displayName,
          (poi.lat || '').toString(),
          (poi.lon || '').toString(),
          distance,
          displayCategory,
          address || attributesJson,
          town || '',
          eircode || '',
          attributesJson,
          'Tailte Éireann (OSi)'
        ]);
      });
    } else if (key === 'ireland_buildings_commercial_all' && Array.isArray(value)) {
      value.forEach((building: any) => {
        const buildingType = building.buildingType || 'Commercial';
        const distance = building.distance_miles !== null && building.distance_miles !== undefined ? building.distance_miles.toFixed(2) : '0.00';
        const lat = location.lat.toString();
        const lon = location.lon.toString();
        
        const allAttributes = { ...building };
        delete allAttributes.buildingType;
        delete allAttributes.distance_miles;
        delete allAttributes.objectId;
        delete allAttributes.OBJECTID;
        delete allAttributes.ESRI_OID;
        delete allAttributes.geometry;
        delete allAttributes.__geometry;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'Tailte Éireann (OSi)',
          (location.confidence || 'N/A').toString(),
          'IRELAND_BUILDING_COMMERCIAL',
          buildingType,
          lat,
          lon,
          distance,
          distance === '0.00' ? 'Containing Building' : `Nearby Building (${distance} miles)`,
          `Building Type: ${buildingType}`,
          '',
          '',
          attributesJson,
          'Tailte Éireann (OSi)'
        ]);
      });
    }
  });
};
