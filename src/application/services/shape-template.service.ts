import { spawn } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'

export interface TemplateGenerationResult {
  success: boolean
  templatePath?: string
  error?: string
}

export class ShapeTemplateService {
  private pythonPath: string
  private scriptPath: string
  private templatesDir: string

  constructor() {
    this.pythonPath = process.env.PYTHON_PATH || 'python'
    const rootDir = process.env.NODE_ENV === 'production' ? '/usr/src/app' : process.cwd()
    this.scriptPath = process.env.PATH_TEMPLATE_CLI_PATH || ''
    this.templatesDir = join(rootDir, 'uploads', 'shape-templates')

    // Ensure templates directory exists
    if (!existsSync(this.templatesDir)) {
      mkdirSync(this.templatesDir, { recursive: true })
    }
  }

  /**
   * Generate a template JSON from an SVG file
   * @param svgPath - Path to the SVG file
   * @param width - Target width for the shape
   * @param height - Target height for the shape
   * @returns Promise with the result containing template path or error
   */
  async generateTemplate(svgPath: string, width: number, height: number): Promise<TemplateGenerationResult> {
    try {
      // Generate unique template filename based on SVG filename
      const timestamp = Date.now()
      const templateFilename = `svg_shape_template_${timestamp}.json`
      const templatePath = join(this.templatesDir, templateFilename)

      // Execute Python script
      const result = await this.executePythonScript(svgPath, templatePath, width, height)

      if (result.success) {
        return {
          success: true,
          templatePath
        }
      }

      return result
    } catch (error: any) {
      return {
        success: false,
        error: `Template generation failed: ${error.message}`
      }
    }
  }

  /**
   * Execute the Python script to generate template
   */
  private executePythonScript(
    svgPath: string,
    templatePath: string,
    width: number,
    height: number
  ): Promise<TemplateGenerationResult> {
    return new Promise((resolve) => {
      const args = ['create', svgPath, templatePath.toString(), width.toString(), height.toString()]

      const child = spawn(this.pythonPath, [this.scriptPath, ...args])

      let stdout = ''
      let stderr = ''

      child.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      child.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      child.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            templatePath
          })
        } else {
          resolve({
            success: false,
            error: stderr || stdout || `Script exited with code ${code}`
          })
        }
      })

      child.on('error', (error) => {
        resolve({
          success: false,
          error: `Failed to execute script: ${error.message}`
        })
      })

      // Timeout after 30 seconds
      setTimeout(() => {
        if (!child.killed) {
          child.kill()
          resolve({
            success: false,
            error: 'Template generation timeout'
          })
        }
      }, 30000)
    })
  }

  /**
   * Check if the Python script is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      if (!existsSync(this.scriptPath)) {
        console.warn(`Python script not found at: ${this.scriptPath}`)
        return false
      }

      return await new Promise((resolve) => {
        const child = spawn(this.pythonPath, ['--version'])
        child.on('close', (code) => {
          resolve(code === 0)
        })
        child.on('error', () => {
          resolve(false)
        })
      })
    } catch {
      return false
    }
  }
}
