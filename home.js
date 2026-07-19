// ==========================================
// IMPORT FIREBASE
// ==========================================

import { auth, db } from "./firebase.js";

import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    setDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    onSnapshot,
    arrayUnion,
    arrayRemove
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


// ==========================================
// CLOUDINARY
// ==========================================

const CLOUD_NAME = "nhy9Ifkt";
const UPLOAD_PRESET = "rhk_upload";


// ==========================================
// DOM
// ==========================================

const feed = document.getElementById("feed");
const loader = document.getElementById("loader");
const stories = document.getElementById("storyContainer");

const myProfileImage = document.getElementById("myProfileImage");
const bottomProfile = document.getElementById("bottomProfile");

const template = document.getElementById("postTemplate");

const uploadPopup = document.getElementById("uploadPopup");
const createBtn = document.getElementById("createBtn");
const closeUpload = document.getElementById("closeUpload");
const uploadPostBtn = document.getElementById("uploadPost");

const postFile = document.getElementById("postFile");
const previewArea = document.getElementById("previewArea");
const caption = document.getElementById("caption");


// ==========================================
// VARIABLES
// ==========================================

let currentUser = null;
let currentUserData = null;

let selectedFile = null;


// ==========================================
// AUTH
// ==========================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        location.href = "index.html";
        return;

    }

    currentUser = user;

    await loadCurrentUser();

    loadStories();

    loadPosts();

});


// ==========================================
// LOAD CURRENT USER
// ==========================================

async function loadCurrentUser() {

    const snap = await getDoc(
        doc(db, "users", currentUser.uid)
    );

    if (!snap.exists()) return;

    currentUserData = snap.data();

    myProfileImage.src =
        currentUserData.photoURL || "images/default.png";

    bottomProfile.src =
        currentUserData.photoURL || "images/default.png";

}


// ==========================================
// LOAD STORIES
// ==========================================

function loadStories() {

    const q = query(
        collection(db, "stories"),
        orderBy("createdAt", "desc")
    );

    onSnapshot(q, async (snapshot) => {

        stories.innerHTML = "";

        for (const story of snapshot.docs) {

            const data = story.data();

            const userSnap = await getDoc(
                doc(db, "users", data.uid)
            );

            if (!userSnap.exists()) continue;

            const user = userSnap.data();

            const card = document.createElement("div");

            card.className = "story";

            card.innerHTML = `
            
<div class="storyImage">

<img src="${user.photoURL || 'images/default.png'}">

</div>

<span>${user.username}</span>

`;

            card.onclick = () => {

                openStory(data);

            };

            stories.appendChild(card);

        }

        loader.style.display = "none";

    });

}


// ==========================================
// LOAD POSTS
// ==========================================

function loadPosts() {

    const q = query(

        collection(db, "posts"),

        orderBy("createdAt", "desc")

    );

    onSnapshot(q, async (snapshot) => {

        feed.innerHTML = "";

        for (const post of snapshot.docs) {

            await createPost(post);

        }

    });

}
// ==========================================
// CREATE POST
// ==========================================

async function createPost(postDoc) {

    const post = postDoc.data();

    const userSnap = await getDoc(
        doc(db, "users", post.uid)
    );

    if (!userSnap.exists()) return;

    const user = userSnap.data();

    const clone = template.content.cloneNode(true);

    const root = clone.querySelector(".post");

    const profile = clone.querySelector(".postProfile");
    const username = clone.querySelector(".postUsername");
    const location = clone.querySelector(".postLocation");

    const image = clone.querySelector(".postImage");
    const video = clone.querySelector(".postVideo");

    const likes = clone.querySelector(".likeCount");
    const captionText = clone.querySelector(".captionText");

    const likeBtn = clone.querySelector(".likeBtn");
    const saveBtn = clone.querySelector(".saveBtn");
    const commentBtn = clone.querySelector(".commentBtn");
    const shareBtn = clone.querySelector(".shareBtn");

    const commentInput = clone.querySelector(".commentInput");
    const sendComment = clone.querySelector(".sendComment");

    profile.src = user.photoURL || "images/default.png";

    username.textContent = user.username;

    location.textContent = post.location || "";

    captionText.innerHTML =
        `<b>${user.username}</b> ${post.caption || ""}`;

    likes.textContent =
        `${post.likes ? post.likes.length : 0} Likes`;



    // =============================
    // IMAGE / VIDEO
    // =============================

    if (post.type === "image") {

        image.hidden = false;

        image.src = post.media;

    } else {

        video.hidden = false;

        video.src = post.media;

    }



    // =============================
    // LIKE BUTTON
    // =============================

    if (post.likes &&
        post.likes.includes(currentUser.uid)) {

        likeBtn.classList.add("liked");

        likeBtn.innerHTML =
            `<i class="fa-solid fa-heart"></i>`;

    }

    likeBtn.onclick = async () => {

        const ref = doc(db, "posts", postDoc.id);

        if (likeBtn.classList.contains("liked")) {

            likeBtn.classList.remove("liked");

            likeBtn.innerHTML =
                `<i class="fa-regular fa-heart"></i>`;

            await updateDoc(ref, {

                likes: arrayRemove(currentUser.uid)

            });

        } else {

            likeBtn.classList.add("liked");

            likeBtn.innerHTML =
                `<i class="fa-solid fa-heart"></i>`;

            await updateDoc(ref, {

                likes: arrayUnion(currentUser.uid)

            });

        }

    };



    // =============================
    // SAVE BUTTON
    // =============================

    saveBtn.onclick = () => {

        saveBtn.classList.toggle("saved");

        if (saveBtn.classList.contains("saved")) {

            saveBtn.innerHTML =
                `<i class="fa-solid fa-bookmark"></i>`;

        } else {

            saveBtn.innerHTML =
                `<i class="fa-regular fa-bookmark"></i>`;

        }

    };



    // =============================
    // SHARE BUTTON
    // =============================

    shareBtn.onclick = async () => {

        if (navigator.share) {

            navigator.share({

                title: "Instagram",

                text: post.caption,

                url: location.href

            });

        } else {

            navigator.clipboard.writeText(location.href);

            showToast("Link copied");

        }

    };



    // =============================
    // COMMENT BUTTON
    // =============================

    commentBtn.onclick = () => {

        commentInput.focus();

    };



    // =============================
    // SEND COMMENT
    // =============================

    sendComment.onclick = async () => {

        const text = commentInput.value.trim();

        if (!text) return;

        await addDoc(

            collection(db,
            "posts",
            postDoc.id,
            "comments"),

            {

                uid: currentUser.uid,

                text,

                createdAt: serverTimestamp()

            }

        );

        commentInput.value = "";

        showToast("Comment Added");

    };



    // =============================
    // DOUBLE TAP LIKE
    // =============================

    let lastTap = 0;

    root.querySelector(".postMedia")
        .addEventListener("click", async () => {

            const now = Date.now();

            if (now - lastTap < 300) {

                await updateDoc(
                    doc(db, "posts", postDoc.id),
                    {
                        likes: arrayUnion(currentUser.uid)
                    }
                );

            }

            lastTap = now;

        });

    feed.appendChild(clone);

}
// ==========================================
// CREATE POST POPUP
// ==========================================

