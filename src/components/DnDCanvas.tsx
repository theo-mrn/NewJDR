'use client'

import React, { useRef, useState, useEffect } from 'react'
import { useDnDStore } from '@/stores/dndStore'
import { usePixiApp } from '@/hooks/usePixiApp'
import { useCanvasInteractions } from '@/hooks/useCanvasInteractions'
import { useCanvasRenderers } from '@/hooks/useCanvasRenderers'
import { useCanvasData } from '@/hooks/useCanvasData'
import DnDToolbar from './DnDToolbar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function DnDCanvas() {
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const [isTextMode, setIsTextMode] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 })
  const [isLoadingBackground, setIsLoadingBackground] = useState(false)

  const { 
    activeTool, 
    setBackgroundImage, 
    addText, 
    clearAll,
    setActiveTool 
  } = useDnDStore()

  // Initialize PixiJS app and get refs
  const { getRefs } = usePixiApp(canvasRef)
  const pixiRefs = getRefs()

  // Handle text placement callback
  const handleTextPlacement = (position: { x: number, y: number }) => {
    setTextPosition(position)
    setIsTextMode(true)
    setActiveTool('select') // Switch back to select tool
  }

  // Setup canvas interactions
  const { selectedElements } = useCanvasInteractions(pixiRefs, handleTextPlacement)

  // Setup canvas renderers
  useCanvasRenderers(pixiRefs, selectedElements)

  // Setup data management
  const { saveToLocalStorage, loadFromLocalStorage, exportToJSON } = useCanvasData()

  // Handle text tool - this will be processed in useCanvasInteractions
  // No need for separate event handling here

  // Handle background image upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoadingBackground(true)
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const result = e.target?.result as string
      if (result) {
        setBackgroundImage(result)
      }
      setIsLoadingBackground(false)
    }
    
    reader.onerror = () => {
      console.error('Error reading file')
      setIsLoadingBackground(false)
    }
    
    reader.readAsDataURL(file)
  }

  // Handle text submission
  const handleTextSubmit = () => {
    if (textInput.trim()) {
      addText({
        text: textInput,
        x: textPosition.x,
        y: textPosition.y,
        style: {
          fontSize: 24,
          fill: '#000000',
          fontFamily: 'Arial'
        }
      })
      setTextInput('')
      setIsTextMode(false)
    }
  }

  // Handle clear all
  const handleClearAll = () => {
    if (confirm('Êtes-vous sûr de vouloir tout effacer ?')) {
      clearAll()
    }
  }

  // Handle save
  const handleSave = () => {
    try {
      const success = saveToLocalStorage('current-session')
      if (success) {
        alert('Canvas sauvegardé avec succès!')
      } else {
        alert('Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Erreur lors de la sauvegarde')
    }
  }

  // Handle load
  const handleLoad = () => {
    if (confirm('Charger la dernière sauvegarde ? (Les données actuelles seront perdues)')) {
      try {
        const success = loadFromLocalStorage('current-session')
        if (success) {
          alert('Canvas chargé avec succès!')
        } else {
          alert('Aucune sauvegarde trouvée')
        }
      } catch (error) {
        console.error('Load error:', error)
        alert('Erreur lors du chargement')
      }
    }
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape to close text modal
      if (event.key === 'Escape' && isTextMode) {
        setIsTextMode(false)
        setTextInput('')
      }
      
      // Ctrl+S to save
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault()
        handleSave()
      }
      
      // Ctrl+O to load  
      if (event.ctrlKey && event.key === 'o') {
        event.preventDefault()
        handleLoad()
      }
      
      // Ctrl+E to export
      if (event.ctrlKey && event.key === 'e') {
        event.preventDefault()
        exportToJSON()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isTextMode, handleSave, handleLoad, exportToJSON])

  return (
    <div className="w-full h-screen relative overflow-hidden bg-gray-100">
      {/* Toolbar */}
      <DnDToolbar
        onFileUpload={handleFileUpload}
        onClearAll={handleClearAll}
        onSave={handleSave}
        onLoad={handleLoad}
      />

      {/* Loading indicator */}
      {isLoadingBackground && (
        <div className="absolute top-16 left-4 bg-blue-500 text-white px-3 py-1 rounded z-40">
          Chargement de l&apos;image...
        </div>
      )}

      {/* Selection info */}
      {selectedElements.length > 0 && (
        <div className="absolute top-16 right-4 bg-white border rounded-lg p-2 shadow-lg z-40">
          <p className="text-sm text-gray-600">
            {selectedElements.length} élément(s) sélectionné(s)
          </p>
        </div>
      )}

      {/* Text input modal */}
      {isTextMode && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Ajouter du texte</h3>
            <p className="text-sm text-gray-600 mb-4">
              Position: ({Math.round(textPosition.x)}, {Math.round(textPosition.y)})
            </p>
            <Input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Entrez votre texte..."
              className="mb-4 w-64"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleTextSubmit()
                } else if (e.key === 'Escape') {
                  setIsTextMode(false)
                  setTextInput('')
                }
              }}
            />
            <div className="flex gap-2">
              <Button onClick={handleTextSubmit} disabled={!textInput.trim()}>
                Ajouter
              </Button>
              <Button variant="outline" onClick={() => {
                setIsTextMode(false)
                setTextInput('')
              }}>
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Canvas container */}
      <div 
        ref={canvasRef} 
        className="w-full h-full pt-16"
        style={{ 
          cursor: activeTool === 'draw' ? 'crosshair' : 
                  activeTool === 'rectangle' ? 'crosshair' :
                  activeTool === 'circle' ? 'crosshair' :
                  activeTool === 'line' ? 'crosshair' :
                  activeTool === 'pan' ? 'grab' : 
                  activeTool === 'text' ? 'text' : 'default' 
        }}
      />

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 p-3 rounded-lg shadow-lg text-sm max-w-md">
        <h4 className="font-semibold mb-2">Instructions:</h4>
        <ul className="space-y-1 text-xs text-gray-700">
          <li>• <strong>Sélection:</strong> Clic pour sélectionner, glisser pour sélection multiple</li>
          <li>• <strong>Dessin:</strong> Cliquez et glissez pour dessiner</li>
          <li>• <strong>Texte:</strong> Cliquez pour placer du texte</li>
          <li>• <strong>Navigation:</strong> Molette pour scroll, Ctrl+molette pour zoom, clic molette pour pan</li>
          <li>• <strong>Raccourcis:</strong> Ctrl+S (save), Ctrl+O (load), Ctrl+E (export), Échap (annuler)</li>
        </ul>
      </div>

      {/* Tool indicator */}
      <div className="absolute top-20 left-4 bg-white border rounded px-2 py-1 text-xs font-medium shadow">
        Outil actif: <span className="capitalize">{activeTool}</span>
      </div>
    </div>
  )
} 