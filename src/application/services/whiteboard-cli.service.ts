import { randomUUID } from 'node:crypto'
import { writeFile, unlink } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import type { Scene } from '@/domain/models/scene.model'

export interface WhiteboardConfig {
  slides: Array<{
    index: number
    duration: number
    skip_rate: number
    layers: Array<{
      type: string
      image_path?: string
      z_index: number
      position: { x: number; y: number }
      scale: number
    }>
  }>
  transitions?: Array<{
    after_slide: number
    type: string
    duration: number
  }>
}

export interface WhiteboardOptions {
  quality: 'draft' | 'standard' | 'high'
  aspectRatio: '1:1' | '16:9' | '9:16'
  skipAudio?: boolean
}

export interface GenerationProgress {
  progress: number
  currentStep: string
}

const QUALITY_PRESETS = {
  draft: { quality: 28, resolution: '480p' },
  standard: { quality: 23, resolution: '720p' },
  high: { quality: 18, resolution: '1080p' }
}

export class WhiteboardCliService {
  private pythonPath: string
  private scriptPath: string

  constructor() {
    this.pythonPath = process.env.PYTHON_PATH || '/usr/bin/python3'
    this.scriptPath = process.env.WHITEBOARD_CLI_PATH || '/opt/whiteboard-it/whiteboard_animator.py'
  }

  /**
   * Generate whiteboard config from scene
   */
  generateConfig(scene: Scene): WhiteboardConfig {
    return {
      slides: scene.layers.map((layer, index) => ({
        index,
        duration: scene.duration || 3,
        skip_rate: layer.skipRate || 8,
        layers: [
          {
            type: layer.type,
            image_path: layer.imagePath,
            z_index: layer.zIndex,
            position: layer.position,
            scale: layer.scale
          }
        ]
      })),
      transitions:
        scene.transitionType !== 'none'
          ? [
              {
                after_slide: 0,
                type: scene.transitionType,
                duration: 0.5
              }
            ]
          : undefined
    }
  }

  /**
   * Execute whiteboard-cli to generate video
   */
  async execute(
    config: WhiteboardConfig,
    options: WhiteboardOptions,
    onProgress?: (progress: GenerationProgress) => void
  ): Promise<string> {
    // Write config to temp file
    const configId = randomUUID()
    const configPath = `/tmp/preview_${configId}_config.json`
    await writeFile(configPath, JSON.stringify(config))

    const preset = QUALITY_PRESETS[options.quality]
    const args = [
      this.scriptPath,
      '--config',
      configPath,
      '--quality',
      preset.quality.toString(),
      '--aspect-ratio',
      options.aspectRatio
    ]

    if (options.quality === 'draft') {
      args.push('--preview')
    }

    if (options.skipAudio) {
      args.push('--no-audio')
    }

    return new Promise((resolve, reject) => {
      const process = spawn(this.pythonPath, args)
      let outputPath = ''
      let lastProgress = 0

      process.stdout.on('data', (data) => {
        const output = data.toString()

        // Extract progress
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

        // Extract output path
        const pathMatch = output.match(/Output: (.+\.mp4)/)
        if (pathMatch) {
          outputPath = pathMatch[1]
        }

        // Extract current step
        const stepMatch = output.match(/Step: (.+)/)
        if (stepMatch) {
          onProgress?.({
            progress: lastProgress,
            currentStep: stepMatch[1]
          })
        }
      })

      process.stderr.on('data', (data) => {
        console.error('Whiteboard CLI error:', data.toString())
      })

      process.on('close', async (code) => {
        // Clean up config file
        try {
          await unlink(configPath)
        } catch {
          // Ignore cleanup errors
        }

        if (code === 0 && outputPath) {
          resolve(outputPath)
        } else {
          reject(new Error(`Whiteboard CLI exited with code ${code}`))
        }
      })

      process.on('error', (error) => {
        reject(new Error(`Failed to spawn whiteboard CLI: ${error.message}`))
      })
    })
  }

  /**
   * Check if whiteboard-cli is available
   */
  isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      const childProcess = spawn(this.pythonPath, [this.scriptPath, '--version'])
      childProcess.on('close', (code) => {
        resolve(code === 0)
      })
      childProcess.on('error', () => {
        resolve(false)
      })
    })
  }
}
