# Guide d'Intégration - Upload Audio

Ce document explique comment intégrer l'API d'upload audio dans votre application cliente.

## Table des matières
- [Vue d'ensemble](#vue-densemble)
- [Endpoints disponibles](#endpoints-disponibles)
- [Upload d'un fichier audio](#upload-dun-fichier-audio)
- [Récupération des fichiers audio](#récupération-des-fichiers-audio)
- [Exemples d'intégration](#exemples-dintégration)
- [Gestion des erreurs](#gestion-des-erreurs)

## Vue d'ensemble

L'API d'upload audio permet aux utilisateurs de télécharger, gérer et organiser leurs fichiers audio. Les fichiers sont stockés sur MinIO et des URLs permanentes et complètes sont retournées pour chaque fichier uploadé.

**Base URL**: `https://votre-domaine.com/api` ou `http://localhost:3000/api`

**Authentification**: Toutes les requêtes nécessitent un Bearer token JWT.

## Endpoints disponibles

### 1. Upload d'un fichier audio
- **Méthode**: POST
- **Endpoint**: `/v1/audio/upload`
- **Content-Type**: `multipart/form-data`

### 2. Liste des fichiers audio
- **Méthode**: GET
- **Endpoint**: `/v1/audio`

### 3. Récupération d'un fichier spécifique
- **Méthode**: GET
- **Endpoint**: `/v1/audio/{id}`

### 4. Mise à jour des métadonnées
- **Méthode**: PUT
- **Endpoint**: `/v1/audio/{id}`

### 5. Suppression d'un fichier
- **Méthode**: DELETE
- **Endpoint**: `/v1/audio/{id}`

## Upload d'un fichier audio

### Paramètres de la requête

| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| file | File | Oui | Le fichier audio à uploader |
| name | string | Non | Nom personnalisé pour le fichier |
| category | string | Non | Catégorie: `music`, `sfx`, `voiceover`, `ambient`, `other` (défaut: `other`) |
| tags | string | Non | Tags au format JSON stringifié, ex: `["tag1", "tag2"]` |

### Formats audio acceptés

L'API accepte tous les fichiers avec un MIME type commençant par `audio/`, incluant:
- MP3 (`audio/mpeg`, `audio/mp3`)
- WAV (`audio/wav`)
- OGG (`audio/ogg`)
- WEBM (`audio/webm`)
- AAC (`audio/aac`)
- FLAC (`audio/flac`)

### Réponse réussie

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "userId": "user-uuid",
    "fileName": "mon-audio.mp3",
    "fileUrl": "http://localhost:9000/audio/audio/123e4567-e89b-12d3-a456-426614174000.mp3",
    "duration": 0,
    "size": 2048576,
    "category": "music",
    "tags": ["musique", "fond"],
    "isFavorite": false,
    "uploadedAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

**Note importante**: Le champ `fileUrl` contient l'URL complète et permanente du fichier audio. Cette URL peut être utilisée directement dans vos lecteurs audio sans nécessiter de régénération ou de signature.

### Structure de l'URL

L'URL retournée suit le format:
```
{protocole}://{endpoint}:{port}/audio/audio/{filename}
```

Exemple en production (avec SSL):
```
https://minio.votre-domaine.com/audio/audio/123e4567-e89b-12d3-a456-426614174000.mp3
```

## Récupération des fichiers audio

### Liste paginée

**GET** `/v1/audio?page=1&limit=20`

Paramètres de requête:

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| page | number | 1 | Numéro de page |
| limit | number | 20 | Nombre d'éléments par page |
| category | string | - | Filtrer par catégorie |
| search | string | - | Recherche dans le nom |
| favoritesOnly | boolean | false | Uniquement les favoris |

Réponse:

```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "fileName": "...",
      "fileUrl": "http://localhost:9000/audio/audio/...",
      ...
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

## Exemples d'intégration

### JavaScript / Fetch API

```javascript
/**
 * Upload un fichier audio
 * @param {File} audioFile - Le fichier audio à uploader
 * @param {Object} options - Options supplémentaires
 * @returns {Promise<Object>} - Réponse de l'API
 */
async function uploadAudio(audioFile, options = {}) {
  const formData = new FormData();
  formData.append('file', audioFile);
  
  if (options.name) {
    formData.append('name', options.name);
  }
  
  if (options.category) {
    formData.append('category', options.category);
  }
  
  if (options.tags && Array.isArray(options.tags)) {
    formData.append('tags', JSON.stringify(options.tags));
  }
  
  const response = await fetch('http://localhost:3000/api/v1/audio/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${votre_token_jwt}`
    },
    body: formData
  });
  
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }
  
  const result = await response.json();
  
  if (result.success) {
    console.log('Audio uploadé avec succès!');
    console.log('URL complète:', result.data.fileUrl);
    return result.data;
  } else {
    throw new Error(result.error || 'Upload failed');
  }
}

// Exemple d'utilisation
const inputFile = document.querySelector('#audioInput').files[0];
try {
  const audioData = await uploadAudio(inputFile, {
    name: 'Ma musique de fond',
    category: 'music',
    tags: ['background', 'ambient']
  });
  
  // Utiliser l'URL directement dans un élément audio
  const audioElement = document.createElement('audio');
  audioElement.src = audioData.fileUrl;
  audioElement.controls = true;
  document.body.appendChild(audioElement);
} catch (error) {
  console.error('Erreur lors de l\'upload:', error);
}
```

### React avec Axios

```javascript
import axios from 'axios';
import { useState } from 'react';

function AudioUploader() {
  const [uploading, setUploading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);
  
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Vérifier le type de fichier
    if (!file.type.startsWith('audio/')) {
      setError('Le fichier doit être un fichier audio');
      return;
    }
    
    setUploading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);
    formData.append('category', 'other');
    formData.append('tags', JSON.stringify(['upload-client']));
    
    try {
      const response = await axios.post(
        'http://localhost:3000/api/v1/audio/upload',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            console.log(`Upload en cours: ${percentCompleted}%`);
          }
        }
      );
      
      if (response.data.success) {
        setAudioUrl(response.data.data.fileUrl);
        console.log('URL de l\'audio:', response.data.data.fileUrl);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'upload');
      console.error('Erreur:', err);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div>
      <input 
        type="file" 
        accept="audio/*" 
        onChange={handleFileUpload}
        disabled={uploading}
      />
      
      {uploading && <p>Upload en cours...</p>}
      {error && <p style={{color: 'red'}}>{error}</p>}
      
      {audioUrl && (
        <div>
          <p>Audio uploadé avec succès!</p>
          <audio src={audioUrl} controls />
          <p>URL: {audioUrl}</p>
        </div>
      )}
    </div>
  );
}

