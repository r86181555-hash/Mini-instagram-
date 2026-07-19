// Get Elements
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

const showSignup = document.getElementById("showSignup");
const showLogin = document.getElementById("showLogin");

const formTitle = document.getElementById("formTitle");

// ---------------------------
// Show Signup Form
// ---------------------------
showSignup.addEventListener("click", function (e) {

    e.preventDefault();

    loginForm.style.display = "none";
    signupForm.style.display = "flex";

    formTitle.innerText = "Create Account";

});

// ---------------------------
// Show Login Form
// ---------------------------
showLogin.addEventListener("click", function (e) {

    e.preventDefault();

    signupForm.style.display = "none";
    loginForm.style.display = "flex";

    formTitle.innerText = "Login";

});

// ---------------------------
// Press Enter Support
// ---------------------------
document.addEventListener("keydown", function (e) {

    if (e.key === "Enter") {

        const activeForm =
            signupForm.style.display === "flex"
                ? signupForm
                : loginForm;

        activeForm.requestSubmit();

    }

});

// ---------------------------
// Clear Password Fields
// ---------------------------
window.addEventListener("load", () => {

    document.getElementById("loginPassword").value = "";
    document.getElementById("signupPassword").value = "";
    document.getElementById("confirmPassword").value = "";

});

// ---------------------------
// Welcome Message
// ---------------------------
console.log("Welcome to RHK");
