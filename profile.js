// profile.js

import { auth, db } from "./firebase.js";
import { uploadImage } from "./cloudinary.js";

import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const profileDP = document.getElementById("profileDP");
const username = document.getElementById("username");
const bio = document.getElementById("profileBio");

const followers = document.getElementById("followersCount");
const following = document.getElementById("followingCount");
const posts = document.getElementById("postCount");

const editBtn = document.getElementById("editBtn");
const editSection = document.getElementById("editSection");

const saveBtn = document.getElementById("saveProfile");

const bioInput = document.getElementById("bioInput");
const dpUpload = document.getElementById("dpUpload");

const postGrid = document.getElementById("profilePosts");

let currentUser = null;

onAuthStateChanged(auth, async user => {

    if (!user) {

        location.href = "index.html";
        return;

    }

    currentUser = user;

    loadProfile();
    loadPosts();

});

async function loadProfile() {

    const snap = await getDoc(
        doc(db, "users", currentUser.uid)
    );

    if (!snap.exists()) return;

    const data = snap.data();

    username.textContent = data.username;

    bio.textContent = data.bio || "";

    profileDP.src =
        data.photo ||
        "https://i.pravatar.cc/300";

    followers.textContent =
        data.followers?.length || 0;

    following.textContent =
        data.following?.length || 0;

}

function loadPosts() {

    const q = query(

        collection(db, "posts"),

        where("uid", "==", currentUser.uid)

    );

    onSnapshot(q, snap => {

        posts.textContent = snap.size;

        if (!postGrid) return;

        postGrid.innerHTML = "";

        snap.forEach(docSnap => {

            const post = docSnap.data();

            postGrid.innerHTML += `

<img
src="${
post.image ||
'https://placehold.co/400'
}"
class="grid-post">

`;

        });

    });

}

// =========================
// EDIT PROFILE
// =========================

editBtn.onclick = () => {

    editSection.style.display =
        editSection.style.display === "none"

            ? "block"

            : "none";

};

// =========================
// SAVE PROFILE
// =========================

saveBtn.onclick = async () => {

    saveBtn.disabled = true;

    let photo = profileDP.src;

    if (dpUpload.files.length) {

        const uploaded =
            await uploadImage(dpUpload.files[0]);

        photo = uploaded.url;

    }

    await updateDoc(

        doc(db, "users", currentUser.uid),

        {

            bio: bioInput.value,

            photo

        }

    );

    alert("Profile Updated");

    location.reload();

};
// ==========================================
// FOLLOW / UNFOLLOW
// ==========================================

import {
  arrayUnion,
  arrayRemove,
  addDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

window.followUser = async function(targetUid){

    if(targetUid===currentUser.uid) return;

    const myRef=doc(db,"users",currentUser.uid);
    const targetRef=doc(db,"users",targetUid);

    const mySnap=await getDoc(myRef);

    const following=mySnap.data().following||[];

    if(following.includes(targetUid)){

        await updateDoc(myRef,{
            following:arrayRemove(targetUid)
        });

        await updateDoc(targetRef,{
            followers:arrayRemove(currentUser.uid)
        });

    }else{

        await updateDoc(myRef,{
            following:arrayUnion(targetUid)
        });

        await updateDoc(targetRef,{
            followers:arrayUnion(currentUser.uid)
        });

        await addDoc(collection(db,"notifications"),{

            type:"follow",

            from:currentUser.uid,

            to:targetUid,

            createdAt:new Date(),

            seen:false

        });

    }

};

// ==========================================
// SHARE PROFILE
// ==========================================

window.shareProfile = async function(){

    const url=location.href;

    if(navigator.share){

        await navigator.share({

            title:"My Profile",

            url

        });

    }else{

        await navigator.clipboard.writeText(url);

        alert("Profile link copied.");

    }

};

// ==========================================
// LOGOUT
// ==========================================

import {
signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

window.logout=async()=>{

    if(!confirm("Logout?")) return;

    await signOut(auth);

    location.href="index.html";

};

// ==========================================
// DARK MODE
// ==========================================

window.toggleTheme=function(){

    document.body.classList.toggle("light");

    localStorage.setItem(

        "theme",

        document.body.classList.contains("light")

        ?"light"

        :"dark"

    );

};

const savedTheme=localStorage.getItem("theme");

if(savedTheme==="light"){

    document.body.classList.add("light");

}

// ==========================================
// PROFILE STATISTICS
// ==========================================

async function profileStats(){

    const snap=await getDoc(

        doc(db,"users",currentUser.uid)

    );

    if(!snap.exists()) return;

    const d=snap.data();

    console.table({

        Followers:d.followers?.length||0,

        Following:d.following?.length||0,

        Posts:posts.textContent,

        Bio:d.bio

    });

}

profileStats();

// ==========================================
// STORY HIGHLIGHTS
// ==========================================

function loadHighlights(){

    const highlights=document.getElementById("highlights");

    if(!highlights) return;

    const demo=[

        {
            title:"Travel",
            image:"https://picsum.photos/100?1"
        },

        {
            title:"Food",
            image:"https://picsum.photos/100?2"
        },

        {
            title:"Work",
            image:"https://picsum.photos/100?3"
        }

    ];

    highlights.innerHTML="";

    demo.forEach(item=>{

        highlights.innerHTML+=`

        <div class="story">

        <img src="${item.image}">

        <p>${item.title}</p>

        </div>

        `;

    });

}

loadHighlights();

// ==========================================
// VERIFIED BADGE
// ==========================================

async function showVerification(){

    const snap=await getDoc(

        doc(db,"users",currentUser.uid)

    );

    if(!snap.exists()) return;

    const data=snap.data();

    if(data.verified){

        username.innerHTML +=
        ` <i class="fa-solid fa-circle-check"
        style="color:#0095f6"></i>`;

    }

}

showVerification();
