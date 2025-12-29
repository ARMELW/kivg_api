# Backend Integration - Projection System

## Vue d'ensemble

Ce document décrit comment le backend doit intégrer le système de projection pour calculer et positionner correctement les layers (calques) sur un écran de preview donné.

## Contexte

Le frontend calcule maintenant les positions des layers projetées sur un écran de dimensions spécifiques (par exemple 1920×1080). Cette information est essentielle pour:
- Générer des previews vidéo correctes
- Exporter des images avec les bonnes positions
- Créer des rendus pour différentes résolutions
- Adapter le contenu pour différentes plateformes (YouTube, Instagram, TikTok, etc.)

## Données Frontend

### 1. Dimensions de l'écran de projection

Le frontend envoie les dimensions de l'écran de projection cible:

```json
{
  "projectionScreen": {
    "width": 1920,
    "height": 1080
  }
}
```

### 2. Layer avec camera_position

Chaque layer contient maintenant:

```json
{
  "id": "layer-123",
  "name": "Mon Layer",
  "type": "text",
  "position": {
    "x": 960,
    "y": 540
  },
  "camera_position": {
    "x": 960,
    "y": 540
  },
  "width": 300,
  "height": 80,
  "scale": 1.0,
  "opacity": 1.0
}
```

- **`position`**: Position absolue dans la scène (coordonnées de la scène)
- **`camera_position`**: Position relative à la caméra par défaut
- **`width` et `height`**: Dimensions de base du layer
- **`scale`**: Facteur d'échelle appliqué

## Calculs Backend

### 1. Échelle de projection

L'échelle pour adapter la scène à l'écran de projection:

```python
def calculate_projection_scale(
    camera_width: float,
    camera_height: float,
    screen_width: float,
    screen_height: float
) -> float:
    """
    Calcule l'échelle de projection en préservant le ratio d'aspect.
    """
    scale_x = screen_width / camera_width
    scale_y = screen_height / camera_height
    
    # Utiliser l'échelle minimale pour que tout tienne
    return min(scale_x, scale_y)
```

**Exemple**:
- Caméra: 1920×1080
- Écran: 1280×720
- `scale_x = 1280 / 1920 = 0.667`
- `scale_y = 720 / 1080 = 0.667`
- `projection_scale = 0.667`

### 2. Position projetée d'un layer

```python
def calculate_projected_position(
    layer: dict,
    camera: dict,
    scene_width: float,
    scene_height: float,
    screen_width: float,
    screen_height: float
) -> dict:
    """
    Calcule la position d'un layer sur l'écran de projection.
    """
    # 1. Calculer le viewport de la caméra (coin supérieur gauche)
    camera_viewport_x = (camera['position']['x'] * scene_width) - (camera['width'] / 2)
    camera_viewport_y = (camera['position']['y'] * scene_height) - (camera['height'] / 2)
    
    # 2. Position relative à la caméra
    relative_x = layer['position']['x'] - camera_viewport_x
    relative_y = layer['position']['y'] - camera_viewport_y
    
    # 3. Échelle de projection
    projection_scale = calculate_projection_scale(
        camera['width'],
        camera['height'],
        screen_width,
        screen_height
    )
    
    # 4. Appliquer l'échelle
    projected_x = relative_x * projection_scale
    projected_y = relative_y * projection_scale
    
    # 5. Centrage si l'écran est plus grand
    scaled_camera_width = camera['width'] * projection_scale
    scaled_camera_height = camera['height'] * projection_scale
    offset_x = (screen_width - scaled_camera_width) / 2
    offset_y = (screen_height - scaled_camera_height) / 2
    
    return {
        'x': projected_x + offset_x,
        'y': projected_y + offset_y
    }
```

### 3. Dimensions projetées

