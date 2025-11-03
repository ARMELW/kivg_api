import { z } from 'zod'

// Entrance Animation Types
export const EntranceAnimationTypeSchema = z.enum([
  // Basic animations
  'fade_in',
  'fadewhite',
  'fadeblack',
  'pop',
  'appear',
  // Slide animations
  'slide_in_left',
  'slide_in_right',
  'slide_in_top',
  'slide_in_bottom',
  'slideleft',
  'slideright',
  'slideup',
  'slidedown',
  // Smooth animations
  'smoothleft',
  'smoothright',
  'smoothup',
  'smoothdown',
  // Zoom animations
  'zoom_in',
  'distance',
  // Reveal animations
  'reveal',
  'wipeleft',
  'wiperight',
  'wipeup',
  'wipedown',
  // Circular animations
  'circleopen',
  'circlecrop',
  'circleclose',
  'rectcrop',
  // Hand push animations
  'push_from_left',
  'push_from_right',
  'push_from_top',
  'push_from_bottom'
])

export const EntranceAnimationSchema = z.object({
  type: EntranceAnimationTypeSchema,
  duration: z.number().min(0.1).max(5).default(1)
})

// Transition Types
export const TransitionTypeSchema = z.enum([
  // Fade transitions
  'fade',
  'fade_to_black',
  'fade_to_white',
  'fadeblack',
  'fadewhite',
  // Push transitions
  'push_left',
  'push_right',
  'push_up',
  'push_down',
  'push_top',
  'push_bottom',
  // Wipe transitions
  'wipe',
  'wipe_left',
  'wipe_right',
  'wipe_up',
  'wipe_down',
  'wipeleft',
  'wiperight',
  'wipeup',
  'wipedown',
  // Special transitions
  'iris',
  'zoom_out_in',
  'zoom',
  'reveal',
  'slide',
  'scene_slide',
  'pan',
  'camera_move'
])

export const TransitionSchema = z.object({
  after_slide: z.number().int().min(0),
  type: TransitionTypeSchema,
  duration: z.number().min(0.1).max(3).default(0.5)
})

// Layer Animation Modes
export const LayerModeSchema = z.enum([
  'draw',
  'erase',
  'flood_fill',
  'coloriage',
  'path_follow',
  'path_follow_then_color',
  'static'
])

// Text Configuration
export const TextConfigSchema = z.object({
  text: z.string().min(1),
  font: z.string().optional().default('Arial'),
  size: z.number().int().min(1).max(500).optional().default(60),
  color: z
    .union([z.array(z.number().int().min(0).max(255)).length(3), z.string()])
    .optional()
    .default([0, 0, 0]),
  style: z.enum(['normal', 'bold', 'italic', 'bold_italic']).optional().default('normal'),
  align: z.enum(['left', 'center', 'right']).optional().default('center')
})

// Shape Configuration
export const ShapeConfigSchema = z.object({
  shape: z.enum(['rectangle', 'circle', 'triangle', 'polygon']),
  color: z
    .union([z.array(z.number().int().min(0).max(255)).length(3), z.string()])
    .optional()
    .default([0, 0, 0]),
  fill_color: z
    .union([z.array(z.number().int().min(0).max(255)).length(3), z.string()])
    .optional()
    .default([200, 200, 200]),
  stroke_width: z.number().min(0).optional().default(2),
  width: z.number().min(1).optional().default(100),
  height: z.number().min(1).optional().default(100),
  radius: z.number().min(1).optional()
})

// Layer Configuration
export const LayerConfigSchema = z.object({
  type: z.enum(['text', 'image', 'shape', 'svg']),
  text_config: TextConfigSchema.optional(),
  shape_config: ShapeConfigSchema.optional(),
  image_path: z.string().optional(),
  svg_path: z.string().optional(),
  position: z.object({
    x: z.number(),
    y: z.number()
  }),
  z_index: z.number().int().default(1),
  mode: LayerModeSchema.optional().default('draw'),
  skip_rate: z.number().int().min(1).max(20).optional().default(8),
  scale: z.number().min(0.1).max(10).optional().default(1),
  opacity: z.number().min(0).max(1).optional().default(1),
  entrance_animation: EntranceAnimationSchema.optional()
})

// Slide Configuration
export const SlideConfigSchema = z.object({
  index: z.number().int().min(0),
  duration: z.number().min(1).max(60),
  layers: z.array(LayerConfigSchema).min(1)
})

// Main Animation Configuration
export const AnimationConfigSchema = z.object({
  scene_width: z.number().int().min(640).max(7680).default(1920),
  scene_height: z.number().int().min(480).max(4320).default(1080),
  background: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i)
    .default('#FFFFFF'),
  frame_rate: z.number().int().min(24).max(60).default(30),
  slides: z.array(SlideConfigSchema).min(1),
  transitions: z.array(TransitionSchema).optional()
})

export type EntranceAnimationType = z.infer<typeof EntranceAnimationTypeSchema>
export type EntranceAnimation = z.infer<typeof EntranceAnimationSchema>
export type TransitionType = z.infer<typeof TransitionTypeSchema>
export type Transition = z.infer<typeof TransitionSchema>
export type LayerMode = z.infer<typeof LayerModeSchema>
export type TextConfig = z.infer<typeof TextConfigSchema>
export type ShapeConfig = z.infer<typeof ShapeConfigSchema>
export type LayerConfig = z.infer<typeof LayerConfigSchema>
export type SlideConfig = z.infer<typeof SlideConfigSchema>
export type AnimationConfig = z.infer<typeof AnimationConfigSchema>
