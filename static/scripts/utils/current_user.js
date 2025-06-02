/**
 * Fetches the current user's information from the backend and updates the username display in the UI.
 * Handles authentication and error reporting.
 */
export async function updateUsername() {
    const usernameElement = document.getElementById('username');
    if (!usernameElement) return;

    try {
        const response = await fetch('http://127.0.0.1:8000/show_user', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch user data: ${response.statusText}`);
        }

        const data = await response.json();
        // Update the username element with the user's full name
        usernameElement.innerHTML = `<i class="fas fa-user"></i>${data.full_name}`;

    } catch (error) {
        console.error('Error fetching user data:', error);
    }
}