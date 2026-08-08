const API_URL =
    "https://functions.yandexcloud.net/d4e8345m7p4h6fmheoae";

const TEACHER_LOGIN = "Elena_Admin";


/* =========================================================
   STATE
========================================================= */

let currentGroupId = "";
let currentBankTaskId =
    "EGE_R1_TEST01_Reading_Task_1";

let currentTaskStatus = [];

let currentAssignmentItems = [];

let currentStudents = [];

/* =========================================================
   ELEMENTS
========================================================= */

const loadingScreen =
    document.getElementById("loading");

const errorScreen =
    document.getElementById("error-screen");

const errorMessage =
    document.getElementById("error-message");

const teacherApp =
    document.getElementById("teacher-app");

const teacherName =
    document.getElementById("teacher-name");

const courseSelect =
    document.getElementById("course-select");

const groupSelect =
    document.getElementById("group-select");

const overviewStudents =
    document.getElementById("overview-students");

const overviewWorking =
    document.getElementById("overview-working");

const overviewCheck =
    document.getElementById("overview-check");

const overviewOverdue =
    document.getElementById("overview-overdue");

const progressTable =
    document.getElementById("progress-table");

const assignmentsTable =
    document.getElementById("assignments-table");

const taskBank =
    document.getElementById("task-bank");

const skillTabs =
    document.getElementById("skill-tabs");


/* =========================================================
   API
========================================================= */

async function apiGet(params) {
    const query =
        new URLSearchParams(params);

    const response =
        await fetch(
            `${API_URL}?${query.toString()}`
        );

    const data =
        await response.json();

    if (!response.ok || !data.ok) {
        throw new Error(
            data.error ||
            "Could not load data"
        );
    }

    return data;
}


/* =========================================================
   GROUPS
========================================================= */

/*
   Пока в API у нас ещё нет отдельного action=groups.
   Поэтому на первом этапе используем нашу тестовую группу.
   Следующим шагом заменим это реальной загрузкой всех групп.
*/

function loadGroups() {
    const groups = [
        {
            group_id:
                "group_ege_test_01",

            name:
                "EGE Test Group"
        }
    ];

    groupSelect.innerHTML = "";

    groups.forEach(group => {
        const option =
            document.createElement("option");

        option.value =
            group.group_id;

        option.textContent =
            group.name;

        groupSelect.appendChild(option);
    });

    currentGroupId =
        groups[0].group_id;
}


/* =========================================================
   OVERVIEW
========================================================= */

function updateOverview(
    students,
    assignments
) {
    /* -----------------------------
       ALL ACTIVE STUDENTS
    ----------------------------- */

    overviewStudents.textContent =
        students.length;


    /* -----------------------------
       UNIQUE STUDENTS BY STATUS
    ----------------------------- */

    const workingStudents =
        new Set();

    const checkStudents =
        new Set();

    const overdueStudents =
        new Set();


    assignments.forEach(item => {

        if (
            item.status ===
            "IN_PROGRESS"
        ) {
            workingStudents.add(
                item.student_id
            );
        }


        if (
            item.status ===
                "AWAITING_REVIEW" ||
            item.status ===
                "SUBMITTED"
        ) {
            checkStudents.add(
                item.student_id
            );
        }


        if (
            item.status ===
            "OVERDUE"
        ) {
            overdueStudents.add(
                item.student_id
            );
        }
    });


    overviewWorking.textContent =
        workingStudents.size;

    overviewCheck.textContent =
        checkStudents.size;

    overviewOverdue.textContent =
        overdueStudents.size;
}

/* =========================================================
   CURRENT TASK STATUS
========================================================= */

async function loadTaskStatus() {
    const data =
        await apiGet({
            login:
                TEACHER_LOGIN,

            action:
                "task-status",

            group_id:
                currentGroupId,

            bank_task_id:
                currentBankTaskId
        });

    currentTaskStatus =
        data.students || [];

    
    
    renderTaskBank(
        currentTaskStatus
    );

}


/* =========================================================
   PROGRESS
========================================================= */

