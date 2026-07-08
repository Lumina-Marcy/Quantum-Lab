from sqlalchemy import Column, ForeignKey, Integer, String, Text, TIMESTAMP
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'

    user_id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    username_changed_at = Column(TIMESTAMP(timezone=True), nullable=True)

class Mission(Base):
    __tablename__ = 'missions'

    mission_id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    difficulty = Column(String, nullable=False)
    estimated_time = Column(Integer, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

class MissionStep(Base):
    __tablename__ = 'mission_steps'

    step_id = Column(Integer, primary_key=True, index=True)
    mission_id = Column(Integer, ForeignKey('missions.mission_id', ondelete='CASCADE'), nullable=False)
    step_order = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    step_type = Column(String, nullable=False)

    mission = relationship('Mission', backref='steps')

class UserChoice(Base):
    __tablename__ = 'user_choices'

    choice_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    mission_id = Column(Integer, ForeignKey('missions.mission_id', ondelete='CASCADE'), nullable=False)
    step_id = Column(Integer, ForeignKey('mission_steps.step_id', ondelete='CASCADE'), nullable=False)
    selected_option = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

class SandboxRun(Base):
    __tablename__ = 'sandbox_runs'

    run_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    simulation_type = Column(String, nullable=False)
    search_space_size = Column(Integer, nullable=False)
    algorithm_type = Column(String, nullable=False)
    classical_steps = Column(Integer, nullable=False)
    quantum_steps = Column(Integer, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

class Lesson(Base):
    __tablename__ = 'lessons'

    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)
    summary = Column(Text, nullable=False)
    video_id = Column(String, nullable=False)
    duration = Column(String, nullable=True)
    links = Column(JSONB, nullable=False, server_default='[]')
    interactive = Column(String, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
