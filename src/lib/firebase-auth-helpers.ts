/**
 * Firebase Authentication Helper Functions
 * Client-side helpers for authentication operations
 */

import {
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  sendPasswordResetEmail,
  updatePassword,
  updateEmail,
  updateProfile,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { auth } from "./firebase";
import { authLogger } from "./logger";

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
    authLogger.info("User signed out successfully");
  } catch (error) {
    authLogger.error("Sign out error", error);
    throw new Error("Failed to sign out");
  }
};

/**
 * Listen to authentication state changes
 * @param callback - Function to call when auth state changes
 * @returns Unsubscribe function
 */
export const onAuthStateChange = (
  callback: (user: User | null) => void,
): (() => void) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Get the current authenticated user
 * @returns Current user or null
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

/**
 * Check if user is authenticated
 * @returns True if user is signed in
 */
export const isAuthenticated = (): boolean => {
  return auth.currentUser !== null;
};

/**
 * Send password reset email
 * @param email - User's email address
 */
export const sendPasswordReset = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
    authLogger.info(`Password reset email sent to: ${email}`);
  } catch (error: unknown) {
    authLogger.error("Password reset error", error);

    if (error && typeof error === "object" && "code" in error) {
      const firebaseError = error as { code: string };
      if (firebaseError.code === "auth/user-not-found") {
        throw new Error("No account found with this email");
      }
      if (firebaseError.code === "auth/invalid-email") {
        throw new Error("Invalid email address");
      }
    }

    throw new Error("Failed to send password reset email");
  }
};

/**
 * Update user's password
 * @param newPassword - New password
 */
export const changePassword = async (newPassword: string): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No user is signed in");
    }

    await updatePassword(user, newPassword);
    authLogger.info("Password updated successfully");
  } catch (error: unknown) {
    authLogger.error("Password update error", error);

    if (error && typeof error === "object" && "code" in error) {
      const firebaseError = error as { code: string };
      if (firebaseError.code === "auth/requires-recent-login") {
        throw new Error("Please sign in again to change your password");
      }
      if (firebaseError.code === "auth/weak-password") {
        throw new Error("Password is too weak");
      }
    }

    throw new Error("Failed to update password");
  }
};

/**
 * Update user's email address
 * @param newEmail - New email address
 */
export const changeEmail = async (newEmail: string): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No user is signed in");
    }

    await updateEmail(user, newEmail);
    authLogger.info("Email updated successfully");
  } catch (error: unknown) {
    authLogger.error("Email update error", error);

    if (error && typeof error === "object" && "code" in error) {
      const firebaseError = error as { code: string };
      if (firebaseError.code === "auth/requires-recent-login") {
        throw new Error("Please sign in again to change your email");
      }
      if (firebaseError.code === "auth/email-already-in-use") {
        throw new Error("Email is already in use");
      }
      if (firebaseError.code === "auth/invalid-email") {
        throw new Error("Invalid email address");
      }
    }

    throw new Error("Failed to update email");
  }
};

/**
 * Update user's display name and photo
 * @param displayName - New display name
 * @param photoURL - New photo URL
 */
export const updateUserProfile = async (
  displayName?: string,
  photoURL?: string,
): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No user is signed in");
    }

    await updateProfile(user, {
      displayName: displayName || user.displayName,
      photoURL: photoURL || user.photoURL,
    });

    authLogger.info("Profile updated successfully");
  } catch (error) {
    authLogger.error("Profile update error", error);
    throw new Error("Failed to update profile");
  }
};

/**
 * Reauthenticate user with their password
 * Required before sensitive operations like deleting account
 * @param email - User's email
 * @param password - User's current password
 */
export const reauthenticate = async (
  email: string,
  password: string,
): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No user is signed in");
    }

    const credential = EmailAuthProvider.credential(email, password);
    await reauthenticateWithCredential(user, credential);

    authLogger.info("User reauthenticated successfully");
  } catch (error: unknown) {
    authLogger.error("Reauthentication error", error);

    if (error && typeof error === "object" && "code" in error) {
      const firebaseError = error as { code: string };
      if (firebaseError.code === "auth/wrong-password") {
        throw new Error("Incorrect password");
      }
      if (firebaseError.code === "auth/user-mismatch") {
        throw new Error("Email does not match the signed-in user");
      }
    }

    throw new Error("Failed to reauthenticate");
  }
};

/**
 * Delete the current user's account
 * Requires recent authentication
 */
export const deleteUserAccount = async (): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No user is signed in");
    }

    await deleteUser(user);
    authLogger.info("User account deleted successfully");
  } catch (error: unknown) {
    authLogger.error("Account deletion error", error);

    if (error && typeof error === "object" && "code" in error) {
      const firebaseError = error as { code: string };
      if (firebaseError.code === "auth/requires-recent-login") {
        throw new Error(
          "Please sign in again before deleting your account",
        );
      }
    }

    throw new Error("Failed to delete account");
  }
};

/**
 * Get user's ID token for API authentication
 * @param forceRefresh - Force token refresh
 * @returns ID token string
 */
export const getIdToken = async (
  forceRefresh: boolean = false,
): Promise<string | null> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return null;
    }

    const token = await user.getIdToken(forceRefresh);
    return token;
  } catch (error) {
    authLogger.error("Get token error", error);
    return null;
  }
};

/**
 * Verify if email is verified
 * @returns True if email is verified
 */
export const isEmailVerified = (): boolean => {
  const user = auth.currentUser;
  return user?.emailVerified || false;
};

/**
 * Get user metadata (creation time, last sign in)
 * @returns User metadata or null
 */
export const getUserMetadata = (): {
  creationTime?: string;
  lastSignInTime?: string;
} | null => {
  const user = auth.currentUser;
  if (!user) return null;

  return {
    creationTime: user.metadata.creationTime,
    lastSignInTime: user.metadata.lastSignInTime,
  };
};
