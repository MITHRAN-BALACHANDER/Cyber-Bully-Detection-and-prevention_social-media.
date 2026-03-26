# export.py
# Export fine-tuned MobileNetV2 NSFW model to ONNX

import torch
import torch.nn as nn
import onnx
from torchvision import models
from pathlib import Path
import numpy as np

MODEL_DIR = Path("model")
FINE_TUNED_DIR = MODEL_DIR / "fine_tuned"
ONNX_PATH = MODEL_DIR / "nsfw_mobilenet.onnx"


class NSFWMobileNet(nn.Module):
    """MobileNetV2 for NSFW detection."""
    
    def __init__(self, num_classes=2):
        super().__init__()
        self.base = models.mobilenet_v2(weights=None)
        
        in_features = self.base.classifier[1].in_features
        self.base.classifier = nn.Sequential(
            nn.Dropout(p=0.3),
            nn.Linear(in_features, num_classes)
        )
    
    def forward(self, x):
        return self.base(x)


def export_to_onnx():
    """Export MobileNetV2 NSFW model to ONNX."""
    MODEL_DIR.mkdir(exist_ok=True)
    
    model = NSFWMobileNet(num_classes=2)
    
    # Load fine-tuned weights if available
    weights_path = FINE_TUNED_DIR / "model.pth"
    if weights_path.exists():
        print(f"Loading fine-tuned weights from: {weights_path}")
        model.load_state_dict(torch.load(weights_path, map_location="cpu"))
        print("✅ Fine-tuned weights loaded!")
    else:
        print("⚠️ No fine-tuned weights found. Using ImageNet pretrained weights.")
        model.base = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.IMAGENET1K_V1)
        in_features = model.base.classifier[1].in_features
        model.base.classifier = nn.Sequential(
            nn.Dropout(p=0.3),
            nn.Linear(in_features, 2)
        )
    
    model.eval()
    
    # Dummy input
    dummy_input = torch.randn(1, 3, 224, 224)
    
    print("Exporting to ONNX...")
    torch.onnx.export(
        model,
        dummy_input,
        str(ONNX_PATH),
        input_names=["pixel_values"],
        output_names=["logits"],
        dynamic_axes={
            "pixel_values": {0: "batch"},
            "logits": {0: "batch"}
        },
        opset_version=14,
        do_constant_folding=True
    )
    
    # Merge external data if created
    data_file = Path(str(ONNX_PATH) + ".data")
    if data_file.exists():
        print("Merging external data...")
        onnx_model = onnx.load(str(ONNX_PATH), load_external_data=True)
        onnx.save_model(onnx_model, str(ONNX_PATH), save_as_external_data=False)
        data_file.unlink()
    
    file_size = ONNX_PATH.stat().st_size / (1024 * 1024)
    print(f"\n✅ ONNX Model Saved: {ONNX_PATH.resolve()}")
    print(f"   Size: {file_size:.1f} MB")


def verify_model():
    """Verify ONNX model."""
    import onnxruntime as ort
    
    print("\nVerifying model...")
    session = ort.InferenceSession(str(ONNX_PATH), providers=["CPUExecutionProvider"])
    
    test_input = np.random.randn(1, 3, 224, 224).astype(np.float32)
    outputs = session.run(None, {"pixel_values": test_input})
    
    logits = outputs[0][0]
    probs = np.exp(logits) / np.exp(logits).sum()
    
    print(f"  Output: Safe={probs[0]:.2%}, NSFW={probs[1]:.2%}")
    print("\n✅ Model verification passed!")
    print("Run 'python inference.py <image_path>' to test.")


if __name__ == "__main__":
    export_to_onnx()
    verify_model()
