
import cv2
import onnxruntime as ort
import numpy as np

class AIEngine:
    def __init__(self, model_path):
        self.model_path = model_path
        self.session = ort.InferenceSession(model_path)
    
    def preprocess(self, image_path):
        image = cv2.imread(image_path, cv2.IMREAD_COLOR)
        image = cv2.resize(image, (224, 224))
        image = image.astype(np.float32) / 255.0
        image = np.transpose(image, (2, 0, 1))
        return np.expand_dims(image, axis=0)
    
    def predict(self, image_path):
        input_data = self.preprocess(image_path)
        input_name = self.session.get_inputs()[0].name
        outputs = self.session.run(None, {input_name: input_data})
        return outputs

# Example usage:
# engine = AIEngine("model.onnx")
# prediction = engine.predict("sample_image.jpg")
# print(prediction)
