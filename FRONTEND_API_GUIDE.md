# Guide Complet de l'API Doodlio pour le Frontend

Guide complet d'intégration de l'API Doodlio pour les développeurs frontend. Ce document contient tous les endpoints disponibles, les payloads requis, les formats de réponse et des exemples de code.

## Table des Matières

1. [Configuration Initiale](#configuration-initiale)
2. [Authentification](#authentification)
3. [Gestion des Erreurs](#gestion-des-erreurs)
4. [Endpoints](#endpoints)
   - [User (Utilisateur)](#user-utilisateur)
   - [Channels (Canaux)](#channels-canaux)
   - [Projects (Projets)](#projects-projets)
   - [Scenes](#scenes)
   - [Assets (Images)](#assets-images)
   - [Audio](#audio)
   - [Templates](#templates)
   - [Export](#export)
   - [AI (Intelligence Artificielle)](#ai-intelligence-artificielle)
   - [Fonts (Polices)](#fonts-polices)
   - [Pricing (Tarifs)](#pricing-tarifs)
   - [Upload](#upload)
   - [User API Keys](#user-api-keys)
   - [AI Usage](#ai-usage)
   - [Permissions](#permissions)
   - [Health & Monitoring](#health--monitoring)

---

## Configuration Initiale

### Base URL

```
Production: https://api.doodlio.com
Development: http://localhost:3000
```

### Headers Requis

```javascript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer YOUR_SESSION_TOKEN'
}
```

### Client HTTP Recommandé (TypeScript/JavaScript)

```typescript
// Configuration du client HTTP
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class APIClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Une erreur est survenue');
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async uploadFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    const headers: HeadersInit = {};
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  }
}

export const apiClient = new APIClient(API_BASE_URL);
```

---

## Authentification

L'API utilise **Better Auth** pour l'authentification. Le token de session doit être inclus dans toutes les requêtes authentifiées.

### Obtenir le Token de Session

```typescript
// Après connexion avec Better Auth
const session = await auth.api.getSession({
  headers: request.headers,
});

if (session) {
  apiClient.setToken(session.token);
}
```

---

## Gestion des Erreurs

### Format de Réponse d'Erreur

```json
{
  "success": false,
  "error": "Message d'erreur descriptif"
}
```

### Codes d'Erreur HTTP

- `400` - Requête invalide
- `401` - Non authentifié
- `403` - Non autorisé
- `404` - Ressource non trouvée
- `413` - Fichier trop volumineux
- `500` - Erreur serveur

### Exemple de Gestion des Erreurs

```typescript
try {
  const response = await apiClient.post('/v1/projects', projectData);
  console.log('Success:', response.data);
} catch (error) {
  if (error.message.includes('Unauthorized')) {
    // Rediriger vers la page de connexion
    router.push('/login');
  } else {
    // Afficher le message d'erreur
    toast.error(error.message);
  }
}
```

---

## Endpoints

### User (Utilisateur)

#### Obtenir les Informations de Session

**Endpoint:** `GET /v1/users/session`

**Authentification:** Requise

**Réponse:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_ABC123",
      "name": "John Doe",
      "email": "john@example.com",
      "emailVerified": true,
      "image": "https://...",
      "createdAt": "2025-05-06T16:34:49.937Z",
      "updatedAt": "2025-05-06T16:34:49.937Z",
      "isAdmin": false,
      "subscriptionPlan": "pro"
    }
  }
}
```

**Exemple TypeScript:**
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
  isAdmin: boolean;
  subscriptionPlan: string;
}

interface GetUserSessionResponse {
  success: boolean;
  data: {
    user: User;
  };
}

const getUserSession = async (): Promise<User> => {
  const response = await apiClient.get<GetUserSessionResponse>('/v1/users/session');
  return response.data.user;
};

// Utilisation
const user = await getUserSession();
console.log('Current user:', user);
```

---

### Channels (Canaux)

Les canaux permettent d'organiser les projets par marque ou client.

#### Créer un Canal

**Endpoint:** `POST /v1/channels`

**Authentification:** Requise

**Payload:**
```json
{
  "name": "Mon Canal YouTube",
  "description": "Canal pour les vidéos marketing",
  "youtubeUrl": "https://youtube.com/@moncanal"
}
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user_ABC123",
    "name": "Mon Canal YouTube",
    "description": "Canal pour les vidéos marketing",
    "youtubeUrl": "https://youtube.com/@moncanal",
    "brandKit": {
      "logoUrl": null,
      "colors": {
        "primary": "#3B82F6",
        "secondary": "#10B981",
        "accent": "#F59E0B"
      },
      "introVideoUrl": null,
      "outroVideoUrl": null,
      "customFonts": null
    },
    "status": "active",
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z"
  }
}
```

**Exemple TypeScript:**
```typescript
interface CreateChannelRequest {
  name: string;
  description?: string;
  youtubeUrl?: string;
}

interface BrandKit {
  logoUrl: string | null;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  introVideoUrl: string | null;
  outroVideoUrl: string | null;
  customFonts: any | null;
}

interface Channel {
  id: string;
  userId: string;
  name: string;
  description?: string;
  youtubeUrl?: string;
  brandKit: BrandKit;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

interface CreateChannelResponse {
  success: boolean;
  data: Channel;
}

const createChannel = async (data: CreateChannelRequest): Promise<Channel> => {
  const response = await apiClient.post<CreateChannelResponse>(
    '/v1/channels',
    data
  );
  return response.data;
};

// Utilisation
const newChannel = await createChannel({
  name: 'Mon Canal YouTube',
  description: 'Canal pour les vidéos marketing',
  youtubeUrl: 'https://youtube.com/@moncanal'
});
```

#### Lister les Canaux

**Endpoint:** `GET /v1/channels`

**Authentification:** Requise

**Paramètres de Query:**
- `page` (optionnel): Numéro de page (défaut: 1)
- `limit` (optionnel): Nombre de résultats par page (défaut: 10)
- `status` (optionnel): Filtrer par statut ('active' | 'archived')

**Exemple de Requête:**
```
GET /v1/channels?page=1&limit=10&status=active
```

**Réponse:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Mon Canal YouTube",
      "description": "Canal pour les vidéos marketing",
      "status": "active",
      "brandKit": {...},
      "createdAt": "2025-01-15T10:00:00.000Z"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 10
}
```

**Exemple TypeScript:**
```typescript
interface ListChannelsParams {
  page?: number;
  limit?: number;
  status?: 'active' | 'archived';
}

interface ListChannelsResponse {
  success: boolean;
  data: Channel[];
  total: number;
  page: number;
  limit: number;
}

const listChannels = async (params: ListChannelsParams = {}): Promise<ListChannelsResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.status) queryParams.append('status', params.status);
  
  const response = await apiClient.get<ListChannelsResponse>(
    `/v1/channels?${queryParams.toString()}`
  );
  return response;
};

// Utilisation
const channels = await listChannels({ page: 1, limit: 10, status: 'active' });
console.log(`Total channels: ${channels.total}`);
```

#### Obtenir un Canal par ID

**Endpoint:** `GET /v1/channels/{id}`

**Authentification:** Requise

**Exemple TypeScript:**
```typescript
const getChannelById = async (id: string): Promise<Channel> => {
  const response = await apiClient.get<{ success: boolean; data: Channel }>(
    `/v1/channels/${id}`
  );
  return response.data;
};
```

#### Mettre à Jour un Canal

**Endpoint:** `PUT /v1/channels/{id}`

**Authentification:** Requise

**Payload:**
```json
{
  "name": "Nouveau Nom",
  "description": "Nouvelle description",
  "youtubeUrl": "https://youtube.com/@newurl"
}
```

**Exemple TypeScript:**
```typescript
interface UpdateChannelRequest {
  name?: string;
  description?: string;
  youtubeUrl?: string;
}

const updateChannel = async (
  id: string,
  data: UpdateChannelRequest
): Promise<Channel> => {
  const response = await apiClient.put<{ success: boolean; data: Channel }>(
    `/v1/channels/${id}`,
    data
  );
  return response.data;
};
```

#### Archiver un Canal

**Endpoint:** `POST /v1/channels/{id}/archive`

**Authentification:** Requise

**Exemple TypeScript:**
```typescript
const archiveChannel = async (id: string): Promise<void> => {
  await apiClient.post(`/v1/channels/${id}/archive`);
};
```

---

### Projects (Projets)

Les projets contiennent les scènes de vos vidéos.

#### Créer un Projet

**Endpoint:** `POST /v1/channels/{channelId}/projects`

**Authentification:** Requise

**Payload:**
```json
{
  "title": "Ma Première Vidéo",
  "description": "Vidéo d'introduction",
  "aspectRatio": "16:9",
  "resolution": "1080p",
  "fps": 30
}
```

**Champs:**
- `title` (requis): Titre du projet
- `description` (optionnel): Description du projet
- `aspectRatio` (optionnel): '16:9' | '9:16' | '1:1' | '4:5' (défaut: '16:9')
- `resolution` (optionnel): '720p' | '1080p' | '4k' (défaut: '1080p')
- `fps` (optionnel): 24 | 30 | 60 (défaut: 30)

**Réponse:**
```json
{
  "success": true,
  "data": {
    "id": "project-uuid",
    "userId": "user_ABC123",
    "channelId": "channel-uuid",
    "title": "Ma Première Vidéo",
    "description": "Vidéo d'introduction",
    "aspectRatio": "16:9",
    "resolution": "1080p",
    "fps": 30,
    "status": "draft",
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z"
  }
}
```

**Exemple TypeScript:**
```typescript
interface CreateProjectRequest {
  title: string;
  description?: string;
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:5';
  resolution?: '720p' | '1080p' | '4k';
  fps?: 24 | 30 | 60;
}

interface Project {
  id: string;
  userId: string;
  channelId: string;
  title: string;
  description?: string;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5';
  resolution: '720p' | '1080p' | '4k';
  fps: 24 | 30 | 60;
  status: 'draft' | 'in_progress' | 'completed';
  createdAt: string;
  updatedAt: string;
}

const createProject = async (
  channelId: string,
  data: CreateProjectRequest
): Promise<Project> => {
  const response = await apiClient.post<{ success: boolean; data: Project }>(
    `/v1/channels/${channelId}/projects`,
    data
  );
  return response.data;
};

// Utilisation
const project = await createProject('channel-uuid', {
  title: 'Ma Première Vidéo',
  description: 'Vidéo d\'introduction',
  aspectRatio: '16:9',
  resolution: '1080p',
  fps: 30
});
```

#### Lister les Projets d'un Canal

**Endpoint:** `GET /v1/channels/{channelId}/projects`

**Authentification:** Requise

**Paramètres de Query:**
- `page` (optionnel): Numéro de page (défaut: 1)
- `limit` (optionnel): Résultats par page (défaut: 20)
- `status` (optionnel): 'draft' | 'in_progress' | 'completed'
- `sortBy` (optionnel): 'created_at' | 'updated_at' | 'title'
- `sortOrder` (optionnel): 'asc' | 'desc'
- `search` (optionnel): Recherche textuelle

**Exemple TypeScript:**
```typescript
interface ListProjectsParams {
  page?: number;
  limit?: number;
  status?: 'draft' | 'in_progress' | 'completed';
  sortBy?: 'created_at' | 'updated_at' | 'title';
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

interface ListProjectsResponse {
  success: boolean;
  data: Project[];
  total: number;
  page: number;
  limit: number;
}

const listProjects = async (
  channelId: string,
  params: ListProjectsParams = {}
): Promise<ListProjectsResponse> => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });
  
  return apiClient.get<ListProjectsResponse>(
    `/v1/channels/${channelId}/projects?${queryParams.toString()}`
  );
};

// Utilisation
const projects = await listProjects('channel-uuid', {
  page: 1,
  limit: 20,
  status: 'draft',
  sortBy: 'updated_at',
  sortOrder: 'desc'
});
```

#### Obtenir un Projet par ID

**Endpoint:** `GET /v1/projects/{id}`

**Authentification:** Requise

**Exemple TypeScript:**
```typescript
const getProjectById = async (id: string): Promise<Project> => {
  const response = await apiClient.get<{ success: boolean; data: Project }>(
    `/v1/projects/${id}`
  );
  return response.data;
};
```

#### Mettre à Jour un Projet

**Endpoint:** `PUT /v1/projects/{id}`

**Authentification:** Requise

**Payload:**
```json
{
  "title": "Nouveau Titre",
  "description": "Nouvelle description",
  "status": "in_progress"
}
```

**Exemple TypeScript:**
```typescript
interface UpdateProjectRequest {
  title?: string;
  description?: string;
  status?: 'draft' | 'in_progress' | 'completed';
}

const updateProject = async (
  id: string,
  data: UpdateProjectRequest
): Promise<Project> => {
  const response = await apiClient.put<{ success: boolean; data: Project }>(
    `/v1/projects/${id}`,
    data
  );
  return response.data;
};
```

#### Dupliquer un Projet

**Endpoint:** `POST /v1/projects/{id}/duplicate`

**Authentification:** Requise

**Payload:**
```json
{
  "title": "Copie de Mon Projet"
}
```

**Exemple TypeScript:**
```typescript
const duplicateProject = async (id: string, title: string): Promise<Project> => {
  const response = await apiClient.post<{ success: boolean; data: Project }>(
    `/v1/projects/${id}/duplicate`,
    { title }
  );
  return response.data;
};
```

#### Supprimer un Projet

**Endpoint:** `DELETE /v1/projects/{id}`

**Authentification:** Requise

**Réponse:**
```json
{
  "success": true,
  "id": "project-uuid",
  "message": "Project deleted successfully"
}
```

**Exemple TypeScript:**
```typescript
const deleteProject = async (id: string): Promise<void> => {
  await apiClient.delete(`/v1/projects/${id}`);
};
```

#### Sauvegarde Automatique d'un Projet

**Endpoint:** `POST /v1/projects/{id}/autosave`

**Authentification:** Requise

**Payload:**
```json
{
  "data": {
    "scenes": [...],
    "settings": {...}
  },
  "timestamp": "2025-01-15T10:00:00.000Z"
}
```

**Exemple TypeScript:**
```typescript
const autosaveProject = async (id: string, data: any): Promise<void> => {
  await apiClient.post(`/v1/projects/${id}/autosave`, {
    data,
    timestamp: new Date().toISOString()
  });
};
```

---

### Scenes

Les scènes sont les unités de base d'un projet vidéo.

#### Créer une Scène

**Endpoint:** `POST /v1/scenes`

**Authentification:** Requise

**Payload:**
```json
{
  "projectId": "project-uuid",
  "title": "Scène d'Introduction",
  "content": "Texte de la scène",
  "duration": 10,
  "backgroundImage": "https://...",
  "layers": [],
  "cameras": [],
  "transitionType": "fade"
}
```

**Champs:**
- `projectId` (requis): UUID du projet
- `title` (requis): Titre de la scène
- `content` (optionnel): Contenu textuel de la scène
- `duration` (optionnel): Durée en secondes (défaut: 10)
- `backgroundImage` (optionnel): URL de l'image de fond
- `layers` (optionnel): Array des calques (défaut: [])
- `cameras` (optionnel): Array des caméras (défaut: [])
- `transitionType` (optionnel): 'none' | 'fade' | 'slide' (défaut: 'fade')

**Réponse:**
```json
{
  "success": true,
  "data": {
    "id": "scene-uuid",
    "projectId": "project-uuid",
    "title": "Scène d'Introduction",
    "content": "Texte de la scène",
    "duration": 10,
    "backgroundImage": "https://...",
    "layers": [],
    "cameras": [],
    "transitionType": "fade",
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z"
  }
}
```

**Exemple TypeScript:**
```typescript
interface CreateSceneRequest {
  projectId: string;
  title: string;
  content?: string;
  duration?: number;
  backgroundImage?: string;
  layers?: any[];
  cameras?: any[];
  transitionType?: 'none' | 'fade' | 'slide';
}

interface Scene {
  id: string;
  projectId: string;
  title: string;
  content?: string;
  duration: number;
  backgroundImage?: string;
  layers: any[];
  cameras: any[];
  transitionType: 'none' | 'fade' | 'slide';
  createdAt: string;
  updatedAt: string;
}

const createScene = async (data: CreateSceneRequest): Promise<Scene> => {
  const response = await apiClient.post<{ success: boolean; data: Scene }>(
    '/v1/scenes',
    data
  );
  return response.data;
};
```

#### Lister les Scènes

**Endpoint:** `GET /v1/scenes`

**Authentification:** Requise

**Paramètres de Query:**
- `projectId` (optionnel): Filtrer par projet
- `page` (optionnel): Numéro de page (défaut: 1)
- `limit` (optionnel): Résultats par page (défaut: 10)
- `filter` (optionnel): Filtre textuel

**Exemple TypeScript:**
```typescript
interface ListScenesParams {
  projectId?: string;
  page?: number;
  limit?: number;
  filter?: string;
}

interface ListScenesResponse {
  success: boolean;
  data: Scene[];
  total: number;
  page: number;
  limit: number;
}

const listScenes = async (params: ListScenesParams = {}): Promise<ListScenesResponse> => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });
  
  return apiClient.get<ListScenesResponse>(
    `/v1/scenes?${queryParams.toString()}`
  );
};
```

#### Dupliquer une Scène

**Endpoint:** `POST /v1/scenes/{id}/duplicate`

**Authentification:** Requise

**Payload:**
```json
{
  "title": "Copie de la Scène"
}
```

#### Réorganiser les Scènes

**Endpoint:** `POST /v1/scenes/reorder`

**Authentification:** Requise

**Payload:**
```json
{
  "projectId": "project-uuid",
  "sceneIds": ["scene-1", "scene-3", "scene-2"]
}
```

**Exemple TypeScript:**
```typescript
const reorderScenes = async (projectId: string, sceneIds: string[]): Promise<void> => {
  await apiClient.post('/v1/scenes/reorder', {
    projectId,
    sceneIds
  });
};
```


---

### Assets (Images)

Gestion des images et ressources visuelles.

#### Uploader une Image

**Endpoint:** `POST /v1/assets/upload`

**Authentification:** Requise

**Content-Type:** `multipart/form-data`

**Champs du FormData:**
- `file` (requis): Fichier image (max 10MB)
- `name` (optionnel): Nom personnalisé
- `category` (optionnel): 'illustration' | 'icon' | 'background' | 'other'
- `tags` (optionnel): JSON stringified array de tags

**Réponse:**
```json
{
  "success": true,
  "data": {
    "id": "asset-uuid",
    "name": "mon-image.png",
    "url": "https://storage.doodlio.com/assets/optimized-image.webp",
    "thumbnailUrl": "https://storage.doodlio.com/assets/thumbnails/thumb.webp",
    "type": "image/webp",
    "size": 245678,
    "width": 1920,
    "height": 1080,
    "tags": ["logo", "brand"],
    "category": "illustration",
    "uploadedAt": "2025-01-15T10:00:00.000Z",
    "userId": "user_ABC123"
  }
}
```

**Exemple TypeScript:**
```typescript
interface UploadAssetResponse {
  success: boolean;
  data: {
    id: string;
    name: string;
    url: string;
    thumbnailUrl?: string;
    type: string;
    size: number;
    width?: number;
    height?: number;
    tags: string[];
    category: string;
    uploadedAt: string;
    userId: string;
  };
}

const uploadAsset = async (
  file: File,
  options?: {
    name?: string;
    category?: 'illustration' | 'icon' | 'background' | 'other';
    tags?: string[];
  }
): Promise<UploadAssetResponse['data']> => {
  const formData = new FormData();
  formData.append('file', file);
  
  if (options?.name) {
    formData.append('name', options.name);
  }
  
  if (options?.category) {
    formData.append('category', options.category);
  }
  
  if (options?.tags) {
    formData.append('tags', JSON.stringify(options.tags));
  }
  
  const response = await apiClient.uploadFormData<UploadAssetResponse>(
    '/v1/assets/upload',
    formData
  );
  
  return response.data;
};

// Utilisation
const fileInput = document.querySelector<HTMLInputElement>('#file-input');
if (fileInput?.files?.[0]) {
  const asset = await uploadAsset(fileInput.files[0], {
    name: 'Logo de marque',
    category: 'icon',
    tags: ['logo', 'brand', 'primary']
  });
  console.log('Asset uploaded:', asset.url);
}
```

#### Lister les Assets

**Endpoint:** `GET /v1/assets`

**Authentification:** Requise

**Paramètres de Query:**
- `page` (optionnel): Numéro de page (défaut: 1)
- `limit` (optionnel): Résultats par page (défaut: 20)
- `category` (optionnel): Filtrer par catégorie
- `sortBy` (optionnel): 'name' | 'uploadDate' | 'size' | 'usageCount'
- `sortOrder` (optionnel): 'asc' | 'desc'

**Exemple TypeScript:**
```typescript
interface ListAssetsParams {
  page?: number;
  limit?: number;
  category?: string;
  sortBy?: 'name' | 'uploadDate' | 'size' | 'usageCount';
  sortOrder?: 'asc' | 'desc';
}

const listAssets = async (params: ListAssetsParams = {}) => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });
  
  return apiClient.get(`/v1/assets?${queryParams.toString()}`);
};
```

#### Obtenir les Statistiques des Assets

**Endpoint:** `GET /v1/assets/stats`

**Authentification:** Requise

**Réponse:**
```json
{
  "success": true,
  "data": {
    "totalAssets": 156,
    "totalSize": 52428800,
    "totalSizeMB": "50.00",
    "assetsByCategory": {
      "illustration": 45,
      "icon": 67,
      "background": 32,
      "other": 12
    },
    "mostUsedAssets": [...],
    "recentlyUploaded": [...]
  }
}
```

**Exemple TypeScript:**
```typescript
interface AssetStats {
  totalAssets: number;
  totalSize: number;
  totalSizeMB: string;
  assetsByCategory: Record<string, number>;
  mostUsedAssets?: any[];
  recentlyUploaded?: any[];
}

const getAssetStats = async (): Promise<AssetStats> => {
  const response = await apiClient.get<{ success: boolean; data: AssetStats }>(
    '/v1/assets/stats'
  );
  return response.data;
};
```

#### Mettre à Jour un Asset

**Endpoint:** `PUT /v1/assets/{id}`

**Authentification:** Requise

**Payload:**
```json
{
  "name": "Nouveau nom",
  "tags": ["tag1", "tag2"],
  "category": "background"
}
```

#### Supprimer un Asset

**Endpoint:** `DELETE /v1/assets/{id}`

**Authentification:** Requise

**Exemple TypeScript:**
```typescript
const deleteAsset = async (id: string): Promise<void> => {
  await apiClient.delete(`/v1/assets/${id}`);
};
```

---

### Audio

Gestion des fichiers audio pour vos projets.

#### Uploader un Fichier Audio

**Endpoint:** `POST /v1/audio/upload`

**Authentification:** Requise

**Content-Type:** `multipart/form-data`

**Champs du FormData:**
- `file` (requis): Fichier audio
- `name` (optionnel): Nom personnalisé
- `category` (optionnel): 'music' | 'sfx' | 'voiceover' | 'ambient' | 'other'
- `tags` (optionnel): JSON stringified array

**Réponse:**
```json
{
  "success": true,
  "data": {
    "id": "audio-uuid",
    "userId": "user_ABC123",
    "fileName": "background-music.mp3",
    "fileUrl": "https://storage.doodlio.com/audio/file.mp3",
    "duration": 180,
    "size": 5242880,
    "category": "music",
    "tags": ["background", "upbeat"],
    "isFavorite": false,
    "createdAt": "2025-01-15T10:00:00.000Z"
  }
}
```

**Exemple TypeScript:**
```typescript
interface UploadAudioResponse {
  success: boolean;
  data: {
    id: string;
    userId: string;
    fileName: string;
    fileUrl: string;
    duration: number;
    size: number;
    category: 'music' | 'sfx' | 'voiceover' | 'ambient' | 'other';
    tags: string[];
    isFavorite: boolean;
    createdAt: string;
  };
}

const uploadAudio = async (
  file: File,
  options?: {
    name?: string;
    category?: 'music' | 'sfx' | 'voiceover' | 'ambient' | 'other';
    tags?: string[];
  }
): Promise<UploadAudioResponse['data']> => {
  const formData = new FormData();
  formData.append('file', file);
  
  if (options?.name) {
    formData.append('name', options.name);
  }
  
  if (options?.category) {
    formData.append('category', options.category);
  }
  
  if (options?.tags) {
    formData.append('tags', JSON.stringify(options.tags));
  }
  
  const response = await apiClient.uploadFormData<UploadAudioResponse>(
    '/v1/audio/upload',
    formData
  );
  
  return response.data;
};
```

#### Lister les Fichiers Audio

**Endpoint:** `GET /v1/audio`

**Authentification:** Requise

**Paramètres de Query:**
- `page` (optionnel): Numéro de page (défaut: 1)
- `limit` (optionnel): Résultats par page (défaut: 20)
- `category` (optionnel): Filtrer par catégorie
- `search` (optionnel): Recherche textuelle
- `favoritesOnly` (optionnel): 'true' pour favoris uniquement

**Exemple TypeScript:**
```typescript
interface ListAudioParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  favoritesOnly?: boolean;
}

const listAudio = async (params: ListAudioParams = {}) => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });
  
  return apiClient.get(`/v1/audio?${queryParams.toString()}`);
};
```

#### Marquer comme Favori

**Endpoint:** `POST /v1/audio/{id}/favorite`

**Authentification:** Requise

**Exemple TypeScript:**
```typescript
const toggleAudioFavorite = async (id: string): Promise<void> => {
  await apiClient.post(`/v1/audio/${id}/favorite`);
};
```

---

### Templates

Les templates sont des scènes pré-configurées réutilisables.

#### Créer un Template

**Endpoint:** `POST /v1/templates`

**Authentification:** Requise

**Payload:**
```json
{
  "name": "Template d'Introduction",
  "description": "Template pour les intros de vidéos",
  "type": "education",
  "style": "professional",
  "tags": ["intro", "corporate"],
  "thumbnail": "https://...",
  "sceneData": {
    "layers": [...],
    "cameras": [...],
    "duration": 10
  },
  "metadata": {
    "layerCount": 5,
    "cameraCount": 2,
    "hasAudio": true,
    "hasBackground": true,
    "complexity": "intermediate"
  }
}
```

**Champs:**
- `name` (requis): Nom du template
- `description` (requis): Description
- `type` (requis): 'education' | 'marketing' | 'presentation' | 'tutorial' | 'entertainment' | 'other'
- `style` (requis): 'minimal' | 'colorful' | 'professional' | 'creative' | 'dark' | 'light'
- `tags` (optionnel): Array de tags
- `thumbnail` (optionnel): URL de l'aperçu
- `sceneData` (requis): Données de la scène
- `metadata` (optionnel): Métadonnées

**Exemple TypeScript:**
```typescript
interface CreateTemplateRequest {
  name: string;
  description: string;
  type: 'education' | 'marketing' | 'presentation' | 'tutorial' | 'entertainment' | 'other';
  style: 'minimal' | 'colorful' | 'professional' | 'creative' | 'dark' | 'light';
  tags?: string[];
  thumbnail?: string;
  sceneData: any;
  metadata?: {
    layerCount: number;
    cameraCount: number;
    hasAudio: boolean;
    hasBackground: boolean;
    complexity: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  };
}

const createTemplate = async (data: CreateTemplateRequest) => {
  return apiClient.post('/v1/templates', data);
};
```

#### Lister les Templates

**Endpoint:** `GET /v1/templates`

**Authentification:** Requise

**Paramètres de Query:**
- `page` (optionnel): Numéro de page (défaut: 1)
- `limit` (optionnel): Résultats par page (défaut: 20)
- `type` (optionnel): Filtrer par type
- `style` (optionnel): Filtrer par style
- `complexity` (optionnel): 'beginner' | 'intermediate' | 'advanced' | 'expert'
- `search` (optionnel): Recherche textuelle
- `minRating` (optionnel): Note minimale
- `sortByPopularity` (optionnel): 'true' pour trier par popularité

**Exemple TypeScript:**
```typescript
interface ListTemplatesParams {
  page?: number;
  limit?: number;
  type?: string;
  style?: string;
  complexity?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  search?: string;
  minRating?: number;
  sortByPopularity?: boolean;
}

const listTemplates = async (params: ListTemplatesParams = {}) => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });
  
  return apiClient.get(`/v1/templates?${queryParams.toString()}`);
};
```

#### Exporter un Template

**Endpoint:** `GET /v1/templates/{id}/export`

**Authentification:** Requise

**Réponse:** Template au format JSON

#### Importer un Template

**Endpoint:** `POST /v1/templates/import`

**Authentification:** Requise

**Payload:** Template JSON

---

### Export

Exportation et génération de vidéos.

#### Exporter une Scène

**Endpoint:** `POST /v1/export/scene/{id}`

**Authentification:** Requise

**Payload:**
```json
{
  "format": "mp4",
  "quality": "high",
  "resolution": "1080p"
}
```

**Champs:**
- `format` (requis): 'png' | 'jpg' | 'mp4' | 'webm'
- `quality` (requis): 'low' | 'medium' | 'high' | 'ultra'
- `resolution` (requis): '720p' | '1080p' | '4k'

**Réponse:**
```json
{
  "success": true,
  "data": {
    "exportId": "export-uuid",
    "sceneId": "scene-uuid",
    "format": "mp4",
    "status": "pending",
    "progress": 0,
    "createdAt": "2025-01-15T10:00:00.000Z"
  }
}
```

**Exemple TypeScript:**
```typescript
interface ExportSceneRequest {
  format: 'png' | 'jpg' | 'mp4' | 'webm';
  quality: 'low' | 'medium' | 'high' | 'ultra';
  resolution: '720p' | '1080p' | '4k';
}

