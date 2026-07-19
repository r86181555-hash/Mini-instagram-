import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

// Create hidden email from username
function usernameToEmail(username) {
  return username.trim().toLowerCase() + "@rhk.app";
}

// --------------------
// CREATE ACCOUNT
// --------------------
signupForm.addEventListener("submit", async (e) => {

  e.preventDefault();

  const username = document
    .getElementById("signupUsername")
    .value
    .trim()
    .toLowerCase();

  const password = document
    .getElementById("signupPassword")
    .value;

  const confirm = document
    .getElementById("confirmPassword")
    .value;

  if (username.length < 3) {
    alert("Username must be at least 3 characters.");
    return;
  }

  if (password.length < 6) {
    alert("Password must be at least 6 characters.");
    return;
  }

  if (password !== confirm) {
    alert("Passwords do not match.");
    return;
  }

  try {

    // Check if username already exists
    const usernameDoc = await getDoc(
      doc(db, "usernames", username)
    );

    if (usernameDoc.exists()) {
      alert("Username already exists.");
      return;
    }

    const email = usernameToEmail(username);

    const userCredential =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

    const user = userCredential.user;

    // Save profile
    await setDoc(
      doc(db, "users", user.uid),
      {
        uid: user.uid,
        username: username,
        createdAt: new Date().toISOString()
      }
    );

    // Reserve username
    await setDoc(
      doc(db, "usernames", username),
      {
        uid: user.uid
      }
    );

    alert("Account created successfully!");

    window.location.href = "home.html";

  } catch (error) {

    alert(error.message);

  }

});
// --------------------
// LOGIN
// --------------------
loginForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const username = document
        .getElementById("loginUsername")
        .value
        .trim()
        .toLowerCase();

    const password = document
        .getElementById("loginPassword")
        .value;

    if (username === "" || password === "") {
        alert("Please enter username and password.");
        return;
    }

    try {

        // Check whether username exists
        const usernameRef = doc(db, "usernames", username);
        const usernameSnap = await getDoc(usernameRef);

        if (!usernameSnap.exists()) {
            alert("Username not found.");
            return;
        }

        // Convert username to hidden email
        const email = usernameToEmail(username);

        // Login with Firebase Authentication
        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        alert("Login Successful!");

        window.location.href = "home.html";

    } catch (error) {

        switch (error.code) {

            case "auth/invalid-credential":
                alert("Incorrect username or password.");
                break;

            case "auth/wrong-password":
                alert("Incorrect password.");
                break;

            case "auth/user-not-found":
                alert("User not found.");
                break;

            case "auth/too-many-requests":
                alert("Too many login attempts. Try again later.");
                break;

            default:
                alert(error.message);
        }

    }

});

console.log("RHK Authentication Loaded Successfully");
