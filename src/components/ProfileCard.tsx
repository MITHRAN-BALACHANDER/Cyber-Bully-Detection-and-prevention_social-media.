/**
 * ProfileCard Component
 * LinkedIn-style profile summary card
 */

'use client';

import Link from 'next/link';
import { Briefcase, MapPin, GraduationCap, Users, Edit2, Camera } from 'lucide-react';
import { Avatar, Button, Card } from '@/components/ui';
import { formatCount } from '@/lib/utils';
import type { User } from '@/types';

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
    <Card className="overflow-hidden p-0">
      {/* Cover Photo */}
      <div className="relative h-32 bg-gradient-to-r from-primary-600 to-primary-400">
        {user.coverImage && (
          <img
            src={user.coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        )}
        {isOwnProfile && (
          <button
            onClick={onEditCover}
            className="absolute top-2 right-2 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full transition-colors"
          >
            <Camera className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Avatar */}
      <div className="relative px-6 pb-4">
        <div className="-mt-16 mb-3">
          <Avatar
            src={user.avatar}
            name={user.name}
            size="xl"
            className="border-4 border-white shadow-md !w-24 !h-24 !text-2xl"
          />
        </div>

        {/* Name & Headline */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            {user.headline && (
              <p className="text-gray-600 mt-0.5">{user.headline}</p>
            )}
          </div>
          
          {isOwnProfile && (
            <Button variant="ghost" size="sm" onClick={onEditProfile}>
              <Edit2 className="w-4 h-4 mr-1" />
              Edit
            </Button>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
          {currentPosition && (
            <div className="flex items-center gap-1">
              <Briefcase className="w-4 h-4" />
              <span>{currentPosition.title} at {currentPosition.company}</span>
            </div>
          )}
          
          {currentEducation && (
            <div className="flex items-center gap-1">
              <GraduationCap className="w-4 h-4" />
              <span>{currentEducation.school}</span>
            </div>
          )}
          
          {user.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{user.location}</span>
            </div>
          )}
        </div>

        {/* Connections */}
        <Link
          href={`/profile/${user.username}/connections`}
          className="flex items-center gap-1 text-sm text-primary-600 hover:underline mt-3"
        >
          <Users className="w-4 h-4" />
          <span>{formatCount(connections)} connections</span>
        </Link>

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
          <div className="mt-6 pt-4 border-t border-surface-border">
            <h3 className="font-semibold text-gray-900 mb-2">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {user.skills.slice(0, 10).map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full"
                >
                  {skill}
                </span>
              ))}
              {user.skills.length > 10 && (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
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
