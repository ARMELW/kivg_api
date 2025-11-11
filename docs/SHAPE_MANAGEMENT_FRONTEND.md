# Système de Gestion des Formes (Shapes) - Guide Frontend

## Date: November 1, 2025

## 📋 Vue d'ensemble

Ce document décrit l'implémentation complète d'un système de gestion des assets de formes (shapes) SVG côté frontend. Le système permet aux utilisateurs de télécharger, gérer, et utiliser des formes vectorielles dans leurs projets de vidéos whiteboard.

---

## 🎯 Fonctionnalités Disponibles

### Gestion des Formes
- ✅ Upload de fichiers SVG
- ✅ Liste des formes avec pagination, filtrage et tri
- ✅ Visualisation des détails d'une forme
- ✅ Modification des métadonnées (nom, tags, catégorie, propriétés)
- ✅ Suppression de formes
- ✅ Statistiques d'utilisation

### Propriétés des Formes
- **Données SVG complètes** (contenu, viewBox, path data)
- **Propriétés éditables** (couleur de remplissage, contour, épaisseur)
- **Catégorisation** (basic, arrow, callout, banner, icon, decorative, other)
- **Système de tags** pour l'organisation
- **Miniatures** générées automatiquement
- **Compteurs d'utilisation** et dernière utilisation

---

## 🔗 Endpoints API

### Base URL
```
https://api.doodlio.com/v1/shapes
```

### 1. Upload d'une Forme SVG

**Endpoint:** `POST /v1/shapes/upload`

**Authentication:** Bearer Token requis

**Content-Type:** `multipart/form-data`

#### Request
```typescript
// FormData structure
const formData = new FormData()
formData.append('file', svgFile) // File object
formData.append('name', 'Mon Cercle') // Optional
formData.append('category', 'basic') // Optional
formData.append('tags', JSON.stringify(['géométrie', 'simple'])) // Optional
```

#### Categories disponibles
- `basic` - Formes basiques (cercle, carré, triangle)
- `arrow` - Flèches directionnelles
- `callout` - Bulles de texte et callouts
- `banner` - Bannières et rubans
- `icon` - Icônes vectorielles
- `decorative` - Éléments décoratifs
- `other` - Autres formes

#### Response Success (200)
```typescript
interface UploadShapeResponse {
  success: true
  data: {
    id: string // UUID
    name: string
    url: string // URL du fichier SVG
    thumbnailUrl?: string // URL de la miniature PNG
    type: 'svg' | 'path' | 'geometric'
    size: number // Taille en bytes
    width?: number // Largeur en pixels
    height?: number // Hauteur en pixels
    tags: string[]
    category: string
    shapeData?: {
      svgContent?: string // Contenu SVG complet
      pathData?: string // Données du path SVG
      viewBox?: string // ViewBox SVG (ex: "0 0 100 100")
      fill?: string // Couleur de remplissage par défaut
      stroke?: string // Couleur du contour
      strokeWidth?: number // Épaisseur du contour
      isEditable?: boolean // Si les couleurs sont éditables
    }
    uploadedAt: string // ISO 8601
    userId: string
    usageCount: number
  }
}
```

#### Errors
```typescript
// 400 - Erreur de validation
{
  success: false,
  error: "File must be an SVG" | "No file provided" | "Invalid SVG file format"
}

// 401 - Non authentifié
{
  success: false,
  error: "Unauthorized"
}

// 413 - Fichier trop volumineux
{
  success: false,
  error: "File size must be less than 5MB"
}
```

#### Exemple d'implémentation
```typescript
async function uploadShape(file: File, metadata?: {
  name?: string
  category?: string
  tags?: string[]
}): Promise<UploadShapeResponse> {
  const formData = new FormData()
  formData.append('file', file)
  
  if (metadata?.name) {
    formData.append('name', metadata.name)
  }
  
  if (metadata?.category) {
    formData.append('category', metadata.category)
  }
  
  if (metadata?.tags && metadata.tags.length > 0) {
    formData.append('tags', JSON.stringify(metadata.tags))
  }
  
  const response = await fetch('https://api.doodlio.com/v1/shapes/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    },
    body: formData
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Upload failed')
  }
  
  return response.json()
}
```

---

### 2. Lister les Formes

**Endpoint:** `GET /v1/shapes`

