# Backend Update - Layer Camera Position

## Context

The frontend has been updated to include a new property `camera_position` in the Layer data structure. This property stores the layer's position **relative to the default camera viewport**, providing the backend with essential information about how the layer appears from the user's perspective.

## Frontend Changes

### 1. Layer Interface (`src/app/scenes/types.ts`)

A new optional property `camera_position` has been added to the `Layer` interface:

```typescript
export interface Position {
  x: number;
  y: number;
}

export interface Layer {
  id: string;
  name: string;
  type: LayerType;
  mode: LayerMode;
  position: Position;              // Absolute position in scene coordinates
  camera_position?: Position;      // ✅ NEW: Position relative to default camera viewport
  width: number;
  height: number;
  z_index: number;
  scale: number;
  opacity: number;
  // ... other properties
}
```

### 2. Camera Position Calculation

A new utility function `calculateCameraRelativePosition` has been added to `src/utils/cameraAnimator.ts`:

```typescript
export const calculateCameraRelativePosition = (
  layerPosition: Position,
  camera: Camera,
  sceneWidth: number = 1920,
  sceneHeight: number = 1080
): Position => {
  // Calculate camera viewport top-left corner in scene coordinates
  const cameraX = (camera.position.x * sceneWidth) - (camera.width / 2);
  const cameraY = (camera.position.y * sceneHeight) - (camera.height / 2);
  
  // Calculate layer position relative to camera viewport
  return {
    x: layerPosition.x - cameraX,
    y: layerPosition.y - cameraY,
  };
};
```

**Important**: The calculation **always uses the default camera** (identified by `isDefault: true`), not the currently selected camera.

### 3. Automatic Calculation During Layer Creation

When creating new layers (text, image, or shape), the `camera_position` is automatically calculated and stored:

```typescript
// Find the default camera
const defaultCamera = sceneCameras?.find(cam => cam.isDefault === true) || 
                      createDefaultCamera('16:9');

// Calculate camera-relative position
const cameraPosition = calculateCameraRelativePosition(
  { x: layerX, y: layerY },
  defaultCamera,
  sceneWidth,
  sceneHeight
);

// Store in layer
const newLayer = {
  // ... other properties
  position: { x: layerX, y: layerY },
  camera_position: cameraPosition
};
```

## Mathematical Explanation

### Camera Viewport Calculation

The camera's position is stored as normalized coordinates (0-1 range) representing the center point:
- `camera.position.x = 0.5` means horizontal center (50%)
- `camera.position.y = 0.5` means vertical center (50%)

To calculate the camera viewport's top-left corner in absolute scene coordinates:

```
cameraViewportX = (camera.position.x × sceneWidth) - (camera.width ÷ 2)
cameraViewportY = (camera.position.y × sceneHeight) - (camera.height ÷ 2)
```

### Layer Position Relative to Camera

The layer's camera-relative position is calculated as:

```
camera_position.x = layer.position.x - cameraViewportX
camera_position.y = layer.position.y - cameraViewportY
```

### Example Calculation

**Scenario**: Default camera at center of 1920×1080 scene
- Scene dimensions: 1920 × 1080
- Camera: position (0.5, 0.5), width 1920, height 1080
- Layer: position (960, 540)

**Camera viewport calculation**:
```
cameraViewportX = (0.5 × 1920) - (1920 ÷ 2) = 960 - 960 = 0
cameraViewportY = (0.5 × 1080) - (1080 ÷ 2) = 540 - 540 = 0
```

**Layer camera position**:
```
camera_position.x = 960 - 0 = 960
camera_position.y = 540 - 0 = 540
```

Result: Layer appears at (960, 540) in the camera viewport (centered).

## Backend Requirements

### 1. Schema Update

Update the Layer schema to accept the optional `camera_position` field:

```python
# Example with Pydantic
class Position(BaseModel):
    x: float
    y: float

class Layer(BaseModel):
    id: str
    name: str
    type: LayerType
    mode: LayerMode
    position: Position                    # Absolute scene position
    camera_position: Optional[Position] = None  # ✅ ADD THIS
    width: float
    height: float
    z_index: int
    scale: float
    opacity: float
    # ... other fields
```

### 2. Using Camera Position

The `camera_position` provides valuable information for rendering:

```python
def render_layer_in_camera_view(layer, default_camera):
    """
    Render a layer as it appears in the default camera viewport.
    """
    if layer.camera_position:
        # Use pre-calculated camera-relative position
        render_x = layer.camera_position.x
        render_y = layer.camera_position.y
    else:
        # Fallback: calculate camera-relative position manually
        camera_viewport_x = (default_camera.position.x * scene_width) - (default_camera.width / 2)
        camera_viewport_y = (default_camera.position.y * scene_height) - (default_camera.height / 2)
        render_x = layer.position.x - camera_viewport_x
        render_y = layer.position.y - camera_viewport_y
    
    # Render layer at (render_x, render_y) on the camera canvas
    # Canvas size: default_camera.width × default_camera.height
```