export default AudioUploader;
```

### Vue.js 3 avec Composition API

```javascript
<template>
  <div class="audio-uploader">
    <input 
      type="file" 
      accept="audio/*"
      @change="handleFileChange"
      :disabled="uploading"
      ref="fileInput"
    />
    
    <div v-if="uploading" class="loading">
      <p>Upload en cours... {{ uploadProgress }}%</p>
    </div>
    
    <div v-if="error" class="error">
      {{ error }}
    </div>
    
    <div v-if="uploadedAudio" class="success">
      <h3>Audio uploadé avec succès!</h3>
      <audio :src="uploadedAudio.fileUrl" controls></audio>
      <p>Nom: {{ uploadedAudio.fileName }}</p>
      <p>Taille: {{ formatFileSize(uploadedAudio.size) }}</p>
      <p>URL: {{ uploadedAudio.fileUrl }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

const uploading = ref(false);
const uploadProgress = ref(0);
const error = ref(null);
const uploadedAudio = ref(null);
const fileInput = ref(null);

const API_BASE_URL = 'http://localhost:3000/api';
const getAuthToken = () => localStorage.getItem('jwt_token');

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const handleFileChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  // Validation
  if (!file.type.startsWith('audio/')) {
    error.value = 'Veuillez sélectionner un fichier audio valide';
    return;
  }
  
  // Limite de taille (50MB)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    error.value = 'Le fichier est trop volumineux (max 50MB)';
    return;
  }
  
  await uploadAudio(file);
};

