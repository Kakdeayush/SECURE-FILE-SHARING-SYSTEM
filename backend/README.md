# Secure File Sharing — Spring Boot Backend

A production-grade backend for the Secure File Sharing System. Fully integrates
with the React frontend via REST APIs using JWT auth, AES encryption, and PostgreSQL.

---

## Tech Stack

| Layer         | Technology                          |
|---------------|-------------------------------------|
| Framework     | Spring Boot 3.2.4                   |
| Language      | Java 17                             |
| Security      | Spring Security + JWT (jjwt 0.12.5) |
| ORM           | Spring Data JPA / Hibernate         |
| Database      | PostgreSQL                          |
| Encryption    | AES-128/CBC (file-level)            |
| Auth          | BCrypt password hashing             |
| Build         | Maven                               |
| Utilities     | Lombok                              |

---

## Project Structure

```
src/main/java/com/secureshare/
├── SecureFileSharingApplication.java   ← Entry point
├── config/
│   ├── AppConfig.java                  ← UserDetailsService, upload path bean
│   └── SecurityConfig.java            ← JWT filter chain, CORS
├── controller/
│   ├── AuthController.java            ← POST /api/auth/register, /login
│   ├── FileController.java            ← GET/POST/DELETE /api/files, /upload
│   ├── PublicDownloadController.java  ← GET /api/public/info/{token}, /download/{token}
│   ├── DashboardController.java       ← GET /api/dashboard/stats, /activity
│   ├── AnalyticsController.java       ← GET /api/analytics
│   └── ProfileController.java        ← GET/PUT /api/profile
├── dto/
│   ├── ApiResponse.java               ← Generic { success, message, data } wrapper
│   ├── AuthDTOs.java                  ← Register/Login request + response DTOs
│   ├── FileDTOs.java                  ← File upload/list/public DTOs
│   └── AnalyticsDTOs.java            ← Dashboard stats, chart data, access logs
├── entity/
│   ├── User.java                      ← users table
│   ├── FileEntity.java               ← files table
│   └── AccessLog.java                ← access_logs table
├── exception/
│   ├── GlobalExceptionHandler.java   ← @RestControllerAdvice
│   ├── ResourceNotFoundException.java
│   ├── UnauthorizedException.java
│   ├── FileLinkException.java        ← expired / limit exceeded
│   ├── InvalidPasswordException.java
│   └── DuplicateEmailException.java
├── filter/
│   └── JwtAuthFilter.java            ← OncePerRequestFilter for JWT
├── repository/
│   ├── UserRepository.java
│   ├── FileRepository.java
│   └── AccessLogRepository.java
├── service/
│   ├── AuthService.java              ← register, login, profile CRUD
│   ├── FileService.java              ← upload (AES encrypt), list, delete, download
│   └── AnalyticsService.java         ← stats, chart data, access logs
└── util/
    ├── JwtUtil.java                  ← generate/validate JWT tokens
    ├── AesEncryptionUtil.java        ← AES-128/CBC file encrypt/decrypt
    └── FormatUtil.java               ← file size, date, relative time formatting
```

---

## Prerequisites

- Java 17+
- Maven 3.8+
- PostgreSQL 14+

---

## Setup & Run

### 1. Create the PostgreSQL Database

```sql
CREATE DATABASE secureshare;
```

### 2. Configure application.properties

Edit `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/secureshare
spring.datasource.username=YOUR_PG_USERNAME
spring.datasource.password=YOUR_PG_PASSWORD

# Change these secrets in production!
app.jwt.secret=9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1
app.aes.secret-key=MySecretKey12345

# Update to your frontend URL
app.cors.allowed-origins=http://localhost:5173
```

### 3. Build and Run

```bash
cd secure-file-sharing
mvn clean package -DskipTests
mvn spring-boot:run
```

Hibernate will auto-create all tables (`spring.jpa.hibernate.ddl-auto=update`).

The server starts at: **http://localhost:8080**

---

## API Reference

All protected endpoints require: `Authorization: Bearer <token>`

All responses follow: `{ "success": true, "message": "...", "data": {...} }`

### Auth

| Method | Endpoint            | Auth | Body                              |
|--------|---------------------|------|-----------------------------------|
| POST   | /api/auth/register  | ✗    | `{ name, email, password }`       |
| POST   | /api/auth/login     | ✗    | `{ email, password }`             |

