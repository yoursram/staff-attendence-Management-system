# Data Directory Structure

This directory contains all data files for the Smart Cam face recognition system.

## Directory Structure

```
data/
├── database/           # Training images for face recognition
│   ├── person1/       # One folder per person
│   │   ├── photo1.jpg
│   │   ├── photo2.jpg
│   │   └── ...
│   ├── person2/
│   │   ├── photo1.jpg
│   │   └── ...
│   └── ...
├── face_embeddings/   # Generated face embeddings (auto-created)
│   └── face_database.pkl
└── README.md          # This file
```

## How to Add Training Images

1. **Create a folder for each person** in the `database/` directory
2. **Use the person's name** as the folder name (e.g., "John_Doe", "Alice_Smith")
3. **Add one clear photo** of each person in their folder (typically just one image per person)
4. **Use clear, front-facing photos** for best results

### Example:
```
data/database/
├── John_Doe/
│   └── john.jpg           # One photo per person
├── Alice_Smith/
│   └── alice.jpg          # One photo per person
└── Bob_Johnson/
    └── bob.jpg            # One photo per person
```

## Supported Image Formats

- JPEG (.jpg, .jpeg)
- PNG (.png)
- BMP (.bmp)
- TIFF (.tiff)
- WebP (.webp)

## Image Guidelines

### For Training (Database):
- **Resolution**: At least 300x300 pixels
- **Quality**: Clear, well-lit photos
- **Face visibility**: Face should be clearly visible and front-facing
- **One photo per person**: Typically just one high-quality image per person
- **Consistency**: Good lighting and clear face visibility

### For Testing:
- Use the `tests/images/` directory
- Include various scenarios (different lighting, angles, etc.)
- Test with both registered and unknown faces

## Building the Face Database

After adding training images, build the face database using:

```python
# In your notebook or script
from src.services.face_recognition_service import FaceRecognitionService

service = FaceRecognitionService()
service.build_face_database("data/database", "data/face_embeddings/face_database.pkl")
```

Or use the API endpoint:
```bash
curl -X POST http://localhost:8000/api/v1/build-database
```

## Security Notes

- **Never commit real photos** to version control
- **Add data/ to .gitignore** to prevent accidental commits
- **Use sample/dummy images** for development
- **Respect privacy** when collecting training data
