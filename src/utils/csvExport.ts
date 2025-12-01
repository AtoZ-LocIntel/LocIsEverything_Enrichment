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
        key === 'ct_building_footprints_all' || // Skip _all arrays (handled separately)
        key === 'ct_roads_all' || // Skip _all arrays (handled separately)
        key === 'ct_urgent_care_all' || // Skip _all arrays (handled separately)
        key === 'ct_deep_properties_all' || // Skip _all arrays (handled separately)
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
        key === 'de_park_facilities_all' ||
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
        key === 'de_wildlife_area_boundaries_all') { // Skip _all arrays (handled separately)
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
  });
};
