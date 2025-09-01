/**
 * Elevation Service for Open-Meteo Elevation API
 * Provides elevation data and calculates slope and aspect using Horn's algorithm
 */

export interface ElevationGrid {
  elevations: number[][]; // 3x3 grid of elevations
  centerLat: number;
  centerLon: number;
  gridSpacing: number; // meters between grid points
}

export interface TerrainAnalysis {
  elevation: number; // meters
  slope: number; // degrees
  aspect: number; // degrees (0-360, North = 0)
  slopeDirection: string; // cardinal direction
}

/**
 * Fetch elevation data for a 3x3 grid around a center point
 */
export async function fetchElevationGrid(
  centerLat: number, 
  centerLon: number, 
  gridSpacing: number = 90
): Promise<ElevationGrid> {
  const gridSize = 3;
  const halfGrid = Math.floor(gridSize / 2);
  const elevations: number[][] = [];
  
  // Build coordinate arrays for the 3x3 grid
  const latitudes: number[] = [];
  const longitudes: number[] = [];
  
  for (let row = 0; row < gridSize; row++) {
    const lat = centerLat + (row - halfGrid) * (gridSpacing / 111000); // ~111km per degree
    for (let col = 0; col < gridSize; col++) {
      const lon = centerLon + (col - halfGrid) * (gridSpacing / (111000 * Math.cos(centerLat * Math.PI / 180)));
      latitudes.push(lat);
      longitudes.push(lon);
    }
  }
  
  try {
    // Call Open-Meteo Elevation API
    const response = await fetch(
      `https://api.open-meteo.com/v1/elevation?latitude=${latitudes.join(',')}&longitude=${longitudes.join(',')}`
    );
    
    if (!response.ok) {
      throw new Error(`Elevation API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.elevation || data.elevation.length !== 9) {
      throw new Error('Invalid elevation data received');
    }
    
    // Convert flat array to 3x3 grid
    for (let row = 0; row < gridSize; row++) {
      elevations[row] = [];
      for (let col = 0; col < gridSize; col++) {
        elevations[row][col] = data.elevation[row * gridSize + col];
      }
    }
    
    return {
      elevations,
      centerLat,
      centerLon,
      gridSpacing
    };
    
  } catch (error) {
    console.error('Error fetching elevation grid:', error);
    throw error;
  }
}

/**
 * Calculate slope using Horn's algorithm
 */
export function calculateSlope(elevations: number[][]): number {
  // Horn's algorithm for 3x3 grid
  // Grid layout:
  // z1 z2 z3
  // z4 z5 z6  
  // z7 z8 z9
  
  const z1 = elevations[0][0];
  const z2 = elevations[0][1];
  const z3 = elevations[0][2];
  const z4 = elevations[1][0];
  const z5 = elevations[1][1];
  const z6 = elevations[1][2];
  const z7 = elevations[2][0];
  const z8 = elevations[2][1];
  const z9 = elevations[2][2];
  
  const deltaX = 90; // meters
  const deltaY = 90; // meters
  
  // Calculate gradient components
  const a = ((z3 + 2*z6 + z9) - (z1 + 2*z4 + z7)) / (8 * deltaX);
  const b = ((z7 + 2*z8 + z9) - (z1 + 2*z2 + z3)) / (8 * deltaY);
  
  // Calculate slope in degrees
  const slope = Math.atan(Math.sqrt(a*a + b*b)) * (180 / Math.PI);
  
  return slope;
}

/**
 * Calculate aspect (compass direction of slope)
 */
export function calculateAspect(elevations: number[][]): number {
  // Same grid layout as slope calculation
  const z1 = elevations[0][0];
  const z2 = elevations[0][1];
  const z3 = elevations[0][2];
  const z4 = elevations[1][0];
  const z5 = elevations[1][1];
  const z6 = elevations[1][2];
  const z7 = elevations[2][0];
  const z8 = elevations[2][1];
  const z9 = elevations[2][2];
  
  const deltaX = 90; // meters
  const deltaY = 90; // meters
  
  // Calculate gradient components
  const a = ((z3 + 2*z6 + z9) - (z1 + 2*z4 + z7)) / (8 * deltaX);
  const b = ((z7 + 2*z8 + z9) - (z1 + 2*z2 + z3)) / (8 * deltaY);
  
  // Calculate aspect in degrees (North = 0, clockwise)
  let aspect = Math.atan2(b, -a) * (180 / Math.PI);
  
  // Normalize to 0-360 range
  if (aspect < 0) {
    aspect += 360;
  }
  
  return aspect;
}

/**
 * Convert aspect degrees to cardinal direction
 */
export function aspectToDirection(aspect: number): string {
  const directions = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
  ];
  
  const index = Math.round(aspect / 22.5) % 16;
  return directions[index];
}

/**
 * Get complete terrain analysis for a location
 */
export async function getTerrainAnalysis(
  lat: number, 
  lon: number
): Promise<TerrainAnalysis> {
  try {
    const grid = await fetchElevationGrid(lat, lon);
    const slope = calculateSlope(grid.elevations);
    const aspect = calculateAspect(grid.elevations);
    const slopeDirection = aspectToDirection(aspect);
    
    return {
      elevation: grid.elevations[1][1], // center elevation
      slope,
      aspect,
      slopeDirection
    };
    
  } catch (error) {
    console.error('Error calculating terrain analysis:', error);
    throw error;
  }
}
