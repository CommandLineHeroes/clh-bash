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

async function record({ name, score, tribe }) {
    if (state.storage == STORAGE_TYPES.local) {
        return await recordLocal({ name, score, tribe });
    } else if (state.storage == STORAGE_TYPES.parse) {
        return await recordParse({ name, score, tribe });
    }
}

async function recordLocal({ name, score, tribe }) {
    console.log(`recording leaderboard entry in localstorage`, {
        name,
        score,
        tribe
    });

    const leaders = JSON.parse(localStorage.getItem(state.name)) || [];
    leaders.push({
        name: name,
        score: app.score,
        tribe: tribe
    });
    localStorage.setItem(state.name, JSON.stringify(leaders));
}

async function recordParse({ name, score, tribe }) {
    console.log(`recording leaderboard entry in parse`, { name, score, tribe });

    const response = await fetch(`${config.PARSE_URL}/classes/${state.name}`, {
        method: "POST",
        headers: {
            "X-Parse-Application-Id": config.PARSE_APPID,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, score, tribe })
    });

    const responseJson = await response.json();
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
    return formatLeaders(leaders);
}

async function getParse() {
    const response = await fetch(
        `${config.PARSE_URL}/classes/${state.name}?limit=10000`,
        {
            method: "GET",
            headers: {
                "X-Parse-Application-Id": config.PARSE_APPID
            }
        }
    );

    const scores = await response.json();

    return formatLeaders(scores.results);
}

function formatLeaders(leaders) {
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
    return {
        leaders,
        hiScores,
        topHiScore,
        lowestHiScore,
        isEmpty
    };
}

export default {
    init,
    record,
    get
};
