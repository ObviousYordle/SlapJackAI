from Backend.Card import Card

from Backend.Deck import Deck

from SlapjackRules import SlapjackRules


new_deck = Deck()

print(new_deck)

new_deck.shuffle()

print(f"\nShuffled \n{new_deck}")
