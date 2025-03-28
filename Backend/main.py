#Fast API Import
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import uvicorn
import os

import time
from Deck import Deck
from Player import Player
from Card import Card

app = FastAPI()

# Serve static files from the Frontend directory
frontend_path = os.path.join(os.path.dirname(__file__), "..", "Frontend")

# Mount static files (HTML, CSS, JS)
app.mount("/static", StaticFiles(directory=str(frontend_path)), name="static")

players = {}


# Create player with deck, just testing
@app.get("/create_player/{name}")
def create_player(name: str):
    # Create a fresh deck
    fresh_deck = Deck()

    # Shuffle the deck to randomize the order
    fresh_deck.shuffle()

    fresh_deck.deck = fresh_deck.deck[:len(fresh_deck.deck) // 2]  # Split deck for the player

    jacks = [
        Card("Jack", "Hearts"),
        Card("Jack", "Diamonds"),
        Card("Jack", "Clubs"),
        Card("Jack", "Spades")
    ]

    fresh_deck.deck = [card for card in fresh_deck.deck if card.rank != "Jack"]
    fresh_deck.deck.extend(jacks)
    fresh_deck.shuffle()

    # Create the player and assign the shuffled deck
    player = Player(name)
    players[name] = player

    player.deck = fresh_deck.deck

    return {"player_name": name, "player_deck": str(player), "deck_size": len(player.deck)}


# Mimic flipping of a card
@app.get("/flip_card/{player_name}")
def flip_card(player_name: str):
    player = players[player_name]

    if player and player.deck:
        card_played = player.flip_card()  # This should return a card object or string
        remaining_deck = len(player.deck)  # Get remaining deck size
        return {"player": player_name, "card": str(card_played), "remaining_deck": remaining_deck}  # "card" is the key
    else:
        return {"message": "No cards left in the deck!"}





origins = [
    "https://localhost:8000"
]

# With this, in terminal, just run "python .\main.py"
if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)