interface ExportJob {
  exportId: string;
  sceneId?: string;
  projectId?: string;
  format: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  downloadUrl?: string;
  createdAt: string;
}

const exportScene = async (
  sceneId: string,
  options: ExportSceneRequest
): Promise<ExportJob> => {
  const response = await apiClient.post<{ success: boolean; data: ExportJob }>(
    `/v1/export/scene/${sceneId}`,
    options
  );
  return response.data;
};
```

#### Générer une Vidéo Complète

**Endpoint:** `POST /v1/export/video`

**Authentification:** Requise

**Payload:**
```json
{
  "projectId": "project-uuid",
  "format": "mp4",
  "quality": "high",
  "resolution": "1080p",
  "fps": 30,
  "includeAudio": true,
  "watermark": {
    "enabled": true,
    "text": "Doodlio",
    "position": "bottom-right"
  }
}
```

**Champs:**
- `projectId` (requis): UUID du projet
- `format` (requis): 'mp4' | 'webm' | 'mov'
- `quality` (requis): 'low' | 'medium' | 'high' | 'ultra'
- `resolution` (requis): '720p' | '1080p' | '4k'
- `fps` (requis): 24 | 30 | 60
- `includeAudio` (requis): boolean
- `watermark` (optionnel): Configuration du filigrane

**Exemple TypeScript:**
```typescript
interface ExportVideoRequest {
  projectId: string;
  format: 'mp4' | 'webm' | 'mov';
  quality: 'low' | 'medium' | 'high' | 'ultra';
  resolution: '720p' | '1080p' | '4k';
  fps: 24 | 30 | 60;
  includeAudio: boolean;
  watermark?: {
    enabled: boolean;
    text?: string;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  };
}