function renderProgress(students) {
    progressTable.innerHTML = "";

    if (!students.length) {
        progressTable.innerHTML = `
            <div class="empty-state">
                No students in this group.
            </div>
        `;
        return;
    }

    const skills = [
        "L1", "L2", "L3",
        "R1", "R2", "R3",
        "G1", "G2", "G3",
        "W1", "W2",
        "S1", "S2", "S3", "S4"
    ];

    const header =
        document.createElement("div");

    header.className = "skills-header";

    header.innerHTML = `
    <div class="skills-student-title">
        Student
    </div>

    <div class="skill-group group-listening">
        Listening
    </div>

    <div class="skill-group group-reading">
        Reading
    </div>

    <div class="skill-group group-grammar">
        Grammar
    </div>

    <div class="skill-group group-writing">
        Writing
    </div>

    <div class="skill-group group-speaking">
        Speaking
    </div>

    <div class="skill-head">L1</div>
    <div class="skill-head">L2</div>
    <div class="skill-head">L3</div>

    <div class="skill-head">R1</div>
    <div class="skill-head">R2</div>
    <div class="skill-head">R3</div>

    <div class="skill-head">G1</div>
    <div class="skill-head">G2</div>
    <div class="skill-head">G3</div>

    <div class="skill-head">W1</div>
    <div class="skill-head">W2</div>

    <div class="skill-head">S1</div>
    <div class="skill-head">S2</div>
    <div class="skill-head">S3</div>
    <div class="skill-head">S4</div>
`;

    progressTable.appendChild(header);


    students.forEach(student => {

        const row =
            document.createElement("div");

        row.className = "skills-row";

        const cells =
            skills.map(skill => {

                const item =
                    student.progress &&
                    student.progress[skill]
                        ? student.progress[skill]
                        : null;

                if (!item) {
                    return `
                        <button
                            class="skill-cell empty-skill"
                            type="button"
                            disabled
                        >
                            —
                        </button>
                    `;
                }

                return `
                    <button
                        class="skill-cell"
                        type="button"
                        data-student-id="${student.student_id}"
                        data-skill="${skill}"
                    >
                        ${item.average_score}/${item.average_max_score}
                    </button>
                `;
            }).join("");

        row.innerHTML = `
            <div class="skills-student">
                ${student.first_name || ""}
                ${student.last_name || ""}
            </div>

            ${cells}
        `;

        progressTable.appendChild(row);
    });
}

progressTable.addEventListener(
    "click",
    async (event) => {

        const button =
            event.target.closest(
                ".skill-cell:not(.empty-skill)"
            );

        if (!button) {
            return;
        }

        const studentId =
            button.dataset.studentId;

        const skillCode =
            button.dataset.skill;

      const tasks =
    await loadStudentSkillHistory(
        studentId,
        skillCode
    );

renderSkillHistory(
    studentId,
    skillCode,
    tasks
); 
    }
);

async function loadStudentSkillHistory(
    studentId,
    skillCode
) {
    const data =
        await apiGet({
            login:
                TEACHER_LOGIN,

            action:
                "student-skill-history",

            group_id:
                currentGroupId,

            student_id:
                studentId,

            skill_code:
                skillCode
        });

    return data.tasks || [];
}

function renderSkillHistory(
    studentId,
    skillCode,
    tasks
) {
    const existing =
        document.getElementById(
            `skill-history-${studentId}-${skillCode}`
        );

    if (existing) {
        existing.remove();
        return;
    }

    const studentRow =
        progressTable.querySelector(
            `.skills-row [data-student-id="${studentId}"][data-skill="${skillCode}"]`
        );

    if (!studentRow) {
        return;
    }

    const rowContainer =
        studentRow.closest(".skills-row");

    const history =
        document.createElement("div");

    history.id =
        `skill-history-${studentId}-${skillCode}`;

    history.className =
        "skill-history-panel";

    if (!tasks.length) {
        history.innerHTML = `
            <div class="skill-history-empty">
                No completed tasks yet.
            </div>
        `;
    } else {
        history.innerHTML = tasks
            .map(task => {

                const latest =
                    task.latest_attempt;

                const score =
                    latest &&
                    latest.score !== null
                        ? `${latest.score}/${latest.max_score}`
                        : "—";

                const submitted =
                    latest &&
                    latest.submitted_at
                        ? new Date(
                            latest.submitted_at
                        ).toLocaleDateString(
                            "en-GB"
                        )
                        : "—";

                const type =
                    task.assignment_type ===
                    "CLASSWORK"
                        ? "Classwork"
                        : "Homework";

                return `
                    <div class="skill-history-item">

                        <div class="history-task-main">

                            <div class="history-task-title">
                                ${task.title || task.bank_task_id}
                            </div>

                            <div class="history-task-meta">
                                ${type}
                                <span>•</span>
                                ${submitted}
                            </div>

                        </div>

                        <div class="history-task-result">
                            ${score}
                        </div>

                        <div class="history-task-attempts">
                            ${task.attempts_count}
                            ${
                                task.attempts_count === 1
                                    ? "attempt"
                                    : "attempts"
                            }
                        </div>

                    </div>
                `;
            })
            .join("");
    }

    rowContainer.insertAdjacentElement(
        "afterend",
        history
    );
}

