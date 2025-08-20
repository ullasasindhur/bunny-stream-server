import mysql from 'mysql2/promise';

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
  console.error('Missing DB env vars. Ensure DB_HOST, DB_USER, DB_PASSWORD, DB_NAME are set.');
  process.exit(1);
}

const dbConfig = {
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  multipleStatements: true
};

let db;

async function initializeDatabase() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
    await connection.end();

    db = mysql.createPool({
      ...dbConfig,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    await db.query(`
      CREATE TABLE IF NOT EXISTS libraries (
        id INT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        api_key VARCHAR(64) NOT NULL UNIQUE,
        read_only_api_key VARCHAR(64) NOT NULL UNIQUE,
        pull_zone_id INT UNIQUE,
        pull_zone_url VARCHAR(255) NOT NULL,
        pull_zone_security_key VARCHAR(64) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS videos (
        guid VARCHAR(36) PRIMARY KEY,
        library_id INT NOT NULL,
        title VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        thumbnail_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (library_id) REFERENCES libraries(id) ON DELETE CASCADE,
        INDEX idx_library_id (library_id)
      );
    `);

    console.log('✅ Database and tables are ready.');
  } catch (err) {
    console.error('❌ Error initializing database:', err);
    process.exit(1);
  }
}

await initializeDatabase();

export default function getDb() {
  return db;
}
