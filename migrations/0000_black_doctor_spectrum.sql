CREATE TABLE "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"friend_id" integer NOT NULL,
	"activity_type" text NOT NULL,
	"description" text NOT NULL,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "friends" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text,
	"photo" text,
	"location" text,
	"neighborhood" text,
	"relationship_level" text DEFAULT 'new' NOT NULL,
	"interests" text[] DEFAULT '{}',
	"lifestyle" text,
	"has_kids" boolean DEFAULT false,
	"partner" text,
	"introduced_by" integer,
	"how_we_met" text,
	"notes" text,
	"phone" text,
	"email" text,
	"birthday" text,
	"contact_info" text,
	"last_interaction" timestamp
);
--> statement-breakpoint
CREATE TABLE "relationships" (
	"id" serial PRIMARY KEY NOT NULL,
	"friend_id" integer NOT NULL,
	"related_friend_id" integer NOT NULL,
	"relationship_type" text NOT NULL
);
