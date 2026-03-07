// ===== GAME STATE =====
const game = {
    players: ['Player 1', 'Player 2', 'Player 3', 'Player 4'],
    currentRound: 1,
    maxRounds: 10,
    scores: [0, 0, 0, 0],
    roundHistory: [],
    currentRoles: [], // [babuIndex, pulishIndex, chorIndex, dakatIndex]
    rolesViewed: [false, false, false, false],
    guessTimer: null,
    timerValue: 30,
    roundType: 'chor', // 'chor' or 'dakat'
    gameStarted: false
};

// ===== DOM ELEMENTS =====
const elements = {
    // Pages
    landingPage: document.getElementById('landing-page'),
    gamePage: document.getElementById('game-page'),
    resultsPage: document.getElementById('results-page'),
    
    // Landing Page
    player1Name: document.getElementById('player1-name'),
    player2Name: document.getElementById('player2-name'),
    player3Name: document.getElementById('player3-name'),
    player4Name: document.getElementById('player4-name'),
    startGameBtn: document.getElementById('start-game-btn'),
    rulesBtn: document.getElementById('rules-btn'),
    
    // Game Page
    roleButtons: document.querySelectorAll('.role-btn'),
    roundNumber: document.getElementById('round-number'),
    quitBtn: document.getElementById('quit-btn'),
    tableBody: document.getElementById('table-body'),
    totalPoints: document.querySelectorAll('.total-points'),
    guessPhase: document.getElementById('guess-phase'),
    babuReveal: document.getElementById('babu-reveal'),
    pulishReveal: document.getElementById('pulish-reveal'),
    findText: document.getElementById('find-text'),
    guessBtn0: document.getElementById('guess-btn-0'),
    guessBtn1: document.getElementById('guess-btn-1'),
    timerDisplay: document.getElementById('timer-display'),
    playerHeaders: document.querySelectorAll('.player-header'),
    
    // Results Page
    finalStandings: document.getElementById('final-standings'),
    winnerAnnouncement: document.getElementById('winner-announcement'),
    resumeGameBtn: document.getElementById('resume-game-btn'),
    newGameBtn: document.getElementById('new-game-btn'),
    quitGameBtn: document.getElementById('quit-game-btn'),
    
    // Modals
    roleModal: document.getElementById('role-modal'),
    rolePlayerName: document.getElementById('role-player-name'),
    roleDisplay: document.getElementById('role-display'),
    roleCountdown: document.getElementById('role-countdown'),
    closeRoleBtn: document.getElementById('close-role-btn'),
    
    resultModal: document.getElementById('result-modal'),
    resultRoundNumber: document.getElementById('result-round-number'),
    guessedPlayer: document.getElementById('guessed-player'),
    culpritType: document.getElementById('culprit-type'),
    actualCulprit: document.getElementById('actual-culprit'),
    resultOutcome: document.getElementById('result-outcome'),
    pointsList: document.getElementById('points-list'),
    nextRoundBtn: document.getElementById('next-round-btn'),
    finishGameBtn: document.getElementById('finish-game-btn'),
    
    rulesModal: document.getElementById('rules-modal'),
    closeRulesBtn: document.getElementById('close-rules-btn'),
    
    quitModal: document.getElementById('quit-modal'),
    continueGameBtn: document.getElementById('continue-game-btn'),
    confirmQuitBtn: document.getElementById('confirm-quit-btn')
};

// Timer reference for role modal
let roleCountdownInterval = null;

// ===== UTILITY FUNCTIONS =====
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function getRoleName(role) {
    const roleNames = {
        babu: 'BABU',
        pulish: 'PULISH',
        chor: 'CHOR',
        dakat: 'DAKAT'
    };
    return roleNames[role] || role;
}

function getRoleClass(role) {
    return role.toLowerCase();
}

// ===== GAME LOGIC =====
function assignRandomRoles() {
    // Assign roles: [babuIndex, pulishIndex, chorIndex, dakatIndex]
    const indices = shuffleArray([0, 1, 2, 3]);
    game.currentRoles = indices;
    game.rolesViewed = [false, false, false, false];
}

function getPlayerRole(playerIndex) {
    const [babuIdx, pulishIdx, chorIdx, dakatIdx] = game.currentRoles;
    if (playerIndex === babuIdx) return 'babu';
    if (playerIndex === pulishIdx) return 'pulish';
    if (playerIndex === chorIdx) return 'chor';
    if (playerIndex === dakatIdx) return 'dakat';
    return null;
}

function getRoundType(roundNum) {
    return roundNum % 2 === 1 ? 'chor' : 'dakat';
}

