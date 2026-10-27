
const cheerio = require("cheerio");

module.exports = async function handler(req, res) {
    try {
        const url =
            "https://premier.upsl.com/teams/boston-street-fc-994233/";

        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Accept": "text/html"
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({
                success: false,
                error: "UPSL page returned an error",
                status: response.status
            });
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        const matches = [];

        $("#single-team-schedule tbody tr").each((i, row) => {
            const cells = $(row).children("td");

            if (cells.length < 8) return;

            const homeCell = $(cells[0]);
            const awayCell = $(cells[1]);

            const homeLink = homeCell.find("a").first();
            const awayLink = awayCell.find("a").first();

            const getTeamName = (cell) =>
                cell.find("a").first()
                    .clone()
                    .children()
                    .remove()
                    .end()
                    .text()
                    .trim();

            const getLogo = (cell) =>
                cell.find("img").first().attr("src") || null;

            const getScore = (cell) => {
                const value = $(cell).text().trim();
                return value === "" ? null : Number(value);
            };

            const statusCell = $(cells[7]);

            matches.push({
                home: getTeamName(homeCell),
                away: getTeamName(awayCell),
                homeLogo: getLogo(homeCell),
                awayLogo: getLogo(awayCell),
                date: $(cells[2]).text().trim(),
                dateTimestamp:
                    $(cells[2]).attr("data-sort") || null,
                time: $(cells[3]).text().trim(),
                homeScore: getScore(cells[4]),
                awayScore: getScore(cells[5]),
                venue: $(cells[6]).text().trim(),
                status: statusCell.text().trim(),
                matchUrl:
                    homeLink.attr("href") ||
                    awayLink.attr("href") ||
                    null
            });
        });

        return res.status(200).json({
            success: true,
            team: "Boston Street FC",
            matchCount: matches.length,
            matches
        });

    } catch (error) {
        console.error("UPSL fetch failed:", error);

        return res.status(500).json({
            success: false,
            error: "Failed to fetch UPSL data"
        });
    }
};
