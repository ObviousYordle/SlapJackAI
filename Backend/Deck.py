from Backend.Card import Card
import random

class Deck:
    def __init__(self):
        self.suits = ['spades', 'clubs', 'diamonds', 'hearts']
        self.ranks = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king']

        """Create a tuple of each cards to make a deck of 52 cards"""
        self.deck = [Card(rank, suit) for suit in self.suits for rank in self.ranks]

    """Shuffle the deck"""
    def shuffle(self):
        random.shuffle(self.deck)


    """ Print out cards in deck"""
    def __str__(self):
        deck_str = ""
        for card in self.deck:
            deck_str += str(card) + "\n"  # Add each card string representation followed by a newline
        return deck_str