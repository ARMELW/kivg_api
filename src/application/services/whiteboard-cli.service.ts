import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { readFile, unlink, writeFile } from 'node:fs/promises'
import process from 'node:process'
import type { Camera, Scene } from '@/domain/models/scene.model'
import { StorageService } from './storage.service'

const WHITEBOARD_TIMEOUT_MS = 10 * 60 * 1000

export interface WhiteboardConfig {
  slides: Array<{
    index: number
    duration: number
    skip_rate?: number
    layers?: Array<{
      type: 'image' | 'text' | 'arrow' | 'shape' | 'video'
      image_path?: string
      text_config?: {
        text: string
        font?: string
        size?: number
        color?: string
        align?: string
        position?: { x: number; y: number }
      }
      arrow_config?: {
        start: [number, number]
        end: [number, number]
        color?: string
        fill_color?: string
        stroke_width?: number
        arrow_size?: number
        duration?: number
      }
      shape_config?: {
        shape: 'rectangle' | 'circle' | 'triangle' | 'polygon'
        color?: string
        fill_color?: string
        stroke_width?: number
        position?: { x: number; y: number }
        width?: number
        height?: number
      }
      position?: { x: number; y: number }
      z_index: number
      skip_rate?: number
      scale?: number
      opacity?: number
      mode?: 'draw' | 'static' | 'animated' | 'eraser'
      entrance_animation?: {
        type: string
        duration: number
      }
      exit_animation?: {
        type: string
        duration: number
      }
      morph?: {
        enabled: boolean
        duration: number
      }
    }>
  }>
  transitions?: Array<{
    after_slide: number
    type: string
    duration: number
    pause_before?: number
  }>
}

export interface WhiteboardOptions {
  quality: 'preview' | 'draft' | 'standard' | 'high'
  aspectRatio: '1:1' | '16:9' | '9:16'
  skipAudio?: boolean
}

export interface GenerationProgress {
  progress: number
  currentStep: string
}

const QUALITY_PRESETS = {
  preview: {
    quality: 28,
    skipRate: 12,
    resolution: '480p',
    description: 'Fast preview (2-3x faster)',
    threads: 2
  },
  draft: {
    quality: 23,
    skipRate: 10,
    resolution: '720p',
    description: 'Standard quality (1.5x faster)',
    threads: 4
  },
  standard: {
    quality: 18,
    skipRate: 8,
    resolution: '720p',
    description: 'High quality (baseline)',
    threads: 8
  },
  high: {
    quality: 18,
    skipRate: 6,
    resolution: '1080p',
    description: 'Very high quality (1.5x slower)',
    threads: 16
  }
}

export class WhiteboardCliService {
  /**
   * Sauvegarde la scène brute dans un fichier JSON pour debug (synchrone, non bloquant pour le reste du code)
   */
  static saveSceneDebug(scene: Scene) {
    try {
      const debugDir = './preview-debug'
      if (!existsSync(debugDir)) {
        mkdirSync(debugDir, { recursive: true })
      }
      const debugScenePath = `${debugDir}/scene_brute_${Date.now()}.json`
      writeFileSync(debugScenePath, JSON.stringify(scene, null, 2))
    } catch (error) {
      console.warn('[PREVIEW_PROCESSOR] Impossible de sauvegarder la scène pour debug:', error)
    }
  }

  private pythonPath: string
  private scriptPath: string
  private storageService: StorageService
  private canvasWidth: number = 1920
  private canvasHeight: number = 1080

  constructor(storageService?: StorageService) {
    this.pythonPath = 'python'
    this.scriptPath = process.env.WHITEBOARD_CLI_PATH || '/home/armel/dev/whiteboard/animator/whiteboard_animator.py'
    this.storageService = storageService || new StorageService()
  }

