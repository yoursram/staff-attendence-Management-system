# Test Setup Guide

## Quick Test Setup

For immediate testing, you'll need:

### 1. One Registration Photo
Place in: `data/database/TestPerson/test_person.jpg`
- Use for building the face database
- Should be a clear, front-facing photo

### 2. Validation Photos
Place in: `tests/images/`
- `known_face.jpg` - Same person as registered (for positive test)
- `unknown_face.jpg` - Different person (for negative test)

## Folder Structure for Testing
```
smart-cam/
├── data/database/
│   └── TestPerson/
│       └── test_person.jpg    ← Registration photo
└── tests/images/
    ├── known_face.jpg         ← Same person (should be recognized)
    ├── unknown_face.jpg       ← Different person (should be "Unknown")
    └── group_photo.jpg        ← Optional: multiple faces
```

## Test Workflow

1. **Add photos** to the directories above
2. **Build database**: `curl -X POST http://localhost:8000/api/v1/build-database`
3. **Test recognition**: 
   ```bash
   # Test known face (should recognize as "TestPerson")
   curl -X POST http://localhost:8000/api/v1/detect-faces \
     -F "file=@tests/images/known_face.jpg"
   
   # Test unknown face (should return "Unknown")
   curl -X POST http://localhost:8000/api/v1/detect-faces \
     -F "file=@tests/images/unknown_face.jpg"
   ```

## Adding Your Photos

1. Create the TestPerson folder:
   ```bash
   mkdir -p data/database/TestPerson
   ```

2. Copy your photos:
   - Registration photo → `data/database/TestPerson/`
   - Test photos → `tests/images/`

3. Make sure photos are in supported formats: JPG, PNG, BMP, TIFF, WebP
