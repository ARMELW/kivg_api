import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
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
      // Optionnel: log le chemin du fichier
      // console.info(`[PREVIEW_PROCESSOR] Scene sauvegardée: ${debugScenePath}`)
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
    // Group layers into slides (one slide per camera if available)
    let slides: any[] = []

    // Pour éviter de bloquer le script, la sauvegarde doit être appelée explicitement avant generateConfig :
    // WhiteboardCliService.saveSceneDebug(scene)
    let defaultCamera: Camera | null = null
    if (scene.sceneCameras && scene.sceneCameras.length > 0) {
      scene.cameras = scene.sceneCameras
      // Find default camera (isDefault: true), fallback to first
      defaultCamera = scene.sceneCameras.find((cam: any) => cam.isDefault) || scene.sceneCameras[0]
      //console.log('Default camera for layer positioning:', defaultCamera)

      // Use cameras as slide boundaries
      slides = scene.sceneCameras.map((camera: any, index: number) => ({
        index,
        duration: camera.duration || scene.slideDuration || 3,
        skip_rate: camera.pauseDuration ? Math.ceil(camera.pauseDuration) : 10,
        // Clone and map layers for the current camera context
        layers: scene.layers.map((layer: any) =>
          this.mapLayerToConfig({ ...layer }, defaultCamera, this.canvasWidth, this.canvasHeight)
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
            this.mapLayerToConfig({ ...layer }, null, this.canvasWidth, this.canvasHeight)
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
    // Calculer la position et mettre à jour les dimensions finales (layer.width/height)
    const position = this.getLayerPositionInCamera(layer, defaultCamera, canvasWidth, canvasHeight)

    // Les propriétés layer.width et layer.height contiennent maintenant les dimensions projetées finales

    const baseConfig = {
      type: layer.type || 'image',
      z_index: layer.zIndex ?? 0,
      mode: layer.mode || 'draw',
      width: layer.width || undefined, // Utilise la largeur finale calculée
      height: layer.height || undefined // Utilise la hauteur finale calculée
    }

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
            // Pour les formes, on utilise directement les dimensions finales calculées par getLayerPositionInCamera
            width: layer.width || 100,
            height: layer.height || 100
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
        // Pour les images, on utilise simplement les dimensions finales et la position calculées
        return {
          ...baseConfig,
          image_path: layer.image_path || '',
          position,
          width: layer.width,
          height: layer.height,
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

  /**
   * Transforme un point [x, y] du canvas (éditeur) vers les coordonnées de la scène finale (1920x1080)
   * en tenant compte du zoom et de la position de la caméra.
   */
  private transformPoint(
    point: [number, number],
    camera?: Camera | null,
    canvasWidth: number = 1920,
    canvasHeight: number = 1080
  ): [number, number] {
    if (!camera || !camera.position) return point // Retourne le point si pas de caméra

    const zoom = camera.scale || 1
    const cameraPhysicalWidth = camera.width || 800
    const cameraPhysicalHeight = camera.height || 450

    // 1. Dimensions du viewport (ce que la caméra "voit" dans l'espace de l'éditeur)
    const viewportWidth = cameraPhysicalWidth / zoom
    const viewportHeight = cameraPhysicalHeight / zoom

    // 2. Position du coin supérieur gauche de la caméra dans l'espace de l'éditeur (en pixels)
    const cameraPosPixels = {
      x: camera.position.x * canvasWidth,
      y: camera.position.y * canvasHeight
    }
    const cameraTopLeftX = cameraPosPixels.x - viewportWidth / 2
    const cameraTopLeftY = cameraPosPixels.y - viewportHeight / 2

    // 3. Position du point relative au coin supérieur gauche de la caméra (non zoomée)
    const posRelativeToCameraTopLeft = {
      x: point[0] - cameraTopLeftX,
      y: point[1] - cameraTopLeftY
    }

    // 4. Facteur de projection : met à l'échelle le viewport zoomé vers 1920x1080
    // Ce facteur assure la cohérence avec getLayerPositionInCamera.
    const projectionScaleX = canvasWidth / viewportWidth
    const projectionScaleY = canvasHeight / viewportHeight

    // 5. Application de la projection : coordonnées finales dans l'espace 1920x1080
    const finalPoint = [
      posRelativeToCameraTopLeft.x * projectionScaleX,
      posRelativeToCameraTopLeft.y * projectionScaleY
    ]

    return finalPoint as [number, number]
  }
  /**
   * Calcule la position finale (coin supérieur gauche) et les dimensions finales
   * d'un calque après projection par la caméra.
   * La position et les dimensions sont enregistrées dans l'objet 'layer' temporaire.
   */
  private getLayerPositionInCamera(
    layer: any,
    camera?: Camera | null,
    canvasWidth: number = 1920,
    canvasHeight: number = 1080
  ): { x: number; y: number } {
    // Dimensions du calque dans l'espace de l'éditeur (déjà scalées par layer.scale)

    const layerWidthDisplayed = layer.width || 0
    const layerHeightDisplayed = layer.height || 0

    // Position du centre du calque dans l'éditeur (React Konva)
    const layerPos = layer.position || { x: 0, y: 0 }

    // 1. LOGIQUE SANS CAMÉRA : Conversion du centre en coin supérieur gauche
    if (!camera || !camera.position) {
      if (layerWidthDisplayed > 0 && layerHeightDisplayed > 0) {
        // Mise à jour des dimensions finales (inchangées)
        layer.width = layerWidthDisplayed
        layer.height = layerHeightDisplayed
        return {
          x: layerPos.x - layerWidthDisplayed / 2,
          y: layerPos.y - layerHeightDisplayed / 2
        }
      }
      layer.width = 0
      layer.height = 0
      return layerPos
    }

    // --- LOGIQUE AVEC CAMÉRA ---

    const zoom = camera.scale || 1
    const cameraPhysicalWidth = camera.width || 800
    const cameraPhysicalHeight = camera.height || 450

    const viewportWidth = cameraPhysicalWidth / zoom
    const viewportHeight = cameraPhysicalHeight / zoom

    // Position du coin supérieur gauche de la caméra dans l'espace de l'éditeur (en pixels)
    const cameraPosPixels = {
      x: camera.position.x * canvasWidth,
      y: camera.position.y * canvasHeight
    }

    const cameraTopLeftX = cameraPosPixels.x - viewportWidth / 2
    const cameraTopLeftY = cameraPosPixels.y - viewportHeight / 2

    // 1. Position du CENTRE du calque RELATIVE au coin supérieur gauche de la caméra (non zoomée)
    const centerPosRelativeToCameraTopLeft = {
      x: layerPos.x - cameraTopLeftX,
      y: layerPos.y - cameraTopLeftY
    }

    // 2. Facteur de projection (met à l'échelle le viewport de la caméra au 1920x1080)
    const projectionScaleX = canvasWidth / viewportWidth
    const projectionScaleY = canvasHeight / viewportHeight

    // Le centre du calque projeté dans l'espace 1920x1080 (le rendu final)
    const finalPosCenter = {
      x: centerPosRelativeToCameraTopLeft.x * projectionScaleX,
      y: centerPosRelativeToCameraTopLeft.y * projectionScaleY
    }

    // 3. Calcul des dimensions FINALES du calque (après zoom et projection)

    // La nouvelle dimension affichée est l'ancienne dimension * (Facteur de projection / Zoom)
    // C'est l'échelle totale appliquée au calque.
    const layerWidthFinal = (layerWidthDisplayed * projectionScaleX) / zoom
    const layerHeightFinal = (layerHeightDisplayed * projectionScaleY) / zoom

    // Mise à jour des dimensions dans l'objet layer (utilisé par mapLayerToConfig)
    layer.width = layerWidthFinal
    layer.height = layerHeightFinal

    // 4. Position Finale (Coin Supérieur Gauche)

    // Soustraire la moitié des dimensions finales du centre projeté
    const finalPosTopLeft = {
      x: finalPosCenter.x - layerWidthFinal / 2,
      y: finalPosCenter.y - layerHeightFinal / 2
    }

    // Correction : éviter les valeurs négatives pour y (et x si besoin)
    if (finalPosTopLeft.y < 0) finalPosTopLeft.y = 0
    if (finalPosTopLeft.x < 0) finalPosTopLeft.x = 0

    return finalPosTopLeft
  }
  /**
   * Upload video to MinIO storage and return public URL
   */
  private async uploadVideoToStorage(videoPath: string): Promise<string> {
    try {
      // console.info(`[Whiteboard] Reading video file from: ${videoPath}`)
      const videoBuffer = await readFile(videoPath)

      const filename = `whiteboard_${randomUUID()}.mp4`
      // console.info(`[Whiteboard] Uploading video to MinIO storage as: ${filename}`)

      const uploadResult = await this.storageService.uploadFile(videoBuffer, filename, {
        bucket: 'EXPORTS',
        contentType: 'video/mp4',
        metadata: {
          source: 'whiteboard-animator',
          uploadedAt: new Date().toISOString()
        }
      })

      // console.info(`[Whiteboard] Video uploaded to MinIO successfully`)
      // console.info(`[Whiteboard] Public URL: ${uploadResult.url}`)

      // Clean up local video file after upload
      try {
        await unlink(videoPath)
        // console.info(`[Whiteboard] Local video file cleaned up: ${videoPath}`)
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
      //console.info(`[Whiteboard] Generated config: ${JSON.stringify(config)}`)
      await writeFile(configPath, JSON.stringify(config))
      // console.info(`[Whiteboard] Config file created: ${configPath}`)

      const preset = QUALITY_PRESETS[options.quality]
      // Crée le dossier si nécessaire
      try {
        await import('node:fs/promises').then((fs) => fs.mkdir(debugDir, { recursive: true }))
      } catch {}
      await writeFile(debugPath, JSON.stringify(config, null, 2))
      // console.info(`[Whiteboard] Debug config persisted: ${debugPath}`)

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

      // console.info(`[Whiteboard] Starting video generation with quality: ${options.quality} (${preset.description})`)

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
          // console.info(`[Whiteboard] ${output.trim()}`)

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
            // console.info(`[Whiteboard] ✅ Final video path (COMBINED): ${outputPath}`)
          } else {
            const fallbackMatch = stdoutBuffer.match(/\/.+?\.mp4/)
            if (fallbackMatch) {
              outputPath = fallbackMatch[0]
              // console.info(`[Whiteboard] 📹 Video path (fallback): ${outputPath}`)
            }
          }

          try {
            await unlink(configPath)
            // console.info(`[Whiteboard] Config file cleaned up`)
          } catch (error) {
            console.warn(`[Whiteboard] Failed to clean up config file: ${error}`)
          }

          if (code === 0 && outputPath) {
            // console.info(`[Whiteboard] Video generation completed successfully: ${outputPath}`)
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
      // console.info('[Whiteboard] Checking availability')
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