  /**
   * Generate whiteboard config from scene
   * Groups layers into slides based on cameras/timeline
   * Supports multiple layer types: image, text, arrow, shape, video
   */
  generateConfig(scene: Scene): WhiteboardConfig {
    let slides: any[] = []

    let defaultCamera: Camera | null = null
    if (scene.sceneCameras && scene.sceneCameras.length > 0) {
      scene.cameras = scene.sceneCameras
      defaultCamera = scene.sceneCameras.find((cam: any) => cam.isDefault) || scene.sceneCameras[0]

      slides = scene.sceneCameras.map((camera: any, index: number) => ({
        index,
        // duration: camera.duration || scene.slideDuration || 3,
        skip_rate: camera.pauseDuration ? Math.ceil(camera.pauseDuration) : 10,
        layers: scene.layers.map((layer: any) =>
          this.mapLayerToConfig({ ...layer }, defaultCamera, camera, this.canvasWidth, this.canvasHeight)
        )
      }))
    } else {
      slides = [
        {
          index: 0,
          //duration: scene.duration || 3,
          skip_rate: 8,
          layers: scene.layers.map((layer: any) =>
            this.mapLayerToConfig({ ...layer }, null, null, this.canvasWidth, this.canvasHeight)
          )
        }
      ]
    }

    const transitions =
      scene.transitionType !== 'none'
        ? slides.slice(0, -1).map((slide: any, index: number) => ({
            after_slide: index,
            type: scene.transitionType || 'fade',
            duration: 0.5,
            pause_before: 0.5
          }))
        : []

    return {
      slides,
      transitions: transitions.length > 0 ? transitions : undefined
    }
  }

  /**
   * Map scene layer to whiteboard config layer format
   * Utilise camera_position (position dans la caméra par défaut) et la transforme pour la caméra actuelle
   */
  private mapLayerToConfig(
    layer: any,
    defaultCamera?: Camera | null,
    currentCamera?: Camera | null,
    canvasWidth: number = 1920,
    canvasHeight: number = 1080
  ): any {
    // Calculer la position finale basée sur camera_position (de la caméra par défaut)
    // et la transformer pour la caméra actuelle
    const finalDimensions = this.calculateFinalDimensions(
      layer,
      defaultCamera,
      currentCamera,
      canvasWidth,
      canvasHeight
    )
    const finalPosition = this.calculateFinalPosition(layer, defaultCamera, currentCamera, canvasWidth, canvasHeight)

    const baseConfig = {
      type: layer.type || 'image',
      z_index: layer.zIndex ?? 0,
      mode: layer.mode || 'draw',
      width: finalDimensions.width,
      height: finalDimensions.height,
      scale: layer.scale ?? 1,
      source_width: 800,
      source_height: 450,
      opacity: layer.opacity ?? undefined,
      skip_rate: layer.skip_rate ?? undefined,
      entrance_animation:
        layer.entrance_animation ??
        (layer.animationType ? { type: layer.animationType, duration: layer.animationSpeed || 1 } : undefined),
      exit_animation: layer.exit_animation ?? undefined,
      morph: layer.morph ?? undefined
    }

    switch (layer.type) {
      case 'text':
        return {
          ...baseConfig,
          anchor_point: 'center',
          position: {
            x: layer.camera_position.x,
            y: layer.camera_position.y
          },

          text_config: {
            text: layer.text_config.text,
            font_path: `fonts/${layer.text_config.font}.ttf`,
            font: layer.text_config.font || 'DejaVuSans',
            size: layer.text_config.size || 32,
            style: layer.text_config.style || 'normal',
            color: layer.text_config.color || '#000000',
            align: layer.text_config.align || 'left'
          }
        }

      case 'arrow':
        return {
          ...baseConfig,
          arrow_config: {
            start: this.transformPoint(
              layer.arrowStart || [0, 0],
              defaultCamera,
              currentCamera,
              canvasWidth,
              canvasHeight
            ),
            end: this.transformPoint(
              layer.arrowEnd || [100, 100],
              defaultCamera,
              currentCamera,
              canvasWidth,
              canvasHeight
            ),
            color: layer.arrowColor || '#000000',
            fill_color: layer.arrowFillColor || '#666666',
            stroke_width: layer.strokeWidth || 2,
            arrow_size: layer.arrowSize || 20,
            duration: layer.arrowDuration || 1
          }
        }

      case 'shape':
        return {
          ...baseConfig,
          svg_path: layer.svg_path || '',
          svg_sampling_rate: layer.svg_sampling_rate || 12,
          svg_reverse: layer.svg_reverse || false,
          shape_config: {
            //shape: layer.shapeName || 'rectangle',
            color: layer.shape_config.color || '#000000',
            fill_color: layer.shape_config.fill_color || '#cccccc',
            stroke_width: layer.shape_config.stroke_width || 2,
            width: finalDimensions.width || 100,
            height: finalDimensions.height || 100
          },
          position: finalPosition
        }

      case 'image':
      default:
        return {
          ...baseConfig,
          image_path: layer.image_path || '',
          position: {
            x: layer.camera_position.x,
            y: layer.camera_position.y
          }
        }
    }
  }

