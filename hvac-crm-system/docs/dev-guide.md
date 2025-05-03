# HVAC CRM System Developer Guide

This guide provides information for developers working on the HVAC CRM system, including setup instructions, architecture overview, and development guidelines.

## Table of Contents

1. [Development Environment Setup](#development-environment-setup)
2. [Project Structure](#project-structure)
3. [Backend Development](#backend-development)
4. [Frontend Development](#frontend-development)
5. [Database Schema](#database-schema)
6. [API Documentation](#api-documentation)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Monitoring](#monitoring)
10. [Contributing Guidelines](#contributing-guidelines)

## Development Environment Setup

### Prerequisites

- Docker and Docker Compose
- Git
- Node.js 16+ (for frontend development)
- Python 3.9+ (for backend development)
- Code editor (VS Code recommended)

### Setting Up the Backend

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/hvac-crm-system.git
   cd hvac-crm-system
   ```

2. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```
   Update the environment variables as needed.

3. Start the development environment:
   ```bash
   docker-compose up -d
   ```

4. Initialize the database and create test data:
   ```bash
   ./init.sh
   ```

5. Access the API documentation at http://localhost:8000/docs

### Setting Up the Frontend

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/hvac-ui.git
   cd hvac-ui
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```
   Update the environment variables as needed.

4. Start the development server:
   ```bash
   yarn dev
   ```

5. Access the frontend at http://localhost:3000

## Project Structure

### Backend Structure

```
hvac-crm-system/
├── docker-compose.yml    # Docker Compose configuration
├── init.sh               # Initialization script
├── .env.example          # Example environment variables
├── services/             # Service directories
│   ├── api/              # API service
│   │   ├── app/          # FastAPI application
│   │   │   ├── core/     # Core functionality
│   │   │   ├── crud/     # CRUD operations
│   │   │   ├── models/   # SQLAlchemy models
│   │   │   ├── routers/  # API routes
│   │   │   ├── schemas/  # Pydantic schemas
│   │   │   ├── utils/    # Utility functions
│   │   │   └── main.py   # FastAPI application
│   │   ├── Dockerfile    # Docker configuration
│   │   └── requirements.txt # Python dependencies
│   ├── worker/           # Worker service
│   │   ├── app/          # Celery application
│   │   │   ├── tasks/    # Task definitions
│   │   │   ├── utils/    # Utility functions
│   │   │   └── worker.py # Celery configuration
│   │   ├── Dockerfile    # Docker configuration
│   │   └── requirements.txt # Python dependencies
│   ├── nginx/            # Nginx configuration
│   ├── prometheus/       # Prometheus configuration
│   └── grafana/          # Grafana configuration
└── docs/                 # Documentation
```

### Frontend Structure

```
hvac-ui/
├── components/           # React components
│   ├── common/           # Common components
│   ├── dashboard/        # Dashboard components
│   ├── clients/          # Client management components
│   └── ...               # Other component directories
├── context/              # React context providers
├── hooks/                # Custom React hooks
├── pages/                # Next.js pages
│   ├── api/              # API routes
│   ├── _app.tsx          # Next.js app component
│   ├── index.tsx         # Home page
│   └── ...               # Other pages
├── public/               # Static files
│   ├── icons/            # PWA icons
│   ├── manifest.json     # PWA manifest
│   └── service-worker.js # Service worker
├── styles/               # CSS styles
├── utils/                # Utility functions
├── api/                  # API service functions
├── next.config.js        # Next.js configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Project dependencies
```

## Backend Development

### API Service

The API service is built with FastAPI and provides the REST API for the system.

#### Adding a New Endpoint

1. Create a new router file or add to an existing one in `services/api/app/routers/`.
2. Define the endpoint with appropriate HTTP method, path, and dependencies.
3. Implement the endpoint logic, using CRUD operations from `services/api/app/crud/`.
4. Add the router to the main application in `services/api/app/main.py`.

Example:

```python
# services/api/app/routers/example.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.example import ExampleCreate, ExampleResponse
from app.crud.example import create_example, get_examples

router = APIRouter()

@router.post("/", response_model=ExampleResponse)
def create_example_endpoint(
    example: ExampleCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return create_example(db=db, example=example, user_id=current_user.id)

@router.get("/", response_model=List[ExampleResponse])
def get_examples_endpoint(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return get_examples(db=db, skip=skip, limit=limit)
```

Then add the router to `main.py`:

```python
from app.routers import example

app.include_router(example.router, prefix="/examples", tags=["Examples"])
```

### Worker Service

The worker service is built with Celery and processes background tasks.

#### Adding a New Task

1. Create a new task file or add to an existing one in `services/worker/app/tasks/`.
2. Define the task with appropriate name, retry policy, and implementation.
3. Register the task with the Celery application.

Example:

```python
# services/worker/app/tasks/example.py
from app.worker import celery_app
from app.utils.database import get_db_session
from app.utils.logging import get_logger

logger = get_logger(__name__)

@celery_app.task(
    name="process_example",
    bind=True,
    max_retries=3,
    retry_backoff=True,
)
def process_example(self, example_id: int):
    """
    Process an example.
    """
    logger.info(f"Processing example {example_id}")
    
    try:
        with get_db_session() as db:
            # Implement task logic here
            pass
        
        logger.info(f"Example {example_id} processed successfully")
        return {"status": "success"}
    
    except Exception as exc:
        logger.error(f"Error processing example {example_id}: {exc}")
        self.retry(exc=exc)
```

## Frontend Development

### Component Development

The frontend uses React components with Chakra UI for styling.

#### Creating a New Component

1. Create a new component file in the appropriate directory under `components/`.
2. Implement the component using React and Chakra UI.
3. Export the component for use in pages or other components.

Example:

```tsx
// components/example/ExampleCard.tsx
import { Box, Heading, Text, Badge, Flex } from '@chakra-ui/react';
import { FC } from 'react';

interface ExampleCardProps {
  title: string;
  description: string;
  status: 'active' | 'inactive';
}

export const ExampleCard: FC<ExampleCardProps> = ({ title, description, status }) => {
  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      p={4}
      shadow="sm"
    >
      <Flex justify="space-between" align="center">
        <Heading size="md">{title}</Heading>
        <Badge colorScheme={status === 'active' ? 'green' : 'gray'}>
          {status}
        </Badge>
      </Flex>
      <Text mt={2}>{description}</Text>
    </Box>
  );
};
```

### Page Development

Next.js pages are used to create the application routes.

#### Creating a New Page

1. Create a new page file in the `pages/` directory.
2. Implement the page using React components.
3. Export the page as the default export.

Example:

```tsx
// pages/examples/index.tsx
import { useState, useEffect } from 'react';
import { Box, Heading, SimpleGrid, Button } from '@chakra-ui/react';
import { Layout } from '../../components/common/Layout';
import { ExampleCard } from '../../components/example/ExampleCard';
import { useAuth } from '../../hooks/useAuth';
import { getExamples } from '../../api/examples';

export default function ExamplesPage() {
  const { user } = useAuth();
  const [examples, setExamples] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchExamples() {
      try {
        const data = await getExamples();
        setExamples(data);
      } catch (error) {
        console.error('Error fetching examples:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchExamples();
  }, []);

  return (
    <Layout>
      <Box p={4}>
        <Heading mb={4}>Examples</Heading>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {examples.map((example) => (
              <ExampleCard
                key={example.id}
                title={example.title}
                description={example.description}
                status={example.status}
              />
            ))}
          </SimpleGrid>
        )}
      </Box>
    </Layout>
  );
}
```

### API Integration

The frontend communicates with the backend API using Axios.

#### Creating a New API Service

1. Create a new service file in the `api/` directory.
2. Implement the service functions using Axios.
3. Export the functions for use in components and pages.

Example:

```tsx
// api/examples.ts
import { axiosInstance } from './axios';

export interface Example {
  id: number;
  title: string;
  description: string;
  status: 'active' | 'inactive';
}

export async function getExamples(): Promise<Example[]> {
  const response = await axiosInstance.get('/examples');
  return response.data;
}

export async function getExample(id: number): Promise<Example> {
  const response = await axiosInstance.get(`/examples/${id}`);
  return response.data;
}

export async function createExample(example: Omit<Example, 'id'>): Promise<Example> {
  const response = await axiosInstance.post('/examples', example);
  return response.data;
}

export async function updateExample(id: number, example: Partial<Example>): Promise<Example> {
  const response = await axiosInstance.put(`/examples/${id}`, example);
  return response.data;
}

export async function deleteExample(id: number): Promise<void> {
  await axiosInstance.delete(`/examples/${id}`);
}
```

## Database Schema

The database schema is defined using SQLAlchemy models.

### Adding a New Model

1. Create a new model file in `services/api/app/models/`.
2. Define the model using SQLAlchemy.
3. Import the model in `services/api/app/models/__init__.py`.

Example:

```python
# services/api/app/models/example.py
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from app.models.base import Base

class Example(Base):
    __tablename__ = "examples"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    status = Column(String, default="active")
    user_id = Column(Integer, ForeignKey("users.id"))

    user = relationship("User", back_populates="examples")
```

Then update `services/api/app/models/__init__.py`:

```python
from app.models.base import Base
from app.models.user import User
from app.models.client import Client
from app.models.example import Example
```

### Database Migrations

Database migrations are managed using Alembic.

#### Creating a Migration

1. Generate a new migration:
   ```bash
   docker-compose exec api alembic revision --autogenerate -m "Add example table"
   ```

2. Review the generated migration file in `services/api/alembic/versions/`.

3. Apply the migration:
   ```bash
   docker-compose exec api alembic upgrade head
   ```

## API Documentation

The API documentation is automatically generated using Swagger UI and ReDoc.

### Accessing Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Improving Documentation

To improve the API documentation:

1. Add detailed docstrings to your API endpoints.
2. Use appropriate response models and status codes.
3. Add examples to your Pydantic schemas.

Example:

```python
@router.get("/{example_id}", response_model=ExampleResponse)
def get_example_endpoint(
    example_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get an example by ID.

    Parameters:
    - **example_id**: The ID of the example to retrieve

    Returns:
    - **Example**: The example object

    Raises:
    - **404**: If the example is not found
    """
    example = get_example(db=db, example_id=example_id)
    if example is None:
        raise HTTPException(status_code=404, detail="Example not found")
    return example
```

## Testing

### Backend Testing

Backend tests are written using pytest.

#### Running Tests

```bash
docker-compose exec api pytest
```

#### Writing Tests

1. Create a new test file in `services/api/tests/`.
2. Write tests using pytest.
3. Use fixtures for database and authentication.

Example:

```python
# services/api/tests/test_examples.py
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import get_db
from app.tests.utils.database import TestingSessionLocal
from app.tests.utils.auth import get_test_token

client = TestClient(app)

def test_create_example():
    token = get_test_token()
    response = client.post(
        "/examples/",
        headers={"Authorization": f"Bearer {token}"},
        json={"title": "Test Example", "description": "This is a test", "status": "active"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Test Example"
    assert data["description"] == "This is a test"
    assert data["status"] == "active"
    assert "id" in data
```

### Frontend Testing

Frontend tests are written using Jest and React Testing Library.

#### Running Tests

```bash
cd hvac-ui
yarn test
```

#### Writing Tests

1. Create a new test file next to the component or page you want to test.
2. Write tests using Jest and React Testing Library.
3. Use mocks for API calls and context providers.

Example:

```tsx
// components/example/ExampleCard.test.tsx
import { render, screen } from '@testing-library/react';
import { ExampleCard } from './ExampleCard';

describe('ExampleCard', () => {
  it('renders the title and description', () => {
    render(
      <ExampleCard
        title="Test Title"
        description="Test Description"
        status="active"
      />
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('renders the correct status badge', () => {
    render(
      <ExampleCard
        title="Test Title"
        description="Test Description"
        status="active"
      />
    );

    expect(screen.getByText('active')).toBeInTheDocument();
  });
});
```

## Deployment

### Production Deployment

For production deployment, the system can be deployed to a cloud provider or on-premises infrastructure.

#### Docker Compose Deployment

1. Update the `.env` file with production settings.
2. Build and start the containers:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

#### Kubernetes Deployment

1. Create Kubernetes manifests for each service.
2. Deploy to a Kubernetes cluster:
   ```bash
   kubectl apply -f kubernetes/
   ```

### CI/CD Pipeline

The system includes GitHub Actions workflows for continuous integration and deployment.

#### Workflow Steps

1. Build and test the application.
2. Build Docker images.
3. Push images to a container registry.
4. Deploy to the target environment.

## Monitoring

The system includes comprehensive monitoring using Prometheus, Grafana, and Jaeger.

### Accessing Monitoring Tools

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000
- Jaeger: http://localhost:16686

### Adding Custom Metrics

To add custom metrics to the API service:

1. Define the metric in `services/api/app/core/metrics.py`.
2. Use the metric in your code.

Example:

```python
# services/api/app/core/metrics.py
from prometheus_client import Counter, Histogram
import time

REQUEST_COUNT = Counter(
    'api_requests_total',
    'Total number of API requests',
    ['method', 'endpoint', 'status']
)

REQUEST_LATENCY = Histogram(
    'api_request_latency_seconds',
    'API request latency in seconds',
    ['method', 'endpoint']
)

# Middleware to track metrics
async def metrics_middleware(request, call_next):
    start_time = time.time()
    response = await call_next(request)
    latency = time.time() - start_time
    
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    REQUEST_LATENCY.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(latency)
    
    return response
```

Then add the middleware to the FastAPI application:

```python
from app.core.metrics import metrics_middleware

app.middleware("http")(metrics_middleware)
```

## Contributing Guidelines

### Code Style

- Backend: Follow PEP 8 guidelines for Python code.
- Frontend: Follow ESLint and Prettier configurations.

### Git Workflow

1. Create a new branch for each feature or bug fix.
2. Make changes and commit with descriptive messages.
3. Push the branch and create a pull request.
4. Request a code review.
5. Merge the pull request after approval.

### Pull Request Template

```markdown
## Description

[Description of the changes]

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## How to Test

[Instructions for testing the changes]

## Checklist

- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] I have updated the documentation accordingly
- [ ] I have added appropriate comments to my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
```

### Code Review Guidelines

- Review code for correctness, performance, and security.
- Ensure code follows the project's style guidelines.
- Check that tests are included and passing.
- Verify that documentation is updated.

### Documentation

- Update the API documentation when adding or modifying endpoints.
- Update the user guide when adding or modifying features.
- Update the developer guide when changing the development process.