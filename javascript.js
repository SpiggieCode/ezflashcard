// Function to get URL parameters
function getUrlParameters() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const params = {};
    for (const [key, value] of urlParams.entries()) {
        params[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\\n/g, '\n'));
    }
    return params;
}

// Function to set toggles based on URL parameters
function setToggleState(params, toggleElement, paramName) {
    if (params[paramName] === 'true' && !toggleElement.dataset.userSet) {
        toggleElement.checked = true;
    }
}

// Function to handle flashcard input
function handleFlashcardInput(event, flashcard, answer, removeCorrectToggle) {
    const input = event.target;
    if (event.key === 'Enter') {
        if (input.value.trim().toLowerCase() === answer.trim().toLowerCase()) {
            flashcard.classList.add('flip');
            setTimeout(() => {
                flashcard.classList.add('correct');
                flashcard.querySelector('.back').innerHTML = `<div>${answer.replace(/\n/g, '<br>')}</div>`;
                flashcard.dataset.showingAnswer = 'true';
                if (removeCorrectToggle.checked) {
                    setTimeout(() => {
                        flashcard.remove();
                    }, 1000);
                }
            }, 600); // Wait for the flip animation to complete
        } else {
            flashcard.classList.add('flip');
            setTimeout(() => {
                flashcard.classList.add('incorrect');
                flashcard.querySelector('.back').innerHTML = `<div>${answer.replace(/\n/g, '<br>')}</div>`;
                flashcard.dataset.showingAnswer = 'true';
            }, 600); // Wait for the flip animation to complete
        }
        flashcard.dataset.attempted = 'true';
    }
}


// Function to create a flashcard element
function createFlashcardElement(question, answer, cardType, removeCorrectToggle) {
    const flashcard = document.createElement('div');
    flashcard.className = 'flashcard';
    flashcard.dataset.question = question;
    flashcard.dataset.answer = answer;
    flashcard.dataset.showingAnswer = 'false';
    flashcard.dataset.attempted = 'false';

    const front = document.createElement('div');
    front.className = 'front';
    const questionDiv = document.createElement('div');
    questionDiv.innerHTML = question.replace(/\n/g, '<br>');
    front.appendChild(questionDiv);

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

        flashcard.onclick = () => {
            if (flashcard.dataset.showingAnswer === 'true') {
                flashcard.classList.remove('correct', 'incorrect');
                flashcard.classList.remove('flip');
                setTimeout(() => {
                    front.innerHTML = '';
                    front.appendChild(questionDiv);
                    front.appendChild(input);
                    input.value = '';
                    flashcard.dataset.showingAnswer = 'false';
                    flashcard.dataset.attempted = 'false';
                }, 600); // Wait for the flip animation to complete
            } else if (flashcard.dataset.attempted === 'true' || cardType === 'clickReveal') {
                flashcard.classList.add('flip');
                setTimeout(() => {
                    back.innerHTML = answer.replace(/\n/g, '<br>');
                    flashcard.classList.add(flashcard.classList.contains('incorrect') ? 'incorrect' : 'correct');
                    flashcard.dataset.showingAnswer = 'true';
                }, 600); // Wait for the flip animation to complete
            }
        };
    } else if (cardType === 'clickReveal') {
        flashcard.onclick = () => {
            if (flashcard.dataset.showingAnswer === 'true') {
                flashcard.classList.remove('correct', 'incorrect');
                flashcard.classList.remove('flip');
                setTimeout(() => {
                    front.innerHTML = question.replace(/\n/g, '<br>');
                    flashcard.dataset.showingAnswer = 'false';
                    flashcard.dataset.attempted = 'false';
                }, 600); // Wait for the flip animation to complete
            } else {
                flashcard.classList.add('flip');
                setTimeout(() => {
                    back.innerHTML = answer.replace(/\n/g, '<br>');
                    flashcard.classList.add('correct');
                    flashcard.dataset.showingAnswer = 'true';
                    if (removeCorrectToggle.checked) {
                        setTimeout(() => {
                            flashcard.remove();
                        }, 1000);
                    }
                }, 600); // Wait for the flip animation to complete
            }
        };
    }

    return flashcard;
}

// Function to determine the card type
function getCardType(mixedCardsEnabled) {
    const clickRevealToggle = document.getElementById('click-reveal-toggle');
    const textInputToggle = document.getElementById('text-input-toggle');
    if (mixedCardsEnabled) {
        return Math.random() < 0.5 ? 'textInput' : 'clickReveal';
    } else if (textInputToggle.checked) {
        return 'textInput';
    } else {
        return 'clickReveal';
    }
}

