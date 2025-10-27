# Guide d'Intégration Frontend - Doodlio API

## 📖 Documentation Complète

Le guide complet de l'API pour les développeurs frontend se trouve dans:
**[FRONTEND_API_GUIDE.md](../FRONTEND_API_GUIDE.md)**

## 🚀 Démarrage Rapide

### Installation

```bash
npm install
# ou
yarn install
# ou
pnpm install
```

### Configuration du Client API

```typescript
// lib/api-client.ts
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

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
}

export const apiClient = new APIClient(API_BASE_URL);
```

### Variables d'Environnement

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## 📚 Ressources

- [Guide Complet de l'API](../FRONTEND_API_GUIDE.md) - Documentation détaillée de tous les endpoints
- [Swagger UI](http://localhost:3000/docs) - Documentation interactive
- [Architecture](./architecture/index.md) - Architecture du backend

## 🎯 Exemples d'Usage

### Authentification

```typescript
import { apiClient } from './lib/api-client';

// Après connexion avec Better Auth
const session = await auth.api.getSession({
  headers: request.headers,
});

if (session) {
  apiClient.setToken(session.token);
}

// Récupérer les infos utilisateur
const user = await apiClient.get('/v1/users/session');
```

### Créer un Projet

```typescript
// Créer un canal
const channel = await apiClient.post('/v1/channels', {
  name: 'Mon Canal',
  description: 'Description du canal'
});

// Créer un projet
const project = await apiClient.post(
  `/v1/channels/${channel.data.id}/projects`,
  {
    title: 'Mon Projet',
    aspectRatio: '16:9',
    resolution: '1080p',
    fps: 30
  }
);
```

### Upload de Fichier

```typescript
const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', 'illustration');
  
  const response = await fetch('http://localhost:3000/v1/assets/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  return response.json();
};
```

### Génération IA

```typescript
// Générer un script
const script = await apiClient.post('/v1/ai/generate-script', {
  topic: 'Introduction au machine learning',
  duration: 120,
  tone: 'educational',
  targetAudience: 'beginners'
});

// Générer une voix
const voice = await apiClient.post('/v1/ai/generate-voice', {
  text: 'Bonjour et bienvenue',
  voiceId: 'female-1',
  language: 'fr'
});
```

### Export Vidéo

```typescript
// Démarrer l'export
const exportJob = await apiClient.post('/v1/export/video', {
  projectId: 'project-uuid',
  format: 'mp4',
  quality: 'high',
  resolution: '1080p',
  fps: 30,
  includeAudio: true
});

// Surveiller le statut
const pollExportStatus = async (exportId: string) => {
  const interval = setInterval(async () => {
    const status = await apiClient.get(`/v1/export/status/${exportId}`);
    
    console.log(`Progress: ${status.data.progress}%`);
    
    if (status.data.status === 'completed') {
      clearInterval(interval);
      console.log('Download URL:', status.data.downloadUrl);
    }
  }, 3000);
};

pollExportStatus(exportJob.data.exportId);
```

## 🔗 Liens Utiles

- [Documentation API Complète](../FRONTEND_API_GUIDE.md)
- [Exemples d'intégration React](../FRONTEND_API_GUIDE.md#exemples-complets-dintégration)
- [Bonnes pratiques](../FRONTEND_API_GUIDE.md#bonnes-pratiques)
- [Gestion des erreurs](../FRONTEND_API_GUIDE.md#gestion-des-erreurs)

## 📝 Endpoints Principaux

### Authentification
- `GET /v1/users/session` - Info utilisateur

### Channels & Projects
- `POST /v1/channels` - Créer un canal
- `GET /v1/channels` - Lister les canaux
- `POST /v1/channels/{id}/projects` - Créer un projet
- `GET /v1/projects/{id}` - Détails du projet

### Assets & Audio
- `POST /v1/assets/upload` - Upload image
- `POST /v1/audio/upload` - Upload audio
- `GET /v1/assets` - Lister les assets

### IA
- `POST /v1/ai/generate-script` - Générer un script
- `POST /v1/ai/generate-voice` - Synthèse vocale
- `POST /v1/ai/generate-image-prompt` - Générer une image

### Export
- `POST /v1/export/video` - Exporter une vidéo
- `GET /v1/export/status/{id}` - Statut de l'export

Pour la documentation complète de tous les endpoints, consultez [FRONTEND_API_GUIDE.md](../FRONTEND_API_GUIDE.md).
