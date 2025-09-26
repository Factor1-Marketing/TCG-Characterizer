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
    currentPlayer: null,
    gameStatus: 'waiting', // waiting, playing, showing_results
    timeRemaining: 0,
    roundStartTime: null,
    playerScores: {},
    hasAnswered: false
};

// Realtime subscriptions
let participantsSubscription = null;
let gameStateSubscription = null;
let playerScoresSubscription = null;
let gameTimer = null;

// Debug system
const debugMessages = [];
const maxDebugMessages = 100;

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
const leaderboardList = document.getElementById('leaderboardList');

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
    startGameBtn.addEventListener('click', (e) => {
        console.log('Start game button clicked!');
        e.preventDefault();
        startNewRound();
    });
    nextRoundBtn.addEventListener('click', (e) => {
        console.log('Next round button clicked!');
        e.preventDefault();
        startNewRound();
    });
    backToInputBtn.addEventListener('click', goBackToInput);
    
    // Debug system setup
    setupDebugSystem();
});

// Set up realtime subscription for new participants
function setupRealtimeSubscription() {
    // Clean up existing subscriptions if any
    if (participantsSubscription) {
        supabase.removeChannel(participantsSubscription);
    }
    if (gameStateSubscription) {
        supabase.removeChannel(gameStateSubscription);
    }
    if (playerScoresSubscription) {
        supabase.removeChannel(playerScoresSubscription);
    }
    
    console.log('Setting up realtime subscriptions...');
    
    // Subscribe to changes in user_submissions table
    participantsSubscription = supabase
        .channel('participants_changes')
        .on('postgres_changes', 
            { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'user_submissions' 
            }, 
            (payload) => {
                console.log('New participant event:', payload);
                handleNewParticipant(payload.new);
            }
        )
        .subscribe();
    
    // Subscribe to game state changes
    gameStateSubscription = supabase
        .channel('game_state_changes')
        .on('postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'game_state'
            },
            (payload) => {
                console.log('Game state changed:', payload);
                handleGameStateChange(payload.new);
            }
        )
        .subscribe();
    
    // Subscribe to player scores
    playerScoresSubscription = supabase
        .channel('player_scores_changes')
        .on('postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'player_scores'
            },
            (payload) => {
                console.log('Player score added:', payload);
                updatePlayerScores();
            }
        )
        .subscribe();
    
    console.log('✅ All realtime subscriptions set up');
}

// Fallback polling method if realtime doesn't work
function setupPollingFallback() {
    console.log('Setting up polling fallback...');
    
    // Poll every 3 seconds for new participants
    const pollInterval = setInterval(async () => {
        try {
            const { data, error } = await supabase
                .from('user_submissions')
                .select('user_name')
                .order('created_at', { ascending: false })
                .limit(1);
            
            if (error) {
                console.error('Polling error:', error);
                return;
            }
            
            if (data && data.length > 0) {
                const latestParticipant = data[0].user_name;
                if (!gameState.participants.includes(latestParticipant)) {
                    console.log('New participant found via polling:', latestParticipant);
                    handleNewParticipant({ user_name: latestParticipant });
                }
            }
        } catch (error) {
            console.error('Polling error:', error);
        }
    }, 3000);
    
    // Store interval ID for cleanup
    gameState.pollingInterval = pollInterval;
}

// Handle new participant being added
function handleNewParticipant(newSubmission) {
    console.log('Handling new participant:', newSubmission);
    const newParticipantName = newSubmission.user_name;
    
    // Check if this is a new participant (not already in our list)
    if (!gameState.participants.includes(newParticipantName)) {
        console.log('Adding new participant:', newParticipantName);
        
        // Add to our participants list
        gameState.participants.push(newParticipantName);
        
        // Add the new participant bubble with animation
        addNewParticipantBubble(newParticipantName);
        
        // Show notification
        showNewParticipantNotification(newParticipantName);
    } else {
        console.log('Participant already exists:', newParticipantName);
    }
}

// Add new participant bubble with animation
function addNewParticipantBubble(participantName) {
    const bubble = document.createElement('div');
    bubble.className = 'participant-bubble new-participant';
    bubble.textContent = participantName;
    
    // Add to the list
    participantsList.appendChild(bubble);
    
    // Trigger animation
    setTimeout(() => {
        bubble.classList.remove('new-participant');
    }, 100);
}

