const profileData = document.getElementById("profileData");
const message = document.getElementById("message");
const logoutBtn = document.getElementById("logoutBtn");

const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}

async function loadProfile() {
    try {
        const response = await fetch("http://localhost:3000/api/profile", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            message.textContent = data.message;
            localStorage.removeItem("token");
            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);
            return;
        }

        profileData.innerHTML = `
            <p><strong>Email:</strong> ${data.user.email}</p>
            <p><strong>Role:</strong> ${data.user.role}</p>
        `;

    } catch (error) {
        console.error(error);
        message.textContent = "Unable to connect to server";
    }
}

logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "login.html";
});

loadProfile();

const avatarForm = document.getElementById("avatarForm");
const avatarInput = document.getElementById("avatarInput");
const avatarPreview = document.getElementById("avatarPreview");
const avatarMessage = document.getElementById("avatarMessage");

avatarForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const file = avatarInput.files[0];

    if (!file) {
        avatarMessage.textContent = "Please select an image";
        return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    try {
        const response = await fetch("http://localhost:3000/api/profile/avatar", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            avatarMessage.textContent = data.message;
            return;
        }

        avatarMessage.textContent = "Avatar uploaded successfully";

        avatarPreview.src = data.avatar;
        avatarPreview.style.display = "block";

    } catch (error) {
        console.error(error);
        avatarMessage.textContent = "Unable to connect to server";
    }
});