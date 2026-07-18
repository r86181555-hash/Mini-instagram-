// messages.js

import { auth, db, serverTimestamp } from "./firebase.js";

import {
collection,
query,
where,
orderBy,
onSnapshot,
addDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const usersDiv = document.getElementById("chatUsers");
const messagesDiv = document.getElementById("messages");
const sendBtn = document.getElementById("sendBtn");
const messageInput = document.getElementById("messageInput");

const chatWindow = document.getElementById("chatWindow");
const chatName = document.getElementById("chatName");
const chatDP = document.getElementById("chatDP");

let currentUser = null;
let selectedUser = null;

onAuthStateChanged(auth, user => {

    if (!user) {

        location.href = "index.html";
        return;

    }

    currentUser = user;

    loadUsers();

});

function loadUsers() {

    const q = query(collection(db, "users"));

    onSnapshot(q, snap => {

        usersDiv.innerHTML = "";

        snap.forEach(docSnap => {

            const user = docSnap.data();

            if (user.uid === currentUser.uid) return;

            usersDiv.innerHTML += `

<div class="chat-user"

onclick="openChat(

'${user.uid}',

'${user.username}',

'${user.photo}'

)">

<img src="${user.photo}">

<div>

<h4>${user.username}</h4>

<p>Tap to chat</p>

</div>

</div>

`;

        });

    });

}

window.openChat = function(uid, name, photo) {

    selectedUser = uid;

    chatWindow.style.display = "block";

    chatName.innerText = name;

    chatDP.src = photo;

    loadMessages();

}

function loadMessages() {

    const room =

        [currentUser.uid, selectedUser]

        .sort()

        .join("_");

    const q = query(

        collection(db, "chats", room, "messages"),

        orderBy("createdAt")

    );

    onSnapshot(q, snap => {

        messagesDiv.innerHTML = "";

        snap.forEach(docSnap => {

            const m = docSnap.data();

            messagesDiv.innerHTML += `

<div class="message

${

m.sender === currentUser.uid

?

"sent"

:

"received"

}">

${m.text}

</div>

`;

        });

        messagesDiv.scrollTop =
            messagesDiv.scrollHeight;

    });

}

sendBtn.onclick = async () => {

    if (!selectedUser) return;

    if (!messageInput.value.trim()) return;

    const room =

        [currentUser.uid, selectedUser]

        .sort()

        .join("_");

    await addDoc(

        collection(db, "chats", room, "messages"),

        {

            sender: currentUser.uid,

            receiver: selectedUser,

            text: messageInput.value,

            createdAt: serverTimestamp()

        }

    );

    messageInput.value = "";

};
// ==========================================
// Typing Indicator
// ==========================================

import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

let typingTimeout;

messageInput.addEventListener("input", async () => {

    if (!selectedUser) return;

    const room = [currentUser.uid, selectedUser]
        .sort()
        .join("_");

    await setDoc(
        doc(db, "typing", room),
        {
            [currentUser.uid]: true
        },
        { merge: true }
    );

    clearTimeout(typingTimeout);

    typingTimeout = setTimeout(async () => {

        await updateDoc(
            doc(db, "typing", room),
            {
                [currentUser.uid]: false
            }
        );

    }, 1500);

});

function watchTyping() {

    if (!selectedUser) return;

    const room = [currentUser.uid, selectedUser]
        .sort()
        .join("_");

    onSnapshot(doc(db, "typing", room), snap => {

        if (!snap.exists()) return;

        const data = snap.data();

        let typing =
            data[selectedUser];

        let indicator =
            document.getElementById("typingIndicator");

        if (!indicator) {

            indicator = document.createElement("p");

            indicator.id = "typingIndicator";

            indicator.className = "typing";

            chatWindow.appendChild(indicator);

        }

        indicator.innerText =
            typing ? "Typing..." : "";

    });

}

// ==========================================
// Seen Status
// ==========================================

async function markSeen(messageId) {

    const room = [currentUser.uid, selectedUser]
        .sort()
        .join("_");

    await updateDoc(
        doc(db,
            "chats",
            room,
            "messages",
            messageId),
        {
            seen: true
        }
    );

}

// ==========================================
// Delete Message
// ==========================================

window.deleteMessage = async function(id) {

    if (!confirm("Delete message?")) return;

    const room = [currentUser.uid, selectedUser]
        .sort()
        .join("_");

    await deleteDoc(
        doc(
            db,
            "chats",
            room,
            "messages",
            id
        )
    );

};

// ==========================================
// Online Status
// ==========================================

async function setOnline(status) {

    await updateDoc(
        doc(db, "users", currentUser.uid),
        {
            online: status
        }
    );

}

window.addEventListener("focus", () => {

    if (currentUser)
        setOnline(true);

});

window.addEventListener("blur", () => {

    if (currentUser)
        setOnline(false);

});

// ==========================================
// Send Image
// ==========================================

window.sendImage = async function(imageURL) {

    const room = [currentUser.uid, selectedUser]
        .sort()
        .join("_");

    await addDoc(
        collection(db,
            "chats",
            room,
            "messages"),
        {
            sender: currentUser.uid,
            receiver: selectedUser,
            image: imageURL,
            createdAt: serverTimestamp()
        }
    );

};

// ==========================================
// Emoji Shortcut
// ==========================================

messageInput.addEventListener("keydown", e => {

    if (e.key === "Enter") {

        sendBtn.click();

    }

});

// Start typing listener
watchTyping();
