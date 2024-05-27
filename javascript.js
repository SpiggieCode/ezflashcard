// Function to get URL parameters
function getUrlParameters() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const params = {};
    for (const [key, value] of urlParams.entries()) {
        params[decodeURIComponent(key)] = decodeURIComponent(value);
    }
    return params;
}

// Function to create flashcards
function createFlashcards() {
    const params = getUrlParameters();
    const container = document.getElementById('flashcards-container');
    const messageDiv = document.getElementById('message');
    const removeCorrectToggle = document.getElementById('remove-correct-toggle');
    const revealAnswerToggle = document.getElementById('reveal-answer-toggle');

    // Automatically set toggles based on URL parameters, if not already manually changed
    if (params['clickreveal'] === 'true' && !revealAnswerToggle.dataset.userSet) {
        revealAnswerToggle.checked = true;
    }
    if (params['removecorrect'] === 'true' && !removeCorrectToggle.dataset.userSet) {
        removeCorrectToggle.checked = true;
    }

    if (Object.keys(params).length === 0) {
        messageDiv.style.display = 'block';
        return;
    } else {
        messageDiv.style.display = 'none';
    }

    // Clear existing flashcards
    container.innerHTML = '';

    const keys = Object.keys(params);

    // Shuffle the keys for randomness
    for (let i = keys.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [keys[i], keys[j]] = [keys[j], keys[i]];
    }

    keys.forEach(key => {
        if (key === 'clickreveal' || key === 'removecorrect') return; // Skip special parameters
        const answer = params[key];
        const flashcard = document.createElement('div');
        flashcard.className = 'flashcard';
        flashcard.dataset.question = key;
        flashcard.dataset.answer = answer;
        flashcard.dataset.showingAnswer = 'false';
        flashcard.dataset.attempted = 'false';
        flashcard.innerText = key;

        if (!revealAnswerToggle.checked) {
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'Type your answer';

            // Prevent the flashcard click event when interacting with the input field
            input.onclick = function(event) {
                event.stopPropagation();
            };

            input.onkeydown = function(event) {
                if (event.key === 'Enter') {
                    if (input.value.trim().toLowerCase() === answer.trim().toLowerCase()) {
                        flashcard.classList.add('correct');
                        flashcard.dataset.attempted = 'true';
                        flashcard.innerHTML = `<div>${answer}</div>`;
                        flashcard.dataset.showingAnswer = 'true';
                        if (removeCorrectToggle.checked) {
                            setTimeout(() => {
                                flashcard.remove();
                            }, 1000); // Delay before removing
                        }
                    } else {
                        flashcard.classList.add('incorrect');
                        flashcard.classList.remove('correct');
                        flashcard.innerHTML = `<div>${answer}</div>`;
                        flashcard.dataset.showingAnswer = 'true';
                        flashcard.dataset.attempted = 'true';
                    }
                }
            };

            flashcard.appendChild(input);

            flashcard.onclick = function() {
                if (flashcard.dataset.showingAnswer === 'true') {
                    flashcard.innerText = key;
                    flashcard.appendChild(input);
                    input.value = '';
                    flashcard.classList.remove('correct', 'incorrect');
                    flashcard.dataset.showingAnswer = 'false';
                } else if (flashcard.dataset.attempted === 'true' || revealAnswerToggle.checked) {
                    flashcard.innerText = flashcard.dataset.answer;
                    if (flashcard.classList.contains('incorrect')) {
                        flashcard.classList.add('incorrect');
                    } else {
                        flashcard.classList.add('correct');
                    }
                    flashcard.dataset.showingAnswer = 'true';
                }
            };
        } else {
            flashcard.onclick = function() {
                if (flashcard.dataset.showingAnswer === 'true') {
                    flashcard.innerText = key;
                    flashcard.classList.remove('correct', 'incorrect');
                    flashcard.dataset.showingAnswer = 'false';
                } else {
                    flashcard.innerText = flashcard.dataset.answer;
                    flashcard.classList.add('correct');
                    flashcard.dataset.showingAnswer = 'true';
                    if (removeCorrectToggle.checked) {
                        setTimeout(() => {
                            flashcard.remove();
                        }, 1000); // Delay before removing
                    }
                }
            };
        }

        container.appendChild(flashcard);
    });
}

