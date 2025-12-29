/**
 * Data Migration: Ensure all layers have camera_position
 * 
 * This script migrates existing scenes to ensure all layers have the critical
 * camera_position field. If a layer has position but no camera_position, 
 * it copies position to camera_position.
 * 
 * Run with: npx tsx drizzle/migrate-layer-camera-position.ts
 */

import { eq, isNotNull } from 'drizzle-orm'
import { db } from '../src/infrastructure/database/db'
import { scenes } from '../src/infrastructure/database/schema'

async function migrateLayerCameraPosition() {
  console.log('🔄 Starting layer camera_position migration...')
  
  try {
    // Fetch all scenes that have layers
    const allScenes = await db
      .select()
      .from(scenes)
      .where(isNotNull(scenes.layers))

    console.log(`📊 Found ${allScenes.length} scenes to check`)
    
    let updatedCount = 0
    let layersUpdatedCount = 0

    for (const scene of allScenes) {
      const layers = scene.layers as any[]
      
      if (!layers || layers.length === 0) {
        continue
      }

      let needsUpdate = false
      let sceneLayersUpdated = 0  // Track layers updated for this scene
      const updatedLayers = layers.map(layer => {
        // Check if layer has position but no camera_position
        if (layer.position && !layer.camera_position) {
          needsUpdate = true
          sceneLayersUpdated++
          layersUpdatedCount++
          return {
            ...layer,
            camera_position: { ...layer.position }
          }
        }
        return layer
      })

      // Update the scene if any layers were modified
      if (needsUpdate) {
        await db
          .update(scenes)
          .set({
            layers: updatedLayers as any,
            updatedAt: new Date()
          })
          .where(eq(scenes.id, scene.id))
        
        updatedCount++
        console.log(`✅ Updated scene ${scene.id}: ${scene.title} (${sceneLayersUpdated} layers)`)
      }
    }

    console.log('\n✨ Migration completed!')
    console.log(`📈 Summary:`)
    console.log(`   - Scenes checked: ${allScenes.length}`)
    console.log(`   - Scenes updated: ${updatedCount}`)
    console.log(`   - Layers updated: ${layersUpdatedCount}`)
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run the migration
migrateLayerCameraPosition()
