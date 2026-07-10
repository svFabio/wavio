# Frontend - Spa Appointment Admin Panel
<img width="1846" height="823" alt="image" src="https://github.com/user-attachments/assets/ae4048bd-7309-47ce-95c2-1fb74572ee06" />






Web-based administrative panel for managing spa appointments, validating payments, and controlling the WhatsApp bot in real-time.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Pages & Components](#pages--components)
- [Authentication](#authentication)
- [Real-Time Communication](#real-time-communication)
- [Deployment](#deployment)

## Features

- Interactive dashboard with real-time metrics
- Visual calendar for appointment visualization
- Payment validation with receipt preview
- Real-time notifications via Socket.IO
- WhatsApp QR code linking
- User management (admin only)
- Advanced statistics with interactive charts
- Role-based access control (ADMIN/STAFF)
- Responsive design with Tailwind CSS
- Automatic updates with React Query

## Tech Stack

**Core**: React 19, TypeScript, Vite, React Router DOM

**UI & Styling**: Tailwind CSS, Lucide React, Sonner

**State & Data**: TanStack React Query, Axios, Socket.IO Client

**Specialized**: react-big-calendar, Recharts, react-qr-code, date-fns

## Installation

### Prerequisites

- Node.js >= 18.x
- npm or yarn
- Backend running (see backend README)

### Setup

```bash
# Clone repository
git clone <repository-url>
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Start development server
npm run dev
```

## Configuration

Create `.env` file in frontend root:

```env
# Backend URL (without /api suffix)
VITE_API_URL=http://localhost:3000/api
```

For production:
```env
VITE_API_URL=https://your-backend.onrender.com/api
```

## Project Structure

```
frontend/
├── public/
│   └── notification.mp3       # Notification sound
├── src/
│   ├── main.tsx               # Entry point
│   ├── App.tsx                # Root component with routes
│   ├── index.css              # Global styles
│   ├── pages/                 # Main pages
│   │   ├── Login.tsx          # Login page
│   │   ├── Dashboard.tsx      # Dashboard layout
│   │   ├── Home.tsx           # Main view
│   │   ├── Calendario.tsx     # Calendar view
│   │   ├── Pagos.tsx          # Payment validation
│   │   ├── Vincular.tsx       # WhatsApp linking
│   │   ├── Statistics.tsx     # Statistics (ADMIN)
│   │   └── Users.tsx          # User management (ADMIN)
│   ├── components/            # Reusable components
│   ├── context/               # React contexts
│   │   └── AuthContext.tsx    # Authentication context
│   ├── hooks/                 # Custom hooks
│   ├── services/              # API services
│   │   └── api.ts             # Configured Axios client
│   ├── types/                 # TypeScript definitions
│   └── utils/                 # Utilities
└── package.json
```

## Pages & Components

### Login (Login.tsx)

Authentication page with:
- Email/password form
- Credential validation
- JWT token storage
- Automatic redirect to dashboard

### Dashboard (Dashboard.tsx)

Main layout including:
- Sidebar navigation
- User information header
- Outlet for rendering subroutes
- Role-based route protection

### Home (Home.tsx)

Main view with:
- Statistics cards (total, pending, confirmed)
- Recent appointments list
- Quick actions (confirm, reject)
- Auto-refresh every 30 seconds

### Calendar (Calendario.tsx)

Appointment calendar visualization:
- Monthly view with react-big-calendar
- Color-coded events by status
- Click event for details
- Month navigation

### Payments (Pagos.tsx)

Payment receipt validation:
- List of pending validation appointments
- Receipt image preview
- Approve/reject buttons
- Real-time updates

### Link (Vincular.tsx)

WhatsApp management:
- QR code for WhatsApp linking
- Real-time connection status
- Disconnect button
- Auto-update via Socket.IO

### Statistics (Statistics.tsx) - ADMIN only

Advanced statistics:
- Daily appointment charts (Recharts)
- Status distribution
- Total revenue
- Temporal trends

### Users (Users.tsx) - ADMIN only

User management:
- System user list
- Create new users (ADMIN/STAFF)
- Edit roles and data
- Delete users

## Authentication

### AuthContext

Context provider managing:
- Global authentication state
- Token storage in localStorage
- Current user information
- Login/logout functions

### ProtectedRoute

HOC component that:
- Verifies valid JWT token
- Redirects to login if unauthenticated
- Validates required roles (ADMIN/STAFF)
- Protects sensitive routes

### Authentication Flow

```
1. User enters credentials
2. POST /api/auth/login
3. Backend validates and returns JWT
4. Frontend saves token in localStorage
5. Axios interceptor adds token to headers
6. Access to protected routes
```

## Real-Time Communication

### Socket.IO Events

Frontend listens to these events:

**nueva-cita**: New appointment created
- Shows toast notification
- Plays sound
- Invalidates React Query cache

**qr-actualizado**: QR code updated
- Updates QR code on linking page

**whatsapp-conectado**: WhatsApp connected
- Updates connection status
- Hides QR code

**whatsapp-desconectado**: WhatsApp disconnected
- Shows disconnection alert
- Requests re-linking

### React Query

Cache and synchronization management:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      staleTime: 30000, // 30 seconds
    },
  },
});
```

## Deployment

### Vercel (Recommended)

1. Connect repository on Vercel
2. Configure environment variables: `VITE_API_URL`
3. Build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Deploy automatically

### Netlify

1. Connect repository on Netlify
2. Build settings:
   - Build Command: `npm run build`
   - Publish Directory: `dist`
3. Add environment variable: `VITE_API_URL`
4. Create `_redirects` file in `public/`:
   ```
   /*    /index.html   200
   ```

### Manual Build

```bash
# Build
npm run build

# Files will be in /dist
# Serve with any static server
npx serve dist
```

## Security

- JWT in headers: `Authorization: Bearer <token>`
- No sensitive data storage (only token in localStorage)
- Role-based route validation
- Always use HTTPS in production
- CORS configured for specific frontend only

## Mobile Features

- PWA ready
- Touch-optimized buttons and touch areas
- Adaptive notification positioning
- Collapsible sidebar with hamburger menu

## Best Practices

### TypeScript

```typescript
interface Cita {
  id: number;
  clienteNombre: string;
  clienteTelefono: string;
  fecha: string;
  horario: string;
  estado: 'PENDIENTE_PAGO' | 'VALIDACION_PENDIENTE' | 'CONFIRMADO';
  comprobanteUrl?: string;
}
```

### React Query Mutations

```typescript
const mutation = useMutation({
  mutationFn: (id: number) => api.patch(`/citas/${id}`, { estado: 'CONFIRMADO' }),
  onSuccess: () => {
    queryClient.invalidateQueries(['citas']);
    toast.success('Appointment confirmed');
  },
});
```

### Error Handling

```typescript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

Developed for optimizing spa appointment management
