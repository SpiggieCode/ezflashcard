let isTransitioning = false;
let score = 0;
let scoreTrackerEnabled = false;
let cardCounterElement = null;

// Initialize arrays to manage cards
let allCards = [];
let remainingCards = [];
let displayedCards = [];

const getElement = id => document.getElementById(id);

// Unified function to set element visibility or display
const setElementVisibility = (element, isVisible, useDisplay = false) => {
    if (useDisplay) {
        element.style.display = isVisible ? 'block' : 'none';
    } else {
        element.style.visibility = isVisible ? 'visible' : 'hidden';
    }
};

// Utility functions for class manipulation
const addClasses = (element, ...classes) => element.classList.add(...classes);
const removeClasses = (element, ...classes) => element.classList.remove(...classes);

// Utility function to format multiline text
const formatMultilineText = text => text.replace(/\n/g, '<br>');

const container = getElement('flashcards-container');
const messageDiv = getElement('message');
const removeCorrectToggle = getElement('remove-correct-toggle');
const textInputToggle = getElement('text-input-toggle');
const matchModeToggle = getElement('match-mode-toggle');
const darkModeToggle = getElement('dark-mode-toggle');
const studyModeToggle = getElement('study-mode-toggle');
const limitCardsToggle = getElement('limit-cards-toggle');
const limitCardsNumber = getElement('limit-cards-number');
const limitCardsContainer = document.getElementById('limit-cards-container');
const swapQAToggle = getElement('swap-question-answers'); // Swap Q&A toggle

const importButton = document.getElementById("import-button");
const fileInput = document.getElementById("file-input");
const urlContainer = document.getElementById("generated-url-container");
const urlElement = document.getElementById("generated-url");
const closeButton = document.getElementById("close-url-button");

// Open file selector when clicking import button
importButton.addEventListener("click", () => fileInput.click());

// Handle file input change
fileInput.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const csvText = e.target.result;
            parseCSV(csvText);
        };
        reader.readAsText(file);
    }
});

// Function to parse CSV safely and generate the URL
function parseCSV(csvText) {
    Papa.parse(csvText, {
        complete: function (results) {
            if (results.data.length < 2) return; // Skip empty files

            const baseUrl = window.location.pathname + "?"; // Get the base URL dynamically
            let params = [];

            for (let i = 1; i < results.data.length; i++) { // Skip header row
                const row = results.data[i];
                if (row.length >= 2) {
                    const question = row[0].trim();
                    const answer = row[1].trim();
                    if (question && answer) {
                        params.push(`${encodeURIComponent(question)}=${encodeURIComponent(answer)}`);
                    }
                }
            }

            if (params.length > 0) {
                const url = baseUrl + params.join("&");
                urlElement.href = url;
                urlElement.textContent = "Import complete, click here to start!";
                urlContainer.style.display = "inline-block";
            }
        }
    });
}


closeButton.addEventListener("click", function () {
    urlContainer.style.display = "none";
});

// Enable or disable the number input based on the toggle
limitCardsToggle.addEventListener('change', function () {
    limitCardsNumber.disabled = !this.checked;
    if (this.checked) {
        limitCardsContainer.style.display = "inline-block"; // Show it
    } else {
        limitCardsContainer.style.display = "none"; // Hide it
    }
    createFlashcards();
});

// Limit cards has no flag, so its safe to disable the number container by default
// If I ever want to make a flag for it I will need to add some check to the URL parser
limitCardsContainer.style.display = "none"

// Re-create flashcards when the limit number changes
limitCardsNumber.addEventListener('input', function () {
    createFlashcards();
});

// Function to increment the score
function incrementScore() {
    score++;
    updateScore();
}

// Function to reset the score
function resetScore() {
    score = 0;
    updateScore();
}

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

// Function to update toggle states based on URL parameters
function updateToggleStates(params) {
    const toggles = [
        { element: getElement('click-reveal-toggle'), paramName: 'clickreveal' },
        { element: textInputToggle, paramName: 'textinput' },
        { element: removeCorrectToggle, paramName: 'removecorrect' },
        { element: darkModeToggle, paramName: 'darkmode' },
        { element: studyModeToggle, paramName: 'studymode' },
        { element: matchModeToggle, paramName: 'matchmode' },
        { element: swapQAToggle, paramName: 'swapqa' } // Handle Swap Q&A URL parameter
    ];

    toggles.forEach(({ element, paramName }) => {
        const paramValue = params[paramName];
        if (paramValue !== undefined) {
            element.checked = paramValue === 'true';
            element.dataset.userSet = 'true';

            if (paramName === 'darkmode') {
                toggleDarkMode(element.checked);
            }
        }
    });

    updateOptionStates();
}

