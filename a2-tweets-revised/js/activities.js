function parseTweets(runkeeper_tweets) {
    if (runkeeper_tweets === undefined) {
        window.alert("No tweets returned");
        return;
    }

    const tweet_array = runkeeper_tweets.map(function(tweet) {
        return new Tweet(tweet.text, tweet.created_at);
    });

    const completed = tweet_array.filter(function(tweet) {
        return tweet.source === "completed_event";
    });

    const counts = {};

    // Count completed tweets for each recognized activity type.
    completed.forEach(function(tweet) {
        const type = tweet.activityType;

        if (type !== "unknown") {
            counts[type] = (counts[type] || 0) + 1;
        }
    });

    // Convert the counts into chart data and sort by frequency.
    const activityData = Object.keys(counts).map(function(type) {
        return {
            activityType: type,
            count: counts[type]
        };
    }).sort(function(a, b) {
        return b.count - a.count;
    });

    const topTypes = activityData.slice(0, 3).map(function(activity) {
        return activity.activityType;
    });

    document.getElementById("numberActivities").textContent = activityData.length;
    document.getElementById("firstMost").textContent = topTypes[0] || "N/A";
    document.getElementById("secondMost").textContent = topTypes[1] || "N/A";
    document.getElementById("thirdMost").textContent = topTypes[2] || "N/A";

    // Display the number of tweets for each activity in a horizontal bar chart.
    const activity_vis_spec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        data: {
            values: activityData
        },
        mark: "bar",
        width: 500,
        height: {
            step: 20
        },
        encoding: {
            x: {
                field: "count",
                type: "quantitative",
                title: "Number of tweets"
            },
            y: {
                field: "activityType",
                type: "nominal",
                sort: "-x",
                title: "Activity type"
            }
        }
    };

    vegaEmbed("#activityVis", activity_vis_spec, {actions: false});

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Keep valid distances for the top three activities and label their UTC weekdays.
    const distanceData = completed.filter(function(tweet) {
        return topTypes.includes(tweet.activityType) && tweet.distance > 0;
    }).map(function(tweet) {
        return {
            activityType: tweet.activityType,
            distance: tweet.distance,
            day: days[tweet.time.getUTCDay()]
        };
    });

    // Compare mean distances to identify the longest and shortest activity types.
    const averages = topTypes.map(function(type) {
        const activities = distanceData.filter(function(activity) {
            return activity.activityType === type;
        });

        const total = activities.reduce(function(sum, activity) {
            return sum + activity.distance;
        }, 0);

        return {
            activityType: type,
            count: activities.length,
            mean: activities.length === 0 ? 0 : total / activities.length
        };
    }).filter(function(activity) {
        return activity.count > 0;
    }).sort(function(a, b) {
        return b.mean - a.mean;
    });

    document.getElementById("longestActivityType").textContent =
        averages.length > 0 ? averages[0].activityType : "N/A";

    document.getElementById("shortestActivityType").textContent =
        averages.length > 0 ? averages[averages.length - 1].activityType : "N/A";

    // Separate weekend and weekday records to compare their mean distances.
    const weekends = distanceData.filter(function(activity) {
        return activity.day === "Sun" || activity.day === "Sat";
    });

    const weekdays = distanceData.filter(function(activity) {
        return activity.day !== "Sun" && activity.day !== "Sat";
    });

    const weekendMean = weekends.length === 0
        ? 0
        : weekends.reduce(function(sum, activity) {
            return sum + activity.distance;
        }, 0) / weekends.length;

    const weekdayMean = weekdays.length === 0
        ? 0
        : weekdays.reduce(function(sum, activity) {
            return sum + activity.distance;
        }, 0) / weekdays.length;

    document.getElementById("weekdayOrWeekendLonger").textContent =
        weekendMean > weekdayMean ? "weekends" : "weekdays";

    // Plot individual distances by weekday, using color to distinguish activities.
    const distance_vis_spec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        data: {
            values: distanceData
        },
        mark: "point",
        width: 500,
        height: 300,
        encoding: {
            x: {
                field: "day",
                type: "ordinal",
                sort: days,
                title: "Day of the week"
            },
            y: {
                field: "distance",
                type: "quantitative",
                title: "Distance (miles)"
            },
            color: {
                field: "activityType",
                type: "nominal",
                title: "Activity type",
                scale: {
                    domain: topTypes
                }
            }
        }
    };

    // Let Vega-Lite calculate mean distance for each activity and weekday.
    const distance_mean_spec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        data: {
            values: distanceData
        },
        mark: "point",
        width: 500,
        height: 300,
        encoding: {
            x: {
                field: "day",
                type: "ordinal",
                sort: days,
                title: "Day of the week"
            },
            y: {
                field: "distance",
                type: "quantitative",
                aggregate: "mean",
                title: "Mean distance (miles)"
            },
            color: {
                field: "activityType",
                type: "nominal",
                title: "Activity type",
                scale: {
                    domain: topTypes
                }
            }
        }
    };

    // Show individual activities initially and hide the mean chart.
    const rawChart = document.getElementById("distanceVis");
    const meanChart = document.getElementById("distanceVisAggregated");
    const button = document.getElementById("aggregate");
    let showingMeans = false;

    button.textContent = "Show mean";
    meanChart.style.display = "none";

    vegaEmbed("#distanceVis", distance_vis_spec, {actions: false});
    vegaEmbed("#distanceVisAggregated", distance_mean_spec, {actions: false});

    // Switch between the two charts and update the button label.
    button.addEventListener("click", function() {
        showingMeans = !showingMeans;

        rawChart.style.display = showingMeans ? "none" : "block";
        meanChart.style.display = showingMeans ? "block" : "none";
        button.textContent = showingMeans ? "Show all activities" : "Show mean";
    });
}

document.addEventListener("DOMContentLoaded", function() {
    loadSavedRunkeeperTweets().then(parseTweets);
});