# Backend Integration - Quick Start Guide

## 🚀 Démarrage Rapide

Ce guide permet au backend de commencer l'intégration en **moins de 30 minutes**.

## 📦 Ce qu'il faut intégrer

### Priorité 1 - CRITIQUE (À faire en premier) ⚠️

#### 1. Ajouter 4 colonnes à la table `scenes`

```sql
-- Exécuter cette migration immédiatement
ALTER TABLE scenes 
  ADD COLUMN scene_width INTEGER DEFAULT 1920,
  ADD COLUMN scene_height INTEGER DEFAULT 1080,
  ADD COLUMN background JSONB DEFAULT '{}',
  ADD COLUMN eraser_config JSONB DEFAULT '{"enabled": false}';
```

#### 2. Mettre à jour tous les layers existants

```sql
-- Ajouter camera_position à tous les layers
UPDATE scenes 
SET layers = (
  SELECT jsonb_agg(
    CASE 
      WHEN layer ? 'camera_position' THEN layer
      ELSE layer || jsonb_build_object('camera_position', layer->'position')
    END
  )
  FROM jsonb_array_elements(layers) AS layer
)
WHERE jsonb_array_length(layers) > 0;
```

**Temps estimé**: 10 minutes

### Priorité 2 - IMPORTANT (Cette semaine)

#### 3. Ajouter configuration de transitions

```sql
ALTER TABLE scenes 
  ADD COLUMN transition JSONB,
  ADD COLUMN wait_duration_before_next_scene REAL DEFAULT 2.0;
```

**Temps estimé**: 5 minutes

## 🔍 Validation

### Vérifier que tout fonctionne

```sql
-- 1. Vérifier les nouvelles colonnes
SELECT 
  COUNT(*) as total,
  COUNT(scene_width) as with_width,
  COUNT(background) as with_background
FROM scenes;

-- 2. Vérifier que tous les layers ont camera_position
SELECT 
  id, title,
  (SELECT COUNT(*) FROM jsonb_array_elements(layers) AS layer WHERE NOT (layer ? 'camera_position')) as missing_camera_pos
FROM scenes
WHERE jsonb_array_length(layers) > 0
HAVING missing_camera_pos > 0;
-- Doit retourner 0 lignes
```

## 📝 Mise à jour de l'API

### Accepter les nouveaux champs

**POST/PATCH `/api/v1/scenes`** doit accepter:

```json
{
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
  },
  "transition": {
    "type": "fade",
    "duration": 0.5,
    "after_slide": 2.0
  },
  "waitDurationBeforeNextScene": 2.0,
  "eraser_config": {
    "enabled": true,
    "pattern": "diagonal",
    "duration": 2.0
  }
}
```

**PATCH `/api/v1/scenes/{id}/layers/{layerId}`** doit accepter:

```json
{
  "position": { "x": 100, "y": 200 },
  "camera_position": { "x": 100, "y": 200 },
  "rotation": 45,
  "flipX": false,
  "flipY": false,
  "scaleX": 1.2,
  "scaleY": 0.8,
  "visible": true,
  "entrance_animation": {
    "type": "fade",
    "duration": 0.8
  },
  "audio_config": {
    "narration": {
      "fileId": "audio-123",
      "fileUrl": "https://...",
      "volume": 0.8,
      "duration": 5.2
    }
  }
}
```

### Validation Minimale (Python)

```python
from pydantic import BaseModel, Field
from typing import Optional

class SceneUpdate(BaseModel):
    sceneWidth: Optional[int] = Field(None, ge=320, le=7680)
    sceneHeight: Optional[int] = Field(None, ge=180, le=4320)
    background: Optional[dict] = None
    transition: Optional[dict] = None
    waitDurationBeforeNextScene: Optional[float] = Field(None, ge=0, le=30)
    eraser_config: Optional[dict] = None

class LayerUpdate(BaseModel):
    position: Optional[dict] = None
    camera_position: Optional[dict] = None
    rotation: Optional[float] = Field(None, ge=-360, le=360)
    flipX: Optional[bool] = None
    flipY: Optional[bool] = None
    scaleX: Optional[float] = Field(None, gt=0, le=10)
    scaleY: Optional[float] = Field(None, gt=0, le=10)
    visible: Optional[bool] = None
    entrance_animation: Optional[dict] = None
    audio_config: Optional[dict] = None
```

## 🧪 Test Rapide

### 1. Créer une scène avec les nouveaux champs