  /**
   * Calcule la position finale dans l'espace 1920x1080
   * camera_position est la position dans la caméra par défaut
   * On doit la transformer pour la caméra actuelle
   */
  private calculateFinalPosition(
    layer: any,
    defaultCamera?: Camera | null,
    currentCamera?: Camera | null,
    canvasWidth: number = 1920,
    canvasHeight: number = 1080
  ): { x: number; y: number } {
    // Si pas de camera_position, utiliser position par défaut
    if (!layer.camera_position) {
      return layer.position || { x: 0, y: 0 }
    }

    // Si pas de caméra actuelle, projeter directement camera_position
    if (!currentCamera || !currentCamera.position) {
      return layer.camera_position
    }

    // camera_position est la position dans la caméra par défaut
    // Il faut la projeter vers l'espace 1920x1080 selon la caméra actuelle
    const zoom = currentCamera.scale || 1
    const cameraPhysicalWidth = currentCamera.width || 800
    const cameraPhysicalHeight = currentCamera.height || 450

    // Viewport de la caméra actuelle
    const viewportWidth = cameraPhysicalWidth / zoom
    const viewportHeight = cameraPhysicalHeight / zoom

    // Facteur de projection vers 1920x1080
    const projectionScaleX = canvasWidth / viewportWidth
    const projectionScaleY = canvasHeight / viewportHeight

    // Projeter camera_position (de la caméra par défaut) vers l'espace final
    const finalX = layer.camera_position.x * projectionScaleX
    const finalY = layer.camera_position.y * projectionScaleY

    return {
      x: Math.max(0, finalX),
      y: Math.max(0, finalY)
    }
  }

  /**
   * Calcule les dimensions finales après projection de la caméra
   */
  private calculateFinalDimensions(
    layer: any,
    defaultCamera?: Camera | null,
    currentCamera?: Camera | null,
    canvasWidth: number = 1920,
    canvasHeight: number = 1080
  ): { width: number; height: number } {
    const layerWidth = layer.width || 0
    const layerHeight = layer.height || 0

    // Si pas de caméra actuelle, retourner les dimensions originales
    if (!currentCamera || !currentCamera.position) {
      return { width: layerWidth, height: layerHeight }
    }

    const zoom = currentCamera.scale || 1
    const cameraPhysicalWidth = currentCamera.width || 800
    const cameraPhysicalHeight = currentCamera.height || 450

    // Viewport de la caméra actuelle
    const viewportWidth = cameraPhysicalWidth / zoom
    const viewportHeight = cameraPhysicalHeight / zoom

    // Facteur de projection
    const projectionScaleX = canvasWidth / viewportWidth
    const projectionScaleY = canvasHeight / viewportHeight

    // Dimensions finales après projection et zoom
    return {
      width: (layerWidth * projectionScaleX) / zoom,
      height: (layerHeight * projectionScaleY) / zoom
    }
  }

