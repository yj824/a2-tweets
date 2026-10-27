let writtenTweets = [];

function parseTweets(runkeeper_tweets) {
    if (runkeeper_tweets === undefined) {
        window.alert("No tweets returned");
        return;
    }

    // Keep tweets containing user-written text for searching.
    writtenTweets = runkeeper_tweets.map(function(tweet) {
        return new Tweet(tweet.text, tweet.created_at);
    }).filter(function(tweet) {
        return tweet.written;
    });

    updateSearch();
}

function updateSearch() {
    const searchText = document.getElementById("textFilter").value;
    const query = searchText.toLowerCase();
    let matches = [];

    // Search descriptions without case sensitivity; blank input leaves no matches.
    if (query.trim() !== "") {
        matches = writtenTweets.filter(function(tweet) {
            return tweet.writtenText.toLowerCase().includes(query);
        });
    }

    // Update the matching count and display the current search text.
    document.getElementById("searchCount").textContent = matches.length;
    document.getElementById("searchText").textContent = searchText;

    // Replace the table contents and number the current results from one.
    document.getElementById("tweetTable").innerHTML = matches.map(function(tweet, index) {
        return tweet.getHTMLTableRow(index + 1);
    }).join("");
}

function addEventHandlerForSearch() {
    // Update results whenever the user types, pastes, or deletes text.
    document.getElementById("textFilter").addEventListener("input", updateSearch);
    updateSearch();
}

document.addEventListener("DOMContentLoaded", function() {
    addEventHandlerForSearch();
    loadSavedRunkeeperTweets().then(parseTweets);
});