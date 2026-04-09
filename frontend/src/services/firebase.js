import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDHagHXmugd4O6Lgv_c_l0_356Yu9REmvA",
  authDomain: "quiz-platform-16e8b.firebaseapp.com",
  projectId: "quiz-platform-16e8b",
  storageBucket: "quiz-platform-16e8b.firebasestorage.app",
  messagingSenderId: "519252072060",
  appId: "1:519252072060:web:051f56ac09adb5d62bdbf9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

let isSigningIn = false;

export const signInWithGoogle = async () => {
  if (isSigningIn) return null;
  isSigningIn = true;
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } finally {
    isSigningIn = false;
  }
};
