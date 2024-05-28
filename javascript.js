let isTransitioning = false;
let score = 0;
let scoreTrackerEnabled = false;

const getElement = id => document.getElementById(id);
const setVisibility = (element, visible) => element.style.visibility = visible ? 'visible' : 'hidden';

// Function to update the score display
function updateScore() {
    const scoreElement = getElement('score');
    if (scoreElement) scoreElement.textContent = score;
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
                setVisibility(getElement('score-container'), true);
            } else if (paramName === 'darkmode') {
                toggleDarkMode(true);
            }
        }
    });
}

// Add the toggleDarkMode function
function toggleDarkMode(enabled) {
    document.body.classList.toggle('dark-mode', enabled);
}

// Function to handle flashcard input
function handleFlashcardInput(event, flashcard, answer, removeCorrectToggle) {
    if (event.key !== 'Enter') return;

    const input = event.target;
    const isCorrect = input.value.trim().toLowerCase() === answer.trim().toLowerCase();
    flashcard.classList.add('flip');

    setTimeout(() => {
        flashcard.classList.add(isCorrect ? 'correct' : 'incorrect');
        flashcard.querySelector('.back').innerHTML = `<div>${answer.replace(/\n/g, '<br>')}</div>`;
        flashcard.dataset.showingAnswer = 'true';

        if (scoreTrackerEnabled && isCorrect) {
            score++;
            updateScore();
        }

        if (scoreTrackerEnabled || (isCorrect && removeCorrectToggle.checked)) {
            setTimeout(() => {
                flashcard.classList.add('fade-out');
                setTimeout(() => flashcard.remove(), 600);
            }, 500);
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
    }

    flashcard.onclick = () => toggleFlashcard(flashcard, question, answer, removeCorrectToggle, cardType === 'textInput' ? front.querySelector('input') : null);

    return flashcard;
}

// Function to reset or toggle flashcard
function toggleFlashcard(flashcard, question, answer, removeCorrectToggle, input = null) {
    if (flashcard.dataset.showingAnswer === 'true') {
        flashcard.classList.remove('correct', 'incorrect', 'flip');
        setTimeout(() => {
            flashcard.querySelector('.front').innerHTML = `<div>${question.replace(/\n/g, '<br>')}</div>`;
            if (input) {
                input.value = '';
                flashcard.querySelector('.front').appendChild(input);
            }
            flashcard.dataset.showingAnswer = 'false';
            flashcard.dataset.attempted = 'false';
        }, 500);
    } else if (flashcard.dataset.attempted === 'false' && input) {
        return;
    } else {
        flashcard.classList.add('flip');
        setTimeout(() => {
            flashcard.querySelector('.back').innerHTML = `<div>${answer.replace(/\n/g, '<br>')}</div>`;
            flashcard.classList.add('correct');
            flashcard.dataset.showingAnswer = 'true';
            if (removeCorrectToggle && removeCorrectToggle.checked) {
                setTimeout(() => {
                    flashcard.classList.add('fade-out');
                    setTimeout(() => flashcard.remove(), 500);
                }, 1200);
            }
        }, 500);
    }
}

// Function to determine card type
function getCardType(mixedCardsEnabled, textInputToggle) {
    return mixedCardsEnabled ? (Math.random() < 0.5 ? 'textInput' : 'clickReveal') : (textInputToggle.checked ? 'textInput' : 'clickReveal');
}

// Function to create flashcards
function createFlashcards() {
    const params = getUrlParameters();
    const container = getElement('flashcards-container');
    const messageDiv = getElement('message');
    const removeCorrectToggle = getElement('remove-correct-toggle');
    const mixedCardToggle = getElement('mixed-card-toggle');
    const textInputToggle = getElement('text-input-toggle');
    const scoreTrackerToggle = getElement('show-score-tracker');
    const darkModeToggle = getElement('dark-mode-toggle');

    setToggleState(params, [
        { element: getElement('click-reveal-toggle'), paramName: 'clickreveal' },
        { element: textInputToggle, paramName: 'textinput' },
        { element: removeCorrectToggle, paramName: 'removecorrect' },
        { element: mixedCardToggle, paramName: 'mixedcards' },
        { element: scoreTrackerToggle, paramName: 'scoretracker' },
        { element: darkModeToggle, paramName: 'darkmode' }
    ]);

    const scoreContainer = getElement('score-container');
    if (params.textinput === 'true') {
        scoreTrackerToggle.disabled = false;
        scoreTrackerEnabled = params.scoretracker === 'true';
        setVisibility(scoreContainer, scoreTrackerEnabled);
    } else {
        scoreTrackerToggle.disabled = true;
        scoreTrackerEnabled = false;
        setVisibility(scoreContainer, false);
    }

    const cardKeys = Object.keys(params).filter(key => !['clickreveal', 'textinput', 'removecorrect', 'mixedcards', 'hidemenu', 'scoretracker', 'darkmode'].includes(key));
    if (cardKeys.length === 0) {
        messageDiv.style.display = 'block';
        return;
    } else {
        messageDiv.style.display = 'none';
    }

    container.innerHTML = '';

    cardKeys.sort(() => Math.random() - 0.5);

    cardKeys.forEach(key => {
        const question = key.replace(/\\n/g, '\n');
        const answer = params[key];
        const cardType = getCardType(mixedCardToggle.checked, textInputToggle);
        const flashcard = createFlashcardElement(question, answer, cardType, removeCorrectToggle);
        container.appendChild(flashcard);
    });

    if (params.hidemenu === 'true') getElement('menu-button').style.display = 'none';
}


// Function to shuffle flashcards
function shuffleFlashcards() {
    const container = getElement('flashcards-container');
    const flashcards = Array.from(container.children);
    flashcards.sort(() => Math.random() - 0.5);
    flashcards.forEach(flashcard => container.appendChild(flashcard));
}

// Function to update existing flashcards based on toggles
function updateFlashcards() {
    const container = getElement('flashcards-container');
    const flashcards = Array.from(container.children);
    const removeCorrectToggle = getElement('remove-correct-toggle');
    const mixedCardToggle = getElement('mixed-card-toggle');
    const textInputToggle = getElement('text-input-toggle');
    const scoreTrackerToggle = getElement('show-score-tracker');
    const mixedCardsEnabled = mixedCardToggle.checked;
    const textInputEnabled = textInputToggle.checked;

    scoreTrackerEnabled = textInputEnabled && scoreTrackerToggle.checked;
    setVisibility(getElement('score-container'), scoreTrackerEnabled);
    scoreTrackerToggle.disabled = !textInputEnabled;

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
        }

        flashcard.onclick = () => toggleFlashcard(flashcard, question, answer, removeCorrectToggle, cardType === 'textInput' ? front.querySelector('input') : null);
    });
}