// Function to create flashcards
function createFlashcards() {
    const params = getUrlParameters();
    const container = document.getElementById('flashcards-container');
    const messageDiv = document.getElementById('message');
    const removeCorrectToggle = document.getElementById('remove-correct-toggle');
    const mixedCardToggle = document.getElementById('mixed-card-toggle');

    setToggleState(params, document.getElementById('click-reveal-toggle'), 'clickreveal');
    setToggleState(params, document.getElementById('text-input-toggle'), 'textinput');
    setToggleState(params, removeCorrectToggle, 'removecorrect');
    setToggleState(params, mixedCardToggle, 'mixedcards');

    if (Object.keys(params).length === 0) {
        messageDiv.style.display = 'block';
        return;
    } else {
        messageDiv.style.display = 'none';
    }

    container.innerHTML = '';

    const keys = Object.keys(params).filter(key => key !== 'clickreveal' && key !== 'textinput' && key !== 'removecorrect' && key !== 'mixedcards' && key !== 'hidemenu');
    keys.sort(() => Math.random() - 0.5); // Shuffle keys

    const mixedCardsEnabled = mixedCardToggle.checked;

    keys.forEach(key => {
        const question = key.replace(/\\n/g, '\n');
        const answer = params[key];
        const cardType = getCardType(mixedCardsEnabled);
        const flashcard = createFlashcardElement(question, answer, cardType, removeCorrectToggle);
        container.appendChild(flashcard);
    });

    // Handle hidemenu parameter
    const menuButton = document.getElementById('menu-button');
    if (params.hidemenu === 'true') {
        menuButton.style.display = 'none';
    }
}

// Function to shuffle flashcards
function shuffleFlashcards() {
    const container = document.getElementById('flashcards-container');
    const flashcards = Array.from(container.children);
    flashcards.sort(() => Math.random() - 0.5); // Shuffle flashcards
    flashcards.forEach(flashcard => container.appendChild(flashcard)); // Re-append shuffled flashcards
}

// Function to update existing flashcards based on toggles
function updateFlashcards() {
    const container = document.getElementById('flashcards-container');
    const flashcards = Array.from(container.children);
    const removeCorrectToggle = document.getElementById('remove-correct-toggle');
    const mixedCardToggle = document.getElementById('mixed-card-toggle');
    const mixedCardsEnabled = mixedCardToggle.checked;

    flashcards.forEach(flashcard => {
        const key = flashcard.dataset.question;
        const answer = flashcard.dataset.answer;
        const cardType = getCardType(mixedCardsEnabled);

        flashcard.innerHTML = ''; // Clear current content

        const front = document.createElement('div');
        front.className = 'front';
        const questionDiv = document.createElement('div');
        questionDiv.innerHTML = key.replace(/\n/g, '<br>');
        front.appendChild(questionDiv);

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

            flashcard.onclick = () => {
                if (flashcard.dataset.showingAnswer === 'true') {
                    flashcard.classList.remove('correct', 'incorrect');
                    flashcard.classList.remove('flip');
                    setTimeout(() => {
                        front.innerHTML = '';
                        front.appendChild(questionDiv);
                        front.appendChild(input);
                        input.value = '';
                        flashcard.dataset.showingAnswer = 'false';
                        flashcard.dataset.attempted = 'false';
                    }, 600); // Wait for the flip animation to complete
                } else if (flashcard.dataset.attempted === 'true' || cardType === 'clickReveal') {
                    flashcard.classList.add('flip');
                    setTimeout(() => {
                        back.innerHTML = answer.replace(/\n/g, '<br>');
                        flashcard.classList.add(flashcard.classList.contains('incorrect') ? 'incorrect' : 'correct');
                        flashcard.dataset.showingAnswer = 'true';
                    }, 600); // Wait for the flip animation to complete
                }
            };
        } else if (cardType === 'clickReveal') {
            flashcard.onclick = () => {
                if (flashcard.dataset.showingAnswer === 'true') {
                    flashcard.classList.remove('correct', 'incorrect');
                    flashcard.classList.remove('flip');
                    setTimeout(() => {
                        front.innerHTML = key.replace(/\n/g, '<br>');
                        flashcard.dataset.showingAnswer = 'false';
                        flashcard.dataset.attempted = 'false';
                    }, 600); // Wait for the flip animation to complete
                } else {
                    flashcard.classList.add('flip');
                    setTimeout(() => {
                        back.innerHTML = answer.replace(/\n/g, '<br>');
                        flashcard.classList.add('correct');
                        flashcard.dataset.showingAnswer = 'true';
                        if (removeCorrectToggle.checked) {
                            setTimeout(() => {
                                flashcard.remove();
                            }, 1000);
                        }
                    }, 600); // Wait for the flip animation to complete
                }
            };
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

// Add event listeners
document.getElementById('menu-button').addEventListener('click', toggleMenu);
document.getElementById('shuffle-button').addEventListener('click', shuffleFlashcards);
document.querySelectorAll('input[name="card-type"]').forEach(toggle => {
    toggle.addEventListener('change', function() {
        this.dataset.userSet = true;
        updateFlashcards();
    });
});
document.getElementById('remove-correct-toggle').addEventListener('change', function() {
    this.dataset.userSet = true;
    updateFlashcards();
});
document.getElementById('mixed-card-toggle').addEventListener('change', function() {
    this.dataset.userSet = true;
    updateFlashcards();
});