// Function to toggle Dark Mode
function toggleDarkMode(enabled) {
    document.body.classList.toggle('dark-mode', enabled);
}

// Function to handle flashcard input
function handleFlashcardInput(event, flashcard, question) {
    if (event.key !== 'Enter') return;

    const input = event.target;
    const isCorrect = input.value.trim().toLowerCase() === question.trim().toLowerCase();

    addClasses(flashcard, 'flip');

    setTimeout(() => {
        addClasses(flashcard, isCorrect ? 'correct' : 'incorrect');
        flashcard.dataset.showingAnswer = 'true';
        flashcard.querySelector('.back').innerHTML = `<div>${formatMultilineText(question)}</div>`;

        if (scoreTrackerEnabled && isCorrect) {
            incrementScore();
        }

        // Handle removal of correct cards if necessary
        if (isCorrect && (removeCorrectToggle.checked || scoreTrackerEnabled)) {
            setTimeout(() => {
                removeFlashcardWithAnimation(flashcard);
            }, 500);
        }
    }, 600);

    flashcard.dataset.attempted = 'true';
}

// Utility function to remove flashcard with animation
function removeFlashcardWithAnimation(flashcard, delay = 600) {
    addClasses(flashcard, 'fade-out');
    setTimeout(() => {
        flashcard.remove();
        flashcard.dispatchEvent(new Event('removeCard'));
    }, delay);
}

// Function to generate flashcard content
function generateFlashcardContent(flashcard, question, answer, cardType, pairId = null) {
    flashcard.innerHTML = '';
    flashcard.className = 'flashcard';
    Object.assign(flashcard.dataset, { question, answer });

    const front = document.createElement('div');
    front.className = 'front';
    const back = document.createElement('div');
    back.className = 'back';

    // Swap question and answer only in Click to Flip and Text Input modes
    let displayQuestion = question;
    let displayAnswer = answer;

    const swapQAEnabled = swapQAToggle.checked && (cardType === 'clickReveal' || cardType === 'textInput');
    if (swapQAEnabled) {
        displayQuestion = answer;
        displayAnswer = question;
    }

    if (cardType === 'matchMode') {
        front.innerHTML = `<div>Flip me!</div>`;
        back.innerHTML = `
            <div>
                ${formatMultilineText(question)}
                <hr class="separator">
                ${formatMultilineText(answer)}
            </div>
        `;
        flashcard.onclick = () => handleMatchClick(flashcard);
    } else if (cardType === 'textInput') {
        front.innerHTML = `<div>${formatMultilineText(displayQuestion)}</div>`;
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Type your answer';
        input.id = 'answer-field';
        input.onclick = event => event.stopPropagation();
        input.onkeydown = event => handleFlashcardInput(event, flashcard, displayAnswer);
        front.appendChild(input);
        back.innerHTML = `<div>${formatMultilineText(displayAnswer)}</div>`;
    } else if (cardType === 'studyMode') {
        front.innerHTML = `<div>${formatMultilineText(question)}</div>`;
        back.innerHTML = `<div>${formatMultilineText(answer)}</div>`;
    } else {
        // Click to Flip mode
        front.innerHTML = `<div>${formatMultilineText(displayQuestion)}</div>`;
        back.innerHTML = `<div>${formatMultilineText(displayAnswer)}</div>`;
        flashcard.onclick = () => toggleFlashcard(flashcard, displayQuestion, displayAnswer, cardType);
    }

    flashcard.appendChild(front);
    flashcard.appendChild(back);

    if (pairId) {
        flashcard.dataset.pairId = pairId;
    }
}

// Function to create flashcard element
function createFlashcardElement(question, answer, cardType, pairId = null) {
    const flashcard = document.createElement('div');
    generateFlashcardContent(flashcard, question, answer, cardType, pairId);
    return flashcard;
}

