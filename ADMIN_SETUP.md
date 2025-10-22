# Admin Student Registration System - Setup Guide

## Overview
This system allows admins to register students and automatically sends login credentials via email.

## Features Implemented

### Backend Changes

1. **Student Model Updated** ([backend/src/models/Student.js](backend/src/models/Student.js))
   - Added `registrationNumber` field (unique)
   - Added `enrollDate` field (Date)
   - Added `endDate` field (Date)

2. **Email Service** ([backend/src/utils/emailService.js](backend/src/utils/emailService.js))
   - Sends professionally formatted HTML emails
   - Includes student credentials and welcome message
   - Includes enrollment details

3. **Admin Controller** ([backend/src/controllers/adminController.js](backend/src/controllers/adminController.js))
   - `registerStudent`: Register new student with auto-generated password
   - `getAllStudents`: Get list of all students
   - `getStudentById`: Get single student details
   - `updateStudent`: Update student information
   - `deleteStudent`: Delete student account

4. **Admin Routes** ([backend/src/routes/admin.js](backend/src/routes/admin.js))
   - `POST /api/admin/register-student` - Register new student
   - `GET /api/admin/students` - Get all students
   - `GET /api/admin/students/:id` - Get single student
   - `PUT /api/admin/students/:id` - Update student
   - `DELETE /api/admin/students/:id` - Delete student

### Frontend Changes

1. **Admin Dashboard** ([frontend/src/pages/AdminDashboard.jsx](frontend/src/pages/AdminDashboard.jsx))
   - Student registration form with all required fields
   - Student list table with search and filter
   - Edit and delete functionality
   - Real-time status updates

2. **Admin Service** ([frontend/src/services/adminService.js](frontend/src/services/adminService.js))
   - API calls for all admin operations

3. **Routing** ([frontend/src/App.jsx](frontend/src/App.jsx))
   - Added `/admin` route for admin dashboard

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

This will install the newly added `nodemailer` package.

### 2. Configure Email Settings

Update the following variables in your `backend/.env` file:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM_NAME=CyberLab Admin
FRONTEND_URL=http://localhost:5173
```

#### For Gmail Users:
1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Copy the 16-character password
   - Use this as `EMAIL_PASSWORD`

#### For Other Email Providers:
Update `EMAIL_HOST` and `EMAIL_PORT` accordingly:
- **Outlook/Hotmail**: `smtp-mail.outlook.com`, port `587`
- **Yahoo**: `smtp.mail.yahoo.com`, port `587`
- **Custom SMTP**: Use your provider's settings

### 3. Create Admin User

You need to manually create an admin user in the database or update an existing user's role to 'admin'.

**Option 1: Using MongoDB Compass or CLI**
```javascript
db.students.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

**Option 2: Create new admin via registration then update**
1. Register a normal account
2. Update the role in database to 'admin'

### 4. Start the Application

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 5. Access Admin Dashboard

1. Login with your admin credentials
2. Navigate to `/admin` or `http://localhost:5173/admin`

## Student Registration Flow

1. **Admin fills registration form** with:
   - First Name
   - Last Name
   - Email (will be used as username)
   - Registration Number
   - Enroll Date
   - End Date (optional)

2. **System automatically**:
   - Generates a random secure password
   - Creates student account in database
   - Sends email to student with credentials

3. **Email contains**:
   - Student Name
   - Email (username)
   - Generated Password
   - Registration Number
   - Enrollment Date
   - End Date (if provided)
   - Login link

4. **Student receives email** and can login with:
   - **Username**: Their email address
   - **Password**: Auto-generated password from email

## Student Login Credentials Format

**Email sent to student includes:**
- **Email (Username)**: student@example.com
- **Password**: Auto-generated (e.g., Xy9#mK2@pL)
- **Registration Number**: REG123456
- **Enrollment Date**: 2025-01-15
- **End Date**: 2025-12-31

## Admin Dashboard Features

### Student Registration
- Fill out form with required fields
- System auto-generates secure password
- Email sent automatically to student

### Student Management
- View all registered students in table
- See enrollment details and status
- Edit student information
- Delete student accounts
- Filter and search capabilities

### Student List Columns
- Name
- Email
- Registration Number
- Enroll Date
- End Date
- Status (Active/Inactive)
- Actions (Edit/Delete)

## API Endpoints

### Admin Routes (Require Admin Role)

**Register Student**
```
POST /api/admin/register-student
Authorization: Bearer <admin-token>

Body:
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "student@example.com",
  "registrationNumber": "REG123456",
  "enrollDate": "2025-01-15",
  "endDate": "2025-12-31"
}

Response:
{
  "message": "Student registered successfully and credentials sent via email",
  "student": {
    "_id": "...",
    "email": "student@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "registrationNumber": "REG123456",
    "enrollDate": "2025-01-15",
    "endDate": "2025-12-31",
    "role": "student"
  }
}
```

**Get All Students**
```
GET /api/admin/students
Authorization: Bearer <admin-token>

Response:
{
  "count": 10,
  "students": [...]
}
```

**Get Single Student**
```
GET /api/admin/students/:id
Authorization: Bearer <admin-token>
```

**Update Student**
```
PUT /api/admin/students/:id
Authorization: Bearer <admin-token>

Body:
{
  "firstName": "Updated Name",
  "endDate": "2026-01-01"
}
```

**Delete Student**
```
DELETE /api/admin/students/:id
Authorization: Bearer <admin-token>
```

## Security Features

1. **Password Generation**: 10-character random password with special characters
2. **Role-Based Access**: Only users with 'admin' role can access admin routes
3. **JWT Authentication**: All admin routes require valid JWT token
4. **Email Validation**: Email format validated before registration
5. **Unique Constraints**: Email and registration number must be unique

## Troubleshooting

### Email Not Sending
1. Check email credentials in `.env`
2. Ensure "Less secure app access" is enabled (Gmail)
3. Check firewall/network settings for SMTP port
4. Review backend console for error messages

### Admin Access Denied
1. Verify user role is set to 'admin' in database
2. Check JWT token is valid and not expired
3. Ensure admin routes are properly protected

### Student Cannot Login
1. Check if email was sent successfully
2. Verify student account exists in database
3. Ensure password from email matches
4. Check if student account is active

## Email Template Customization

To customize the email template, edit [backend/src/utils/emailService.js](backend/src/utils/emailService.js):

- Update HTML/CSS in the `html` field
- Modify text version in the `text` field
- Change email subject
- Update branding and styling

## Notes

- Students receive email with plaintext password for initial login
- Recommend implementing "change password on first login" feature
- Email sending is non-blocking - registration succeeds even if email fails
- Admin will see error message if email fails but student is still created
- System returns generated password to admin if email fails
