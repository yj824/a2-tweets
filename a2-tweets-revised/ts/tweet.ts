class Tweet {
    private text: string;
    time: Date;

    constructor(tweet_text: string, tweet_time: string) {
        this.text = tweet_text;
        this.time = new Date(tweet_time);
    }

    // Classify the tweet using common RunKeeper message prefixes.
    get source(): string {
        const text = this.text.toLowerCase();

        if (text.startsWith("just completed ") || text.startsWith("just posted ")) {
            return "completed_event";
        }

        if (text.startsWith("watch my ")) {
            return "live_event";
        }

        if (text.startsWith("achieved a new ") || text.startsWith("i just set a goal ")) {
            return "achievement";
        }

        return "miscellaneous";
    }

    get written(): boolean {
        return this.writtenText.length > 0;
    }

    // Extract the user's description and exclude automatic messages.
    get writtenText(): string {
        let text = this.text;

        if (this.source === "completed_event") {
            const separator = text.indexOf(" - ");

            if (separator === -1) {
                return "";
            }

            text = text.substring(separator + 3);
        } else if (
            this.source === "live_event" ||
            this.source === "achievement" ||
            text.toLowerCase().startsWith("just linked ")
        ) {
            return "";
        }

        // Remove URLs and the RunKeeper hashtag from the description.
        text = text.split(/\s+/).filter(function(word) {
            return !word.startsWith("http://") &&
                !word.startsWith("https://") &&
                word.toLowerCase() !== "#runkeeper";
        }).join(" ").trim();

        // Exclude default text added by the device or app.
        if (
            text === "TomTom MySports Watch" ||
            text === "with @Runkeeper. Check it out!"
        ) {
            return "";
        }

        return text;
    }

    // Extract the activity name from distance-based or duration-based tweets.
    get activityType(): string {
        if (this.source !== "completed_event") {
            return "unknown";
        }

        const words = this.text.split(/\s+/);
        let start = 3;

        if (words[4] === "km" || words[4] === "mi") {
            start = 5;
        }

        let activity = words.slice(start).join(" ");
        const endings = [" - ", " with ", " in ", " http://", " https://", " #"];

        endings.forEach(function(ending) {
            const position = activity.indexOf(ending);

            if (position !== -1) {
                activity = activity.substring(0, position);
            }
        });

        return activity.trim().toLowerCase() || "unknown";
    }

    // Return the distance in miles, or zero when no distance is available.
    get distance(): number {
        if (this.source !== "completed_event") {
            return 0;
        }

        const words = this.text.split(/\s+/);
        const distance = parseFloat(words[3]);

        if (!Number.isFinite(distance)) {
            return 0;
        }

        if (words[4] === "km") {
            return distance / 1.609;
        }

        if (words[4] === "mi") {
            return distance;
        }

        return 0;
    }

    // Build a table row using DOM elements to keep tweet text safely escaped.
    getHTMLTableRow(rowNumber: number): string {
        const row = document.createElement("tr");
        const numberCell = document.createElement("th");
        const activityCell = document.createElement("td");
        const tweetCell = document.createElement("td");

        numberCell.scope = "row";
        numberCell.textContent = rowNumber.toString();
        activityCell.textContent = this.activityType;

        // Turn URLs into clickable links while preserving the original spacing.
        this.text.split(/(\s+)/).forEach(function(part) {
            if (part.startsWith("https://") || part.startsWith("http://")) {
                const link = document.createElement("a");
                link.href = part;
                link.textContent = part;
                tweetCell.appendChild(link);
            } else {
                tweetCell.appendChild(document.createTextNode(part));
            }
        });

        row.appendChild(numberCell);
        row.appendChild(activityCell);
        row.appendChild(tweetCell);

        return row.outerHTML;
    }
}