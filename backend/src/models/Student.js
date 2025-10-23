import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const studentSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  studentId: {
    type: String,
    unique: true,
    sparse: true, // Allow multiple null values
  },
  registrationNumber: {
    type: String,
    unique: true,
    sparse: true,
  },
  enrollDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  enrolledCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
  }],
  activeLabSessions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabSession',
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  role: {
    type: String,
    enum: ['student', 'instructor', 'admin'],
    default: 'student',
  },
}, {
  timestamps: true,
});

// Hash password before saving
studentSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
studentSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('Student', studentSchema);