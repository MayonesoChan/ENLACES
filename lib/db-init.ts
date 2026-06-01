import type mysql from "mysql2/promise"

/**
 * Database initialization script
 * This runs automatically when the connection pool is first created
 * It creates tables and inserts default data if they don't exist
 */

export async function initializeDatabase(pool: mysql.Pool) {
  try {
    // Check if tables already exist
    const [tables] = await pool.execute(
      `SELECT COUNT(*) as count 
       FROM information_schema.tables 
       WHERE table_schema = DATABASE() 
       AND table_name = 'users'`,
    )
    const tableCount = (tables as any[])[0].count

    if (tableCount > 0) {
      return
    }

    // Creating database tables...
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT(11) NOT NULL AUTO_INCREMENT,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        activo TINYINT(1) DEFAULT 1,
        name VARCHAR(255) NOT NULL,
        apellido_paterno VARCHAR(255) DEFAULT NULL,
        apellido_materno VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY email (email),
        KEY idx_users_activo (activo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `)

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT(11) NOT NULL AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        description TEXT DEFAULT NULL,
        icon VARCHAR(255) DEFAULT NULL,
        created_by INT(11) DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY fk_categories_created_by (created_by),
        CONSTRAINT fk_categories_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS links (
        id INT(11) NOT NULL AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        description TEXT DEFAULT NULL,
        image_url TEXT DEFAULT NULL,
        url TEXT NOT NULL,
        created_by INT(11) DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        category_id INT(11) DEFAULT NULL,
        PRIMARY KEY (id),
        KEY fk_links_created_by (created_by),
        KEY idx_links_category_id (category_id),
        CONSTRAINT fk_links_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
        CONSTRAINT fk_links_category_id FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(255) NOT NULL,
        user_id INT(11) NOT NULL,
        expires_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_sessions_user_id (user_id),
        KEY idx_sessions_expires_at (expires_at),
        CONSTRAINT fk_sessions_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS daily_messages (
        id INT(11) NOT NULL AUTO_INCREMENT,
        message TEXT NOT NULL,
        created_by INT(11) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        is_read TINYINT(1) DEFAULT 0,
        PRIMARY KEY (id),
        KEY created_by (created_by),
        CONSTRAINT daily_messages_ibfk_1 FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `)

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS daily_message_reads (
        id INT(11) NOT NULL AUTO_INCREMENT,
        message_id INT(11) NOT NULL,
        user_id INT(11) NOT NULL,
        read_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY unique_message_user (message_id, user_id),
        KEY idx_user_id (user_id),
        CONSTRAINT fk_dmr_message FOREIGN KEY (message_id) REFERENCES daily_messages (id) ON DELETE CASCADE,
        CONSTRAINT fk_dmr_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `)

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT(11) NOT NULL AUTO_INCREMENT,
        user_id INT(11) DEFAULT NULL,
        link_id INT(11) DEFAULT NULL,
        category_id INT(11) DEFAULT NULL,
        message TEXT DEFAULT NULL,
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_notifications_user_id (user_id),
        KEY idx_notifications_link_id (link_id),
        KEY idx_notifications_category_id (category_id),
        CONSTRAINT fk_notifications_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        CONSTRAINT fk_notifications_link_id FOREIGN KEY (link_id) REFERENCES links (id) ON DELETE CASCADE,
        CONSTRAINT fk_notifications_category_id FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT(11) NOT NULL AUTO_INCREMENT,
        setting_key VARCHAR(100) NOT NULL,
        setting_value TEXT DEFAULT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        updated_by INT(11) DEFAULT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY setting_key (setting_key),
        KEY fk_settings_updated_by (updated_by),
        CONSTRAINT fk_settings_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Inserting default data...
    await pool.execute(`
      INSERT INTO users (id, email, password_hash, role, activo, name, apellido_paterno, apellido_materno)
      VALUES 
        (1, 'admin@example.com', '$2b$10$LBFaHFQrB.w79jdoqLQzTeIn62vF.R7IbjRXVz80bHcZ9CJ3rz81q', 'admin', 1, 'Administrador', '', ''),
        (2, 'user@example.com', '$2b$10$UnLdLrPRZ5HjYjbpZRtaie2WHgK3BWSwYCGx.w4E1YU/kX585tNnq', 'user', 1, 'Usuario Regular', NULL, NULL)
    `)

    await pool.execute(`
      INSERT INTO categories (id, name, description, icon, created_by)
      VALUES 
        (1, 'Operación', 'Herramientas de trabajoy mensajería', '🔧', 1),
        (2, 'Marketing', 'Aplicaciones para atraer clientes', '📢', 1),
        (3, 'Formación', 'Herramientas de aprendizaje y capacitacion', '🎓', 1),
        (4, 'Otros', 'Videollamada, Links útiles, etc.', '📦', NULL)
    `)

    await pool.execute(`
      INSERT INTO links (title, description, image_url, url, created_by, category_id)
      VALUES 
        ('Proceso de Venta FDX', 'Flujo y gestión del proceso de ventas FDX', 'https://cdn-icons-png.flaticon.com/512/3135/3135673.png', '#', NULL, 1),
        ('CRM | Monday', 'Gestión de clientes y oportunidades en Monday', 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png', 'https://monday.com', NULL, 1),
        ('WhatsApp Business', 'Comunicación con clientes vía WhatsApp Business', 'https://cdn-icons-png.flaticon.com/512/733/733585.png', 'https://www.whatsapp.com/business', NULL, 1),
        ('Calendario', 'Gestión de agenda y eventos operativos', 'https://cdn-icons-png.flaticon.com/512/747/747310.png', '#', NULL, 1),
        ('Inventario', 'Control y gestión de inventario', 'https://cdn-icons-png.flaticon.com/512/679/679922.png', '#', NULL, 1),
        ('Contratos', 'Gestión de contratos y documentos legales', 'https://cdn-icons-png.flaticon.com/512/942/942748.png', '#', NULL, 1),
        ('Drive Operación', 'Almacenamiento de documentos operativos', 'https://cdn-icons-png.flaticon.com/512/5968/5968523.png', 'https://drive.google.com', NULL, 1),
        ('Canva', 'Diseño gráfico y material publicitario', 'https://imgs.search.brave.com/QDivm6EHqHVFT34NOEu_JkO8hfZrKLvEud7C6V_44E8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudmVjdGVlenku/Y29tL3N5c3RlbS9y/ZXNvdXJjZXMvdGh1/bWJuYWlscy8wNzMv/NDk0LzE4NC9zbWFs/bC9jYW52YS1jaXJj/dWxhci1sb2dvLWds/b3NzeS1tb2Rlcm4t/ZmluaXNoLWZyZWUt/cG5nLnBuZw', 'https://www.canva.com', NULL, 2),
        ('Meta Business', 'Gestión de anuncios y páginas en Meta', 'https://cdn-icons-png.flaticon.com/512/5968/5968764.png', 'https://business.facebook.com', NULL, 2),
        ('TikTok Business', 'Publicidad y gestión de marca en TikTok', 'https://cdn-icons-png.flaticon.com/512/3046/3046121.png', 'https://www.tiktok.com/business', NULL, 2),
        ('Banco Multimedia', 'Repositorio de imágenes y videos', 'https://cdn-icons-png.flaticon.com/512/3767/3767084.png', '#', NULL, 2),
        ('Guiones & Copys', 'Guiones comerciales y textos publicitarios', 'https://cdn-icons-png.flaticon.com/512/2921/2921222.png', '#', NULL, 2),
        ('Onboarding FDX', 'Proceso de inducción para nuevos integrantes', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', '#', NULL, 3),
        ('Manual de Operaciones', 'Guía oficial de procesos internos', 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png', '#', NULL, 3),
        ('Capacitaciones', 'Cursos y entrenamientos internos', 'https://cdn-icons-png.flaticon.com/512/3135/3135810.png', '#', NULL, 3),
        ('Eventos & Zoom', 'Eventos virtuales y capacitaciones en línea', 'https://cdn-icons-png.flaticon.com/512/5968/5968558.png', 'https://zoom.us', NULL, 4),
        ('Cultura FDX', 'Valores y cultura organizacional FDX', 'https://cdn-icons-png.flaticon.com/512/2641/2641409.png', '#', NULL, 4),
        ('Correo Corporativo', 'Correo electrónico institucional', 'https://cdn-icons-png.flaticon.com/512/732/732200.png', 'https://mail.google.com', NULL, 4),
        ('Zoom / Meet', 'Herramientas de videoconferencia', 'https://cdn-icons-png.flaticon.com/512/5968/5968558.png', 'https://meet.google.com', NULL, 4),
        ('Portales Inmobiliarios', 'Plataformas externas de publicación inmobiliaria', 'https://cdn-icons-png.flaticon.com/512/609/609803.png', '#', NULL, 4),
        ('Links Útiles', 'Accesos rápidos a recursos externos', 'https://cdn-icons-png.flaticon.com/512/929/929426.png', '#', NULL, 4)
    `)

    await pool.execute(`
      INSERT INTO daily_messages (message, created_by, is_read)
      VALUES ('¡Bienvenido! Recuerda revisar los enlaces actualizados del día.', 1, 0)
    `)

    await pool.execute(`
      INSERT INTO settings (setting_key, setting_value, updated_by)
      VALUES 
        ('company_name', 'FDX GLOBAL', 1),
        ('company_logo', NULL, 1)
    `)
  } catch (error) {
    throw error
  }
}