/* =========================================================
   ASSIGNMENTS
========================================================= */

function statusLabel(status) {
    const labels = {
        ASSIGNED:
            "Not started",

        NOT_ATTEMPTED:
            "Not started",

        IN_PROGRESS:
            "Working",

        SUBMITTED:
            "Submitted",

        AWAITING_REVIEW:
            "To check",

        COMPLETED:
            "Completed",

        OVERDUE:
            "Overdue"
    };

    return labels[status] || status;
}


function renderAssignments(items) {
    assignmentsTable.innerHTML = "";

    if (!items.length) {
        assignmentsTable.innerHTML = `
            <div class="empty-state">
                No assignment data yet.
            </div>
        `;

        return;
    }

    items.forEach(item => {

        const row =
            document.createElement("div");

        row.className =
            "assignment-row";

        const latest =
            item.latest_attempt;

        const score =
            latest &&
            latest.score !== null
                ? `${latest.score} / ${latest.max_score}`
                : "—";

        const attemptsCount =
            item.attempts_count || 0;

        row.innerHTML = `
            <div class="assignment-student">
                ${item.first_name || ""}
                ${item.last_name || ""}
            </div>

            <div class="assignment-skill">
                ${item.skill_code || "—"}
            </div>

            <div class="assignment-task-name">
                ${item.bank_task_id || item.title || "—"}
            </div>

            <div class="assignment-type">
                ${item.assignment_type || "—"}
            </div>

            <div class="assignment-status">
                ${statusLabel(item.status)}
            </div>

            <div class="assignment-score">
                ${score}
            </div>

            <div class="assignment-attempts">
                ${attemptsCount}
                ${
                    attemptsCount === 1
                        ? "attempt"
                        : "attempts"
                }
            </div>
        `;

        assignmentsTable.appendChild(row);
    });
}


/* =========================================================
   TASK BANK
========================================================= */

function renderSkillTabs(section) {
    const skillsBySection = {
        LISTENING: [
            "L1",
            "L2",
            "L3"
        ],

        READING: [
            "R1",
            "R2",
            "R3"
        ],

        GRAMMAR: [
            "G1",
            "G2",
            "G3"
        ],

        WRITING: [
            "W1",
            "W2"
        ],

        SPEAKING: [
            "S1",
            "S2",
            "S3",
            "S4"
        ]
    };

    const skills =
        skillsBySection[section] || [];

    skillTabs.innerHTML = "";

    skills.forEach(
        (skill, index) => {

            const button =
                document.createElement("button");

            button.type = "button";

            button.className =
                "skill-tab";

            button.dataset.skill =
                skill;

            if (index === 0) {
                button.classList.add(
                    "active"
                );
            }

            button.textContent =
                skill;

            skillTabs.appendChild(
                button
            );
        }
    );
}

document
    .querySelectorAll(".bank-tab")
    .forEach(button => {

        button.addEventListener(
            "click",
            async () => {

                document
                    .querySelectorAll(".bank-tab")
                    .forEach(item =>
                        item.classList.remove(
                            "active"
                        )
                    );

                button.classList.add(
                    "active"
                );

                const section =
                    button.dataset.section;

                renderSkillTabs(
                    section
                );

                const firstSkillButton =
                    skillTabs.querySelector(
                        ".skill-tab"
                    );

                if (!firstSkillButton) {
                    taskBank.innerHTML = `
                        <div class="empty-state">
                            No tasks yet.
                        </div>
                    `;
                    return;
                }

                const firstSkill =
                    firstSkillButton.dataset.skill;

                const tasks =
                    await loadTaskBank(
                        section,
                        firstSkill
                    );

                renderTaskBank(
                    tasks
                );
            }
        );
    });

    skillTabs.addEventListener(
    "click",
    async (event) => {

        const button =
            event.target.closest(
                ".skill-tab"
            );

        if (!button) {
            return;
        }

        skillTabs
            .querySelectorAll(
                ".skill-tab"
            )
            .forEach(item =>
                item.classList.remove(
                    "active"
                )
            );

        button.classList.add(
            "active"
        );

        const activeSectionButton =
            document.querySelector(
                ".bank-tab.active"
            );

        if (!activeSectionButton) {
            return;
        }

        const section =
            activeSectionButton.dataset.section;

        const skill =
            button.dataset.skill;

        const tasks =
            await loadTaskBank(
                section,
                skill
            );

        renderTaskBank(
            tasks
        );
    }
);

