import { App } from './app'
import {
  AIUsageController,
  AssetController,
  AudioController,
  ChannelController,
  ExportController,
  PermissionController,
  PricingController,
  ProjectController,
  SceneController,
  TemplateController,
  UserController,
  UserApiKeysController
} from './infrastructure/controllers'
import { AIController } from './infrastructure/controllers/ai.controller'
import { FontController } from './infrastructure/controllers/font.controller'
import { HealthController } from './infrastructure/controllers/health.controller'
import { UploadController } from './infrastructure/controllers/upload.controller'

const app = new App([
  new UserController(),
  new UserApiKeysController(),
  new PermissionController(),
  new PricingController(),
  new UploadController(),
  new HealthController(),
  new AssetController(),
  new AudioController(),
  new ChannelController(),
  new ExportController(),
  new ProjectController(),
  new SceneController(),
  new TemplateController(),
  new AIController(),
  new AIUsageController(),
  new FontController()
]).getApp()

const PORT = Bun.env.PORT || 3000

console.info(`
\u001B[34m╔══════════════════════════════════════════════════════╗
║               \u001B[1mBOILER HONO API\u001B[0m\u001B[34m                ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║  \u001B[0m🚀 Server started successfully                   \u001B[34m║
║  \u001B[0m📡 Listening on: \u001B[36mhttp://localhost:${PORT}\u001B[34m        ║
║  \u001B[0m📚 API Docs: \u001B[36mhttp://localhost:${PORT}/docs\u001B[34m    ║
║  \u001B[0m📚 Auth Docs: \u001B[36mhttp://localhost:${PORT}/api/auth/reference\u001B[34m  ║
║                                                      ║
╚══════════════════════════════════════════════════════╝\u001B[0m
`)

export default app
