import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export type Tool = 'select' | 'draw' | 'text' | 'character' | 'eraser' | 'pan' | 'fog-add' | 'fog-remove' | 'rectangle' | 'circle' | 'line'

export interface Character {
  id: string
  name: string
  x: number
  y: number
  avatar: string
  size: number
  rotation: number
}

export interface DrawingPath {
  id: string
  points: number[]
  color: string
  width: number
}

export interface TextElement {
  id: string
  text: string
  x: number
  y: number
  style: {
    fontSize: number
    fill: string
    fontFamily: string
  }
}

export interface FogArea {
  id: string
  x: number
  y: number
  radius: number
  type: 'hidden' | 'revealed'
}

export interface Shape {
  id: string
  type: 'rectangle' | 'circle' | 'line'
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
  width: number
  fill?: boolean
  fillColor?: string
}

export interface DnDState {
  // Canvas state
  backgroundImage: string | null
  zoom: number
  panX: number
  panY: number
  
  // Tools
  activeTool: Tool
  brushSize: number
  brushColor: string
  
  // Elements
  characters: Character[]
  drawings: DrawingPath[]
  texts: TextElement[]
  shapes: Shape[]
  fogAreas: FogArea[]
  
  // UI state
  showGrid: boolean
  gridSize: number
  snapToGrid: boolean
  selectedElementId: string | null
  
  // Fog of war
  fogEditMode: boolean
  fogApplied: boolean
  fogBrushSize: number
  fogCoverEntireMap: boolean
  characterVisionRadius: number
  
  // Actions
  setActiveTool: (tool: Tool) => void
  setBrushSize: (size: number) => void
  setBrushColor: (color: string) => void
  setBackgroundImage: (url: string | null) => void
  setZoom: (zoom: number) => void
  setPan: (x: number, y: number) => void
  toggleGrid: () => void
  setGridSize: (size: number) => void
  toggleSnapToGrid: () => void
  
  // Fog of war actions
  toggleFogEditMode: () => void
  applyFog: () => void
  resetFog: () => void
  setFogBrushSize: (size: number) => void
  setFogCoverEntireMap: (cover: boolean) => void
  setCharacterVisionRadius: (radius: number) => void
  
  // Element actions
  addCharacter: (character: Omit<Character, 'id'>) => void
  updateCharacter: (id: string, updates: Partial<Character>) => void
  removeCharacter: (id: string) => void
  
  addDrawing: (drawing: Omit<DrawingPath, 'id'>) => void
  updateDrawing: (id: string, updates: Partial<DrawingPath>) => void
  removeDrawing: (id: string) => void
  
  addText: (text: Omit<TextElement, 'id'>) => void
  updateText: (id: string, updates: Partial<TextElement>) => void
  removeText: (id: string) => void
  
  addShape: (shape: Omit<Shape, 'id'>) => void
  updateShape: (id: string, updates: Partial<Shape>) => void
  removeShape: (id: string) => void
  
  addFogArea: (fogArea: Omit<FogArea, 'id'>) => void
  removeFogArea: (id: string) => void
  clearFogAreas: () => void
  
  selectElement: (id: string | null) => void
  deleteSelected: () => void
  clearAll: () => void
}

