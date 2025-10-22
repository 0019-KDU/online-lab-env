import api from './api';

// Register student by admin
export const registerStudent = async (studentData) => {
  const response = await api.post('/admin/register-student', studentData);
  return response.data;
};

// Get all students
export const getAllStudents = async () => {
  const response = await api.get('/admin/students');
  return response.data;
};

// Get single student
export const getStudentById = async (id) => {
  const response = await api.get(`/admin/students/${id}`);
  return response.data;
};

// Update student
export const updateStudent = async (id, studentData) => {
  const response = await api.put(`/admin/students/${id}`, studentData);
  return response.data;
};

// Delete student
export const deleteStudent = async (id) => {
  const response = await api.delete(`/admin/students/${id}`);
  return response.data;
};