function renderTaskBank(tasks) {
    taskBank.innerHTML = "";

    if (!tasks.length) {
        taskBank.innerHTML = `
            <div class="empty-state">
                No tasks yet.
            </div>
        `;

        return;
    }

    tasks.forEach(task => {

        const row =
            document.createElement("div");

        row.className =
            "bank-task-row";

        const completedStudents =
            new Set(
                currentAssignmentItems
                    .filter(item =>
                        item.bank_task_id ===
                            task.bank_task_id &&
                        item.status ===
                            "COMPLETED"
                    )
                    .map(item =>
                        item.student_id
                    )
            );

        const completedCount =
            completedStudents.size;

        row.innerHTML = `
            <div class="bank-task-main">

                <div class="bank-task-code">
                    ${task.skill_code}
                </div>

                <div class="bank-task-title">
                    ${task.title}
                </div>

                <div class="bank-task-history">
                    Completed before:
                    ${completedCount}
                </div>

            </div>

            <button
    class="bank-assign-button"
    type="button"
    data-bank-task-id="${task.bank_task_id}"
    data-skill="${task.skill_code}"
>
    Choose students
</button>
        `;

        taskBank.appendChild(row);
    });
}

taskBank.addEventListener(
    "click",
    (event) => {

        const button =
            event.target.closest(
                ".bank-assign-button"
            );

        if (!button) {
            return;
        }

        const row =
            button.closest(
                ".bank-task-row"
            );

        if (!row) {
            return;
        }

        const bankTaskId =
            button.dataset.bankTaskId;

        const skillCode =
            button.dataset.skill;


        /* -----------------------------------------
           CLOSE EXISTING CHOOSER
        ----------------------------------------- */

        const existingChooser =
            row.querySelector(
                ".student-chooser"
            );

        if (existingChooser) {
            existingChooser.remove();

            button.textContent =
                "Choose students";

            return;
        }


        /* -----------------------------------------
           BUILD STUDENT LIST
        ----------------------------------------- */

        const chooser =
            document.createElement(
                "div"
            );

        chooser.className =
            "student-chooser";


        const studentsHtml =
            currentStudents
                .map(student => {

                    const previousWorks =
                        currentAssignmentItems
                            .filter(item =>
                                item.student_id ===
                                    student.student_id &&
                                item.bank_task_id ===
                                    bankTaskId
                            );

                    const completed =
                        previousWorks.some(
                            item =>
                                item.status ===
                                "COMPLETED"
                        );

                    const alreadyAssigned =
                        previousWorks.some(
                            item =>
                                item.status ===
                                    "ASSIGNED" ||
                                item.status ===
                                    "NOT_ATTEMPTED" ||
                                item.status ===
                                    "IN_PROGRESS" ||
                                item.status ===
                                    "SUBMITTED" ||
                                item.status ===
                                    "AWAITING_REVIEW"
                        );


                    let historyText =
    "Not done before";

if (alreadyAssigned) {
    historyText =
        "Already assigned";
} else if (
    completed
) {
    historyText =
        "Completed before";
}

                    return `
                        <label class="student-choice">

                            <input
    type="checkbox"
    class="student-choice-checkbox"
    value="${student.student_id}"
    ${alreadyAssigned ? "disabled" : "checked"}
>

                            <span class="student-choice-name">
                                ${student.first_name || ""}
                                ${student.last_name || ""}
                            </span>

                            <span class="student-choice-history">
                                ${historyText}
                            </span>

                        </label>
                    `;
                })
                .join("");


        chooser.innerHTML = `
            <div class="student-chooser-header">

                <div class="student-chooser-title">
                    Choose students
                </div>

                <button
                    class="student-select-all"
                    type="button"
                >
                    Select all
                </button>

            </div>

            <div class="student-choice-list">
                ${studentsHtml}
            </div>

            <div class="student-chooser-actions">

                <button
                    class="student-assign-confirm"
                    type="button"
                    data-bank-task-id="${bankTaskId}"
                    data-skill="${skillCode}"
                >
                    Assign selected
                </button>

            </div>
        `;

/* -----------------------------------------
   HIDE ASSIGN CONTROLS IF NOBODY IS AVAILABLE
----------------------------------------- */

chooser.innerHTML = `
    <div class="student-chooser-header">

        <div class="student-chooser-title">
            Choose students
        </div>

        <button
            class="student-select-all"
            type="button"
        >
            Select all
        </button>

    </div>

    <div class="student-choice-list">
        ${studentsHtml}
    </div>

    <div class="student-chooser-actions">

        <button
            class="student-assign-confirm"
            type="button"
            data-bank-task-id="${bankTaskId}"
            data-skill="${skillCode}"
        >
            Assign selected
        </button>

    </div>
`;


/* -----------------------------------------
   HIDE ASSIGN CONTROLS IF NOBODY IS AVAILABLE
----------------------------------------- */

const chooserCheckboxes =
    chooser.querySelectorAll(
        ".student-choice-checkbox"
    );

const hasAvailableStudents =
    Array.from(chooserCheckboxes)
        .some(
            checkbox =>
                !checkbox.disabled
        );

if (!hasAvailableStudents) {

    const selectAllButton =
        chooser.querySelector(
            ".student-select-all"
        );

    const assignSelectedButton =
        chooser.querySelector(
            ".student-assign-confirm"
        );

    if (selectAllButton) {
        selectAllButton.remove();
    }

    if (assignSelectedButton) {
        assignSelectedButton.remove();
    }
}


/* -----------------------------------------
   ADD CHOOSER TO TASK
----------------------------------------- */

row.appendChild(
    chooser
);

button.textContent =
    "Close";
}
);


