export const TEAM_NAME_MIN_LENGTH = 3;
export const TEAM_NAME_MAX_LENGTH = 30;
export const TEAM_MIN_POKEMON = 1;
export const TEAM_MAX_POKEMON = 6;

/**
 * This task has no authentication, so there is no real "current user". The
 * seed data's first trainer (Ash Ketchum, id 1) is treated as the acting
 * trainer for fetching/creating teams — see README for this assumption.
 */
export const CURRENT_TRAINER_ID = 1;
