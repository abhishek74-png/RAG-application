import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sliders, Key, Globe, Shield, Monitor, HardDrive, User, Bell, Smartphone, LogOut, CheckCircle2, Upload, Trash2, SmartphoneNfc, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { profileService } from '../../services/profile';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const Settings = () => {
  const [activeTab, setActiveTab] = useState<'account' | 'security' | 'preferences' | 'ai'>('account');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const queryClient = useQueryClient();

  // Fetch User via React Query
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  // Mock Session Data (In production, fetch from custom sessions table or Supabase Admin API)
  const { data: sessionData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['active-sessions'],
    queryFn: async () => {
      return [
        { id: 1, device: 'MacBook Pro (macOS)', browser: 'Chrome', location: 'San Francisco, US', current: true, date: 'Active now' },
        { id: 2, device: 'iPhone 13 Pro (iOS)', browser: 'Safari', location: 'San Francisco, US', current: false, date: '2 hours ago' }
      ];
    }
  });

  // Update Profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const first_name = formData.get('firstName') as string;
      const last_name = formData.get('lastName') as string;
      const full_name = `${first_name} ${last_name}`.trim();
      
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name,
          last_name,
          full_name
        }
      });
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      toast.success("Profile updated successfully");
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: () => {
      toast.error("Failed to update profile");
    }
  });

  // Update Password Mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      toast.success("Password updated securely");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update password");
    }
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(new FormData(e.target as HTMLFormElement));
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const password = new FormData(form).get('new-password') as string;
    updatePasswordMutation.mutate(password, {
      onSuccess: () => form.reset()
    });
  };

  const toggleTheme = (theme: 'light' | 'dark' | 'system') => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.removeItem('theme');
    }
    toast.success(`Theme updated to ${theme}`);
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      toast.error("Invalid file type. Please upload a JPG, PNG, or WEBP image.");
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 5MB.");
      e.target.value = '';
      return;
    }

    setIsUploadingAvatar(true);
    try {
      await profileService.uploadAvatar(file, user.id);
      toast.success("Profile photo updated successfully!");
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload photo. Please try again.");
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    setIsUploadingAvatar(true);
    try {
      await profileService.deleteAvatar(user.id);
      toast.success("Profile photo removed.");
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    } catch (error: any) {
      console.error("Remove error:", error);
      toast.error(error.message || "Failed to remove photo.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  if (userLoading) {
    return (
      <div className="max-w-5xl mx-auto pb-12 flex gap-8 animate-pulse">
        <div className="w-1/4 space-y-2">
          {[1,2,3,4].map(i => <div key={i} className="h-10 bg-canvas-soft rounded-md"></div>)}
        </div>
        <div className="w-3/4 space-y-6">
          <div className="h-64 bg-canvas-soft rounded-lg"></div>
          <div className="h-48 bg-canvas-soft rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
      
      <div className="mb-8">
        <h1 className="text-[24px] font-semibold tracking-[-0.96px] text-ink mb-1">Account Settings</h1>
        <p className="text-body text-[14px]">Manage your personal profile, security protocols, and workspace preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Sidebar Nav */}
        <div className="md:col-span-1 space-y-1">
          {[
            { id: 'account', icon: User, label: 'Profile & Account' },
            { id: 'security', icon: Shield, label: 'Security & 2FA' },
            { id: 'preferences', icon: Monitor, label: 'Preferences' },
            { id: 'ai', icon: Sliders, label: 'AI Configurations' }
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[14px] font-medium transition-all duration-200 ${activeTab === item.id ? 'bg-canvas-soft text-ink border border-hairline shadow-sm' : 'text-body hover:bg-canvas-soft/50 hover:text-ink'}`}
            >
              <item.icon className="w-4 h-4" /> {item.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-6">
          <AnimatePresence mode="wait">
            
            {/* ACCOUNT TAB */}
            {activeTab === 'account' && (
              <motion.div key="account" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                
                <div className="bg-canvas rounded-xl border border-hairline overflow-hidden shadow-level-1">
                  <div className="p-6 border-b border-hairline bg-canvas-soft/30">
                    <h2 className="text-[16px] font-semibold text-ink">Avatar & Profile</h2>
                    <p className="text-[14px] text-mute mt-1">Update your personal information and profile picture.</p>
                  </div>
                  <div className="p-6">
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                      <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center shrink-0 relative overflow-hidden group shadow-sm">
                          {user?.user_metadata?.avatar_url ? (
                            <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-8 h-8 text-mute/50" />
                          )}
                          <div 
                            onClick={() => document.getElementById('avatar-upload')?.click()}
                            className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center cursor-pointer transition-all backdrop-blur-sm"
                          >
                            <Upload className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <button 
                              type="button" 
                              disabled={isUploadingAvatar}
                              onClick={() => document.getElementById('avatar-upload')?.click()}
                              className="bg-canvas-soft border border-hairline text-ink px-4 py-2 rounded-lg text-[13px] font-medium hover:bg-canvas transition-colors shadow-sm hover:shadow-md flex items-center gap-2 disabled:opacity-50"
                            >
                              {isUploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                              {user?.user_metadata?.avatar_url ? 'Change Photo' : 'Upload Photo'}
                            </button>
                            {user?.user_metadata?.avatar_url && (
                              <button 
                                type="button" 
                                disabled={isUploadingAvatar}
                                onClick={handleRemoveAvatar}
                                className="bg-error/10 text-error px-4 py-2 rounded-lg text-[13px] font-medium hover:bg-error/20 transition-colors shadow-sm disabled:opacity-50"
                              >
                                Remove Photo
                              </button>
                            )}
                          </div>
                          <p className="text-[12px] text-mute">JPG, PNG or WEBP. 5MB max.</p>
                          <input 
                            type="file" 
                            id="avatar-upload" 
                            className="hidden" 
                            accept="image/jpeg,image/png,image/webp" 
                            onChange={handleAvatarFileChange} 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-5">
                        <div>
                          <label htmlFor="firstName" className="block text-[13px] font-medium text-ink mb-1.5">First Name</label>
                          <input id="firstName" name="firstName" type="text" defaultValue={user?.user_metadata?.first_name || ''} className="w-full bg-canvas border border-hairline rounded-lg py-2.5 px-3 focus:outline-none focus:border-link focus:ring-1 focus:ring-link transition-colors text-[14px] text-ink shadow-sm" />
                        </div>
                        <div>
                          <label htmlFor="lastName" className="block text-[13px] font-medium text-ink mb-1.5">Last Name</label>
                          <input id="lastName" name="lastName" type="text" defaultValue={user?.user_metadata?.last_name || ''} className="w-full bg-canvas border border-hairline rounded-lg py-2.5 px-3 focus:outline-none focus:border-link focus:ring-1 focus:ring-link transition-colors text-[14px] text-ink shadow-sm" />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="emailAddress" className="block text-[13px] font-medium text-ink mb-1.5">Email Address</label>
                        <input id="emailAddress" name="email" type="email" value={user?.email || ''} readOnly className="w-full bg-canvas-soft border border-hairline rounded-lg py-2.5 px-3 text-[14px] text-mute shadow-sm cursor-not-allowed opacity-70" />
                        <p className="text-[12px] text-mute mt-1.5">To change your email, please contact support.</p>
                      </div>

                      <div className="pt-2">
                        <button type="submit" disabled={updateProfileMutation.isPending} className="bg-ink text-on-primary px-6 h-[40px] rounded-lg text-[14px] font-medium hover:scale-[0.98] transition-all shadow-level-2 disabled:opacity-50 flex items-center gap-2">
                          {updateProfileMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                          Save Profile
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                <div className="bg-error/5 rounded-xl border border-error/20 overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-error/20 flex justify-between items-start">
                    <div>
                      <h2 className="text-[16px] font-semibold text-error">Danger Zone</h2>
                      <p className="text-[14px] text-error/80 mt-1">Permanently delete your account and all data.</p>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-[14px] text-ink mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                    <button className="bg-error text-white px-5 h-[40px] rounded-lg text-[14px] font-medium hover:bg-error-deep transition-colors shadow-sm">
                      Delete Account
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SECURITY TAB */}
            {activeTab === 'security' && (
              <motion.div key="security" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                
                <div className="bg-canvas rounded-xl border border-hairline overflow-hidden shadow-level-1">
                  <div className="p-6 border-b border-hairline bg-canvas-soft/30">
                    <h2 className="text-[16px] font-semibold text-ink">Change Password</h2>
                    <p className="text-[14px] text-mute mt-1">Ensure your account is using a long, random password to stay secure.</p>
                  </div>
                  <div className="p-6">
                    <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
                      <div>
                        <label htmlFor="currentPassword" className="block text-[13px] font-medium text-ink mb-1.5">Current Password</label>
                        <input id="currentPassword" name="currentPassword" type="password" required className="w-full bg-canvas border border-hairline rounded-lg py-2.5 px-3 focus:outline-none focus:border-link focus:ring-1 focus:ring-link transition-colors text-[14px] text-ink shadow-sm" />
                      </div>
                      <div>
                        <label htmlFor="newPassword" className="block text-[13px] font-medium text-ink mb-1.5">New Password</label>
                        <input id="newPassword" name="new-password" type="password" required minLength={8} className="w-full bg-canvas border border-hairline rounded-lg py-2.5 px-3 focus:outline-none focus:border-link focus:ring-1 focus:ring-link transition-colors text-[14px] text-ink shadow-sm" />
                      </div>
                      <div>
                        <label htmlFor="confirmPassword" className="block text-[13px] font-medium text-ink mb-1.5">Confirm New Password</label>
                        <input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} className="w-full bg-canvas border border-hairline rounded-lg py-2.5 px-3 focus:outline-none focus:border-link focus:ring-1 focus:ring-link transition-colors text-[14px] text-ink shadow-sm" />
                      </div>
                      <div className="pt-2">
                        <button type="submit" disabled={updatePasswordMutation.isPending} className="bg-ink text-on-primary px-6 h-[40px] rounded-lg text-[14px] font-medium hover:scale-[0.98] transition-all shadow-level-2 disabled:opacity-50 flex items-center gap-2">
                          {updatePasswordMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                          Update Password
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                <div className="bg-canvas rounded-xl border border-hairline overflow-hidden shadow-level-1">
                  <div className="p-6 border-b border-hairline flex justify-between items-center bg-canvas-soft/30">
                    <div>
                      <h2 className="text-[16px] font-semibold text-ink">Two-Factor Authentication</h2>
                      <p className="text-[14px] text-mute mt-1">Add an extra layer of security to your account.</p>
                    </div>
                    <span className="px-2.5 py-1 bg-warning/10 text-warning rounded-md text-[11px] font-semibold uppercase tracking-wider border border-warning/20">Disabled</span>
                  </div>
                  <div className="p-6">
                    <p className="text-[14px] text-ink mb-5 max-w-2xl">When 2FA is enabled, you will be prompted for a secure, random code downloaded from your authenticator app.</p>
                    <button className="bg-canvas-soft border border-hairline text-ink px-5 h-[40px] rounded-lg text-[14px] font-medium hover:bg-canvas transition-colors shadow-sm flex items-center gap-2 hover:shadow-md">
                      <SmartphoneNfc className="w-4 h-4" /> Enable 2FA
                    </button>
                  </div>
                </div>

                <div className="bg-canvas rounded-xl border border-hairline overflow-hidden shadow-level-1">
                  <div className="p-6 border-b border-hairline bg-canvas-soft/30">
                    <h2 className="text-[16px] font-semibold text-ink">Active Sessions</h2>
                    <p className="text-[14px] text-mute mt-1">Manage and revoke your active sessions across connected devices.</p>
                  </div>
                  <div className="p-0">
                    <div className="divide-y divide-hairline">
                      {sessionData?.map(session => (
                        <div key={session.id} className="p-6 flex justify-between items-center hover:bg-canvas-soft/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-canvas border border-hairline flex items-center justify-center shrink-0 shadow-sm">
                              {session.device.includes('MacBook') ? <Monitor className="w-5 h-5 text-ink" /> : <Smartphone className="w-5 h-5 text-ink" />}
                            </div>
                            <div>
                              <p className="text-[14px] font-medium text-ink flex items-center gap-2">
                                {session.device}
                                {session.current && <span className="px-2 py-0.5 bg-success/10 text-success text-[10px] font-bold uppercase rounded-md tracking-wider border border-success/20">This Device</span>}
                              </p>
                              <p className="text-[13px] text-mute mt-0.5">{session.browser} • {session.location}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                             <span className="text-[12px] text-mute">{session.date}</span>
                             {!session.current && (
                               <button className="text-[13px] font-medium text-error hover:text-error-deep transition-colors">Revoke</button>
                             )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </motion.div>
            )}

            {/* PREFERENCES TAB */}
            {activeTab === 'preferences' && (
              <motion.div key="preferences" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                
                <div className="bg-canvas rounded-xl border border-hairline overflow-hidden shadow-level-1">
                  <div className="p-6 border-b border-hairline bg-canvas-soft/30">
                    <h2 className="text-[16px] font-semibold text-ink">Appearance & Locale</h2>
                    <p className="text-[14px] text-mute mt-1">Customize how the application looks and feels.</p>
                  </div>
                  <div className="p-6 space-y-8">
                    
                    <div>
                      <label className="block text-[14px] font-medium text-ink mb-3">Theme Preference</label>
                      <div className="grid grid-cols-3 gap-4 max-w-md">
                        <div onClick={() => toggleTheme('light')} className="border border-hairline hover:border-link rounded-xl p-3 cursor-pointer relative overflow-hidden bg-white shadow-sm transition-all hover:shadow-md">
                          <div className="w-full h-16 bg-gray-100 rounded-md mb-3 border border-gray-200 flex flex-col gap-1.5 p-2.5">
                            <div className="w-full h-2 bg-gray-300 rounded-full"></div>
                            <div className="w-2/3 h-2 bg-gray-300 rounded-full"></div>
                          </div>
                          <p className="text-[13px] font-medium text-center text-gray-900">Light</p>
                        </div>
                        <div onClick={() => toggleTheme('dark')} className="border border-hairline hover:border-link rounded-xl p-3 cursor-pointer transition-all bg-[#0a0a0a] shadow-sm hover:shadow-md">
                          <div className="w-full h-16 bg-[#1a1a1a] rounded-md mb-3 border border-[#333] flex flex-col gap-1.5 p-2.5">
                            <div className="w-full h-2 bg-[#444] rounded-full"></div>
                            <div className="w-2/3 h-2 bg-[#444] rounded-full"></div>
                          </div>
                          <p className="text-[13px] font-medium text-center text-white">Dark</p>
                        </div>
                        <div onClick={() => toggleTheme('system')} className="border border-hairline hover:border-link rounded-xl p-3 cursor-pointer transition-all bg-gradient-to-br from-white to-[#0a0a0a] shadow-sm hover:shadow-md">
                          <div className="w-full h-16 bg-gray-400/50 rounded-md mb-3 border border-gray-500/50 flex flex-col gap-1.5 p-2.5"></div>
                          <p className="text-[13px] font-medium text-center text-ink bg-canvas/80 backdrop-blur-sm rounded-md py-0.5">System</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="language" className="block text-[14px] font-medium text-ink mb-3">Language</label>
                      <select id="language" name="language" className="w-full max-w-xs bg-canvas border border-hairline rounded-lg py-2.5 px-3 focus:outline-none focus:border-link focus:ring-1 focus:ring-link transition-colors text-[14px] text-ink appearance-none shadow-sm cursor-pointer">
                        <option>English (US)</option>
                        <option>English (UK)</option>
                        <option>Spanish</option>
                        <option>French</option>
                        <option>German</option>
                      </select>
                    </div>

                  </div>
                </div>

                <div className="bg-canvas rounded-xl border border-hairline overflow-hidden shadow-level-1">
                  <div className="p-6 border-b border-hairline bg-canvas-soft/30">
                    <h2 className="text-[16px] font-semibold text-ink">Notifications</h2>
                    <p className="text-[14px] text-mute mt-1">Manage what alerts you receive via email.</p>
                  </div>
                  <div className="p-6 space-y-6">
                    {[
                      { id: 'updates', title: 'Product Updates', desc: 'Receive news about the latest features and improvements.' },
                      { id: 'security', title: 'Security Alerts', desc: 'Receive alerts regarding new logins or suspicious activity.' },
                      { id: 'billing', title: 'Billing Notifications', desc: 'Receive invoices, payment failures, and limits warnings.' }
                    ].map(notif => (
                      <div key={notif.id} className="flex items-center justify-between">
                        <div>
                          <h4 className="text-[14px] font-medium text-ink">{notif.title}</h4>
                          <p className="text-[13px] text-mute mt-0.5">{notif.desc}</p>
                        </div>
                        <label htmlFor={`notif-${notif.id}`} className="relative inline-flex items-center cursor-pointer">
                          <input id={`notif-${notif.id}`} name={`notif-${notif.id}`} type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-canvas-soft border border-hairline peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-hairline after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-link shadow-inner"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

              </motion.div>
            )}

            {/* AI SETTINGS TAB */}
            {activeTab === 'ai' && (
              <motion.div key="ai" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                
                <div className="bg-canvas rounded-xl border border-hairline overflow-hidden shadow-level-1">
                  <div className="p-6 border-b border-hairline bg-canvas-soft/30">
                    <h2 className="text-[16px] font-semibold text-ink">Model Configuration</h2>
                    <p className="text-[14px] text-mute mt-1">Select and tune the LLM used for your generative answers.</p>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    <div>
                      <label htmlFor="defaultModel" className="block text-[14px] font-medium text-ink mb-3">Default Model</label>
                      <select id="defaultModel" name="defaultModel" className="w-full bg-canvas border border-hairline rounded-lg py-2.5 px-3 focus:outline-none focus:border-link focus:ring-1 focus:ring-link transition-colors text-[14px] text-ink appearance-none shadow-sm cursor-pointer">
                        <option>OpenRouter Auto (Recommended)</option>
                        <option>Llama 3.1 70B</option>
                        <option>Mistral NeMo</option>
                        <option>Google Gemini 2.5 Flash</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label htmlFor="temperature" className="block text-[14px] font-medium text-ink">Temperature</label>
                        <span className="text-[12px] text-ink font-mono border border-hairline px-2.5 py-1 rounded-md bg-canvas-soft shadow-sm">0.3</span>
                      </div>
                      <input 
                        id="temperature"
                        name="temperature"
                        type="range" 
                        min="0" max="1" step="0.1" defaultValue="0.3"
                        className="w-full h-1.5 bg-hairline rounded-lg appearance-none cursor-pointer accent-link"
                      />
                      <div className="flex justify-between text-[12px] text-mute mt-3 font-medium">
                        <span>Precise</span>
                        <span>Creative</span>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="systemPrompt" className="block text-[14px] font-medium text-ink mb-3">System Prompt</label>
                      <textarea 
                        id="systemPrompt"
                        name="systemPrompt"
                        className="w-full bg-canvas border border-hairline rounded-lg py-3 px-4 focus:outline-none focus:border-link focus:ring-1 focus:ring-link transition-colors text-[14px] text-ink resize-none h-32 shadow-sm"
                        defaultValue="You are an expert corporate assistant. Answer questions strictly based on the provided retrieved documents. If the answer is not in the documents, state that you do not know. Maintain a professional and concise tone."
                      ></textarea>
                    </div>
                  </div>
                  
                  <div className="p-5 border-t border-hairline bg-canvas-soft/30 flex justify-end">
                    <button className="bg-ink text-on-primary px-6 h-[40px] rounded-lg text-[14px] font-medium hover:scale-[0.98] transition-all shadow-level-2">
                      Save Configurations
                    </button>
                  </div>
                </div>

                <div className="bg-canvas rounded-xl border border-hairline overflow-hidden shadow-level-1">
                   <div className="p-6 border-b border-hairline bg-canvas-soft/30">
                    <h2 className="text-[16px] font-semibold text-ink">Retrieval Parameters</h2>
                    <p className="text-[14px] text-mute mt-1">Fine-tune how documents are searched and fetched.</p>
                  </div>
                  <div className="p-6 space-y-8">
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-[14px] font-medium text-ink">Hybrid Search</h4>
                        <p className="text-[13px] text-mute mt-1">Combine keyword search (BM25) with vector embeddings.</p>
                      </div>
                      <label htmlFor="hybridSearch" className="relative inline-flex items-center cursor-pointer">
                        <input id="hybridSearch" name="hybridSearch" type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-canvas-soft border border-hairline peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-hairline after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-link shadow-inner"></div>
                      </label>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label htmlFor="topKChunks" className="block text-[14px] font-medium text-ink">Top K Chunks to Retrieve</label>
                        <span className="text-[12px] text-ink font-mono border border-hairline px-2.5 py-1 rounded-md bg-canvas-soft shadow-sm">5</span>
                      </div>
                      <input 
                        id="topKChunks"
                        name="topKChunks"
                        type="range" 
                        min="1" max="20" step="1" defaultValue="5"
                        className="w-full h-1.5 bg-hairline rounded-lg appearance-none cursor-pointer accent-link"
                      />
                    </div>

                  </div>
                </div>

                <div className="bg-canvas rounded-xl border border-hairline overflow-hidden shadow-level-1">
                  <div className="p-6 border-b border-hairline flex justify-between items-center bg-canvas-soft/30">
                    <div>
                      <h2 className="text-[16px] font-semibold text-ink">API Keys</h2>
                      <p className="text-[14px] text-mute mt-1">Manage API keys to access the RAG engine programmatically.</p>
                    </div>
                    <button className="bg-canvas-soft border border-hairline text-ink px-4 py-2 rounded-lg text-[13px] font-medium hover:bg-canvas transition-colors shadow-sm hover:shadow-md">
                      Generate New Key
                    </button>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between p-4 border border-hairline rounded-lg bg-canvas-soft mb-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        <Key className="w-4 h-4 text-mute" />
                        <span className="text-[14px] font-mono text-ink">sk-live-••••••••••••••••••••••••8x9p</span>
                      </div>
                      <button className="text-[13px] font-medium text-link hover:text-link-deep transition-colors">Revoke</button>
                    </div>
                    <p className="text-[12px] text-mute">Created on Oct 12, 2026. Last used 2 hours ago.</p>
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
};

export default Settings;
