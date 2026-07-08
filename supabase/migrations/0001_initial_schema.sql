-- =====================================================================
-- BARBER SHOP AI - DATABASE MIGRATION SCRIPT
-- =====================================================================
-- Blueprint for Supabase PostgreSQL Database (Multi-Tenant Architecture)
-- Targets: Users, Roles, Tenant Isolation, Store Management, Appointments,
-- Billing, Inventory, Notifications, AI Chats, and Logs Auditing.
-- =====================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================================
-- 1. TENANTS & ROLES (Multi-Tenant foundation)
-- ==========================================================

CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    subdomain VARCHAR(100) UNIQUE,
    plan_type VARCHAR(50) DEFAULT 'freemium' CHECK (plan_type IN ('freemium', 'pro', 'enterprise')),
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    updated_by UUID
);

COMMENT ON TABLE tenants IS 'Aisla los datos de cada barberia independiente (multi-tenant).';

-- User Roles list (RBAC)
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

INSERT INTO roles (id, name, description) VALUES
('admin', 'Administrador Global', 'Control absoluto del SaaS Barber Shop AI'),
('tenant_admin', 'Dueño de Barbería', 'Administra su propia barbería, sucursales y personal'),
('barber', 'Barbero / Estilista', 'Atiende clientes y gestiona su agenda y citas'),
('receptionist', 'Recepcionista', 'Gestiona reservas, caja e inventario en sucursales'),
('customer', 'Cliente', 'Realiza citas, chatea con Leo AI y compra productos')
ON CONFLICT (id) DO NOTHING;

-- App Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) REFERENCES roles(id) DEFAULT 'customer' NOT NULL,
    avatar_url TEXT,
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    updated_by UUID
);

COMMENT ON TABLE users IS 'Usuarios unificados del sistema. Soporta integracion directa con Supabase Auth via triggers.';

-- ==========================================================
-- 2. BRANCHES, BARBERS & SCHEDULES
-- ==========================================================

CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(50),
    hours JSONB DEFAULT '{"Lunes-Viernes": "9:00 AM - 8:00 PM", "Sábados": "9:00 AM - 6:00 PM", "Domingos": "Cerrado"}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    updated_by UUID
);

CREATE TABLE IF NOT EXISTS barbers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    specialty VARCHAR(100),
    commission_percentage DECIMAL(5, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barber_id UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 (Domingo) a 6 (Sábado)
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_working_day BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ==========================================================
-- 3. CATEGORIES, SERVICES & PROMOTIONS
-- ==========================================================

CREATE TABLE IF NOT EXISTS service_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES service_categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    updated_by UUID
);

CREATE TABLE IF NOT EXISTS promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    discount_percentage DECIMAL(5,2),
    discount_amount DECIMAL(10,2),
    coupon_code VARCHAR(50) UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ==========================================================
-- 4. APPOINTMENTS, LOGS & CANCELLATIONS
-- ==========================================================

CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    barber_id UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    appointment_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    notes TEXT,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    updated_by UUID
);

CREATE TABLE IF NOT EXISTS appointment_cancellations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    cancelled_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ==========================================================
-- 5. BILLING & INVOICES
-- ==========================================================

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('card', 'cash', 'transfer', 'stripe')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
    stripe_charge_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    pdf_url TEXT,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ==========================================================
-- 6. PRODUCTS & INVENTORY
-- ==========================================================

CREATE TABLE IF NOT EXISTS providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    cost DECIMAL(10, 2) NOT NULL,
    sku VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 0 NOT NULL,
    min_stock_alert INTEGER DEFAULT 5 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE (branch_id, product_id)
);

CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ==========================================================
-- 7. REVIEWS, FAVORITES & NOTIFICATIONS
-- ==========================================================

CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    barber_id UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE (customer_id, barber_id)
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    type VARCHAR(50) DEFAULT 'system' CHECK (type IN ('appointment', 'system', 'marketing', 'inventory')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ==========================================================
-- 8. AI ENGINE & CHATS
-- ==========================================================

CREATE TABLE IF NOT EXISTS ai_chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(100) NOT NULL,
    messages JSONB DEFAULT '[]'::jsonb NOT NULL,
    analysis_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ==========================================================
-- 9. AUDITING, SYSTEM LOGS & METRICS
-- ==========================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    old_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ==========================================================
-- 10. SYSTEM INDEXES (Optimized for multi-tenancy query paths)
-- ==========================================================

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_branches_tenant_id ON branches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_barbers_tenant_id ON barbers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_services_tenant_id ON services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_id ON appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_barber_id ON appointments(barber_id);
CREATE INDEX IF NOT EXISTS idx_appointments_time ON appointments(appointment_time);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_tenant_branch ON inventory(tenant_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_ai_chats_session ON ai_chats(session_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);

-- ==========================================================
-- 11. DATABASE VIEWS
-- ==========================================================

-- Operational dashboard statistics
CREATE OR REPLACE VIEW dashboard_statistics AS
SELECT 
    t.id AS tenant_id,
    COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'completed'), 0) AS total_revenue,
    COUNT(DISTINCT a.id) AS appointments_count,
    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'completed') AS completed_appointments,
    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'cancelled') AS cancelled_appointments,
    COUNT(DISTINCT a.customer_id) AS active_customers
FROM tenants t
LEFT JOIN appointments a ON t.id = a.tenant_id
LEFT JOIN payments p ON t.id = p.tenant_id
GROUP BY t.id;

-- ==========================================================
-- 12. ADVANCED TRIGGERS & SQL FUNCTIONS
-- ==========================================================

-- Auto-update timestamps function
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply auto-update timestamps to core entities
CREATE TRIGGER update_tenants_modtime BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_branches_modtime BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_barbers_modtime BEFORE UPDATE ON barbers FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_services_modtime BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_appointments_modtime BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_products_modtime BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_ai_chats_modtime BEFORE UPDATE ON ai_chats FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Function: Compute available booking slots for a barber on a given day
CREATE OR REPLACE FUNCTION get_available_slots(p_barber_id UUID, p_date DATE)
RETURNS TABLE(slot_time TIME) AS $$
DECLARE
    v_day_of_week INT;
    v_start TIME;
    v_end TIME;
    v_is_working BOOLEAN;
BEGIN
    -- Extract weekday index (0-6)
    v_day_of_week := EXTRACT(DOW FROM p_date);
    
    -- Fetch schedule bounds
    SELECT start_time, end_time, is_working_day 
    INTO v_start, v_end, v_is_working
    FROM schedules
    WHERE barber_id = p_barber_id AND day_of_week = v_day_of_week;
    
    IF v_is_working IS TRUE THEN
        -- Generate 30-minute intervals from start to end
        RETURN QUERY 
        WITH RECURSIVE slots AS (
            SELECT v_start AS val
            UNION ALL
            SELECT val + INTERVAL '30 minutes'
            FROM slots
            WHERE val + INTERVAL '30 minutes' < v_end
        )
        SELECT s.val::TIME FROM slots s
        WHERE NOT EXISTS (
            -- Exclude active/confirmed overlapping appointments
            SELECT 1 FROM appointments a
            WHERE a.barber_id = p_barber_id
              AND a.appointment_time::DATE = p_date
              AND a.appointment_time::TIME = s.val::TIME
              AND a.status IN ('pending', 'confirmed')
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger Function: Automatic creation of tenant admin's default branch/settings
CREATE OR REPLACE FUNCTION setup_tenant_defaults()
RETURNS TRIGGER AS $$
BEGIN
    -- Create default service category for the tenant
    INSERT INTO service_categories (tenant_id, name)
    VALUES (NEW.id, 'Corte & Peinado');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_setup_tenant_defaults
AFTER INSERT ON tenants
FOR EACH ROW EXECUTE FUNCTION setup_tenant_defaults();

-- ==========================================================
-- 13. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================
-- Note: Set of guidelines configured as SQL ready to run.
-- To activate, run: ALTER TABLE <name> ENABLE ROW LEVEL SECURITY;
-- ==========================================================

/*
-- ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY tenants_isolation_policy ON tenants
--     FOR ALL
--     USING (id = (auth.jwt() ->> 'tenant_id')::uuid);

-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY users_tenant_isolation ON users
--     FOR ALL
--     USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid OR auth.uid() = id);

-- ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY appointments_tenant_isolation ON appointments
--     FOR ALL
--     USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid OR customer_id = auth.uid());

-- ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY payments_tenant_isolation ON payments
--     FOR ALL
--     USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY products_tenant_isolation ON products
--     FOR ALL
--     USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid OR auth.jwt() ->> 'role' = 'customer');

-- ALTER TABLE ai_chats ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY ai_chats_isolation ON ai_chats
--     FOR ALL
--     USING (user_id = auth.uid() AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
*/