```python
def calculate_projected_dimensions(
    layer: dict,
    camera: dict,
    scene_width: float,
    scene_height: float,
    screen_width: float,
    screen_height: float
) -> dict:
    """
    Calcule les dimensions d'un layer sur l'écran de projection.
    """
    projection_scale = calculate_projection_scale(
        camera['width'],
        camera['height'],
        screen_width,
        screen_height
    )
    
    # Dimensions du layer avec son échelle
    layer_width = layer['width'] * layer.get('scale', 1.0)
    layer_height = layer['height'] * layer.get('scale', 1.0)
    
    return {
        'width': layer_width * projection_scale,
        'height': layer_height * projection_scale
    }
```

### 4. Vérification de visibilité

```python
def is_layer_visible_in_camera(
    layer: dict,
    camera: dict,
    scene_width: float,
    scene_height: float
) -> bool:
    """
    Vérifie si un layer est visible dans le viewport de la caméra.
    """
    # Viewport de la caméra
    camera_viewport_x = (camera['position']['x'] * scene_width) - (camera['width'] / 2)
    camera_viewport_y = (camera['position']['y'] * scene_height) - (camera['height'] / 2)
    camera_viewport_right = camera_viewport_x + camera['width']
    camera_viewport_bottom = camera_viewport_y + camera['height']
    
    # Bounds du layer
    layer_width = layer['width'] * layer.get('scale', 1.0)
    layer_height = layer['height'] * layer.get('scale', 1.0)
    layer_right = layer['position']['x'] + layer_width
    layer_bottom = layer['position']['y'] + layer_height
    
    # Vérifier le chevauchement
    is_overlapping = not (
        layer['position']['x'] > camera_viewport_right or
        layer_right < camera_viewport_x or
        layer['position']['y'] > camera_viewport_bottom or
        layer_bottom < camera_viewport_y
    )
    
    # Vérifier la visibilité
    is_visible = (
        is_overlapping and
        layer.get('visible', True) and
        layer.get('opacity', 1.0) > 0
    )
    
    return is_visible
```

## Endpoints API Recommandés

### 1. Générer une preview avec projection

```http
POST /api/v1/scenes/{sceneId}/preview
Content-Type: application/json

{
  "projectionScreen": {
    "width": 1920,
    "height": 1080
  },
  "format": "mp4",
  "quality": "high"
}
```

**Réponse**:
```json
{
  "previewUrl": "https://cdn.example.com/preview-abc123.mp4",
  "duration": 10.5,
  "projectedLayers": [
    {
      "layerId": "layer-123",
      "projectedPosition": { "x": 960, "y": 540 },
      "projectedDimensions": { "width": 300, "height": 80 },
      "isVisible": true
    }
  ]
}
```

### 2. Calculer les positions projetées

```http
POST /api/v1/scenes/{sceneId}/calculate-projection
Content-Type: application/json

{
  "projectionScreen": {
    "width": 1280,
    "height": 720
  }
}
```

**Réponse**:
```json
{
  "projectionScale": 0.667,
  "screenDimensions": {
    "width": 1280,
    "height": 720
  },
  "projectedLayers": [
    {
      "layerId": "layer-123",
      "name": "Text Layer",
      "originalPosition": { "x": 960, "y": 540 },
      "cameraRelativePosition": { "x": 960, "y": 540 },
      "projectedPosition": { "x": 640, "y": 360 },
      "originalDimensions": { "width": 300, "height": 80 },
      "projectedDimensions": { "width": 200, "height": 53 },
      "isVisible": true
    }
  ]
}
```

### 3. Exporter pour une plateforme spécifique

```http
POST /api/v1/scenes/{sceneId}/export
Content-Type: application/json

{
  "platform": "youtube",  // youtube, instagram, tiktok, twitter
  "resolution": "1080p"   // 720p, 1080p, 4k
}
```

Le backend utilise les dimensions prédéfinies selon la plateforme:

```python
PLATFORM_DIMENSIONS = {
    'youtube': {
        '720p': {'width': 1280, 'height': 720},
        '1080p': {'width': 1920, 'height': 1080},
        '4k': {'width': 3840, 'height': 2160}
    },
    'instagram': {
        'square': {'width': 1080, 'height': 1080},
        'story': {'width': 1080, 'height': 1920},
        'post': {'width': 1080, 'height': 1350}
    },
    'tiktok': {
        'default': {'width': 1080, 'height': 1920}
    },
    'twitter': {
        'default': {'width': 1200, 'height': 675}
    }
}
```

