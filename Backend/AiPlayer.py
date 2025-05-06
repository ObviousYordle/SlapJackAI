
import os
from typing import List

import keras


from Player import Player
import numpy as np
import tensorflow as tf
import joblib
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
#from PIL import Image
from pathlib import Path
from Card import Card

#Get the path to where the pre trained AI model for reaction time is stored and load it in order to use the model on predicting its reaction speed based on the user's times.
AImodel_path = os.path.join(os.path.dirname(__file__), "..", "AIModel", "reaction_time_model.pkl")
model = joblib.load(AImodel_path)

#Get path for the cnn model that did binary classification on jack and not jack cards
#I'm using the NEW_CNN_MODEL.KERAS since the old one (cnn_model.keras) was trained on a dataset that was images of the cards on a tables but im feeding in rendered cards from the game so the model
# was very inaccurate with that. The new model is trained on rendered images of cards and the model did a lot better in predicting jack or not jack. 
CNNModel_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "AIModel", "new_cnn_model.keras"))
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
            
            img = keras.utils.load_img(image_path, target_size=(224, 224))

            img_array = image.img_to_array(img) 
            img_array = np.expand_dims(img_array, axis=0)  

            prediction = cnn_model.predict(img_array)
            score = float(prediction[0][0])
            #return true if predictor classfiy score as 0 since 0 is considered as a Jack and if it is 1 then it is not a jack
            return round(score, 2) == 0
        except Exception as e:
            print(f"Error predicting Jack card: {e}")
            return False
        

    @staticmethod
    def check_slap(center_pile: list[Card], image_base_path: Path) -> bool:
        if not center_pile:
            return False

        top_card = center_pile[-1]
        image_url = top_card.get_imageFileName()
        image_name = os.path.basename(image_url)
        image_path = image_base_path / image_name


        #return true is the top card is a Jack else return false
        #Depending on true or false the ai will either slap or not slap the card
        if AiPlayer.is_jack_card(image_path):
            print(f"AI Slapped! Jack detected: {top_card}")
            return True
        else:
            print(f"AI Didn't Slap: Top card is not a Jack - {top_card}")
            return False

