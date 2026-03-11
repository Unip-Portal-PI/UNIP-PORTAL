from sqlalchemy import Column, Integer, String, DateTime
from persistence.database import Base

class InternshipModel(Base):
    __tablename__ = "internships"

    id = Column(Integer, primary_key=True, index=True)
    company = Column(String(100), nullable=False)
    position = Column(String(100), nullable=False)
    description = Column(String(255))
    location = Column(String(100))
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=True)