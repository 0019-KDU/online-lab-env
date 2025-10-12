import LabSession from '../models/LabSession.js';
import LabTemplate from '../models/LabTemplate.js';
import k8sService from '../services/k8sService.js';

// @desc    Get all available lab templates
// @route   GET /api/labs/templates
// @access  Private
export const getLabTemplates = async (req, res) => {
  try {
    const templates = await LabTemplate.find({ isActive: true });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Start a new lab session
// @route   POST /api/labs/start
// @access  Private
export const startLab = async (req, res) => {
  try {
    const { templateId } = req.body;
    const studentId = req.student._id;

    // Check active sessions limit
    const activeSessions = await LabSession.countDocuments({
      student: studentId,
      status: 'running',
    });

    if (activeSessions >= parseInt(process.env.MAX_CONCURRENT_LABS)) {
      return res.status(400).json({
        message: `Maximum ${process.env.MAX_CONCURRENT_LABS} concurrent labs allowed`,
      });
    }

    // Get lab template
    const template = await LabTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({ message: 'Lab template not found' });
    }

    // Create lab session record
    const labSession = await LabSession.create({
      student: studentId,
      labTemplate: templateId,
      podName: `lab-${studentId}-${Date.now()}`,
      namespace: process.env.K8S_NAMESPACE,
      status: 'pending',
      autoShutdownTime: new Date(Date.now() + template.duration * 60000),
    });

    // Deploy pod in Kubernetes (we'll implement this service next)
    const deploymentResult = await k8sService.deployLabPod(labSession, template);

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

// @desc    Get student's active lab sessions
// @route   GET /api/labs/my-sessions
// @access  Private
export const getMySessions = async (req, res) => {
  try {
    const sessions = await LabSession.find({
      student: req.student._id,
      status: { $in: ['running', 'pending'] },
    }).populate('labTemplate');

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Stop a lab session
// @route   POST /api/labs/:sessionId/stop
// @access  Private
export const stopLab = async (req, res) => {
  try {
    const session = await LabSession.findById(req.params.sessionId);

    if (!session) {
      return res.status(404).json({ message: 'Lab session not found' });
    }

    // Check ownership
    if (session.student.toString() !== req.student._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
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