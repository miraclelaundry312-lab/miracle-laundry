import mongoose, { Schema, Document } from 'mongoose';

export interface IBranchRegistry extends Document {
  name: string;
  code: string;
  url: string;
  apiKey: string;
  location: string;
  phone: string;
  managerName: string;
  isSelf: boolean;
  isActive: boolean;
  notes: string;
  lastSyncedAt?: Date;
  lastStatus?: 'online' | 'offline' | 'untested';
  lastPingMs?: number;
  createdAt: Date;
  updatedAt: Date;
}

const BranchRegistrySchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, default: 'ML-01', trim: true },
    url: { type: String, required: true, trim: true },
    apiKey: { type: String, default: 'miracle-secret-key-2026', trim: true },
    location: { type: String, default: 'Main Studio' },
    phone: { type: String, default: '' },
    managerName: { type: String, default: '' },
    isSelf: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    notes: { type: String, default: '' },
    lastSyncedAt: { type: Date },
    lastStatus: { type: String, enum: ['online', 'offline', 'untested'], default: 'untested' },
    lastPingMs: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IBranchRegistry>('BranchRegistry', BranchRegistrySchema);
