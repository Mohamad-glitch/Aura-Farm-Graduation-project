/**
 * Edit mode logic for crop cards.
 * Allows users to remove cards and edit crop titles in the UI.
 * Handles saving changes to the backend and reverting edits if canceled.
 */

export let isEditMode = false; // Tracks if edit mode is active
let deletedCards = [];         // Stores cards marked for deletion (for undo)
let editedCards = new Map();   // Maps cards to their original titles for revert

/**
 * Toggles edit mode on or off.
 * In edit mode: shows remove buttons and makes titles editable.
 * On exit: saves or reverts changes, disables edit mode UI.
 */
export function toggleEditMode() {
    if (!isEditMode) {
        isEditMode = true;
        // Show remove buttons and attach removal handler
        document.querySelectorAll('.remove-card').forEach(button => {
            button.style.display = "block";
            button.addEventListener('click', handleCardRemoval);
        });

        // Make card titles editable and attach input handler
        document.querySelectorAll('.card h3').forEach(title => {
            title.setAttribute('contenteditable', 'true');
            title.classList.add('editable');
            title.addEventListener('input', handleTitleEdit);
        });
    } else {
        // Exit edit mode: confirm or revert changes
        const confirmed = confirm("Confirm crop title edits?");
        if (confirmed) {
            saveEditedTitles();
        } else {
            // Revert deleted cards and titles
            deletedCards.forEach(card => card.style.display = "block");
            editedCards.forEach((originalTitle, card) => {
                const title = card.querySelector('h3');
                title.textContent = originalTitle;
            });
        }
        disableEditMode();
    }
    updateEditButtonUI();
}

/**
 * Handles removal of a crop card in edit mode.
 * Hides the card and tracks it for possible undo.
 * @param {Event} e - The click event.
 */
function handleCardRemoval(e) {
    const card = e.target.closest('.card');
    if (card) {
        deletedCards.push(card);
        card.style.display = "none";
    }
}

/**
 * Handles editing of a crop card title in edit mode.
 * Tracks the original title for possible revert.
 * @param {Event} e - The input event.
 */
function handleTitleEdit(e) {
    const card = e.target.closest('.card');
    if (card && !editedCards.has(card)) {
        editedCards.set(card, e.target.textContent.trim());
    }
}

/**
 * Saves edited crop titles to the backend using PATCH requests.
 * Only sends updates for titles that have changed.
 */
function saveEditedTitles() {
    const authToken = localStorage.getItem('authToken'); // Retrieve the auth token

    editedCards.forEach((originalTitle, card) => {
        const newTitle = card.querySelector('h3').textContent.trim();
        const cardId = card.id; // Assuming the card's ID is stored in the `id` attribute

        if (newTitle !== originalTitle) {
            fetch(`http://127.0.0.1:8000/farms/crops/${cardId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}` // Send the auth token
                },
                body: JSON.stringify({ name: newTitle }) // Send the new name
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to update card ${cardId}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                console.log(`Card ${cardId} updated successfully:`, data);
            })
            .catch(error => {
                console.error(`Error updating card ${cardId}:`, error);
            });
        }
    });

    editedCards.clear(); // Clear the edited cards map after saving
}

/**
 * Updates the edit button UI to reflect the current mode.
 * Changes icon and active state.
 */
function updateEditButtonUI() {
    const editButton = document.getElementById('edit');
    if (editButton) {
        editButton.classList.toggle('active', isEditMode);
        editButton.innerHTML = isEditMode
            ? '<i class="fas fa-check"></i>'
            : '<i class="fas fa-edit"></i>';
    }
}

/**
 * Disables edit mode and resets UI changes.
 * Hides remove buttons and makes titles non-editable.
 */
export function disableEditMode() {
    isEditMode = false;
    document.querySelectorAll('.remove-card').forEach(btn => {
        btn.style.display = "none";
    });

    document.querySelectorAll('.card h3').forEach(title => {
        title.removeAttribute('contenteditable');
        title.classList.remove('editable');
    });
}