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

  describe('Slide-level Audio Features', () => {
    it('should support slide-level voiceover audio', () => {
      const scene: Scene = {
        id: 'test-scene',
        projectId: 'test-project',
        title: 'Slide Audio Test',
        duration: 10,
        animation: 'fade',
        layers: [],
        cameras: [],
        sceneCameras: [
          {
            id: 'camera-1',
            name: 'Camera 1',
            position: { x: 0.5, y: 0.5 },
            scale: 1,
            width: 800,
            height: 450,
            isDefault: true,
            audio: {
              file_path: 'audio/slide1_voiceover.mp3',
              volume: 0.8,
              loop: false
            }
          }
        ],
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
      expect(config.slides[0].audio).toBeDefined()
      expect(config.slides[0].audio?.file_path).toBe('audio/slide1_voiceover.mp3')
      expect(config.slides[0].audio?.volume).toBe(0.8)
      expect(config.slides[0].audio?.loop).toBe(false)
    })

    it('should support typewriter audio effect', () => {
      const scene: Scene = {
        id: 'test-scene',
        projectId: 'test-project',
        title: 'Typewriter Audio Test',
        duration: 10,
        animation: 'fade',
        layers: [],
        cameras: [],
        sceneCameras: [
          {
            id: 'camera-1',
            name: 'Camera 1',
            position: { x: 0.5, y: 0.5 },
            scale: 1,
            width: 800,
            height: 450,
            isDefault: true,
            audio: {
              typewriter: {
                start_time: 1,
                num_characters: 50,
                char_interval: 0.08,
                volume: 0.4
              }
            }
          }
        ],
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

      expect(config.slides[0].audio).toBeDefined()
      expect(config.slides[0].audio?.typewriter).toBeDefined()
      expect(config.slides[0].audio?.typewriter?.start_time).toBe(1)
      expect(config.slides[0].audio?.typewriter?.num_characters).toBe(50)
      expect(config.slides[0].audio?.typewriter?.char_interval).toBe(0.08)
      expect(config.slides[0].audio?.typewriter?.volume).toBe(0.4)
    })

    it('should support drawing sound effect', () => {
      const scene: Scene = {
        id: 'test-scene',
        projectId: 'test-project',
        title: 'Drawing Sound Test',
        duration: 12,
        animation: 'fade',
        layers: [],
        cameras: [],
        sceneCameras: [
          {
            id: 'camera-1',
            name: 'Camera 1',
            position: { x: 0.5, y: 0.5 },
            scale: 1,
            width: 800,
            height: 450,
            isDefault: true,
            audio: {
              drawing_sound: {
                start_time: 0,
                duration: 8,
                volume: 0.25
              }
            }
          }
        ],
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

      expect(config.slides[0].audio).toBeDefined()
      expect(config.slides[0].audio?.drawing_sound).toBeDefined()
      expect(config.slides[0].audio?.drawing_sound?.start_time).toBe(0)
      expect(config.slides[0].audio?.drawing_sound?.duration).toBe(8)
      expect(config.slides[0].audio?.drawing_sound?.volume).toBe(0.25)
    })

    it('should support voice-overs array', () => {
      const scene: Scene = {
        id: 'test-scene',
        projectId: 'test-project',
        title: 'Voice-overs Test',
        duration: 10,
        animation: 'fade',
        layers: [],
        cameras: [],
        sceneCameras: [
          {
            id: 'camera-1',
            name: 'Camera 1',
            position: { x: 0.5, y: 0.5 },
            scale: 1,
            width: 800,
            height: 450,
            isDefault: true,
            audio: {
              voice_overs: [
                {
                  path: 'audio/slide2_narration.mp3',
                  start_time: 0,
                  volume: 0.9
                }
              ]
            }
          }
        ],
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

      expect(config.slides[0].audio).toBeDefined()
      expect(config.slides[0].audio?.voice_overs).toBeDefined()
      expect(config.slides[0].audio?.voice_overs).toHaveLength(1)
      expect(config.slides[0].audio?.voice_overs![0].path).toBe('audio/slide2_narration.mp3')
      expect(config.slides[0].audio?.voice_overs![0].start_time).toBe(0)
      expect(config.slides[0].audio?.voice_overs![0].volume).toBe(0.9)
    })

    it('should support slide-level sound effects', () => {
      const scene: Scene = {
        id: 'test-scene',
        projectId: 'test-project',
        title: 'Slide Sound Effects Test',
        duration: 12,
        animation: 'fade',
        layers: [],
        cameras: [],
        sceneCameras: [
          {
            id: 'camera-1',
            name: 'Camera 1',
            position: { x: 0.5, y: 0.5 },
            scale: 1,
            width: 800,
            height: 450,
            isDefault: true,
            audio: {
              sound_effects: [
                {
                  path: 'audio/pencil_start.wav',
                  start_time: 0,
                  volume: 0.5
                },
                {
                  path: 'audio/pencil_finish.wav',
                  start_time: 7.5,
                  volume: 0.5
                }
              ]
            }
          }
        ],
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

      expect(config.slides[0].audio).toBeDefined()
      expect(config.slides[0].audio?.sound_effects).toBeDefined()
      expect(config.slides[0].audio?.sound_effects).toHaveLength(2)
      expect(config.slides[0].audio?.sound_effects![0].path).toBe('audio/pencil_start.wav')
      expect(config.slides[0].audio?.sound_effects![0].start_time).toBe(0)
      expect(config.slides[0].audio?.sound_effects![1].path).toBe('audio/pencil_finish.wav')
      expect(config.slides[0].audio?.sound_effects![1].start_time).toBe(7.5)
    })

    it('should support combined slide audio features', () => {
      const scene: Scene = {
        id: 'test-scene',
        projectId: 'test-project',
        title: 'Combined Slide Audio Test',
        duration: 8,
        animation: 'fade',
        layers: [],
        cameras: [],
        sceneCameras: [
          {
            id: 'camera-1',
            name: 'Camera 1',
            position: { x: 0.5, y: 0.5 },
            scale: 1,
            width: 800,
            height: 450,
            isDefault: true,
            audio: {
              typewriter: {
                start_time: 1,
                num_characters: 35,
                char_interval: 0.1,
                volume: 0.35
              },
              drawing_sound: {
                start_time: 0,
                duration: 2,
                volume: 0.2
              },
              voice_overs: [
                {
                  path: 'audio/final_message.mp3',
                  start_time: 0,
                  volume: 0.9
                }
              ],
              sound_effects: [
                {
                  path: 'audio/magic_sparkle.wav',
                  start_time: 5,
                  volume: 0.7
                }
              ]
            }
          }
        ],
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

      expect(config.slides[0].audio).toBeDefined()

      // Check typewriter
      expect(config.slides[0].audio?.typewriter).toBeDefined()
      expect(config.slides[0].audio?.typewriter?.num_characters).toBe(35)

      // Check drawing sound
      expect(config.slides[0].audio?.drawing_sound).toBeDefined()
      expect(config.slides[0].audio?.drawing_sound?.duration).toBe(2)

      // Check voice-overs
      expect(config.slides[0].audio?.voice_overs).toHaveLength(1)
      expect(config.slides[0].audio?.voice_overs![0].path).toBe('audio/final_message.mp3')

      // Check sound effects
      expect(config.slides[0].audio?.sound_effects).toHaveLength(1)
      expect(config.slides[0].audio?.sound_effects![0].path).toBe('audio/magic_sparkle.wav')
    })
  })

  describe('Layer-level Sound Effects', () => {
    it('should support sound effects on text layers', () => {
      const scene: Scene = {
        id: 'test-scene',
        projectId: 'test-project',
        title: 'Layer Sound Effects Test',
        duration: 8,
        animation: 'fade',
        layers: [
          {
            id: 'layer-1',
            name: 'Text with sounds',
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
              font: 'DejaVuSans',
              size: 64,
              color: '#0066CC',
              align: 'center',
              style: 'bold'
            },
            audio: {
              sound_effects: [
                {
                  path: 'audio/text_pop.wav',
                  start_time: 0.5,
                  volume: 0.7,
                  duration: 0.3
                }
              ]
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
      const textLayer = config.slides[0].layers![0]
      expect(textLayer.audio).toBeDefined()
      expect(textLayer.audio?.sound_effects).toBeDefined()
      expect(textLayer.audio?.sound_effects).toHaveLength(1)
      expect(textLayer.audio?.sound_effects![0].path).toBe('audio/text_pop.wav')
      expect(textLayer.audio?.sound_effects![0].start_time).toBe(0.5)
      expect(textLayer.audio?.sound_effects![0].volume).toBe(0.7)
      expect(textLayer.audio?.sound_effects![0].duration).toBe(0.3)
    })

    it('should support multiple sound effects on a layer', () => {
      const scene: Scene = {
        id: 'test-scene',
        projectId: 'test-project',
        title: 'Multiple Sound Effects Test',
        duration: 10,
        animation: 'fade',
        layers: [
          {
            id: 'layer-1',
            name: 'Text with multiple sounds',
            type: 'text',
            mode: 'draw',
            position: { x: 100, y: 250 },
            camera_position: { x: 100, y: 250 },
            width: 200,
            height: 50,
            zIndex: 1,
            scale: 1,
            opacity: 1,
            text_config: {
              text: 'Amazing Effect',
              font: 'DejaVuSans',
              size: 58,
              color: '#9900CC',
              align: 'center',
              style: 'bold'
            },
            audio: {
              sound_effects: [
                {
                  path: 'audio/impact_1.wav',
                  start_time: 0.5,
                  volume: 0.6,
                  duration: 0.4
                },
                {
                  path: 'audio/impact_2.wav',
                  start_time: 3,
                  volume: 0.6,
                  duration: 0.4
                },
                {
                  path: 'audio/final_ding.wav',
                  start_time: 6,
                  volume: 0.8
                }
              ]
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
      expect(textLayer.audio?.sound_effects).toHaveLength(3)
      expect(textLayer.audio?.sound_effects![0].path).toBe('audio/impact_1.wav')
      expect(textLayer.audio?.sound_effects![1].path).toBe('audio/impact_2.wav')
      expect(textLayer.audio?.sound_effects![2].path).toBe('audio/final_ding.wav')
    })

    it('should support sound effects on shape layers', () => {
      const scene: Scene = {
        id: 'test-scene',
        projectId: 'test-project',
        title: 'Shape Sound Effects Test',
        duration: 12,
        animation: 'fade',
        layers: [
          {
            id: 'layer-1',
            name: 'Shape with sound',
            type: 'shape',
            mode: 'draw',
            position: { x: 200, y: 200 },
            camera_position: { x: 200, y: 200 },
            width: 100,
            height: 100,
            zIndex: 1,
            scale: 1,
            opacity: 1,
            shape_config: {
              color: '#00CC66',
              fill_color: '#cccccc'
            },
            audio: {
              sound_effects: [
                {
                  path: 'audio/swoosh.wav',
                  start_time: 1,
                  volume: 0.7,
                  duration: 0.5
                }
              ]
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

      const shapeLayer = config.slides[0].layers![0]
      expect(shapeLayer.audio).toBeDefined()
      expect(shapeLayer.audio?.sound_effects).toHaveLength(1)
      expect(shapeLayer.audio?.sound_effects![0].path).toBe('audio/swoosh.wav')
    })
  })
})
