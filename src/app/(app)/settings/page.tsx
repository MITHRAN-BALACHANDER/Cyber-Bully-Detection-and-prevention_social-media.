'use client';

import { useState } from 'react';
import { 
  User, 
  Bell, 
  Lock, 
  Globe, 
  LogOut,
  Camera,
  Save,
  X,
  Flame,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { Card, Button, Input, Avatar } from '@/components/ui';
import { useAuthStore } from '@/store';
import { useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';

type SettingsTab = 'profile' | 'privacy' | 'notifications' | 'account' | 'streak';

export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    name: user?.name || '',
    headline: user?.headline || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
  });

  const [streakData, setStreakData] = useState<any>(null);

  const tabs: { value: SettingsTab; label: string; icon: any }[] = [
    { value: 'profile', label: 'Profile', icon: User },
    { value: 'streak', label: 'Streak & Safety', icon: Flame },
    { value: 'privacy', label: 'Privacy', icon: Lock },
    { value: 'notifications', label: 'Notifications', icon: Bell },
    { value: 'account', label: 'Account', icon: Globe },
  ];

  // Fetch streak data
  useEffect(() => {
    const fetchStreakData = async () => {
      try {
        const response = await fetch('/api/streak', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setStreakData(data);
        }
      } catch (error) {
        console.error('Failed to fetch streak data:', error);
      }
    };

    if (activeTab === 'streak') {
      fetchStreakData();
    }
  }, [activeTab]);

  const handleSaveProfile = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(`/api/users/${user?.username}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.data);
        setMessage('Profile updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.error || 'Failed to update profile');
      }
    } catch {
      setMessage('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2 text-lg">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <Card className="p-2 h-fit shadow-md">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                      activeTab === tab.value
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </Card>

          {/* Content */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <Card className="p-6 sm:p-8 shadow-md">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h2>

                {message && (
                  <div className={`mb-6 p-4 rounded-xl font-medium ${
                    message.includes('success') 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {message}
                  </div>
                )}

                {/* Avatar */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Photo
                  </label>
                  <div className="flex items-center gap-4">
                    <Avatar
                      src={user?.avatar}
                      name={user?.name || 'User'}
                      size="xl"
                    />
                    <Button variant="outline" size="sm">
                      <Camera className="w-4 h-4 mr-2" />
                      Change Photo
                    </Button>
                  </div>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  <Input
                    label="Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your name"
                  />

                  <Input
                    label="Headline"
                    value={formData.headline}
                    onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                    placeholder="e.g. Software Engineer at Tech Company"
                    helperText="A brief professional headline"
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <Input
                    label="Location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="City, Country"
                  />

                  <Input
                    label="Website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://yourwebsite.com"
                  />

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => router.back()}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveProfile}
                      isLoading={isLoading}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'streak' && (
              <div className="space-y-6">
                {/* Streak Information */}
                <Card className="p-6 sm:p-8 shadow-md">
                  <div className="flex items-center gap-3 mb-6">
                    <Flame className="w-7 h-7 text-orange-500" />
                    <h2 className="text-2xl font-bold text-gray-900">Your Streak</h2>
                  </div>

                  {streakData ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Current Streak */}
                      <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-6 rounded-2xl border-2 border-orange-200">
                        <div className="text-center">
                          <Flame className="w-12 h-12 text-orange-500 mx-auto mb-3" />
                          <div className="text-5xl font-bold text-orange-600 mb-2">
                            {streakData.streak?.currentStreak || 0}
                          </div>
                          <div className="text-gray-700 font-medium">Day Current Streak</div>
                          <p className="text-sm text-gray-600 mt-2">
                            Keep posting positive content daily!
                          </p>
                        </div>
                      </div>

                      {/* Longest Streak */}
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border-2 border-purple-200">
                        <div className="text-center">
                          <Shield className="w-12 h-12 text-purple-500 mx-auto mb-3" />
                          <div className="text-5xl font-bold text-purple-600 mb-2">
                            {streakData.streak?.longestStreak || 0}
                          </div>
                          <div className="text-gray-700 font-medium">Day Longest Streak</div>
                          <p className="text-sm text-gray-600 mt-2">
                            Your personal best record
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">Loading streak data...</div>
                  )}

                  <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex gap-3">
                      <div className="text-blue-600 mt-0.5">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="text-sm text-blue-900">
                        <p className="font-medium mb-1">How streaks work:</p>
                        <ul className="space-y-1 text-blue-800">
                          <li>• Post or comment daily to maintain your streak</li>
                          <li>• Clean, respectful content keeps your streak going</li>
                          <li>• Offensive or bullying content breaks your streak</li>
                          <li>• Missing a day resets your current streak</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Violation Tracking */}
                <Card className="p-6 sm:p-8 shadow-md">
                  <div className="flex items-center gap-3 mb-6">
                    <AlertTriangle className="w-7 h-7 text-yellow-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Content Safety</h2>
                  </div>

                  {streakData ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Daily Violations */}
                        <div className={`p-6 rounded-2xl border-2 ${
                          (streakData.violations?.dailyCount || 0) >= 2
                            ? 'bg-red-50 border-red-300'
                            : (streakData.violations?.dailyCount || 0) >= 1
                            ? 'bg-yellow-50 border-yellow-300'
                            : 'bg-green-50 border-green-300'
                        }`}>
                          <div className="text-center">
                            <div className={`text-4xl font-bold mb-2 ${
                              (streakData.violations?.dailyCount || 0) >= 2
                                ? 'text-red-600'
                                : (streakData.violations?.dailyCount || 0) >= 1
                                ? 'text-yellow-600'
                                : 'text-green-600'
                            }`}>
                              {streakData.violations?.dailyCount || 0}/3
                            </div>
                            <div className="text-gray-700 font-medium">Today's Violations</div>
                          </div>
                        </div>

                        {/* Total Violations */}
                        <div className="bg-gray-50 p-6 rounded-2xl border-2 border-gray-200">
                          <div className="text-center">
                            <div className="text-4xl font-bold text-gray-700 mb-2">
                              {streakData.violations?.totalCount || 0}
                            </div>
                            <div className="text-gray-700 font-medium">Total Violations</div>
                          </div>
                        </div>
                      </div>

                      {/* Account Lock Status */}
                      {streakData.accountLock?.isLocked ? (
                        <div className="p-6 bg-red-50 rounded-xl border-2 border-red-300">
                          <div className="flex gap-3">
                            <Lock className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <h3 className="font-bold text-red-900 mb-2">Account Temporarily Locked</h3>
                              <p className="text-red-800 mb-3">{streakData.accountLock.lockReason}</p>
                              <p className="text-red-700 font-medium">
                                Lock expires: {new Date(streakData.accountLock.lockUntil).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 bg-green-50 rounded-xl border-2 border-green-200">
                          <div className="flex gap-3">
                            <Shield className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <h3 className="font-bold text-green-900 mb-2">Account in Good Standing</h3>
                              <p className="text-green-800">
                                Keep posting respectful content to maintain your streak and avoid violations!
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                        <div className="flex gap-3">
                          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-yellow-900">
                            <p className="font-medium mb-1">Progressive Lock System:</p>
                            <ul className="space-y-1 text-yellow-800">
                              <li>• 3 violations in 24 hours = Account lock</li>
                              <li>• 1st lock: 6 hours</li>
                              <li>• 2nd lock: 12 hours</li>
                              <li>• 3rd lock: 24 hours</li>
                              <li>• 4th lock: 48 hours</li>
                              <li>• 5th lock: 7 days</li>
                              <li>• 6th+ lock: 30 days</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">Loading safety data...</div>
                  )}
                </Card>
              </div>
            )}

            {activeTab === 'privacy' && (
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Privacy Settings</h2>
                
                <div className="space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Profile Visibility</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Control who can see your profile
                      </p>
                    </div>
                    <select className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="public">Public</option>
                      <option value="connections">Connections Only</option>
                      <option value="private">Private</option>
                    </select>
                  </div>

                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Show Last Seen</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Let others see when you were last active
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'notifications' && (
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Notification Preferences</h2>
                
                <div className="space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Post Likes</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Get notified when someone likes your post
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Comments</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Get notified when someone comments on your post
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">New Messages</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Get notified when you receive a new message
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Connection Requests</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Get notified when someone wants to connect
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'account' && (
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Account Settings</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Email</h3>
                    <p className="text-sm text-gray-600">{user?.email}</p>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Username</h3>
                    <p className="text-sm text-gray-600">@{user?.username}</p>
                  </div>

                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="font-medium text-gray-900 mb-4">Danger Zone</h3>
                    
                    <Button
                      variant="danger"
                      onClick={handleLogout}
                      className="w-full sm:w-auto"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Log Out
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
