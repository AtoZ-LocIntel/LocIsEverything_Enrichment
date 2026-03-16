/**
 * Adapter for Colorado Parks and Wildlife (CPW) Species Data Feature Service
 * Service URL: https://services5.arcgis.com/ttNGmDvKQA7oeDQ3/arcgis/rest/services/CPWSpeciesData/FeatureServer
 * 
 * All layers are polygons supporting point-in-polygon and proximity queries up to 50 miles
 */

/**
 * Convert layer name to POI config ID
 */
export function layerNameToId(layerName: string): string {
  return layerName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/'/g, '') // Remove apostrophes
    .replace(/\(/g, '')
    .replace(/\)/g, '')
    .replace(/-/g, '_')
    .replace(/and/g, 'and')
    .replace(/&/g, 'and');
}

const BASE_SERVICE_URL = 'https://services5.arcgis.com/ttNGmDvKQA7oeDQ3/arcgis/rest/services/CPWSpeciesData/FeatureServer';

export interface CPWSpeciesFeature {
  objectId: number;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // Distance from query point (0 if inside polygon)
  isContaining?: boolean; // True if point is within polygon
  layerId: number; // Which layer this feature came from
  layerName: string; // Human-readable layer name
}

/**
 * Point-in-polygon check using ray casting algorithm
 */
