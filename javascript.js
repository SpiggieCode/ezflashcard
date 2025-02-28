let isTransitioning = false;
let score = 0;
let scoreTrackerEnabled = false;
let cardCounterElement = null;

const getElement = id => document.getElementById(id);
const setVisibility = (element, visible) => element.style.visibility = visible ? 'visible' : 'hidden';

const container = getElement('flashcards-container');
const messageDiv = getElement('message');
const removeCorrectToggle = getElement('remove-correct-toggle');
const textInputToggle = getElement('text-input-toggle');
const scoreTrackerToggle = getElement('show-score-tracker');
const darkModeToggle = getElement('dark-mode-toggle');
const studyModeToggle = getElement('study-mode-toggle');


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

// Function to toggle Dark Mode
function toggleDarkMode(enabled) {
    document.body.classList.toggle('dark-mode', enabled);
}

// Function to handle flashcard input
function handleFlashcardInput(event, flashcard, answer) {
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

        // Get the current state of the "Hide correct" toggle
        const removeCorrectToggle = getElement('remove-correct-toggle');
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
function createFlashcardElement(question, answer, cardType, pairId = null) {
    const flashcard = document.createElement('div');
    flashcard.className = 'flashcard';
    const cardContent = `${question}\n${answer}`;
    Object.assign(flashcard.dataset, { question, answer, content: cardContent });

    if (pairId) {
        flashcard.dataset.pairId = pairId;
    }

    const front = document.createElement('div');
    front.className = 'front';
    if (cardType === 'matchMode') {
        // Front side says "Flip me!" in match mode
        front.innerHTML = `<div>Flip me!</div>`;
    } else {
        // Existing logic for other modes
        front.innerHTML = `<div>${question.replace(/\n/g, '<br>')}</div>`;
    }

    const back = document.createElement('div');
    back.className = 'back';
    back.innerHTML = `
        <div>
            ${question.replace(/\n/g, '<br>')}
            <hr class="separator">
            ${answer.replace(/\n/g, '<br>')}
        </div>
    `;

    flashcard.appendChild(front);
    flashcard.appendChild(back);

    if (cardType === 'matchMode') {
        flashcard.onclick = () => handleMatchClick(flashcard);
    } else if (cardType === 'studyMode') {
        // Existing study mode logic
    } else if (cardType === 'textInput') {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Type your answer';
        input.id = 'answer-field';
        input.onclick = event => event.stopPropagation();
        input.onkeydown = event => handleFlashcardInput(event, flashcard, answer);
        back.appendChild(input);

        flashcard.onclick = () => toggleFlashcard(flashcard, question, answer, input);
    } else {
        flashcard.onclick = () => toggleFlashcard(flashcard, question, answer);
    }

    return flashcard;
}


let activeCards = [];

function handleMatchClick(card) {
    if (activeCards.length < 2 && !card.classList.contains('flipped')) {
        card.classList.add('flipped');
        activeCards.push(card);

        if (activeCards.length === 2) {
            const [firstCard, secondCard] = activeCards;
            const isMatch = firstCard.dataset.pairId === secondCard.dataset.pairId;

            setTimeout(() => {
                if (isMatch) {
                    firstCard.classList.add('correct');
                    secondCard.classList.add('correct');
                    if (removeCorrectToggle.checked) {
                        setTimeout(() => {
                            firstCard.remove();
                            secondCard.remove();
                        }, 1000); // Delay before removing
                    }
                } else {
                    firstCard.classList.add('incorrect');
                    secondCard.classList.add('incorrect');
                    setTimeout(() => {
                        firstCard.classList.remove('flipped', 'incorrect');
                        secondCard.classList.remove('flipped', 'incorrect');
                    }, 1000); // Delay before flipping back
                }
                activeCards = [];
            }, 1000); // Delay to allow the flip animation
        }
    }
}



// Function to reset or toggle flashcard
function toggleFlashcard(flashcard, question, answer, input = null) {
    const frontElement = flashcard.querySelector('.front');
    const backElement = flashcard.querySelector('.back');

    // Get the current state of the "Hide correct" toggle
    const removeCorrectToggle = getElement('remove-correct-toggle');

    if (!frontElement || !backElement) {
        // If the elements are not found, do nothing
        return;
    }

    if (flashcard.dataset.showingAnswer === 'true') {
        flashcard.classList.remove('correct', 'incorrect', 'flip');
        setTimeout(() => {
            frontElement.innerHTML = `<div>${question.replace(/\n/g, '<br>')}</div>`;
            if (input) {
                input.value = '';
                frontElement.appendChild(input);
            }
            flashcard.dataset.showingAnswer = 'false';
            flashcard.dataset.attempted = 'false';
        }, 500);
    } else if (flashcard.dataset.attempted === 'false' && input) {
        // Do nothing if the user hasn't attempted to answer yet
        return;
    } else {
        flashcard.classList.add('flip');
        setTimeout(() => {
            backElement.innerHTML = `<div>${answer.replace(/\n/g, '<br>')}</div>`;
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
function getCardType() {
    const textInputToggle = getElement('text-input-toggle');
    return textInputToggle.checked ? 'textInput' : 'clickReveal';
}

// Function to start Study Mode
function startStudyMode() {
    const allFlashcards = Array.from(container.children);
    let currentIndex = 0;

    // Add the study-mode class to body for styling
    document.body.classList.add('study-mode');

    // Create or show the card counter
    if (!cardCounterElement) {
        cardCounterElement = document.createElement('div');
        cardCounterElement.id = 'card-counter';
        document.body.appendChild(cardCounterElement);
    }
    updateCardCounter(allFlashcards.length - currentIndex);

    function showCard(index) {
        allFlashcards.forEach((card, i) => {
            card.style.display = i === index ? 'flex' : 'none';
            card.classList.remove('fling'); // Remove fling class if present
            if (i === index) {
                const { question, answer } = card.dataset;
                card.innerHTML = `
                    <div class="front">
                        <div>${question.replace(/\n/g, '<br>')}</div>
                        <hr class="separator">
                        <div>${answer.replace(/\n/g, '<br>')}</div>
                    </div>
                `;
                card.onclick = () => flingCard(card);
            }
        });
        updateCardCounter(allFlashcards.length - index);
    }

    function flingCard(card) {
        card.classList.add('fling'); // Add the fling class to trigger animation

        // Wait for the animation to finish before showing the next card
        card.addEventListener('animationend', onAnimationEnd);

        function onAnimationEnd() {
            card.removeEventListener('animationend', onAnimationEnd);
            nextCard(); // Proceed to the next card after animation completes
        }
    }

    function nextCard() {
        if (currentIndex < allFlashcards.length - 1) {
            currentIndex++;
            showCard(currentIndex);
        } else {
            currentIndex = 0; // Reset index to start over
            allFlashcards.sort(() => Math.random() - 0.5); // Reshuffle the cards
            showCard(currentIndex);
        }
    }

    // Initially hide all cards except the first one
    showCard(currentIndex);
}

// Function to update the card counter
function updateCardCounter(cardsLeft) {
    if (cardCounterElement) {
        cardCounterElement.textContent = `Cards Left: ${cardsLeft}`;
    }
}

// Function to stop Study Mode
function stopStudyMode() {
    // Remove the study-mode class from body
    document.body.classList.remove('study-mode');

    // Remove the card counter
    if (cardCounterElement) {
        cardCounterElement.remove();
        cardCounterElement = null;
    }

    // Reset all cards to be visible and have front/back for normal mode
    const allFlashcards = Array.from(container.children);
    allFlashcards.forEach((card) => {
        card.style.display = 'flex'; // Show all cards
        card.classList.remove('fling'); // Remove any animation classes
        card.onclick = null; // Remove click event listener
        const { question, answer } = card.dataset;
        card.innerHTML = ''; // Clear existing content

        // Create front and back for normal mode
        const front = document.createElement('div');
        front.className = 'front';
        front.innerHTML = `<div>${question.replace(/\n/g, '<br>')}</div>`;

        const back = document.createElement('div');
        back.className = 'back';
        back.innerHTML = `<div>${answer.replace(/\n/g, '<br>')}</div>`;

        card.appendChild(front);
        card.appendChild(back);

        // Reattach click handler for toggle functionality
        card.onclick = () => toggleFlashcard(card, question, answer, null, null);
    });
}


function updateOptionStates() {
    const textInputToggle = getElement('text-input-toggle');
    const scoreTrackerToggle = getElement('show-score-tracker');
    const removeCorrectToggle = getElement('remove-correct-toggle');

    const textInputEnabled = textInputToggle.checked;

    // Update score tracker visibility
    scoreTrackerEnabled = textInputEnabled && scoreTrackerToggle.checked;
    setVisibility(getElement('score-container'), scoreTrackerEnabled);
    scoreTrackerToggle.disabled = !textInputEnabled;

    // No need to reset flashcards or score
}

// Function to create flashcards
function createFlashcards() {
    const params = getUrlParameters();

    setToggleState(params, [
        { element: getElement('click-reveal-toggle'), paramName: 'clickreveal' },
        { element: textInputToggle, paramName: 'textinput' },
        { element: removeCorrectToggle, paramName: 'removecorrect' },
        { element: scoreTrackerToggle, paramName: 'scoretracker' },
        { element: darkModeToggle, paramName: 'darkmode' },
        { element: studyModeToggle, paramName: 'studymode' },
        { element: getElement('match-mode-toggle'), paramName: 'matchmode' } // Added matchmode
    ]);

    // Reset score when recreating flashcards
    score = 0;
    updateScore();

    const scoreContainer = getElement('score-container');
    const textInputEnabled = textInputToggle.checked;

    scoreTrackerEnabled = textInputEnabled && scoreTrackerToggle.checked;
    setVisibility(scoreContainer, scoreTrackerEnabled);
    scoreTrackerToggle.disabled = !textInputEnabled;

    const flagKeys = ['clickreveal', 'textinput', 'removecorrect', 'hidemenu', 'scoretracker', 'darkmode', 'studymode', 'matchmode'];
    const cardKeys = Object.keys(params).filter(key => !flagKeys.includes(key));

    if (cardKeys.length === 0) {
        messageDiv.style.display = 'block';
        return;
    } else {
        messageDiv.style.display = 'none';
    }

    container.innerHTML = '';

    const matchModeToggle = getElement('match-mode-toggle');
    const isMatchMode = matchModeToggle.checked;
    const cardType = isMatchMode ? 'matchMode' : (studyModeToggle.checked ? 'studyMode' : getCardType());

    // Add or remove match-mode class on container
    if (isMatchMode) {
        stopStudyMode();
        container.classList.add('match-mode');
    } else {
        container.classList.remove('match-mode');
    }

    if (cardType === 'matchMode') {
        let cards = [];
        cardKeys.forEach(key => {
            const question = key.replace(/\\n/g, '\n');
            const answer = params[key];
            const cardContent = `${question}\n${answer}`;

            // Create two identical cards with a pair ID
            const flashcard1 = createFlashcardElement(question, answer, cardType, cardContent);
            const flashcard2 = createFlashcardElement(question, answer, cardType, cardContent);
            cards.push(flashcard1, flashcard2);
        });
        // Shuffle the cards
        cards.sort(() => Math.random() - 0.5);
        // Append to container
        cards.forEach(card => container.appendChild(card));
    } else {
        // Existing logic for other modes
        cardKeys.forEach(key => {
            const question = key.replace(/\\n/g, '\n');
            const answer = params[key];
            const flashcard = createFlashcardElement(question, answer, cardType);
            container.appendChild(flashcard);
        });

        if (studyModeToggle.checked) {
            startStudyMode();
        } else {
            stopStudyMode();
        }
    }

    if (params.hidemenu === 'true') getElement('menu-button').style.display = 'none';
}



// Function to shuffle flashcards
function shuffleFlashcards() {
    const flashcards = Array.from(container.children);
    flashcards.sort(() => Math.random() - 0.5);
    flashcards.forEach(flashcard => container.appendChild(flashcard));
}

// Function to update existing flashcards based on toggles
function updateFlashcards() {
    const flashcards = Array.from(container.children);
    const textInputEnabled = textInputToggle.checked;

    scoreTrackerEnabled = textInputEnabled && scoreTrackerToggle.checked;
    setVisibility(getElement('score-container'), scoreTrackerEnabled);
    scoreTrackerToggle.disabled = !textInputEnabled;

    flashcards.forEach(flashcard => {
        const { question, answer } = flashcard.dataset;
        const cardType = getCardType();
        flashcard.innerHTML = '';

        const front = document.createElement('div');
        front.className = 'front';
        front.innerHTML = `<div>${question.replace(/\n/g, '<br>')}</div>`;

        const back = document.createElement('div');
        back.className = 'back';
        back.innerHTML = `<div>${answer.replace(/\n/g, '<br>')}</div>`;

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
    createFlashcards(); // Reset the flashcards to their initial state
});

// Add event listeners for the menu buttons and toggles
getElement('menu-button').addEventListener('click', toggleMenu);
getElement('shuffle-button').addEventListener('click', shuffleFlashcards);
// Options requiring flashcard recreation
['click-reveal-toggle', 'text-input-toggle', 'study-mode-toggle', 'match-mode-toggle'].forEach(id => {
    getElement(id).addEventListener('change', function() {
        this.dataset.userSet = true;
        createFlashcards();
    });
});

// Options not requiring flashcard recreation
['remove-correct-toggle', 'show-score-tracker'].forEach(id => {
    getElement(id).addEventListener('change', function() {
        this.dataset.userSet = true;
        updateOptionStates();
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
