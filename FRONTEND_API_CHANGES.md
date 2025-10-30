# Changements API - Mise à jour Frontend

## Date: October 30, 2025

## 🔴 BREAKING CHANGE: Champs width et height obligatoires pour les layers

### Résumé
Les champs `width` et `height` sont maintenant **obligatoires** pour tous les layers dans les scènes. Auparavant, ces champs étaient optionnels.

---

## 📋 APIs Affectées

### 1. **POST /v1/scenes** - Créer une scène

#### Avant (optionnel)
```typescript
{
  projectId: "uuid",
  title: "Ma scène",
  layers: [
    {
      id: "layer-1",
      name: "Mon layer",
      type: "text",
      mode: "draw",
      position: { x: 100, y: 200 },
      // width et height étaient optionnels
      zIndex: 1,
      scale: 1,
      opacity: 1
    }
  ]
}
```

#### Après (obligatoire)
```typescript
{
  projectId: "uuid",
  title: "Ma scène",
  layers: [
    {
      id: "layer-1",
      name: "Mon layer",
      type: "text",
      mode: "draw",
      position: { x: 100, y: 200 },
      width: 300,      // ✅ OBLIGATOIRE
      height: 150,     // ✅ OBLIGATOIRE
      zIndex: 1,
      scale: 1,
      opacity: 1
    }
  ]
}
```

### 2. **PUT /v1/scenes/{id}** - Mettre à jour une scène

#### Avant (optionnel)
```typescript
{
  title: "Titre mis à jour",
  layers: [
    {
      id: "layer-1",
      name: "Layer modifié",
      type: "image",
      mode: "static",
      position: { x: 500, y: 300 },
      // width et height étaient optionnels
      zIndex: 2,
      scale: 0.8,
      opacity: 0.9
    }
  ]
}
```

#### Après (obligatoire)
```typescript
{
  title: "Titre mis à jour",
  layers: [
    {
      id: "layer-1",
      name: "Layer modifié",
      type: "image",
      mode: "static",
      position: { x: 500, y: 300 },
      width: 1920,     // ✅ OBLIGATOIRE
      height: 1080,    // ✅ OBLIGATOIRE
      zIndex: 2,
      scale: 0.8,
      opacity: 0.9
    }
  ]
}
```

### 3. **POST /v1/scenes/{id}/duplicate** - Dupliquer une scène

#### ✅ Pas de changement requis
La duplication préserve automatiquement les champs `width` et `height` de la scène source.

---

## 🔍 Validation des Données

### Types de Layer
Les `width` et `height` sont obligatoires pour **tous** les types de layer :
- `image`
- `text`
- `shape`
- `video`
- `audio`

### Règles de Validation

| Champ | Type | Contraintes | Exemples valides | Exemples invalides |
|-------|------|-------------|------------------|-------------------|
| `width` | `number` | ≥ 0 | `0`, `300`, `1920`, `300.75` | `-100`, `"300"`, `null`, `undefined` |
| `height` | `number` | ≥ 0 | `0`, `150`, `1080`, `150.25` | `-50`, `"150"`, `null`, `undefined` |

**Notes importantes:**
- Les valeurs décimales sont acceptées (ex: `300.75`)
- La valeur `0` est acceptée
- Les valeurs négatives sont **rejetées**
- Les valeurs doivent être de type `number` (pas de strings)

---

## 🚨 Erreurs Possibles

### Erreur 400 - Validation Failed

Si `width` ou `height` est manquant ou invalide:

```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "issues": [
      {
        "code": "invalid_type",
        "expected": "number",
        "received": "undefined",
        "path": ["layers", 0, "width"],
        "message": "Required"
      }
    ]
  }
}
```

---

## 📝 Actions Requises Côté Frontend

### 1. **Mettre à jour les types TypeScript**

```typescript
// ❌ Ancien type
interface Layer {
  id: string
  name: string
  type: 'image' | 'text' | 'shape' | 'video' | 'audio'
  mode: 'draw' | 'static' | 'animated'
  position: { x: number; y: number }
  width?: number      // optionnel
  height?: number     // optionnel
  zIndex: number
  scale: number
  opacity: number
  // ... autres champs
}

// ✅ Nouveau type
interface Layer {
  id: string
  name: string
  type: 'image' | 'text' | 'shape' | 'video' | 'audio'
  mode: 'draw' | 'static' | 'animated'
  position: { x: number; y: number }
  width: number       // obligatoire
  height: number      // obligatoire
  zIndex: number
  scale: number
  opacity: number
  // ... autres champs
}
```

