console.log("script.js loaded successfully");

let playerName = '';
let startTime = 0;
let reactionTime = 0;
let flipInterval;
let isJackDrawn = false;
let reactionTimes = [];
let reactionsRemaining = 5;  // Can adjust number of reactions here
let playerHand = [];
let aiHand = [];
let centerCardPile = []; // Holds cards placed in the center
let initialAIPrediction  = 0;

// Save the reactionTimes array to to the session storage so we can load it in the main game 
function saveReactionTimes() {
    // Save the reactionTimes array to localStorage as a string
    if (playerName) {
        sessionStorage.setItem(`${playerName}_reactionTimes`, JSON.stringify(reactionTimes));
    }
}

function saveinitialAIPrediction() {
    if (initialAIPrediction !== undefined) {
        sessionStorage.setItem("initialAIPrediction", initialAIPrediction.toString());
        console.log("Saved initialAIPrediction to sessionStorage:", initialAIPrediction);
    }
}

// function loadinitialAIPrediction() {
//     const savedPrediction = sessionStorage.getItem("initialAIPrediction");
//     if (savedPrediction !== null) {
//         initialAIPrediction = parseFloat(savedPrediction);
//         console.log("Loaded initialAIPrediction from sessionStorage:", initialAIPrediction);
//     }
// }
function loadinitialAIPrediction() {
    const savedPrediction = sessionStorage.getItem("initialAIPrediction");
    if (savedPrediction !== null) {
        initialAIPrediction = parseFloat(savedPrediction);
        console.log("Loaded initialAIPrediction from sessionStorage:", initialAIPrediction);

        // Send prediction to backend
        fetch('/set_ai_prediction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                player_name: playerName,
                prediction: initialAIPrediction
            })
        })
        .then(res => res.json())
        .then(serverRes => {
            console.log("Initial prediction sent to backend:", serverRes.message);
        })
        .catch(err => {
            console.error("Failed to send initial AI prediction:", err);
        });
    }
}

//for loading the reactionTimes array from session storage
function loadReactionTimes() {
    
    if(playerName){
        const savedReactionTimes = sessionStorage.getItem(`${playerName}_reactionTimes`);
        if (savedReactionTimes) {
            // If data exists in localStorage, parse it into the array
            reactionTimes = JSON.parse(savedReactionTimes);
        } else {
            // If no data exists, initialize an empty array
            reactionTimes = [];
        }
        console.log("Loaded reactionTimes:", reactionTimes);
    }
}
//Loading the player name when initializing the main game
function loadPlayerName() {
    const savedName = sessionStorage.getItem("playerName");
    if (savedName) {
        playerName = savedName;
        console.log("Loaded playerName:", playerName);
    }
    
}
// Add player
function addPlayer() {
    playerName = document.getElementById("player-name").value;
    sessionStorage.setItem("playerName", playerName); // Store it for future use
    reactionTimes = [];

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
            document.getElementById("reaction-instruction").style.display = "block";  
            document.getElementById("reaction-info").style.display = "block";  
            document.getElementById("reactions-remaining").innerText = reactionsRemaining; 
        })
        .catch(error => {
            console.error("Error:", error);
        });
}

