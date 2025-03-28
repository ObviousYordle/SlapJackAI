console.log("script.js loaded successfully");

let playerName = '';  // Store player name
let startTime = 0;    // Timer start time
let reactionTime = 0; // Player's reaction time
let flipInterval;     // Interval ID for flipping cards
let isJackDrawn = false; // Flag to check if Jack is drawn

// Add player function
function addPlayer() {
    console.log("Button clicked!");

    playerName = document.getElementById("player-name").value;

    if (!playerName) {
        alert("Please enter a player name.");
        return;
    }

    fetch(`/create_player/${playerName}`)
        .then(response => response.json())
        .then(data => {
            console.log("Server response:", data);

            document.getElementById("player-info").innerHTML =
                `<h2>Player: ${data.player_name}</h2>
                 <p>Deck: ${data.player_deck}</p>`;

            updateRemainingDeck(data.deck_size);

            document.getElementById("card-container").style.display = "block";
            document.getElementById("deck-visual").style.display = "block";

            // Show the Start button to initiate the flipping
            document.getElementById("start-button").style.display = "block";
        })
        .catch(error => {
            console.error("Error:", error);
        });
}

// Start Flipping Cards function (starts the interval)
function startFlipping() {
    console.log("Starting card flipping...");

    // Start auto flipping every 2 seconds
    flipInterval = setInterval(flipCard, 2000);

    // Hide the Start button after starting the flipping
    document.getElementById("start-button").style.display = "none";

    // React button should be hidden initially and only shown when a Jack is drawn
    document.getElementById("react-button").style.display = "block";
}

// Flip card function (auto flips every 2 seconds)
function flipCard() {
    if (!playerName) {
        console.error("Player name is undefined. Flip card action cannot proceed.");
        return;
    }

    console.log("Flipping card for player:", playerName);

    fetch(`/flip_card/${playerName}`)
        .then(response => response.json())
        .then(data => {
            console.log("Flipped card:", data);
            if (data.card) {
                const cardContent = data.card;
                const cardParts = cardContent.split(" of ");
                const rank = cardParts[0];
                const suit = cardParts[1];

                // Update the rank and suit of the card
                const cardRankElement = document.getElementById("card-rank");
                const cardSuitElement = document.getElementById("card-suit");

                cardRankElement.innerText = rank;
                cardSuitElement.innerText = suit;

                // Apply color based on suit
                if (suit === 'Hearts' || suit === 'Diamonds') {
                    cardSuitElement.classList.add('red');
                    cardSuitElement.classList.remove('black');
                } else {
                    cardSuitElement.classList.add('black');
                    cardSuitElement.classList.remove('red');
                }

                // Update the remaining deck
                document.getElementById("remaining-deck").innerHTML =
                    `<p>Remaining Deck: ${data.remaining_deck}</p>`;

                // If Jack is drawn, show the React button and start the timer
                if (rank === 'Jack') {
                    isJackDrawn = true;
                    document.getElementById("react-button").style.display = "block";
                    startTime = performance.now();
                }

                updateRemainingDeck(data.remaining_deck);
            } else {
                document.getElementById("flipped-card").innerHTML = `<p>No more cards left!</p>`;
                clearInterval(flipInterval); // Stop the card flipping interval if no cards are left
            }
        })
        .catch(error => {
            console.error("Error:", error);
        });
}

// React to Jack function (when player presses React)
function reactToJack() {
    if (isJackDrawn) {
        reactionTime = performance.now() - startTime;
        alert(`Your reaction time: ${reactionTime.toFixed(2)} ms\nYou reacted correctly!`);
        isJackDrawn = false; // Reset after the correct reaction
    } else {
        alert("Incorrect reaction! You didn't react to a Jack.");
    }


}

// Update the remaining deck visual
function updateRemainingDeck(remainingDeckCount) {
    console.log("Updating remaining deck with count:", remainingDeckCount);

    const remainingCardsElement = document.getElementById("remaining-deck");
    remainingCardsElement.innerHTML = '';

    const remainingCard = document.createElement("div");
    remainingCard.classList.add("card");
    remainingCard.innerHTML = `
        <div style="font-size: 48px; text-align: center;">
            <span>${remainingDeckCount}</span>
        </div>
    `;

    remainingCardsElement.appendChild(remainingCard);
}