const exportVideo = async (options: ExportVideoRequest): Promise<ExportJob> => {
  const response = await apiClient.post<{ success: boolean; data: ExportJob }>(
    '/v1/export/video',
    options
  );
  return response.data;
};

// Utilisation
const exportJob = await exportVideo({
  projectId: 'project-uuid',
  format: 'mp4',
  quality: 'high',
  resolution: '1080p',
  fps: 30,
  includeAudio: true,
  watermark: {
    enabled: true,
    text: 'Doodlio',
    position: 'bottom-right'
  }
});

console.log('Export started:', exportJob.exportId);
```

#### Vérifier le Statut de l'Export

**Endpoint:** `GET /v1/export/status/{exportId}`

**Authentification:** Requise

**Réponse:**
```json
{
  "success": true,
  "data": {
    "exportId": "export-uuid",
    "status": "completed",
    "progress": 100,
    "downloadUrl": "https://storage.doodlio.com/exports/video.mp4",
    "fileSize": 52428800,
    "duration": 120,
    "createdAt": "2025-01-15T10:00:00.000Z",
    "completedAt": "2025-01-15T10:05:00.000Z"
  }
}
```

**Exemple TypeScript:**
```typescript
const checkExportStatus = async (exportId: string): Promise<ExportJob> => {
  const response = await apiClient.get<{ success: boolean; data: ExportJob }>(
    `/v1/export/status/${exportId}`
  );
  return response.data;
};

