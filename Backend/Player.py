"""Contains player info, like name, their deck (also their score"""
class Player:

    def __init__(self, name):
        self.name = name
        self.deck = []
        self.score = 0
        self.reaction_times = []  # Add this to track reaction times

    """Add card to player deck,"""
    def add_card(self, card):
        self.deck.append(card)

    """The "flip" of a card"""
    def flip_card(self):
        if self.deck:
            return self.deck.pop(0)
        return None

    def collect_center_pile(self, center_pile):
        collected = center_pile.copy()
        self.deck.extend(collected)
        center_pile.clear()
        return collected

    """Prints player's whole deck, ex: queen of hearts, king of diamonds, etc"""
    def __str__(self):
        # Separate with "," and print each card in hand
        hand_str = ", ".join(str(card) for card in self.deck)
        return f"{self.name}'s hand: {hand_str}"