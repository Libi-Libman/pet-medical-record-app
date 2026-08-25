CREATE TABLE "pets" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"species" text DEFAULT 'dog' NOT NULL,
	"breed" text,
	"sex" text NOT NULL,
	"sterilized" boolean DEFAULT false NOT NULL,
	"birth_date" date,
	"microchip_number" text,
	"photo_url" text,
	"primary_contact_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pets" ENABLE ROW LEVEL SECURITY;