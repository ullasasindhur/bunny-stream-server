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
- [Usage & Development](#-usage--development)
- [Testing](#-testing)
- [Security](#-security)
- [Project Structure](#-project-structure)
- [Versioning](#-versioning)
- [Contact](#-contact)
- [References](#-references)



## 🚀 Features

- **Library Management**: Create, list, fetch, and delete video libraries
- **Collection Management**: CRUD operations for collections within a library
- **Video Listing**: Fetch videos with filtering and pagination
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




## 🛣️ API Endpoints

All endpoints return JSON responses. Parameters are clearly separated into **Query Parameters** and **Body Parameters** for clarity. All endpoints require authentication via API keys in the `.env` file.

**Base URL:** `http://localhost:3000`

---

### 📚 Library Endpoints



#### 1. List Replication Regions

**GET** `/library/replication-regions`

Returns a list of available Bunny.net replication regions.

**Query Parameters:** _None_

**Body Parameters:** _None_

**Sample Response:**

```json
[
  { "RegionCode": "DE", "RegionName": "Germany" },
  { "RegionCode": "UK", "RegionName": "United Kingdom" }
]
```

---



#### 2. List Libraries

**GET** `/library`

Returns a paginated list of video libraries.

**Query Parameters:**

| Name     | Type   | Required | Description                |
|----------|--------|----------|----------------------------|
| page     | number | No       | Page number (default: 1)   |
| perPage  | number | No       | Items per page (default: 10)|
| search   | string | No       | Search by library name     |

**Body Parameters:** _None_

**Sample Response:**

```json
{
  "items": [
    { "id": "123", "name": "MyLibrary", "regions": ["DE", "UK"] }
  ],
  "page": 1,
  "perPage": 10,
  "total": 1
}
```

---



#### 3. Get Library by ID

**GET** `/library/:id`

Returns details of a specific library by its ID.

**Query Parameters:** _None_
**Body Parameters:** _None_

**Sample Response:**

```json
{ "id": "123", "name": "MyLibrary", "regions": ["DE", "UK"] }
```

---



#### 4. Create a New Library

**POST** `/library`

Creates a new video library.

**Query Parameters:**

| Name    | Type   | Required | Description                        |
|---------|--------|----------|------------------------------------|
| name    | string | Yes      | Name of the library                |
| regions | array  | Yes      | Array of region codes (e.g. ["DE","UK"]) |

**Body Parameters:** _None_

**Sample Request:**

```http
POST /library?name=MyLibrary&regions=["DE","UK"]
```

**Sample Response:**

```json
{ "id": "123", "name": "MyLibrary", "regions": ["DE", "UK"] }
```

---



#### 5. Delete a Library

**DELETE** `/library/:id`

Deletes a library by its ID.

**Query Parameters:** _None_
**Body Parameters:** _None_

**Sample Response:**

```json
{ "success": true }
```

---


---


---

### 🗂️ Collections Endpoints



#### 1. List Collections in Library

**GET** `/collections`

Returns a paginated list of collections in a library.

**Query Parameters:**

| Name             | Type    | Required | Description                        |
|------------------|---------|----------|------------------------------------|
| libraryId        | string  | Yes      | ID of the library                  |
| page             | number  | No       | Page number (default: 1)           |
| itemsPerPage     | number  | No       | Items per page (default: 10)       |
| search           | string  | No       | Search by collection name          |
| orderBy          | string  | No       | Order by field                     |
| includeThumbnails| boolean | No       | Include thumbnails (true/false)    |

**Body Parameters:** _None_

**Sample Response:**

```json
{
  "items": [
    { "id": "c1", "name": "Collection 1", "libraryId": "123" }
  ],
  "page": 1,
  "itemsPerPage": 10,
  "total": 1
}
```

---



#### 2. Get Collection by ID

**GET** `/collections/:id`

Returns details of a specific collection.

**Query Parameters:**

| Name             | Type    | Required | Description                        |
|------------------|---------|----------|------------------------------------|
| libraryId        | string  | Yes      | ID of the library                  |
| includeThumbnails| boolean | No       | Include thumbnails (true/false)    |

**Body Parameters:** _None_

**Sample Response:**

```json
{ "id": "c1", "name": "Collection 1", "libraryId": "123" }
```

---



#### 3. Create a Collection

**POST** `/collections`

Creates a new collection in a library.

**Query Parameters:**

| Name      | Type   | Required | Description         |
|-----------|--------|----------|---------------------|
| libraryId | string | Yes      | ID of the library   |

**Body Parameters:**

| Name | Type   | Required | Description         |
|------|--------|----------|---------------------|
| name | string | Yes      | Name of collection  |

**Sample Request:**

```http
POST /collections?libraryId=123
Content-Type: application/json

{
  "name": "My Collection"
}
```

**Sample Response:**

```json
{ "id": "c1", "name": "My Collection", "libraryId": "123" }
```

---



#### 4. Update a Collection

**PUT** `/collections/:id`

Updates a collection's details.

**Query Parameters:** _None_

**Body Parameters:**

| Name      | Type   | Required | Description         |
|-----------|--------|----------|---------------------|
| libraryId | string | Yes      | ID of the library   |
| name      | string | Yes      | New name of collection |

**Sample Request:**

```http
PUT /collections/c1
Content-Type: application/json

{
  "libraryId": "123",
  "name": "Updated Collection Name"
}
```

**Sample Response:**

```json
{ "id": "c1", "name": "Updated Collection Name", "libraryId": "123" }
```

---



#### 5. Delete a Collection

**DELETE** `/collections/:id`

Deletes a collection by its ID.

**Query Parameters:** _None_

**Body Parameters:**

| Name      | Type   | Required | Description         |
|-----------|--------|----------|---------------------|
| libraryId | string | Yes      | ID of the library   |

**Sample Request:**

```http
DELETE /collections/c1
Content-Type: application/json

{
  "libraryId": "123"
}
```

**Sample Response:**

```json
{ "success": true }
```

---


---


---

### 🎬 Videos Endpoints



#### 1. List Videos in Library

**GET** `/videos`

Returns a paginated list of videos in a library.

**Query Parameters:**

| Name         | Type    | Required | Description                        |
|--------------|---------|----------|------------------------------------|
| libraryId    | string  | Yes      | ID of the library                  |
| page         | number  | No       | Page number (default: 1)           |
| itemsPerPage | number  | No       | Items per page (default: 10)       |
| search       | string  | No       | Search by video name               |
| collection   | string  | No       | Filter by collection ID            |
| orderBy      | string  | No       | Order by field                     |

**Body Parameters:** _None_

**Sample Request:**

```http
GET /videos?libraryId=123&page=1&itemsPerPage=10
```

**Sample Response:**

```json
{
  "items": [
    { "id": "v1", "name": "Video 1", "collection": "c1" }
  ],
  "page": 1,
  "itemsPerPage": 10,
  "total": 1
}
```

---



## 📝 Environment Variables

- `PORT`: Server port (default: 3000)
- `API_KEY`: Bunny.net API key (for library endpoints)
- `LIBRARY_API_KEY`: Bunny.net Library API key (for collections/videos endpoints)
- `DB_HOST`: MySQL host 
- `DB_USER`: MySQL user
- `DB_PASSWORD`: MySQL password
- `DB_NAME`: MySQL database name

---



## 🛡️ License

MIT License © 2025 [Ullasa Poojith Sindhur](https://github.com/ullasasindhur)

---



## 🤝 Contributing

Pull requests and issues are welcome!  
See [CONTRIBUTING.md](CONTRIBUTING.md) _(if available)_ for guidelines.

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

---


## 🗂️ Project Structure

- `controllers/` — Business logic for each resource
- `routes/` — Express route definitions
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
