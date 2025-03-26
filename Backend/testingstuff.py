import time

from Backend.AiPlayer import AiPlayer
from Backend.Card import Card

from Deck import Deck

from SlapjackRules import SlapjackRules

from Player import Player

# Trying to mimic game on console

# Make new deck and shuffle
fresh_deck = Deck()
fresh_deck.shuffle()

# Make players
player = Player("David")
robot = AiPlayer("robot", 500)

# Split half the deck for each player
half = len(fresh_deck.deck) // 2
player.deck = fresh_deck.deck[:half]
robot.deck = fresh_deck.deck[half:]

# Cards played in pile
played_pile = []

# Flag for player turn
player_turn = True

# While both players have cards in their deck
while player.deck and robot.deck:

    # Countdown
    SlapjackRules.countdown(3)

    # Switch turns with player_turn flag
    if player_turn:
        current_player = player
    else:
        current_player = robot

    # Current player flips their card
    player_card = current_player.flip_card()
    played_pile.append(player_card)
    print(f"{current_player.name} plays: {player_card}")

    # Start timer
    start_time = time.time()
    input("Press enter to slap!") # Time gets recorded the moment you press enter
    player_reaction_time = (time.time() - start_time) * 1000 # Get interval from timer start to reaction, also convert for MS

    # Just testing only Jack rules, boolean to check if card was jack
    if SlapjackRules.is_jack(player_card):
        print(f"{current_player.name} slapped the Jack!")
        print(f"Reaction time: {player_reaction_time}")

    else:
        print("False slap! >:(\n")

    # Delay between rounds
    time.sleep(2)

    # Swap players
    if player_turn:
        player_turn = False
    else:
        player_turn = True

    # Still need to figure out how to allow for no-input in case it's not a Jack, but that is how it be with console testing like this and not on some GUI


