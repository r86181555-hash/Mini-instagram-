// upload.js

import { auth, db, serverTimestamp } from "./firebase.js";
import { uploadImage, uploadVideo } from "./cloudinary.js";

import {
addDoc,
collection
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const fileInput = document.getElementById("image");
const preview = document.getElementById("preview");
const caption = document.getElementById("caption");
const uploadBtn = document.getElementById("uploadBtn");
const status = document.getElementById("status");

let currentUser = null;
let selectedFile = null;

onAuthStateChanged(auth, user => {

    if (!user) {

        location.href = "index.html";
        return;

    }

    currentUser = user;

});

// --------------------
// Preview
// --------------------

fileInput.onchange = () => {

    selectedFile = fileInput.files[0];

    if (!selectedFile) return;

    const reader = new FileReader();

    reader.onload = e => {

        preview.style.display = "block";

        if (selectedFile.type.startsWith("image")) {

            preview.src = e.target.result;

        } else {

            preview.outerHTML = `
            <video
            id="preview"
            controls
            style="
            width:100%;
            border-radius:15px;
            margin-top:20px;">
            <source src="${e.target.result}">
            </video>
            `;

        }

    };

    reader.readAsDataURL(selectedFile);

};

// --------------------
// Upload
// --------------------

uploadBtn.onclick = async () => {

    if (!selectedFile) {

        alert("Select a file first.");
        return;

    }

    uploadBtn.disabled = true;

    status.innerHTML = "Uploading...";

    try {

        let mediaURL = "";
        let videoURL = "";

        if (selectedFile.type.startsWith("image")) {

            const result =
                await uploadImage(selectedFile);

            mediaURL = result.url;

        } else {

            const result =
                await uploadVideo(selectedFile);

            videoURL = result.url;

        }

        await addDoc(collection(db, "posts"), {

            uid: currentUser.uid,

            username:
                currentUser.displayName,

            userPhoto:
                currentUser.photoURL ||

                "https://i.pravatar.cc/300",

            caption:
                caption.value.trim(),

            image: mediaURL,

            video: videoURL,

            likes: [],

            savedBy: [],

            createdAt:
                serverTimestamp()

        });

        status.innerHTML =
            "✅ Post Uploaded";

        setTimeout(() => {

            location.href = "home.html";

        }, 1000);

    } catch (err) {

        console.error(err);

        status.innerHTML =
            "Upload failed";

    }

    uploadBtn.disabled = false;

};
// ==========================================
// DRAG & DROP
// ==========================================

const dropzone = document.getElementById("dropzone");

if (dropzone) {

    ["dragenter", "dragover"].forEach(event => {

        dropzone.addEventListener(event, e => {

            e.preventDefault();
            dropzone.style.borderColor = "#0095f6";

        });

    });

    ["dragleave", "drop"].forEach(event => {

        dropzone.addEventListener(event, e => {

            e.preventDefault();
            dropzone.style.borderColor = "#444";

        });

    });

    dropzone.addEventListener("drop", e => {

        const file = e.dataTransfer.files[0];

        if (!file) return;

        fileInput.files = e.dataTransfer.files;

        fileInput.dispatchEvent(new Event("change"));

    });

}

// ==========================================
// HASHTAGS
// ==========================================

function extractHashtags(text) {

    return text.match(/#[a-zA-Z0-9_]+/g) || [];

}

// ==========================================
// MENTIONS
// ==========================================

function extractMentions(text) {

    return text.match(/@[a-zA-Z0-9_]+/g) || [];

}

// ==========================================
// LOCATION
// ==========================================

async function getLocation() {

    return new Promise(resolve => {

        if (!navigator.geolocation) {

            resolve(null);
            return;

        }

        navigator.geolocation.getCurrentPosition(

            pos => {

                resolve({

                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude

                });

            },

            () => resolve(null)

        );

    });

}

// ==========================================
// FILE SIZE CHECK
// ==========================================

function validateFile(file) {

    const maxSize = 50 * 1024 * 1024;

    if (file.size > maxSize) {

        alert("Maximum file size is 50 MB");

        return false;

    }

    return true;

}

// ==========================================
// IMAGE COMPRESSION
// ==========================================

async function compressImage(file) {

    if (!file.type.startsWith("image/")) {

        return file;

    }

    return file;

}

// ==========================================
// CAPTION PREVIEW
// ==========================================

caption.addEventListener("input", () => {

    const hashtags = extractHashtags(caption.value);

    const mentions = extractMentions(caption.value);

    console.log("Tags:", hashtags);

    console.log("Mentions:", mentions);

});

// ==========================================
// CHARACTER LIMIT
// ==========================================

const LIMIT = 2200;

caption.addEventListener("input", () => {

    if (caption.value.length > LIMIT) {

        caption.value =
            caption.value.substring(0, LIMIT);

    }

});

// ==========================================
// COPY CAPTION
// ==========================================

window.copyCaption = () => {

    navigator.clipboard.writeText(caption.value);

};

// ==========================================
// CLEAR FORM
// ==========================================

window.clearUpload = () => {

    fileInput.value = "";

    caption.value = "";

    preview.style.display = "none";

    status.innerHTML = "";

};

// ==========================================
// ESTIMATED READING TIME
// ==========================================

window.captionStats = () => {

    const words =
        caption.value.trim().split(/\s+/).length;

    return {

        words,

        hashtags: extractHashtags(caption.value).length,

        mentions: extractMentions(caption.value).length

    };

};