function calculatePoints(guessIndex, roundType) {
    const [babuIdx, pulishIdx, chorIdx, dakatIdx] = game.currentRoles;
    const points = [0, 0, 0, 0];
    const isChorRound = roundType === 'chor';
    
    // Target culprit index
    const targetCulpritIdx = isChorRound ? chorIdx : dakatIdx;
    const nonTargetCulpritIdx = isChorRound ? dakatIdx : chorIdx;
    
    // Babu always gets 100
    points[babuIdx] = 100;
    
    // Non-target culprit always gets immune points
    if (isChorRound) {
        // Dakat is immune in Chor round
        points[dakatIdx] = 60;
    } else {
        // Chor is immune in Dakat round
        points[chorIdx] = 40;
    }
    
    // Check if Pulish guessed correctly
    const guessCorrect = guessIndex === targetCulpritIdx;
    
    if (guessCorrect) {
        // Pulish gets 80, target culprit gets 0
        points[pulishIdx] = 80;
        points[targetCulpritIdx] = 0;
    } else {
        // Pulish gets 0, target culprit escapes
        points[pulishIdx] = 0;
        if (isChorRound) {
            points[chorIdx] = 40; // Chor escapes
        } else {
            points[dakatIdx] = 60; // Dakat escapes
        }
    }
    
    return points;
}

function getSuspectIndices() {
    const [babuIdx, pulishIdx] = game.currentRoles;
    const suspects = [];
    for (let i = 0; i < 4; i++) {
        if (i !== babuIdx && i !== pulishIdx) {
            suspects.push(i);
        }
    }
    return suspects;
}

// ===== UI FUNCTIONS =====
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

function showModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function hideModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function hideAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

function updateTableHeaders() {
    elements.playerHeaders.forEach((header, index) => {
        header.textContent = game.players[index];
    });
}

function updateRoleButtons() {
    elements.roleButtons.forEach((btn, index) => {
        const nameSpan = btn.querySelector('.player-name-btn');
        nameSpan.textContent = game.players[index];
        
        if (game.rolesViewed[index]) {
            btn.classList.add('viewed');
        } else {
            btn.classList.remove('viewed');
        }
    });
}

function updateTable() {
    let html = '';
    
    for (let i = 0; i < game.maxRounds; i++) {
        const roundType = getRoundType(i + 1);
        const history = game.roundHistory[i];
        
        html += `<tr>
            <td><strong>${roundType.toUpperCase()}</strong></td>`;
        
        for (let j = 0; j < 4; j++) {
            if (history) {
                html += `<td>${history.points[j]}</td>`;
            } else {
                html += `<td>-</td>`;
            }
        }
        
        html += `</tr>`;
    }
    
    elements.tableBody.innerHTML = html;
    
    // Update totals
    elements.totalPoints.forEach((td, index) => {
        td.textContent = game.scores[index];
    });
}

function showRoleModal(playerIndex) {
    const role = getPlayerRole(playerIndex);
    elements.rolePlayerName.textContent = `${game.players[playerIndex]},`;
    elements.roleDisplay.textContent = getRoleName(role);
    elements.roleDisplay.className = `role-display ${getRoleClass(role)}`;
    
    showModal('role-modal');
    
    // Clear any existing countdown
    if (roleCountdownInterval) {
        clearInterval(roleCountdownInterval);
    }
    
    // Auto-close after 3 seconds
    let countdown = 3;
    elements.roleCountdown.textContent = countdown;
    
    roleCountdownInterval = setInterval(() => {
        countdown--;
        elements.roleCountdown.textContent = countdown;
        
        if (countdown <= 0) {
            clearInterval(roleCountdownInterval);
            roleCountdownInterval = null;
            hideModal('role-modal');
            checkAllRolesViewed();
        }
    }, 1000);
    
    // Mark as viewed
    game.rolesViewed[playerIndex] = true;
    updateRoleButtons();
}

function closeRoleModal() {
    if (roleCountdownInterval) {
        clearInterval(roleCountdownInterval);
        roleCountdownInterval = null;
    }
    hideModal('role-modal');
    checkAllRolesViewed();
}

function checkAllRolesViewed() {
    // Check if all viewed
    if (game.rolesViewed.every(v => v)) {
        setTimeout(() => {
            startGuessPhase();
        }, 500);
    }
}

