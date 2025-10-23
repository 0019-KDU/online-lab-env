import bcrypt from 'bcryptjs';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const hashPassword = async () => {
  try {
    const password = await question('Enter password to hash: ');
    
    if (!password || password.length < 6) {
      console.error('❌ Password must be at least 6 characters');
      process.exit(1);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log('\n✅ Password hashed successfully!\n');
    console.log('Hashed Password:');
    console.log('================');
    console.log(hashedPassword);
    console.log('================\n');
    console.log('Copy this hash and use it in MongoDB insert command.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
    process.exit(0);
  }
};

hashPassword();
