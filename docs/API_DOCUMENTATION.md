# Whiteboard Animation API

This API provides comprehensive endpoints for managing a whiteboard animation platform including assets, channels, projects, scenes, audio, templates, and video exports.

## 📚 Documentation

### Pour les Développeurs Frontend
**Consultez le [Guide Complet de l'API Frontend](./FRONTEND_API_GUIDE.md)** pour:
- Exemples de code TypeScript/JavaScript complets
- Payloads et réponses détaillés pour chaque endpoint
- Gestion de l'authentification
- Exemples d'intégration React
- Bonnes pratiques et patterns

### Documentation Interactive
- Swagger UI: `http://localhost:3000/docs`
- OpenAPI Spec: `http://localhost:3000/swagger`

## Base URL

```
Production: https://api.doodlio.com
Development: http://localhost:3000
```

## Authentication

All endpoints (except `/health` and `/version`) require authentication via Better Auth. Include the session token in requests.

## Endpoints Overview

### Assets (Images)
- `POST /v1/assets/upload` - Upload an image asset
- `GET /v1/assets` - List all assets with pagination and filters
- `GET /v1/assets/:id` - Get specific asset details
- `PUT /v1/assets/:id` - Update asset metadata
- `DELETE /v1/assets/:id` - Delete an asset
- `GET /v1/assets/stats` - Get asset usage statistics

### Channels
- `POST /v1/channels` - Create a new channel
- `GET /v1/channels` - List all channels
- `GET /v1/channels/:id` - Get channel details
- `PUT /v1/channels/:id` - Update channel
- `POST /v1/channels/:id/archive` - Archive a channel
- `GET /v1/channels/:id/stats` - Get channel statistics

### Projects
- `POST /v1/channels/:channelId/projects` - Create project in channel
- `GET /v1/channels/:channelId/projects` - List channel projects
- `GET /v1/projects/:id` - Get project details
- `PUT /v1/projects/:id` - Update project
- `POST /v1/projects/:id/duplicate` - Duplicate project
- `DELETE /v1/projects/:id` - Delete project
- `POST /v1/projects/:id/autosave` - Autosave project state

### Scenes
- `POST /v1/scenes` - Create a new scene
- `GET /v1/scenes` - List scenes with filters
- `GET /v1/scenes/:id` - Get scene details
- `PUT /v1/scenes/:id` - Update scene
- `POST /v1/scenes/:id/duplicate` - Duplicate scene
- `POST /v1/scenes/reorder` - Reorder scenes in project
- `DELETE /v1/scenes/:id` - Delete scene

### Audio Files
- `POST /v1/audio/upload` - Upload audio file
- `GET /v1/audio` - List audio files
- `GET /v1/audio/:id` - Get audio details
- `PUT /v1/audio/:id` - Update audio metadata
- `DELETE /v1/audio/:id` - Delete audio file

### Templates
- `POST /v1/templates` - Create template
- `GET /v1/templates` - List templates
- `GET /v1/templates/:id` - Get template details
- `GET /v1/templates/:id/export` - Export template as JSON
- `POST /v1/templates/import` - Import template from JSON
- `DELETE /v1/templates/:id` - Delete template

### Export & Video Generation
- `POST /v1/export/scene/:id` - Export a scene
- `POST /v1/export/video` - Generate full project video
- `GET /v1/export/status/:exportId` - Check export status
- `GET /v1/export/download/:exportId` - Download exported video
- `GET /v1/export/config` - Get export configuration options

### Health & Monitoring
- `GET /v1/health` - Health check endpoint
- `GET /v1/version` - API version information

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {}
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

## Database Schema

The API uses the following main tables:
- `assets` - Image assets with metadata
- `channels` - User channels with brand kits
- `projects` - Video projects with settings
- `scenes` - Project scenes with layers and cameras
- `audio_files` - Audio assets
- `templates` - Reusable scene templates
- `exports` - Video export job tracking

## Development

### Setup
```bash
npm install
npm run db:migrate
```

### Running
```bash
npm run dev      # Development with hot reload
npm run build    # Build for production
npm start        # Run production server
```

### Database
```bash
npm run db:generate  # Generate migrations
npm run db:migrate   # Apply migrations
npm run db:studio    # Open Drizzle Studio
```

## Technology Stack

- **Runtime**: Bun
- **Framework**: Hono with OpenAPI
- **Database**: PostgreSQL with Drizzle ORM
- **Validation**: Zod
- **Authentication**: Better Auth
- **File Storage**: Cloudinary
- **Documentation**: Swagger/Scalar

## Architecture

The project follows Clean Architecture principles:
- **Domain Layer**: Models and repository interfaces
- **Application Layer**: Use cases and services
- **Infrastructure Layer**: Controllers, repositories, and external integrations

## Status

✅ Database schema created with migrations
✅ Domain models with Zod validation
✅ Repository interfaces defined
✅ Controllers with OpenAPI specifications
✅ Authentication integration
✅ File upload support (images and audio)

The API structure is complete and ready for:
- Repository implementations with Drizzle ORM
- Business logic in use cases
- Integration with video processing services
- Frontend application development
