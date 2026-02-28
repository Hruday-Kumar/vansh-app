# 🎉 NEW SHARING SYSTEM - File & QR Code Import/Export

## What Changed

### ❌ **REMOVED** (Old text copy/paste workflow)
- Text code paste UI (clipboard paste boxes)
- Manual "Copy Code" buttons  
- Text code input fields
- Confusing base64 text strings

### ✅ **ADDED** (Modern file + QR workflow)

#### 📤 **SHARE FLOW** (`share-tree-modal.tsx`)
1. **Step 1: Choose Permissions**
   - View Only (read-only tree)
   - Invite to Join (editable tree)

2. **Step 2: Choose Method**
   - **Show QR Code** → Full-screen QR code display with instructions
   - **Share as File** → Creates `.json` file, shares via WhatsApp/email/etc.

#### 📥 **IMPORT FLOW** (`import-tree-modal.tsx`)
1. **Step 1: Choose Method**
   - **Import from File** → Document picker → selects `.json` file
   - **Scan QR Code** → Camera scanner → scans QR code

2. **Step 2: Preview**
   - Shows tree name, member count, mode (View Only / Editable)
   - Stats preview before importing

3. **Step 3: Select Identity**
   - "Who are you in this tree?" picker
   - Searchable member list
   - Option: "I'm not in this tree" → add yourself flow

4. **Step 4: Import**
   - Tree revolves around selected person
   - Existing tree replacement warning if needed

## New Packages Installed
- ✅ `expo-document-picker` - File selection
- ✅ `expo-camera` - QR code scanning  
- ✅ `react-native-qrcode-svg` - QR code generation
- ✅ `expo-sharing` (already installed) - Native file sharing

## Files Modified

### New Files (Active)
- `src/features/vriksha/import-tree-modal.tsx` (NEW - replaces old paste flow)
- `src/features/vriksha/share-tree-modal.tsx` (NEW - QR + file only)

### Backup Files (Old workflow preserved)
- `src/features/vriksha/import-tree-modal-old.tsx` (text paste version)
- `src/features/vriksha/share-tree-modal-old.tsx` (text code version)

### No Changes Needed
- `app/(tabs)/vriksha.tsx` (imports unchanged)
- `src/features/vriksha/index.ts` (exports unchanged)
- `src/features/vriksha/share-service.ts` (functions used as-is)

## User Experience Improvements

### Before 😕
1. User shares tree → gets cryptic base64 text code
2. Recipient copies text → pastes into input field
3. Decoding errors, code too long for WhatsApp
4. No preview before import
5. No identity selection

### After 🎉
1. User shares tree → **QR code** (instant scan) or **`.json` file** (WhatsApp/email)
2. Recipient either:
   - Scans QR code → instant preview
   - Opens file → automatic import
3. Preview shows tree info before importing
4. "Who are you?" identity selection
5. Tree revolves around the selected person
6. Option to add yourself if not in tree

## Technical Implementation

### Share Flow
```typescript
// 1. Choose mode (view_only / invite_to_join)
handleSelectMode('invite_to_join')

// 2a. QR Code
→ encodeTreeAsShareCode() → compact base64url string (v2 format)
→ <QRCode value={shareCode} /> → full-screen display

// 2b. File Share  
→ shareTreeAsFile() → creates .json via expo-file-system
→ Sharing.shareAsync(fileUri) → native share sheet
```

### Import Flow
```typescript
// 1a. File Import
→ DocumentPicker.getDocumentAsync() → user picks .json
→ fetch(file.uri) → read JSON
→ importTreeFromFile(jsonText) → decode to SharePayload

// 1b. QR Scan
→ CameraView with barcode scanner
→ onBarcodeScanned → decode QR data
→ decodeShareCode(data) → SharePayload

// 2. Preview → 3. Identity Selection → 4. Import
→ importData(members, relations, selectedIdentityId)
→ setRootMember(selectedIdentityId)
```

### Camera Permissions
```typescript
const [cameraPermission, requestCameraPermission] = useCameraPermissions();

// Request when user taps "Scan QR Code"
if (!cameraPermission.granted) {
  await requestCameraPermission();
}
```

## Testing Checklist

### Share Flow
- [ ] Tap member → Share → choose "View Only" → Show QR Code
- [ ] QR code displays correctly with tree info
- [ ] Back button returns to method selection
- [ ] Tap "Share as File" → native share sheet opens
- [ ] File shared to WhatsApp successfully

### Import Flow
- [ ] Tap Import → Import from File → document picker opens
- [ ] Select `.json` file → preview shows correct info
- [ ] Select identity → import succeeds
- [ ] Tree revolves around selected person
- [ ] Tap Import → Scan QR Code → camera permission requested
- [ ] Camera opens with QR frame overlay
- [ ] Scan QR code → preview shows
- [ ] "I'm not in this tree" → add self flow works

### Edge Cases
- [ ] Import when tree already has members → replacement warning
- [ ] Import with no identity selected → button disabled
- [ ] Invalid QR code → error message
- [ ] Invalid file → error message
- [ ] Camera permission denied → alert shown

## File Formats

### QR Code Data
```
VANSH:2:eyJtZW1iZXJzIjpbXSwicmVsYXRpb25zIjpbXX0...
```
- Compact base64url-encoded JSON (v2 format)
- Same as old text codes, but never shown to user
- Scanned automatically via camera

### File Format (.json)
```json
{
  "version": 2,
  "mode": "invite_to_join",
  "name": "Hruday",
  "data": {
    "members": [...],
    "relations": [...],
    "rootMemberId": "mem_123"
  }
}
```

## Next Steps
1. Test file import with your `Hruday_family_tree.json` file
2. Test QR code generation → scan on another device
3. Test "I'm not in this tree" flow
4. Remove old modal files once confirmed working

## Rollback Plan
If issues occur:
```bash
cd src/features/vriksha
mv import-tree-modal.tsx import-tree-modal-new-backup.tsx
mv import-tree-modal-old.tsx import-tree-modal.tsx
mv share-tree-modal.tsx share-tree-modal-new-backup.tsx
mv share-tree-modal-old.tsx share-tree-modal.tsx
```