  /**
   * Transforme un point [x, y] du canvas vers le viewport de la caméra
   * puis projette vers la scène finale (1920x1080)
   * Utilisé pour les flèches
   */
  private transformPoint(
    point: [number, number],
    defaultCamera?: Camera | null,
    currentCamera?: Camera | null,
    canvasWidth: number = 1920,
    canvasHeight: number = 1080
  ): [number, number] {
    if (!currentCamera || !currentCamera.position) return point

    const zoom = currentCamera.scale || 1
    const cameraPhysicalWidth = currentCamera.width || 800
    const cameraPhysicalHeight = currentCamera.height || 450

    const viewportWidth = cameraPhysicalWidth / zoom
    const viewportHeight = cameraPhysicalHeight / zoom

    const cameraPosPixels = {
      x: currentCamera.position.x * canvasWidth,
      y: currentCamera.position.y * canvasHeight
    }
    const cameraTopLeftX = cameraPosPixels.x - viewportWidth / 2
    const cameraTopLeftY = cameraPosPixels.y - viewportHeight / 2

    const posRelativeToCameraTopLeft = {
      x: point[0] - cameraTopLeftX,
      y: point[1] - cameraTopLeftY
    }

    const projectionScaleX = canvasWidth / viewportWidth
    const projectionScaleY = canvasHeight / viewportHeight

    const finalPoint = [
      posRelativeToCameraTopLeft.x * projectionScaleX,
      posRelativeToCameraTopLeft.y * projectionScaleY
    ]

    return finalPoint as [number, number]
  }

  /**
   * Upload video to MinIO storage and return public URL
   * @deprecated Use PreviewUploadService for background uploads instead
   */
  private async uploadVideoToStorage(videoPath: string): Promise<string> {
    try {
      const videoBuffer = await readFile(videoPath)
      const filename = `whiteboard_${randomUUID()}.mp4`

      const uploadResult = await this.storageService.uploadFile(videoBuffer, filename, {
        bucket: 'EXPORTS',
        contentType: 'video/mp4',
        metadata: {
          source: 'whiteboard-animator',
          uploadedAt: new Date().toISOString()
        }
      })

      try {
        await unlink(videoPath)
      } catch (error) {
        console.warn(`[Whiteboard] Failed to clean up local video file: ${error}`)
      }

      return uploadResult.url
    } catch (error) {
      console.error(`[Whiteboard] Failed to upload video to storage: ${error}`)
      throw new Error(`Failed to upload video to storage: ${error}`)
    }
  }

  /**
   * Generate a temporary URL for local preview file
   * This allows immediate preview access while upload to MinIO happens in background
   */
  generateTemporaryUrl(videoPath: string): string {
    // Extract filename from path
    const filename = videoPath.split('/').pop() || videoPath
    // Return URL that will be served by the temporary preview endpoint
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
    return `${baseUrl}/api/v1/preview/temp/${filename}`
  }

