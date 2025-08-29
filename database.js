import mysql from 'mysql2/promise';

const librariesTableName = 'libraries';
const videosTableName = 'videos';
const collectionsTableName = 'collections';
const collectionVideosTableName = 'collection_videos';
const genresTableName = 'genres';
const videoGenresTableName = 'video_genres';

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
      CREATE TABLE IF NOT EXISTS ${librariesTableName} (
        id INT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        api_key VARCHAR(64) NOT NULL UNIQUE,
        read_only_api_key VARCHAR(64) NOT NULL UNIQUE,
        pull_zone_id INT UNIQUE,
        pull_zone_url VARCHAR(255) NOT NULL,
        pull_zone_security_key VARCHAR(64) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_library_name (name)
      );

      CREATE TABLE IF NOT EXISTS ${videosTableName} (
        guid VARCHAR(36) PRIMARY KEY,
        library_id INT NOT NULL,
        title VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        thumbnail_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (library_id) REFERENCES libraries(id) ON DELETE CASCADE ON UPDATE CASCADE,
        INDEX idx_library_id (library_id)
      );

      CREATE TABLE IF NOT EXISTS ${collectionsTableName} (
        guid VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        library_id INT NOT NULL,
        thumbnail_url TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (library_id) REFERENCES libraries(id) ON DELETE CASCADE ON UPDATE CASCADE,
        INDEX idx_library_id (library_id),
        INDEX idx_collection_name (name)
      );

      CREATE TABLE IF NOT EXISTS ${collectionVideosTableName} (
        collection_guid VARCHAR(36) NOT NULL,
        video_guid VARCHAR(36) NOT NULL,
        PRIMARY KEY (collection_guid, video_guid),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (collection_guid) REFERENCES collections(guid) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (video_guid) REFERENCES videos(guid) ON DELETE CASCADE ON UPDATE CASCADE
      );

      CREATE TABLE IF NOT EXISTS ${genresTableName} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        slug VARCHAR(100) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS ${videoGenresTableName} (
        video_guid VARCHAR(36) NOT NULL,
        genre_id INT NOT NULL,
        PRIMARY KEY (video_guid, genre_id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (video_guid) REFERENCES videos(guid) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE ON UPDATE CASCADE,
        INDEX idx_genre_id (genre_id)
      );

      INSERT IGNORE INTO ${genresTableName} (name, slug) VALUES
        ('Action', 'action'),
        ('Adventure', 'adventure'),
        ('Animation', 'animation'),
        ('Biography', 'biography'),
        ('Comedy', 'comedy'),
        ('Crime', 'crime'),
        ('Documentary', 'documentary'),
        ('Drama', 'drama'),
        ('Family', 'family'),
        ('Fantasy', 'fantasy'),
        ('History', 'history'),
        ('Horror', 'horror'),
        ('Music', 'music'),
        ('Mystery', 'mystery'),
        ('Romance', 'romance'),
        ('Sci-Fi', 'sci-fi'),
        ('Sports', 'sports'),
        ('Thriller', 'thriller'),
        ('War', 'war'),
        ('Western', 'western')
      `);
    console.log('✅ Database and tables are ready.');
  } catch (err) {
    console.error('❌ Error initializing database:', err);
    process.exit(1);
  }
}

await initializeDatabase();

function getDb() {
  return db;
}

export {
  librariesTableName,
  videosTableName,
  collectionVideosTableName,
  collectionsTableName,
  genresTableName,
  videoGenresTableName,
  getDb
};