// Polling de l'export
const pollExportStatus = async (
  exportId: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const status = await checkExportStatus(exportId);
        
        if (onProgress) {
          onProgress(status.progress);
        }
        
        if (status.status === 'completed' && status.downloadUrl) {
          clearInterval(interval);
          resolve(status.downloadUrl);
        } else if (status.status === 'failed') {
          clearInterval(interval);
          reject(new Error('Export failed'));
        }
      } catch (error) {
        clearInterval(interval);
        reject(error);
      }
    }, 3000); // Check every 3 seconds
  });
};

// Utilisation
const downloadUrl = await pollExportStatus('export-uuid', (progress) => {
  console.log(`Export progress: ${progress}%`);
});
console.log('Download ready:', downloadUrl);
```

#### Télécharger l'Export

**Endpoint:** `GET /v1/export/download/{exportId}`

**Authentification:** Requise

**Réponse:** Fichier vidéo en streaming

#### Obtenir la Configuration d'Export

**Endpoint:** `GET /v1/export/config`

**Authentification:** Requise

**Réponse:** Options de configuration disponibles

---

### AI (Intelligence Artificielle)

Fonctionnalités IA pour générer du contenu.

#### Vérifier la Disponibilité des Services IA

**Endpoint:** `GET /v1/ai/status`

**Authentification:** Non requise

**Réponse:**
```json
{
  "success": true,
  "data": {
    "imageGenerator": true,
    "scriptGenerator": true,
    "voiceSynthesis": true,
    "musicGenerator": false,
    "providers": {
      "imageGenerators": ["dalle", "gemini"],
      "voiceProviders": ["elevenlabs"],
      "scriptProviders": ["gemini", "openai"],
      "musicProviders": []
    }
  }
}
```

**Exemple TypeScript:**
```typescript
interface AIStatus {
  imageGenerator: boolean;
  scriptGenerator: boolean;
  voiceSynthesis: boolean;
  musicGenerator: boolean;
  providers: {
    imageGenerators: string[];
    voiceProviders: string[];
    scriptProviders: string[];
    musicProviders: string[];
  };
}

