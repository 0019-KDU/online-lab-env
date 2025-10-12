import jwt from 'jsonwebtoken';
import Student from '../models/Student.js';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// @desc    Register new student
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, studentId } = req.body;

    // Check if student exists
    const studentExists = await Student.findOne({ email });

    if (studentExists) {
      return res.status(400).json({ message: 'Student already exists' });
    }

    // Create student
    const student = await Student.create({
      email,
      password,
      firstName,
      lastName,
      studentId,
    });

    if (student) {
      res.status(201).json({
        _id: student._id,
        email: student.email,
        firstName: student.firstName,
        lastName: student.lastName,
        role: student.role,
        token: generateToken(student._id),
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login student
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for student email
    const student = await Student.findOne({ email });

    if (student && (await student.matchPassword(password))) {
      res.json({
        _id: student._id,
        email: student.email,
        firstName: student.firstName,
        lastName: student.lastName,
        role: student.role,
        token: generateToken(student._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current student profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const student = await Student.findById(req.student._id).select('-password');
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};