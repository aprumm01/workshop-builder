// Workshop Recommendation Logic

let questionnaireData = {};
let recommendedTemplate = {};
let exercises = [];

document.addEventListener('DOMContentLoaded', async function() {
    // Load questionnaire data
    const data = localStorage.getItem('questionnaireData');
    if (!data) {
        window.location.href = 'index.html';
        return;
    }

    questionnaireData = JSON.parse(data);

    // Load exercises and templates
    await loadData();

    // Generate recommendation
    generateRecommendation();
});

async function loadData() {
    try {
        // Load exercises
        const exercisesResponse = await fetch('data/exercises.json');
        const exercisesData = await exercisesResponse.json();
        exercises = exercisesData.exercises;

        // Load templates
        const templatesResponse = await fetch('data/templates.json');
        const templatesData = await templatesResponse.json();
        const templates = templatesData.templates;

        // Find matching template
        recommendedTemplate = templates.find(t => t.workshopType === questionnaireData.workshopType);

        // Customize template based on time available
        customizeTemplate();

    } catch (error) {
        console.error('Error loading data:', error);
        alert('Error loading workshop data. Please try again.');
    }
}

function customizeTemplate() {
    // Adjust template based on duration
    const duration = questionnaireData.duration;

    if (duration === 'half-day') {
        // Reduce to essential activities only
        recommendedTemplate.days = recommendedTemplate.days.map(day => ({
            ...day,
            activities: day.activities.filter(a => a.required),
            totalMinutes: 180
        }));
    } else if (duration === 'multi-day' && questionnaireData.numberOfDays) {
        // Adjust days if different from template
        const targetDays = parseInt(questionnaireData.numberOfDays);
        if (targetDays !== recommendedTemplate.days.length) {
            // For now, keep template as-is
            // More sophisticated logic could redistribute activities
        }
    }

    // Remove activities that don't scale for team size
    const participants = questionnaireData.participantCount;
    recommendedTemplate.days.forEach(day => {
        day.activities = day.activities.filter(activity => {
            const exercise = exercises.find(e => e.id === activity.id);
            if (!exercise || !exercise.recommendIf) return true;

            const recIf = exercise.recommendIf;
            if (recIf.participants) {
                if (recIf.participants.min && participants < recIf.participants.min) return false;
                if (recIf.participants.max && participants > recIf.participants.max) return false;
            }
            return true;
        });
    });
}

function generateRecommendation() {
    // Display warnings/alerts
    displayAlerts();

    // Display summary
    displaySummary();

    // Display rationale
    displayRationale();

    // Display timeline
    displayTimeline();

    // Display 4C's coverage
    display4CsCoverage();
}

function displayAlerts() {
    const container = document.getElementById('alertsContainer');
    const alerts = [];

    // Check for no decider
    if (questionnaireData.hasDecider === 'no') {
        alerts.push({
            type: 'warning',
            title: 'No Decider Assigned',
            message: 'You need to identify a Decider before the workshop. This person has authority to make final decisions.'
        });
    }

    // Check for team context
    if (questionnaireData.hasContext === 'no') {
        alerts.push({
            type: 'info',
            title: 'Team Lacks Context',
            message: 'Consider adding an Expert Interview or context-setting activity at the beginning.'
        });
    }

    // Check for concerns
    if (questionnaireData.shouldHappen === 'unsure' || questionnaireData.shouldHappen === 'no') {
        alerts.push({
            type: 'danger',
            title: 'Workshop Viability Concern',
            message: questionnaireData.concerns || 'You expressed concerns about whether this workshop should happen. Make sure to address these before proceeding.'
        });
    }

    // Check for large team
    if (questionnaireData.participantCount > 15) {
        alerts.push({
            type: 'warning',
            title: 'Large Team Size',
            message: 'With ' + questionnaireData.participantCount + ' participants, some activities may be challenging. Consider breaking into smaller groups.'
        });
    }

    // Render alerts
    alerts.forEach(alert => {
        const alertEl = document.createElement('div');
        alertEl.className = `alert alert-${alert.type}`;
        alertEl.innerHTML = `
            <h4>${alert.title}</h4>
            <p>${alert.message}</p>
        `;
        container.appendChild(alertEl);
    });
}

