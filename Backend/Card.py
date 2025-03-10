class Card():
    def __init__(self, rank, suit):
        self._rank = rank
        self._suit = suit

    @property
    def rank(self):
        return self._rank

    @property
    def suit(self):
        return self._suit

    @rank.setter
    def rank(self, value):
        self._rank = value

    @suit.setter
    def suit(self, value):
        self._suit = value

    def __str__(self):
        return f"{self._rank} of {self._suit}"
