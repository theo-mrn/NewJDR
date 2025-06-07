import * as PIXI from 'pixi.js'
import { Character, DrawingPath, TextElement, FogArea, Shape } from '@/stores/dndStore'

export interface ElementsData {
  characters: Character[]
  drawings: DrawingPath[]
  texts: TextElement[]
  shapes: Shape[]
}

export interface UpdateActions {
  updateCharacter: (id: string, updates: Partial<Character>) => void
  updateText: (id: string, updates: Partial<TextElement>) => void
}

export class CanvasUtils {
  static getElementAtPosition(
    position: { x: number, y: number }, 
    elements: ElementsData
  ): { type: string, id: string } | null {
    // Check characters
    for (const char of elements.characters) {
      const distance = Math.sqrt(
        Math.pow(position.x - char.x, 2) + Math.pow(position.y - char.y, 2)
      )
      if (distance <= char.size / 2) {
        return { type: 'character', id: char.id }
      }
    }

    // Check texts
    for (const text of elements.texts) {
      const textWidth = text.text.length * text.style.fontSize * 0.6
      const textHeight = text.style.fontSize
      
      if (
        position.x >= text.x - 10 &&
        position.x <= text.x + textWidth + 10 &&
        position.y >= text.y - textHeight &&
        position.y <= text.y + 10
      ) {
        return { type: 'text', id: text.id }
      }
    }

    // Check shapes
    for (const shape of elements.shapes) {
      if (this.isPointNearShape(position, shape)) {
        return { type: 'shape', id: shape.id }
      }
    }

    // Check drawings
    for (const drawing of elements.drawings) {
      if (this.isPointNearPath(position, drawing.points, drawing.width)) {
        return { type: 'drawing', id: drawing.id }
      }
    }

    return null
  }

  static getElementsInRect(
    start: { x: number, y: number },
    end: { x: number, y: number },
    elements: ElementsData
  ): string[] {
    const minX = Math.min(start.x, end.x)
    const maxX = Math.max(start.x, end.x)
    const minY = Math.min(start.y, end.y)
    const maxY = Math.max(start.y, end.y)

    const selectedIds: string[] = []

    // Check characters
    elements.characters.forEach(char => {
      if (char.x >= minX && char.x <= maxX && char.y >= minY && char.y <= maxY) {
        selectedIds.push(char.id)
      }
    })

    // Check texts
    elements.texts.forEach(text => {
      if (text.x >= minX && text.x <= maxX && text.y >= minY && text.y <= maxY) {
        selectedIds.push(text.id)
      }
    })

    // Check shapes
    elements.shapes.forEach(shape => {
      const shapeMinX = Math.min(shape.x1, shape.x2)
      const shapeMaxX = Math.max(shape.x1, shape.x2)
      const shapeMinY = Math.min(shape.y1, shape.y2)
      const shapeMaxY = Math.max(shape.y1, shape.y2)
      
      // Check if shape intersects with selection rectangle
      if (shapeMaxX >= minX && shapeMinX <= maxX && shapeMaxY >= minY && shapeMinY <= maxY) {
        selectedIds.push(shape.id)
      }
    })

    return selectedIds
  }

  static moveSingleElement(
    target: { type: string, id: string },
    deltaX: number,
    deltaY: number,
    actions: UpdateActions
  ) {
    // Note: This needs the current position + delta, will be handled by store logic
    if (target.type === 'character') {
      actions.updateCharacter(target.id, {
        x: deltaX,
        y: deltaY
      } as Partial<Character>)
    } else if (target.type === 'text') {
      actions.updateText(target.id, {
        x: deltaX,
        y: deltaY
      } as Partial<TextElement>)
    }
  }

  static moveMultipleElements(
    elementIds: string[],
    deltaX: number,
    deltaY: number,
    data: ElementsData & UpdateActions
  ) {
    elementIds.forEach(id => {
      if (id.startsWith('char_')) {
        data.updateCharacter(id, {
          x: deltaX,
          y: deltaY
        } as Partial<Character>)
      } else if (id.startsWith('text_')) {
        data.updateText(id, {
          x: deltaX,
          y: deltaY
        } as Partial<TextElement>)
      }
    })
  }

  static updateSelectionRect(
    selectionRect: PIXI.Graphics | null,
    start: { x: number, y: number },
    end: { x: number, y: number }
  ) {
    if (!selectionRect) return

    const minX = Math.min(start.x, end.x)
    const minY = Math.min(start.y, end.y)
    const width = Math.abs(end.x - start.x)
    const height = Math.abs(end.y - start.y)

    selectionRect.clear()
    selectionRect.setStrokeStyle({ width: 2, color: 0x0066cc })
    selectionRect.setFillStyle({ color: 0x0066cc, alpha: 0.1 })
    selectionRect.rect(minX, minY, width, height)
    selectionRect.fill()
    selectionRect.stroke()
  }

