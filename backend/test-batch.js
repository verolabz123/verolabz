// Test script for batch evaluation endpoint
import fetch from 'node-fetch';

const BACKEND_URL = 'http://localhost:3001';

const testCandidates = [
  {
    userId: 'test-user-123',
    candidateName: 'John Doe',
    candidateEmail: 'john.doe@example.com',
    candidatePhone: '+1234567890',
    resumeText: `
John Doe
Software Engineer

SUMMARY
Experienced full-stack developer with 5 years of experience in web development.

SKILLS
JavaScript, TypeScript, React, Node.js, Express, MongoDB, PostgreSQL, Docker, AWS

EXPERIENCE
Senior Software Engineer - Tech Corp (2021-Present)
- Led development of microservices architecture
- Implemented CI/CD pipelines
- Mentored junior developers

Software Engineer - StartUp Inc (2019-2021)
- Built RESTful APIs using Node.js
- Developed React frontend applications
- Worked with PostgreSQL databases

EDUCATION
Bachelor of Science in Computer Science - University XYZ (2019)

CERTIFICATIONS
AWS Certified Developer
    `,
    resumeUrl: 'https://example.com/resume1.pdf',
    jobId: 'job-frontend-001',
    jobTitle: 'Senior Frontend Developer',
    jobDescription: 'We are looking for an experienced frontend developer with strong React skills',
    requiredSkills: ['React', 'JavaScript', 'TypeScript', 'CSS'],
    preferredSkills: ['Next.js', 'Redux', 'GraphQL'],
    requiredExperience: 3,
    seniorityLevel: 'senior',
  },
  {
    userId: 'test-user-123',
    candidateName: 'Jane Smith',
    candidateEmail: 'jane.smith@example.com',
    candidatePhone: '+1234567891',
    resumeText: `
Jane Smith
Frontend Developer

SUMMARY
Frontend developer with 3 years of experience specializing in React and modern web technologies.

SKILLS
React, JavaScript, HTML, CSS, Redux, Git, Jest, Webpack

EXPERIENCE
Frontend Developer - Digital Agency (2021-Present)
- Built responsive web applications using React
- Implemented state management with Redux
- Wrote unit tests with Jest

Junior Frontend Developer - Web Studio (2020-2021)
- Created landing pages and marketing sites
- Worked with design team on UI/UX

EDUCATION
Bachelor of Arts in Web Design - Design University (2020)
    `,
    resumeUrl: 'https://example.com/resume2.pdf',
    jobId: 'job-frontend-001',
    jobTitle: 'Senior Frontend Developer',
    jobDescription: 'We are looking for an experienced frontend developer with strong React skills',
    requiredSkills: ['React', 'JavaScript', 'TypeScript', 'CSS'],
    preferredSkills: ['Next.js', 'Redux', 'GraphQL'],
    requiredExperience: 3,
    seniorityLevel: 'senior',
  },
  {
    userId: 'test-user-123',
    candidateName: 'Bob Johnson',
    candidateEmail: 'bob.johnson@example.com',
    candidatePhone: '+1234567892',
    resumeText: `
Bob Johnson
Full Stack Developer

SUMMARY
Full-stack developer with 7 years of experience in building scalable web applications.

SKILLS
React, TypeScript, Node.js, Python, Django, PostgreSQL, Docker, Kubernetes, AWS, GraphQL

EXPERIENCE
Lead Full Stack Developer - Enterprise Corp (2020-Present)
- Architected and developed enterprise applications
- Led team of 5 developers
- Implemented GraphQL APIs

Senior Full Stack Developer - Tech Solutions (2017-2020)
- Developed React and Node.js applications
- Managed PostgreSQL databases
- Deployed applications to AWS

EDUCATION
Master of Science in Computer Science - Tech University (2017)

CERTIFICATIONS
AWS Solutions Architect
Certified Kubernetes Administrator
    `,
    resumeUrl: 'https://example.com/resume3.pdf',
    jobId: 'job-frontend-001',
    jobTitle: 'Senior Frontend Developer',
    jobDescription: 'We are looking for an experienced frontend developer with strong React skills',
    requiredSkills: ['React', 'JavaScript', 'TypeScript', 'CSS'],
    preferredSkills: ['Next.js', 'Redux', 'GraphQL'],
    requiredExperience: 3,
    seniorityLevel: 'senior',
  },
];

async function testBatchEvaluation() {
  console.log('🚀 Starting batch evaluation test...\n');

  try {
    // 1. Check backend health
    console.log('1️⃣ Checking backend health...');
    const healthResponse = await fetch(`${BACKEND_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Backend health:', healthData.status);
    console.log('');

    // 2. Send batch evaluation request
    console.log('2️⃣ Sending batch evaluation request...');
    console.log(`   Candidates: ${testCandidates.length}`);
    console.log(`   Job: ${testCandidates[0].jobTitle}`);
    console.log('');

    const startTime = Date.now();

    const batchResponse = await fetch(`${BACKEND_URL}/api/v1/evaluation/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        candidates: testCandidates,
      }),
    });

    const responseTime = Date.now() - startTime;

    if (!batchResponse.ok) {
      const errorText = await batchResponse.text();
      console.error('❌ Batch evaluation failed:', batchResponse.status);
      console.error('Error:', errorText);
      return;
    }

    const result = await batchResponse.json();

    console.log('✅ Batch evaluation completed!');
    console.log(`   Response time: ${responseTime}ms`);
    console.log('');

    // 3. Display results
    console.log('3️⃣ Results Summary:');
    console.log('─'.repeat(60));
    console.log(`Total candidates:      ${result.data?.total || 0}`);
    console.log(`Successful:            ${result.data?.successful || 0}`);
    console.log(`Failed:                ${result.data?.failed || 0}`);
    console.log('');

    if (result.data?.results && result.data.results.length > 0) {
      console.log('4️⃣ Individual Results:');
      console.log('─'.repeat(60));

      result.data.results.forEach((candidate, index) => {
        console.log(`\n📋 Candidate ${index + 1}: ${testCandidates[index].candidateName}`);
        console.log(`   Email:        ${testCandidates[index].candidateEmail}`);
        console.log(`   Success:      ${candidate.success ? '✅' : '❌'}`);

        if (candidate.success) {
          console.log(`   Final Score:  ${candidate.finalScore}/100`);
          console.log(`   Decision:     ${candidate.decision}`);
          console.log(`   Confidence:   ${candidate.confidence}%`);
          console.log(`   Candidate ID: ${candidate.candidateId}`);
        } else {
          console.log(`   Error:        ${candidate.error}`);
        }
      });
    } else {
      console.log('⚠️  No individual results returned');
    }

    console.log('\n' + '─'.repeat(60));
    console.log('✅ Test completed successfully!\n');

  } catch (error) {
    console.error('❌ Test failed with error:');
    console.error(error);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure backend server is running on port 3001');
    console.log('2. Check that GROQ_API_KEY is set in .env file');
    console.log('3. Verify Firebase credentials are configured');
    console.log('4. Check backend logs for detailed error messages');
  }
}

// Run the test
console.log('═'.repeat(60));
console.log('  BATCH EVALUATION TEST SCRIPT');
console.log('═'.repeat(60));
console.log('');

testBatchEvaluation();
