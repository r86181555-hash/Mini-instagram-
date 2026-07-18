// home.js
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  addDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import { auth, db, serverTimestamp } from "./firebase.js";

import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  addDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const feed = document.getElementById("feed");
const stories = document.getElementById("stories");

let currentUser = null;

onAuthStateChanged(auth, user => {

    if (!user) {
        location.href = "index.html";
        return;
    }

    currentUser = user;

    loadFeed();
    loadStories();

});

function loadFeed() {

    const q = query(
        collection(db, "posts"),
        orderBy("createdAt", "desc")
    );

    onSnapshot(q, snapshot => {

        feed.innerHTML = "";

        snapshot.forEach(docSnap => {

            const post = docSnap.data();

            const liked =
                post.likes?.includes(currentUser.uid);

            feed.innerHTML += `

<div class="post">

<div class="post-header">

<div class="post-user">

<img src="${post.userPhoto}">

<div>

<div class="post-username">

${post.username}

</div>

<div class="post-location">

${post.location || ""}

</div>

</div>

</div>

<i class="fa-solid fa-ellipsis"></i>

</div>

<div style="position:relative;">

<img
class="post-image"
src="${post.image}">

<i class="fa-solid fa-heart big-heart"></i>

</div>

<div class="post-actions">

<div class="left-actions">

<i
class="${liked ?
'fa-solid like' :
'fa-regular'} fa-heart"

onclick="toggleLike('${docSnap.id}')">

</i>

<i
class="fa-regular fa-comment">

</i>

<i
class="fa-regular fa-paper-plane">

</i>

</div>

<i
class="fa-regular fa-bookmark">

</i>

</div>

<div class="post-likes">

${post.likes?.length || 0} likes

</div>

<div class="post-caption">

<span>${post.username}</span>

${post.caption}

</div>

<div
class="post-comments"

onclick="openComments('${docSnap.id}')">

View comments

</div>

<div class="post-time">

Just now

</div>

</div>

`;

        });

    });

}
// ==========================
// LIKE / UNLIKE
// ==========================

window.toggleLike = async function (postId) {

    const ref = doc(db, "posts", postId);

    const icon = event.target;

    const liked = icon.classList.contains("fa-solid");

    try {

        if (liked) {

            await updateDoc(ref, {
                likes: arrayRemove(currentUser.uid)
            });

        } else {

            await updateDoc(ref, {
                likes: arrayUnion(currentUser.uid)
            });

        }

    } catch (err) {

        console.error(err);

    }

};

// ==========================
// SHARE POST
// ==========================

window.sharePost = async function (image, caption) {

    if (navigator.share) {

        try {

            await navigator.share({

                title: "RHK",

                text: caption,

                url: image

            });

        } catch (e) {}

    } else {

        navigator.clipboard.writeText(image);

        alert("Post link copied.");

    }

};

// ==========================
// COMMENTS
// ==========================

window.openComments = function (postId) {

    const text = prompt("Write a comment");

    if (!text) return;

    addDoc(collection(db, "posts", postId, "comments"), {

        uid: currentUser.uid,

        username: currentUser.displayName,

        comment: text,

        createdAt: serverTimestamp()

    });

};

// ==========================
// STORIES
// ==========================

function loadStories() {

    const q = query(
        collection(db, "stories"),
        orderBy("createdAt", "desc")
    );

    onSnapshot(q, snap => {

        stories.innerHTML = "";

        snap.forEach(docSnap => {

            const s = docSnap.data();

            stories.innerHTML += `

<div class="story"
onclick="viewStory('${s.media}')">

<img src="${s.photo}">

<p>${s.username}</p>

</div>

`;

        });

    });

}

window.viewStory = function (url) {

    const win = window.open("");

    win.document.write(`

<style>

body{

margin:0;

background:#000;

display:flex;

justify-content:center;

align-items:center;

height:100vh;

}

img,video{

max-width:100%;

max-height:100%;

}

</style>

${url.endsWith(".mp4")
? `<video controls autoplay src="${url}"></video>`
: `<img src="${url}">`}

`);

};

