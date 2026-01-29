'use client';

import Link from "next/link";
import { useState } from "react";
import { updateProfile, updatePassword, updateNotificationPreferences } from "./actions";
import { BellIcon } from "@/components/icons";

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  notificationsEnabled: boolean;
  notificationDefaultType: string;
  notificationMethods: any;
}

export default function SettingsForm({ user }: { user: UserData }) {
  // --- Profile State ---
  const [profileStatus, setProfileStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [profileMsg, setProfileMsg] = useState("");

  // --- Password State ---
  const [passStatus, setPassStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [passMsg, setPassMsg] = useState("");

  // --- Notification State ---
  const [notifStatus, setNotifStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [notifMsg, setNotifMsg] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(user.notificationsEnabled ?? false);
  const [emailEnabled, setEmailEnabled] = useState((user.notificationMethods as any)?.email ?? true);

  const handleProfileUpdate = async (formData: FormData) => {
    setProfileStatus('loading');
    setProfileMsg("");
    
    const result = await updateProfile(formData);
    
    setProfileStatus(result.success ? 'success' : 'idle');
    setProfileMsg(result.message);
    
    if (result.success) {
        setTimeout(() => setProfileStatus('idle'), 3000);
    }
  };

  const handlePasswordUpdate = async (formData: FormData) => {
    setPassStatus('loading');
    setPassMsg("");

    const result = await updatePassword(formData);

    setPassStatus(result.success ? 'success' : 'idle');
    setPassMsg(result.message);

    if (result.success) {
        (document.getElementById("passwordForm") as HTMLFormElement).reset();
        setTimeout(() => setPassStatus('idle'), 3000);
    }
  };

  const handleNotificationUpdate = async () => {
    setNotifStatus('loading');
    setNotifMsg("");

    const result = await updateNotificationPreferences({
      notificationsEnabled,
      notificationDefaultType: 'order-complete', // Always use order-complete
      notificationMethods: { email: emailEnabled }
    });

    setNotifStatus(result.success ? 'success' : 'idle');
    setNotifMsg(result.message);

    if (result.success) {
        setTimeout(() => setNotifStatus('idle'), 3000);
    }
  };

  const inputClass = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#32A5DC]/50 transition-all text-gray-900 font-medium placeholder-gray-500";

  return (
    <div className="min-h-screen relative overflow-hidden flex justify-center p-4">
      
      {/* --- BACKGROUND --- */}
      <div className="absolute inset-0 z-0 bg-[#004876] fixed">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#32A5DC] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#32A5DC] rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      </div>

      {/* --- CONTENT CONTAINER --- */}
      <div className="relative z-10 w-full max-w-2xl space-y-6 pt-8 pb-12">
        
        {/* Header with Updated Back Button */}
        <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-black text-white drop-shadow-md">Settings</h1>
            <Link href="/dashboard">
                {/* UPDATED BUTTON STYLE */}
                <button className="bg-[#003355] hover:bg-[#002a4d] border border-white/10 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all hover:scale-[1.02] flex items-center gap-2">
                    <span>←</span> Back to Dashboard
                </button>
            </Link>
        </div>

        {/* --- SECTION 1: PROFILE --- */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/10">
            <h2 className="text-xl font-black text-[#004876] mb-6 border-b pb-2 flex items-center gap-2">
                <span>👤</span> Personal Information
            </h2>
            
            <form action={handleProfileUpdate} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-sm font-bold text-gray-700 ml-1">First Name</label>
                        <input 
                            name="firstName" 
                            defaultValue={user.firstName}
                            required
                            className={inputClass}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-bold text-gray-700 ml-1">Last Name</label>
                        <input 
                            name="lastName" 
                            defaultValue={user.lastName}
                            required
                            className={inputClass}
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700 ml-1">Email (Cannot be changed)</label>
                    <input 
                        value={user.email} 
                        disabled 
                        className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-gray-500 font-bold cursor-not-allowed"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700 ml-1">Phone Number</label>
                    <input 
                        name="phone" 
                        defaultValue={user.phone || ""}
                        placeholder="(555) 123-4567"
                        className={inputClass}
                    />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
                    <button 
                        disabled={profileStatus === 'loading'}
                        className="w-full sm:w-auto bg-[#32A5DC] hover:bg-[#288bba] text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md hover:scale-[1.02] disabled:opacity-50"
                    >
                        {profileStatus === 'loading' ? 'Saving...' : 'Save Profile'}
                    </button>
                    {profileMsg && (
                        <span className={`text-sm font-bold ${profileStatus === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                            {profileMsg}
                        </span>
                    )}
                </div>
            </form>
        </div>

        {/* --- SECTION 2: SECURITY --- */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/10">
            <h2 className="text-xl font-black text-[#004876] mb-6 border-b pb-2 flex items-center gap-2">
                <span>🔒</span> Security
            </h2>
            
            <form id="passwordForm" action={handlePasswordUpdate} className="space-y-5">
                <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700 ml-1">Current Password</label>
                    <input 
                        name="currentPassword" 
                        type="password"
                        required
                        className={inputClass}
                        placeholder="••••••••"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-sm font-bold text-gray-700 ml-1">New Password</label>
                        <input 
                            name="newPassword" 
                            type="password"
                            required
                            minLength={6}
                            className={inputClass}
                            placeholder="New password"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-bold text-gray-700 ml-1">Confirm New Password</label>
                        <input 
                            name="confirmPassword" 
                            type="password"
                            required
                            minLength={6}
                            className={inputClass}
                            placeholder="Confirm password"
                        />
                    </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
                    <button 
                        disabled={passStatus === 'loading'}
                        className="w-full sm:w-auto bg-[#004876] hover:bg-[#003355] text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md hover:scale-[1.02] disabled:opacity-50"
                    >
                        {passStatus === 'loading' ? 'Updating...' : 'Change Password'}
                    </button>
                    {passMsg && (
                        <span className={`text-sm font-bold ${passStatus === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                            {passMsg}
                        </span>
                    )}
                </div>
            </form>
        </div>

        {/* --- SECTION 3: NOTIFICATION PREFERENCES --- */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/10">
            <h2 className="text-xl font-black text-[#004876] mb-6 border-b pb-2 flex items-center gap-2">
                <BellIcon size={20} /> Notification Preferences
            </h2>
            
            <div className="space-y-5">
                {/* Enable Notifications Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex-1">
                        <label className="text-sm font-bold text-gray-700 block mb-1">
                            Enable notifications for all orders
                        </label>
                        <p className="text-xs text-gray-500">
                            Get notified when your drinks are ready
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={notificationsEnabled}
                            onChange={(e) => setNotificationsEnabled(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#32A5DC]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#32A5DC]"></div>
                    </label>
                </div>

                {/* Notification Methods (only show if notifications enabled) */}
                {notificationsEnabled && (
                    <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <label className="text-sm font-bold text-gray-700 block mb-2">
                            Notification methods
                        </label>
                        <div className="space-y-2">
                            <label className="flex items-center p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={emailEnabled}
                                    onChange={(e) => setEmailEnabled(e.target.checked)}
                                    className="w-4 h-4 text-[#32A5DC] focus:ring-[#32A5DC] focus:ring-2 rounded"
                                />
                                <div className="ml-3 flex-1">
                                    <span className="text-sm font-bold text-gray-700">Email notifications</span>
                                    <p className="text-xs text-gray-500">Receive notifications via email</p>
                                </div>
                            </label>
                            <label className="flex items-center p-3 bg-white rounded-lg border border-gray-200 cursor-not-allowed opacity-50">
                                <input
                                    type="checkbox"
                                    disabled
                                    className="w-4 h-4 text-gray-400 rounded"
                                />
                                <div className="ml-3 flex-1">
                                    <span className="text-sm font-bold text-gray-500">SMS notifications</span>
                                    <p className="text-xs text-gray-400">Coming soon</p>
                                </div>
                            </label>
                        </div>
                    </div>
                )}

                <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
                    <button 
                        onClick={handleNotificationUpdate}
                        disabled={notifStatus === 'loading'}
                        className="w-full sm:w-auto bg-[#32A5DC] hover:bg-[#288bba] text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md hover:scale-[1.02] disabled:opacity-50"
                    >
                        {notifStatus === 'loading' ? 'Saving...' : 'Save Preferences'}
                    </button>
                    {notifMsg && (
                        <span className={`text-sm font-bold ${notifStatus === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                            {notifMsg}
                        </span>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}