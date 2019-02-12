export default {
    GOLDEN_CMDS_COMMON_PER_LANG: 2, // Number of very common commands to include
    GOLDEN_CMDS_RANDOM_PER_LANG: 1, // Number of totally random commands to include per language
    GOLDEN_CMDS_MAX_LENGTH: 7, // Max string length that a golden command can be
    GOLDEN_CMDS_PREVIEW_TIME: 21300,
    SCORE_PER_COMMAND: 10,
    SCORE_OVERALL_MULTIPLIER: 100,
    SCORE_GOLDEN_COMMAND_MULTIPLIER: 10,
    GAME_DURATION: 60000,
    FIRE_DELAY_BEFORE: 5000, // Minimum time the game has be be running before fire can display,
    FIRE_CHECK_INTERVAL: 5000, // how often to check if fire should be turned up
    FIRE_CPS_THRESHOLD: 1.75, // Number of valid characters per-second a player must average to get fire
    FIRE_STAGE_ZERO: 0,
    FIRE_STAGE_ONE: 1,
    FIRE_STAGE_TWO: 2,
    FIRE_STAGE_THREE: 3,
    FIRE_STAGE_TWEEN_TIME: 2000, // how long to tween between fire stages
    CHAR_APPEAR_DELAY: 60, // ms between characters appearing on screen
    MAX_LEADER_NAME_LENGTH: 20 // max length of names on leaderboard
};
