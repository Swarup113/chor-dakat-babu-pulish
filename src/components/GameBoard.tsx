import { useState, useEffect, useRef } from 'react';
import { GameState, RoundData, PlayerScore } from '../types/game';
import {
  shuffleRoles,
  getRoundType,
  calculateScore,
  findPlayerWithRole,
  getRoleColor
} from '../utils/gameLogic';
import { Crown, Play, RotateCcw, Eye, Book, Lightbulb, X, Award, Trophy, AlertCircle, Shield, Clock } from 'lucide-react';

export default function GameBoard() {
  const [gameState, setGameState] = useState<GameState>({
    rounds: [],
    currentRound: 0,
    gameStarted: false,
    gameEnded: false,
    playerNames: ['Player 1', 'Player 2', 'Player 3', 'Player 4'],
    pulishConsecutiveCorrect: {},
    pulishStats: { correct: {}, wrong: {} },
    chorDakatStats: { escaped: {}, caught: {} },
    badges: {
      bestPulish: null,
      worstPulish: null,
      bestShontrashi: null,
      worstShontrashi: null,
      bestBabu: null
    },
    babuStats: { count: {} }
  });

  const [editingNames, setEditingNames] = useState(true);
  const [viewingPlayerRole, setViewingPlayerRole] = useState<number | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [showGuessResult, setShowGuessResult] = useState<{ 
    isCorrect: boolean; 
    guessedPlayer: string; 
    actualCulprit: string; 
    roundType: string;
    isTimeout?: boolean;
  } | null>(null);
  const [showBadgeNotification, setShowBadgeNotification] = useState<{ 
    badge: string; 
    message: string; 
    playerName: string;
    achievement: string 
  } | null>(null);
  const [showDeshRotno, setShowDeshRotno] = useState<{ playerName: string } | null>(null);
  const [showAwards, setShowAwards] = useState(false);
  const [nameInputs, setNameInputs] = useState<{ [key: number]: string }>({});
  const [showBadgeDetail, setShowBadgeDetail] = useState<{ badge: string; playerName: string } | null>(null);
  
  // Timer States
  const [guessTimeLeft, setGuessTimeLeft] = useState(25);
  const [roleTimeLeft, setRoleTimeLeft] = useState(3);
  
  // Refs for intervals to ensure cleanup
  const guessIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const roleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startGame = () => {
    const initialRounds: RoundData[] = [];
    const pulishStats = { correct: {}, wrong: {} };
    const chorDakatStats = { escaped: {}, caught: {} };
    const babuStats = { count: {} };

    for (let i = 1; i <= 10; i++) {
      initialRounds.push({
        roundNumber: i,
        roundType: getRoundType(i),
        players: gameState.playerNames.map((name, idx) => ({
          playerId: idx,
          name,
          role: null,
          score: 0,
          totalScore: 0
        })),
        pulishGuess: null,
        isComplete: false,
        rolesRevealed: false,
        playersSeenRoles: new Set<number>(),
        rolesAssigned: false
      });
    }

    setGameState({
      ...gameState,
      rounds: initialRounds,
      currentRound: 1,
      gameStarted: true,
      gameEnded: false,
      pulishConsecutiveCorrect: { 0: 0, 1: 0, 2: 0, 3: 0 },
      pulishStats,
      chorDakatStats,
      badges: {
        bestPulish: null,
        worstPulish: null,
        bestShontrashi: null,
        worstShontrashi: null,
        bestBabu: null
      },
      babuStats
    });
    setEditingNames(false);
    startRound(1, initialRounds);
  };

  const startRound = (roundNumber: number, rounds: RoundData[]) => {
    const shuffledRoles = shuffleRoles();
    const updatedRounds = [...rounds];
    const roundIndex = roundNumber - 1;

    updatedRounds[roundIndex].players = updatedRounds[roundIndex].players.map((player, idx) => ({
      ...player,
      role: shuffledRoles[idx],
      score: 0
    }));

    updatedRounds[roundIndex].rolesAssigned = true;
    updatedRounds[roundIndex].playersSeenRoles = new Set<number>();

    setGameState(prev => ({
      ...prev,
      rounds: updatedRounds
    }));

    setViewingPlayerRole(null);
    setGuessTimeLeft(25); // Reset timer
  };

  const markPlayerSeenRole = (playerId: number) => {
    const updatedRounds = [...gameState.rounds];
    const roundIndex = gameState.currentRound - 1;
    updatedRounds[roundIndex].playersSeenRoles.add(playerId);

    setGameState(prev => ({
      ...prev,
      rounds: updatedRounds
    }));

    setViewingPlayerRole(null);
    // Reset role timer just in case
    setRoleTimeLeft(3);
  };

  // Effect to handle 3-second auto-close for Role View
  useEffect(() => {
    if (viewingPlayerRole !== null) {
      setRoleTimeLeft(3);
      
      roleTimeoutRef.current = setTimeout(() => {
        markPlayerSeenRole(viewingPlayerRole);
      }, 3000);

      // Countdown for UI
      const countdownInterval = setInterval(() => {
        setRoleTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearTimeout(roleTimeoutRef.current!);
        clearInterval(countdownInterval);
      };
    }
  }, [viewingPlayerRole]);

  // Effect to handle 25-second timer for Pulish Guess
  useEffect(() => {
    const currentRound = getCurrentRound();
    
    // Only run timer if all players seen roles, round isn't revealed, and game is active
    if (currentRound && allPlayersSeenRoles() && !currentRound.rolesRevealed && !gameState.gameEnded) {
      setGuessTimeLeft(25);
      
      guessIntervalRef.current = setInterval(() => {
        setGuessTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(guessIntervalRef.current!);
            handleGuessTimeout(); // Trigger timeout logic
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (guessIntervalRef.current) clearInterval(guessIntervalRef.current);
      };
    }
  }, [gameState.currentRound, gameState.rounds]); // Re-run when round changes or rounds update

  const handleGuessTimeout = () => {
    const updatedRounds = [...gameState.rounds];
    const roundIndex = gameState.currentRound - 1;
    const currentRound = updatedRounds[roundIndex];
    
    const culpritRole = currentRound.roundType;
    const actualCulprit = findPlayerWithRole(currentRound.players, culpritRole);
    const pulishPlayerId = findPlayerWithRole(currentRound.players, 'Pulish');

    // Treat as incorrect guess
    const isPulishCorrect = false;

    // Show timeout result popup
    if (actualCulprit !== null) {
        setShowGuessResult({
          isCorrect: false,
          guessedPlayer: 'Nobody (Time\'s Up!)',
          actualCulprit: currentRound.players[actualCulprit].name,
          roundType: currentRound.roundType,
          isTimeout: true
        });
    }

    // Update pulish stats (Wrong)
    const updatedPulishStats = { ...gameState.pulishStats };
    if (pulishPlayerId !== null) {
      updatedPulishStats.wrong[pulishPlayerId] = (updatedPulishStats.wrong[pulishPlayerId] || 0) + 1;
    }

    // Update chor/dakat stats (Escaped)
    const updatedChorDakatStats = { ...gameState.chorDakatStats };
    if (actualCulprit !== null) {
      updatedChorDakatStats.escaped[actualCulprit] = (updatedChorDakatStats.escaped[actualCulprit] || 0) + 1;
    }

    // Update babu stats
    const updatedBabuStats = { ...gameState.babuStats };
    const babuPlayerId = findPlayerWithRole(currentRound.players, 'Babu');
    if (babuPlayerId !== null) {
      updatedBabuStats.count[babuPlayerId] = (updatedBabuStats.count[babuPlayerId] || 0) + 1;
    }

    // Reset consecutive correct guesses for Pulish
    const finalStats = { ...gameState.pulishConsecutiveCorrect };
    if (pulishPlayerId !== null) {
      finalStats[pulishPlayerId] = 0;
    }

    // Calculate Scores
    currentRound.players = currentRound.players.map(player => {
      let score = calculateScore(player.role!, currentRound.roundType, false); // false = caught/wrong logic

      const previousTotal = roundIndex > 0
        ? updatedRounds[roundIndex - 1].players[player.playerId].totalScore
        : 0;

      return {
        ...player,
        score,
        totalScore: previousTotal + score
      };
    });

    // Badges checks (Only check worst stats for timeout, or best for shontrashi escaping)
    const updatedBadges = { ...gameState.badges };
    
    // Worst Pulish badge (at least 3 wrong)
    if (pulishPlayerId !== null && updatedPulishStats.wrong[pulishPlayerId] >= 3) {
      if (!updatedBadges.worstPulish || 
          (updatedPulishStats.wrong[pulishPlayerId] > updatedPulishStats.wrong[updatedBadges.worstPulish])) {
        updatedBadges.worstPulish = pulishPlayerId;
        setShowBadgeNotification({
          badge: 'worstPulish',
          message: 'The Worst Pulish in Town',
          playerName: currentRound.players[pulishPlayerId].name,
          achievement: 'Toh Mai Kya Karun, Job Chhod dun?'
        });
      }
    }

    // Best Shontrashi badge (at least 3 escaped) - Timeout counts as escape
    if (actualCulprit !== null) {
      if (updatedChorDakatStats.escaped[actualCulprit] >= 3) {
        if (!updatedBadges.bestShontrashi || 
            (updatedChorDakatStats.escaped[actualCulprit] > updatedChorDakatStats.escaped[updatedBadges.bestShontrashi])) {
          updatedBadges.bestShontrashi = actualCulprit;
          setShowBadgeNotification({
            badge: 'bestShontrashi',
            message: 'The Best Shontrashi in Town',
            playerName: currentRound.players[actualCulprit].name,
            achievement: 'Maut Ko Chuke Tak Se Bapas Aaa Sakta Hun'
          });
        }
      }
    }

    // Best Babu badge (3 or more Babu roles)
    if (babuPlayerId !== null) {
      if (updatedBabuStats.count[babuPlayerId] >= 3) {
        if (!updatedBadges.bestBabu || 
            (updatedBabuStats.count[babuPlayerId] > updatedBabuStats.count[updatedBadges.bestBabu])) {
          updatedBadges.bestBabu = babuPlayerId;
          setShowBadgeNotification({
            badge: 'bestBabu',
            message: 'The Best Babushab in Town',
            playerName: currentRound.players[babuPlayerId].name,
            achievement: 'Apnare Dekhlei Bujha Jai Apne Uccho-Shikkhito'
          });
        }
      }
    }

    currentRound.isComplete = true;
    currentRound.rolesRevealed = true;

    setGameState(prev => ({
      ...prev,
      rounds: updatedRounds,
      pulishConsecutiveCorrect: finalStats,
      pulishStats: updatedPulishStats,
      chorDakatStats: updatedChorDakatStats,
      badges: updatedBadges,
      babuStats: updatedBabuStats
    }));
  };

  const handlePulishGuess = (guessedPlayerId: number) => {
    // Clear the timer if a manual guess is made
    if (guessIntervalRef.current) clearInterval(guessIntervalRef.current);

    const updatedRounds = [...gameState.rounds];
    const roundIndex = gameState.currentRound - 1;
    const currentRound = updatedRounds[roundIndex];

    currentRound.pulishGuess = guessedPlayerId;

    const culpritRole = currentRound.roundType;
    const actualCulprit = findPlayerWithRole(currentRound.players, culpritRole);
    const isPulishCorrect = guessedPlayerId === actualCulprit;
    const pulishPlayerId = findPlayerWithRole(currentRound.players, 'Pulish');
    const guessedPlayer = currentRound.players[guessedPlayerId];

    // Show prediction result popup
    setShowGuessResult({
      isCorrect: isPulishCorrect,
      guessedPlayer: guessedPlayer.name,
      actualCulprit: actualCulprit ? currentRound.players[actualCulprit].name : 'Unknown',
      roundType: currentRound.roundType
    });

    // Update pulish stats
    const updatedPulishStats = { ...gameState.pulishStats };
    if (isPulishCorrect && pulishPlayerId !== null) {
      updatedPulishStats.correct[pulishPlayerId] = (updatedPulishStats.correct[pulishPlayerId] || 0) + 1;
    } else if (pulishPlayerId !== null) {
      updatedPulishStats.wrong[pulishPlayerId] = (updatedPulishStats.wrong[pulishPlayerId] || 0) + 1;
    }

    // Update chor/dakat stats
    const updatedChorDakatStats = { ...gameState.chorDakatStats };
    if (actualCulprit !== null) {
      if (isPulishCorrect) {
        // Culprit was caught
        updatedChorDakatStats.caught[actualCulprit] = (updatedChorDakatStats.caught[actualCulprit] || 0) + 1;
      } else {
        // Culprit escaped
        updatedChorDakatStats.escaped[actualCulprit] = (updatedChorDakatStats.escaped[actualCulprit] || 0) + 1;
      }
    }

    // Update babu stats
    const updatedBabuStats = { ...gameState.babuStats };
    const babuPlayerId = findPlayerWithRole(currentRound.players, 'Babu');
    if (babuPlayerId !== null) {
      updatedBabuStats.count[babuPlayerId] = (updatedBabuStats.count[babuPlayerId] || 0) + 1;
    }

    // Check for 3 consecutive correct guesses
    if (isPulishCorrect && pulishPlayerId !== null) {
      const updatedStats = { ...gameState.pulishConsecutiveCorrect };
      updatedStats[pulishPlayerId] = (updatedStats[pulishPlayerId] || 0) + 1;
      
      if (updatedStats[pulishPlayerId] === 3) {
        setShowDeshRotno({
          playerName: currentRound.players[pulishPlayerId].name
        });
      }
      
      setGameState(prev => ({
        ...prev,
        pulishConsecutiveCorrect: updatedStats
      }));
    }

    // Check for badge achievements (only when reaching at least 2)
    const updatedBadges = { ...gameState.badges };
    
    // Best Pulish badge (at least 3 correct)
    if (pulishPlayerId !== null && updatedPulishStats.correct[pulishPlayerId] >= 3) {
      if (!updatedBadges.bestPulish || 
          (updatedPulishStats.correct[pulishPlayerId] > updatedPulishStats.correct[updatedBadges.bestPulish])) {
        updatedBadges.bestPulish = pulishPlayerId;
        setShowBadgeNotification({
          badge: 'bestPulish',
          message: 'Best Pulish in Town',
          playerName: currentRound.players[pulishPlayerId].name,
          achievement: 'Tomakei Khujche Bangladesh'
        });
      }
    }

    // Worst Pulish badge (at least 2 wrong)
    if (pulishPlayerId !== null && updatedPulishStats.wrong[pulishPlayerId] >= 3) {
      if (!updatedBadges.worstPulish || 
          (updatedPulishStats.wrong[pulishPlayerId] > updatedPulishStats.wrong[updatedBadges.worstPulish])) {
        updatedBadges.worstPulish = pulishPlayerId;
        setShowBadgeNotification({
          badge: 'worstPulish',
          message: 'The Worst Pulish in Town',
          playerName: currentRound.players[pulishPlayerId].name,
          achievement: 'Toh Mai Kya Karun, Job Chhod dun?'
        });
      }
    }

    // Best Shontrashi badge (at least 2 escaped)
    if (actualCulprit !== null && !isPulishCorrect) {
      if (updatedChorDakatStats.escaped[actualCulprit] >= 3) {
        if (!updatedBadges.bestShontrashi || 
            (updatedChorDakatStats.escaped[actualCulprit] > updatedChorDakatStats.escaped[updatedBadges.bestShontrashi])) {
          updatedBadges.bestShontrashi = actualCulprit;
          setShowBadgeNotification({
            badge: 'bestShontrashi',
            message: 'The Best Shontrashi in Town',
            playerName: currentRound.players[actualCulprit].name,
            achievement: 'Maut Ko Chuke Tak Se Bapas Aaa Sakta Hun'
          });
        }
      }
    }

    // Worst Shontrashi badge (at least 2 caught)
    if (actualCulprit !== null && isPulishCorrect) {
      if (updatedChorDakatStats.caught[actualCulprit] >= 3) {
        if (!updatedBadges.worstShontrashi || 
            (updatedChorDakatStats.caught[actualCulprit] > updatedChorDakatStats.caught[updatedBadges.worstShontrashi])) {
          updatedBadges.worstShontrashi = actualCulprit;
          setShowBadgeNotification({
            badge: 'worstShontrashi',
            message: 'The Worst Shontrashi in Town',
            playerName: currentRound.players[actualCulprit].name,
            achievement: 'Ye Dukh Kahe Khatam Nahi Hota Be!'
          });
        }
      }
    }

    // Best Babu badge (3 or more Babu roles)
    if (babuPlayerId !== null) {
      if (updatedBabuStats.count[babuPlayerId] >= 3) {
        if (!updatedBadges.bestBabu || 
            (updatedBabuStats.count[babuPlayerId] > updatedBabuStats.count[updatedBadges.bestBabu])) {
          updatedBadges.bestBabu = babuPlayerId;
          setShowBadgeNotification({
            badge: 'bestBabu',
            message: 'The Best Babushab in Town',
            playerName: currentRound.players[babuPlayerId].name,
            achievement: 'Apnare Dekhlei Bujha Jai Apne Uccho-Shikkhito'
          });
        }
      }
    }

    const finalStats = { ...gameState.pulishConsecutiveCorrect };

    if (isPulishCorrect && pulishPlayerId !== null) {
      finalStats[pulishPlayerId] = (finalStats[pulishPlayerId] || 0) + 1;
    } else if (pulishPlayerId !== null) {
      finalStats[pulishPlayerId] = 0;
    }

    currentRound.players = currentRound.players.map(player => {
      let score = calculateScore(player.role!, currentRound.roundType, isPulishCorrect);

      if (
        player.role === 'Pulish' &&
        isPulishCorrect &&
        finalStats[player.playerId] === 3
      ) {
        score += 100;
      }

      const previousTotal = roundIndex > 0
        ? updatedRounds[roundIndex - 1].players[player.playerId].totalScore
        : 0;

      return {
        ...player,
        score,
        totalScore: previousTotal + score
      };
    });

    currentRound.isComplete = true;
    currentRound.rolesRevealed = true;

    setGameState(prev => ({
      ...prev,
      rounds: updatedRounds,
      pulishConsecutiveCorrect: finalStats,
      pulishStats: updatedPulishStats,
      chorDakatStats: updatedChorDakatStats,
      badges: updatedBadges,
      babuStats: updatedBabuStats
    }));
  };

  const nextRound = () => {
    const nextRoundNumber = gameState.currentRound + 1;

    let updatedRounds = [...gameState.rounds];

    if (nextRoundNumber > updatedRounds.length) {
      updatedRounds.push({
        roundNumber: nextRoundNumber,
        roundType: getRoundType(nextRoundNumber),
        players: gameState.playerNames.map((name, idx) => ({
          playerId: idx,
          name,
          role: null,
          score: 0,
          totalScore: updatedRounds[updatedRounds.length - 1].players[idx].totalScore
        })),
        pulishGuess: null,
        isComplete: false,
        rolesRevealed: false,
        playersSeenRoles: new Set<number>(),
        rolesAssigned: false
      });
    }

    setGameState(prev => ({
      ...prev,
      rounds: updatedRounds,
      currentRound: nextRoundNumber
    }));

    startRound(nextRoundNumber, updatedRounds);
  };

  const finishGame = () => {
    setGameState(prev => ({
      ...prev,
      gameEnded: true
    }));
  };

  const quitGame = () => {
    window.close();
  };

  const resetGame = () => {
    if (guessIntervalRef.current) clearInterval(guessIntervalRef.current);
    if (roleTimeoutRef.current) clearTimeout(roleTimeoutRef.current);
    
    setGameState({
      rounds: [],
      currentRound: 0,
      gameStarted: false,
      gameEnded: false,
      playerNames: ['Player 1', 'Player 2', 'Player 3', 'Player 4'],
      pulishConsecutiveCorrect: {},
      pulishStats: { correct: {}, wrong: {} },
      chorDakatStats: { escaped: {}, caught: {} },
      badges: {
        bestPulish: null,
        worstPulish: null,
        bestShontrashi: null,
        worstShontrashi: null,
        bestBabu: null
      },
      babuStats: { count: {} }
    });
    setEditingNames(true);
    setNameInputs({});
    setShowRules(false);
    setShowTips(false);
    setShowGuessResult(null);
    setShowBadgeNotification(null);
    setShowDeshRotno(null);
    setShowAwards(false);
    setGuessTimeLeft(25);
    setRoleTimeLeft(3);
  };

  const resumeGame = () => {
    setGameState(prev => ({
      ...prev,
      gameEnded: false
    }));
  };

  const updatePlayerName = (index: number, name: string) => {
    const trimmedName = name.trim();
    
    // If name is empty, revert to default
    if (!trimmedName) {
      setNameInputs(prev => ({ ...prev, [index]: '' }));
      setGameState(prev => {
        const newNames = [...prev.playerNames];
        newNames[index] = `Player ${index + 1}`;
        return { ...prev, playerNames: newNames };
      });
    } else {
      setNameInputs(prev => ({ ...prev, [index]: trimmedName }));
      setGameState(prev => {
        const newNames = [...prev.playerNames];
        newNames[index] = trimmedName;
        return { ...prev, playerNames: newNames };
      });
    }
  };

  const getCurrentRound = () => {
    return gameState.rounds[gameState.currentRound - 1];
  };

  const allPlayersSeenRoles = () => {
    const currentRound = getCurrentRound();
    return currentRound && currentRound.playersSeenRoles.size === 4;
  };

  const getWinner = () => {
    if (gameState.rounds.length === 0) return null;

    const lastCompletedRound = gameState.rounds.findLast(r => r.isComplete);

    if (!lastCompletedRound) return null;

    const maxScore = Math.max(...lastCompletedRound.players.map(p => p.totalScore));
    const winners = lastCompletedRound.players.filter(p => p.totalScore === maxScore);

    return winners.length === 1 ? winners[0] : winners;
  };

  const getBadgeIcon = (badgeType: string) => {
    switch(badgeType) {
      case 'bestPulish': return <Trophy className="w-4 h-4" />;
      case 'worstPulish': return <AlertCircle className="w-4 h-4" />;
      case 'bestShontrashi': return <Shield className="w-4 h-4" />;
      case 'worstShontrashi': return <AlertCircle className="w-4 h-4" />;
      case 'bestBabu': return <Trophy className="w-4 h-4" />;
      default: return <Award className="w-4 h-4" />;
    }
  };

  const GuessResultModal = () => {
    if (!showGuessResult) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900 rounded-xl shadow-2xl max-w-md w-full">
          <div className="bg-slate-950 border-b border-slate-700 p-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              {showGuessResult.isCorrect ? 'Correct Guess!' : (showGuessResult.isTimeout ? 'Time\'s Up!' : 'Incorrect Guess')}
            </h2>
            <button
              onClick={() => setShowGuessResult(null)}
              className="text-slate-400 hover:text-white transition"
            >
              <X size={24} />
            </button>
          </div>
          <div className="p-6 text-slate-300 text-center">
            <div className="mb-4">
              <p className="text-lg">
                {showGuessResult.isCorrect 
                  ? `Correct! ${showGuessResult.guessedPlayer} was the ${showGuessResult.roundType}.` 
                  : showGuessResult.isTimeout
                  ? `Time ran out! ${showGuessResult.actualCulprit} was the ${showGuessResult.roundType}.`
                  : `Incorrect. ${showGuessResult.actualCulprit} was the ${showGuessResult.roundType}.`}
              </p>
            </div>
            <button
              onClick={() => setShowGuessResult(null)}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-all"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  };

  const DeshRotnoModal = () => {
    if (!showDeshRotno) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900 rounded-xl shadow-2xl max-w-md w-full">
          <div className="bg-slate-950 border-b border-slate-700 p-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-6 h-6" />
              Desh Rotno of Bangladesh!
            </h2>
            <button
              onClick={() => setShowDeshRotno(null)}
              className="text-slate-400 hover:text-white transition"
            >
              <X size={24} />
            </button>
          </div>
          <div className="p-6 text-slate-300 text-center">
            <div className="mb-4">
              <p className="text-lg font-semibold mb-2">
                Congratulations {showDeshRotno.playerName}!
              </p>
              <p className="text-md italic">
                "Aij Theika Apnare Sir Dakbo" - 100 bonus points for 3 consecutive correct guesses!
              </p>
            </div>
            <button
              onClick={() => setShowDeshRotno(null)}
              className="w-full bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white font-semibold py-3 px-6 rounded-lg transition-all"
            >
              Awesome!
            </button>
          </div>
        </div>
      </div>
    );
  };

  const BadgeNotificationModal = () => {
    if (!showBadgeNotification) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900 rounded-xl shadow-2xl max-w-md w-full">
          <div className="bg-slate-950 border-b border-slate-700 p-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Award className="w-6 h-6" />
              New Badge Unlocked!
            </h2>
            <button
              onClick={() => setShowBadgeNotification(null)}
              className="text-slate-400 hover:text-white transition"
            >
              <X size={24} />
            </button>
          </div>
          <div className="p-6 text-slate-300 text-center">
            <div className="mb-4">
              <div className="flex items-center justify-center mb-3">
                {getBadgeIcon(showBadgeNotification.badge)}
              </div>
              <p className="text-lg font-semibold mb-2">
                {showBadgeNotification.playerName} earned a new badge!
              </p>
              <p className="text-md italic">
                "{showBadgeNotification.message}"
              </p>
              <p className="text-sm text-slate-400 mt-2">
                {showBadgeNotification.achievement}
              </p>
            </div>
            <button
              onClick={() => setShowBadgeNotification(null)}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-6 rounded-lg transition-all"
            >
              Awesome!
            </button>
          </div>
        </div>
      </div>
    );
  };

  const BadgeDetailModal = () => {
    if (!showBadgeDetail) return null;

    const badgeInfo: { [key: string]: { title: string; description: string; emoji: string } } = {
      bestPulish: { title: 'Best Pulish in Town', description: '"Tomakei Khujche Bangladesh" - Awarded to the Pulish with the most correct guesses (3+)', emoji: '🏆' },
      worstPulish: { title: 'Worst Pulish in Town', description: '"Toh Mai Kya Karun, Job Chhod dun?" - Awarded to the Pulish with the most wrong guesses (3+)', emoji: '❌' },
      bestShontrashi: { title: 'Best Shontrashi in Bangladesh', description: '"Maut Ko Chuke Tak Se Bapas Aaa Sakta Hun" - Awarded to the criminal who escaped the most (3+)', emoji: '🏃' },
      worstShontrashi: { title: 'Worst Shontrashi in Bangladesh', description: '"Ye Dukh Kahe Khatam Nahi Hota Be" - Awarded to the criminal who was caught the most (3+)', emoji: '⛓️' },
      bestBabu: { title: 'Best Babu in Bangladesh', description: '"Apnare Dekhlei Bujha Jai Apne Uccho-Shikkhito" - Awarded to the player who played as Babu 3 or more times', emoji: '👑' }
    };

    const info = badgeInfo[showBadgeDetail.badge];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900 rounded-xl shadow-2xl max-w-md w-full">
          <div className="bg-slate-950 border-b border-slate-700 p-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-3xl">{info.emoji}</span>
              {info.title}
            </h2>
            <button
              onClick={() => setShowBadgeDetail(null)}
              className="text-slate-400 hover:text-white transition"
            >
              <X size={24} />
            </button>
          </div>
          <div className="p-6 text-slate-300 text-center">
            <p className="text-lg font-semibold mb-4">{showBadgeDetail.playerName}</p>
            <p className="text-base mb-6">{info.description}</p>
            <button
              onClick={() => setShowBadgeDetail(null)}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const AwardsModal = () => {
    if (!showAwards) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto">
          <div className="sticky top-0 bg-slate-950 border-b border-slate-700 p-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Awards & Badges</h2>
            <button
              onClick={() => setShowAwards(false)}
              className="text-slate-400 hover:text-white transition"
            >
              <X size={24} />
            </button>
          </div>
          <div className="p-6 space-y-4 text-slate-300 text-sm md:text-base">
            <div className="space-y-3">
              <div className="bg-slate-800 rounded-lg p-4 border-l-4 border-yellow-500">
                <h3 className="text-lg font-semibold text-yellow-400 mb-2 flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Best Pulish in Town
                </h3>
                <p className="text-sm">"Tomakei Khujche Bangladesh"</p>
                <p className="text-xs text-slate-400 mt-1">Awarded to the Pulish with the most correct guesses</p>
              </div>
              
              <div className="bg-slate-800 rounded-lg p-4 border-l-4 border-red-500">
                <h3 className="text-lg font-semibold text-red-400 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Worst Pulish in Town
                </h3>
                <p className="text-sm">"Toh Mai Kya Karun, Job Chhod dun?"</p>
                <p className="text-xs text-slate-400 mt-1">Awarded to the Pulish with the most wrong guesses</p>
              </div>
              
              <div className="bg-slate-800 rounded-lg p-4 border-l-4 border-green-500">
                <h3 className="text-lg font-semibold text-green-400 mb-2 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Best Shontrashi in Bangladesh
                </h3>
                <p className="text-sm">"Maut Ko Chuke Tak Se Bapas Aaa Sakta Hun"</p>
                <p className="text-xs text-slate-400 mt-1">Awarded to the criminal who escaped the most</p>
              </div>
              
              <div className="bg-slate-800 rounded-lg p-4 border-l-4 border-red-500">
                <h3 className="text-lg font-semibold text-red-400 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Worst Shontrashi in Bangladesh
                </h3>
                <p className="text-sm">"Ye Dukh Kahe Khatam Nahi Hota Be"</p>
                <p className="text-xs text-slate-400 mt-1">Awarded to the criminal who was caught the most</p>
              </div>
              
              <div className="bg-slate-800 rounded-lg p-4 border-l-4 border-purple-500">
                <h3 className="text-lg font-semibold text-purple-400 mb-2 flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Best BabuShab in Bangladesh
                </h3>
                <p className="text-sm">"Apnare Dekhlei Bujha Jai Apne Uccho-Shikkhito"</p>
                <p className="text-xs text-slate-400 mt-1">Awarded to the player who played as Babu 3 or more times</p>
              </div>
              
              <div className="bg-slate-800 rounded-lg p-4 border-l-4 border-yellow-500">
                <h3 className="text-lg font-semibold text-yellow-400 mb-2 flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Desh Rotno of Bangladesh
                </h3>
                <p className="text-sm">"Aij Theke Apnake Sir Dakbo" - 100 bonus points</p>
                <p className="text-xs text-slate-400 mt-1">Awarded for 3 consecutive correct guesses</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const RulesModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto">
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Game Rules</h2>
          <button
            onClick={() => setShowRules(false)}
            className="text-slate-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6 space-y-4 text-slate-300 text-sm md:text-base">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Game Overview</h3>
            <p>A 4-player game where roles are hidden each round. Score the most points to win!</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Roles (One per player, each round)</h3>
            <ul className="list-disc list-inside space-y-1">
              <li><span className="text-emerald-400">Babu</span> - Always scores 100 points</li>
              <li><span className="text-blue-400">Pulish (Police)</span> - Guesses the culprit</li>
              <li><span className="text-orange-400">Chor</span> - Culprit in odd rounds</li>
              <li><span className="text-red-400">Dakat</span> - Culprit in even rounds</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Round Flow</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>Each player gets a secret role (3s view)</li>
              <li>Babu and Pulish are revealed to everyone</li>
              <li>Pulish guesses between the two unknown players (25s timer)</li>
              <li>If correct: gets 80 points, culprit gets 0</li>
              <li>If wrong/times out: gets 0 points, culprit gets points</li>
            </ol>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Scoring</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Babu: 100 points (always)</li>
              <li>Pulish (correct): 80 points</li>
              <li>Pulish (wrong): 0 points</li>
              <li>Chor/Dakat (caught): 0 points</li>
              <li>Chor/Dakat (not caught): 40-60 points</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const TipsModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full">
        <div className="border-b border-slate-700 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Pro Tips</h2>
          <button
            onClick={() => setShowTips(false)}
            className="text-slate-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6 space-y-4 text-slate-300">
          <div className="bg-slate-800 rounded-lg p-4 border-l-4 border-yellow-500">
            <h3 className="text-lg font-semibold text-yellow-400 mb-2 flex items-center gap-2">
              <Lightbulb size={20} />
              Consecutive Correct Bonus
            </h3>
            <p className="text-sm md:text-base">
              If the Pulish makes 3 correct guesses in a row, they get an extra <span className="font-bold text-green-400">+100 bonus points</span> on the 3rd correct guess! This is the ultimate reward for reading the other players well.
            </p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-blue-400 mb-2">Strategy Tips</h3>
            <ul className="text-sm md:text-base space-y-2 list-disc list-inside">
              <li>Culprits should bluff and act normally</li>
              <li>Pay attention to suspicious behavior</li>
              <li>Reset happens if Pulish makes one wrong guess</li>
              <li>Consistency in behavior matters</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  if (!gameState.gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-slate-900 rounded-2xl shadow-2xl p-6 md:p-8 max-w-2xl w-full border border-slate-700">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-4xl md:text-4xl font-bold text-white mb-2 whitespace-nowrap">Chor-Dakat-Babu-Pulish</h1>
            <p className="text-slate-400 text-sm md:text-base">4-Player Guessing Game</p>
          </div>

          <div className="space-y-4 mb-8">
            <h2 className="text-lg md:text-xl font-semibold text-white mb-4">Enter Player Names</h2>
            {gameState.playerNames.map((name, idx) => (
              <input
                key={idx}
                type="text"
                value={nameInputs[idx] || ''}
                onChange={(e) => updatePlayerName(idx, e.target.value)}
                onFocus={() => {
                  if (nameInputs[idx] === '') {
                    setNameInputs(prev => ({ ...prev, [idx]: '' }));
                  }
                }}
                onBlur={(e) => {
                  if (!e.target.value.trim()) {
                    setNameInputs(prev => ({ ...prev, [idx]: '' }));
                    setGameState(prev => {
                      const newNames = [...prev.playerNames];
                      newNames[idx] = `Player ${idx + 1}`;
                      return { ...prev, playerNames: newNames };
                    });
                  }
                }}
                className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-white placeholder-slate-500"
                placeholder={`Player ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={startGame}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 rounded-lg transition-all flex items-center justify-center gap-2 mb-4 text-base md:text-lg"
          >
            <Play size={20} />
            Start Game
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowRules(true)}
              className="bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 border border-slate-700 text-sm md:text-base"
            >
              <Book size={18} />
              Rules
            </button>
            <button
              onClick={() => setShowTips(true)}
              className="bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 border border-slate-700 text-sm md:text-base"
            >
              <Lightbulb size={18} />
              Tips
            </button>
          </div>

          <button
            onClick={() => setShowAwards(true)}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-4 rounded-lg transition-all flex items-center justify-center gap-2 mt-4 text-base md:text-lg"
          >
            <Award size={20} />
            Awards
          </button>
        </div>

        {showRules && <RulesModal />}
        {showTips && <TipsModal />}
        {showAwards && <AwardsModal />}
      </div>
    );
  }

  const currentRound = getCurrentRound();
  const pulishPlayer = currentRound?.players.find(p => p.role === 'Pulish');
  const babuPlayer = currentRound?.players.find(p => p.role === 'Babu');

  if (currentRound && viewingPlayerRole !== null) {
    const player = currentRound.players[viewingPlayerRole];

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-slate-900 rounded-2xl shadow-2xl p-6 md:p-8 max-w-md w-full border border-slate-700">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 text-center">Your Role</h2>
          <p className="text-slate-400 text-center mb-8 text-sm md:text-base">
            {player.name}
          </p>

          <div className={`mb-8 p-8 rounded-xl text-center border-2 ${getRoleColor(player.role)}`}>
            <p className="text-5xl md:text-6xl font-bold">{player.role}</p>
          </div>

          <p className="text-slate-400 text-center mb-8 text-sm md:text-base leading-relaxed">
            {player.role === 'Pulish' && 'You are the Police. Guess the culprit based on the round type.'}
            {player.role === 'Babu' && 'You are the Babu. You score 100 points every round!'}
            {player.role === 'Chor' && 'You are the Chor. Avoid being caught by the Police.'}
            {player.role === 'Dakat' && 'You are the Dakat. Avoid being caught by the Police.'}
          </p>
          
          {/* Role View Timer Indicator */}
          <div className="flex justify-center items-center gap-2 mb-6 text-slate-400 text-sm">
            <Clock size={16} />
            <span>Auto-close in {roleTimeLeft}s...</span>
          </div>

          <button
            onClick={() => {
              markPlayerSeenRole(viewingPlayerRole);
            }}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-all text-base md:text-lg"
          >
            Got It!
          </button>
        </div>
      </div>
    );
  }

  if (gameState.gameEnded) {
    const winnerResult = getWinner();
    const lastCompletedRound = gameState.rounds.findLast(r => r.isComplete);
    const isMultipleWinners = Array.isArray(winnerResult);
    const winners = isMultipleWinners ? winnerResult : (winnerResult ? [winnerResult] : []);

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-slate-900 rounded-2xl shadow-2xl p-6 md:p-8 max-w-3xl w-full border border-slate-700">
          <div className="text-center mb-8">
            <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Game Over!</h1>
            {winners.length > 0 && (
              <p className="text-xl md:text-2xl text-slate-300">
                {isMultipleWinners ? (
                  <>
                    <span className="font-bold text-blue-400">{winners.map(w => w.name).join(' & ')}</span> tie with <span className="text-yellow-400 font-bold">{winners[0].totalScore}</span> points each!
                  </>
                ) : (
                  <>
                    <span className="font-bold text-blue-400">{winners[0].name}</span> wins with <span className="text-yellow-400 font-bold">{winners[0].totalScore}</span> points!
                  </>
                )}
              </p>
            )}
          </div>

          <div className="bg-slate-800 rounded-xl p-6 mb-8 border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-4">Final Scores</h2>
            <div className="space-y-3">
              {lastCompletedRound?.players
                .sort((a, b) => b.totalScore - a.totalScore)
                .map((player, idx) => (
                  <div
                    key={player.playerId}
                    className="flex items-center justify-between bg-slate-700 p-4 rounded-lg border border-slate-600"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-2xl font-bold text-slate-500">#{idx + 1}</span>
                      <span className="font-semibold text-slate-100">{player.name}</span>
                      {gameState.badges.bestPulish === player.playerId && (
                        <button
                          onClick={() => setShowBadgeDetail({ badge: 'bestPulish', playerName: player.name })}
                          className="text-green-400 hover:text-green-300 transition cursor-pointer"
                          title="Best Pulish in Town"
                        >
                          <Trophy className="w-5 h-5" />
                        </button>
                      )}
                      {gameState.badges.worstPulish === player.playerId && (
                        <button
                          onClick={() => setShowBadgeDetail({ badge: 'worstPulish', playerName: player.name })}
                          className="text-red-400 hover:text-red-300 transition cursor-pointer"
                          title="Worst Pulish in Town"
                        >
                          <AlertCircle className="w-5 h-5" />
                        </button>
                      )}
                      {gameState.badges.bestShontrashi === player.playerId && (
                        <button
                          onClick={() => setShowBadgeDetail({ badge: 'bestShontrashi', playerName: player.name })}
                          className="text-green-400 hover:text-green-300 transition cursor-pointer"
                          title="Best Shontrashi in Bangladesh"
                        >
                          <Shield className="w-5 h-5" />
                        </button>
                      )}
                      {gameState.badges.worstShontrashi === player.playerId && (
                        <button
                          onClick={() => setShowBadgeDetail({ badge: 'worstShontrashi', playerName: player.name })}
                          className="text-red-400 hover:text-red-300 transition cursor-pointer"
                          title="Worst Shontrashi in Bangladesh"
                        >
                          <AlertCircle className="w-5 h-5" />
                        </button>
                      )}
                      {gameState.badges.bestBabu === player.playerId && (
                        <button
                          onClick={() => setShowBadgeDetail({ badge: 'bestBabu', playerName: player.name })}
                          className="text-purple-400 hover:text-purple-300 transition cursor-pointer"
                          title="Best Babu"
                        >
                          <Trophy className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    <span className="text-2xl font-bold text-yellow-400">{player.totalScore}</span>
                  </div>
                ))}
            </div>
          </div>

          <button
            onClick={resumeGame}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-4 rounded-lg transition-all flex items-center justify-center gap-2 mb-4 text-base md:text-lg"
          >
            <Play size={20} />
            Resume Game
          </button>

          <button
            onClick={resetGame}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 rounded-lg transition-all flex items-center justify-center gap-2 mb-4 text-base md:text-lg"
          >
            <RotateCcw size={20} />
            New Game
          </button>

          <button
            onClick={quitGame}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-4 rounded-lg transition-all flex items-center justify-center gap-2 text-base md:text-lg"
          >
            <X size={20} />
            Quit Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 md:p-6 flex flex-col lg:flex-row lg:gap-6">
      <div className="flex-1 flex flex-col gap-6 order-last lg:order-none w-full">
        <div className="bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-700 flex-1 flex flex-col">
          <div className="bg-slate-950 p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white text-center whitespace-nowrap">Chor-Dakat-Babu-Pulish</h1>
            <p className="text-blue-200 text-center mt-2 text-sm md:text-base">
              Round {gameState.currentRound} - {currentRound?.roundType} Round
            </p>
          </div>

          {currentRound && !allPlayersSeenRoles() && (
            <div className="bg-blue-900 bg-opacity-30 border-b-4 border-blue-500 p-6 md:p-8">
              <h2 className="text-lg md:text-xl font-semibold text-white mb-4 text-center">
                View Your Secret Role
              </h2>
              <p className="text-center text-slate-300 mb-6 text-sm md:text-base">
                Each player needs to view their role privately
              </p>
              <div className="space-y-3">
                {currentRound.players.map(player => (
                  <button
                    key={player.playerId}
                    onClick={() => setViewingPlayerRole(player.playerId)}
                    disabled={currentRound.playersSeenRoles.has(player.playerId)}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-between text-sm md:text-base ${
                      currentRound.playersSeenRoles.has(player.playerId)
                        ? 'bg-green-900 bg-opacity-50 text-green-300 border-2 border-green-700 cursor-default'
                        : 'bg-slate-800 hover:bg-slate-700 border-2 border-blue-600 hover:border-blue-500 text-white'
                    }`}
                  >
                    <span>{player.name}</span>
                    {currentRound.playersSeenRoles.has(player.playerId) ? (
                      <span className="text-sm">✓ Done</span>
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentRound && allPlayersSeenRoles() && !currentRound.rolesRevealed && pulishPlayer && (
            <div className="bg-yellow-900 bg-opacity-20 border-b-4 border-yellow-600 p-6 md:p-8">
              <div className="bg-slate-800 rounded-lg p-4 md:p-6 mb-6 space-y-3 border border-slate-700">
                <div className="flex items-center justify-between pb-3 border-b-2 border-slate-700">
                  <span className="font-semibold text-slate-300 text-sm md:text-base">Known Babu:</span>
                  <span className={`px-3 py-1 rounded-full text-xs md:text-sm font-bold border ${getRoleColor('Babu')}`}>
                    {babuPlayer?.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300 text-sm md:text-base">Known Pulish:</span>
                  <span className={`px-3 py-1 rounded-full text-xs md:text-sm font-bold border ${getRoleColor('Pulish')}`}>
                    {pulishPlayer?.name}
                  </span>
                </div>
              </div>

              <h2 className="text-lg md:text-xl font-semibold text-white mb-2 text-center">
                {pulishPlayer.name}, it's your turn to guess!
              </h2>
              
              {/* Timer Display */}
              <div className="flex justify-center items-center gap-2 mb-4 text-white text-lg font-bold">
                <Clock className={guessTimeLeft <= 10 ? "text-red-500 animate-pulse" : "text-yellow-400"} size={24} />
                <span className={guessTimeLeft <= 10 ? "text-red-500" : "text-yellow-400"}>{guessTimeLeft}s</span>
              </div>

              <p className="text-center text-slate-300 mb-6 font-bold text-base md:text-lg">
                Find the <span className="text-red-400">{currentRound.roundType}</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                {currentRound.players
                  .filter(p => p.role !== 'Pulish' && p.role !== 'Babu')
                  .map(player => (
                    <button
                      key={player.playerId}
                      onClick={() => handlePulishGuess(player.playerId)}
                      className="bg-slate-800 hover:bg-red-900 hover:bg-opacity-50 border-2 border-red-600 hover:border-red-500 text-white font-semibold py-4 px-4 rounded-lg transition-all transform hover:scale-105 text-sm md:text-base"
                    >
                      {player.name}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Action Buttons - Now at the top of the scoreboard and shown for ALL completed rounds */}
          {currentRound?.isComplete && (
            <div className="bg-slate-800 p-4 md:p-6 border-b border-slate-700">
              <div className="flex flex-col md:flex-row gap-3 justify-center">
                <button
                  onClick={nextRound}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-6 rounded-lg transition-all text-sm md:text-base flex-1 md:flex-none"
                >
                  Next Round
                </button>
                <button
                  onClick={finishGame}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 px-6 rounded-lg transition-all text-sm md:text-base flex-1 md:flex-none"
                >
                  Finish Game
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm">
              <thead>
                <tr className="bg-slate-800 border-b-2 border-slate-700">
                  <th className="px-3 md:px-6 py-4 text-left font-semibold text-slate-300">Culprit</th>
                  {gameState.playerNames.map((name, idx) => (
                    <th key={idx} className="px-3 md:px-6 py-4 text-center font-semibold text-slate-300">
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gameState.rounds.slice(0, Math.max(10, gameState.currentRound)).map((round) => (
                  <tr
                    key={round.roundNumber}
                    className={`border-b border-slate-700 ${
                      round.roundNumber === gameState.currentRound && !round.isComplete
                        ? 'bg-blue-900 bg-opacity-20'
                        : 'hover:bg-slate-800 bg-opacity-50'
                    }`}
                  >
                    <td className="px-3 md:px-6 py-4 font-medium text-slate-400">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-slate-500">R{round.roundNumber}</span>
                        <span className={`font-bold text-xs md:text-sm ${
                          round.roundType === 'Chor' ? 'text-orange-400' : 'text-red-400'
                        }`}>
                          {round.roundType}
                        </span>
                      </div>
                    </td>
                    {round.players.map(player => (
                      <td key={player.playerId} className="px-3 md:px-6 py-4 text-center">
                        {round.rolesRevealed ? (
                          <div className="space-y-2">
                            <div className={`inline-block px-2 md:px-3 py-1 rounded-full text-xs font-semibold border ${getRoleColor(player.role)}`}>
                              {player.role}
                            </div>
                            <div className="font-bold text-xs sm:text-sm md:text-lg text-slate-200">
                              {player.score}
                            </div>
                          </div>
                        ) : round.roundNumber === gameState.currentRound ? (
                          <div className="text-2xl text-slate-500">•••</div>
                        ) : (
                          <div className="text-slate-600">-</div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}

                <tr className="bg-slate-950 border-t-2 border-slate-700 text-white font-bold">
                  <td className="px-3 md:px-6 py-4 text-base">Total</td>
                  {gameState.playerNames.map((_, idx) => {
                    const lastRound = gameState.rounds.findLast(r => r.isComplete);
                    const total = lastRound?.players[idx]?.totalScore || 0;
                    return (
                      <td key={idx} className="px-3 md:px-6 py-4 text-center text-base md:text-lg text-yellow-400">
                        {total}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Player Corners - Desktop Only */}
      <div className="hidden lg:flex flex-col gap-6 w-72">
        <div className="grid grid-cols-2 gap-4">
          {currentRound && currentRound.players[0] && (
            <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl shadow-lg p-4 border-2 border-blue-600 hover:border-blue-400 transition min-h-40">
              <p className="text-xs font-semibold text-blue-200 mb-1">PLAYER 1</p>
              <h3 className="text-lg font-bold text-white mb-3 truncate">{currentRound.players[0].name}</h3>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-yellow-400">{currentRound.players[0].totalScore}</div>
                <div className="text-xs text-blue-200">Score</div>
              </div>
            </div>
          )}
          {currentRound && currentRound.players[1] && (
            <div className="bg-gradient-to-br from-green-900 to-green-800 rounded-xl shadow-lg p-4 border-2 border-green-600 hover:border-green-400 transition min-h-40">
              <p className="text-xs font-semibold text-green-200 mb-1">PLAYER 2</p>
              <h3 className="text-lg font-bold text-white mb-3 truncate">{currentRound.players[1].name}</h3>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-yellow-400">{currentRound.players[1].totalScore}</div>
                <div className="text-xs text-green-200">Score</div>
              </div>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {currentRound && currentRound.players[2] && (
            <div className="bg-gradient-to-br from-orange-900 to-orange-800 rounded-xl shadow-lg p-4 border-2 border-orange-600 hover:border-orange-400 transition min-h-40">
              <p className="text-xs font-semibold text-orange-200 mb-1">PLAYER 3</p>
              <h3 className="text-lg font-bold text-white mb-3 truncate">{currentRound.players[2].name}</h3>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-yellow-400">{currentRound.players[2].totalScore}</div>
                <div className="text-xs text-orange-200">Score</div>
              </div>
            </div>
          )}
          {currentRound && currentRound.players[3] && (
            <div className="bg-gradient-to-br from-red-900 to-red-800 rounded-xl shadow-lg p-4 border-2 border-red-600 hover:border-red-400 transition min-h-40">
              <p className="text-xs font-semibold text-red-200 mb-1">PLAYER 4</p>
              <h3 className="text-lg font-bold text-white mb-3 truncate">{currentRound.players[3].name}</h3>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-yellow-400">{currentRound.players[3].totalScore}</div>
                <div className="text-xs text-red-200">Score</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Player Cards */}
      {currentRound && (
        <div className="lg:hidden grid grid-cols-2 gap-4 mt-6 w-full">
          {currentRound.players.map((player, idx) => {
            const colors = [
              { bg: 'from-blue-900 to-blue-800', border: 'border-blue-600', label: 'text-blue-200' },
              { bg: 'from-green-900 to-green-800', border: 'border-green-600', label: 'text-green-200' },
              { bg: 'from-orange-900 to-orange-800', border: 'border-orange-600', label: 'text-orange-200' },
              { bg: 'from-red-900 to-red-800', border: 'border-red-600', label: 'text-red-200' }
            ];
            const color = colors[idx];
            return (
              <div key={player.playerId} className={`bg-gradient-to-br ${color.bg} rounded-xl shadow-lg p-4 border-2 ${color.border} hover:shadow-xl transition`}>
                <p className={`text-xs font-semibold ${color.label} mb-1`}>PLAYER {idx + 1}</p>
                <h3 className="text-sm font-bold text-white mb-2 truncate">{player.name}</h3>
                <div className="space-y-1">
                  <div className="text-xl font-bold text-yellow-400">{player.totalScore}</div>
                  <div className="text-xs text-slate-300">Score</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Guess Result Modal */}
      <GuessResultModal />
      {/* Desh Rotno Modal */}
      <DeshRotnoModal />
      {/* Badge Notification Modal */}
      <BadgeNotificationModal />
      {/* Badge Detail Modal */}
      <BadgeDetailModal />
      {/* Awards Modal */}
      <AwardsModal />
    </div>
  );
}