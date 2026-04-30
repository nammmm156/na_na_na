# E-Commerce Project

A full-stack e-commerce application with a React (Vite) frontend and a Java Spring Boot backend.

## How to Run with Docker

You will need [Docker](https://www.docker.com/get-started) installed. Use two separate terminal windows to build and run the containers.

### 1. Backend

Run backend with these command below (If want to add db, change the file application.properties in backend/src/main/resources)

```bash
cd backend
docker build -t ecommerce-backend .
docker run -d -p 8080:8080 --name backend ecommerce-backend
```

### 2. Frontend

You must pass the backend's API URL when building the frontend. If running locally:

```bash
cd frontend
docker build --build-arg VITE_API_URL=http://localhost:8080 -t ecommerce-frontend .
docker run -d -p 80:80 --name frontend ecommerce-frontend
```

**The application is now running at `http://localhost`!**

---

### Stopping the Application

When you are done, you can stop and remove the containers:

```bash
docker stop backend frontend
docker rm backend frontend
```
Trong docker-compose.yml nếu chạy trên VM thì thay 
```
VITE_API_URL: http://<ip_vm>:8080
```