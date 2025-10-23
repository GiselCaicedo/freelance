import { TRANSITION_COLORS } from './transitions';

export const iconButtonBase = (compact?: boolean) =>
  `${compact ? 'p-1.5' : 'p-2'} rounded-lg ring-1 ring-inset ${TRANSITION_COLORS}`;
