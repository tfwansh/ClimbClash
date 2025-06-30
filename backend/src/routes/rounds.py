from flask import Blueprint, request, jsonify
from src.models.user import db, User, Room, Round, Task, RoomMember
from datetime import datetime, timedelta
import json

rounds_bp = Blueprint('rounds', __name__)

@rounds_bp.route('/rounds', methods=['POST'])
def create_round():
    """Start a new round in a room"""
    try:
        data = request.get_json()
        room_id = data.get('room_id')
        start_at = data.get('start_at')  # ISO format string
        end_at = data.get('end_at')      # ISO format string
        stakes = data.get('stakes', '')
        user_id = data.get('user_id')    # User starting the round
        
        if not room_id:
            return jsonify({'success': False, 'error': 'Room ID is required'}), 400
        
        # Verify room exists
        room = Room.query.get(room_id)
        if not room:
            return jsonify({'success': False, 'error': 'Room not found'}), 404
        
        # Verify user is a member and preferably host
        member = RoomMember.query.filter_by(room_id=room_id, user_id=user_id).first()
        if not member:
            return jsonify({'success': False, 'error': 'User not a member of this room'}), 403
        
        # Check if there's already an active round
        active_round = Round.query.filter_by(room_id=room_id, status='active').first()
        if active_round:
            return jsonify({'success': False, 'error': 'Room already has an active round'}), 400
        
        # Parse dates
        try:
            start_datetime = datetime.fromisoformat(start_at.replace('Z', '+00:00')) if start_at else datetime.utcnow()
            end_datetime = datetime.fromisoformat(end_at.replace('Z', '+00:00')) if end_at else datetime.utcnow() + timedelta(days=1)
        except ValueError:
            return jsonify({'success': False, 'error': 'Invalid date format'}), 400
        
        # Create round
        round_obj = Round(
            room_id=room_id,
            start_at=start_datetime,
            end_at=end_datetime,
            stakes=stakes,
            status='active'
        )
        
        db.session.add(round_obj)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'round': round_obj.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@rounds_bp.route('/rounds/<round_id>', methods=['GET'])
def get_round(round_id):
    """Get round details"""
    try:
        round_obj = Round.query.get(round_id)
        if not round_obj:
            return jsonify({'success': False, 'error': 'Round not found'}), 404
        
        return jsonify({
            'success': True,
            'round': round_obj.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@rounds_bp.route('/rounds/<round_id>/end', methods=['POST'])
def end_round(round_id):
    """End a round"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        round_obj = Round.query.get(round_id)
        if not round_obj:
            return jsonify({'success': False, 'error': 'Round not found'}), 404
        
        # Verify user is a member of the room
        member = RoomMember.query.filter_by(room_id=round_obj.room_id, user_id=user_id).first()
        if not member:
            return jsonify({'success': False, 'error': 'User not authorized to end this round'}), 403
        
        # Update round status
        round_obj.status = 'completed'
        round_obj.end_at = datetime.utcnow()  # Update actual end time
        
        db.session.commit()
        
        # Get final stats
        stats = get_round_stats_data(round_id)
        
        return jsonify({
            'success': True,
            'round': round_obj.to_dict(),
            'final_stats': stats
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@rounds_bp.route('/rounds/<round_id>/stats', methods=['GET'])
def get_round_stats(round_id):
    """Get current round statistics and leaderboard"""
    try:
        round_obj = Round.query.get(round_id)
        if not round_obj:
            return jsonify({'success': False, 'error': 'Round not found'}), 404
        
        stats = get_round_stats_data(round_id)
        
        return jsonify({
            'success': True,
            'round_id': round_id,
            'stats': stats
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def get_round_stats_data(round_id):
    """Helper function to calculate round statistics"""
    # Get all approved tasks for this round
    approved_tasks = Task.query.filter_by(round_id=round_id, approved=True).all()
    
    # Calculate points per user
    user_points = {}
    user_task_counts = {}
    
    for task in approved_tasks:
        user_id = task.creator_id
        points = task.points * task.difficulty_multiplier
        
        if user_id not in user_points:
            user_points[user_id] = 0
            user_task_counts[user_id] = 0
        
        user_points[user_id] += points
        user_task_counts[user_id] += 1
    
    # Get user details and create leaderboard
    leaderboard = []
    for user_id, points in user_points.items():
        user = User.query.get(user_id)
        if user:
            leaderboard.append({
                'user_id': user_id,
                'user_name': user.name,
                'user_avatar': user.avatar,
                'total_points': points,
                'task_count': user_task_counts[user_id]
            })
    
    # Sort by points descending
    leaderboard.sort(key=lambda x: x['total_points'], reverse=True)
    
    # Add rankings
    for i, entry in enumerate(leaderboard):
        entry['rank'] = i + 1
    
    return {
        'leaderboard': leaderboard,
        'total_tasks': len(approved_tasks),
        'total_points_awarded': sum(user_points.values())
    }

@rounds_bp.route('/rooms/<room_id>/rounds', methods=['GET'])
def get_room_rounds(room_id):
    """Get all rounds for a room"""
    try:
        room = Room.query.get(room_id)
        if not room:
            return jsonify({'success': False, 'error': 'Room not found'}), 404
        
        rounds = Round.query.filter_by(room_id=room_id).order_by(Round.created_at.desc()).all()
        rounds_data = [round_obj.to_dict() for round_obj in rounds]
        
        return jsonify({
            'success': True,
            'rounds': rounds_data
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@rounds_bp.route('/rooms/<room_id>/active-round', methods=['GET'])
def get_active_round(room_id):
    """Get the currently active round for a room"""
    try:
        room = Room.query.get(room_id)
        if not room:
            return jsonify({'success': False, 'error': 'Room not found'}), 404
        
        active_round = Round.query.filter_by(room_id=room_id, status='active').first()
        
        if not active_round:
            return jsonify({
                'success': True,
                'active_round': None
            }), 200
        
        return jsonify({
            'success': True,
            'active_round': active_round.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

