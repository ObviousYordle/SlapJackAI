#Fast API Import
from fastapi import FastAPI

import time
from Backend.Deck import Deck
from Backend.Player import Player

app = FastAPI()

# Create fresh
@app.get("/deck")
def get_deck():
    fresh_deck = Deck()
    fresh_deck.shuffle()
    return {"deck": [str(card) for card in fresh_deck.deck]}  # Return deck as strings

# Example route to start a game and return a card flipped by the player
@app.get("/play_card/{player_name}")
def play_card(player_name: str):
    fresh_deck = Deck()
    fresh_deck.shuffle()
    player = Player(player_name)
    player.deck = fresh_deck.deck[:len(fresh_deck.deck)//2]  # Give half the deck to the player

    card_played = player.flip_card()  # Player flips the card
    return {"player": player_name, "card": str(card_played)}

# Example route for reaction time (you could implement more game logic here)
@app.get("/reaction/{player_name}")
def reaction_time(player_name: str):
    # Just simulate reaction time
    start_time = time.time()
    input(f"{player_name}, press Enter to simulate a reaction...")
    reaction = (time.time() - start_time) * 1000  # Calculate time in ms
    return {"reaction_time": reaction}
