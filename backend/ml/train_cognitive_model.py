"""
MEMORA COGNITIVE DIFFICULTY PERSONALIZATION - ML TRAINING PIPELINE
==================================================================
DATASET NOTICE:
This module generates and trains on a SYNTHETIC prototype dataset
modeled after cognitive gameplay trajectories for development and testing.
THIS DATA DOES NOT ORIGINATE FROM REAL DEMENTIA PATIENTS OR CLINICAL TRIALS.
Intended solely for supportive cognitive interaction and non-clinical prototyping.
"""

import os
import json
import math
import random
from datetime import datetime
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import joblib

# Random seeds for reproducibility
SEED = 42
random.seed(SEED)
np.random.seed(SEED)

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_JSON_PATH = os.path.join(OUTPUT_DIR, "cognitive_difficulty_model.json")
MODEL_JOBLIB_PATH = os.path.join(OUTPUT_DIR, "cognitive_difficulty_model.joblib")
DATASET_METADATA_PATH = os.path.join(OUTPUT_DIR, "synthetic_dataset_metadata.json")

FEATURE_NAMES = [
    "recent_avg_score",        # float 0.0 - 100.0
    "recent_mistakes",         # float 0.0 - 8.0
    "response_time_sec",       # float 3.0 - 120.0
    "current_difficulty",      # int 1 - 5
    "consecutive_successes",   # int 0 - 6
    "num_recent_attempts",     # int 1 - 10
    "cognitive_domain",        # int 0 - 5 (recall, recognition, associative_memory, problem_solving, categorization, visual_spatial)
    "recent_trend",            # float -40.0 to +40.0 (recent score delta)
]

COGNITIVE_DOMAINS = {
    "recall": 0,
    "recognition": 1,
    "associative_memory": 2,
    "problem_solving": 3,
    "categorization": 4,
    "visual_spatial": 5
}

DIFFICULTY_CLASSES = [1, 2, 3, 4, 5]


def generate_synthetic_cognitive_dataset(num_samples: int = 3000):
    """
    Generates a synthetic gameplay trajectory dataset for prototype development.
    
    IMPORTANT CLINICAL DISCLAIMER:
    This dataset is programmatically synthesized based on theoretical gameplay mechanics.
    It DOES NOT represent clinical trial data or measurements from real dementia patients.
    """
    X = []
    y = []

    for _ in range(num_samples):
        # 1. Sample current difficulty
        current_diff = random.randint(1, 5)

        # 2. Sample cognitive domain
        domain_idx = random.randint(0, 5)

        # 3. Simulate patient state archetype:
        # Archetypes:
        # A. Excelling / Ready for progression (30%)
        # B. Steady / Comfortable at current level (45%)
        # C. Struggling / In need of simplification (25%)
        archetype = random.choices(["excelling", "steady", "struggling"], weights=[0.30, 0.45, 0.25])[0]

        if archetype == "excelling":
            recent_avg_score = random.uniform(82.0, 100.0)
            recent_mistakes = random.uniform(0.0, 1.2)
            response_time = random.uniform(5.0, 28.0)
            consecutive_successes = random.randint(2, 6)
            num_attempts = random.randint(2, 8)
            recent_trend = random.uniform(5.0, 30.0)

            # Target should increase level by 1, clamped to 5
            target_diff = min(5, current_diff + 1)

        elif archetype == "struggling":
            recent_avg_score = random.uniform(25.0, 58.0)
            recent_mistakes = random.uniform(2.5, 7.5)
            response_time = random.uniform(40.0, 110.0)
            consecutive_successes = random.randint(0, 1)
            num_attempts = random.randint(1, 6)
            recent_trend = random.uniform(-35.0, -5.0)

            # Target should decrease level by 1, clamped to 1
            target_diff = max(1, current_diff - 1)

        else:  # steady
            recent_avg_score = random.uniform(60.0, 81.0)
            recent_mistakes = random.uniform(0.8, 2.4)
            response_time = random.uniform(20.0, 55.0)
            consecutive_successes = random.randint(1, 3)
            num_attempts = random.randint(1, 7)
            recent_trend = random.uniform(-8.0, 12.0)

            # Target remains at current level
            target_diff = current_diff

        # Introduce realistic sensory/behavioral noise (5% accidental transitions)
        if random.random() < 0.05:
            target_diff = random.choice([max(1, target_diff - 1), min(5, target_diff + 1)])

        features = [
            round(recent_avg_score, 2),
            round(recent_mistakes, 2),
            round(response_time, 2),
            current_diff,
            consecutive_successes,
            num_attempts,
            domain_idx,
            round(recent_trend, 2)
        ]

        X.append(features)
        y.append(target_diff)

    return np.array(X, dtype=np.float32), np.array(y, dtype=np.int32)


