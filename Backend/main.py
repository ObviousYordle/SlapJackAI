# Fast API Import
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import uvicorn
import os
import time
import joblib
import numpy as np
from typing import List

from Deck import Deck
from Player import Player
from Card import Card
from pydantic import BaseModel

app = FastAPI()

# Serve static files from the Frontend directory
# Essentially adds /static to the path, e.g http://localhost:8000/static/whatever_html_here.html
frontend_path = os.path.join(os.path.dirname(__file__), "..", "Frontend")
app.mount("/static", StaticFiles(directory=str(frontend_path)), name="static")

#Get the path to where the pre trained AI model for reaction time is stored and load it in order to use the model on predicting its reaction speed based on the user's times.
AImodel_path = os.path.join(os.path.dirname(__file__), "..", "AIModel", "reaction_time_model.pkl")
model = joblib.load(AImodel_path)

# Store players and reaction_times into a dictionary
# We shouldn't need to store it into a database, just save it for the local run on that session until user quits.
players = {}
reaction_times = {}

class ReactionTime(BaseModel):
    reaction_time: float

class ReactionData(BaseModel):
    reaction_times: List[float]


# Create player with deck, bit more Jacks than usual
@app.get("/create_player/{name}")
def create_player(name: str):
    # Create and shuffle a fresh deck
    fresh_deck = Deck()
    fresh_deck.shuffle()

    # Creating custom deck by adding more jacks for initial N reaction test
    fresh_deck.deck = [card for card in fresh_deck.deck if card.rank != "Jack"]

    # Add multiple Jacks to increase testing frequency
    extra_jacks = [
        Card("Jack", "Hearts"),
        Card("Jack", "Diamonds"),
        Card("Jack", "Clubs"),
        Card("Jack", "Spades")
    ] * 3  # 12 Jacks added for reaction test

    fresh_deck.deck.extend(extra_jacks)
    fresh_deck.shuffle()

    # Create player and assign custom deck
    player = Player(name)
    players[name] = player
    player.deck = fresh_deck.deck

    # Reset in case of previous names of the same
    reaction_times[name] = []

    return {
        "player_name": name,
        "player_deck": str(player),
        "deck_size": len(player.deck)
    }

# Flip a card with auto refill
@app.get("/flip_card/{player_name}")
def flip_card(player_name: str):

    # Get the players deck
    player = players.get(player_name)

    if not player:
        return {"message": f"Player '{player_name}' not found."}

    # If no cards left, refresh with a new deck
    if not player.deck:
        fresh_deck = Deck()
        fresh_deck.shuffle()

        # Refill if the deck runs out
        fresh_deck.deck = [card for card in fresh_deck.deck if card.rank != "Jack"]
        extra_jacks = [
            Card("Jack", "Hearts"),
            Card("Jack", "Diamonds"),
            Card("Jack", "Clubs"),
            Card("Jack", "Spades")
        ] * 2  # Add 8 Jacks on refill

        fresh_deck.deck.extend(extra_jacks)
        fresh_deck.shuffle()

        player.deck = fresh_deck.deck
        print(f"Deck reshuffled for player: {player_name}")

    # Flip the card
    card_played = player.flip_card()
    remaining_deck = len(player.deck)

    return {
        "player": player_name,
        "card": str(card_played),
        "remaining_deck": remaining_deck
    }

# Save reaction time for a player
@app.post("/save_reaction_time/{player_name}")
def save_reaction_time(player_name: str, reaction_time: ReactionTime):

    # If player is not in the reaction time, add that player to the reaction times dictionary
    if player_name not in reaction_times:
        reaction_times[player_name] = []

    reaction_times[player_name].append(reaction_time.reaction_time)
    print(f"Reaction times for {player_name}: {reaction_times[player_name]}")  # Log to check

    return {"message": "Main: Reaction time saved", "reaction_times": reaction_times[player_name]}

@app.post("/predict_performance")
def predict_performance(data: ReactionData):
    input_array = np.array(data.reaction_times).reshape(1, -1)

    try:
        prediction = model.predict(input_array)
        return {"prediction": prediction[0]}
    except Exception as e:
        return {"error": str(e)}
# Remember to run python .\main.py in the backend directory to run the server.
# Then open the http://localhost:8000/static/home.html
if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)
