import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCt1Cf4O-JRaiF7YcRL_0tDqPxdYx7cxUs",
  authDomain: "enginner-quest.firebaseapp.com",
  projectId: "enginner-quest",
  storageBucket: "enginner-quest.firebasestorage.app",
  messagingSenderId: "359293837194",
  appId: "1:359293837194:web:b1d403430c8cd4e941f273",
  measurementId: "G-J3CGVBXJHJ",
};

// initializeApp の重複防止
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Auth を export
export const auth = getAuth(app);