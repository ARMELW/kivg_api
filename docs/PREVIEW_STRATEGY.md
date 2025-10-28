# Stratégie de Prévisualisation (Preview Strategy)

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture du système de preview](#architecture-du-système-de-preview)
3. [Génération des URLs de prévisualisation](#génération-des-urls-de-prévisualisation)
4. [Stratégie de cache et optimisation](#stratégie-de-cache-et-optimisation)
5. [Gestion des ressources](#gestion-des-ressources)
6. [Intégration avec whiteboard-cli](#intégration-avec-whiteboard-cli)
7. [Considérations de performance](#considérations-de-performance)
8. [Sécurité](#sécurité)
9. [Guide d'intégration API](#guide-dintégration-api)
10. [Workflow complet](#workflow-complet)
11. [Bonnes pratiques](#bonnes-pratiques)
12. [Dépannage](#dépannage)

---

## Vue d'ensemble

Le système de prévisualisation de Doodlio permet aux utilisateurs de générer des aperçus vidéo de leurs scènes à tout moment. Cette fonctionnalité est critique car :

- ✅ Les utilisateurs peuvent prévisualiser leur contenu **à tout moment** pendant l'édition
- ✅ Les previews peuvent être générées **plusieurs fois** pour la même scène
- ✅ La génération peut être **longue** (selon la complexité de la scène)
- ✅ Les ressources doivent être **optimisées** pour supporter de multiples requêtes simultanées

### Problématique

Le défi principal est de gérer efficacement les previews sans surcharger le système, tout en offrant une expérience utilisateur fluide. Un utilisateur peut :

- Demander un preview à chaque modification de sa scène
- Demander plusieurs previews pour la même scène avec des paramètres différents
- Annuler un preview en cours de génération
- Demander des previews pour plusieurs scènes simultanément

### Solution

Notre stratégie repose sur :

1. **Système de file d'attente** : Les requêtes de preview sont mises en file d'attente
2. **Cache intelligent** : Réutilisation des previews existants quand possible
3. **Nettoyage automatique** : Suppression des previews obsolètes
4. **Intégration avec whiteboard-cli** : Génération optimisée via Python
5. **Suivi en temps réel** : Les utilisateurs peuvent suivre la progression
6. **Limitation de taux** : Prévention des abus

---

## Architecture du système de preview

### Composants principaux

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Client                       │
│  - Demande de preview                                        │
│  - Polling du statut                                         │
│  - Affichage de la progression                              │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ POST /v1/preview/scene
                  │ GET /v1/preview/status/:id
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                   Preview Controller                         │
│  - Validation des requêtes                                   │
│  - Création d'entrées dans la DB                            │
│  - Envoie vers le système de génération                     │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                   Preview Repository                         │
│  - Gestion des données de preview                           │
│  - Mise à jour du statut                                     │
│  - Suivi de la progression                                  │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│              Système de génération                           │
│  - File d'attente des jobs                                  │
│  - Intégration whiteboard-cli                               │
│  - Génération de la vidéo                                   │
│  - Upload vers le stockage                                  │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                  Stockage (S3/MinIO/Cloud)                   │
│  - Fichiers vidéo MP4                                       │
│  - URLs publiques signées                                   │
│  - Gestion de la rétention                                  │
└─────────────────────────────────────────────────────────────┘
```

### Modèle de données

**Table `previews`** :

```typescript
interface Preview {
  id: string              // UUID du preview
  sceneId: string         // ID de la scène source
  userId: string          // ID de l'utilisateur
  status: PreviewStatus   // 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'
  progress: number        // 0-100
  currentStep?: string    // Étape en cours (ex: "Rendering frame 45/200")
  previewUrl?: string     // URL de la vidéo générée
  error?: string          // Message d'erreur si échec
  createdAt: Date         // Date de création
  completedAt?: Date      // Date de complétion
}
```

### Cycle de vie d'un preview

```
┌───────────┐     Création     ┌───────────┐     Traitement     ┌────────────┐
│  queued   │─────────────────▶│processing │───────────────────▶│ completed  │
└───────────┘                   └─────┬─────┘                    └────────────┘
                                      │
                                      │ Erreur/Annulation
                                      │
                                ┌─────▼─────┐
                                │  failed/  │
                                │ cancelled │
                                └───────────┘
```

---

## Génération des URLs de prévisualisation

### Formats d'URL supportés

#### 1. URL permanente (pour previews completed)

```
https://storage.doodlio.com/previews/{previewId}.mp4
```

**Caractéristiques** :
- Disponible après complétion
- Stockée de manière permanente (jusqu'à nettoyage)
- Accessible publiquement ou via signed URL

#### 2. URL signée temporaire (sécurisé)

```
https://storage.doodlio.com/previews/{previewId}.mp4?signature=xxx&expires=yyy
```

**Caractéristiques** :
- Expiration configurable (par défaut : 24h)
- Plus sécurisé
- Recommandé pour les previews sensibles

#### 3. URL de streaming (en cours de génération)

```
https://api.doodlio.com/v1/preview/stream/{previewId}
```

**Caractéristiques** :
- Streaming progressif pendant la génération
- Permet de voir les frames déjà rendus
- Optionnel (nécessite configuration spéciale)

### Génération de l'URL

**Stratégie par défaut** :

```typescript
// Dans PreviewController.completePreview()
const baseUrl = Bun.env.BASE_URL || 'https://api.doodlio.com'
const storageUrl = Bun.env.STORAGE_URL || `${baseUrl}/storage`

// Option 1 : URL direct depuis le storage service
const previewUrl = await storageService.getPublicUrl(`previews/${previewId}.mp4`)

// Option 2 : URL signée temporaire (recommandé)
const previewUrl = await storageService.getSignedUrl(
  `previews/${previewId}.mp4`,
  { expiresIn: 86400 } // 24 heures
)

// Option 3 : URL proxy via l'API
const previewUrl = `${baseUrl}/v1/preview/video/${previewId}`
```

### Naming convention des fichiers

```
previews/
  ├── {userId}/
  │   ├── {sceneId}/
  │   │   ├── {previewId}.mp4           # Vidéo finale
  │   │   ├── {previewId}_thumb.jpg     # Thumbnail
  │   │   └── {previewId}_metadata.json # Métadonnées
```

**Avantages** :
- Organisation par utilisateur et scène
- Facilite le nettoyage
- Permet des requêtes optimisées

---

## Stratégie de cache et optimisation

### 1. Cache des previews identiques

**Problème** : Si un utilisateur demande plusieurs fois un preview de la même scène sans modification.

**Solution** : Détection de contenu identique via hash

```typescript
interface CacheStrategy {
  // Calculer un hash du contenu de la scène
  sceneHash: string // MD5 ou SHA256 des données de la scène
  
  // Vérifier si un preview identique existe
  findExistingPreview(sceneHash: string, userId: string): Promise<Preview | null>
  
  // Réutiliser un preview existant
  reusePreview(existingPreviewId: string): Promise<Preview>
}
```

**Implémentation** :

```typescript
// Avant de créer un nouveau preview
const sceneHash = await calculateSceneHash(scene)
const existingPreview = await previewRepository.findBySceneHash(sceneHash, userId)

if (existingPreview && existingPreview.status === 'completed') {
  // Réutiliser le preview existant
  return {
    success: true,
    data: {
      previewId: existingPreview.id,
      previewUrl: existingPreview.previewUrl,
      cached: true
    }
  }
}
```

### 2. Cache des assets intermédiaires

**Problème** : Les scènes partagent souvent les mêmes assets (images, audio).

**Solution** : Cache partagé des ressources

```typescript
interface AssetCache {
  // Cache des images traitées
  processedImages: Map<string, Buffer>
  
  // Cache des audio traités
  processedAudio: Map<string, Buffer>
  
  // TTL du cache (Time To Live)
  ttl: number // 1 heure par défaut
}
```

### 3. Preview basse résolution (draft mode)

**Problème** : La génération en haute résolution est lente.

**Solution** : Option de preview rapide en basse résolution

```typescript
interface PreviewOptions {
  quality: 'draft' | 'standard' | 'high'
  resolution: {
    draft: '480p',      // Génération rapide (~5-10s)
    standard: '720p',   // Génération normale (~30-60s)
    high: '1080p'       // Génération lente (~2-5min)
  }
}
```

**Usage** :

```typescript
// Demander un draft preview pour itération rapide
POST /v1/preview/scene
{
  "sceneId": "uuid",
  "options": {
    "quality": "draft",
    "skipAudio": true  // Encore plus rapide
  }
}
```

### 4. Cache Redis pour les métadonnées

```typescript
// Cache des informations de preview dans Redis
const cacheKey = `preview:${previewId}:status`
await redis.setex(cacheKey, 300, JSON.stringify(previewStatus)) // 5 min TTL

// Évite les requêtes DB fréquentes pour le polling
const cachedStatus = await redis.get(cacheKey)
if (cachedStatus) {
  return JSON.parse(cachedStatus)
}
```

---

## Gestion des ressources

### 1. Limitation du nombre de previews actifs

**Configuration recommandée** :

```typescript
const PREVIEW_LIMITS = {
  // Par utilisateur
  maxConcurrentPreviews: 3,        // Max 3 previews simultanés par user
  maxQueuedPreviews: 10,           // Max 10 previews en attente par user
  
  // Global
  maxGlobalConcurrent: 50,         // Max 50 previews en traitement globalement
  
  // Limites de taux
  maxPreviewsPerHour: 20,          // Max 20 previews/heure par user
  maxPreviewsPerDay: 100           // Max 100 previews/jour par user
}
```

**Implémentation** :

```typescript
// Vérifier les limites avant création
const userActivePreviews = await previewRepository.countActivePreviews(userId)

if (userActivePreviews >= PREVIEW_LIMITS.maxConcurrentPreviews) {
  return {
    success: false,
    error: 'Too many active previews. Please wait for completion or cancel existing previews.'
  }
}
```

### 2. File d'attente avec priorités

```typescript
interface PreviewQueue {
  priority: 'high' | 'normal' | 'low'
  position: number
  estimatedTime: number // secondes
}

// Priorités
enum PreviewPriority {
  HIGH = 0,    // Utilisateurs premium
  NORMAL = 1,  // Utilisateurs gratuits
  LOW = 2      // Previews batch/automatiques
}
```

### 3. Nettoyage automatique

**Stratégies de nettoyage** :

```typescript
interface CleanupStrategy {
  // Supprimer les previews expirés
  deleteExpiredPreviews: {
    draftPreviews: 1 * 24 * 60 * 60 * 1000,      // 1 jour
    standardPreviews: 7 * 24 * 60 * 60 * 1000,   // 7 jours
    highPreviews: 30 * 24 * 60 * 60 * 1000       // 30 jours
  }
  
  // Supprimer les previews orphelins (scène supprimée)
  deleteOrphanedPreviews: true
  
  // Supprimer les previews échoués
  deleteFailedPreviews: 3 * 24 * 60 * 60 * 1000  // 3 jours
  
  // Supprimer les previews annulés
  deleteCancelledPreviews: 1 * 24 * 60 * 60 * 1000 // 1 jour
}
```

**Tâche cron** :

```typescript
// Exécuter toutes les heures
cron.schedule('0 * * * *', async () => {
  await cleanupExpiredPreviews()
  await cleanupOrphanedPreviews()
  await cleanupFailedPreviews()
})
```

### 4. Gestion du stockage

**Surveillance du stockage** :

```typescript
interface StorageMonitoring {
  // Alertes
  warningThreshold: 0.80,  // 80% de capacité
  criticalThreshold: 0.90, // 90% de capacité
  
  // Actions automatiques
  autoCleanupAtThreshold: 0.85, // Nettoyage auto à 85%
  
  // Statistiques
  totalPreviewsStorage: number  // en MB
  averagePreviewSize: number    // en MB
  oldestPreview: Date
}
```

---

## Intégration avec whiteboard-cli

### Vue d'ensemble

Le système utilise [whiteboard-cli](https://github.com/armelgeek/whiteboard-it), un script Python pour générer des vidéos d'animation whiteboard de haute qualité.

### Configuration

```typescript
// src/application/services/whiteboard.config.ts
export const whiteboardConfig = {
  pythonPath: process.env.PYTHON_PATH || '/usr/bin/python3',
  scriptPath: process.env.WHITEBOARD_CLI_PATH || '/opt/whiteboard-it/whiteboard_animator.py',
  
  // Paramètres par défaut
  defaultParams: {
    splitLen: 15,
    frameRate: 30,
    skipRate: 8,
    quality: 18,  // CRF (0-51, plus bas = meilleure qualité)
    aspectRatio: '16:9'
  },
  
  // Préréglages de qualité
  qualityPresets: {
    draft: { quality: 28, preview: true, resolution: '480p' },
    standard: { quality: 23, resolution: '720p' },
    high: { quality: 18, resolution: '1080p' }
  }
}
```

### Conversion de scène vers config whiteboard

```typescript
async function generateWhiteboardConfig(scene: Scene): Promise<WhiteboardConfig> {
  return {
    slides: scene.slides.map((slide, index) => ({
      index,
      duration: slide.duration || 3,
      skip_rate: slide.animationSpeed || 8,
      layers: slide.assets.map(asset => ({
        type: 'image',
        image_path: `/tmp/assets/${asset.id}.png`,
        z_index: asset.zIndex || 1,
        position: asset.position,
        scale: asset.scale || 1.0
      }))
    })),
    transitions: scene.transitions?.map(t => ({
      after_slide: t.afterSlide,
      type: t.type || 'fade',
      duration: t.duration || 0.5
    }))
  }
}
```

### Exécution du script

```typescript
import { spawn } from 'child_process'

async function executeWhiteboardCli(
  configPath: string,
  options: PreviewOptions
): Promise<string> {
  const args = [
    whiteboardConfig.scriptPath,
    '--config', configPath,
    '--quality', options.quality === 'draft' ? '28' : '18',
    '--aspect-ratio', options.aspectRatio || '16:9'
  ]
  
  if (options.quality === 'draft') {
    args.push('--preview')  // Mode rapide
  }
  
  return new Promise((resolve, reject) => {
    const process = spawn(whiteboardConfig.pythonPath, args)
    let outputPath = ''
    
    process.stdout.on('data', (data) => {
      const output = data.toString()
      
      // Extraire la progression
      const progressMatch = output.match(/Progress: (\d+)%/)
      if (progressMatch) {
        const progress = parseInt(progressMatch[1])
        // Mettre à jour le progress dans la DB
      }
      
      // Extraire le chemin de sortie
      const pathMatch = output.match(/Output: (.+\.mp4)/)
      if (pathMatch) {
        outputPath = pathMatch[1]
      }
    })
    
    process.on('close', (code) => {
      if (code === 0 && outputPath) {
        resolve(outputPath)
      } else {
        reject(new Error(`Whiteboard CLI exited with code ${code}`))
      }
    })
  })
}
```

### Workflow complet de génération

```typescript
async function processPreview Generation(previewId: string) {
  try {
    // 1. Initialisation
    await previewRepository.updateStatus(previewId, 'processing')
    await previewRepository.updateProgress(previewId, 0, 'Initializing...')
    
    // 2. Récupération des données
    const preview = await previewRepository.findById(previewId)
    const scene = await sceneRepository.findById(preview.sceneId)
    
    // 3. Génération de la configuration
    await previewRepository.updateProgress(previewId, 10, 'Preparing configuration...')
    const config = await generateWhiteboardConfig(scene)
    const configPath = `/tmp/preview_${previewId}_config.json`
    await fs.writeFile(configPath, JSON.stringify(config))
    
    // 4. Téléchargement des assets
    await previewRepository.updateProgress(previewId, 20, 'Downloading assets...')
    await downloadSceneAssets(scene)
    
    // 5. Génération de la vidéo
    await previewRepository.updateProgress(previewId, 30, 'Generating video...')
    const videoPath = await executeWhiteboardCli(configPath, { quality: 'standard' })
    
    // 6. Upload vers le stockage
    await previewRepository.updateProgress(previewId, 90, 'Uploading...')
    const previewUrl = await uploadToStorage(videoPath, `previews/${previewId}.mp4`)
    
    // 7. Complétion
    await previewRepository.updateStatus(previewId, 'completed', previewUrl)
    await previewRepository.updateProgress(previewId, 100, 'Completed')
    
    // 8. Nettoyage
    await cleanupTempFiles(previewId)
    
  } catch (error) {
    await previewRepository.updateStatus(previewId, 'failed', undefined, error.message)
  }
}
```

---

## Considérations de performance

### 1. Worker Pool pour génération parallèle

```typescript
class PreviewWorkerPool {
  private maxWorkers: number = 4
  private activeWorkers: number = 0
  private queue: PreviewJob[] = []
  
  async enqueue(job: PreviewJob) {
    this.queue.push(job)
    this.processNext()
  }
  
  private async processNext() {
    if (this.activeWorkers >= this.maxWorkers || this.queue.length === 0) {
      return
    }
    
    this.activeWorkers++
    const job = this.queue.shift()!
    
    try {
      await processPreviewGeneration(job.previewId)
    } finally {
      this.activeWorkers--
      this.processNext()
    }
  }
}
```

### 2. Métriques de performance

```typescript
interface PreviewMetrics {
  averageGenerationTime: number      // secondes
  p95GenerationTime: number
  successRate: number                // %
  queueLength: number
  totalStorageUsed: number           // GB
}

// Collecter les métriques
await metricsService.track('preview.generation.time', generationTime)
```

### 3. Optimisations

- **Pré-chauffage du cache** : Générer des previews pour les templates populaires
- **Compression adaptative** : Ajuster la qualité selon la complexité de la scène
- **Parallélisation** : Traiter plusieurs previews simultanément

---

## Sécurité

### 1. Validation des entrées

```typescript
const previewRequestSchema = z.object({
  sceneId: z.string().uuid(),
  options: z.object({
    quality: z.enum(['draft', 'standard', 'high']).default('standard'),
    aspectRatio: z.enum(['1:1', '16:9', '9:16']).default('16:9')
  }).optional()
})
```

### 2. Autorisation

```typescript
// Vérifier l'accès à la scène
const scene = await sceneRepository.findById(sceneId)
if (scene.userId !== user.id && !scene.isPublic) {
  throw new Error('Unauthorized')
}

// Vérifier les quotas
const quotaCheck = await checkUserQuota(user.id, 'preview')
if (!quotaCheck.allowed) {
  throw new Error('Quota exceeded')
}
```

### 3. URLs signées

```typescript
async function generateSignedUrl(
  previewId: string,
  expiresIn: number = 86400
): Promise<string> {
  const signature = crypto
    .createHmac('sha256', process.env.PREVIEW_SECRET!)
    .update(`${previewId}:${Date.now() + expiresIn * 1000}`)
    .digest('hex')
  
  return `${storageUrl}/previews/${previewId}.mp4?signature=${signature}&expires=${Date.now() + expiresIn * 1000}`
}
```

### 4. Rate Limiting

```typescript
const rateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000,  // 1 heure
  max: 20,                    // 20 previews max
  message: 'Too many preview requests'
})

app.use('/v1/preview/*', rateLimiter)
```

---

## Guide d'intégration API

### Créer un preview

```typescript
// POST /v1/preview/scene
const response = await fetch('https://api.doodlio.com/v1/preview/scene', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    sceneId: 'scene-uuid',
    options: {
      quality: 'draft',  // preview rapide
      aspectRatio: '16:9'
    }
  })
})

const { data } = await response.json()
// { previewId, status: 'queued', queuePosition: 2 }
```

### Polling du statut

```typescript
async function pollPreviewStatus(previewId: string): Promise<string> {
  while (true) {
    const response = await fetch(
      `https://api.doodlio.com/v1/preview/status/${previewId}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    )
    
    const { data } = await response.json()
    console.log(`Progress: ${data.progress}% - ${data.currentStep}`)
    
    if (data.status === 'completed') {
      return data.previewUrl!
    }
    
    if (data.status === 'failed') {
      throw new Error(data.error)
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000))  // 5s
  }
}
```

### Hook React

```typescript
function usePreview(sceneId: string) {
  const [state, setState] = useState({
    previewUrl: null,
    progress: 0,
    status: 'idle',
    error: null,
    isGenerating: false
  })
  
  const generatePreview = async () => {
    setState(s => ({ ...s, isGenerating: true, error: null }))
    
    const { data } = await fetch('/v1/preview/scene', {
      method: 'POST',
      body: JSON.stringify({ sceneId })
    }).then(r => r.json())
    
    // Polling...
    const previewUrl = await pollPreviewStatus(data.previewId)
    setState(s => ({ ...s, previewUrl, isGenerating: false }))
  }
  
  return { ...state, generatePreview }
}
```

---

## Workflow complet

### Workflow utilisateur

```
1. Utilisateur clique "Générer Preview"
   ↓
2. POST /v1/preview/scene → { previewId, status: 'queued' }
   ↓
3. Frontend démarre polling (GET /v1/preview/status/:id toutes les 5s)
   ↓
4. Backend traite le job :
   - status: 'processing', progress: 0-100
   - currentStep: "Rendering frame 45/200"
   ↓
5. Backend complete : status: 'completed', previewUrl disponible
   ↓
6. Frontend arrête le polling et affiche la vidéo
```

### Workflow avec cache

```
1. POST /v1/preview/scene
   ↓
2. Backend calcule sceneHash
   ↓
3. Backend cherche preview existant avec même hash
   ↓
4. Cache HIT → Retour immédiat avec previewUrl (< 100ms)
   OU
   Cache MISS → Génération normale
```

---

## Bonnes pratiques

### Pour les développeurs Frontend

✅ **DO** :
- Utiliser le polling avec intervalle de 5 secondes
- Afficher la progression en temps réel
- Permettre l'annulation des previews
- Utiliser qualité 'draft' pour itération rapide
- Implémenter un retry en cas d'échec

❌ **DON'T** :
- Ne pas faire de polling < 3 secondes
- Ne pas créer plusieurs previews identiques simultanément
- Ne pas bloquer l'UI pendant la génération

### Pour les développeurs Backend

✅ **DO** :
- Toujours valider les entrées
- Implémenter le rate limiting
- Logger toutes les générations
- Monitorer les métriques
- Nettoyer régulièrement les previews obsolètes

❌ **DON'T** :
- Ne pas bloquer la requête HTTP pendant la génération
- Ne pas stocker indéfiniment tous les previews
- Ne pas oublier de nettoyer les fichiers temporaires

---

## Dépannage

### Problèmes courants

#### "Preview generation timeout"

**Solutions** :
- Vérifier la charge CPU/RAM
- Augmenter le nombre de workers
- Utiliser qualité 'draft'
- Vérifier whiteboard-cli :

```bash
python3 /opt/whiteboard-it/whiteboard_animator.py --config test.json --preview
```

#### "Preview stuck in processing"

**Solutions** :
- Vérifier les logs du worker
- Redémarrer le worker pool
- Kill les processus zombies :

```bash
ps aux | grep whiteboard_animator
pkill -f whiteboard_animator
```

#### "Storage full"

**Solutions** :
- Exécuter le nettoyage manuel :

```typescript
// Supprimer previews > 30 jours
await previewRepository.deleteOlderThan(30 * 24 * 60 * 60 * 1000)
```

### Logs et monitoring

```bash
# Activer debug
DEBUG_PREVIEW=true LOG_LEVEL=debug

# Métriques
curl -H "Authorization: Bearer $TOKEN" \
  https://api.doodlio.com/v1/admin/metrics/previews/active
```

---

## Conclusion

La stratégie de prévisualisation de Doodlio est conçue pour :

1. ✅ **Scalabilité** : Supporter des centaines d'utilisateurs simultanés
2. ✅ **Performance** : Générations rapides avec cache intelligent
3. ✅ **Fiabilité** : Gestion robuste des erreurs et retry
4. ✅ **Optimisation** : Utilisation efficace des ressources
5. ✅ **Sécurité** : Validation, autorisation, rate limiting
6. ✅ **UX** : Progression en temps réel, annulation possible

### Points clés

- Les previews sont **asynchrones** par défaut
- Le **cache est essentiel** pour les performances
- Le **nettoyage automatique** évite la saturation
- **whiteboard-cli** gère la génération vidéo
- Le **polling 5s** est recommandé
- Les **URLs signées** expirent après 24h
- Les **limites de taux** préviennent les abus

### Ressources

- [Documentation whiteboard-cli](https://github.com/armelgeek/whiteboard-it)
- [Guide API Frontend](./FRONTEND_API_GUIDE.md)
- [Architecture Doodlio](./architecture/index.md)
- [Configuration du stockage](./STORAGE_ABSTRACTION.md)

---

**Version** : 1.0.0  
**Dernière mise à jour** : 2025-01-28  
**Auteur** : Équipe Doodlio
