import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from '../models/Student.js';
import readline from 'readline';

// Load environment variables
dotenv.config();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get admin details from user
    console.log('=== Create Admin User ===\n');

    const firstName = await question('Enter admin first name: ');
    const lastName = await question('Enter admin last name: ');
    const email = await question('Enter admin email: ');
    const password = await question('Enter admin password (min 6 characters): ');

    // Validate inputs
    if (!firstName || !lastName || !email || !password) {
      console.error('❌ All fields are required');
      process.exit(1);
    }

    if (password.length < 6) {
      console.error('❌ Password must be at least 6 characters');
      process.exit(1);
    }

    // Check if admin already exists
    const existingAdmin = await Student.findOne({ email });
    if (existingAdmin) {
      console.log('\n⚠️  User with this email already exists');
      const update = await question('Do you want to update this user to admin role? (yes/no): ');

      if (update.toLowerCase() === 'yes' || update.toLowerCase() === 'y') {
        existingAdmin.role = 'admin';
        existingAdmin.firstName = firstName;
        existingAdmin.lastName = lastName;
        existingAdmin.password = password;
        existingAdmin.isActive = true;
        await existingAdmin.save();

        console.log('\n✅ User updated to admin successfully!');
        console.log('\nAdmin Credentials:');
        console.log('==================');
        console.log(`Email: ${existingAdmin.email}`);
        console.log(`Password: ${password}`);
        console.log(`Role: ${existingAdmin.role}`);
        console.log('==================\n');
      } else {
        console.log('❌ Operation cancelled');
      }
    } else {
      // Create new admin user
      const admin = await Student.create({
        firstName,
        lastName,
        email,
        password,
        role: 'admin',
        isActive: true,
      });

      console.log('\n✅ Admin user created successfully!');
      console.log('\nAdmin Credentials:');
      console.log('==================');
      console.log(`Email: ${admin.email}`);
      console.log(`Password: ${password}`);
      console.log(`Role: ${admin.role}`);
      console.log('==================\n');
    }

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
};

// Run the script
createAdminUser();
