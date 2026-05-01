# E-Commerce Project

A full-stack e-commerce application with a React (Vite) frontend, a Java Spring Boot backend, and a PostgreSQL database.

## Quick Start (Deploy Everything)

The simplest way to deploy the entire project (Database, Backend, and Frontend) is using Docker Compose.

1. Ensure you have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
2. Ensure the `.env` file is in the root folder.
3. Run this command in the project root:

```bash
docker-compose up -d --build
```

**That's it!**
- Frontend: `http://localhost`
- Backend API: `http://localhost:8080`
- Database: `localhost:5432`

## Stop Deployment

To stop and remove everything, run:

```bash
docker-compose down
```
Trong docker-compose.yml nếu chạy trên VM thì thay 
```
VITE_API_URL: http://<ip_vm>:8080
```