def train_and_export_model():
    print("=" * 70)
    print("MEMORA COGNITIVE DIFFICULTY ON-DEVICE ML TRAINING PIPELINE")
    print("=" * 70)
    print("DISCLAIMER: Using SYNTHETIC dataset for prototype demonstration.")
    print("NOT derived from real dementia patients or clinical trials.\n")

    # 1. Generate synthetic dataset
    print("[1/5] Generating synthetic dataset (3,000 gameplay records)...")
    X, y = generate_synthetic_cognitive_dataset(num_samples=3000)

    # 2. Train-Validation Split (80% train, 20% validation)
    print("[2/5] Splitting dataset into 80% Train, 20% Validation...")
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.20, random_state=SEED, stratify=y
    )

    # 3. Fit Standard Scaler
    print("[3/5] Normalizing input features with StandardScaler...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)

    # 4. Train Multi-Layer Perceptron (MLP) Classifier
    # 8 inputs -> Dense(16, ReLU) -> Dense(5, Softmax)
    # Extremely lightweight (< 230 parameters), easily serializable to zero-dependency JSON.
    print("[4/5] Training lightweight Multi-Layer Perceptron (MLPClassifier)...")
    model = MLPClassifier(
        hidden_layer_sizes=(16,),
        activation='relu',
        solver='adam',
        alpha=0.001,
        batch_size=32,
        learning_rate_init=0.01,
        max_iter=300,
        random_state=SEED,
        early_stopping=True,
        n_iter_no_change=15
    )
    model.fit(X_train_scaled, y_train)

    train_pred = model.predict(X_train_scaled)
    val_pred = model.predict(X_val_scaled)

    train_acc = float(accuracy_score(y_train, train_pred))
    val_acc = float(accuracy_score(y_val, val_pred))

    print(f"       -> Training Accuracy:   {train_acc * 100:.2f}%")
    print(f"       -> Validation Accuracy: {val_acc * 100:.2f}%")

    # 5. Extract trained weights and biases for zero-dependency local evaluation
    print("[5/5] Serializing model parameters for offline on-device deployment...")
    # Layer 1: weights (8, 16), biases (16,)
    W1 = model.coefs_[0].tolist()
    b1 = model.intercepts_[0].tolist()

    # Layer 2: weights (16, 5), biases (5,)
    W2 = model.coefs_[1].tolist()
    b2 = model.intercepts_[1].tolist()

    export_payload = {
        "model_type": "MLPClassifier",
        "version": "1.0.0",
        "description": "On-device lightweight neural network for cognitive gameplay difficulty progression (1-5)",
        "architecture": {
            "input_dim": 8,
            "hidden_dim": 16,
            "output_dim": 5,
            "hidden_activation": "relu",
            "output_activation": "softmax"
        },
        "feature_names": FEATURE_NAMES,
        "cognitive_domains": COGNITIVE_DOMAINS,
        "classes": DIFFICULTY_CLASSES,
        "scaler": {
            "mean": scaler.mean_.tolist(),
            "scale": scaler.scale_.tolist()
        },
        "weights": {
            "layer_1_weights": W1,
            "layer_1_biases": b1,
            "layer_2_weights": W2,
            "layer_2_biases": b2
        },
        "metrics": {
            "train_accuracy": train_acc,
            "validation_accuracy": val_acc,
            "num_training_samples": len(X_train),
            "num_validation_samples": len(X_val)
        },
        "metadata": {
            "trained_at": datetime.utcnow().isoformat(),
            "dataset_type": "synthetic_gameplay_trajectory_v1",
            "clinical_disclaimer": "SYNTHETIC PROTOTYPE MODEL: Intended solely for non-clinical cognitive gameplay stimulation. Not derived from clinical trial subjects."
        }
    }

    # Write serialized JSON model
    with open(MODEL_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(export_payload, f, indent=2)

    # Write joblib model
    joblib.dump({
        "model": model,
        "scaler": scaler,
        "feature_names": FEATURE_NAMES,
        "classes": DIFFICULTY_CLASSES
    }, MODEL_JOBLIB_PATH)

    # Write synthetic dataset metadata
    metadata = {
        "dataset_name": "memora_synthetic_cognitive_gameplay_v1",
        "generated_at": datetime.utcnow().isoformat(),
        "total_samples": len(X),
        "synthetic_notice": "Generated programmatically for prototype development. NOT real clinical trial data.",
        "feature_summary": {name: idx for idx, name in enumerate(FEATURE_NAMES)},
        "class_distribution": {
            f"level_{cls}": int(np.sum(y == cls)) for cls in DIFFICULTY_CLASSES
        },
        "train_samples": len(X_train),
        "validation_samples": len(X_val),
        "validation_accuracy": val_acc
    }
    with open(DATASET_METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    model_size_bytes = os.path.getsize(MODEL_JSON_PATH)
    print(f"\nModel exported successfully:")
    print(f" - JSON Model Path:   {MODEL_JSON_PATH} ({model_size_bytes / 1024:.2f} KB)")
    print(f" - Joblib Model Path: {MODEL_JOBLIB_PATH}")
    print(f" - Dataset Metadata:  {DATASET_METADATA_PATH}")

    return model, scaler, X_val, y_val, val_pred


if __name__ == "__main__":
    train_and_export_model()
