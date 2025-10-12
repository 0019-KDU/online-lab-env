import mongoose from 'mongoose';

const labTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['network-security', 'web-security', 'forensics', 'malware-analysis', 'general'],
    default: 'general',
  },
  image: {
    type: String,
    required: true,
  },
  resources: {
    cpu: {
      type: String,
      default: '1',
    },
    memory: {
      type: String,
      default: '2Gi',
    },
    storage: {
      type: String,
      default: '5Gi',
    },
  },
  preInstalledTools: [String],
  duration: {
    type: Number, // in minutes
    default: 120,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

export default mongoose.model('LabTemplate', labTemplateSchema);