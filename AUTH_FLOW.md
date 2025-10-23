# Authentication & Authorization Flow

## Overview
Both admin and student users share the **same login page** but are redirected to **different dashboards** based on their role.

---

## User Roles

### 👨‍🎓 **Student Role** (`role: 'student'`)
- **Access:** Ubuntu Desktop Lab Environment
- **Permissions:**
  - Start/Stop lab sessions
  - View own lab sessions
  - Cannot access admin functions

### 👨‍💼 **Admin Role** (`role: 'admin'`)
- **Access:** Student Management Dashboard + Lab Environment
- **Permissions:**
  - Register new students
  - View all students
  - Edit student details
  - Delete students
  - Can also access lab environment

---

## Login Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    http://152-42-156-112.nip.io/login       │
│                      (Same Login Page)                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    Enter Email & Password
                              ↓
                    POST /api/auth/login
                              ↓
              ┌───────────────┴───────────────┐
              ↓                               ↓
     ┌────────────────┐              ┌────────────────┐
     │ role: 'admin'  │              │ role: 'student'│
     └────────────────┘              └────────────────┘
              ↓                               ↓
     ┌────────────────┐              ┌────────────────┐
     │   /admin       │              │  /dashboard    │
     │ (Admin Panel)  │              │  (Lab Environment)
     └────────────────┘              └────────────────┘
```

---

## Route Protection

### Public Routes
- `/login` - Login page
- `/register` - Student self-registration (if enabled)

### Protected Routes (Requires Authentication)
- `/dashboard` - Lab environment (Both admin & student)
- `/labs` - Lab templates (Student only)
- `/sessions` - Session history (Student only)

### Admin-Only Routes (Requires `role: 'admin'`)
- `/admin` - Student management dashboard

---

## Navigation Menu

### Student View
```
├── 🏠 My Lab (/dashboard)
```

### Admin View
```
├── 👥 Student Management (/admin)
├── 🧪 My Lab (/dashboard)
```

---

## Implementation Details

### Backend (Node.js/Express)

**Login Endpoint:** `POST /api/auth/login`
```javascript
// Returns user object with role
{
  _id: "...",
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe",
  role: "admin" | "student",  // ← Role determines access
  token: "jwt_token_here"
}
```

### Frontend (React)

**Login Form:** `frontend/src/components/auth/LoginForm.jsx`
```javascript
// Redirects based on role
if (user?.role === 'admin') {
  navigate('/admin');
} else {
  navigate('/dashboard');
}
```

**Route Protection:** `frontend/src/components/auth/AdminRoute.jsx`
```javascript
// Checks if user.role === 'admin'
if (user?.role !== 'admin') {
  return <Navigate to="/dashboard" replace />;
}
```

**Sidebar Navigation:** `frontend/src/components/layout/Sidebar.jsx`
```javascript
// Different menu items based on role
const navigation = user?.role === 'admin' 
  ? [
      { name: 'Student Management', href: '/admin' },
      { name: 'My Lab', href: '/dashboard' },
    ]
  : [
      { name: 'My Lab', href: '/dashboard' },
    ];
```

---

## User Creation

### Creating Admin User
Admins are created directly in MongoDB:
```javascript
// Use backend/scripts/hashPassword.js to generate password hash
node backend/scripts/hashPassword.js

// Then insert into MongoDB Atlas:
{
  firstName: "Admin",
  lastName: "User",
  email: "admin@university.edu",
  password: "$2a$10$...", // hashed password
  role: "admin",
  isActive: true
}
```

### Creating Student User
Students are registered by admins via the admin dashboard:
1. Admin logs in → `/admin`
2. Click "Register New Student"
3. Fill in student details
4. System generates random password
5. Email sent to student with credentials

---

## Security Features

### JWT Authentication
- Token stored in localStorage
- Expires in 30 days (default)
- Required for all protected routes

### Role-Based Access Control (RBAC)
- Middleware checks `req.student.role`
- Frontend route guards prevent unauthorized access
- Admin routes reject non-admin users

### Password Security
- bcrypt hashing (10 salt rounds)
- Passwords never stored in plain text
- Students receive temporary passwords via email

---

## Testing the Flow

### Test Admin Login
```
Email: admin@university.edu
Password: [your admin password]
Expected: Redirect to /admin (Student Management)
```

### Test Student Login
```
Email: [student email from registration]
Password: [password from email]
Expected: Redirect to /dashboard (Lab Environment)
```

### Test Access Control
1. Login as student
2. Try to access: http://152-42-156-112.nip.io/admin
3. Expected: Automatically redirected to /dashboard

---

## Summary

✅ **Same Login Page** - Both roles use `/login`
✅ **Role-Based Redirect** - Automatic routing after login
✅ **Access Control** - Routes protected by role checks
✅ **Different Dashboards:**
   - Admin: Student management panel
   - Student: Ubuntu lab environment
✅ **Flexible Navigation** - Sidebar adapts to user role
