// Supabase configuration
const SUPABASE_URL = 'https://qcamsqmfypghqzskwavb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjYW1zcW1meXBnaHF6c2t3YXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzY1OTksImV4cCI6MjA3MzYxMjU5OX0.OSrCH-cHqiuj8Ef0hTrGPkg8KS9QyngGERuGrj73wak';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM elements
const form = document.getElementById('submissionForm');
const successMessage = document.getElementById('successMessage');
const submitBtn = form.querySelector('.submit-btn');
const btnText = submitBtn.querySelector('.btn-text');

// Form submission handler
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(form);
    const userName = formData.get('userName').trim();
    const submissionData = {
        one_liner: formData.get('oneLiner').trim(),
        user_name: userName,
        position: formData.get('position').trim(),
        brand: formData.get('brand').trim(),
        created_at: new Date().toISOString()
    };
    
    // Set current player for game control
    gameState.currentPlayer = userName;
    
    // Validate form data
    if (!submissionData.one_liner || !submissionData.user_name || 
        !submissionData.position || !submissionData.brand) {
        showError('Please fill in all fields!');
        return;
    }
    
    // Check for duplicate names (case-insensitive)
    const isDuplicateName = await checkForDuplicateName(userName);
    if (isDuplicateName) {
        showError(`The name "${userName}" is already taken! Please choose a different name.`);
        return;
    }
    
    // Show loading state
    setLoadingState(true);
    
    try {
        // Insert data into Supabase
        const { data, error } = await supabase
            .from('user_submissions')
            .insert([submissionData])
            .select();
        
        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }
        
        // Show success message
        showSuccess();
        
        // Hide form and show success message
        form.style.display = 'none';
        successMessage.classList.remove('hidden');
        
        // Redirect to game area after 3 seconds
        setTimeout(() => {
            // For now, we'll just show a message since the game area isn't built yet
            showGameRedirect();
        }, 3000);
        
    } catch (error) {
        console.error('Submission error:', error);
        showError('Oops! Something went wrong. Please try again.');
        setLoadingState(false);
    }
});

// Set loading state for submit button
function setLoadingState(isLoading) {
    if (isLoading) {
        submitBtn.disabled = true;
        btnText.textContent = 'Submitting...';
        submitBtn.style.opacity = '0.7';
    } else {
        submitBtn.disabled = false;
        btnText.textContent = 'Submit & Play!';
        submitBtn.style.opacity = '1';
    }
}

// Show success message
function showSuccess() {
    // Add some confetti effect (simple version)
    createConfetti();
}

// Show error message
function showError(message) {
    // Create a temporary error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #ff6b6b;
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        font-weight: 700;
        z-index: 1000;
        animation: slideDown 0.3s ease-out;
    `;
    
    document.body.appendChild(errorDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

// Show game redirect message
function showGameRedirect() {
    const redirectDiv = document.createElement('div');
    redirectDiv.className = 'redirect-message';
    redirectDiv.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <h3 style="color: #4ecdc4; margin-bottom: 10px;">🎮 Game Area Coming Soon!</h3>
            <p style="color: #666;">The game area is being developed. Stay tuned!</p>
        </div>
    `;
    
    successMessage.appendChild(redirectDiv);
}

