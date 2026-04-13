// Workshop Builder - Main Interface Logic

let workshop = null;
let exercises = [];
let draggedElement = null;
let draggedData = null;
let sortableInstances = []; // Track all Sortable instances for cleanup

document.addEventListener('DOMContentLoaded', async function() {
    // Load workshop data
    workshop = WorkshopStorage.loadWorkshop();
    if (!workshop) {
        // Create a default empty workshop
        workshop = {
            meta: {
                workshopType: 'custom',
                client: 'New Workshop',
                projectContext: '',
                goals: '',
                participants: 8
            },
            clientName: 'New Workshop',
            projectContext: '',
            goals: '',
            participants: 8,
            duration: 1,
            days: [
                {
                    day: 1,
                    hours: 8,
                    activities: []
                }
            ]
        };
        WorkshopStorage.saveWorkshop(workshop);
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
    // Update header - check if meta exists
    if (workshop.meta) {
        document.getElementById('workshopTitle').textContent = workshop.meta.workshopType.charAt(0).toUpperCase() + workshop.meta.workshopType.slice(1) + ' Workshop';
        document.getElementById('clientInfo').textContent = 'For: ' + workshop.meta.client;
    } else {
        document.getElementById('workshopTitle').textContent = 'Workshop Builder';
        document.getElementById('clientInfo').textContent = 'For: ' + (workshop.clientName || 'New Workshop');
    }

    // Populate toolbox
    populateToolbox();

    // Setup phase filters
    setupPhaseFilters();
}

function populateToolbox() {
    const container = document.getElementById('toolboxActivities');
    console.log('Populating toolbox, exercises:', exercises);
    console.log('Container:', container);

    if (!exercises || exercises.length === 0) {
        console.error('No exercises loaded!');
        return;
    }

    exercises.forEach(exercise => {
        const activityEl = document.createElement('div');
        activityEl.className = 'toolbox-activity';
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

        activityEl.addEventListener('click', () => showActivityDetails(exercise.id));

        container.appendChild(activityEl);
    });

    // Setup SortableJS for toolbox
    if (typeof Sortable !== 'undefined') {
        new Sortable(container, {
            group: {
                name: 'activities',
                pull: 'clone',
                put: false
            },
            sort: false,
            animation: 150
        });
    }

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

    // Destroy all existing Sortable instances before recreating
    sortableInstances.forEach(instance => {
        if (instance && instance.destroy) {
            instance.destroy();
        }
    });
    sortableInstances = [];

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
                // Use activity's current phase if set, otherwise fall back to exercise default
                const currentPhase = activity.phase || ex.phase;
                groupedActivities[currentPhase].push(phaseData);
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
                    <div class="timeline-activities" data-day-id="${day.day}" data-phase="collect"></div>
                </div>
                <div class="phase-section" data-phase="choose" data-day="${day.day}">
                    <div class="phase-section-header"><i data-lucide="target" style="width: 16px; height: 16px; display: inline; margin-right: 0.5rem;"></i>Choose</div>
                    <div class="timeline-activities" data-day-id="${day.day}" data-phase="choose"></div>
                </div>
                <div class="phase-section" data-phase="create" data-day="${day.day}">
                    <div class="phase-section-header"><i data-lucide="sparkles" style="width: 16px; height: 16px; display: inline; margin-right: 0.5rem;"></i>Create</div>
                    <div class="timeline-activities" data-day-id="${day.day}" data-phase="create"></div>
                </div>
                <div class="phase-section" data-phase="commit" data-day="${day.day}">
                    <div class="phase-section-header"><i data-lucide="check-circle" style="width: 16px; height: 16px; display: inline; margin-right: 0.5rem;"></i>Commit</div>
                    <div class="timeline-activities" data-day-id="${day.day}" data-phase="commit"></div>
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
        activityEl.dataset.activityIndex = activity.originalIndex;
        activityEl.dataset.dayId = dayId;
        activityEl.dataset.phase = exercise.phase;
        activityEl.dataset.activityId = activity.id;

        const iconName = getIconName(exercise.icon);

        // Check if this activity has a suggested next activity
        let suggestionHTML = '';
        if (exercise.suggestedNext) {
            const suggestedExercise = exercises.find(e => e.id === exercise.suggestedNext.activityId);
            if (suggestedExercise) {
                suggestionHTML = `
                    <div class="activity-suggestion">
                        <span class="suggestion-icon">→</span>
                        <span class="suggestion-text">${exercise.suggestedNext.reason}:</span>
                        <button class="suggestion-add-btn"
                                onclick="addSuggestedActivity(${dayId}, '${activity.id}', '${exercise.suggestedNext.activityId}')"
                                title="Add ${suggestedExercise.name}">
                            <i data-lucide="plus"></i>
                            <span>Add ${suggestedExercise.name}</span>
                        </button>
                    </div>
                `;
            }
        }

        activityEl.innerHTML = `
            <div class="activity-handle">⋮⋮</div>
            <div class="activity-icon"><i data-lucide="${iconName}"></i></div>
            <div class="activity-content">
                <div class="activity-name">${exercise.name}</div>
                <div class="activity-meta">
                    <span>${exercise.phase.toUpperCase()}</span>
                    <span>${activity.duration} minutes</span>
                </div>
            </div>
            <div class="activity-actions">
                <button class="action-btn" onclick="showActivityDetails('${exercise.id}')" title="View details" aria-label="View ${exercise.name} details"><i data-lucide="info"></i></button>
                <button class="action-btn" onclick="editActivityDuration(${dayId}, ${activity.originalIndex})" title="Edit duration" aria-label="Edit duration"><i data-lucide="clock"></i></button>
                <button class="action-btn" onclick="deleteActivity(${dayId}, ${activity.originalIndex})" title="Delete" aria-label="Delete ${exercise.name}"><i data-lucide="trash-2"></i></button>
            </div>
            ${suggestionHTML}
        `;

        container.appendChild(activityEl);
    });

    // Use SortableJS for drag-drop reordering
    if (typeof Sortable !== 'undefined') {
        const sortableInstance = new Sortable(container, {
            group: {
                name: 'activities',
                pull: true,
                put: true
            },
            animation: 150,
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',
            onAdd: function(evt) {
                const day = workshop.days.find(d => d.day === dayId);

                // Check if this is a clone from toolbox
                const exerciseId = evt.item.dataset.exerciseId;
                const activityId = evt.item.dataset.activityId;

                if (exerciseId && !activityId) {
                    // This is from toolbox - create new activity
                    const exercise = exercises.find(e => e.id === exerciseId);

                    if (exercise) {
                        // Determine which phase this was dropped into
                        const targetPhase = evt.to.dataset.phase;
                        const dropIndex = evt.newIndex;

                        const newActivity = {
                            id: exercise.id,
                            duration: exercise.duration.default,
                            phase: targetPhase
                        };

                        // Remove the cloned toolbox item from DOM immediately
                        evt.item.remove();

                        // Insert the new activity at the correct position in the data
                        // Read current order from all phases, insert at drop position
                        const newFullOrder = [];

                        ['collect', 'choose', 'create', 'commit'].forEach(phase => {
                            const phaseContainer = document.querySelector(`.timeline-activities[data-phase="${phase}"][data-day-id="${dayId}"]`);
                            if (phaseContainer) {
                                // Filter out any elements without activityId (toolbox clones)
                                const validChildren = Array.from(phaseContainer.children)
                                    .filter(el => el.dataset.activityId);

                                // If this is the target phase, insert at the drop position
                                if (phase === targetPhase) {
                                    const existingPhaseItems = validChildren
                                        .map(el => day.activities.find(a => a.id === el.dataset.activityId))
                                        .filter(a => a);

                                    // Insert new item at dropIndex within this phase
                                    existingPhaseItems.splice(dropIndex, 0, newActivity);
                                    newFullOrder.push(...existingPhaseItems);
                                } else {
                                    // Other phases: just copy existing items
                                    const phaseItems = validChildren
                                        .map(el => day.activities.find(a => a.id === el.dataset.activityId))
                                        .filter(a => a);
                                    newFullOrder.push(...phaseItems);
                                }
                            }
                        });

                        day.activities = newFullOrder;
                        WorkshopStorage.saveWorkshop(workshop);
                        renderWorkshop();
                    }
                }
            },
            onEnd: function(evt) {

                const day = workshop.days.find(d => d.day === dayId);

                // Read the new order from ALL phase containers, in phase order
                const newFullOrder = [];

                ['collect', 'choose', 'create', 'commit'].forEach(phase => {
                    const container = document.querySelector(`.timeline-activities[data-phase="${phase}"][data-day-id="${dayId}"]`);
                    if (container) {
                        const phaseItems = Array.from(container.children).map(el => {
                            const activityId = el.dataset.activityId;

                            if (activityId) {
                                const activity = day.activities.find(a => a.id === activityId);
                                if (activity) {
                                    // Update the phase to match current container
                                    return { ...activity, phase: phase };
                                }
                            }
                            return null;
                        }).filter(a => a);
                        newFullOrder.push(...phaseItems);
                    }
                });

                day.activities = newFullOrder;

                WorkshopStorage.saveWorkshop(workshop);
                renderWorkshop();
            }
        });

        // Store instance for cleanup
        sortableInstances.push(sortableInstance);
    }

    // Initialize Lucide icons after adding all timeline activities
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function handleActivityDragOver(e) {
    e.preventDefault(); // MUST be first - allow drop
    e.stopPropagation();

    console.log('DragOver on:', this.querySelector('.activity-name')?.textContent);

    if (!draggedData || draggedData.source === 'toolbox') {
        console.log('Ignoring - toolbox or no data');
        return;
    }

    console.log('Processing dragover');

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

    const rect = this.getBoundingClientRect();
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

    console.log('draggedData.source:', draggedData.source);
    console.log('isValidPhase:', isValidPhase);

    if (draggedData.source === 'toolbox') {
        console.log('Adding from toolbox');
        addActivityToDay(targetDayId, draggedData.exerciseId, targetPhase, !isValidPhase, targetIndex, insertBefore);
    } else if (draggedData.source === 'timeline') {
        console.log('Reordering within timeline');
        reorderActivity(draggedData.dayId, draggedData.activityIndex, targetDayId, targetIndex, insertBefore, !isValidPhase);
    } else {
        console.error('Unknown source:', draggedData.source);
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
    console.log('=== TIMELINE DRAG START ===');
    draggedElement = this;
    const activityId = this.dataset.activityId;
    const exercise = activityId ? exercises.find(ex => ex.id === activityId) : null;

    console.log('Activity ID:', activityId);
    console.log('Element:', this);

    draggedData = {
        source: 'timeline',
        dayId: parseInt(this.dataset.dayId),
        activityIndex: parseInt(this.dataset.activityIndex),
        phase: this.dataset.phase,
        additionalPhases: exercise && exercise.additionalPhases ? exercise.additionalPhases : []
    };

    console.log('draggedData:', draggedData);

    e.dataTransfer.effectAllowed = 'move';

    // Clone element for drag image with enhanced styling
    const dragImage = this.cloneNode(true);
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    dragImage.style.left = '-1000px';
    dragImage.style.width = this.offsetWidth + 'px';
    dragImage.style.opacity = '0.9';
    dragImage.style.transform = 'scale(1.05) rotate(-2deg)';
    dragImage.style.background = 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)';
    dragImage.style.color = 'white';
    dragImage.style.boxShadow = '0 16px 48px rgba(13, 148, 136, 0.6)';
    dragImage.style.borderColor = '#0D9488';
    document.body.appendChild(dragImage);

    e.dataTransfer.setDragImage(dragImage, e.offsetX, e.offsetY);

    // Remove the drag image after a short delay
    setTimeout(() => dragImage.remove(), 0);

    // Add dragging class to hide original
    this.classList.add('dragging');

    // Force hide with inline style
    this.style.visibility = 'hidden';

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
        draggedElement.classList.remove('dragging');
        draggedElement.style.opacity = '';
        draggedElement.style.visibility = '';
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
        el.classList.remove('drop-before', 'drop-after', 'dragging');
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
        // Same day, moving down - after removal, target index shifts down by 1
        insertAt = insertBefore ? toIndex - 1 : toIndex;
    } else if (fromDayId === toDayId && fromIndex > toIndex) {
        // Same day, moving up - target index doesn't shift
        insertAt = insertBefore ? toIndex : toIndex + 1;
    } else {
        // Different days
        insertAt = insertBefore ? toIndex : toIndex + 1;
    }

    // Clamp insertAt to valid range
    insertAt = Math.max(0, Math.min(insertAt, toDay.activities.length));

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

function addSuggestedActivity(dayId, currentActivityId, suggestedActivityId) {
    const day = workshop.days.find(d => d.day === dayId);
    if (!day) return;

    // Find the current activity to get its phase
    const currentActivity = day.activities.find(a => a.id === currentActivityId);
    if (!currentActivity) return;

    // Get the suggested exercise definition
    const suggestedExercise = exercises.find(e => e.id === suggestedActivityId);
    if (!suggestedExercise) return;

    // Create the new activity with the same phase as current activity
    const newActivity = {
        id: suggestedExercise.id,
        duration: suggestedExercise.duration.default,
        phase: currentActivity.phase || suggestedExercise.phase
    };

    // Add to end of activities list
    day.activities.push(newActivity);

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
        const element = document.getElementById('check-' + phase);
        if (phases[phase]) {
            element.classList.add('covered');
        } else {
            element.classList.remove('covered');
        }
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
