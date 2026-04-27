import mongoose from 'mongoose';

const UserProfileSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  name: { type: String, required: true },
  age: { type: String },
  bloodType: { type: String },
  docType: { type: String, default: 'Aadhar' },
  docId: { type: String },
  medicalConditions: { type: String },
  allergies: { type: String },
  medications: { type: String },
  surgeries: { type: String },
  disability: { type: String },
  preferredHospital: { type: String },
  preferredDoctor: { type: String },
  emergencyContactName: { type: String },
  emergencyContactPhone: { type: String },
  shareLiveLocation: { type: Boolean, default: true }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

export const UserProfile = mongoose.model('UserProfile', UserProfileSchema);
