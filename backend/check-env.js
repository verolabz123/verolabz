import dotenv from 'dotenv';
dotenv.config();

console.log('\n🔍 Checking Backend Environment Configuration...\n');

const checks = [
  { name: 'GROQ_API_KEY', value: process.env.GROQ_API_KEY, required: true },
  { name: 'FIREBASE_SERVICE_ACCOUNT_PATH', value: process.env.FIREBASE_SERVICE_ACCOUNT_PATH, required: true },
  { name: 'PORT', value: process.env.PORT, required: false },
  { name: 'NODE_ENV', value: process.env.NODE_ENV, required: false },
];

let allGood = true;

checks.forEach(check => {
  const status = check.value ? '✅' : (check.required ? '❌' : '⚠️');
  const displayValue = check.value 
    ? (check.name.includes('KEY') ? check.value.substring(0, 10) + '...' : check.value)
    : 'NOT SET';
  
  console.log(`${status} ${check.name}: ${displayValue}`);
  
  if (check.required && !check.value) {
    allGood = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allGood) {
  console.log('✅ All required environment variables are set!');
  console.log('You can now run: npm run dev');
} else {
  console.log('❌ Some required environment variables are missing!');
  console.log('Please check your .env file.');
}

console.log('='.repeat(50) + '\n');
