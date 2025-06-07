import { useCallback } from 'react'
import { useDnDStore, Character, DrawingPath, TextElement, Shape } from '@/stores/dndStore'

export interface CanvasData {
  version: string
  timestamp: number
  characters: Character[]
  drawings: DrawingPath[]
  texts: TextElement[]
  shapes: Shape[]
  backgroundImage: string | null
  settings: {
    gridSize: number
    showGrid: boolean
    zoom: number
  }
}

export const useCanvasData = () => {
  const {
    characters,
    drawings,
    texts,
    shapes,
    backgroundImage,
    gridSize,
    showGrid,
    zoom,
    clearAll,
    // Add missing actions that we'll need to implement in store
  } = useDnDStore()

  const saveToLocalStorage = useCallback((key: string) => {
    try {
      const canvasData = {
        timestamp: Date.now(),
        elements: [],
        background: null,
        settings: {}
      }
      
      localStorage.setItem(key, JSON.stringify(canvasData))
      return true
    } catch (error) {
      console.error('Error saving to localStorage:', error)
      return false
    }
  }, [])

  const loadFromLocalStorage = useCallback((key: string) => {
    try {
      const data = localStorage.getItem(key)
      if (!data) return false
      
      const canvasData = JSON.parse(data)
      console.log('Loaded canvas data:', canvasData)
      return true
    } catch (error) {
      console.error('Error loading from localStorage:', error)
      return false
    }
  }, [])

  const exportToJSON = useCallback(() => {
    try {
      const canvasData = {
        timestamp: Date.now(),
        elements: [],
        background: null,
        settings: {}
      }
      
      const dataStr = JSON.stringify(canvasData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `canvas-export-${Date.now()}.json`
      link.click()
      
      URL.revokeObjectURL(url)
      return true
    } catch (error) {
      console.error('Error exporting to JSON:', error)
      return false
    }
  }, [])

  const importFromJSON = useCallback((file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string)
          console.log('Imported canvas data:', data)
          resolve(data)
        } catch (error) {
          console.error('Error parsing JSON file:', error)
          reject(error)
        }
      }
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }
      
      reader.readAsText(file)
    })
  }, [])

  const getCanvasStatistics = useCallback(() => {
    return {
      charactersCount: characters.length,
      drawingsCount: drawings.length,
      textsCount: texts.length,
      totalElements: characters.length + drawings.length + texts.length,
      hasBackground: !!backgroundImage,
      settings: {
        gridSize,
        showGrid,
        zoom
      }
    }
  }, [characters, drawings, texts, backgroundImage, gridSize, showGrid, zoom])

  return {
    // Save/Load operations
    saveToLocalStorage,
    loadFromLocalStorage,
    exportToJSON,
    importFromJSON,
    
    // Utilities
    getCanvasStatistics,
    
    // Quick access to current state
    canvasData: {
      characters,
      drawings,
      texts,
      backgroundImage,
      settings: { gridSize, showGrid, zoom }
    }
  }
} 