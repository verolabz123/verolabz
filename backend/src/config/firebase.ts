import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { logger } from "../utils/logger.js";
import fs from "fs";
import path from "path";

let firebaseApp: admin.app.App;
let db: admin.firestore.Firestore;
let storage: admin.storage.Storage;

/**
 * Initialize Firebase Admin SDK
 */
export async function initializeFirebase(): Promise<void> {
  try {
    // Check if already initialized
    if (admin.apps.length > 0) {
      logger.info("Firebase Admin SDK already initialized");
      firebaseApp = admin.apps[0]!;
      db = getFirestore(firebaseApp);
      storage = getStorage(firebaseApp);
      return;
    }

    // Priority 1: Use environment variables (for Render/production)
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      privateKey
    ) {
      logger.info("Loading Firebase credentials from environment variables");

      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
        storageBucket:
          process.env.FIREBASE_STORAGE_BUCKET ||
          `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
      });
    }
    // Priority 2: Use explicit service account path
    else if (
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH &&
      fs.existsSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
    ) {
      logger.info(
        `Loading Firebase service account from: ${process.env.FIREBASE_SERVICE_ACCOUNT_PATH}`,
      );
      const serviceAccount = JSON.parse(
        fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, "utf8"),
      );

      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket:
          process.env.FIREBASE_STORAGE_BUCKET ||
          `${serviceAccount.project_id}.appspot.com`,
      });
    }
    // Priority 3: Auto-detect local service account file
    else {
      const possiblePaths = [
        path.join(
          process.cwd(),
          "verolabz-dbc48-firebase-adminsdk-fbsvc-2bafd3a4a9.json",
        ),
        path.join(process.cwd(), "serviceAccountKey.json"),
        path.join(process.cwd(), "firebase-adminsdk.json"),
      ];

      let serviceAccountPath: string | null = null;
      for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
          serviceAccountPath = filePath;
          break;
        }
      }

      if (serviceAccountPath) {
        logger.info(
          `Loading Firebase service account from: ${serviceAccountPath}`,
        );
        const serviceAccount = JSON.parse(
          fs.readFileSync(serviceAccountPath, "utf8"),
        );

        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          storageBucket:
            process.env.FIREBASE_STORAGE_BUCKET ||
            `${serviceAccount.project_id}.appspot.com`,
        });
      } else {
        throw new Error(
          "Missing Firebase configuration. Please provide one of:\n" +
            "1. Environment variables: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY\n" +
            "2. FIREBASE_SERVICE_ACCOUNT_PATH environment variable\n" +
            "3. Place service account JSON file in project root",
        );
      }
    }

    // Initialize Firestore and Storage
    db = getFirestore(firebaseApp);
    storage = getStorage(firebaseApp);

    // Configure Firestore settings
    db.settings({
      ignoreUndefinedProperties: true,
    });

    logger.info("Firebase Admin SDK initialized successfully");
    logger.info(`Project ID: ${firebaseApp.options.projectId}`);
    logger.info(`Storage Bucket: ${firebaseApp.options.storageBucket}`);
  } catch (error) {
    logger.error("Failed to initialize Firebase Admin SDK:", error);
    throw error;
  }
}

/**
 * Get Firestore database instance
 */
export function getDB(): admin.firestore.Firestore {
  if (!db) {
    throw new Error(
      "Firebase Admin SDK not initialized. Call initializeFirebase() first.",
    );
  }
  return db;
}

/**
 * Get Storage instance
 */
export function getStorageInstance(): admin.storage.Storage {
  if (!storage) {
    throw new Error(
      "Firebase Admin SDK not initialized. Call initializeFirebase() first.",
    );
  }
  return storage;
}

/**
 * Get Firebase App instance
 */
export function getApp(): admin.app.App {
  if (!firebaseApp) {
    throw new Error(
      "Firebase Admin SDK not initialized. Call initializeFirebase() first.",
    );
  }
  return firebaseApp;
}

/**
 * Firestore collection names
 */
export const COLLECTIONS = {
  USERS: "users",
  RESUMES: "resumes",
  NOTES: "notes",
  APPLICANTS: "applicants",
  BATCH_UPLOADS: "batch_uploads",
  EVALUATIONS: "evaluations",
  JOB_POSTINGS: "job_postings",
} as const;

/**
 * Helper to get a Firestore collection reference
 */
export function getCollection(collectionName: string) {
  return getDB().collection(collectionName);
}

/**
 * Helper to create a document with auto-generated ID
 */
export async function createDocument(collectionName: string, data: any) {
  const docRef = await getCollection(collectionName).add({
    ...data,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Helper to update a document
 */
export async function updateDocument(
  collectionName: string,
  docId: string,
  data: any,
) {
  await getCollection(collectionName)
    .doc(docId)
    .update({
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
}

/**
 * Helper to get a document by ID
 */
export async function getDocument(collectionName: string, docId: string) {
  const doc = await getCollection(collectionName).doc(docId).get();
  if (!doc.exists) {
    return null;
  }
  return { id: doc.id, ...doc.data() };
}

/**
 * Helper to delete a document
 */
export async function deleteDocument(collectionName: string, docId: string) {
  await getCollection(collectionName).doc(docId).delete();
}

/**
 * Batch write helper
 */
export function getBatch() {
  return getDB().batch();
}

/**
 * Transaction helper
 */
export async function runTransaction<T>(
  updateFunction: (transaction: admin.firestore.Transaction) => Promise<T>,
): Promise<T> {
  return getDB().runTransaction(updateFunction);
}

export { admin };
