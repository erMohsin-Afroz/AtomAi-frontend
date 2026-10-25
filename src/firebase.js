import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBMpPb_nvTnYvFq2q-nuPABEvCaV9GHIUc",
  authDomain: "atomai-007.firebaseapp.com",
  projectId: "atomai-007",
  storageBucket: "atomai-007.firebasestorage.app",
  messagingSenderId: "470919164444",
  appId: "1:470919164444:web:c915b62d38d5851d10e5d9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;