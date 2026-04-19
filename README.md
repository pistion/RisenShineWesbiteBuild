# Ecommerce Express Starter

Clean, scalable starter for an ecommerce app using Node.js, Express, EJS, and PostgreSQL.

## Tech Stack
- Node.js
- Express.js
- EJS
- PostgreSQL
- `pg`
- express-session
- morgan
- dotenv

## Folder Structure
```txt
.
+-- config/
+-- controllers/
+-- middleware/
+-- models/
+-- public/
¦   +-- css/
¦   +-- images/
¦   +-- js/
+-- routes/
+-- scripts/
+-- sql/
+-- services/
+-- views/
¦   +-- partials/
+-- .env
+-- .env.example
+-- package.json
+-- server.js
```

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables in `.env`.
3. Initialize the PostgreSQL schema:
   ```bash
   npm run db:init
   ```
4. Seed sample products:
   ```bash
   npm run seed
   ```
5. Run development server:
   ```bash
   npm run dev
   ```
6. Run production mode:
   ```bash
   npm start
   ```

## Environment Variables
- `DATABASE_URL` PostgreSQL connection string
- `DATABASE_SSL` Set to `true` for managed PostgreSQL hosts that require SSL
- `PORT` Express server port
- `SESSION_SECRET` Session signing secret

## PostgreSQL Schema
- `products` stores the catalog used by `/products` and `/api/products`
- `orders` stores submitted checkout records
- `order_items` stores line items for each order

If PostgreSQL is unavailable, the storefront still starts in fallback mode using sample product data.

## SQL-Ready Admin Endpoints
These routes are prepared for deployment and should be protected with authentication before production use.

- `POST /api/admin/products` Create a product
- `PUT /api/admin/products/:id` Replace a product
- `PATCH /api/admin/products/:id` Update a product
- `DELETE /api/admin/products/:id` Delete a product
- `GET /api/admin/orders/:id` Fetch a stored order
- `PATCH /api/admin/orders/:id/status` Update an order status

## Core Routes
- `GET /` Home page
- `GET /products` Product listing page
- `GET /products/:id` Product details page
- `GET /cart` Cart page
- `POST /cart/add` Add product to cart
- `POST /cart/remove` Remove product from cart
- `GET /checkout` Checkout page
- `POST /checkout` Submit checkout and save an order when PostgreSQL is connected
- `GET /about` About page
- `GET /contact` Contact page
- `GET /api/products` Products JSON API
- `GET /api/products/:id` Single product JSON API
