
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

        const title = $("title").text().trim();
        const headings = [];

        $("h1, h2, h3, h4").each((i, element) => {
            const heading = $(element).text().trim();

            if (heading) {
                headings.push(heading);
            }
        });

        return res.status(200).json({
            success: true,
            pageTitle: title,
            htmlLength: html.length,
            headings: headings,
            htmlReceived: true
        });

    } catch (error) {
        console.error("UPSL fetch failed:", error);

        return res.status(500).json({
            success: false,
            error: "Failed to fetch UPSL data"
        });
    }
};
