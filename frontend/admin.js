const adminData = document.getElementById("adminData");
const message = document.getElementById("message");

const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}

async function loadAdmin() {
    try {
        const response = await fetch("http://localhost:3000/api/admin", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            message.textContent = data.message;
            return;
        }

        adminData.innerHTML = `
            <p><strong>${data.message}</strong></p>
            <p><strong>Email:</strong> ${data.user.email}</p>
            <p><strong>Role:</strong> ${data.user.role}</p>
        `;

    } catch (error) {
        console.error(error);
        message.textContent = "Unable to connect to server";
    }
}

loadAdmin();