const getAIStatus = async (): Promise<AIStatus> => {
  const response = await apiClient.get<{ success: boolean; data: AIStatus }>(
    '/v1/ai/status'
  );
  return response.data;
};
```

#### Générer un Prompt d'Image ou une Image

**Endpoint:** `POST /v1/ai/generate-image-prompt`

**Authentification:** Optionnelle (requise pour le tracking d'usage)

**Payload:**
```json
{
  "prompt": "Un chat astronaute dans l'espace",
  "style": "realistic"
}
```

**Champs:**
- `prompt` (requis): Description de l'image
- `style` (optionnel): 'realistic' | 'cartoon' | 'anime' | 'artistic' | 'minimal'

**Réponse:**
```json
{
  "success": true,
  "data": {
    "enhancedPrompt": "A detailed, photorealistic depiction of a cat wearing a detailed astronaut suit, floating gracefully in the vast expanse of space...",
    "imageUrl": "https://...",
    "provider": "dalle"
  }
}
```

**Exemple TypeScript:**
```typescript
interface GenerateImageRequest {
  prompt: string;
  style?: 'realistic' | 'cartoon' | 'anime' | 'artistic' | 'minimal';
}

interface GenerateImageResponse {
  enhancedPrompt: string;
  imageUrl?: string;
  provider: string;
}

const generateImage = async (
  options: GenerateImageRequest
): Promise<GenerateImageResponse> => {
  const response = await apiClient.post<{ success: boolean; data: GenerateImageResponse }>(
    '/v1/ai/generate-image-prompt',
    options
  );
  return response.data;
};

// Utilisation
const result = await generateImage({
  prompt: 'Un chat astronaute dans l\'espace',
  style: 'realistic'
});

if (result.imageUrl) {
  // DALL-E a généré directement l'image
  console.log('Image URL:', result.imageUrl);
} else {
  // Gemini a généré un prompt amélioré
  console.log('Enhanced prompt:', result.enhancedPrompt);
}
```

#### Générer un Script Vidéo

**Endpoint:** `POST /v1/ai/generate-script`

**Authentification:** Requise

**Payload:**
```json
{
  "topic": "Introduction au machine learning",
  "duration": 120,
  "tone": "professional",
  "targetAudience": "beginners",
  "keyPoints": ["supervised learning", "neural networks", "applications"]
}
```

**Champs:**
- `topic` (requis): Sujet du script
- `duration` (optionnel): Durée en secondes
- `tone` (optionnel): 'professional' | 'casual' | 'friendly' | 'educational' | 'entertaining'
- `targetAudience` (optionnel): 'beginners' | 'intermediate' | 'advanced' | 'experts'
- `keyPoints` (optionnel): Points clés à aborder

**Réponse:**
```json
{
  "success": true,
  "data": {
    "script": "Welcome to this introduction to machine learning...",
    "scenes": [
      {
        "title": "Introduction",
        "content": "Welcome to this introduction...",
        "duration": 15
      },
      {
        "title": "What is Machine Learning",
        "content": "Machine learning is a subset of AI...",
        "duration": 30
      }
    ],
    "estimatedDuration": 120,
    "wordCount": 240,
    "provider": "gemini"
  }
}
```

**Exemple TypeScript:**
```typescript
interface GenerateScriptRequest {
  topic: string;
  duration?: number;
  tone?: 'professional' | 'casual' | 'friendly' | 'educational' | 'entertaining';
  targetAudience?: 'beginners' | 'intermediate' | 'advanced' | 'experts';
  keyPoints?: string[];
}

interface ScriptScene {
  title: string;
  content: string;
  duration: number;
}

interface GenerateScriptResponse {
  script: string;
  scenes: ScriptScene[];
  estimatedDuration: number;
  wordCount: number;
  provider: string;
}

const generateScript = async (
  options: GenerateScriptRequest
): Promise<GenerateScriptResponse> => {
  const response = await apiClient.post<{ success: boolean; data: GenerateScriptResponse }>(
    '/v1/ai/generate-script',
    options
  );
  return response.data;
};

// Utilisation
const script = await generateScript({
  topic: 'Introduction au machine learning',
  duration: 120,
  tone: 'educational',
  targetAudience: 'beginners',
  keyPoints: ['supervised learning', 'neural networks', 'applications']
});

console.log('Generated script:', script.script);
console.log('Scenes:', script.scenes.length);
```

#### Synthèse Vocale (Text-to-Speech)

**Endpoint:** `POST /v1/ai/generate-voice`

**Authentification:** Requise

**Payload:**
```json
{
  "text": "Bonjour et bienvenue dans cette vidéo",
  "voiceId": "female-1",
  "speed": 1.0,
  "stability": 0.5,
  "language": "fr"
}
```

**Champs:**
- `text` (requis): Texte à synthétiser
- `voiceId` (requis): ID de la voix
- `speed` (optionnel): Vitesse (0.5 - 2.0, défaut: 1.0)
- `stability` (optionnel): Stabilité (0.0 - 1.0, défaut: 0.5)
- `language` (optionnel): Code langue (défaut: 'en')

**Réponse:**
```json
{
  "success": true,
  "data": {
    "audioUrl": "https://storage.doodlio.com/audio/generated/voice.mp3",
    "duration": 5.2,
    "provider": "elevenlabs",
    "characterCount": 42
  }
}
```

**Exemple TypeScript:**
```typescript
interface GenerateVoiceRequest {
  text: string;
  voiceId: string;
  speed?: number;
  stability?: number;
  language?: string;
}

interface GenerateVoiceResponse {
  audioUrl: string;
  duration: number;
  provider: string;
  characterCount: number;
}

const generateVoice = async (
  options: GenerateVoiceRequest
): Promise<GenerateVoiceResponse> => {
  const response = await apiClient.post<{ success: boolean; data: GenerateVoiceResponse }>(
    '/v1/ai/generate-voice',
    options
  );
  return response.data;
};

// Utilisation
const voice = await generateVoice({
  text: 'Bonjour et bienvenue dans cette vidéo',
  voiceId: 'female-1',
  speed: 1.0,
  stability: 0.5,
  language: 'fr'
});

console.log('Generated voice:', voice.audioUrl);
```

#### Lister les Voix Disponibles

**Endpoint:** `GET /v1/ai/voices`

**Authentification:** Non requise

**Réponse:**
```json
{
  "success": true,
  "data": {
    "voices": [
      {
        "id": "female-1",
        "name": "Sarah",
        "gender": "female",
        "language": "en",
        "previewUrl": "https://..."
      },
      {
        "id": "male-1",
        "name": "John",
        "gender": "male",
        "language": "en",
        "previewUrl": "https://..."
      }
    ],
    "provider": "elevenlabs"
  }
}
```

**Exemple TypeScript:**
```typescript
interface Voice {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  language: string;
  previewUrl?: string;
}

