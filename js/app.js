// Workshop Builder - Main Application Logic

function startQuestionnaire(workshopType) {
    // Store the selected workshop type and redirect to questionnaire
    localStorage.setItem('selectedWorkshopType', workshopType);
    window.location.href = 'questionnaire.html';
}

function loadWorkshop() {
    // Trigger file upload to load saved workshop JSON
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = function(e) {
        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onload = function(event) {
            try {
                const workshop = JSON.parse(event.target.result);
                WorkshopStorage.saveWorkshop(workshop);
                window.location.href = 'builder.html';
            } catch (error) {
                alert('Error loading workshop file. Please make sure it is a valid Workshop Builder JSON file.');
                console.error('Load error:', error);
            }
        };

        reader.readAsText(file);
    };

    input.click();
}
