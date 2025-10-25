import { z } from 'zod'

export const LayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['image', 'text', 'shape', 'video', 'audio']),
  mode: z.enum(['draw', 'static', 'animated']),
  position: z.object({
    x: z.number(),
    y: z.number()
  }),
  zIndex: z.number().int(),
  scale: z.number(),
  opacity: z.number().min(0).max(1),
  skipRate: z.number().optional(),
  imagePath: z.string().optional(),
  text: z.string().optional(),
  locked: z.boolean().optional(),
  animationType: z.string().optional(),
  animationSpeed: z.number().optional(),
  endDelay: z.number().optional(),
  handType: z.string().optional()
})

export const CameraSchema = z.object({
  id: z.string(),
  name: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number()
  }),
  scale: z.number().optional(),
  zoom: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  animation: z.any().optional(),
  locked: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  duration: z.number().optional(),
  transitionDuration: z.number().optional(),
  easing: z.string().optional(),
  pauseDuration: z.number().optional(),
  movementType: z.string().optional()
})

export const SceneSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  title: z.string().min(1),
  content: z.string().optional(),
  duration: z.number().int().default(10), // in seconds
  animation: z.string().default('fade'),
  backgroundImage: z.string().optional(),
  sceneImage: z.string().optional(),
  layers: z.array(LayerSchema).default([]),
  cameras: z.array(CameraSchema).default([]),
  sceneCameras: z.array(z.any()).default([]),
  multiTimeline: z.any().default({}),
  audio: z.any().default({}),
  sceneAudio: z.any().nullable().optional(),
  transitionType: z.enum(['none', 'fade', 'slide']).default('fade'),
  draggingSpeed: z.number().default(1),
  slideDuration: z.number().int().default(0),
  syncSlideWithVoice: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type Layer = z.infer<typeof LayerSchema>
export type Camera = z.infer<typeof CameraSchema>
export type Scene = z.infer<typeof SceneSchema>
