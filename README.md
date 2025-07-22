# 🐰 Bunny Stream Server

A Node.js backend server for managing Bunny.net video libraries, collections, and videos.  
Built with [Express](https://expressjs.com/) and [got](https://github.com/sindresorhus/got), this API provides endpoints to interact with Bunny.net's Video API for libraries, collections, and video management.

---

## 🚀 Features

- **Library Management**: Create, list, fetch, and delete video libraries.
- **Collection Management**: CRUD operations for collections within a library.
- **Video Listing**: Fetch videos with filtering and pagination.
- **Replication Regions**: Retrieve available Bunny.net replication regions.
- **Environment-based configuration** using `.env`.

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

All endpoints return JSON responses. Parameters are clearly separated into **Query Parameters** and **Body Parameters** for clarity.

---

### 📚 Library Endpoints

#### 1. List Replication Regions

**GET** `/library/replication-regions`

Returns a list of available Bunny.net replication regions.

**Query Parameters:** _None_

**Body Parameters:** _None_

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

---

#### 3. Get Library by ID

**GET** `/library/:id`

Returns details of a specific library by its ID.

**Query Parameters:** _None_

**Body Parameters:** _None_

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

**Example:**

```http
POST /library?name=MyLibrary&regions=["DE","UK"]
```

---

#### 5. Delete a Library

**DELETE** `/library/:id`

Deletes a library by its ID.

**Query Parameters:** _None_

**Body Parameters:** _None_

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

**Example:**

```http
POST /collections?libraryId=123
Content-Type: application/json

{
  "name": "My Collection"
}
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

---

#### 5. Delete a Collection

**DELETE** `/collections/:id`

Deletes a collection by its ID.

**Query Parameters:** _None_

**Body Parameters:**

| Name      | Type   | Required | Description         |
|-----------|--------|----------|---------------------|
| libraryId | string | Yes      | ID of the library   |

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

**Example:**

```http
GET /videos?libraryId=123&page=1&itemsPerPage=10
```

---

## 📝 Environment Variables

- `PORT`: Server port (default: 3000)
- `API_KEY`: Bunny.net API key (for library endpoints)
- `LIBRARY_API_KEY`: Bunny.net Library API key (for collections/videos endpoints)

---

## 🛡️ License

MIT License © 2025 [Ullasa Poojith Sindhur](https://github.com/ullasasindhur)

---

## 🤝 Contributing

Pull requests and issues are welcome!  
See [CONTRIBUTING.md](CONTRIBUTING.md) _(if available)_ for guidelines.

---

## 📖 References

- [Bunny.net Video API Docs](https://docs.bunny.net/reference/video-overview)
- [Express.js](https://expressjs.com/)
- [got HTTP client](https://github.com/sindresorhus/got)
