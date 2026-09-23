# Memora

### A dementia-friendly digital companion for meaningful cognitive engagement

Memora is a digital companion designed to make cognitive activities **simple, familiar, engaging, and accessible** for people living with dementia.

Instead of relying on text-heavy interfaces or complicated navigation, Memora uses a **visual-first experience** built around familiar images, simple interactions, and personalized activities.

The platform brings together two connected experiences:

* **Patient Companion** — provides simple cognitive and routine-based activities.
* **Caretaker Console** — allows caretakers to personalize the experience with content that is familiar and meaningful to the patient.

---

## The Problem

Dementia can affect memory, recognition, orientation, and the ability to follow complex instructions.

Many digital applications designed for general users can become difficult to use when they depend on:

* Large amounts of text
* Complex navigation
* Multiple steps
* Unfamiliar interfaces
* Generic activities that are not personally meaningful

Caretakers also need a simple way to incorporate the patient's own memories, routines, and familiar content into everyday activities.

### Our Goal

Memora aims to bridge this gap by creating an interface that is:

**Simple enough to use. Familiar enough to feel comfortable. Personal enough to matter.**

---

# How Memora Works

Memora has two primary sides.

```text
                    MEMORA
                       │
             ┌─────────┴─────────┐
             │                   │
        CARETAKER             PATIENT
             │                   │
             ↓                   ↓
    Personalize content      Start activities
             │                   │
      ┌──────┼──────┐       ┌────┼──────────┐
      ↓      ↓      ↓       ↓    ↓          ↓
   Photos  Routines  Info  Puzzle Shape   Routine &
                          Game   Game    Orientation
      │                   │
      └──────────┬────────┘
                 ↓
       Personalized experience
```

The caretaker provides familiar information and content, while the patient interacts with that content through simple activities.

---

# Caretaker Console

The Caretaker Console is designed to give caregivers control over the patient's experience.

Instead of using only predefined content, Memora allows the experience to be personalized around the individual.

### Caretakers can provide

* Familiar photographs
* Personal information
* Daily routines
* Other content that can be incorporated into activities

This creates an environment where activities can be based on **things the patient already knows and recognizes**.

---

# Patient Companion

The Patient Companion focuses on simple, visual interactions that require minimal reading and navigation.

The current experience includes three major activity concepts.

---

## 1. Memory Puzzle

The Memory Puzzle allows photographs provided by the caretaker to become part of a puzzle activity.

This means the patient can interact with images that may represent:

* Family members
* Familiar places
* Important moments
* Everyday surroundings
* Other personally meaningful photographs

### Flow

```text
Caretaker uploads image
        ↓
Image becomes activity content
        ↓
Patient opens Memory Puzzle
        ↓
Patient completes the puzzle
```

Using familiar photographs makes the activity more personal than using completely generic puzzle images.

---

## 2. Shape Matching

Shape Matching is a simple drag-and-drop activity.

The patient is presented with a canvas containing different shaped spaces and matching shapes outside the canvas.

The goal is to drag each shape into its corresponding space.

```text
        Shapes

       ●    ▲    ■

             ↓
          Drag & Drop

    ┌─────────────────┐
    │       ○         │
    │           △     │
    │   □             │
    └─────────────────┘
```

The activity focuses on visual recognition and straightforward physical interaction.

There is no complicated sequence of actions — the patient simply **recognizes, moves, and matches**.

---

## 3. Routine & Orientation

The Routine & Orientation activity presents questions based on familiar routines or basic personal information.

Instead of requiring the patient to type an answer, choices can be represented visually.

For example:

```text
What do you usually do in the morning?

   🥣             🛏️

 Breakfast       Sleep

   🌳             📺

 Go outside      Watch TV
```

The emphasis is on **recognition rather than reading or typing**.

This allows routine-based questions to be presented in a way that is easier to understand and interact with.

---

# Design Principles

Memora is built around a few core principles.

## Visual First

Images, icons, shapes, and visual choices are prioritized over large amounts of text.

## Simple Interaction

Activities are based on familiar interactions such as:

* Tap
* Select
* Drag
* Match
* Recognize

## Familiarity

Personal photographs and routine-based content can make activities more recognizable to the patient.

## Low Cognitive Load

The interface avoids unnecessary navigation and complicated instructions.

## Personalization

The experience is designed around the individual rather than assuming that every patient will respond to the same activities.

