# Add Your Test Photos Here

## For Quick Testing:

1. **known_face.jpg** - Photo of the same person you registered in the database
2. **unknown_face.jpg** - Photo of a different person (not in database)
3. **group_photo.jpg** - Optional: Photo with multiple faces

## Test Commands:

After adding photos, test with:
```bash
# Test known face
curl -X POST http://localhost:8000/api/v1/detect-faces -F "file=@tests/images/known_face.jpg"

# Test unknown face  
curl -X POST http://localhost:8000/api/v1/detect-faces -F "file=@tests/images/unknown_face.jpg"
```