```bash
curl -X POST http://localhost:8000/api/v1/projects/test-project/scenes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Scene",
    "sceneWidth": 1920,
    "sceneHeight": 1080,
    "background": {
      "color": "#ffffff"
    }
  }'
```

### 2. Vérifier qu'elle est bien sauvegardée

```bash
curl http://localhost:8000/api/v1/scenes/{scene_id}
```

Devrait retourner:
```json
{
  "id": "scene-123",
  "sceneWidth": 1920,
  "sceneHeight": 1080,
  "background": {
    "color": "#ffffff"
  }
}
```

### 3. Mettre à jour un layer

```bash
curl -X PATCH http://localhost:8000/api/v1/scenes/{scene_id}/layers/{layer_id} \
  -H "Content-Type: application/json" \
  -d '{
    "position": {"x": 500, "y": 600},
    "camera_position": {"x": 500, "y": 600},
    "rotation": 45
  }'
```

## ⚠️ Points d'Attention

### 1. `camera_position` est OBLIGATOIRE

Quand le frontend met à jour `position`, il envoie TOUJOURS `camera_position` aussi.

**❌ NE PAS accepter**:
```json
{
  "position": {"x": 500, "y": 600}
  // camera_position manquant
}
```

**✅ ACCEPTER**:
```json
{
  "position": {"x": 500, "y": 600},
  "camera_position": {"x": 500, "y": 600}
}
```

### 2. Rétrocompatibilité

Les anciens champs doivent toujours fonctionner:
- `transition_type` (string) → sera remplacé par `transition` (object)
- `slide_duration` (int) → sera remplacé par `transition.duration`

**Gérer les deux** pendant la transition:
```python
# Si ancien format
if 'transition_type' in data and not 'transition' in data:
    data['transition'] = {
        'type': data['transition_type'],
        'duration': data.get('slide_duration', 0),
        'after_slide': data.get('slide_duration', 0)
    }
```

### 3. Valeurs par défaut

Si un champ n'est pas fourni, utiliser ces valeurs:

```python
DEFAULT_VALUES = {
    'sceneWidth': 1920,
    'sceneHeight': 1080,
    'waitDurationBeforeNextScene': 2.0,
    'background': {},
    'eraser_config': {'enabled': False},
    'visible': True,  # pour les layers
    'rotation': 0,    # pour les layers
    'scale': 1.0,     # pour les layers
}
```

## 📊 Checklist Minimale

### Pour démarrer aujourd'hui
- [ ] Exécuter la migration SQL (Priorité 1)
- [ ] Vérifier que tous les layers ont `camera_position`
- [ ] Mettre à jour l'API pour accepter `sceneWidth`, `sceneHeight`
- [ ] Mettre à jour l'API pour accepter `background`
- [ ] Tester la création d'une scène avec les nouveaux champs
- [ ] Tester la mise à jour d'un layer avec `camera_position`

### Pour cette semaine
- [ ] Ajouter colonnes de transition
- [ ] Accepter `transition` et `waitDurationBeforeNextScene`
- [ ] Accepter nouveaux champs Layer: `rotation`, `flipX`, `flipY`, `scaleX`, `scaleY`, `visible`
- [ ] Accepter `entrance_animation` et `audio_config`
- [ ] Documenter les nouveaux endpoints

## 📚 Documentation Complète

Pour plus de détails:
- **[DATABASE_SCHEMA_ROADMAP.md](DATABASE_SCHEMA_ROADMAP.md)** - Plan de migration complet sur 5 sprints
- **[BACKEND_INTEGRATION_SCENE_UPDATES.md](BACKEND_INTEGRATION_SCENE_UPDATES.md)** - Guide d'intégration détaillé avec exemples

## 🆘 Besoin d'aide?

Si un champ n'est pas clair:
1. Consulter [src/app/scenes/types.ts](src/app/scenes/types.ts) pour les définitions TypeScript
2. Consulter BACKEND_INTEGRATION_SCENE_UPDATES.md pour les exemples
3. Contacter l'équipe frontend

## 🎯 Résumé

**Action immédiate** (30 minutes):
1. ✅ Migration SQL Priorité 1
2. ✅ Validation que `camera_position` est partout
3. ✅ API accepte les 4 nouveaux champs Scene

**Cette semaine** (2-3 heures):
1. ✅ Migration SQL Priorité 2
2. ✅ API accepte transitions et nouveaux champs Layer
3. ✅ Tests end-to-end

---

**Dernière mise à jour**: 2025-12-29
**Version**: 1.0.0
**Status**: 🚀 Guide de démarrage rapide
