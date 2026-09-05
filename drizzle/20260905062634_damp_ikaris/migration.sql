ALTER TABLE "accounts" ADD COLUMN "issuer" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "impersonated_by" text;