# Finance Data Processing and Access Control Backend

A Node.js-based financial management API that allows users to track income and expenses, generate reports, and manage user accounts with role-based access control.

## Features

- User authentication and authorization with JWT
- Role-based access control (Admin, Analyst, Viewer)
- CRUD operations for financial records
- Dashboard analytics (summary, categories, trends, recent activity)
- User management for admins
- Soft delete for records
- Secure cookie-based authentication

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcrypt for password hashing, CORS, secure cookies
- **Other**: cookie-parser, dotenv

## Setup Process

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or cloud instance)
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Vidhi-0603/FinancialDashboard
   cd financialdashboard
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:

   ```
   JWT_SECRET=your_super_secret_jwt_key_here
   NODE_ENV=development
   ```

4. Ensure MongoDB is running locally on port 27017 (default), or update the connection string in `src/config/mongodb.config.js` if using a different setup.

5. Start the server:
   ```bash
   npm start
   # or for development with auto-reload
   npx nodemon index.js
   ```

The server will run on `http://localhost:5000`.

## Environment Variables

- `JWT_SECRET`: Secret key for JWT token signing (required)
- `NODE_ENV`: Environment mode (development/production) - affects cookie security

## API Endpoints

### Authentication Routes (`/auth`)

#### POST `/auth/register`

Register a new user.

**Parameters (Body):**

- `name` (string, required): User's full name
- `email` (string, required): Valid email address
- `password` (string, required): Password (min 6 characters)
- `role` (string, optional): User role (defaults to "VIEWER")

**Response:** User object without password

#### POST `/auth/login`

Authenticate user and return JWT token.

**Parameters (Body):**

- `email` (string, required): User's email
- `password` (string, required): User's password

**Response:** User object and JWT token (set in httpOnly cookie)

### Records Routes (`/records`)

#### POST `/records`

Create a new financial record. (Admin only)

**Parameters (Body):**

- `amount` (number, required): Transaction amount (positive number)
- `category` (string, required): Transaction category
- `type` (string, required): "INCOME" or "EXPENSE"
- `description` (string, optional): Transaction description
- `date` (string, optional): Transaction date (ISO format, defaults to now)

**Response:** Created record object

#### GET `/records`

Get all non-deleted records. (Viewer+)

**Parameters:** None

**Response:** Array of record objects

#### GET `/records/:id`

Get a specific record by ID. (Viewer+)

**Parameters (URL):**

- `id` (string): MongoDB ObjectId of the record

**Response:** Record object

#### GET `/records/filter`

Filter records based on criteria. (Viewer+)

**Parameters (Query):**

- `type` (string, optional): "INCOME" or "EXPENSE"
- `category` (string, optional): Category substring (case-insensitive)
- `startDate` (string, optional): Start date (ISO format)
- `endDate` (string, optional): End date (ISO format)
- `minAmount` (number, optional): Minimum amount
- `maxAmount` (number, optional): Maximum amount

**Response:** Filtered array of records

#### PUT `/records/:id`

Update an existing record. (Admin only)

**Parameters (URL):**

- `id` (string): MongoDB ObjectId of the record

**Parameters (Body):** Same as POST, all optional for partial updates

**Response:** Updated record object

#### DELETE `/records/:id`

Soft delete a record. (Admin only)

**Parameters (URL):**

- `id` (string): MongoDB ObjectId of the record

**Response:** Success message

### Dashboard Routes (`/dashboard`)

#### GET `/dashboard/summary`

Get financial summary (total income, expense, net balance). (Viewer+)

**Parameters:** None

**Response:** Summary object with totals

#### GET `/dashboard/recent`

Get recent transactions. (Viewer+)

**Parameters (Query):**

- `limit` (number, optional): Number of records (1-100, defaults to 5)

**Response:** Array of recent records

#### GET `/dashboard/by-category`

Get totals grouped by category and type. (Analyst+)

**Parameters:** None

**Response:** Array of category totals

#### GET `/dashboard/get-trends`

Get income/expense trends over time. (Analyst+)

**Parameters (Query):**

- `period` (string, optional): "monthly" or "weekly" (defaults to "monthly")

**Response:** Array of trend data

### User Management Routes (`/user`)

#### GET `/user`

Get all users. (Admin only)

**Parameters:** None

**Response:** Array of user objects (without passwords)

#### POST `/user`

Create a new user. (Admin only)

**Parameters (Body):** Same as `/auth/register`

**Response:** Created user object

#### PUT `/user/:id`

Update user details. (Admin only)

**Parameters (URL):**

- `id` (string): MongoDB ObjectId of the user

**Parameters (Body):**

- `name` (string, optional): New name
- `email` (string, optional): New email (must be unique)
- `role` (string, optional): New role

**Response:** Updated user object

#### PATCH `/user/:id/status`

Toggle user active/inactive status. (Admin only)

**Parameters (URL):**

- `id` (string): MongoDB ObjectId of the user

**Response:** Status update confirmation

## Data Models

### User Model

- `name` (String, required): User's full name
- `email` (String, required, unique): User's email address
- `password` (String, required, not selected by default): Hashed password
- `role` (String, enum: ["ADMIN", "VIEWER", "ANALYST"], default: "VIEWER"): User role
- `status` (String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE"): Account status
- `createdAt`, `updatedAt` (Date): Timestamps

### Records Model

- `amount` (Number, required): Transaction amount
- `category` (String, required): Transaction category
- `date` (Date, default: now): Transaction date
- `description` (String, optional): Transaction description
- `type` (String, enum: ["INCOME", "EXPENSE"], default: "INCOME"): Transaction type
- `is_deleted` (Boolean, default: false): Soft delete flag
- `createdAt`, `updatedAt` (Date): Timestamps

## Roles and Permissions

### Assumptions Made

- **ADMIN**: Full access to all operations, including user management and record CRUD
- **ANALYST**: Can view all data and analytics, but cannot modify records or users
- **VIEWER**: Can view basic records and summary data, but not detailed analytics or user management

These roles are hierarchical, with ADMIN having all permissions, ANALYST having VIEWER permissions plus analytics, and VIEWER having read-only access to basic data.

### Authorization Flow

- All protected routes require authentication (JWT token in cookies)
- Inactive users cannot access any endpoints
- Role-based middleware checks permissions for each route
- Users cannot deactivate their own accounts

## Tradeoffs and Design Decisions

### Soft Deletes

- **Decision**: Implemented soft deletes for records instead of hard deletes
- **Rationale**: Preserves data integrity and allows for audit trails
- **Tradeoff**: Increases storage usage and query complexity (always filter `is_deleted: false`)

### JWT in Cookies

- **Decision**: Store JWT in httpOnly, secure cookies instead of response body
- **Rationale**: Protects against XSS attacks and simplifies client-side handling
- **Tradeoff**: Cannot easily access token on client-side for API calls to external services

### No Input Sanitization Library

- **Decision**: Manual validation instead of using libraries like Joi or express-validator
- **Rationale**: Keeps dependencies minimal and provides fine-grained control
- **Tradeoff**: More boilerplate code and potential for validation inconsistencies

### Local MongoDB

- **Decision**: Hardcoded local MongoDB connection
- **Rationale**: Simplifies setup for development
- **Tradeoff**: Requires local MongoDB installation, not suitable for production without configuration changes

### Error Handling

- **Decision**: Return error messages in response body
- **Rationale**: Provides clear feedback to API consumers
- **Tradeoff**: Potential information leakage (mitigated by using `error.message` instead of full stack traces)

## Author

- Vidhilika Gupta

## License

ISC
