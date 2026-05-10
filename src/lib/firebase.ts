// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// TODO: Replace these with your actual Firebase project credentials

const firebaseConfig = {
  apiKey: "AIzaSyBXqj8Ex2j90TD88wdij8wFkh1g9TquQa8",
  authDomain: "qrapp-5b5a5.firebaseapp.com",
  databaseURL: "https://qrapp-5b5a5-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "qrapp-5b5a5",
  storageBucket: "qrapp-5b5a5.firebasestorage.app",
  messagingSenderId: "686430104828",
  appId: "1:686430104828:web:83e4b1da87a9ee90f47b79"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
