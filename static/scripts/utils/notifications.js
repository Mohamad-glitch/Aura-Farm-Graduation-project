/**
 * Sets up notification UI and logic for the dashboard.
 * Handles notification badge, dropdown, and fetching notifications from backend.
 * @param {string} notificationButtonId - The ID of the notification button element.
 * @returns {Object} - Exposes addNotification and fetchNotifications functions.
 */
export function setupNotifications(notificationButtonId) {
    const notificationButton = document.getElementById(notificationButtonId);

    // Create and configure the notification badge (shows count)
    const notificationBadge = document.createElement('span');
    notificationBadge.className = 'notification-badge';
    notificationBadge.textContent = '0';
    notificationBadge.style.display = 'none';
    notificationButton.appendChild(notificationBadge);

    // Create and configure the notification dropdown (shows messages)
    const notificationDropdown = document.createElement('div');
    notificationDropdown.className = 'notification-dropdown';
    notificationDropdown.innerHTML = '<div class="notification-item">There are no notifications</div>';
    notificationButton.parentNode.appendChild(notificationDropdown);

    // Toggle dropdown open/close on button click
    notificationButton.addEventListener('click', () => {
    if (notificationDropdown.classList.contains('open')) {
        notificationDropdown.style.maxHeight = '0';
        notificationDropdown.style.opacity = '0';
        setTimeout(() => notificationDropdown.classList.remove('open'), 300);
    } else {
        notificationDropdown.classList.add('open');
        notificationDropdown.style.maxHeight = '250px';
        notificationDropdown.style.opacity = '1';
        // Hide the notification badge when the dropdown is opened
        notificationBadge.style.display = 'none';
        notificationBadge.textContent = '0';
    }
    });


    /**
     * Adds notifications from a JSON object to the dropdown.
     * @param {Object} json - Object with a 'result' array of messages.
     */
    function addNotificationFromJson(json) {
        if (!json || !Array.isArray(json.result)) return;
        // Remove default message if present
        const firstItem = notificationDropdown.querySelector('.notification-item');
        if (firstItem && firstItem.textContent === 'There are no notifications') {
            notificationDropdown.innerHTML = '';
        }
        // Add each notification message to the dropdown and update badge
        json.result.forEach(message => {
            const notificationCount = parseInt(notificationBadge.textContent, 10) + 1;
            notificationBadge.textContent = notificationCount;
            notificationBadge.style.display = 'block';
            const notificationItem = document.createElement('div');
            notificationItem.className = 'notification-item';
            notificationItem.textContent = message;
            notificationDropdown.appendChild(notificationItem);
        });
    }

    /**
     * Fetches notifications from the backend and adds them to the dropdown.
     * Uses the user's auth token for authentication.
     */
    async function fetchNotifications() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://127.0.0.1:8000/farms/photo_analysis', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch notifications');
            const result = await response.json();
            // Backend returns a string, so wrap in array for consistency
            addNotificationFromJson({ result: [result] });
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }



    // Expose helper functions for use elsewhere (e.g., in main.js)
    return { addNotification: addNotificationFromJson, fetchNotifications };
}