**Authentication:** Bearer Token requis

#### Query Parameters
```typescript
interface ListShapesParams {
  page?: number // Défaut: 1
  limit?: number // Défaut: 20, Max: 100
  filter?: string // Recherche dans le nom
  category?: 'basic' | 'arrow' | 'callout' | 'banner' | 'icon' | 'decorative' | 'other'
  tags?: string[] // Filtrer par tags
  sortBy?: 'name' | 'uploadDate' | 'size' | 'usageCount' // Défaut: uploadDate
  sortOrder?: 'asc' | 'desc' // Défaut: desc
}
```

#### Response Success (200)
```typescript
interface ListShapesResponse {
  success: true
  data: ShapeAsset[] // Array de formes
  total: number // Nombre total de formes
  page: number // Page actuelle
  limit: number // Limite par page
}
```

#### Exemple d'implémentation
```typescript
async function listShapes(params?: ListShapesParams): Promise<ListShapesResponse> {
  const queryParams = new URLSearchParams()
  
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.limit) queryParams.append('limit', params.limit.toString())
  if (params?.filter) queryParams.append('filter', params.filter)
  if (params?.category) queryParams.append('category', params.category)
  if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
  if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)
  
  const response = await fetch(
    `https://api.doodlio.com/v1/shapes?${queryParams.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    }
  )
  
  return response.json()
}

// Exemple d'utilisation avec React Query
import { useQuery } from '@tanstack/react-query'

function useShapes(params?: ListShapesParams) {
  return useQuery({
    queryKey: ['shapes', params],
    queryFn: () => listShapes(params),
    staleTime: 5 * 60 * 1000 // 5 minutes (cache côté serveur)
  })
}
```

---

### 3. Obtenir une Forme par ID

**Endpoint:** `GET /v1/shapes/{id}`

**Authentication:** Bearer Token requis

#### Response Success (200)
```typescript
interface GetShapeResponse {
  success: true
  data: ShapeAsset
}
```

#### Response Error (404)
```typescript
{
  success: false,
  error: "Shape not found"
}
```

#### Exemple d'implémentation
```typescript
async function getShape(id: string): Promise<ShapeAsset> {
  const response = await fetch(`https://api.doodlio.com/v1/shapes/${id}`, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  })
  
  if (!response.ok) {
    throw new Error('Shape not found')
  }
  
  const result = await response.json()
  return result.data
}

// Avec React Query
function useShape(id: string) {
  return useQuery({
    queryKey: ['shape', id],
    queryFn: () => getShape(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000 // 10 minutes
  })
}
```

---

### 4. Mettre à jour une Forme

**Endpoint:** `PUT /v1/shapes/{id}`

**Authentication:** Bearer Token requis

**Content-Type:** `application/json`

#### Request Body
```typescript
interface UpdateShapeRequest {
  name?: string
  tags?: string[]
  category?: 'basic' | 'arrow' | 'callout' | 'banner' | 'icon' | 'decorative' | 'other'
  shapeData?: {
    fill?: string // Nouvelle couleur de remplissage
    stroke?: string // Nouvelle couleur du contour
    strokeWidth?: number // Nouvelle épaisseur du contour
    isEditable?: boolean // Si modifiable
  }
}
```

#### Response Success (200)
```typescript
interface UpdateShapeResponse {
  success: true
  data: ShapeAsset
}
```

#### Exemple d'implémentation
```typescript
async function updateShape(
  id: string,
  updates: UpdateShapeRequest
): Promise<ShapeAsset> {
  const response = await fetch(`https://api.doodlio.com/v1/shapes/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Update failed')
  }
  
  const result = await response.json()
  return result.data
}

// Avec React Query Mutation
import { useMutation, useQueryClient } from '@tanstack/react-query'

function useUpdateShape() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateShapeRequest }) =>
      updateShape(id, updates),
    onSuccess: (data) => {
      // Invalider les caches
      queryClient.invalidateQueries({ queryKey: ['shapes'] })
      queryClient.invalidateQueries({ queryKey: ['shape', data.id] })
      queryClient.invalidateQueries({ queryKey: ['shape-stats'] })
    }
  })
}
```

---

### 5. Supprimer une Forme

**Endpoint:** `DELETE /v1/shapes/{id}`

**Authentication:** Bearer Token requis

#### Response Success (200)
```typescript
interface DeleteShapeResponse {
  success: true
  id: string
  message: "Shape deleted successfully"
}
```

#### Exemple d'implémentation
```typescript
async function deleteShape(id: string): Promise<void> {
  const response = await fetch(`https://api.doodlio.com/v1/shapes/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Delete failed')
  }
}

// Avec React Query Mutation
function useDeleteShape() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteShape,
    onSuccess: (_, deletedId) => {
      // Invalider les caches
      queryClient.invalidateQueries({ queryKey: ['shapes'] })
      queryClient.removeQueries({ queryKey: ['shape', deletedId] })
      queryClient.invalidateQueries({ queryKey: ['shape-stats'] })
    }
  })
}
```

---

### 6. Statistiques des Formes

**Endpoint:** `GET /v1/shapes/stats`

**Authentication:** Bearer Token requis

#### Response Success (200)
```typescript
interface ShapeStatsResponse {
  success: true
  data: {
    totalShapes: number
    totalSize: number // En bytes
    totalSizeMB: string // Formaté (ex: "12.45")
    shapesByCategory: {
      basic: number
      arrow: number
      callout: number
      banner: number
      icon: number
      decorative: number
      other: number
    }
    mostUsedShapes?: ShapeAsset[] // Top 5
    recentlyUploaded?: ShapeAsset[] // 5 dernières
  }
}
```

#### Exemple d'implémentation
```typescript
async function getShapeStats(): Promise<ShapeStatsResponse['data']> {
  const response = await fetch('https://api.doodlio.com/v1/shapes/stats', {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  })
  
  const result = await response.json()
  return result.data
}

