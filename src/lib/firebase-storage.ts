import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
  UploadResult,
} from "firebase/storage";
import { storage } from "./firebase";

/**
 * Firebase Storage Service
 * Handles file uploads, downloads, and deletions for resume files
 */

// Storage paths
const STORAGE_PATHS = {
  RESUMES: "resumes",
  TEMP: "temp",
};

/**
 * Upload a resume file to Firebase Storage
 * @param file - The file to upload
 * @param userId - The user ID who owns the file
 * @returns The download URL of the uploaded file
 */
export const uploadResumeFile = async (
  file: File,
  userId: string,
): Promise<{ url: string; path: string }> => {
  try {
    // Create a unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${timestamp}-${sanitizedFileName}`;
    const filePath = `${STORAGE_PATHS.RESUMES}/${userId}/${fileName}`;

    // Create a storage reference
    const storageRef = ref(storage, filePath);

    // Upload the file
    const uploadResult: UploadResult = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        uploadedBy: userId,
        originalName: file.name,
        uploadDate: new Date().toISOString(),
      },
    });

    // Get the download URL
    const downloadURL = await getDownloadURL(uploadResult.ref);

    console.log(`[Firebase Storage] Uploaded file: ${filePath}`);

    return {
      url: downloadURL,
      path: filePath,
    };
  } catch (error) {
    console.error("[Firebase Storage] Upload error:", error);
    throw new Error("Failed to upload file to storage");
  }
};

/**
 * Delete a resume file from Firebase Storage
 * @param filePath - The path of the file to delete
 */
export const deleteResumeFile = async (filePath: string): Promise<void> => {
  try {
    const storageRef = ref(storage, filePath);
    await deleteObject(storageRef);
    console.log(`[Firebase Storage] Deleted file: ${filePath}`);
  } catch (error) {
    console.error("[Firebase Storage] Delete error:", error);
    throw new Error("Failed to delete file from storage");
  }
};

/**
 * Get download URL for a file
 * @param filePath - The path of the file
 * @returns The download URL
 */
export const getFileDownloadURL = async (
  filePath: string,
): Promise<string> => {
  try {
    const storageRef = ref(storage, filePath);
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (error) {
    console.error("[Firebase Storage] Get URL error:", error);
    throw new Error("Failed to get file download URL");
  }
};

/**
 * List all files for a specific user
 * @param userId - The user ID
 * @returns Array of file paths
 */
export const listUserFiles = async (userId: string): Promise<string[]> => {
  try {
    const userFolderRef = ref(
      storage,
      `${STORAGE_PATHS.RESUMES}/${userId}`,
    );
    const result = await listAll(userFolderRef);

    const filePaths = result.items.map((itemRef) => itemRef.fullPath);

    console.log(
      `[Firebase Storage] Listed ${filePaths.length} files for user: ${userId}`,
    );

    return filePaths;
  } catch (error) {
    console.error("[Firebase Storage] List files error:", error);
    throw new Error("Failed to list user files");
  }
};

/**
 * Validate file before upload
 * @param file - The file to validate
 * @returns Validation result
 */
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const VALID_MIME_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: "File size exceeds 10MB limit",
    };
  }

  // Check MIME type
  if (!VALID_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Supported: PDF, DOC, DOCX, TXT",
    };
  }

  // Check if file has content
  if (file.size === 0) {
    return {
      valid: false,
      error: "File is empty",
    };
  }

  return { valid: true };
};

/**
 * Delete all files for a specific user
 * @param userId - The user ID
 */
export const deleteAllUserFiles = async (userId: string): Promise<void> => {
  try {
    const filePaths = await listUserFiles(userId);

    const deletePromises = filePaths.map((filePath) =>
      deleteResumeFile(filePath),
    );

    await Promise.all(deletePromises);

    console.log(
      `[Firebase Storage] Deleted all files for user: ${userId}`,
    );
  } catch (error) {
    console.error("[Firebase Storage] Delete all files error:", error);
    throw new Error("Failed to delete all user files");
  }
};
