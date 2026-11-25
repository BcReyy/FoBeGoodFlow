# FoBeGoodFlow

### Coffee Shop Ordering and Inventory System

FoBeGoodFlow is a coffee shop system I made for my ITEC 116 final project. The main purpose of this project is to manage the coffee shop menu, stocks, user accounts and orders in one system.

I used NestJS for the backend, React for the frontend and MySQL for storing the data. At first, some of the frontend pages are using sample data, but I connected them to the backend so the changes can be saved in the database.

## What the system can do

The system have three types of account:

- **Admin** - Can manage menu items, restock products, view orders and notifications, and manage cashier accounts.
- **Cashier** - Can create orders, check their orders and change an order to Completed or Cancelled.
- **Customer** - Can register, log in, check their profile and view orders linked to their account.

The main features are:

- Register and log in with JWT authentication.
- Add, edit, view and deactivate menu items.
- Check product stocks, low stock items and restock products.
- Create an order for a guest or an existing customer.
- Automatically deduct product stock when an order is created.
- Restore the deducted stock when a pending order is cancelled.
- View order records from MySQL.
- View and update your own profile.
- View notifications such as low stock alerts.
- Create cashier accounts and activate or deactivate allowed accounts as Admin.
- Stay logged in when refreshing the same browser tab, as long as the session is still valid.

An order can have **Pending**, **Completed** or **Cancelled** status. The backend does not use a Preparing status.

## Tools and technology I used

- **Backend:** NestJS, TypeScript, Node.js, TypeORM
- **Database:** MySQL, managed using MySQL Workbench
- **Frontend:** React and Vite
- **Authentication:** JWT and hashed passwords
- **API testing:** Postman
- **Version control:** Git and GitHub

## Project folders

```text
FoBeGoodFlow/
  backend/       NestJS API, entities, modules, migrations and tests
  frontend/      React pages, components and tests
  database/      Database-related files
  postman/       Postman collection files
  .gitignore
  README.md
```

The `docs/` folder is for my private project documents and is not included in GitHub. The SQL database export is also for separate submission, not for public uploading.

## How to run the project

You need Node.js and npm, MySQL Server, and a database named `fobegoodflow`. The project was worked on locally using Windows PowerShell.

### 1. Backend setup

Open PowerShell in the project folder:

```powershell
cd backend
npm install
```

Create a `backend/.env` file for your own local database settings. Example only:

```dotenv
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=YOUR_MYSQL_USER
DB_PASSWORD=YOUR_MYSQL_PASSWORD
DB_NAME=fobegoodflow
JWT_SECRET=YOUR_LONG_RANDOM_SECRET
```

Replace the example values with your own settings. **Do not upload your `.env` file or actual passwords to GitHub.**

The database tables must already be created by importing the provided SQL file or using the project's migrations. The backend is not set to automatically create the tables every startup. An Admin account must also exist before you can use the Admin screen.

Then run:

```powershell
npm run build
npm test -- --runInBand
npm run start:dev
```

Backend address: `http://127.0.0.1:3000`

### 2. Frontend setup

Open another PowerShell terminal in the project folder:

```powershell
cd frontend
npm install
npm run build
npm test
npm run dev
```

Open `http://127.0.0.1:5173` in the browser.

Both backend and frontend should be running so the data will load properly.

## API endpoints

These are the API routes that is used by the project:

| Method | Route | Used for |
| --- | --- | --- |
| POST | `/auth/register` | Customer registration |
| POST | `/auth/login` | Log in and get JWT token |
| GET | `/auth/me` | Logged-in account information |
| GET, POST | `/menu-items` | View and add products |
| GET, PATCH, DELETE | `/menu-items/:id` | Product details, update and deactivate |
| GET | `/menu-items/low-stock` | View low stock products |
| PATCH | `/menu-items/:id/restock` | Add product stock |
| GET, POST | `/orders` | List and create orders |
| GET | `/orders/:id` | View a specific order |
| PATCH | `/orders/:id/status` | Complete or cancel order |
| GET | `/notifications` | Account notifications |
| GET | `/notifications/unread-count` | Unread notification count |
| PATCH | `/notifications/:id/read` | Read one notification |
| PATCH | `/notifications/read-all` | Read all notifications |
| GET, PATCH | `/users/me/profile` | View and edit profile |
| GET | `/admin/accounts` | View accounts (Admin only) |
| POST | `/admin/accounts/staff` | Create cashier account (Admin only) |
| PATCH | `/admin/accounts/:id/status` | Activate/deactivate account (Admin only) |

Most of these routes need a JWT token. The backend also checks the user role, so being able to see a page doesn't mean the user can access all API functions.

## Testing

I tested the backend using Postman, and also tested the frontend in the browser while connected to MySQL.

Some of the test that I did:

- Login with JWT and checking that a request without token returns `401 Unauthorized`.
- Adding, editing, viewing and deactivating a product.
- Restocking a product and checking its updated quantity.
- Creating an order and checking that stock was deducted.
- Trying to order more than the available stock, which was rejected.
- Completing and cancelling orders.
- Checking if cancelled orders restore the product stock.
- Creating a cashier account and using it to log in.
- Viewing saved orders from both Cashier and Admin pages.
- Refreshing the browser without returning to login while the session is valid.

The project also has backend and frontend tests that can be run using the commands above. The Postman collection and MySQL export are provided separately for submission.

## Limitations

This project is mainly for local demonstration and school requirements. I didn't include online deployment or real payment processing. Password reset and change-password pages are not included in the current version.

Some features can still be improved, especially for a real coffee shop usage. For now, the focus is on having a working backend, database, API security and a frontend that can use the actual data.

## Note about GitHub

I used Git commits while developing the backend and frontend. The source files are the ones intended for GitHub. My private `docs/` folder, local `.env`, database export, local Postman workspace files and dependencies like `node_modules/` should not be committed.
