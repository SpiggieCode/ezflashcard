let isTransitioning = false;
let score = 0;
let scoreTrackerEnabled = false;

// Function to update the score display
function updateScore() {
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
        scoreElement.textContent = score;
    }
}

// Function to get URL parameters
function getUrlParameters() {
    const params = {};
    new URLSearchParams(window.location.search).forEach((value, key) => {
        params[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\\n/g, '\n'));
    });
    return params;
}

// Function to set toggle states based on URL parameters
function setToggleState(params, toggleElements) {
    toggleElements.forEach(({ element, paramName }) => {
        if (params[paramName] === 'true' && !element.dataset.userSet) {
            element.checked = true;
            if (paramName === 'showscoretracker') {
                scoreTrackerEnabled = true;
                document.getElementById('score-container').style.visibility = 'visible';
            }
        }
    });
}

// Function to handle flashcard input
function handleFlashcardInput(event, flashcard, answer, removeCorrectToggle) {
    if (event.key !== 'Enter') return;

    const input = event.target;
    const isCorrect = input.value.trim().toLowerCase() === answer.trim().toLowerCase();
    flashcard.classList.add('flip');

    setTimeout(() => {
        setTimeout(() => {
            flashcard.classList.add(isCorrect ? 'correct' : 'incorrect'); // Trigger background color change
        }, 100); // Short delay for background color fade-in
        flashcard.querySelector('.back').innerHTML = `<div>${answer.replace(/\n/g, '<br>')}</div>`;
        flashcard.dataset.showingAnswer = 'true';

        if (scoreTrackerEnabled) {
            if (isCorrect) {
                score++; // Increment score if the answer is correct
                updateScore(); // Update the score display
            }
            // Remove flashcard regardless of correctness in score tracker mode
            setTimeout(() => {
                flashcard.classList.add('fade-out'); // Add fade-out class
                setTimeout(() => flashcard.remove(), 600); // Remove flashcard after fade-out
            }, 500); // Wait before starting the fade-out
        } else if (isCorrect && removeCorrectToggle.checked) {
            setTimeout(() => {
                flashcard.classList.add('fade-out'); // Add fade-out class
                setTimeout(() => flashcard.remove(), 600); // Remove flashcard after fade-out
            }, 500); // Wait before starting the fade-out
        }
    }, 600);

    flashcard.dataset.attempted = 'true';
}

// Function to create flashcard element
function createFlashcardElement(question, answer, cardType, removeCorrectToggle) {
    const flashcard = document.createElement('div');
    flashcard.className = 'flashcard';
    Object.assign(flashcard.dataset, { question, answer, showingAnswer: 'false', attempted: 'false' });

    const front = document.createElement('div');
    front.className = 'front';
    front.innerHTML = `<div>${question.replace(/\n/g, '<br>')}</div>`;

    const back = document.createElement('div');
    back.className = 'back';
    back.innerHTML = answer.replace(/\n/g, '<br>');

    flashcard.appendChild(front);
    flashcard.appendChild(back);

    if (cardType === 'textInput') {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Type your answer';
        input.id = 'answer-field';
        input.onclick = event => event.stopPropagation();
        input.onkeydown = event => handleFlashcardInput(event, flashcard, answer, removeCorrectToggle);
        front.appendChild(input);

        flashcard.onclick = () => toggleFlashcard(flashcard, question, answer, removeCorrectToggle, input);
    } else {
        flashcard.onclick = () => toggleFlashcard(flashcard, question, answer, removeCorrectToggle);
    }

    return flashcard;
}

