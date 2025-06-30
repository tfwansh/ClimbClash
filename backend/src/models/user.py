from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(80), nullable=False)
    avatar = db.Column(db.String(200), default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    room_memberships = db.relationship('RoomMember', back_populates='user', cascade='all, delete-orphan')
    tasks = db.relationship('Task', back_populates='creator', cascade='all, delete-orphan')
    votes = db.relationship('Vote', back_populates='voter', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<User {self.name}>'

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'avatar': self.avatar,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Room(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = db.Column(db.String(10), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    members = db.relationship('RoomMember', back_populates='room', cascade='all, delete-orphan')
    rounds = db.relationship('Round', back_populates='room', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Room {self.name} ({self.code})>'

    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'name': self.name,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'member_count': len(self.members)
        }

class RoomMember(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    room_id = db.Column(db.String(36), db.ForeignKey('room.id'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_host = db.Column(db.Boolean, default=False)
    
    # Relationships
    room = db.relationship('Room', back_populates='members')
    user = db.relationship('User', back_populates='room_memberships')

    def __repr__(self):
        return f'<RoomMember {self.user_id} in {self.room_id}>'

    def to_dict(self):
        return {
            'id': self.id,
            'room_id': self.room_id,
            'user_id': self.user_id,
            'joined_at': self.joined_at.isoformat() if self.joined_at else None,
            'is_host': self.is_host,
            'user': self.user.to_dict() if self.user else None
        }

class Round(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    room_id = db.Column(db.String(36), db.ForeignKey('room.id'), nullable=False)
    start_at = db.Column(db.DateTime, nullable=False)
    end_at = db.Column(db.DateTime, nullable=False)
    stakes = db.Column(db.Text, default='')  # JSON string for stake descriptions
    status = db.Column(db.String(20), default='active')  # active, completed, cancelled
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    room = db.relationship('Room', back_populates='rounds')
    tasks = db.relationship('Task', back_populates='round', cascade='all, delete-orphan')
    votes = db.relationship('Vote', back_populates='round', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Round {self.id} in {self.room_id}>'

    def to_dict(self):
        return {
            'id': self.id,
            'room_id': self.room_id,
            'start_at': self.start_at.isoformat() if self.start_at else None,
            'end_at': self.end_at.isoformat() if self.end_at else None,
            'stakes': self.stakes,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Task(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    round_id = db.Column(db.String(36), db.ForeignKey('round.id'), nullable=False)
    creator_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)
    template = db.Column(db.String(50), nullable=False)  # time-boxed, quantitative, milestone, qualitative
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, default='')
    target = db.Column(db.Integer, default=0)  # minutes, count, etc.
    target_unit = db.Column(db.String(20), default='')  # minutes, pages, reps, etc.
    proof_url = db.Column(db.String(500), default='')
    proof_type = db.Column(db.String(20), default='')  # photo, screenshot, text, etc.
    approved = db.Column(db.Boolean, default=None)  # None=pending, True/False after approval
    points = db.Column(db.Integer, default=0)
    difficulty_multiplier = db.Column(db.Float, default=1.0)
    flagged_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, default=None)
    
    # Relationships
    round = db.relationship('Round', back_populates='tasks')
    creator = db.relationship('User', back_populates='tasks')
    votes = db.relationship('Vote', back_populates='task', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Task {self.title} by {self.creator_id}>'

    def to_dict(self):
        return {
            'id': self.id,
            'round_id': self.round_id,
            'creator_id': self.creator_id,
            'template': self.template,
            'title': self.title,
            'description': self.description,
            'target': self.target,
            'target_unit': self.target_unit,
            'proof_url': self.proof_url,
            'proof_type': self.proof_type,
            'approved': self.approved,
            'points': self.points,
            'difficulty_multiplier': self.difficulty_multiplier,
            'flagged_count': self.flagged_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'creator': self.creator.to_dict() if self.creator else None
        }

class Vote(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    round_id = db.Column(db.String(36), db.ForeignKey('round.id'), nullable=False)
    voter_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)
    task_id = db.Column(db.String(36), db.ForeignKey('task.id'), nullable=False)
    vote = db.Column(db.Boolean, nullable=False)  # True = valid, False = invalid/too easy
    vote_type = db.Column(db.String(20), default='approval')  # approval, flag_validation
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    round = db.relationship('Round', back_populates='votes')
    voter = db.relationship('User', back_populates='votes')
    task = db.relationship('Task', back_populates='votes')

    def __repr__(self):
        return f'<Vote {self.vote} by {self.voter_id} on {self.task_id}>'

    def to_dict(self):
        return {
            'id': self.id,
            'round_id': self.round_id,
            'voter_id': self.voter_id,
            'task_id': self.task_id,
            'vote': self.vote,
            'vote_type': self.vote_type,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'voter': self.voter.to_dict() if self.voter else None
        }