// Encapsulated function to handle match mode clicks
const handleMatchClick = (() => {
    let activeCards = [];
    return function (card) {
        if (activeCards.length < 2 && !card.classList.contains('flipped')) {
            addClasses(card, 'flipped');
            activeCards.push(card);

            if (activeCards.length === 2) {
                const [firstCard, secondCard] = activeCards;
                const isMatch = firstCard.dataset.pairId === secondCard.dataset.pairId;

                setTimeout(() => {
                    if (isMatch) {
                        addClasses(firstCard, 'correct');
                        addClasses(secondCard, 'correct');
                    } else {
                        addClasses(firstCard, 'incorrect');
                        addClasses(secondCard, 'incorrect');
                        setTimeout(() => {
                            removeClasses(firstCard, 'flipped', 'incorrect');
                            removeClasses(secondCard, 'flipped', 'incorrect');
                        }, 1000);
                    }
                    activeCards = [];
                }, 1000);
            }
        }
    };
})();

// Function to toggle flashcard
function toggleFlashcard(flashcard, frontContent, backContent, cardType) {
    if (cardType === 'textInput') return;

    const frontElement = flashcard.querySelector('.front');
    const backElement = flashcard.querySelector('.back');

    if (!frontElement || !backElement) return;

    if (flashcard.dataset.showingAnswer === 'true') {
        removeClasses(flashcard, 'correct', 'incorrect', 'flip');
        setTimeout(() => {
            frontElement.innerHTML = `<div>${formatMultilineText(frontContent)}</div>`;
            flashcard.dataset.showingAnswer = 'false';
            flashcard.dataset.attempted = 'false';
        }, 500);
    } else {
        addClasses(flashcard, 'flip');
        setTimeout(() => {
            addClasses(flashcard, 'correct');
            flashcard.dataset.showingAnswer = 'true';

            if (removeCorrectToggle && removeCorrectToggle.checked) {
                setTimeout(() => {
                    removeFlashcardWithAnimation(flashcard, 500);
                }, 1200);
            }
        }, 500);
    }
}

// Function to determine card type
function getCardType() {
    if (matchModeToggle.checked) {
        return 'matchMode';
    } else if (textInputToggle.checked) {
        return 'textInput';
    } else if (studyModeToggle.checked) {
        return 'studyMode';
    } else {
        return 'clickReveal';
    }
}

// Function to update the card counter
function updateCardCounter(cardsLeft) {
    if (cardCounterElement) {
        cardCounterElement.textContent = `Cards Left: ${cardsLeft}`;
    }
}

// Function to update Study Mode state
function updateStudyMode(isActive) {
    const allFlashcards = Array.from(container.children);
    if (isActive) {
        let currentIndex = 0;
        document.body.classList.add('study-mode');

        if (!cardCounterElement) {
            cardCounterElement = document.createElement('div');
            cardCounterElement.id = 'card-counter';
            document.body.appendChild(cardCounterElement);
        }
        updateCardCounter(allFlashcards.length - currentIndex);

        function showCard(index) {
            allFlashcards.forEach((card, i) => {
                card.style.display = i === index ? 'flex' : 'none';
                removeClasses(card, 'fling');
                if (i === index) {
                    const { question, answer } = card.dataset;
                    card.innerHTML = `
                        <div class="front">
                            <div>${formatMultilineText(question)}</div>
                            <hr class="separator">
                            <div>${formatMultilineText(answer)}</div>
                        </div>
                    `;
                    card.onclick = () => flingCard(card);
                }
            });
            updateCardCounter(allFlashcards.length - index);
        }

        function flingCard(card) {
            addClasses(card, 'fling');
            card.addEventListener('animationend', onAnimationEnd);

            function onAnimationEnd() {
                card.removeEventListener('animationend', onAnimationEnd);
                nextCard();
            }
        }

        function nextCard() {
            if (currentIndex < allFlashcards.length - 1) {
                currentIndex++;
                showCard(currentIndex);
            } else {
                currentIndex = 0;
                allFlashcards.sort(() => Math.random() - 0.5);
                showCard(currentIndex);
            }
        }

        showCard(currentIndex);
    } else {
        document.body.classList.remove('study-mode');
        if (cardCounterElement) {
            cardCounterElement.remove();
            cardCounterElement = null;
        }

        allFlashcards.forEach((card) => {
            card.style.display = 'flex';
            removeClasses(card, 'fling');
            card.onclick = null;
            const { question, answer } = card.dataset;
            generateFlashcardContent(card, question, answer, getCardType());
        });
    }
}

