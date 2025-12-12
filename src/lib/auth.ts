import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  UserCredential,
} from "firebase/auth";
import { auth } from "./firebase";
import { createUser, getUserByEmail, getUserById } from "./firebase-db";

// Validate environment variables
if (!process.env.NEXTAUTH_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("NEXTAUTH_SECRET must be set in production environment");
}

// Email validation helper
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        // Validate email format
        if (!isValidEmail(credentials.email)) {
          throw new Error("Invalid email format");
        }

        // Validate password length
        if (credentials.password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }

        try {
          // Authenticate with Firebase
          const userCredential: UserCredential =
            await signInWithEmailAndPassword(
              auth,
              credentials.email,
              credentials.password,
            );

          const firebaseUser = userCredential.user;

          // Get user data from Firestore using Firebase Auth UID
          let userData = await getUserById(firebaseUser.uid);

          // If user doesn't exist in Firestore, create them with Firebase Auth UID
          if (!userData) {
            await createUser(
              {
                email: credentials.email,
                name: firebaseUser.displayName || "User",
                plan: "free_trial",
                emailNotifications: true,
              },
              firebaseUser.uid, // Use Firebase Auth UID as custom ID
            );

            userData = await getUserById(firebaseUser.uid);
          }

          if (!userData) {
            throw new Error("Failed to retrieve user data");
          }

          return {
            id: firebaseUser.uid,
            email: userData.email,
            name: userData.name,
            plan: userData.plan,
          };
        } catch (error: unknown) {
          console.error("[AUTH_ERROR]", error);

          // Handle specific Firebase errors
          if (error && typeof error === "object" && "code" in error) {
            const firebaseError = error as { code: string };
            if (firebaseError.code === "auth/user-not-found") {
              throw new Error("No account found with this email");
            }
            if (firebaseError.code === "auth/wrong-password") {
              throw new Error("Incorrect password");
            }
            if (firebaseError.code === "auth/too-many-requests") {
              throw new Error(
                "Too many failed attempts. Please try again later",
              );
            }
            if (firebaseError.code === "auth/user-disabled") {
              throw new Error("This account has been disabled");
            }
          }

          throw new Error(
            "Authentication failed. Please check your credentials",
          );
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.plan = user.plan;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.plan = token.plan as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
