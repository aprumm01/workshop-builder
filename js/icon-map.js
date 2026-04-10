// Icon mapping from emoji to Lucide icon names
const ICON_MAP = {
    // Collect phase
    '🔍': 'search',
    '⚡': 'zap',
    '📋': 'clipboard-list',
    '🎯': 'target',
    '💡': 'lightbulb',
    '👋': 'users',

    // Choose phase
    '🎨': 'palette',
    '⭐': 'star',
    '📊': 'bar-chart-2',
    '🔴': 'circle-dot',
    '🎂': 'layers',

    // Create phase
    '✏️': 'pencil',
    '🚀': 'rocket',
    '🎭': 'theatre',
    '❓': 'help-circle',
    '🖼️': 'image',

    // Commit phase
    '📝': 'file-text',
    '✅': 'check-square',
    '🎤': 'mic',
    '📅': 'calendar',

    // Default fallback
    'default': 'circle'
};

function getIconName(emoji) {
    return ICON_MAP[emoji] || ICON_MAP['default'];
}
