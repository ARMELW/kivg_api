# Backend Integration Guide - Scene Updates

## 📋 Vue d'ensemble

Ce document fournit un guide complet pour l'intégration backend des nouvelles fonctionnalités de scènes. Il complète le [Database Schema Roadmap](DATABASE_SCHEMA_ROADMAP.md) en fournissant des exemples concrets d'implémentation.

## 🎯 Objectifs

1. Permettre au backend de recevoir et persister les nouvelles configurations
2. Valider les données entrantes
3. Fournir des APIs RESTful cohérentes
4. Maintenir la rétrocompatibilité

## 📡 Structure des Données Frontend

### Scene Object (Complet)

```typescript
interface Scene {
  // ===== Base Fields =====
  id: string;
  projectId: string;
  title: string;
  content: string;
  duration: number; // secondes
  animation: string; // 'fade' | 'slide' | 'zoom' | 'none'
  
  // ===== Visual =====
  backgroundImage: string | null;
  backgroundColor?: string; // hex color
  background?: BackgroundConfig; // ⚠️ NEW
  sceneImage?: string | null;
  sceneWidth?: number; // ⚠️ NEW (default: 1920)
  sceneHeight?: number; // ⚠️ NEW (default: 1080)
  
  // ===== Layers & Cameras =====
  layers: Layer[]; // voir Layer structure ci-dessous
  cameras: Camera[];
  sceneCameras: Camera[];
  multiTimeline: MultiTimeline;
  
  // ===== Audio =====
  audio: AudioConfig;
  sceneAudio?: SceneAudioConfig | null;
  
  // ===== Transitions =====
  transition_type?: string; // DEPRECATED, use transition
  transition?: SceneTransition; // ⚠️ NEW
  dragging_speed?: number;
  slide_duration?: number; // DEPRECATED, use transition.duration
  sync_slide_with_voice?: boolean;
  waitDurationBeforeNextScene?: number; // ⚠️ NEW (default: 2)
  
  // ===== Advanced Features =====
  eraser_config?: EraserConfig; // ⚠️ NEW
  occlusionCulling?: boolean; // ⚠️ NEW
  occlusionCullingConfig?: { // ⚠️ NEW
    autoOnly?: boolean;
  };
  
  // ===== Timestamps =====
  createdAt: string;
  updatedAt: string;
}
```

### BackgroundConfig (NEW)

```typescript
interface BackgroundConfig {
  color?: string; // hex color, e.g., "#ffffff"
  grid?: GridConfig;
  template?: TemplateConfig;
}

interface GridConfig {
  type: 'dots' | 'lines' | 'squares';
  size?: number; // spacing in pixels (default: 20)
  color?: string; // hex color (default: "#e0e0e0")
  opacity?: number; // 0-1 (default: 0.5)
}

interface TemplateConfig {
  type: 'map' | 'custom';
  url?: string; // URL to template image
  opacity?: number; // 0-1 (default: 0.3)
}
```

**Exemples**:

```json
{
  "background": {
    "color": "#f5f5f5",
    "grid": {
      "type": "dots",
      "size": 30,
      "color": "#cccccc",
      "opacity": 0.4
    }
  }
}
```

```json
{
  "background": {
    "template": {
      "type": "map",
      "url": "https://cdn.example.com/map-template.png",
      "opacity": 0.2
    }
  }
}
```

### SceneTransition (NEW)

```typescript
interface SceneTransition {
  after_slide: number; // délai après la fin de la slide (secondes)
  type: string; // 'fade' | 'slide' | 'none'
  duration: number; // durée de la transition (secondes)
  easing?: string; // 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
}
```

**Exemple**:
```json
{
  "transition": {
    "type": "fade",
    "duration": 0.5,
    "after_slide": 2.0,
    "easing": "ease-in-out"
  }
}
```

### EraserConfig (NEW)

