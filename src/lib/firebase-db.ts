import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// Collection names
const COLLECTIONS = {
  USERS: "users",
  RESUMES: "resumes",
  NOTES: "notes",
  APPLICANTS: "applicants",
  BATCH_UPLOADS: "batch_uploads",
};

// Types
export interface FirebaseUser {
  id?: string;
  email: string;
  name: string;
  company?: string;
  role?: string;
  plan: string;
  emailNotifications: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FirebaseResume {
  id?: string;
  userId: string;
  candidateName: string;
  fileName: string;
  fileUrl: string;
  skills: string;
  experienceYears: number;
  atsScore: number;
  aiReasoning?: string;
  status: "pending" | "shortlisted" | "rejected";
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// New schema for bulk candidate processing
export interface FirebaseApplicant {
  id?: string;
  userId: string;
  candidate: {
    name: string;
    email: string;
    phone: string;
    jobId: string;
  };
  parsed?: {
    skills: string[];
    resumeText?: string;
  };
  resumeUrl: string;
  score?: number;
  status:
  | "queued"
  | "processing"
  | "completed"
  | "shortlisted"
  | "rejected"
  | "failed";
  reason?: string;
  source: "hf-space" | "manual";
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FirebaseNote {
  id?: string;
  resumeId: string;
  userId: string;
  note: string;
  createdAt?: Timestamp;
}

// Batch upload tracking
export interface FirebaseBatchUpload {
  id?: string;
  userId: string;
  fileName: string;
  totalCandidates: number;
  processed: number;
  failed: number;
  status: "processing" | "completed" | "failed";
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// User Operations
export const createUser = async (
  userData: Omit<FirebaseUser, "id" | "createdAt" | "updatedAt">,
  customId?: string,
): Promise<string> => {
  try {
    if (customId) {
      // Use custom ID (e.g., Firebase Auth UID)
      const docRef = doc(db, COLLECTIONS.USERS, customId);
      await setDoc(docRef, {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return customId;
    } else {
      // Auto-generate ID
      const docRef = await addDoc(collection(db, COLLECTIONS.USERS), {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    }
  } catch (error) {
    console.error("Error creating user:", error);
    throw new Error("Failed to create user");
  }
};

export const getUserById = async (
  userId: string,
): Promise<FirebaseUser | null> => {
  try {
    const docRef = doc(db, COLLECTIONS.USERS, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as FirebaseUser;
    }
    return null;
  } catch (error) {
    console.error("Error getting user:", error);
    throw new Error("Failed to get user");
  }
};

export const getUserByEmail = async (
  email: string,
): Promise<FirebaseUser | null> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.USERS),
      where("email", "==", email),
      limit(1),
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const firstDoc = querySnapshot.docs[0];
      if (firstDoc) {
        return { id: firstDoc.id, ...firstDoc.data() } as FirebaseUser;
      }
    }
    return null;
  } catch (error) {
    console.error("Error getting user by email:", error);
    throw new Error("Failed to get user by email");
  }
};

export const updateUser = async (
  userId: string,
  userData: Partial<FirebaseUser>,
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(docRef, {
      ...userData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating user:", error);
    throw new Error("Failed to update user");
  }
};

// Resume Operations
export const createResume = async (
  resumeData: Omit<FirebaseResume, "id" | "createdAt" | "updatedAt">,
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.RESUMES), {
      ...resumeData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating resume:", error);
    throw new Error("Failed to create resume");
  }
};

export const getResumeById = async (
  resumeId: string,
): Promise<FirebaseResume | null> => {
  try {
    const docRef = doc(db, COLLECTIONS.RESUMES, resumeId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as FirebaseResume;
    }
    return null;
  } catch (error) {
    console.error("Error getting resume:", error);
    throw new Error("Failed to get resume");
  }
};

export const getResumesByUserId = async (
  userId: string,
): Promise<FirebaseResume[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.RESUMES),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FirebaseResume[];
  } catch (error) {
    console.error("Error getting resumes:", error);
    throw new Error("Failed to get resumes");
  }
};

export const updateResume = async (
  resumeId: string,
  resumeData: Partial<FirebaseResume>,
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.RESUMES, resumeId);
    await updateDoc(docRef, {
      ...resumeData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating resume:", error);
    throw new Error("Failed to update resume");
  }
};

export const deleteResume = async (resumeId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.RESUMES, resumeId);
    await deleteDoc(docRef);

    // Also delete associated notes
    const notesQuery = query(
      collection(db, COLLECTIONS.NOTES),
      where("resumeId", "==", resumeId),
    );
    const notesSnapshot = await getDocs(notesQuery);

    const deletePromises = notesSnapshot.docs.map((noteDoc) =>
      deleteDoc(noteDoc.ref),
    );
    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Error deleting resume:", error);
    throw new Error("Failed to delete resume");
  }
};

