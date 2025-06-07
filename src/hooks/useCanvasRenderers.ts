import { useEffect } from 'react'
import * as PIXI from 'pixi.js'
import { useDnDStore } from '@/stores/dndStore'
import { PixiRefs } from './usePixiApp'

export const useCanvasRenderers = (pixiRefs: PixiRefs, selectedElements: string[] = []) => {
  const {
    showGrid,
    gridSize,
    backgroundImage,
    characters,
    drawings,
    texts,
    shapes,
    fogAreas,
    zoom,
    fogEditMode,
    fogApplied,
    fogCoverEntireMap,
    characterVisionRadius
  } = useDnDStore()

  // Grid renderer
  useEffect(() => {
    if (!pixiRefs.grid || !pixiRefs.app) return

    const grid = pixiRefs.grid
    grid.clear()

    if (!showGrid) return

    const { width, height } = pixiRefs.app.screen
    const color = 0xcccccc

    grid.setStrokeStyle({ width: 1, color, alpha: 0.5 })

    // Vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      grid.moveTo(x, 0)
      grid.lineTo(x, height)
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      grid.moveTo(0, y)
      grid.lineTo(width, y)
    }

    grid.stroke()
  }, [showGrid, gridSize, pixiRefs.grid, pixiRefs.app])

  // Background renderer
  useEffect(() => {
    if (!pixiRefs.layers?.backgroundLayer || !backgroundImage) return

    const backgroundLayer = pixiRefs.layers.backgroundLayer
    
    // Clear existing background
    backgroundLayer.removeChildren()

    const img = new Image()
    img.onload = () => {
      try {
        const texture = PIXI.Texture.from(img)
        const sprite = new PIXI.Sprite(texture)
        
        if (pixiRefs.app) {
          const { width, height } = pixiRefs.app.screen
          
          // Scale to fit screen while maintaining aspect ratio
          const scaleX = width / texture.width
          const scaleY = height / texture.height
          const scale = Math.min(scaleX, scaleY)
          
          sprite.scale.set(scale)
          sprite.x = (width - texture.width * scale) / 2
          sprite.y = (height - texture.height * scale) / 2
          sprite.alpha = 0.8
        }
        
        backgroundLayer.addChild(sprite)
      } catch (error) {
        console.error('Error loading background image:', error)
      }
    }
    img.crossOrigin = 'anonymous'
    img.src = backgroundImage
  }, [backgroundImage, pixiRefs.layers, pixiRefs.app])

  // Characters renderer
  useEffect(() => {
    if (!pixiRefs.layers?.charactersLayer) return

    const charactersLayer = pixiRefs.layers.charactersLayer
    charactersLayer.removeChildren()

    characters.forEach(character => {
      const container = new PIXI.Container()
      
      // Check if character is selected
      const isSelected = selectedElements.includes(character.id)
      
      // Vision circle (only visible when fog is applied)
      if (fogApplied) {
        const visionCircle = new PIXI.Graphics()
        visionCircle.name = 'vision'
        visionCircle.setStrokeStyle({ width: 2, color: 0xffff00, alpha: 0.5 })
        visionCircle.setFillStyle({ color: 0xffff00, alpha: 0.1 })
        visionCircle.circle(0, 0, characterVisionRadius) // Use dynamic vision radius
        visionCircle.stroke()
        visionCircle.fill()
        container.addChildAt(visionCircle, 0) // Add behind everything else
      }
      
      // Selection indicator (blue circle around character)
      if (isSelected) {
        const selectionCircle = new PIXI.Graphics()
        selectionCircle.setStrokeStyle({ width: 3, color: 0x0066cc })
        selectionCircle.circle(0, 0, (character.size / 2) + 8)
        selectionCircle.stroke()
        container.addChild(selectionCircle)
      }
      
      // Character background circle
      const circle = new PIXI.Graphics()
      circle.setFillStyle({ color: 0x4a90e2, alpha: 0.8 })
      circle.circle(0, 0, character.size / 2)
      circle.fill()
      
      // Character text
      const text = new PIXI.Text({
        text: character.avatar || character.name.charAt(0),
        style: {
          fontSize: character.size * 0.6,
          fill: 'white',
          fontWeight: 'bold',
          align: 'center'
        }
      })
      text.anchor.set(0.5)
      
      container.addChild(circle)
      container.addChild(text)
      container.position.set(character.x, character.y)
      container.rotation = character.rotation
      
      // Make interactive
      container.interactive = true
      container.cursor = 'pointer'
      
      charactersLayer.addChild(container)
    })
  }, [characters, selectedElements, fogApplied, characterVisionRadius, pixiRefs.layers])

  // Drawings renderer
  useEffect(() => {
    if (!pixiRefs.layers?.drawingLayer) return

    const drawingLayer = pixiRefs.layers.drawingLayer
    
    console.log(`Re-rendering ${drawings.length} drawings`)
    
    // Clear all existing drawings (except preview)
    const childrenToRemove = []
    for (const child of drawingLayer.children) {
      console.log(`Child found: name="${child.name}", constructor="${child.constructor.name}"`)
      if (child.name !== 'preview') {
        childrenToRemove.push(child)
      }
    }
    childrenToRemove.forEach(child => {
      console.log(`Removing drawing: ${child.name}`)
      drawingLayer.removeChild(child)
    })

    // Add all current drawings
    drawings.forEach(drawing => {
      if (drawing.points.length < 4) return

      console.log(`Adding drawing: ${drawing.id}`)
      const graphics = new PIXI.Graphics()
      // Set the name to the drawing ID for easy identification
      graphics.name = drawing.id
      
      graphics.setStrokeStyle({ 
        width: drawing.width, 
        color: drawing.color 
      })
      
      graphics.moveTo(drawing.points[0], drawing.points[1])
      for (let i = 2; i < drawing.points.length; i += 2) {
        graphics.lineTo(drawing.points[i], drawing.points[i + 1])
      }
      graphics.stroke()
      
      drawingLayer.addChild(graphics)
    })
    
    console.log(`Drawing layer now has ${drawingLayer.children.length} children`)
  }, [drawings])

  // Shapes renderer
  useEffect(() => {
    if (!pixiRefs.layers?.drawingLayer) return

    const drawingLayer = pixiRefs.layers.drawingLayer
    
    console.log(`Re-rendering ${shapes.length} shapes`)
    
    // Remove existing shapes (but keep preview and current drawings)
    const childrenToRemove = []
    for (const child of drawingLayer.children) {
      if (child.name && child.name.startsWith('shape_')) {
        // Remove all shape elements for clean re-render
        childrenToRemove.push(child)
      }
    }
    childrenToRemove.forEach(child => {
      console.log(`Removing shape: ${child.name}`)
      drawingLayer.removeChild(child)
    })

    // Add all current shapes
    shapes.forEach(shape => {
      console.log(`Adding shape: ${shape.id}, type: ${shape.type}`)
      const graphics = new PIXI.Graphics()
      graphics.name = shape.id
      
      // Check if shape is selected
      const isSelected = selectedElements.includes(shape.id)
      
      if (isSelected) {
        graphics.setStrokeStyle({ width: shape.width + 2, color: 0x0066cc })
      } else {
        graphics.setStrokeStyle({ width: shape.width, color: shape.color })
      }
      
      console.log(`Rendering shape type: ${shape.type}`)
      switch (shape.type) {
        case 'rectangle': {
          const minX = Math.min(shape.x1, shape.x2)
          const minY = Math.min(shape.y1, shape.y2)
          const width = Math.abs(shape.x2 - shape.x1)
          const height = Math.abs(shape.y2 - shape.y1)
          graphics.rect(minX, minY, width, height)
          break
        }
        case 'circle': {
          const centerX = (shape.x1 + shape.x2) / 2
          const centerY = (shape.y1 + shape.y2) / 2
          const radiusX = Math.abs(shape.x2 - shape.x1) / 2
          const radiusY = Math.abs(shape.y2 - shape.y1) / 2
          graphics.ellipse(centerX, centerY, radiusX, radiusY)
          break
        }
        case 'line': {
          graphics.moveTo(shape.x1, shape.y1)
          graphics.lineTo(shape.x2, shape.y2)
          break
        }
      }
      
      graphics.stroke()
      drawingLayer.addChild(graphics)
    })
    
    console.log(`Drawing layer now has ${drawingLayer.children.length} children after shapes`)
  }, [shapes, selectedElements, pixiRefs.layers])

  // Texts renderer
  useEffect(() => {
    if (!pixiRefs.layers?.textsLayer) return

    const textsLayer = pixiRefs.layers.textsLayer
    textsLayer.removeChildren()

    texts.forEach(textElement => {
      const container = new PIXI.Container()
      
      // Check if text is selected
      const isSelected = selectedElements.includes(textElement.id)
      
      // Create the text
      const text = new PIXI.Text({
        text: textElement.text,
        style: {
          fontSize: textElement.style.fontSize,
          fill: textElement.style.fill,
          fontFamily: textElement.style.fontFamily
        }
      })
      
      // Selection indicator (blue rectangle around text)
      if (isSelected) {
        const bounds = text.getBounds()
        const selectionRect = new PIXI.Graphics()
        selectionRect.setStrokeStyle({ width: 2, color: 0x0066cc })
        selectionRect.rect(-5, -5, bounds.width + 10, bounds.height + 10)
        selectionRect.stroke()
        container.addChild(selectionRect)
      }
      
      container.addChild(text)
      container.position.set(textElement.x, textElement.y)
      container.interactive = true
      container.cursor = 'pointer'
      
      textsLayer.addChild(container)
    })
  }, [texts, selectedElements, pixiRefs.layers])

  // Fog of war renderer
  useEffect(() => {
    if (!pixiRefs.layers?.fogLayer) return

    const fogLayer = pixiRefs.layers.fogLayer
    
    // Clear existing fog graphics
    fogLayer.removeChildren()
    
    // Show fog layer in edit mode or when applied
    fogLayer.visible = fogEditMode || fogApplied
    
    if (fogEditMode && !fogApplied) {
      // Edit mode: show fog areas with semi-transparency
      fogAreas.forEach(area => {
        const fogCircle = new PIXI.Graphics()
        if (area.type === 'hidden') {
          fogCircle.setFillStyle({ color: 0xff0000, alpha: 0.3 }) // Red semi-transparent
        }
        fogCircle.circle(area.x, area.y, area.radius)
        fogCircle.fill()
        fogLayer.addChild(fogCircle)
      })
    } else if (fogApplied) {
      // Applied mode: Create fog based on selected mode
      
      // Get screen bounds
      if (!pixiRefs.app) return
      const { width, height } = pixiRefs.app.screen
      
      // Create a single graphics object for all fog
      const fogGraphics = new PIXI.Graphics()
      
              // Create fog grid
        const gridSize = 60 // Size of each fog "tile"
        const visionRadius = characterVisionRadius
      
              if (fogCoverEntireMap) {
          // Mode 1: Cover entire screen with fog, but adjust opacity based on character vision
          for (let x = 0; x < width + gridSize; x += gridSize) {
            for (let y = 0; y < height + gridSize; y += gridSize) {
              // Default: completely opaque fog (totally hidden)
              let alpha = 1.0
              
              // Check if this tile should be affected by character vision
              let minCharDistance = Infinity
              characters.forEach(character => {
                const distanceToChar = Math.sqrt(
                  Math.pow(x + gridSize/2 - character.x, 2) + Math.pow(y + gridSize/2 - character.y, 2)
                )
                minCharDistance = Math.min(minCharDistance, distanceToChar)
              })
              
              // Reduce opacity in character vision areas
              if (minCharDistance < visionRadius) {
                alpha = (minCharDistance / visionRadius) * 1.0
                alpha = Math.max(alpha, 0.0) // Can go to completely transparent
              }
              
              // Check if this area has additional fog from user drawing
              fogAreas.forEach(area => {
                if (area.type === 'hidden') {
                  const distanceToFog = Math.sqrt(
                    Math.pow(x + gridSize/2 - area.x, 2) + Math.pow(y + gridSize/2 - area.y, 2)
                  )
                  if (distanceToFog <= area.radius) {
                    // User-drawn fog overrides character vision (stays opaque)
                    alpha = 1.0
                  }
                }
              })
              
              // Always draw fog tiles - use solid black for complete masking
              fogGraphics.setFillStyle({ color: 0x000000, alpha })
              fogGraphics.rect(x, y, gridSize, gridSize)
              fogGraphics.fill()
            }
          }
      } else {
        // Mode 2: Only fog in user-drawn areas, with character vision
        for (let x = 0; x < width + gridSize; x += gridSize) {
          for (let y = 0; y < height + gridSize; y += gridSize) {
            // Check if this area is covered by user-drawn fog
            let isFoggy = false
            let alpha = 0
            
            fogAreas.forEach(area => {
              if (area.type === 'hidden') {
                const distanceToFog = Math.sqrt(
                  Math.pow(x + gridSize/2 - area.x, 2) + Math.pow(y + gridSize/2 - area.y, 2)
                )
                if (distanceToFog <= area.radius) {
                  isFoggy = true
                  alpha = 1.0 // Base fog opacity - completely opaque
                  
                  // Check character vision
                  let minCharDistance = Infinity
                  characters.forEach(character => {
                    const distanceToChar = Math.sqrt(
                      Math.pow(x + gridSize/2 - character.x, 2) + Math.pow(y + gridSize/2 - character.y, 2)
                    )
                    minCharDistance = Math.min(minCharDistance, distanceToChar)
                  })
                  
                  // Reduce opacity in character vision areas
                  if (minCharDistance < visionRadius) {
                    alpha = (minCharDistance / visionRadius) * 1.0
                    alpha = Math.max(alpha, 0.0)
                  }
                }
              }
            })
            
            // Draw fog tile if needed
            if (isFoggy) {
              fogGraphics.setFillStyle({ color: 0x000000, alpha })
              fogGraphics.rect(x, y, gridSize, gridSize)
              fogGraphics.fill()
            }
          }
        }
      }
      
      fogLayer.addChild(fogGraphics)
    }
  }, [fogEditMode, fogApplied, fogAreas, characters, fogCoverEntireMap, characterVisionRadius, pixiRefs.layers, pixiRefs.app])

  // Zoom renderer
  useEffect(() => {
    if (!pixiRefs.app) return

    const stage = pixiRefs.app.stage
    stage.scale.set(zoom)
    
    // Center the zoom
    const { width, height } = pixiRefs.app.screen
    stage.pivot.set(width / 2, height / 2)
    stage.position.set(width / 2, height / 2)
  }, [zoom, pixiRefs.app])

  return {
    // Expose utility functions if needed
    updateGrid: () => {
      // Force grid update
    }
  }
} 