
import os
from typing import List


from Player import Player
import numpy as np
import tensorflow as tf
import joblib
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
from PIL import Image

#Get the path to where the pre trained AI model for reaction time is stored and load it in order to use the model on predicting its reaction speed based on the user's times.
AImodel_path = os.path.join(os.path.dirname(__file__), "..", "AIModel", "reaction_time_model.pkl")
model = joblib.load(AImodel_path)

CNNModel_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "AIModel", "cnn_model.keras"))
cnn_model = load_model(CNNModel_path)
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

    #Using the cnn model to see ifthe center card is a jack or not
    @staticmethod
    def is_jack_card(image_path: str) -> bool:
        
        #Resize, normalize, and add batch dimension to the given images of the card before prediction
        try:
            if not os.path.exists(image_path):
                print(f"Image path does not exist: {image_path}")
                return False
            img = Image.open(image_path).convert("RGB").resize((224, 224))
            img_array = image.img_to_array(img) / 255.0
            img_array = np.expand_dims(img_array, axis=0)  

            prediction = cnn_model.predict(img_array)[0][0]
            return prediction > 0.5  
        except Exception as e:
            print(f"Error predicting Jack card: {e}")
            return False

