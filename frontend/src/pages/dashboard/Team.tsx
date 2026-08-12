import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Shield, MoreVertical, CreditCard, Mail, X } from 'lucide-react';
import toast from 'react-hot-toast';

type Role = 'Owner' | 'Admin' | 'Editor' | 'Viewer';

interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'Active' | 'Invited';
}

const mockMembers: Member[] = [
  { id: '1', name: 'Alex Morgan', email: 'alex@company.com', role: 'Owner', status: 'Active' },
  { id: '2', name: 'Sarah Chen', email: 'sarah@company.com', role: 'Admin', status: 'Active' },
  { id: '3', name: 'David Smith', email: 'david@company.com', role: 'Editor', status: 'Active' },
  { id: '4', name: 'Elena Rodriguez', email: 'elena@company.com', role: 'Viewer', status: 'Invited' },
];

const Team = () => {
  const [members, setMembers] = useState<Member[]>(mockMembers);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('Viewer');
  const [isLoading, setIsLoading] = useState(false);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    
    setIsLoading(true);
    // Mock API Call
    setTimeout(() => {
      setMembers([...members, {
        id: Math.random().toString(),
        name: 'Pending User',
        email: inviteEmail,
        role: inviteRole,
        status: 'Invited'
      }]);
      toast.success(`Invitation sent to ${inviteEmail}`);
      setIsLoading(false);
      setIsInviteModalOpen(false);
      setInviteEmail('');
      setInviteRole('Viewer');
    }, 1000);
  };

  const handleRemoveMember = (id: string) => {
    setMembers(members.filter(m => m.id !== id));
    toast.success('Member removed from workspace');
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-[24px] font-semibold tracking-[-0.96px] text-ink mb-1">Team Workspace</h1>
          <p className="text-body text-[14px]">Manage your organization members, roles, and shared resources.</p>
        </div>
        <button 
          onClick={() => setIsInviteModalOpen(true)}
          className="bg-ink text-on-primary px-4 h-[36px] rounded-sm text-[14px] font-medium hover:bg-ink/90 transition-colors shadow-level-2 flex items-center gap-2 w-fit"
        >
          <UserPlus className="w-4 h-4" />
          Invite Members
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-canvas rounded-md border border-hairline p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-[14px] font-medium text-ink">Total Members</h3>
          </div>
          <p className="text-[28px] font-semibold text-ink">{members.length}</p>
          <p className="text-[12px] text-mute mt-1">out of 10 seats used</p>
        </div>

        <div className="bg-canvas rounded-md border border-hairline p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <Shield className="w-4 h-4 text-purple-600" />
            </div>
            <h3 className="text-[14px] font-medium text-ink">Active Roles</h3>
          </div>
          <p className="text-[28px] font-semibold text-ink">4</p>
          <p className="text-[12px] text-mute mt-1">Owner, Admin, Editor, Viewer</p>
        </div>

        <div className="bg-canvas rounded-md border border-hairline p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-link/10 to-transparent rounded-bl-full pointer-events-none"></div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-green-600" />
            </div>
            <h3 className="text-[14px] font-medium text-ink">Billing Plan</h3>
          </div>
          <p className="text-[28px] font-semibold text-ink">Pro Plan</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-[12px] text-mute">$49/mo • Renews Oct 1</p>
            <button className="text-[12px] font-medium text-link hover:underline">Manage Seats</button>
          </div>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-canvas rounded-md border border-hairline shadow-level-1 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-hairline flex items-center justify-between bg-canvas-soft">
          <h2 className="text-[15px] font-semibold text-ink">Members</h2>
          <div className="flex gap-2">
            <label htmlFor="search-members" className="sr-only">Search members</label>
            <input 
              id="search-members"
              name="search"
              type="text" 
              placeholder="Search members..." 
              className="bg-canvas border border-hairline rounded-sm py-1.5 px-3 text-[13px] focus:outline-none focus:border-link focus:ring-1 focus:ring-link transition-colors w-64 shadow-sm placeholder:text-mute"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-hairline">
                <th className="py-3 px-6 text-[12px] font-semibold text-mute uppercase tracking-wider">User</th>
                <th className="py-3 px-6 text-[12px] font-semibold text-mute uppercase tracking-wider">Role</th>
                <th className="py-3 px-6 text-[12px] font-semibold text-mute uppercase tracking-wider">Status</th>
                <th className="py-3 px-6 text-[12px] font-semibold text-mute uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-canvas-soft/50 transition-colors">
                  <td className="py-3 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[12px] font-bold shadow-sm">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-[14px] font-medium text-ink leading-tight">{member.name}</p>
                        <p className="text-[12px] text-mute">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-6">
                    <label htmlFor={`role-${member.id}`} className="sr-only">Role for {member.name}</label>
                    <select 
                      id={`role-${member.id}`}
                      name={`role-${member.id}`}
                      defaultValue={member.role}
                      disabled={member.role === 'Owner'}
                      className="bg-canvas border border-transparent hover:border-hairline rounded-sm py-1 px-2 text-[13px] text-ink focus:outline-none focus:border-link focus:ring-1 focus:ring-link transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="Owner" disabled>Owner</option>
                      <option value="Admin">Admin</option>
                      <option value="Editor">Editor</option>
                      <option value="Viewer">Viewer</option>
                    </select>
                  </td>
                  <td className="py-3 px-6">
                    {member.status === 'Active' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-medium bg-success-soft text-success-deep border border-success-soft uppercase tracking-wider">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-medium bg-warning-soft text-warning-deep border border-warning-soft uppercase tracking-wider">
                        Invited
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-6 text-right">
                    <button 
                      onClick={() => member.role !== 'Owner' && handleRemoveMember(member.id)}
                      disabled={member.role === 'Owner'}
                      className="p-1.5 text-mute hover:text-error hover:bg-error-soft rounded-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Remove member"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-canvas rounded-md shadow-level-3 border border-hairline w-full max-w-md overflow-hidden"
          >
            <div className="p-4 border-b border-hairline flex justify-between items-center bg-canvas-soft">
              <h3 className="text-[16px] font-semibold text-ink">Invite to Workspace</h3>
              <button onClick={() => setIsInviteModalOpen(false)} className="text-mute hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleInvite} className="p-6 space-y-4">
              <div>
                <label htmlFor="inviteEmail" className="block text-[13px] font-medium text-ink mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
                  <input 
                    id="inviteEmail"
                    name="inviteEmail"
                    type="email" 
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    className="w-full bg-canvas border border-hairline rounded-sm py-2 pl-9 pr-3 focus:outline-none focus:border-link focus:ring-1 focus:ring-link transition-colors text-[14px] shadow-sm text-ink placeholder:text-mute"
                    placeholder="colleague@company.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="inviteRole" className="block text-[13px] font-medium text-ink mb-1.5">Role</label>
                <select 
                  id="inviteRole"
                  name="inviteRole"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as Role)}
                  className="w-full bg-canvas border border-hairline rounded-sm py-2 px-3 focus:outline-none focus:border-link focus:ring-1 focus:ring-link transition-colors text-[14px] shadow-sm text-ink"
                >
                  <option value="Admin">Admin - Can manage members and billing</option>
                  <option value="Editor">Editor - Can create and edit shared documents</option>
                  <option value="Viewer">Viewer - Can only view shared documents and chat</option>
                </select>
              </div>

              <div className="bg-canvas-soft border border-hairline rounded-sm p-3 mt-2">
                <p className="text-[12px] text-mute flex items-start gap-2">
                  <Shield className="w-4 h-4 shrink-0 mt-0.5 text-link" />
                  Inviting a new member will automatically consume 1 available seat from your billing plan.
                </p>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 h-[36px] rounded-sm text-[13px] font-medium text-ink border border-hairline hover:bg-canvas-soft transition-colors shadow-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading || !inviteEmail}
                  className="px-4 h-[36px] rounded-sm text-[13px] font-medium bg-ink text-on-primary hover:bg-ink/90 transition-colors shadow-level-2 disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
};

export default Team;
