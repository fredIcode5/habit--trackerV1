import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDbhQsUJqZXIsnJZdU-DGPAZft9Sa4dMKU",
  authDomain: "run-to-study.firebaseapp.com",
  databaseURL: "https://run-to-study-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "run-to-study",
  storageBucket: "run-to-study.firebasestorage.app",
  messagingSenderId: "415034057050",
  appId: "1:415034057050:web:af497fe348ee5bb8179363",
  measurementId: "G-0G5XRYCHWZ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
