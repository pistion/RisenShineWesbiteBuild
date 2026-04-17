# Ecommerce Express Starter

Clean, scalable starter for an ecommerce app using Node.js, Express, EJS, and MongoDB.

## Tech Stack
- Node.js
- Express.js
- EJS
- MongoDB + Mongoose
- express-session
- morgan
- dotenv

## Folder Structure
```
.
├── config/
├── controllers/
├── middleware/
├── models/
├── public/
│   ├── css/
│   ├── images/
│   └── js/
├── routes/
├── scripts/
├── views/
│   └── partials/
├── .env
├── .env.example
├── package.json
└── server.js
```

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables in `.env`.
3. Seed sample products:
   ```bash
   npm run seed
   ```
4. Run development server:
   ```bash
   npm run dev
   ```
5. Run production mode:
   ```bash
   npm start
   ```

## Core Routes
- `GET /` Home page
- `GET /products` Product listing page
- `GET /products/:id` Product details page
- `GET /cart` Cart page
- `POST /cart/add` Add product to cart
- `POST /cart/remove` Remove product from cart
- `GET /about` About page
- `GET /contact` Contact page
- `GET /api/products` Products JSON API
- `GET /api/products/:id` Single product JSON API