**Login Response:**
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "token": "eyJhbGci...",
    "type": "Bearer",
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER"
  }
}
```

---

### Profile

| Method | Endpoint      | Auth | Body                    |
|--------|---------------|------|-------------------------|
| GET    | /api/profile  | ✓    | —                       |
| PUT    | /api/profile  | ✓    | `{ name, organization }` |

---

### Files

| Method | Endpoint         | Auth | Notes                                 |
|--------|------------------|------|---------------------------------------|
| POST   | /api/upload      | ✓    | Multipart: `file`, `expiryDays`, `downloadLimit?`, `password?` |
| GET    | /api/files       | ✓    | Returns all files for current user    |
| DELETE | /api/files/{id}  | ✓    | Deletes file + physical encrypted file |

**Upload Response:**
```json
{
  "success": true,
  "message": "File uploaded and encrypted successfully.",
  "data": {
    "id": 1,
    "token": "a3f2e1d0c9b8a7f6",
    "fileName": "report.pdf",
    "size": "2.4 MB"
  }
}
```

**Files List Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "report.pdf",
      "size": "2.4 MB",
      "uploadDate": "2026-04-12",
      "downloads": 5,
      "expiry": "2026-04-19",
      "status": "Active",
      "token": "a3f2e1d0c9b8a7f6",
      "passwordProtected": false,
      "maxDownloads": 10
    }
  ]
}
```

---

### Public Download (No Auth Required)

| Method | Endpoint                          | Notes                                        |
|--------|-----------------------------------|----------------------------------------------|
| GET    | /api/public/info/{token}          | Returns file metadata (name, size, expiry)   |
| GET    | /api/public/download/{token}      | Streams decrypted file (pass `?password=xxx` if protected) |
| POST   | /api/public/verify-password/{token} | Verifies password without incrementing count |

**Public Info Response:**
```json
{
  "success": true,
  "data": {
    "name": "report.pdf",
    "size": "2.4 MB",
    "owner": "John Doe",
    "expiresIn": "7 days",
    "passwordProtected": false,
    "remainingDownloads": 5
  }
}
```

---

### Dashboard

| Method | Endpoint                  | Returns                                    |
|--------|---------------------------|--------------------------------------------|
| GET    | /api/dashboard/stats      | `{ totalFiles, totalDownloads, activeLinks }` |
| GET    | /api/dashboard/activity   | Recent download/access log entries         |

---

### Analytics

| Method | Endpoint        | Returns                                                       |
|--------|-----------------|---------------------------------------------------------------|
| GET    | /api/analytics  | `{ totalDownloads, uniqueVisitors, blockedAttempts, chartData[], recentLogs[] }` |

---

## Error Responses

| HTTP Code | Scenario                         |
|-----------|----------------------------------|
| 400       | Validation failure               |
| 401       | Wrong password / bad credentials |
| 403       | Accessing another user's file    |
| 404       | File/user not found              |
| 409       | Email already registered         |
| 410 Gone  | Link expired or download limit reached |
| 413       | File exceeds 50MB                |
| 500       | Unexpected server error          |

**Error Response Format:**
```json
{
  "success": false,
  "message": "This link has expired."
}
```

---

## Frontend Integration

The `frontend-integration/` folder contains drop-in replacements for all mocked pages:

```
frontend-integration/
├── api.js                   ← Drop into src/services/api.js
└── pages/
    ├── Login.jsx            ← Real login API call
    ├── Register.jsx         ← Real register API call
    ├── Dashboard.jsx        ← Real stats + activity API calls
    ├── Files.jsx            ← Real list + delete API calls
    ├── Upload.jsx           ← Real upload with progress tracking
    ├── Analytics.jsx        ← Real analytics data
    └── PublicDownload.jsx   ← Real token validation + AES-decrypted download
```

### Steps to wire up frontend:

1. Copy `frontend-integration/api.js` → `src/services/api.js`
2. Copy each updated page file into `src/pages/`
3. Start the backend (`mvn spring-boot:run`)
4. Start the frontend (`npm run dev`)
5. Register a user at `/register` and log in

---

## Security Notes

- Files are **AES-128/CBC encrypted** before saving to disk. The IV is prepended to each `.enc` file.
- Passwords are **BCrypt hashed** — never stored in plaintext.
- JWT tokens expire after **24 hours** (configurable via `app.jwt.expiration-ms`).
- All routes except `/api/auth/**` and `/api/public/**` require a valid JWT.
- File ownership is validated on every delete request.
- Download limits and expiry times are enforced server-side.

---

## Production Checklist

- [ ] Change `app.jwt.secret` to a cryptographically random 256-bit key
- [ ] Change `app.aes.secret-key` to a secure 16-byte key
- [ ] Set `spring.jpa.hibernate.ddl-auto=validate` (after initial setup)
- [ ] Configure an absolute path for `app.upload.dir`
- [ ] Set up HTTPS / TLS termination
- [ ] Restrict `app.cors.allowed-origins` to your production domain
- [ ] Set up database connection pooling (HikariCP is included by default)
