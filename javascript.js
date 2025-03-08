// Flashcard Application JavaScript Code

// State Variables
let isTransitioning = false;
let score = 0;
let scoreTrackerEnabled = false;
let cardCounterElement = null;

// Arrays to manage cards
let allCards = [];
let remainingCards = [];
let displayedCards = [];
let removedPairs = new Set();
let usedPairs = new Set();

// Utility Functions
const getElement = id => document.getElementById(id);
const setElementVisibility = (element, isVisible, useDisplay = false) => {
    if (useDisplay) {
        element.style.display = isVisible ? 'block' : 'none';
    } else {
        element.style.visibility = isVisible ? 'visible' : 'hidden';
    }
};
const addClasses = (element, ...classes) => element.classList.add(...classes);
const removeClasses = (element, ...classes) => element.classList.remove(...classes);
const formatMultilineText = text => text.replace(/\n/g, '<br>');

// DOM Elements
const container = getElement('flashcards-container');
const messageDiv = getElement('message');
const removeCorrectToggle = getElement('remove-correct-toggle');
const textInputToggle = getElement('text-input-toggle');
const matchModeToggle = getElement('match-mode-toggle');
const darkModeToggle = getElement('dark-mode-toggle');
const studyModeToggle = getElement('study-mode-toggle');
const limitCardsToggle = getElement('limit-cards-toggle');
const limitCardsNumber = getElement('limit-cards-number');
const limitCardsContainer = getElement('limit-cards-container');
const swapQAToggle = getElement('swap-question-answers');
const pairModeToggle = getElement('pair-mode-toggle');

const importButton = getElement('import-button');
const fileInput = getElement('file-input');
const urlContainer = getElement('generated-url-container');
const urlElement = getElement('generated-url');
const closeButton = getElement('close-url-button');

// Event Listeners for Importing CSV
importButton.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileImport);
closeButton.addEventListener('click', () => setElementVisibility(urlContainer, false, true));

// Event Listener for Limit Cards Toggle
limitCardsToggle.addEventListener('change', () => {
    limitCardsNumber.disabled = !limitCardsToggle.checked;
    setElementVisibility(limitCardsContainer, limitCardsToggle.checked, true);
    createFlashcards();
});

// Disable Limit Cards Container by default
setElementVisibility(limitCardsContainer, false, true);

// Event Listener for Limit Cards Number Input
limitCardsNumber.addEventListener('input', () => createFlashcards());

// Functions for Score Management
function incrementScore() {
    score++;
    updateScore();
}

function resetScore() {
    score = 0;
    updateScore();
}

function updateScore() {
    const scoreElement = getElement('score');
    if (scoreElement) scoreElement.textContent = score;
}

// Function to Get URL Parameters
function getUrlParameters() {
    const params = {};
    new URLSearchParams(window.location.search).forEach((value, key) => {
        params[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\\n/g, '\n'));
    });
    return params;
}

// Function to Update Toggle States based on URL Parameters
function updateToggleStates(params) {
    const toggles = [
        { element: getElement('click-reveal-toggle'), paramName: 'clickreveal' },
        { element: textInputToggle, paramName: 'textinput' },
        { element: removeCorrectToggle, paramName: 'removecorrect' },
        { element: darkModeToggle, paramName: 'darkmode' },
        { element: studyModeToggle, paramName: 'studymode' },
        { element: matchModeToggle, paramName: 'matchmode' },
        { element: swapQAToggle, paramName: 'swapqa' },
        { element: pairModeToggle, paramName: 'pairmode' }
    ];

    let modeSet = false;

    toggles.forEach(({ element, paramName }) => {
        const paramValue = params[paramName];
        element.checked = paramValue === 'true';

        if (paramValue !== undefined && ['clickreveal', 'textinput', 'studymode', 'matchmode', 'pairmode'].includes(paramName)) {
            modeSet = true;
        }

        if (paramValue === undefined) {
            element.checked = false;
        }

        if (paramName === 'darkmode') {
            toggleDarkMode(element.checked);
        }
    });

    // Default to "Click to Flip" mode if no mode is specified
    if (!modeSet) {
        getElement('click-reveal-toggle').checked = true;
    }

    updateOptionStates();
}

// Function to Toggle Dark Mode
function toggleDarkMode(enabled) {
    document.body.classList.toggle('dark-mode', enabled);
}

