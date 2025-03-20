from Backend.Player import Player

"""AiPlayer inherits Player, gets same moves but has added difficulty changer"""
class AiPlayer(Player):

    # Still deciding how I want to difficulty. Definitely ML for sure though
    def __init__(self, name, ai_reaction_time):
        super().__init__(name)
        self.ai_reaction_time = ai_reaction_time


    # Just testing very basic, non-machine learning, adaptation first
    # Ex: player wins reaction, AI bumps up in difficulty by manually adding/subtracting from the AI's reaction speed
    def difficulty_adjust(self, player_reaction_time):
        if player_reaction_time < self.ai_reaction_time:
            self.ai_reaction_time = player_reaction_time



