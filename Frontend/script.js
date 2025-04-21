console.log("script.js loaded successfully");

let playerName = '';
let startTime = 0;
let reactionTime = 0;
let flipInterval;
let isJackDrawn = false;
let reactionTimes = [];
let reactionsRemaining = 2;  // Can adjust number of reactions here

// Add player
function addPlayer() {
    playerName = document.getElementById("player-name").value;

    if (!playerName) {
        alert("Please enter a player name.");
        return;
    }

    // calls /create_player to FastAPI main.py
    fetch(`/create_player/${playerName}`)
        .then(response => response.json())
        .then(data => {
            document.getElementById("player-info").innerHTML =
                `<h2>Player: ${data.player_name}</h2>`;

            // Hide player name input and button
            document.getElementById("player-entry").style.display = "none";

            // Show game elements
            document.getElementById("card-container").style.display = "block";
            document.getElementById("start-button").style.display = "block";
            document.getElementById("reaction-instruction").style.display = "block";  // Show the instruction
            document.getElementById("reaction-info").style.display = "block";  // Show the instruction
            document.getElementById("reactions-remaining").innerText = reactionsRemaining; // Display remaining reactions
        })
        .catch(error => {
            console.error("Error:", error);
        });
}

// Starts the deck flipping when the button is clicked
function startFlipping() {
    flipInterval = setInterval(flipCard, 1250);
    document.getElementById("start-button").style.display = "none";
    document.getElementById("reaction-instruction").style.display = "none";  // Hide instruction
    document.getElementById("react-button").style.display = "block";
    document.getElementById("reaction-info").style.display = "block";


}

// The function of the actual card flip
function flipCard() {
    if (!playerName) return;

    fetch(`/flip_card/${playerName}`)
        .then(response => response.json())
        .then(data => {
            if (data.card) {

                // Parse through deck to better visualize the card
                const [rank, suit] = data.card.split(" of ");
                const cardRank = rank.toLowerCase();
                const cardSuit = suit.toLowerCase();

                const filename = `${cardRank}_of_${cardSuit}.png`;
                const imagePath = `PNG-cards-1.3/${filename}`;

                
                const cardImage = document.getElementById("card-image");
                cardImage.src = imagePath;
                cardImage.alt = data.card;

                updateRemainingDeck(data.remaining_deck);

                // If the card is a Jack, stop the timer, and start the reaction timer. reactToJack() will handle the reaction time itself.
                if (rank === 'Jack') {
                    isJackDrawn = true;
                    clearInterval(flipInterval);
                    startTime = performance.now();
                    document.getElementById("react-button").disabled = false;
                }

                // Otherwise if it wasn't a Jack, continue as normal
                else {
                    isJackDrawn = false;
                }
            }

            // This runs once there are no more cards in the deck
            else {
                document.getElementById("flipped-card").innerHTML = `<p>No more cards left!</p>`;
                clearInterval(flipInterval);
            }
        })

        // Error catching
        .catch(error => {
            console.error("Error:", error);
        });
}

// This makes the card interactable, you can click on it to "Slap"
document.querySelector('.card').addEventListener('click', function() {
    reactToJack(); // React to the Jack when the card is clicked
});

// Function when a Jack is present
function reactToJack() {
    const reactBtn = document.getElementById("react-button");

    // If there are no more reactions remaining, halt them from reacting
    if (reactionsRemaining <= 0) {
        document.getElementById("reaction-info").style.display = "none";
        alert("No reactions remaining! You cannot react anymore.");
        clearInterval(flipInterval); // Ensure the flipping stops
        console.log("Calling showReactionTimes", reactionsRemaining);
        showReactionTimes(); // Show reaction times
        return;
    }

    // If isJackDrawn is true, get the reaction performance
    if (isJackDrawn) {
        reactionTime = performance.now() - startTime;
        alert(`Your reaction time: ${reactionTime.toFixed(2)} ms\nYou reacted correctly!`);
        reactionTimes.push(reactionTime.toFixed(2)); // Save to local array
        reactionsRemaining--; // Decrement reactions remaining

        console.log("Reactions remaining after correct reaction:", reactionsRemaining); // Debugging line

        isJackDrawn = false;

        // Continue flipping if there are still reactions remaining
        if (reactionsRemaining > 0) {
            flipInterval = setInterval(flipCard, 1250); // Continue flipping if reactions left
        }
        // No 'else' here for stopping, we handle it after the decrement

        // Update the player's reaction time in their own player dictionary, saved to FastAPI
        fetch(`/save_reaction_time/${playerName}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reaction_time: reactionTime })
        })
        .then(response => response.json())
        .then(data => {
            console.log("Saved reaction time:", data);
        })
        .catch(error => {
            console.error("Error saving reaction time:", error);
        });
    }
    // If it is not a Jack when you slap, you will get an invalid slap
    else {
        // Don't do anything if they fail the slap
        alert("Incorrect reaction! You didn't react to a Jack.");
        console.log("Reactions remaining after incorrect reaction:", reactionsRemaining); // Debugging line
    }

    // Update remaining reactions display
    document.getElementById("reactions-remaining").innerText = reactionsRemaining;

    // Check if all reactions are used after decrementing
    if (reactionsRemaining <= 0) {
        document.getElementById("reaction-info").style.display = "none";
        clearInterval(flipInterval); // Ensure the flipping stops
        console.log("Calling showReactionTimes", reactionsRemaining);
        showReactionTimes(); // Show reaction times
        alert("You've used all your reactions!");
    }
}

// Function to show reaction times
function showReactionTimes() {
    console.log("Calling showReactionTimes", reactionsRemaining);

    const container = document.getElementById("reaction-times-list");
    container.innerHTML = ""; // Clear existing, if any

    // Lists out all the reactions from the player
    reactionTimes.forEach((time, index) => {
        const li = document.createElement("li");
        li.textContent = `Reaction ${index + 1}: ${time} ms`;
        container.appendChild(li);
    });

    // Display the reaction times container
    document.getElementById("reaction-times-container").style.display = "block"; // Ensure it's visible
}

function updateRemainingDeck(count) {
    const container = document.getElementById("remaining-deck");
    container.innerHTML = `
        <div class="card" style="font-size: 48px; text-align: center;">
            <span>${count}</span>
        </div>
    `;
}
