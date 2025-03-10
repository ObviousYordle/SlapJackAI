class SlapjackRules:

    """Basic check for checking if it's a Jack, default setting"""
    @staticmethod
    def is_jack(card: str) -> bool:
        da_card = card.lower()
        return da_card == "jack"
