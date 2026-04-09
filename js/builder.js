// Workshop Builder - Main Interface Logic

let workshop = null;
let exercises = [];
let draggedElement = null;
let draggedData = null;

document.addEventListener('DOMContentLoaded', async function() {
    // Load workshop data
    workshop = WorkshopStorage.loadWorkshop();
    if (!workshop) {
        alert('No workshop found. Please start from the beginning.');
        window.location.href = 'index.html';
        return;
    }

    // Load exercises
    await loadExercises();

    // Initialize UI
    initializeUI();
    renderWorkshop();
    setupEventListeners();
});

async function loadExercises() {
    try {
        const response = await fetch('data/exercises.json');
        const data = await response.json();
        exercises = data.exercises;
    } catch (error) {
        console.error('Error loading exercises:', error);
        alert('Error loading exercises data.');
    }
}

function initializeUI() {
    // Update header
    document.getElementById('workshopTitle').textContent = workshop.meta.workshopType.charAt(0).toUpperCase() + workshop.meta.workshopType.slice(1) + ' Workshop';
    document.getElementById('clientInfo').textContent = 'For: ' + workshop.meta.client;

    // Populate toolbox
    populateToolbox();

    // Setup phase filters
    setupPhaseFilters();
}

function populateToolbox() {
    const container = document.getElementById('toolboxActivities');

    exercises.forEach(exercise => {
        const activityEl = document.createElement('div');
        activityEl.className = 'toolbox-activity';
        activityEl.draggable = true;
        activityEl.dataset.exerciseId = exercise.id;
        activityEl.dataset.phase = exercise.phase;

        activityEl.innerHTML = `
            <div class="toolbox-icon">${exercise.icon}</div>
            <div class="toolbox-info">
                <div class="toolbox-name">${exercise.name}</div>
                <div class="toolbox-phase">${exercise.phase}</div>
            </div>
            <div class="toolbox-duration">${exercise.duration.default}m</div>
        `;

        activityEl.addEventListener('dragstart', handleToolboxDragStart);
        activityEl.addEventListener('click', () => showActivityDetails(exercise.id));

        container.appendChild(activityEl);
    });
}

function setupPhaseFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Update active state
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // Filter activities
            const phase = this.dataset.phase;
            const activities = document.querySelectorAll('.toolbox-activity');

            activities.forEach(activity => {
                if (phase === 'all' || activity.dataset.phase === phase) {
                    activity.classList.remove('hidden');
                } else {
                    activity.classList.add('hidden');
                }
            });
        });
    });
}

function renderWorkshop() {
    const container = document.getElementById('workshopTimeline');
    container.innerHTML = '';

    workshop.days.forEach(day => {
        const dayEl = document.createElement('div');
        dayEl.className = 'timeline-day';
        dayEl.dataset.dayId = day.day;

        const totalMinutes = day.activities.reduce((sum, a) => sum + a.duration, 0);
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;

        dayEl.innerHTML = `
            <div class="day-header">
                <div class="day-title">${day.label}</div>
                <div class="day-info">
                    <span>${day.activities.length} activities</span>
                    <span>${hours}h ${mins}m</span>
                </div>
            </div>
            <div class="timeline-activities" data-day="${day.day}">
                ${day.activities.length === 0 ? '<div class="empty-message">Drag activities here</div>' : ''}
            </div>
        `;

        container.appendChild(dayEl);

        const activitiesContainer = dayEl.querySelector('.timeline-activities');
        renderActivities(activitiesContainer, day.activities, day.day);
    });

    updateChecklist();
}

function renderActivities(container, activities, dayId) {
    activities.forEach((activity, index) => {
        const exercise = exercises.find(e => e.id === activity.id);
        if (!exercise) return;

        const activityEl = document.createElement('div');
        activityEl.className = 'timeline-activity';
        activityEl.draggable = true;
        activityEl.dataset.activityIndex = index;
        activityEl.dataset.dayId = dayId;

        activityEl.innerHTML = `
            <div class="activity-handle">⋮⋮</div>
            <div class="activity-icon">${exercise.icon}</div>
            <div class="activity-content">
                <div class="activity-name">${exercise.name}</div>
                <div class="activity-meta">
                    <span>${exercise.phase.toUpperCase()}</span>
                    <span>${activity.duration} minutes</span>
                    ${activity.required ? '<span style="color: var(--success);">● Required</span>' : ''}
                </div>
            </div>
            <div class="activity-actions">
                <button class="action-btn" onclick="showActivityDetails('${exercise.id}')" title="View details">ℹ️</button>
                <button class="action-btn" onclick="editActivityDuration(${dayId}, ${index})" title="Edit duration">⏱️</button>
                <button class="action-btn" onclick="deleteActivity(${dayId}, ${index})" title="Delete">🗑️</button>
            </div>
        `;

        activityEl.addEventListener('dragstart', handleTimelineDragStart);
        activityEl.addEventListener('dragend', handleDragEnd);

        container.appendChild(activityEl);
    });

    // Setup drop zones
    setupDropZone(container);
}

function setupDropZone(container) {
    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('drop', handleDrop);
    container.addEventListener('dragleave', handleDragLeave);
}

