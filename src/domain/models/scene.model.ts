import { z } from 'zod'

// ===== Shared Validation Patterns =====
const HexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/)

// ===== Position =====
const PositionSchema = z.object({
  x: z.number(),
  y: z.number()
})

// ===== Audio Configurations =====
const AudioTrackSchema = z.object({
  fileId: z.string(),
  fileName: z.string(),
  fileUrl: z.string(),
  volume: z.number().min(0).max(1),
  duration: z.number().min(0),
  startTime: z.number().min(0).optional()
})

const LayerAudioConfigSchema = z.object({
  narration: AudioTrackSchema.nullable().optional(),
  sound_effects: z.array(AudioTrackSchema).optional(),
  typewriter: AudioTrackSchema.nullable().optional(),
  drawing: AudioTrackSchema.nullable().optional()
})

// ===== Animation Configurations =====
const EntranceAnimationSchema = z.object({
  type: z.string(),
  duration: z.number().min(0).max(10),
  delay: z.number().min(0).max(10).optional(),
  easing: z.string().optional()
})

const ExitAnimationSchema = z.object({
  type: z.string(),
  duration: z.number().min(0).max(10),
  delay: z.number().min(0).max(10).optional(),
  easing: z.string().optional()
})

const DrawingAnimationConfigSchema = z.object({
  strokeRatio: z.number().min(0).max(1).optional(),
  colorTolerance: z.number().optional(),
  minRegionSize: z.number().optional(),
  fillDirection: z.enum(['diagonal', 'vertical', 'horizontal']).optional(),
  sweepSpeed: z.number().min(0.5).max(10.0).optional()
})

const HandOverlayConfigSchema = z.object({
  enabled: z.boolean().optional(),
  scale: z.number().optional(),
  offset: z.tuple([z.number(), z.number()]).optional()
})

const ShapeDrawingConfigSchema = z.object({
  lineWidth: z.number().optional(),
  lineColor: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
  fill: z.boolean().optional()
})

const TimingConfigSchema = z.object({
  transitionTime: z.number().min(0).max(10).optional(),
  pauseTime: z.number().min(0).max(30).optional(),
  maxDrawTime: z.number().min(0.1).max(30).optional()
})

const MorphingConfigSchema = z.object({
  enabled: z.boolean(),
  morph_type: z.enum(['blend', 'crossfade', 'dissolve']).optional(),
  target_layer_id: z.string().optional(),
  num_frames: z.number().optional(),
  align_method: z.enum(['center', 'mass_center', 'none']).optional(),
  hold_duration: z.number().optional(),
  path_points: z.array(z.object({ x: z.number(), y: z.number() })).optional()
})

const OcclusionEraseConfigSchema = z.object({
  duration: z.number().optional(),
  radius: z.number().optional(),
  showEraser: z.boolean().optional(),
  contentThreshold: z.number().optional()
})

// ===== Layer Schema =====
export const LayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['image', 'text', 'shape', 'video', 'audio']),
  mode: z.enum(['draw', 'static', 'animated']),
  position: PositionSchema,
  camera_position: PositionSchema.optional(),
  width: z.number().min(0),
  height: z.number().min(0),
  zIndex: z.number().int(),
  scale: z.number(),
  scaleX: z.number().optional(),
  scaleY: z.number().optional(),
  opacity: z.number().min(0).max(1),
  rotation: z.number().min(-360).max(360).optional(),
  flipX: z.boolean().optional(),
  flipY: z.boolean().optional(),
  visible: z.boolean().optional(),
  skipRate: z.number().optional(),
  imagePath: z.string().optional(),
  text: z.string().optional(),
  locked: z.boolean().optional(),
  animationType: z.string().optional(),
  animationSpeed: z.number().optional(),
  endDelay: z.number().optional(),
  handType: z.string().optional(),
  text_config: z.any().optional(),
  shape_config: z.any().optional(),
  audio_config: LayerAudioConfigSchema.optional(),
  entrance_animation: EntranceAnimationSchema.optional(),
  exit_animation: ExitAnimationSchema.optional(),
  text_animation_mode: z.enum(['typewriter', 'draw', 'fade']).optional(),
  drawing_animation_config: DrawingAnimationConfigSchema.optional(),
  hand_overlay_config: HandOverlayConfigSchema.optional(),
  shape_drawing_config: ShapeDrawingConfigSchema.optional(),
  eraser_config: z.any().optional(),
  morphing_config: MorphingConfigSchema.optional(),
  occlusionMode: z.enum(['auto', 'manual', 'none']).optional(),
  occlusionErase: OcclusionEraseConfigSchema.optional(),
  path_template: z.string().optional(),
  timingConfig: TimingConfigSchema.optional(),
  cachedImage: z.string().optional()
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