export const useDnDStore = create<DnDState>()(
  devtools(
    (set, get) => ({
      // Initial state
      backgroundImage: null,
      zoom: 1,
      panX: 0,
      panY: 0,
      
      activeTool: 'select',
      brushSize: 5,
      brushColor: '#000000',
      
      characters: [],
      drawings: [],
      texts: [],
      shapes: [],
      fogAreas: [],
      
      showGrid: true,
      gridSize: 25,
      snapToGrid: false,
      selectedElementId: null,
      
      fogEditMode: false,
      fogApplied: false,
      fogBrushSize: 50,
      fogCoverEntireMap: true,
      characterVisionRadius: 200,
      
      // Actions
      setActiveTool: (tool) => set({ activeTool: tool, selectedElementId: null }),
      setBrushSize: (size) => set({ brushSize: size }),
      setBrushColor: (color) => set({ brushColor: color }),
      setBackgroundImage: (url) => set({ backgroundImage: url }),
      setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(5, zoom)) }),
      setPan: (x, y) => set({ panX: x, panY: y }),
      toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
      setGridSize: (size) => set({ gridSize: size }),
      toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),
      
      // Fog of war actions
      toggleFogEditMode: () => set((state) => ({ 
        fogEditMode: !state.fogEditMode,
        // If exiting edit mode without applying, reset to applied state
        ...(state.fogEditMode && !state.fogApplied ? { fogAreas: [] } : {})
      })),
      applyFog: () => set({ fogApplied: true, fogEditMode: false }),
      resetFog: () => set({ fogAreas: [], fogApplied: false, fogEditMode: false }),
      setFogBrushSize: (size) => set({ fogBrushSize: size }),
      setFogCoverEntireMap: (cover) => set({ fogCoverEntireMap: cover }),
      setCharacterVisionRadius: (radius) => set({ characterVisionRadius: radius }),
      
      // Element actions
      addCharacter: (character) => {
        const id = `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        set((state) => ({
          characters: [...state.characters, { ...character, id }]
        }))
      },
      
      updateCharacter: (id, updates) => {
        set((state) => ({
          characters: state.characters.map((char) =>
            char.id === id ? { ...char, ...updates } : char
          )
        }))
      },
      
      removeCharacter: (id) => {
        set((state) => ({
          characters: state.characters.filter((char) => char.id !== id),
          selectedElementId: state.selectedElementId === id ? null : state.selectedElementId
        }))
      },
      
      addDrawing: (drawing) => {
        const id = `draw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        set((state) => ({
          drawings: [...state.drawings, { ...drawing, id }]
        }))
      },
      
      updateDrawing: (id, updates) => {
        set((state) => ({
          drawings: state.drawings.map((drawing) =>
            drawing.id === id ? { ...drawing, ...updates } : drawing
          )
        }))
      },
      
      removeDrawing: (id) => {
        set((state) => ({
          drawings: state.drawings.filter((drawing) => drawing.id !== id),
          selectedElementId: state.selectedElementId === id ? null : state.selectedElementId
        }))
      },
      
      addText: (text) => {
        const id = `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        set((state) => ({
          texts: [...state.texts, { ...text, id }]
        }))
      },
      
      updateText: (id, updates) => {
        set((state) => ({
          texts: state.texts.map((text) =>
            text.id === id ? { ...text, ...updates } : text
          )
        }))
      },
      
      removeText: (id) => {
        set((state) => ({
          texts: state.texts.filter((text) => text.id !== id),
          selectedElementId: state.selectedElementId === id ? null : state.selectedElementId
        }))
      },
      
      addShape: (shape) => {
        const id = `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        set((state) => ({
          shapes: [...state.shapes, { ...shape, id }]
        }))
      },
      
      updateShape: (id, updates) => {
        set((state) => ({
          shapes: state.shapes.map((shape) =>
            shape.id === id ? { ...shape, ...updates } : shape
          )
        }))
      },
      
      removeShape: (id) => {
        set((state) => ({
          shapes: state.shapes.filter((shape) => shape.id !== id),
          selectedElementId: state.selectedElementId === id ? null : state.selectedElementId
        }))
      },
      
      addFogArea: (fogArea) => {
        const id = `fog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        set((state) => ({
          fogAreas: [...state.fogAreas, { ...fogArea, id }]
        }))
      },
      
      removeFogArea: (id) => {
        set((state) => ({
          fogAreas: state.fogAreas.filter((area) => area.id !== id)
        }))
      },
      
      clearFogAreas: () => {
        set({ fogAreas: [] })
      },
      
      selectElement: (id) => set({ selectedElementId: id }),
      
      deleteSelected: () => {
        const { selectedElementId } = get()
        if (!selectedElementId) return
        
        if (selectedElementId.startsWith('char_')) {
          get().removeCharacter(selectedElementId)
        } else if (selectedElementId.startsWith('draw_')) {
          get().removeDrawing(selectedElementId)
        } else if (selectedElementId.startsWith('text_')) {
          get().removeText(selectedElementId)
        } else if (selectedElementId.startsWith('shape_')) {
          get().removeShape(selectedElementId)
        }
      },
      
      clearAll: () => set({
        characters: [],
        drawings: [],
        texts: [],
        shapes: [],
        fogAreas: [],
        selectedElementId: null,
        backgroundImage: null,
        fogApplied: false,
        fogEditMode: false
      })
    }),
    { name: 'dnd-store' }
  )
) 