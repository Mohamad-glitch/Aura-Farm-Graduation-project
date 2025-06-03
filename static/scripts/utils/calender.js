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

        // Previous month's trailing days
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

            const isToday =
                day === today.getDate() &&
                month === today.getMonth();

            if (isToday) {
                dayElement.classList.add('today');
            }

            const dateKey = `${month + 1}-${day}`; // Use only month and day as the key
            if (markedDates[dateKey]) {
                dayElement.classList.add('has-data');
            }

            // Add click event to handle adding/viewing events
            dayElement.addEventListener('click', () => {
                const eventText = prompt(
                    `Enter an event for ${dateKey}:`,
                    events[dateKey] || ''
                );
                if (eventText !== null) {
                    if (eventText.trim() !== '') {
                        events[dateKey] = eventText;
                        markedDates[dateKey] = true;
                        dayElement.classList.add('has-data');
                    } else {
                        delete events[dateKey];
                        delete markedDates[dateKey];
                        dayElement.classList.remove('has-data');
                    }
                    localStorage.setItem('events', JSON.stringify(events));
                    localStorage.setItem('markedDates', JSON.stringify(markedDates));
                }

                // Update event display
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

    function updateEventDisplay(dateKey, eventText) {
        if (eventText) {
            eventDisplay.innerHTML = `<strong>Event for ${dateKey}:</strong> ${eventText}`;
        } else {
            eventDisplay.innerHTML = `<strong>No event for ${dateKey}.</strong>`;
        }
    }

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