const listVoices = async (): Promise<Voice[]> => {
  const response = await apiClient.get<{ success: boolean; data: { voices: Voice[] } }>(
    '/v1/ai/voices'
  );
  return response.data.voices;
};
```

#### Générer de la Musique

**Endpoint:** `POST /v1/ai/generate-music`

**Authentification:** Requise

**Payload:**
```json
{
  "prompt": "Upbeat corporate background music",
  "duration": 60,
  "genre": "corporate"
}
```

**Exemple TypeScript:**
```typescript
interface GenerateMusicRequest {
  prompt: string;
  duration?: number;
  genre?: string;
}

const generateMusic = async (options: GenerateMusicRequest) => {
  return apiClient.post('/v1/ai/generate-music', options);
};
```

---

### Fonts (Polices)

Gestion des polices de caractères.

#### Lister les Polices

**Endpoint:** `GET /v1/fonts`

**Authentification:** Non requise

**Paramètres de Query:**
- `category` (optionnel): 'sans-serif' | 'serif' | 'display' | 'handwriting' | 'monospace'
- `premiumOnly` (optionnel): 'true' pour les polices premium uniquement
- `popularOnly` (optionnel): 'true' pour les polices populaires

**Réponse:**
```json
{
  "success": true,
  "data": [
    {
      "id": "roboto",
      "name": "Roboto",
      "family": "Roboto",
      "category": "sans-serif",
      "variants": ["regular", "bold", "italic"],
      "weights": [400, 700],
      "isPremium": false,
      "isPopular": true
    }
  ]
}
```

**Exemple TypeScript:**
```typescript
interface Font {
  id: string;
  name: string;
  family: string;
  category: 'sans-serif' | 'serif' | 'display' | 'handwriting' | 'monospace';
  variants: string[];
  weights: number[];
  isPremium: boolean;
  isPopular: boolean;
}

interface ListFontsParams {
  category?: string;
  premiumOnly?: boolean;
  popularOnly?: boolean;
}

const listFonts = async (params: ListFontsParams = {}): Promise<Font[]> => {
  const queryParams = new URLSearchParams();
  
  if (params.category) queryParams.append('category', params.category);
  if (params.premiumOnly) queryParams.append('premiumOnly', 'true');
  if (params.popularOnly) queryParams.append('popularOnly', 'true');
  
  const response = await apiClient.get<{ success: boolean; data: Font[] }>(
    `/v1/fonts?${queryParams.toString()}`
  );
  
  return response.data;
};

// Utilisation
const fonts = await listFonts({ category: 'sans-serif', popularOnly: true });
console.log('Popular sans-serif fonts:', fonts);
```


---

### Pricing (Tarifs)

Informations sur les plans tarifaires et abonnements.

#### Obtenir tous les Plans Tarifaires

**Endpoint:** `GET /v1/pricing/plans`

**Authentification:** Non requise

**Réponse:**
```json
{
  "success": true,
  "data": [
    {
      "id": "free",
      "title": "Gratuit",
      "description": "Pour commencer",
      "prices": {
        "monthly": 0,
        "yearly": 0
      },
      "features": {
        "projects": 3,
        "videosPerMonth": 5,
        "maxDuration": 60,
        "aiGenerations": 10,
        "storage": "1GB",
        "exportQuality": "720p"
      }
    },
    {
      "id": "pro",
      "title": "Pro",
      "description": "Pour les professionnels",
      "prices": {
        "monthly": 29,
        "yearly": 290
      },
      "features": {
        "projects": -1,
        "videosPerMonth": 50,
        "maxDuration": 300,
        "aiGenerations": 100,
        "storage": "50GB",
        "exportQuality": "4k"
      }
    }
  ]
}
```

**Exemple TypeScript:**
```typescript
interface PricingPlan {
  id: string;
  title: string;
  description: string;
  prices: {
    monthly: number;
    yearly: number;
  };
  features: Record<string, any>;
}

const getPricingPlans = async (): Promise<PricingPlan[]> => {
  const response = await apiClient.get<{ success: boolean; data: PricingPlan[] }>(
    '/v1/pricing/plans'
  );
  return response.data;
};

// Utilisation
const plans = await getPricingPlans();
plans.forEach(plan => {
  console.log(`${plan.title}: $${plan.prices.monthly}/mois`);
});
```

#### Obtenir un Plan Spécifique

**Endpoint:** `GET /v1/pricing/plans/{planId}`

**Authentification:** Non requise

**Exemple TypeScript:**
```typescript
const getPlanDetails = async (planId: string): Promise<PricingPlan> => {
  const response = await apiClient.get<{ success: boolean; data: PricingPlan }>(
    `/v1/pricing/plans/${planId}`
  );
  return response.data;
};
```

#### Obtenir l'Historique de Facturation

**Endpoint:** `GET /v1/pricing/billing-history`

**Authentification:** Requise

**Paramètres de Query:**
- `page` (optionnel): Numéro de page (défaut: 1)
- `limit` (optionnel): Résultats par page (défaut: 20)

**Réponse:**
```json
{
  "success": true,
  "data": [
    {
      "id": "inv_123",
      "date": "2025-01-15T10:00:00.000Z",
      "amount": 29,
      "currency": "USD",
      "status": "paid",
      "planId": "pro",
      "invoiceUrl": "https://..."
    }
  ],
  "total": 12,
  "page": 1,
  "limit": 20
}
```

**Exemple TypeScript:**
```typescript
interface BillingRecord {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  planId: string;
  invoiceUrl?: string;
}

const getBillingHistory = async (page: number = 1, limit: number = 20) => {
  return apiClient.get<{
    success: boolean;
    data: BillingRecord[];
    total: number;
    page: number;
    limit: number;
  }>(`/v1/pricing/billing-history?page=${page}&limit=${limit}`);
};
```

---

### Upload

Upload générique de fichiers.

#### Uploader un Fichier

**Endpoint:** `POST /v1/upload`

**Authentification:** Requise

**Content-Type:** `multipart/form-data`

**Champs du FormData:**
- `file` (requis): Fichier à uploader
- `folder` (optionnel): Dossier de destination (défaut: 'general')

**Réponse:**
```json
{
  "success": true,
  "data": {
    "url": "https://storage.doodlio.com/general/file.ext",
    "public_id": "general/abc123",
    "resource_type": "image"
  }
}
```

**Exemple TypeScript:**
```typescript
interface UploadFileResponse {
  success: boolean;
  data: {
    url: string;
    public_id: string;
    resource_type: string;
  };
}

const uploadFile = async (
  file: File,
  folder: string = 'general'
): Promise<UploadFileResponse['data']> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  
  const response = await apiClient.uploadFormData<UploadFileResponse>(
    '/v1/upload',
    formData
  );
  
  return response.data;
};

// Utilisation
const result = await uploadFile(myFile, 'logos');
console.log('File uploaded:', result.url);
```

#### Supprimer un Fichier

**Endpoint:** `DELETE /v1/upload`

**Authentification:** Requise

**Payload:**
```json
{
  "public_id": "general/abc123"
}
```

**Exemple TypeScript:**
```typescript
const deleteFile = async (publicId: string): Promise<void> => {
  await apiClient.delete('/v1/upload', { public_id: publicId });
};
```

---

### User API Keys

Gestion des clés API des utilisateurs pour les services externes.

#### Sauvegarder une Clé API

**Endpoint:** `POST /v1/user/api-keys`

**Authentification:** Requise

**Payload:**
```json
{
  "provider": "openai",
  "apiKey": "sk-...",
  "keyName": "Ma clé OpenAI"
}
```

**Champs:**
- `provider` (requis): 'openai' | 'elevenlabs' | 'mubert' | 'minimax' | 'gemini'
- `apiKey` (requis): Clé API (min 10 caractères)
- `keyName` (optionnel): Nom personnalisé

**Réponse:**
```json
{
  "success": true,
  "data": {
    "id": "key-uuid",
    "provider": "openai",
    "maskedKey": "sk-...ABC",
    "isActive": true
  }
}
```

**Exemple TypeScript:**
```typescript
type APIProvider = 'openai' | 'elevenlabs' | 'mubert' | 'minimax' | 'gemini';

