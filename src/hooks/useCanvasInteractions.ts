import { useRef, useEffect, useCallback, useState } from 'react'
import * as PIXI from 'pixi.js'
import { useDnDStore } from '@/stores/dndStore'
import { PixiRefs } from './usePixiApp'
import { CanvasUtils } from '@/utils/canvasUtils'

export const useCanvasInteractions = (
  pixiRefs: PixiRefs, 
  onTextPlacement?: (position: { x: number, y: number }) => void
) => {
  // Selected elements state to trigger re-renders
  const [selectedElements, setSelectedElements] = useState<string[]>([])

  // Interaction state refs
  const isDrawingRef = useRef(false)
  const currentPathRef = useRef<number[]>([])
  const isDrawingShapeRef = useRef(false)
  const shapeStartRef = useRef({ x: 0, y: 0 })
  const isDraggingRef = useRef(false)
  const dragTargetRef = useRef<{ type: string, id: string } | null>(null)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const isSelectingRef = useRef(false)
  const selectionStartRef = useRef({ x: 0, y: 0 })
  const isGroupDraggingRef = useRef(false)
  const selectedElementsRef = useRef<string[]>([])
  const isPanningRef = useRef(false)
  const panStartRef = useRef({ x: 0, y: 0 })
  const isErasingRef = useRef(false)
  const isFoggingRef = useRef(false)
  const lastPointerPositionRef = useRef({ x: 0, y: 0 })

  const {
    activeTool,
    brushSize,
    brushColor,
    fogBrushSize,
    fogAreas,
    zoom,
    characters,
    drawings,
    texts,
    shapes,
    addDrawing,
    addCharacter,
    addShape,
    addFogArea,
    removeFogArea,
    updateCharacter,
    updateText,
    updateShape,
    removeDrawing,
    removeShape,
    setZoom
  } = useDnDStore()

  const handlePointerDown = useCallback((event: PIXI.FederatedPointerEvent) => {
    if (!pixiRefs.app || !pixiRefs.layers) return

    const localPos = pixiRefs.app.stage.toLocal(event.global)
    
    // Handle middle mouse button for panning
    if (event.button === 1) {
      isPanningRef.current = true
      panStartRef.current = { x: event.global.x, y: event.global.y }
      return
    }

    switch (activeTool) {
      case 'draw':
        isDrawingRef.current = true
        currentPathRef.current = [localPos.x, localPos.y]
        break

      case 'rectangle':
      case 'circle':
      case 'line':
        console.log(`Starting shape drawing with tool: ${activeTool}`)
        isDrawingShapeRef.current = true
        shapeStartRef.current = { x: localPos.x, y: localPos.y }
        break

      case 'text':
        if (onTextPlacement) {
          onTextPlacement({ x: localPos.x, y: localPos.y })
        }
        break

      case 'character':
        addCharacter({
          name: 'Character',
          x: localPos.x,
          y: localPos.y,
          avatar: '🧙‍♂️',
          size: 40,
          rotation: 0
        })
        break

      case 'select':
        const hitElement = CanvasUtils.getElementAtPosition(localPos, { characters, drawings, texts, shapes })
        
        if (hitElement) {
          // Add to selection if not already selected
          if (!selectedElementsRef.current.includes(hitElement.id)) {
            selectedElementsRef.current = [hitElement.id]
            setSelectedElements([hitElement.id])
          }
          
          // Start dragging
          isDraggingRef.current = true
          dragTargetRef.current = hitElement
          dragStartRef.current = { x: localPos.x, y: localPos.y }
        } else {
          // Clear selection and start selection rectangle
          selectedElementsRef.current = []
          setSelectedElements([])
          isSelectingRef.current = true
          selectionStartRef.current = { x: localPos.x, y: localPos.y }
          if (pixiRefs.selectionRect) {
            CanvasUtils.updateSelectionRect(pixiRefs.selectionRect, localPos, localPos)
          }
        }
        break

      case 'eraser':
        isErasingRef.current = true
        CanvasUtils.eraseAt(localPos, brushSize, drawings, removeDrawing)
        break

      case 'pan':
        isPanningRef.current = true
        panStartRef.current = { x: event.global.x, y: event.global.y }
        break

      case 'fog-add':
        isFoggingRef.current = true
        CanvasUtils.addFogArea(localPos, fogBrushSize, 'hidden', addFogArea)
        break

      case 'fog-remove':
        isFoggingRef.current = true
        CanvasUtils.removeFogAreasAt(localPos, fogBrushSize, fogAreas, removeFogArea)
        break
    }
  }, [activeTool, brushSize, fogBrushSize, fogAreas, characters, drawings, texts, addCharacter, addFogArea, removeFogArea, removeDrawing, onTextPlacement])

  const handlePointerMove = useCallback((event: PIXI.FederatedPointerEvent) => {
    if (!pixiRefs.app || !pixiRefs.layers) return

    const localPos = pixiRefs.app.stage.toLocal(event.global)
    lastPointerPositionRef.current = localPos

    // Update eraser cursor
    if (activeTool === 'eraser' && pixiRefs.eraserCursor) {
      CanvasUtils.updateEraserCursor(pixiRefs.eraserCursor, localPos, brushSize)
    } else if (pixiRefs.eraserCursor) {
      // Clear eraser cursor when not using eraser tool
      pixiRefs.eraserCursor.clear()
    }

    // Update fog cursor
    if ((activeTool === 'fog-add' || activeTool === 'fog-remove') && pixiRefs.fogCursor) {
      CanvasUtils.updateFogCursor(pixiRefs.fogCursor, localPos, fogBrushSize, activeTool === 'fog-remove')
    } else if (pixiRefs.fogCursor) {
      // Clear fog cursor when not using fog tools
      pixiRefs.fogCursor.clear()
    }

    // Handle panning
    if (isPanningRef.current) {
      const deltaX = event.global.x - panStartRef.current.x
      const deltaY = event.global.y - panStartRef.current.y
      
      pixiRefs.app.stage.x += deltaX
      pixiRefs.app.stage.y += deltaY
      
      panStartRef.current = { x: event.global.x, y: event.global.y }
      return
    }

    // Handle drawing
    if (isDrawingRef.current && activeTool === 'draw') {
      currentPathRef.current.push(localPos.x, localPos.y)
      CanvasUtils.drawCurrentPath(pixiRefs.layers.drawingLayer, currentPathRef.current, brushColor, brushSize)
    }

    // Handle shape drawing preview
    if (isDrawingShapeRef.current && (activeTool === 'rectangle' || activeTool === 'circle' || activeTool === 'line')) {
      if (pixiRefs.layers?.drawingLayer) {
        console.log(`Drawing preview for tool: ${activeTool}`)
        CanvasUtils.drawShapePreview(
          pixiRefs.layers.drawingLayer,
          activeTool,
          shapeStartRef.current,
          localPos,
          brushColor,
          brushSize
        )
      }
    }

    // Handle erasing while dragging
    if (isErasingRef.current && activeTool === 'eraser') {
      CanvasUtils.eraseAt(localPos, brushSize, drawings, removeDrawing)
      // Also erase shapes
      shapes.forEach(shape => {
        if (CanvasUtils.isPointNearShape(localPos, shape)) {
          console.log(`✅ Erasing shape ${shape.id}`)
          removeShape(shape.id)
        }
      })
    }

    // Handle fogging while dragging
    if (isFoggingRef.current) {
      if (activeTool === 'fog-add') {
        CanvasUtils.addFogArea(localPos, fogBrushSize, 'hidden', addFogArea)
      } else if (activeTool === 'fog-remove') {
        CanvasUtils.removeFogAreasAt(localPos, fogBrushSize, fogAreas, removeFogArea)
      }
    }

    // Handle dragging
    if (isDraggingRef.current && dragTargetRef.current) {
      const deltaX = localPos.x - dragStartRef.current.x
      const deltaY = localPos.y - dragStartRef.current.y
      
      if (selectedElementsRef.current.length > 1) {
        // Group drag - move all selected elements
        selectedElementsRef.current.forEach(elementId => {
          if (elementId.startsWith('char_')) {
            const character = characters.find(c => c.id === elementId)
            if (character) {
              updateCharacter(elementId, {
                x: character.x + deltaX,
                y: character.y + deltaY
              })
            }
          } else if (elementId.startsWith('text_')) {
            const text = texts.find(t => t.id === elementId)
            if (text) {
              updateText(elementId, {
                x: text.x + deltaX,
                y: text.y + deltaY
              })
            }
          } else if (elementId.startsWith('shape_')) {
            const shape = shapes.find(s => s.id === elementId)
            if (shape) {
              updateShape(elementId, {
                x1: shape.x1 + deltaX,
                y1: shape.y1 + deltaY,
                x2: shape.x2 + deltaX,
                y2: shape.y2 + deltaY
              })
            }
          }
        })
      } else {
        // Single element drag
        const target = dragTargetRef.current
        if (target.type === 'character') {
          const character = characters.find(c => c.id === target.id)
          if (character) {
            updateCharacter(target.id, {
              x: character.x + deltaX,
              y: character.y + deltaY
            })
          }
        } else if (target.type === 'text') {
          const text = texts.find(t => t.id === target.id)
          if (text) {
            updateText(target.id, {
              x: text.x + deltaX,
              y: text.y + deltaY
            })
          }
        } else if (target.type === 'shape') {
          const shape = shapes.find(s => s.id === target.id)
          if (shape) {
            updateShape(target.id, {
              x1: shape.x1 + deltaX,
              y1: shape.y1 + deltaY,
              x2: shape.x2 + deltaX,
              y2: shape.y2 + deltaY
            })
          }
        }
      }
      
      dragStartRef.current = { x: localPos.x, y: localPos.y }
    }

    // Handle selection rectangle
    if (isSelectingRef.current && pixiRefs.selectionRect) {
      CanvasUtils.updateSelectionRect(pixiRefs.selectionRect, selectionStartRef.current, localPos)
      
      // Update elements in selection
      const elementsInSelection = CanvasUtils.getElementsInRect(
        selectionStartRef.current, 
        localPos, 
        { characters, drawings, texts, shapes }
      )
      selectedElementsRef.current = elementsInSelection
      setSelectedElements(elementsInSelection) // Update state to trigger re-render
    }
  }, [activeTool, brushSize, brushColor, fogBrushSize, fogAreas, characters, drawings, texts, shapes, addFogArea, removeFogArea, updateCharacter, updateText, updateShape, removeDrawing, removeShape])

  const handlePointerUp = useCallback(() => {
    // Finalize selection
    if (isSelectingRef.current) {
      // Update state with final selection
      setSelectedElements([...selectedElementsRef.current])
    }

    // Finalize drawing
    if (isDrawingRef.current && currentPathRef.current.length >= 4) {
      addDrawing({
        points: [...currentPathRef.current],
        color: brushColor,
        width: brushSize
      })
    }

    // Finalize shape drawing
    if (isDrawingShapeRef.current && (activeTool === 'rectangle' || activeTool === 'circle' || activeTool === 'line')) {
      const currentPos = lastPointerPositionRef.current
      console.log(`Creating shape with type: ${activeTool}`)
      addShape({
        type: activeTool,
        x1: shapeStartRef.current.x,
        y1: shapeStartRef.current.y,
        x2: currentPos.x,
        y2: currentPos.y,
        color: brushColor,
        width: brushSize
      })
    }

    // Clear drawing preview when finishing drawing
    if (isDrawingRef.current && pixiRefs.layers?.drawingLayer) {
      CanvasUtils.clearPreview(pixiRefs.layers.drawingLayer)
    }

    // Clear shape preview when finishing shape drawing
    if (isDrawingShapeRef.current && pixiRefs.layers?.drawingLayer) {
      CanvasUtils.clearShapePreview(pixiRefs.layers.drawingLayer)
    }

    // Reset states
    isDrawingRef.current = false
    currentPathRef.current = []
    isDrawingShapeRef.current = false
    isDraggingRef.current = false
    dragTargetRef.current = null
    isSelectingRef.current = false
    isGroupDraggingRef.current = false
    isPanningRef.current = false
    isErasingRef.current = false
    isFoggingRef.current = false
    
    // Clear selection rectangle but keep selected elements
    if (pixiRefs.selectionRect) {
      pixiRefs.selectionRect.clear()
    }
  }, [addDrawing, addShape, activeTool, brushColor, brushSize, pixiRefs.layers?.drawingLayer])

  const handleWheel = useCallback((event: WheelEvent) => {
    if (!pixiRefs.app) return
    
    event.preventDefault()
    
    if (event.ctrlKey || event.metaKey) {
      // Zoom
      const rect = pixiRefs.app.canvas.getBoundingClientRect()
      const centerX = event.clientX - rect.left
      const centerY = event.clientY - rect.top
      
      const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1
      const newZoom = zoom * zoomFactor
      
      CanvasUtils.zoomToPoint(pixiRefs.app.stage, centerX, centerY, newZoom)
      setZoom(newZoom)
    } else if (event.shiftKey) {
      // Horizontal scroll
      pixiRefs.app.stage.x -= event.deltaY
    } else {
      // Vertical scroll
      pixiRefs.app.stage.y -= event.deltaY
    }
  }, [zoom, setZoom])

  // Clean up cursors when tool changes
  useEffect(() => {
    if (pixiRefs.eraserCursor && activeTool !== 'eraser') {
      pixiRefs.eraserCursor.clear()
    }
  }, [activeTool, pixiRefs.eraserCursor])

  // Setup event listeners
  useEffect(() => {
    if (!pixiRefs.app?.stage) return

    const stage = pixiRefs.app.stage
    const canvas = pixiRefs.app.canvas

    // Remove existing listeners
    stage.removeAllListeners()

    // Add event listeners
    stage.on('pointerdown', handlePointerDown)
    stage.on('pointermove', handlePointerMove)
    stage.on('pointerup', handlePointerUp)
    stage.on('pointerupoutside', handlePointerUp)
    
    canvas.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      stage.removeAllListeners()
      canvas.removeEventListener('wheel', handleWheel)
    }
  }, [handlePointerDown, handlePointerMove, handlePointerUp, handleWheel])

  return {
    selectedElements: selectedElements
  }
} 