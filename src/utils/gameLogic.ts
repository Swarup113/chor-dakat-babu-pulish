import { Role, RoundType, PlayerScore } from '../types/game';

export const ROLES: Role[] = ['Chor', 'Dakat', 'Babu', 'Pulish'];

export function shuffleRoles(): Role[] {
  const roles = [...ROLES];
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }
  return roles;
}

export function getRoundType(roundNumber: number): RoundType {
  return roundNumber % 2 === 1 ? 'Chor' : 'Dakat';
}

export function calculateScore(
  role: Role,
  roundType: RoundType,
  isPulishCorrect: boolean
): number {
  if (role === 'Babu') {
    return 100;
  }

  if (role === 'Pulish') {
    return isPulishCorrect ? 80 : 0;
  }

  if (role === 'Chor') {
    if (roundType === 'Chor') {
      return isPulishCorrect ? 0 : 40;
    }
    return 40;
  }

  if (role === 'Dakat') {
    if (roundType === 'Dakat') {
      return isPulishCorrect ? 0 : 60;
    }
    return 60;
  }

  return 0;
}

export function findPlayerWithRole(players: PlayerScore[], role: Role): number | null {
  const player = players.find(p => p.role === role);
  return player ? player.playerId : null;
}

export function getCulpritRole(roundType: RoundType): Role {
  return roundType;
}

export function getRoleColor(role: Role | null): string {
  if (!role) return 'bg-gray-100 text-gray-400';

  switch (role) {
    case 'Babu':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    case 'Pulish':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'Chor':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'Dakat':
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}