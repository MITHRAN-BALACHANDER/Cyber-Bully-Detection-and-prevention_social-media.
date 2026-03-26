# export.py
# Export fine-tuned model to ONNX (full precision, no quantization)
# For mobile deployment with maximum accuracy

import torch
import onnx
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from pathlib import Path

MODEL_DIR = Path("model/fine_tuned")
ONNX_PATH = Path("model/toxicity.onnx")
MAX_LEN = 128


def export_to_onnx():
    """Export fine-tuned model to ONNX format."""
    
    if not MODEL_DIR.exists():
        raise FileNotFoundError(
            f"Fine-tuned model not found at: {MODEL_DIR}\n"
            "Run 'python train.py' first to train the model."
        )
    
    print(f"Loading fine-tuned model from: {MODEL_DIR}")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR)
    model.eval()
    
    # Prepare dummy input
    dummy = tokenizer(
        "example text for export",
        return_tensors="pt",
        max_length=MAX_LEN,
        padding="max_length",
        truncation=True
    )
    
    # Export to ONNX
    print("Exporting to ONNX...")
    ONNX_PATH.parent.mkdir(parents=True, exist_ok=True)
    
    torch.onnx.export(
        model,
        (dummy["input_ids"], dummy["attention_mask"]),
        str(ONNX_PATH),
        input_names=["input_ids", "attention_mask"],
        output_names=["logits"],
        dynamic_axes={
            "input_ids": {0: "batch", 1: "sequence"},
            "attention_mask": {0: "batch", 1: "sequence"},
            "logits": {0: "batch"}
        },
        opset_version=14,
        do_constant_folding=True,
        verbose=False
    )
    
    # Check if external data was created
    data_file = Path(str(ONNX_PATH) + ".data")
    if data_file.exists():
        print("Converting to self-contained model...")
        onnx_model = onnx.load(str(ONNX_PATH), load_external_data=True)
        onnx.save_model(onnx_model, str(ONNX_PATH), save_as_external_data=False)
        data_file.unlink()  # Remove external data file
    
    file_size = ONNX_PATH.stat().st_size / (1024 * 1024)
    print(f"\n✅ ONNX Model Saved: {ONNX_PATH.resolve()}")
    print(f"   Size: {file_size:.1f} MB (full precision for maximum accuracy)")


def verify_model():
    """Verify ONNX model works correctly."""
    import onnxruntime as ort
    import numpy as np
    
    print("\nVerifying model...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
    session = ort.InferenceSession(str(ONNX_PATH), providers=["CPUExecutionProvider"])
    
    # Test inputs
    test_texts = [
        "You are amazing and I appreciate you!",
        "You are stupid and nobody likes you"
    ]
    
    for text in test_texts:
        enc = tokenizer(text, return_tensors="pt", max_length=MAX_LEN, padding="max_length", truncation=True)
        
        outputs = session.run(
            None,
            {
                "input_ids": enc["input_ids"].numpy(),
                "attention_mask": enc["attention_mask"].numpy()
            }
        )
        
        logits = outputs[0][0]
        probs = 1 / (1 + np.exp(-logits))  # Softmax alternative for binary
        pred = np.argmax(logits)
        confidence = np.max(probs)
        
        label = "HARASSMENT" if pred == 1 else "SAFE"
        print(f'  "{text[:40]}..." -> {label} ({confidence:.1%})')
    
    print("\n✅ Model verification complete!")
    print("Run 'python inference.py' to use the model.")


if __name__ == "__main__":
    export_to_onnx()
    verify_model()