// Function to Handle Flashcard Input (Text Input Mode)
function handleFlashcardInput(event, flashcard, correctAnswer) {
    if (event.key !== 'Enter') return;

    const input = event.target;
    const userAnswer = input.value.trim().toLowerCase();
    const isCorrect = userAnswer === correctAnswer.trim().toLowerCase();

    addClasses(flashcard, 'flip');

    setTimeout(() => {
        addClasses(flashcard, isCorrect ? 'correct' : 'incorrect');
        flashcard.dataset.showingAnswer = 'true';
        flashcard.querySelector('.back').innerHTML = `<div>${formatMultilineText(correctAnswer)}</div>`;

        if (scoreTrackerEnabled && isCorrect) {
            incrementScore();
        }

        // Remove card if correct and option is enabled
        if (isCorrect && removeCorrectToggle.checked) {
            setTimeout(() => {
                removeFlashcardWithAnimation(flashcard);
            }, 500);
        }
    }, 600);

    flashcard.dataset.attempted = 'true';
}

// Function to Remove Flashcard with Animation
function removeFlashcardWithAnimation(flashcard, delay = 600) {
    addClasses(flashcard, 'fade-out');
    setTimeout(() => {
        flashcard.remove();

        if (flashcard.dataset.pairId) {
            const pairId = flashcard.dataset.pairId;
            if (!removedPairs.has(pairId)) {
                removedPairs.add(pairId);
                usedPairs.delete(pairId);

                // Remove both cards of the pair from displayedCards
                displayedCards = displayedCards.filter(card => card.dataset.pairId !== pairId);

                flashcard.dispatchEvent(new CustomEvent('removePair', { detail: pairId }));
            }
        } else {
            // Remove the card from displayedCards
            displayedCards = displayedCards.filter(card => card !== flashcard);

            flashcard.dispatchEvent(new Event('removeCard'));
        }
    }, delay);
}

// Function to Generate Flashcard Content
function generateFlashcardContent(flashcard, question, answer, cardType, pairId = null) {
    flashcard.innerHTML = '';
    flashcard.className = 'flashcard';
    Object.assign(flashcard.dataset, { question, answer });

    const front = document.createElement('div');
    front.className = 'front';

    const back = document.createElement('div');
    back.className = 'back';

    // Swap Q&A if enabled
    let displayQuestion = question;
    let displayAnswer = answer;
    const swapQAEnabled = swapQAToggle.checked && ['clickReveal', 'textInput'].includes(cardType);
    if (swapQAEnabled) {
        displayQuestion = answer;
        displayAnswer = question;
    }

    // Generate content based on card type
    switch (cardType) {
        case 'pairMode':
            front.innerHTML = `<div>${formatMultilineText(question || answer)}</div>`;
            flashcard.onclick = () => handlePairModeClick(flashcard);
            break;

        case 'matchMode':
            front.innerHTML = `<div>Flip me!</div>`;
            back.innerHTML = `
                <div>
                    ${formatMultilineText(question)}
                    <hr class="separator">
                    ${formatMultilineText(answer)}
                </div>
            `;
            flashcard.onclick = () => handleMatchClick(flashcard);
            break;

        case 'textInput':
            front.innerHTML = `<div>${formatMultilineText(displayQuestion)}</div>`;
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'Type your answer';
            input.onclick = event => event.stopPropagation();
            input.onkeydown = event => handleFlashcardInput(event, flashcard, displayAnswer);
            front.appendChild(input);
            back.innerHTML = `<div>${formatMultilineText(displayAnswer)}</div>`;
            break;

        case 'studyMode':
            front.innerHTML = `<div>${formatMultilineText(question)}</div>`;
            back.innerHTML = `<div>${formatMultilineText(answer)}</div>`;
            break;

        default: // 'clickReveal'
            front.innerHTML = `<div>${formatMultilineText(displayQuestion)}</div>`;
            back.innerHTML = `<div>${formatMultilineText(displayAnswer)}</div>`;
            flashcard.onclick = () => toggleFlashcard(flashcard, displayQuestion, displayAnswer);
            break;
    }

    flashcard.appendChild(front);
    flashcard.appendChild(back);

    if (pairId) {
        flashcard.dataset.pairId = pairId;
    }
}

