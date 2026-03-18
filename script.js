// ===== GAME STATE =====
const game = {
    players: ['Player 1', 'Player 2', 'Player 3', 'Player 4'],
    currentRound: 1,
    maxRounds: 10,
    scores: [0, 0, 0, 0],
    roundHistory: [],
    currentRoles: [],
    rolesViewed: [false, false, false, false],
    guessTimer: null,
    timerValue: 30,
    roundType: 'chor',
    gameStarted: false
};

// ===== DOM ELEMENTS =====
const elements = {
    landingPage: document.getElementById('landing-page'),
    gamePage: document.getElementById('game-page'),
    resultsPage: document.getElementById('results-page'),
    
    player1Name: document.getElementById('player1-name'),
    player2Name: document.getElementById('player2-name'),
    player3Name: document.getElementById('player3-name'),
    player4Name: document.getElementById('player4-name'),
    startGameBtn: document.getElementById('start-game-btn'),
    rulesBtn: document.getElementById('rules-btn'),
    
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
    
    finalStandings: document.getElementById('final-standings'),
    winnerAnnouncement: document.getElementById('winner-announcement'),
    resumeGameBtn: document.getElementById('resume-game-btn'),
    newGameBtn: document.getElementById('new-game-btn'),
    quitGameBtn: document.getElementById('quit-game-btn'),
    
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
    const roleNames = { babu: 'BABU', pulish: 'PULISH', chor: 'CHOR', dakat: 'DAKAT' };
    return roleNames[role] || role;
}

function getRoleClass(role) {
    return role.toLowerCase();
}

// ===== GAME LOGIC =====
function assignRandomRoles() {
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
    const targetCulpritIdx = isChorRound ? chorIdx : dakatIdx;
    
    points[babuIdx] = 100;
    points[isChorRound ? dakatIdx : chorIdx] = isChorRound ? 60 : 40;
    
    if (guessIndex === targetCulpritIdx) {
        points[pulishIdx] = 80;
        points[targetCulpritIdx] = 0;
    } else {
        points[pulishIdx] = 0;
        points[targetCulpritIdx] = isChorRound ? 40 : 60;
    }
    
    return points;
}

function getSuspectIndices() {
    const [babuIdx, pulishIdx] = game.currentRoles;
    return [0, 1, 2, 3].filter(i => i !== babuIdx && i !== pulishIdx);
}

// ===== UI FUNCTIONS =====
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

function showModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function hideModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function updateTableHeaders() {
    elements.playerHeaders.forEach((h, i) => h.textContent = game.players[i]);
}

function updateRoleButtons() {
    elements.roleButtons.forEach((btn, i) => {
        btn.querySelector('.player-name-btn').textContent = game.players[i];
        
        const eyeOpen = btn.querySelector('.eye-open');
        const eyeClosed = btn.querySelector('.eye-closed');
        
        if (game.rolesViewed[i]) {
            btn.classList.add('viewed');
            eyeOpen.classList.add('hidden');
            eyeClosed.classList.remove('hidden');
        } else {
            btn.classList.remove('viewed');
            eyeOpen.classList.remove('hidden');
            eyeClosed.classList.add('hidden');
        }
    });
}

function updateTable() {
    let html = '';
    for (let i = 0; i < game.maxRounds; i++) {
        const type = getRoundType(i + 1);
        const history = game.roundHistory[i];
        html += `<tr><td><strong>${type.toUpperCase()}</strong></td>`;
        for (let j = 0; j < 4; j++) {
            html += `<td>${history ? history.points[j] : '-'}</td>`;
        }
        html += '</tr>';
    }
    elements.tableBody.innerHTML = html;
    elements.totalPoints.forEach((td, i) => td.textContent = game.scores[i]);
}

function showRoleModal(playerIndex) {
    const role = getPlayerRole(playerIndex);
    elements.rolePlayerName.textContent = `${game.players[playerIndex]},`;
    elements.roleDisplay.textContent = getRoleName(role);
    elements.roleDisplay.className = `role-display ${getRoleClass(role)}`;
    showModal('role-modal');
    
    if (roleCountdownInterval) clearInterval(roleCountdownInterval);
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
    if (game.rolesViewed.every(v => v)) {
        setTimeout(startGuessPhase, 400);
    }
}

function startGuessPhase() {
    const [babuIdx, pulishIdx] = game.currentRoles;
    const suspects = getSuspectIndices();
    const roundType = getRoundType(game.currentRound);
    
    elements.babuReveal.innerHTML = `<strong>${game.players[babuIdx]}</strong> is BABU`;
    elements.pulishReveal.innerHTML = `<strong>${game.players[pulishIdx]}</strong> is PULISH`;
    elements.findText.innerHTML = `${game.players[pulishIdx]}, find the <span style="color: var(--accent-yellow)">${roundType.toUpperCase()}</span>!`;
    
    elements.guessBtn0.textContent = game.players[suspects[0]];
    elements.guessBtn1.textContent = game.players[suspects[1]];
    elements.guessBtn0.dataset.playerIndex = suspects[0];
    elements.guessBtn1.dataset.playerIndex = suspects[1];
    
    elements.guessPhase.classList.remove('hidden');
    
    game.timerValue = 30;
    elements.timerDisplay.textContent = game.timerValue;
    
    game.guessTimer = setInterval(() => {
        game.timerValue--;
        elements.timerDisplay.textContent = game.timerValue;
        if (game.timerValue <= 0) {
            clearInterval(game.guessTimer);
            handleGuess(-1);
        }
    }, 1000);
}