const uploadAudio = async (file) => {
  uploading.value = true;
  error.value = null;
  uploadedAudio.value = null;
  uploadProgress.value = 0;
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', file.name);
  formData.append('category', 'music');
  formData.append('tags', JSON.stringify(['vue-upload']));
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}/v1/audio/upload`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          uploadProgress.value = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
        }
      }
    );
    
    if (response.data.success) {
      uploadedAudio.value = response.data.data;
      // Réinitialiser l'input
      if (fileInput.value) {
        fileInput.value.value = '';
      }
    } else {
      error.value = response.data.error || 'Erreur lors de l\'upload';
    }
  } catch (err) {
    error.value = err.response?.data?.error || 'Erreur lors de l\'upload';
    console.error('Upload error:', err);
  } finally {
    uploading.value = false;
  }
};
</script>

<style scoped>
.audio-uploader {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.loading {
  color: #2196F3;
  margin: 10px 0;
}

.error {
  color: #f44336;
  margin: 10px 0;
}

.success {
  margin-top: 20px;
  padding: 15px;
  background: #e8f5e9;
  border-radius: 4px;
}

audio {
  width: 100%;
  margin: 10px 0;
}
</style>
```

### Angular (TypeScript)

```typescript
// audio-upload.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface AudioUploadResponse {
  success: boolean;
  data?: {
    id: string;
    fileName: string;
    fileUrl: string;
    size: number;
    category: string;
    tags: string[];
    uploadedAt: string;
  };
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AudioUploadService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  uploadAudio(
    file: File,
    options?: {
      name?: string;
      category?: string;
      tags?: string[];
    }
  ): Observable<{
    progress: number;
    response?: AudioUploadResponse;
  }> {
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

    return this.http.post<AudioUploadResponse>(
      `${this.apiUrl}/v1/audio/upload`,
      formData,
      {
        reportProgress: true,
        observe: 'events'
      }
    ).pipe(
      map((event: HttpEvent<any>) => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            const progress = event.total
              ? Math.round((100 * event.loaded) / event.total)
              : 0;
            return { progress };
          
          case HttpEventType.Response:
            return {
              progress: 100,
              response: event.body
            };
          
          default:
            return { progress: 0 };
        }
      })
    );
  }

  getAudioList(params?: {
    page?: number;
    limit?: number;
    category?: string;
  }): Observable<any> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.category) queryParams.set('category', params.category);

    return this.http.get(
      `${this.apiUrl}/v1/audio?${queryParams.toString()}`
    );
  }
}

// audio-upload.component.ts
import { Component } from '@angular/core';
import { AudioUploadService, AudioUploadResponse } from './audio-upload.service';

@Component({
  selector: 'app-audio-upload',
  template: `
    <div class="audio-uploader">
      <input 
        type="file" 
        accept="audio/*"
        (change)="onFileSelected($event)"
        [disabled]="uploading"
        #fileInput
      />
      
      <div *ngIf="uploading" class="progress">
        <div class="progress-bar" [style.width.%]="uploadProgress"></div>
        <span>{{ uploadProgress }}%</span>
      </div>
      
      <div *ngIf="error" class="error">
        {{ error }}
      </div>
      
      <div *ngIf="uploadedAudio" class="success">
        <h3>Audio uploadé avec succès!</h3>
        <audio [src]="uploadedAudio.fileUrl" controls></audio>
        <p>URL: {{ uploadedAudio.fileUrl }}</p>
      </div>
    </div>
  `,
  styles: [`
    .audio-uploader {
      padding: 20px;
    }
    .progress {
      margin: 10px 0;
    }
    .progress-bar {
      height: 20px;
      background: #2196F3;
      transition: width 0.3s;
    }
    .error {
      color: #f44336;
    }
    .success {
      margin-top: 20px;
    }
  `]
})
export class AudioUploadComponent {
  uploading = false;
  uploadProgress = 0;
  error: string | null = null;
  uploadedAudio: any = null;

  constructor(private audioService: AudioUploadService) {}

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      this.error = 'Veuillez sélectionner un fichier audio';
      return;
    }

    this.uploading = true;
    this.error = null;
    this.uploadedAudio = null;

    this.audioService.uploadAudio(file, {
      name: file.name,
      category: 'music',
      tags: ['angular-upload']
    }).subscribe({
      next: (event) => {
        this.uploadProgress = event.progress;
        if (event.response) {
          if (event.response.success) {
            this.uploadedAudio = event.response.data;
          } else {
            this.error = event.response.error || 'Erreur lors de l\'upload';
          }
          this.uploading = false;
        }
      },
      error: (err) => {
        this.error = err.error?.error || 'Erreur lors de l\'upload';
        this.uploading = false;
      }
    });
  }
}
```

