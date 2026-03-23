import { LegendDefinition } from '../engine/gameState';

export const LORD_OF_FURY: LegendDefinition = {
  id: 'legend-lord-of-fury',
  name: 'Lord of Fury',
  domainIdentity: ['Fury'],
  tag: 'Fury Commander',
  text: 'Fury units you control enter the board Ready.',
};

export const WARDEN_OF_CALM: LegendDefinition = {
  id: 'legend-warden-of-calm',
  name: 'Warden of Calm',
  domainIdentity: ['Calm'],
  tag: 'Calm Sentinel',
  text: 'At the start of your Beginning Phase, you may heal 1 damage from a unit you control.',
};
