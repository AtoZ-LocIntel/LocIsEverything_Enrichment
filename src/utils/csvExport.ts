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
        key === 'nh_parcels_all') {
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
    }
  });
};