// Show notification for new participant
function showNewParticipantNotification(participantName) {
    const notification = document.createElement('div');
    notification.className = 'new-participant-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-emoji">🎉</span>
            <span class="notification-text">${participantName} joined the game!</span>
        </div>
    `;
    
    // Add to game area
    gameArea.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

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

// Load current game state from database
async function loadCurrentGameState() {
    try {
        const { data, error } = await supabase
            .from('game_state')
            .select('*')
            .eq('id', 1)
            .single();
        
        if (error && error.code !== 'PGRST116') {
            console.error('Error loading game state:', error);
            return;
        }
        
        if (data) {
            console.log('Loaded current game state:', data);
            
            // Update local game state
            gameState.gameStatus = data.game_status;
            gameState.currentRound = data.current_round;
            gameState.timeRemaining = data.time_remaining;
            
            // Handle current game state
            if (data.game_status === 'playing' && data.current_quote_id) {
                // Game is currently in progress, join the round
                await startRoundForAllPlayers(data.current_quote_id);
            } else if (data.game_status === 'showing_results') {
                // Game is showing results
                showResultsForAllPlayers();
            } else {
                // Game is waiting
                showWaitingState();
            }
        } else {
            console.log('No game state found, starting fresh');
            showWaitingState();
        }
        
    } catch (error) {
        console.error('Error loading game state:', error);
        showWaitingState();
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

// Start a new game round (only for authorized players)
async function startNewRound() {
    console.log('Start game button clicked!');
    console.log('Current player:', gameState.currentPlayer);
    console.log('Is authorized:', isAuthorizedPlayer(gameState.currentPlayer));
    
    if (!isAuthorizedPlayer(gameState.currentPlayer)) {
        console.log('Unauthorized player tried to start game');
        showError('Only authorized players can start the game!');
        return;
    }
    
    try {
        console.log('Starting new round...');
        
        // Get current game state to check used quotes
        console.log('Loading current game state...');
        const { data: gameStateData, error: gameStateError } = await supabase
            .from('game_state')
            .select('used_quotes')
            .eq('id', 1)
            .single();
        
        if (gameStateError && gameStateError.code !== 'PGRST116') {
            console.error('Error loading game state:', gameStateError);
            showError('Failed to load game state. Please try again.');
            return;
        }
        
        console.log('Game state data:', gameStateData);
        
        // Parse used quotes (default to empty array if none)
        const usedQuotes = gameStateData ? JSON.parse(gameStateData.used_quotes || '[]') : [];
        console.log('Used quotes:', usedQuotes);
        
        // Get all quotes from the database
        const { data: allQuotes, error } = await supabase
            .from('user_submissions')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error loading quotes:', error);
            showError('Failed to load quotes. Please try again.');
            return;
        }
        
        if (allQuotes.length === 0) {
            showError('No quotes available yet. Submit some quotes first!');
            return;
        }
        
        // Filter out used quotes
        const availableQuotes = allQuotes.filter(quote => !usedQuotes.includes(quote.id));
        console.log('Available quotes:', availableQuotes.length);
        
        // Check if we've used all quotes
        if (availableQuotes.length === 0) {
            showError('🎉 All quotes have been used! The game is complete!');
            return;
        }
        
        // Select a random quote from available quotes
        const randomIndex = Math.floor(Math.random() * availableQuotes.length);
        const selectedQuote = availableQuotes[randomIndex];
        
        // Add this quote to used quotes
        const newUsedQuotes = [...usedQuotes, selectedQuote.id];
        
        // Update game state in database
        const { error: updateError } = await supabase
            .from('game_state')
            .upsert({
                id: 1,
                current_round: gameState.currentRound + 1,
                game_status: 'playing',
                current_quote_id: selectedQuote.id,
                time_remaining: 10,
                round_start_time: new Date().toISOString(),
                used_quotes: JSON.stringify(newUsedQuotes)
            });
        
        if (updateError) {
            console.error('Error updating game state:', updateError);
            return;
        }
        
        console.log('Game state updated in database with quote:', selectedQuote.id);
        
    } catch (error) {
        console.error('Error starting new round:', error);
        showError('Failed to start new round. Please try again.');
    }
}

// Handle game state changes from database
async function handleGameStateChange(newGameState) {
    console.log('Handling game state change:', newGameState);
    
    gameState.gameStatus = newGameState.game_status;
    gameState.currentRound = newGameState.current_round;
    gameState.timeRemaining = newGameState.time_remaining;
    gameState.hasAnswered = false;
    
    if (newGameState.game_status === 'playing') {
        // Start the round for all players
        await startRoundForAllPlayers(newGameState.current_quote_id);
    } else if (newGameState.game_status === 'showing_results') {
        // Show results for all players
        showResultsForAllPlayers();
    } else if (newGameState.game_status === 'waiting') {
        // Return to waiting state
        showWaitingState();
    }
}

// Start round for all players
async function startRoundForAllPlayers(quoteId) {
    try {
        // Get the quote data
        const { data: quoteData, error } = await supabase
            .from('user_submissions')
            .select('*')
            .eq('id', quoteId)
            .single();
        
        if (error) {
            console.error('Error loading quote:', error);
            return;
        }
        
        gameState.currentQuote = quoteData;
        
        // Show game question for all players
        startGameBtn.style.display = 'none';
        gameQuestion.classList.remove('hidden');
        gameResult.classList.add('hidden');
        
        // Display the quote and choices
        displayQuoteAndChoices();
        
        // Start the 10-second timer
        startGameTimer();
        
        console.log('Round started for all players');
        
    } catch (error) {
        console.error('Error starting round:', error);
    }
}

// Start the game timer
function startGameTimer() {
    if (gameTimer) {
        clearInterval(gameTimer);
    }
    
    gameState.timeRemaining = 10;
    updateTimerDisplay();
    
    gameTimer = setInterval(() => {
        gameState.timeRemaining--;
        updateTimerDisplay();
        
        if (gameState.timeRemaining <= 0) {
            clearInterval(gameTimer);
            revealAnswers();
            endRound();
        }
    }, 1000);
}

// Update timer display
function updateTimerDisplay() {
    const timerElement = document.getElementById('gameTimer');
    if (timerElement) {
        timerElement.textContent = gameState.timeRemaining;
        
        // Change color as time runs out
        if (gameState.timeRemaining <= 3) {
            timerElement.style.color = '#ff6b6b';
            timerElement.style.animation = 'pulse 0.5s infinite';
        } else if (gameState.timeRemaining <= 5) {
            timerElement.style.color = '#feca57';
        } else {
            timerElement.style.color = '#4ecdc4';
            timerElement.style.animation = 'none';
        }
    }
}

// Reveal answers when timer reaches 0
function revealAnswers() {
    console.log('Revealing answers...');
    
    // Remove the answer indicator
    const answerIndicator = document.getElementById('answerIndicator');
    if (answerIndicator) {
        answerIndicator.remove();
    }
    
    const allChoices = document.querySelectorAll('.name-choice');
    
    // Mark the correct answer
    allChoices.forEach(choice => {
        const name = choice.dataset.name;
        if (name === gameState.currentQuote.user_name) {
            choice.classList.add('correct');
        }
    });
    
    // If player has answered, show their result
    if (gameState.hasAnswered) {
        const selectedChoice = document.querySelector('.name-choice.selected');
        if (selectedChoice) {
            const selectedName = selectedChoice.dataset.name;
            const isCorrect = selectedName === gameState.currentQuote.user_name;
            
            if (!isCorrect) {
                selectedChoice.classList.add('incorrect');
            }
            
            // Update the result message
            if (isCorrect) {
                resultTitle.textContent = '🎉 Correct!';
                resultTitle.style.color = '#4ecdc4';
                resultMessage.textContent = `Great job! You got it right!`;
                createConfetti();
            } else {
                resultTitle.textContent = '😅 Not quite!';
                resultTitle.style.color = '#ff6b6b';
                resultMessage.textContent = `The correct answer was ${gameState.currentQuote.user_name} (${gameState.currentQuote.position} at ${gameState.currentQuote.brand}).`;
            }
        }
    } else {
        // Player didn't answer in time
        resultTitle.textContent = '⏰ Time\'s Up!';
        resultTitle.style.color = '#ff6b6b';
        resultMessage.textContent = `The correct answer was ${gameState.currentQuote.user_name} (${gameState.currentQuote.position} at ${gameState.currentQuote.brand}).`;
    }
    
    // NOW show the result panel
    gameResult.classList.remove('hidden');
}

// End the round (called when timer expires)
async function endRound() {
    console.log('Round ended');
    
    // Update game state to show results
    const { error } = await supabase
        .from('game_state')
        .upsert({
            id: 1,
            game_status: 'showing_results'
        });
    
    if (error) {
        console.error('Error updating game state to results:', error);
    }
}

// Show results for all players
function showResultsForAllPlayers() {
    console.log('Showing results for all players');
    
    // Disable all choices
    const allChoices = document.querySelectorAll('.name-choice');
    allChoices.forEach(choice => {
        choice.style.pointerEvents = 'none';
    });
    
    // Show result panel
    gameResult.classList.remove('hidden');
    
    // Update next round button visibility (only for authorized players)
    if (isAuthorizedPlayer(gameState.currentPlayer)) {
        nextRoundBtn.style.display = 'block';
    } else {
        nextRoundBtn.style.display = 'none';
    }
    
    // Clear timer
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
}

// Show waiting state for all players
function showWaitingState() {
    console.log('Showing waiting state for all players');
    
    // Hide game question and results
    gameQuestion.classList.add('hidden');
    gameResult.classList.add('hidden');
    
    // Show start button only for authorized players
    if (isAuthorizedPlayer(gameState.currentPlayer)) {
        startGameBtn.style.display = 'block';
    } else {
        startGameBtn.style.display = 'none';
    }
    
    // Clear timer
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
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
async function selectChoice(choiceElement, selectedName) {
    if (gameState.hasAnswered) {
        return; // Prevent multiple answers
    }
    
    gameState.hasAnswered = true;
    
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
    const responseTime = 10 - gameState.timeRemaining; // Time taken to respond
    
    // Save player score to database
    try {
        const { error } = await supabase
            .from('player_scores')
            .insert({
                player_name: gameState.currentPlayer,
                round_number: gameState.currentRound,
                selected_answer: selectedName,
                correct_answer: gameState.currentQuote.user_name,
                is_correct: isCorrect,
                response_time: responseTime
            });
        
        if (error) {
            console.error('Error saving player score:', error);
        } else {
            console.log('Player score saved:', {
                player: gameState.currentPlayer,
                correct: isCorrect,
                responseTime: responseTime
            });
        }
    } catch (error) {
        console.error('Error saving score:', error);
    }
    
    // Update local stats
    gameState.totalAnswers++;
    if (isCorrect) {
        gameState.correctAnswers++;
    }
    
    // Show that the player has answered, but don't reveal the answer yet
    showAnswerSubmitted(selectedName);
}

// Show that player has submitted their answer (but don't reveal the correct answer yet)
function showAnswerSubmitted(selectedName) {
    // Don't show the result panel yet - just show a small indicator
    // The result panel will only be shown when timer reaches 0
    
    // Create a small indicator that the player has answered
    const answerIndicator = document.createElement('div');
    answerIndicator.id = 'answerIndicator';
    answerIndicator.className = 'answer-indicator';
    answerIndicator.innerHTML = `
        <div class="indicator-content">
            <span class="indicator-icon">✅</span>
            <span class="indicator-text">Answer submitted: "${selectedName}"</span>
        </div>
    `;
    
    // Add to the choices container
    const choicesContainer = document.querySelector('.choices-container');
    choicesContainer.appendChild(answerIndicator);
    
    // Update stats
    updateStats();
}

// Show immediate feedback when player answers (called when timer expires)
function showImmediateFeedback(isCorrect, selectedName) {
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
    
    // Show immediate feedback message
    if (isCorrect) {
        resultTitle.textContent = '🎉 Correct!';
        resultTitle.style.color = '#4ecdc4';
        resultMessage.textContent = `Great job! You got it right!`;
        createConfetti();
    } else {
        resultTitle.textContent = '😅 Not quite!';
        resultTitle.style.color = '#ff6b6b';
        resultMessage.textContent = `The correct answer was ${gameState.currentQuote.user_name}.`;
    }
    
    // Show result panel
    gameResult.classList.remove('hidden');
    
    // Update stats
    updateStats();
}

// Show game result (called when round ends)
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
        resultMessage.textContent = `Great job! ${gameState.currentQuote.user_name} (${gameState.currentQuote.position} at ${gameState.currentQuote.brand}) said that quote.`;
    } else {
        resultTitle.textContent = '😅 Not quite!';
        resultTitle.style.color = '#ff6b6b';
        resultMessage.textContent = `Actually, ${gameState.currentQuote.user_name} (${gameState.currentQuote.position} at ${gameState.currentQuote.brand}) said that quote.`;
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

// Update player scores from database
async function updatePlayerScores() {
    try {
        const { data, error } = await supabase
            .from('player_scores')
            .select('*')
            .eq('player_name', gameState.currentPlayer)
            .order('round_number', { ascending: true });
        
        if (error) {
            console.error('Error loading player scores:', error);
            return;
        }
        
        // Update local stats
        gameState.correctAnswers = data.filter(score => score.is_correct).length;
        gameState.totalAnswers = data.length;
        
        // Update display
        updateStats();
        
        // Update leaderboard
        loadLeaderboard();
        
    } catch (error) {
        console.error('Error updating player scores:', error);
    }
}

// Load and display leaderboard
async function loadLeaderboard() {
    try {
        console.log('Loading leaderboard...');
        
        // Get all player scores grouped by player
        const { data, error } = await supabase
            .from('player_scores')
            .select('player_name, is_correct');
        
        if (error) {
            console.error('Error loading leaderboard:', error);
            return;
        }
        
        // Calculate scores for each player
        const playerScores = {};
        data.forEach(score => {
            if (!playerScores[score.player_name]) {
                playerScores[score.player_name] = {
                    name: score.player_name,
                    correct: 0,
                    total: 0
                };
            }
            playerScores[score.player_name].total++;
            if (score.is_correct) {
                playerScores[score.player_name].correct++;
            }
        });
        
        // Convert to array and sort by correct answers (descending)
        const leaderboardData = Object.values(playerScores)
            .sort((a, b) => {
                // Sort by correct answers first, then by total answers
                if (b.correct !== a.correct) {
                    return b.correct - a.correct;
                }
                return b.total - a.total;
            });
        
        console.log('Leaderboard data:', leaderboardData);
        
        // Display leaderboard
        displayLeaderboard(leaderboardData);
        
    } catch (error) {
        console.error('Error loading leaderboard:', error);
    }
}

// Display leaderboard
function displayLeaderboard(leaderboardData) {
    if (!leaderboardList) return;
    
    leaderboardList.innerHTML = '';
    
    if (leaderboardData.length === 0) {
        leaderboardList.innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">No scores yet. Play some rounds to see the leaderboard!</p>';
        return;
    }
    
    leaderboardData.forEach((player, index) => {
        const rank = index + 1;
        const percentage = player.total > 0 ? Math.round((player.correct / player.total) * 100) : 0;
        
        const entry = document.createElement('div');
        entry.className = `leaderboard-entry rank-${rank <= 3 ? rank : 'other'}`;
        
        entry.innerHTML = `
            <div class="leaderboard-rank rank-${rank <= 3 ? rank : 'other'}">${rank}</div>
            <div class="leaderboard-player">
                <div class="leaderboard-name">${player.name}</div>
                <div class="leaderboard-stats">${player.total} questions answered</div>
            </div>
            <div class="leaderboard-score">
                <div class="leaderboard-correct">${player.correct}</div>
                <div class="leaderboard-total">/ ${player.total}</div>
                <div class="leaderboard-percentage">${percentage}%</div>
            </div>
        `;
        
        leaderboardList.appendChild(entry);
    });
}

// Reset used quotes (for starting a fresh game)
async function resetUsedQuotes() {
    try {
        const { error } = await supabase
            .from('game_state')
            .upsert({
                id: 1,
                used_quotes: '[]'
            });
        
        if (error) {
            console.error('Error resetting used quotes:', error);
        } else {
            console.log('Used quotes reset for new game');
        }
    } catch (error) {
        console.error('Error resetting used quotes:', error);
    }
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
    
    // Reset used quotes for a fresh game
    resetUsedQuotes();
    
    // Clean up realtime subscriptions
    if (participantsSubscription) {
        supabase.removeChannel(participantsSubscription);
        participantsSubscription = null;
    }
    if (gameStateSubscription) {
        supabase.removeChannel(gameStateSubscription);
        gameStateSubscription = null;
    }
    if (playerScoresSubscription) {
        supabase.removeChannel(playerScoresSubscription);
        playerScoresSubscription = null;
    }
    
    // Clean up polling interval if it exists
    if (gameState.pollingInterval) {
        clearInterval(gameState.pollingInterval);
        gameState.pollingInterval = null;
    }
    
    // Clean up game timer
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
    
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

// Debug system functions
function setupDebugSystem() {
    const debugScreen = document.getElementById('debugScreen');
    const debugToggle = document.getElementById('debugToggle');
    const clearDebug = document.getElementById('clearDebug');
    const toggleDebug = document.getElementById('toggleDebug');
    
    // Toggle debug screen
    debugToggle.addEventListener('click', () => {
        debugScreen.classList.toggle('hidden');
    });
    
    // Clear debug messages
    clearDebug.addEventListener('click', () => {
        debugMessages.length = 0;
        updateDebugDisplay();
    });
    
    // Hide debug screen
    toggleDebug.addEventListener('click', () => {
        debugScreen.classList.add('hidden');
    });
    
    // Override console.log to capture messages
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.log = function(...args) {
        originalLog.apply(console, args);
        addDebugMessage('info', args.join(' '));
    };
    
    console.error = function(...args) {
        originalError.apply(console, args);
        addDebugMessage('error', args.join(' '));
    };
    
    console.warn = function(...args) {
        originalWarn.apply(console, args);
        addDebugMessage('warning', args.join(' '));
    };
    
    // Add initial debug message
    addDebugMessage('success', 'Debug system initialized!');
    
    // Test database connection
    testDatabaseConnection();
}

function addDebugMessage(type, message) {
    const timestamp = new Date().toLocaleTimeString();
    const debugMessage = {
        type,
        message,
        timestamp
    };
    
    debugMessages.push(debugMessage);
    
    // Keep only the last maxDebugMessages
    if (debugMessages.length > maxDebugMessages) {
        debugMessages.shift();
    }
    
    updateDebugDisplay();
}

function updateDebugDisplay() {
    const debugMessagesEl = document.getElementById('debugMessages');
    if (!debugMessagesEl) return;
    
    debugMessagesEl.innerHTML = '';
    
    debugMessages.forEach(msg => {
        const messageEl = document.createElement('div');
        messageEl.className = `debug-message ${msg.type}`;
        messageEl.innerHTML = `
            <span class="debug-timestamp">[${msg.timestamp}]</span>
            ${msg.message}
        `;
        debugMessagesEl.appendChild(messageEl);
    });
    
    // Auto-scroll to bottom
    debugMessagesEl.scrollTop = debugMessagesEl.scrollHeight;
}

// Test database connection
async function testDatabaseConnection() {
    try {
        console.log('Testing database connection...');
        const { data, error } = await supabase
            .from('user_submissions')
            .select('count')
            .limit(1);
        
        if (error) {
            console.error('Database connection test failed:', error);
            addDebugMessage('error', `Database connection failed: ${error.message}`);
        } else {
            console.log('Database connection successful');
            addDebugMessage('success', 'Database connection successful');
        }
    } catch (error) {
        console.error('Database connection test error:', error);
        addDebugMessage('error', `Database test error: ${error.message}`);
    }
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
        
        // Set up realtime subscription for the game area
        setupRealtimeSubscription();
        
        // Load current game state
        loadCurrentGameState();
        
        // Load leaderboard
        loadLeaderboard();
        
        // Update start button visibility based on current player
        updateStartButtonVisibility();
        
        // Update current player display
        updateCurrentPlayerDisplay();
    }, 2000);
}
