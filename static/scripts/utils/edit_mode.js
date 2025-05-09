export let isEditMode = false;
let deletedCards = [];
let editedCards = new Map();

export function toggleEditMode() {
    if (!isEditMode) {
        isEditMode = true;
        document.querySelectorAll('.remove-card').forEach(button => {
            button.style.display = "block";
            button.addEventListener('click', handleCardRemoval);
        });

        document.querySelectorAll('.card h3').forEach(title => {
            title.setAttribute('contenteditable', 'true');
            title.classList.add('editable');
            title.addEventListener('input', handleTitleEdit);
        });
    } else {
        // Exit edit mode
        const confirmed = confirm("Confirm crop title edits?");
        if (confirmed) {
            saveEditedTitles();
        } else {
            // Revert changes
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

function handleCardRemoval(e) {
    const card = e.target.closest('.card');
    if (card) {
        deletedCards.push(card);
        card.style.display = "none";
    }
}

function handleTitleEdit(e) {
    const card = e.target.closest('.card');
    if (card && !editedCards.has(card)) {
        editedCards.set(card, e.target.textContent.trim());
    }
}

function saveEditedTitles() {
    const authToken = localStorage.getItem('authToken'); // Retrieve the auth token

    editedCards.forEach((originalTitle, card) => {
        const newTitle = card.querySelector('h3').textContent.trim();
        const cardId = card.id; // Assuming the card's ID is stored in the `id` attribute

        if (newTitle !== originalTitle) {
            fetch(`https://whatever-qw7l.onrender.com/farms/crops/${cardId}`, {
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

function updateEditButtonUI() {
    const editButton = document.getElementById('edit');
    if (editButton) {
        editButton.classList.toggle('active', isEditMode);
        editButton.innerHTML = isEditMode
            ? '<i class="fas fa-check"></i>'
            : '<i class="fas fa-edit"></i>';
    }
}

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