// Function to Handle Pair Mode Clicks
const handlePairModeClick = (() => {
    let selectedCards = [];
    return function (card) {
        if (card.classList.contains('selected')) {
            removeClasses(card, 'selected');
            selectedCards = selectedCards.filter(c => c !== card);
        } else if (selectedCards.length < 2) {
            addClasses(card, 'selected');
            selectedCards.push(card);

            if (selectedCards.length === 2) {
                const [firstCard, secondCard] = selectedCards;
                const isMatch = firstCard.dataset.pairId === secondCard.dataset.pairId;

                setTimeout(() => {
                    if (isMatch) {
                        addClasses(firstCard, 'correct');
                        addClasses(secondCard, 'correct');

                        if (scoreTrackerEnabled) {
                            incrementScore();
                        }

                        if (removeCorrectToggle.checked) {
                            setTimeout(() => {
                                removeFlashcardWithAnimation(firstCard);
                                removeFlashcardWithAnimation(secondCard);
                            }, 500);
                        } else {
                            removeClasses(firstCard, 'selected');
                            removeClasses(secondCard, 'selected');
                        }
                    } else {
                        addClasses(firstCard, 'incorrect');
                        addClasses(secondCard, 'incorrect');
                        setTimeout(() => {
                            removeClasses(firstCard, 'selected', 'incorrect');
                            removeClasses(secondCard, 'selected', 'incorrect');
                        }, 1000);
                    }
                    selectedCards = [];
                }, 500);
            }
        }
    };
})();

// Function to Handle Match Mode Clicks
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

                        if (scoreTrackerEnabled) {
                            incrementScore();
                        }

                        if (removeCorrectToggle.checked) {
                            setTimeout(() => {
                                removeFlashcardWithAnimation(firstCard);
                                removeFlashcardWithAnimation(secondCard);
                            }, 500);
                        } else {
                            removeClasses(firstCard, 'flipped', 'correct');
                            removeClasses(secondCard, 'flipped', 'correct');
                        }
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

// Function to Create Flashcard Element
function createFlashcardElement(question, answer, cardType, pairId = null) {
    const flashcard = document.createElement('div');
    generateFlashcardContent(flashcard, question, answer, cardType, pairId);
    return flashcard;
}

// Function to Toggle Flashcard (Flip)
function toggleFlashcard(flashcard, frontContent, backContent) {
    if (flashcard.dataset.showingAnswer === 'true') {
        removeClasses(flashcard, 'correct', 'incorrect', 'flip');
        setTimeout(() => {
            flashcard.querySelector('.front').innerHTML = `<div>${formatMultilineText(frontContent)}</div>`;
            flashcard.dataset.showingAnswer = 'false';
            flashcard.dataset.attempted = 'false';
        }, 500);
    } else {
        addClasses(flashcard, 'flip');
        setTimeout(() => {
            addClasses(flashcard, 'correct');
            flashcard.dataset.showingAnswer = 'true';

            if (removeCorrectToggle.checked) {
                setTimeout(() => {
                    removeFlashcardWithAnimation(flashcard, 500);
                }, 1200);
            }
        }, 500);
    }
}

// Function to Determine Card Type
function getCardType() {
    if (matchModeToggle.checked) {
        return 'matchMode';
    } else if (pairModeToggle.checked) {
        return 'pairMode';
    } else if (textInputToggle.checked) {
        return 'textInput';
    } else if (studyModeToggle.checked) {
        return 'studyMode';
    } else {
        return 'clickReveal';
    }
}

// Function to Update Card Counter
function updateCardCounter(cardsLeft) {
    if (cardCounterElement) {
        cardCounterElement.textContent = `Cards Left: ${cardsLeft}`;
    }
}

// Function to Update Study Mode State
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

        allFlashcards.forEach(card => {
            card.style.display = 'flex';
            removeClasses(card, 'fling');
            card.onclick = null;
            const { question, answer } = card.dataset;
            generateFlashcardContent(card, question, answer, getCardType());
        });
    }
}

// Function to Update Option States
function updateOptionStates() {
    const isStudyMode = studyModeToggle.checked;
    const isMatchMode = matchModeToggle.checked;
    const isPairMode = pairModeToggle.checked;
    const isTextInputMode = textInputToggle.checked;

    scoreTrackerEnabled = isTextInputMode || isPairMode || isMatchMode;
    setElementVisibility(getElement('score-container'), scoreTrackerEnabled);
}

// Function to Setup Card Removal Handlers
function setupCardRemovalHandlers(flashcard, cardType) {
    if (cardType === 'pairMode' || cardType === 'matchMode') {
        flashcard.addEventListener('removePair', () => {
            replenishFlashcard(cardType);
        });
    } else {
        flashcard.addEventListener('removeCard', () => {
            displayedCards = displayedCards.filter(card => card !== flashcard);
            replenishFlashcard(cardType);
        });
    }
}