// Starts the deck flipping when the button is clicked
function startFlipping() {
    flipInterval = setInterval(flipCard, 1250);
    document.getElementById("start-button").style.display = "none";
    document.getElementById("reaction-instruction").style.display = "none";  
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
document.addEventListener('DOMContentLoaded', function () {
    const card = document.querySelector('.card');
    if (card) {
      card.addEventListener('click', function () {
        reactToJack(); // React to the Jack when the card is clicked
      });
    }
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

    // If isJackDrawn is true, get the reaction performance and decrement the amount of reaction remaining
    if (isJackDrawn) {
        reactionTime = performance.now() - startTime;
        alert(`Your reaction time: ${reactionTime.toFixed(2)} ms\nYou reacted correctly!`);
        reactionTimes.push(reactionTime.toFixed(2)); // Save to local array
        saveReactionTimes();
        reactionsRemaining--; 

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
        document.getElementById("Start-Game-button").style.display = "block";
        showReactionTimes(); // Show reaction times
        alert("You've used all your reactions!");
        console.log(playerName)

        //Send the reaction times to the backend so that the pre trained reaction_time_model can predict the performance after converting those times into float values since that's what the AI is expecting
        fetch("/predict_performance", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                // reaction_times: reactionTimes.map(parseFloat) 
                reaction_times: reactionTimes.flatMap(rt => [parseFloat(rt), parseFloat(rt)])
            })
        })
        .then(response => response.json())
        .then(data => {
            initialAIPrediction = data.prediction;
            console.log("AI Prediction:", initialAIPrediction);
            
            saveinitialAIPrediction();

            //Display the prediction time based on the player's initial reaction time test
            if (initialAIPrediction !== undefined) {
                document.getElementById("ai-prediction").innerText = `AI Reaction Speed: ${initialAIPrediction.toFixed(2)} ms`;
            } else {
                document.getElementById("ai-prediction").innerText = `AI Prediction: Error`;
            }
        })
        .catch(error => {
            console.error("Prediction error:", error);
        });
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
    document.getElementById("reaction-times-container").style.display = "block"; 
}

function updateRemainingDeck(count) {
    const container = document.getElementById("remaining-deck");
    container.innerHTML = `
        <div class="card" style="font-size: 48px; text-align: center;">
            <span>${count}</span>
        </div>
    `;
}


// Game code below?
//We should have made different script to seperate the game from the initial testing page but it is fine


let centerPile = [];

