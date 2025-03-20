"""Contains player info, like name, their deck (also their score"""
class Player:

    def __init__(self, name):
        self.name = name
        self.deck = []
        self.score = 0

    """Add card to player deck,"""
    def add_card(self, card):
        self.deck.append(card)

    """The "flip" of a card"""
    def flip_card(self):
        if self.deck:
            return self.deck.pop()
        return None


    """Prints player's whole deck, ex: queen of hearts, king of diamonds, etc"""
    def __str__(self):
        # Separate with "," and print each card in hand
        hand_str = ", ".join(str(card) for card in self.deck)
        return f"{self.name}'s hand: {hand_str}"