```typescript
interface EraserConfig {
  enabled: boolean;
  
  // Detection settings
  detect_overlap?: boolean;
  suggest_pre_erase?: boolean;
  layer_specific?: boolean;
  target_layers?: string[]; // layer IDs
  
  // Erase mask settings
  use_erase_mask?: boolean;
  protected_regions?: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  erase_coords?: Array<{ x: number; y: number }>;
  erase_radius?: number;
  threshold?: number;
  
  // Animation settings
  duration?: number; // durée animation (default: 1.5s)
  delayAfterAnimations?: number; // délai après animations (default: 0.3s)
  pattern?: 'diagonal' | 'horizontal' | 'vertical' | 'circular';
  radius?: number; // rayon brosse (default: 30px)
  backgroundColor?: [number, number, number]; // RGB (default: [255, 255, 255])
  showEraser?: boolean; // afficher curseur effaceur (default: true)
}
```

**Exemple**:
```json
{
  "eraser_config": {
    "enabled": true,
    "pattern": "diagonal",
    "duration": 2.0,
    "delayAfterAnimations": 0.5,
    "radius": 40,
    "backgroundColor": [255, 255, 255],
    "showEraser": true
  }
}
```

## 🔷 Layer Structure (Complet)

### Layer Object

```typescript
interface Layer {
  // ===== Base =====
  id: string;
  name: string;
  type: 'image' | 'text' | 'shape' | 'video' | 'audio';
  mode: 'draw' | 'static' | 'animated';
  
  // ===== Position & Size =====
  position: { x: number; y: number };
  camera_position?: { x: number; y: number }; // ⚠️ CRITIQUE - Position relative à la caméra
  width: number;
  height: number;
  z_index: number;
  
  // ===== Transform =====
  scale: number;
  scaleX?: number; // ⚠️ NEW - Échelle X indépendante
  scaleY?: number; // ⚠️ NEW - Échelle Y indépendante
  rotation?: number; // ⚠️ NEW - Rotation en degrés
  flipX?: boolean; // ⚠️ NEW - Retournement horizontal
  flipY?: boolean; // ⚠️ NEW - Retournement vertical
  opacity: number;
  
  // ===== Visibility =====
  visible?: boolean; // ⚠️ NEW - Visibilité du layer
  locked?: boolean;
  
  // ===== Content =====
  image_path?: string;
  text?: string;
  
  // ===== Configurations =====
  text_config?: TextConfig; // ⚠️ NEW
  shape_config?: any; // ⚠️ NEW
  audio_config?: LayerAudioConfig; // ⚠️ NEW
  
  // ===== Animation =====
  skip_rate?: number;
  hand_type?: string;
  hand_overlay_config?: HandOverlayConfig; // ⚠️ NEW
  drawing_animation_config?: DrawingAnimationConfig; // ⚠️ NEW
  shape_drawing_config?: ShapeDrawingConfig; // ⚠️ NEW
  text_animation_mode?: 'typewriter' | 'draw' | 'fade'; // ⚠️ NEW
  entrance_animation?: EntranceAnimation; // ⚠️ NEW
  exit_animation?: ExitAnimation; // ⚠️ NEW
  path_template?: string; // ⚠️ NEW
  
  // ===== Advanced Features =====
  eraser_config?: EraserConfig; // ⚠️ NEW - Par layer
  morphing_config?: MorphingConfig; // ⚠️ NEW
  occlusionMode?: 'auto' | 'manual' | 'none'; // ⚠️ NEW
  occlusionErase?: OcclusionEraseConfig; // ⚠️ NEW
  
  // ===== Timing =====
  timingConfig?: { // ⚠️ NEW
    transitionTime?: number; // default: 0.5
    pauseTime?: number; // default: 0.5
    maxDrawTime?: number; // default: 3.0
  };
  
  // ===== Cache =====
  cachedImage?: string | null; // ⚠️ NEW - Image en cache (base64/url)
  
  // Extension possible
  [key: string]: any;
}
```

### Nouveaux Types de Configuration

#### EntranceAnimation

```typescript
interface EntranceAnimation {
  type: string; // 'fade' | 'slide' | 'zoom' | 'bounce' | 'none'
  duration: number; // en secondes
  delay?: number; // délai avant animation (secondes)
  easing?: string; // 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
}
```

**Exemple**:
```json
{
  "entrance_animation": {
    "type": "fade",
    "duration": 0.8,
    "delay": 0.2,
    "easing": "ease-in-out"
  }
}
```

#### ExitAnimation

```typescript
interface ExitAnimation {
  type: string;
  duration: number;
  delay?: number;
  easing?: string;
}
```

#### LayerAudioConfig