## Gestion des erreurs

### Codes d'erreur HTTP

| Code | Description |
|------|-------------|
| 200 | Succès |
| 400 | Requête invalide (fichier manquant, type invalide, etc.) |
| 401 | Non authentifié (token manquant ou invalide) |
| 403 | Non autorisé (tentative d'accès à un fichier d'un autre utilisateur) |
| 404 | Fichier non trouvé |
| 500 | Erreur serveur |

### Exemple de gestion d'erreur

```javascript
try {
  const result = await uploadAudio(file);
  console.log('Succès:', result);
} catch (error) {
  if (error.response) {
    // Le serveur a répondu avec un code d'erreur
    switch (error.response.status) {
      case 400:
        console.error('Fichier invalide:', error.response.data.error);
        break;
      case 401:
        console.error('Non authentifié - vérifiez votre token');
        // Rediriger vers la page de connexion
        break;
      case 403:
        console.error('Accès interdit');
        break;
      default:
        console.error('Erreur serveur:', error.response.data.error);
    }
  } else if (error.request) {
    // La requête a été faite mais pas de réponse
    console.error('Pas de réponse du serveur');
  } else {
    // Erreur lors de la configuration de la requête
    console.error('Erreur:', error.message);
  }
}
```

## Bonnes pratiques

### 1. Validation côté client

```javascript
function validateAudioFile(file) {
  // Vérifier le type
  if (!file.type.startsWith('audio/')) {
    throw new Error('Le fichier doit être un fichier audio');
  }
  
  // Vérifier la taille (exemple: max 50MB)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('Le fichier est trop volumineux (max 50MB)');
  }
  
  // Vérifier l'extension
  const validExtensions = ['.mp3', '.wav', '.ogg', '.webm', '.aac', '.flac'];
  const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  if (!validExtensions.includes(extension)) {
    throw new Error('Format de fichier non supporté');
  }
  
  return true;
}
```

### 2. Indicateur de progression

Toujours afficher un indicateur de progression lors de l'upload pour améliorer l'expérience utilisateur.

### 3. Gestion du cache

Les URLs retournées sont permanentes et peuvent être mises en cache:

```javascript
// Exemple avec localStorage
const cacheAudioUrl = (audioId, url) => {
  const cache = JSON.parse(localStorage.getItem('audioCache') || '{}');
  cache[audioId] = {
    url,
    timestamp: Date.now()
  };
  localStorage.setItem('audioCache', JSON.stringify(cache));
};

const getCachedAudioUrl = (audioId) => {
  const cache = JSON.parse(localStorage.getItem('audioCache') || '{}');
  return cache[audioId]?.url;
};
```

### 4. Pré-chargement audio

```javascript
const preloadAudio = (url) => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.oncanplaythrough = () => resolve(audio);
    audio.onerror = reject;
    audio.src = url;
  });
};

// Utilisation
try {
  const audio = await preloadAudio(audioData.fileUrl);
  // L'audio est prêt à être joué
  audio.play();
} catch (error) {
  console.error('Erreur de chargement:', error);
}
```

## Support et assistance

Pour toute question ou problème:
- Consultez la documentation API: `http://localhost:3000/docs`
- Vérifiez les logs côté serveur pour plus de détails sur les erreurs
- Assurez-vous que MinIO est correctement configuré et accessible

## Configuration environnement

Assurez-vous que les variables d'environnement suivantes sont correctement configurées:

```env
# MinIO Configuration
MINIO_ENDPOINT=localhost          # ou votre domaine en production
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false              # true en production avec HTTPS
```

En production, utilisez un nom de domaine personnalisé et activez SSL pour des URLs du type:
```
https://minio.votredomaine.com/audio/audio/fichier.mp3
```
