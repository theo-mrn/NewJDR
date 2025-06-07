// Utilitaires pour les jeux de rôle D&D

// Taille standard d'une case en pixels (5 pieds en D&D 5e)
export const GRID_SIZE = 40;

// Types pour les tokens/personnages
export interface Token {
  id: string;
  name: string;
  x: number;
  y: number;
  size: 'small' | 'medium' | 'large' | 'huge' | 'gargantuan';
  color: string;
  isPlayerCharacter: boolean;
}

// Types pour les zones de sorts
export interface SpellArea {
  type: 'circle' | 'cone' | 'line' | 'cube' | 'sphere';
  radius: number; // en cases (5 pieds)
  centerX: number;
  centerY: number;
  color: string;
  opacity: number;
}

// Convertir des coordonnées pixel en coordonnées de grille
export function pixelToGrid(pixelX: number, pixelY: number): { gridX: number; gridY: number } {
  return {
    gridX: Math.floor(pixelX / GRID_SIZE),
    gridY: Math.floor(pixelY / GRID_SIZE)
  };
}

// Convertir des coordonnées de grille en coordonnées pixel (centre de la case)
export function gridToPixel(gridX: number, gridY: number): { pixelX: number; pixelY: number } {
  return {
    pixelX: gridX * GRID_SIZE + GRID_SIZE / 2,
    pixelY: gridY * GRID_SIZE + GRID_SIZE / 2
  };
}

// Calculer la distance en cases entre deux points (règles D&D 5e)
export function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
  const deltaX = Math.abs(x2 - x1);
  const deltaY = Math.abs(y2 - y1);
  
  // Règle D&D 5e : distance diagonale = distance la plus longue
  return Math.max(deltaX, deltaY);
}

// Calculer la distance en pieds
export function calculateDistanceInFeet(x1: number, y1: number, x2: number, y2: number): number {
  return calculateDistance(x1, y1, x2, y2) * 5;
}

// Vérifier si un point est dans une zone de sort circulaire
export function isInCircularArea(
  pointX: number, 
  pointY: number, 
  centerX: number, 
  centerY: number, 
  radius: number
): boolean {
  const distance = calculateDistance(pointX, pointY, centerX, centerY);
  return distance <= radius;
}

// Générer une couleur aléatoire pour un token
export function generateRandomColor(): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Créer un nouveau token
export function createToken(
  name: string, 
  gridX: number, 
  gridY: number, 
  isPlayerCharacter: boolean = false
): Token {
  return {
    id: `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    x: gridX,
    y: gridY,
    size: 'medium',
    color: generateRandomColor(),
    isPlayerCharacter
  };
} 