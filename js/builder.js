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
    setupKeyboardShortcuts();
});

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Save: Ctrl/Cmd + S
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveWorkshop();
        }

        // Export: Ctrl/Cmd + E
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            exportWorkshop();
        }

        // Generate Report: Ctrl/Cmd + R
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            generateReport();
        }

        // Close modal: Escape
        if (e.key === 'Escape') {
            const modal = document.getElementById('activityModal');
            if (modal && modal.style.display !== 'none') {
                closeModal();
            }
        }
    });
}

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

        const iconName = getIconName(exercise.icon);
        activityEl.innerHTML = `
            <div class="toolbox-icon"><i data-lucide="${iconName}"></i></div>
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

    // Initialize Lucide icons after adding all elements
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
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

        // Group activities by phase with their original indices
        const groupedActivities = {
            collect: [],
            choose: [],
            create: [],
            commit: []
        };

        day.activities.forEach((activity, index) => {
            const ex = exercises.find(e => e.id === activity.id);
            if (ex) {
                const phaseData = {
                    ...activity,
                    originalIndex: index
                };
                groupedActivities[ex.phase].push(phaseData);
            }
        });

        dayEl.innerHTML = `
            <div class="day-header">
                <div class="day-title">${day.label}</div>
                <div class="day-info">
                    <span>${day.activities.length} activities</span>
                    <span>${hours}h ${mins}m</span>
                </div>
            </div>
            <div class="phase-sections">
                <div class="phase-section" data-phase="collect" data-day="${day.day}">
                    <div class="phase-section-header"><i data-lucide="inbox" style="width: 16px; height: 16px; display: inline; margin-right: 0.5rem;"></i>Collect</div>
                    <div class="timeline-activities" data-day="${day.day}" data-phase="collect"></div>
                </div>
                <div class="phase-section" data-phase="choose" data-day="${day.day}">
                    <div class="phase-section-header"><i data-lucide="target" style="width: 16px; height: 16px; display: inline; margin-right: 0.5rem;"></i>Choose</div>
                    <div class="timeline-activities" data-day="${day.day}" data-phase="choose"></div>
                </div>
                <div class="phase-section" data-phase="create" data-day="${day.day}">
                    <div class="phase-section-header"><i data-lucide="sparkles" style="width: 16px; height: 16px; display: inline; margin-right: 0.5rem;"></i>Create</div>
                    <div class="timeline-activities" data-day="${day.day}" data-phase="create"></div>
                </div>
                <div class="phase-section" data-phase="commit" data-day="${day.day}">
                    <div class="phase-section-header"><i data-lucide="check-circle" style="width: 16px; height: 16px; display: inline; margin-right: 0.5rem;"></i>Commit</div>
                    <div class="timeline-activities" data-day="${day.day}" data-phase="commit"></div>
                </div>
            </div>
        `;

        container.appendChild(dayEl);

        // Render activities in each phase section
        ['collect', 'choose', 'create', 'commit'].forEach(phase => {
            const phaseContainer = dayEl.querySelector(`.timeline-activities[data-phase="${phase}"]`);
            renderActivities(phaseContainer, groupedActivities[phase], day.day, phase);
        });
    });

    updateChecklist();
}

function renderActivities(container, activities, dayId, phase) {
    activities.forEach((activity) => {
        const exercise = exercises.find(e => e.id === activity.id);
        if (!exercise) return;

        const activityEl = document.createElement('div');
        activityEl.className = 'timeline-activity';
        if (activity.phaseWarning) {
            activityEl.classList.add('phase-mismatch');
        }
        activityEl.draggable = true;
        activityEl.dataset.activityIndex = activity.originalIndex;
        activityEl.dataset.dayId = dayId;
        activityEl.dataset.phase = exercise.phase;
        activityEl.dataset.activityId = activity.id;

        const iconName = getIconName(exercise.icon);
        activityEl.innerHTML = `
            <div class="activity-handle">⋮⋮</div>
            <div class="activity-icon"><i data-lucide="${iconName}"></i></div>
            <div class="activity-content">
                <div class="activity-name">${exercise.name}</div>
                <div class="activity-meta">
                    <span>${exercise.phase.toUpperCase()}</span>
                    <span>${activity.duration} minutes</span>
                    ${activity.phaseWarning ? '<span class="phase-warning-badge" title="This activity is typically used in the ' + exercise.phase + ' phase">⚠️ Check phase</span>' : ''}
                </div>
            </div>
            <div class="activity-actions">
                <button class="action-btn" onclick="showActivityDetails('${exercise.id}')" title="View details" aria-label="View ${exercise.name} details"><i data-lucide="info"></i></button>
                <button class="action-btn" onclick="editActivityDuration(${dayId}, ${activity.originalIndex})" title="Edit duration" aria-label="Edit duration"><i data-lucide="clock"></i></button>
                <button class="action-btn" onclick="deleteActivity(${dayId}, ${activity.originalIndex})" title="Delete" aria-label="Delete ${exercise.name}"><i data-lucide="trash-2"></i></button>
            </div>
        `;

        // Add drag event listeners for reordering
        activityEl.addEventListener('dragstart', handleTimelineDragStart);
        activityEl.addEventListener('dragend', handleDragEnd);
        activityEl.addEventListener('dragover', handleActivityDragOver);
        activityEl.addEventListener('drop', handleActivityDrop);

        container.appendChild(activityEl);
    });

    // Initialize Lucide icons after adding all timeline activities
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Setup drop zones for empty spaces
    setupDropZone(container);
}

function handleActivityDragOver(e) {
    if (!draggedData || draggedData.source === 'toolbox') return;

    e.preventDefault();
    e.stopPropagation();

    // Don't show indicator on self
    if (draggedElement === this) return;

    const rect = this.getBoundingClientRect();

    // Remove existing indicators from ALL activities
    document.querySelectorAll('.timeline-activity').forEach(el => {
        el.classList.remove('drop-before', 'drop-after');
    });

    // Use MOUSE position for the drop decision, not dragged element position
    // This is more intuitive - where the cursor is determines where it drops
    const mouseY = e.clientY;
    const rectTop = rect.top;
    const rectBottom = rect.bottom;
    const rectHeight = rect.height;
    const threshold = rectHeight * 0.4; // 40% zones top/bottom

    let shouldShowBefore = false;

    // Top 40% = drop before
    if (mouseY < rectTop + threshold) {
        shouldShowBefore = true;
    }
    // Bottom 40% = drop after
    else if (mouseY > rectBottom - threshold) {
        shouldShowBefore = false;
    }
    // Middle 20% = use midpoint
    else {
        const rectMidpoint = rectTop + (rectHeight / 2);
        shouldShowBefore = mouseY < rectMidpoint;
    }

    // Add the appropriate indicator
    if (shouldShowBefore) {
        this.classList.add('drop-before');
    } else {
        this.classList.add('drop-after');
    }
}

function handleActivityDrop(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedData) return;

    // Remove drop indicators
    document.querySelectorAll('.timeline-activity').forEach(el => {
        el.classList.remove('drop-before', 'drop-after');
    });

    const targetDayId = parseInt(this.dataset.dayId);
    const targetIndex = parseInt(this.dataset.activityIndex);
    const targetPhase = this.dataset.phase;

    console.log('=== DROP DEBUG ===');
    console.log('Source:', draggedData);
    console.log('Target index:', targetIndex);
    console.log('Target phase:', targetPhase);
    console.log('Target element:', this.querySelector('.activity-name')?.textContent);
    console.log('Mouse Y:', e.clientY);
    console.log('Target rect - top:', rect.top, 'bottom:', rect.bottom, 'height:', rect.height);

    // Use MOUSE position consistently
    const mouseY = e.clientY;
    const rectTop = rect.top;
    const rectBottom = rect.bottom;
    const rectHeight = rect.height;
    const threshold = rectHeight * 0.4; // 40% zones top/bottom

    let insertBefore = false;

    // Top 40% = drop before
    if (mouseY < rectTop + threshold) {
        insertBefore = true;
    }
    // Bottom 40% = drop after
    else if (mouseY > rectBottom - threshold) {
        insertBefore = false;
    }
    // Middle 20% = use midpoint
    else {
        const rectMidpoint = rectTop + (rectHeight / 2);
        insertBefore = mouseY < rectMidpoint;
    }

    console.log('insertBefore:', insertBefore);

    // CRITICAL: When items are displayed grouped by phase but stored in a flat array,
    // we need to ensure visual indicators match actual drop behavior

    // Check if phase matches
    const isValidPhase = targetPhase === draggedData.phase ||
                        (draggedData.additionalPhases && draggedData.additionalPhases.includes(targetPhase));

    if (draggedData.source === 'toolbox') {
        addActivityToDay(targetDayId, draggedData.exerciseId, targetPhase, !isValidPhase, targetIndex, insertBefore);
    } else if (draggedData.source === 'timeline') {
        reorderActivity(draggedData.dayId, draggedData.activityIndex, targetDayId, targetIndex, insertBefore, !isValidPhase);
    }

    draggedData = null;
    draggedElement = null;
}

function setupDropZone(container) {
    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('drop', handleDrop);
    container.addEventListener('dragleave', handleDragLeave);
}

function handleToolboxDragStart(e) {
    const exercise = exercises.find(ex => ex.id === this.dataset.exerciseId);
    draggedData = {
        source: 'toolbox',
        exerciseId: this.dataset.exerciseId,
        phase: exercise ? exercise.phase : null,
        additionalPhases: exercise && exercise.additionalPhases ? exercise.additionalPhases : []
    };
    e.dataTransfer.effectAllowed = 'copy';

    // Add visual indicator to dragged element
    this.classList.add('dragging');

    // Create a floating phase badge
    const badge = document.createElement('div');
    badge.id = 'drag-phase-badge';
    badge.className = 'drag-phase-badge';
    badge.textContent = exercise ? exercise.phase.toUpperCase() : '';
    badge.style.position = 'fixed';
    badge.style.pointerEvents = 'none';
    badge.style.left = (e.clientX + 15) + 'px';
    badge.style.top = (e.clientY + 15) + 'px';
    document.body.appendChild(badge);
}

function handleTimelineDragStart(e) {
    draggedElement = this;
    const activityId = this.dataset.activityId;
    const exercise = activityId ? exercises.find(ex => ex.id === activityId) : null;

    draggedData = {
        source: 'timeline',
        dayId: parseInt(this.dataset.dayId),
        activityIndex: parseInt(this.dataset.activityIndex),
        phase: this.dataset.phase,
        additionalPhases: exercise && exercise.additionalPhases ? exercise.additionalPhases : []
    };
    e.dataTransfer.effectAllowed = 'move';
    this.style.opacity = '0.5';

    // Create a floating phase badge
    const badge = document.createElement('div');
    badge.id = 'drag-phase-badge';
    badge.className = 'drag-phase-badge';
    badge.textContent = this.dataset.phase ? this.dataset.phase.toUpperCase() : '';
    badge.style.position = 'fixed';
    badge.style.pointerEvents = 'none';
    badge.style.left = (e.clientX + 15) + 'px';
    badge.style.top = (e.clientY + 15) + 'px';
    document.body.appendChild(badge);
}

function handleDragEnd(e) {
    if (draggedElement) {
        draggedElement.style.opacity = '1';
    }

    // Remove dragging class from toolbox items
    document.querySelectorAll('.toolbox-activity.dragging').forEach(el => {
        el.classList.remove('dragging');
    });

    // Remove all validation states and drop indicators
    document.querySelectorAll('.timeline-activities').forEach(el => {
        el.classList.remove('drag-over');
    });

    document.querySelectorAll('.timeline-activity').forEach(el => {
        el.classList.remove('drop-before', 'drop-after');
    });

    // Remove badge
    const badge = document.getElementById('drag-phase-badge');
    if (badge) {
        badge.remove();
    }

    // Clear dragged data
    draggedData = null;
    draggedElement = null;
}

// Update badge position during drag
document.addEventListener('dragover', function(e) {
    const badge = document.getElementById('drag-phase-badge');
    if (badge && draggedData) {
        badge.style.left = (e.clientX + 15) + 'px';
        badge.style.top = (e.clientY + 15) + 'px';

        // Update badge color based on drop zone
        const dropZone = e.target.closest('.timeline-activities');
        if (dropZone) {
            const dropPhase = dropZone.dataset.phase;
            const isValid = dropPhase === draggedData.phase ||
                          (draggedData.additionalPhases && draggedData.additionalPhases.includes(dropPhase));

            badge.className = 'drag-phase-badge ' + (isValid ? 'valid' : 'invalid');
        } else {
            badge.className = 'drag-phase-badge';
        }
    }
});

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = draggedData.source === 'toolbox' ? 'copy' : 'move';
    this.classList.add('drag-over');
}

function handleDragLeave(e) {
    // Only remove classes if we're actually leaving the drop zone
    if (e.target === this) {
        this.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');

    const targetDayId = parseInt(this.dataset.day);
    const targetPhase = this.dataset.phase;

    // Check if phase matches
    const isValidPhase = targetPhase === draggedData.phase ||
                        (draggedData.additionalPhases && draggedData.additionalPhases.includes(targetPhase));

    if (draggedData.source === 'toolbox') {
        // Add new activity from toolbox
        addActivityToDay(targetDayId, draggedData.exerciseId, targetPhase, !isValidPhase);
    } else if (draggedData.source === 'timeline') {
        // Move activity within or between days/phases
        moveActivity(draggedData.dayId, draggedData.activityIndex, targetDayId, targetPhase, !isValidPhase);
    }

    draggedData = null;
    draggedElement = null;
}

function addActivityToDay(dayId, exerciseId, targetPhase, showWarning, targetIndex, insertBefore) {
    const exercise = exercises.find(e => e.id === exerciseId);
    if (!exercise) return;

    const day = workshop.days.find(d => d.day === dayId);
    if (!day) return;

    const newActivity = {
        id: exerciseId,
        duration: exercise.duration.default,
        required: false,
        customized: false,
        order: day.activities.length + 1,
        phaseWarning: showWarning
    };

    // If targetIndex is provided, insert at that position
    if (typeof targetIndex === 'number') {
        const insertAt = insertBefore ? targetIndex : targetIndex + 1;
        day.activities.splice(insertAt, 0, newActivity);
    } else {
        // Otherwise add to end
        day.activities.push(newActivity);
    }

    WorkshopStorage.saveWorkshop(workshop);
    renderWorkshop();
}

function reorderActivity(fromDayId, fromIndex, toDayId, toIndex, insertBefore, showWarning) {
    const fromDay = workshop.days.find(d => d.day === fromDayId);
    const toDay = workshop.days.find(d => d.day === toDayId);

    if (!fromDay || !toDay) return;

    console.log('=== REORDER DEBUG ===');
    console.log('From day:', fromDayId, 'index:', fromIndex);
    console.log('To day:', toDayId, 'index:', toIndex);
    console.log('insertBefore:', insertBefore);
    console.log('Before removal, activities:', fromDay.activities.map((a, i) => `${i}: ${a.id} (phase: ${a.phase || 'none'})`));

    // Remove from source
    const activity = fromDay.activities.splice(fromIndex, 1)[0];
    activity.phaseWarning = showWarning;

    console.log('Removed activity:', activity.id);
    console.log('After removal, activities:', fromDay.activities.map((a, i) => `${i}: ${a.id} (phase: ${a.phase || 'none'})`));

    // Calculate insertion index
    let insertAt;
    if (fromDayId === toDayId && fromIndex < toIndex) {
        // Same day, moving down - adjust for removed item
        insertAt = insertBefore ? toIndex - 1 : toIndex;
    } else {
        insertAt = insertBefore ? toIndex : toIndex + 1;
    }

    console.log('Calculated insertAt:', insertAt);

    // Insert at calculated position
    toDay.activities.splice(insertAt, 0, activity);

    console.log('After insert, activities:', toDay.activities.map((a, i) => `${i}: ${a.id} (phase: ${a.phase || 'none'})`));
    console.log('Expected order based on visual:', insertBefore ? `Should be BEFORE index ${toIndex}` : `Should be AFTER index ${toIndex}`);

    WorkshopStorage.saveWorkshop(workshop);
    renderWorkshop();
}

function moveActivity(fromDayId, fromIndex, toDayId, targetPhase, showWarning) {
    const fromDay = workshop.days.find(d => d.day === fromDayId);
    const toDay = workshop.days.find(d => d.day === toDayId);

    if (!fromDay || !toDay) return;

    // Remove from source
    const activity = fromDay.activities.splice(fromIndex, 1)[0];
    activity.phaseWarning = showWarning;

    // Add to destination (end of array)
    toDay.activities.push(activity);

    WorkshopStorage.saveWorkshop(workshop);
    renderWorkshop();
}

function deleteActivity(dayId, activityIndex) {
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

    // Get related exercises
    let relatedSection = '';
    if (exercise.relatedExercises && exercise.relatedExercises.length > 0) {
        const relatedExercises = exercise.relatedExercises
            .map(id => exercises.find(e => e.id === id))
            .filter(e => e);

        if (relatedExercises.length > 0) {
            relatedSection = `
                <div class="detail-section related-exercises">
                    <h3>🔗 Related Activities</h3>
                    <p class="related-note">Consider these alternatives or follow-ups:</p>
                    <div class="related-list">
                        ${relatedExercises.map(related => `
                            <div class="related-item" onclick="showActivityDetails('${related.id}')">
                                <span class="related-icon">${related.icon}</span>
                                <span class="related-name">${related.name}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    }

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
        ${relatedSection}
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

function saveWorkshop() {
    WorkshopStorage.saveWorkshop(workshop);

    // Show visual feedback
    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.innerHTML = '✓ Saved';
    btn.disabled = true;

    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }, 1500);
}

function exportWorkshop() {
    WorkshopStorage.exportWorkshop(workshop);
}

function generateReport() {
    window.location.href = 'report.html';
}
