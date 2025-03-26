console.log("script.js loaded successfully");

// Will store playerName for the session
let playerName = '';

// Add player function
function addPlayer() {
    console.log("Button clicked!");

    // Get player name from input field from HTML
    playerName = document.getElementById("player-name").value;

    if (!playerName) {
        alert("Please enter a player name.");
        return;
    }

    // Fetch request to FastAPI call create_player
    fetch(`/create_player/${playerName}`)
        // Waits for response, converts to json
        .then(response => response.json())

        // Parses json with data
        .then(data => {
            console.log("Server response:", data);

            // Update HTML, display player's name and deck
            document.getElementById("player-info").innerHTML =
                `<h2>Player: ${data.player_name}</h2>
                 <p>Deck: ${data.player_deck}</p>`;

            // Show the flip card button after player creation
            document.getElementById("flip-card-container").style.display = "block";
        })

        .catch(error => {
            console.error("Error:", error);
        });
}

// Function to handle flipping the card
function flipCard() {
    // If global playerName doesn't exist
    if (!playerName) {
        console.error("Player name is undefined. Flip card action cannot proceed.");
        return;
    }

    console.log("Flipping card for player:", playerName);

    // Fetch request to FastAPI call flip_card and gets the data from it
    fetch(`/flip_card/${playerName}`)
        .then(response => response.json())
        .then(data => {
            console.log("Flipped card:", data);

            // Get the top card
            if (data.card) {
                document.getElementById("flipped-card").innerHTML = `<p>Flipped Card: ${data.card}</p>`;

                // Update the remaining deck after the flip
                document.getElementById("remaining-deck").innerHTML =
                    `<p>Remaining Deck: ${data.remaining_deck}</p>`;
            } else {
                document.getElementById("flipped-card").innerHTML = `<p>No more cards left!</p>`;
            }
        })
        .catch(error => {
            console.error("Error:", error);
        });
}
