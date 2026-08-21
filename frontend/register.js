const registerForm = document.getElementById("registerForm");
const message = document.getElementById("message");

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("http://localhost:3000/api/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            message.textContent = data.message;
            return;
        }

        message.textContent = "Account created successfully. Redirecting to login...";

        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);

    } catch (error) {
        console.error(error);
        message.textContent = "Unable to connect to server";
    }
});