function startGuessPhase() {
    const [babuIdx, pulishIdx] = game.currentRoles;
    const suspects = getSuspectIndices();
    const roundType = getRoundType(game.currentRound);
    
    // Update reveal info
    elements.babuReveal.innerHTML = `<strong>${game.players[babuIdx]}</strong> is BABU`;
    elements.pulishReveal.innerHTML = `<strong>${game.players[pulishIdx]}</strong> is PULISH`;
    
    // Update find text
    const culpritText = roundType === 'chor' ? 'CHOR' : 'DAKAT';
    elements.findText.innerHTML = `${game.players[pulishIdx]}, find out who is the <span style="color: var(--warning)">${culpritText}</span>!`;
    
    // Update guess buttons
    elements.guessBtn0.textContent = game.players[suspects[0]];
    elements.guessBtn1.textContent = game.players[suspects[1]];
    elements.guessBtn0.dataset.playerIndex = suspects[0];
    elements.guessBtn1.dataset.playerIndex = suspects[1];
    
    // Show guess phase
    elements.guessPhase.classList.remove('hidden');
    
    // Scroll to guess phase
    elements.guessPhase.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Start timer
    game.timerValue = 30;
    elements.timerDisplay.textContent = game.timerValue;
    
    game.guessTimer = setInterval(() => {
        game.timerValue--;
        elements.timerDisplay.textContent = game.timerValue;
        
        if (game.timerValue <= 0) {
            clearInterval(game.guessTimer);
            // Timeout = wrong guess, pass -1
            handleGuess(-1);
        }
    }, 1000);
}

function handleGuess(guessIndex) {
    clearInterval(game.guessTimer);
    
    const roundType = getRoundType(game.currentRound);
    const [babuIdx, pulishIdx, chorIdx, dakatIdx] = game.currentRoles;
    const targetCulpritIdx = roundType === 'chor' ? chorIdx : dakatIdx;
    
    // Calculate points
    const points = calculatePoints(guessIndex, roundType);
    
    // Update scores
    points.forEach((p, i) => {
        game.scores[i] += p;
    });
    
    // Save round history
    game.roundHistory.push({
        round: game.currentRound,
        type: roundType,
        points: points,
        guessIndex: guessIndex,
        correct: guessIndex === targetCulpritIdx
    });
    
    // Hide guess phase
    elements.guessPhase.classList.add('hidden');
    
    // Show result modal
    showResultModal(guessIndex, points, roundType);
}

function showResultModal(guessIndex, points, roundType) {
    const [babuIdx, pulishIdx, chorIdx, dakatIdx] = game.currentRoles;
    const targetCulpritIdx = roundType === 'chor' ? chorIdx : dakatIdx;
    const isChorRound = roundType === 'chor';
    
    elements.resultRoundNumber.textContent = game.currentRound;
    
    // Guessed player
    if (guessIndex === -1) {
        elements.guessedPlayer.textContent = 'TIMEOUT (No guess)';
    } else {
        elements.guessedPlayer.textContent = game.players[guessIndex];
    }
    
    // Culprit type and actual culprit
    elements.culpritType.textContent = isChorRound ? 'Chor' : 'Dakat';
    elements.actualCulprit.textContent = game.players[targetCulpritIdx];
    
    // Outcome
    const guessCorrect = guessIndex === targetCulpritIdx;
    if (guessCorrect) {
        elements.resultOutcome.className = 'result-outcome correct';
        elements.resultOutcome.textContent = 'Pulish guessed correctly!';
    } else {
        elements.resultOutcome.className = 'result-outcome wrong';
        elements.resultOutcome.textContent = 'Pulish guessed wrong!';
    }
    
    // Points list
    let pointsHtml = '';
    const roleLabels = ['Babu', 'Pulish', isChorRound ? 'Chor' : 'Dakat', isChorRound ? 'Dakat' : 'Chor'];
    const roleIndices = [babuIdx, pulishIdx, targetCulpritIdx, isChorRound ? dakatIdx : chorIdx];
    
    roleIndices.forEach((playerIdx, i) => {
        const role = getPlayerRole(playerIdx);
        let label = game.players[playerIdx];
        
        if (role === 'babu') label += ' (Babu)';
        else if (role === 'pulish') label += ' (Pulish)';
        else if (role === 'chor') label += ' (Chor)';
        else if (role === 'dakat') label += ' (Dakat)';
        
        pointsHtml += `<div>
            <span>${label}</span>
            <span>+${points[playerIdx]}</span>
        </div>`;
    });
    
    elements.pointsList.innerHTML = pointsHtml;
    
    // Update table
    updateTable();
    
    // Check if last round
    if (game.currentRound >= game.maxRounds) {
        elements.nextRoundBtn.style.display = 'none';
        elements.finishGameBtn.textContent = 'SEE RESULTS';
    } else {
        elements.nextRoundBtn.style.display = 'inline-block';
        elements.finishGameBtn.textContent = 'FINISH GAME';
    }
    
    showModal('result-modal');
}

