class Player:

    def __init__(self, name, is_ai):
        self.name = name
        self.is_ai = is_ai # boolean
        self.hand = []
        self.score = 0

    """Add card to player hand"""
    def add_card(self, card):
        self.hand.append(card)

    def flip_card(self):
        if self.hand:
            return self.hand.pop
        return None

    def score(self):
        return self.score

    def print_hand(self):
        print(f"{self.name}'s hand:")
        for card in self.hand:
            print(card)

    def __str__(self):
        # Separate with "," and print each ard in hand
        hand_str = ", ".join(str(card) for card in self.hand)
        return f"{self.name}'s hand: {hand_str}"