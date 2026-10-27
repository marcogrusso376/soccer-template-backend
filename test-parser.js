
const fs = require("fs");
const cheerio = require("cheerio");
const path = require("path");

const htmlFile =
    "./view-source_https___premier.upsl.com_teams_boston-street-fc-994233__utm_source=chatgpt.com.html";

const source = fs.readFileSync(htmlFile, "utf8");

// Extract the original HTML from Chrome's View Source wrapper.
const viewSource = cheerio.load(source);
const lines = [];

viewSource("td.line-content").each((_, element) => {
    lines.push(viewSource(element).text());
});

const html = lines.length > 0 ? lines.join("\n") : source;
const $ = cheerio.load(html);

// 1. Read the team record.
const record = {};

$(".single-team__record-tile").each((_, tile) => {
    const label = $(tile)
        .find(".single-team__record-label")
        .text()
        .trim()
        .toLowerCase();

    const value = $(tile)
        .find(".single-team__record-value")
        .text()
        .trim();

    if (label && value) {
        record[label] = Number(value);
    }
});

// 2. Read the schedule.
const matches = [];

$("#single-team-schedule tbody tr").each((_, row) => {
    const cells = $(row).children("td");

    if (cells.length < 8) return;

    const getTeamName = (cell) =>
        $(cell).find("a").first()
            .clone()
            .children()
            .remove()
            .end()
            .text()
            .replace(/\s+/g, " ")
            .trim();

    const getLogo = (cell) =>
        $(cell).find("img").first().attr("src") || null;

    const getScore = (cell) => {
        const value = $(cell).text().trim();
        return value === "" ? null : Number(value);
    };

    const homeCell = cells.eq(0);
    const awayCell = cells.eq(1);

    matches.push({
        home: getTeamName(homeCell),
        away: getTeamName(awayCell),
        homeLogo: getLogo(homeCell),
        awayLogo: getLogo(awayCell),
        date: cells.eq(2).text().trim(),
        dateTimestamp: cells.eq(2).attr("data-sort") || null,
        time: cells.eq(3).text().trim(),
        homeScore: getScore(cells.eq(4)),
        awayScore: getScore(cells.eq(5)),
        venue: cells.eq(6).text().trim(),
        status: cells.eq(7).text().trim()
    });
});

// 3. Read the staff.
const staff = [];

$(".single-team__roster-players.single-team__roster-coaches")
    .find(".single-team__roster-player")
    .each((_, element) => {
        const person = $(element);

        staff.push({
            name: person
                .find(".single-team__roster-player-name")
                .text()
                .replace(/\s+/g, " ")
                .trim(),
            title: person
                .find(".single-team__roster-player-title")
                .text()
                .replace(/\s+/g, " ")
                .trim(),
            image: person.find("img").first().attr("src") || null
        });
    });


/* 4. Read the actual player roster. */
const players = [];

const rosterHeading = $(".single-team__heading").filter((_, heading) =>
    $(heading).text().trim().startsWith("Roster")
).first();

const rosterList = rosterHeading.next(".single-team__roster-list");
const playerGroup = rosterList.children(".single-team__roster-players")
    .not(".single-team__roster-coaches");

playerGroup.find("> .single-team__roster-player").each((_, element) => {
    const player = $(element);

    const name = player
        .find(".single-team__roster-player-name")
        .first()
        .text()
        .replace(/\s+/g, " ")
        .trim();

    const appearances = player.attr("data-appearences");

    players.push({
        name,
        position: player
            .find(".single-team__roster-player-title")
            .first()
            .text()
            .replace(/\s+/g, " ")
            .trim(),
        appearances: appearances === undefined
            ? null
            : Number(appearances),
        image: player.find(".single-team__player-image img")
            .first().attr("src") || null,
        nationality: player.find(".single-team__roster-flag")
            .first().attr("title") || null
    });
});

/* 5. Print the parsed data. */
console.log("\nPARSED DATA SUMMARY:");

console.log(JSON.stringify({
    record,
    matchCount: matches.length,
    matches: matches.slice(0, 3),
    staffCount: staff.length,
    staff,
    playerCount: players.length,
    players: players.slice(0, 5)
}, null, 2));


const output = {
    team: "Boston Street FC",
    source: "Saved UPSL HTML snapshot",
    record,
    matches,
    staff,
    players
};

fs.writeFileSync(
    path.join(__dirname, "upsl-team-data.json"),
    JSON.stringify(output, null, 2),
    "utf8"
);

console.log("\nSaved data to upsl-team-data.json");