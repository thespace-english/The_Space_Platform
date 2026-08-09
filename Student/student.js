const API_URL = 'https://functions.yandexcloud.net/d4e8345m7p4h6fmheoae';

const EGE_CONTENT_URL =
    'https://thespace-english.github.io/EGE/';

let checkpoints = [];
let activeCheckpointIndex = 0;


/* =========================================================
   LOGIN
========================================================= */

function getLoginFromUrl() {
    const params = new URLSearchParams(window.location.search);

    return params.get('login') || 'Marina_Vershkova';
}


/* =========================================================
   DATES
========================================================= */

function formatDate(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString + 'T00:00:00');

    return new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'long'
    }).format(date);
}


function formatDateRange(dateFrom, dateTo) {
    if (!dateFrom && !dateTo) return '';

    if (dateFrom && !dateTo) {
        return formatDate(dateFrom);
    }

    if (!dateFrom && dateTo) {
        return formatDate(dateTo);
    }

    const from = new Date(dateFrom + 'T00:00:00');
    const to = new Date(dateTo + 'T00:00:00');

    const sameMonth =
        from.getMonth() === to.getMonth() &&
        from.getFullYear() === to.getFullYear();

    if (sameMonth) {
        const month = new Intl.DateTimeFormat('en-GB', {
            month: 'long'
        }).format(to);

        return `${from.getDate()}–${to.getDate()} ${month}`;
    }

    return `${formatDate(dateFrom)} – ${formatDate(dateTo)}`;
}


/* =========================================================
   CHECKPOINT STATUS
========================================================= */

function isCompleted(checkpoint) {
    return Boolean(
        checkpoint.result &&
        checkpoint.result.status === 'COMPLETED'
    );
}


/* =========================================================
   WHICH MOCK EXAM TO SHOW FIRST
========================================================= */

function getDefaultCheckpointIndex() {
    let lastCompleted = -1;

    checkpoints.forEach((checkpoint, index) => {
        if (isCompleted(checkpoint)) {
            lastCompleted = index;
        }
    });

    if (lastCompleted >= 0) {
        return lastCompleted;
    }

    return 0;
}


/* =========================================================
   LARGE MOCK EXAM CARD
========================================================= */

function renderActiveCheckpoint() {
    const container =
        document.getElementById('active-checkpoint');

    const checkpoint =
        checkpoints[activeCheckpointIndex];

    if (!checkpoint) {
        container.innerHTML = '';
        return;
    }

    const completed = isCompleted(checkpoint);

    const dateText = formatDateRange(
        checkpoint.date_from,
        checkpoint.date_to
    );

    let resultHtml = '';

    if (completed) {
        const result = checkpoint.result;

        resultHtml = `
            <div class="active-result">

                <div class="active-result-main">
                    <span class="active-score">
                        ${result.final_score}
                    </span>

                    <span class="active-score-max">
                        / 100
                    </span>
                </div>

                <div class="active-primary-score">
                    ${result.primary_score}
                    /
                    ${result.max_primary_score}
                    primary score
                </div>

            </div>
        `;
    } else {
        resultHtml = `
            <div class="active-scheduled">
                Scheduled
            </div>
        `;
    }

    container.innerHTML = `
        <article class="active-mock-card ${completed ? 'completed' : 'planned'}">

            <div class="active-mock-left">

                <div class="active-mock-code">
                    ${checkpoint.code}
                </div>

                <h3>
                    Mock Exam ${checkpoint.position}
                </h3>

                <div class="active-mock-date">
                    ${dateText}
                </div>

            </div>

            ${resultHtml}

        </article>
    `;
}


/* =========================================================
   14 CLICKABLE DOTS
========================================================= */

function renderDots() {
    const dotsContainer =
        document.getElementById('checkpoint-dots');

    dotsContainer.innerHTML = '';

    checkpoints.forEach((checkpoint, index) => {

        const dot = document.createElement('button');

        dot.type = 'button';
        dot.className = 'checkpoint-dot';

        if (isCompleted(checkpoint)) {
            dot.classList.add('completed');
        }

        if (index === activeCheckpointIndex) {
            dot.classList.add('active');
        }

        /*
           The next unfinished mock exam gets a ring.
        */
        const previousCompleted =
            index > 0 &&
            isCompleted(checkpoints[index - 1]);

        const noCompletedYet =
            index === 0 &&
            !checkpoints.some(isCompleted);

        if (
            !isCompleted(checkpoint) &&
            (previousCompleted || noCompletedYet)
        ) {
            dot.classList.add('next');
        }

        dot.setAttribute(
            'aria-label',
            `Mock Exam ${checkpoint.position}`
        );

        const tooltip =
            document.createElement('span');

        tooltip.className = 'dot-tooltip';

        tooltip.textContent =
            `Mock Exam ${checkpoint.position} · ` +
            formatDateRange(
                checkpoint.date_from,
                checkpoint.date_to
            );

        dot.appendChild(tooltip);

        dot.addEventListener('click', () => {
            activeCheckpointIndex = index;

            renderActiveCheckpoint();
            renderDots();
        });

        dotsContainer.appendChild(dot);
    });
}