```typescript
interface LayerAudioConfig {
  narration?: AudioTrack | null; // Voice-over
  sound_effects?: AudioTrack[]; // SFX
  typewriter?: AudioTrack | null; // Son machine à écrire
  drawing?: AudioTrack | null; // Son de dessin
}

interface AudioTrack {
  fileId: string;
  fileName: string;
  fileUrl: string;
  volume: number; // 0-1
  duration: number; // secondes
  startTime?: number; // temps de début (secondes)
}
```

**Exemple**:
```json
{
  "audio_config": {
    "narration": {
      "fileId": "audio-123",
      "fileName": "narration.mp3",
      "fileUrl": "https://cdn.example.com/audio-123.mp3",
      "volume": 0.8,
      "duration": 5.2,
      "startTime": 0
    },
    "sound_effects": [
      {
        "fileId": "sfx-456",
        "fileName": "whoosh.mp3",
        "fileUrl": "https://cdn.example.com/sfx-456.mp3",
        "volume": 0.5,
        "duration": 0.8,
        "startTime": 1.2
      }
    ],
    "drawing": {
      "fileId": "draw-789",
      "fileName": "pencil.mp3",
      "fileUrl": "https://cdn.example.com/draw-789.mp3",
      "volume": 0.3,
      "duration": 3.0
    }
  }
}
```

#### DrawingAnimationConfig

```typescript
interface DrawingAnimationConfig {
  strokeRatio?: number; // 0-1, portion temps strokes vs fill (default: 0.7)
  colorTolerance?: number; // Tolérance couleur (default: 10)
  minRegionSize?: number; // Taille min région pixels (default: 50)
  fillDirection?: 'diagonal' | 'vertical' | 'horizontal'; // (default: 'diagonal')
  sweepSpeed?: number; // Vitesse sweep 0.5-10.0 (default: 1.0)
}
```

**Exemple**:
```json
{
  "drawing_animation_config": {
    "strokeRatio": 0.6,
    "colorTolerance": 15,
    "minRegionSize": 100,
    "fillDirection": "diagonal",
    "sweepSpeed": 1.5
  }
}
```

#### HandOverlayConfig

```typescript
interface HandOverlayConfig {
  enabled?: boolean; // (default: true)
  scale?: number; // Taille main (default: 0.8)
  offset?: [number, number]; // Position [x, y] (default: [-18, -22])
}
```

#### ShapeDrawingConfig

```typescript
interface ShapeDrawingConfig {
  lineWidth?: number; // Épaisseur stroke (default: 2)
  lineColor?: [number, number, number, number]; // RGBA (default: [0, 0, 0, 255])
  fill?: boolean; // Remplir forme (default: true)
}
```

#### MorphingConfig

```typescript
interface MorphingConfig {
  enabled: boolean;
  morph_type?: 'blend' | 'crossfade' | 'dissolve';
  target_layer_id?: string;
  num_frames?: number;
  align_method?: 'center' | 'mass_center' | 'none';
  hold_duration?: number;
  path_points?: Array<{ x: number; y: number }>;
}
```

#### OcclusionEraseConfig

```typescript
interface OcclusionEraseConfig {
  duration?: number; // Durée animation effacement (secondes)
  radius?: number; // Rayon effaceur (pixels)
  showEraser?: boolean; // Afficher main effacement
  contentThreshold?: number; // Seuil contenu occlusion (0-255)
}
```

## 🔌 Backend API Endpoints

### 1. Create Scene

```http
POST /api/v1/projects/{projectId}/scenes
Content-Type: application/json
Authorization: Bearer {token}

{
  "title": "Introduction Scene",
  "content": "Scene description",
  "duration": 15,
  "sceneWidth": 1920,
  "sceneHeight": 1080,
  "background": {
    "color": "#ffffff",
    "grid": {
      "type": "dots",
      "size": 20,
      "color": "#cccccc",
      "opacity": 0.4
    }
  },
  "layers": [],
  "sceneCameras": [{
    "id": "camera-default",
    "name": "Default Camera",
    "position": { "x": 0.5, "y": 0.5 },
    "width": 1920,
    "height": 1080,
    "isDefault": true
  }],
  "transition": {
    "type": "fade",
    "duration": 0.5,
    "after_slide": 2.0
  },
  "waitDurationBeforeNextScene": 2.0
}
```