// Avec React Query
function useShapeStats() {
  return useQuery({
    queryKey: ['shape-stats'],
    queryFn: getShapeStats,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })
}
```

---

## 🎨 Composants React Recommandés

### 1. Shape Upload Component

```tsx
import React, { useState } from 'react'
import { useUploadShape } from '@/hooks/useShapes'

interface ShapeUploadProps {
  onSuccess?: (shape: ShapeAsset) => void
}

export function ShapeUpload({ onSuccess }: ShapeUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<string>('other')
  const [tags, setTags] = useState<string[]>([])
  
  const uploadMutation = useUploadShape()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file) return
    
    try {
      const result = await uploadMutation.mutateAsync({
        file,
        name: name || file.name,
        category,
        tags
      })
      
      onSuccess?.(result.data)
      
      // Reset form
      setFile(null)
      setName('')
      setCategory('other')
      setTags([])
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate SVG
      if (!selectedFile.type.includes('svg') && !selectedFile.name.endsWith('.svg')) {
        alert('Veuillez sélectionner un fichier SVG')
        return
      }
      
      // Validate size (5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert('Le fichier est trop volumineux (max 5MB)')
        return
      }
      
      setFile(selectedFile)
      if (!name) {
        setName(selectedFile.name.replace('.svg', ''))
      }
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Fichier SVG
        </label>
        <input
          type="file"
          accept=".svg,image/svg+xml"
          onChange={handleFileChange}
          className="block w-full"
          required
        />
        {file && (
          <p className="text-sm text-gray-500 mt-1">
            {file.name} - {(file.size / 1024).toFixed(2)} KB
          </p>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">
          Nom de la forme
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          placeholder="Nom de la forme"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">
          Catégorie
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="basic">Basique</option>
          <option value="arrow">Flèche</option>
          <option value="callout">Callout</option>
          <option value="banner">Bannière</option>
          <option value="icon">Icône</option>
          <option value="decorative">Décoratif</option>
          <option value="other">Autre</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">
          Tags (séparés par des virgules)
        </label>
        <input
          type="text"
          value={tags.join(', ')}
          onChange={(e) => setTags(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
          className="w-full px-3 py-2 border rounded"
          placeholder="géométrie, simple, moderne"
        />
      </div>
      
      <button
        type="submit"
        disabled={!file || uploadMutation.isPending}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {uploadMutation.isPending ? 'Upload en cours...' : 'Uploader'}
      </button>
      
      {uploadMutation.isError && (
        <p className="text-red-600 text-sm">
          Erreur: {uploadMutation.error.message}
        </p>
      )}
    </form>
  )
}
```

---

### 2. Shape Library Component

```tsx
import React, { useState } from 'react'
import { useShapes, useDeleteShape } from '@/hooks/useShapes'

interface ShapeLibraryProps {
  onSelectShape?: (shape: ShapeAsset) => void
}

export function ShapeLibrary({ onSelectShape }: ShapeLibraryProps) {
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('')
  const [category, setCategory] = useState<string>()
  const [sortBy, setSortBy] = useState<'name' | 'uploadDate' | 'usageCount'>('uploadDate')
  
  const { data, isLoading, error } = useShapes({
    page,
    limit: 20,
    filter,
    category,
    sortBy,
    sortOrder: 'desc'
  })
  
  const deleteMutation = useDeleteShape()
  
  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette forme ?')) {
      try {
        await deleteMutation.mutateAsync(id)
      } catch (error) {
        console.error('Delete failed:', error)
      }
    }
  }
  
  if (isLoading) return <div>Chargement...</div>
  if (error) return <div>Erreur: {error.message}</div>
  
  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex gap-4">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Rechercher..."
          className="flex-1 px-3 py-2 border rounded"
        />
        
        <select
          value={category || ''}
          onChange={(e) => setCategory(e.target.value || undefined)}
          className="px-3 py-2 border rounded"
        >
          <option value="">Toutes les catégories</option>
          <option value="basic">Basique</option>
          <option value="arrow">Flèche</option>
          <option value="callout">Callout</option>
          <option value="banner">Bannière</option>
          <option value="icon">Icône</option>
          <option value="decorative">Décoratif</option>
          <option value="other">Autre</option>
        </select>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-2 border rounded"
        >
          <option value="uploadDate">Date d'upload</option>
          <option value="name">Nom</option>
          <option value="usageCount">Utilisation</option>
        </select>
      </div>
      
      {/* Grid de formes */}
      <div className="grid grid-cols-4 gap-4">
        {data?.data.map((shape) => (
          <div
            key={shape.id}
            className="border rounded p-4 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onSelectShape?.(shape)}
          >
            {/* Miniature */}
            {shape.thumbnailUrl ? (
              <img
                src={shape.thumbnailUrl}
                alt={shape.name}
                className="w-full h-32 object-contain mb-2"
              />
            ) : (
              <div className="w-full h-32 bg-gray-100 flex items-center justify-center mb-2">
                <span className="text-gray-400">SVG</span>
              </div>
            )}
            
            {/* Info */}
            <h3 className="font-medium truncate" title={shape.name}>
              {shape.name}
            </h3>
            <p className="text-sm text-gray-500">
              {shape.category} • {shape.usageCount} utilisations
            </p>
            
            {/* Tags */}
            {shape.tags.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {shape.tags.slice(0, 3).map((tag, i) => (
                  <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            {/* Actions */}
            <div className="flex gap-2 mt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(shape.id)
                }}
                className="text-sm text-red-600 hover:underline"
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Pagination */}
      {data && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {data.total} formes au total
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Précédent
            </button>
            <span className="px-3 py-1">
              Page {page} / {Math.ceil(data.total / 20)}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(data.total / 20)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

---

### 3. Shape Preview Component

```tsx
import React, { useState } from 'react'

interface ShapePreviewProps {
  shape: ShapeAsset
  editable?: boolean
}

export function ShapePreview({ shape, editable = false }: ShapePreviewProps) {
  const [fill, setFill] = useState(shape.shapeData?.fill || '#000000')
  const [stroke, setStroke] = useState(shape.shapeData?.stroke || '#000000')
  const [strokeWidth, setStrokeWidth] = useState(shape.shapeData?.strokeWidth || 1)
  
  // Modifier le SVG avec les nouvelles couleurs
  const modifiedSvg = React.useMemo(() => {
    if (!shape.shapeData?.svgContent) return null
    
    let svg = shape.shapeData.svgContent
    
    if (editable && shape.shapeData.isEditable) {
      // Remplacer les couleurs dans le SVG
      svg = svg.replace(/fill="[^"]*"/g, `fill="${fill}"`)
      svg = svg.replace(/stroke="[^"]*"/g, `stroke="${stroke}"`)
      svg = svg.replace(/stroke-width="[^"]*"/g, `stroke-width="${strokeWidth}"`)
    }
    
    return svg
  }, [shape, fill, stroke, strokeWidth, editable])
  
  return (
    <div className="space-y-4">
      {/* Prévisualisation */}
      <div className="border rounded p-8 bg-white">
        {modifiedSvg ? (
          <div
            dangerouslySetInnerHTML={{ __html: modifiedSvg }}
            className="w-full h-64 flex items-center justify-center"
          />
        ) : (
          <img
            src={shape.url}
            alt={shape.name}
            className="w-full h-64 object-contain"
          />
        )}
      </div>
      
      {/* Contrôles d'édition */}
      {editable && shape.shapeData?.isEditable && (
        <div className="space-y-2">
          <h3 className="font-medium">Personnalisation</h3>
          
          <div>
            <label className="block text-sm mb-1">Couleur de remplissage</label>
            <input
              type="color"
              value={fill}
              onChange={(e) => setFill(e.target.value)}
              className="w-full h-10"
            />
          </div>
          
          <div>
            <label className="block text-sm mb-1">Couleur du contour</label>
            <input
              type="color"
              value={stroke}
              onChange={(e) => setStroke(e.target.value)}
              className="w-full h-10"
            />
          </div>
          
          <div>
            <label className="block text-sm mb-1">
              Épaisseur du contour: {strokeWidth}px
            </label>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      )}
      
      {/* Informations */}
      <div className="text-sm space-y-1">
        <p><strong>Nom:</strong> {shape.name}</p>
        <p><strong>Catégorie:</strong> {shape.category}</p>
        {shape.width && shape.height && (
          <p><strong>Dimensions:</strong> {shape.width} × {shape.height}px</p>
        )}
        <p><strong>Taille:</strong> {(shape.size / 1024).toFixed(2)} KB</p>
        <p><strong>Utilisations:</strong> {shape.usageCount}</p>
        {shape.tags.length > 0 && (
          <p><strong>Tags:</strong> {shape.tags.join(', ')}</p>
        )}
      </div>
    </div>
  )
}
```

---

### 4. Custom Hooks

```typescript
// hooks/useShapes.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export function useUploadShape() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: {
      file: File
      name?: string
      category?: string
      tags?: string[]
    }) => {
      const formData = new FormData()
      formData.append('file', data.file)
      if (data.name) formData.append('name', data.name)
      if (data.category) formData.append('category', data.category)
      if (data.tags) formData.append('tags', JSON.stringify(data.tags))
      
      const response = await fetch('/v1/shapes/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` },
        body: formData
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shapes'] })
      queryClient.invalidateQueries({ queryKey: ['shape-stats'] })
    }
  })
}

export function useShapes(params?: ListShapesParams) {
  return useQuery({
    queryKey: ['shapes', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams()
      // ... construire les params
      
      const response = await fetch(`/v1/shapes?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      })
      
      return response.json()
    },
    staleTime: 5 * 60 * 1000
  })
}

export function useShape(id: string) {
  return useQuery({
    queryKey: ['shape', id],
    queryFn: async () => {
      const response = await fetch(`/v1/shapes/${id}`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      })
      
      const result = await response.json()
      return result.data
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000
  })
}

export function useUpdateShape() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: { id: string; updates: UpdateShapeRequest }) => {
      const response = await fetch(`/v1/shapes/${data.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data.updates)
      })
      
      const result = await response.json()
      return result.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shapes'] })
      queryClient.invalidateQueries({ queryKey: ['shape', data.id] })
      queryClient.invalidateQueries({ queryKey: ['shape-stats'] })
    }
  })
}