  static updateEraserCursor(
    eraserCursor: PIXI.Graphics | null,
    position: { x: number, y: number },
    brushSize: number
  ) {
    if (!eraserCursor) return

    eraserCursor.clear()
    eraserCursor.setStrokeStyle({ width: 2, color: 0xff0000, alpha: 0.8 })
    // Use brushSize * 2 as radius to match the erase area
    eraserCursor.circle(position.x, position.y, brushSize * 2)
    eraserCursor.stroke()
  }

  static drawCurrentPath(
    drawingLayer: PIXI.Container,
    points: number[],
    color: string,
    width: number
  ) {
    if (points.length < 4) return

    // Remove previous preview
    const preview = drawingLayer.getChildByName('preview')
    if (preview) {
      drawingLayer.removeChild(preview)
    }

    // Create new preview
    const graphics = new PIXI.Graphics()
    graphics.name = 'preview'
    
    graphics.setStrokeStyle({ width, color })
    graphics.moveTo(points[0], points[1])
    
    for (let i = 2; i < points.length; i += 2) {
      graphics.lineTo(points[i], points[i + 1])
    }
    
    graphics.stroke()
    drawingLayer.addChild(graphics)
  }

  static clearPreview(drawingLayer: PIXI.Container) {
    const preview = drawingLayer.getChildByName('preview')
    if (preview) {
      drawingLayer.removeChild(preview)
      console.log('Preview cleared')
    }
  }

  static updateFogCursor(
    fogCursor: PIXI.Graphics | null,
    position: { x: number, y: number },
    brushSize: number,
    isRemoving: boolean
  ) {
    if (!fogCursor) return

    fogCursor.clear()
    const color = isRemoving ? 0x00ff00 : 0xff0000 // Green for remove, red for add
    fogCursor.setStrokeStyle({ width: 2, color, alpha: 0.8 })
    fogCursor.circle(position.x, position.y, brushSize)
    fogCursor.stroke()
  }

  static addFogArea(
    position: { x: number, y: number },
    brushSize: number,
    type: 'hidden' | 'revealed',
    addFogArea: (fogArea: { x: number, y: number, radius: number, type: 'hidden' | 'revealed' }) => void
  ) {
    addFogArea({
      x: position.x,
      y: position.y,
      radius: brushSize,
      type: type
    })
  }

  static removeFogAreasAt(
    position: { x: number, y: number },
    brushSize: number,
    fogAreas: FogArea[],
    removeFogArea: (id: string) => void
  ) {
    // Remove only 'hidden' areas that intersect with the brush
    fogAreas.forEach(area => {
      if (area.type === 'hidden') {
        const distance = Math.sqrt(
          Math.pow(area.x - position.x, 2) + Math.pow(area.y - position.y, 2)
        )
        if (distance <= (area.radius + brushSize) / 2) {
          removeFogArea(area.id)
        }
      }
    })
  }

  static eraseAt(
    position: { x: number, y: number },
    brushSize: number,
    drawings: DrawingPath[],
    removeDrawing: (id: string) => void
  ) {
    const eraseRadius = brushSize * 2
    
    drawings.forEach(drawing => {
      const isNear = this.isPointNearPath(position, drawing.points, eraseRadius)
      if (isNear) {
        console.log(`✅ Erasing drawing ${drawing.id}`)
        removeDrawing(drawing.id)
      }
    })
  }

  static zoomToPoint(
    stage: PIXI.Container,
    centerX: number,
    centerY: number,
    newZoom: number
  ) {
    const currentZoom = stage.scale.x
    const zoomRatio = newZoom / currentZoom
    
    stage.scale.set(newZoom)
    
    const newX = centerX - (centerX - stage.x) * zoomRatio
    const newY = centerY - (centerY - stage.y) * zoomRatio
    
    stage.position.set(newX, newY)
  }

  private static isPointNearPath(
    point: { x: number, y: number },
    pathPoints: number[],
    threshold: number
  ): boolean {
    if (pathPoints.length < 4) {
      return false
    }
    
    for (let i = 0; i < pathPoints.length - 2; i += 2) {
      const distance = this.distanceToLineSegment(
        point,
        { x: pathPoints[i], y: pathPoints[i + 1] },
        { x: pathPoints[i + 2], y: pathPoints[i + 3] }
      )
      
      if (distance <= threshold) {
        return true
      }
    }
    
    return false
  }

