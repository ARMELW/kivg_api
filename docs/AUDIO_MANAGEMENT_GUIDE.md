# Guide Complet de Gestion Audio dans l'Éditeur Griboo

L'éditeur Griboo Engine dispose d'un système audio complet permettant d'ajouter des éléments sonores professionnels à vos animations whiteboard :
- Musique de fond avec boucle et effets de fondu
- Effets sonores synchronisés avec les animations
- Voice-over / Narration
- Sons de machine à écrire pour les animations de texte
- Sons de dessin pour les animations sketch
- Mixage multi-pistes
- Contrôle du volume pour chaque élément audio

---

## 📋 Table des Matières

1. [Méthodes d'Ajout Audio](#méthodes-dajout-audio)
2. [Musique de Fond](#musique-de-fond)
3. [Effets Sonores](#effets-sonores)
4. [Voice-Over et Narration](#voice-over-et-narration)
5. [Sons Générés Automatiquement](#sons-générés-automatiquement)
6. [Configuration Complète](#configuration-complète)
7. [Exemples Pratiques](#exemples-pratiques)
8. [Recommandations de Volume](#recommandations-de-volume)
9. [Formats Audio Supportés](#formats-audio-supportés)
10. [API Audio](#api-audio)
11. [Synchronisation Audio/Vidéo](#synchronisation-audiovid%C3%A9o)
12. [Organisation des Fichiers](#organisation-des-fichiers)
13. [Résolution de Problèmes](#résolution-de-problèmes)
14. [Workflow Recommandé](#workflow-recommandé)
15. [Ressources Audio Gratuites](#ressources-audio-gratuites)

---

## Méthodes d'Ajout Audio

Il existe deux façons d'ajouter de l'audio à vos animations :

### Méthode 1 : API REST (Recommandée)

Pour une gestion complète des fichiers audio avec stockage cloud et métadonnées :

```typescript
// Upload audio file
const formData = new FormData()
formData.append('file', audioFile)
formData.append('name', 'Background Music')
formData.append('category', 'music')
formData.append('tags', JSON.stringify(['ambient', 'corporate']))

const response = await fetch('/v1/audio/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})

const { data: audio } = await response.json()
```

**Avantages** : 
- Stockage cloud persistant
- Gestion des métadonnées (catégories, tags, favoris)
- Contrôle des fondus et trim
- Réutilisation facile
- Organisation professionnelle

### Méthode 2 : Configuration JSON (Contrôle Avancé)

Pour un contrôle complet du timing et des configurations complexes :

```json
{
  "audio": {
    "background_music": {
      "path": "audio/musique.mp3",
      "volume": 0.5,
      "loop": true,
      "fade_in": 2.0,
      "fade_out": 3.0
    }
  }
}
```

**Avantages** : Contrôle précis du timing, multiples pistes  
**Recommandé pour** : Projets complexes, synchronisation précise

---

## Musique de Fond

### Via API REST

#### 1. Upload du Fichier Audio

```typescript
const uploadAudio = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('category', 'music')
  formData.append('tags', JSON.stringify(['background']))

  const response = await fetch('/v1/audio/upload', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  })

  return await response.json()
}
```

#### 2. Configuration des Fondus

```typescript
const updateAudioConfig = async (audioId: string) => {
  const response = await fetch(`/v1/audio/${audioId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fadeConfig: {
        fadeIn: 2.0,  // 2 secondes de fondu d'entrée
        fadeOut: 3.0  // 3 secondes de fondu de sortie
      }
    })
  })

  return await response.json()
}
```

### Via Configuration JSON

```json
{
  "audio": {
    "background_music": {
      "path": "audio/musique_fond.mp3",
      "volume": 0.5,
      "loop": true,
      "fade_in": 2.0,
      "fade_out": 3.0
    }
  }
}
```

**Paramètres détaillés :**

| Paramètre | Type | Requis | Défaut | Description |
|-----------|------|--------|--------|-------------|
| `path` | string | Oui | - | Chemin vers le fichier audio |
| `volume` | float | Non | 1.0 | Multiplicateur de volume (0.0 à 1.0) |
| `loop` | boolean | Non | true | Boucler si plus court que la vidéo |
| `fade_in` | float | Non | 0 | Durée du fondu d'entrée en secondes |
| `fade_out` | float | Non | 0 | Durée du fondu de sortie en secondes |

**💡 Astuce** : Utilisez un volume de 0.3-0.5 pour la musique de fond afin qu'elle ne couvre pas la narration.

---

## Effets Sonores

Les effets sonores permettent d'ajouter des sons courts et précis à des moments spécifiques de votre animation.

### Gestion via API

#### 1. Upload des Effets Sonores

```typescript
const uploadSoundEffect = async (file: File, name: string) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('name', name)
  formData.append('category', 'sfx')

  const response = await fetch('/v1/audio/upload', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  })

  return await response.json()
}
```

#### 2. Liste des Effets Sonores

```typescript
const getSoundEffects = async () => {
  const response = await fetch('/v1/audio?category=sfx&limit=100', {
    headers: { 'Authorization': `Bearer ${token}` }
  })

  const { data } = await response.json()
  return data
}
```

### Configuration

```json
{
  "audio": {
    "sound_effects": [
      {
        "path": "audio/whoosh.wav",
        "start_time": 2.5,
        "volume": 0.8,
        "duration": 0.5
      },
      {
        "path": "audio/pop.wav",
        "start_time": 5.0,
        "volume": 0.7
      },
      {
        "path": "audio/ding.wav",
        "start_time": 8.0,
        "volume": 0.9
      }
    ]
  }
}
```

**Paramètres :**

| Paramètre | Type | Requis | Défaut | Description |
|-----------|------|--------|--------|-------------|
| `path` | string | Oui | - | Chemin vers le fichier son |
| `start_time` | float | Oui | - | Moment de déclenchement (secondes depuis le début) |
| `volume` | float | Non | 1.0 | Volume (0.0 à 1.0) |
| `duration` | float | Non | Auto | Durée de lecture (couper/étendre) |

### Cas d'usage courants

| Effet | Moment | Volume | Usage |
|-------|--------|--------|-------|
| Whoosh | Transitions | 0.6-0.8 | Mouvements rapides |
| Pop | Apparitions | 0.7-0.9 | Éléments qui apparaissent |
| Ding | Fins d'étapes | 0.7-0.9 | Validation, complétion |
| Click | Interactions | 0.5-0.7 | Boutons, clics |
| Swoosh | Slides | 0.6-0.8 | Changements de slides |

---

## Voice-Over et Narration

La narration est essentielle pour les vidéos éducatives et tutoriels.

### Gestion via API

#### 1. Upload de Narration

```typescript
const uploadVoiceOver = async (file: File, sectionName: string) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('name', sectionName)
  formData.append('category', 'voiceover')

  const response = await fetch('/v1/audio/upload', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  })

  return await response.json()
}
```

#### 2. Trim de la Narration

```typescript
const trimVoiceOver = async (audioId: string, startTime: number, endTime: number) => {
  const response = await fetch(`/v1/audio/${audioId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      trimConfig: {
        startTime,
        endTime
      }
    })
  })

  return await response.json()
}
```

### Configuration

```json
{
  "audio": {
    "voice_overs": [
      {
        "path": "audio/intro.mp3",
        "start_time": 0.0,
        "volume": 1.0
      },
      {
        "path": "audio/etape1.mp3",
        "start_time": 5.0,
        "volume": 1.0
      },
      {
        "path": "audio/etape2.mp3",
        "start_time": 12.0,
        "volume": 1.0
      },
      {
        "path": "audio/conclusion.mp3",
        "start_time": 20.0,
        "volume": 1.0
      }
    ]
  }
}
```

**Paramètres :**

| Paramètre | Type | Requis | Défaut | Description |
|-----------|------|--------|--------|-------------|
| `path` | string | Oui | - | Chemin vers le fichier de narration |
| `start_time` | float | Oui | - | Moment de déclenchement (secondes) |
| `volume` | float | Non | 1.0 | Volume (0.9-1.0 recommandé) |

### Bonnes Pratiques pour la Narration

1. **Enregistrement** :
   - Utilisez un micro de qualité
   - Enregistrez dans un endroit calme
   - Parlez clairement et à un rythme modéré
   - Faites des pauses entre les sections

2. **Préparation des Fichiers** :
   - Format : MP3 ou M4A/AAC (bon pour la voix)
   - Bitrate : 128-192 kbps minimum
   - Normalisez le volume (utilisez Audacity)
   - Supprimez le bruit de fond

3. **Timing** :
   - Générez d'abord la vidéo sans audio
   - Notez la durée de chaque section
   - Ajustez les `start_time` en conséquence
   - Ajoutez 0.5s de marge avant/après

4. **Volume** :
   - Narration : 0.9-1.0 (principal)
   - Musique de fond : 0.3-0.4 (pour ne pas couvrir)
   - Utilisez le mixage automatique pour équilibrer

---

## Sons Générés Automatiquement

L'éditeur peut générer automatiquement des sons pour améliorer le réalisme de vos animations.

### 1. Son de Machine à Écrire

Pour les animations de texte avec effet de frappe.

#### Configuration JSON

**Configuration Globale** (pour toutes les animations de texte) :

```json
{
  "slides": [
    {
      "index": 0,
      "duration": 8,
      "audio": {
        "typewriter": {
          "start_time": 0.5,
          "num_characters": 45,
          "char_interval": 0.08,
          "volume": 0.35
        }
      },
      "layers": [
        {
          "type": "text",
          "text_config": {
            "text": "Bienvenue dans notre tutoriel animé !",
            "font": "Arial",
            "size": 48
          },
          "mode": "typing",
          "position": {"x": 50, "y": 100},
          "z_index": 1
        }
      ]
    }
  ]
}
```

**Paramètres :**

| Paramètre | Type | Requis | Défaut | Description |
|-----------|------|--------|--------|-------------|
| `start_time` | float | Oui | - | Moment de début du son (secondes) |
| `num_characters` | int | Oui | - | Nombre de caractères à taper |
| `char_interval` | float | Non | 0.1 | Temps entre chaque frappe (secondes) |
| `volume` | float | Non | 0.3 | Volume (0.2-0.4 recommandé) |

**💡 Astuce** : Pour calculer `num_characters`, comptez les caractères de votre texte (espaces inclus).

### 2. Son de Dessin

Pour les animations de type sketch/dessin.

#### Configuration JSON

```json
{
  "slides": [
    {
      "index": 0,
      "duration": 10,
      "audio": {
        "drawing_sound": {
          "start_time": 0.5,
          "duration": 7.5,
          "volume": 0.25
        }
      },
      "layers": [
        {
          "type": "image",
          "image_path": "demo/diagram.jpg",
          "position": {"x": 0, "y": 0},
          "mode": "draw",
          "skip_rate": 8,
          "z_index": 1
        }
      ]
    }
  ]
}
```

**Paramètres :**

| Paramètre | Type | Requis | Défaut | Description |
|-----------|------|--------|--------|-------------|
| `start_time` | float | Oui | - | Moment de début du son (secondes) |
| `duration` | float | Oui | - | Durée du dessin (secondes) |
| `volume` | float | Non | 0.2 | Volume (0.15-0.25 recommandé) |

**💡 Astuce** : Le son de dessin doit être très subtil (volume faible) pour ne pas être envahissant.

---

## Configuration Complète

Voici un exemple complet combinant tous les éléments audio :

```json
{
  "audio": {
    "background_music": {
      "path": "audio/musique_douce.mp3",
      "volume": 0.4,
      "loop": true,
      "fade_in": 2.0,
      "fade_out": 3.0
    },
    "sound_effects": [
      {
        "path": "audio/whoosh.wav",
        "start_time": 2.0,
        "volume": 0.7
      },
      {
        "path": "audio/pop.wav",
        "start_time": 5.0,
        "volume": 0.8
      },
      {
        "path": "audio/ding.wav",
        "start_time": 10.0,
        "volume": 0.9
      }
    ],
    "voice_overs": [
      {
        "path": "audio/intro.mp3",
        "start_time": 0.0,
        "volume": 1.0
      },
      {
        "path": "audio/etape1.mp3",
        "start_time": 6.0,
        "volume": 1.0
      },
      {
        "path": "audio/conclusion.mp3",
        "start_time": 15.0,
        "volume": 1.0
      }
    ]
  },
  "slides": [
    {
      "index": 0,
      "duration": 8,
      "audio": {
        "typewriter": {
          "start_time": 0.5,
          "num_characters": 50,
          "char_interval": 0.08,
          "volume": 0.3
        }
      },
      "layers": [
        {
          "type": "text",
          "text_config": {
            "text": "Titre de la présentation",
            "font": "Arial",
            "size": 60
          },
          "mode": "typing",
          "position": {"x": 100, "y": 100},
          "z_index": 1
        }
      ]
    },
    {
      "index": 1,
      "duration": 10,
      "audio": {
        "drawing_sound": {
          "start_time": 0.5,
          "duration": 8.0,
          "volume": 0.2
        },
        "sound_effects": [
          {
            "path": "audio/complete.wav",
            "start_time": 9.0,
            "volume": 0.8
          }
        ]
      },
      "layers": [
        {
          "type": "image",
          "image_path": "demo/diagram.jpg",
          "mode": "draw",
          "z_index": 1
        }
      ]
    }
  ]
}
```

---

## Exemples Pratiques

### Exemple 1 : Vidéo Marketing Simple

**Objectif** : Musique entraînante + effets sonores

```json
{
  "audio": {
    "background_music": {
      "path": "audio/upbeat.mp3",
      "volume": 0.5,
      "fade_in": 1.0,
      "fade_out": 2.0
    },
    "sound_effects": [
      {
        "path": "audio/pop.wav",
        "start_time": 1.0,
        "volume": 0.7
      },
      {
        "path": "audio/whoosh.wav",
        "start_time": 3.0,
        "volume": 0.6
      },
      {
        "path": "audio/ding.wav",
        "start_time": 5.0,
        "volume": 0.8
      }
    ]
  }
}
```

### Exemple 2 : Tutoriel Éducatif

**Objectif** : Narration claire + musique douce + sons de frappe

```json
{
  "audio": {
    "background_music": {
      "path": "audio/musique_calme.mp3",
      "volume": 0.3,
      "loop": true
    },
    "voice_overs": [
      {
        "path": "audio/intro.mp3",
        "start_time": 0.0,
        "volume": 1.0
      },
      {
        "path": "audio/explication1.mp3",
        "start_time": 8.0,
        "volume": 1.0
      }
    ]
  },
  "slides": [
    {
      "index": 0,
      "audio": {
        "typewriter": {
          "start_time": 1.0,
          "num_characters": 35,
          "char_interval": 0.1,
          "volume": 0.3
        }
      }
    }
  ]
}
```

### Exemple 3 : Présentation Professionnelle

**Objectif** : Animations fluides + narration + sons subtils

```json
{
  "audio": {
    "background_music": {
      "path": "audio/corporate.mp3",
      "volume": 0.35,
      "loop": true,
      "fade_in": 2.0,
      "fade_out": 3.0
    },
    "voice_overs": [
      {
        "path": "audio/section1.mp3",
        "start_time": 1.0,
        "volume": 1.0
      },
      {
        "path": "audio/section2.mp3",
        "start_time": 12.0,
        "volume": 1.0
      },
      {
        "path": "audio/section3.mp3",
        "start_time": 24.0,
        "volume": 1.0
      }
    ],
    "sound_effects": [
      {
        "path": "audio/transition.wav",
        "start_time": 11.5,
        "volume": 0.5
      },
      {
        "path": "audio/transition.wav",
        "start_time": 23.5,
        "volume": 0.5
      }
    ]
  },
  "slides": [
    {
      "index": 0,
      "duration": 12,
      "audio": {
        "drawing_sound": {
          "start_time": 2.0,
          "duration": 8.0,
          "volume": 0.18
        }
      }
    },
    {
      "index": 1,
      "duration": 12,
      "audio": {
        "typewriter": {
          "start_time": 1.0,
          "num_characters": 60,
          "char_interval": 0.08,
          "volume": 0.25
        }
      }
    }
  ]
}
```

---

## Recommandations de Volume

### Tableau des Volumes Recommandés

| Type Audio | Volume | Raisonnement |
|------------|--------|--------------|
| **Musique de fond** | 0.3 - 0.5 | Ne doit pas couvrir la narration |
| **Voice-over / Narration** | 0.9 - 1.0 | Doit être clair et audible |
| **Effets sonores** | 0.5 - 0.8 | Perceptibles mais pas dominants |
| **Son typewriter** | 0.2 - 0.4 | Effet subtil en arrière-plan |
| **Son de dessin** | 0.15 - 0.25 | Très subtil, ambiance |

### Règles d'Équilibrage

1. **La narration est prioritaire** : Si vous avez de la narration, réduisez tous les autres volumes.

2. **Hiérarchie audio** :
   ```
   Narration (1.0) > Effets sonores (0.5-0.8) > Musique (0.3-0.5) > Sons générés (0.2-0.4)
   ```

3. **Test d'écoute** :
   - Écoutez sur différents appareils (ordinateur, téléphone, enceintes)
   - Vérifiez que la narration est toujours claire
   - Assurez-vous qu'aucun son ne sature (distorsion)

4. **Mixage automatique** :
   Le système mixe automatiquement les pistes et prévient la saturation.

---

## Formats Audio Supportés

### Formats d'Entrée

| Format | Extension | Usage Recommandé | Qualité | Taille |
|--------|-----------|------------------|---------|--------|
| **MP3** | .mp3 | Musique de fond | Bonne | Compressé |
| **WAV** | .wav | Effets sonores | Excellente | Volumineux |
| **OGG** | .ogg | Musique alternative | Bonne | Compressé |
| **M4A/AAC** | .m4a | Narration/voix | Bonne | Compressé |
| **FLAC** | .flac | Haute qualité | Excellente | Moyen |
| **WebM** | .webm | Audio web | Bonne | Compressé |

### Recommandations par Usage

- **Musique de fond** : MP3 (192+ kbps) ou OGG
- **Narration** : M4A/AAC (128-192 kbps) ou MP3
- **Effets sonores** : WAV (meilleure qualité) ou MP3
- **Sons générés** : Automatique (pas de fichier)

### Format de Sortie

La vidéo finale sera en **MP4 avec audio AAC intégré**.

---

## API Audio

### Endpoints Disponibles

#### 1. Upload Audio

```http
POST /v1/audio/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <audio_file>
name: "Background Music"
category: "music" | "sfx" | "voiceover" | "ambient" | "other"
tags: ["ambient", "corporate"]
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "fileName": "Background Music",
    "fileUrl": "https://storage.../audio.mp3",
    "duration": 120.5,
    "size": 2048000,
    "category": "music",
    "tags": ["ambient", "corporate"],
    "isFavorite": false,
    "uploadedAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### 2. Liste Audio Files

```http
GET /v1/audio?category=music&page=1&limit=20&search=ambient&favoritesOnly=true
Authorization: Bearer <token>
```

**Réponse** :
```json
{
  "success": true,
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

#### 3. Get Audio by ID

```http
GET /v1/audio/{id}
Authorization: Bearer <token>
```

#### 4. Update Audio Metadata

```http
PUT /v1/audio/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "fileName": "New Name",
  "category": "music",
  "tags": ["new", "tags"],
  "isFavorite": true,
  "trimConfig": {
    "startTime": 5.0,
    "endTime": 115.0
  },
  "fadeConfig": {
    "fadeIn": 2.0,
    "fadeOut": 3.0
  }
}
```

#### 5. Delete Audio

```http
DELETE /v1/audio/{id}
Authorization: Bearer <token>
```

### Modèle de Données Audio

```typescript
interface AudioFile {
  id: string              // UUID
  userId: string          // UUID du propriétaire
  fileName: string        // Nom du fichier
  fileUrl: string         // URL de stockage
  duration: number        // Durée en secondes
  size: number            // Taille en bytes
  category: 'music' | 'sfx' | 'voiceover' | 'ambient' | 'other'
  tags: string[]          // Tags pour organisation
  isFavorite: boolean     // Marqué comme favori
  trimConfig?: {
    startTime?: number    // Point de départ (secondes)
    endTime?: number      // Point de fin (secondes)
  }
  fadeConfig?: {
    fadeIn?: number       // Durée fondu entrée (secondes)
    fadeOut?: number      // Durée fondu sortie (secondes)
  }
  uploadedAt: Date
  updatedAt: Date
}
```

### Exemples d'Utilisation API

#### Exemple TypeScript Complet

```typescript
class AudioManager {
  private baseUrl = '/v1/audio'
  private token: string

  constructor(token: string) {
    this.token = token
  }

  async uploadAudio(file: File, metadata: {
    name?: string
    category?: string
    tags?: string[]
  }) {
    const formData = new FormData()
    formData.append('file', file)
    if (metadata.name) formData.append('name', metadata.name)
    if (metadata.category) formData.append('category', metadata.category)
    if (metadata.tags) formData.append('tags', JSON.stringify(metadata.tags))

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.token}` },
      body: formData
    })

    return await response.json()
  }

  async listAudio(filters?: {
    category?: string
    page?: number
    limit?: number
    search?: string
    favoritesOnly?: boolean
  }) {
    const params = new URLSearchParams()
    if (filters?.category) params.append('category', filters.category)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.search) params.append('search', filters.search)
    if (filters?.favoritesOnly) params.append('favoritesOnly', 'true')

    const response = await fetch(`${this.baseUrl}?${params}`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    })

    return await response.json()
  }

  async updateAudio(id: string, updates: {
    fileName?: string
    category?: string
    tags?: string[]
    isFavorite?: boolean
    trimConfig?: { startTime?: number; endTime?: number }
    fadeConfig?: { fadeIn?: number; fadeOut?: number }
  }) {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    })

    return await response.json()
  }

  async deleteAudio(id: string) {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${this.token}` }
    })

    return await response.json()
  }

  async getAudioById(id: string) {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    })

    return await response.json()
  }
}

// Usage
const audioManager = new AudioManager('your-token')

// Upload
const file = document.querySelector('input[type="file"]').files[0]
const { data: audio } = await audioManager.uploadAudio(file, {
  name: 'Background Music',
  category: 'music',
  tags: ['ambient', 'corporate']
})

// List music files
const { data: musicFiles } = await audioManager.listAudio({
  category: 'music',
  page: 1,
  limit: 20
})

// Add fade effects
await audioManager.updateAudio(audio.id, {
  fadeConfig: {
    fadeIn: 2.0,
    fadeOut: 3.0
  }
})

// Mark as favorite
await audioManager.updateAudio(audio.id, {
  isFavorite: true
})
```

---

## Synchronisation Audio/Vidéo

### Comment Fonctionne la Synchronisation

1. **Basée sur la durée de la vidéo** : Le système calcule automatiquement la durée totale de votre vidéo.

2. **Timing en secondes** : Tous les `start_time` sont en secondes depuis le début de la vidéo.

3. **Précision** : La synchronisation est précise au niveau de la frame (basée sur le frame rate).

### Calculer les Timings

#### Méthode 1 : Générer la Vidéo d'Abord

1. Générez votre vidéo sans audio
2. Regardez la vidéo et notez les timings importants
3. Créez votre configuration audio avec les timings appropriés

#### Méthode 2 : Calculer Manuellement

Si vous connaissez la durée de chaque slide :

```
Slide 1: 0s - 8s
Slide 2: 8s - 16s
Slide 3: 16s - 24s
```

Timings pour les événements :
- Narration slide 1 : `start_time: 0.5`
- Effet fin slide 1 : `start_time: 7.5`
- Narration slide 2 : `start_time: 8.5`
- etc.

### Astuce pour Éviter les Désynchronisations

1. **Ajoutez des marges** : Commencez 0.5s après le début réel
2. **Testez sur des segments courts** : Vérifiez d'abord sur 10-15 secondes
3. **Utilisez des marqueurs** : Notez les moments clés de votre storyboard

---

## Organisation des Fichiers

### Structure Recommandée

```
projet/
├── config/
│   ├── slides.json          # Configuration principale
│   └── audio_config.json    # Configuration audio
├── audio/
│   ├── musique/
│   │   ├── fond_calme.mp3
│   │   └── fond_energique.mp3
│   ├── effets/
│   │   ├── whoosh.wav
│   │   ├── pop.wav
│   │   ├── ding.wav
│   │   └── transition.wav
│   └── narration/
│       ├── intro.mp3
│       ├── section1.mp3
│       ├── section2.mp3
│       └── conclusion.mp3
├── images/
│   ├── slide1.jpg
│   └── slide2.jpg
└── output/
    └── video_finale.mp4
```

### Conventions de Nommage

- **Musique** : `fond_[description].mp3`
- **Effets** : `[nom_effet].wav`
- **Narration** : `[section_numero].mp3` ou `[nom_section].mp3`

### Catégories Audio

Utilisez les catégories pour organiser vos fichiers :

- `music` : Musiques de fond
- `sfx` : Effets sonores
- `voiceover` : Narrations et voice-overs
- `ambient` : Sons d'ambiance
- `other` : Autres types audio

---

## Résolution de Problèmes

### L'Audio ne se Lit Pas dans la Vidéo

**Causes possibles et solutions** :

1. **Fichiers audio inexistants** :
   - Vérifiez que les URLs des fichiers audio sont correctes
   - Assurez-vous que les fichiers sont bien uploadés
   - Vérifiez les permissions d'accès

2. **Format audio non supporté** :
   - Vérifiez que vos fichiers sont dans un format supporté
   - Convertissez vos fichiers si nécessaire

3. **Vidéo trop courte** :
   - Vérifiez que votre vidéo a une durée suffisante
   - Les `start_time` doivent être < durée totale de la vidéo

### Audio Désynchronisé

**Causes et solutions** :

1. **Durée de vidéo incorrecte** :
   - Générez d'abord la vidéo sans audio
   - Notez la durée réelle
   - Ajustez vos `start_time` en conséquence

2. **Start_time incorrects** :
   - Vérifiez vos calculs de timing
   - Utilisez la formule : `start_time = durée_cumulée_slides + délai`

3. **Mauvais calcul de durée** :
   ```json
   {
     "slides": [
       {"index": 0, "duration": 8},   // 0s - 8s
       {"index": 1, "duration": 10}   // 8s - 18s
     ],
     "audio": {
       "voice_overs": [
         {"start_time": 0.5},    // OK: début slide 1
         {"start_time": 8.5}     // OK: début slide 2
       ]
     }
   }
   ```

**Solution** : Testez sur des vidéos courtes (10-15s) d'abord.

### Volume Trop Fort/Faible

**Solutions** :

1. **Ajustez dans la configuration** :
   ```json
   {
     "background_music": {
       "volume": 0.5  // Réduisez ou augmentez (0.0 à 1.0)
     }
   }
   ```

2. **Pré-traitement avec Audacity** :
   - Ouvrez votre fichier audio dans Audacity
   - Effet → Normaliser
   - Effet → Compresseur (pour uniformiser)
   - Exportez

3. **Utilisez les fondus** :
   ```json
   {
     "background_music": {
       "fade_in": 2.0,   // Montée douce
       "fade_out": 3.0   // Descente douce
     }
   }
   ```

### Upload Failed

**Solutions** :

1. **Vérifiez la taille du fichier** :
   - Les fichiers doivent être < 50MB généralement
   - Compressez les fichiers volumineux

2. **Vérifiez le format** :
   - Assurez-vous que le type MIME est `audio/*`
   - Convertissez si nécessaire

3. **Vérifiez l'authentification** :
   - Assurez-vous que le token est valide
   - Vérifiez les permissions utilisateur

### Sons Générés ne Fonctionnent Pas

**Pour le son typewriter** :

1. **Vérifiez le mode de l'animation** :
   ```json
   {
     "layers": [{
       "type": "text",
       "text_config": {...},
       "mode": "typing"  // Doit être "typing" !
     }]
   }
   ```

2. **Vérifiez num_characters** :
   - Comptez le nombre de caractères (espaces inclus)
   - Le nombre doit correspondre à votre texte

**Pour le son de dessin** :

1. **Vérifiez le mode** :
   ```json
   {
     "layers": [{
       "type": "image",
       "image_path": "...",
       "mode": "draw"  // Doit être "draw" !
     }]
   }
   ```

2. **Vérifiez la durée** :
   - La durée doit correspondre à celle de l'animation
   - Ne doit pas dépasser la durée totale du slide

---

## Workflow Recommandé

### Flux de Travail Complet pour un Projet Audio

#### Phase 1 : Préparation (1-2 heures)

1. **Storyboard** :
   - Définissez le contenu de chaque slide
   - Estimez la durée de chaque section
   - Notez les moments clés pour les effets sonores

2. **Script de narration** :
   - Écrivez le texte complet
   - Identifiez les pauses naturelles
   - Prévoyez le timing (lisez à voix haute)

3. **Collecte audio** :
   - Téléchargez ou créez la musique de fond
   - Trouvez les effets sonores nécessaires
   - Enregistrez la narration

4. **Upload des fichiers** :
   ```typescript
   // Upload tous les fichiers audio
   const audioFiles = await Promise.all([
     audioManager.uploadAudio(backgroundMusic, { 
       category: 'music',
       tags: ['background']
     }),
     audioManager.uploadAudio(voiceover1, { 
       category: 'voiceover',
       tags: ['intro']
     }),
     // etc.
   ])
   ```

#### Phase 2 : Création Vidéo (30 min - 1 heure)

1. **Créez la configuration vidéo** sans audio
2. **Générez la vidéo de test**
3. **Vérifiez la durée** et notez les timings

#### Phase 3 : Intégration Audio (30 min - 1 heure)

1. **Créez la configuration audio** avec les URLs des fichiers uploadés
2. **Testez sur une section courte**
3. **Ajustez les volumes et timings**
4. **Générez la version complète**

#### Phase 4 : Ajustements (15-30 min)

1. **Écoutez sur différents appareils**
2. **Ajustez si nécessaire** via l'API update
3. **Version finale**

---

## Ressources Audio Gratuites

### Sites de Musique Libre de Droits

1. **YouTube Audio Library**
   - URL : https://studio.youtube.com/channel/UC/music
   - Gratuit, nombreux styles
   - Téléchargement direct en MP3

2. **Incompetech**
   - URL : https://incompetech.com/music/
   - Musique de Kevin MacLeod
   - Attribution requise

3. **Bensound**
   - URL : https://www.bensound.com/
   - Musique de qualité
   - Versions gratuites disponibles

### Sites d'Effets Sonores

1. **Freesound.org**
   - URL : https://freesound.org/
   - Grande collection communautaire
   - Licence Creative Commons

2. **Zapsplat**
   - URL : https://www.zapsplat.com/
   - Effets sonores gratuits
   - Compte gratuit requis

3. **SoundBible**
   - URL : http://soundbible.com/
   - Effets variés
   - Domaine public et Creative Commons

### Outils d'Enregistrement et Édition

1. **Audacity** (Gratuit)
   - URL : https://www.audacityteam.org/
   - Enregistrement et édition
   - Multi-plateforme

2. **GarageBand** (macOS, Gratuit)
   - Pré-installé sur Mac
   - Création musicale
   - Enregistrement de qualité

3. **Adobe Audition** (Payant)
   - Édition professionnelle
   - Nettoyage audio avancé
   - Mixage multi-pistes

---

## Exemples de Configuration par Type de Projet

### 1. Vidéo Marketing / Promo

```json
{
  "audio": {
    "background_music": {
      "path": "audio/energique.mp3",
      "volume": 0.6,
      "loop": true,
      "fade_in": 0.5,
      "fade_out": 1.0
    },
    "sound_effects": [
      {"path": "audio/swoosh.wav", "start_time": 1.0, "volume": 0.8},
      {"path": "audio/pop.wav", "start_time": 3.5, "volume": 0.9},
      {"path": "audio/whoosh.wav", "start_time": 6.0, "volume": 0.7},
      {"path": "audio/ding.wav", "start_time": 9.0, "volume": 1.0}
    ]
  }
}
```

### 2. Tutoriel Éducatif

```json
{
  "audio": {
    "background_music": {
      "path": "audio/calme_concentre.mp3",
      "volume": 0.25,
      "loop": true,
      "fade_in": 2.0,
      "fade_out": 3.0
    },
    "voice_overs": [
      {"path": "audio/intro.mp3", "start_time": 0.5, "volume": 1.0},
      {"path": "audio/etape1.mp3", "start_time": 10.0, "volume": 1.0},
      {"path": "audio/etape2.mp3", "start_time": 25.0, "volume": 1.0},
      {"path": "audio/etape3.mp3", "start_time": 40.0, "volume": 1.0},
      {"path": "audio/conclusion.mp3", "start_time": 55.0, "volume": 1.0}
    ],
    "sound_effects": [
      {"path": "audio/transition.wav", "start_time": 9.5, "volume": 0.4},
      {"path": "audio/transition.wav", "start_time": 24.5, "volume": 0.4},
      {"path": "audio/transition.wav", "start_time": 39.5, "volume": 0.4}
    ]
  },
  "slides": [
    {
      "index": 0,
      "audio": {
        "typewriter": {
          "start_time": 2.0,
          "num_characters": 40,
          "char_interval": 0.09,
          "volume": 0.25
        }
      }
    }
  ]
}
```

### 3. Présentation Corporate

```json
{
  "audio": {
    "background_music": {
      "path": "audio/corporate_elegant.mp3",
      "volume": 0.35,
      "loop": true,
      "fade_in": 3.0,
      "fade_out": 4.0
    },
    "voice_overs": [
      {"path": "audio/ouverture.mp3", "start_time": 1.0, "volume": 0.95},
      {"path": "audio/valeurs.mp3", "start_time": 15.0, "volume": 0.95},
      {"path": "audio/services.mp3", "start_time": 30.0, "volume": 0.95},
      {"path": "audio/contact.mp3", "start_time": 45.0, "volume": 0.95}
    ],
    "sound_effects": [
      {"path": "audio/elegant_transition.wav", "start_time": 14.5, "volume": 0.5},
      {"path": "audio/elegant_transition.wav", "start_time": 29.5, "volume": 0.5},
      {"path": "audio/elegant_transition.wav", "start_time": 44.5, "volume": 0.5}
    ]
  },
  "slides": [
    {
      "index": 1,
      "audio": {
        "drawing_sound": {
          "start_time": 1.5,
          "duration": 10.0,
          "volume": 0.15
        }
      }
    }
  ]
}
```

---

## Bonnes Pratiques

### Performance

- Optimisez la taille des fichiers audio
- Utilisez des formats compressés pour la musique de fond
- Gardez les effets sonores courts et en WAV pour la qualité

### Organisation

- Utilisez les tags pour catégoriser vos fichiers
- Marquez vos fichiers favoris pour un accès rapide
- Nommez vos fichiers de manière descriptive

### Qualité Audio

- Normalisez vos fichiers audio avant upload
- Supprimez le bruit de fond des narrations
- Équilibrez les niveaux sonores
- Testez sur différents appareils

### Synchronisation

- Générez d'abord la vidéo sans audio
- Notez précisément les timings
- Ajoutez des marges de 0.5s pour les transitions
- Testez sur des segments courts d'abord

---

## Voir Aussi

- [WHITEBOARD_ANIMATION_GUIDE.md](./WHITEBOARD_ANIMATION_GUIDE.md) - Guide des animations whiteboard
- [ANIMATION_CATALOG.md](./ANIMATION_CATALOG.md) - Catalogue des animations disponibles
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Documentation complète de l'API
