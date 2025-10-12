import LabSession from '../models/LabSession.js';
import k8sService from '../services/k8sService.js';

// @desc    Start a new lab session (simple - no template selection)
// @route   POST /api/labs/start
// @access  Private
export const startLab = async (req, res) => {
  try {
    const studentId = req.student._id;

    // Check if student already has an active lab
    const existingSession = await LabSession.findOne({
      student: studentId,
      status: 'running',
    });

    if (existingSession) {
      return res.json(existingSession); // Return existing session
    }

    // Create default lab configuration
    const defaultLabConfig = {
      image: process.env.LAB_IMAGE || 'registry.digitalocean.com/cyberlab-registry/ubuntu-desktop-lab:latest',
      resources: {
        cpu: '1',
        memory: '2Gi',
      },
      duration: 120, // 2 hours
    };

    // Create lab session record
    const labSession = await LabSession.create({
      student: studentId,
      podName: `lab-${studentId}-${Date.now()}`,
      namespace: process.env.K8S_NAMESPACE,
      status: 'pending',
      autoShutdownTime: new Date(Date.now() + defaultLabConfig.duration * 60000),
    });

    // Deploy pod in Kubernetes
    const deploymentResult = await k8sService.deployLabPod(labSession, defaultLabConfig);

    // Update session with deployment details
    labSession.status = 'running';
    labSession.accessUrl = deploymentResult.accessUrl;
    labSession.vncPort = deploymentResult.vncPort;
    await labSession.save();

    res.status(201).json(labSession);
  } catch (error) {
    console.error('Error starting lab:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get student's active lab session
// @route   GET /api/labs/my-session
// @access  Private
export const getMySession = async (req, res) => {
  try {
    const session = await LabSession.findOne({
      student: req.student._id,
      status: 'running',
    });

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Stop lab session
// @route   POST /api/labs/stop
// @access  Private
export const stopLab = async (req, res) => {
  try {
    const session = await LabSession.findOne({
      student: req.student._id,
      status: 'running',
    });

    if (!session) {
      return res.status(404).json({ message: 'No active lab session' });
    }

    // Delete pod from Kubernetes
    await k8sService.deleteLabPod(session.podName, session.namespace);

    // Update session
    session.status = 'stopped';
    session.endTime = new Date();
    await session.save();

    res.json({ message: 'Lab session stopped successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};