  /**
   * Execute whiteboard-cli to generate video with timeout and proper error handling
   */
  async execute(
    config: WhiteboardConfig,
    options: WhiteboardOptions,
    onProgress?: (progress: GenerationProgress) => void
  ): Promise<string> {
    const configId = randomUUID()
    const configPath = `/tmp/preview_${configId}_config.json`
    let childProcess: any = null
    let timeoutHandle: NodeJS.Timeout | null = null
    const debugDir = './preview-debug'
    const debugPath = `${debugDir}/preview_debug_${Date.now()}.json`
    let hasCompleted = false

    try {
      await writeFile(configPath, JSON.stringify(config))

      const preset = QUALITY_PRESETS[options.quality]
      try {
        await import('node:fs/promises').then((fs) => fs.mkdir(debugDir, { recursive: true }))
      } catch {}
      await writeFile(debugPath, JSON.stringify(config, null, 2))

      const args = [
        this.scriptPath,
        '--config',
        configPath,
        '--quality',
        preset.quality.toString(),
        '--skip-rate',
        preset.skipRate.toString(),
        '--threads',
        preset.threads.toString(),
        '--aspect-ratio',
        options.aspectRatio
      ]

      if (options.quality === 'preview') {
        args.push('--preview')
      }

      if (options.skipAudio) {
        args.push('--no-audio')
      }

      return await new Promise((resolve, reject) => {
        childProcess = spawn(this.pythonPath, args, {
          timeout: WHITEBOARD_TIMEOUT_MS,
          stdio: ['ignore', 'pipe', 'pipe']
        })

        let outputPath = ''
        let lastProgress = 0
        let errorOutput = ''
        let stdoutBuffer = ''

        const cleanup = () => {
          if (timeoutHandle) {
            clearTimeout(timeoutHandle)
            timeoutHandle = null
          }
        }

        const killProcess = () => {
          if (childProcess && !childProcess.killed) {
            console.warn('[Whiteboard] Force killing process due to timeout')
            try {
              childProcess.kill('SIGKILL')
            } catch (error) {
              console.error(`[Whiteboard] Failed to kill process: ${error}`)
            }
          }
        }

        timeoutHandle = setTimeout(() => {
          if (!hasCompleted) {
            hasCompleted = true
            killProcess()
            cleanup()
            reject(new Error(`Whiteboard video generation timeout after ${WHITEBOARD_TIMEOUT_MS / 1000}s`))
          }
        }, WHITEBOARD_TIMEOUT_MS)

        childProcess.stdout.on('data', (data: any) => {
          const output = data.toString()
          stdoutBuffer += output

          const progressMatch = output.match(/Progress: (\d+)%/)
          if (progressMatch) {
            const progress = Number.parseInt(progressMatch[1], 10)
            if (progress > lastProgress) {
              lastProgress = progress
              onProgress?.({
                progress,
                currentStep: `Rendering video: ${progress}%`
              })
            }
          }

          const stepMatch = output.match(/Step: (.+)/)
          if (stepMatch) {
            onProgress?.({
              progress: lastProgress,
              currentStep: stepMatch[1]
            })
          }
        })

        childProcess.stderr.on('data', (data: any) => {
          const error = data.toString()
          errorOutput += error
          console.error(`[Whiteboard] Error: ${error.trim()}`)
        })

        childProcess.on('close', async (code: number) => {
          if (hasCompleted) {
            return
          }

          await new Promise((resolve) => setTimeout(resolve, 200))

          hasCompleted = true
          cleanup()

          const combinedMatch = stdoutBuffer.match(/\/.+?combined\.mp4/)
          if (combinedMatch) {
            outputPath = combinedMatch[0]
          } else {
            const fallbackMatch = stdoutBuffer.match(/\/.+?\.mp4/)
            if (fallbackMatch) {
              outputPath = fallbackMatch[0]
            }
          }

          try {
            await unlink(configPath)
          } catch (error) {
            console.warn(`[Whiteboard] Failed to clean up config file: ${error}`)
          }

          if (code === 0 && outputPath) {
            try {
              // Generate temporary URL immediately for fast preview access
              const tempUrl = this.generateTemporaryUrl(outputPath)

              // Return temporary URL immediately
              // Note: The PreviewUploadService will handle background upload to MinIO
              resolve(tempUrl)
            } catch (error) {
              console.error(`[Whiteboard] Failed to generate temporary URL: ${error}`)
              reject(new Error(`Failed to generate temporary URL: ${error}`))
            }
          } else {
            const errorMsg = `Whiteboard CLI exited with code ${code}${errorOutput ? `: ${errorOutput.slice(0, 200)}` : ''}`
            console.error(`[Whiteboard] ${errorMsg}`)
            reject(new Error(errorMsg))
          }
        })

        childProcess.on('error', (error: Error) => {
          if (hasCompleted) {
            return
          }

          hasCompleted = true
          cleanup()
          const errorMsg = `Failed to spawn whiteboard CLI: ${error.message}`
          console.error(`[Whiteboard] ${errorMsg}`)
          reject(new Error(errorMsg))
        })
      })
    } catch (error: any) {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle)
      }

      if (childProcess && !childProcess.killed) {
        try {
          childProcess.kill('SIGKILL')
        } catch (error) {
          console.error(`[Whiteboard] Failed to kill process during cleanup: ${error}`)
        }
      }

      try {
        await unlink(configPath)
      } catch {
        // Ignore cleanup errors
      }

      const errorMsg = `Video generation failed: ${error.message}`
      console.error(`[Whiteboard] ${errorMsg}`)
      throw error
    }
  }

  /**
   * Check if whiteboard-cli is available
   */
  isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      const childProcess = spawn(this.pythonPath, [this.scriptPath, '-h'])
      childProcess.on('close', (code) => {
        resolve(code === 0)
      })
      childProcess.on('error', () => {
        resolve(false)
      })
    })
  }
}