  private static distanceToLineSegment(
    point: { x: number, y: number },
    lineStart: { x: number, y: number },
    lineEnd: { x: number, y: number }
  ): number {
    const A = point.x - lineStart.x
    const B = point.y - lineStart.y
    const C = lineEnd.x - lineStart.x
    const D = lineEnd.y - lineStart.y

    const dot = A * C + B * D
    const lenSq = C * C + D * D
    
    if (lenSq === 0) {
      return Math.sqrt(A * A + B * B)
    }
    
    const param = dot / lenSq

    let xx, yy

    if (param < 0) {
      xx = lineStart.x
      yy = lineStart.y
    } else if (param > 1) {
      xx = lineEnd.x
      yy = lineEnd.y
    } else {
      xx = lineStart.x + param * C
      yy = lineStart.y + param * D
    }

    const dx = point.x - xx
    const dy = point.y - yy
    
    return Math.sqrt(dx * dx + dy * dy)
  }

  static isPointNearShape(
    point: { x: number, y: number },
    shape: Shape
  ): boolean {
    const threshold = Math.max(shape.width, 10) // At least 10px threshold

    switch (shape.type) {
      case 'rectangle': {
        const minX = Math.min(shape.x1, shape.x2)
        const maxX = Math.max(shape.x1, shape.x2)
        const minY = Math.min(shape.y1, shape.y2)
        const maxY = Math.max(shape.y1, shape.y2)
        
        // Check if point is near the rectangle borders
        const nearLeft = Math.abs(point.x - minX) <= threshold && point.y >= minY - threshold && point.y <= maxY + threshold
        const nearRight = Math.abs(point.x - maxX) <= threshold && point.y >= minY - threshold && point.y <= maxY + threshold
        const nearTop = Math.abs(point.y - minY) <= threshold && point.x >= minX - threshold && point.x <= maxX + threshold
        const nearBottom = Math.abs(point.y - maxY) <= threshold && point.x >= minX - threshold && point.x <= maxX + threshold
        
        return nearLeft || nearRight || nearTop || nearBottom
      }
      
      case 'circle': {
        const centerX = (shape.x1 + shape.x2) / 2
        const centerY = (shape.y1 + shape.y2) / 2
        const radiusX = Math.abs(shape.x2 - shape.x1) / 2
        const radiusY = Math.abs(shape.y2 - shape.y1) / 2
        
        // Check if point is near the ellipse using ellipse equation
        const dx = (point.x - centerX) / (radiusX || 1)
        const dy = (point.y - centerY) / (radiusY || 1)
        const distanceFromEllipse = Math.sqrt(dx * dx + dy * dy)
        
        // Check if point is near the ellipse circumference
        return Math.abs(distanceFromEllipse - 1) <= threshold / Math.min(radiusX || 1, radiusY || 1)
      }
      
      case 'line': {
        const lineStart = { x: shape.x1, y: shape.y1 }
        const lineEnd = { x: shape.x2, y: shape.y2 }
        const distance = this.distanceToLineSegment(point, lineStart, lineEnd)
        return distance <= threshold
      }
      
      default:
        return false
    }
  }

  static drawShapePreview(
    shapeLayer: PIXI.Container,
    shapeType: 'rectangle' | 'circle' | 'line',
    start: { x: number, y: number },
    end: { x: number, y: number },
    color: string,
    width: number
  ) {
    // Remove previous preview
    const preview = shapeLayer.getChildByName('shape-preview')
    if (preview) {
      shapeLayer.removeChild(preview)
    }

    // Create new preview
    const graphics = new PIXI.Graphics()
    graphics.name = 'shape-preview'
    graphics.setStrokeStyle({ width, color })

    switch (shapeType) {
      case 'rectangle': {
        const minX = Math.min(start.x, end.x)
        const minY = Math.min(start.y, end.y)
        const width = Math.abs(end.x - start.x)
        const height = Math.abs(end.y - start.y)
        graphics.rect(minX, minY, width, height)
        break
      }
      case 'circle': {
        const centerX = (start.x + end.x) / 2
        const centerY = (start.y + end.y) / 2
        const radiusX = Math.abs(end.x - start.x) / 2
        const radiusY = Math.abs(end.y - start.y) / 2
        graphics.ellipse(centerX, centerY, radiusX, radiusY)
        break
      }
      case 'line': {
        graphics.moveTo(start.x, start.y)
        graphics.lineTo(end.x, end.y)
        break
      }
    }

    graphics.stroke()
    shapeLayer.addChild(graphics)
  }

  static clearShapePreview(shapeLayer: PIXI.Container) {
    const preview = shapeLayer.getChildByName('shape-preview')
    if (preview) {
      shapeLayer.removeChild(preview)
    }
  }
} 