// Function to shuffle flashcards
function shuffleFlashcards() {
    const container = document.getElementById('flashcards-container');
    const flashcards = Array.from(container.children);
    for (let i = flashcards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        container.appendChild(flashcards[j]); // Re-append shuffled flashcards
    }
}

// Function to update existing flashcards based on toggles
function updateFlashcards() {
    const container = document.getElementById('flashcards-container');
    const flashcards = Array.from(container.children);
    const revealAnswerToggle = document.getElementById('reveal-answer-toggle');
    const removeCorrectToggle = document.getElementById('remove-correct-toggle');

    flashcards.forEach(flashcard => {
        const key = flashcard.dataset.question;
        const answer = flashcard.dataset.answer;

        if (!revealAnswerToggle.checked) {
            let input = flashcard.querySelector('input');
            if (!input) {
                input = document.createElement('input');
                input.type = 'text';
                input.placeholder = 'Type your answer';
            }

            // Prevent the flashcard click event when interacting with the input field
            input.onclick = function(event) {
                event.stopPropagation();
            };

            input.onkeydown = function(event) {
                if (event.key === 'Enter') {
                    if (input.value.trim().toLowerCase() === answer.trim().toLowerCase()) {
                        flashcard.classList.add('correct');
                        flashcard.dataset.attempted = 'true';
                        flashcard.innerHTML = `<div>${answer}</div>`;
                        flashcard.dataset.showingAnswer = 'true';
                        if (removeCorrectToggle.checked) {
                            setTimeout(() => {
                                flashcard.remove();
                            }, 1000); // Delay before removing
                        }
                    } else {
                        flashcard.classList.add('incorrect');
                        flashcard.classList.remove('correct');
                        flashcard.innerHTML = `<div>${answer}</div>`;
                        flashcard.dataset.showingAnswer = 'true';
                        flashcard.dataset.attempted = 'true';
                    }
                }
            };

            if (!flashcard.contains(input)) {
                flashcard.appendChild(input);
            }

            flashcard.onclick = function() {
                if (flashcard.dataset.showingAnswer === 'true') {
                    flashcard.innerText = key;
                    flashcard.appendChild(input);
                    input.value = '';
                    flashcard.classList.remove('correct', 'incorrect');
                    flashcard.dataset.showingAnswer = 'false';
                } else if (flashcard.dataset.attempted === 'true' || revealAnswerToggle.checked) {
                    flashcard.innerText = flashcard.dataset.answer;
                    if (flashcard.classList.contains('incorrect')) {
                        flashcard.classList.add('incorrect');
                    } else {
                        flashcard.classList.add('correct');
                    }
                    flashcard.dataset.showingAnswer = 'true';
                }
            };
        } else {
            flashcard.querySelectorAll('input').forEach(input => input.remove());
            flashcard.onclick = function() {
                if (flashcard.dataset.showingAnswer === 'true') {
                    flashcard.innerText = key;
                    flashcard.classList.remove('correct', 'incorrect');
                    flashcard.dataset.showingAnswer = 'false';
                } else {
                    flashcard.innerText = flashcard.dataset.answer;
                    flashcard.classList.add('correct');
                    flashcard.dataset.showingAnswer = 'true';
                    if (removeCorrectToggle.checked) {
                        setTimeout(() => {
                            flashcard.remove();
                        }, 1000); // Delay before removing
                    }
                }
            };
        }
    });
}

// Function to toggle the visibility of the settings menu
function toggleMenu() {
    const toggleContainer = document.getElementById('toggle-container');
    if (toggleContainer.style.display === 'none' || toggleContainer.style.display === '') {
        toggleContainer.style.display = 'flex';
    } else {
        toggleContainer.style.display = 'none';
    }
}

// Initialize flashcards on page load
window.onload = createFlashcards;

// Add event listener to the hamburger menu button
document.getElementById('menu-button').addEventListener('click', toggleMenu);

// Add event listener to the shuffle button
document.getElementById('shuffle-button').addEventListener('click', shuffleFlashcards);

// Add event listener to the reveal answer toggle
document.getElementById('reveal-answer-toggle').addEventListener('change', function() {
    revealAnswerToggle.dataset.userSet = true;
    updateFlashcards();
});

// Add event listener to the remove correct toggle
document.getElementById('remove-correct-toggle').addEventListener('change', function() {
    removeCorrectToggle.dataset.userSet = true;
    updateFlashcards();
});