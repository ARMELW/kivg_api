import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { readFile, unlink, writeFile } from 'node:fs/promises'
import process from 'node:process'
import type { Scene } from '@/domain/models/scene.model'
import { StorageService } from './storage.service'

const WHITEBOARD_TIMEOUT_MS = 10 * 60 * 1000
// const FFMPEG_TIMEOUT_MS = 5 * 60 * 1000 // Reserved for future use
// const PROCESS_CLEANUP_DELAY_MS = 1000 // Reserved for future use

/**
 * Detect Python 3 path from system (reserved for future use with path detection)
 */
/*
function detectPythonPath(): string {
  const envPath = process.env.PYTHON_PATH
  if (envPath) {
    return envPath
  }

  // List of common Python 3 paths to try
  const commonPaths = [
    '/usr/bin/python3',
    '/usr/local/bin/python3',
    '/opt/homebrew/bin/python3', // macOS with Homebrew
    String.raw`C:\Python311\python.exe`, // Windows
    String.raw`C:\Python310\python.exe`, // Windows
    'python3', // System PATH (will be resolved by shell)
    'python' // Fallback
  ]

  // Try using 'which' (Unix-like) or 'where' (Windows)
  try {
    const cmd = process.platform === 'win32' ? 'where python' : 'which python3'
    const result = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }).trim()
    if (result) {
      return result.split('\n')[0] // Return first result if multiple
    }
  } catch {
    // which/where failed, fall through to common paths
  }

  // Try common paths
  for (const path of commonPaths) {
    try {
      execSync(`${path} --version`, { stdio: 'ignore' })
      return path
    } catch {
      // Path not found, continue to next
    }
  }

  // Default fallback
  return '/usr/bin/python3'
}
*/

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

  constructor(storageService?: StorageService) {
    this.pythonPath = 'python' //detectPythonPath()
    this.scriptPath = process.env.WHITEBOARD_CLI_PATH || '/home/armel/dev/whiteboard/animator/whiteboard_animator.py'
    this.storageService = storageService || new StorageService()
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
    let hasCompleted = false

    try {
      await writeFile(configPath, JSON.stringify(config))
      console.info(`[Whiteboard] Config file created: ${configPath}`)

      const preset = QUALITY_PRESETS[options.quality]
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

          // Extract video paths - prioritize combined.mp4 (final video)
          // Look for the actual combined video file path
          if (output.includes('combined.mp4')) {
            const pathMatch = output.match(/\/.+?combined\.mp4/)
            if (pathMatch) {
              outputPath = pathMatch[0]
              console.info(`[Whiteboard] ✅ Final video path (COMBINED): ${outputPath}`)
            }
          } else if (output.includes('.mp4') && !outputPath) {
            // Fallback: capture first .mp4 if no combined found yet
            const pathMatch = output.match(/\/.+?\.mp4/)
            if (pathMatch) {
              outputPath = pathMatch[0]
              console.info(`[Whiteboard] 📹 Intermediate video path: ${outputPath}`)
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
          // This is necessary because some final messages may be printed after the process exits
          await new Promise((resolve) => setTimeout(resolve, 200))

          hasCompleted = true
          cleanup()

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
