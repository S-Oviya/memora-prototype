# Memora

## AI-Powered Cognitive Gaming and Memory Assistance Platform for Elderly Dementia Patients

Memora is an **offline-first cognitive assistance platform** designed to support elderly people with dementia through personalized cognitive games, memory activities, familiar content, multilingual voice assistance, and caregiver-guided personalization.

The platform provides dedicated experiences for **elderly users, caregivers, and healthcare workers**, while using lightweight local AI/ML to personalize activities and adapt difficulty.

---

## Key Features

### Elderly User Portal

Memora provides a simple, accessible interface designed for elderly users.

Users can:

* Play cognitive games
* Complete personalized memory activities
* View familiar photos and people
* Listen to personalized audio
* Receive spoken activity instructions
* Follow daily routines
* Select their preferred language
* Repeat activities for memory reinforcement
* Interact with activities at an adaptive difficulty level

The interface focuses on **large text, clear visuals, simple navigation, and minimal interaction complexity**.

---

## Cognitive Games

Memora includes multiple interactive games designed to exercise different cognitive abilities.

### Shape Game

A visual shape-based activity where users identify, match, or interact with shapes.

It focuses on:

* Visual recognition
* Attention
* Cognitive processing
* Simple decision-making

### Memory Matching

Users match related cards or images to exercise:

* Recognition
* Visual memory
* Recall
* Attention

### Sequence Activities

Users remember and reproduce sequences to exercise:

* Working memory
* Attention
* Sequential recall

### Image Recognition

Users identify familiar images, people, or objects.

The activity can incorporate personalized content provided by caregivers.

### Word Activities

Simple word-based activities support:

* Word recognition
* Recall
* Language-related cognition
* Attention

### Recall Activities

Users interact with prompts based on familiar information, people, objects, or memories.

### Attention Activities

Simple visual interactions encourage focus and sustained attention.

### Personalized Activities

The activity experience can be adapted according to:

* User preferences
* Previous interactions
* Performance
* Difficulty level
* Repetition requirements
* Caregiver configuration

---

# Personalized Memory Assistance

Memora goes beyond generic cognitive games by allowing activities to incorporate information that is familiar to the individual.

Caregivers can provide:

* Family photographs
* Familiar people
* Personal memories
* Familiar objects
* Music
* Voice recordings
* Daily routines
* Personal preferences

This allows cognitive activities to be connected to the user's own environment and experiences.

---

# Adaptive Difficulty

Memora does not provide exactly the same difficulty to every user.

The platform combines a lightweight local ML model with an **Adaptive Difficulty Engine** to personalize the activity experience.

```text
User Interaction
       ↓
Activity Data
       ↓
Local ML Model
       ↓
Adaptive Difficulty Engine
       ↓
Personalized Activity
       ↓
Next Interaction
```

The system can adjust activity difficulty based on interaction patterns and performance.

A **rule-based fallback** is also included to maintain reliable behavior when the ML model cannot provide a suitable output.

---

# Caregiver Portal

The Caregiver Portal allows family members or caregivers to configure and manage the elderly user's experience.

### Caregiver Setup

Caregivers can configure:

* User profile
* Dementia stage/type
* Preferred language
* Daily routine
* Interests
* Preferences
* Familiar people
* Photos
* Audio content
* Music
* Activity preferences
* Difficulty settings

### Caregiver Dashboard

The dashboard provides an overview of the user's interaction with Memora.

Caregivers can monitor information such as:

* Activities completed
* Activity performance
* Difficulty progression
* Frequently used activities
* Interaction history
* Areas requiring additional support
* Personalization trends

The elderly user's experience is designed around **support and engagement rather than competitive scoring**.

---

# Healthcare Worker Portal

Memora also provides a dedicated portal for healthcare workers.

The healthcare-worker portal provides a structured view of relevant user activity and progress information.

Healthcare workers can review:

* User information
* Cognitive activity history
* Activity performance
* Progress trends
* Caregiver-provided information
* Personalization and difficulty changes

This creates a connection between **home-based cognitive activities, caregivers, and healthcare monitoring**.

Memora is intended as a supportive technology platform and does not replace professional medical diagnosis or treatment.

---

# 9-Language Support

Memora is designed for **9-language support**, with multilingual content and audio assistance.

The platform is designed to make cognitive activities accessible to elderly users who may be more comfortable using their native or preferred language.

Language support covers:

* Interface/content
* Activity instructions
* Prompts
* Voice assistance
* Text-to-Speech
* Personalized interactions

The architecture is designed to support language-specific content and locally available voice models.

---

# Offline Voice Assistance

Memora includes **offline Text-to-Speech (TTS)** so that activity instructions and supported content can be presented through voice.

### TTS Pipeline

```text
Activity / Text
      ↓
Local TTS Model
      ↓
Generated WAV Audio
      ↓
Audio Playback
```

The system uses:

* Coqui TTS / Local TTS Models
* Python
* FastAPI
* Local model execution
* WAV audio generation

