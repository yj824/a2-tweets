function parseTweets(runkeeper_tweets) {
    if (runkeeper_tweets === undefined) {
        window.alert("No tweets returned");
        return;
    }

    const tweet_array = runkeeper_tweets.map(function(tweet) {
        return new Tweet(tweet.text, tweet.created_at);
    });

    document.getElementById("numberTweets").textContent = tweet_array.length;

    // Find the earliest and latest dates without assuming the tweets are sorted.
    if (tweet_array.length > 0) {
        let firstDate = tweet_array[0].time;
        let lastDate = tweet_array[0].time;

        tweet_array.forEach(function(tweet) {
            if (tweet.time < firstDate) {
                firstDate = tweet.time;
            }

            if (tweet.time > lastDate) {
                lastDate = tweet.time;
            }
        });

        // Use UTC so the displayed dates are consistent across time zones.
        const options = {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            timeZone: "UTC"
        };

        document.getElementById("firstDate").textContent =
            firstDate.toLocaleDateString("en-US", options);

        document.getElementById("lastDate").textContent =
            lastDate.toLocaleDateString("en-US", options);
    } else {
        document.getElementById("firstDate").textContent = "N/A";
        document.getElementById("lastDate").textContent = "N/A";
    }

    const categories = [
        {source: "completed_event", className: "completedEvents"},
        {source: "live_event", className: "liveEvents"},
        {source: "achievement", className: "achievements"},
        {source: "miscellaneous", className: "miscellaneous"}
    ];

    // Calculate each category's count and percentage, then update the page.
    categories.forEach(function(category) {
        const count = tweet_array.filter(function(tweet) {
            return tweet.source === category.source;
        }).length;

        const percentage = tweet_array.length === 0
            ? 0
            : count / tweet_array.length * 100;

        document.querySelectorAll("." + category.className).forEach(function(element) {
            element.textContent = count;
        });

        document.querySelectorAll("." + category.className + "Pct").forEach(function(element) {
            element.textContent = percentage.toFixed(2) + "%";
        });
    });

    // Use completed events as the denominator for the user-written percentage.
    const completed = tweet_array.filter(function(tweet) {
        return tweet.source === "completed_event";
    });

    const writtenCount = completed.filter(function(tweet) {
        return tweet.written;
    }).length;

    const writtenPercentage = completed.length === 0
        ? 0
        : writtenCount / completed.length * 100;

    document.querySelectorAll(".written").forEach(function(element) {
        element.textContent = writtenCount;
    });

    document.querySelectorAll(".writtenPct").forEach(function(element) {
        element.textContent = writtenPercentage.toFixed(2) + "%";
    });
}

// Load and process the tweets after the page elements are ready.
document.addEventListener("DOMContentLoaded", function() {
    loadSavedRunkeeperTweets().then(parseTweets);
});