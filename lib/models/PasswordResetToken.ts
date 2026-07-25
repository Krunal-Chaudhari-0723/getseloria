import mongoose from 'mongoose';

const PasswordResetTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  tokenHash: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true,
  },
}, { timestamps: true });

export default mongoose.models.PasswordResetToken || mongoose.model('PasswordResetToken', PasswordResetTokenSchema);
  