// **Function to Replenish Flashcard upon Removal**
function replenishFlashcard(cardType) {
    const desiredPairCount = parseInt(limitCardsNumber.value, 10) || allCards.length;

    let currentPairCount = (cardType === 'pairMode' || cardType === 'matchMode') ? displayedCards.length / 2 : displayedCards.length;

    if (currentPairCount < desiredPairCount && limitCardsToggle.checked && !studyModeToggle.checked) {
        // Find available pairs not currently in use and not already removed
        const availableCardData = allCards.filter(cardData => {
            const pairId = `${cardData.question}-${cardData.answer}`;
            return !usedPairs.has(pairId) && !removedPairs.has(pairId);
        });

        if (availableCardData.length > 0) {
            // Select a random pair to add
            const nextCardData = availableCardData[Math.floor(Math.random() * availableCardData.length)];
            const { question, answer } = nextCardData;
            const pairId = `${question}-${answer}`;
            usedPairs.add(pairId);

            if (cardType === 'matchMode') {
                const flashcard1 = createFlashcardElement(question, answer, cardType, pairId);
                const flashcard2 = createFlashcardElement(question, answer, cardType, pairId);

                setupCardRemovalHandlers(flashcard1, cardType);
                setupCardRemovalHandlers(flashcard2, cardType);

                // **Insert new cards at random positions in displayedCards**
                insertAtRandomPosition(displayedCards, flashcard1);
                insertAtRandomPosition(displayedCards, flashcard2);

                // Shuffle and re-render in Match Mode
                displayedCards.sort(() => Math.random() - 0.5);
                container.innerHTML = '';
                displayedCards.forEach(card => container.appendChild(card));

            } else if (cardType === 'pairMode') {
                const questionCard = createFlashcardElement(question, '', cardType, pairId);
                const answerCard = createFlashcardElement('', answer, cardType, pairId);

                setupCardRemovalHandlers(questionCard, cardType);
                setupCardRemovalHandlers(answerCard, cardType);

                // **Insert new cards at random positions in displayedCards**
                insertAtRandomPosition(displayedCards, questionCard);
                insertAtRandomPosition(displayedCards, answerCard);

                // Shuffle and re-render in Pair Mode
                displayedCards.sort(() => Math.random() - 0.5);
                container.innerHTML = '';
                displayedCards.forEach(card => container.appendChild(card));

            } else {
                // For other modes, simply append the new flashcard
                const flashcard = createFlashcardElement(question, answer, cardType);

                setupCardRemovalHandlers(flashcard, cardType);

                container.appendChild(flashcard);
                displayedCards.push(flashcard);
            }
        }
    }
}

// **Utility function to insert an item at a random position in an array**
function insertAtRandomPosition(array, item) {
    const randomIndex = Math.floor(Math.random() * (array.length + 1));
    array.splice(randomIndex, 0, item);
}