**Response**:
```json
{
  "id": "scene-abc123",
  "projectId": "project-xyz",
  "title": "Introduction Scene",
  "sceneWidth": 1920,
  "sceneHeight": 1080,
  "background": { ... },
  "createdAt": "2025-12-29T12:00:00Z",
  "updatedAt": "2025-12-29T12:00:00Z"
}
```

### 2. Update Scene

```http
PATCH /api/v1/scenes/{sceneId}
Content-Type: application/json
Authorization: Bearer {token}

{
  "background": {
    "color": "#f5f5f5"
  },
  "eraser_config": {
    "enabled": true,
    "pattern": "diagonal",
    "duration": 2.0
  }
}
```

### 3. Update Layer

```http
PATCH /api/v1/scenes/{sceneId}/layers/{layerId}
Content-Type: application/json
Authorization: Bearer {token}

{
  "position": { "x": 960, "y": 540 },
  "camera_position": { "x": 960, "y": 540 },
  "rotation": 45,
  "flipX": false,
  "entrance_animation": {
    "type": "fade",
    "duration": 0.8
  },
  "audio_config": {
    "narration": {
      "fileId": "audio-123",
      "fileName": "narration.mp3",
      "fileUrl": "https://cdn.example.com/audio-123.mp3",
      "volume": 0.8,
      "duration": 5.2
    }
  }
}
```

### 4. Bulk Update Layers

```http
PATCH /api/v1/scenes/{sceneId}/layers
Content-Type: application/json
Authorization: Bearer {token}

{
  "layers": [
    {
      "id": "layer-1",
      "position": { "x": 100, "y": 200 },
      "camera_position": { "x": 100, "y": 200 }
    },
    {
      "id": "layer-2",
      "visible": false
    }
  ]
}
```

## 🛡️ Validation Backend

### Scene Validation (Python/Pydantic Example)

```python
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any, Literal
from enum import Enum

class GridType(str, Enum):
    DOTS = "dots"
    LINES = "lines"
    SQUARES = "squares"

class GridConfig(BaseModel):
    type: GridType
    size: Optional[int] = Field(default=20, ge=1, le=200)
    color: Optional[str] = Field(default="#e0e0e0", regex=r"^#[0-9A-Fa-f]{6}$")
    opacity: Optional[float] = Field(default=0.5, ge=0, le=1)

class TemplateConfig(BaseModel):
    type: Literal["map", "custom"]
    url: Optional[str] = None
    opacity: Optional[float] = Field(default=0.3, ge=0, le=1)

class BackgroundConfig(BaseModel):
    color: Optional[str] = Field(None, regex=r"^#[0-9A-Fa-f]{6}$")
    grid: Optional[GridConfig] = None
    template: Optional[TemplateConfig] = None

class SceneTransition(BaseModel):
    type: Literal["fade", "slide", "none"]
    duration: float = Field(ge=0, le=10)  # max 10 secondes
    after_slide: float = Field(ge=0, le=30)  # max 30 secondes
    easing: Optional[Literal["linear", "ease-in", "ease-out", "ease-in-out"]] = "linear"

class EraserConfig(BaseModel):
    enabled: bool
    detect_overlap: Optional[bool] = False
    suggest_pre_erase: Optional[bool] = False
    layer_specific: Optional[bool] = False
    target_layers: Optional[List[str]] = None
    duration: Optional[float] = Field(default=1.5, ge=0.1, le=10)
    delayAfterAnimations: Optional[float] = Field(default=0.3, ge=0, le=5)
    pattern: Optional[Literal["diagonal", "horizontal", "vertical", "circular"]] = "diagonal"
    radius: Optional[int] = Field(default=30, ge=5, le=200)
    backgroundColor: Optional[List[int]] = Field(default=[255, 255, 255])
    showEraser: Optional[bool] = True

class SceneCreateRequest(BaseModel):
    projectId: str
    title: str = Field(min_length=1, max_length=200)
    content: Optional[str] = None
    duration: int = Field(default=10, ge=1, le=300)  # max 5 minutes
    
    # Visual
    sceneWidth: Optional[int] = Field(default=1920, ge=320, le=7680)  # 320p to 8K
    sceneHeight: Optional[int] = Field(default=1080, ge=180, le=4320)
    background: Optional[BackgroundConfig] = None
    backgroundColor: Optional[str] = Field(None, regex=r"^#[0-9A-Fa-f]{6}$")
    backgroundImage: Optional[str] = None
    
    # Transitions
    transition: Optional[SceneTransition] = None
    waitDurationBeforeNextScene: Optional[float] = Field(default=2.0, ge=0, le=30)
    
    # Advanced
    eraser_config: Optional[EraserConfig] = None
    occlusionCulling: Optional[bool] = False
    occlusionCullingConfig: Optional[Dict[str, Any]] = None
    
    # Arrays
    layers: List[Dict[str, Any]] = Field(default_factory=list)
    cameras: List[Dict[str, Any]] = Field(default_factory=list)
    sceneCameras: List[Dict[str, Any]] = Field(default_factory=list)
    
    @validator('backgroundColor', 'background')
    def validate_background(cls, v, values):
        # Au moins un doit être défini
        if not v and not values.get('backgroundImage'):
            # OK, on utilisera la valeur par défaut
            pass
        return v

class SceneUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = None
    duration: Optional[int] = Field(None, ge=1, le=300)
    sceneWidth: Optional[int] = Field(None, ge=320, le=7680)
    sceneHeight: Optional[int] = Field(None, ge=180, le=4320)
    background: Optional[BackgroundConfig] = None
    backgroundColor: Optional[str] = Field(None, regex=r"^#[0-9A-Fa-f]{6}$")
    transition: Optional[SceneTransition] = None
    waitDurationBeforeNextScene: Optional[float] = Field(None, ge=0, le=30)
    eraser_config: Optional[EraserConfig] = None
    occlusionCulling: Optional[bool] = None
    layers: Optional[List[Dict[str, Any]]] = None
    
    class Config:
        # Permettre les updates partiels
        extra = "forbid"
```

