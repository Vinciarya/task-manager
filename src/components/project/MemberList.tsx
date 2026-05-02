'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Trash2, UserPlus, Shield } from 'lucide-react';
import { Role } from '@/types';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { AddMemberForm } from './AddMemberForm';

interface Member {
  userId: string;
  projectId: string;
  role: Role;
  joinedAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface MemberListProps {
  projectId: string;
  members: Member[];
  onAddMember: (email: string, role: Role) => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
}

export function MemberList({ members, onAddMember, onRemoveMember }: MemberListProps) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === Role.ADMIN;
  const currentUserId = session?.user?.id;

  const [showAddForm, setShowAddForm] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);

  const handleRemove = async () => {
    if (!memberToRemove) return;
    try {
      await onRemoveMember(memberToRemove.userId);
      setMemberToRemove(null);
    } catch {
      setMemberToRemove(null);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/30">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 font-heading">
          <Shield className="h-4 w-4 text-muted-foreground" />
          Project Members ({members.length})
        </h3>
        {isAdmin && !showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            <UserPlus className="h-3 w-3 mr-1" />
            Add Member
          </button>
        )}
      </div>

      {showAddForm && isAdmin && (
        <div className="p-4 border-b border-border bg-indigo-50/50 dark:bg-indigo-900/10">
          <AddMemberForm
            onAdd={onAddMember}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      <ul className="divide-y divide-border">
        {members.map((member) => (
          <li key={member.userId} className="px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
            <div className="flex items-center min-w-0 gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-500">
                <span className="text-sm font-medium leading-none text-white">
                  {member.user.name?.[0]?.toUpperCase() || member.user.email[0].toUpperCase()}
                </span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground truncate tracking-tight">
                  {member.user.name || 'Unknown User'}
                  {member.userId === currentUserId && <span className="ml-2 text-xs text-muted-foreground font-normal">(You)</span>}
                </p>
                <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                member.role === Role.ADMIN 
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 ring-1 ring-inset ring-red-600/10 dark:ring-red-500/20' 
                  : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 ring-1 ring-inset ring-blue-600/10 dark:ring-blue-500/20'
              }`}>
                {member.role}
              </span>
              
              {isAdmin && (
                <button
                  onClick={() => setMemberToRemove(member)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                  title="Remove member"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        isOpen={!!memberToRemove}
        title="Remove Member"
        description={`Are you sure you want to remove ${memberToRemove?.user.name || memberToRemove?.user.email} from this project?`}
        onConfirm={handleRemove}
        onCancel={() => setMemberToRemove(null)}
      />
    </div>
  );
}