// Function to reset or toggle flashcard
function toggleFlashcard(flashcard, question, answer, removeCorrectToggle, input = null) {
    if (flashcard.dataset.showingAnswer === 'true') {
        flashcard.classList.remove('correct', 'incorrect', 'flip');
        setTimeout(() => {
            flashcard.querySelector('.front').innerHTML = `<div>${question.replace(/\n/g, '<br>')}</div>`;
            if (input) {
                input.value = ''; // Clear the input value if provided
                flashcard.querySelector('.front').appendChild(input);
            }
            flashcard.dataset.showingAnswer = 'false';
            flashcard.dataset.attempted = 'false';
        }, 500); // Wait for the flip animation to complete
    } else {
        if (flashcard.dataset.attempted === 'false' && input) {
            // Prevent flipping if the text input card has not been attempted
            return;
        }
        flashcard.classList.add('flip');
        setTimeout(() => {
            flashcard.querySelector('.back').innerHTML = `<div>${answer.replace(/\n/g, '<br>')}</div>`;
            setTimeout(() => {
                flashcard.classList.add('correct'); // Trigger background color change
            }, 1); // Short delay for background color fade-in
            flashcard.dataset.showingAnswer = 'true';
            if (removeCorrectToggle && removeCorrectToggle.checked) {
                setTimeout(() => {
                    flashcard.classList.add('fade-out'); // Add fade-out class
                    setTimeout(() => flashcard.remove(), 500); // Remove flashcard after fade-out
                }, 1200); // Wait before starting the fade-out
            }
        }, 500); // Wait for the flip animation to complete
    }
}

// Function to reset flashcard
function resetFlashcard(flashcard, question, answer) {
    if (flashcard.dataset.showingAnswer === 'true') {
        const input = flashcard.querySelector('input');
        toggleFlashcard(flashcard, question, answer, null, input);
    }
}

// Function to determine card type
function getCardType(mixedCardsEnabled, textInputToggle) {
    if (mixedCardsEnabled) {
        return Math.random() < 0.5 ? 'textInput' : 'clickReveal';
    }
    return textInputToggle.checked ? 'textInput' : 'clickReveal';
}

// Function to create flashcards
function createFlashcards() {
    const params = getUrlParameters();
    const container = document.getElementById('flashcards-container');
    const messageDiv = document.getElementById('message');
    const removeCorrectToggle = document.getElementById('remove-correct-toggle');
    const mixedCardToggle = document.getElementById('mixed-card-toggle');
    const textInputToggle = document.getElementById('text-input-toggle');
    const scoreTrackerToggle = document.getElementById('show-score-tracker');

    setToggleState(params, [
        { element: document.getElementById('click-reveal-toggle'), paramName: 'clickreveal' },
        { element: textInputToggle, paramName: 'textinput' },
        { element: removeCorrectToggle, paramName: 'removecorrect' },
        { element: mixedCardToggle, paramName: 'mixedcards' },
        { element: scoreTrackerToggle, paramName: 'scoretracker' }
    ]);

    if (params.textinput === 'true') {
        scoreTrackerToggle.disabled = false;
        if (params.scoretracker === 'true') {
            scoreTrackerEnabled = true;
            document.getElementById('score-container').style.visibility = 'visible';
        } else {
            scoreTrackerEnabled = false;
            document.getElementById('score-container').style.visibility = 'hidden';
        }
    } else {
        scoreTrackerToggle.disabled = true;
        scoreTrackerEnabled = false;
        document.getElementById('score-container').style.visibility = 'hidden';
    }

    if (Object.keys(params).length === 0) {
        messageDiv.style.display = 'block';
        return;
    } else {
        messageDiv.style.display = 'none';
    }

    container.innerHTML = '';

    const keys = Object.keys(params).filter(key => !['clickreveal', 'textinput', 'removecorrect', 'mixedcards', 'hidemenu', 'scoretracker'].includes(key));
    keys.sort(() => Math.random() - 0.5); // Shuffle keys

    keys.forEach(key => {
        const question = key.replace(/\\n/g, '\n');
        const answer = params[key];
        const cardType = getCardType(mixedCardToggle.checked, textInputToggle);
        const flashcard = createFlashcardElement(question, answer, cardType, removeCorrectToggle);
        container.appendChild(flashcard);
    });

    // Handle hidemenu parameter
    if (params.hidemenu === 'true') {
        document.getElementById('menu-button').style.display = 'none';
    }
}

// Function to shuffle flashcards
function shuffleFlashcards() {
    const container = document.getElementById('flashcards-container');
    const flashcards = Array.from(container.children);
    flashcards.sort(() => Math.random() - 0.5);
    flashcards.forEach(flashcard => container.appendChild(flashcard));
}

