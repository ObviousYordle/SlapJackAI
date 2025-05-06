# Fast API Import
from fastapi import FastAPI, BackgroundTasks
from fastapi.staticfiles import StaticFiles
import uvicorn
import os
import time
import joblib
import numpy as np
from typing import List, Dict
from pathlib import Path

from Deck import Deck
from Player import Player
from Card import Card
from pydantic import BaseModel
from AiPlayer import AiPlayer


app = FastAPI()

# Serve static files from the Frontend directory
# Essentially adds /static to the path, e.g http://localhost:8000/static/whatever_html_here.html
frontend_path = os.path.join(os.path.dirname(__file__), "..", "Frontend")
app.mount("/static", StaticFiles(directory=str(frontend_path)), name="static")

app.mount("/cards", StaticFiles(directory="../Frontend/PNG-cards-1.3"), name="cards")


# Store players and reaction_times and ai deck into a dictionary
# We shouldn't need to store it into a database, just save it for the local run on that session until user quits.
players = {}
ai_decks: Dict[str, List[Card]] = {}
center_pile: List[Card] = []
reaction_times = {}
ai_slap_successful = {}
ai_reaction_predictions: Dict[str, float] = {}
pile_claimed_by: Dict[str, str] = {}

class ReactionTime(BaseModel):
    reaction_time: float

class ReactionData(BaseModel):
    reaction_times: List[float]

class PredictionInput(BaseModel):
    player_name: str
    prediction: float 

def get_ai_slap_task(player_name: str):
    def check_and_slap():

        delay = ai_reaction_predictions.get(player_name, 1.0)
        print("Delay is now: ", delay)
        time.sleep(delay + 0.1)
        base_dir = Path(__file__).resolve().parent.parent
        image_base_path = base_dir / "Frontend" / "PNG-cards-1.3"

        if pile_claimed_by.get(player_name) is not None:
            print(f"[AI SLAP] Player already claimed pile, skipping.")
            ai_slap_successful[player_name] = False
            return
        if AiPlayer.check_slap(center_pile, image_base_path):
            ai_decks[player_name].extend(center_pile.copy())
            center_pile.clear()
            ai_slap_successful[player_name] = True
        else:
            ai_slap_successful[player_name] = False

    return check_and_slap

@app.get("/get_ai_slap_status/{player_name}")
def get_ai_slap_status(player_name: str):
    slapped = ai_slap_successful.get(player_name, False)
    ai_slap_successful[player_name] = False  
    return { "slapped": slapped }


@app.get("/get_decks/{player_name}")
def get_decks(player_name: str):
    if player_name not in players or player_name not in ai_decks:
        return {"error": "Player not found"}

    def card_to_dict(card):
        return {
            "name": str(card),
            "image": card.get_imageFileName()
        }

    player_deck = players[player_name].deck
    ai_deck = ai_decks[player_name]

    return {
        "player_deck": [card_to_dict(card) for card in player_deck],
        "ai_deck": [card_to_dict(card) for card in ai_deck]
    }
#Initialize the game by shuffling the deck to ensure that it is randomize each game
@app.get("/initialize_game/{player_name}")
def initialize_game(player_name: str):

    print(f"Hello{players}")
    fresh_deck = Deck()
    fresh_deck.shuffle()
    #Spite the deck so that the player deck and ai deck has 26 unique cards
    player_deck, ai_deck = fresh_deck.split_deck()

    player = Player(player_name)
    player.deck = player_deck
    players[player_name] = player
    ai_decks[player_name] = ai_deck
    center_pile.clear()

    #Conver the card into readable dictionary format and return both the player's and ai decks as a list of the dictionary 
    #where each card has a card name and image path in order the frontend to render the corresponding images
    def card_to_dict(card):
        return {
            "name": str(card),
            "image": card.get_imageFileName()
        }

    return {
        "player_deck": [card_to_dict(card) for card in player_deck],
        "ai_deck": [card_to_dict(card) for card in ai_deck]
}
# Create player with deck, bit more Jacks than usual
@app.get("/create_player/{name}")
def create_player(name: str):
    # Create and shuffle a fresh deck

    # Assume one player, just clear it when you make a new player
    players.clear()

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
    ] * 3  # 16 Jacks added for reaction test

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

@app.get("/ai_flip_card/{player_name}")
def ai_flip_card(player_name: str, background_tasks: BackgroundTasks):
    if player_name not in ai_decks or not ai_decks[player_name]:
        return {"error": "AI has no cards left!"}
    
    pile_claimed_by[player_name] = None
    # Pop the top card from the AI's deck               
    ai_card = ai_decks[player_name].pop(0)
    center_pile.append(ai_card)
    print(f"[DEBUG] AI flipped card: {ai_card}. Center pile: {center_pile}")

    background_tasks.add_task(get_ai_slap_task(player_name))
    return {
        "name": str(ai_card),
        "image": ai_card.get_imageFileName(),
        "center_pile": [str(c) for c in center_pile]
    }

# Flip a card with auto refill since we want the cards to keep cycling during the initial reaction time test
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


@app.post("/player_flip_card/{player_name}")
def player_flip_card(player_name: str, background_tasks: BackgroundTasks):
    if player_name not in players:
        return {"error": "Player not found"}
    
    player = players[player_name]
    if not player.deck:
        return {"error": "Player deck is empty"}
    
    pile_claimed_by[player_name] = None
    card = player.deck.pop(0)
    print(str(card))
    center_pile.append(card)
    print(f"[DEBUG] Player flipped card: {card}. Center pile: {center_pile}")

    background_tasks.add_task(get_ai_slap_task(player_name))
    return {
       
        "card": str(card),
        "image": card.get_imageFileName(),
        "center_pile": [str(c) for c in center_pile],
    }

@app.post("/collect_center_pile/{player_name}")
def collect_center_pile(player_name: str):
    if player_name not in players:
        return {"error": "Player not found"}
    if pile_claimed_by.get(player_name) is not None:
        return {"message": "Pile already claimed", "collected": [], "player_deck_count": len(players[player_name].deck)}
    player = players[player_name]
    pile_claimed_by[player_name] = player_name
    collected_cards = player.collect_center_pile(center_pile)
    # collected_cards = center_pile.copy()
    # player.deck.extend(collected_cards)
    # center_pile.clear()

    return {
        "message": f"{len(collected_cards)} cards collected",
        "collected": [str(card) for card in collected_cards],
        "player_deck_count": len(player.deck)
    }
#For sending the predicted reaction time back into backend so the AI model can sleep for that amount of time before slapping the card
@app.post("/set_ai_prediction")
def set_ai_prediction(data: PredictionInput):
    ai_reaction_predictions[data.player_name] = data.prediction / 1000  
    return {"message": "Prediction updated"}

@app.post("/predict_performance")
def predict_performance(data: ReactionData):
    try:
        prediction = AiPlayer.predict_ai_reaction(data.reaction_times)
        return {"prediction": prediction}
    except Exception as e:
        return {"error": str(e)}
# Remember to run python .\main.py in the backend directory to run the server.
# Then open the http://localhost:8000/static/home.html
if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)