function handleToolboxDragStart(e) {
    draggedData = {
        source: 'toolbox',
        exerciseId: this.dataset.exerciseId
    };
    e.dataTransfer.effectAllowed = 'copy';
}

function handleTimelineDragStart(e) {
    draggedElement = this;
    draggedData = {
        source: 'timeline',
        dayId: parseInt(this.dataset.dayId),
        activityIndex: parseInt(this.dataset.activityIndex)
    };
    e.dataTransfer.effectAllowed = 'move';
    this.style.opacity = '0.5';
}

function handleDragEnd(e) {
    if (draggedElement) {
        draggedElement.style.opacity = '1';
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = draggedData.source === 'toolbox' ? 'copy' : 'move';
    this.classList.add('drag-over');
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');

    const targetDayId = parseInt(this.dataset.day);

    if (draggedData.source === 'toolbox') {
        // Add new activity from toolbox
        addActivityToDay(targetDayId, draggedData.exerciseId);
    } else if (draggedData.source === 'timeline') {
        // Move activity within or between days
        moveActivity(draggedData.dayId, draggedData.activityIndex, targetDayId);
    }

    draggedData = null;
    draggedElement = null;
}

function addActivityToDay(dayId, exerciseId) {
    const exercise = exercises.find(e => e.id === exerciseId);
    if (!exercise) return;

    const day = workshop.days.find(d => d.day === dayId);
    if (!day) return;

    const newActivity = {
        id: exerciseId,
        duration: exercise.duration.default,
        required: false,
        customized: false,
        order: day.activities.length + 1
    };

    day.activities.push(newActivity);

    WorkshopStorage.saveWorkshop(workshop);
    renderWorkshop();
}

function moveActivity(fromDayId, fromIndex, toDayId) {
    const fromDay = workshop.days.find(d => d.day === fromDayId);
    const toDay = workshop.days.find(d => d.day === toDayId);

    if (!fromDay || !toDay) return;

    const activity = fromDay.activities.splice(fromIndex, 1)[0];
    toDay.activities.push(activity);

    WorkshopStorage.saveWorkshop(workshop);
    renderWorkshop();
}

function deleteActivity(dayId, activityIndex) {
    if (!confirm('Remove this activity from the workshop?')) return;

    const day = workshop.days.find(d => d.day === dayId);
    if (!day) return;

    day.activities.splice(activityIndex, 1);

    WorkshopStorage.saveWorkshop(workshop);
    renderWorkshop();
}

function editActivityDuration(dayId, activityIndex) {
    const day = workshop.days.find(d => d.day === dayId);
    if (!day) return;

    const activity = day.activities[activityIndex];
    const exercise = exercises.find(e => e.id === activity.id);

    const newDuration = prompt(
        `Edit duration for ${exercise.name}\n(Recommended: ${exercise.duration.default} minutes)`,
        activity.duration
    );

    if (newDuration && !isNaN(newDuration)) {
        activity.duration = parseInt(newDuration);
        activity.customized = true;

        WorkshopStorage.saveWorkshop(workshop);
        renderWorkshop();
    }
}

function showActivityDetails(exerciseId) {
    const exercise = exercises.find(e => e.id === exerciseId);
    if (!exercise) return;

    const modal = document.getElementById('activityModal');
    document.getElementById('modalTitle').textContent = exercise.icon + ' ' + exercise.name;

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="detail-section">
            <p>${exercise.description}</p>
        </div>
        <div class="detail-section">
            <h3>✓ Best For</h3>
            <ul>
                ${exercise.bestFor.map(item => `<li>${item}</li>`).join('')}
            </ul>
        </div>
        <div class="detail-section">
            <h3>✗ Not Good For</h3>
            <ul>
                ${exercise.notGoodFor.map(item => `<li>${item}</li>`).join('')}
            </ul>
        </div>
        <div class="detail-section">
            <h3>⏱️ Duration</h3>
            <p>${exercise.duration.min}-${exercise.duration.max} minutes (default: ${exercise.duration.default} min)</p>
        </div>
        <div class="detail-section">
            <h3>📦 Materials Needed</h3>
            <ul>
                ${exercise.materials.map(item => `<li>${item}</li>`).join('')}
            </ul>
        </div>
        <div class="detail-section">
            <h3>🔢 Steps</h3>
            <ol>
                ${exercise.steps.map(step => `<li>${step}</li>`).join('')}
            </ol>
        </div>
    `;

    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('activityModal').style.display = 'none';
}

function updateChecklist() {
    const phases = { collect: false, choose: false, create: false, commit: false };

    workshop.days.forEach(day => {
        day.activities.forEach(activity => {
            const exercise = exercises.find(e => e.id === activity.id);
            if (exercise && phases.hasOwnProperty(exercise.phase)) {
                phases[exercise.phase] = true;
            }
        });
    });

    Object.keys(phases).forEach(phase => {
        const checkbox = document.getElementById('check-' + phase);
        checkbox.checked = phases[phase];
    });
}

function setupEventListeners() {
    // Close modal on outside click
    document.getElementById('activityModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
}

function exportWorkshop() {
    WorkshopStorage.exportWorkshop(workshop);
}

function generateReport() {
    window.location.href = 'report.html';
}
