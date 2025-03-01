let isTransitioning = false;
let score = 0;
let scoreTrackerEnabled = false;
let cardCounterElement = null;

// Initialize arrays to manage cards
let allCards = [];
let remainingCards = [];
let displayedCards = [];

const getElement = id => document.getElementById(id);
const setVisibility = (element, visible) => element.style.visibility = visible ? 'visible' : 'hidden';

const container = getElement('flashcards-container');
const messageDiv = getElement('message');
const removeCorrectToggle = getElement('remove-correct-toggle');
const textInputToggle = getElement('text-input-toggle');
const matchModeToggle = getElement('match-mode-toggle')
const scoreTrackerToggle = getElement('show-score-tracker');
const darkModeToggle = getElement('dark-mode-toggle');
const studyModeToggle = getElement('study-mode-toggle');
const limitCardsToggle = getElement('limit-cards-toggle');
const limitCardsNumber = getElement('limit-cards-number');

// Enable or disable the number input based on the toggle
limitCardsToggle.addEventListener('change', function() {
    limitCardsNumber.disabled = !this.checked;
    createFlashcards();
});

// Re-create flashcards when the limit number changes
limitCardsNumber.addEventListener('input', function() {
    createFlashcards();
});

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
        if (params.hasOwnProperty(paramName)) {
            element.checked = params[paramName] === 'true';
            if (paramName === 'showscoretracker') {
                scoreTrackerEnabled = element.checked;
                setVisibility(getElement('score-container'), element.checked);
            } else if (paramName === 'darkmode') {
                toggleDarkMode(element.checked);
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

    // Flip the card to show the back with the correct answer
    flashcard.classList.add('flip');

    setTimeout(() => {
        flashcard.classList.add(isCorrect ? 'correct' : 'incorrect');
        flashcard.dataset.showingAnswer = 'true';
        flashcard.querySelector('.back').innerHTML = `<div>${answer.replace(/\n/g, '<br>')}</div>`;

        if (scoreTrackerEnabled && isCorrect) {
            score++;
            updateScore();
        }

        // Handle removal of correct cards if necessary
        if (isCorrect && (removeCorrectToggle.checked || scoreTrackerEnabled)) {
            setTimeout(() => {
                flashcard.classList.add('fade-out');
                setTimeout(() => {
                    flashcard.remove();
                    // Dispatch custom event to handle removal
                    flashcard.dispatchEvent(new Event('removeCard'));
                }, 600);
            }, 500);
        }
    }, 600);

    flashcard.dataset.attempted = 'true';
}

// Function to create flashcard element
function createFlashcardElement(question, answer, cardType, pairId = null) {
    const flashcard = document.createElement('div');
    flashcard.className = 'flashcard';
    Object.assign(flashcard.dataset, { question, answer });

    if (pairId) {
        flashcard.dataset.pairId = pairId;
    }

    const front = document.createElement('div');
    front.className = 'front';
    const back = document.createElement('div');
    back.className = 'back';

    if (cardType === 'matchMode') {
        front.innerHTML = `<div>Flip me!</div>`;
        back.innerHTML = `
            <div>
                ${question.replace(/\n/g, '<br>')}
                <hr class="separator">
                ${answer.replace(/\n/g, '<br>')}
            </div>
        `;
        flashcard.onclick = () => handleMatchClick(flashcard);
    } else if (cardType === 'textInput') {
        // Place the question and input field on the front of the card
        front.innerHTML = `<div>${question.replace(/\n/g, '<br>')}</div>`;
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Type your answer';
        input.id = 'answer-field';
        input.onclick = event => event.stopPropagation();
        input.onkeydown = event => handleFlashcardInput(event, flashcard, answer);
        front.appendChild(input);

        // Prepare the back of the card to display the answer
        back.innerHTML = `<div>${answer.replace(/\n/g, '<br>')}</div>`;
    } else {
        // Default behavior for 'clickReveal' mode
        front.innerHTML = `<div>${question.replace(/\n/g, '<br>')}</div>`;
        back.innerHTML = `<div>${answer.replace(/\n/g, '<br>')}</div>`;
        flashcard.onclick = () => toggleFlashcard(flashcard, question, answer);
    }

    flashcard.appendChild(front);
    flashcard.appendChild(back);

    return flashcard;
}

let activeCards = [];

// Function to handle match mode card clicks
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
function toggleFlashcard(flashcard, question, answer) {
    const cardType = getCardType();
    if (cardType === 'textInput') {
        // Do nothing in 'textInput' mode
        return;
    }

    const frontElement = flashcard.querySelector('.front');
    const backElement = flashcard.querySelector('.back');

    if (!frontElement || !backElement) {
        // If the elements are not found, do nothing
        return;
    }

    if (flashcard.dataset.showingAnswer === 'true') {
        flashcard.classList.remove('correct', 'incorrect', 'flip');
        setTimeout(() => {
            frontElement.innerHTML = `<div>${question.replace(/\n/g, '<br>')}</div>`;
            flashcard.dataset.showingAnswer = 'false';
            flashcard.dataset.attempted = 'false';
        }, 500);
    } else {
        flashcard.classList.add('flip');
        setTimeout(() => {
            flashcard.classList.add('correct');
            flashcard.dataset.showingAnswer = 'true';

            if (removeCorrectToggle && removeCorrectToggle.checked) {
                setTimeout(() => {
                    flashcard.classList.add('fade-out');
                    setTimeout(() => {
                        flashcard.remove();
                        // Dispatch custom event to handle removal
                        flashcard.dispatchEvent(new Event('removeCard'));
                    }, 500);
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
    } else if (studyModeToggle.checked){
        return 'studyMode';
    } else {
        return 'clickReveal';
    }
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
        card.onclick = () => toggleFlashcard(card, question, answer);
    });
}

// Function to update option states
function updateOptionStates() {
    const textInputEnabled = textInputToggle.checked;

    // Update score tracker visibility
    scoreTrackerEnabled = textInputEnabled && scoreTrackerToggle.checked;
    setVisibility(getElement('score-container'), scoreTrackerEnabled);
    scoreTrackerToggle.disabled = !textInputEnabled;
}

// Function to create flashcards
function createFlashcards() {
    const params = getUrlParameters();

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

    // Reset arrays when recreating flashcards
    displayedCards = [];
    remainingCards = [];
    allCards = [];
    container.innerHTML = '';

    const isMatchMode = getElement('match-mode-toggle').checked;
    const cardType = getCardType();

    // Add or remove match-mode class on container
    if (isMatchMode) {
        stopStudyMode();
        container.classList.add('match-mode');
    } else {
        container.classList.remove('match-mode');
    }

    // Create initial list of all cards
    cardKeys.forEach(key => {
        const question = key.replace(/\\n/g, '\n');
        const answer = params[key];
        const cardData = { question, answer };
        allCards.push(cardData);
    });

    // Exclude Study Mode from the limit
    const limitApplied = limitCardsToggle.checked && !studyModeToggle.checked;

    // Determine the number of cards to display
    let limit = limitApplied ? parseInt(limitCardsNumber.value, 10) : allCards.length;
    limit = Math.min(limit, allCards.length);

    // Select the limited number of cards or pairs
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

            // Set up removal handlers
            setupCardRemovalHandlers(flashcard1, cardType);
            setupCardRemovalHandlers(flashcard2, cardType);

            cards.push(flashcard1, flashcard2);
            displayedCards.push(flashcard1, flashcard2);
        });
        // Shuffle the cards
        cards.sort(() => Math.random() - 0.5);
        // Append to container
        cards.forEach(card => container.appendChild(card));
    } else {
        // Existing logic for other modes
        initialCards.forEach(cardData => {
            const { question, answer } = cardData;
            const flashcard = createFlashcardElement(question, answer, cardType);

            // Add event listeners to handle removal and replenishing
            setupCardRemovalHandlers(flashcard, cardType);

            container.appendChild(flashcard);
            displayedCards.push(flashcard);
        });

        if (studyModeToggle.checked) {
            startStudyMode();
        } else {
            stopStudyMode();
        }
    }

    if (params.hidemenu === 'true') getElement('menu-button').style.display = 'none';
}

// Function to handle card removal and replenishing
function setupCardRemovalHandlers(flashcard, cardType) {
    flashcard.addEventListener('removeCard', () => {
        // Remove the card from the displayedCards array
        displayedCards = displayedCards.filter(card => card !== flashcard);

        // Check if we need to add a new card to maintain the limit
        if (remainingCards.length > 0 && limitCardsToggle.checked && !studyModeToggle.checked) {
            const nextCardData = remainingCards.shift();
            const { question, answer } = nextCardData;

            if (cardType === 'matchMode') {
                const cardContent = `${question}\n${answer}`;

                // Create two identical cards with a pair ID
                const newFlashcard1 = createFlashcardElement(question, answer, cardType, cardContent);
                const newFlashcard2 = createFlashcardElement(question, answer, cardType, cardContent);

                // Set up the removal handler for the new cards
                setupCardRemovalHandlers(newFlashcard1, cardType);
                setupCardRemovalHandlers(newFlashcard2, cardType);

                container.appendChild(newFlashcard1);
                container.appendChild(newFlashcard2);

                displayedCards.push(newFlashcard1, newFlashcard2);
            } else {
                const newFlashcard = createFlashcardElement(question, answer, cardType);

                // Set up the removal handler for the new card
                setupCardRemovalHandlers(newFlashcard, cardType);

                container.appendChild(newFlashcard);
                displayedCards.push(newFlashcard);
            }
        }
    });
}

// Function to shuffle flashcards
function shuffleFlashcards() {
    const flashcards = Array.from(container.children);
    flashcards.sort(() => Math.random() - 0.5);
    flashcards.forEach(flashcard => container.appendChild(flashcard));
}

// Function to update existing flashcards based on toggles
function updateFlashcards() {
    if (getCardType()=='matchMode') {
        return
    }
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
            input.onkeydown = event => handleFlashcardInput(event, flashcard, answer);
            front.appendChild(input);
        }

        flashcard.onclick = () => toggleFlashcard(flashcard, question, answer);
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
window.onload = () => {
    const params = getUrlParameters();
    setToggleState(params, [
        { element: getElement('click-reveal-toggle'), paramName: 'clickreveal' },
        { element: textInputToggle, paramName: 'textinput' },
        { element: removeCorrectToggle, paramName: 'removecorrect' },
        { element: scoreTrackerToggle, paramName: 'scoretracker' },
        { element: darkModeToggle, paramName: 'darkmode' },
        { element: studyModeToggle, paramName: 'studymode' },
        { element: getElement('match-mode-toggle'), paramName: 'matchmode' }
    ]);
    
    createFlashcards(); // Now create the flashcards with the toggles set
};

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
        this.dataset.userSet = 'true';
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

getElement('text-input-toggle').addEventListener('change', function() {
    this.dataset.userSet = true;
    updateFlashcards();
});

getElement('limit-cards-toggle').addEventListener('change', function() {
    let card = getCardType()
    console.log(card)
    if (getCardType() != ('studyMode')) {
        updateFlashcards();
    }
})

darkModeToggle.addEventListener('change', function() {
    this.dataset.userSet = true;
    toggleDarkMode(this.checked);
});
