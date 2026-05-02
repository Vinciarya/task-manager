'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckSquare } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Role } from '@/types';
import apiClient from '@/services/apiClient';
import { signIn } from 'next-auth/react';
import { getErrorMessage, getValidationErrors } from '@/lib/error-message';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>(Role.MEMBER);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState('');

  // Password strength logic (simple)
  let passwordStrength = 0;
  if (password.length >= 8) passwordStrength++;
  if (/[A-Z]/.test(password)) passwordStrength++;
  if (/[0-9]/.test(password)) passwordStrength++;
  if (/[^A-Za-z0-9]/.test(password)) passwordStrength++;
  
  const strengthColor = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-emerald-600'][passwordStrength] || 'bg-gray-200';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    setGeneralError('');
    setIsLoading(true);

    try {
      // 1. Register
      await apiClient.post('/api/auth/register', { name, email, password, role });
      
      // 2. Login automatically
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Fallback if auto-login fails
        router.push('/login');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (error: unknown) {
      const errors = getValidationErrors(error);
      if (errors) {
        setValidationErrors(errors);
      } else {
        setGeneralError(getErrorMessage(error, 'An error occurred during registration.'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-background">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-indigo-600 dark:text-indigo-400">
          <CheckSquare className="h-12 w-12" />
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-foreground">
          Create your account
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md bg-card px-6 py-8 shadow sm:rounded-lg sm:px-10 border border-border">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {generalError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded-md border border-red-200 dark:border-red-800 text-center">
              {generalError}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium leading-6 text-foreground">
              Full Name
            </label>
            <div className="mt-2">
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full rounded-md border border-border bg-card py-1.5 px-3 text-foreground shadow-sm ring-1 ring-inset ring-transparent placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 sm:text-sm sm:leading-6"
                disabled={isLoading}
              />
              {validationErrors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.name[0]}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium leading-6 text-foreground">
              Email address
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md border border-border bg-card py-1.5 px-3 text-foreground shadow-sm ring-1 ring-inset ring-transparent placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 sm:text-sm sm:leading-6"
                disabled={isLoading}
              />
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.email[0]}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium leading-6 text-foreground">
              Password
            </label>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border border-border bg-card py-1.5 px-3 text-foreground shadow-sm ring-1 ring-inset ring-transparent placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 sm:text-sm sm:leading-6"
                disabled={isLoading}
              />
              {password.length > 0 && (
                <div className="mt-2 flex gap-1 h-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div 
                      key={i} 
                      className={`flex-1 rounded-full ${i <= passwordStrength ? strengthColor : 'bg-muted'}`}
                    />
                  ))}
                </div>
              )}
              {validationErrors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.password[0]}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium leading-6 text-foreground mb-2">
              Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex cursor-pointer items-center justify-center rounded-md border px-3 py-2 text-sm font-semibold uppercase sm:flex-1 ${role === Role.MEMBER ? 'bg-indigo-600 text-white border-transparent hover:bg-indigo-700' : 'bg-card text-foreground border-border hover:bg-accent'}`}>
                <input
                  type="radio"
                  name="role"
                  value={Role.MEMBER}
                  className="sr-only"
                  checked={role === Role.MEMBER}
                  onChange={(e) => setRole(e.target.value as Role)}
                  disabled={isLoading}
                />
                Member
              </label>
              <label className={`flex cursor-pointer items-center justify-center rounded-md border px-3 py-2 text-sm font-semibold uppercase sm:flex-1 ${role === Role.ADMIN ? 'bg-indigo-600 text-white border-transparent hover:bg-indigo-700' : 'bg-card text-foreground border-border hover:bg-accent'}`}>
                <input
                  type="radio"
                  name="role"
                  value={Role.ADMIN}
                  className="sr-only"
                  checked={role === Role.ADMIN}
                  onChange={(e) => setRole(e.target.value as Role)}
                  disabled={isLoading}
                />
                Admin
              </label>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              {isLoading ? <LoadingSpinner size="sm" color="white" className="mr-2" /> : null}
              Sign up
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
            Sign in instead
          </Link>
        </div>
      </div>
    </div>
  );
}
