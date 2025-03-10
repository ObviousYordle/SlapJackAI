from Backend.Card import Card

from Backend.Deck import Deck

from SlapjackRules import SlapjackRules

from Backend.Player import Player


new_deck = Deck()

new_deck.shuffle()

david = Player("David", False)

david.add_card(new_deck.get_deck().pop())
david.add_card(new_deck.get_deck().pop())

print(david)
