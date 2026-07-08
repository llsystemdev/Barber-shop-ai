# Barber Shop AI - Supabase Migration Blueprint

This directory contains the entire blueprint, migrations, database schemas, edge functions, and configuration files required for migrating Barber Shop AI to **Supabase** in a professional, enterprise-grade multi-tenant architecture.

## Architecture Status: Fully Prepared (100% Offline Ready)
The application has been fully decoupled using Clean Architecture and SOLID principles. The frontend and server code do NOT depend on Supabase directly yet, meaning the application is 100% operational in its current state. All Supabase-specific configurations, types, RLS policies, migrations, and Edge Functions are statically compiled and ready to be activated.

## How to Activate Supabase

Once you are ready to transition to Supabase, follow these exact steps:

### 1. Install dependencies
Install the Supabase JS SDK on your project:
```bash
npm install @supabase/supabase-js
```

### 2. Configure Environment Variables
Add the following keys to your server `.env` file (and register them in your deployment platform):
```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 3. Run migrations on Supabase Database
You can deploy the SQL files in `supabase/migrations/` using the Supabase CLI:
```bash
# Initialize Supabase locally (optional)
supabase init

# Link to your remote project
supabase link --project-ref your-project-ref

# Push the migrations to Supabase
supabase db push
```
Alternatively, copy the contents of `supabase/migrations/0001_initial_schema.sql` and run them directly in the **SQL Editor** of your Supabase dashboard.

### 4. Deploy Storage Buckets
Create the following buckets in your Supabase Storage dashboard and enable public/restricted access as per instructions in `supabase/migrations/0001_initial_schema.sql`:
- `avatars` (Public, for profile pictures)
- `haircuts` (Public, for haircut visualizer pictures)
- `videos` (Public/Private, for haircut videos)
- `logos` (Public, for tenant shop branding)
- `documents` (Private, for receipts and invoices)
- `ai_images` (Public, for AI-generated styles)

### 5. Deploy Edge Functions
Deploy the Edge Functions located in `supabase/functions/` via CLI:
```bash
supabase functions deploy appointments
supabase functions deploy notifications
supabase functions deploy payments
supabase functions deploy emails
supabase functions deploy storage
supabase functions deploy analytics
supabase functions deploy ai
supabase functions deploy reports
supabase functions deploy audit
```

### 6. Register Services in Service Container
Change the bindings in your Service Container (`src/services/serviceContainer.ts`) to resolve the Supabase-backed implementations (e.g., `SupabaseAuthService`, `SupabaseAppointmentRepository`) instead of the mock/local memory services.

---

## Technical Specifications
- **Multi-Tenancy**: Tenant-isolation is achieved at the database level using `tenant_id` column-level indexing and Row-Level Security (RLS) policies.
- **Auditing**: Automatically managed database audit log using specialized triggers (`audit.log_changes()`).
- **Data Validation**: Client and server models are fully guarded with Zod schemas matching Postgres constraint definitions.