createBtn.onclick = () => {
    uploadPopup.classList.add("show");
};

closeUpload.onclick = () => {
    uploadPopup.classList.remove("show");
    previewArea.innerHTML = "";
    postFile.value = "";
    caption.value = "";
    selectedFile = null;
};

uploadPopup.onclick = (e) => {
    if (e.target === uploadPopup) {
        closeUpload.click();
    }
};


// ==========================================
// FILE PREVIEW
// ==========================================

postFile.onchange = () => {

    selectedFile = postFile.files[0];

    if (!selectedFile) return;

    previewArea.innerHTML = "";

    if (selectedFile.type.startsWith("image")) {

        const img = document.createElement("img");

        img.src = URL.createObjectURL(selectedFile);

        previewArea.appendChild(img);

    } else {

        const video = document.createElement("video");

        video.controls = true;

        video.src = URL.createObjectURL(selectedFile);

        previewArea.appendChild(video);

    }

};


// ==========================================
// CLOUDINARY UPLOAD
// ==========================================

async function uploadToCloudinary(file) {

    const formData = new FormData();

    formData.append("file", file);

    formData.append(
        "upload_preset",
        UPLOAD_PRESET
    );

    const response = await fetch(

        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,

        {
            method: "POST",
            body: formData
        }

    );

    return await response.json();

}


// ==========================================
// SHARE POST
// ==========================================

uploadPostBtn.onclick = async () => {

    if (!selectedFile) {

        showToast("Select image or video");

        return;

    }

    uploadPostBtn.disabled = true;

    uploadPostBtn.innerText = "Uploading...";

    try {

        const result =
            await uploadToCloudinary(selectedFile);

        await addDoc(

            collection(db, "posts"),

            {

                uid: currentUser.uid,

                media: result.secure_url,

                type: selectedFile.type.startsWith("image")
                    ? "image"
                    : "video",

                caption: caption.value,

                likes: [],

                createdAt: serverTimestamp()

            }

        );

        showToast("Post Uploaded");

        closeUpload.click();

    } catch (e) {

        console.log(e);

        showToast("Upload Failed");

    }

    uploadPostBtn.disabled = false;

    uploadPostBtn.innerText = "Share";

};


// ==========================================
// STORY VIEWER
// ==========================================

const storyViewer =
document.getElementById("storyViewer");

const storyImage =
document.getElementById("storyImage");

const storyVideo =
document.getElementById("storyVideo");

const storyUserImage =
document.getElementById("storyUserImage");

const storyUserName =
document.getElementById("storyUserName");

const closeStory =
document.getElementById("closeStory");

function openStory(story){

    storyViewer.classList.add("show");

    storyUserImage.src =
        story.profile || "images/default.png";

    storyUserName.innerText =
        story.username || "";

    if(story.type==="image"){

        storyImage.hidden=false;

        storyVideo.hidden=true;

        storyImage.src=story.media;

    }else{

        storyVideo.hidden=false;

        storyImage.hidden=true;

        storyVideo.src=story.media;

    }

}

closeStory.onclick=()=>{

    storyViewer.classList.remove("show");

    storyVideo.pause();

};


// ==========================================
// TOAST
// ==========================================

function showToast(text){

    const toast=document.getElementById("toast");

    toast.innerText=text;

    toast.classList.add("show");

    setTimeout(()=>{

        toast.classList.remove("show");

    },2500);

}


// ==========================================
// NAVIGATION
// ==========================================

document.getElementById("homeNav").onclick=()=>{

    location.href="home.html";

};

document.getElementById("searchNav").onclick=()=>{

    location.href="search.html";

};

document.getElementById("reelsNav").onclick=()=>{

    location.href="reels.html";

};

document.getElementById("activityNav").onclick=()=>{

    location.href="notifications.html";

};

document.getElementById("profileNav").onclick=()=>{

    location.href="profile.html";

};