function pointInPolygon(lat: number, lon: number, rings: number[][][]): boolean {
  if (!rings || rings.length === 0) return false;
  
  const outerRing = rings[0];
  if (!outerRing || outerRing.length < 3) return false;
  
  let inside = false;
  for (let i = 0, j = outerRing.length - 1; i < outerRing.length; j = i++) {
    const xi = outerRing[i][0]; // lon
    const yi = outerRing[i][1]; // lat
    const xj = outerRing[j][0]; // lon
    const yj = outerRing[j][1]; // lat
    
    const intersect = ((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  // Check if point is in any holes
  for (let h = 1; h < rings.length; h++) {
    const hole = rings[h];
    if (!hole || hole.length < 3) continue;
    
    let inHole = false;
    for (let i = 0, j = hole.length - 1; i < hole.length; j = i++) {
      const xi = hole[i][0];
      const yi = hole[i][1];
      const xj = hole[j][0];
      const yj = hole[j][1];
      
      const intersect = ((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
      if (intersect) inHole = !inHole;
    }
    
    if (inHole) {
      inside = false; // Point is in a hole, so not inside polygon
      break;
    }
  }
  
  return inside;
}

/**
 * Calculate haversine distance between two points in miles
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate centroid of polygon rings
 */
function calculateCentroid(rings: number[][][]): { lat: number; lon: number } | null {
  if (!rings || rings.length === 0) return null;
  
  const outerRing = rings[0];
  if (!outerRing || outerRing.length < 3) return null;
  
  let sumLat = 0;
  let sumLon = 0;
  let count = 0;
  
  outerRing.forEach((coord: number[]) => {
    if (coord && coord.length >= 2) {
      sumLon += coord[0]; // x (lon)
      sumLat += coord[1]; // y (lat)
      count++;
    }
  });
  
  if (count === 0) return null;
  
  return {
    lat: sumLat / count,
    lon: sumLon / count
  };
}

/**
 * Query CPW Species Data layer with point-in-polygon and proximity queries
 * All layers are polygons, so we support both query types
 */
export async function getCPWSpeciesLayerData(
  layerId: number,
  layerName: string,
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<CPWSpeciesFeature[]> {
  try {
    const maxRecordCount = 10000; // Service supports up to 10000 records
    console.log(`🦌 CPW Species Data ${layerName} (Layer ${layerId}) query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`);

    const results: CPWSpeciesFeature[] = [];
    const containsObjectIdsSet = new Set<number>(); // Track object IDs from contains query

    // Point-in-polygon query (for polygons containing the point)
    try {
      const pointInPolyUrl = new URL(`${BASE_SERVICE_URL}/${layerId}/query`);
      pointInPolyUrl.searchParams.set('f', 'json');
      pointInPolyUrl.searchParams.set('where', '1=1');
      pointInPolyUrl.searchParams.set('outFields', '*');
      pointInPolyUrl.searchParams.set('geometry', JSON.stringify({
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 }
      }));
      pointInPolyUrl.searchParams.set('geometryType', 'esriGeometryPoint');
      pointInPolyUrl.searchParams.set('spatialRel', 'esriSpatialRelWithin');
      pointInPolyUrl.searchParams.set('inSR', '4326');
      pointInPolyUrl.searchParams.set('outSR', '4326');
      pointInPolyUrl.searchParams.set('returnGeometry', 'true');
      pointInPolyUrl.searchParams.set('resultRecordCount', maxRecordCount.toString());

      console.log(`🔗 CPW Species Data ${layerName} Point-in-Polygon Query URL: ${pointInPolyUrl.toString()}`);

      const pointInPolyResponse = await fetch(pointInPolyUrl.toString());
      if (pointInPolyResponse.ok) {
        const pointInPolyData = await pointInPolyResponse.json();
        
        if (!pointInPolyData.error && pointInPolyData.features && Array.isArray(pointInPolyData.features)) {
          pointInPolyData.features.forEach((feature: any) => {
            const attributes = feature.attributes || {};
            const geometry = feature.geometry;
            const objectId = attributes.OBJECTID || attributes.objectid || attributes.FID || 0;
            
            if (geometry && geometry.rings) {
              // Verify point is actually in polygon using client-side check
              if (pointInPolygon(lat, lon, geometry.rings)) {
                results.push({
                  objectId,
                  attributes,
                  geometry,
                  distance_miles: 0,
                  isContaining: true,
                  layerId,
                  layerName
                });
                containsObjectIdsSet.add(objectId);
              }
            }
          });
          
          console.log(`✅ Found ${results.length} ${layerName} feature(s) containing the point`);
        }
      }
    } catch (error) {
      console.error(`❌ Point-in-polygon query failed for ${layerName}:`, error);
    }

    // Proximity query (for nearby polygons)
    if (radiusMiles > 0) {
      try {
        const radiusMeters = radiusMiles * 1609.34; // Convert miles to meters
        
        const proximityUrl = new URL(`${BASE_SERVICE_URL}/${layerId}/query`);
        proximityUrl.searchParams.set('f', 'json');
        proximityUrl.searchParams.set('where', '1=1');
        proximityUrl.searchParams.set('outFields', '*');
        proximityUrl.searchParams.set('geometry', JSON.stringify({
          x: lon,
          y: lat,
          spatialReference: { wkid: 4326 }
        }));
        proximityUrl.searchParams.set('geometryType', 'esriGeometryPoint');
        proximityUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
        proximityUrl.searchParams.set('distance', radiusMeters.toString());
        proximityUrl.searchParams.set('units', 'esriSRUnit_Meter');
        proximityUrl.searchParams.set('inSR', '4326');
        proximityUrl.searchParams.set('outSR', '4326');
        proximityUrl.searchParams.set('returnGeometry', 'true');
        proximityUrl.searchParams.set('resultRecordCount', maxRecordCount.toString());

        console.log(`🔗 CPW Species Data ${layerName} Proximity Query URL: ${proximityUrl.toString()}`);

        const proximityResponse = await fetch(proximityUrl.toString());
        
        if (proximityResponse.ok) {
          const proximityData = await proximityResponse.json();
          
          if (!proximityData.error && proximityData.features && Array.isArray(proximityData.features)) {
            proximityData.features.forEach((feature: any) => {
              const attributes = feature.attributes || {};
              const geometry = feature.geometry;
              const objectId = attributes.OBJECTID || attributes.objectid || attributes.FID || 0;
              
              // Skip if already added from point-in-polygon query
              if (containsObjectIdsSet.has(objectId)) {
                return;
              }
              
              let distanceMiles = radiusMiles;
              let featureLat: number | null = null;
              let featureLon: number | null = null;

              // Calculate distance using polygon centroid
              if (geometry && geometry.rings && geometry.rings.length > 0) {
                const centroid = calculateCentroid(geometry.rings);
                if (centroid) {
                  featureLat = centroid.lat;
                  featureLon = centroid.lon;
                }
              }

              // Calculate distance if we have coordinates
              if (featureLat !== null && featureLon !== null) {
                distanceMiles = calculateDistance(lat, lon, featureLat, featureLon);
              }

              // Only include if within radius
              if (distanceMiles <= radiusMiles) {
                results.push({
                  objectId,
                  attributes,
                  geometry,
                  distance_miles: distanceMiles,
                  isContaining: false,
                  layerId,
                  layerName
                });
              }
            });
          }
        }
      } catch (error) {
        console.error(`❌ Proximity query failed for ${layerName}:`, error);
      }
    }

    // Remove duplicates based on objectId
    const uniqueResults = Array.from(
      new Map(results.map(item => [item.objectId, item])).values()
    );

    console.log(`✅ Retrieved ${uniqueResults.length} unique ${layerName} feature(s)`);
    return uniqueResults;
    
  } catch (error: any) {
    console.error(`❌ Error querying CPW Species Data ${layerName}:`, error);
    return [];
  }
}

// Layer name mappings - all 315 layers
export const CPW_LAYER_NAMES: Record<number, string> = {
  0: "Abert's Squirrel Overall Range",
  1: 'Bald Eagle Nest Sites',
  2: 'Bald Eagle Roost Sites',
  3: 'Bald Eagle Communal Roosts',
  4: 'Bald Eagle Winter Concentration',
  5: 'Bald Eagle Summer Forage',
  6: 'Bald Eagle Winter Forage',
  7: 'Bald Eagle Winter Range',
  8: 'Bighorn Migration Patterns',
  9: 'Bighorn Migration Corridors',
  10: 'Bighorn Summer Concentration Area',
  11: 'Bighorn Summer Range',
  12: 'Bighorn Production Area',
  13: 'Bighorn Mineral Lick',
  14: 'Bighorn Water Source',
  15: 'Bighorn Severe Winter Range',
  16: 'Bighorn Winter Concentration Area',
  17: 'Bighorn Winter Range',
  18: 'Bighorn Overall Range',
  19: 'Black Bear Fall Concentration',
  20: 'Black Bear Human Conflict Area',
  21: 'Black Bear Summer Concentration',
  22: 'Black Bear Overall Range',
  23: 'Black-footed Ferret Release Sites',
  24: 'Black-tailed Prairie Dog Colony Potential Occurrence',
  25: 'Black-tailed Prairie Dog Overall Range',
  26: 'Bobwhite Quail Concentration Area',
  27: 'Bobwhite Quail Overall Range',
  28: 'Boreal Toad Overall Range',
  29: 'Brazilian Free-tailed Bat Overall Range',
  30: 'Columbian Sharp-tailed Grouse Production Area',
  31: 'Columbian Sharp-tailed Grouse Winter Range',
  32: 'Columbian Sharp-tailed Grouse Overall Range',
  33: 'Elk Migration Patterns',
  34: 'Elk Highway Crossings',
  35: 'Elk Summer Concentration Area',
  36: 'Elk Summer Range',
  37: 'Elk Production Area',
  38: 'Elk Limited Use Area',
  39: 'Elk Resident Population Area',
  40: 'Elk Migration Corridors',
  41: 'Elk Severe Winter Range',
  42: 'Elk Winter Concentration Area',
  43: 'Elk Winter Range',
  44: 'Elk Overall Range',
  45: 'Canada Geese Molting Area',
  46: 'Canada Geese Brood Concentration Area',
  47: 'Canada Geese Foraging Area',
  48: 'Canada Geese Production Area',
  49: 'Canada Geese Winter Concentration Area',
  50: 'Canada Geese Winter Range',
  51: 'Snow Geese Winter Range',
  52: 'Great Blue Heron Nesting Area',
  53: 'Great Blue Heron Foraging Area',
  54: 'Great Blue Heron Historic Nest Area',
  55: 'Greater Prairie Chicken Production Area',
  56: 'Greater Prairie Chicken Overall Range',
  57: 'Greater Prairie Chicken Historic Range',
  58: 'Greater Sage Grouse Historic Habitat',
  59: 'Greater Sage Grouse Brood Area',
  60: 'Greater Sage Grouse Production Area',
  61: 'Greater Sage Grouse Severe Winter Range',
  62: 'Greater Sage Grouse Winter Range',
  63: 'Greater Sage Grouse Linkages',
  64: 'Greater Sage Grouse Priority and General Habitat',
  65: 'Greater Sage Grouse Overall Range',
  66: "Gunnison's Prairie Dog Overall Range",
  67: "Gunnison's Sage Grouse Historic Habitat",
  68: "Gunnison's Sage Grouse Brood Area",
  69: "Gunnison's Sage Grouse Production Area",
  70: "Gunnison's Sage Grouse Severe Winter Range",
  71: "Gunnison's Sage Grouse Winter Range",
  72: "Gunnison's Sage Grouse Overall Range",
  73: 'Kit Fox Historic Overall Range',
  74: 'Least Tern Production Area',
  75: 'Least Tern Foraging Area',
  76: 'Lesser Prairie Chicken Production Area',
  77: 'Lesser Prairie Chicken Estimated Occupied Range',
  78: 'Lesser Prairie Chicken Historic Range',
  79: 'Lynx Habitat',
  80: 'Moose Migration Patterns',
  81: 'Moose Priority Habitat',
  82: 'Moose Concentration Area',
  83: 'Moose Summer Range',
  84: 'Moose Winter Range',
  85: 'Moose Overall Range',
  86: 'Mountain Goat Mineral Lick',
  87: 'Mountain Goat Migration Corridors',
  88: 'Mountain Goat Production Area',
  89: 'Mountain Goat Concentration Area',
  90: 'Mountain Goat Summer Range',
  91: 'Mountain Goat Winter Range',
  92: 'Mountain Goat Overall Range',
  93: 'Mountain Lion Human Conflict Area',
  94: 'Mountain Lion Peripheral Range',
  95: 'Mountain Lion Overall Range',
  96: 'Mule Deer Migration Patterns',
  97: 'Mule Deer Highway Crossing',
  98: 'Mule Deer Concentration Area',
  99: 'Mule Deer Summer Range',
  100: 'Mule Deer Limited Use Area',
  101: 'Mule Deer Resident Population Area',
  102: 'Mule Deer Migration Corridors',
  103: 'Mule Deer Severe Winter Range',
  104: 'Mule Deer Winter Concentration Area',
  105: 'Mule Deer Winter Range',
  106: 'Mule Deer Overall Range',
  107: 'New Mexico Jumping Mouse Overall Range',
  108: 'Osprey Nest Sites',
  109: 'Osprey Foraging Area',
  110: 'Peregrine Falcon Nesting Area',
  111: 'Peregrine Falcon Potential Nesting',
  112: 'Piping Plover Production Area',
  113: 'Piping Plover Foraging Area',
  114: "Preble's Meadow Jumping Mouse Overall Range",
  115: 'Pronghorn Migration Patterns',
  116: 'Pronghorn Concentration Area',
  117: 'Pronghorn Limited Use Area',
  118: 'Pronghorn Resident Population Area',
  119: 'Pronghorn Migration Corridors',
  120: 'Pronghorn Severe Winter Range',
  121: 'Pronghorn Winter Concentration',
  122: 'Pronghorn Winter Range',
  123: 'Pronghorn Perennial Water',
  124: 'Pronghorn Overall Range',
  125: 'Plains Sharp-tailed Grouse Production Area',
  126: 'Plains Sharp-tailed Grouse Overall Range',
  127: 'Black-necked Gartersnake Overall Range',
  128: 'Bullsnake Overall Range',
  129: 'Coachwhip Overall Range',
  130: 'Common Gartersnake Overall Range',
  131: 'Common Kingsnake Overall Range',
  132: 'Common Lesser Earless Lizard Overall Range',
  133: 'Common Sagebrush Lizard Overall Range',
  134: 'Common Side-blotched Lizard Overall Range',
  135: 'Desert Nightsnake And Chihuahuan Nightsnake Overall Range',
  136: 'Desert Spiny Lizard Overall Range',
  137: 'Diploid Checkered Whiptail Overall Range',
  138: 'Eastern Collared Lizard Overall Range',
  139: 'Eastern Hog-nosed Snake Overall Range',
  140: 'Glossy Snake Overall Range',
  141: 'Great Plains Ratsnake Overall Range',
  142: 'Great Plains Skink Overall Range',
  143: "Hernandez's Short-horned Lizard Overall Range",
  144: 'Lined Snake Overall Range',
  145: 'Long-nosed Leopard Lizard Overall Range',
  146: 'Long-nosed Snake Overall Range',
  147: 'Massasauga Overall Range',
  148: 'Massasauga Potential Habitat',
  149: 'Milksnake Overall Range',
  150: 'North American Racer Overall Range',
  151: 'Northern Watersnake Overall Range',
  152: 'Ornate Box Turtle Overall Range',
  153: 'Ornate Tree Lizard Overall Range',
  154: 'Painted Turtle Overall Range',
  155: 'Plains Black-headed Snake Overall Range',
  156: 'Plains Gartersnake Overall Range',
  157: 'Plains Hog-nosed Snake Overall Range',
  158: 'Plateau Striped Whiptail Overall Range',
  159: 'Prairie Lizard And Plateau Fence Lizard Overall Range',
  160: 'Prairie Rattlesnake And Western Rattlesnake Overall Range',
  161: 'Ring-necked Snake Overall Range',
  162: 'Round-tailed Horned Lizard Overall Range',
  163: 'Six-lined Racerunner Overall Range',
  164: "Smith's Black-headed Snake Overall Range",
  165: 'Smooth Greensnake Overall Range',
  166: 'Snapping Turtle Overall Range',
  167: 'Spiny Softshell Overall Range',
  168: 'Striped Whipsnake Overall Range',
  169: 'Terrestrial Gartersnake Overall Range',
  170: 'Texas-horned Lizard Overall Range',
  171: 'Texas-horned Lizard Potential Habitat',
  172: 'Texas Threadsnake Overall Range',
  173: 'Tiger Whiptail Overall Range',
  174: 'Triploid Checkered Whiptail Overall Range',
  175: 'Variable Skink and Many-lined Skink Overall Range',
  176: 'Western Groundsnake Overall Range',
  177: 'Western Ribbon Snake Overall Range',
  178: 'Yellow Mud Turtle Overall Range',
  179: 'Ring-necked Pheasant Concentration Area',
  180: 'Ring-necked Pheasant Overall Range',
  181: 'River Otter Concentration Area',
  182: 'River Otter Winter Range',
  183: 'River Otter Overall Range',
  184: 'Greater Sandhilll Crane Overall Range',
  185: 'Lesser Sandhill Crane Overall Range',
  186: 'Scaled Quail Concentration Area',
  187: 'Scaled Quail Overall Range',
  188: 'Swift Fox Overall Range',
  189: 'White Pelican Nesting Area',
  190: 'White Pelican Foraging Area',
  191: 'White Pelican Overall Range',
  192: 'White-tailed Deer Highway Crossing',
  193: 'White-tailed Deer Concentration Area',
  194: 'White-tailed Deer Winter Range',
  195: 'White-tailed Deer Overall Range',
  196: 'White-tailed Prairie Dog Overall Range',
  197: 'White-tailed Ptarmigan Winter Range',
  198: 'White-tailed Ptarmigan Overall Range',
  199: 'Wild Turkey Roost Sites',
  200: 'Wild Turkey Production Area',
  201: 'Wild Turkey Winter Concentration Area',
  202: 'Wild Turkey Winter Range',
  203: 'Wild Turkey Overall Range',
  204: "Allen's Big-eared Bat Overall Range",
  205: 'Big Brown Bat Overall Range',
  206: 'Big Free-tailed Bat Overall Range',
  207: 'California Myotis Overall Range',
  208: 'Canyon Bat Overall Range',
  209: 'Fringed Myotis Overall Range',
  210: 'Hoary Bat Overall Range',
  211: 'Little Brown Myotis Overall Range',
  212: 'Long-eared Myotis Overall Range',
  213: 'Long-legged Myotis Overall Range',
  214: 'Pallid Bat Overall Range',
  215: 'Red Bat Overall Range',
  216: 'Silver-haired Bat Overall Range',
  217: 'Spotted Bat Overall Range',
  218: "Townsends Big-eared Bat Overall Range",
  219: 'Tri-colored Bat Overall Range',
  220: 'Western Small-footed Myotis Overall Range',
  221: 'Yuma Myotis Overall Range',
  222: 'American Bittern Breeding Range',
  223: 'Band-tailed Pigeon Breeding Range',
  224: 'Barrow Goldeneye Breeding Range',
  225: 'Black Swift Breeding Range',
  226: 'Black Tern Breeding Range',
  227: 'Bobolink Breeding Range',
  228: 'Brewer Sparrow Breeding Range',
  229: 'Brown-capped Rosy Finch Breeding Range',
  230: 'Brown-capped Rosy Finch Overall Range',
  231: 'Burrowing Owl Breeding Range',
  232: 'Cassin Finch Breeding Range',
  233: 'Cassin Sparrow Breeding Range',
  234: 'Chestnut-collared Longspur Breeding Range',
  235: 'Ferruginous Hawk Breeding Range',
  236: 'Golden Eagle Breeding Range',
  237: 'Grace Warbler Breeding Range',
  238: 'Grasshopper Sparrow Breeding Range',
  239: 'Gray Vireo Breeding Range',
  240: 'Juniper Titmouse Breeding Range',
  241: 'Lark Bunting Breeding Range',
  242: 'Lazuli Bunting Breeding Range',
  243: 'Least Tern Breeding Range',
  244: 'Lewis Woodpecker Breeding Range',
  245: 'Long-billed Curlew Breeding Range',
  246: 'McCown Longspur Breeding Range',
  247: 'Mountain Plover Breeding Range',
  248: 'Northern Bobwhite Breeding Range',
  249: 'Northern Goshawk Breeding Range',
  250: 'Northern Harrier Breeding Range',
  251: 'Olive-sided Flycatcher Breeding Range',
  252: 'Pinyon Jay Breeding Range',
  253: 'Piping Plover Breeding Range',
  254: 'Prairie Falcon Breeding Range',
  255: 'Purple Martin Breeding Range',
  256: 'Rufous Hummingbird Migration Range',
  257: 'Sage Sparrow Breeding Range',
  258: 'Swainson Hawk Breeding Range',
  259: 'Upland Sandpiper Breeding Range',
  260: 'Veery Breeding Range',
  261: 'Virginia Warbler Breeding Range',
  262: 'Western Snowy Plover Breeding Range',
  263: 'White-faced Ibis Breeding Range',
  264: 'Arkansas Darter HUC 12 Presence',
  265: 'Bluehead Sucker HUC 12 Presence',
  266: 'Bonytail HUC 12 Presence',
  267: 'Brassy Minnow HUC 12 Presence',
  268: 'Colorado Pikeminnow HUC 12 Presence',
  269: 'Common Shiner HUC 12 Presence',
  270: 'Cutthroat Trout HUC 12 Presence',
  271: 'Flannelmouth Sucker HUC 12 Presence',
  272: 'Flathead Chub HUC 12 Presence',
  273: 'Humpback Chub HUC 12 Presence',
  274: 'Iowa Darter HUC 12 Presence',
  275: 'Lake Chub HUC 12 Presence',
  276: 'Mountain Sucker HUC 12 Presence',
  277: 'Northern Redbelly Dace HUC 12 Presence',
  278: 'Orange-spotted Sunfish HUC 12 Presence',
  279: 'Orangethroat Darter HUC 12 Presence',
  280: 'Plains Minnow HUC 12 Presence',
  281: 'Plains Topminnow HUC 12 Presence',
  282: 'Razorback Sucker HUC 12 Presence',
  283: 'Rio Grande Chub HUC 12 Presence',
  284: 'Rio Grande Sucker HUC 12 Presence',
  285: 'Roundtail Chub HUC 12 Presence',
  286: 'Southern Redbelly Dace HUC 12 Presence',
  287: 'Stonecat HUC 12 Presence',
  288: 'Suckermouth Minnow HUC 12 Presence',
  289: "Blanchard's (Northern) Cricket Frog HUC 12 Presence",
  290: 'Canyon Tree Frog HUC 12 Presence',
  291: "Couch's Spadefoot HUC 12 Presence",
  292: 'Great Basin Spadefoot HUC 12 Presence',
  293: 'Great Plains (Western) Narrow-mouthed Toad HUC 12 Presence',
  294: 'Northern Leopard Frog HUC 12 Presence',
  295: 'Plains Leopard Frog HUC 12 Presence',
  296: 'Western Green Toad HUC 12 Presence',
  297: 'Wood Frog HUC 12 Presence',
  298: "Gunnison's Sage Grouse Occupied Habitat",
  299: 'Lesser Prairie Chicken CHAT Priority Areas',
  300: "Botta's Pocket Gopher Overall Range",
  301: 'Dwarf Shrew Overall Range',
  304: 'Olive-backed Pocket Mouse Overall Range',
  305: 'Pika Overall Range',
  306: 'Pygmy Rabbit Overall Range',
  307: 'Pygmy Shrew Overall Range',
  308: 'Sagebrush Vole Overall Range',
  309: 'Snowshoe Hare Overall Range',
  310: 'Southern Red-backed Vole Overall Range',
  311: 'White-tailed Jackrabbit Overall Range',
  312: 'Wolverine Potential Habitat',
  313: 'Big Game Pinch Points',
  314: 'Trumpeter Swan Winter Range'
};
