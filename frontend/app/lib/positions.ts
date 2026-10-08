export const VOLLEYBALL_POSITIONS = [
    'Outside Hitter',
    'Middle Blocker',
    'Setter',
    'Libero',
    'Defensive Specialist',
] as const;

export type VolleyballPosition = (typeof VOLLEYBALL_POSITIONS)[number];

export const ANY_POSITION_LABEL = 'Any Position';

export function isVolleyballPosition(position: string): position is VolleyballPosition {
    return (VOLLEYBALL_POSITIONS as readonly string[]).includes(position);
}

export function getPositionTags(positions: string[]): string[] {
    return positions.length > 0 ? positions : [ANY_POSITION_LABEL];
}
