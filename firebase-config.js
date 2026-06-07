const firebaseConfig = {
    apiKey: "AIzaSyCzlJBaghK93F9xo8N6wKL5cGQ3PBNe4Dk",
    authDomain: "consultacap.firebaseapp.com",
    projectId: "consultacap",
    storageBucket: "consultacap.firebasestorage.app",
    messagingSenderId: "464865049221",
    appId: "1:464865049221:web:a771032e73e706883ec7ec"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();