export function useDeleteShape() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/v1/shapes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['shapes'] })
      queryClient.removeQueries({ queryKey: ['shape', id] })
      queryClient.invalidateQueries({ queryKey: ['shape-stats'] })
    }
  })
}

export function useShapeStats() {
  return useQuery({
    queryKey: ['shape-stats'],
    queryFn: async () => {
      const response = await fetch('/v1/shapes/stats', {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      })
      
      const result = await response.json()
      return result.data
    },
    staleTime: 5 * 60 * 1000
  })
}
```

---

## 📦 Types TypeScript

```typescript
// types/shape.ts

export interface ShapeAsset {
  id: string
  userId: string
  name: string
  url: string
  thumbnailUrl?: string
  type: 'svg' | 'path' | 'geometric'
  size: number
  width?: number
  height?: number
  tags: string[]
  category: 'basic' | 'arrow' | 'callout' | 'banner' | 'icon' | 'decorative' | 'other'
  shapeData?: {
    svgContent?: string
    pathData?: string
    viewBox?: string
    fill?: string
    stroke?: string
    strokeWidth?: number
    isEditable?: boolean
  }
  lastUsed?: string
  usageCount: number
  uploadedAt: string
  updatedAt: string
}

export interface ListShapesParams {
  page?: number
  limit?: number
  filter?: string
  category?: ShapeAsset['category']
  tags?: string[]
  sortBy?: 'name' | 'uploadDate' | 'size' | 'usageCount'
  sortOrder?: 'asc' | 'desc'
}

