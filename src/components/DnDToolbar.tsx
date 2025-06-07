import React from 'react'
import { useDnDStore, Tool } from '@/stores/dndStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  MousePointer, 
  Pencil, 
  Type, 
  Users, 
  Eraser, 
  Hand, 
  Grid3X3, 
  ZoomIn, 
  ZoomOut, 
  Upload,
  Trash2,
  Save,
  Download,
  Eye,
  EyeOff,
  Cloud,
  Square,
  Circle,
  Minus
} from 'lucide-react'

interface DnDToolbarProps {
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onClearAll: () => void
  onSave: () => void
  onLoad: () => void
}

export default function DnDToolbar({ onFileUpload, onClearAll, onSave, onLoad }: DnDToolbarProps) {
  const {
    activeTool,
    brushSize,
    brushColor,
    fogBrushSize,
    fogEditMode,
    fogApplied,
    fogCoverEntireMap,
    characterVisionRadius,
    zoom,
    showGrid,
    setActiveTool,
    setBrushSize,
    setBrushColor,
    setFogBrushSize,
    toggleFogEditMode,
    applyFog,
    resetFog,
    setFogCoverEntireMap,
    setCharacterVisionRadius,
    setZoom,
    toggleGrid
  } = useDnDStore()

  const handleZoomIn = () => setZoom(zoom * 1.2)
  const handleZoomOut = () => setZoom(zoom / 1.2)
  const handleResetZoom = () => setZoom(1)

  const tools = [
    { id: 'select', icon: MousePointer, label: 'Sélectionner' },
    { id: 'draw', icon: Pencil, label: 'Dessiner' },
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Cercle' },
    { id: 'line', icon: Minus, label: 'Ligne' },
    { id: 'text', icon: Type, label: 'Texte' },
    { id: 'character', icon: Users, label: 'Personnage' },
    { id: 'eraser', icon: Eraser, label: 'Gomme' },
    { id: 'pan', icon: Hand, label: 'Navigation' },
    ...(fogEditMode ? [
      { id: 'fog-add', icon: EyeOff, label: 'Ajouter brouillard (rouge)' },
      { id: 'fog-remove', icon: Eye, label: 'Enlever brouillard (vert)' }
    ] : [])
  ] as const

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md border-b">
      <div className="flex items-center justify-between p-3 gap-4">
        {/* Tools */}
        <div className="flex items-center gap-2">
          {tools.map(({ id, icon: Icon, label }) => (
            <Button
              key={id}
              variant={activeTool === id ? "default" : "outline"}
              size="sm"
              onClick={() => {
                console.log(`Setting active tool to: ${id}`)
                setActiveTool(id as Tool)
              }}
              title={label}
            >
              <Icon className="w-4 h-4" />
            </Button>
          ))}
        </div>

        {/* Brush Controls */}
        <div className="flex items-center gap-2">
          <Input
            type="range"
            min="1"
            max="50"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-20 h-8"
            title="Taille du pinceau"
          />
          <span className="text-sm text-gray-600 w-8">{brushSize}</span>
          
          <Input
            type="color"
            value={brushColor}
            onChange={(e) => setBrushColor(e.target.value)}
            className="w-8 h-8 p-0 border-0"
            title="Couleur"
          />
        </div>

        {/* Fog Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant={fogEditMode ? "default" : "outline"}
            size="sm"
            onClick={toggleFogEditMode}
            title="Mode édition brouillard"
          >
            <Cloud className="w-4 h-4" />
          </Button>
          
          {fogEditMode && !fogApplied && (
            <>
              <div className="flex items-center gap-1 text-xs">
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={fogCoverEntireMap}
                    onChange={(e) => setFogCoverEntireMap(e.target.checked)}
                    className="w-3 h-3"
                  />
                  <span className="text-gray-600">Couvrir toute la carte</span>
                </label>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={applyFog}
                title="Appliquer le brouillard"
                className="bg-green-600 hover:bg-green-700"
              >
                ✓ Valider
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetFog}
                title="Réinitialiser le brouillard"
                className="text-red-600 hover:text-red-700"
              >
                🗑️ Reset
              </Button>
            </>
          )}
          
          {fogApplied && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFog}
              title="Réinitialiser le brouillard"
              className="text-red-600 hover:text-red-700"
            >
              🗑️ Reset
            </Button>
          )}
          
          {(activeTool === 'fog-add' || activeTool === 'fog-remove') && (
            <>
              <Input
                type="range"
                min="10"
                max="100"
                value={fogBrushSize}
                onChange={(e) => setFogBrushSize(Number(e.target.value))}
                className="w-20 h-8"
                title="Taille du pinceau brouillard"
              />
              <span className="text-sm text-gray-600 w-8">{fogBrushSize}</span>
            </>
          )}
          
          {(fogEditMode || fogApplied) && (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-gray-600">Vision:</span>
              <Input
                type="range"
                min="50"
                max="400"
                value={characterVisionRadius}
                onChange={(e) => setCharacterVisionRadius(Number(e.target.value))}
                className="w-16 h-6"
                title="Rayon de vision des personnages"
              />
              <span className="text-gray-600 w-8 text-xs">{characterVisionRadius}</span>
            </div>
          )}
        </div>

        {/* Grid Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant={showGrid ? "default" : "outline"}
            size="sm"
            onClick={toggleGrid}
            title="Afficher/Masquer la grille"
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            title="Dézoomer"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetZoom}
            title="Reset zoom"
            className="min-w-[60px]"
          >
            {Math.round(zoom * 100)}%
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            title="Zoomer"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        {/* File Operations */}
        <div className="flex items-center gap-2">
          <label htmlFor="file-upload">
            <Button
              variant="outline"
              size="sm"
              asChild
              title="Charger une image de fond"
            >
              <span>
                <Upload className="w-4 h-4" />
              </span>
            </Button>
          </label>
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            onChange={onFileUpload}
            className="hidden"
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={onSave}
            title="Sauvegarder"
          >
            <Save className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onLoad}
            title="Charger"
          >
            <Download className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onClearAll}
            title="Tout effacer"
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
} 