/* =========================================================
   SELECT ALL / CLEAR ALL
========================================================= */

taskBank.addEventListener(
    "click",
    (event) => {

        const button =
            event.target.closest(
                ".student-select-all"
            );

        if (!button) {
            return;
        }

        const chooser =
            button.closest(
                ".student-chooser"
            );

        if (!chooser) {
            return;
        }

        const checkboxes =
            chooser.querySelectorAll(
                ".student-choice-checkbox:not(:disabled)"
            );

        if (!checkboxes.length) {
            return;
        }

        const allChecked =
            Array.from(checkboxes)
                .every(
                    checkbox =>
                        checkbox.checked
                );

        checkboxes.forEach(
            checkbox => {
                checkbox.checked =
                    !allChecked;
            }
        );

        button.textContent =
            allChecked
                ? "Select all"
                : "Clear all";
    }
);


/* =========================================================
   ASSIGN SELECTED
========================================================= */

taskBank.addEventListener(
    "click",
    async (event) => {

        const button =
            event.target.closest(
                ".student-assign-confirm"
            );

        if (!button) {
            return;
        }

        const chooser =
            button.closest(
                ".student-chooser"
            );

        if (!chooser) {
            return;
        }

        const selectedStudentIds =
            Array.from(
                chooser.querySelectorAll(
                    ".student-choice-checkbox:checked:not(:disabled)"
                )
            ).map(
                checkbox =>
                    checkbox.value
            );

        if (!selectedStudentIds.length) {
            return;
        }

        const bankTaskId =
            button.dataset.bankTaskId;

        const homeworkButton =
            document.getElementById(
                "assign-homework"
            );

        const assignmentType =
            homeworkButton.classList.contains(
                "active"
            )
                ? "HOMEWORK"
                : "CLASSWORK";


        button.disabled = true;

        button.textContent =
            "Assigning...";


        try {

            await apiGet({
                login:
                    TEACHER_LOGIN,

                action:
                    "assign-task",

                group_id:
                    currentGroupId,

                bank_task_id:
                    bankTaskId,

                assignment_type:
                    assignmentType,

                student_ids:
                    selectedStudentIds.join(",")
            });


            button.textContent =
                "Assigned";


            const assignmentItems =
                await loadGroupAssignments();

            renderAssignments(
                assignmentItems
            );


            const progressStudents =
                await loadGroupProgress();

            currentStudents =
                progressStudents;

            updateOverview(
                progressStudents,
                assignmentItems
            );


        } catch (error) {

            console.error(
                "Assign selected error:",
                error
            );

            button.disabled = false;

            button.textContent =
                "Assign selected";
        }
    }
);

