import { NextResponse } from "next/server";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createUser, getUserByEmail } from "@/lib/firebase-db";

// Email validation helper
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, company } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }

    // Check if user already exists in Firestore
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists with this email" },
        { status: 400 },
      );
    }

    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      const firebaseUser = userCredential.user;

      // Update display name in Firebase Auth
      if (name) {
        await updateProfile(firebaseUser, {
          displayName: name,
        });
      }

      // Create user profile in Firestore with Firebase Auth UID
      await createUser(
        {
          email,
          name: name || "User",
          company: company || "",
          role: "HR Manager",
          plan: "free_trial",
          emailNotifications: true,
        },
        firebaseUser.uid, // Use Firebase Auth UID as custom document ID
      );

      console.log(`[REGISTER_SUCCESS] User created: ${email}`);

      return NextResponse.json({
        message: "User created successfully",
        user: {
          id: firebaseUser.uid,
          email,
          name: name || "User",
        },
      });
    } catch (firebaseError: unknown) {
      console.error("[FIREBASE_REGISTER_ERROR]", firebaseError);

      // Handle specific Firebase errors
      if (
        firebaseError &&
        typeof firebaseError === "object" &&
        "code" in firebaseError
      ) {
        const error = firebaseError as { code: string; message: string };

        if (error.code === "auth/email-already-in-use") {
          return NextResponse.json(
            { error: "Email already in use" },
            { status: 400 },
          );
        }
        if (error.code === "auth/invalid-email") {
          return NextResponse.json(
            { error: "Invalid email address" },
            { status: 400 },
          );
        }
        if (error.code === "auth/weak-password") {
          return NextResponse.json(
            { error: "Password is too weak" },
            { status: 400 },
          );
        }
        if (error.code === "auth/operation-not-allowed") {
          return NextResponse.json(
            { error: "Email/password authentication is not enabled" },
            { status: 500 },
          );
        }
      }

      return NextResponse.json(
        { error: "Failed to create user account" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
