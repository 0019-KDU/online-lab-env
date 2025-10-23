import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Fix studentId index issue automatically
    try {
      const db = conn.connection.db;
      const studentsCollection = db.collection('students');
      
      // Drop the old non-sparse studentId index if it exists
      await studentsCollection.dropIndex('studentId_1');
      console.log('✅ Dropped old studentId_1 index');
      
      // Create new sparse index
      await studentsCollection.createIndex(
        { studentId: 1 },
        { unique: true, sparse: true }
      );
      console.log('✅ Created new sparse index on studentId');
    } catch (error) {
      // Index might not exist or already correct, ignore error
      if (error.code !== 27) {
        console.log('ℹ️  studentId index already fixed or does not exist');
      }
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;