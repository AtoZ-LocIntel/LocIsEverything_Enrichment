// Shared CSV export utility for consistent CSV generation across all views
import { EnrichmentResult } from '../App';

export const exportEnrichmentResultsToCSV = (results: EnrichmentResult[]): void => {
  if (!results.length) return;

  console.log('📥 Starting shared CSV export for enrichment results...');
  console.log('📍 Results count:', results.length);

  // Create comprehensive CSV with all data
  const headers = ['Address', 'Latitude', 'Longitude', 'Source', 'Confidence'];
  const poiHeaders = ['POI_Type', 'POI_Name', 'POI_Latitude', 'POI_Longitude', 'Distance_Miles', 'POI_Category', 'POI_Address', 'POI_Phone', 'POI_Website', 'POI_Source'];
  const allHeaders = [...headers, ...poiHeaders];
  
  const rows: string[][] = [];

  results.forEach(result => {
    console.log(`🔍 Processing result for ${result.location.name}`);
    
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

  // Add more summary data as needed...
};

const addPOIDataRows = (result: EnrichmentResult, rows: string[][]): void => {
  const { location, enrichments } = result;

  // Add all POI data as individual rows
  Object.entries(enrichments).forEach(([key, value]) => {
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
    }
  });
};
