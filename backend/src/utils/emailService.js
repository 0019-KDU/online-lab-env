import nodemailer from 'nodemailer';

// Create transporter
const createTransporter = () => {
  const port = parseInt(process.env.EMAIL_PORT) || 465;
  const secure = process.env.EMAIL_SECURE === 'true' || port === 465;
  
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: port,
    secure: secure, // true for 465, false for other ports
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false // Accept self-signed certificates
    }
  });
};

// Send student credentials email
export const sendStudentCredentials = async (studentData) => {
  // Check if email is configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('⚠️  Email not configured - skipping email sending');
    throw new Error('Email service not configured');
  }

  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'CyberLab Admin'}" <${process.env.EMAIL_USER}>`,
      to: studentData.email,
      subject: 'Welcome to CyberLab - Your Account Credentials',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .credentials { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #2563eb; }
            .info-row { margin: 10px 0; }
            .label { font-weight: bold; color: #4b5563; }
            .value { color: #1f2937; }
            .footer { background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; padding: 12px 30px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to CyberLab!</h1>
            </div>
            <div class="content">
              <p>Dear ${studentData.firstName} ${studentData.lastName},</p>

              <p>Your account has been successfully created. Below are your login credentials:</p>

              <div class="credentials">
                <div class="info-row">
                  <span class="label">Student Name:</span>
                  <span class="value">${studentData.firstName} ${studentData.lastName}</span>
                </div>
                <div class="info-row">
                  <span class="label">Email (Username):</span>
                  <span class="value">${studentData.email}</span>
                </div>
                <div class="info-row">
                  <span class="label">Password:</span>
                  <span class="value">${studentData.password}</span>
                </div>
                <div class="info-row">
                  <span class="label">Registration Number:</span>
                  <span class="value">${studentData.registrationNumber}</span>
                </div>
                <div class="info-row">
                  <span class="label">Enrollment Date:</span>
                  <span class="value">${new Date(studentData.enrollDate).toLocaleDateString()}</span>
                </div>
                ${studentData.endDate ? `
                <div class="info-row">
                  <span class="label">End Date:</span>
                  <span class="value">${new Date(studentData.endDate).toLocaleDateString()}</span>
                </div>
                ` : ''}
              </div>

              <p><strong>Important:</strong> Please change your password after your first login for security purposes.</p>

              <center>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="button">Login to CyberLab</a>
              </center>

              <p>If you have any questions or need assistance, please contact your administrator.</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
              <p>&copy; ${new Date().getFullYear()} CyberLab. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Welcome to CyberLab!

Dear ${studentData.firstName} ${studentData.lastName},

Your account has been successfully created. Below are your login credentials:

Student Name: ${studentData.firstName} ${studentData.lastName}
Email (Username): ${studentData.email}
Password: ${studentData.password}
Registration Number: ${studentData.registrationNumber}
Enrollment Date: ${new Date(studentData.enrollDate).toLocaleDateString()}
${studentData.endDate ? `End Date: ${new Date(studentData.endDate).toLocaleDateString()}` : ''}

Important: Please change your password after your first login for security purposes.

Login at: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/login

If you have any questions or need assistance, please contact your administrator.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};