### 2. **Valider les données avant envoi**

```typescript
function validateLayer(layer: Layer): boolean {
  // Vérifier que width et height sont présents
  if (typeof layer.width !== 'number') {
    console.error('Layer width is required and must be a number')
    return false
  }
  
  if (typeof layer.height !== 'number') {
    console.error('Layer height is required and must be a number')
    return false
  }
  
  // Vérifier que les valeurs sont non-négatives
  if (layer.width < 0 || layer.height < 0) {
    console.error('Layer width and height must be non-negative')
    return false
  }
  
  return true
}
```

### 3. **Initialiser width/height pour les nouveaux layers**

```typescript
function createNewLayer(type: LayerType): Layer {
  const defaultDimensions = {
    text: { width: 300, height: 100 },
    image: { width: 1920, height: 1080 },
    shape: { width: 200, height: 200 },
    video: { width: 1920, height: 1080 },
    audio: { width: 0, height: 0 }
  }
  
  return {
    id: generateId(),
    name: `New ${type} layer`,
    type,
    mode: 'static',
    position: { x: 0, y: 0 },
    width: defaultDimensions[type].width,    // ✅ Initialisé
    height: defaultDimensions[type].height,  // ✅ Initialisé
    zIndex: 0,
    scale: 1,
    opacity: 1
  }
}
```

### 4. **Gérer les données existantes (migration)**

Si vous avez des layers en cache/localStorage sans width/height:

```typescript
function migrateLayerData(layer: any): Layer {
  // Si width/height manquent, utiliser des valeurs par défaut
  return {
    ...layer,
    width: layer.width ?? 300,   // Valeur par défaut
    height: layer.height ?? 150  // Valeur par défaut
  }
}

// Appliquer lors du chargement
const scene = await fetchScene(sceneId)
scene.layers = scene.layers.map(migrateLayerData)
```

---

## 🧪 Tests Recommandés

### Tests à ajouter/mettre à jour:

1. **Test de création de layer**
   - ✅ Vérifier que width et height sont toujours fournis
   - ✅ Vérifier que les valeurs sont des nombres

2. **Test de validation**
   - ✅ Rejeter les layers sans width
   - ✅ Rejeter les layers sans height
   - ✅ Rejeter les valeurs négatives
   - ✅ Accepter la valeur 0
   - ✅ Accepter les valeurs décimales

3. **Test d'intégration API**
   - ✅ Créer une scène avec layers valides
   - ✅ Vérifier le rejet d'une scène avec layers invalides
   - ✅ Mettre à jour une scène avec nouveaux layers

---

## 📅 Timeline de Déploiement

1. **Immédiat**: Cette mise à jour est déployée sur l'API
2. **Frontend**: Mettre à jour le code frontend pour inclure width/height
3. **Tests**: Tester en environnement de développement
4. **Production**: Déployer après validation

---

## 💡 Valeurs par Défaut Recommandées

Pour faciliter la transition, voici des valeurs par défaut suggérées selon le type de layer:

| Type Layer | Width par défaut | Height par défaut | Justification |
|-----------|------------------|-------------------|---------------|
| `text` | 300 | 100 | Taille typique d'une zone de texte |
| `image` | 1920 | 1080 | Résolution Full HD standard |
| `shape` | 200 | 200 | Forme carrée de taille moyenne |
| `video` | 1920 | 1080 | Résolution Full HD standard |
| `audio` | 0 | 0 | Pas de représentation visuelle |

---

## 🆘 Support

En cas de questions ou problèmes:
- Vérifier que tous les layers ont bien width et height avant l'envoi
- Consulter les erreurs de validation retournées par l'API
- Utiliser les valeurs par défaut recommandées ci-dessus

---

## ✅ Checklist Frontend

- [ ] Mettre à jour les types TypeScript
- [ ] Ajouter validation avant envoi API
- [ ] Initialiser width/height pour nouveaux layers
- [ ] Migrer les données existantes en cache
- [ ] Ajouter/mettre à jour les tests
- [ ] Tester en développement
- [ ] Déployer en production

---

**Date de mise à jour**: October 30, 2025
**Version API**: v1
