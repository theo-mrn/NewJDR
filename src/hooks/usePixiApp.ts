import { useRef, useEffect } from 'react'
import * as PIXI from 'pixi.js'

export interface PixiLayers {
  backgroundLayer: PIXI.Container
  gridLayer: PIXI.Container
  drawingLayer: PIXI.Container
  charactersLayer: PIXI.Container
  textsLayer: PIXI.Container
  fogLayer: PIXI.Container
  selectionLayer: PIXI.Container
}

export interface PixiRefs {
  app: PIXI.Application | null
  layers: PixiLayers | null
  grid: PIXI.Graphics | null
  background: PIXI.Sprite | null
  fogMask: PIXI.Graphics | null
  selectionRect: PIXI.Graphics | null
  eraserCursor: PIXI.Graphics | null
  fogCursor: PIXI.Graphics | null
}

export const usePixiApp = (containerRef: React.RefObject<HTMLDivElement | null>) => {
  const appRef = useRef<PIXI.Application | null>(null)
  const layersRef = useRef<PixiLayers | null>(null)
  const gridRef = useRef<PIXI.Graphics | null>(null)
  const backgroundRef = useRef<PIXI.Sprite | null>(null)
  const fogMaskRef = useRef<PIXI.Graphics | null>(null)
  const selectionRectRef = useRef<PIXI.Graphics | null>(null)
  const eraserCursorRef = useRef<PIXI.Graphics | null>(null)
  const fogCursorRef = useRef<PIXI.Graphics | null>(null)

  useEffect(() => {
    if (!containerRef.current || appRef.current) return

    let isMounted = true

    const initApp = async () => {
      try {
        const app = new PIXI.Application()
        
        await app.init({
          width: window.innerWidth,
          height: window.innerHeight - 60,
          backgroundColor: 0xf8f9fa,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
        })

        if (!isMounted) {
          app.destroy(true)
          return
        }

        appRef.current = app

        if (containerRef.current) {
          containerRef.current.appendChild(app.canvas)
        }

        // Create layers in correct order
        const backgroundLayer = new PIXI.Container()
        const gridLayer = new PIXI.Container()
        const drawingLayer = new PIXI.Container()
        const charactersLayer = new PIXI.Container()
        const textsLayer = new PIXI.Container()
        const fogLayer = new PIXI.Container()
        const selectionLayer = new PIXI.Container()

        app.stage.addChild(backgroundLayer)
        app.stage.addChild(gridLayer)
        app.stage.addChild(drawingLayer)
        app.stage.addChild(charactersLayer)
        app.stage.addChild(textsLayer)
        app.stage.addChild(fogLayer)
        app.stage.addChild(selectionLayer)

        const layers: PixiLayers = {
          backgroundLayer,
          gridLayer,
          drawingLayer,
          charactersLayer,
          textsLayer,
          fogLayer,
          selectionLayer
        }
        layersRef.current = layers

        // Create grid
        const grid = new PIXI.Graphics()
        gridLayer.addChild(grid)
        gridRef.current = grid

        // Fog layer is initially empty - fog areas will be managed by the renderer
        fogMaskRef.current = null

        // Create selection rectangle
        const selectionRect = new PIXI.Graphics()
        selectionLayer.addChild(selectionRect)
        selectionRectRef.current = selectionRect
        
        // Create eraser cursor
        const eraserCursor = new PIXI.Graphics()
        selectionLayer.addChild(eraserCursor)
        eraserCursorRef.current = eraserCursor

        // Create fog cursor
        const fogCursor = new PIXI.Graphics()
        selectionLayer.addChild(fogCursor)
        fogCursorRef.current = fogCursor

        // Setup stage interaction
        app.stage.interactive = true
        app.stage.hitArea = new PIXI.Rectangle(0, 0, app.screen.width, app.screen.height)
        
        console.log('✅ PixiJS Application initialized successfully')
      } catch (error) {
        console.error('❌ Error initializing PixiJS:', error)
      }
    }

    initApp()

    const handleResize = () => {
      if (appRef.current?.renderer) {
        try {
          appRef.current.renderer.resize(window.innerWidth, window.innerHeight - 60)
          appRef.current.stage.hitArea = new PIXI.Rectangle(0, 0, window.innerWidth, window.innerHeight - 60)
        } catch (error) {
          console.error('Error resizing canvas:', error)
        }
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      isMounted = false
      window.removeEventListener('resize', handleResize)
      if (appRef.current) {
        try {
          appRef.current.destroy(true, true)
        } catch (error) {
          console.error('Error destroying PixiJS app:', error)
        }
        appRef.current = null
      }
      layersRef.current = null
      gridRef.current = null
      backgroundRef.current = null
      fogMaskRef.current = null
      selectionRectRef.current = null
      eraserCursorRef.current = null
      fogCursorRef.current = null
    }
  }, [containerRef])

  const getRefs = (): PixiRefs => ({
    app: appRef.current,
    layers: layersRef.current,
    grid: gridRef.current,
    background: backgroundRef.current,
    fogMask: fogMaskRef.current,
    selectionRect: selectionRectRef.current,
    eraserCursor: eraserCursorRef.current,
    fogCursor: fogCursorRef.current
  })

  return {
    app: appRef.current,
    layers: layersRef.current,
    getRefs
  }
} 