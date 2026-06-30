# Test Images

This directory contains sample images for testing the face recognition API.

## Directory Structure

```
tests/
├── images/           # Test images for API testing
│   ├── known_faces/  # Images of people in the database
│   ├── unknown_faces/# Images of people not in database
│   └── sample_*.jpg  # General test images
└── README.md         # This file
```

## Usage

1. **For Registration Testing:**
   ```bash
   curl -X POST http://localhost:8000/api/v1/register-face \
     -F "name=TestPerson" \
     -F "file=@tests/images/sample_face.jpg"
   ```

2. **For Detection Testing:**
   ```bash
   curl -X POST http://localhost:8000/api/v1/detect-faces \
     -F "file=@tests/images/sample_face.jpg"
   ```

## Adding Test Images

1. **Known faces**: Add to `tests/images/known_faces/`
   - These should be different photos of people already in your training database
   - Use for testing recognition accuracy

2. **Unknown faces**: Add to `tests/images/unknown_faces/`
   - These should be photos of people NOT in your training database
   - Use for testing unknown person detection

3. **General samples**: Add to `tests/images/`
   - Various test scenarios (group photos, poor lighting, etc.)

## Note

Due to privacy and repository size considerations, actual test images are not included in the repository. 
You can add your own test images to this directory for development and testing purposes.

The API accepts the following image formats:
- JPEG (.jpg, .jpeg)
- PNG (.png)
- BMP (.bmp)
- TIFF (.tiff)
- WebP (.webp)
