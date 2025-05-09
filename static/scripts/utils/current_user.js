export async function updateUsername() {
    const usernameElement = document.getElementById('username');
    if (!usernameElement) return;

    try {
        const response = await fetch('https://whatever-qw7l.onrender.com/show_user', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch user data: ${response.statusText}`);
        }

        const data = await response.json();
        usernameElement.innerHTML = `<i class="fas fa-user"></i>${data.full_name}`;

    } catch (error) {
        console.error('Error fetching user data:', error);
    }
}