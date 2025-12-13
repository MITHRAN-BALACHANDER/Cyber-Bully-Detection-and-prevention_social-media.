/**
 * ProfileCard Component
 * LinkedIn-style profile summary card
 */

'use client';

import Link from 'next/link';
import { Briefcase, MapPin, GraduationCap, Users, Edit2, Camera, Flame } from 'lucide-react';
import { Avatar, Button, Card } from '@/components/ui';
import { cn, formatCount } from '@/lib/utils';
import type { User, Connection } from '@/types';

interface ProfileCardProps {
  user: User;
  connections?: number;
  isOwnProfile?: boolean;
  connectionStatus?: 'none' | 'pending' | 'connected';
  onConnect?: () => void;
  onMessage?: () => void;
  onEditProfile?: () => void;
  onEditCover?: () => void;
}

export function ProfileCard({
  user,
  connections = 0,
  isOwnProfile = false,
  connectionStatus = 'none',
  onConnect,
  onMessage,
  onEditProfile,
  onEditCover,
}: ProfileCardProps) {
  const currentPosition = user.experience?.[0];
  const currentEducation = user.education?.[0];

  return (
    <Card className="overflow-hidden p-0 shadow-lg">
      {/* Cover Photo */}
      <div className="relative h-48 bg-gradient-to-br from-primary-600 via-primary-500 to-primary-400">
        {user.coverImage && (
          <img
            src={user.coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        {isOwnProfile && (
          <button
            onClick={onEditCover}
            className="absolute top-4 right-4 p-2.5 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-xl transition-all duration-200 shadow-lg"
          >
            <Camera className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Avatar */}
      <div className="relative px-6 sm:px-8 pb-6">
        <div className="-mt-20 mb-4">
          <Avatar
            src={user.avatar}
            name={user.name}
            size="xl"
            className="border-4 border-white shadow-xl !w-32 !h-32 !text-3xl"
          />
        </div>

        {/* Name & Headline */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 truncate">{user.name}</h1>
            {user.headline && (
              <p className="text-gray-600 mt-1 text-lg">{user.headline}</p>
            )}
          </div>
          
          {isOwnProfile && (
            <Button variant="secondary" size="sm" onClick={onEditProfile}>
              <Edit2 className="w-4 h-4 mr-1.5" />
              <span>Edit</span>
            </Button>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
          {currentPosition && (
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              <span className="font-medium">{currentPosition.title} at {currentPosition.company}</span>
            </div>
          )}
          
          {currentEducation && (
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              <span className="font-medium">{currentEducation.school}</span>
            </div>
          )}
          
          {user.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="font-medium">{user.location}</span>
            </div>
          )}
        </div>

        {/* Connections & Streak */}
        <div className="flex items-center gap-4 mt-4">
          <Link
            href={`/profile/${user.username}/connections`}
            className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-semibold group"
          >
            <Users className="w-4 h-4" />
            <span className="group-hover:underline">{formatCount(connections)} connections</span>
          </Link>
          
          {user.streak && user.streak.currentStreak > 0 && (
            <div className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-1.5 bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-700 rounded-xl border border-orange-200">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>{user.streak.currentStreak} day streak</span>
            </div>
          )}
        </div>

        {/* Bio */}
        {user.bio && (
          <p className="text-gray-700 mt-4 whitespace-pre-wrap">{user.bio}</p>
        )}

        {/* Action Buttons */}
        {!isOwnProfile && (
          <div className="flex gap-2 mt-4">
            {connectionStatus === 'none' && (
              <Button onClick={onConnect} className="flex-1">
                Connect
              </Button>
            )}
            {connectionStatus === 'pending' && (
              <Button variant="outline" disabled className="flex-1">
                Pending
              </Button>
            )}
            {connectionStatus === 'connected' && (
              <Button variant="outline" onClick={onMessage} className="flex-1">
                Message
              </Button>
            )}
          </div>
        )}

        {/* Skills */}
        {user.skills && user.skills.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-3 text-base">Skills & Expertise</h3>
            <div className="flex flex-wrap gap-2">
              {user.skills.slice(0, 10).map((skill, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-primary-50 text-primary-700 text-sm font-medium rounded-xl hover:bg-primary-100 transition-colors"
                >
                  {skill}
                </span>
              ))}
              {user.skills.length > 10 && (
                <span className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl">
                  +{user.skills.length - 10} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export default ProfileCard;