function nextRound() {
    game.currentRound++;
    game.roundType = getRoundType(game.currentRound);
    
    // Reset roles viewed
    game.rolesViewed = [false, false, false, false];
    
    // Assign new random roles
    assignRandomRoles();
    
    // Update UI
    elements.roundNumber.textContent = game.currentRound;
    updateRoleButtons();
    elements.guessPhase.classList.add('hidden');
    
    hideModal('result-modal');
}

function showResults() {
    // Sort players by score
    const standings = game.players.map((name, index) => ({
        name: name,
        score: game.scores[index],
        index: index
    })).sort((a, b) => b.score - a.score);
    
    // Generate standings HTML
    let standingsHtml = '';
    const medals = ['1st', '2nd', '3rd', '4th'];
    
    standings.forEach((player, index) => {
        standingsHtml += `
            <div class="standing-row ${index === 0 ? 'first' : ''}">
                <span class="rank">${medals[index]}</span>
                <span class="player-name">${player.name}</span>
                <span class="score">${player.score} pts</span>
            </div>`;
    });
    
    elements.finalStandings.innerHTML = standingsHtml;
    
    // Winner announcement
    elements.winnerAnnouncement.innerHTML = `<strong>${standings[0].name}</strong> WINS!`;
    
    showPage('results-page');
    hideModal('result-modal');
}

function resetGame() {
    game.currentRound = 1;
    game.scores = [0, 0, 0, 0];
    game.roundHistory = [];
    game.rolesViewed = [false, false, false, false];
    game.roundType = 'chor';
    
    if (game.guessTimer) {
        clearInterval(game.guessTimer);
    }
    if (roleCountdownInterval) {
        clearInterval(roleCountdownInterval);
        roleCountdownInterval = null;
    }
}

// ===== EVENT LISTENERS =====

// Landing Page
elements.startGameBtn.addEventListener('click', () => {
    // Get player names
    game.players[0] = elements.player1Name.value.trim() || 'Player 1';
    game.players[1] = elements.player2Name.value.trim() || 'Player 2';
    game.players[2] = elements.player3Name.value.trim() || 'Player 3';
    game.players[3] = elements.player4Name.value.trim() || 'Player 4';
    
    // Reset game state
    resetGame();
    
    // Assign initial roles
    assignRandomRoles();
    
    // Update UI
    updateTableHeaders();
    updateRoleButtons();
    updateTable();
    elements.roundNumber.textContent = game.currentRound;
    
    // Show game page
    showPage('game-page');
    game.gameStarted = true;
});

elements.rulesBtn.addEventListener('click', () => {
    showModal('rules-modal');
});

elements.closeRulesBtn.addEventListener('click', () => {
    hideModal('rules-modal');
});

// Role Buttons
elements.roleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const playerIndex = parseInt(btn.dataset.player);
        
        if (!game.rolesViewed[playerIndex]) {
            showRoleModal(playerIndex);
        }
    });
});

// Close Role Button
elements.closeRoleBtn.addEventListener('click', () => {
    closeRoleModal();
});

// Quit Button
elements.quitBtn.addEventListener('click', () => {
    showModal('quit-modal');
});

elements.continueGameBtn.addEventListener('click', () => {
    hideModal('quit-modal');
});

elements.confirmQuitBtn.addEventListener('click', () => {
    hideModal('quit-modal');
    showResults();
});

// Guess Buttons
elements.guessBtn0.addEventListener('click', () => {
    const playerIndex = parseInt(elements.guessBtn0.dataset.playerIndex);
    handleGuess(playerIndex);
});

elements.guessBtn1.addEventListener('click', () => {
    const playerIndex = parseInt(elements.guessBtn1.dataset.playerIndex);
    handleGuess(playerIndex);
});

// Result Modal Buttons
elements.nextRoundBtn.addEventListener('click', () => {
    nextRound();
});

elements.finishGameBtn.addEventListener('click', () => {
    showResults();
});

// Results Page Buttons
elements.resumeGameBtn.addEventListener('click', () => {
    showPage('game-page');
});

elements.newGameBtn.addEventListener('click', () => {
    // Clear input fields
    elements.player1Name.value = '';
    elements.player2Name.value = '';
    elements.player3Name.value = '';
    elements.player4Name.value = '';
    
    // Reset game state
    resetGame();
    
    // Go to landing page
    showPage('landing-page');
});

elements.quitGameBtn.addEventListener('click', () => {
    // Reset everything and go to landing
    resetGame();
    game.gameStarted = false;
    
    elements.player1Name.value = '';
    elements.player2Name.value = '';
    elements.player3Name.value = '';
    elements.player4Name.value = '';
    
    showPage('landing-page');
});

// Close modals on background click
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            // Don't close role modal on background click
            if (modal.id !== 'role-modal') {
                hideModal(modal.id);
            }
        }
    });
});

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', () => {
    // Initialize empty table
    updateTable();
});