---

# Technology Stack

## Frontend

* **React** — UI development
* **TypeScript** — type-safe application development
* **Vite** — frontend development and build tooling
* **Tailwind CSS** — responsive and consistent styling

## Mobile

* **Capacitor** — bridges the web application with native mobile capabilities
* **Android** — target mobile platform

## Planned Backend

* **Python**
* **FastAPI**

The backend will provide the foundation for persistent application data and communication between the client and server.

## Planned Database

* **PostgreSQL**

PostgreSQL is planned for storing structured application data such as patient-related information, caretaker content, activity data, and other persistent records.

## Planned AI

Memora is designed to eventually incorporate AI for:

* **Adaptive difficulty** — adjusting activity difficulty based on patient interaction
* **Personalized game recommendations** — recommending activities based on individual engagement and preferences

---

# Core Focus

### Dementia-Friendly UI

The interface is designed around accessibility and simplicity rather than conventional information-dense application design.

Key considerations include:

* Large interactive elements
* Clear visual hierarchy
* Minimal text
* Simple navigation
* Familiar visual cues
* Straightforward interactions

### Offline-First Gameplay

Memora is designed with offline accessibility in mind.

Core activities should remain usable even when a reliable internet connection is unavailable.

This is particularly important for activities that should be available whenever the patient needs them, without depending entirely on network connectivity.

### Multilingual Support

Memora is designed to support multiple languages so that patients and caretakers can interact with the application in a language they are comfortable with.

This can make the experience more accessible across different families and regions.

---

# Application Flow

```text
                         MEMORA
                            │
             ┌──────────────┴──────────────┐
             │                             │
             ▼                             ▼
     CARETAKER CONSOLE              PATIENT COMPANION
             │                             │
             │                             ▼
             │                      Choose Activity
             │                             │
             │              ┌──────────────┼──────────────┐
             │              │              │              │
             │              ▼              ▼              ▼
             │         Memory Puzzle  Shape Matching  Routine &
             │                                           Orientation
             │
             ▼
      Add Personal Content
             │
             ├── Photos
             ├── Routines
             └── Personal Information
             │
             └───────────────► Personalized Activities
```

---

# Architecture

The current application is centered around the React frontend.

```text
┌───────────────────────────────────────┐
│              React App                │
│              TypeScript               │
│                                       │
│  ┌─────────────┐   ┌───────────────┐ │
│  │  Caretaker  │   │    Patient    │ │
│  │   Console   │   │   Companion   │ │
│  └─────────────┘   └───────────────┘ │
│          │                 │           │
│          └────────┬────────┘           │
│                   │                    │
│             Activity Layer             │
│                   │                    │
│       ┌───────────┼───────────┐        │
│       │           │           │        │
│    Memory       Shape      Routine     │
│    Puzzle      Matching   Orientation  │
└───────────────────────────────────────┘
                    │
                    ▼
              Capacitor
                    │
                    ▼
                 Android
```

The planned architecture extends this with a backend and database:

```text
React + TypeScript
        │
        ▼
     Capacitor
        │
        ▼
      Android

        │
        │ API
        ▼

    FastAPI Backend
        │
        ▼
    PostgreSQL
        │
        ▼
 Patient & Activity Data
```

AI capabilities can later operate on activity and interaction data to support adaptive difficulty and personalized recommendations.

---

# Future Development

Memora can evolve beyond the current activity experience through several planned capabilities.

### Adaptive Activities

The system can adjust the difficulty of activities based on how the patient interacts with them.

For example, repeated success could gradually introduce more challenging versions of an activity, while difficulty can be reduced when an activity becomes frustrating.

### Personalized Recommendations

The system can learn which activities are more engaging for an individual and recommend suitable activities.

### Persistent Patient Profiles

A backend and PostgreSQL database can allow patient and caretaker information to persist across sessions.

### Caretaker Insights

Future versions can provide useful activity summaries to caretakers, helping them understand engagement patterns over time.

### Expanded Activity Library

Additional activities can cover:

* Memory recall
* Object recognition
* Sequencing
* Familiar people
* Familiar places
* Daily routines
* Visual matching
* Everyday tasks

### Multilingual Experiences

The interface and activities can be expanded to support multiple languages, making Memora more accessible to diverse users.

---

# Why Memora?

Memora is not simply about putting cognitive games on a screen.

The central idea is **personalization through familiarity**.

