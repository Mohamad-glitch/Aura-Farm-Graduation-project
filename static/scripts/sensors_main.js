// Main entry point for the dashboard application.
// Initializes all UI components and event listeners on DOMContentLoaded.

import { treeAnimation } from './utils/loading_animation.js';
import { setupAddCard } from './utils/add.js';
import { initCalendar } from './utils/calender.js';
import { loadCardsFromStorage } from './utils/card_transfer.js';
import { toggleEditMode } from './utils/edit_mode.js';
import { fetchWeather } from './utils/weather.js';
import { setupNotifications } from './utils/notifications.js';
import { updateUsername } from './utils/current_user.js';
import { themeToggle } from './utils/toggle_theme.js';
import { setupChatbot } from './utils/chatbot.js'; // Import the chatbot setup function

document.addEventListener('DOMContentLoaded', function () {
    // Update username display in the UI
    updateUsername();

    // Initialize calendar widget
    initCalendar();

    // Fetch and display weather for Irbid
    fetchWeather("Irbid");

    // Set up edit button for crop cards
    const editButton = document.getElementById('edit');
    if (editButton) {
        editButton.addEventListener('click', toggleEditMode);
    }

    // Set up Add Card button and load crop cards from backend
    const { createCropCard, MAX_CROPS, addCardBtn } = setupAddCard();
    loadCardsFromStorage(createCropCard, MAX_CROPS, addCardBtn);

    // Enable theme toggle (light/dark mode)
    themeToggle('settings');

    // Set up notifications and show a sample notification after 3 seconds
    const { addNotification } = setupNotifications('noti');
    setTimeout(() => addNotification('KYS'), 3000);

    // Initialize chatbot UI and backend communication
    setupChatbot();
});