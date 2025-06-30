from flask import Blueprint, request, jsonify
from src.models.user import db, User, Room, RoomMember
import random
import string

rooms_bp = Blueprint('rooms', __name__)

def generate_room_code():
    """Generate a unique 6-character room code"""
    while True:
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        if not Room.query.filter_by(code=code).first():
            return code

@rooms_bp.route('/rooms', methods=['POST'])
def create_room():
    """Create a new room"""
    try:
        data = request.get_json()
        name = data.get('name', 'New Room')
        creator_name = data.get('creator_name', 'Host')
        
        # Generate unique room code
        code = generate_room_code()
        
        # Create room
        room = Room(code=code, name=name)
        db.session.add(room)
        db.session.flush()  # Get the room ID
        
        # Create or get user
        user = User(name=creator_name)
        db.session.add(user)
        db.session.flush()  # Get the user ID
        
        # Add user as host member
        member = RoomMember(room_id=room.id, user_id=user.id, is_host=True)
        db.session.add(member)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'room': room.to_dict(),
            'user': user.to_dict(),
            'code': code
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@rooms_bp.route('/rooms/join', methods=['POST'])
def join_room():
    """Join an existing room"""
    try:
        data = request.get_json()
        code = data.get('code', '').upper()
        user_name = data.get('name', 'User')
        
        if not code:
            return jsonify({'success': False, 'error': 'Room code is required'}), 400
        
        # Find room by code
        room = Room.query.filter_by(code=code).first()
        if not room:
            return jsonify({'success': False, 'error': 'Room not found'}), 404
        
        # Create user
        user = User(name=user_name)
        db.session.add(user)
        db.session.flush()
        
        # Check if user already in room (by name for simplicity)
        existing_member = RoomMember.query.join(User).filter(
            RoomMember.room_id == room.id,
            User.name == user_name
        ).first()
        
        if existing_member:
            return jsonify({'success': False, 'error': 'User with this name already in room'}), 400
        
        # Add user to room
        member = RoomMember(room_id=room.id, user_id=user.id, is_host=False)
        db.session.add(member)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'room': room.to_dict(),
            'user': user.to_dict(),
            'member': member.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@rooms_bp.route('/rooms/<room_id>', methods=['GET'])
def get_room(room_id):
    """Get room details with members"""
    try:
        room = Room.query.get(room_id)
        if not room:
            return jsonify({'success': False, 'error': 'Room not found'}), 404
        
        # Get all members with user details
        members = []
        for member in room.members:
            member_data = member.to_dict()
            members.append(member_data)
        
        room_data = room.to_dict()
        room_data['members'] = members
        
        return jsonify({
            'success': True,
            'room': room_data
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@rooms_bp.route('/rooms/<room_id>/members', methods=['GET'])
def get_room_members(room_id):
    """Get all members of a room"""
    try:
        room = Room.query.get(room_id)
        if not room:
            return jsonify({'success': False, 'error': 'Room not found'}), 404
        
        members = [member.to_dict() for member in room.members]
        
        return jsonify({
            'success': True,
            'members': members
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@rooms_bp.route('/rooms/code/<code>', methods=['GET'])
def get_room_by_code(code):
    """Get room by code"""
    try:
        room = Room.query.filter_by(code=code.upper()).first()
        if not room:
            return jsonify({'success': False, 'error': 'Room not found'}), 404
        
        return jsonify({
            'success': True,
            'room': room.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

