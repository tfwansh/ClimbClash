from flask_socketio import emit, join_room, leave_room, disconnect
from flask import request
from src.models.user import db, User, Room, RoomMember, Round, Task, Vote
import json

# Store user sessions and room memberships
user_sessions = {}  # session_id -> {user_id, room_id}
room_members = {}   # room_id -> set of session_ids

def register_socketio_events(socketio):
    """Register all Socket.io event handlers"""
    
    @socketio.on('connect')
    def handle_connect():
        print(f'Client connected: {request.sid}')
        emit('connected', {'message': 'Connected to server'})
    
    @socketio.on('disconnect')
    def handle_disconnect():
        print(f'Client disconnected: {request.sid}')
        session_id = request.sid
        
        # Clean up user session
        if session_id in user_sessions:
            user_data = user_sessions[session_id]
            room_id = user_data.get('room_id')
            
            # Remove from room members
            if room_id and room_id in room_members:
                room_members[room_id].discard(session_id)
                
                # Notify other room members
                emit('member_left', {
                    'user_id': user_data.get('user_id'),
                    'session_id': session_id
                }, room=room_id)
            
            # Remove session
            del user_sessions[session_id]
    
    @socketio.on('join_room')
    def handle_join_room(data):
        """Handle user joining a room"""
        try:
            user_id = data.get('user_id')
            room_id = data.get('room_id')
            
            if not user_id or not room_id:
                emit('error', {'message': 'Missing user_id or room_id'})
                return
            
            # Verify user and room exist
            user = User.query.get(user_id)
            room = Room.query.get(room_id)
            
            if not user or not room:
                emit('error', {'message': 'Invalid user or room'})
                return
            
            # Verify user is a member of the room
            member = RoomMember.query.filter_by(user_id=user_id, room_id=room_id).first()
            if not member:
                emit('error', {'message': 'User is not a member of this room'})
                return
            
            # Join the Socket.io room
            join_room(room_id)
            
            # Store session data
            session_id = request.sid
            user_sessions[session_id] = {
                'user_id': user_id,
                'room_id': room_id,
                'user_name': user.name
            }
            
            # Add to room members
            if room_id not in room_members:
                room_members[room_id] = set()
            room_members[room_id].add(session_id)
            
            # Notify user they joined successfully
            emit('room_joined', {
                'room_id': room_id,
                'room_name': room.name,
                'user_id': user_id,
                'user_name': user.name
            })
            
            # Notify other room members
            emit('member_joined', {
                'user_id': user_id,
                'user_name': user.name,
                'session_id': session_id
            }, room=room_id, include_self=False)
            
            print(f'User {user.name} joined room {room.name}')
            
        except Exception as e:
            print(f'Error in join_room: {str(e)}')
            emit('error', {'message': 'Failed to join room'})
    
    @socketio.on('leave_room')
    def handle_leave_room(data):
        """Handle user leaving a room"""
        try:
            session_id = request.sid
            
            if session_id not in user_sessions:
                emit('error', {'message': 'Not in any room'})
                return
            
            user_data = user_sessions[session_id]
            room_id = user_data.get('room_id')
            user_id = user_data.get('user_id')
            user_name = user_data.get('user_name')
            
            # Leave the Socket.io room
            leave_room(room_id)
            
            # Remove from room members
            if room_id in room_members:
                room_members[room_id].discard(session_id)
            
            # Notify other room members
            emit('member_left', {
                'user_id': user_id,
                'user_name': user_name,
                'session_id': session_id
            }, room=room_id)
            
            # Remove session
            del user_sessions[session_id]
            
            emit('room_left', {'message': 'Left room successfully'})
            print(f'User {user_name} left room {room_id}')
            
        except Exception as e:
            print(f'Error in leave_room: {str(e)}')
            emit('error', {'message': 'Failed to leave room'})
    
    @socketio.on('round_started')
    def handle_round_started(data):
        """Broadcast when a round is started"""
        try:
            room_id = data.get('room_id')
            round_data = data.get('round')
            
            if not room_id or not round_data:
                emit('error', {'message': 'Missing room_id or round data'})
                return
            
            # Broadcast to all room members
            emit('round_started', {
                'round': round_data,
                'message': 'A new round has started!'
            }, room=room_id)
            
            print(f'Round started in room {room_id}')
            
        except Exception as e:
            print(f'Error in round_started: {str(e)}')
            emit('error', {'message': 'Failed to broadcast round start'})
    
    @socketio.on('round_ended')
    def handle_round_ended(data):
        """Broadcast when a round is ended"""
        try:
            room_id = data.get('room_id')
            round_data = data.get('round')
            final_stats = data.get('final_stats')
            
            if not room_id:
                emit('error', {'message': 'Missing room_id'})
                return
            
            # Broadcast to all room members
            emit('round_ended', {
                'round': round_data,
                'final_stats': final_stats,
                'message': 'Round has ended!'
            }, room=room_id)
            
            print(f'Round ended in room {room_id}')
            
        except Exception as e:
            print(f'Error in round_ended: {str(e)}')
            emit('error', {'message': 'Failed to broadcast round end'})
    
    @socketio.on('task_created')
    def handle_task_created(data):
        """Broadcast when a task is created"""
        try:
            room_id = data.get('room_id')
            task_data = data.get('task')
            
            if not room_id or not task_data:
                emit('error', {'message': 'Missing room_id or task data'})
                return
            
            # Broadcast to all room members
            emit('task_created', {
                'task': task_data,
                'message': f"New task created: {task_data.get('title', 'Untitled')}"
            }, room=room_id)
            
            print(f'Task created in room {room_id}: {task_data.get("title", "Untitled")}')
            
        except Exception as e:
            print(f'Error in task_created: {str(e)}')
            emit('error', {'message': 'Failed to broadcast task creation'})
    
    @socketio.on('task_completed')
    def handle_task_completed(data):
        """Broadcast when a task is completed (proof uploaded)"""
        try:
            room_id = data.get('room_id')
            task_data = data.get('task')
            
            if not room_id or not task_data:
                emit('error', {'message': 'Missing room_id or task data'})
                return
            
            # Broadcast to all room members
            emit('task_completed', {
                'task': task_data,
                'message': f"Task completed: {task_data.get('title', 'Untitled')}"
            }, room=room_id)
            
            print(f'Task completed in room {room_id}: {task_data.get("title", "Untitled")}')
            
        except Exception as e:
            print(f'Error in task_completed: {str(e)}')
            emit('error', {'message': 'Failed to broadcast task completion'})
    
    @socketio.on('task_approved')
    def handle_task_approved(data):
        """Broadcast when a task is approved or rejected"""
        try:
            room_id = data.get('room_id')
            task_data = data.get('task')
            approved = data.get('approved')
            approver_name = data.get('approver_name')
            
            if not room_id or not task_data:
                emit('error', {'message': 'Missing room_id or task data'})
                return
            
            status = 'approved' if approved else 'rejected'
            message = f"Task {status} by {approver_name}: {task_data.get('title', 'Untitled')}"
            
            # Broadcast to all room members
            emit('task_approved', {
                'task': task_data,
                'approved': approved,
                'approver_name': approver_name,
                'message': message
            }, room=room_id)
            
            print(f'Task {status} in room {room_id}: {task_data.get("title", "Untitled")}')
            
        except Exception as e:
            print(f'Error in task_approved: {str(e)}')
            emit('error', {'message': 'Failed to broadcast task approval'})
    
    @socketio.on('task_flagged')
    def handle_task_flagged(data):
        """Broadcast when a task is flagged for voting"""
        try:
            room_id = data.get('room_id')
            task_data = data.get('task')
            flagger_name = data.get('flagger_name')
            
            if not room_id or not task_data:
                emit('error', {'message': 'Missing room_id or task data'})
                return
            
            # Broadcast to all room members
            emit('task_flagged', {
                'task': task_data,
                'flagger_name': flagger_name,
                'message': f"Task flagged by {flagger_name}: {task_data.get('title', 'Untitled')}"
            }, room=room_id)
            
            print(f'Task flagged in room {room_id}: {task_data.get("title", "Untitled")}')
            
        except Exception as e:
            print(f'Error in task_flagged: {str(e)}')
            emit('error', {'message': 'Failed to broadcast task flag'})
    
    @socketio.on('leaderboard_updated')
    def handle_leaderboard_updated(data):
        """Broadcast leaderboard updates"""
        try:
            room_id = data.get('room_id')
            stats = data.get('stats')
            
            if not room_id or not stats:
                emit('error', {'message': 'Missing room_id or stats data'})
                return
            
            # Broadcast to all room members
            emit('leaderboard_updated', {
                'stats': stats,
                'timestamp': data.get('timestamp')
            }, room=room_id)
            
            print(f'Leaderboard updated in room {room_id}')
            
        except Exception as e:
            print(f'Error in leaderboard_updated: {str(e)}')
            emit('error', {'message': 'Failed to broadcast leaderboard update'})
    
    @socketio.on('get_room_status')
    def handle_get_room_status(data):
        """Get current room status and online members"""
        try:
            room_id = data.get('room_id')
            
            if not room_id:
                emit('error', {'message': 'Missing room_id'})
                return
            
            # Get online members for this room
            online_members = []
            if room_id in room_members:
                for session_id in room_members[room_id]:
                    if session_id in user_sessions:
                        user_data = user_sessions[session_id]
                        online_members.append({
                            'user_id': user_data['user_id'],
                            'user_name': user_data['user_name'],
                            'session_id': session_id
                        })
            
            emit('room_status', {
                'room_id': room_id,
                'online_members': online_members,
                'total_online': len(online_members)
            })
            
        except Exception as e:
            print(f'Error in get_room_status: {str(e)}')
            emit('error', {'message': 'Failed to get room status'})

def emit_to_room(room_id, event, data):
    """Helper function to emit events to a specific room"""
    from flask import current_app
    socketio = current_app.extensions.get('socketio')
    if socketio:
        socketio.emit(event, data, room=room_id)

