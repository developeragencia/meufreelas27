-- MeuFreelas - Schema completo do banco de dados
-- Banco: u892594395_meufreelas (ou o definido em DB_NAME)
-- Uso: executar no phpMyAdmin se setup.php falhar, ou como referência.
-- Na Hostinger: configure DB_HOST, DB_PORT, DB_NAME, DB_USER e DB_PASS nas variáveis de ambiente ou em api/.env

-- =============================================================================
-- USUÁRIOS
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM('freelancer','client','admin') NOT NULL,
    avatar VARCHAR(500) DEFAULT NULL,
    phone VARCHAR(50) DEFAULT NULL,
    location VARCHAR(255) DEFAULT NULL,
    bio TEXT DEFAULT NULL,
    skills JSON DEFAULT NULL,
    hourly_rate VARCHAR(50) DEFAULT NULL,
    rating DECIMAL(3,2) DEFAULT 0,
    completed_projects INT DEFAULT 0,
    has_freelancer_account TINYINT(1) DEFAULT 0,
    has_client_account TINYINT(1) DEFAULT 0,
    is_verified TINYINT(1) DEFAULT 0,
    activation_token VARCHAR(64) DEFAULT NULL,
    activation_token_expires_at TIMESTAMP NULL DEFAULT NULL,
    password_reset_token VARCHAR(64) DEFAULT NULL,
    password_reset_expires_at TIMESTAMP NULL DEFAULT NULL,
    is_premium TINYINT(1) DEFAULT 0,
    plan_type VARCHAR(20) DEFAULT 'free',
    plan_expires_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- PROJETOS
-- =============================================================================
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(36) PRIMARY KEY,
    client_id VARCHAR(36) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    budget VARCHAR(100) DEFAULT NULL,
    category VARCHAR(255) NOT NULL,
    skills JSON DEFAULT NULL,
    experience_level VARCHAR(50) DEFAULT 'intermediate',
    proposal_days VARCHAR(20) DEFAULT '30',
    visibility VARCHAR(20) DEFAULT 'public',
    status VARCHAR(50) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_client (client_id),
    INDEX idx_status (status),
    INDEX idx_category (category),
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- PROPOSTAS
-- =============================================================================
CREATE TABLE IF NOT EXISTS proposals (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    freelancer_id VARCHAR(36) NOT NULL,
    amount VARCHAR(100) NOT NULL,
    delivery_days VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_project (project_id),
    INDEX idx_freelancer (freelancer_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- CONVERSAS E MENSAGENS
-- =============================================================================
CREATE TABLE IF NOT EXISTS conversations (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS conversation_participants (
    conversation_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (conversation_id, user_id),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(36) PRIMARY KEY,
    conversation_id VARCHAR(36) NOT NULL,
    sender_id VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_conversation (conversation_id),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- FAVORITOS
-- =============================================================================
CREATE TABLE IF NOT EXISTS favorites (
    user_id VARCHAR(36) NOT NULL,
    freelancer_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, freelancer_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- PAGAMENTOS (projetos / escrow - Stripe ou Mercado Pago)
-- provider = 'stripe' | 'mercadopago', external_id = id da sessão/checkout
-- =============================================================================
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(36) PRIMARY KEY,
    proposal_id VARCHAR(36) NOT NULL,
    client_id VARCHAR(36) DEFAULT NULL,
    freelancer_id VARCHAR(36) DEFAULT NULL,
    amount DECIMAL(12,2) NOT NULL,
    platform_fee DECIMAL(12,2) DEFAULT 0,
    provider VARCHAR(50) DEFAULT NULL,
    external_id VARCHAR(255) DEFAULT NULL,
    checkout_url TEXT DEFAULT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    released_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_client (client_id),
    INDEX idx_freelancer (freelancer_id),
    INDEX idx_external_id (external_id),
    FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- ENTREGAS DE PROJETO
-- =============================================================================
CREATE TABLE IF NOT EXISTS project_deliveries (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    proposal_id VARCHAR(36) DEFAULT NULL,
    freelancer_id VARCHAR(36) NOT NULL,
    client_id VARCHAR(36) NOT NULL,
    message TEXT NOT NULL,
    delivery_url TEXT DEFAULT NULL,
    status VARCHAR(50) DEFAULT 'submitted',
    client_feedback TEXT DEFAULT NULL,
    rating TINYINT NULL COMMENT '1-5, preenchido ao aprovar entrega',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL DEFAULT NULL,
    INDEX idx_project (project_id),
    INDEX idx_freelancer (freelancer_id),
    INDEX idx_client (client_id),
    INDEX idx_status (status),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- ASSINATURAS (planos Pro / Premium - Stripe ou Mercado Pago)
-- provider = 'stripe' | 'mercadopago', external_id = id do checkout/sessão
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    plan_code VARCHAR(20) NOT NULL,
    billing_cycle VARCHAR(20) NOT NULL,
    provider VARCHAR(20) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    external_id VARCHAR(255) DEFAULT NULL,
    checkout_url TEXT DEFAULT NULL,
    started_at TIMESTAMP NULL DEFAULT NULL,
    expires_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_status (user_id, status),
    INDEX idx_external_id (external_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- NOTIFICAÇÕES
-- =============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    type VARCHAR(50) DEFAULT 'system',
    title VARCHAR(255) NOT NULL,
    message TEXT DEFAULT NULL,
    link VARCHAR(255) DEFAULT NULL,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_read (user_id, is_read),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- SANÇÕES / MODERAÇÃO
-- =============================================================================
CREATE TABLE IF NOT EXISTS sanctions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    reason TEXT NOT NULL,
    sanction_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
