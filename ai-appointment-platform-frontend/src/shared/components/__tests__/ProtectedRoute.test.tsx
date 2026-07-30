import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '../../../test-utils';
import ProtectedRoute from '../ProtectedRoute';

describe('ProtectedRoute', () => {
  it('renders children when isAuthenticated is true', () => {
    renderWithProviders(
      <Routes>
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
      </Routes>,
      { auth: { isAuthenticated: true } },
    );
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('shows loading spinner when loading is true', () => {
    renderWithProviders(
      <Routes>
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
      </Routes>,
      { auth: { loading: true } },
    );
    expect(screen.getByText('Verificando sesión...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects to login when isAuthenticated is false', () => {
    renderWithProviders(
      <Routes>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>,
      { auth: { isAuthenticated: false }, route: '/dashboard' },
    );
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when requiredRole ADMIN and user is admin', () => {
    renderWithProviders(
      <Routes>
        <Route
          path="*"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <div>Admin Content</div>
            </ProtectedRoute>
          }
        />
      </Routes>,
      { auth: { isAuthenticated: true, isAdmin: true } },
    );
    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('redirects to home when requiredRole ADMIN but user is not admin', () => {
    renderWithProviders(
      <Routes>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <div>Admin Content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>,
      { auth: { isAuthenticated: true, isAdmin: false }, route: '/dashboard' },
    );
    expect(screen.getByText('Home Page')).toBeInTheDocument();
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });
});