function displaySummary() {
    const icons = {
        'strategy': '🎯',
        'iteration': '🔄',
        'product': '🚀',
        'anything-goes': '✨'
    };

    document.getElementById('workshopIcon').textContent = icons[questionnaireData.workshopType];
    document.getElementById('workshopTitle').textContent = recommendedTemplate.name;
    document.getElementById('clientName').textContent = 'For: ' + questionnaireData.clientName;

    // Duration
    const durationText = questionnaireData.duration === 'half-day' ? 'Half day (2-3 hours)' :
                        questionnaireData.duration === 'full-day' ? 'Full day (4-6 hours)' :
                        `${questionnaireData.numberOfDays} days, ${recommendedTemplate.duration.totalHours} hours total`;
    document.getElementById('durationValue').textContent = durationText;

    // Participants
    document.getElementById('participantsValue').textContent = questionnaireData.participantCount + ' people';

    // Date
    if (questionnaireData.workshopDate) {
        const date = new Date(questionnaireData.workshopDate);
        document.getElementById('dateValue').textContent = date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

function displayRationale() {
    const container = document.getElementById('rationaleContent');

    let rationale = `<p><strong>Why this structure:</strong> ${recommendedTemplate.rationale.why}</p>`;
    rationale += `<p><strong>How it flows:</strong> ${recommendedTemplate.rationale.structure}</p>`;

    // Add custom rationale based on questionnaire
    if (questionnaireData.duration === 'half-day') {
        rationale += `<p><strong>Time constraint:</strong> We've condensed this to essential activities only since you have limited time available.</p>`;
    }

    if (questionnaireData.hasContext === 'no') {
        rationale += `<p><strong>Building context:</strong> Since the team lacks context, we're prioritizing alignment activities upfront.</p>`;
    }

    container.innerHTML = rationale;
}

function displayTimeline() {
    const container = document.getElementById('timelineContainer');

    recommendedTemplate.days.forEach(day => {
        const dayEl = document.createElement('div');
        dayEl.className = 'timeline-day';

        const totalMinutes = day.activities.reduce((sum, a) => sum + a.duration, 0);
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;

        dayEl.innerHTML = `
            <div class="day-header">
                <div class="day-title">${day.label}</div>
                <div class="day-duration">${hours}h ${mins}m total</div>
            </div>
            <div class="activity-list" id="day-${day.day}-activities"></div>
        `;

        container.appendChild(dayEl);

        const activityList = dayEl.querySelector('.activity-list');
        day.activities.forEach(activity => {
            const exercise = exercises.find(e => e.id === activity.id);
            if (!exercise) return;

            const activityEl = document.createElement('div');
            activityEl.className = 'activity-item';
            activityEl.innerHTML = `
                <div class="activity-icon">${exercise.icon}</div>
                <div class="activity-info">
                    <div class="activity-name">${exercise.name}</div>
                    <div class="activity-phase">${exercise.phase.toUpperCase()} phase</div>
                </div>
                ${activity.required ? '<span class="activity-required">Required</span>' : ''}
                <div class="activity-duration">${activity.duration} min</div>
            `;
            activityList.appendChild(activityEl);
        });
    });
}

function display4CsCoverage() {
    const phases = { collect: [], choose: [], create: [], commit: [] };

    // Categorize activities by phase
    recommendedTemplate.days.forEach(day => {
        day.activities.forEach(activity => {
            const exercise = exercises.find(e => e.id === activity.id);
            if (exercise && phases[exercise.phase]) {
                phases[exercise.phase].push(exercise.name);
            }
        });
    });

    // Update UI
    Object.keys(phases).forEach(phase => {
        const el = document.getElementById(phase + 'Activities');
        const activities = phases[phase];

        if (activities.length > 0) {
            el.textContent = activities.join(', ');
            el.parentElement.setAttribute('data-complete', 'true');
        } else {
            el.textContent = 'No activities';
            el.parentElement.setAttribute('data-complete', 'false');
        }
    });
}

function acceptRecommendation() {
    // Create workshop object
    const workshop = {
        id: WorkshopStorage.generateId(),
        created: new Date().toISOString(),
        meta: {
            goals: questionnaireData.workshopGoals,
            client: questionnaireData.clientName,
            projectContext: questionnaireData.projectContext,
            participants: questionnaireData.participantCount,
            duration: questionnaireData.duration,
            workshopDate: questionnaireData.workshopDate,
            workshopType: questionnaireData.workshopType,
            hasDecider: questionnaireData.hasDecider,
            constraints: questionnaireData.constraints
        },
        days: recommendedTemplate.days.map(day => ({
            day: day.day,
            label: day.label,
            phase: day.phase,
            totalMinutes: day.totalMinutes,
            activities: day.activities.map((activity, index) => ({
                ...activity,
                order: index + 1,
                customized: false
            }))
        }))
    };

    // Save to storage
    WorkshopStorage.saveWorkshop(workshop);

    // Redirect to builder
    window.location.href = 'builder.html';
}

function goBack() {
    window.location.href = 'questionnaire.html';
}
