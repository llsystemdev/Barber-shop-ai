-- =====================================================================
-- BARBER SHOP AI - DATABASE MIGRATION SCRIPT 0002
-- =====================================================================
-- Enterprise SaaS Multi-Tenant additions.
-- Targets: Profiles, Permissions, Guest Mode, Subscriptions, Metered Usage,
-- Credits, Gallery, Styles, and Advanced RLS Isolation Policies.
-- =====================================================================

-- ==========================================================
-- 1. EXTENDED PROFILES & SECURITY PERMISSIONS
-- ==========================================================

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone VARCHAR(50),
    bio TEXT,
    birthdate DATE,
    gender VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id VARCHAR(50) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    feature_flag VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE (role_id, feature_flag)
);

-- Seed default permissions per role
INSERT INTO permissions (role_id, feature_flag, is_enabled) VALUES
('customer', 'guest_simulations', TRUE),
('customer', 'mirror_ai', TRUE),
('customer', 'history', TRUE),
('customer', 'favorites', TRUE),
('barber', 'calendar', TRUE),
('barber', 'customers', TRUE),
('receptionist', 'calendar', TRUE),
('receptionist', 'customers', TRUE),
('receptionist', 'inventory', TRUE),
('tenant_admin', 'calendar', TRUE),
('tenant_admin', 'customers', TRUE),
('tenant_admin', 'inventory', TRUE),
('tenant_admin', 'analytics', TRUE),
('tenant_admin', 'reports', TRUE)
ON CONFLICT DO NOTHING;

-- ==========================================================
-- 2. GUEST MODE (Simulations, Sessions & Users)
-- ==========================================================

