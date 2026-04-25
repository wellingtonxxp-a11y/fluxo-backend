/**
 * Grid Service - Simple spatial grid system
 * Defines cells with id, center lat/lng, base score
 */

export interface Cell {
  id: string;
  lat: number;
  lng: number;
  baseScore: number;
}

// Mock grid: 10x10 cells around a central point (e.g., São Paulo center approx -23.55, -46.63)
// Each cell is 0.01 degrees (~1km)
const GRID_SIZE = 10;
const CELL_SIZE = 0.01; // ~1km
const CENTER_LAT = -23.55;
const CENTER_LNG = -46.63;

const cells: Cell[] = [];

// Generate grid
for (let i = 0; i < GRID_SIZE; i++) {
  for (let j = 0; j < GRID_SIZE; j++) {
    const lat = CENTER_LAT + (i - GRID_SIZE / 2) * CELL_SIZE;
    const lng = CENTER_LNG + (j - GRID_SIZE / 2) * CELL_SIZE;
    const id = `cell_${i}_${j}`;
    const baseScore = Math.random() * 50 + 25; // Random base score 25-75
    cells.push({ id, lat, lng, baseScore });
  }
}

/**
 * Get all cells
 */
export function getAllCells(): Cell[] {
  return cells;
}

/**
 * Get nearby cells within radius (in degrees, approx 1 degree ~ 111km)
 */
export function getNearbyCells(lat: number, lng: number, radiusDegrees: number = 0.02): Cell[] {
  return cells.filter(cell => {
    const distance = Math.sqrt(
      Math.pow(cell.lat - lat, 2) + Math.pow(cell.lng - lng, 2)
    );
    return distance <= radiusDegrees;
  });
}

/**
 * Get cell neighbors (adjacent cells)
 */
export function getNeighbors(cellId: string): Cell[] {
  const cell = cells.find(c => c.id === cellId);
  if (!cell) return [];

  const [i, j] = cellId.replace('cell_', '').split('_').map(Number);
  const neighbors: Cell[] = [];

  for (let di = -1; di <= 1; di++) {
    for (let dj = -1; dj <= 1; dj++) {
      if (di === 0 && dj === 0) continue;
      const ni = i + di;
      const nj = j + dj;
      if (ni >= 0 && ni < GRID_SIZE && nj >= 0 && nj < GRID_SIZE) {
        const neighborId = `cell_${ni}_${nj}`;
        const neighbor = cells.find(c => c.id === neighborId);
        if (neighbor) neighbors.push(neighbor);
      }
    }
  }

  return neighbors;
}