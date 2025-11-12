import { beforeEach, describe, expect, it } from 'vitest'
import type { Scene } from '@/domain/models/scene.model'
import { WhiteboardCliService } from './whiteboard-cli.service'

describe('WhiteboardCliService', () => {
  let service: WhiteboardCliService

  beforeEach(() => {
    service = new WhiteboardCliService()
  })

  describe('RTL Text Support', () => {
    it('should support RTL direction in text_config', () => {
      const scene: Scene = {
        id: 'test-scene',
        projectId: 'test-project',
        title: 'RTL Test Scene',
        duration: 10,
        animation: 'fade',
        layers: [
          {
            id: 'layer-1',
            name: 'Arabic Text',
            type: 'text',
            mode: 'draw',
            position: { x: 100, y: 100 },
            camera_position: { x: 100, y: 100 },
            width: 200,
            height: 50,
            zIndex: 1,
            scale: 1,
            opacity: 1,
            text_config: {
              text: 'مرحبا بالعالم',
              font: 'Arial',
              size: 24,
              color: '#000000',
              align: 'right',
              style: 'normal',
              direction: 'rtl' as 'rtl' | 'ltr',
              draw_mode: 'rtl' as 'rtl' | 'ltr'
            }
          }
        ],
        cameras: [],
        sceneCameras: [],
        multiTimeline: {},
        audio: {},
        transitionType: 'none',
        draggingSpeed: 1,
        slideDuration: 0,
        syncSlideWithVoice: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const config = service.generateConfig(scene)

      expect(config.slides).toHaveLength(1)
      expect(config.slides[0].layers).toHaveLength(1)

      const textLayer = config.slides[0].layers![0]
      expect(textLayer.type).toBe('text')
      expect(textLayer.text_config?.text).toBe('مرحبا بالعالم')
      expect(textLayer.text_config?.direction).toBe('rtl')
      expect(textLayer.text_config?.draw_mode).toBe('rtl')
      expect(textLayer.text_config?.align).toBe('right')
    })

    it('should default to LTR when direction is not specified', () => {
      const scene: Scene = {
        id: 'test-scene',
        projectId: 'test-project',
        title: 'Default Direction Test',
        duration: 10,
        animation: 'fade',
        layers: [
          {
            id: 'layer-1',
            name: 'English Text',
            type: 'text',
            mode: 'draw',
            position: { x: 100, y: 100 },
            camera_position: { x: 100, y: 100 },
            width: 200,
            height: 50,
            zIndex: 1,
            scale: 1,
            opacity: 1,
            text_config: {
              text: 'Hello World',
              font: 'Arial',
              size: 24,
              color: '#000000',
              align: 'left',
              style: 'normal'
            }
          }
        ],
        cameras: [],
        sceneCameras: [],
        multiTimeline: {},
        audio: {},
        transitionType: 'none',
        draggingSpeed: 1,
        slideDuration: 0,
        syncSlideWithVoice: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const config = service.generateConfig(scene)

      const textLayer = config.slides[0].layers![0]
      expect(textLayer.text_config?.direction).toBe('ltr')
      expect(textLayer.text_config?.draw_mode).toBe('ltr')
    })
  })

  describe('Audio Management', () => {
    it('should include audio configuration from sceneAudio', () => {
      const scene: Scene = {
        id: 'test-scene',
        projectId: 'test-project',
        title: 'Audio Test Scene',
        duration: 10,
        animation: 'fade',
        layers: [],
        cameras: [],
        sceneCameras: [],
        multiTimeline: {},
        audio: {},
        sceneAudio: {
          fileUrl: 'https://example.com/audio.mp3',
          volume: 0.8,
          trimConfig: {
            startTime: 5,
            endTime: 15
          },
          fadeConfig: {
            fadeIn: 1,
            fadeOut: 2
          },
          loop: false
        },
        transitionType: 'none',
        draggingSpeed: 1,
        slideDuration: 0,
        syncSlideWithVoice: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const config = service.generateConfig(scene)

      expect(config.audio).toBeDefined()
      expect(config.audio?.file_path).toBe('https://example.com/audio.mp3')
      expect(config.audio?.volume).toBe(0.8)
      expect(config.audio?.start_time).toBe(5)
      expect(config.audio?.end_time).toBe(15)
      expect(config.audio?.fade_in).toBe(1)
      expect(config.audio?.fade_out).toBe(2)
      expect(config.audio?.loop).toBe(false)
    })

    it('should handle legacy audio format', () => {
      const scene: Scene = {
        id: 'test-scene',
        projectId: 'test-project',
        title: 'Legacy Audio Test',
        duration: 10,
        animation: 'fade',
        layers: [],
        cameras: [],
        sceneCameras: [],
        multiTimeline: {},
        audio: {
          file_path: 'https://example.com/legacy-audio.mp3',
          volume: 1,
          start_time: 0,
          fade_in: 0.5
        },
        transitionType: 'none',
        draggingSpeed: 1,
        slideDuration: 0,
        syncSlideWithVoice: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const config = service.generateConfig(scene)

      expect(config.audio).toBeDefined()
      expect(config.audio?.file_path).toBe('https://example.com/legacy-audio.mp3')
      expect(config.audio?.volume).toBe(1)
      expect(config.audio?.start_time).toBe(0)
      expect(config.audio?.fade_in).toBe(0.5)
    })

    it('should not include audio config when no audio is present', () => {
      const scene: Scene = {
        id: 'test-scene',
        projectId: 'test-project',
        title: 'No Audio Test',
        duration: 10,
        animation: 'fade',
        layers: [],
        cameras: [],
        sceneCameras: [],
        multiTimeline: {},
        audio: {},
        transitionType: 'none',
        draggingSpeed: 1,
        slideDuration: 0,
        syncSlideWithVoice: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const config = service.generateConfig(scene)

      expect(config.audio).toBeUndefined()
    })

    it('should support audio layers', () => {
      const scene: Scene = {
        id: 'test-scene',
        projectId: 'test-project',
        title: 'Audio Layer Test',
        duration: 10,
        animation: 'fade',
        layers: [
          {
            id: 'audio-layer-1',
            name: 'Background Music',
            type: 'audio',
            mode: 'static',
            position: { x: 0, y: 0 },
            camera_position: { x: 0, y: 0 },
            width: 0,
            height: 0,
            zIndex: 0,
            scale: 1,
            opacity: 1,
            audio_config: {
              file_path: 'https://example.com/music.mp3',
              volume: 0.6,
              start_time: 2,
              end_time: 12,
              fade_in: 1.5,
              fade_out: 2.5,
              loop: true
            }
          }
        ],
        cameras: [],
        sceneCameras: [],
        multiTimeline: {},
        audio: {},
        transitionType: 'none',
        draggingSpeed: 1,
        slideDuration: 0,
        syncSlideWithVoice: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const config = service.generateConfig(scene)

      expect(config.slides[0].layers).toHaveLength(1)

      const audioLayer = config.slides[0].layers![0]
      expect(audioLayer.type).toBe('audio')
      expect(audioLayer.audio_config?.file_path).toBe('https://example.com/music.mp3')
      expect(audioLayer.audio_config?.volume).toBe(0.6)
      expect(audioLayer.audio_config?.start_time).toBe(2)
      expect(audioLayer.audio_config?.end_time).toBe(12)
      expect(audioLayer.audio_config?.fade_in).toBe(1.5)
      expect(audioLayer.audio_config?.fade_out).toBe(2.5)
      expect(audioLayer.audio_config?.loop).toBe(true)
    })

    it('should support audio layers with trimConfig and fadeConfig fallback', () => {
      const scene: Scene = {
        id: 'test-scene',
        projectId: 'test-project',
        title: 'Audio Layer Fallback Test',
        duration: 10,
        animation: 'fade',
        layers: [
          {
            id: 'audio-layer-1',
            name: 'Background Music',
            type: 'audio',
            mode: 'static',
            position: { x: 0, y: 0 },
            camera_position: { x: 0, y: 0 },
            width: 0,
            height: 0,
            zIndex: 0,
            scale: 1,
            opacity: 1,
            fileUrl: 'https://example.com/music2.mp3',
            trimConfig: {
              startTime: 3,
              endTime: 10
            },
            fadeConfig: {
              fadeIn: 0.5,
              fadeOut: 1
            }
          }
        ],
        cameras: [],
        sceneCameras: [],
        multiTimeline: {},
        audio: {},
        transitionType: 'none',
        draggingSpeed: 1,
        slideDuration: 0,
        syncSlideWithVoice: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const config = service.generateConfig(scene)

      const audioLayer = config.slides[0].layers![0]
      expect(audioLayer.audio_config?.file_path).toBe('https://example.com/music2.mp3')
      expect(audioLayer.audio_config?.start_time).toBe(3)
      expect(audioLayer.audio_config?.end_time).toBe(10)
      expect(audioLayer.audio_config?.fade_in).toBe(0.5)
      expect(audioLayer.audio_config?.fade_out).toBe(1)
    })
  })

  describe('Combined RTL and Audio', () => {
    it('should support both RTL text and audio in the same scene', () => {
      const scene: Scene = {
        id: 'test-scene',
        projectId: 'test-project',
        title: 'Combined Test Scene',
        duration: 10,
        animation: 'fade',
        layers: [
          {
            id: 'text-layer',
            name: 'Arabic Text',
            type: 'text',
            mode: 'draw',
            position: { x: 100, y: 100 },
            camera_position: { x: 100, y: 100 },
            width: 200,
            height: 50,
            zIndex: 1,
            scale: 1,
            opacity: 1,
            text_config: {
              text: 'مرحبا',
              font: 'Arial',
              size: 32,
              color: '#000000',
              align: 'right',
              style: 'bold',
              direction: 'rtl' as 'rtl' | 'ltr',
              draw_mode: 'rtl' as 'rtl' | 'ltr'
            }
          },
          {
            id: 'audio-layer',
            name: 'Voiceover',
            type: 'audio',
            mode: 'static',
            position: { x: 0, y: 0 },
            camera_position: { x: 0, y: 0 },
            width: 0,
            height: 0,
            zIndex: 0,
            scale: 1,
            opacity: 1,
            audio_config: {
              file_path: 'https://example.com/voiceover.mp3',
              volume: 0.9
            }
          }
        ],
        cameras: [],
        sceneCameras: [],
        multiTimeline: {},
        audio: {},
        sceneAudio: {
          fileUrl: 'https://example.com/background.mp3',
          volume: 0.3
        },
        transitionType: 'fade',
        draggingSpeed: 1,
        slideDuration: 0,
        syncSlideWithVoice: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const config = service.generateConfig(scene)

      // Check RTL text layer
      const textLayer = config.slides[0].layers!.find((l) => l.type === 'text')
      expect(textLayer?.text_config?.direction).toBe('rtl')
      expect(textLayer?.text_config?.draw_mode).toBe('rtl')
      expect(textLayer?.text_config?.align).toBe('right')

      // Check audio layer
      const audioLayer = config.slides[0].layers!.find((l) => l.type === 'audio')
      expect(audioLayer?.audio_config?.file_path).toBe('https://example.com/voiceover.mp3')
      expect(audioLayer?.audio_config?.volume).toBe(0.9)

      // Check scene audio
      expect(config.audio?.file_path).toBe('https://example.com/background.mp3')
      expect(config.audio?.volume).toBe(0.3)
    })
  })
})
