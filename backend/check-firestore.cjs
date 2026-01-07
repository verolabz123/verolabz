#!/usr/bin/env node

/**
 * Firestore Debug Script
 * Checks what's actually saved in the applicants collection
 */

const admin = require("firebase-admin");
const path = require("path");

// Load environment variables
require("dotenv").config();

// Initialize Firebase Admin
const serviceAccountPath =
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
  path.join(
    __dirname,
    "verolabz-dbc48-firebase-adminsdk-fbsvc-2bafd3a4a9.json",
  );

try {
  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: `${serviceAccount.project_id}.appspot.com`,
  });

  console.log("✅ Firebase Admin initialized successfully");
  console.log(`📁 Project: ${serviceAccount.project_id}\n`);
} catch (error) {
  console.error("❌ Failed to initialize Firebase:", error.message);
  process.exit(1);
}

const db = admin.firestore();

async function checkApplicants() {
  console.log("🔍 Checking applicants collection...\n");

  try {
    const snapshot = await db
      .collection("applicants")
      .orderBy("createdAt", "desc")
      .limit(10)
      .get();

    if (snapshot.empty) {
      console.log("⚠️  No documents found in applicants collection");
      return;
    }

    console.log(`📊 Found ${snapshot.size} recent applicant(s):\n`);
    console.log("─".repeat(80));

    snapshot.forEach((doc, index) => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate?.() || data.createdAt;

      console.log(`\n${index + 1}. Document ID: ${doc.id}`);
      console.log(`   Name: ${data.candidate?.name || "N/A"}`);
      console.log(`   Email: ${data.candidate?.email || "N/A"}`);
      console.log(`   Job ID: ${data.candidate?.jobId || "N/A"}`);
      console.log(`   Status: ${data.status || "N/A"}`);
      console.log(`   Score: ${data.score || "N/A"}`);
      console.log(`   Decision: ${data.evaluation?.decision || "N/A"}`);
      console.log(`   Skills Score: ${data.evaluation?.skillsScore || "N/A"}`);
      console.log(
        `   Experience Score: ${data.evaluation?.experienceScore || "N/A"}`,
      );
      console.log(`   Source: ${data.source || "N/A"}`);
      console.log(
        `   Created: ${createdAt instanceof Date ? createdAt.toISOString() : createdAt}`,
      );

      if (data.reason) {
        console.log(`   Reason: ${data.reason}`);
      }

      if (data.parsed) {
        console.log(`   Skills Extracted: ${data.parsed.skills?.length || 0}`);
        if (data.parsed.skills && data.parsed.skills.length > 0) {
          console.log(
            `   Skills: ${data.parsed.skills.slice(0, 5).join(", ")}${data.parsed.skills.length > 5 ? "..." : ""}`,
          );
        }
      }

      console.log("─".repeat(80));
    });

    console.log("\n📈 Status Summary:");
    const statusCounts = {};
    snapshot.forEach((doc) => {
      const status = doc.data().status || "unknown";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
  } catch (error) {
    console.error("❌ Error fetching applicants:", error.message);
  }
}

async function checkLatestByEmail(email) {
  console.log(`\n🔍 Searching for: ${email}...\n`);

  try {
    const snapshot = await db
      .collection("applicants")
      .where("candidate.email", "==", email)
      .get();

    if (snapshot.empty) {
      console.log("⚠️  No applicant found with that email");
      return;
    }

    // Sort manually since we can't use orderBy without index
    const docs = snapshot.docs.sort((a, b) => {
      const aTime = a.data().createdAt?.toDate?.() || new Date(0);
      const bTime = b.data().createdAt?.toDate?.() || new Date(0);
      return bTime - aTime;
    });

    const doc = docs[0];
    const data = doc.data();

    console.log("📄 Full Document Data:");
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("❌ Error fetching applicant:", error.message);
  }
}

async function main() {
  const email = process.argv[2];

  if (email) {
    await checkLatestByEmail(email);
  } else {
    await checkApplicants();
  }

  console.log("\n✅ Done!\n");
  process.exit(0);
}

main();
