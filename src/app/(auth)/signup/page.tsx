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
    <div className="flex min-h-screen flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-indigo-600">
          <CheckSquare className="h-12 w-12" />
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Create your account
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md bg-white px-6 py-8 shadow sm:rounded-lg sm:px-10">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {generalError && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200 text-center">
              {generalError}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
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
                className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                disabled={isLoading}
              />
              {validationErrors.name && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.name[0]}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
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
                className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                disabled={isLoading}
              />
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.email[0]}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
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
                className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                disabled={isLoading}
              />
              {password.length > 0 && (
                <div className="mt-2 flex gap-1 h-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div 
                      key={i} 
                      className={`flex-1 rounded-full ${i <= passwordStrength ? strengthColor : 'bg-gray-200'}`}
                    />
                  ))}
                </div>
              )}
              {validationErrors.password && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.password[0]}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium leading-6 text-gray-900 mb-2">
              Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex cursor-pointer items-center justify-center rounded-md border px-3 py-2 text-sm font-semibold uppercase sm:flex-1 ${role === Role.MEMBER ? 'bg-indigo-600 text-white border-transparent hover:bg-indigo-700' : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'}`}>
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
              <label className={`flex cursor-pointer items-center justify-center rounded-md border px-3 py-2 text-sm font-semibold uppercase sm:flex-1 ${role === Role.ADMIN ? 'bg-indigo-600 text-white border-transparent hover:bg-indigo-700' : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'}`}>
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

        <div className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500">
            Sign in instead
          </Link>
        </div>
      </div>
    </div>
  );
}