// Function to toggle the visibility of the settings menu
function toggleMenu() {
    const toggleContainer = getElement('toggle-container');

    if (isTransitioning) return;

    isTransitioning = true;

    if (toggleContainer.classList.contains('show')) {
        toggleContainer.classList.remove('show');
        setTimeout(() => {
            setVisibility(toggleContainer, false);
            isTransitioning = false;
        }, 101);
    } else {
        setVisibility(toggleContainer, true);
        toggleContainer.classList.add('show');
        setTimeout(() => isTransitioning = false, 101);
    }
}

// Initialize flashcards on page load
window.onload = createFlashcards;

// Add event listener for reset button
getElement('revert-button').addEventListener('click', () => {
    document.querySelectorAll('.flashcard').forEach(card => {
        if (card.dataset.showingAnswer === 'true') {
            const question = card.dataset.question;
            const answer = card.dataset.answer;
            toggleFlashcard(card, question, answer, null, card.querySelector('input'));
        }
    });
});

// Add event listeners
getElement('menu-button').addEventListener('click', toggleMenu);
getElement('shuffle-button').addEventListener('click', shuffleFlashcards);
['click-reveal-toggle', 'text-input-toggle', 'remove-correct-toggle', 'mixed-card-toggle', 'show-score-tracker'].forEach(id => {
    getElement(id).addEventListener('change', function() {
        this.dataset.userSet = true;
        updateFlashcards();
    });
});

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.flashcard').forEach(card => {
        const question = card.dataset.question;
        const answer = card.dataset.answer;
        toggleFlashcard(card, question, answer, getElement('remove-correct-toggle'), card.querySelector('input'));
    });
});

getElement('text-input-toggle').addEventListener('change', function() {
    this.dataset.userSet = true;
    updateFlashcards();
});

document.getElementById('dark-mode-toggle').addEventListener('change', function() {
    this.dataset.userSet = true;
    toggleDarkMode(this.checked);
});