export interface UpdateShapeRequest {
  name?: string
  tags?: string[]
  category?: ShapeAsset['category']
  shapeData?: {
    fill?: string
    stroke?: string
    strokeWidth?: number
    isEditable?: boolean
  }
}

export interface ShapeStats {
  totalShapes: number
  totalSize: number
  totalSizeMB: string
  shapesByCategory: Record<string, number>
  mostUsedShapes?: ShapeAsset[]
  recentlyUploaded?: ShapeAsset[]
}
```

---

## 🎯 Intégration dans les Scènes

### Ajouter une Forme dans une Scène

Lorsqu'un utilisateur sélectionne une forme pour l'ajouter à une scène:

```typescript
import { useUpdateScene } from '@/hooks/useScenes'

function addShapeToScene(scene: Scene, shape: ShapeAsset) {
  const newLayer: Layer = {
    id: generateId(),
    name: shape.name,
    type: 'shape',
    mode: 'static',
    position: { x: 960, y: 540 }, // Centre de la scène
    width: shape.width || 200,
    height: shape.height || 200,
    zIndex: scene.layers.length,
    scale: 1,
    opacity: 1,
    imagePath: shape.url, // URL du SVG
    // Propriétés spécifiques aux formes
    metadata: {
      shapeId: shape.id,
      fill: shape.shapeData?.fill,
      stroke: shape.shapeData?.stroke,
      strokeWidth: shape.shapeData?.strokeWidth,
      isEditable: shape.shapeData?.isEditable,
      svgContent: shape.shapeData?.svgContent,
      viewBox: shape.shapeData?.viewBox
    }
  }
  
  const updatedScene = {
    ...scene,
    layers: [...scene.layers, newLayer]
  }
  
  // Mettre à jour la scène
  return updatedScene
}