// Simple confetti effect
function createConfetti() {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                width: 10px;
                height: 10px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                top: -10px;
                left: ${Math.random() * 100}vw;
                z-index: 1000;
                animation: confettiFall 3s linear forwards;
                border-radius: 50%;
            `;
            
            document.body.appendChild(confetti);
            
            setTimeout(() => {
                confetti.remove();
            }, 3000);
        }, i * 50);
    }
}

// Add confetti animation CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }
    
    @keyframes confettiFall {
        0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Game state
let gameState = {
    participants: [],
    currentQuote: null,
    currentRound: 0,
    correctAnswers: 0,
    totalAnswers: 0,
    gameStarted: false,
    currentPlayer: null
};

// Authorized game controllers
const authorizedControllers = ['Jose', 'Joe', 'Jose Tabbada'];

// DOM elements for game area
const gameArea = document.getElementById('gameArea');
const participantsList = document.getElementById('participantsList');
const startGameBtn = document.getElementById('startGame');
const gameQuestion = document.getElementById('gameQuestion');
const currentQuote = document.getElementById('currentQuote');
const nameChoices = document.getElementById('nameChoices');
const gameResult = document.getElementById('gameResult');
const resultTitle = document.getElementById('resultTitle');
const resultMessage = document.getElementById('resultMessage');
const nextRoundBtn = document.getElementById('nextRound');
const backToInputBtn = document.getElementById('backToInput');
const currentPlayerName = document.getElementById('currentPlayerName');
const gameControlStatus = document.getElementById('gameControlStatus');
const gameControlMessage = document.getElementById('gameControlMessage');

// Stats elements
const currentRoundEl = document.getElementById('currentRound');
const correctAnswersEl = document.getElementById('correctAnswers');
const totalAnswersEl = document.getElementById('totalAnswers');

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    console.log('Who Said It? game initialized!');
    
    // Add some interactive effects to form inputs
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.style.transform = 'scale(1.02)';
        });
        
        input.addEventListener('blur', () => {
            input.parentElement.style.transform = 'scale(1)';
        });
    });
    
    // Add real-time name validation
    const nameInput = document.getElementById('userName');
    let nameValidationTimeout;
    
    nameInput.addEventListener('input', () => {
        clearTimeout(nameValidationTimeout);
        const name = nameInput.value.trim();
        
        if (name.length > 0) {
            nameValidationTimeout = setTimeout(async () => {
                const isDuplicate = await checkForDuplicateName(name);
                updateNameValidation(nameInput, isDuplicate);
            }, 500); // Wait 500ms after user stops typing
        } else {
            clearNameValidation(nameInput);
        }
    });
    
    // Load participants when game area is shown
    loadParticipants();
    
    // Game event listeners
    startGameBtn.addEventListener('click', startNewRound);
    nextRoundBtn.addEventListener('click', startNewRound);
    backToInputBtn.addEventListener('click', goBackToInput);
});

// Load participants from database
async function loadParticipants() {
    try {
        const { data, error } = await supabase
            .from('user_submissions')
            .select('user_name')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error loading participants:', error);
            return;
        }
        
        // Get unique participants
        const uniqueParticipants = [...new Set(data.map(item => item.user_name))];
        gameState.participants = uniqueParticipants;
        
        displayParticipants(uniqueParticipants);
    } catch (error) {
        console.error('Error loading participants:', error);
    }
}

// Display participants in colorful bubbles
function displayParticipants(participants) {
    participantsList.innerHTML = '';
    
    participants.forEach((participant, index) => {
        const bubble = document.createElement('div');
        bubble.className = 'participant-bubble';
        bubble.textContent = participant;
        bubble.style.animationDelay = `${index * 0.1}s`;
        participantsList.appendChild(bubble);
    });
}

// Start a new game round
async function startNewRound() {
    try {
        // Get a random quote from the database
        const { data, error } = await supabase
            .from('user_submissions')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error loading quotes:', error);
            showError('Failed to load quotes. Please try again.');
            return;
        }
        
        if (data.length === 0) {
            showError('No quotes available yet. Submit some quotes first!');
            return;
        }
        
        // Select a random quote
        const randomIndex = Math.floor(Math.random() * data.length);
        gameState.currentQuote = data[randomIndex];
        
        // Update game state
        gameState.currentRound++;
        gameState.gameStarted = true;
        
        // Display the quote and choices
        displayQuoteAndChoices();
        
        // Update stats
        updateStats();
        
        // Hide start button and show game question
        startGameBtn.style.display = 'none';
        gameQuestion.classList.remove('hidden');
        gameResult.classList.add('hidden');
        
    } catch (error) {
        console.error('Error starting new round:', error);
        showError('Failed to start new round. Please try again.');
    }
}

// Display quote and name choices
function displayQuoteAndChoices() {
    // Display the quote
    currentQuote.textContent = `"${gameState.currentQuote.one_liner}"`;
    
    // Create 4 name choices (1 correct + 3 random)
    const correctName = gameState.currentQuote.user_name;
    const otherParticipants = gameState.participants.filter(name => name !== correctName);
    
    // Shuffle and pick 3 random names
    const shuffledOthers = otherParticipants.sort(() => 0.5 - Math.random());
    const randomNames = shuffledOthers.slice(0, 3);
    
    // Combine correct name with random names and shuffle
    const allChoices = [correctName, ...randomNames].sort(() => 0.5 - Math.random());
    
    // Display choices
    nameChoices.innerHTML = '';
    allChoices.forEach((name, index) => {
        const choice = document.createElement('div');
        choice.className = 'name-choice';
        choice.textContent = name;
        choice.dataset.name = name;
        choice.addEventListener('click', () => selectChoice(choice, name));
        nameChoices.appendChild(choice);
    });
}

// Handle choice selection
function selectChoice(choiceElement, selectedName) {
    // Disable all choices
    const allChoices = document.querySelectorAll('.name-choice');
    allChoices.forEach(choice => {
        choice.style.pointerEvents = 'none';
        choice.classList.remove('selected');
    });
    
    // Mark selected choice
    choiceElement.classList.add('selected');
    
    // Check if correct
    const isCorrect = selectedName === gameState.currentQuote.user_name;
    
    // Update stats
    gameState.totalAnswers++;
    if (isCorrect) {
        gameState.correctAnswers++;
    }
    
    // Show result
    setTimeout(() => {
        showGameResult(isCorrect, selectedName);
    }, 500);
}

// Show game result
function showGameResult(isCorrect, selectedName) {
    const allChoices = document.querySelectorAll('.name-choice');
    
    // Mark correct and incorrect choices
    allChoices.forEach(choice => {
        const name = choice.dataset.name;
        if (name === gameState.currentQuote.user_name) {
            choice.classList.add('correct');
        } else if (name === selectedName && !isCorrect) {
            choice.classList.add('incorrect');
        }
    });
    
    // Show result message
    if (isCorrect) {
        resultTitle.textContent = '🎉 Correct!';
        resultTitle.style.color = '#4ecdc4';
        resultMessage.textContent = `Great job! ${gameState.currentQuote.user_name} said that quote.`;
    } else {
        resultTitle.textContent = '😅 Not quite!';
        resultTitle.style.color = '#ff6b6b';
        resultMessage.textContent = `Actually, ${gameState.currentQuote.user_name} said that quote.`;
    }
    
    // Show result panel
    gameResult.classList.remove('hidden');
    
    // Update stats
    updateStats();
    
    // Create confetti for correct answers
    if (isCorrect) {
        createConfetti();
    }
}

// Update game statistics
function updateStats() {
    currentRoundEl.textContent = gameState.currentRound;
    correctAnswersEl.textContent = gameState.correctAnswers;
    totalAnswersEl.textContent = gameState.totalAnswers;
}

// Go back to input screen
function goBackToInput() {
    // Hide game area
    gameArea.classList.add('hidden');
    
    // Show input screen
    const inputScreen = document.querySelector('.container');
    inputScreen.style.display = 'block';
    
    // Reset form
    form.reset();
    form.style.display = 'block';
    successMessage.classList.add('hidden');
    
    // Reset game state
    gameState.currentRound = 0;
    gameState.correctAnswers = 0;
    gameState.totalAnswers = 0;
    gameState.gameStarted = false;
    gameState.currentPlayer = null;
    
    // Reset UI
    startGameBtn.style.display = 'block';
    gameQuestion.classList.add('hidden');
    gameResult.classList.add('hidden');
    
    // Clear choices
    nameChoices.innerHTML = '';
    
    // Update stats
    updateStats();
}

// Check if current player is authorized to control the game
function isAuthorizedPlayer(playerName) {
    return authorizedControllers.includes(playerName);
}

// Check for duplicate names (case-insensitive)
async function checkForDuplicateName(userName) {
    try {
        const { data, error } = await supabase
            .from('user_submissions')
            .select('user_name')
            .ilike('user_name', userName); // Case-insensitive search
        
        if (error) {
            console.error('Error checking for duplicate names:', error);
            return false; // Allow submission if we can't check
        }
        
        return data && data.length > 0;
    } catch (error) {
        console.error('Error checking for duplicate names:', error);
        return false; // Allow submission if we can't check
    }
}

// Update name validation visual feedback
function updateNameValidation(input, isDuplicate) {
    const formGroup = input.parentElement;
    const existingMessage = formGroup.querySelector('.name-validation-message');
    
    // Remove existing validation message
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Remove existing validation classes
    input.classList.remove('name-valid', 'name-invalid');
    
    if (isDuplicate) {
        // Show duplicate name warning
        input.classList.add('name-invalid');
        const message = document.createElement('div');
        message.className = 'name-validation-message name-invalid-message';
        message.textContent = `⚠️ The name "${input.value}" is already taken!`;
        formGroup.appendChild(message);
    } else {
        // Show name is available
        input.classList.add('name-valid');
        const message = document.createElement('div');
        message.className = 'name-validation-message name-valid-message';
        message.textContent = `✅ The name "${input.value}" is available!`;
        formGroup.appendChild(message);
    }
}

// Clear name validation
function clearNameValidation(input) {
    const formGroup = input.parentElement;
    const existingMessage = formGroup.querySelector('.name-validation-message');
    
    if (existingMessage) {
        existingMessage.remove();
    }
    
    input.classList.remove('name-valid', 'name-invalid');
}

// Update start button visibility based on current player
function updateStartButtonVisibility() {
    if (gameState.currentPlayer && isAuthorizedPlayer(gameState.currentPlayer)) {
        startGameBtn.style.display = 'block';
        startGameBtn.disabled = false;
        gameControlMessage.classList.add('hidden');
    } else {
        startGameBtn.style.display = 'none';
        if (gameState.currentPlayer) {
            gameControlMessage.classList.remove('hidden');
        } else {
            gameControlMessage.classList.add('hidden');
        }
    }
}

// Update current player display and control status
function updateCurrentPlayerDisplay() {
    if (gameState.currentPlayer) {
        currentPlayerName.textContent = gameState.currentPlayer;
        
        if (isAuthorizedPlayer(gameState.currentPlayer)) {
            gameControlStatus.textContent = '🎮';
            gameControlStatus.className = 'control-status authorized';
        } else {
            gameControlStatus.textContent = '🔒';
            gameControlStatus.className = 'control-status unauthorized';
        }
    } else {
        currentPlayerName.textContent = '-';
        gameControlStatus.textContent = '🔒';
        gameControlStatus.className = 'control-status unauthorized';
    }
}

// Enhanced showSuccess function to navigate to game area
function showSuccess() {
    // Add some confetti effect (simple version)
    createConfetti();
    
    // After showing success message, navigate to game area
    setTimeout(() => {
        // Hide input screen
        const inputScreen = document.querySelector('.container');
        inputScreen.style.display = 'none';
        
        // Show game area
        gameArea.classList.remove('hidden');
        
        // Load fresh participants
        loadParticipants();
        
        // Update start button visibility based on current player
        updateStartButtonVisibility();
        
        // Update current player display
        updateCurrentPlayerDisplay();
    }, 2000);
}
