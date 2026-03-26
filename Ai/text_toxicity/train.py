# train.py
# Fine-tune toxicity detection model on Jigsaw dataset
# Binary classification: harassment vs safe

import os
import torch
from torch.utils.data import DataLoader
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    get_linear_schedule_with_warmup
)
from datasets import load_dataset
from sklearn.metrics import accuracy_score, f1_score, classification_report
from tqdm import tqdm
from pathlib import Path

# Configuration
MODEL_NAME = "microsoft/xtremedistil-l6-h384-uncased"
OUTPUT_DIR = Path("model/fine_tuned")
MAX_LEN = 128
BATCH_SIZE = 32
EPOCHS = 3
LEARNING_RATE = 2e-5
TRAIN_SAMPLES = 50000  # Limit training samples for practical CPU training (~1-2 hours)

# Global tokenizer reference
_tokenizer = None


def load_jigsaw_dataset():
    """Load and preprocess Jigsaw toxic comment dataset."""
    print("Loading Jigsaw dataset from Hugging Face...")
    
    # Load the dataset
    dataset = load_dataset("SetFit/toxic_conversations", trust_remote_code=True)
    
    print(f"Train samples: {len(dataset['train'])}")
    print(f"Test samples: {len(dataset['test'])}")
    
    return dataset


def preprocess_data(dataset, tokenizer, max_samples=None):
    """Tokenize dataset for training."""
    
    def tokenize_function(examples):
        return tokenizer(
            examples["text"],
            padding="max_length",
            truncation=True,
            max_length=MAX_LEN
        )
    
    # Apply tokenization
    tokenized = dataset.map(tokenize_function, batched=True, remove_columns=["text"])
    
    # Rename label column for consistency
    tokenized = tokenized.rename_column("label", "labels")
    
    # Set format for PyTorch
    tokenized.set_format("torch", columns=["input_ids", "attention_mask", "labels"])
    
    if max_samples:
        tokenized["train"] = tokenized["train"].select(range(min(max_samples, len(tokenized["train"]))))
    
    return tokenized


def train_model(model, train_loader, val_loader, device, epochs=EPOCHS):
    """Train the model."""
    global _tokenizer
    
    optimizer = torch.optim.AdamW(model.parameters(), lr=LEARNING_RATE)
    total_steps = len(train_loader) * epochs
    scheduler = get_linear_schedule_with_warmup(
        optimizer,
        num_warmup_steps=int(0.1 * total_steps),
        num_training_steps=total_steps
    )
    
    best_f1 = 0
    
    for epoch in range(epochs):
        # Training
        model.train()
        total_loss = 0
        progress = tqdm(train_loader, desc=f"Epoch {epoch+1}/{epochs} [Train]")
        
        for batch in progress:
            optimizer.zero_grad()
            
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["labels"].to(device)
            
            outputs = model(
                input_ids=input_ids,
                attention_mask=attention_mask,
                labels=labels
            )
            
            loss = outputs.loss
            total_loss += loss.item()
            
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            scheduler.step()
            
            progress.set_postfix({"loss": f"{loss.item():.4f}"})
        
        avg_loss = total_loss / len(train_loader)
        print(f"Epoch {epoch+1} - Average Loss: {avg_loss:.4f}")
        
        # Validation
        val_accuracy, val_f1 = evaluate_model(model, val_loader, device)
        print(f"Validation - Accuracy: {val_accuracy:.4f}, F1: {val_f1:.4f}")
        
        # Save best model
        if val_f1 > best_f1:
            best_f1 = val_f1
            save_model(model)
            print(f"✅ New best model saved (F1: {val_f1:.4f})")
    
    return best_f1


def evaluate_model(model, loader, device):
    """Evaluate model on validation/test set."""
    model.eval()
    all_preds = []
    all_labels = []
    
    with torch.no_grad():
        for batch in tqdm(loader, desc="Evaluating"):
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["labels"]
            
            outputs = model(input_ids=input_ids, attention_mask=attention_mask)
            preds = torch.argmax(outputs.logits, dim=1).cpu()
            
            all_preds.extend(preds.tolist())
            all_labels.extend(labels.tolist())
    
    accuracy = accuracy_score(all_labels, all_preds)
    f1 = f1_score(all_labels, all_preds, average="binary")
    
    return accuracy, f1


def save_model(model):
    """Save model and tokenizer."""
    global _tokenizer
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    model.save_pretrained(OUTPUT_DIR)
    _tokenizer.save_pretrained(OUTPUT_DIR)
    print(f"Model saved to: {OUTPUT_DIR.resolve()}")


def main():
    global _tokenizer
    
    # Setup device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    
    if device.type == "cuda":
        print(f"GPU: {torch.cuda.get_device_name(0)}")
    
    # Load tokenizer and model
    print(f"\nLoading model: {MODEL_NAME}")
    _tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForSequenceClassification.from_pretrained(
        MODEL_NAME,
        num_labels=2  # Binary: harassment vs safe
    )
    model.to(device)
    
    # Load and preprocess dataset
    dataset = load_jigsaw_dataset()
    tokenized = preprocess_data(dataset, _tokenizer, max_samples=TRAIN_SAMPLES)
    
    # Create data loaders
    train_loader = DataLoader(
        tokenized["train"],
        batch_size=BATCH_SIZE,
        shuffle=True
    )
    val_loader = DataLoader(
        tokenized["test"],
        batch_size=BATCH_SIZE
    )
    
    print(f"\nTraining on {len(tokenized['train'])} samples")
    print(f"Validating on {len(tokenized['test'])} samples")
    print(f"Batch size: {BATCH_SIZE}, Epochs: {EPOCHS}")
    print("-" * 50)
    
    # Train
    best_f1 = train_model(model, train_loader, val_loader, device)
    
    print("\n" + "=" * 50)
    print(f"Training complete! Best F1 Score: {best_f1:.4f}")
    print(f"Model saved to: {OUTPUT_DIR.resolve()}")
    print("\nNext step: Run 'python export.py' to create ONNX model")


if __name__ == "__main__":
    main()

