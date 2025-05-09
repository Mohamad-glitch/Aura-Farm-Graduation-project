export function themeToggle(buttonId) {
    const button = document.getElementById(buttonId);
    // Check for saved theme in localStorage
   
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.classList.add(savedTheme);
    }

    button.addEventListener('click', () => {
        const isDarkMode = document.body.classList.toggle('dark-mode');
        if (isDarkMode) {
            localStorage.setItem('theme', 'dark-mode');
        } else {
            localStorage.removeItem('theme');
        }
    });
}