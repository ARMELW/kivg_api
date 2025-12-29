-- Migration: Add missing scene integration fields from frontend
-- Based on docs/integration requirements

-- Add new scene-level visual fields
ALTER TABLE "scenes" ADD COLUMN "scene_width" integer DEFAULT 1920;--> statement-breakpoint
ALTER TABLE "scenes" ADD COLUMN "scene_height" integer DEFAULT 1080;--> statement-breakpoint
ALTER TABLE "scenes" ADD COLUMN "background_color" text;--> statement-breakpoint
ALTER TABLE "scenes" ADD COLUMN "background" jsonb;--> statement-breakpoint

-- Add new transition fields
ALTER TABLE "scenes" ADD COLUMN "transition" jsonb;--> statement-breakpoint
ALTER TABLE "scenes" ADD COLUMN "wait_duration_before_next_scene" real DEFAULT 2.0;--> statement-breakpoint

-- Add new advanced feature fields
ALTER TABLE "scenes" ADD COLUMN "eraser_config" jsonb;--> statement-breakpoint
ALTER TABLE "scenes" ADD COLUMN "occlusion_culling" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "scenes" ADD COLUMN "occlusion_culling_config" jsonb;
