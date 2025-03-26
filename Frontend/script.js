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
        .then(response => response.json())
        .then(data => {
            console.log("Server response:", data);

            // Update HTML, display player's name and deck
            document.getElementById("player-info").innerHTML =
                `<h2>Player: ${data.player_name}</h2>
                 <p>Deck: ${data.player_deck}</p>`;

            // Update remaining deck visual
            updateRemainingDeck((data.deck_size));

            // Show the card container after player creation
            document.getElementById("card-container").style.display = "block";

            // Show the flip button after player is created
            document.getElementById("flip-button").style.display = "block";

            document.getElementById("deck-visual").style.display = "block";


        })
        .catch(error => {
            console.error("Error:", error);
        });
}

// Function to display the card without flipping
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
            if (data.card)
            {
                // Get the top card
                const cardContent = data.card;

                // Get rank and suit
                const cardParts = cardContent.split(" of ");
                const rank = cardParts[0];
                const suit = cardParts[1];

                // Update the rank and suit of the card
                const cardRankElement = document.getElementById("card-rank");
                const cardSuitElement = document.getElementById("card-suit");

                // Update the rank
                cardRankElement.innerText = rank;

                // Update the suit
                cardSuitElement.innerText = suit;

                // Apply suit color
                if (suit === 'Hearts' || suit === 'Diamonds') {
                    cardSuitElement.classList.add('red');
                    cardSuitElement.classList.remove('black');
                } else {
                    cardSuitElement.classList.add('black');
                    cardSuitElement.classList.remove('red');
                }

                // Update the remaining deck (e.g., "5 cards left")
                document.getElementById("remaining-deck").innerHTML =
                    `<p>Remaining Deck: ${data.remaining_deck}</p>`;

                // Update the remaining cards visual
                updateRemainingDeck(data.remaining_deck);
            }
            else
            {
                document.getElementById("flipped-card").innerHTML = `<p>No more cards left!</p>`;
            }
        })
        .catch(error => {
            console.error("Error:", error);
        });
}

// Function to update the remaining deck visual
function updateRemainingDeck(remainingDeckCount) {
    console.log("Updating remaining deck with count:", remainingDeckCount);

    const remainingCardsElement = document.getElementById("remaining-deck");

    // Clear any previous content
    remainingCardsElement.innerHTML = '';

    // Create a new card element to represent the remaining cards count
    const remainingCard = document.createElement("div");
    remainingCard.classList.add("card");
    remainingCard.innerHTML = `
        <div style="font-size: 48px; text-align: center;">
            <span>${remainingDeckCount}</span> <!-- Large number to represent remaining cards -->
        </div>
    `;

    // Append the new card visual to the container
    remainingCardsElement.appendChild(remainingCard);

}
