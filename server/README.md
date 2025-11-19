# Freelance Hub Server

Backend API for Freelance Hub platform built with Node.js, Express, TypeScript, and Prisma.

## Features

- **Authentication**: JWT-based auth with access and refresh tokens
- **User Roles**: Admin, Client, Freelancer
- **Real-time Chat**: Socket.IO for instant messaging
- **API Documentation**: Swagger UI available at `/docs`
- **Database**: PostgreSQL with Prisma ORM
- **Security**: Helmet, CORS, rate limiting
- **Logging**: Pino logger
- **Queues**: BullMQ with Redis (optional)

## Setup

1. Install dependencies:
```bash
cd server
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Run Prisma migrations:
```bash
npm run prisma:generate
npm run prisma:migrate
```

4. Seed the database:
```bash
npm run seed
```

## Development

```bash
npm run dev
```

Server will start on `http://localhost:8080`

## API Endpoints

### Authentication (`/api/v1/auth`)
- `POST /register` - Register new user
- `POST /login` - Login user
- `POST /refresh` - Refresh access token
- `GET /me` - Get current user

### Users (`/api/v1/users`)
- `GET /:id` - Get user by ID
- `GET /by-slug/:slug` - Get user by slug

### Profile (`/api/v1/profile`)
- `PATCH /` - Update profile

### Orders (`/api/v1/orders`)
- `GET /` - List orders
- `POST /` - Create order
- `GET /:id` - Get order details

### Tasks (`/api/v1/tasks`)
- `GET /` - List tasks
- `POST /` - Create task
- `GET /:id` - Get task details

### Proposals (`/api/v1/proposals`)
- `GET /sent` - Get sent proposals
- `GET /received` - Get received proposals
- `POST /` - Create proposal
- `PATCH /:id/status` - Update proposal status

### Deals (`/api/v1/deals`)
- `POST /open` - Open new deal
- `GET /` - List deals
- `GET /:id` - Get deal details
- `PATCH /:id/state` - Update deal state

### Messages (`/api/v1/threads`)
- `GET /` - List threads
- `POST /` - Create thread
- `GET /:id/messages` - Get messages in thread
- `POST /:id/messages` - Send message

### Other Endpoints
- `GET /api/v1/wallet` - Get wallet balance
- `GET /api/v1/notifications` - List notifications
- `GET /api/v1/favorites` - List favorites
- `POST /api/v1/favorites/toggle` - Toggle favorite
- `GET /api/v1/disputes` - List disputes

## Documentation

Interactive API documentation available at: `http://localhost:8080/docs`

## Socket.IO Events

### Client → Server
- `join:thread` - Join a message thread
- `leave:thread` - Leave a message thread
- `message:send` - Send a message
- `message:read` - Mark message as read

### Server → Client
- `message:new` - New message received
- `message:read` - Message was read

## Database Schema

See `prisma/schema.prisma` for complete schema definition.

Key models:
- User, Profile
- Order, Task
- Proposal, Deal
- Thread, Message
- Review, Favorite
- WalletBalance
- Notification, Dispute

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run migrations
- `npm run prisma:studio` - Open Prisma Studio
- `npm run seed` - Seed database with sample data
