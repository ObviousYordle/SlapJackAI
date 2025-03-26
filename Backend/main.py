#Fast API Import
from fastapi import FastAPI
import uvicorn

import time
from Deck import Deck
from Player import Player
from Card import Card

app = FastAPI()

# Create fresh deck
@app.get("/deck")
def get_deck():
    fresh_deck = Deck()
    fresh_deck.shuffle()
    return {"deck": [str(card) for card in fresh_deck.deck]}  # Return deck as strings

# Create player with deck, just testing
@app.get("/create_player/{name}")
def create_player(name: str):
    fresh_deck = Deck()
    fresh_deck.shuffle()
    player = Player(name)
    player.deck = fresh_deck.deck[:len(fresh_deck.deck)//2]
    return {"player_name": name, "player hand": player}

# Route for player to flip a card
@app.get("/flip_card/{player_name}")
def flip_card(player_name: str):
    fresh_deck = Deck()
    fresh_deck.shuffle()
    player = Player(player_name)
    player.deck = fresh_deck.deck[:len(fresh_deck.deck)//2]  # Give half the deck to the player
    card_played = player.flip_card()  # Player flips a card

    if card_played:
        return {"player": player_name, "card": str(card_played)}
    else:
        return {"message": "No cards left in the deck!"}


origins = [
    "https://localhost:8000"
]

# With this, in terminal, just run "python .\main.py"
if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)