# inference.py
# Image NSFW/Toxicity Detection using MobileNetV2
# Binary classification: NSFW vs SAFE
# Lightweight model for mobile deployment (~14MB)

import sys
import numpy as np
from pathlib import Path
from PIL import Image
import onnxruntime as ort

MODEL_DIR = Path(__file__).parent / "model"
ONNX_MODEL = MODEL_DIR / "nsfw_mobilenet.onnx"
VIT_MODEL = MODEL_DIR / "vit" / "nsfw.onnx"  # Backup ViT model


class NSFWDetector:
    """Detect NSFW/toxic content in images using MobileNetV2."""
    
    def __init__(self, model_path: str = None, use_vit: bool = False):
        """
        Initialize detector.
        
        Args:
            model_path: Custom model path
            use_vit: Use larger ViT model instead of MobileNetV2
        """
        if model_path:
            self.model_path = Path(model_path)
        elif use_vit and VIT_MODEL.exists():
            self.model_path = VIT_MODEL
            print("Using ViT model (larger, more accurate)")
        else:
            self.model_path = ONNX_MODEL
        
        if not self.model_path.exists():
            raise FileNotFoundError(
                f"Model not found: {self.model_path}\n"
                "Run 'python export.py' first to create the model."
            )
        
        print(f"Loading ONNX model: {self.model_path}")
        self.session = ort.InferenceSession(str(self.model_path), providers=["CPUExecutionProvider"])
        self.input_name = self.session.get_inputs()[0].name
        print("Model loaded!\n")
    
    def preprocess(self, image_path: str) -> np.ndarray:
        """Preprocess image for MobileNetV2."""
        image = Image.open(image_path).convert("RGB")
        image = image.resize((224, 224))
        
        # Convert to numpy and normalize (ImageNet stats)
        img_array = np.array(image).astype(np.float32) / 255.0
        mean = np.array([0.485, 0.456, 0.406])
        std = np.array([0.229, 0.224, 0.225])
        img_array = (img_array - mean) / std
        
        # Channel first format (B, C, H, W)
        img_array = img_array.transpose(2, 0, 1)
        img_array = np.expand_dims(img_array, 0).astype(np.float32)
        
        return img_array
    
    def predict(self, image_path: str) -> dict:
        """
        Predict if image contains NSFW content.
        
        Args:
            image_path: Path to image file
            
        Returns:
            dict with: is_nsfw (bool), confidence (float), label (str)
        """
        pixel_values = self.preprocess(image_path)
        
        outputs = self.session.run(None, {self.input_name: pixel_values})
        logits = outputs[0][0]
        
        # Apply softmax
        exp_logits = np.exp(logits - np.max(logits))
        probs = exp_logits / exp_logits.sum()
        
        # 0=safe, 1=nsfw
        pred_class = np.argmax(probs)
        confidence = probs[pred_class]
        is_nsfw = pred_class == 1
        
        return {
            "is_nsfw": is_nsfw,
            "confidence": float(confidence),
            "label": "NSFW" if is_nsfw else "SAFE",
            "safe_prob": float(probs[0]),
            "nsfw_prob": float(probs[1])
        }
    
    def analyze(self, image_path: str) -> dict:
        """Analyze image and print formatted results."""
        result = self.predict(image_path)
        
        print(f'Input: "{Path(image_path).name}"')
        print("-" * 50)
        
        if result["is_nsfw"]:
            print(f"🔴 {result['label']} CONTENT DETECTED")
            bar = "█" * int(result['nsfw_prob'] * 20)
            print(f"   NSFW:       [{bar:20s}] {result['nsfw_prob']:.1%}")
        else:
            print(f"🟢 {result['label']}")
            bar = "█" * int(result['safe_prob'] * 20)
            print(f"   Safe:       [{bar:20s}] {result['safe_prob']:.1%}")
        
        print(f"   Confidence: {result['confidence']:.1%}")
        
        return result


def main():
    """CLI for NSFW detection."""
    import argparse
    
    parser = argparse.ArgumentParser(description="NSFW Image Detection")
    parser.add_argument("image", nargs="?", help="Path to image")
    parser.add_argument("--vit", action="store_true", help="Use larger ViT model")
    args = parser.parse_args()
    
    # Check model exists
    if not ONNX_MODEL.exists():
        print("❌ MobileNetV2 model not found!")
        print("Run 'python export.py' first.\n")
        return
    
    detector = NSFWDetector(use_vit=args.vit)
    
    # Command line mode
    if args.image:
        if not Path(args.image).exists():
            print(f"Error: File not found: {args.image}")
            return
        detector.analyze(args.image)
        return
    
    # Interactive mode
    print("=" * 50)
    print("Image NSFW Detector - Interactive Mode")
    print("Enter image path or 'quit' to exit")
    print("=" * 50)
    
    while True:
        try:
            path = input("\nImage path: ").strip()
            if path.lower() in ("quit", "exit", "q"):
                print("Goodbye!")
                break
            if not path:
                continue
            if not Path(path).exists():
                print(f"File not found: {path}")
                continue
            
            print()
            detector.analyze(path)
            
        except KeyboardInterrupt:
            print("\nGoodbye!")
            break
        except Exception as e:
            print(f"Error: {e}")


if __name__ == "__main__":
    main()
