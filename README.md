# 🐰 Bunny Stream Server

A robust, production-ready Node.js backend server for managing Bunny.net video libraries, collections, and videos.

Built with [Express](https://expressjs.com/) and [got](https://github.com/sindresorhus/got), this RESTful API provides endpoints to interact with Bunny.net's Video API for library, collection, and video management.

---

## 📚 Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Configuration](#️-configuration)
- [Running the Server](#-running-the-server)
- [API Endpoints](#-api-endpoints)
  - [Library Endpoints](#-library-endpoints)
  - [Collections Endpoints](#-collections-endpoints)
  - [Videos Endpoints](#-videos-endpoints)
- [Environment Variables](#-environment-variables)
- [Database Schema](#-database-schema)
- [Usage & Development](#-usage--development)
- [Testing](#-testing)
- [Security](#-security)
- [Project Structure](#-project-structure)
- [Versioning](#-versioning)
- [Contact](#-contact)
- [References](#-references)

---

## 🚀 Features

- **Library Management**: Create, list, fetch, and delete video libraries
- **Collection Management**: CRUD operations for collections within a library
- **Video Listing**: Fetch videos with filtering and pagination
- **Video Play & Thumbnail URLs**: Generate signed play URLs and signed thumbnail URLs for videos (token + expiry)
- **Captions List**: Built-in list of caption language codes
- **Replication Regions**: Retrieve available Bunny.net replication regions
- **Environment-based configuration** using `.env`
- **RESTful API**: Follows REST conventions for resource management
- **Clear error handling**: Consistent error responses with HTTP status codes

---

## 📦 Installation

```sh
git clone https://github.com/ullasasindhur/bunny-stream-server.git
cd bunny-stream-server
npm install
```

---

## ⚙️ Configuration

Create a `.env` file in the root directory:

```env
PORT=3000
API_KEY=your_bunny_api_key
LIBRARY_API_KEY=your_bunny_library_api_key
DB_HOST=your_database_hostname
DB_USER=your_database_username
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
```

---

## 🏁 Running the Server

```sh
# For development (with nodemon)
npm run dev

# For production
npm start
```

Server will run on `http://localhost:3000` by default.

---

## 🛣️ API Endpoints — Contract, Inputs & Outputs

Base URL: http://localhost:3000
Global rules:
- All request/response bodies are JSON. Use header: Content-Type: application/json and Accept: application/json.
- Date/time fields use ISO 8601 (UTC).
- Pagination defaults: page=1, perPage=10.
- IDs: library id = integer, collection id = integer/string (Bunny), video id = UUID (guid).
- Responses follow:
  - Success: { "success": true, "message": "...", "data": ... }
  - Error:   { "success": false, "error": "...", "details": {...} }

Authentication:
- Server uses API_KEY / LIBRARY_API_KEY internally.
- No client auth enforced by default. For production, require Authorization: Bearer <token> or x-api-key.

---

### 📚 Library Endpoints

#### 1. List Replication Regions

GET `/library/replication-regions`

- Auth: none (server-side API_KEY used internally)
- Query: none
- Success 200:
  ```json
  {
    "success": true,
    "message": "Replication regions fetched successfully.",
    "data": { "Frankfurt": "DE", "London": "UK", "...": "..." }
  }
  ```
- Errors: 500 (server / Bunny.net failure)
- Example:
  ```sh
  curl -H "Accept: application/json" "http://localhost:3000/library/replication-regions"
  ```

#### 2. List Libraries

GET `/library`

- Auth: none (server uses API_KEY)
- Query:
  - page (int, optional)
  - perPage (int, optional)
  - search (string, optional)
- Success 200:
  ```json
  {
    "success": true,
    "message": "Libraries fetched successfully.",
    "data": {
      "items": [{ "id": 1, "name": "MyLibrary", "pull_zone_url": "cdn.example.com", ... }],
      "meta": { "page": 1, "perPage": 10, "total": 42 }
    }
  }
  ```
- Errors: 400 (invalid pagination), 500
- Example:
  ```sh
  curl "http://localhost:3000/library?page=1&perPage=10"
  ```

#### 3. Get Library by ID

GET `/library/:id`

- Path: id (int)
- Success 200:
  ```json
  {
    "success": true,
    "message": "Library fetched successfully.",
    "data": {
      "id": 1,
      "name": "MyLibrary",
      "description": null,
      "pull_zone_id": 123,
      "pull_zone_url": "pull.mycdn.com"
      // sensitive keys (api_key / pull_zone_security_key) SHOULD be redacted
    }
  }
  ```
- Errors: 400 (invalid id), 404 (not found), 500
- Example:
  ```sh
  curl "http://localhost:3000/library/1"
  ```

#### 4. Create Library

POST `/library?name=MyLibrary&regions=["DE","UK"]` OR POST `/library` with body `{ "name": "...", "regions": ["DE","UK"] }`

- Required: name (string, <=255)
- Optional: regions (array of region codes)
- Success 201:
  ```json
  {
    "success": true,
    "message": "Library 'MyLibrary' was created successfully.",
    "data": { "id": 42, "name": "MyLibrary", "pull_zone_url": "..." }
  }
  ```
- Errors: 400 (missing name), 422 (Bunny.net validation), 500
- Example:
  ```sh
  curl -X POST "http://localhost:3000/library" -H "Content-Type: application/json" -d '{"name":"MyLibrary","regions":["DE","UK"]}'
  ```

#### 5. Delete Library

DELETE `/library/:id`

- Path: id (int)
- Success 200:
  ```json
  { "success": true, "message": "Library deleted successfully." }
  ```
- Errors: 400, 404, 500
- Example:
  ```sh
  curl -X DELETE "http://localhost:3000/library/42"
  ```

---

### 🗂️ Collections Endpoints

Common notes:
- These calls interact with Bunny.net Library API; libraryId is required to scope collections.

1) List collections
- GET /collections?libraryId=123&page=1&perPage=10
- Query: libraryId (int, required), page, perPage
- Success 200:
  {
    "success": true,
    "message": "Collections fetched successfully.",
    "data": {
      "items": [{ "id": "c1", "name": "Trailers", "libraryId": 123, "created_at": "..." }],
      "meta": { "page": 1, "perPage": 10, "total": 5 }
    }
  }
- Errors: 400 (missing libraryId), 500
- Example:
  curl "http://localhost:3000/collections?libraryId=123"

2) Get collection by id
- GET /collections/:id?libraryId=123
- Path: id (string/int), Query: libraryId
- Success 200: returns collection object
- Errors: 400, 404, 500

3) Create collection
- POST /collections?libraryId=123
- Body: { "name": "My Collection" } (name: required string <=255)
- Success 201:
  { "success": true, "message": "Collection created.", "data": { "id": "c2", "name":"My Collection" } }
- Errors: 400 (missing name), 422 (Bunny.net error), 500
- Example:
  curl -X POST "http://localhost:3000/collections?libraryId=123" -H "Content-Type: application/json" -d '{"name":"Trailers"}'

4) Update collection
- PUT /collections/:id
- Body: { "libraryId": 123, "name": "New name" }
- Success 200 -> updated collection summary
- Errors: 400, 404, 422, 500

5) Delete collection
- DELETE /collections/:id?libraryId=123
- Success 200
- Errors: 400, 404, 500

---

### 🎬 Videos Endpoints

Notes:
- Video operations use the library's API key (stored in DB as api_key) or LIBRARY_API_KEY depending on operation.
- Video id refers to Bunny.net guid (UUID).

1) List videos
- GET /videos?libraryId=123&page=1&itemsPerPage=10&search=foo
- Query: libraryId (int, required), page, itemsPerPage (optional), search (optional)
- Success 200:
  {
    "success": true,
    "message": "Videos fetched successfully.",
    "data": {
      "items": [{ "guid":"uuid", "title":"My Video", "thumbnail_url":"...", "created_at":"..." }],
      "meta": { "page":1, "perPage":10, "total": 100 }
    }
  }
- Errors: 400 (missing libraryId), 500
- Example:
  curl "http://localhost:3000/videos?libraryId=123&page=1&itemsPerPage=10"

2) Get video details
- GET /videos/:id?libraryId=123
- Path: id (guid), Query: libraryId
- Success 200: { "success": true, "message":"", "data": { "guid","title","description","thumbnail_url","created_at" } }
- Errors: 400, 404, 500

3) Create video
- POST /videos
- Body (JSON):
  {
    "libraryName": "MyLibrary",    // or libraryId
    "title": "My Video",           // required string <=255
    "collectionId": "c1",          // optional
    "thumbnailTime": 0             // optional integer seconds
  }
- Behaviour: server looks up library api_key, creates video via Bunny.net, stores mapping (guid -> title) in local DB.
- Success 201:
  {
    "success": true,
    "message": "Video created successfully.",
    "data": { "guid": "uuid", "title": "My Video", "libraryId": 123 }
  }
- Errors: 400 (missing title/library), 422 (Bunny.net validation), 500
- Example:
  curl -X POST "http://localhost:3000/videos" -H "Content-Type: application/json" -d '{"libraryName":"MyLibrary","title":"New Video"}'

4) Delete video
- DELETE /videos/:id?libraryId=123
- Path: id (guid), Query: libraryId
- Success 200:
  { "success": true, "message": "Video deleted successfully." }
- Errors: 400, 404, 500

5) Get signed play URL
- GET /videos/:id/url?expires=3600
- Query: expires (seconds, optional; default 3600)
- Behaviour: builds path to playlist (e.g., /<path>/playlist.m3u8), computes token = base64url(sha256(securityKey + path + expires)), returns signed URL.
- Success 200:
  {
    "success": true,
    "message": "Video URL fetched successfully",
    "playUrl": "https://pull.zone/.../playlist.m3u8?token=...&expires=...",
    "expires": 1650000000
  }
  ```
- Errors: 400 (invalid expires), 404, 500
- Example:
  curl "http://localhost:3000/videos/uuid/url?expires=3600"

6) Get signed thumbnail URL
- GET /videos/:id/thumbnail?expires=3600
- Same signing logic as play URL.
- Success 200:
  { "success": true, "message": "Video thumbnail URL fetched successfully", "thumbnailUrl": "https://..." }
- Errors: 400, 404, 500

7) Captions list
- GET /videos/captions-list
- Success 200:
  { "success": true, "message": "Captions list", "data": [{ "code":"en","name":"English" }, ...] }

---

## 📝 Environment Variables

- PORT: Server port (default: 3000)
- API_KEY: Bunny.net API key (for library & pull zone endpoints)
- LIBRARY_API_KEY: Bunny.net Library API key (for collections/videos endpoints)
- DB_HOST: MySQL host 
- DB_USER: MySQL user
- DB_PASSWORD: MySQL password
- DB_NAME: MySQL database name

---

## 🗃️ Database Schema

Libraries table (updated to store pull zone info)

| Column                 | Type          | Null | Key | Default                                   | Extra                              |
|------------------------|---------------|:----:|:---:|-------------------------------------------|------------------------------------|
| id                     | INT           | NO   | PRI | (none)                                    | PRIMARY KEY                        |
| name                   | VARCHAR(255)  | NO   | UNI | (none)                                    | NOT NULL, UNIQUE                   |
| description            | TEXT          | YES  |     | NULL                                      |                                    |
| api_key                | VARCHAR(64)   | NO   | UNI | (none)                                    | NOT NULL, UNIQUE                   |
| read_only_api_key      | VARCHAR(64)   | NO   | UNI | (none)                                    | NOT NULL, UNIQUE                   |
| pull_zone_id           | INT           | YES  | UNI | NULL                                      | pull zone id from Bunny.net        |
| pull_zone_url          | VARCHAR(255)  | YES  |     | NULL                                      | hostname used to build URLs        |
| pull_zone_security_key | VARCHAR(64)   | YES  | UNI | NULL                                      | used to sign play/thumbnail URLs   |
| created_at             | TIMESTAMP     | NO   |     | CURRENT_TIMESTAMP                         | DEFAULT CURRENT_TIMESTAMP          |
| updated_at             | TIMESTAMP     | NO   |     | CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |                                    |

Videos table

| Column        | Type           | Null | Key | Default                                   | Extra                                            |
|---------------|----------------|:----:|:---:|-------------------------------------------|--------------------------------------------------|
| guid          | VARCHAR(36)    | NO   | PRI | (none)                                    | PRIMARY KEY                                      |
| library_id    | INT            | NO   | MUL | (none)                                    | FOREIGN KEY -> libraries(id) ON DELETE CASCADE   |
| title         | VARCHAR(255)   | NO   | UNI | (none)                                    | NOT NULL, UNIQUE                                 |
| description   | TEXT           | YES  |     | NULL                                      |                                                  |
| thumbnail_url | TEXT           | YES  |     | NULL                                      |                                                  |
| created_at    | TIMESTAMP      | NO   |     | CURRENT_TIMESTAMP                         | DEFAULT CURRENT_TIMESTAMP                        |
| updated_at    | TIMESTAMP      | NO   |     | CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |                                                  |
|               |                |      |     |                                           | INDEX idx_library_id (library_id)                |


CREATE TABLE statements (the running code auto-creates these):

```sql
-- libraries table (created by database.js)
CREATE TABLE IF NOT EXISTS libraries (
  id INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  api_key VARCHAR(64) NOT NULL UNIQUE,
  read_only_api_key VARCHAR(64) NOT NULL UNIQUE,
  pull_zone_id INT UNIQUE,
  pull_zone_url VARCHAR(255),
  pull_zone_security_key VARCHAR(64) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- videos table (created by database.js)
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
```

---

## 🧑‍💻 Usage & Development

- **Install dependencies:** `npm install`
- **Run in development:** `npm run dev`
- **Run in production:** `npm start`
- **API contract:** See above for endpoint details and parameter conventions
- **Error handling:** All errors are returned as JSON with an `error` field and appropriate HTTP status code

---

## 🧪 Testing

_No automated tests are included by default. Add tests in a `tests/` directory and document test commands here if/when added._

---

## 🔒 Security

- Never commit secrets or API keys to version control
- All configuration/secrets must be provided via `.env`
- Validate all input parameters (see controller files for details)
- Signed play/thumbnail URLs are generated from the pull zone security key and include an expiry timestamp (default 3600 seconds). Keep the pull zone security key secret.

---

## 🗂️ Project Structure

- `controllers/` — Business logic for each resource
- `routes/` — Express route definitions
- `database.js` — DB initialization and pool creation (auto-creates DB/tables)
- `README.md` — API contract, parameter conventions, and usage examples
- `.env` — Required for local/dev/prod operation

---

## 🏷️ Versioning

This project uses [SemVer](https://semver.org/). See `package.json` for the current version.

---

## 📫 Contact

For questions, contact [Ullasa Poojith Sindhur](https://github.com/ullasasindhur) via GitHub Issues.

---

## 📖 References

- [Bunny.net Video API Docs](https://docs.bunny.net/reference/video-overview)
- [Express.js](https://expressjs.com/)
- [got HTTP client](https://github.com/sindresorhus/got)
- [mysql2/promise](https://github.com/sidorares/node-mysql2)