// Function to update option states
function updateOptionStates() {
    const textInputEnabled = textInputToggle.checked;
    scoreTrackerEnabled = textInputEnabled; // Score tracker is now default in text input mode
    setElementVisibility(getElement('score-container'), scoreTrackerEnabled);
}

// Function to handle card removal and replenishing
function setupCardRemovalHandlers(flashcard, cardType) {
    flashcard.addEventListener('removeCard', () => {
        displayedCards = displayedCards.filter(card => card !== flashcard);
        replenishFlashcard(cardType);
    });
}

// Function to replenish flashcard upon removal
function replenishFlashcard(cardType) {
    if (remainingCards.length > 0 && limitCardsToggle.checked && !studyModeToggle.checked) {
        const nextCardData = remainingCards.shift();
        const { question, answer } = nextCardData;

        const newFlashcard = createFlashcardElement(question, answer, cardType);
        setupCardRemovalHandlers(newFlashcard, cardType);
        container.appendChild(newFlashcard);
        displayedCards.push(newFlashcard);
    }
}

// Function to create flashcards
function createFlashcards() {
    const params = getUrlParameters();

    resetScore();

    const scoreContainer = getElement('score-container');
    const textInputEnabled = textInputToggle.checked;

    scoreTrackerEnabled = textInputEnabled; // Score tracker is now default in text input mode
    setElementVisibility(scoreContainer, scoreTrackerEnabled);

    const flagKeys = ['clickreveal', 'textinput', 'removecorrect', 'hidemenu', 'darkmode', 'studymode', 'matchmode', 'swapqa'];
    const cardKeys = Object.keys(params).filter(key => !flagKeys.includes(key));

    if (cardKeys.length === 0) {
        setElementVisibility(messageDiv, true, true);
        return;
    } else {
        setElementVisibility(messageDiv, false, true);
    }

    displayedCards = [];
    remainingCards = [];
    allCards = [];
    container.innerHTML = '';

    const isMatchMode = matchModeToggle.checked;
    const cardType = getCardType();

    if (isMatchMode) {
        updateStudyMode(false);
        addClasses(container, 'match-mode');
    } else {
        removeClasses(container, 'match-mode');
    }

    // Create initial list of all cards
    cardKeys.forEach(key => {
        const question = key.replace(/\\n/g, '\n');
        const answer = params[key];
        const cardData = { question, answer };
        allCards.push(cardData);
    });

    const limitApplied = limitCardsToggle.checked && !studyModeToggle.checked;
    let limit = limitApplied ? parseInt(limitCardsNumber.value, 10) : allCards.length;
    limit = Math.min(limit, allCards.length);

    const initialCards = allCards.slice(0, limit);
    remainingCards = allCards.slice(limit);

    if (cardType === 'matchMode') {
        let cards = [];
        initialCards.forEach(cardData => {
            const { question, answer } = cardData;
            const cardContent = `${question}\n${answer}`;

            // Create two identical cards with a pair ID
            const flashcard1 = createFlashcardElement(question, answer, cardType, cardContent);
            const flashcard2 = createFlashcardElement(question, answer, cardType, cardContent);

            setupCardRemovalHandlers(flashcard1, cardType);
            setupCardRemovalHandlers(flashcard2, cardType);

            cards.push(flashcard1, flashcard2);
            displayedCards.push(flashcard1, flashcard2);
        });

        cards.sort(() => Math.random() - 0.5);
        cards.forEach(card => container.appendChild(card));
    } else {
        initialCards.forEach(cardData => {
            const { question, answer } = cardData;
            const flashcard = createFlashcardElement(question, answer, cardType);

            setupCardRemovalHandlers(flashcard, cardType);

            container.appendChild(flashcard);
            displayedCards.push(flashcard);
        });

        if (studyModeToggle.checked) {
            updateStudyMode(true);
        } else {
            updateStudyMode(false);
        }
    }

    if (params.hidemenu === 'true') getElement('menu-button').style.display = 'none';
}

// Function to update existing flashcards based on toggles
function updateFlashcards() {
    const flashcards = Array.from(container.children);
    const textInputEnabled = textInputToggle.checked;

    scoreTrackerEnabled = textInputEnabled; // Score tracker is now default in text input mode
    setElementVisibility(getElement('score-container'), scoreTrackerEnabled);

    const cardType = getCardType();

    flashcards.forEach(flashcard => {
        const { question, answer } = flashcard.dataset;
        generateFlashcardContent(flashcard, question, answer, cardType);
    });
}