## Exemple d'implémentation complète

```python
from typing import Dict, List, Optional
from dataclasses import dataclass

@dataclass
class ProjectionScreen:
    width: float
    height: float

@dataclass
class ProjectedLayer:
    layer_id: str
    projected_position: Dict[str, float]
    projected_dimensions: Dict[str, float]
    is_visible: bool

class ProjectionService:
    def __init__(self):
        self.default_screen = ProjectionScreen(1920, 1080)
    
    def project_scene(
        self,
        scene: Dict,
        projection_screen: Optional[ProjectionScreen] = None
    ) -> List[ProjectedLayer]:
        """
        Projette tous les layers d'une scène sur l'écran.
        """
        if projection_screen is None:
            projection_screen = self.default_screen
        
        # Trouver la caméra par défaut
        default_camera = self._get_default_camera(scene)
        if not default_camera:
            raise ValueError("No default camera found in scene")
        
        scene_width = scene.get('sceneWidth', 1920)
        scene_height = scene.get('sceneHeight', 1080)
        
        projected_layers = []
        
        for layer in scene.get('layers', []):
            # Vérifier la visibilité
            is_visible = is_layer_visible_in_camera(
                layer,
                default_camera,
                scene_width,
                scene_height
            )
            
            if is_visible:
                # Calculer position projetée
                position = calculate_projected_position(
                    layer,
                    default_camera,
                    scene_width,
                    scene_height,
                    projection_screen.width,
                    projection_screen.height
                )
                
                # Calculer dimensions projetées
                dimensions = calculate_projected_dimensions(
                    layer,
                    default_camera,
                    scene_width,
                    scene_height,
                    projection_screen.width,
                    projection_screen.height
                )
                
                projected_layers.append(ProjectedLayer(
                    layer_id=layer['id'],
                    projected_position=position,
                    projected_dimensions=dimensions,
                    is_visible=True
                ))
        
        return projected_layers
    
    def _get_default_camera(self, scene: Dict) -> Optional[Dict]:
        """Trouve la caméra par défaut."""
        cameras = scene.get('sceneCameras', [])
        for camera in cameras:
            if camera.get('isDefault'):
                return camera
        return cameras[0] if cameras else None
    
    def generate_preview(
        self,
        scene: Dict,
        projection_screen: ProjectionScreen,
        format: str = 'mp4'
    ) -> Dict:
        """
        Génère une preview vidéo avec les layers projetés.
        """
        projected_layers = self.project_scene(scene, projection_screen)
        
        # Créer le canvas de la taille de l'écran de projection
        canvas_width = projection_screen.width
        canvas_height = projection_screen.height
        
        # Rendre chaque layer à sa position projetée
        for proj_layer in projected_layers:
            self._render_layer_on_canvas(
                layer=self._find_layer(scene, proj_layer.layer_id),
                position=proj_layer.projected_position,
                dimensions=proj_layer.projected_dimensions,
                canvas_width=canvas_width,
                canvas_height=canvas_height
            )
        
        # Encoder en vidéo
        video_url = self._encode_video(format)
        
        return {
            'previewUrl': video_url,
            'projectionScale': calculate_projection_scale(
                self._get_default_camera(scene)['width'],
                self._get_default_camera(scene)['height'],
                projection_screen.width,
                projection_screen.height
            ),
            'projectedLayers': [
                {
                    'layerId': pl.layer_id,
                    'projectedPosition': pl.projected_position,
                    'projectedDimensions': pl.projected_dimensions
                }
                for pl in projected_layers
            ]
        }
```

## Validation et Tests

### Test 1: Layer centré avec caméra centrée

