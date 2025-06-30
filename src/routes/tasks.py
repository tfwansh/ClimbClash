from flask import Blueprint, request, jsonify
from src.models.user import db, User, Room, Round, Task, Vote, RoomMember
from datetime import datetime
import base64
import os

tasks_bp = Blueprint('tasks', __name__)

@tasks_bp.route('/tasks', methods=['POST'])
def create_task_simple():
    """Create a new task (simplified route for frontend)"""
    try:
        data = request.get_json()
        
        round_id = data.get('round_id')
        user_id = data.get('user_id')
        template_type = data.get('template_type')
        title = data.get('title')
        description = data.get('description', '')
        points = data.get('points', 25)
        template_data = data.get('template_data', {})
        
        # Validate required fields
        if not all([round_id, user_id, template_type, title]):
            return jsonify({'success': False, 'message': 'Missing required fields'}), 400
        
        # Verify round exists and is active
        round_obj = Round.query.get(round_id)
        if not round_obj:
            return jsonify({'success': False, 'message': 'Round not found'}), 404
        
        if round_obj.status != 'active':
            return jsonify({'success': False, 'message': 'Round is not active'}), 400
        
        # Verify user is a member of the room
        member = RoomMember.query.filter_by(room_id=round_obj.room_id, user_id=user_id).first()
        if not member:
            return jsonify({'success': False, 'message': 'User not a member of this room'}), 403
        
        # Create task
        task = Task(
            round_id=round_id,
            creator_id=user_id,
            template=template_type,
            title=title,
            description=description,
            points=points,
            created_at=datetime.utcnow()
        )
        
        db.session.add(task)
        db.session.commit()
        
        # Get user info for response
        user = User.query.get(user_id)
        task_dict = {
            'id': task.id,
            'round_id': task.round_id,
            'creator_id': task.creator_id,
            'template': task.template,
            'title': task.title,
            'description': task.description,
            'points': task.points,
            'approved': task.approved,
            'proof_url': task.proof_url,
            'proof_type': task.proof_type,
            'flagged_count': task.flagged_count,
            'created_at': task.created_at.isoformat(),
            'user': {'name': user.name} if user else None
        }
        
        return jsonify({
            'success': True,
            'task': task_dict
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@tasks_bp.route('/rounds/<round_id>/tasks', methods=['GET'])
def get_round_tasks(round_id):
    """Get all tasks for a round"""
    try:
        # Verify round exists
        round_obj = Round.query.get(round_id)
        if not round_obj:
            return jsonify({'success': False, 'message': 'Round not found'}), 404
        
        # Get all tasks for this round
        tasks = Task.query.filter_by(round_id=round_id).all()
        
        task_list = []
        for task in tasks:
            user = User.query.get(task.creator_id)
            task_dict = {
                'id': task.id,
                'round_id': task.round_id,
                'creator_id': task.creator_id,
                'template': task.template,
                'title': task.title,
                'description': task.description,
                'points': task.points,
                'approved': task.approved,
                'proof_url': task.proof_url,
                'proof_type': task.proof_type,
                'flagged_count': task.flagged_count,
                'created_at': task.created_at.isoformat(),
                'user': {'name': user.name} if user else None
            }
            task_list.append(task_dict)
        
        return jsonify({
            'success': True,
            'tasks': task_list
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# Task template configurations
TASK_TEMPLATES = {
    'time-boxed': {
        'base_points': 10,
        'point_per_minute': 2,
        'min_target': 15,  # minimum 15 minutes
        'max_target': 480  # maximum 8 hours
    },
    'quantitative': {
        'base_points': 5,
        'point_per_unit': 1,
        'min_target': 5,
        'max_target': 1000
    },
    'milestone': {
        'base_points': 50,
        'point_per_subtask': 10,
        'min_target': 1,
        'max_target': 20
    },
    'qualitative': {
        'base_points': 25,
        'min_words': 100,
        'max_words': 2000
    }
}

def calculate_task_points(template, target, difficulty_multiplier=1.0):
    """Calculate points for a task based on template and target"""
    config = TASK_TEMPLATES.get(template, TASK_TEMPLATES['time-boxed'])
    
    if template == 'time-boxed':
        points = config['base_points'] + (target * config['point_per_minute'])
    elif template == 'quantitative':
        points = config['base_points'] + (target * config['point_per_unit'])
    elif template == 'milestone':
        points = config['base_points'] + (target * config['point_per_subtask'])
    else:  # qualitative
        points = config['base_points']
    
    return int(points * difficulty_multiplier)

@tasks_bp.route('/rounds/<round_id>/tasks', methods=['POST'])
def create_task():
    """Create a new task in a round"""
    try:
        round_id = request.view_args['round_id']
        data = request.get_json()
        
        creator_id = data.get('creator_id')
        template = data.get('template')
        title = data.get('title')
        description = data.get('description', '')
        target = data.get('target', 0)
        target_unit = data.get('target_unit', '')
        difficulty_multiplier = data.get('difficulty_multiplier', 1.0)
        
        # Validate required fields
        if not all([creator_id, template, title]):
            return jsonify({'success': False, 'error': 'Missing required fields'}), 400
        
        # Validate template
        if template not in TASK_TEMPLATES:
            return jsonify({'success': False, 'error': 'Invalid task template'}), 400
        
        # Verify round exists and is active
        round_obj = Round.query.get(round_id)
        if not round_obj:
            return jsonify({'success': False, 'error': 'Round not found'}), 404
        
        if round_obj.status != 'active':
            return jsonify({'success': False, 'error': 'Round is not active'}), 400
        
        # Verify user is a member of the room
        member = RoomMember.query.filter_by(room_id=round_obj.room_id, user_id=creator_id).first()
        if not member:
            return jsonify({'success': False, 'error': 'User not a member of this room'}), 403
        
        # Validate target based on template
        config = TASK_TEMPLATES[template]
        if 'min_target' in config and target < config['min_target']:
            return jsonify({'success': False, 'error': f'Target too low for {template} template'}), 400
        if 'max_target' in config and target > config['max_target']:
            return jsonify({'success': False, 'error': f'Target too high for {template} template'}), 400
        
        # Calculate points
        points = calculate_task_points(template, target, difficulty_multiplier)
        
        # Create task
        task = Task(
            round_id=round_id,
            creator_id=creator_id,
            template=template,
            title=title,
            description=description,
            target=target,
            target_unit=target_unit,
            points=points,
            difficulty_multiplier=difficulty_multiplier
        )
        
        db.session.add(task)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'task': task.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@tasks_bp.route('/tasks/<task_id>/proof', methods=['POST'])
def upload_proof():
    """Upload proof of task completion"""
    try:
        task_id = request.view_args['task_id']
        data = request.get_json()
        
        proof_url = data.get('proof_url', '')
        proof_type = data.get('proof_type', 'text')
        proof_data = data.get('proof_data', '')  # For base64 encoded files
        
        task = Task.query.get(task_id)
        if not task:
            return jsonify({'success': False, 'error': 'Task not found'}), 404
        
        # Check if task is already approved or rejected
        if task.approved is not None:
            return jsonify({'success': False, 'error': 'Task already processed'}), 400
        
        # Handle file upload if proof_data is provided
        if proof_data and proof_type in ['photo', 'screenshot']:
            try:
                # Create uploads directory if it doesn't exist
                upload_dir = os.path.join(os.path.dirname(__file__), '..', 'static', 'uploads')
                os.makedirs(upload_dir, exist_ok=True)
                
                # Decode base64 and save file
                file_data = base64.b64decode(proof_data.split(',')[1] if ',' in proof_data else proof_data)
                file_extension = 'jpg' if proof_type == 'photo' else 'png'
                filename = f"proof_{task_id}_{int(datetime.utcnow().timestamp())}.{file_extension}"
                file_path = os.path.join(upload_dir, filename)
                
                with open(file_path, 'wb') as f:
                    f.write(file_data)
                
                proof_url = f"/uploads/{filename}"
                
            except Exception as e:
                return jsonify({'success': False, 'error': f'File upload failed: {str(e)}'}), 500
        
        # Update task with proof
        task.proof_url = proof_url
        task.proof_type = proof_type
        task.completed_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'task': task.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@tasks_bp.route('/tasks/<task_id>/approve', methods=['POST'])
def approve_task():
    """Approve or reject a task"""
    try:
        task_id = request.view_args['task_id']
        data = request.get_json()
        
        approver_id = data.get('approver_id')
        approve = data.get('approve', True)
        
        task = Task.query.get(task_id)
        if not task:
            return jsonify({'success': False, 'error': 'Task not found'}), 404
        
        # Verify approver is a member of the room (but not the task creator)
        round_obj = Round.query.get(task.round_id)
        member = RoomMember.query.filter_by(room_id=round_obj.room_id, user_id=approver_id).first()
        if not member:
            return jsonify({'success': False, 'error': 'User not authorized to approve tasks in this room'}), 403
        
        if approver_id == task.creator_id:
            return jsonify({'success': False, 'error': 'Cannot approve your own task'}), 400
        
        # Check if task has proof
        if not task.proof_url and not task.proof_type:
            return jsonify({'success': False, 'error': 'Task has no proof to approve'}), 400
        
        # Update task approval status
        task.approved = approve
        
        # Create vote record
        vote = Vote(
            round_id=task.round_id,
            voter_id=approver_id,
            task_id=task_id,
            vote=approve,
            vote_type='approval'
        )
        
        db.session.add(vote)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'task': task.to_dict(),
            'vote': vote.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@tasks_bp.route('/tasks/<task_id>/flag', methods=['POST'])
def flag_task():
    """Flag a task as too easy or invalid"""
    try:
        task_id = request.view_args['task_id']
        data = request.get_json()
        
        flagger_id = data.get('flagger_id')
        
        task = Task.query.get(task_id)
        if not task:
            return jsonify({'success': False, 'error': 'Task not found'}), 404
        
        # Verify flagger is a member of the room
        round_obj = Round.query.get(task.round_id)
        member = RoomMember.query.filter_by(room_id=round_obj.room_id, user_id=flagger_id).first()
        if not member:
            return jsonify({'success': False, 'error': 'User not authorized to flag tasks in this room'}), 403
        
        # Check if task is approved
        if not task.approved:
            return jsonify({'success': False, 'error': 'Can only flag approved tasks'}), 400
        
        # Check if user already flagged this task
        existing_flag = Vote.query.filter_by(
            task_id=task_id,
            voter_id=flagger_id,
            vote_type='flag_validation'
        ).first()
        
        if existing_flag:
            return jsonify({'success': False, 'error': 'Task already flagged by this user'}), 400
        
        # Increment flag count
        task.flagged_count += 1
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'task': task.to_dict(),
            'flagged_count': task.flagged_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@tasks_bp.route('/tasks/<task_id>/vote', methods=['POST'])
def vote_on_flag():
    """Vote on whether a flagged task is valid or invalid"""
    try:
        task_id = request.view_args['task_id']
        data = request.get_json()
        
        voter_id = data.get('voter_id')
        vote_value = data.get('vote')  # True = valid, False = invalid
        
        task = Task.query.get(task_id)
        if not task:
            return jsonify({'success': False, 'error': 'Task not found'}), 404
        
        # Verify voter is a member of the room
        round_obj = Round.query.get(task.round_id)
        member = RoomMember.query.filter_by(room_id=round_obj.room_id, user_id=voter_id).first()
        if not member:
            return jsonify({'success': False, 'error': 'User not authorized to vote in this room'}), 403
        
        # Check if task is flagged
        if task.flagged_count == 0:
            return jsonify({'success': False, 'error': 'Task is not flagged for voting'}), 400
        
        # Check if user already voted on this flag
        existing_vote = Vote.query.filter_by(
            task_id=task_id,
            voter_id=voter_id,
            vote_type='flag_validation'
        ).first()
        
        if existing_vote:
            return jsonify({'success': False, 'error': 'User already voted on this task'}), 400
        
        # Create vote
        vote = Vote(
            round_id=task.round_id,
            voter_id=voter_id,
            task_id=task_id,
            vote=vote_value,
            vote_type='flag_validation'
        )
        
        db.session.add(vote)
        
        # Check if we have enough votes to make a decision
        total_members = RoomMember.query.filter_by(room_id=round_obj.room_id).count()
        flag_votes = Vote.query.filter_by(task_id=task_id, vote_type='flag_validation').count() + 1  # +1 for current vote
        
        # If majority of room members have voted
        if flag_votes >= (total_members // 2 + 1):
            # Count invalid votes
            invalid_votes = Vote.query.filter_by(
                task_id=task_id,
                vote_type='flag_validation',
                vote=False
            ).count()
            
            if not vote_value:  # Current vote is invalid
                invalid_votes += 1
            
            # If majority thinks it's invalid, mark task as not approved
            if invalid_votes > (flag_votes // 2):
                task.approved = False
                task.points = 0  # Remove points
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'task': task.to_dict(),
            'vote': vote.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@tasks_bp.route('/rounds/<round_id>/pending-approvals', methods=['GET'])
def get_pending_approvals(round_id):
    """Get tasks pending approval for a round"""
    try:
        round_obj = Round.query.get(round_id)
        if not round_obj:
            return jsonify({'success': False, 'error': 'Round not found'}), 404
        
        # Get tasks with proof but no approval decision
        pending_tasks = Task.query.filter_by(
            round_id=round_id,
            approved=None
        ).filter(
            Task.proof_url != ''
        ).order_by(Task.completed_at.asc()).all()
        
        tasks_data = [task.to_dict() for task in pending_tasks]
        
        return jsonify({
            'success': True,
            'pending_tasks': tasks_data
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@tasks_bp.route('/rounds/<round_id>/flagged-tasks', methods=['GET'])
def get_flagged_tasks(round_id):
    """Get flagged tasks for voting"""
    try:
        round_obj = Round.query.get(round_id)
        if not round_obj:
            return jsonify({'success': False, 'error': 'Round not found'}), 404
        
        # Get approved tasks that have been flagged
        flagged_tasks = Task.query.filter_by(
            round_id=round_id,
            approved=True
        ).filter(
            Task.flagged_count > 0
        ).order_by(Task.flagged_count.desc()).all()
        
        tasks_data = []
        for task in flagged_tasks:
            task_data = task.to_dict()
            # Add vote counts
            flag_votes = Vote.query.filter_by(task_id=task.id, vote_type='flag_validation').all()
            task_data['flag_votes'] = {
                'total': len(flag_votes),
                'valid': len([v for v in flag_votes if v.vote]),
                'invalid': len([v for v in flag_votes if not v.vote])
            }
            tasks_data.append(task_data)
        
        return jsonify({
            'success': True,
            'flagged_tasks': tasks_data
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