function handleGuess(guessIndex) {
    clearInterval(game.guessTimer);
    const roundType = getRoundType(game.currentRound);
    const [babuIdx, pulishIdx, chorIdx, dakatIdx] = game.currentRoles;
    const targetCulpritIdx = roundType === 'chor' ? chorIdx : dakatIdx;
    const points = calculatePoints(guessIndex, roundType);
    
    points.forEach((p, i) => game.scores[i] += p);
    
    game.roundHistory.push({
        round: game.currentRound,
        type: roundType,
        points: points,
        guessIndex: guessIndex,
        correct: guessIndex === targetCulpritIdx
    });
    
    elements.guessPhase.classList.add('hidden');
    showResultModal(guessIndex, points, roundType);
}

function showResultModal(guessIndex, points, roundType) {
    const [babuIdx, pulishIdx, chorIdx, dakatIdx] = game.currentRoles;
    const targetCulpritIdx = roundType === 'chor' ? chorIdx : dakatIdx;
    const isChorRound = roundType === 'chor';
    
    elements.resultRoundNumber.textContent = game.currentRound;
    elements.guessedPlayer.textContent = guessIndex === -1 ? 'TIMEOUT' : game.players[guessIndex];
    elements.culpritType.textContent = isChorRound ? 'Chor' : 'Dakat';
    elements.actualCulprit.textContent = game.players[targetCulpritIdx];
    
    const correct = guessIndex === targetCulpritIdx;
    elements.resultOutcome.className = `result-outcome ${correct ? 'correct' : 'wrong'}`;
    elements.resultOutcome.textContent = correct ? 'Pulish guessed correctly!' : 'Pulish guessed wrong!';
    
    let pointsHtml = '';
    [babuIdx, pulishIdx, targetCulpritIdx, isChorRound ? dakatIdx : chorIdx].forEach(playerIdx => {
        const role = getPlayerRole(playerIdx);
        pointsHtml += `<div><span>${game.players[playerIdx]} (${role?.toUpperCase()})</span><span>+${points[playerIdx]}</span></div>`;
    });
    elements.pointsList.innerHTML = pointsHtml;
    
    updateTable();
    
    elements.nextRoundBtn.style.display = game.currentRound >= game.maxRounds ? 'none' : 'inline-block';
    elements.finishGameBtn.textContent = game.currentRound >= game.maxRounds ? 'SEE RESULTS' : 'FINISH GAME';
    
    showModal('result-modal');
}

function nextRound() {
    game.currentRound++;
    game.roundType = getRoundType(game.currentRound);
    game.rolesViewed = [false, false, false, false];
    assignRandomRoles();
    elements.roundNumber.textContent = game.currentRound;
    updateRoleButtons();
    elements.guessPhase.classList.add('hidden');
    hideModal('result-modal');
}

function showResults() {
    const standings = game.players.map((name, i) => ({ name, score: game.scores[i], index: i }))
        .sort((a, b) => b.score - a.score);
    
    const positions = ['1st', '2nd', '3rd', '4th'];
    elements.finalStandings.innerHTML = standings.map((p, i) => `
        <div class="standing-row ${i === 0 ? 'first' : ''}">
            <span class="rank">${positions[i]}</span>
            <span class="player-name">${p.name}</span>
            <span class="score">${p.score} pts</span>
        </div>`
    ).join('');
    
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
    if (game.guessTimer) clearInterval(game.guessTimer);
    if (roleCountdownInterval) { clearInterval(roleCountdownInterval); roleCountdownInterval = null; }
}

// ===== EVENT LISTENERS =====
elements.startGameBtn.addEventListener('click', () => {
    game.players[0] = elements.player1Name.value.trim() || 'Player 1';
    game.players[1] = elements.player2Name.value.trim() || 'Player 2';
    game.players[2] = elements.player3Name.value.trim() || 'Player 3';
    game.players[3] = elements.player4Name.value.trim() || 'Player 4';
    resetGame();
    assignRandomRoles();
    updateTableHeaders();
    updateRoleButtons();
    updateTable();
    elements.roundNumber.textContent = game.currentRound;
    showPage('game-page');
    game.gameStarted = true;
});

elements.rulesBtn.addEventListener('click', () => showModal('rules-modal'));
elements.closeRulesBtn.addEventListener('click', () => hideModal('rules-modal'));
elements.roleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.player);
        if (!game.rolesViewed[i]) showRoleModal(i);
    });
});
elements.closeRoleBtn.addEventListener('click', closeRoleModal);
elements.quitBtn.addEventListener('click', () => showModal('quit-modal'));
elements.continueGameBtn.addEventListener('click', () => hideModal('quit-modal'));
elements.confirmQuitBtn.addEventListener('click', () => { hideModal('quit-modal'); showResults(); });
elements.guessBtn0.addEventListener('click', () => handleGuess(parseInt(elements.guessBtn0.dataset.playerIndex)));
elements.guessBtn1.addEventListener('click', () => handleGuess(parseInt(elements.guessBtn1.dataset.playerIndex)));
elements.nextRoundBtn.addEventListener('click', nextRound);
elements.finishGameBtn.addEventListener('click', showResults);
elements.resumeGameBtn.addEventListener('click', () => showPage('game-page'));
elements.newGameBtn.addEventListener('click', () => {
    [elements.player1Name, elements.player2Name, elements.player3Name, elements.player4Name].forEach(el => el.value = '');
    resetGame();
    showPage('landing-page');
});
elements.quitGameBtn.addEventListener('click', () => {
    resetGame();
    game.gameStarted = false;
    [elements.player1Name, elements.player2Name, elements.player3Name, elements.player4Name].forEach(el => el.value = '');
    showPage('landing-page');
});

document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', e => { if (e.target === modal && modal.id !== 'role-modal') hideModal(modal.id); });
});

document.addEventListener('DOMContentLoaded', () => updateTable());