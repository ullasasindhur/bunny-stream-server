import pg from 'pg';
import { categories, tables, videoStatus } from './constants/db.js';
const { Pool } = pg;
import {
  DB_HOST,
  DB_NAME,
  DB_PASSWORD,
  DB_PORT,
  DB_USER,
  usersTableName
} from './constants/common.js';
const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;

if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME || !DB_PORT) {
  console.error(
    'Missing DB env vars. Ensure DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT are set.'
  );
  process.exit(1);
}

const dbConfig = {
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  port: DB_PORT
};

let db;

async function initializeDatabase() {
  try {
    db = new Pool({ ...dbConfig });

    await db.query(`
      -- Parent table partitioned by status
      CREATE TABLE IF NOT EXISTS ${tables.VIDEOS} (
        "guid" UUID NOT NULL,
        "category" VARCHAR(20) NOT NULL DEFAULT '${categories.MOVIE}' CHECK ("category" IN ('${categories.MOVIE}', '${categories.SHORTS}', '${categories.SERIES}', '${categories.TRAILER}')),
        "title" VARCHAR(255) NOT NULL,
        "thumbnailUrl" TEXT,
        "description" TEXT,
        "tags" JSONB DEFAULT '[]'::jsonb,
        "genres" JSONB DEFAULT '[]'::jsonb NOT NULL,
        "status" VARCHAR(20) NOT NULL DEFAULT '${videoStatus.PENDING}' CHECK ("status" IN ('${videoStatus.PUBLISHED}', '${videoStatus.PENDING}', '${videoStatus.DRAFT}')),
        "videoLocalPath" VARCHAR(1024),
        "thumbnailLocalPath" VARCHAR(1024),
        "totalWatchTime" BIGINT DEFAULT 0 NOT NULL,
        "averageWatchTime" BIGINT DEFAULT 0 NOT NULL,
        "views" BIGINT DEFAULT 0 NOT NULL,
        "createdAt" timestamptz DEFAULT now() NOT NULL,
        "modifiedAt" timestamptz DEFAULT now() NOT NULL,
        PRIMARY KEY ("guid", "status", "category")
      ) PARTITION BY LIST ("status");

      -- Status partitions
      CREATE TABLE IF NOT EXISTS ${tables.PUBLISHED_VIDEOS}
        PARTITION OF ${tables.VIDEOS} FOR VALUES IN ('published') PARTITION BY LIST ("category");

      CREATE TABLE IF NOT EXISTS ${tables.PENDING_VIDEOS}
        PARTITION OF ${tables.VIDEOS} FOR VALUES IN ('pending');

      CREATE TABLE IF NOT EXISTS ${tables.DRAFT_VIDEOS}
        PARTITION OF ${tables.VIDEOS} FOR VALUES IN ('draft');

      -- Sub-partition published videos by category
      CREATE TABLE IF NOT EXISTS ${tables.PUBLISHED_MOVIES} PARTITION OF ${tables.PUBLISHED_VIDEOS} FOR VALUES IN ('${categories.MOVIE}');
      CREATE TABLE IF NOT EXISTS ${tables.PUBLISHED_SHORTS} PARTITION OF ${tables.PUBLISHED_VIDEOS} FOR VALUES IN ('${categories.SHORTS}');
      CREATE TABLE IF NOT EXISTS ${tables.PUBLISHED_SERIES} PARTITION OF ${tables.PUBLISHED_VIDEOS} FOR VALUES IN ('${categories.SERIES}');
      CREATE TABLE IF NOT EXISTS ${tables.PUBLISHED_TRAILERS} PARTITION OF ${tables.PUBLISHED_VIDEOS} FOR VALUES IN ('${categories.TRAILER}');

      -- Indexes for genres
      CREATE INDEX IF NOT EXISTS ${tables.MOVIE_GENRES_INDEX}
        ON ${tables.PUBLISHED_MOVIES} USING GIN ("genres" jsonb_path_ops);

      CREATE INDEX IF NOT EXISTS ${tables.SHORTS_GENRES_INDEX}
        ON ${tables.PUBLISHED_SHORTS} USING GIN ("genres" jsonb_path_ops);

      CREATE EXTENSION IF NOT EXISTS citext;

      CREATE TABLE IF NOT EXISTS ${usersTableName} (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(50) UNIQUE NOT NULL,
        email CITEXT UNIQUE NOT NULL,
        password_hash TEXT,
        full_name VARCHAR(100),
        google_id TEXT UNIQUE
      );  

    `);

    console.log('✅ Database and partitions are ready.');
  } catch (err) {
    console.error('❌ Error initializing database:', err);
    process.exit(1);
  }
}

await initializeDatabase();

function getDb() {
  return db;
}

export { getDb };
