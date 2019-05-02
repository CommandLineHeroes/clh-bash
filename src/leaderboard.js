import config from "./config.js";

const STORAGE_TYPES = {
    local: 0,
    parse: 1
};

const state = {
    storage: STORAGE_TYPES.local,
    name: config.LEADERBOARD_NAMESPACE_DEFAULT
};

function init() {
    const urlParams = new URLSearchParams(window.location.search);

    // handle the leaderboard namespace param
    if (urlParams.has("name")) {
        const qsName = urlParams.get("name");
        console.assert(
            qsName.trim().length,
            "invalid ?name value: must not be empty"
        );
        state.name = qsName;
    }

    // handle the leaderboard storage param
    if (urlParams.has("storage")) {
        const qsStorage = urlParams.get("storage");
        console.assert(
            STORAGE_TYPES.hasOwnProperty(qsStorage),
            `invalid ?storage value provided, must be one of: ${Object.keys(
                STORAGE_TYPES
            )}`
        );
        state.storage = STORAGE_TYPES[qsStorage];
    }
}

function record({ name, score, tribe }) {
    console.log(`recording leaderboard entry`, { name, score, tribe });

    const leaders = JSON.parse(localStorage.getItem(state.name)) || [];
    leaders.push({
        name: name,
        score: app.score,
        tribe: tribe
    });
    localStorage.setItem(state.name, JSON.stringify(leaders));
}

async function get() {
    if (state.storage == STORAGE_TYPES.local) {
        return await getLocal();
    } else if (state.storage == STORAGE_TYPES.parse) {
        return await getParse();
    }
}

async function getLocal() {
    // First get the current scores from localStorage
    let leaders = JSON.parse(localStorage.getItem(state.name));
    leaders = _.reverse(_.sortBy(leaders, "score"));
    const hiScores = _(leaders)
        .sortBy("score")
        .reverse()
        .uniqBy("name")
        .take(10)
        .map("score")
        .value();
    const lowestHiScore = _.min(hiScores);
    const topHiScore = _.max(hiScores);
    const isEmpty = leaders.length === 0;
    const r = {
        leaders,
        hiScores,
        topHiScore,
        lowestHiScore,
        isEmpty
    };
    console.log(r);
    return r;
}

async function getParse() {
    return {
        leaders: [],
        hiScores: [],
        topHiScore: 1,
        lowestHiScore: 0,
        isEmpty: true
    };
}

export default {
    init,
    record,
    get
};
