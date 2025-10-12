import mongoose from 'mongoose';

const labSessionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  labTemplate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabTemplate',
    required: false, // ← Changed to false (optional)
  },
  podName: {
    type: String,
    required: true,
  },
  namespace: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'stopped', 'failed', 'terminated'],
    default: 'pending',
  },
  accessUrl: {
    type: String,
  },
  vncPort: {
    type: Number,
  },
  startTime: {
    type: Date,
    default: Date.now,
  },
  endTime: {
    type: Date,
  },
  lastAccessTime: {
    type: Date,
    default: Date.now,
  },
  autoShutdownTime: {
    type: Date,
  },
  resourceUsage: {
    cpu: String,
    memory: String,
  },
}, {
  timestamps: true,
});

// Auto-cleanup index
labSessionSchema.index({ endTime: 1 }, { expireAfterSeconds: 86400 }); // 24 hours

export default mongoose.model('LabSession', labSessionSchema);