This allows voice assistance to function without requiring every request to be sent to a cloud-based speech service.

---

# Offline AI / ML

Memora uses a lightweight neural network for local personalization.

### Neural Network Architecture

```text
Input Features
      ↓
   8 Neurons
      ↓
  16 Neurons
      ↓
   5 Outputs
      ↓
Activity Personalization
```

### ML Components

* Custom Lightweight MLP
* 8 → 16 → 5 architecture
* Local model storage
* Adaptive Difficulty Engine
* Offline inference
* Rule-based fallback

The lightweight architecture is intended to keep personalization practical for an offline-first application.

---

# Offline-First Architecture

Memora is designed so that core functionality can continue to work with limited or no internet connectivity.

```text
                 ┌──────────────────────┐
                 │    Elderly Portal     │
                 │ Games • Memory • TTS  │
                 └──────────┬───────────┘
                            │
                            ↓
                 ┌──────────────────────┐
                 │ Local AI / ML Engine │
                 │ + Adaptive Difficulty│
                 └──────────┬───────────┘
                            │
             ┌──────────────┼──────────────┐
             ↓              ↓              ↓
        Local Data       Local TTS    Game Engine
             │              │              │
             └──────────────┼──────────────┘
                            ↓
                 ┌──────────────────────┐
                 │   Caregiver Portal   │
                 └──────────┬───────────┘
                            ↓
                 ┌──────────────────────┐
                 │ Healthcare Worker    │
                 │       Portal         │
                 └──────────────────────┘
```

Local components include:

* User preferences
* Activity data
* ML model
* Personalization logic
* Familiar content
* Photos
* Audio recordings
* TTS models
* Generated audio

---

# Elder-Friendly Design

Memora is designed specifically with elderly users in mind.

The interface emphasizes:

* Large readable text
* Clear buttons
* Simple navigation
* Familiar visuals
* Minimal steps
* Audio instructions
* Reduced visual complexity
* Simple interaction patterns

The goal is to reduce the complexity normally associated with smartphone applications.

---

# Privacy

Memora follows a local-first approach for personal content.

Content such as:

* Family photos
* Voice recordings
* Personal preferences
* Memory-related information
* Activity data

is designed to be handled locally wherever possible.

This reduces unnecessary dependence on external cloud services for core functionality.

---

# Technology Stack

| Component       | Technology                   |
| --------------- | ---------------------------- |
| Frontend        | React                        |
| Language        | TypeScript                   |
| Build Tool      | Vite                         |
| UI / Styling    | Tailwind CSS                 |
| Local Storage   | Browser LocalStorage         |
| Cognitive Games | React + TypeScript           |
| Audio Recording | MediaRecorder API            |
| Audio Playback  | Web Audio API                |
| Offline AI/ML   | Custom Lightweight MLP       |
| ML Architecture | 8 → 16 → 5 Neural Network    |
| Model Storage   | Local JSON                   |
| Personalization | Adaptive Difficulty Engine   |
| Offline TTS     | Coqui TTS / Local TTS Models |
| TTS Backend     | Python + FastAPI             |
| Voice Output    | WAV Audio                    |
| Architecture    | Offline-first                |

---

# Project Structure

```text
memora/
│
├── src/
│   ├── components/
│   ├── games/
│   ├── ml/
│   ├── personalization/
│   ├── pages/
│   └── ...
│
├── backend/
│   ├── app/
│   ├── models/
│   └── requirements.txt
│
├── public/
├── package.json
├── vite.config.ts
└── README.md
```

---

# Getting Started

## Frontend

```bash
npm install
npm run dev
```

## TTS Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The exact setup may vary depending on the configured local TTS models.

---

# System Overview

```text
             MEMORA
                │
    ┌───────────┼───────────┐
    ↓           ↓           ↓
 Elderly     Caregiver   Healthcare
  Portal       Portal      Portal
    │           │           │
    └───────────┼───────────┘
                ↓
      Personalization Engine
                │
        ┌───────┴───────┐
        ↓               ↓
     Local ML        Local TTS
        │               │
        └───────┬───────┘
                ↓
       Personalized Experience
```

---

# Why Memora?

Memora combines:

**Cognitive Games + Personalized Memories + Adaptive AI/ML + Offline Voice + 9-Language Support + Caregiver Monitoring + Healthcare Worker Monitoring**

Rather than providing only generic games, Memora creates a personalized cognitive assistance environment around the user's:

* Memories
* Family
* Preferences
* Routine
* Language
* Interaction history

The platform is designed to make cognitive engagement **more personal, accessible, multilingual, and usable in low-connectivity environments**.

---

# Project Goals

Memora aims to provide:

* Personalized cognitive engagement
* Accessible elderly-friendly interaction
* Familiar memory-based activities
* Adaptive difficulty
* Offline AI/ML personalization
* Offline multilingual voice assistance
* Caregiver involvement
* Healthcare-worker monitoring
* Support for regional languages
* Reduced dependence on continuous internet connectivity

---

