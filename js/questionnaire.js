// Workshop Questionnaire Logic

let currentSection = 1;
const totalSections = 4;
let workshopType = '';

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    workshopType = localStorage.getItem('selectedWorkshopType') || 'strategy';

    // Update workshop type label
    const typeLabels = {
        'strategy': 'Strategy Workshop',
        'iteration': 'Iteration Workshop',
        'product': 'Product Workshop',
        'anything-goes': 'Anything Goes Workshop'
    };
    document.getElementById('workshopTypeLabel').textContent = typeLabels[workshopType];

    // Populate activity interests
    populateActivityInterests();

    // Add event listeners
    setupEventListeners();

    // Show first section
    showSection(1);
});

function setupEventListeners() {
    // Multi-day toggle
    const durationRadios = document.querySelectorAll('input[name="duration"]');
    durationRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const multiDayDetails = document.getElementById('multiDayDetails');
            multiDayDetails.style.display = this.value === 'multi-day' ? 'block' : 'none';
        });
    });

    // Concerns toggle
    const shouldHappenRadios = document.querySelectorAll('input[name="shouldHappen"]');
    shouldHappenRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const concernsDetails = document.getElementById('concernsDetails');
            concernsDetails.style.display = (this.value === 'unsure' || this.value === 'no') ? 'block' : 'none';
        });
    });

    // Form submission
    document.getElementById('questionnaireForm').addEventListener('submit', function(e) {
        e.preventDefault();
        processQuestionnaire();
    });
}

function populateActivityInterests() {
    // Load exercises from exercises.json would happen here
    // For now, hardcode the 10 core exercises
    const exercises = [
        { id: 'expert-interview', name: 'Expert Interview', icon: '🔍' },
        { id: 'ten-for-ten', name: '10 for 10', icon: '⚡' },
        { id: 'sailboat', name: 'Sailboat', icon: '⛵' },
        { id: 'lightning-demos', name: 'Lightning Demos', icon: '💡' },
        { id: 'user-story-mapping', name: 'User Story Mapping', icon: '🗺️' },
        { id: 'map', name: 'Map', icon: '🗺️' },
        { id: 'long-term-goal', name: 'Long Term Goal', icon: '🎯' },
        { id: 'concept-creation', name: 'Concept Creation', icon: '✨' },
        { id: 'action-board', name: 'Action Board', icon: '📋' },
        { id: 'storyboard', name: 'Storyboard', icon: '🎬' }
    ];

    const container = document.getElementById('activityInterests');
    exercises.forEach(ex => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'activityInterest';
        checkbox.value = ex.id;

        const span = document.createElement('span');
        span.textContent = `${ex.icon} ${ex.name}`;

        label.appendChild(checkbox);
        label.appendChild(span);
        container.appendChild(label);
    });
}

function showSection(sectionNumber) {
    // Hide all sections
    document.querySelectorAll('.question-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show current section
    const currentSectionEl = document.querySelector(`[data-section="${sectionNumber}"]`);
    if (currentSectionEl) {
        currentSectionEl.classList.add('active');
    }

    // Update progress bar
    const progress = (sectionNumber / totalSections) * 100;
    document.getElementById('progressFill').style.width = progress + '%';

    // Update navigation buttons
    document.getElementById('prevBtn').style.display = sectionNumber === 1 ? 'none' : 'block';
    document.getElementById('nextBtn').style.display = sectionNumber === totalSections ? 'none' : 'block';
    document.getElementById('submitBtn').style.display = sectionNumber === totalSections ? 'block' : 'none';
}

function changeSection(direction) {
    const newSection = currentSection + direction;

    // Validate current section before moving forward
    if (direction > 0 && !validateSection(currentSection)) {
        return;
    }

    if (newSection >= 1 && newSection <= totalSections) {
        currentSection = newSection;
        showSection(currentSection);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function validateSection(sectionNumber) {
    const section = document.querySelector(`[data-section="${sectionNumber}"]`);
    const requiredInputs = section.querySelectorAll('[required]');

    for (let input of requiredInputs) {
        if (input.type === 'radio') {
            const radioGroup = section.querySelectorAll(`[name="${input.name}"]`);
            const checked = Array.from(radioGroup).some(radio => radio.checked);
            if (!checked) {
                alert('Please answer all required questions');
                return false;
            }
        } else if (!input.value.trim()) {
            alert('Please fill in all required fields');
            input.focus();
            return false;
        }
    }

    return true;
}

function processQuestionnaire() {
    // Validate all sections
    for (let i = 1; i <= totalSections; i++) {
        if (!validateSection(i)) {
            currentSection = i;
            showSection(i);
            return;
        }
    }

    // Gather all form data
    const formData = {
        workshopType: workshopType,
        clientName: document.getElementById('clientName').value,
        projectContext: document.getElementById('projectContext').value,
        workshopGoals: document.getElementById('workshopGoals').value,
        participantCount: parseInt(document.getElementById('participantCount').value),
        duration: document.querySelector('input[name="duration"]:checked').value,
        numberOfDays: document.getElementById('numberOfDays').value,
        workshopDate: document.getElementById('workshopDate').value,
        hasContext: document.querySelector('input[name="hasContext"]:checked').value,
        hasDecider: document.querySelector('input[name="hasDecider"]:checked').value,
        constraints: document.getElementById('constraints').value,
        shouldHappen: document.querySelector('input[name="shouldHappen"]:checked').value,
        concerns: document.getElementById('concernsText').value,
        activityInterests: Array.from(document.querySelectorAll('input[name="activityInterest"]:checked')).map(cb => cb.value)
    };

    // Check if workshop should proceed
    if (formData.shouldHappen === 'no') {
        if (confirm('You indicated this workshop might not be necessary. Would you like to reconsider the timing or approach before proceeding?')) {
            return;
        }
    }

    // Store questionnaire data
    localStorage.setItem('questionnaireData', JSON.stringify(formData));

    // Redirect to recommendation page
    window.location.href = 'recommendation.html';
}
