// SDK oficial de Firebase (version fija para que nada cambie el dia del evento).
const V = '10.14.1';
export { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
export {
  getDatabase, ref, child, onValue, get, set, update, remove, push, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js';
export { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
export const VERSION_SDK = V;
