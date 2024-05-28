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
        flashcard.classList.add(isCorrect ? 'correct' : 'incorrect');
        flashcard.querySelector('.back').innerHTML = `<div>${answer.replace(/\n/g, '<br>')}</div>`;
        flashcard.dataset.showingAnswer = 'true';
        if (isCorrect && removeCorrectToggle.checked) {
            setTimeout(() => flashcard.remove(), 1000);
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
        }, 600); // Wait for the flip animation to complete
    } else {
        flashcard.classList.add('flip');
        setTimeout(() => {
            flashcard.querySelector('.back').innerHTML = `<div>${answer.replace(/\n/g, '<br>')}</div>`;
            flashcard.classList.add('correct');
            flashcard.dataset.showingAnswer = 'true';
            if (removeCorrectToggle && removeCorrectToggle.checked) {
                setTimeout(() => flashcard.remove(), 1000);
            }
        }, 600); // Wait for the flip animation to complete
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

    setToggleState(params, [
        { element: document.getElementById('click-reveal-toggle'), paramName: 'clickreveal' },
        { element: textInputToggle, paramName: 'textinput' },
        { element: removeCorrectToggle, paramName: 'removecorrect' },
        { element: mixedCardToggle, paramName: 'mixedcards' }
    ]);

    if (Object.keys(params).length === 0) {
        messageDiv.style.display = 'block';
        return;
    } else {
        messageDiv.style.display = 'none';
    }

    container.innerHTML = '';

    const keys = Object.keys(params).filter(key => !['clickreveal', 'textinput', 'removecorrect', 'mixedcards', 'hidemenu'].includes(key));
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
    const mixedCardsEnabled = mixedCardToggle.checked;

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
    toggleContainer.style.display = (toggleContainer.style.display === 'none' || toggleContainer.style.display === '') ? 'flex' : 'none';
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
['click-reveal-toggle', 'text-input-toggle', 'remove-correct-toggle', 'mixed-card-toggle'].forEach(id => {
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
