export default {
    GOLDEN_CMDS_COMMON_PER_LANG: 2, // Number of very common commands to include
    GOLDEN_CMDS_RANDOM_PER_LANG: 1, // Number of totally random commands to include per language
    GOLDEN_CMDS_MAX_LENGTH: 7, // Max string length that a golden command can be
    GOLDEN_CMDS_PREVIEW_TIME: 21300,
    SCORE_PER_COMMAND: 10,
    SCORE_OVERALL_MULTIPLIER: 100,
    SCORE_GOLDEN_COMMAND_MULTIPLIER: 10,
    DELAY_BEFORE_FIRE: 15000, // Minimum time the game has be be running before fire can display,
    GAME_DURATION: 60000,
    FIRE_CPS_THRESHOLD: 2.5,  // Number of valid characters per-second a player must average to get fire
};
