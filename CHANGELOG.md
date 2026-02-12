# Changelog

All notable changes to Vansh Family Heritage App will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-02-12

### 🎉 Major Features

#### Enhanced Interactive Family Tree (Vriksha)
- **Animated Member Nodes**: Smooth entrance animations with gesture support
- **Animated Connection Lines**: Beautiful, animated relationship lines between family members
- **Member Detail Sheet**: Comprehensive bottom sheet with full member information
- **Quick Add Member**: Streamlined interface for adding new family members
- **Improved Tree Layout**: Enhanced visualization and positioning algorithm
- **State Management**: New Zustand store for efficient state management

### ✨ Added
- `src/features/vriksha/enhanced-family-tree.tsx` - New enhanced family tree component
- `src/features/vriksha/animated-member-node.tsx` - Animated member node component
- `src/features/vriksha/animated-connection-lines.tsx` - Animated connection lines
- `src/features/vriksha/member-detail-sheet.tsx` - Detailed member information sheet
- `src/features/vriksha/quick-add-member.tsx` - Quick member addition interface
- `src/features/vriksha/vriksha-store.ts` - Centralized state management
- Debug utilities for testing complex family structures
- Sacred text atom component improvements

### 🔄 Changed
- Updated `app/(tabs)/vriksha.tsx` to use enhanced family tree component
- Refactored tree layout algorithm for better positioning
- Improved type definitions in `src/features/vriksha/types.ts`
- Enhanced member profile display with more details
- Updated package dependencies

### 🗑️ Removed
- Old `connection-lines.tsx` (replaced with animated version)
- Legacy `family-tree.tsx` (replaced with enhanced version)
- Previous `member-node.tsx` (replaced with animated version)
- Old `member-profile.tsx` (replaced with detail sheet)

### 🐛 Bug Fixes
- Fixed family tree layout issues with complex family structures
- Resolved member positioning edge cases
- Improved relationship line rendering

### 🎨 Design Improvements
- Enhanced animations using Reanimated 2
- Better gesture handling with haptic feedback
- Improved visual hierarchy in member cards
- More intuitive user interactions

### 📦 Dependencies
- Updated to React Native 0.81.5
- Updated Expo SDK to ~54.0
- Added/updated animation libraries

### 🧪 Testing
- Added debug utilities for complex family structures
- Test files for relationship inversions
- Fixture data for comprehensive testing

---

## [1.0.0] - 2025-12-01

### Initial Release
- 🏠 Time River - Chronological family feed
- 📸 Smriti - Photo & video memory gallery
- 🎙️ Katha - Voice story recordings
- 🌳 Vriksha - Basic family tree
- 🪔 Parampara - Traditions documentation
- 💌 Vasiyat - Time-locked messages
- ⚙️ Settings & user profiles
- 🔐 Authentication system
- 📱 Mobile-first design
- 🎨 Digital Sanskriti design language

---

[2.0.0]: https://github.com/ansh-app/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/ansh-app/releases/tag/v1.0.0