### 3. Identifying the Default Camera

The default camera is identified by the `isDefault` property:

```python
def get_default_camera(scene):
    """Get the default camera for a scene."""
    for camera in scene.cameras:
        if camera.get('isDefault') == True:
            return camera
    
    # Fallback: create default camera if none exists
    return {
        'id': 'default-camera',
        'name': 'Caméra Par Défaut',
        'position': {'x': 0.5, 'y': 0.5},
        'width': 1920,
        'height': 1080,
        'zoom': 1.0,
        'isDefault': True
    }
```

### 4. Migration Strategy

For existing layers without `camera_position`:

```python
def migrate_layer_camera_position(layer, default_camera, scene_width=1920, scene_height=1080):
    """Add camera_position to layers that don't have it."""
    
    if not layer.camera_position:
        # Calculate camera viewport
        camera_viewport_x = (default_camera.position.x * scene_width) - (default_camera.width / 2)
        camera_viewport_y = (default_camera.position.y * scene_height) - (default_camera.height / 2)
        
        # Calculate camera-relative position
        layer.camera_position = {
            'x': layer.position.x - camera_viewport_x,
            'y': layer.position.y - camera_viewport_y
        }
    
    return layer
```

## Example Payloads

### Text Layer with Camera Position

```json
{
  "id": "layer-1234567890",
  "name": "Texte",
  "type": "text",
  "mode": "draw",
  "position": {
    "x": 960,
    "y": 540
  },
  "camera_position": {
    "x": 960,
    "y": 540
  },
  "width": 300,
  "height": 57.6,
  "z_index": 1,
  "scale": 1.0,
  "opacity": 1.0,
  "text_config": {
    "text": "Votre texte ici",
    "font": "Arial",
    "size": 48,
    "color": [0, 0, 0]
  }
}
```

### Image Layer with Camera Position

```json
{
  "id": "layer-1234567891",
  "name": "photo.jpg",
  "type": "image",
  "mode": "draw",
  "position": {
    "x": 700,
    "y": 400
  },
  "camera_position": {
    "x": 700,
    "y": 400
  },
  "width": 1920,
  "height": 1080,
  "z_index": 1,
  "scale": 0.5,
  "opacity": 1.0,
  "image_path": "https://cdn.example.com/photo.jpg"
}
```

### Layer Outside Default Camera Viewport

```json
{
  "id": "layer-1234567892",
  "name": "Off-screen Element",
  "type": "text",
  "position": {
    "x": 2500,
    "y": 1500
  },
  "camera_position": {
    "x": 2500,
    "y": 1500
  },
  "width": 200,
  "height": 50
}
```

Note: A layer with `camera_position.x > default_camera.width` or `camera_position.y > default_camera.height` is outside the default camera's visible area.

## Benefits

### Before (without camera_position)
- Backend had to recalculate layer positions for every camera view
- Potential inconsistencies between frontend and backend calculations
- Difficult to determine which layers are visible in default camera

### After (with camera_position)
- ✅ Pre-calculated positions improve performance
- ✅ Guaranteed consistency between frontend and backend
- ✅ Easy to filter visible layers: `0 <= camera_position.x <= camera.width`
- ✅ Simplified rendering logic

## Key Points

1. **Always Relative to Default Camera**: `camera_position` is calculated using the camera with `isDefault: true`, not the currently selected camera
2. **Optional Field**: Maintains backward compatibility with existing data
3. **Absolute Coordinates**: `camera_position` values are in pixels, not normalized (0-1)
4. **Viewport Reference**: Position (0, 0) means top-left corner of the camera viewport
5. **Scene Dimensions**: Default scene size is 1920×1080 pixels

## Validation

Validate that camera positions are reasonable:

```python
def validate_layer_camera_position(layer, camera):
    """Validate layer camera position."""
    errors = []
    
    if layer.camera_position:
        # Warning if layer is far outside camera viewport
        # (may be intentional, so just warn)
        margin = 500  # pixels
        if (layer.camera_position.x < -margin or 
            layer.camera_position.x > camera.width + margin or
            layer.camera_position.y < -margin or
            layer.camera_position.y > camera.height + margin):
            errors.append(f"Warning: Layer '{layer.name}' is far outside camera viewport")
    
    return errors
```

## Testing Recommendations

1. **Test with Default Camera**: Verify layers render correctly using `camera_position`
2. **Test Backward Compatibility**: Ensure layers without `camera_position` still work
3. **Test Edge Cases**: Layers at scene boundaries, very large/small layers
4. **Test Multiple Cameras**: Verify `camera_position` is always relative to default camera

## Contact

For questions or clarifications about this implementation, please contact the frontend team or create an issue on the repository.

---

**Date**: 2025-10-31  
**Version**: 1.1.0  
**Status**: ✅ Implemented frontend, ready for backend integration
