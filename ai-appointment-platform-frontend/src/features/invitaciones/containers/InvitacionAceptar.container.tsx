import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { ErrorAlert } from '../../../shared/components/ErrorAlert';
import { aceptarInvitacion } from '../api/invitaciones.api';

interface AcceptFormData {
  nombre: string;
  password: string;
}

export const InvitacionAceptarContainer = (): React.JSX.Element => {
  const { token } = useParams<{ token: string }>();
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');

  const acceptMutation = useMutation({
    mutationFn: (data: AcceptFormData) => {
      if (!token) {
        return Promise.reject(new Error('Token no proporcionado'));
      }
      return aceptarInvitacion(token, data);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    acceptMutation.mutate({ nombre, password });
  };

  const invalidState = (
    <div className="min-h-screen flex items-center justify-center bg-surface-alt">
      <div className="text-center max-w-sm mx-auto px-4">
        <AlertCircle className="w-12 h-12 text-danger mx-auto mb-3" />
        <h1 className="text-xl font-bold text-txt mb-2">Invalid invitation link</h1>
        <p className="text-sm text-txt-secondary mb-4">
          This invitation link is missing or malformed. Ask your administrator to resend it.
        </p>
        <Link to="/login" className="btn-primary inline-flex">
          Go to login
        </Link>
      </div>
    </div>
  );

  if (!token) {
    return invalidState;
  }

  const successState = acceptMutation.isSuccess && acceptMutation.data?.ok;

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-alt p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary text-on-primary text-xl mb-4 shadow-lg">
            {'\uD83D\uDCAC'}
          </div>
          <h1 className="text-txt text-2xl font-bold tracking-tight">Join your team</h1>
          <p className="text-txt-muted text-sm mt-1">Accept your invitation to get started</p>
        </div>

        <div className="bg-surface rounded-2xl shadow-sm border border-border p-6 space-y-5">
          {successState ? (
            <div className="text-center py-4">
              <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
              <h2 className="text-lg font-bold text-txt mb-1">Account created</h2>
              <p className="text-sm text-txt-secondary mb-4">
                Welcome! You can now log in with your new credentials.
              </p>
              <Link to="/login" className="btn-primary inline-flex">
                Go to login
              </Link>
            </div>
          ) : (
            <>
              {acceptMutation.isError && acceptMutation.error && (
                <ErrorAlert message={acceptMutation.error.message} />
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="invite-nombre"
                    className="block text-sm font-medium text-txt mb-1"
                  >
                    Full name
                  </label>
                  <input
                    id="invite-nombre"
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="input-modern"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label
                    htmlFor="invite-password"
                    className="block text-sm font-medium text-txt mb-1"
                  >
                    Password
                  </label>
                  <input
                    id="invite-password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-modern"
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={acceptMutation.isPending}
                  className="w-full btn-primary py-3 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {acceptMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Accept invitation'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
