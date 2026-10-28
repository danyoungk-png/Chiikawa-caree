# Chiikawa Pet Raising Game - Implementation Plan

## 1. Overview
A Tamagotchi-style interactive game featuring Chiikawa characters. Players can choose a character, interact with them (Feed, Pet, Play), and increase their affinity level.

## 2. Core Architecture
- **Frontend**: React + Tailwind CSS (Vite framework).
- **Game State**: React Context for managing current character, affinity levels, and dialogue history.
- **Persistence**: Firebase Firestore to save and load player's progress and affinity levels.
- **Assets**: 7 provided character images mapped to specific characters.

## 3. UI/UX Flow
1. **Title Screen**: Atmospheric entry with character selection grid.
2. **Game Screen**:
    - Character display (centered).
    - Status panel (Character Name, Affinity Heart Meter).
    - Interaction cluster (3 Buttons: Feed, Pet, Play).
    - Dialogue box (displays specific catchphrases upon interaction).

## 4. Technical Details
- **Character Database**: Define a central `CHARACTER_CONFIG` object mapping names, catchphrases, and personality traits.
- **Affinity System**: `affinity` state (0-100) updated via interactions. Each action provides different affinity gains.
- **Feedback Loop**: Interactions trigger:
    - Character-specific sound effect (simulated/visual feedback).
    - Dialogue box update with catchphrase.
    - Affinity update.

## 5. Next Steps
1. Setup Firebase project.
2. Implement Character Selection component.
3. Build the Main Game Loop and Interaction UI.
4. Integrate Affinity storage.
