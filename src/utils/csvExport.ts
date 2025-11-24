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
      location.source,
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
      location.source,
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
      location.source,
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
      location.source,
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
      location.source,
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
      location.source,
      (location.confidence || 'N/A').toString(),
      'PADUS_PUBLIC_ACCESS',
      `Nearby Count: ${enrichments.padus_public_access_nearby_count || 0}`,
      '', '', '', '', '', '', '', ''
    ]);
  }
  if (enrichments.padus_public_access_summary) {
    rows.push([
      location.name,
      location.lat.toString(),
      location.lon.toString(),
      location.source,
      (location.confidence || 'N/A').toString(),
      'PADUS_PUBLIC_ACCESS',
      enrichments.padus_public_access_summary,
      '', '', '', '', '', '', '', ''
    ]);
  }
  if (enrichments.padus_protection_status_nearby_count !== undefined) {
    rows.push([
      location.name,
      location.lat.toString(),
      location.lon.toString(),
      location.source,
      (location.confidence || 'N/A').toString(),
      'PADUS_PROTECTION_STATUS',
      `Nearby Count: ${enrichments.padus_protection_status_nearby_count || 0}`,
      '', '', '', '', '', '', '', ''
    ]);
  }
  if (enrichments.padus_protection_status_summary) {
    rows.push([
      location.name,
      location.lat.toString(),
      location.lon.toString(),
      location.source,
      (location.confidence || 'N/A').toString(),
      'PADUS_PROTECTION_STATUS',
      enrichments.padus_protection_status_summary,
      '', '', '', '', '', '', '', ''
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
        key === 'nh_dot_roads_all' ||
        key === 'nh_railroads_all' ||
        key === 'nh_transmission_pipelines_all' ||
        key === 'nh_cell_towers_all' ||
        key === 'nh_underground_storage_tanks_all' ||
        key === 'nh_water_wells_all' ||
        key === 'nh_public_water_supply_wells_all' ||
        key === 'nh_remediation_sites_all' ||
        key === 'nh_automobile_salvage_yards_all' ||
        key === 'nh_solid_waste_facilities_all') {
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

    rows.push([
      location.name,
      location.lat.toString(),
      location.lon.toString(),
      location.source,
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
      '' // POI_Source
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
          location.source,
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
    
    if (key.includes('_all_pois') && Array.isArray(value)) {
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
            location.source,
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
          // Regular POI handling
          rows.push([
            location.name,
            location.lat.toString(),
            location.lon.toString(),
            location.source,
            (location.confidence || 'N/A').toString(),
            key.replace('_all_pois', '').replace('poi_', '').toUpperCase(),
            poi.name || poi.title || 'Unnamed',
            poi.lat || poi.center?.lat || '',
            poi.lon || poi.center?.lon || '',
            poi.distance_miles || 'Unknown',
            poi.tags?.amenity || poi.tags?.shop || poi.tags?.tourism || 'POI',
            poi.tags?.['addr:street'] || poi.address || poi.tags?.['addr:full'] || '',
            poi.tags?.phone || '',
            poi.tags?.website || '',
            poi.source || 'N/A'
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
          location.source,
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
          location.source,
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
          location.source,
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
          location.source,
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
          location.source,
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
          location.source,
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
          location.source,
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
          location.source,
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
          location.source,
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
          location.source,
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
          location.source,
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
          location.source,
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
          location.source,
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
          location.source,
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
          location.source,
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
          location.source,
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
          location.source,
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
          location.source,
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
          location.source,
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
          location.source,
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
          location.source,
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
  });
};
