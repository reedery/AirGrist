# AirGrist - Airtable to Grist Migration Tool

A modern web application that provides a seamless migration path from Airtable to Grist, featuring an intuitive step-by-step wizard interface.

## 🏗️ Architecture Overview

### Frontend Architecture

**Tech Stack:**
- **React 18** with TypeScript for type safety
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for utility-first styling
- **shadcn/ui** for consistent, accessible UI components
- **React Router** for client-side routing
- **TanStack Query** for server state management
- **Lucide React** for iconography

**Project Structure:**
```
src/
├── components/
│   └── ui/                 # shadcn/ui components (buttons, cards, inputs, etc.)
├── hooks/
│   ├── use-toast.ts       # Toast notification management
│   └── use-mobile.tsx     # Mobile detection utility
├── lib/
│   └── utils.ts           # Utility functions (cn, etc.)
├── pages/
│   ├── Index.tsx          # Main migration wizard
│   └── NotFound.tsx       # 404 page
├── App.tsx                # Main app component with routing
├── main.tsx               # App entry point
└── index.css              # Global styles
```

### Backend Architecture (To Be Implemented)

**Recommended Stack:**
- **Python Flask/FastAPI** for API server
- **Celery** for background task processing
- **Redis** for task queue and caching
- **PostgreSQL** for migration logs and state management

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm (or use [nvm](https://github.com/nvm-sh/nvm))
- Python 3.8+ (for backend implementation)

### Frontend Setup

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd AirGrist

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:8080`

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run build:dev    # Development build
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 🔧 Implementation Guide

### Current Frontend Features

1. **Step 1: Token Collection** - Collects both Airtable and Grist credentials in a single form
2. **Step 2: Base Selection** - Lists and allows selection of Airtable bases
3. **Step 3: Table Selection** - Multi-select interface for choosing tables to migrate
4. **Step 4: Migration Complete** - Success page with links to open Grist

### Backend Implementation Requirements

To make the application fully functional, implement these backend endpoints:

#### 1. Authentication & Validation Service

```python
# api/auth.py
from flask import Flask, request, jsonify
import requests
import os

app = Flask(__name__)

@app.route('/api/validate-tokens', methods=['POST'])
def validate_tokens():
    """Validate both Airtable and Grist API tokens"""
    data = request.json
    airtable_token = data.get('airtable_token')
    grist_token = data.get('grist_token')
    grist_url = data.get('grist_url')
    
    # Validate Airtable token
    airtable_valid = validate_airtable_token(airtable_token)
    
    # Validate Grist token and URL
    grist_valid = validate_grist_credentials(grist_token, grist_url)
    
    if airtable_valid and grist_valid:
        return jsonify({
            'valid': True,
            'message': 'Both tokens validated successfully'
        })
    else:
        return jsonify({
            'valid': False,
            'message': 'Token validation failed'
        }), 400

def validate_airtable_token(token):
    """Validate Airtable API token by making a test request"""
    headers = {'Authorization': f'Bearer {token}'}
    try:
        response = requests.get(
            'https://api.airtable.com/v0/meta/bases',
            headers=headers,
            timeout=10
        )
        return response.status_code == 200
    except:
        return False

def validate_grist_credentials(token, url):
    """Validate Grist API token and document URL"""
    # Extract document ID from URL
    doc_id = extract_grist_doc_id(url)
    if not doc_id:
        return False
    
    headers = {'Authorization': f'Bearer {token}'}
    try:
        response = requests.get(
            f'https://docs.getgrist.com/api/docs/{doc_id}',
            headers=headers,
            timeout=10
        )
        return response.status_code == 200
    except:
        return False

def extract_grist_doc_id(url):
    """Extract document ID from Grist URL"""
    # Implementation depends on Grist URL format
    # Example: https://docs.getgrist.com/doc/ABC123 -> ABC123
    import re
    match = re.search(r'/doc/([^/]+)', url)
    return match.group(1) if match else None
```

#### 2. Airtable Data Fetching Service

```python
# api/airtable.py
import requests
from typing import List, Dict

class AirtableService:
    def __init__(self, token: str):
        self.token = token
        self.headers = {'Authorization': f'Bearer {token}'}
        self.base_url = 'https://api.airtable.com/v0'
    
    def get_bases(self) -> List[Dict]:
        """Fetch all accessible Airtable bases"""
        response = requests.get(
            f'{self.base_url}/meta/bases',
            headers=self.headers
        )
        response.raise_for_status()
        return response.json().get('bases', [])
    
    def get_tables(self, base_id: str) -> List[Dict]:
        """Fetch all tables in a specific base"""
        response = requests.get(
            f'{self.base_url}/meta/bases/{base_id}/tables',
            headers=self.headers
        )
        response.raise_for_status()
        return response.json().get('tables', [])
    
    def get_table_data(self, base_id: str, table_id: str) -> Dict:
        """Fetch all records from a specific table"""
        all_records = []
        offset = None
        
        while True:
            params = {'pageSize': 100}
            if offset:
                params['offset'] = offset
            
            response = requests.get(
                f'{self.base_url}/{base_id}/{table_id}',
                headers=self.headers,
                params=params
            )
            response.raise_for_status()
            data = response.json()
            
            all_records.extend(data.get('records', []))
            offset = data.get('offset')
            
            if not offset:
                break
        
        return {
            'records': all_records,
            'total_count': len(all_records)
        }

@app.route('/api/airtable/bases', methods=['POST'])
def get_airtable_bases():
    """Endpoint to fetch Airtable bases"""
    token = request.json.get('token')
    service = AirtableService(token)
    try:
        bases = service.get_bases()
        return jsonify({'bases': bases})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/airtable/tables/<base_id>', methods=['POST'])
def get_airtable_tables(base_id):
    """Endpoint to fetch tables in a base"""
    token = request.json.get('token')
    service = AirtableService(token)
    try:
        tables = service.get_tables(base_id)
        return jsonify({'tables': tables})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

#### 3. Grist Integration Service

```python
# api/grist.py
import requests
from typing import List, Dict, Any

class GristService:
    def __init__(self, token: str, doc_url: str):
        self.token = token
        self.doc_url = doc_url
        self.headers = {'Authorization': f'Bearer {token}'}
        self.doc_id = self.extract_doc_id(doc_url)
        self.base_url = f'https://docs.getgrist.com/api/docs/{self.doc_id}'
    
    def extract_doc_id(self, url: str) -> str:
        """Extract document ID from Grist URL"""
        import re
        match = re.search(r'/doc/([^/]+)', url)
        if not match:
            raise ValueError(f"Invalid Grist URL: {url}")
        return match.group(1)
    
    def create_table(self, table_name: str, columns: List[Dict]) -> str:
        """Create a new table in Grist document"""
        payload = {
            'tables': [{
                'id': table_name,
                'columns': columns
            }]
        }
        
        response = requests.POST(
            f'{self.base_url}/tables',
            headers=self.headers,
            json=payload
        )
        response.raise_for_status()
        return response.json()['tables'][0]['id']
    
    def insert_records(self, table_id: str, records: List[Dict]) -> Dict:
        """Insert records into a Grist table"""
        # Batch insert in chunks of 100
        chunk_size = 100
        total_inserted = 0
        
        for i in range(0, len(records), chunk_size):
            chunk = records[i:i + chunk_size]
            payload = {'records': chunk}
            
            response = requests.POST(
                f'{self.base_url}/tables/{table_id}/records',
                headers=self.headers,
                json=payload
            )
            response.raise_for_status()
            total_inserted += len(chunk)
        
        return {'inserted_count': total_inserted}
    
    def convert_airtable_to_grist_schema(self, airtable_fields: List[Dict]) -> List[Dict]:
        """Convert Airtable field definitions to Grist column definitions"""
        grist_columns = []
        
        for field in airtable_fields:
            column = {
                'id': field['name'],
                'type': self.map_field_type(field['type'])
            }
            grist_columns.append(column)
        
        return grist_columns
    
    def map_field_type(self, airtable_type: str) -> str:
        """Map Airtable field types to Grist column types"""
        type_mapping = {
            'singleLineText': 'Text',
            'multilineText': 'Text',
            'richText': 'Text',
            'email': 'Text',
            'url': 'Text',
            'phoneNumber': 'Text',
            'number': 'Numeric',
            'currency': 'Numeric',
            'percent': 'Numeric',
            'date': 'Date',
            'dateTime': 'DateTime',
            'checkbox': 'Bool',
            'singleSelect': 'Choice',
            'multipleSelects': 'Text',  # Grist doesn't have multi-choice
            'formula': 'Text',  # Will need special handling
            'attachment': 'Text',  # Store as URLs
        }
        return type_mapping.get(airtable_type, 'Text')
```

#### 4. Migration Orchestration Service

```python
# api/migration.py
from celery import Celery
from airtable import AirtableService
from grist import GristService
import logging

# Configure Celery
celery = Celery('migration_worker')
celery.conf.broker_url = 'redis://localhost:6379/0'
celery.conf.result_backend = 'redis://localhost:6379/0'

@celery.task(bind=True)
def migrate_tables(self, airtable_token, grist_token, grist_url, base_id, table_ids):
    """Background task to migrate selected tables from Airtable to Grist"""
    
    try:
        # Initialize services
        airtable = AirtableService(airtable_token)
        grist = GristService(grist_token, grist_url)
        
        total_tables = len(table_ids)
        migrated_tables = []
        
        for i, table_id in enumerate(table_ids):
            # Update progress
            self.update_state(
                state='PROGRESS',
                meta={
                    'current': i + 1,
                    'total': total_tables,
                    'status': f'Migrating table {table_id}...'
                }
            )
            
            # Get table schema and data from Airtable
            table_info = airtable.get_table_info(base_id, table_id)
            table_data = airtable.get_table_data(base_id, table_id)
            
            # Convert schema to Grist format
            grist_columns = grist.convert_airtable_to_grist_schema(
                table_info['fields']
            )
            
            # Create table in Grist
            grist_table_id = grist.create_table(
                table_info['name'], 
                grist_columns
            )
            
            # Transform and insert data
            grist_records = transform_records(
                table_data['records'], 
                table_info['fields']
            )
            
            result = grist.insert_records(grist_table_id, grist_records)
            
            migrated_tables.append({
                'airtable_table_id': table_id,
                'grist_table_id': grist_table_id,
                'name': table_info['name'],
                'record_count': result['inserted_count']
            })
        
        return {
            'status': 'SUCCESS',
            'migrated_tables': migrated_tables,
            'total_records': sum(t['record_count'] for t in migrated_tables)
        }
        
    except Exception as e:
        logging.error(f"Migration failed: {str(e)}")
        return {
            'status': 'FAILURE',
            'error': str(e)
        }

def transform_records(airtable_records, field_definitions):
    """Transform Airtable records to Grist format"""
    grist_records = []
    
    for record in airtable_records:
        grist_record = {}
        fields = record.get('fields', {})
        
        for field_name, value in fields.items():
            # Apply field-specific transformations
            grist_record[field_name] = transform_field_value(
                value, 
                get_field_type(field_name, field_definitions)
            )
        
        grist_records.append(grist_record)
    
    return grist_records

@app.route('/api/migrate', methods=['POST'])
def start_migration():
    """Start the migration process"""
    data = request.json
    
    task = migrate_tables.delay(
        data['airtable_token'],
        data['grist_token'],
        data['grist_url'],
        data['base_id'],
        data['table_ids']
    )
    
    return jsonify({'task_id': task.id})

@app.route('/api/migration-status/<task_id>')
def get_migration_status(task_id):
    """Get migration progress"""
    task = migrate_tables.AsyncResult(task_id)
    
    if task.state == 'PENDING':
        response = {
            'state': task.state,
            'current': 0,
            'total': 1,
            'status': 'Waiting to start...'
        }
    elif task.state == 'PROGRESS':
        response = {
            'state': task.state,
            'current': task.info.get('current', 0),
            'total': task.info.get('total', 1),
            'status': task.info.get('status', '')
        }
    else:
        response = {
            'state': task.state,
            'result': task.info
        }
    
    return jsonify(response)
```

### Frontend Integration Hooks

Update the existing React components to connect with the backend:

#### Update Token Validation

```typescript
// src/hooks/useTokenValidation.ts
import { useMutation } from '@tanstack/react-query';

export const useTokenValidation = () => {
  return useMutation({
    mutationFn: async (tokens: {
      airtableToken: string;
      gristToken: string;
      gristUrl: string;
    }) => {
      const response = await fetch('/api/validate-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          airtable_token: tokens.airtableToken,
          grist_token: tokens.gristToken,
          grist_url: tokens.gristUrl,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Token validation failed');
      }
      
      return response.json();
    },
  });
};
```

#### Add Data Fetching Hooks

```typescript
// src/hooks/useAirtableData.ts
import { useQuery } from '@tanstack/react-query';

export const useAirtableBases = (token: string) => {
  return useQuery({
    queryKey: ['airtable-bases', token],
    queryFn: async () => {
      const response = await fetch('/api/airtable/bases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      return response.json();
    },
    enabled: !!token,
  });
};

export const useAirtableTables = (token: string, baseId: string) => {
  return useQuery({
    queryKey: ['airtable-tables', token, baseId],
    queryFn: async () => {
      const response = await fetch(`/api/airtable/tables/${baseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      return response.json();
    },
    enabled: !!token && !!baseId,
  });
};
```

#### Migration Progress Hook

```typescript
// src/hooks/useMigration.ts
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export const useMigration = () => {
  const [taskId, setTaskId] = useState<string | null>(null);

  const startMigration = useMutation({
    mutationFn: async (migrationData: {
      airtableToken: string;
      gristToken: string;
      gristUrl: string;
      baseId: string;
      tableIds: string[];
    }) => {
      const response = await fetch('/api/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(migrationData),
      });
      const data = await response.json();
      setTaskId(data.task_id);
      return data;
    },
  });

  const migrationStatus = useQuery({
    queryKey: ['migration-status', taskId],
    queryFn: async () => {
      const response = await fetch(`/api/migration-status/${taskId}`);
      return response.json();
    },
    enabled: !!taskId,
    refetchInterval: 2000, // Poll every 2 seconds
  });

  return {
    startMigration,
    migrationStatus,
    taskId,
  };
};
```

## 🔌 Environment Setup

Create a `.env` file in the root directory:

```env
# Frontend
VITE_API_URL=http://localhost:5000

# Backend
AIRTABLE_API_URL=https://api.airtable.com/v0
GRIST_API_URL=https://docs.getgrist.com/api
REDIS_URL=redis://localhost:6379/0
DATABASE_URL=postgresql://user:password@localhost/airgrist

# Security
JWT_SECRET=your-jwt-secret-key
RATE_LIMIT_PER_MINUTE=60
```

## 🚀 Deployment

### Frontend Deployment
```bash
npm run build
# Deploy the `dist` folder to your preferred hosting service
```

### Backend Deployment
```bash
# Install Python dependencies
pip install -r requirements.txt

# Start Redis server
redis-server

# Start Celery worker
celery -A api.migration worker --loglevel=info

# Start Flask API server
python api/app.py
```

## 📚 API Documentation

The backend exposes these key endpoints:

- `POST /api/validate-tokens` - Validate Airtable and Grist credentials
- `POST /api/airtable/bases` - Fetch Airtable bases
- `POST /api/airtable/tables/{baseId}` - Fetch tables in a base
- `POST /api/migrate` - Start migration process
- `GET /api/migration-status/{taskId}` - Check migration progress

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
