from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    
    histories = relationship("History", back_populates="owner")


class History(Base):
    __tablename__ = "history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # JSON stringified inputs/outputs
    input_weights = Column(String) 
    top_provider_chosen = Column(String)
    action_taken = Column(String) # E.g., 'Viewed Deployment Guide CLI'
    
    owner = relationship("User", back_populates="histories")
