import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = 'http://localhost:5001'

export const useSocket = () => {
  const socketRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    })

    const socket = socketRef.current

    // Connection event handlers
    socket.on('connect', () => {
      console.log('Connected to server:', socket.id)
      setIsConnected(true)
      setError(null)
    })

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason)
      setIsConnected(false)
    })

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error)
      setError(error.message)
      setIsConnected(false)
    })

    socket.on('error', (error) => {
      console.error('Socket error:', error)
      setError(error.message || 'Socket error occurred')
    })

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [])

  // Helper functions
  const emit = (event, data) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data)
    } else {
      console.warn('Socket not connected, cannot emit:', event)
    }
  }

  const on = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback)
    }
  }

  const off = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback)
    }
  }

  const joinRoom = (userId, roomId) => {
    emit('join_room', { user_id: userId, room_id: roomId })
  }

  const leaveRoom = () => {
    emit('leave_room', {})
  }

  const broadcastRoundStarted = (roomId, roundData) => {
    emit('round_started', { room_id: roomId, round: roundData })
  }

  const broadcastRoundEnded = (roomId, roundData, finalStats) => {
    emit('round_ended', { room_id: roomId, round: roundData, final_stats: finalStats })
  }

  const broadcastTaskCreated = (roomId, taskData) => {
    emit('task_created', { room_id: roomId, task: taskData })
  }

  const broadcastTaskCompleted = (roomId, taskData) => {
    emit('task_completed', { room_id: roomId, task: taskData })
  }

  const broadcastTaskApproved = (roomId, taskData, approved, approverName) => {
    emit('task_approved', { 
      room_id: roomId, 
      task: taskData, 
      approved: approved,
      approver_name: approverName 
    })
  }

  const broadcastTaskFlagged = (roomId, taskData, flaggerName) => {
    emit('task_flagged', { 
      room_id: roomId, 
      task: taskData, 
      flagger_name: flaggerName 
    })
  }

  const broadcastLeaderboardUpdate = (roomId, stats) => {
    emit('leaderboard_updated', { 
      room_id: roomId, 
      stats: stats,
      timestamp: new Date().toISOString()
    })
  }

  const getRoomStatus = (roomId) => {
    emit('get_room_status', { room_id: roomId })
  }

  return {
    socket: socketRef.current,
    isConnected,
    error,
    emit,
    on,
    off,
    joinRoom,
    leaveRoom,
    broadcastRoundStarted,
    broadcastRoundEnded,
    broadcastTaskCreated,
    broadcastTaskCompleted,
    broadcastTaskApproved,
    broadcastTaskFlagged,
    broadcastLeaderboardUpdate,
    getRoomStatus
  }
}