// Function to shuffle flashcards
function shuffleFlashcards() {
    const flashcards = Array.from(container.children);
    flashcards.sort(() => Math.random() - 0.5);
    flashcards.forEach(flashcard => container.appendChild(flashcard));

    if (studyModeToggle.checked) {
        updateStudyMode(true);
    } else {
        updateFlashcards();
    }
}

// Function to toggle the visibility of the settings menu
function toggleMenu() {
    const toggleContainer = getElement('toggle-container');

    if (isTransitioning) return;

    isTransitioning = true;

    if (toggleContainer.classList.contains('show')) {
        removeClasses(toggleContainer, 'show');
        setTimeout(() => {
            setElementVisibility(toggleContainer, false);
            isTransitioning = false;
        }, 101);
    } else {
        setElementVisibility(toggleContainer, true);
        addClasses(toggleContainer, 'show');
        setTimeout(() => isTransitioning = false, 101);
    }
}

// Initialize flashcards on page load
window.onload = () => {
    const params = getUrlParameters();
    updateToggleStates(params);

    createFlashcards();
    updateFlashcards();
};

getElement('revert-button').addEventListener('click', () => {
    resetScore();

    const cardType = getCardType();

    container.innerHTML = '';

    const limitApplied = limitCardsToggle.checked;
    let limit = allCards.length;
    if (limitApplied) {
        limit = parseInt(limitCardsNumber.value, 10) || allCards.length;
    }

    displayedCards = [];
    remainingCards = [];
    let cardsToDisplay = allCards.slice(0, limit);
    remainingCards = allCards.slice(limit);

    if (cardType === 'matchMode') {
        let cards = [];
        cardsToDisplay.forEach(cardData => {
            const { question, answer } = cardData;
            const cardContent = `${question}\n${answer}`;

            const flashcard1 = createFlashcardElement(question, answer, cardType, cardContent);
            const flashcard2 = createFlashcardElement(question, answer, cardType, cardContent);

            setupCardRemovalHandlers(flashcard1, cardType);
            setupCardRemovalHandlers(flashcard2, cardType);

            cards.push(flashcard1, flashcard2);
            displayedCards.push(flashcard1, flashcard2);
        });

        cards.sort(() => Math.random() - 0.5);
        cards.forEach(card => container.appendChild(card));
    } else if (cardType === 'studyMode') {
        cardsToDisplay.forEach(cardData => {
            const { question, answer } = cardData;
            const flashcard = createFlashcardElement(question, answer, cardType);

            setupCardRemovalHandlers(flashcard, cardType);

            container.appendChild(flashcard);
            displayedCards.push(flashcard);
        });

        updateStudyMode(true);
    } else {
        cardsToDisplay.forEach(cardData => {
            const { question, answer } = cardData;
            const flashcard = createFlashcardElement(question, answer, cardType);

            setupCardRemovalHandlers(flashcard, cardType);

            container.appendChild(flashcard);
            displayedCards.push(flashcard);
        });

        updateStudyMode(false);
    }

    if (cardType === 'textInput') {
        updateFlashcards();
    }

    updateOptionStates();
});

// Utility function to add event listeners to multiple elements
const addEventListeners = (eventType, ids, handler) => {
    ids.forEach(id => {
        getElement(id).addEventListener(eventType, handler);
    });
};

// Add event listeners for menu buttons and toggles
addEventListeners('click', ['menu-button'], toggleMenu);
addEventListeners('click', ['shuffle-button'], shuffleFlashcards);

// Options requiring flashcard recreation
addEventListeners('change', ['click-reveal-toggle', 'text-input-toggle', 'study-mode-toggle', 'match-mode-toggle', 'swap-question-answers'], function () {
    this.dataset.userSet = 'true';
    createFlashcards();
});

// Options not requiring flashcard recreation
addEventListeners('change', ['remove-correct-toggle'], function () {
    this.dataset.userSet = 'true';
    updateOptionStates();
});

textInputToggle.addEventListener('change', function () {
    this.dataset.userSet = 'true';
    updateFlashcards();
});

limitCardsToggle.addEventListener('change', function () {
    if (getCardType() !== 'studyMode') {
        updateFlashcards();
    }
});

darkModeToggle.addEventListener('change', function () {
    this.dataset.userSet = 'true';
    toggleDarkMode(this.checked);
});
