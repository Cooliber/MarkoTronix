# HVAC CRM API Service

This service provides the REST API for the HVAC CRM system using FastAPI.

## Features

- **Authentication**: JWT-based authentication with refresh tokens
- **Client Management**: CRUD operations for client data
- **Email Handling**: Process and manage emails
- **Transcription Management**: Store and retrieve transcriptions
- **Offer Management**: Create, update, and track offers
- **Service Scheduling**: Manage service appointments
- **Inventory Management**: Track components and suppliers
- **Dashboard Metrics**: Provide key performance indicators
- **Monitoring**: Prometheus metrics and OpenTelemetry tracing

## API Endpoints

### Authentication

- `POST /auth/login`: Authenticate user and get JWT token
- `POST /auth/refresh`: Refresh JWT token
- `POST /auth/register`: Register a new user (admin only)
- `GET /auth/me`: Get current user information

### Clients

- `GET /clients`: List all clients
- `POST /clients`: Create a new client
- `GET /clients/{client_id}`: Get client details
- `PUT /clients/{client_id}`: Update client information
- `DELETE /clients/{client_id}`: Delete a client
- `GET /clients/{client_id}/installations`: List client installations
- `POST /clients/{client_id}/installations`: Add a new installation
- `GET /clients/{client_id}/communications`: List client communications

### Emails

- `GET /emails`: List all emails
- `POST /emails`: Create a new email record
- `GET /emails/{email_id}`: Get email details
- `PUT /emails/{email_id}`: Update email information
- `DELETE /emails/{email_id}`: Delete an email
- `POST /emails/{email_id}/process`: Process an email (trigger worker task)
- `GET /emails/{email_id}/suggestions`: Get response suggestions

### Transcriptions

- `GET /transcriptions`: List all transcriptions
- `POST /transcriptions`: Create a new transcription
- `GET /transcriptions/{transcription_id}`: Get transcription details
- `PUT /transcriptions/{transcription_id}`: Update transcription
- `DELETE /transcriptions/{transcription_id}`: Delete a transcription
- `POST /transcriptions/upload`: Upload audio file for transcription

### Offers

- `GET /offers`: List all offers
- `POST /offers`: Create a new offer
- `GET /offers/{offer_id}`: Get offer details
- `PUT /offers/{offer_id}`: Update offer
- `DELETE /offers/{offer_id}`: Delete an offer
- `POST /offers/{offer_id}/send`: Send offer to client
- `GET /offers/{offer_id}/tracking`: Get offer tracking information
- `POST /offers/generate`: Generate offer packages (AI-powered)

### Services

- `GET /services`: List all service appointments
- `POST /services`: Create a new service appointment
- `GET /services/{service_id}`: Get service details
- `PUT /services/{service_id}`: Update service appointment
- `DELETE /services/{service_id}`: Delete a service appointment
- `POST /services/{service_id}/report`: Generate service report
- `GET /services/calendar`: Get calendar view of services
- `GET /services/kanban`: Get kanban view of services
- `GET /services/map`: Get map view of services

### Inventory

- `GET /inventory/components`: List all components
- `POST /inventory/components`: Add a new component
- `GET /inventory/components/{component_id}`: Get component details
- `PUT /inventory/components/{component_id}`: Update component
- `DELETE /inventory/components/{component_id}`: Delete a component
- `GET /inventory/suppliers`: List all suppliers
- `POST /inventory/suppliers`: Add a new supplier
- `GET /inventory/suppliers/{supplier_id}`: Get supplier details
- `PUT /inventory/suppliers/{supplier_id}`: Update supplier
- `DELETE /inventory/suppliers/{supplier_id}`: Delete a supplier
- `GET /inventory/orders`: List all orders
- `POST /inventory/orders`: Create a new order

### Dashboard

- `GET /dashboard/metrics`: Get dashboard metrics
- `GET /dashboard/upcoming`: Get upcoming appointments
- `GET /dashboard/recent`: Get recent activities
- `GET /dashboard/performance`: Get performance metrics

## Architecture

The API service is built with:

- **FastAPI**: Modern, fast web framework for building APIs
- **SQLAlchemy**: SQL toolkit and ORM
- **Pydantic**: Data validation and settings management
- **JWT**: JSON Web Token authentication
- **Prometheus**: Metrics collection
- **OpenTelemetry**: Distributed tracing

## Project Structure

```
app/
├── core/               # Core functionality
│   ├── config.py       # Configuration settings
│   ├── database.py     # Database connection
│   └── security.py     # Authentication and security
├── crud/               # CRUD operations
│   ├── base.py         # Base CRUD class
│   ├── clients.py      # Client CRUD operations
│   ├── emails.py       # Email CRUD operations
│   └── ...             # Other CRUD modules
├── models/             # SQLAlchemy models
│   ├── base.py         # Base model class
│   ├── clients.py      # Client model
│   ├── emails.py       # Email model
│   └── ...             # Other models
├── routers/            # API routes
│   ├── auth.py         # Authentication routes
│   ├── clients.py      # Client routes
│   ├── emails.py       # Email routes
│   └── ...             # Other route modules
├── schemas/            # Pydantic schemas
│   ├── base.py         # Base schema class
│   ├── clients.py      # Client schemas
│   ├── emails.py       # Email schemas
│   └── ...             # Other schema modules
├── utils/              # Utility functions
│   ├── email.py        # Email utilities
│   ├── storage.py      # Storage utilities
│   └── ...             # Other utility modules
└── main.py             # FastAPI application
```

## Development

### Prerequisites

- Python 3.9+
- PostgreSQL
- Redis
- Docker and Docker Compose (for local development)

### Setup

1. Clone the repository
2. Install dependencies: `pip install -r requirements.txt`
3. Set up environment variables (see `.env.example`)
4. Start the API server: `uvicorn app.main:app --reload`

### Testing

Run tests with pytest:

```bash
pytest tests/
```

## Deployment

The API service is deployed as a Docker container. See the `Dockerfile` for details.

## Documentation

API documentation is available at:

- Swagger UI: `/docs`
- ReDoc: `/redoc`

## License

This project is licensed under the MIT License - see the LICENSE file for details.