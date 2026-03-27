# Chor Dakat Babu Pulish
A 4-player guessing game with rotating roles and point-based scoring.

## Game Overview
A fun pass-and-play party game where 4 players take on secret roles each round. The goal? The Pulish (Police) must identify the culprit while others try to evade capture!

## Live Demo
**https://swarup113.github.io/chor-dakat-babu-pulish/**

## Roles
| Role | Description |
|------|-------------|
| **Babu** | Immune player - always earns 100 points |
| **Pulish** | The guesser - must find the culprit |
| **Chor** | Thief - target in Chor rounds |
| **Dakat** | Bandit - target in Dakat rounds |

## Rules
Round Types
- Chor Round: Pulish must find the Chor
- Dakat Round: Pulish must find the Dakat
- Rounds alternate for 10 total rounds

## Scoring
| Player | Points Earned |
|--------|---------------|
| Babu | Always 100 points |
| Pulish (correct guess) | 80 points |
| Pulish (wrong guess) | 0 points |
| Target Culprit (caught) | 0 points |
| Target Culprit (escapes) | Chor: 40 / Dakat: 60 |
| Non-target Culprit | Chor: 40 / Dakat: 60 (immune) |



## How to Play
- Enter player names (or use defaults)
- Each player secretly views their role by clicking their button
- After all players view roles, Babu and Pulish are revealed
- Pulish has 30 seconds to guess who the culprit is
- Points are awarded based on the result
- Repeat for 10 rounds
- Player with highest score wins!

## Features
- Pass-and-play local multiplayer
- Random role assignment each round
- 30-second timer for guesses
- Score tracking across rounds
- Dark theme UI
- Responsive design
- No dependencies required

## Built With
- HTML5
- CSS3
- Vanilla JavaScript

## License
- MIT License