### Layer Validation

```python
class Position(BaseModel):
    x: float
    y: float

class EntranceAnimation(BaseModel):
    type: str
    duration: float = Field(ge=0, le=10)
    delay: Optional[float] = Field(default=0, ge=0, le=10)
    easing: Optional[str] = "linear"

class AudioTrack(BaseModel):
    fileId: str
    fileName: str
    fileUrl: str
    volume: float = Field(ge=0, le=1)
    duration: float = Field(ge=0)
    startTime: Optional[float] = Field(default=0, ge=0)

class LayerAudioConfig(BaseModel):
    narration: Optional[AudioTrack] = None
    sound_effects: Optional[List[AudioTrack]] = None
    typewriter: Optional[AudioTrack] = None
    drawing: Optional[AudioTrack] = None

class TimingConfig(BaseModel):
    transitionTime: Optional[float] = Field(default=0.5, ge=0, le=10)
    pauseTime: Optional[float] = Field(default=0.5, ge=0, le=30)
    maxDrawTime: Optional[float] = Field(default=3.0, ge=0.1, le=30)

class LayerUpdateRequest(BaseModel):
    name: Optional[str] = None
    position: Optional[Position] = None
    camera_position: Optional[Position] = None  # ⚠️ IMPORTANT
    width: Optional[float] = Field(None, gt=0, le=10000)
    height: Optional[float] = Field(None, gt=0, le=10000)
    scale: Optional[float] = Field(None, gt=0, le=10)
    scaleX: Optional[float] = Field(None, gt=0, le=10)
    scaleY: Optional[float] = Field(None, gt=0, le=10)
    rotation: Optional[float] = Field(None, ge=-360, le=360)
    flipX: Optional[bool] = None
    flipY: Optional[bool] = None
    opacity: Optional[float] = Field(None, ge=0, le=1)
    visible: Optional[bool] = None
    locked: Optional[bool] = None
    z_index: Optional[int] = None
    entrance_animation: Optional[EntranceAnimation] = None
    exit_animation: Optional[EntranceAnimation] = None  # même structure
    audio_config: Optional[LayerAudioConfig] = None
    timingConfig: Optional[TimingConfig] = None
    text_animation_mode: Optional[Literal["typewriter", "draw", "fade"]] = None
    occlusionMode: Optional[Literal["auto", "manual", "none"]] = None
    
    @validator('camera_position')
    def sync_camera_position(cls, v, values):
        # Si position est mise à jour, camera_position doit l'être aussi
        if 'position' in values and values['position'] and not v:
            raise ValueError('camera_position must be provided when updating position')
        return v
```

