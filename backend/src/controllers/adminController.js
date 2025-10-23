import Student from '../models/Student.js';
import { sendStudentCredentials } from '../utils/emailService.js';

// Generate random password
const generatePassword = () => {
  const length = 10;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

// Generate unique studentId
const generateStudentId = async () => {
  const year = new Date().getFullYear();
  let isUnique = false;
  let studentId = '';
  
  while (!isUnique) {
    const randomNum = Math.floor(100000 + Math.random() * 900000); // 6-digit random number
    studentId = `STD${year}${randomNum}`;
    
    // Check if this studentId already exists
    const exists = await Student.findOne({ studentId: studentId });
    if (!exists) {
      isUnique = true;
    }
  }
  
  return studentId;
};

// @desc    Register student by admin
// @route   POST /api/admin/register-student
// @access  Private/Admin
export const registerStudent = async (req, res) => {
  try {
    const {
      email,
      firstName,
      lastName,
      registrationNumber,
      enrollDate,
      endDate
    } = req.body;

    // Validate required fields
    if (!email || !firstName || !lastName || !registrationNumber || !enrollDate) {
      return res.status(400).json({
        message: 'Please provide all required fields: email, firstName, lastName, registrationNumber, and enrollDate'
      });
    }

    // Auto-generate unique studentId
    const generatedStudentId = await generateStudentId();
    console.log(`Auto-generated studentId: ${generatedStudentId}`);

    // Check if student already exists
    const studentExists = await Student.findOne({
      $or: [{ email }, { registrationNumber }]
    });

    if (studentExists) {
      if (studentExists.email === email) {
        return res.status(400).json({ message: 'Student with this email already exists' });
      }
      if (studentExists.registrationNumber === registrationNumber) {
        return res.status(400).json({ message: 'Student with this registration number already exists' });
      }
    }

    // Generate random password
    const generatedPassword = generatePassword();

    // Create student
    const student = await Student.create({
      email,
      password: generatedPassword,
      firstName,
      lastName,
      studentId: generatedStudentId,
      registrationNumber,
      enrollDate,
      endDate: endDate || null,
      role: 'student',
      isActive: true,
    });

    if (student) {
      // Prepare email data with plain password
      const emailData = {
        email: student.email,
        firstName: student.firstName,
        lastName: student.lastName,
        password: generatedPassword, // Send plain password in email
        registrationNumber: student.registrationNumber,
        enrollDate: student.enrollDate,
        endDate: student.endDate,
      };

      // Send email with credentials
      let emailSent = false;
      let emailError = null;
      
      try {
        await sendStudentCredentials(emailData);
        emailSent = true;
      } catch (err) {
        console.error('Failed to send email:', err);
        emailError = err.message;
      }

      // Always return student data with credentials
      const response = {
        message: emailSent 
          ? 'Student registered successfully and credentials sent via email' 
          : '⚠️ Student registered successfully, but email failed. Please share these credentials manually:',
        student: {
          _id: student._id,
          email: student.email,
          firstName: student.firstName,
          lastName: student.lastName,
          studentId: student.studentId,  // Include auto-generated studentId
          registrationNumber: student.registrationNumber,
          enrollDate: student.enrollDate,
          endDate: student.endDate,
          role: student.role,
        },
        credentials: !emailSent ? {
          email: student.email,
          password: generatedPassword,
          studentId: student.studentId,
          loginUrl: process.env.FRONTEND_URL || 'http://152-42-156-112.nip.io'
        } : undefined,
      };

      if (emailError) {
        response.emailError = emailError;
      }

      res.status(201).json(response);
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all students
// @route   GET /api/admin/students
// @access  Private/Admin
export const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find({ role: 'student' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      count: students.length,
      students,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single student
// @route   GET /api/admin/students/:id
// @access  Private/Admin
export const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .select('-password')
      .populate('activeLabSessions');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update student
// @route   PUT /api/admin/students/:id
// @access  Private/Admin
export const updateStudent = async (req, res) => {
  try {
    const { firstName, lastName, email, registrationNumber, enrollDate, endDate, isActive } = req.body;

    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Update fields
    if (firstName) student.firstName = firstName;
    if (lastName) student.lastName = lastName;
    if (email) student.email = email;
    if (registrationNumber) student.registrationNumber = registrationNumber;
    if (enrollDate) student.enrollDate = enrollDate;
    if (endDate !== undefined) student.endDate = endDate;
    if (isActive !== undefined) student.isActive = isActive;

    const updatedStudent = await student.save();

    res.json({
      message: 'Student updated successfully',
      student: {
        _id: updatedStudent._id,
        email: updatedStudent.email,
        firstName: updatedStudent.firstName,
        lastName: updatedStudent.lastName,
        registrationNumber: updatedStudent.registrationNumber,
        enrollDate: updatedStudent.enrollDate,
        endDate: updatedStudent.endDate,
        isActive: updatedStudent.isActive,
        role: updatedStudent.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete student
// @route   DELETE /api/admin/students/:id
// @access  Private/Admin
export const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    await student.deleteOne();

    res.json({ message: 'Student removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