CREATE TABLE IF NOT EXISTS guest_users (
    id VARCHAR(100) PRIMARY KEY,
    first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS guest_sessions (
    id VARCHAR(100) PRIMARY KEY,
    guest_id VARCHAR(100) NOT NULL REFERENCES guest_users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days') NOT NULL
);

CREATE TABLE IF NOT EXISTS guest_simulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_id VARCHAR(100) NOT NULL REFERENCES guest_users(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    style_id VARCHAR(100) NOT NULL,
    result_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_guest_simulations_guest ON guest_simulations(guest_id);

-- ==========================================================
-- 3. SAAS SUBSCRIPTIONS, PLANS & METERED USAGE
-- ==========================================================

CREATE TABLE IF NOT EXISTS plans (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    stripe_price_id VARCHAR(255) NOT NULL,
    stripe_product_id VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'MXN' NOT NULL,
    interval VARCHAR(50) DEFAULT 'month' CHECK (interval IN ('month', 'year')),
    features TEXT[] NOT NULL DEFAULT '{}',
    limits JSONB DEFAULT '{}'::jsonb NOT NULL,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Seed Enterprise SaaS Subscription Plans (Active, price=0 for testing)
INSERT INTO plans (id, name, stripe_price_id, stripe_product_id, price, currency, features, limits, active) VALUES
('plan_free', 'FREE', 'price_mock_free', 'prod_mock_free', 0.00, 'MXN', 
 ARRAY['guest_simulations', 'mirror_ai'], 
 '{"guest_simulations": 3, "storage_gb": 1}'::jsonb, TRUE),
('plan_starter', 'STARTER', 'price_mock_starter', 'prod_mock_starter', 0.00, 'MXN', 
 ARRAY['guest_simulations', 'mirror_ai', 'history', 'favorites'], 
 '{"guest_simulations": 10, "storage_gb": 5, "calendar": true}'::jsonb, TRUE),
('plan_pro', 'PRO', 'price_mock_pro', 'prod_mock_pro', 0.00, 'MXN', 
 ARRAY['guest_simulations', 'mirror_ai', 'history', 'favorites', 'hd_download', 'calendar', 'customers', 'inventory', 'analytics'], 
 '{"guest_simulations": 100, "storage_gb": 20, "calendar": true, "customers": true, "inventory": true, "analytics": true}'::jsonb, TRUE),
('plan_enterprise', 'ENTERPRISE', 'price_mock_enterprise', 'prod_mock_enterprise', 0.00, 'MXN', 
 ARRAY['guest_simulations', 'mirror_ai', 'history', 'favorites', 'hd_download', 'calendar', 'customers', 'inventory', 'analytics', 'reports', 'premium_styles', 'video_generation', 'api_access'], 
 '{"guest_simulations": 999999, "storage_gb": 200, "calendar": true, "customers": true, "inventory": true, "analytics": true, "reports": true, "api_access": true}'::jsonb, TRUE)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255) NOT NULL,
    stripe_customer_id VARCHAR(255) NOT NULL,
    plan_id VARCHAR(100) NOT NULL REFERENCES plans(id),
    status VARCHAR(50) DEFAULT 'incomplete' NOT NULL,
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_tenant ON subscriptions(tenant_id);

CREATE TABLE IF NOT EXISTS credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_credits_user ON credits(user_id);

CREATE TABLE IF NOT EXISTS usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    feature_name VARCHAR(100) NOT NULL,
    quantity_used INTEGER DEFAULT 0 NOT NULL,
    reset_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE (tenant_id, feature_name)
);

-- ==========================================================
-- 4. HAIR STYLES, HAIRCUTS, GALLERY & AI GENERATIONS
-- ==========================================================

CREATE TABLE IF NOT EXISTS styles (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    photo_url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Seed sample styles
INSERT INTO styles (id, name, category, photo_url, description) VALUES
('style_fade_classic', 'Classic Fade', 'Corte', 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400', 'Degradado clásico y atemporal'),
('style_pompadour', 'Pompadour Moderno', 'Peinado', 'https://images.unsplash.com/photo-1517832606299-7ae9b720a186?w=400', 'Estilo pompadour levantado con volumen'),
('style_buzz_cut', 'Buzz Cut', 'Corte', 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400', 'Corte rapado uniforme y fresco')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS haircuts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    photo_url TEXT NOT NULL,
    style_id VARCHAR(100) REFERENCES styles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS gallery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    caption VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_generations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    style_id VARCHAR(100) REFERENCES styles(id) ON DELETE SET NULL,
    original_photo_url TEXT NOT NULL,
    result_url TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_ai_generations_user ON ai_generations(user_id);

CREATE TABLE IF NOT EXISTS history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(255) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_history_user ON history(user_id);

-- ==========================================================
-- 5. CHAT MESSAGES
-- ==========================================================

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL REFERENCES ai_chats(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ==========================================================
-- 6. SYSTEM UPDATES MODTIME TRIGGERS
-- ==========================================================

CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_permissions_modtime BEFORE UPDATE ON permissions FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_subscriptions_modtime BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_credits_modtime BEFORE UPDATE ON credits FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_usage_modtime BEFORE UPDATE ON usage FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_haircuts_modtime BEFORE UPDATE ON haircuts FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_gallery_modtime BEFORE UPDATE ON gallery FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_ai_generations_modtime BEFORE UPDATE ON ai_generations FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ==========================================================
-- 7. ROW LEVEL SECURITY (RLS) & POLICIES (POLÍTICAS DE SEGURIDAD)
-- ==========================================================

-- Habilitar RLS para todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE haircuts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE history ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 7.1 Politicas de aislamiento Multi-Inquilino (Tenant Isolation)

-- Profiles
CREATE POLICY profiles_tenant_policy ON profiles
    FOR ALL
    USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    ));

-- Permissions
CREATE POLICY permissions_read_policy ON permissions
    FOR SELECT
    USING (TRUE);

-- Guest System policies (anyone can insert, only specific sessions read/write)
CREATE POLICY guest_users_all ON guest_users FOR ALL USING (TRUE);
CREATE POLICY guest_sessions_all ON guest_sessions FOR ALL USING (TRUE);
CREATE POLICY guest_simulations_all ON guest_simulations FOR ALL USING (TRUE);

-- Subscriptions
CREATE POLICY subscriptions_tenant_isolation ON subscriptions
    FOR ALL
    USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid OR EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    ));

-- Credits
CREATE POLICY credits_user_isolation ON credits
    FOR ALL
    USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    ));

-- Usage
CREATE POLICY usage_tenant_isolation ON usage
    FOR ALL
    USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Haircuts
CREATE POLICY haircuts_tenant_isolation ON haircuts
    FOR ALL
    USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid OR auth.uid() IS NOT NULL);

-- Gallery
CREATE POLICY gallery_tenant_isolation ON gallery
    FOR ALL
    USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid OR auth.uid() IS NOT NULL);

-- AI Generations
CREATE POLICY ai_generations_isolation ON ai_generations
    FOR ALL
    USING (user_id = auth.uid() OR tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- History
CREATE POLICY history_user_isolation ON history
    FOR ALL
    USING (user_id = auth.uid());

-- Chat Messages
CREATE POLICY chat_messages_isolation ON chat_messages
    FOR ALL
    USING (EXISTS (
        SELECT 1 FROM ai_chats WHERE ai_chats.id = chat_id AND ai_chats.user_id = auth.uid()
    ));