// Function to Create Flashcards
function createFlashcards(shouldRecreateAllCards = true) {
    const params = getUrlParameters();
    resetScore();

    const isMatchMode = matchModeToggle.checked;
    const isPairMode = pairModeToggle.checked;
    const isStudyMode = studyModeToggle.checked;
    const cardType = getCardType();

    scoreTrackerEnabled = textInputToggle.checked || isPairMode || isMatchMode;
    setElementVisibility(getElement('score-container'), scoreTrackerEnabled);

    const flagKeys = ['clickreveal', 'textinput', 'removecorrect', 'hidemenu', 'darkmode', 'studymode', 'matchmode', 'swapqa', 'pairmode'];
    const cardKeys = Object.keys(params).filter(key => !flagKeys.includes(key));

    if (cardKeys.length === 0) {
        setElementVisibility(messageDiv, true, true);
        return;
    } else {
        setElementVisibility(messageDiv, false, true);
    }

    displayedCards = [];
    remainingCards = [];
    container.innerHTML = '';

    usedPairs.clear();
    removedPairs.clear();

    if (shouldRecreateAllCards) {
        allCards = [];

        // Create initial list of all cards
        cardKeys.forEach(key => {
            const question = key.replace(/\\n/g, '\n');
            const answer = params[key];
            const cardData = { question, answer };
            allCards.push(cardData);
        });
    }
    // If shouldRecreateAllCards is false, use existing allCards (which is shuffled)

    const limitApplied = limitCardsToggle.checked && !isStudyMode;
    let limit;

    if (limitApplied) {
        limit = parseInt(limitCardsNumber.value, 10) || allCards.length;
        limit = Math.min(limit, allCards.length);
    } else {
        limit = allCards.length;
    }

    const initialCards = allCards.slice(0, limit);
    remainingCards = allCards.slice(limit);

    // Rest of the function remains the same...
    // (Recreate displayedCards and add them to the container)
    
    if (isMatchMode) {
        let cards = [];
        initialCards.forEach(cardData => {
            const { question, answer } = cardData;
            const pairId = `${question}-${answer}`;
            usedPairs.add(pairId);

            const flashcard1 = createFlashcardElement(question, answer, cardType, pairId);
            const flashcard2 = createFlashcardElement(question, answer, cardType, pairId);

            setupCardRemovalHandlers(flashcard1, cardType);
            setupCardRemovalHandlers(flashcard2, cardType);

            cards.push(flashcard1, flashcard2);
            displayedCards.push(flashcard1, flashcard2);
        });

        cards.sort(() => Math.random() - 0.5);
        cards.forEach(card => container.appendChild(card));

    } else if (isPairMode) {
        let cards = [];
        initialCards.forEach(cardData => {
            const { question, answer } = cardData;
            const pairId = `${question}-${answer}`;
            usedPairs.add(pairId);

            const questionCard = createFlashcardElement(question, '', cardType, pairId);
            const answerCard = createFlashcardElement('', answer, cardType, pairId);

            setupCardRemovalHandlers(questionCard, cardType);
            setupCardRemovalHandlers(answerCard, cardType);

            cards.push(questionCard, answerCard);
            displayedCards.push(questionCard, answerCard);
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

        if (isStudyMode) {
            updateStudyMode(true);
        } else {
            updateStudyMode(false);
        }
    }
}


// Function to Update Existing Flashcards Based on Toggles
function updateFlashcards() {
    const flashcards = Array.from(container.children);
    const cardType = getCardType();

    flashcards.forEach(flashcard => {
        const { question, answer } = flashcard.dataset;
        generateFlashcardContent(flashcard, question, answer, cardType);
    });
}

// Function to Shuffle Flashcards
function shuffleFlashcards() {
    // Shuffle allCards array
    allCards.sort(() => Math.random() - 0.5);

    // Reset the game state
    resetScore();
    usedPairs.clear();
    removedPairs.clear();
    displayedCards = [];
    container.innerHTML = '';

    // Recreate flashcards using the shuffled allCards without recreating it
    createFlashcards(false);
}

// Function to Toggle the Visibility of the Settings Menu
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

// Initialize Flashcards on Page Load
window.onload = () => {
    const params = getUrlParameters();
    updateToggleStates(params);

    createFlashcards();
    updateFlashcards();
};

// Revert Button Event Listener
getElement('revert-button').addEventListener('click', () => {
    resetScore();

    // Clear tracking sets to reset the state
    removedPairs.clear();
    usedPairs.clear();

    createFlashcards();
    updateFlashcards();
    updateOptionStates();
});

// Utility Function to Add Event Listeners to Multiple Elements
function addEventListeners(eventType, ids, handler) {
    ids.forEach(id => {
        getElement(id).addEventListener(eventType, handler);
    });
}

// Add Event Listeners for Menu Buttons and Toggles
addEventListeners('click', ['menu-button'], toggleMenu);
addEventListeners('click', ['shuffle-button'], shuffleFlashcards);

// Options Requiring Flashcard Recreation
addEventListeners('change', ['click-reveal-toggle', 'text-input-toggle', 'study-mode-toggle', 'match-mode-toggle', 'pair-mode-toggle', 'swap-question-answers'], function () {
    this.dataset.userSet = 'true';
    createFlashcards();
});

// Options Not Requiring Flashcard Recreation
addEventListeners('change', ['remove-correct-toggle'], () => updateOptionStates());

// Event Listener for Dark Mode Toggle
darkModeToggle.addEventListener('change', function () {
    this.dataset.userSet = 'true';
    toggleDarkMode(this.checked);
});

// Function to Handle File Import for CSV
function handleFileImport(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const csvText = e.target.result;
            parseCSV(csvText);
        };
        reader.readAsText(file);
    }
}

// Function to Parse CSV and Generate the URL
function parseCSV(csvText) {
    Papa.parse(csvText, {
        complete: function (results) {
            if (results.data.length < 2) return; // Skip empty files

            const baseUrl = window.location.pathname + "?";
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
                setElementVisibility(urlContainer, true, true);
            }
        }
    });
}
