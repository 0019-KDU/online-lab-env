import LabSession from '../models/LabSession.js';
import LabTemplate from '../models/LabTemplate.js';
import k8sService from '../services/k8sService.js';

// @desc    Get all active lab templates
// @route   GET /api/labs/templates
// @access  Private
export const getTemplates = async (req, res) => {
  try {
    const templates = await LabTemplate.find({ isActive: true });
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ message: 'Failed to fetch lab templates' });
  }
};

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

    // Create default lab configuration (no template needed)
    const defaultLabConfig = {
      name: 'Ubuntu Desktop Lab',
      image: process.env.LAB_IMAGE || 'registry.digitalocean.com/cyberlab-registry/ubuntu-desktop-lab:latest',
      resources: {
        cpu: '500m',    // Reduced from 1 core to 500m (0.5 core)
        memory: '1Gi',  // Reduced from 2Gi to 1Gi
      },
      duration: 120, // 2 hours in minutes
    };

    // Define namespace before creating session
    const namespace = process.env.K8S_NAMESPACE || 'student-labs';

    // Create lab session record
    const labSession = await LabSession.create({
      student: studentId,
      labTemplate: null, // No template needed
      podName: `lab-${studentId}-${Date.now()}`,
      namespace: namespace,
      status: 'pending',
      autoShutdownTime: new Date(Date.now() + defaultLabConfig.duration * 60000),
    });

    try {
      // Deploy pod in Kubernetes
      const deploymentResult = await k8sService.deployLabPod(labSession, defaultLabConfig);

      // Update session with deployment details
      labSession.status = 'running';
      labSession.accessUrl = deploymentResult.accessUrl;
      labSession.vncPort = deploymentResult.vncPort;
      await labSession.save();

      res.status(201).json(labSession);
    } catch (deployError) {
      // If deployment fails, update session status
      labSession.status = 'failed';
      await labSession.save();
      throw deployError;
    }
  } catch (error) {
    console.error('Error starting lab:', error);
    res.status(500).json({ 
      message: 'Failed to start lab',
      error: error.message 
    });
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

    if (!session) {
      return res.json(null);
    }

    res.json(session);
  } catch (error) {
    console.error('Error fetching session:', error);
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
      return res.status(404).json({ message: 'No active lab session found' });
    }

    // Delete pod from Kubernetes
    try {
      await k8sService.deleteLabPod(session.podName, session.namespace);
    } catch (k8sError) {
      console.error('Error deleting K8s pod:', k8sError);
      // Continue anyway to update database
    }

    // Update session
    session.status = 'stopped';
    session.endTime = new Date();
    await session.save();

    res.json({ 
      message: 'Lab session stopped successfully',
      session 
    });
  } catch (error) {
    console.error('Error stopping lab:', error);
    res.status(500).json({ message: error.message });
  }
};