/* =========================================================
   LOAD STUDENT DATA
========================================================= */

function formatDueDate(timestamp) {
    if (!timestamp) return '';

    const date = new Date(timestamp);

    return new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'long'
    }).format(date);
}


function renderAssignments(assignments) {
    const container = document.getElementById('assignments-list');

    container.innerHTML = '';

    if (!assignments || assignments.length === 0) {
        container.innerHTML = `
            <div class="no-assignments">
                No current assignments
            </div>
        `;
        return;
    }

    assignments.forEach(assignment => {
        const card = document.createElement('article');

        card.className = 'assignment-card';

        const dueDate = formatDueDate(assignment.due_at);

        const taskCount = assignment.tasks
            ? assignment.tasks.length
            : 0;

        card.innerHTML = `
            <div class="assignment-main">

                <div class="assignment-type">
                    ${assignment.section_code || assignment.assignment_type}
                </div>

                <h3>${assignment.title}</h3>

                <div class="assignment-meta">
                    ${dueDate ? `Due ${dueDate}` : ''}
                    ${dueDate && taskCount ? ' • ' : ''}
                    ${taskCount} ${taskCount === 1 ? 'task' : 'tasks'}
                </div>

            </div>

            <button
                class="assignment-open"
                type="button"
                aria-label="Open assignment"
            >
                →
            </button>
        `;

        container.appendChild(card);

        const openButton =
    card.querySelector(
        '.assignment-open'
    );

const firstTask =
    assignment.tasks &&
    assignment.tasks.length
        ? assignment.tasks[0]
        : null;

const contentRef =
    firstTask &&
    firstTask.content_ref
        ? firstTask.content_ref
        : '';

if (contentRef) {

    let taskUrl =
        contentRef.startsWith('https://') ||
        contentRef.startsWith('http://')
            ? contentRef
            : EGE_CONTENT_URL +
              encodeURIComponent(contentRef);

    const studentLogin =
        getLoginFromUrl();

    taskUrl +=
        (taskUrl.includes('?') ? '&' : '?') +
        'student=' +
        encodeURIComponent(studentLogin);

    openButton.addEventListener(
        'click',
        () => {
            window.location.href =
                taskUrl;
        }
    );

} else {

    openButton.disabled = true;

    openButton.title =
        'Task is not connected yet';
}

    });
}

async function loadStudent() {
    const loading =
        document.getElementById('loading');

    const errorScreen =
        document.getElementById('error-screen');

    const errorMessage =
        document.getElementById('error-message');

    const app =
        document.getElementById('student-app');

    try {
        const login = getLoginFromUrl();

        const response = await fetch(
            `${API_URL}?login=${encodeURIComponent(login)}`
        );

        const data = await response.json();

        if (!response.ok || !data.ok) {
            throw new Error(
                data.error ||
                'Could not load student data'
            );
        }

        const user = data.user;

        if (
            !user.courses ||
            user.courses.length === 0
        ) {
            throw new Error(
                'No course has been assigned yet'
            );
        }

        const course = user.courses[0];

        if (!course.track) {
            throw new Error(
                'No learning path has been created for this course yet'
            );
        }

        const track = course.track;


        /* Student */

        document
            .getElementById('student-name')
            .textContent =
            user.first_name || user.login;


        /* Course */

        document
            .getElementById('course-name')
            .textContent =
            course.name;

        document
            .getElementById('track-name')
            .textContent =
            track.name;


        /* Progress */

        document
            .getElementById('completed-count')
            .textContent =
            track.completed;

        document
            .getElementById('total-count')
            .textContent =
            track.total;

        const progressPercent =
            track.total > 0
                ? (track.completed / track.total) * 100
                : 0;

        document
            .getElementById('progress-fill')
            .style.width =
            `${progressPercent}%`;


        /* Mock exams */

        renderAssignments(user.assignments || []);

        checkpoints =
            track.checkpoints || [];

        activeCheckpointIndex =
            getDefaultCheckpointIndex();

        renderActiveCheckpoint();
        renderDots();


        /* Show dashboard */

        loading.classList.add('hidden');
        app.classList.remove('hidden');

    } catch (error) {
        console.error(error);

        loading.classList.add('hidden');
        app.classList.add('hidden');

        errorScreen.classList.remove('hidden');

        errorMessage.textContent =
            error.message;
    }
}


loadStudent();