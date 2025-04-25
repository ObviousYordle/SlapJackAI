"""Card class with rank and suit (ex: queen of hearts)"""
class Card:
    def __init__(self, rank, suit):
        self._rank = rank
        self._suit = suit

    """Returns rank"""
    @property
    def rank(self):
        return self._rank

    """Returns suit"""
    @property
    def suit(self):
        return self._suit

    """String format: {rank} of {suit}"""
    def __str__(self):
        return f"{self.rank} of {self.suit}"
    
    def get_imageFileName(self):
        #get the files name of the 52 deck card from PNG-cards-1.3
        return f"{self.rank.lower()}_of_{self.suit.lower()}.png"
