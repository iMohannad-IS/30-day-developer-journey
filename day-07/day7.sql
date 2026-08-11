USE day7_db;

-- =========================================
-- Day 7 - Advanced SQL Queries
-- =========================================


-- 1. JOIN
-- Display students with their courses and grades

SELECT 
    s.name,
    c.course_name,
    e.grade
FROM students s
JOIN enrollments e
    ON s.student_id = e.student_id
JOIN courses c
    ON e.course_id = c.course_id;


-- 2. AVG + GROUP BY
-- Calculate the average grade for each student

SELECT 
    s.name,
    AVG(e.grade) AS average_grade
FROM students s
JOIN enrollments e
    ON s.student_id = e.student_id
GROUP BY s.student_id, s.name;


-- 3. HAVING
-- Students whose average grade is greater than 90

SELECT 
    s.name,
    AVG(e.grade) AS average_grade
FROM students s
JOIN enrollments e
    ON s.student_id = e.student_id
GROUP BY s.student_id, s.name
HAVING AVG(e.grade) > 90;


-- 4. Subquery + WHERE
-- Grades higher than the overall average

SELECT 
    s.name,
    e.grade
FROM students s
JOIN enrollments e
    ON s.student_id = e.student_id
WHERE e.grade > (
    SELECT AVG(grade)
    FROM enrollments
);


-- 5. Subquery + HAVING
-- Students whose average is higher than
-- the overall average

SELECT 
    s.name,
    AVG(e.grade) AS average_grade
FROM students s
JOIN enrollments e
    ON s.student_id = e.student_id
GROUP BY s.student_id, s.name
HAVING AVG(e.grade) > (
    SELECT AVG(grade)
    FROM enrollments
);


-- 6. CTE
-- Calculate student averages first,
-- then filter students with an average above 90

WITH student_averages AS (
    SELECT 
        s.student_id,
        s.name,
        AVG(e.grade) AS average_grade
    FROM students s
    JOIN enrollments e
        ON s.student_id = e.student_id
    GROUP BY s.student_id, s.name
)
SELECT 
    name,
    average_grade
FROM student_averages
WHERE average_grade > 90;