A generic puzzle is just a puzzle.

A puzzle containing a familiar family photograph can become a meaningful interaction.

A generic question about someone's morning routine may feel like a test.

A question built around **their own routine and familiar visual cues** can feel much more natural.

Memora aims to bring this idea into a simple digital experience.

---

# Project Status

Memora is currently focused on the core patient and caretaker experience, with the architecture designed to support future backend, database, and AI capabilities.

The immediate focus is on building an experience that is:

**Accessible · Familiar · Simple · Personalized**

---

# Future Vision

```text
             CARETAKER
                  │
                  ▼
        Personal Information
                  │
                  ▼
        ┌───────────────────┐
        │      MEMORA       │
        │                   │
        │ Personalization   │
        │ + Activities      │
        │ + AI              │
        └─────────┬─────────┘
                  │
                  ▼
               PATIENT
                  │
                  ▼
          Activity Interaction
                  │
                  ▼
           Engagement Data
                  │
                  ▼
       Better Recommendations
                  │
                  └──────────►
```

The long-term vision for Memora is to create a **personalized digital companion that adapts to the individual**, while remaining simple enough to use comfortably.

---

## Built With

**React · TypeScript · Vite · Tailwind CSS · FastAPI · PyTorch · ONNX Runtime**

---

## Offline Multilingual Text-to-Speech (TTS)

Memora includes a 100% offline, locally hosted neural Text-to-Speech service specifically optimized for North Eastern Region (NER) languages, operating on standard commodity CPUs without cloud or GPU requirements.

### Supported Regional Languages & Models

| Language | Code | Model Architecture | Local Model Name | Status |
| :--- | :---: | :--- | :--- | :---: |
| **English** | `en` | Meta MMS VITS | `facebook/mms-tts-eng` | Supported |
| **Assamese** | `as` | Meta MMS VITS | `facebook/mms-tts-asm` | Supported |
| **Bengali** | `bn` | Meta MMS VITS | `facebook/mms-tts-ben` | Supported |
| **Nepali** | `ne` | Kala VITS ONNX | `ampixa/real-nepali-v0.2-kala` | Supported |
| **Mizo** | `lus` | Sulabh VITS | `sulabhkatiyar/indian-ne-multilingual-tts` | Supported |
| **Nyishi** | `ny` | Sulabh VITS | `sulabhkatiyar/indian-ne-multilingual-tts` | Supported |
| **Kokborok** | `trp` | Sulabh VITS | `sulabhkatiyar/indian-ne-multilingual-tts` | Supported |
| **Khasi** | `kha` | *None open* | *No open offline weights available globally* | Handled (503 Informational) |

### Local Model Storage
Model checkpoints and configurations are stored in the local cache:
- Meta MMS: `~/.cache/huggingface/hub/models--facebook--mms-tts-*`
- Sulabh NE Multilingual: `~/.cache/huggingface/hub/models--sulabhkatiyar--indian-ne-multilingual-tts`
- Kala Nepali ONNX: Local runtime cache (`~/.cache/kala_tts` / site-packages)
*(Note: Large binary model weights are excluded from Git via `.gitignore`).*

### Required Python Dependencies
```text
torch>=2.4.0
torchaudio>=2.1.0
transformers>=4.42.0,<4.43.0
scipy>=1.13.0,<1.14.0
numpy>=1.26.0,<2.0.0
soundfile>=0.12.0
coqui-tts>=0.27.0
kala-tts>=0.1.4
onnxruntime>=1.20.0
```

### Running 100% Offline

1. **Start the FastAPI Backend**:
   ```powershell
   # Enforce complete offline isolation
   $env:HF_HUB_OFFLINE="1"
   $env:TRANSFORMERS_OFFLINE="1"

   # Run FastAPI server
   python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
   ```

2. **Start the Frontend UI**:
   ```powershell
   npm run dev
   ```

3. **Testing `/tts` API directly**:
   ```powershell
   curl -X POST "http://localhost:8000/tts" `
     -H "Content-Type: application/json" `
     -d '{"text": "Hello, how are you feeling today?", "language": "en"}' `
     --output speech.wav
   ```

4. **License & Attributions**:
   - Meta MMS models: CC-BY-NC 4.0.
   - Kala TTS & ONNX Nepali runtime: Apache 2.0.
   - Sulabh NE Multilingual model: Open-source research checkpoint.


