const requiredEnvVars = [
  'ACCESS_TOKEN_SECRET',
  'API_KEY',
  'DB_HOST',
  'DB_NAME',
  'DB_PASSWORD',
  'DB_PORT',
  'DB_USER',
  'BASE_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'LIBRARY_API_KEY',
  'LIBRARY_ID',
  'PORT',
  'PULLZONE_API_KEY',
  'PULLZONE_URL',
  'REFRESH_TOKEN_SECRET'
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.error(
      `Error: Environment variable ${envVar} is not defined. Please check your .env file.`
    );
    process.exit(1);
  }
});

export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
export const API_KEY = process.env.API_KEY;
export const DB_HOST = process.env.DB_HOST;
export const DB_NAME = process.env.DB_NAME;
export const DB_PASSWORD = process.env.DB_PASSWORD;
export const DB_PORT = process.env.DB_PORT;
export const DB_USER = process.env.DB_USER;
export const BASE_URL = `${process.env.BASE_URL}:${process.env.PORT}`;
export const CLIENT_URL = `${process.env.CLIENT_URL}`;
export const GOOGLE_CALLBACK_URL = `${CLIENT_URL}/auth`;
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
export const LIBRARY_API_KEY = process.env.LIBRARY_API_KEY;
export const LIBRARY_ID = process.env.LIBRARY_ID;
export const PORT = process.env.PORT;
export const PULLZONE_API_KEY = process.env.PULLZONE_API_KEY;
export const PULLZONE_URL = process.env.PULLZONE_URL;
export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
export const AUTH_CODE_SECRET = process.env.AUTH_CODE_SECRET;
export const usersTableName = 'users';
export const videosTableName = 'videos';
export const videosReviewsTableName = 'video_reviews';
