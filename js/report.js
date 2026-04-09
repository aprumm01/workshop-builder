// Workshop Report Generator

let workshop = null;
let exercises = [];

document.addEventListener('DOMContentLoaded', async function() {
    workshop = WorkshopStorage.loadWorkshop();
    if (!workshop) {
        alert('No workshop found.');
        window.location.href = 'index.html';
        return;
    }

    await loadExercises();
    generateReport();
});

async function loadExercises() {
    try {
        const response = await fetch('data/exercises.json');
        const data = await response.json();
        exercises = data.exercises;
    } catch (error) {
        console.error('Error loading exercises:', error);
    }
}

function generateReport() {
    // Title and date
    const workshopTypes = {
        'strategy': 'Strategy Workshop',
        'iteration': 'Iteration Workshop',
        'product': 'Product Workshop',
        'anything-goes': 'Custom Workshop'
    };

    document.getElementById('reportTitle').textContent = workshopTypes[workshop.meta.workshopType] + ' Plan';
    document.getElementById('reportDate').textContent = 'Generated: ' + new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Summary
    document.getElementById('clientName').textContent = workshop.meta.client;
    document.getElementById('workshopType').textContent = workshopTypes[workshop.meta.workshopType];
    document.getElementById('participantCount').textContent = workshop.meta.participants + ' people';

    const totalMinutes = workshop.days.reduce((sum, day) => {
        return sum + day.activities.reduce((daySum, a) => daySum + a.duration, 0);
    }, 0);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    document.getElementById('totalDuration').textContent = `${hours}h ${mins}m across ${workshop.days.length} day(s)`;

    // Goals
    document.getElementById('goalsContent').innerHTML = `<p>${workshop.meta.goals}</p>` +
        (workshop.meta.projectContext ? `<p><strong>Project Context:</strong> ${workshop.meta.projectContext}</p>` : '');

    // Agenda Checklist
    generateAgendaChecklist();

    // Detailed Schedule
    generateDetailedSchedule();

    // Participant Roster
    generateParticipantRoster();

    // Materials
    generateMaterialsList();
}

function generateAgendaChecklist() {
    const container = document.getElementById('agendaChecklist');
    let cumulativeTime = 0;

    workshop.days.forEach(day => {
        day.activities.forEach(activity => {
            const exercise = exercises.find(e => e.id === activity.id);
            if (!exercise) return;

            const startMinutes = cumulativeTime;
            const startHours = Math.floor(startMinutes / 60);
            const startMins = startMinutes % 60;
            const timeString = `${startHours.toString().padStart(2, '0')}:${startMins.toString().padStart(2, '0')}`;

            const itemEl = document.createElement('div');
            itemEl.className = 'checklist-item';
            itemEl.innerHTML = `
                <div class="checklist-checkbox"></div>
                <div class="checklist-content">
                    <div class="checklist-time">${timeString} (${activity.duration} min)</div>
                    <div class="checklist-activity">${exercise.icon} ${exercise.name}</div>
                    <div class="checklist-phase">${exercise.phase.toUpperCase()} • Day ${day.day}</div>
                </div>
            `;
            container.appendChild(itemEl);

            cumulativeTime += activity.duration;
        });
    });
}

function generateDetailedSchedule() {
    const container = document.getElementById('detailedSchedule');

    workshop.days.forEach(day => {
        const dayEl = document.createElement('div');
        dayEl.className = 'day-schedule';

        const totalMinutes = day.activities.reduce((sum, a) => sum + a.duration, 0);
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;

        dayEl.innerHTML = `
            <div class="day-schedule-header">
                <h3>${day.label} (${hours}h ${mins}m)</h3>
            </div>
        `;

        day.activities.forEach(activity => {
            const exercise = exercises.find(e => e.id === activity.id);
            if (!exercise) return;

            const activityEl = document.createElement('div');
            activityEl.className = 'activity-detail';
            activityEl.innerHTML = `
                <div class="activity-detail-header">
                    <div class="activity-detail-title">${exercise.icon} ${exercise.name}</div>
                    <div class="activity-detail-duration">${activity.duration} minutes</div>
                </div>
                <div class="activity-detail-description">${exercise.description}</div>
                <div class="activity-detail-materials">
                    <strong>Materials:</strong> ${exercise.materials.join(', ')}
                </div>
            `;
            dayEl.appendChild(activityEl);
        });

        container.appendChild(dayEl);
    });
}

function generateParticipantRoster() {
    const container = document.getElementById('participantGrid');
    const participantCount = workshop.meta.participants;

    for (let i = 1; i <= participantCount; i++) {
        const slotEl = document.createElement('div');
        slotEl.className = 'participant-slot';
        slotEl.innerHTML = `
            <div class="participant-number">${i}</div>
            <div class="participant-name"></div>
        `;
        container.appendChild(slotEl);
    }
}

function generateMaterialsList() {
    const container = document.getElementById('materialsContent');
    const materials = new Set();

    workshop.days.forEach(day => {
        day.activities.forEach(activity => {
            const exercise = exercises.find(e => e.id === activity.id);
            if (exercise && exercise.materials) {
                exercise.materials.forEach(m => materials.add(m));
            }
        });
    });

    const list = document.createElement('ul');
    list.className = 'materials-list';

    Array.from(materials).sort().forEach(material => {
        const li = document.createElement('li');
        li.textContent = material;
        list.appendChild(li);
    });

    container.appendChild(list);
}

function goBack() {
    window.location.href = 'builder.html';
}