interface SaveAPIKeyRequest {
  provider: APIProvider;
  apiKey: string;
  keyName?: string;
}

interface UserAPIKey {
  id: string;
  provider: APIProvider;
  maskedKey: string;
  isActive: boolean;
  lastValidated?: string;
  validationStatus?: 'valid' | 'invalid' | 'pending';
  keyName?: string;
  createdAt: string;
  updatedAt: string;
}

const saveAPIKey = async (data: SaveAPIKeyRequest): Promise<UserAPIKey> => {
  const response = await apiClient.post<{ success: boolean; data: UserAPIKey }>(
    '/v1/user/api-keys',
    data
  );
  return response.data;
};

// Utilisation
const apiKey = await saveAPIKey({
  provider: 'openai',
  apiKey: 'sk-proj-...',
  keyName: 'Ma clé OpenAI personnelle'
});
console.log('API key saved:', apiKey.maskedKey);
```

#### Lister les Clés API

**Endpoint:** `GET /v1/user/api-keys`

**Authentification:** Requise

**Réponse:**
```json
{
  "success": true,
  "data": [
    {
      "id": "key-uuid",
      "provider": "openai",
      "maskedKey": "sk-...ABC",
      "isActive": true,
      "validationStatus": "valid",
      "keyName": "Ma clé OpenAI",
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-15T10:00:00.000Z"
    }
  ]
}
```

**Exemple TypeScript:**
```typescript
const listAPIKeys = async (): Promise<UserAPIKey[]> => {
  const response = await apiClient.get<{ success: boolean; data: UserAPIKey[] }>(
    '/v1/user/api-keys'
  );
  return response.data;
};

// Utilisation
const keys = await listAPIKeys();
keys.forEach(key => {
  console.log(`${key.provider}: ${key.maskedKey} (${key.validationStatus})`);
});
```

#### Valider une Clé API

**Endpoint:** `POST /v1/user/api-keys/{id}/validate`

**Authentification:** Requise

**Réponse:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "message": "API key is valid"
  }
}
```

**Exemple TypeScript:**
```typescript
const validateAPIKey = async (id: string): Promise<boolean> => {
  const response = await apiClient.post<{ success: boolean; data: { valid: boolean } }>(
    `/v1/user/api-keys/${id}/validate`
  );
  return response.data.valid;
};
```

#### Supprimer une Clé API

**Endpoint:** `DELETE /v1/user/api-keys/{id}`

**Authentification:** Requise

**Exemple TypeScript:**
```typescript
const deleteAPIKey = async (id: string): Promise<void> => {
  await apiClient.delete(`/v1/user/api-keys/${id}`);
};
```

---

### AI Usage

Suivi de l'utilisation des services IA.

#### Obtenir l'Utilisation du Mois Actuel

**Endpoint:** `GET /v1/ai-usage/current`

**Authentification:** Requise

**Réponse:**
```json
{
  "success": true,
  "data": {
    "userId": "user_ABC123",
    "month": "2025-01",
    "videoGenerationCount": 12,
    "scriptGenerationCount": 25,
    "imageGenerationCount": 45,
    "voiceGenerationCount": 30,
    "musicGenerationCount": 5,
    "planLimit": 100,
    "exceeded": false,
    "overage": 0,
    "overageCost": 0
  }
}
```

**Exemple TypeScript:**
```typescript
interface AIUsage {
  userId: string;
  month: string;
  videoGenerationCount: number;
  scriptGenerationCount: number;
  imageGenerationCount: number;
  voiceGenerationCount: number;
  musicGenerationCount: number;
  planLimit: number;
  exceeded: boolean;
  overage: number;
  overageCost: number;
}

const getCurrentAIUsage = async (): Promise<AIUsage> => {
  const response = await apiClient.get<{ success: boolean; data: AIUsage }>(
    '/v1/ai-usage/current'
  );
  return response.data;
};

// Utilisation
const usage = await getCurrentAIUsage();
console.log(`AI generations this month: ${usage.imageGenerationCount}`);
console.log(`Limit exceeded: ${usage.exceeded}`);
```

#### Obtenir l'Historique d'Utilisation

**Endpoint:** `GET /v1/ai-usage/history`

**Authentification:** Requise

**Paramètres de Query:**
- `months` (optionnel): Nombre de mois à récupérer (défaut: 6)

**Réponse:**
```json
{
  "success": true,
  "data": [
    {
      "month": "2025-01",
      "totalGenerations": 117,
      "videoGenerationCount": 12,
      "scriptGenerationCount": 25,
      "imageGenerationCount": 45,
      "voiceGenerationCount": 30,
      "musicGenerationCount": 5
    },
    {
      "month": "2024-12",
      "totalGenerations": 95,
      ...
    }
  ]
}
```

**Exemple TypeScript:**
```typescript
interface MonthlyUsage {
  month: string;
  totalGenerations: number;
  videoGenerationCount: number;
  scriptGenerationCount: number;
  imageGenerationCount: number;
  voiceGenerationCount: number;
  musicGenerationCount: number;
}

const getAIUsageHistory = async (months: number = 6): Promise<MonthlyUsage[]> => {
  const response = await apiClient.get<{ success: boolean; data: MonthlyUsage[] }>(
    `/v1/ai-usage/history?months=${months}`
  );
  return response.data;
};

// Utilisation
const history = await getAIUsageHistory(12);
history.forEach(month => {
  console.log(`${month.month}: ${month.totalGenerations} générations`);
});
```

---

### Permissions

Gestion des rôles et permissions (Admin uniquement).

#### Créer un Rôle

**Endpoint:** `POST /v1/roles`

**Authentification:** Requise (Admin)

**Payload:**
```json
{
  "name": "Éditeur",
  "description": "Peut créer et modifier du contenu",
  "permissions": [
    {
      "subject": "STAT",
      "actions": ["READ"]
    },
    {
      "subject": "ACTIVITY",
      "actions": ["READ", "CREATE"]
    }
  ]
}
```

**Champs:**
- `name` (requis): Nom du rôle
- `description` (requis): Description
- `permissions` (requis): Array de permissions
  - `subject`: 'ADMIN' | 'STAT' | 'ACTIVITY'
  - `actions`: Array de 'CREATE' | 'READ' | 'UPDATE' | 'DELETE'

**Réponse:**
```json
{
  "success": true,
  "data": {
    "id": "role-uuid"
  }
}
```

**Exemple TypeScript:**
```typescript
type PermissionAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
type PermissionSubject = 'ADMIN' | 'STAT' | 'ACTIVITY';

interface Permission {
  subject: PermissionSubject;
  actions: PermissionAction[];
}

interface CreateRoleRequest {
  name: string;
  description: string;
  permissions: Permission[];
}

const createRole = async (data: CreateRoleRequest): Promise<string> => {
  const response = await apiClient.post<{ success: boolean; data: { id: string } }>(
    '/v1/roles',
    data
  );
  return response.data.id;
};

// Utilisation
const roleId = await createRole({
  name: 'Éditeur',
  description: 'Peut créer et modifier du contenu',
  permissions: [
    { subject: 'STAT', actions: ['READ'] },
    { subject: 'ACTIVITY', actions: ['READ', 'CREATE'] }
  ]
});
```

#### Attribuer un Rôle à un Utilisateur

**Endpoint:** `POST /v1/roles/{roleId}/assign`

**Authentification:** Requise (Admin)

**Payload:**
```json
{
  "userId": "user_ABC123"
}
```

#### Lister les Rôles

**Endpoint:** `GET /v1/roles`

**Authentification:** Requise (Admin)

#### Mettre à Jour un Rôle

**Endpoint:** `PUT /v1/roles/{roleId}`

**Authentification:** Requise (Admin)

#### Supprimer un Rôle

**Endpoint:** `DELETE /v1/roles/{roleId}`

**Authentification:** Requise (Admin)

---

### Health & Monitoring

Endpoints de surveillance et santé du système.

#### Vérification de Santé

**Endpoint:** `GET /v1/health`

**Authentification:** Non requise

**Réponse:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:00:00.000Z",
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "storage": "healthy",
    "queue": "healthy"
  }
}
```

**Exemple TypeScript:**
```typescript
interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    database: string;
    storage: string;
    queue: string;
  };
}

const checkHealth = async (): Promise<HealthCheck> => {
  return apiClient.get<HealthCheck>('/v1/health');
};

