# inference.py
# Harassment detection using fine-tuned ONNX model
# Clear binary output: HARASSMENT or SAFE

import sys
import numpy as np
import onnxruntime as ort
from transformers import AutoTokenizer
from pathlib import Path

MODEL_DIR = Path(__file__).parent / "model"
FINE_TUNED_DIR = MODEL_DIR / "fine_tuned"
ONNX_MODEL = MODEL_DIR / "toxicity.onnx"
MAX_LEN = 128


class HarassmentDetector:
    """Detect harassment in text using fine-tuned model."""
    
    def __init__(self, use_onnx: bool = True):
        """
        Initialize detector.
        
        Args:
            use_onnx: Use ONNX model (faster) or PyTorch (if ONNX not available)
        """
        self.use_onnx = use_onnx and ONNX_MODEL.exists()
        
        # Load tokenizer
        tokenizer_path = FINE_TUNED_DIR if FINE_TUNED_DIR.exists() else "microsoft/xtremedistil-l6-h384-uncased"
        print(f"Loading tokenizer...")
        self.tokenizer = AutoTokenizer.from_pretrained(tokenizer_path)
        
        if self.use_onnx:
            print(f"Loading ONNX model: {ONNX_MODEL}")
            self.session = ort.InferenceSession(str(ONNX_MODEL), providers=["CPUExecutionProvider"])
        else:
            print(f"Loading PyTorch model: {FINE_TUNED_DIR}")
            from transformers import AutoModelForSequenceClassification
            import torch
            self.model = AutoModelForSequenceClassification.from_pretrained(FINE_TUNED_DIR)
            self.model.eval()
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            self.model.to(self.device)
        
        print("Model loaded!\n")

    def predict(self, text: str) -> dict:
        """
        Predict if text contains harassment.
        
        Returns:
            dict with keys: is_harassment (bool), confidence (float), label (str)
        """
        enc = self.tokenizer(
            text,
            padding="max_length",
            truncation=True,
            max_length=MAX_LEN,
            return_tensors="pt" if not self.use_onnx else "np"
        )
        
        if self.use_onnx:
            outputs = self.session.run(
                None,
                {
                    "input_ids": enc["input_ids"].astype(np.int64),
                    "attention_mask": enc["attention_mask"].astype(np.int64)
                }
            )
            logits = outputs[0][0]
        else:
            import torch
            with torch.no_grad():
                enc = {k: v.to(self.device) for k, v in enc.items()}
                outputs = self.model(**enc)
                logits = outputs.logits[0].cpu().numpy()
        
        # Apply softmax
        exp_logits = np.exp(logits - np.max(logits))
        probs = exp_logits / exp_logits.sum()
        
        pred_class = np.argmax(probs)
        confidence = probs[pred_class]
        
        is_harassment = pred_class == 1
        
        return {
            "is_harassment": is_harassment,
            "confidence": float(confidence),
            "label": "HARASSMENT" if is_harassment else "SAFE",
            "safe_prob": float(probs[0]),
            "harassment_prob": float(probs[1])
        }

    def analyze(self, text: str) -> dict:
        """Analyze text and print formatted results."""
        result = self.predict(text)
        
        print(f'Input: "{text}"')
        print("-" * 50)
        
        if result["is_harassment"]:
            print(f"🔴 {result['label']} DETECTED")
            bar = "█" * int(result['harassment_prob'] * 20)
            print(f"   Harassment: [{bar:20s}] {result['harassment_prob']:.1%}")
        else:
            print(f"🟢 {result['label']}")
            bar = "█" * int(result['safe_prob'] * 20)
            print(f"   Safe:       [{bar:20s}] {result['safe_prob']:.1%}")
        
        print(f"   Confidence: {result['confidence']:.1%}")
        
        return result


def main():
    """Interactive harassment detection."""
    
    # Check if model exists
    if not FINE_TUNED_DIR.exists() and not ONNX_MODEL.exists():
        print("❌ No fine-tuned model found!")
        print("Run 'python train.py' first to train the model.")
        print("Then run 'python export.py' to create ONNX model.")
        return
    
    detector = HarassmentDetector()
    
    # Command line mode
    if len(sys.argv) > 1:
        text = " ".join(sys.argv[1:])
        detector.analyze(text)
        return
    
    # Interactive mode
    print("=" * 50)
    print("Harassment Detector - Interactive Mode")
    print("Type 'quit' or 'exit' to stop")
    print("=" * 50)
    
    while True:
        try:
            text = input("\nEnter text: ").strip()
            if text.lower() in ("quit", "exit", "q"):
                print("Goodbye!")
                break
            if not text:
                continue
            
            print()
            detector.analyze(text)
            
        except KeyboardInterrupt:
            print("\nGoodbye!")
            break


if __name__ == "__main__":
    main()
