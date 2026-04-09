// Workshop Builder - Local Storage Management

const WorkshopStorage = {
    STORAGE_KEY: 'workshop_builder_current',

    // Save current workshop to localStorage
    saveWorkshop(workshop) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(workshop));
            return true;
        } catch (error) {
            console.error('Error saving workshop:', error);
            return false;
        }
    },

    // Load current workshop from localStorage
    loadWorkshop() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading workshop:', error);
            return null;
        }
    },

    // Clear current workshop
    clearWorkshop() {
        localStorage.removeItem(this.STORAGE_KEY);
    },

    // Export workshop as JSON file
    exportWorkshop(workshop) {
        const dataStr = JSON.stringify(workshop, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `workshop_${workshop.meta.client || 'export'}_${new Date().toISOString().split('T')[0]}.json`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    // Generate unique ID
    generateId() {
        return 'workshop_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
};
