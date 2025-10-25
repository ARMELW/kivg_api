CREATE TABLE "assets" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"thumbnail_url" text,
	"type" text NOT NULL,
	"size" integer NOT NULL,
	"width" integer,
	"height" integer,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"category" text DEFAULT 'other' NOT NULL,
	"last_used" timestamp,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audio_files" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"duration" real NOT NULL,
	"size" integer NOT NULL,
	"category" text DEFAULT 'other' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"trim_config" jsonb,
	"fade_config" jsonb,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "channels" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"youtube_url" text,
	"brand_kit" jsonb DEFAULT '{"logoUrl":null,"colors":{"primary":"#3B82F6","secondary":"#10B981","accent":"#F59E0B"},"introVideoUrl":null,"outroVideoUrl":null,"customFonts":null}'::jsonb,
	"project_count" integer DEFAULT 0 NOT NULL,
	"total_videos_exported" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exports" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text,
	"scene_id" text,
	"user_id" text NOT NULL,
	"format" text NOT NULL,
	"quality" text NOT NULL,
	"resolution" text NOT NULL,
	"fps" integer,
	"status" text DEFAULT 'queued' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"current_step" text,
	"video_url" text,
	"error" text,
	"estimated_duration" integer,
	"watermark" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"channel_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"thumbnail_url" text,
	"resolution" text DEFAULT '1080p' NOT NULL,
	"aspect_ratio" text DEFAULT '16:9' NOT NULL,
	"fps" integer DEFAULT 30 NOT NULL,
	"duration" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "scenes" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"duration" integer DEFAULT 10 NOT NULL,
	"animation" text DEFAULT 'fade',
	"background_image" text,
	"scene_image" text,
	"layers" jsonb DEFAULT '[]'::jsonb,
	"cameras" jsonb DEFAULT '[]'::jsonb,
	"scene_cameras" jsonb DEFAULT '[]'::jsonb,
	"multi_timeline" jsonb DEFAULT '{}'::jsonb,
	"audio" jsonb DEFAULT '{}'::jsonb,
	"scene_audio" jsonb,
	"transition_type" text DEFAULT 'fade',
	"dragging_speed" real DEFAULT 1,
	"slide_duration" integer DEFAULT 0,
	"sync_slide_with_voice" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"type" text NOT NULL,
	"style" text NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"thumbnail" text,
	"preview_animation" text,
	"metadata" jsonb,
	"rating" jsonb DEFAULT '{"average":0,"count":0}'::jsonb,
	"popularity" integer DEFAULT 0 NOT NULL,
	"scene_data" jsonb NOT NULL,
	"version" text DEFAULT '1.0.0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audio_files" ADD CONSTRAINT "audio_files_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channels" ADD CONSTRAINT "channels_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exports" ADD CONSTRAINT "exports_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exports" ADD CONSTRAINT "exports_scene_id_scenes_id_fk" FOREIGN KEY ("scene_id") REFERENCES "public"."scenes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exports" ADD CONSTRAINT "exports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenes" ADD CONSTRAINT "scenes_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;