import requests
import os

# Configuration
API_BASE_URL = "http://10.45.8.188:8000/api/v1"

def test_health():
    """Test the health endpoint."""
    response = requests.get("http://10.45.8.188:8000/health")
    print(f"Health Check: {response.status_code} - {response.json()}")

def test_register_face(image_path: str, name: str):
    """Test face registration."""
    url = f"{API_BASE_URL}/register-face"
    
    with open(image_path, 'rb') as f:
        files = {'file': f}
        data = {'name': name}
        response = requests.post(url, files=files, data=data)
    
    print(f"Register Face ({name}): {response.status_code} - {response.json()}")

def test_detect_faces(image_path: str):
    """Test face detection and recognition."""
    url = f"{API_BASE_URL}/detect-faces"
    
    with open(image_path, 'rb') as f:
        files = {'file': f}
        response = requests.post(url, files=files)
    
    print(f"Detect Faces: {response.status_code} - {response.json()}")

def test_get_registered_faces():
    """Test getting registered faces."""
    url = f"{API_BASE_URL}/registered-faces"
    response = requests.get(url)
    print(f"Registered Faces: {response.status_code} - {response.json()}")

def test_status():
    """Test service status."""
    url = f"{API_BASE_URL}/status"
    response = requests.get(url)
    print(f"Service Status: {response.status_code} - {response.json()}")

def main():
    """Run all tests."""
    print("🧪 Smart Cam API Tests")
    print("=" * 50)
    
    # Test health
    test_health()
    print()
    
    # Test status
    test_status()
    print()
    
    # Test registered faces
    test_get_registered_faces()
    print()
    
    print("✅ Basic tests completed!")
    print("To test face registration and detection, add image files and uncomment the lines below.")
    
    # Uncomment these lines when you have test images
    # test_register_face("test_image.jpg", "Test Person")
    # test_detect_faces("test_image.jpg")

if __name__ == "__main__":
    main()
