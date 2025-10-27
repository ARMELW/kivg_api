CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"plan" text NOT NULL,
	"reference_id" text NOT NULL,
	"stripe_customer_id" text NOT NULL,
	"stripe_subscription_id" text NOT NULL,
	"status" text NOT NULL,
	"period_start" timestamp,
	"period_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false,
	"seats" integer DEFAULT 1,
	"trial_start" timestamp,
	"trial_end" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_stripe_customer_id_unique";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_stripe_subscription_id_unique";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "is_trial_active";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "has_used_trial";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "trial_start_date";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "trial_end_date";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "stripe_subscription_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "stripe_price_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "stripe_current_period_end";