/*
 * Toggles between light and dark themes for the application.
 * Saves the user's theme preference in localStorage.
 */
export function themeToggle(buttonId) {
    const button = document.getElementById(buttonId);
    // Check for saved theme in localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.classList.add(savedTheme);
    }

    button.addEventListener('click', () => {
        // Toggle dark mode class on the body
        const isDarkMode = document.body.classList.toggle('dark-mode');
        if (isDarkMode) {
            // Save preference to localStorage
            localStorage.setItem('theme', 'dark-mode');
        } else {
            // Remove preference from localStorage
            localStorage.removeItem('theme');
        }
    });
}