/* =========================================================
   FILTER BUTTONS
========================================================= */

function setupFilters() {
    const buttons =
        document.querySelectorAll(
            ".filter-button"
        );

    buttons.forEach(button => {
        button.addEventListener(
            "click",
            () => {

                buttons.forEach(item =>
                    item.classList.remove(
                        "active"
                    )
                );

                button.classList.add(
                    "active"
                );

                const status =
                    button.dataset.status;

                if (status === "ALL") {
                    renderAssignments(
                        currentAssignmentItems
                    );

                    return;
                }

                const filtered =
                    currentAssignmentItems.filter(
                        item => {

                            if (
                                status ===
                                "NOT_ATTEMPTED"
                            ) {
                                return (
                                    item.status ===
                                        "ASSIGNED" ||
                                    item.status ===
                                        "NOT_ATTEMPTED"
                                );
                            }

                            return (
                                item.status ===
                                status
                            );
                        }
                    );

                renderAssignments(
                    filtered
                );
            }
        );
    });
}


/* =========================================================
   HOMEWORK / CLASSWORK
========================================================= */

function setupAssignMode() {
    const homeworkButton =
        document.getElementById(
            "assign-homework"
        );

    const classworkButton =
        document.getElementById(
            "assign-classwork"
        );

    homeworkButton.addEventListener(
        "click",
        () => {
            homeworkButton.classList.add(
                "active"
            );

            classworkButton.classList.remove(
                "active"
            );
        }
    );

    classworkButton.addEventListener(
        "click",
        () => {
            classworkButton.classList.add(
                "active"
            );

            homeworkButton.classList.remove(
                "active"
            );
        }
    );
}


/* =========================================================
   GROUP CHANGE
========================================================= */

groupSelect.addEventListener(
    "change",
    async () => {

        currentGroupId =
            groupSelect.value;

        await loadTaskStatus();
    }
);

async function loadGroupProgress() {
    const data =
        await apiGet({
            login:
                TEACHER_LOGIN,

            action:
                "group-progress",

            group_id:
                currentGroupId
        });

    return data.students || [];
}

async function loadGroupAssignments() {
    const data =
        await apiGet({
            login:
                TEACHER_LOGIN,

            action:
                "group-assignments",

            group_id:
                currentGroupId
        });

    currentAssignmentItems =
    data.items || [];

return currentAssignmentItems;
}

async function loadTaskBank(
    sectionCode,
    skillCode
) {
    const data =
        await apiGet({
            login:
                TEACHER_LOGIN,

            action:
                "task-bank",

            section_code:
                sectionCode,

            skill_code:
                skillCode
        });

    return data.tasks || [];
}

/* =========================================================
   START
========================================================= */

async function init() {
    try {
        teacherName.textContent =
            "Elena";

        loadGroups();

        renderSkillTabs();

        setupFilters();

        setupAssignMode();

        await loadTaskStatus();

        const progressStudents =
    await loadGroupProgress();

    currentStudents =
    progressStudents;

renderProgress(
    progressStudents
);

const assignmentItems =
    await loadGroupAssignments();

renderAssignments(
    assignmentItems
);


updateOverview(
    progressStudents,
    assignmentItems
);

document
    .querySelectorAll(".bank-tab")
    .forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.section === "READING"
        );
    });

renderSkillTabs(
    "READING"
);

const bankTasks =
    await loadTaskBank(
        "READING",
        "R1"
    );

renderTaskBank(
    bankTasks
);

        loadingScreen.classList.add(
            "hidden"
        );

        teacherApp.classList.remove(
            "hidden"
        );

    } catch (error) {
        console.error(error);

        loadingScreen.classList.add(
            "hidden"
        );

        errorScreen.classList.remove(
            "hidden"
        );

        errorMessage.textContent =
            error.message;
    }
}


init();