## 🔄 Backend Service Layer (Python Example)

### SceneService

```python
from typing import Optional, Dict, Any, List
from datetime import datetime
import json

class SceneService:
    def __init__(self, db_session):
        self.db = db_session
    
    async def create_scene(
        self,
        project_id: str,
        scene_data: SceneCreateRequest
    ) -> Dict[str, Any]:
        """
        Crée une nouvelle scène avec toutes les configurations.
        """
        # Générer ID
        scene_id = generate_id()
        
        # Préparer les données pour insertion
        db_data = {
            'id': scene_id,
            'project_id': project_id,
            'title': scene_data.title,
            'content': scene_data.content,
            'duration': scene_data.duration,
            'scene_width': scene_data.sceneWidth,
            'scene_height': scene_data.sceneHeight,
            'background': json.dumps(scene_data.background.dict()) if scene_data.background else None,
            'background_color': scene_data.backgroundColor,
            'layers': json.dumps([self._prepare_layer(l) for l in scene_data.layers]),
            'scene_cameras': json.dumps(scene_data.sceneCameras),
            'transition': json.dumps(scene_data.transition.dict()) if scene_data.transition else None,
            'wait_duration_before_next_scene': scene_data.waitDurationBeforeNextScene,
            'eraser_config': json.dumps(scene_data.eraser_config.dict()) if scene_data.eraser_config else None,
            'occlusion_culling': scene_data.occlusionCulling,
            'occlusion_culling_config': json.dumps(scene_data.occlusionCullingConfig) if scene_data.occlusionCullingConfig else None,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        # Insérer en DB
        await self.db.execute(
            """
            INSERT INTO scenes (
                id, project_id, title, content, duration,
                scene_width, scene_height, background, background_color,
                layers, scene_cameras, transition,
                wait_duration_before_next_scene, eraser_config,
                occlusion_culling, occlusion_culling_config,
                created_at, updated_at
            ) VALUES (
                :id, :project_id, :title, :content, :duration,
                :scene_width, :scene_height, :background, :background_color,
                :layers, :scene_cameras, :transition,
                :wait_duration_before_next_scene, :eraser_config,
                :occlusion_culling, :occlusion_culling_config,
                :created_at, :updated_at
            )
            """,
            db_data
        )
        
        # Retourner la scène créée
        return await self.get_scene(scene_id)
    
    def _prepare_layer(self, layer: Dict[str, Any]) -> Dict[str, Any]:
        """
        Prépare un layer pour l'insertion, en s'assurant que camera_position existe.
        """
        # Si camera_position n'existe pas, calculer à partir de position
        if 'camera_position' not in layer and 'position' in layer:
            layer['camera_position'] = layer['position'].copy()
        
        # Valider les champs obligatoires
        required_fields = ['id', 'name', 'type', 'mode', 'position', 'width', 'height']
        for field in required_fields:
            if field not in layer:
                raise ValueError(f'Layer missing required field: {field}')
        
        return layer
    
    async def update_scene(
        self,
        scene_id: str,
        updates: SceneUpdateRequest
    ) -> Dict[str, Any]:
        """
        Met à jour une scène (partial update).
        """
        # Préparer les updates
        update_data = {}
        update_fields = []
        
        if updates.title is not None:
            update_data['title'] = updates.title
            update_fields.append('title = :title')
        
        if updates.sceneWidth is not None:
            update_data['scene_width'] = updates.sceneWidth
            update_fields.append('scene_width = :scene_width')
        
        if updates.sceneHeight is not None:
            update_data['scene_height'] = updates.sceneHeight
            update_fields.append('scene_height = :scene_height')
        
        if updates.background is not None:
            update_data['background'] = json.dumps(updates.background.dict())
            update_fields.append('background = :background')
        
        if updates.backgroundColor is not None:
            update_data['background_color'] = updates.backgroundColor
            update_fields.append('background_color = :background_color')
        
        if updates.transition is not None:
            update_data['transition'] = json.dumps(updates.transition.dict())
            update_fields.append('transition = :transition')
        
        if updates.eraser_config is not None:
            update_data['eraser_config'] = json.dumps(updates.eraser_config.dict())
            update_fields.append('eraser_config = :eraser_config')
        
        if updates.occlusionCulling is not None:
            update_data['occlusion_culling'] = updates.occlusionCulling
            update_fields.append('occlusion_culling = :occlusion_culling')
        
        # Toujours mettre à jour updated_at
        update_data['updated_at'] = datetime.utcnow()
        update_fields.append('updated_at = :updated_at')
        
        update_data['scene_id'] = scene_id
        
        # Exécuter l'update
        query = f"""
            UPDATE scenes 
            SET {', '.join(update_fields)}
            WHERE id = :scene_id
        """
        
        await self.db.execute(query, update_data)
        
        # Retourner la scène mise à jour
        return await self.get_scene(scene_id)
    
    async def update_layer(
        self,
        scene_id: str,
        layer_id: str,
        updates: LayerUpdateRequest
    ) -> Dict[str, Any]:
        """
        Met à jour un layer spécifique dans une scène.
        """
        # Récupérer la scène
        scene = await self.get_scene(scene_id)
        layers = scene['layers']
        
        # Trouver le layer
        layer_index = next((i for i, l in enumerate(layers) if l['id'] == layer_id), None)
        if layer_index is None:
            raise ValueError(f'Layer {layer_id} not found')
        
        # Appliquer les updates
        layer = layers[layer_index]
        update_dict = updates.dict(exclude_unset=True)
        
        # Validation spéciale pour position/camera_position
        if 'position' in update_dict:
            if 'camera_position' not in update_dict:
                # Calculer camera_position automatiquement
                update_dict['camera_position'] = update_dict['position']
        
        layer.update(update_dict)
        layers[layer_index] = layer
        
        # Mettre à jour la scène
        await self.db.execute(
            """
            UPDATE scenes 
            SET layers = :layers, updated_at = :updated_at
            WHERE id = :scene_id
            """,
            {
                'layers': json.dumps(layers),
                'updated_at': datetime.utcnow(),
                'scene_id': scene_id
            }
        )
        
        return layer
    
    async def get_scene(self, scene_id: str) -> Dict[str, Any]:
        """
        Récupère une scène complète avec toutes ses données.
        """
        result = await self.db.fetch_one(
            "SELECT * FROM scenes WHERE id = :scene_id",
            {'scene_id': scene_id}
        )
        
        if not result:
            raise ValueError(f'Scene {scene_id} not found')
        
        # Parser les champs JSON
        scene_dict = dict(result)
        json_fields = [
            'layers', 'cameras', 'scene_cameras', 'multi_timeline',
            'audio', 'scene_audio', 'background', 'transition',
            'eraser_config', 'occlusion_culling_config'
        ]
        
        for field in json_fields:
            if field in scene_dict and scene_dict[field]:
                try:
                    scene_dict[field] = json.loads(scene_dict[field])
                except:
                    pass
        
        return scene_dict
```

