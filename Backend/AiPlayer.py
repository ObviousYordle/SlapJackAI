
import os
from typing import List


from Player import Player
import numpy as np
import tensorflow as tf
import joblib
from tensorflow.keras.models import load_model

#Get the path to where the pre trained AI model for reaction time is stored and load it in order to use the model on predicting its reaction speed based on the user's times.
AImodel_path = os.path.join(os.path.dirname(__file__), "..", "AIModel", "reaction_time_model.pkl")
model = joblib.load(AImodel_path)

"""AiPlayer inherits Player, gets same moves but has added difficulty changer"""
class AiPlayer(Player):


    def __init__(self, name):
        super().__init__(name)
        self.ai_reaction_time = None  



    @staticmethod
    def predict_ai_reaction(reaction_times: List[float]) -> float:
        input_array = np.array(reaction_times).reshape(1, -1)
        prediction = model.predict(input_array)
        return prediction[0]



