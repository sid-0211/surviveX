# surviveX

surviveX is a Spring Boot + React web application where people share real survival stories, the instincts that saved them, and lessons the whole community can learn from.

## Product concept

- User accounts with a profile, bio, and survival focus
- Login and signup entry flow when the app opens
- Global social feed for text-based survival stories
- Likes and comments on every post
- Authors can delete their own posts and their own comments
- No follow system: all stories are visible to everyone

## Project structure

- `backend/`: Spring Boot REST API backed by MySQL
- `frontend/`: React + Vite user interface for the global feed

## Run the backend

```bash
cd backend
mvn spring-boot:run
```

The API runs at `http://localhost:8080` with:

- `GET /api/users`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/feed`
- `GET /api/overview`
- `POST /api/posts`
- `DELETE /api/posts/{postId}`
- `POST /api/posts/{postId}/like`
- `POST /api/posts/{postId}/comments`
- `DELETE /api/posts/{postId}/comments/{commentId}`

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

The web app runs at `http://localhost:5173`.

## MySQL configuration

The backend is configured for:

- host: `localhost`
- database: `survivex`
- username: `moqui`
- password: `moqui`

Spring Boot will try to create the database automatically with:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/survivex?createDatabaseIfNotExist=true...
```

## Current implementation notes

- Data is now persisted in MySQL
- The app seeds a few sample members and posts only when the database is empty
- The frontend opens with a login/signup screen and stores the current session in browser local storage
- Demo logins: `maya.river / maya123`, `arjun.storm / arjun123`, `elena.spark / elena123`
- Authentication is still a simple MVP flow and is a good foundation for adding Spring Security and JWT later
# surviveX