## 🧪 Tests Backend

### Test de Création de Scène

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_scene_with_background(client: AsyncClient):
    """Test création scène avec background configuration."""
    payload = {
        "title": "Test Scene",
        "content": "Test content",
        "duration": 10,
        "sceneWidth": 1920,
        "sceneHeight": 1080,
        "background": {
            "color": "#ffffff",
            "grid": {
                "type": "dots",
                "size": 20,
                "color": "#cccccc",
                "opacity": 0.5
            }
        }
    }
    
    response = await client.post(
        "/api/v1/projects/test-project/scenes",
        json=payload
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["sceneWidth"] == 1920
    assert data["sceneHeight"] == 1080
    assert data["background"]["color"] == "#ffffff"
    assert data["background"]["grid"]["type"] == "dots"

@pytest.mark.asyncio
async def test_update_layer_with_animations(client: AsyncClient):
    """Test mise à jour layer avec animations."""
    # Créer une scène avec un layer
    scene = await create_test_scene(client)
    layer_id = scene["layers"][0]["id"]
    
    payload = {
        "entrance_animation": {
            "type": "fade",
            "duration": 0.8,
            "delay": 0.2,
            "easing": "ease-in-out"
        },
        "audio_config": {
            "narration": {
                "fileId": "audio-123",
                "fileName": "narration.mp3",
                "fileUrl": "https://cdn.example.com/audio-123.mp3",
                "volume": 0.8,
                "duration": 5.2
            }
        },
        "rotation": 45,
        "flipX": true
    }
    
    response = await client.patch(
        f"/api/v1/scenes/{scene['id']}/layers/{layer_id}",
        json=payload
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["entrance_animation"]["type"] == "fade"
    assert data["audio_config"]["narration"]["fileId"] == "audio-123"
    assert data["rotation"] == 45
    assert data["flipX"] == True

@pytest.mark.asyncio
async def test_camera_position_sync(client: AsyncClient):
    """Test que camera_position est synchronisé avec position."""
    scene = await create_test_scene(client)
    layer_id = scene["layers"][0]["id"]
    
    # Update position seulement
    payload = {
        "position": {"x": 500, "y": 600}
    }
    
    response = await client.patch(
        f"/api/v1/scenes/{scene['id']}/layers/{layer_id}",
        json=payload
    )
    
    assert response.status_code == 400  # Devrait échouer
    assert "camera_position" in response.json()["detail"]
    
    # Update avec camera_position
    payload = {
        "position": {"x": 500, "y": 600},
        "camera_position": {"x": 500, "y": 600}
    }
    
    response = await client.patch(
        f"/api/v1/scenes/{scene['id']}/layers/{layer_id}",
        json=payload
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["position"]["x"] == 500
    assert data["camera_position"]["x"] == 500
```

## 📋 Checklist d'Intégration

### Phase 1 - Configuration de Base
- [ ] Ajouter champs `scene_width`, `scene_height` à la table
- [ ] Ajouter champ `background` (JSONB) à la table
- [ ] Ajouter champ `background_color` à la table
- [ ] Créer validation Pydantic pour `BackgroundConfig`
- [ ] Tester création/lecture de scènes avec background
- [ ] Documenter API pour background

### Phase 2 - Transitions & Eraser
- [ ] Ajouter champ `transition` (JSONB) à la table
- [ ] Ajouter champ `wait_duration_before_next_scene` à la table
- [ ] Ajouter champ `eraser_config` (JSONB) à la table
- [ ] Créer validations pour transitions et eraser
- [ ] Implémenter logique de calcul des transitions
- [ ] Tester système d'effacement

### Phase 3 - Layer Extensions
- [ ] Migrer tous les layers existants avec `camera_position`
- [ ] Valider que `camera_position` est toujours présent
- [ ] Ajouter support pour nouveaux champs Layer:
  - [ ] `rotation`, `flipX`, `flipY`
  - [ ] `scaleX`, `scaleY`
  - [ ] `visible`
  - [ ] `entrance_animation`, `exit_animation`
  - [ ] `audio_config`
  - [ ] `timingConfig`
  - [ ] `text_animation_mode`
  - [ ] `drawing_animation_config`
  - [ ] `hand_overlay_config`
  - [ ] `shape_config`, `text_config`
  - [ ] `eraser_config` (par layer)
  - [ ] `morphing_config`
  - [ ] `occlusionMode`, `occlusionErase`

### Phase 4 - Occlusion Culling
- [ ] Ajouter champs `occlusion_culling` et `occlusion_culling_config`
- [ ] Implémenter logique de détection d'occlusion
- [ ] Tester avec différentes configurations
- [ ] Optimiser performances

### Phase 5 - Tests & Documentation
- [ ] Tests unitaires pour tous les nouveaux champs
- [ ] Tests d'intégration end-to-end
- [ ] Documentation API complète
- [ ] Exemples de requêtes dans Postman/Swagger
- [ ] Guide de migration pour clients existants

## 📚 Ressources Complémentaires

- [Database Schema Roadmap](DATABASE_SCHEMA_ROADMAP.md)
- [Projection System Integration](BACKEND_PROJECTION_INTEGRATION.md)
- [Frontend Types](src/app/scenes/types.ts)

## 🆘 Support

Pour toute question sur l'intégration backend:
- Consulter ce document
- Vérifier les types TypeScript dans `src/app/scenes/types.ts`
- Consulter les exemples de validation Pydantic ci-dessus
- Contacter l'équipe frontend pour clarifications

---

**Dernière mise à jour**: 2025-12-29
**Version**: 1.0.0
**Status**: ✅ Guide complet d'intégration backend
