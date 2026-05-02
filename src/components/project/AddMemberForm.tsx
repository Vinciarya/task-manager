'use client';

import { useState } from 'react';
import { Role } from '@/types';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { getErrorMessage } from '@/lib/error-message';

interface AddMemberFormProps {
  onAdd: (email: string, role: Role) => Promise<void>;
  onCancel: () => void;
}

export function AddMemberForm({ onAdd, onCancel }: AddMemberFormProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>(Role.MEMBER);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError(null);

    try {
      await onAdd(email, role);
      setEmail('');
      setRole(Role.MEMBER);
      onCancel();
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to add member'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
      
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label htmlFor="email" className="sr-only">Email address</label>
          <input
            type="email"
            id="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            placeholder="Enter user email address"
            disabled={isLoading}
          />
        </div>
        
        <div className="sm:w-32">
          <label htmlFor="role" className="sr-only">Role</label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="block w-full rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            disabled={isLoading}
          >
            <option value={Role.MEMBER}>Member</option>
            <option value={Role.ADMIN}>Admin</option>
          </select>
        </div>
      </div>
      
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="text-xs font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || !email}
          className="inline-flex items-center rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
        >
          {isLoading && <LoadingSpinner size="sm" color="white" className="mr-1.5" />}
          Add User
        </button>
      </div>
    </form>
  );
}
