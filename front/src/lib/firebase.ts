// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAYDGSiF12EspKtEYpW-VoUzFrqkmLH4YU",
  authDomain: "engineer-quest.firebaseapp.com",
  projectId: "engineer-quest",
  storageBucket: "engineer-quest.firebasestorage.app",
  messagingSenderId: "203336823452",
  appId: "1:203336823452:web:657a0ca6e4a005d5d4f359",
  measurementId: "G-FJKVL606SG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
export const auth = getAuth(app); 