# SVG Shape Template Generation

## Overview

When uploading SVG shape files to the system, a JSON template configuration is automatically generated. This template extracts path data and metadata from the SVG, making it ready for use in whiteboard animations.

## How It Works

### Upload Process

1. User uploads an SVG file via `/v1/shapes/upload` endpoint
2. System processes the SVG (validation, sanitization, thumbnail generation)
3. **NEW:** Python script `path_template.py` is called to extract path data
4. JSON template is generated and stored in `uploads/shape-templates/`
5. Template path is saved to database in `shapes.template_json_path`

### Template Generation

The template generation is handled by:

- **Python Script**: `path_template.py` - Extracts SVG paths and metadata
- **TypeScript Service**: `ShapeTemplateService` - Executes Python script and manages templates

## Python Script Usage

### Command Format

```bash
python path_template.py create <svg_file> <output_json> <width> <height>
```

### Example

```bash
python path_template.py create uploads/shapes/my-shape.svg templates/my-shape_123456.json 640 640
```

### Generated Template Structure

```json
{
  "version": "1.0",
  "source_svg": "my-shape.svg",
  "target_dimensions": {
    "width": 640,
    "height": 640
  },
  "svg_metadata": {
    "viewBox": "0 0 100 100",
    "original_width": "100",
    "original_height": "100",
    "computed_width": 100.0,
    "computed_height": 100.0
  },
  "paths": [
    "M10,30 Q30,10 50,30 T90,30"
  ],
  "path_count": 1,
  "primary_path": "M10,30 Q30,10 50,30 T90,30",
  "whiteboard_config": {
    "type": "shape",
    "svg_path": "/path/to/shape.svg",
    "width": 640,
    "height": 640,
    "mode": "draw",
    "svg_sampling_rate": 12,
    "svg_reverse": false
  }
}
```

## Template Fields

| Field | Description |
|-------|-------------|
| `version` | Template format version (currently "1.0") |
| `source_svg` | Original SVG filename |
| `target_dimensions` | Target width/height for rendering |
| `svg_metadata` | Original SVG metadata (viewBox, dimensions) |
| `paths` | Array of SVG path data strings |
| `path_count` | Number of paths extracted |
| `primary_path` | First/main path (for simple shapes) |
| `whiteboard_config` | Ready-to-use configuration for whiteboard animations |

## Using Templates in Whiteboard Animations

The generated template provides a `whiteboard_config` object that can be directly used in scene layers:

```typescript
{
  type: 'shape',
  svg_path: '/uploads/shapes/my-shape.svg',
  width: 640,
  height: 640,
  mode: 'draw',
  svg_sampling_rate: 12,
  svg_reverse: false,
  position: { x: 960, y: 540 },
  z_index: 1,
  entrance_animation: {
    type: 'fade_in',
    duration: 1
  }
}
```

## API Response

When uploading a shape, the response includes the template path:

```json
{
  "success": true,
  "data": {
    "id": "shape-uuid",
    "name": "My Shape",
    "url": "/uploads/shapes/my-shape.svg",
    "thumbnailUrl": "/uploads/shapes/thumbnails/my-shape.webp",
    "width": 100,
    "height": 100,
    "templateJsonPath": "/path/to/uploads/shape-templates/my-shape_timestamp.json",
    ...
  }
}
```

## Configuration

### Environment Variables

- `PYTHON_PATH` - Path to Python interpreter (default: `python3`)
- `NODE_ENV` - Environment mode (affects base paths)

### Service Configuration

The `ShapeTemplateService` handles:

- Template generation with 30-second timeout
- Automatic directory creation (`uploads/shape-templates/`)
- Python availability checking
- Graceful degradation if Python is unavailable

## Error Handling

The system gracefully handles various scenarios:

1. **Python not available**: Service logs warning, uploads continue without template
2. **Template generation fails**: Error logged, shape still created without template
3. **SVG file not found**: Error returned, upload fails
4. **Timeout**: Generation aborted after 30 seconds

## Database Schema

The `shapes` table includes:

```sql
template_json_path TEXT -- Path to generated template JSON
```

## Testing

Tests are available in `src/application/services/shape-template.service.spec.ts`:

```bash
bun test src/application/services/shape-template.service.spec.ts
```

## Dependencies

- **Python 3.x** - Required for template generation
- **xml.etree.ElementTree** - Standard library, for SVG parsing
- No additional Python packages required

## Future Enhancements

Potential improvements:

1. Support for complex multi-path SVGs
2. Path simplification/optimization options
3. Animation preset templates
4. Batch template generation
5. Template versioning and migration
