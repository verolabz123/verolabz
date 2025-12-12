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

export interface FirebaseNote {
  id?: string;
  resumeId: string;
  userId: string;
  note: string;
  createdAt?: Timestamp;
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
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as FirebaseUser;
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