// Utilisation dans un composant
function ShapeSelector({ sceneId }: { sceneId: string }) {
  const { data: scene } = useScene(sceneId)
  const updateScene = useUpdateScene()
  
  const handleSelectShape = async (shape: ShapeAsset) => {
    if (!scene) return
    
    const updatedScene = addShapeToScene(scene, shape)
    
    await updateScene.mutateAsync({
      id: sceneId,
      updates: { layers: updatedScene.layers }
    })
  }
  
  return (
    <ShapeLibrary onSelectShape={handleSelectShape} />
  )
}
```

---

## ⚡ Optimisations et Bonnes Pratiques

### 1. Caching Intelligent

```typescript
// Utiliser React Query avec des temps de cache appropriés
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (anciennement cacheTime)
      refetchOnWindowFocus: false
    }
  }
})

// Précharger les formes populaires
function prefetchPopularShapes() {
  queryClient.prefetchQuery({
    queryKey: ['shapes', { sortBy: 'usageCount', limit: 20 }],
    queryFn: () => listShapes({ sortBy: 'usageCount', limit: 20 })
  })
}
```

### 2. Lazy Loading des SVG

```typescript
// Charger le contenu SVG seulement quand nécessaire
function useSvgContent(shape: ShapeAsset) {
  return useQuery({
    queryKey: ['svg-content', shape.id],
    queryFn: async () => {
      const response = await fetch(shape.url)
      return response.text()
    },
    enabled: !!shape.url,
    staleTime: Infinity // Le SVG ne change pas
  })
}
```

### 3. Optimisation des Miniatures

```typescript
// Utiliser les miniatures pour la liste, le SVG complet pour l'édition
function ShapeCard({ shape }: { shape: ShapeAsset }) {
  const [showFullSvg, setShowFullSvg] = useState(false)
  
  return (
    <div>
      {showFullSvg ? (
        <img src={shape.url} alt={shape.name} />
      ) : (
        <img src={shape.thumbnailUrl || shape.url} alt={shape.name} />
      )}
    </div>
  )
}
```

### 4. Validation Côté Client

```typescript
function validateSvgFile(file: File): string | null {
  // Vérifier le type
  if (!file.type.includes('svg') && !file.name.endsWith('.svg')) {
    return 'Le fichier doit être au format SVG'
  }
  
  // Vérifier la taille (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    return 'Le fichier est trop volumineux (maximum 5MB)'
  }
  
  return null
}

