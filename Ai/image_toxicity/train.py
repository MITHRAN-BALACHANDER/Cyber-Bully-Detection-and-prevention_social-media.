# train.py
# Fine-tune MobileNetV2 for NSFW image detection
# Uses CIFAR-10 as proxy dataset for demo (can be replaced with NSFW dataset)

import os
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Subset
from torchvision import models, transforms, datasets
from sklearn.metrics import accuracy_score, f1_score
from tqdm import tqdm
from pathlib import Path
import numpy as np

# Configuration
OUTPUT_DIR = Path("model/fine_tuned")
DATA_DIR = Path("data")
BATCH_SIZE = 32
EPOCHS = 3
LEARNING_RATE = 1e-4
TRAIN_SAMPLES = 5000  # Limit for faster training
VAL_SAMPLES = 1000


class NSFWMobileNet(nn.Module):
    """MobileNetV2 for NSFW detection."""
    
    def __init__(self, num_classes=2, pretrained=True):
        super().__init__()
        self.base = models.mobilenet_v2(
            weights=models.MobileNet_V2_Weights.IMAGENET1K_V1 if pretrained else None
        )
        
        # Freeze early layers
        for param in self.base.features[:10].parameters():
            param.requires_grad = False
        
        # Replace classifier
        in_features = self.base.classifier[1].in_features
        self.base.classifier = nn.Sequential(
            nn.Dropout(p=0.3),
            nn.Linear(in_features, num_classes)
        )
    
    def forward(self, x):
        return self.base(x)


def get_transforms():
    """Get train and validation transforms."""
    train_transform = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.RandomCrop(224),
        transforms.RandomHorizontalFlip(),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    
    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    
    return train_transform, val_transform


class BinaryLabelDataset(torch.utils.data.Dataset):
    """Wrapper to convert multi-class to binary."""
    
    def __init__(self, dataset, safe_classes, nsfw_classes):
        self.dataset = dataset
        self.safe_classes = safe_classes
        self.nsfw_classes = nsfw_classes
        
        # Filter to only include relevant classes
        self.indices = []
        for i, (_, label) in enumerate(dataset):
            if label in safe_classes or label in nsfw_classes:
                self.indices.append(i)
    
    def __len__(self):
        return len(self.indices)
    
    def __getitem__(self, idx):
        image, label = self.dataset[self.indices[idx]]
        # Convert to binary: 0=safe, 1=nsfw
        binary_label = 0 if label in self.safe_classes else 1
        return image, binary_label


def load_proxy_data():
    """Load CIFAR-10 as proxy dataset.
    
    Maps:
    - Safe: airplane, automobile, ship, truck (vehicles)
    - NSFW proxy: bird, cat, deer, dog, frog, horse (animals - just for demo)
    
    In production, replace with actual NSFW dataset.
    """
    print("Loading CIFAR-10 as proxy dataset...")
    print("Note: Replace with actual NSFW dataset for production use.\n")
    
    DATA_DIR.mkdir(exist_ok=True)
    train_transform, val_transform = get_transforms()
    
    # Download CIFAR-10
    train_dataset = datasets.CIFAR10(DATA_DIR, train=True, download=True, transform=train_transform)
    val_dataset = datasets.CIFAR10(DATA_DIR, train=False, download=True, transform=val_transform)
    
    # CIFAR-10 classes: airplane(0), automobile(1), bird(2), cat(3), deer(4),
    #                   dog(5), frog(6), horse(7), ship(8), truck(9)
    safe_classes = {0, 1, 8, 9}  # Vehicles
    nsfw_classes = {2, 3, 4, 5, 6, 7}  # Animals (proxy for NSFW)
    
    train_binary = BinaryLabelDataset(train_dataset, safe_classes, nsfw_classes)
    val_binary = BinaryLabelDataset(val_dataset, safe_classes, nsfw_classes)
    
    # Limit samples
    if TRAIN_SAMPLES and len(train_binary) > TRAIN_SAMPLES:
        train_binary = Subset(train_binary, range(TRAIN_SAMPLES))
    if VAL_SAMPLES and len(val_binary) > VAL_SAMPLES:
        val_binary = Subset(val_binary, range(VAL_SAMPLES))
    
    return train_binary, val_binary


def train_epoch(model, loader, criterion, optimizer, device):
    """Train for one epoch."""
    model.train()
    total_loss = 0
    all_preds = []
    all_labels = []
    
    progress = tqdm(loader, desc="Training")
    for images, labels in progress:
        images = images.to(device)
        labels = labels.to(device)
        
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        
        loss.backward()
        optimizer.step()
        
        total_loss += loss.item()
        preds = torch.argmax(outputs, dim=1)
        all_preds.extend(preds.cpu().numpy())
        all_labels.extend(labels.cpu().numpy())
        
        progress.set_postfix({"loss": f"{loss.item():.4f}"})
    
    accuracy = accuracy_score(all_labels, all_preds)
    return total_loss / len(loader), accuracy


def evaluate(model, loader, criterion, device):
    """Evaluate model."""
    model.eval()
    total_loss = 0
    all_preds = []
    all_labels = []
    
    with torch.no_grad():
        for images, labels in tqdm(loader, desc="Evaluating"):
            images = images.to(device)
            labels = labels.to(device)
            
            outputs = model(images)
            loss = criterion(outputs, labels)
            
            total_loss += loss.item()
            preds = torch.argmax(outputs, dim=1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
    
    accuracy = accuracy_score(all_labels, all_preds)
    f1 = f1_score(all_labels, all_preds, average='binary')
    return total_loss / len(loader), accuracy, f1


def save_model(model):
    """Save model checkpoint."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), OUTPUT_DIR / "model.pth")
    print(f"Model saved to: {OUTPUT_DIR.resolve()}")


def main():
    # Setup device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    
    # Load data
    train_data, val_data = load_proxy_data()
    
    train_loader = DataLoader(train_data, batch_size=BATCH_SIZE, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_data, batch_size=BATCH_SIZE, num_workers=0)
    
    print(f"Train samples: {len(train_data)}")
    print(f"Val samples: {len(val_data)}")
    
    # Create model
    print("\nCreating MobileNetV2 model...")
    model = NSFWMobileNet(num_classes=2, pretrained=True)
    model.to(device)
    
    # Training setup
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=LEARNING_RATE
    )
    
    print(f"\nStarting training for {EPOCHS} epochs...")
    print("-" * 50)
    
    best_f1 = 0
    
    for epoch in range(EPOCHS):
        train_loss, train_acc = train_epoch(model, train_loader, criterion, optimizer, device)
        val_loss, val_acc, val_f1 = evaluate(model, val_loader, criterion, device)
        
        print(f"\nEpoch {epoch+1}/{EPOCHS}")
        print(f"  Train Loss: {train_loss:.4f}, Acc: {train_acc:.4f}")
        print(f"  Val Loss: {val_loss:.4f}, Acc: {val_acc:.4f}, F1: {val_f1:.4f}")
        
        if val_f1 > best_f1:
            best_f1 = val_f1
            save_model(model)
            print(f"  ✅ New best model saved (F1: {val_f1:.4f})")
    
    print("\n" + "=" * 50)
    print(f"Training complete! Best F1: {best_f1:.4f}")
    print(f"Model saved to: {OUTPUT_DIR.resolve()}")
    print("\nNext: Run 'python export.py' to create ONNX model")


if __name__ == "__main__":
    main()
