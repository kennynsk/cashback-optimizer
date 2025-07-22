import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Firebase App (the core Firebase SDK) is always required and must be listed first
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// TODO: Замените эти значения на свои из консоли Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBcnytFMD8j6o0M9TDnYC0GrpgTXn1qP-E",
  authDomain: "cashback-optimizer-bcae5.firebaseapp.com",
  projectId: "cashback-optimizer-bcae5",
  storageBucket: "cashback-optimizer-bcae5.firebasestorage.app",
  messagingSenderId: "300924592061",
  appId: "1:300924592061:web:4056e56d34917cc29b3cd4"
};

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);
export const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
