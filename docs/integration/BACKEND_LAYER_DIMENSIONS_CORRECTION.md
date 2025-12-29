# Correction Backend - Propriétés Width & Height des Layers

## Contexte

Le frontend a été mis à jour pour inclure les propriétés `width` et `height` dans les données des layers (calques) stockées dans le Zustand store. Ces propriétés sont nécessaires pour que le backend puisse correctement traiter et générer les vidéos d'animation.

## Modifications Frontend Effectuées

### 1. Interface Layer (`src/app/scenes/types.ts`)

Les propriétés `width` et `height` ont été ajoutées à l'interface `Layer` :

```typescript
export interface Layer {
  id: string;
  name: string;
  type: LayerType;
  mode: LayerMode;
  position: Position;
  width?: number;        // ✅ AJOUTÉ
  height?: number;       // ✅ AJOUTÉ
  z_index: number;
  scale: number;
  opacity: number;
  // ... autres propriétés
}
```

### 2. Création des Layers (`src/components/molecules/layer-management/useLayerCreation.ts`)

Tous les types de layers sont maintenant créés avec des dimensions appropriées :

#### Text Layer (Calque Texte)
```typescript
{
  id: "layer-xxx",
  name: "Texte",
  type: "text",
  position: { x: 960, y: 540 },
  width: 300,      // ✅ Calculé en fonction du texte et de la police
  height: 57.6,    // ✅ Calculé en fonction du fontSize et lineHeight
  scale: 1.0,
  // ...
  text_config: {
    text: "Votre texte ici",
    font: "Arial",
    size: 48,
    // ...
  }
}
```

**Calcul des dimensions du texte :**
- `width` = longueur du texte × (fontSize × 0.6)
- `height` = nombre de lignes × fontSize × lineHeight (1.2 par défaut)

#### Image Layer (Calque Image)
```typescript
{
  id: "layer-xxx",
  name: "image.png",
  type: "image",
  position: { x: 700, y: 400 },
  width: 1920,     // ✅ Dimensions originales de l'image
  height: 1080,    // ✅ Dimensions originales de l'image
  scale: 0.8,      // Échelle appliquée pour l'affichage
  image_path: "https://...",
  // ...
}
```

**Important :** 
- `width` et `height` représentent les dimensions **originales** de l'image
- `scale` représente le facteur d'échelle appliqué pour l'affichage
- Dimensions réelles affichées = width × scale, height × scale

#### Shape Layer (Calque Forme)
```typescript
{
  id: "layer-xxx",
  name: "Rectangle",
  type: "shape",
  position: { x: 800, y: 450 },
  width: 200,      // ✅ Largeur de base de la forme
  height: 150,     // ✅ Hauteur de base de la forme
  scale: 1.0,
  shape_config: {
    type: "rectangle",
    width: 200,
    height: 150,
    // ...
  }
  // ...
}
```

**Pour les formes circulaires :**
- `width` = `height` = `radius × 2`

## Modifications Backend Requises

### 1. Validation du Schéma

Le backend doit accepter les propriétés `width` et `height` optionnelles dans le schéma Layer :

```python
# Exemple avec Pydantic
class Layer(BaseModel):
    id: str
    name: str
    type: LayerType
    mode: LayerMode
    position: Position
    width: Optional[float] = None      # ✅ AJOUTER
    height: Optional[float] = None     # ✅ AJOUTER
    z_index: int
    scale: float
    opacity: float
    # ... autres champs
```

### 2. Traitement des Layers

#### Pour les Text Layers :
```python
def render_text_layer(layer):
    base_width = layer.width or estimate_text_width(layer.text_config)
    base_height = layer.height or estimate_text_height(layer.text_config)
    
    # Appliquer l'échelle pour obtenir les dimensions finales
    final_width = base_width * layer.scale
    final_height = base_height * layer.scale
    
    # Utiliser final_width et final_height pour le rendu
```

#### Pour les Image Layers :
```python
def render_image_layer(layer):
    # width et height sont les dimensions originales de l'image
    original_width = layer.width
    original_height = layer.height
    
    # Appliquer l'échelle pour obtenir les dimensions d'affichage
    display_width = original_width * layer.scale
    display_height = original_height * layer.scale
    
    # Redimensionner l'image à display_width × display_height
```

#### Pour les Shape Layers :
```python
def render_shape_layer(layer):
    base_width = layer.width or layer.shape_config.get('width', 100)
    base_height = layer.height or layer.shape_config.get('height', 100)
    
    # Les dimensions dans shape_config peuvent déjà inclure l'échelle
    # Vérifier la cohérence avec layer.scale
```