// ==========================
// DOUBLE TAP LIKE
// ==========================

document.addEventListener("dblclick", e => {

    const image = e.target.closest(".post-image");

    if (!image) return;

    const heart =
        image.parentElement.querySelector(".big-heart");

    heart.classList.add("show");

    setTimeout(() => {

        heart.classList.remove("show");

    }, 800);

});

// ==========================
// SIMPLE INFINITE SCROLL
// ==========================

window.addEventListener("scroll", () => {

    if (

        window.innerHeight +
        window.scrollY >=

        document.body.offsetHeight - 300

    ) {

        console.log("Load more posts...");

        // Future pagination

    }

});
// ==========================================
// SAVE / UNSAVE POSTS
// ==========================================

window.toggleSave = async function(postId){

    const ref = doc(db,"posts",postId);

    const snap = await getDoc(ref);

    if(!snap.exists()) return;

    const post = snap.data();

    const saved = post.savedBy?.includes(currentUser.uid);

    try{

        if(saved){

            await updateDoc(ref,{
                savedBy:arrayRemove(currentUser.uid)
            });

        }else{

            await updateDoc(ref,{
                savedBy:arrayUnion(currentUser.uid)
            });

        }

    }catch(err){

        console.error(err);

    }

};

// ==========================================
// FOLLOW / UNFOLLOW
// ==========================================

window.toggleFollow = async function(targetUid){

    if(targetUid===currentUser.uid) return;

    const myRef = doc(db,"users",currentUser.uid);

    const targetRef = doc(db,"users",targetUid);

    const mySnap = await getDoc(myRef);

    const following =
        mySnap.data().following || [];

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

            createdAt:serverTimestamp(),

            seen:false

        });

    }

};

// ==========================================
// NOTIFICATIONS
// ==========================================

async function sendNotification(type,to,postId=""){

    if(!to) return;

    await addDoc(collection(db,"notifications"),{

        type,

        from:currentUser.uid,

        to,

        postId,

        seen:false,

        createdAt:serverTimestamp()

    });

}

// ==========================================
// RELATIVE TIME
// ==========================================

window.timeAgo = function(date){

    if(!date) return "";

    const seconds =
        Math.floor(
            (Date.now()-date.toDate())/1000
        );

    if(seconds<60) return "Just now";

    if(seconds<3600)
        return Math.floor(seconds/60)+"m";

    if(seconds<86400)
        return Math.floor(seconds/3600)+"h";

    if(seconds<604800)
        return Math.floor(seconds/86400)+"d";

    return Math.floor(seconds/604800)+"w";

};

// ==========================================
// MEDIA TEMPLATE
// ==========================================

window.renderMedia = function(post){

    if(post.video){

        return `
        <video
        class="post-image"
        controls
        playsinline
        preload="metadata">

            <source
            src="${post.video}"
            type="video/mp4">

        </video>
        `;

    }

    if(post.images && post.images.length){

        return `

        <div class="carousel">

        ${post.images.map(img=>`

        <img
        class="post-image"
        src="${img}">

        `).join("")}

        </div>

        `;

    }

    return `

    <img
    class="post-image"
    src="${post.image}">

    `;

};

// ==========================================
// LOADING SKELETON
// ==========================================

window.showSkeleton = function(){

feed.innerHTML=`

<div class="card">

<div class="skeleton skeleton-avatar"></div>

<div class="skeleton skeleton-text"></div>

<div class="skeleton skeleton-image"></div>

</div>

<div class="card">

<div class="skeleton skeleton-avatar"></div>

<div class="skeleton skeleton-text"></div>

<div class="skeleton skeleton-image"></div>

</div>

`;

};

// ==========================================
// GLOBAL ERROR LOGGER
// ==========================================

window.addEventListener("error",e=>{

console.error("App Error:",e.message);

});

// ==========================================
// CONNECTION STATUS
// ==========================================

window.addEventListener("offline",()=>{

alert("You are offline.");

});

window.addEventListener("online",()=>{

console.log("Connection restored.");

});
