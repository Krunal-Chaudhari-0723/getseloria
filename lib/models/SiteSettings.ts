import mongoose, { Schema, Document } from 'mongoose';

export interface ISiteSettings extends Document {
  type: string;
  contact: {
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    country: string;
    mapUrl: string;
    businessHours: string;
    instagramUrl: string;
    facebookUrl: string;
  };
  terms: string;
  updatedAt: Date;
}

const SiteSettingsSchema = new Schema(
  {
    type: { type: String, required: true, unique: true, default: 'main' },
    contact: {
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
      address: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      country: { type: String, default: 'India' },
      mapUrl: { type: String, default: '' },
      businessHours: { type: String, default: 'Mon – Sat: 10:00 AM – 7:00 PM' },
      instagramUrl: { type: String, default: '' },
      facebookUrl: { type: String, default: '' },
    },
    terms: { type: String, default: '' },
    categories: { type: [String], default: ['Necklace', 'Ring', 'Earring', 'Bracelet', 'Pendant', 'Bangle'] },
  },
  { timestamps: true }
);

export default mongoose.models.SiteSettings ||
  mongoose.model<ISiteSettings>('SiteSettings', SiteSettingsSchema);