export const getResumeStats = async (userId: string) => {
  try {
    const resumes = await getResumesByUserId(userId);

    const stats = {
      total: resumes.length,
      shortlisted: resumes.filter((r) => r.status === "shortlisted").length,
      rejected: resumes.filter((r) => r.status === "rejected").length,
      pending: resumes.filter((r) => r.status === "pending").length,
    };

    return stats;
  } catch (error) {
    console.error("Error getting resume stats:", error);
    throw new Error("Failed to get resume stats");
  }
};

// Note Operations
export const createNote = async (
  noteData: Omit<FirebaseNote, "id" | "createdAt">,
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.NOTES), {
      ...noteData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating note:", error);
    throw new Error("Failed to create note");
  }
};

export const getNotesByResumeId = async (
  resumeId: string,
): Promise<FirebaseNote[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.NOTES),
      where("resumeId", "==", resumeId),
      orderBy("createdAt", "desc"),
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FirebaseNote[];
  } catch (error) {
    console.error("Error getting notes:", error);
    throw new Error("Failed to get notes");
  }
};

export const deleteNote = async (noteId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.NOTES, noteId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting note:", error);
    throw new Error("Failed to delete note");
  }
};

// Applicant Operations (Bulk Processing)
export const createApplicant = async (
  applicantData: Omit<FirebaseApplicant, "id" | "createdAt" | "updatedAt">,
): Promise<string> => {
  try {
    // Use {jobId}_{email} as document ID for idempotency
    const docId = `${applicantData.candidate.jobId}_${applicantData.candidate.email}`;
    const docRef = doc(db, COLLECTIONS.APPLICANTS, docId);

    await setDoc(docRef, {
      ...applicantData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docId;
  } catch (error) {
    console.error("Error creating applicant:", error);
    throw new Error("Failed to create applicant");
  }
};

export const getApplicantsByJobId = async (
  userId: string,
  jobId: string,
): Promise<FirebaseApplicant[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.APPLICANTS),
      where("userId", "==", userId),
      where("candidate.jobId", "==", jobId),
      orderBy("createdAt", "desc"),
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FirebaseApplicant[];
  } catch (error) {
    console.error("Error getting applicants:", error);
    throw new Error("Failed to get applicants");
  }
};

export const getApplicantsByUserId = async (
  userId: string,
): Promise<FirebaseApplicant[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.APPLICANTS),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FirebaseApplicant[];
  } catch (error) {
    console.error("Error getting applicants:", error);
    throw new Error("Failed to get applicants");
  }
};

export const getApplicantStats = async (userId: string, jobId?: string) => {
  try {
    const applicants = jobId
      ? await getApplicantsByJobId(userId, jobId)
      : await getApplicantsByUserId(userId);

    const stats = {
      total: applicants.length,
      queued: applicants.filter((a) => a.status === "queued").length,
      processing: applicants.filter((a) => a.status === "processing").length,
      completed: applicants.filter((a) => a.status === "completed").length,
      shortlisted: applicants.filter((a) => a.status === "shortlisted").length,
      rejected: applicants.filter((a) => a.status === "rejected").length,
      failed: applicants.filter((a) => a.status === "failed").length,
    };

    return stats;
  } catch (error) {
    console.error("Error getting applicant stats:", error);
    throw new Error("Failed to get applicant stats");
  }
};

export const updateApplicant = async (
  applicantId: string,
  applicantData: Partial<FirebaseApplicant>,
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.APPLICANTS, applicantId);
    await updateDoc(docRef, {
      ...applicantData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating applicant:", error);
    throw new Error("Failed to update applicant");
  }
};

export const deleteApplicant = async (applicantId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.APPLICANTS, applicantId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting applicant:", error);
    throw new Error("Failed to delete applicant");
  }
};

// Batch Upload Operations
export const createBatchUpload = async (
  batchData: Omit<FirebaseBatchUpload, "id" | "createdAt" | "updatedAt">,
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.BATCH_UPLOADS), {
      ...batchData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating batch upload:", error);
    throw new Error("Failed to create batch upload");
  }
};

export const getBatchUploadById = async (
  batchId: string,
): Promise<FirebaseBatchUpload | null> => {
  try {
    const docRef = doc(db, COLLECTIONS.BATCH_UPLOADS, batchId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as FirebaseBatchUpload;
    }
    return null;
  } catch (error) {
    console.error("Error getting batch upload:", error);
    throw new Error("Failed to get batch upload");
  }
};

export const updateBatchUpload = async (
  batchId: string,
  updates: Partial<FirebaseBatchUpload>,
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.BATCH_UPLOADS, batchId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating batch upload:", error);
    throw new Error("Failed to update batch upload");
  }
};

export const getJobIds = async (userId: string): Promise<string[]> => {
  try {
    const applicants = await getApplicantsByUserId(userId);
    const jobIds = [...new Set(applicants.map((a) => a.candidate.jobId))];
    return jobIds;
  } catch (error) {
    console.error("Error getting job IDs:", error);
    throw new Error("Failed to get job IDs");
  }
};
