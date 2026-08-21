const studentsBody = document.getElementById("studentsBody");
const pageInfo = document.getElementById("pageInfo");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const message = document.getElementById("message");

let currentPage = 1;
const limit = 10;

async function loadStudents(page) {
    try {
        const response = await fetch(
            `http://localhost:3000/api/students?page=${page}&limit=${limit}`
        );

        const data = await response.json();

        if (!response.ok) {
            message.textContent = data.message;
            return;
        }

        studentsBody.innerHTML = data.students.map(student => `
            <tr>
                <td>${student.student_id}</td>
                <td>${student.name}</td>
                <td>${student.email}</td>
                <td>${student.major}</td>
            </tr>
        `).join("");

        pageInfo.textContent = `Page ${data.page}`;

        currentPage = data.page;

        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = data.students.length < limit;

    } catch (error) {
        console.error(error);
        message.textContent = "Unable to connect to server";
    }
}

prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
        loadStudents(currentPage - 1);
    }
});

nextBtn.addEventListener("click", () => {
    loadStudents(currentPage + 1);
});

loadStudents(currentPage);