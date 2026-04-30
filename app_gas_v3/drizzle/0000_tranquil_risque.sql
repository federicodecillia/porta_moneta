CREATE TABLE "audit_log" (
	"audit_id" text PRIMARY KEY NOT NULL,
	"user_email" text NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"payload_json" text,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"entry_id" text PRIMARY KEY NOT NULL,
	"member_id" text NOT NULL,
	"entry_date" timestamp with time zone NOT NULL,
	"type" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"cycle_id" text,
	"note" text,
	"created_by" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "members" (
	"member_id" text PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"alias_email" text,
	"role" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "members_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "order_cycles" (
	"cycle_id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"pickup_date" timestamp with time zone,
	"pickup_end_time" text,
	"order_open_at" timestamp with time zone,
	"order_close_at" timestamp with time zone,
	"status" text NOT NULL,
	"access_level" text NOT NULL,
	"notes" text,
	"created_by" text,
	"created_at" timestamp with time zone NOT NULL,
	"closed_at" timestamp with time zone,
	"supplier_id" text
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"order_line_id" text PRIMARY KEY NOT NULL,
	"cycle_id" text NOT NULL,
	"member_id" text NOT NULL,
	"product_id" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price_snapshot" numeric(10, 2) NOT NULL,
	"line_total" numeric(10, 2) NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"product_id" text PRIMARY KEY NOT NULL,
	"cycle_id" text NOT NULL,
	"name" text NOT NULL,
	"variant" text,
	"format" text,
	"unit_price" numeric(10, 2) NOT NULL,
	"unit" text,
	"supplier" text,
	"notes" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"supplier_id" text,
	"category" text,
	"emoji" text
);
--> statement-breakpoint
CREATE TABLE "supplier_products" (
	"catalog_product_id" text PRIMARY KEY NOT NULL,
	"supplier_id" text NOT NULL,
	"name" text NOT NULL,
	"variant" text,
	"format" text,
	"unit" text,
	"unit_price" numeric(10, 2) NOT NULL,
	"notes" text,
	"category" text,
	"emoji" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"supplier_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"macro_category" text,
	"contact_name" text,
	"phone" text,
	"email" text,
	"address" text,
	"notes" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_member_id_members_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("member_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_cycle_id_order_cycles_cycle_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."order_cycles"("cycle_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_cycles" ADD CONSTRAINT "order_cycles_supplier_id_suppliers_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("supplier_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_cycle_id_order_cycles_cycle_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."order_cycles"("cycle_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_member_id_members_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("member_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_product_id_products_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("product_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_cycle_id_order_cycles_cycle_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."order_cycles"("cycle_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_supplier_id_suppliers_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("supplier_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_products" ADD CONSTRAINT "supplier_products_supplier_id_suppliers_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("supplier_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ledger_entries_member_id_idx" ON "ledger_entries" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "orders_cycle_id_idx" ON "orders" USING btree ("cycle_id");--> statement-breakpoint
CREATE INDEX "orders_member_id_idx" ON "orders" USING btree ("member_id");