// Function to update existing flashcards based on toggles
function updateFlashcards() {
    const container = document.getElementById('flashcards-container');
    const flashcards = Array.from(container.children);
    const removeCorrectToggle = document.getElementById('remove-correct-toggle');
    const mixedCardToggle = document.getElementById('mixed-card-toggle');
    const textInputToggle = document.getElementById('text-input-toggle');
    const scoreTrackerToggle = document.getElementById('show-score-tracker');
    const mixedCardsEnabled = mixedCardToggle.checked;

    const textInputEnabled = textInputToggle.checked;
    scoreTrackerEnabled = textInputEnabled && scoreTrackerToggle.checked;

    document.getElementById('score-container').style.visibility = scoreTrackerEnabled ? 'visible' : 'hidden';
    scoreTrackerToggle.disabled = !textInputEnabled; // Disable score tracker toggle if text input mode is not enabled

    flashcards.forEach(flashcard => {
        const { question, answer } = flashcard.dataset;
        const cardType = getCardType(mixedCardsEnabled, textInputToggle);
        flashcard.innerHTML = '';

        const front = document.createElement('div');
        front.className = 'front';
        front.innerHTML = `<div>${question.replace(/\n/g, '<br>')}</div>`;

        const back = document.createElement('div');
        back.className = 'back';
        back.innerHTML = answer.replace(/\n/g, '<br>');

        flashcard.appendChild(front);
        flashcard.appendChild(back);

        if (cardType === 'textInput') {
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'Type your answer';
            input.id = 'answer-field';
            input.onclick = event => event.stopPropagation();
            input.onkeydown = event => handleFlashcardInput(event, flashcard, answer, removeCorrectToggle);
            front.appendChild(input);

            flashcard.onclick = () => toggleFlashcard(flashcard, question, answer, removeCorrectToggle, input);
        } else {
            flashcard.onclick = () => toggleFlashcard(flashcard, question, answer, removeCorrectToggle);
        }
    });
}

// Function to toggle the visibility of the settings menu
function toggleMenu() {
    const toggleContainer = document.getElementById('toggle-container');

    // Check if a transition is already in progress
    if (isTransitioning) return;

    // Set the transitioning flag
    isTransitioning = true;

    if (toggleContainer.classList.contains('show')) {
        toggleContainer.classList.remove('show');
        setTimeout(() => {
            toggleContainer.style.visibility = 'hidden';
            // Clear the transitioning flag after the transition
            isTransitioning = false;
        }, 101); // Match the transition duration
    } else {
        toggleContainer.style.visibility = 'visible';
        toggleContainer.classList.add('show');
        setTimeout(() => {
            // Clear the transitioning flag after the transition
            isTransitioning = false;
        }, 101); // Match the transition duration
    }
}

// Initialize flashcards on page load
window.onload = createFlashcards;

// Add event listener for reset button
document.getElementById('revert-button').addEventListener('click', () => {
    const flashcards = document.querySelectorAll('.flashcard');
    flashcards.forEach(card => {
        const question = card.dataset.question;
        const answer = card.dataset.answer;
        resetFlashcard(card, question, answer);
    });
});

// Add event listeners
document.getElementById('menu-button').addEventListener('click', toggleMenu);
document.getElementById('shuffle-button').addEventListener('click', shuffleFlashcards);
['click-reveal-toggle', 'text-input-toggle', 'remove-correct-toggle', 'mixed-card-toggle', 'show-score-tracker'].forEach(id => {
    document.getElementById(id).addEventListener('change', function() {
        this.dataset.userSet = true;
        updateFlashcards();
    });
});

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.flashcard').forEach(card => {
        card.addEventListener('click', () => {
            const question = card.dataset.question;
            const answer = card.dataset.answer;
            const input = card.querySelector('input');
            toggleFlashcard(card, question, answer, document.getElementById('remove-correct-toggle'), input);
        });
    });
});

document.getElementById('text-input-toggle').addEventListener('change', function() {
    this.dataset.userSet = true;
    updateFlashcards();
});
