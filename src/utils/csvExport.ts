// Shared CSV export utility for consistent CSV generation across all views
import { EnrichmentResult } from '../App';

export const exportEnrichmentResultsToCSV = (results: EnrichmentResult[]): void => {
  if (!results.length) return;

  console.log('📥 Starting shared CSV export for enrichment results...');
  console.log('📍 Results count:', results.length);

  // Create comprehensive CSV with all data
  const headers = ['Address', 'Latitude', 'Longitude', 'Source', 'Confidence', 'POI_Type', 'POI_Name', 'POI_Latitude', 'POI_Longitude', 'Distance_Miles', 'POI_Category', 'POI_Address', 'POI_Phone', 'POI_Website', 'POI_Source'];
  const allHeaders = headers;
  
  const rows: string[][] = [];

  results.forEach(result => {
    console.log(`🔍 Processing result for ${result.location.name}`);
    
    // Add ALL enrichment data as rows (not just POIs)
    addAllEnrichmentDataRows(result, rows);
    
    // Add summary data rows (like FWS species counts, etc.)
    addSummaryDataRows(result, rows);
    
    // Add POI data rows
    addPOIDataRows(result, rows);
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

  // Add USGS Earthquake data
  if (enrichments.poi_earthquakes_count !== undefined) {
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
        key === 'la_county_historic_cultural_monuments_all' ||
        key === 'la_county_housing_lead_risk_all' ||
        key === 'la_county_school_district_boundaries_all' ||
        key === 'la_county_metro_lines_all' ||
        key === 'la_county_street_inventory_all' || // Skip LA County Hazards arrays (handled separately)
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
        key === 'la_county_township_range_section_rancho_boundaries_all') { // Skip _all arrays (handled separately)
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
    if (key.includes('nh_')) {
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

const addPOIDataRows = (result: EnrichmentResult, rows: string[][]): void => {
  const { location, enrichments } = result;

  // Add all POI data as individual rows
  Object.entries(enrichments).forEach(([key, value]) => {
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
    
    // Handle POI arrays: _all_pois, _detailed, or _all (for gas stations, mail shipping, etc.)
    if ((key.includes('_all_pois') || key.endsWith('_detailed') || (key.endsWith('_all') && key.includes('poi_'))) && Array.isArray(value)) {
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
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'Wikipedia',
          (location.confidence || 'N/A').toString(),
          'WIKIPEDIA_ARTICLE',
          article.title || 'Unnamed Article',
          location.lat.toString(),
          location.lon.toString(),
          '0',
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
    
    // Add LA County Basemaps and Grids data rows
    const basemapsGridsLayerMap: Record<string, { name: string, icon: string }> = {
      'la_county_us_national_grid_all': { name: 'LA_COUNTY_US_NATIONAL_GRID', icon: '🗺️' },
      'la_county_usng_100k_all': { name: 'LA_COUNTY_USNG_100K', icon: '🗺️' },
      'la_county_usng_10000m_all': { name: 'LA_COUNTY_USNG_10000M', icon: '🗺️' },
      'la_county_usng_1000m_all': { name: 'LA_COUNTY_USNG_1000M', icon: '🗺️' },
      'la_county_usng_100m_all': { name: 'LA_COUNTY_USNG_100M', icon: '🗺️' },
      'la_county_township_range_section_rancho_boundaries_all': { name: 'LA_COUNTY_TOWNSHIP_RANGE_SECTION_RANCHO_BOUNDARIES', icon: '📐' }
    };
    
    if (basemapsGridsLayerMap[key] && Array.isArray(value)) {
      const layerInfo = basemapsGridsLayerMap[key];
      value.forEach((grid: any) => {
        const gridId = grid.gridId || grid.OBJECTID || grid.objectid || 'Unknown';
        const distance = grid.isContaining ? '0.00' : '';
        
        const allAttributes = { ...grid };
        delete allAttributes.gridId;
        delete allAttributes.OBJECTID;
        delete allAttributes.objectid;
        delete allAttributes.geometry;
        delete allAttributes.isContaining;
        const attributesJson = JSON.stringify(allAttributes);
        
        rows.push([
          location.name,
          location.lat.toString(),
          location.lon.toString(),
          'LA County Public GIS',
          (location.confidence || 'N/A').toString(),
          layerInfo.name,
          `${layerInfo.icon} Grid ${gridId}`,
          location.lat.toString(),
          location.lon.toString(),
          distance,
          grid.isContaining ? 'Within Grid/Boundary' : 'Nearby Grid/Boundary',
          attributesJson,
          '',
          '',
          'LA County Public GIS'
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
          `${layerInfo.icon} Hazard ${hazardId}`,
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
  });
};
