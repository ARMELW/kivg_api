import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { readFile, unlink, writeFile } from 'node:fs/promises'
import process from 'node:process'
import type { Camera, Scene } from '@/domain/models/scene.model'
import { StorageService } from './storage.service'

const WHITEBOARD_TIMEOUT_MS = 10 * 60 * 1000
// const FFMPEG_TIMEOUT_MS = 5 * 60 * 1000 // Reserved for future use
// const PROCESS_CLEANUP_DELAY_MS = 1000 // Reserved for future use

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
    // Group layers into slides (one slide per camera if available)
    let slides: any[] = []

    let defaultCamera: Camera | null = null
    if (scene.sceneCameras && scene.sceneCameras.length > 0) {
      scene.cameras = scene.sceneCameras
      // Find default camera (isDefault: true), fallback to first
      defaultCamera = scene.sceneCameras.find((cam: any) => cam.isDefault) || scene.sceneCameras[0]
      console.log('Default camera for layer positioning:', defaultCamera)

      // Use cameras as slide boundaries
      slides = scene.sceneCameras.map((camera: any, index: number) => ({
        index,
        duration: camera.duration || scene.slideDuration || 3,
        skip_rate: camera.pauseDuration ? Math.ceil(camera.pauseDuration) : 10,
        layers: scene.layers.map((layer: any) =>
          this.mapLayerToConfig(layer, defaultCamera, this.canvasWidth, this.canvasHeight)
        )
      }))
    } else {
      // Fallback: create a single slide with all layers
      slides = [
        {
          index: 0,
          duration: scene.duration || 3,
          skip_rate: 8,
          layers: scene.layers.map((layer: any) =>
            this.mapLayerToConfig(layer, null, this.canvasWidth, this.canvasHeight)
          )
        }
      ]
    }

    // Generate transitions between slides
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
   * Supports image, text, arrow, and shape types
   */
  private mapLayerToConfig(
    layer: any,
    defaultCamera?: Camera | null,
    canvasWidth: number = 1920,
    canvasHeight: number = 1080
  ): any {
    const baseConfig = {
      type: layer.type || 'image',
      z_index: layer.zIndex,
      mode: layer.mode || 'draw'
    }

    // Calculer la position une seule fois
    const position = this.getLayerPositionInCamera(layer, defaultCamera, canvasWidth, canvasHeight)

    switch (layer.type) {
      case 'text':
        return {
          ...baseConfig,
          text_config: {
            text: layer.text_config.text,
            font: layer.text_config.font || 'DejaVuSans',
            size: layer.text_config.size || 32,
            style: layer.text_config.style || 'normal',
            color: layer.text_config.color || '#000000',
            align: layer.text_config.align || 'left',
            position
          },
          ...(layer.animationType && {
            entrance_animation: {
              type: layer.animationType,
              duration: layer.animationSpeed || 1
            }
          })
        }

      case 'arrow':
        return {
          ...baseConfig,
          arrow_config: {
            start: this.transformPoint(layer.arrowStart || [0, 0], defaultCamera, canvasWidth, canvasHeight),
            end: this.transformPoint(layer.arrowEnd || [100, 100], defaultCamera, canvasWidth, canvasHeight),
            color: layer.arrowColor || '#000000',
            fill_color: layer.arrowFillColor || '#666666',
            stroke_width: layer.strokeWidth || 2,
            arrow_size: layer.arrowSize || 20,
            duration: layer.arrowDuration || 1
          },
          ...(layer.animationType && {
            entrance_animation: {
              type: layer.animationType,
              duration: layer.animationSpeed || 1
            }
          })
        }

      case 'shape':
        return {
          ...baseConfig,
          shape_config: {
            shape: layer.shapeName || 'rectangle',
            color: layer.shapeColor || '#000000',
            fill_color: layer.shapeFillColor || '#cccccc',
            stroke_width: layer.strokeWidth || 2,
            position,
            width: layer.width ? layer.width * (defaultCamera?.zoom || 1) : 100,
            height: layer.height ? layer.height * (defaultCamera?.zoom || 1) : 100
          },
          ...(layer.animationType && {
            entrance_animation: {
              type: layer.animationType,
              duration: layer.animationSpeed || 1
            }
          })
        }

      case 'image':
      default:
        return {
          ...baseConfig,
          image_path: layer.image_path || '',
          position,
          ...(layer.animationType && {
            entrance_animation: {
              type: layer.animationType,
              duration: layer.animationSpeed || 1
            }
          })
        }
    }
  }

  /**
   * Transforme un point [x, y] du canvas vers le viewport de la caméra
   * puis projette vers la scène finale (1920x1080)
   */
  private transformPoint(
    point: [number, number],
    camera?: Camera | null,
    canvasWidth: number = 1920,
    canvasHeight: number = 1080
  ): [number, number] {
    if (!camera || !camera.position) return point

    const cameraPosPixels = {
      x: camera.position.x * canvasWidth,
      y: camera.position.y * canvasHeight
    }

    const zoom = camera.zoom || 1
    const viewportWidth = (camera.width || 800) / zoom
    const viewportHeight = (camera.height || 450) / zoom

    const cameraTopLeftX = cameraPosPixels.x - viewportWidth / 2
    const cameraTopLeftY = cameraPosPixels.y - viewportHeight / 2

    // Position dans le viewport
    const posInViewport = [(point[0] - cameraTopLeftX) * zoom, (point[1] - cameraTopLeftY) * zoom]

    // Projection vers la scène finale
    const scaleX = 1920 / (camera.width || 800)
    const scaleY = 1080 / (camera.height || 450)

    return [posInViewport[0] * scaleX, posInViewport[1] * scaleY]
  }

  // Dans WhiteboardCliService.ts

  private getLayerPositionInCamera(
    layer: any,
    camera?: Camera | null,
    canvasWidth: number = 1920,
    canvasHeight: number = 1080
  ): { x: number; y: number } {
    // 1. DÉTERMINER LES DIMENSIONS DE BASE (dans l'espace canvas original)
    // C'est essentiel pour calculer l'offset du centre vers le coin supérieur gauche.
    const layerWidthCanvas = layer.width || 0
    const layerHeightCanvas = layer.height || 0
    console.log('[Position] Calculating position for layer:', layer)

    // 2. Position de départ (le centre dans l'éditeur)
    const layerPos = layer.position || { x: 0, y: 0 }

    // --- LOGIQUE SANS CAMÉRA ---
    if (!camera || !camera.position) {
      // Si pas de caméra et que le point est le centre, décaler vers le coin supérieur gauche
      if (layerWidthCanvas > 0) {
        return {
          x: layerPos.x - layerWidthCanvas / 2,
          y: layerPos.y - layerHeightCanvas / 2
        }
      }
      return layerPos // Retourne la position (qui est le centre) si pas de dimensions d'offset
    }
    // --- FIN LOGIQUE SANS CAMÉRA ---

    // 3. PROJECTION DU CENTRE DU LAYER (code original)
    const cameraPosPixels = {
      x: camera.position.x * canvasWidth,
      y: camera.position.y * canvasHeight
    }

    const zoom = camera.zoom || 1
    const cameraPhysicalWidth = camera.width || 800
    const cameraPhysicalHeight = camera.height || 450

    const viewportWidth = cameraPhysicalWidth / zoom
    const viewportHeight = cameraPhysicalHeight / zoom

    const cameraTopLeftX = cameraPosPixels.x - viewportWidth / 2
    const cameraTopLeftY = cameraPosPixels.y - viewportHeight / 2

    const posInViewport = {
      x: (layerPos.x - cameraTopLeftX) * zoom,
      y: (layerPos.y - cameraTopLeftY) * zoom
    }

    const scaleX = 1920 / cameraPhysicalWidth
    const scaleY = 1080 / cameraPhysicalHeight

    // finalPosCenter est le CENTRE projeté dans le canvas 1920x1080
    const finalPosCenter = {
      x: posInViewport.x * scaleX,
      y: posInViewport.y * scaleY
    }

    // 4. CALCUL DES DIMENSIONS ET DÉCALAGE VERS LE COIN SUPÉRIEUR GAUCHE

    // Calcul des dimensions finales après zoom et projection
    const layerWidthFinal = layerWidthCanvas * zoom * scaleX
    const layerHeightFinal = layerHeightCanvas * zoom * scaleY

    // Soustraire la moitié des dimensions finales du centre projeté
    // Cela nous donne la position du COIN SUPÉRIEUR GAUCHE, que le CLI attend
    const finalPosTopLeft = {
      x: finalPosCenter.x - layerWidthFinal / 2,
      y: finalPosCenter.y - layerHeightFinal / 2
    }

    // Pour le debug:
    // console.log(`[Position] Final position (Top-Left): (${finalPosTopLeft.x.toFixed(2)}, ${finalPosTopLeft.y.toFixed(2)})`)

    return finalPosTopLeft
  }
  /**
   * Upload video to MinIO storage and return public URL
   */
  private async uploadVideoToStorage(videoPath: string): Promise<string> {
    try {
      console.info(`[Whiteboard] Reading video file from: ${videoPath}`)
      const videoBuffer = await readFile(videoPath)

      const filename = `whiteboard_${randomUUID()}.mp4`
      console.info(`[Whiteboard] Uploading video to MinIO storage as: ${filename}`)

      const uploadResult = await this.storageService.uploadFile(videoBuffer, filename, {
        bucket: 'EXPORTS',
        contentType: 'video/mp4',
        metadata: {
          source: 'whiteboard-animator',
          uploadedAt: new Date().toISOString()
        }
      })

      console.info(`[Whiteboard] Video uploaded to MinIO successfully`)
      console.info(`[Whiteboard] Public URL: ${uploadResult.url}`)

      // Clean up local video file after upload
      try {
        await unlink(videoPath)
        console.info(`[Whiteboard] Local video file cleaned up: ${videoPath}`)
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
    // Persiste une copie du JSON pour le debug dans le dossier du projet
    const debugDir = './preview-debug'
    const debugPath = `${debugDir}/preview_debug_${Date.now()}.json`
    let hasCompleted = false

    try {
      console.info(`[Whiteboard] Generated config: ${JSON.stringify(config)}`)
      await writeFile(configPath, JSON.stringify(config))
      console.info(`[Whiteboard] Config file created: ${configPath}`)

      const preset = QUALITY_PRESETS[options.quality]
      // Crée le dossier si nécessaire
      try {
        await import('node:fs/promises').then((fs) => fs.mkdir(debugDir, { recursive: true }))
      } catch {}
      await writeFile(debugPath, JSON.stringify(config, null, 2))
      console.info(`[Whiteboard] Debug config persisted: ${debugPath}`)

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

      console.info(`[Whiteboard] Starting video generation with quality: ${options.quality} (${preset.description})`)

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
          console.info(`[Whiteboard] ${output.trim()}`)

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

          // Wait a brief moment to ensure all stdout data has been processed
          await new Promise((resolve) => setTimeout(resolve, 200))

          hasCompleted = true
          cleanup()

          // Parse complete stdout buffer for video path
          const combinedMatch = stdoutBuffer.match(/\/.+?combined\.mp4/)
          if (combinedMatch) {
            outputPath = combinedMatch[0]
            console.info(`[Whiteboard] ✅ Final video path (COMBINED): ${outputPath}`)
          } else {
            const fallbackMatch = stdoutBuffer.match(/\/.+?\.mp4/)
            if (fallbackMatch) {
              outputPath = fallbackMatch[0]
              console.info(`[Whiteboard] 📹 Video path (fallback): ${outputPath}`)
            }
          }

          try {
            await unlink(configPath)
            console.info(`[Whiteboard] Config file cleaned up`)
          } catch (error) {
            console.warn(`[Whiteboard] Failed to clean up config file: ${error}`)
          }

          if (code === 0 && outputPath) {
            console.info(`[Whiteboard] Video generation completed successfully: ${outputPath}`)
            try {
              const minioUrl = await this.uploadVideoToStorage(outputPath)
              resolve(minioUrl)
            } catch (uploadError) {
              console.error(`[Whiteboard] Upload to MinIO failed: ${uploadError}`)
              reject(new Error(`Failed to upload video to storage: ${uploadError}`))
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
      console.info('[Whiteboard] Checking availability')
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
