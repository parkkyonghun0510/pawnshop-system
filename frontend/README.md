# Pawnshop Management System Frontend

This directory contains the frontend application for the Pawnshop Management System.

## Technology Stack

- React - Frontend library
- TypeScript - Type-safe JavaScript
- Vite - Build tool and development server
- Axios - HTTP client
- React Router - For routing
- Context API - For state management

## Directory Structure

```
frontend/
├── public/                   # Public assets
├── src/
│   ├── api/                  # API client configuration
│   ├── components/           # Reusable UI components
│   ├── contexts/             # React context providers
│   ├── hooks/                # Custom React hooks
│   ├── pages/                # Page components
│   ├── services/             # API service functions
│   ├── utils/                # Utility functions
│   ├── App.tsx               # Main application component
│   ├── main.tsx              # Entry point
│   └── theme.ts              # Theme configuration
├── index.html                # HTML template
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
└── vite.config.ts            # Vite configuration
```

## Setup Instructions

1. **Installation:**

   ```bash
   # Install dependencies
   npm install
   ```

2. **Environment Setup:**

   Create a `.env` file in the frontend directory with the following content:

   ```
   VITE_APP_API_URL=http://localhost:8000
   VITE_APP_API_VERSION=v1
   ```

3. **Run the Development Server:**

   ```bash
   npm run dev
   ```

4. **Build for Production:**

   ```bash
   npm run build
   ```

## Architecture Overview

### API Integration

The frontend communicates with the backend API using a structured approach:

1. **API Client (`api/client.ts`):**
   - Configured Axios instance for making HTTP requests
   - Handles authentication token management
   - Implements request/response interceptors
   - Provides rate limiting and error handling

2. **API Services (`services/api.ts`):**
   - Service functions organized by domain (auth, users, branches, etc.)
   - Each service corresponds to endpoints in the backend API
   - Abstracts the details of API calls

3. **Custom Hooks (`hooks/`):**
   - React hooks that provide a clean interface to the API services
   - Handle loading states, errors, and data caching
   - Examples: `useAuth`, `useBranches`, `useLoans`, `useInventory`, etc.

### Authentication

Authentication is implemented using JWT tokens:

1. Token is obtained via login and stored in cookies
2. Token is included in the Authorization header for API requests
3. API client handles token refresh and session expiration

### Data Flow

1. Components use custom hooks to interact with the backend
2. Hooks call API services to make requests
3. API services use the API client to execute HTTP requests
4. API client handles authentication, errors, and response formatting

## Custom Hooks

### `useApi`

A generic hook for making API requests with loading and error states.

```typescript
const [state, api] = useApi<UserData>();
const user = await api.get('/users/1');
```

### `useAuth`

Manages authentication state, login, logout, and user profile.

```typescript
const { user, login, logout, isAuthenticated } = useAuth();
```

### `useBranches`

Manages branch data and operations.

```typescript
const { branches, loading, fetchBranches, createBranch } = useBranches();
```

### `useLoans`

Manages loan data and operations.

```typescript
const { loans, fetchLoans, createLoan } = useLoans();
```

### `useInventory`

Manages inventory data and operations.

```typescript
const { inventory, addInventoryItem, updateInventoryItem } = useInventory();
```

### `useDashboard`

Fetches dashboard data.

```typescript
const { inventoryStatus, recentTransactions, upcomingDueLoans, refreshDashboard } = useDashboard();
```

## Backend API Endpoints Integration

The frontend integrates with the following backend API endpoints:

### Authentication
- **POST** `/authentication/auth/token`: Obtain an access token for authentication
- **POST** `/authentication/auth/register`: Register a new user
- **POST** `/authentication/auth/password-reset`: Request a password reset
- **POST** `/authentication/auth/change-password`: Change the current user's password
- **GET** `/authentication/auth/me`: Retrieve the current user's information
- **POST** `/authentication/auth/logout`: Log out the current user
- **GET** `/authentication/auth/verify`: Verify the current user's token

### User Management
- **GET** `/users`: Retrieve a list of users
- **POST** `/users`: Create a new user
- **GET** `/users/{id}`: Retrieve a specific user by ID
- **PUT** `/users/{id}`: Update a specific user by ID
- **DELETE** `/users/{id}`: Delete a specific user by ID

### Branch Management
- **GET** `/branches`: Retrieve a list of branches
- **POST** `/branches`: Create a new branch
- **GET** `/branches/{id}`: Retrieve a specific branch by ID
- **PUT** `/branches/{id}`: Update a specific branch by ID
- **DELETE** `/branches/{id}`: Delete a specific branch by ID

### Inventory Management
- **GET** `/inventory`: Retrieve a list of inventory items
- **POST** `/inventory`: Add a new inventory item
- **GET** `/inventory/{id}`: Retrieve a specific inventory item by ID
- **PUT** `/inventory/{id}`: Update a specific inventory item by ID
- **DELETE** `/inventory/{id}`: Delete a specific inventory item by ID

### Loan Management
- **GET** `/loans`: Retrieve a list of loans
- **POST** `/loans`: Create a new loan
- **GET** `/loans/{id}`: Retrieve a specific loan by ID
- **PUT** `/loans/{id}`: Update a specific loan by ID
- **DELETE** `/loans/{id}`: Delete a specific loan by ID

### Transaction Management
- **GET** `/transactions`: Retrieve a list of transactions
- **POST** `/transactions`: Create a new transaction
- **GET** `/transactions/{id}`: Retrieve a specific transaction by ID

### Reporting
- **GET** `/reports`: Retrieve a list of reports
- **POST** `/reports/generate`: Generate a new report
- **GET** `/reports/{id}/download`: Download a specific report

### Dashboard
- **GET** `/dashboard/inventory-status`: Retrieve inventory status for the dashboard
- **GET** `/dashboard/recent-transactions`: Retrieve recent transactions for the dashboard
- **GET** `/dashboard/upcoming-due-loans`: Retrieve upcoming due loans for the dashboard 