// ===== Background Configurations =====
const GridConfigSchema = z.object({
  type: z.enum(['dots', 'lines', 'squares']),
  size: z.number().min(1).max(200).optional(),
  color: HexColorSchema.optional(),
  opacity: z.number().min(0).max(1).optional()
})

const TemplateConfigSchema = z.object({
  type: z.enum(['map', 'custom']),
  url: z.string().optional(),
  opacity: z.number().min(0).max(1).optional()
})

const BackgroundConfigSchema = z.object({
  color: HexColorSchema.optional(),
  grid: GridConfigSchema.optional(),
  template: TemplateConfigSchema.optional()
})

// ===== Transition Configuration =====
const SceneTransitionSchema = z.object({
  type: z.enum(['fade', 'slide', 'none']),
  duration: z.number().min(0).max(10),
  after_slide: z.number().min(0).max(30).optional(), // Optional since not all transition types use it
  easing: z.enum(['linear', 'ease-in', 'ease-out', 'ease-in-out']).optional()
})

// ===== Eraser Configuration =====
const EraserConfigSchema = z.object({
  enabled: z.boolean(),
  detect_overlap: z.boolean().optional(),
  suggest_pre_erase: z.boolean().optional(),
  layer_specific: z.boolean().optional(),
  target_layers: z.array(z.string()).optional(),
  use_erase_mask: z.boolean().optional(),
  protected_regions: z.array(z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number()
  })).optional(),
  erase_coords: z.array(z.object({ x: z.number(), y: z.number() })).optional(),
  erase_radius: z.number().optional(),
  threshold: z.number().optional(),
  duration: z.number().min(0.1).max(10).optional(),
  delayAfterAnimations: z.number().min(0).max(5).optional(),
  pattern: z.enum(['diagonal', 'horizontal', 'vertical', 'circular']).optional(),
  radius: z.number().min(5).max(200).optional(),
  backgroundColor: z.tuple([z.number(), z.number(), z.number()]).optional(),
  showEraser: z.boolean().optional()
})

export const SceneSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  title: z.string().min(1),
  content: z.string().optional(),
  duration: z.number().int().default(10), // in seconds
  animation: z.string().default('fade'),
  // ===== Visual =====
  backgroundImage: z.string().optional(),
  backgroundColor: HexColorSchema.optional(),
  background: BackgroundConfigSchema.optional(),
  sceneImage: z.string().optional(),
  sceneWidth: z.number().int().min(320).max(7680).optional(),
  sceneHeight: z.number().int().min(180).max(4320).optional(),
  // ===== Data =====
  layers: z.array(LayerSchema).default([]),
  cameras: z.array(CameraSchema).default([]),
  sceneCameras: z.array(z.any()).default([]),
  multiTimeline: z.any().default({}),
  audio: z.any().default({}),
  sceneAudio: z.any().nullable().optional(),
  // ===== Transitions =====
  transition: SceneTransitionSchema.optional(),
  waitDurationBeforeNextScene: z.number().min(0).max(30).optional(),
  // ===== Advanced Features =====
  eraserConfig: EraserConfigSchema.optional(),
  occlusionCulling: z.boolean().optional(),
  occlusionCullingConfig: z.object({
    autoOnly: z.boolean().optional()
  }).optional(),
  // ===== DEPRECATED (kept for backward compatibility) =====
  transitionType: z.enum(['none', 'fade', 'slide']).default('fade'),
  draggingSpeed: z.number().default(1),
  slideDuration: z.number().int().default(0),
  syncSlideWithVoice: z.boolean().default(false),
  // ===== Timestamps =====
  createdAt: z.date(),
  updatedAt: z.date()
})

export type Layer = z.infer<typeof LayerSchema>
export type Camera = z.infer<typeof CameraSchema>
export type Scene = z.infer<typeof SceneSchema>
