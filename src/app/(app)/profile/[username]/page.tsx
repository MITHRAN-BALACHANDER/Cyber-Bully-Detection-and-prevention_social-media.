'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { ProfileCard, PostCard, MediaGrid, Card } from '@/components';
import { useAuthStore } from '@/store';
import { cn } from '@/lib/utils';
import type { User, PopulatedPost, PopulatedMedia, Connection } from '@/types';

type ProfileTab = 'posts' | 'media' | 'about';

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  
  const username = params.username as string;
  const isOwnProfile = currentUser?.username === username;

  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<PopulatedPost[]>([]);
  const [media, setMedia] = useState<PopulatedMedia[]>([]);
  const [connections, setConnections] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'connected'>('none');
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/users/${username}`);
      const data = await response.json();

      if (data.success) {
        setUser(data.data);
        // TODO: Fetch connection status from API
      } else {
        // User not found
        router.push('/404');
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, [username, router]);

  const fetchPosts = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/posts?author=${user._id}`);
      const data = await response.json();
      if (data.success) {
        setPosts(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    }
  }, [user]);

  const fetchMedia = useCallback(async () => {
    try {
      const response = await fetch(`/api/media/user/${username}`);
      const data = await response.json();
      if (data.success) {
        setMedia(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch media:', error);
    }
  }, [username]);

  const fetchConnections = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/network/connections?userId=${user._id}`);
      const data = await response.json();
      if (data.success) {
        setConnections(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch connections:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (user) {
      fetchPosts();
      fetchMedia();
      fetchConnections();
    }
  }, [user, fetchPosts, fetchMedia, fetchConnections]);

  const handleConnect = async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/network/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: user._id }),
      });
      const data = await response.json();
      if (data.success) {
        setConnectionStatus('pending');
      }
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  const handleMessage = () => {
    if (user) {
      router.push(`/chat?user=${user._id}`);
    }
  };

  const handleEditProfile = () => {
    router.push('/settings');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">User not found</h1>
        <p className="text-muted-foreground mt-2">The user you&apos;re looking for doesn&apos;t exist.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[900px]">
      {/* Profile Card */}
      <ProfileCard
        user={user}
        connections={connections}
        isOwnProfile={isOwnProfile}
        connectionStatus={connectionStatus}
        onConnect={handleConnect}
        onMessage={handleMessage}
        onEditProfile={handleEditProfile}
      />

      {/* Tabs */}
      <Card className="mt-6 p-2">
        <div className="flex gap-2">
          {(['posts', 'media', 'about'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-5 py-2.5 text-sm font-semibold transition-all duration-200 rounded-2xl flex-1',
                activeTab === tab
                  ? 'bg-white/6 text-foreground shadow-[0_0_0_1px_var(--border)_inset]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </Card>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === 'posts' && (
          <div className="space-y-4">
            {posts.length > 0 ? (
              posts.map((post) => (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <PostCard post={post} />
                </motion.div>
              ))
            ) : (
              <Card className="text-center py-12">
                <p className="text-muted-foreground">No posts yet</p>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'media' && (
          <div>
            {media.length > 0 ? (
              <MediaGrid media={media} columns={3} />
            ) : (
              <Card className="text-center py-12">
                <p className="text-muted-foreground">No media yet</p>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'about' && (
          <Card>
            {/* Experience */}
            {user.experience && user.experience.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-foreground mb-3">Experience</h3>
                <div className="space-y-4">
                  {user.experience.map((exp, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                        <span className="text-lg font-semibold text-muted-foreground">
                          {exp.company.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{exp.title}</p>
                        <p className="text-muted-foreground">{exp.company}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          {' — '}
                          {exp.endDate
                            ? new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                            : 'Present'}
                        </p>
                        {exp.description && (
                          <p className="text-muted-foreground mt-2">{exp.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {user.education && user.education.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-foreground mb-3">Education</h3>
                <div className="space-y-4">
                  {user.education.map((edu, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                        <span className="text-lg font-semibold text-muted-foreground">
                          {edu.school.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{edu.school}</p>
                        <p className="text-muted-foreground">{edu.degree} in {edu.field}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(edu.startDate).getFullYear()} — {edu.endDate ? new Date(edu.endDate).getFullYear() : 'Present'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {user.skills && user.skills.length > 0 && (
              <div>
                <h3 className="font-semibold text-foreground mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {user.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-white/5 text-foreground text-sm rounded-full border border-white/5"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!user.experience?.length && !user.education?.length && !user.skills?.length && (
              <p className="text-muted-foreground text-center py-8">
                No additional information available
              </p>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