// Initial card center to start the game
document.addEventListener("DOMContentLoaded", () => {
    let playerHand = [];
    let aiHand = [];
    let jackAppeared = null;

    loadPlayerName();
    loadReactionTimes();
    loadinitialAIPrediction();

    const centerCard = document.getElementById("center-card");
    const playerDeck = document.getElementById("player-deck");

    function refreshDecks() {
        fetch(`/get_decks/${playerName}`)
            .then(res => res.json())
            .then(data => {
                playerHand = data.player_deck;
                aiHand = data.ai_deck;
    
                console.log("Updated Player deck:", playerHand.map(c => c.name));
                console.log("Updated AI deck:", aiHand.map(c => c.name));
            })
            .catch(err => {
                console.error("Failed to refresh decks:", err);
            });
    }
    function checkAISlapStatus() {
        fetch(`/get_ai_slap_status/${playerName}`)
            .then(res => res.json())
            .then(status => {
                if (status.slapped) {
                    alert("AI slapped a Jack!");
                    centerCard.style.display = "none";
                    centerPile = [];
                    refreshDecks();
                }
            })
    }
    function updateAIPrediction() {
        fetch('/predict_performance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                reaction_times: reactionTimes
                    .slice(-5) // take the most recent 5 reactions and and padded it twice since the model requires 10 reaction time to predict
                    .flatMap(reactTime => [parseFloat(reactTime), parseFloat(reactTime)])
            }),

        })
        .then(response => response.json())
        .then(data => {
            if (data.prediction !== undefined) {
                console.log("Predicted AI reaction time:", data.prediction.toFixed(2), "ms");
                const aiDisplay = document.getElementById("ai-reaction-time");
                if (aiDisplay) {
                    aiDisplay.textContent = `${data.prediction.toFixed(2)} ms`;
                }
                 // Send prediction to backend
                fetch('/set_ai_prediction', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        player_name: playerName,
                        prediction: data.prediction
                    })
                })
                .then(res => res.json())
                .then(serverResponse => {
                    console.log("Sent prediction to backend:", serverResponse.message);
                })
                .catch(err => {
                    console.error("Error sending AI prediction to backend:", err);
                });
            } else {
                console.error("Prediction error:", data.error);
            }
        })
        .catch(error => {
            console.error("Failed to get AI prediction:", error);
        });
    }

    // Start game by clicking the center card
    centerCard.addEventListener("click", () => {
        fetch(`/initialize_game/${playerName}`)
            .then(response => response.json())
            .then(data => {
                document.getElementById("center-card").style.display = "none";
                document.getElementById("shuffle-instruction").style.display = "none";
                playerDeck.style.display = "inline";
                document.getElementById("ai-deck").style.display = "inline";
                loadReactionTimes();
                playerHand = data.player_deck;
                aiHand = data.ai_deck;

                //Use for debugging since we need to see if the deck are being populated correctly
                //Should comment this out when game is done so player can't inspect the console and see their cards
                console.log("Player hand:", playerHand.map(c => c.name));
                console.log("AI hand:", aiHand.map(c => c.name));
                
                centerCard.addEventListener("click", async () => {

                    // Handling ALL slaps
                    if (centerPile.length === 0) {
                        alert("There's no card to slap!");
                        return;
                    }

                    const topCard = centerPile[centerPile.length - 1];
                    console.log("Player slapped:", topCard);


                    // Jack Slap
                    if (topCard.includes("Jack")) {
                        //Reaction timer for slapping the jack card and add it to the reaction time list for ai to track

                        reactionTime = performance.now() - startTime;
                        reactionTimes.push(reactionTime.toFixed(2));
                        console.log("Updated reactionTimes array:", reactionTimes);
                        if (reactionTimes.length > 10) {
                            reactionTimes.shift();
                        }
                        await fetch(`/save_reaction_time/${playerName}`, {
                            method: "POST",
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ reaction_time: reactionTime }),
                        });

                        updateAIPrediction();
                        try {
                            const res = await fetch(`/collect_center_pile/${playerName}`, {
                                method: "POST"
                            });
                            refreshDecks();
                            const result = await res.json();
                            alert(`You slapped a Jack and collected ${result.collected.length} cards!`);
                            console.log("Collected pile:", result.collected);

                            // Clear center pile visually
                            centerCard.style.display = "none";
                            centerPile = [];
                        } catch (err) {
                            console.error("Error collecting pile:", err);
                        }
                    } else {
                        alert(`Wrong slap! Top card was: ${topCard}`);
                    }
                });
            })
            .catch(error => {
                console.error(error);
            });
    }, { once: true });

    // Player flips a card then Ai flips teh card afterward
    playerDeck.addEventListener("click", () => {
        if (playerHand.length === 0) return;

        fetch(`/player_flip_card/${playerName}`, { method: "POST" })
            .then(response => response.json())
            .then(data => {
                if (data.image) {
                    centerCard.style.display = "inline";
                    centerCard.src = data.image;
                }

                centerPile = data.center_pile;
                console.log("[Player] Played:", data.card);
                console.log("Center pile:", centerPile);
                // Check what is at the top of the center Pile, if its Jack start the timer
                // FYI: data.card does NOT work, you have to extract it from centerPile
                if (centerPile[centerPile.length - 1].includes("Jack")){
                    startTime = performance.now();
                    console.log("[Player Flip] Jack appeared. Timer started.");
                }
                setTimeout(checkAISlapStatus, 3000);

                playerDeck.style.pointerEvents = "none";

                // Delay for when AI places down a card so its harder to predict when the AI would place the card down instead of just having a set time
                const delay = Math.random() * 2000 + 1000;
                setTimeout(() => {
                    fetch(`/ai_flip_card/${playerName}`)
                        .then(response => response.json())
                        .then(aiData => {
                            // if (aiData.image) {
                            //     //centerCard.style.display = "inline";
                            //     centerCard.src = aiData.image;
                            // }
                            if (aiData && aiData.image && centerCard) {
                                centerCard.style.display = "inline";
                                centerCard.src = aiData.image;
                            }

                            centerPile = aiData.center_pile;
                            console.log("[AI] Played:", aiData.card);
                            console.log("Center pile:", centerPile);

                            // Check what is at the top of the center Pile, if its Jack start the timer
                            // FYI: data.card does NOT work, you have to extract it from centerPile
                            if (centerPile[centerPile.length - 1].includes("Jack")){
                                startTime = performance.now();
                                console.log("[Player Flip] Jack appeared. Timer started.");
                              }

                            playerDeck.style.pointerEvents = "auto";

                            setTimeout(checkAISlapStatus, 3000);
                        });
                }, delay);
            });
    });
});