### 3. Migration des Données Existantes

Pour les layers existants sans `width` et `height` :

```python
def migrate_layer(layer):
    """Ajouter width et height aux layers existants"""
    
    if layer.width is None or layer.height is None:
        if layer.type == 'text':
            # Estimer les dimensions du texte
            layer.width = estimate_text_width(layer.text_config)
            layer.height = estimate_text_height(layer.text_config)
            
        elif layer.type == 'image':
            # Récupérer les dimensions de l'image
            image_info = get_image_info(layer.image_path)
            layer.width = image_info.width
            layer.height = image_info.height
            
        elif layer.type == 'shape':
            # Utiliser les dimensions du shape_config
            shape_config = layer.shape_config
            layer.width = shape_config.get('width') or shape_config.get('radius', 0) * 2 or 100
            layer.height = shape_config.get('height') or shape_config.get('radius', 0) * 2 or 100
    
    return layer
```

### 4. Tests Recommandés

1. **Test de création de layer** : Vérifier que `width` et `height` sont présents dans les nouveaux layers
2. **Test de rendu** : Vérifier que les layers sont rendus avec les bonnes dimensions
3. **Test de compatibilité** : Vérifier que les anciens layers (sans width/height) fonctionnent toujours
4. **Test d'échelle** : Vérifier que scale × width/height donne les bonnes dimensions finales

## Exemples de Payloads

### Création d'une scène avec un text layer :
```json
{
  "projectId": "project-uuid",
  "title": "Ma Scène",
  "duration": 10,
  "layers": [
    {
      "id": "layer-1234567890",
      "name": "Texte",
      "type": "text",
      "mode": "draw",
      "position": { "x": 960, "y": 540 },
      "width": 300,
      "height": 57.6,
      "z_index": 1,
      "scale": 1.0,
      "opacity": 1.0,
      "text_config": {
        "text": "Votre texte ici",
        "font": "Arial",
        "size": 48,
        "color": [0, 0, 0],
        "style": "normal",
        "line_height": 1.2,
        "align": "center"
      }
    }
  ]
}
```

### Création d'une scène avec un image layer :
```json
{
  "projectId": "project-uuid",
  "title": "Ma Scène",
  "duration": 10,
  "layers": [
    {
      "id": "layer-1234567891",
      "name": "photo.jpg",
      "type": "image",
      "mode": "draw",
      "position": { "x": 400, "y": 300 },
      "width": 1920,
      "height": 1080,
      "z_index": 1,
      "scale": 0.5,
      "opacity": 1.0,
      "image_path": "https://cdn.example.com/photo.jpg"
    }
  ]
}
```

## Impact et Bénéfices

### Avant (sans width/height)
- Le backend devait deviner ou calculer les dimensions
- Incohérences possibles entre frontend et backend
- Difficultés pour le positionnement précis

### Après (avec width/height)
- Dimensions explicites et cohérentes
- Calculs simplifiés pour le rendu
- Meilleure prévisualisation
- Positionnement et échelle plus précis

## Notes Importantes

1. **Rétrocompatibilité** : Les propriétés sont optionnelles (`Optional[float]`) pour maintenir la compatibilité avec les données existantes
2. **Échelle** : Les dimensions `width` et `height` sont les dimensions **de base**, avant application du facteur `scale`
3. **Position** : Le point de position (`x`, `y`) représente généralement le centre ou le coin supérieur gauche du layer, selon le type
4. **Estimation du texte** : Les dimensions de texte sont approximatives. Le backend peut les recalculer pour plus de précision

## Questions Fréquentes

**Q: Que faire si width/height sont null ?**
A: Calculer les dimensions en fonction du type de layer et du contenu (voir section Migration)

**Q: Les dimensions incluent-elles déjà l'échelle ?**
A: Non, width et height sont les dimensions de base. Multiplier par `scale` pour obtenir les dimensions finales

**Q: Comment gérer les formes circulaires ?**
A: Pour un cercle, width = height = diameter = radius × 2

**Q: Faut-il valider les dimensions ?**
A: Oui, vérifier que width et height sont positifs et dans des limites raisonnables (ex: 1-10000px)

## Contact

Pour toute question ou clarification sur ces modifications, veuillez contacter l'équipe frontend ou créer une issue sur le repository.

---

**Date de création :** 2025-10-30
**Version Frontend :** 1.0.0
**Statut :** ✅ Implémenté côté frontend, en attente d'implémentation backend
