import { auth, db, googleProvider } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// ---------------- LOGIN ----------------

const loginBtn = document.getElementById("loginBtn");

if (loginBtn) {
  loginBtn.onclick = async () => {

    const email = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;

    try {

      await signInWithEmailAndPassword(auth, email, password);

      location.href = "home.html";

    } catch (e) {

      alert(e.message);

    }

  };
}

// ---------------- SIGNUP ----------------

const signupBtn = document.getElementById("signupBtn");

if (signupBtn) {

  signupBtn.onclick = async () => {

    const username =
      document.getElementById("signupUsername").value.trim();

    const password =
      document.getElementById("signupPassword").value;

    const email = username + "@rhk.app";

    try {

      const result =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      await updateProfile(result.user, {
        displayName: username
      });

      await setDoc(doc(db, "users", result.user.uid), {

        uid: result.user.uid,
        username,
        email,
        bio: "",
        photo:
          "https://i.pravatar.cc/300",

        followers: [],
        following: [],
        verified: false,

        createdAt: serverTimestamp()

      });

      location.href = "home.html";

    } catch (e) {

      alert(e.message);

    }

  };

}

// ---------------- GOOGLE LOGIN ----------------

const googleBtn = document.getElementById("googleBtn");

if (googleBtn) {

  googleBtn.onclick = async () => {

    try {

      const result =
        await signInWithPopup(
          auth,
          googleProvider
        );

      const ref =
        doc(db, "users", result.user.uid);

      const snap =
        await getDoc(ref);

      if (!snap.exists()) {

        await setDoc(ref, {

          uid: result.user.uid,

          username:
            result.user.displayName,

          email:
            result.user.email,

          photo:
            result.user.photoURL,

          bio: "",

          followers: [],

          following: [],

          verified: false,

          createdAt:
            serverTimestamp()

        });

      }

      location.href = "home.html";

    } catch (e) {

      alert(e.message);

    }

  };

}

// ---------------- RESET PASSWORD ----------------

const resetBtn =
  document.getElementById("resetBtn");

if (resetBtn) {

  resetBtn.onclick = async () => {

    const email = prompt("Enter Email");

    if (!email) return;

    try {

      await sendPasswordResetEmail(
        auth,
        email
      );

      alert("Reset email sent.");

    } catch (e) {

      alert(e.message);

    }

  };

}

// ---------------- AUTO LOGIN ----------------

onAuthStateChanged(auth, user => {

  if (!user) {

    if (
      location.pathname.includes("home") ||
      location.pathname.includes("profile") ||
      location.pathname.includes("upload") ||
      location.pathname.includes("messages") ||
      location.pathname.includes("reels") ||
      location.pathname.includes("story")
    ) {

      location.href = "index.html";

    }

  }

});

// ---------------- LOGOUT ----------------

window.logout = async () => {

  await signOut(auth);

  location.href = "index.html";

};
