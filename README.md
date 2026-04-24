# surviveX

surviveX is a Spring Boot + React web application where people share real survival stories, the instincts that saved them, and lessons the whole community can learn from.

## Product concept

- User accounts with a profile, bio, and survival focus
- Login and signup entry flow when the app opens
- Global social feed for text-based survival stories
- Automatic AI moderation checks each story for plausibility, coherence, and vulgar language before publishing
- Likes and comments on every post
- Authors can delete their own posts and their own comments
- No follow system: all stories are visible to everyone

## Project structure

- `backend/`: Spring Boot REST API backed by MySQL
- `frontend/`: React + Vite user interface for the global feed
- `docker-compose.yml`: full local environment for MySQL + backend + frontend

## Run Everything With Docker

This is the easiest way to share the full project with friends.

1. Install Docker Desktop:
   [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)

2. In the project root, create a `.env` file from the example:

```bash
cp .env.example .env
```

3. Edit `.env` and add your real optional service keys if you want uploads, AI narration, or automatic AI moderation:

- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `ELEVENLABS_API_KEY`
- `GEMINI_API_KEY`

4. Start the full stack:

```bash
docker compose up --build
```

5. Open the app:

- frontend: `http://localhost:5173`
- backend: `http://localhost:8080`

6. Stop everything:

```bash
docker compose down
```

7. If you want a completely fresh database:

```bash
docker compose down -v
```

Docker services included:

- `mysql`: MySQL 8.4 with persistent storage
- `backend`: Spring Boot API on port `8080`
- `frontend`: Vite app on port `5173`

Notes:

- The backend image includes the `SurviveX_WEBGL` folder, so the `DO or DIE` Unity route still works in Docker.
- If Cloudinary or ElevenLabs keys are left blank, the rest of the app still runs, but those features will not work.
- If `GEMINI_API_KEY` is left blank, new story publishing will fail because automatic moderation is required before a post can go live.

## Run the backend

```bash
cd backend
mvn spring-boot:run
```

The API runs at `http://localhost:8080` with:

- `GET /api/users`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/uploads/image`
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
cp .env.example .env
npm install
npm run dev
```

The web app runs at `http://localhost:5173`.

Frontend environment variables:

- `VITE_API_BASE_URL`
- `VITE_UNITY_WEBGL_URL`

For local development, you can keep:

```bash
VITE_API_BASE_URL=http://localhost:8080/api
VITE_UNITY_WEBGL_URL=http://localhost:8080/unity
```

For AWS Amplify with your current backend:

```bash
VITE_API_BASE_URL=http://survivex-backend-env.eba-8bm9gmar.ap-south-1.elasticbeanstalk.com/api
VITE_UNITY_WEBGL_URL=http://survivex-backend-env.eba-8bm9gmar.ap-south-1.elasticbeanstalk.com/unity
```

## MySQL configuration

The backend reads database configuration from environment variables first:

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`

Local defaults are:

- host: `localhost`
- database: `survivex`
- username: `survivex`
- password: `survivex`

Spring Boot will try to create the database automatically with:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/survivex?createDatabaseIfNotExist=true...
```

For your AWS RDS instance, the values would be:

```bash
export SPRING_DATASOURCE_URL="jdbc:mysql://survivexdb.cfu260g0oqzp.ap-south-1.rds.amazonaws.com:3306/survivexdb?useSSL=true&requireSSL=true&serverTimezone=Asia/Kolkata"
export SPRING_DATASOURCE_USERNAME="admin"
export SPRING_DATASOURCE_PASSWORD="your_rds_password"
```

## Current implementation notes

- Data is now persisted in MySQL
- The app seeds a few sample members and posts only when the database is empty
- The frontend opens with a login/signup screen and stores the current session in browser local storage
- Demo logins: `maya.river / maya123`, `arjun.storm / arjun123`, `elena.spark / elena123`
- Authentication is still a simple MVP flow and is a good foundation for adding Spring Security and JWT later

## Cloudinary configuration

Set these environment variables before starting the backend:

```bash
export CLOUDINARY_CLOUD_NAME=dsahysy1w
export CLOUDINARY_API_KEY=your_api_key
export CLOUDINARY_API_SECRET=your_api_secret
```

The app supports:

- profile photo upload
- cover image upload
- post image upload

Images are uploaded through the backend and only the returned Cloudinary URLs are stored in MySQL.

## Gemini moderation configuration

Set these environment variables before starting the backend if you want story publishing to work:

```bash
export GEMINI_API_KEY=your_api_key
export GEMINI_MODEL=gemini-2.5-flash
```

When a user submits a story, the backend sends the title, story text, and survival lesson to Gemini. The model returns a structured moderation decision and the app:

- publishes the story immediately if it is coherent, non-vulgar, and plausibly possible
- rejects the story with a reason if it is obviously impossible, vulgar, or too incoherent
