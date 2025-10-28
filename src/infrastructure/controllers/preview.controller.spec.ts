import { beforeAll, describe, it } from 'vitest'
import { PreviewController } from './preview.controller'

describe('PreviewController', () => {
  let previewController: PreviewController

  beforeAll(() => {
    previewController = new PreviewController()
    previewController.initRoutes()
  })

  it('should initialize preview controller', () => {
    // Basic initialization test
    // const response = await previewController.controller.request('/v1/preview/scene')
  })
})
