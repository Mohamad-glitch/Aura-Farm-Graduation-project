/**
 * Initializes the interactive calendar UI.
 * Handles rendering, navigation, event marking, and localStorage persistence.
 */
export function initCalendar() {
    const calendarDays = document.getElementById('calendar-days');
    const currentMonthElement = document.getElementById('current-month');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const eventDisplay = document.getElementById('event-display'); // Element to display events

    let currentDate = new Date();

    // Load marked dates and events from localStorage
    const markedDates = JSON.parse(localStorage.getItem('markedDates') || '{}');
    const events = JSON.parse(localStorage.getItem('events') || '{}');

    /**
     * Renders the calendar grid for the current month.
     * Handles highlighting today, marking event days, and click events for days.
     */
    function renderCalendar() {
        calendarDays.innerHTML = '';

        // Format and display current month
        currentMonthElement.textContent = new Intl.DateTimeFormat('en-US', {
            month: 'long'
        }).format(currentDate);

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();
        const startingDay = firstDayOfMonth.getDay();

        // Previous month's trailing days (for calendar alignment)
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = 0; i < startingDay; i++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('calendar-day', 'other-month');
            dayElement.textContent = prevMonthLastDay - startingDay + i + 1;
            calendarDays.appendChild(dayElement);
        }

        // Current month days
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('calendar-day');
            dayElement.textContent = day;

            // Highlight today
            const isToday =
                day === today.getDate() &&
                month === today.getMonth();

            if (isToday) {
                dayElement.classList.add('today');
            }

            // Mark days with events
            const dateKey = `${month + 1}-${day}`; // Use only month and day as the key
            if (markedDates[dateKey]) {
                dayElement.classList.add('has-data');
            }

            // Add click event to handle adding/viewing events
            dayElement.addEventListener('click', () => {
                // Prompt user to enter or edit an event for the selected day
                const eventText = prompt(
                    `Enter an event for ${dateKey}:`,
                    events[dateKey] || ''
                );
                if (eventText !== null) {
                    if (eventText.trim() !== '') {
                        // Save event and mark the day
                        events[dateKey] = eventText;
                        markedDates[dateKey] = true;
                        dayElement.classList.add('has-data');
                    } else {
                        // Remove event and unmark the day
                        delete events[dateKey];
                        delete markedDates[dateKey];
                        dayElement.classList.remove('has-data');
                    }
                    // Persist events and marked dates to localStorage
                    localStorage.setItem('events', JSON.stringify(events));
                    localStorage.setItem('markedDates', JSON.stringify(markedDates));
                }

                // Update event display area
                updateEventDisplay(dateKey, events[dateKey]);
            });

            calendarDays.appendChild(dayElement);
        }

        // Fill remaining cells to complete the week grid
        const totalCells = startingDay + daysInMonth;
        const remainingCells = 7 - (totalCells % 7);

        if (remainingCells < 7) {
            for (let i = 1; i <= remainingCells; i++) {
                const dayElement = document.createElement('div');
                dayElement.classList.add('calendar-day', 'other-month');
                dayElement.textContent = i;
                calendarDays.appendChild(dayElement);
            }
        }

        // Show today's event by default
        const todayKey = `${today.getMonth() + 1}-${today.getDate()}`;
        updateEventDisplay(todayKey, events[todayKey]);
    }

    /**
     * Updates the event display area with the event for the given date.
     * @param {string} dateKey - The key representing the date (MM-DD).
     * @param {string} eventText - The event text to display.
     */
    function updateEventDisplay(dateKey, eventText) {
        if (eventText) {
            eventDisplay.innerHTML = `<strong>Event for ${dateKey}:</strong> ${eventText}`;
        } else {
            eventDisplay.innerHTML = `<strong>No event for ${dateKey}.</strong>`;
        }
    }

    // Navigation button event listeners
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    // Initial render
    renderCalendar();
}