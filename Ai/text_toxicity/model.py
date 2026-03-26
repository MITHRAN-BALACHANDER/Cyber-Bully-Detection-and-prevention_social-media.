# model.py
# Simple PyTorch Hugging Face loader for quick local inference (non-quantized)
import torch
import numpy as np
from transformers import AutoTokenizer, AutoModelForSequenceClassification

MODEL_NAME = "microsoft/xtremedistil-l6-h384-uncased"
LABELS = ["toxicity", "insult", "obscene", "threat", "hate"]
MAX_LEN = 128

class ToxicityModel:
    def __init__(self, model_name: str = MODEL_NAME):
        print(f"Loading tokenizer & model from '{model_name}' ...")
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        # instantiate model with expected number of labels (multi-label setup)
        self.model = AutoModelForSequenceClassification.from_pretrained(
            model_name,
            num_labels=len(LABELS),
        )
        # Ensure multi-label behavior if you fine-tune later
        self.model.config.problem_type = "multi_label_classification"
        self.model.eval()
        # use cpu by default; move to cuda if available and desired
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model.to(self.device)

    def predict(self, text: str):
        if not isinstance(text, list):
            texts = [text]
        else:
            texts = text

        enc = self.tokenizer(
            texts,
            padding="max_length",
            truncation=True,
            max_length=MAX_LEN,
            return_tensors="pt"
        ).to(self.device)

        with torch.no_grad():
            outputs = self.model(**enc)
            logits = outputs.logits  # shape (batch, num_labels)

        probs = torch.sigmoid(logits).cpu().numpy()
        results = [dict(zip(LABELS, p.tolist())) for p in probs]
        return results if len(results) > 1 else results[0]

if __name__ == "__main__":
    m = ToxicityModel()
    samples = [
        "You are amazing and talented!",
        "You are a stupid idiot. Shut up!"
    ]
    out = m.predict(samples)
    print("Predictions:")
    print(out)
