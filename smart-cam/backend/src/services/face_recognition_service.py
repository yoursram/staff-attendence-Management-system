import os
import pickle
import numpy as np
from typing import List, Dict, Optional
import insightface
from insightface.app import FaceAnalysis
import cv2
from numpy.linalg import norm
from config import config
from src.database import SessionLocal
from src.models import CleaningStaff
import io

class FaceRecognitionService:
    def __init__(self):
        self.app = None
        self.face_db = []  # List of tuples: (staff_id, name, embedding)
        self.initialize_model()
        self.load_face_database()
    
    def initialize_model(self):
        """Initialize the InsightFace model."""
        try:
            self.app = FaceAnalysis(name='buffalo_s', providers=['CPUExecutionProvider'])
            self.app.prepare(ctx_id=0)
            print("InsightFace model 'buffalo_s' initialized successfully with CPU")
        except Exception as e:
            print(f"Error initializing InsightFace model: {e}")
            raise
    
    def cosine_similarity(self, a: np.ndarray, b: np.ndarray) -> float:
        """Calculate cosine similarity between two embeddings."""
        return float(np.dot(a, b) / (norm(a) * norm(b)))
    
    def match_face(self, embedding: np.ndarray, threshold: float = None) -> Dict:
        """Match face from database."""
        if threshold is None:
            threshold = config.CONFIDENCE_THRESHOLD
            
        best_name = "Unknown"
        best_staff_id = None
        best_score = 0
        
        for staff_id, name, db_emb in self.face_db:
            sim = self.cosine_similarity(embedding, db_emb)
            print(f"Comparing with {name}, score: {sim}")
            if sim > best_score:
                best_score = sim
                best_name = name
                best_staff_id = staff_id
        
        if best_score < threshold:
            best_name = "Unknown"
            best_staff_id = None
            best_score = 0.0
            
        return {
            "staff_id": best_staff_id,
            "name": best_name,
            "confidence": best_score
        }
    
    def _deserialize_embedding(self, blob: bytes) -> np.ndarray:
        return np.frombuffer(blob, dtype=np.float32)

    def _serialize_embedding(self, emb: np.ndarray) -> bytes:
        return emb.astype(np.float32).tobytes()

    def load_face_database(self):
        """Load the face database from MySQL."""
        self.face_db = []
        try:
            db = SessionLocal()
            staff_list = db.query(CleaningStaff).all()
            for staff in staff_list:
                if staff.embedding:
                    emb = self._deserialize_embedding(staff.embedding)
                    self.face_db.append((staff.staff_id, staff.name, emb))
            print(f"Loaded {len(self.face_db)} faces from database")
            db.close()
        except Exception as e:
            print(f"Error loading face database from MySQL: {e}")
    
    def reload_database(self):
        self.load_face_database()
        
    def extract_face_embedding(self, image_path: str) -> Optional[np.ndarray]:
        """Extract face embedding from an image."""
        try:
            img = cv2.imread(image_path)
            if img is None:
                raise ValueError("Could not load image")
            
            faces = self.app.get(img)
            if len(faces) == 0:
                return None
            
            face = faces[0]
            return face.embedding
        
        except Exception as e:
            print(f"Error extracting face embedding: {e}")
            return None
    
    def detect_and_recognize_faces(self, image_path: str) -> Dict:
        """Detect and recognize faces in an image."""
        try:
            img = cv2.imread(image_path)
            if img is None:
                raise ValueError("Could not load image")
            
            faces = self.app.get(img)
            
            results = {
                "faces_detected": len(faces),
                "faces": []
            }
            
            for i, face in enumerate(faces):
                face_result = {
                    "face_id": i,
                    "bbox": {
                        "x": int(face.bbox[0]),
                        "y": int(face.bbox[1]),
                        "width": int(face.bbox[2] - face.bbox[0]),
                        "height": int(face.bbox[3] - face.bbox[1])
                    },
                    "confidence": float(face.det_score),
                    "recognition": None
                }
                
                match = self.match_face(face.embedding)
                face_result["recognition"] = {
                    "staff_id": match["staff_id"],
                    "name": match["name"],
                    "confidence": match["confidence"]
                }
                
                results["faces"].append(face_result)
            
            return results
        
        except Exception as e:
            print(f"Error in face detection and recognition: {e}")
            raise
    
    def get_status(self) -> Dict:
        """Get service status information."""
        return {
            "model_name": config.MODEL_NAME,
            "providers": ["CPUExecutionProvider"],
            "confidence_threshold": config.CONFIDENCE_THRESHOLD,
            "registered_faces_count": len(self.face_db),
            "model_initialized": self.app is not None
        }

# Create a singleton instance to be shared across routers
face_service = FaceRecognitionService()

