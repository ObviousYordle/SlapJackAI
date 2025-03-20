import threading
import time
import signal
class SlapjackRules:

    """Basic check for checking if it's a Jack, default setting"""
    @staticmethod
    def is_jack(card) -> bool:
        da_card = card
        return da_card.rank == "jack"

    """ Just a countdown method"""
    @staticmethod
    def countdown(seconds):
        for i in range(seconds, 0, -1):
            print(f"Game starting in {i} seconds...")
            time.sleep(1)  # Wait for 1 second
        print("Go!\n")

