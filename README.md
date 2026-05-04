# E-Commerce Project

A full-stack e-commerce application with a React (Vite) frontend, a Java Spring Boot backend, and a PostgreSQL database.

## Quick Start (Deploy Everything)

The simplest way to deploy the entire project (Database, Backend, and Frontend) is using Docker Compose.

1. Ensure you have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
2. Ensure the `.env` file is in the root folder.
3. Build the Docker images and start the containers by running this command in the project root:

```bash
# The --build flag tells Docker to build the images for you automatically before starting
docker-compose up -d --build
```

**That's it!**
- Frontend: `http://localhost`
- Backend API: `http://localhost:8080`
- Database: `localhost:5432`

## Payment Feature Deployment

To enable and deploy the PayOS payment feature for everyone, follow these steps:
Đăng ký payos, liên kết ngân hàng cá nhân ( free 100 giao dịch đầu tiên)

1. Create or update the `.env` file in the project root with PayOS values:
   - `PAYOS_ENABLED=true`
   - `PAYOS_CLIENT_ID=<your-payos-client-id>`
   - `PAYOS_API_KEY=<your-payos-api-key>`
   - `PAYOS_CHECKSUM_KEY=<your-payos-checksum-key>`
   - `PAYOS_FRONTEND_BASE_URL=http://localhost or (ip_vm)`
   - `PAYOS_WEBHOOK_PUBLIC_URL=<public-webhook-url>`

2. Ensure the backend can receive PayOS webhook calls:
   - install ngrok (https://dashboard.ngrok.com/get-started/setup/linux)
   - Run the following in the command line.
```bash
   ngrok http 8080
```
3. Start the application with Docker Compose:

```bash
docker-compose up -d --build
```
4. Kiểm tra xem container backend đã có env chưa
```bash
sudo docker exec -it <container_backend_id> env | grep PAYOS
```

## Stop Deployment

To stop and remove everything, run:

```bash
docker-compose down
```