// Utilisation
const health = await checkHealth();
if (health.status === 'unhealthy') {
  console.error('Service is unhealthy!');
}
```

#### Version de l'API

**Endpoint:** `GET /v1/version`

**Authentification:** Non requise

**Réponse:**
```json
{
  "version": "1.0.0",
  "apiVersion": "v1",
  "buildDate": "2025-01-15",
  "environment": "production"
}
```

**Exemple TypeScript:**
```typescript
interface VersionInfo {
  version: string;
  apiVersion: string;
  buildDate: string;
  environment: string;
}

const getVersion = async (): Promise<VersionInfo> => {
  return apiClient.get<VersionInfo>('/v1/version');
};
```

#### Métriques Système

**Endpoint:** `GET /v1/metrics`

**Authentification:** Requise

**Réponse:**
```json
{
  "success": true,
  "data": {
    "health": {...},
    "errorRate": {...}
  }
}
```

---

## Exemples Complets d'Intégration

### Créer un Projet Vidéo Complet

```typescript
import { apiClient } from './api-client';

async function createCompleteVideoProject() {
  try {
    // 1. Créer un canal
    const channel = await apiClient.post('/v1/channels', {
      name: 'Mon Canal Marketing',
      description: 'Canal pour les vidéos marketing'
    });
    
    console.log('Channel created:', channel.data.id);
    
    // 2. Créer un projet
    const project = await apiClient.post(
      `/v1/channels/${channel.data.id}/projects`,
      {
        title: 'Vidéo de Présentation Produit',
        description: 'Présentation de notre nouveau produit',
        aspectRatio: '16:9',
        resolution: '1080p',
        fps: 30
      }
    );
    
    console.log('Project created:', project.data.id);
    
    // 3. Générer un script avec l'IA
    const script = await apiClient.post('/v1/ai/generate-script', {
      topic: 'Présentation de notre nouveau produit innovant',
      duration: 120,
      tone: 'professional',
      targetAudience: 'beginners'
    });
    
    console.log('Script generated with', script.data.scenes.length, 'scenes');
    
    // 4. Créer des scènes à partir du script
    const scenes = [];
    for (const sceneData of script.data.scenes) {
      const scene = await apiClient.post('/v1/scenes', {
        projectId: project.data.id,
        title: sceneData.title,
        content: sceneData.content,
        duration: sceneData.duration
      });
      
      scenes.push(scene.data);
      console.log('Scene created:', scene.data.id);
    }
    
    // 5. Uploader une image de fond
    const fileInput = document.querySelector<HTMLInputElement>('#background-image');
    if (fileInput?.files?.[0]) {
      const formData = new FormData();
      formData.append('file', fileInput.files[0]);
      formData.append('name', 'Background Image');
      formData.append('category', 'background');
      
      const asset = await apiClient.uploadFormData(
        '/v1/assets/upload',
        formData
      );
      
      console.log('Background uploaded:', asset.data.url);
      
      // Mettre à jour la première scène avec l'image de fond
      await apiClient.put(`/v1/scenes/${scenes[0].id}`, {
        backgroundImage: asset.data.url
      });
    }
    
    // 6. Générer une voix pour chaque scène
    for (const scene of scenes) {
      const voice = await apiClient.post('/v1/ai/generate-voice', {
        text: scene.content,
        voiceId: 'female-1',
        speed: 1.0,
        language: 'fr'
      });
      
      console.log('Voice generated for scene:', scene.id);
      
      // Mettre à jour la scène avec l'audio
      await apiClient.put(`/v1/scenes/${scene.id}`, {
        audio: { url: voice.data.audioUrl }
      });
    }
    
    // 7. Exporter le projet en vidéo
    const exportJob = await apiClient.post('/v1/export/video', {
      projectId: project.data.id,
      format: 'mp4',
      quality: 'high',
      resolution: '1080p',
      fps: 30,
      includeAudio: true,
      watermark: {
        enabled: false
      }
    });
    
    console.log('Export started:', exportJob.data.exportId);
    
    // 8. Surveiller le statut de l'export
    const pollExport = setInterval(async () => {
      const status = await apiClient.get(
        `/v1/export/status/${exportJob.data.exportId}`
      );
      
      console.log(`Export progress: ${status.data.progress}%`);
      
      if (status.data.status === 'completed') {
        clearInterval(pollExport);
        console.log('Video ready:', status.data.downloadUrl);
        
        // Télécharger la vidéo
        window.open(status.data.downloadUrl, '_blank');
      } else if (status.data.status === 'failed') {
        clearInterval(pollExport);
        console.error('Export failed');
      }
    }, 3000);
    
    return {
      channel: channel.data,
      project: project.data,
      scenes: scenes,
      exportJob: exportJob.data
    };
    
  } catch (error) {
    console.error('Error creating video project:', error);
    throw error;
  }
}

// Utilisation
createCompleteVideoProject()
  .then(result => {
    console.log('Complete video project created successfully!');
  })
  .catch(error => {
    console.error('Failed to create video project:', error);
  });
```

### Gestion de l'Authentification avec React

```typescript
import { useState, useEffect } from 'react';
import { apiClient } from './api-client';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier la session au chargement
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await apiClient.get('/v1/users/session');
      setUser(response.data.user);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const setAuthToken = (token: string) => {
    apiClient.setToken(token);
    checkSession();
  };

  const logout = () => {
    apiClient.setToken('');
    setUser(null);
  };

  return {
    user,
    loading,
    setAuthToken,
    logout,
    isAuthenticated: !!user
  };
}

// Utilisation dans un composant
function Dashboard() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Please login</div>;
  }

  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <p>Plan: {user.subscriptionPlan}</p>
    </div>
  );
}
```

### Composant Upload avec Progress

```typescript
import { useState } from 'react';
import { apiClient } from './api-client';

function AssetUploader() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'illustration');

      // Simuler le progress (avec un vrai backend, utiliser XMLHttpRequest)
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const result = await apiClient.uploadFormData('/v1/assets/upload', formData);
      
      clearInterval(interval);
      setProgress(100);
      
      console.log('Upload complete:', result.data.url);
      
      // Reset après 2 secondes
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 2000);
      
      return result.data;
    } catch (error) {
      setUploading(false);
      setProgress(0);
      throw error;
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
        disabled={uploading}
      />
      {uploading && (
        <div className="progress-bar">
          <div 
            className="progress" 
            style={{ width: `${progress}%` }}
          />
          <span>{progress}%</span>
        </div>
      )}
    </div>
  );
}
```

---

## Bonnes Pratiques

### 1. Gestion des Erreurs

```typescript
// Wrapper pour gérer les erreurs de manière cohérente
async function safeAPICall<T>(
  apiCall: () => Promise<T>,
  errorHandler?: (error: Error) => void
): Promise<T | null> {
  try {
    return await apiCall();
  } catch (error) {
    console.error('API Error:', error);
    if (errorHandler) {
      errorHandler(error as Error);
    }
    return null;
  }
}

// Utilisation
const project = await safeAPICall(
  () => apiClient.get('/v1/projects/123'),
  (error) => {
    toast.error(`Failed to load project: ${error.message}`);
  }
);
```

### 2. Optimisation avec Cache

```typescript
// Cache simple pour les données statiques
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = cache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  
  return data;
}

// Utilisation
const fonts = await getCachedData('fonts', () => 
  apiClient.get('/v1/fonts')
);
```

### 3. Retry Logic pour les Requêtes Critiques

```typescript
async function retryRequest<T>(
  request: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await request();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError!;
}

// Utilisation pour un export critique
const exportJob = await retryRequest(
  () => apiClient.post('/v1/export/video', exportOptions),
  3,
  2000
);
```

### 4. Validation des Données

```typescript
import { z } from 'zod';

// Schémas de validation
const ProjectSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  status: z.enum(['draft', 'in_progress', 'completed']),
  createdAt: z.string().datetime()
});

// Fonction de validation
function validateProject(data: unknown) {
  return ProjectSchema.parse(data);
}

// Utilisation
const projectData = await apiClient.get('/v1/projects/123');
const validProject = validateProject(projectData.data);
```

---

## Support et Assistance

Pour toute question ou problème:
- Documentation API interactive: `https://api.doodlio.com/docs`
- Email support: support@doodlio.com
- GitHub Issues: https://github.com/doodlio/api/issues

---

**Dernière mise à jour:** Janvier 2025  
**Version de l'API:** v1.0.0
