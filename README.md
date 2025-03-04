# Pawn Shop Management System

A comprehensive management system for pawn shops, built with FastAPI and React.

## Features

### Backend (FastAPI)
- RESTful API with comprehensive documentation
- Authentication and authorization
- Database management with SQLAlchemy
- Application management
- Customer management
- Inventory tracking
- Loan processing
- Transaction management
- Reporting and analytics
- Data export capabilities

### Frontend (React)
- Modern, responsive UI
- Application portal
- Customer management
- Inventory management
- Loan processing
- Transaction tracking
- Reporting dashboard
- Data visualization

## Tech Stack

### Backend
- Python 3.10+
- FastAPI
- SQLAlchemy
- PostgreSQL
- Pydantic
- Alembic (Database migrations)

### Frontend
- React
- TypeScript
- Material-UI
- React Query
- React Router
- Chart.js

## Getting Started

### Prerequisites
- Python 3.10 or higher
- Node.js 16 or higher
- PostgreSQL 13 or higher

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/pawnshop-system.git
cd pawnshop-system
```

2. Set up the backend:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Set up the database:
```bash
# Create a PostgreSQL database
createdb pawnshop_db

# Run migrations
alembic upgrade head
```

4. Set up the frontend:
```bash
cd frontend
npm install
```

### Configuration

1. Create a `.env` file in the backend directory:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/pawnshop_db
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

2. Create a `.env` file in the frontend directory:
```env
REACT_APP_API_URL=http://localhost:8000
```

### Running the Application

1. Start the backend server:
```bash
cd backend
uvicorn app.main:app --reload
```

2. Start the frontend development server:
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## API Documentation

The API documentation is available at `/docs` when running the backend server. It includes:
- Interactive API documentation
- Request/response examples
- Authentication details
- Endpoint descriptions
- Schema definitions

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- FastAPI team for the excellent framework
- React team for the frontend library
- Material-UI team for the component library
- All contributors who help improve this project 