// Utilisation
const error = validateSvgFile(file)
if (error) {
  alert(error)
  return
}
```

---

## 🔒 Sécurité

### 1. Sanitization SVG

Le backend sanitize automatiquement les SVG:
- Suppression des balises `<script>`
- Suppression des gestionnaires d'événements (`onclick`, etc.)
- Suppression des URLs `javascript:`

### 2. Authentication

Tous les endpoints nécessitent un Bearer Token valide:

```typescript
// Configurer l'authentification globalement
const apiClient = axios.create({
  baseURL: 'https://api.doodlio.com',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  }
})

// Ou avec fetch
function getAuthHeaders() {
  return {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  }
}
```

---

## 🧪 Testing

### Exemple de Tests avec Vitest/React Testing Library

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ShapeUpload } from './ShapeUpload'

describe('ShapeUpload', () => {
  it('should upload a shape successfully', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    
    render(<ShapeUpload onSuccess={onSuccess} />)
    
    // Créer un fichier SVG fictif
    const file = new File(
      ['<svg><circle r="50"/></svg>'],
      'circle.svg',
      { type: 'image/svg+xml' }
    )
    
    // Sélectionner le fichier
    const input = screen.getByLabelText(/fichier svg/i)
    await user.upload(input, file)
    
    // Remplir le formulaire
    await user.type(screen.getByLabelText(/nom/i), 'Mon Cercle')
    
    // Soumettre
    await user.click(screen.getByRole('button', { name: /uploader/i }))
    
    // Vérifier le succès
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })
  
  it('should reject non-SVG files', async () => {
    const user = userEvent.setup()
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    
    render(<ShapeUpload />)
    
    const file = new File(['content'], 'image.png', { type: 'image/png' })
    const input = screen.getByLabelText(/fichier svg/i)
    
    await user.upload(input, file)
    
    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringContaining('SVG')
    )
  })
})
```

---

## 📊 Monitoring et Analytics

### Tracker l'utilisation des formes

```typescript
// Envoyer des événements analytics
function trackShapeUsage(shape: ShapeAsset, action: string) {
  // Google Analytics
  gtag('event', 'shape_action', {
    action,
    shape_id: shape.id,
    shape_name: shape.name,
    category: shape.category
  })
  
  // Ou votre propre système d'analytics
  analytics.track('Shape Action', {
    action,
    shapeId: shape.id,
    shapeName: shape.name,
    category: shape.category
  })
}

// Utilisation
trackShapeUsage(shape, 'added_to_scene')
trackShapeUsage(shape, 'downloaded')
trackShapeUsage(shape, 'deleted')
```

---

## 🚀 Checklist d'Implémentation

### Backend (✅ Complété)
- [x] API endpoints créés
- [x] Base de données configurée
- [x] Upload et traitement SVG
- [x] Génération de miniatures
- [x] Sanitization SVG
- [x] Caching Redis
- [x] Rate limiting

### Frontend (À implémenter)
- [ ] Types TypeScript définis
- [ ] Hooks React Query créés
- [ ] Composant d'upload
- [ ] Bibliothèque de formes
- [ ] Prévisualisation avec édition
- [ ] Intégration dans l'éditeur de scènes
- [ ] Gestion des erreurs
- [ ] Loading states
- [ ] Tests unitaires
- [ ] Tests d'intégration
- [ ] Documentation utilisateur

---

## 📞 Support

Pour toute question ou problème:
- Consulter la documentation API: `https://api.doodlio.com/docs`
- Vérifier les logs d'erreur dans la console
- Contacter l'équipe backend pour les problèmes d'API

---

**Version**: 1.0.0  
**Date**: November 1, 2025  
**Auteur**: Backend Team - Doodlio
