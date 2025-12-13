/**
 * User Model
 * Handles all user data including professional profile information (LinkedIn-style)
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { IUser, UserRole, IExperience, IEducation } from '@/types';

// Document interface for Mongoose
export interface IUserDocument extends Omit<IUser, '_id'>, Document {}

// Experience sub-schema
const ExperienceSchema = new Schema<IExperience>(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    current: { type: Boolean, default: false },
    description: { type: String, trim: true, maxlength: 2000 },
  },
  { _id: true }
);

// Education sub-schema
const EducationSchema = new Schema<IEducation>(
  {
    school: { type: String, required: true, trim: true },
    degree: { type: String, required: true, trim: true },
    field: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    current: { type: Boolean, default: false },
  },
  { _id: true }
);

// Main User schema
const UserSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Never return password hash by default
    },
    role: {
      type: String,
      enum: ['user', 'creator', 'recruiter', 'admin'] as UserRole[],
      default: 'user',
    },
    headline: {
      type: String,
      trim: true,
      maxlength: [220, 'Headline cannot exceed 220 characters'],
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [2600, 'Bio cannot exceed 2600 characters'],
    },
    avatar: {
      type: String,
      trim: true,
    },
    coverImage: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
      maxlength: [100, 'Location cannot exceed 100 characters'],
    },
    website: {
      type: String,
      trim: true,
    },
    skills: [{
      type: String,
      trim: true,
      maxlength: 50,
    }],
    experience: [ExperienceSchema],
    education: [EducationSchema],
    isVerified: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret: Record<string, unknown>) => {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for efficient queries
UserSchema.index({ 'skills': 1 });
UserSchema.index({ name: 'text', headline: 'text', bio: 'text' });

// Static methods
UserSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

UserSchema.statics.findByUsername = function (username: string) {
  return this.findOne({ username: username.toLowerCase() });
};

// Instance methods
UserSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.email;
  delete obj.__v;
  return obj;
};

// Prevent model recompilation in development
const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);

export default User;