```python
def test_centered_layer_centered_camera():
    scene = {
        'sceneWidth': 1920,
        'sceneHeight': 1080,
        'sceneCameras': [{
            'isDefault': True,
            'position': {'x': 0.5, 'y': 0.5},
            'width': 1920,
            'height': 1080
        }],
        'layers': [{
            'id': 'layer-1',
            'position': {'x': 960, 'y': 540},
            'width': 200,
            'height': 100,
            'scale': 1.0
        }]
    }
    
    projection_screen = ProjectionScreen(1920, 1080)
    service = ProjectionService()
    
    projected = service.project_scene(scene, projection_screen)
    
    assert len(projected) == 1
    assert projected[0].projected_position == {'x': 960, 'y': 540}
    assert projected[0].projected_dimensions == {'width': 200, 'height': 100}
```

### Test 2: Changement de résolution

```python
def test_resolution_scaling():
    scene = {
        'sceneWidth': 1920,
        'sceneHeight': 1080,
        'sceneCameras': [{
            'isDefault': True,
            'position': {'x': 0.5, 'y': 0.5},
            'width': 1920,
            'height': 1080
        }],
        'layers': [{
            'id': 'layer-1',
            'position': {'x': 960, 'y': 540},
            'width': 300,
            'height': 150,
            'scale': 1.0
        }]
    }
    
    # Test avec HD (1280×720)
    projection_screen = ProjectionScreen(1280, 720)
    service = ProjectionService()
    
    projected = service.project_scene(scene, projection_screen)
    
    # Échelle devrait être 0.667 (720 / 1080)
    assert projected[0].projected_position['x'] == pytest.approx(640, rel=1)
    assert projected[0].projected_position['y'] == pytest.approx(360, rel=1)
    assert projected[0].projected_dimensions['width'] == pytest.approx(200, rel=1)
    assert projected[0].projected_dimensions['height'] == pytest.approx(100, rel=1)
```

### Test 3: Layer hors caméra

```python
def test_layer_outside_camera():
    scene = {
        'sceneWidth': 1920,
        'sceneHeight': 1080,
        'sceneCameras': [{
            'isDefault': True,
            'position': {'x': 0.5, 'y': 0.5},
            'width': 1920,
            'height': 1080
        }],
        'layers': [{
            'id': 'layer-outside',
            'position': {'x': 3000, 'y': 2000},  # Hors caméra
            'width': 200,
            'height': 100,
            'scale': 1.0
        }]
    }
    
    projection_screen = ProjectionScreen(1920, 1080)
    service = ProjectionService()
    
    projected = service.project_scene(scene, projection_screen)
    
    # Le layer ne devrait pas être dans la liste des layers projetés
    assert len(projected) == 0
```

## Points importants

### 1. Caméra par défaut

⚠️ **Toujours utiliser la caméra avec `isDefault: true`**

```python
def get_default_camera(scene):
    for camera in scene.get('sceneCameras', []):
        if camera.get('isDefault') == True:
            return camera
    # Fallback sur la première caméra
    return scene.get('sceneCameras', [{}])[0]
```

### 2. Préservation du ratio d'aspect

L'échelle de projection **doit préserver** le ratio d'aspect:

```python
# ✅ Correct
projection_scale = min(scale_x, scale_y)

# ❌ Incorrect (déforme l'image)
projection_scale = scale_x
```

### 3. Centrage

Si l'écran de projection est plus grand que nécessaire, centrer la projection:

```python
offset_x = (screen_width - scaled_camera_width) / 2
offset_y = (screen_height - scaled_camera_height) / 2
```

### 4. Ordre des layers

Respecter l'ordre `z_index` lors du rendu:

```python
sorted_layers = sorted(
    scene['layers'],
    key=lambda l: l.get('z_index', 0)
)
```

## Résumé

✅ **Frontend fournit**: `camera_position` pour chaque layer  
✅ **Backend calcule**: Position et dimensions projetées  
✅ **Échelle**: Préserve le ratio d'aspect  
✅ **Visibilité**: Filtre les layers hors caméra  
✅ **Flexible**: Supporte toutes les résolutions  

---

**Date**: 2025-10-31  
**Version**: 1.2.0  
**Status**: ✅ Spécification complète pour intégration backend
