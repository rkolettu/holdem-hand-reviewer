import { type Card, suits } from '../cards';
export const POSITIONS = ['UTG', 'MP', 'HJ', 'CO', 'BTN', 'SB', 'BB'] as const;
export const PLAYSTYLES = [
  'Tight-Aggressive',
  'Loose-Aggressive',
  'Calling Station',
  'Nit',
] as const;
export type Position = (typeof POSITIONS)[number];
export type Playstyle = (typeof PLAYSTYLES)[number];
export const BASE_RANGES: Record<Playstyle, number> = {
  Nit: 5,
  'Tight-Aggressive': 15,
  'Loose-Aggressive': 30,
  'Calling Station': 40,
};
const positionMultiplier: Record<Position, number> = {
  UTG: 0.7,
  MP: 1,
  HJ: 1.1,
  CO: 1.25,
  BTN: 1.5,
  SB: 1.2,
  BB: 1.1,
};
const descending = [
  'A',
  'K',
  'Q',
  'J',
  'T',
  '9',
  '8',
  '7',
  '6',
  '5',
  '4',
  '3',
  '2',
];
// An explicit nested, combo-weighted model, not a GTO chart or measured population.
// The premium tier is followed by broadway, suited aces, pairs and connectors.
const priority =
  `AA KK QQ JJ AKs TT AQs AKo AJs KQs 99 ATs AQo KJs QJs 88 KTs AJo A9s QTs JTs KQo 77 A8s ATo A7s A5s A4s A6s A3s A2s K9s T9s Q9s J9s 66 KJo K8s QJo 98s KTo QTo JTo 55 K7s K6s K5s K4s K3s K2s Q8s J8s T8s 87s A9o 44 Q7s Q6s 97s 76s A8o 33 Q5s Q4s Q3s Q2s J7s T7s 86s 65s A7o 22 A5o A4o A6o A3o A2o K9o Q9o J9o T9o 96s 75s 54s 64s J6s J5s J4s J3s J2s 98o K8o Q8o T6s 85s 53s 43s`.split(
    ' ',
  );
const classCount = (hand: string) =>
  hand.length === 2 ? 6 : hand.endsWith('s') ? 4 : 12;
const allClasses: string[] = [];
for (let i = 0; i < 13; i++)
  for (let j = i; j < 13; j++) {
    if (i === j) allClasses.push(descending[i] + descending[j]);
    else
      allClasses.push(
        descending[i] + descending[j] + 's',
        descending[i] + descending[j] + 'o',
      );
  }
// Weak remaining hands are ordered deterministically by high card, then low card.
const orderedClasses = [
  ...priority,
  ...allClasses.filter((h) => !priority.includes(h)),
];
function toRank(rank: string): Card['rank'] {
  return (rank === 'T' ? '10' : rank) as Card['rank'];
}
function expand(hand: string): [Card, Card][] {
  const combos: [Card, Card][] = [];
  for (let a = 0; a < 4; a++)
    for (let b = 0; b < 4; b++) {
      if (hand.length === 2 ? a >= b : hand[2] === 's' ? a !== b : a === b)
        continue;
      combos.push([
        { rank: toRank(hand[0]), suit: suits[a] },
        { rank: toRank(hand[1]), suit: suits[b] },
      ]);
    }
  return combos;
}
export function generateOpponentRange(
  position: Position,
  playstyle: Playstyle,
) {
  if (!POSITIONS.includes(position) || !PLAYSTYLES.includes(playstyle))
    throw new Error('Unknown opponent profile.');
  const basePercent = BASE_RANGES[playstyle];
  const targetPercent = Math.min(
    100,
    Math.max(1, basePercent * positionMultiplier[position]),
  );
  const targetCombos = (1326 * targetPercent) / 100;
  let count = 0;
  const handClasses: string[] = [];
  for (const hand of orderedClasses) {
    const next = count + classCount(hand);
    if (
      count > 0 &&
      Math.abs(next - targetCombos) > Math.abs(count - targetCombos)
    )
      break;
    handClasses.push(hand);
    count = next;
  }
  const combinations = handClasses.flatMap(expand);
  const selected = new Set(handClasses);
  const matrix = descending.map((a, i) =>
    descending.map((b, j) => {
      const hand = i === j ? a + b : i < j ? a + b + 's' : b + a + 'o';
      return {
        hand,
        selected: selected.has(hand),
        combinations: classCount(hand),
      };
    }),
  );
  return {
    position,
    playstyle,
    basePercent,
    targetPercent,
    percentage: (combinations.length / 1326) * 100,
    handClasses,
    combinations,
    matrix,
  };
}
export type OpponentRange = ReturnType<typeof generateOpponentRange>;
