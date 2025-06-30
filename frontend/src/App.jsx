import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Trophy, Users, Target, Clock, Zap, Wifi, WifiOff, Upload, Check, Flag, TrendingUp, TrendingDown, CheckCircle, Star } from 'lucide-react'
import { useSocket } from './hooks/useSocket.js'
import './App.css'

// API Configuration
const API_BASE_URL = 'http://localhost:5001/api'

// Main App Component
function App() {
  const [user, setUser] = useState(null)
  const [room, setRoom] = useState(null)

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Routes>
          <Route 
            path="/" 
            element={
              user && room ? 
                <Navigate to="/room" replace /> : 
                <LandingPage setUser={setUser} setRoom={setRoom} />
            } 
          />
          <Route 
            path="/room" 
            element={
              user && room ? 
                <RoomDashboard user={user} room={room} setUser={setUser} setRoom={setRoom} /> : 
                <Navigate to="/" replace />
            } 
          />
        </Routes>
      </div>
    </Router>
  )
}

// Landing Page Component
function LandingPage({ setUser, setRoom }) {
  const [isJoining, setIsJoining] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    roomCode: '',
    roomName: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const createRoom = async () => {
    if (!formData.name.trim() || !formData.roomName.trim()) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.roomName,
          creator_name: formData.name
        })
      })

      const data = await response.json()

      if (data.success) {
        setUser(data.user)
        setRoom(data.room)
      } else {
        setError(data.error || 'Failed to create room')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const joinRoom = async () => {
    if (!formData.name.trim() || !formData.roomCode.trim()) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/rooms/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: formData.roomCode.toUpperCase(),
          name: formData.name
        })
      })

      const data = await response.json()

      if (data.success) {
        setUser(data.user)
        setRoom(data.room)
      } else {
        setError(data.error || 'Failed to join room')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="flex justify-center items-center mb-6">
          <Trophy className="h-16 w-16 text-yellow-500 mr-4" />
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white">
            Productivity Leaderboard
          </h1>
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Turn your goals into a game! Compete with friends, verify achievements, and climb the leaderboard 
          through real productivity challenges.
        </p>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Card className="text-center">
          <CardHeader>
            <Target className="h-12 w-12 text-blue-500 mx-auto mb-2" />
            <CardTitle>Goal Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300">
              Structured goal types with built-in verification and minimum thresholds
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <Users className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <CardTitle>Peer Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300">
              Community approval system with voting to prevent cheating
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <Zap className="h-12 w-12 text-purple-500 mx-auto mb-2" />
            <CardTitle>Adaptive Difficulty</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300">
              Dynamic scoring that adjusts based on your performance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Join/Create Room */}
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {isJoining ? 'Join a Room' : 'Create New Room'}
            </CardTitle>
            <CardDescription className="text-center">
              {isJoining ? 
                'Enter your name and room code to join an existing competition' : 
                'Start a new productivity challenge with your friends'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            {isJoining ? (
              <div>
                <Label htmlFor="roomCode">Room Code</Label>
                <Input
                  id="roomCode"
                  name="roomCode"
                  type="text"
                  placeholder="Enter 6-character room code"
                  value={formData.roomCode}
                  onChange={handleInputChange}
                  disabled={loading}
                  maxLength={6}
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="roomName">Room Name</Label>
                <Input
                  id="roomName"
                  name="roomName"
                  type="text"
                  placeholder="Enter room name"
                  value={formData.roomName}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </div>
            )}

            <Button 
              onClick={isJoining ? joinRoom : createRoom}
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Loading...' : (isJoining ? 'Join Room' : 'Create Room')}
            </Button>

            <div className="text-center">
              <button
                onClick={() => setIsJoining(!isJoining)}
                className="text-blue-600 hover:text-blue-800 text-sm"
                disabled={loading}
              >
                {isJoining ? 'Want to create a new room instead?' : 'Already have a room code?'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Room Dashboard Component
function RoomDashboard({ user, room, setUser, setRoom }) {
  const [activeRound, setActiveRound] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState([])
  const [onlineMembers, setOnlineMembers] = useState([])
  
  // Initialize Socket.io
  const socket = useSocket()

  useEffect(() => {
    fetchRoomData()
    
    // Join the room via Socket.io when component mounts
    if (socket.isConnected && user && room) {
      socket.joinRoom(user.id, room.id)
    }
    
    // Set up Socket.io event listeners
    if (socket.socket) {
      // Room events
      socket.on('room_joined', (data) => {
        console.log('Successfully joined room:', data)
        addNotification(`Connected to room: ${data.room_name}`, 'success')
      })
      
      socket.on('member_joined', (data) => {
        console.log('Member joined:', data)
        addNotification(`${data.user_name} joined the room`, 'info')
        // Refresh room data to get updated member list
        fetchRoomData()
      })
      
      socket.on('member_left', (data) => {
        console.log('Member left:', data)
        addNotification(`${data.user_name} left the room`, 'info')
        // Refresh room data to get updated member list
        fetchRoomData()
      })
      
      // Round events
      socket.on('round_started', (data) => {
        console.log('Round started:', data)
        setActiveRound(data.round)
        addNotification(data.message, 'success')
      })
      
      socket.on('round_ended', (data) => {
        console.log('Round ended:', data)
        setActiveRound(null)
        addNotification(data.message, 'info')
      })
      
      // Task events
      socket.on('task_created', (data) => {
        console.log('Task created:', data)
        addNotification(data.message, 'info')
      })
      
      socket.on('task_completed', (data) => {
        console.log('Task completed:', data)
        addNotification(data.message, 'success')
      })
      
      socket.on('task_approved', (data) => {
        console.log('Task approved:', data)
        addNotification(data.message, data.approved ? 'success' : 'warning')
      })
      
      socket.on('task_flagged', (data) => {
        console.log('Task flagged:', data)
        addNotification(data.message, 'warning')
      })
      
      // Leaderboard events
      socket.on('leaderboard_updated', (data) => {
        console.log('Leaderboard updated:', data)
        // Could trigger a leaderboard refresh here
      })
      
      // Room status events
      socket.on('room_status', (data) => {
        console.log('Room status:', data)
        setOnlineMembers(data.online_members)
      })
      
      // Error handling
      socket.on('error', (error) => {
        console.error('Socket error:', error)
        addNotification(error.message || 'Connection error', 'error')
      })
    }
    
    // Cleanup on unmount
    return () => {
      if (socket.socket) {
        socket.leaveRoom()
        socket.off('room_joined')
        socket.off('member_joined')
        socket.off('member_left')
        socket.off('round_started')
        socket.off('round_ended')
        socket.off('task_created')
        socket.off('task_completed')
        socket.off('task_approved')
        socket.off('task_flagged')
        socket.off('leaderboard_updated')
        socket.off('room_status')
        socket.off('error')
      }
    }
  }, [room.id, user, socket.isConnected])

  // Auto-join room when socket connects
  useEffect(() => {
    if (socket.isConnected && user && room) {
      socket.joinRoom(user.id, room.id)
      // Get room status after joining
      setTimeout(() => {
        socket.getRoomStatus(room.id)
      }, 1000)
    }
  }, [socket.isConnected, user, room])

  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    }
    setNotifications(prev => [notification, ...prev.slice(0, 4)]) // Keep only 5 notifications
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
    }, 5000)
  }

  const fetchRoomData = async () => {
    try {
      // Fetch room members
      const membersResponse = await fetch(`${API_BASE_URL}/rooms/${room.id}/members`)
      const membersData = await membersResponse.json()
      
      if (membersData.success) {
        setMembers(membersData.members)
      }

      // Fetch active round
      const roundResponse = await fetch(`${API_BASE_URL}/rooms/${room.id}/active-round`)
      const roundData = await roundResponse.json()
      
      if (roundData.success && roundData.active_round) {
        setActiveRound(roundData.active_round)
      }
    } catch (err) {
      console.error('Failed to fetch room data:', err)
      addNotification('Failed to fetch room data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const leaveRoom = () => {
    // Leave the Socket.io room
    if (socket.socket) {
      socket.leaveRoom()
    }
    setUser(null)
    setRoom(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading room...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {room.name}
          </h1>
          <div className="flex items-center space-x-4 mt-2">
            <Badge variant="outline" className="text-lg px-3 py-1">
              Code: {room.code}
            </Badge>
            <span className="text-gray-600 dark:text-gray-300">
              Welcome, {user.name}!
            </span>
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              {socket.isConnected ? (
                <div className="flex items-center text-green-600">
                  <Wifi className="h-4 w-4 mr-1" />
                  <span className="text-sm">Connected</span>
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <WifiOff className="h-4 w-4 mr-1" />
                  <span className="text-sm">Disconnected</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={leaveRoom}>
          Leave Room
        </Button>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="mb-6 space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 rounded-lg border ${
                notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                notification.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-sm">{notification.message}</span>
                <span className="text-xs opacity-70">
                  {notification.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Room Members */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Room Members ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {members.map((member) => (
              <div key={member.id} className="text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-2">
                  {member.user?.name?.charAt(0).toUpperCase()}
                </div>
                <p className="text-sm font-medium">{member.user?.name}</p>
                {member.is_host && (
                  <Badge variant="secondary" className="text-xs mt-1">Host</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Round or Start Round */}
      {activeRound ? (
        <RoundView 
          round={activeRound} 
          user={user} 
          room={room}
          onRoundEnd={() => setActiveRound(null)}
        />
      ) : (
        <StartRoundCard 
          user={user} 
          room={room} 
          members={members}
          onRoundStart={setActiveRound}
        />
      )}
    </div>
  )
}

// Start Round Card Component
function StartRoundCard({ user, room, members, onRoundStart }) {
  const [formData, setFormData] = useState({
    duration: '24',
    stakes: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isHost = members.find(m => m.user_id === user.id)?.is_host

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const startRound = async () => {
    if (!isHost) {
      setError('Only the host can start a round')
      return
    }

    setLoading(true)
    setError('')

    try {
      const now = new Date()
      const endTime = new Date(now.getTime() + (parseInt(formData.duration) * 60 * 60 * 1000))

      const response = await fetch(`${API_BASE_URL}/rounds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room_id: room.id,
          start_at: now.toISOString(),
          end_at: endTime.toISOString(),
          stakes: formData.stakes,
          user_id: user.id
        })
      })

      const data = await response.json()

      if (data.success) {
        onRoundStart(data.round)
      } else {
        setError(data.error || 'Failed to start round')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Start New Round
        </CardTitle>
        <CardDescription>
          {isHost ? 
            'Configure and start a new productivity challenge' : 
            'Waiting for the host to start a round...'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {isHost ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="duration">Round Duration (hours)</Label>
              <Input
                id="duration"
                name="duration"
                type="number"
                min="1"
                max="168"
                value={formData.duration}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="stakes">Stakes (optional)</Label>
              <Input
                id="stakes"
                name="stakes"
                type="text"
                placeholder="e.g., Loser buys coffee for everyone"
                value={formData.stakes}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <Button onClick={startRound} disabled={loading} className="w-full">
              {loading ? 'Starting Round...' : 'Start Round'}
            </Button>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>The host will start the round when everyone is ready.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Round View Component with Task Management
function RoundView({ round, user, room, onRoundEnd }) {
  const [activeTab, setActiveTab] = useState('tasks')
  const [tasks, setTasks] = useState([])
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [taskFormData, setTaskFormData] = useState({})
  const [loading, setLoading] = useState(false)
  const socket = useSocket()

  // Goal Templates
  const goalTemplates = [
    {
      id: 'time-boxed',
      name: 'Time-Boxed Task',
      icon: Clock,
      description: 'Complete a specific task within a defined time window',
      color: 'blue',
      fields: [
        { name: 'title', label: 'Task Name', type: 'text', required: true, placeholder: 'e.g., Write project proposal' },
        { name: 'description', label: 'Description', type: 'textarea', required: true, placeholder: 'Detailed description of what needs to be done' },
        { name: 'duration_min', label: 'Minimum Duration (minutes)', type: 'number', required: true, min: 15, placeholder: '15' },
        { name: 'duration_max', label: 'Maximum Duration (minutes)', type: 'number', required: true, min: 15, placeholder: '120' },
        { name: 'points', label: 'Points Value', type: 'number', required: true, min: 1, max: 100, placeholder: '25' }
      ],
      validation: (data) => {
        if (data.duration_min < 15) return 'Minimum duration must be at least 15 minutes'
        if (data.duration_max < data.duration_min) return 'Maximum duration must be greater than minimum'
        if (data.points < 1 || data.points > 100) return 'Points must be between 1 and 100'
        return null
      }
    },
    {
      id: 'milestone-project',
      name: 'Milestone Project',
      icon: Target,
      description: 'Break down a larger project into verifiable sub-tasks',
      color: 'green',
      fields: [
        { name: 'title', label: 'Project Name', type: 'text', required: true, placeholder: 'e.g., Launch marketing campaign' },
        { name: 'description', label: 'Project Description', type: 'textarea', required: true, placeholder: 'Overall project goals and scope' },
        { name: 'subtasks', label: 'Sub-tasks (one per line)', type: 'textarea', required: true, placeholder: 'Research competitors\nCreate content calendar\nDesign graphics\nSchedule posts' },
        { name: 'deadline', label: 'Project Deadline', type: 'datetime-local', required: true },
        { name: 'points', label: 'Points Value', type: 'number', required: true, min: 10, max: 200, placeholder: '75' }
      ],
      validation: (data) => {
        const subtasks = data.subtasks?.split('\n').filter(t => t.trim()).length || 0
        if (subtasks < 2) return 'Project must have at least 2 sub-tasks'
        if (subtasks > 10) return 'Project cannot have more than 10 sub-tasks'
        if (new Date(data.deadline) <= new Date()) return 'Deadline must be in the future'
        if (data.points < 10 || data.points > 200) return 'Points must be between 10 and 200'
        return null
      }
    },
    {
      id: 'quantitative-habit',
      name: 'Quantitative Habit',
      icon: Trophy,
      description: 'Track measurable activities with specific targets',
      color: 'purple',
      fields: [
        { name: 'title', label: 'Habit Name', type: 'text', required: true, placeholder: 'e.g., Daily reading' },
        { name: 'description', label: 'Description', type: 'textarea', required: true, placeholder: 'What you will track and why' },
        { name: 'metric', label: 'Metric', type: 'text', required: true, placeholder: 'e.g., pages read, push-ups completed, minutes studied' },
        { name: 'target_min', label: 'Minimum Target', type: 'number', required: true, min: 1, placeholder: '10' },
        { name: 'target_max', label: 'Maximum Target', type: 'number', required: true, min: 1, placeholder: '50' },
        { name: 'points', label: 'Points Value', type: 'number', required: true, min: 5, max: 75, placeholder: '20' }
      ],
      validation: (data) => {
        if (data.target_min < 1) return 'Minimum target must be at least 1'
        if (data.target_max < data.target_min) return 'Maximum target must be greater than minimum'
        if (data.points < 5 || data.points > 75) return 'Points must be between 5 and 75'
        return null
      }
    },
    {
      id: 'qualitative-checkin',
      name: 'Qualitative Check-In',
      icon: Users,
      description: 'Reflective tasks requiring photo, video, or written proof',
      color: 'orange',
      fields: [
        { name: 'title', label: 'Check-In Name', type: 'text', required: true, placeholder: 'e.g., Workspace organization' },
        { name: 'description', label: 'Description', type: 'textarea', required: true, placeholder: 'What you will document and reflect on' },
        { name: 'proof_type', label: 'Proof Type', type: 'select', required: true, options: [
          { value: 'photo', label: 'Photo Upload' },
          { value: 'video', label: 'Video Upload' },
          { value: 'journal', label: 'Written Journal Entry' },
          { value: 'voice', label: 'Voice Note' }
        ]},
        { name: 'min_words', label: 'Minimum Words (if written)', type: 'number', min: 50, placeholder: '100' },
        { name: 'points', label: 'Points Value', type: 'number', required: true, min: 10, max: 100, placeholder: '30' }
      ],
      validation: (data) => {
        if (data.proof_type === 'journal' && (!data.min_words || data.min_words < 50)) {
          return 'Written entries must require at least 50 words'
        }
        if (data.points < 10 || data.points > 100) return 'Points must be between 10 and 100'
        return null
      }
    }
  ]

  useEffect(() => {
    fetchTasks()
  }, [round.id])

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/rounds/${round.id}/tasks`)
      const data = await response.json()
      if (data.success) {
        setTasks(data.tasks)
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err)
    }
  }

  const handleCreateTask = async () => {
    if (!selectedTemplate) return

    const template = goalTemplates.find(t => t.id === selectedTemplate)
    const validationError = template.validation(taskFormData)
    
    if (validationError) {
      alert(validationError)
      return
    }

    setLoading(true)
    try {
      const taskData = {
        round_id: round.id,
        user_id: user.id,
        template_type: selectedTemplate,
        title: taskFormData.title,
        description: taskFormData.description,
        points: taskFormData.points,
        template_data: taskFormData
      }

      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      })

      const data = await response.json()
      if (data.success) {
        setTasks(prev => [...prev, data.task])
        setShowCreateTask(false)
        setSelectedTemplate(null)
        setTaskFormData({})
        
        // Broadcast task creation via Socket.io
        if (socket.isConnected) {
          socket.broadcastTaskCreated(room.id, data.task)
        }
      } else {
        alert(data.message || 'Failed to create task')
      }
    } catch (err) {
      console.error('Failed to create task:', err)
      alert('Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId)
    const template = goalTemplates.find(t => t.id === templateId)
    const initialData = {}
    template.fields.forEach(field => {
      if (field.type === 'number' && field.placeholder) {
        initialData[field.name] = parseInt(field.placeholder)
      } else {
        initialData[field.name] = ''
      }
    })
    setTaskFormData(initialData)
  }

  const handleFormChange = (fieldName, value) => {
    setTaskFormData(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }

  // Proof Upload Handler
  const handleUploadProof = async (taskId, proofData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proof_type: proofData.type,
          proof_url: proofData.content,
          proof_data: proofData.type === 'file' ? proofData.content : null
        })
      })

      const data = await response.json()
      if (data.success) {
        // Update task in local state
        setTasks(prev => prev.map(task => 
          task.id === taskId ? { ...task, proof_url: proofData.content } : task
        ))
        
        // Broadcast proof upload via Socket.io
        if (socket.isConnected) {
          socket.broadcastProofUploaded(room.id, taskId, proofData)
        }
        
        alert('Proof uploaded successfully!')
      } else {
        alert(data.message || 'Failed to upload proof')
      }
    } catch (err) {
      console.error('Failed to upload proof:', err)
      alert('Failed to upload proof')
    }
  }

  // Task Approval Handler
  const handleApproveTask = async (taskId, approve) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approver_id: user.id,
          approve: approve
        })
      })

      const data = await response.json()
      if (data.success) {
        // Update task in local state
        setTasks(prev => prev.map(task => 
          task.id === taskId ? { ...task, approved: approve } : task
        ))
        
        // Broadcast approval via Socket.io
        if (socket.isConnected) {
          socket.broadcastTaskApproved(room.id, taskId, approve, user.name)
        }
        
        alert(approve ? 'Task approved!' : 'Task rejected!')
      } else {
        alert(data.message || 'Failed to process approval')
      }
    } catch (err) {
      console.error('Failed to approve task:', err)
      alert('Failed to approve task')
    }
  }

  // Task Flagging Handler
  const handleFlagTask = async (taskId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flagger_id: user.id,
          reason: 'Task appears too easy or invalid'
        })
      })

      const data = await response.json()
      if (data.success) {
        // Broadcast flag via Socket.io
        if (socket.isConnected) {
          socket.broadcastTaskFlagged(room.id, taskId, user.name)
        }
        
        alert('Task flagged for review. Other members can now vote on its validity.')
      } else {
        alert(data.message || 'Failed to flag task')
      }
    } catch (err) {
      console.error('Failed to flag task:', err)
      alert('Failed to flag task')
    }
  }

  const renderTemplateForm = () => {
    if (!selectedTemplate) return null

    const template = goalTemplates.find(t => t.id === selectedTemplate)
    const IconComponent = template.icon

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center">
            <IconComponent className={`h-5 w-5 mr-2 text-${template.color}-500`} />
            Create {template.name}
          </CardTitle>
          <CardDescription>{template.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {template.fields.map(field => (
            <div key={field.name}>
              <Label htmlFor={field.name}>{field.label}</Label>
              {field.type === 'textarea' ? (
                <textarea
                  id={field.name}
                  className="w-full p-2 border rounded-md"
                  rows={3}
                  placeholder={field.placeholder}
                  value={taskFormData[field.name] || ''}
                  onChange={(e) => handleFormChange(field.name, e.target.value)}
                  required={field.required}
                />
              ) : field.type === 'select' ? (
                <select
                  id={field.name}
                  className="w-full p-2 border rounded-md"
                  value={taskFormData[field.name] || ''}
                  onChange={(e) => handleFormChange(field.name, e.target.value)}
                  required={field.required}
                >
                  <option value="">Select {field.label}</option>
                  {field.options.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  id={field.name}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={taskFormData[field.name] || ''}
                  onChange={(e) => handleFormChange(field.name, e.target.value)}
                  min={field.min}
                  max={field.max}
                  required={field.required}
                />
              )}
            </div>
          ))}
          
          <div className="flex space-x-2 pt-4">
            <Button onClick={handleCreateTask} disabled={loading} className="flex-1">
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCreateTask(false)
                setSelectedTemplate(null)
                setTaskFormData({})
              }}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Round Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Active Round
            </div>
            <Badge variant="outline">
              {Math.ceil((new Date(round.end_at) - new Date()) / (1000 * 60 * 60))}h remaining
            </Badge>
          </CardTitle>
          <CardDescription>
            Started {new Date(round.start_at).toLocaleString()}
            {round.stakes && ` • Stakes: ${round.stakes}`}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'tasks' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('tasks')}
        >
          My Tasks ({tasks.filter(t => t.user_id === user.id).length})
        </button>
        <button
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'all' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('all')}
        >
          All Tasks ({tasks.length})
        </button>
        <button
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'leaderboard' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('leaderboard')}
        >
          Leaderboard
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {/* Create Task Button */}
          {!showCreateTask && (
            <Button onClick={() => setShowCreateTask(true)} className="w-full">
              <Target className="h-4 w-4 mr-2" />
              Create New Task
            </Button>
          )}

          {/* Template Selection */}
          {showCreateTask && !selectedTemplate && (
            <Card>
              <CardHeader>
                <CardTitle>Choose Goal Template</CardTitle>
                <CardDescription>
                  Select the type of productivity goal you want to create
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {goalTemplates.map(template => {
                    const IconComponent = template.icon
                    return (
                      <Card 
                        key={template.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleTemplateSelect(template.id)}
                      >
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center text-lg">
                            <IconComponent className={`h-6 w-6 mr-2 text-${template.color}-500`} />
                            {template.name}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            {template.description}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Template Form */}
          {renderTemplateForm()}

          {/* User's Tasks */}
          <div className="space-y-3">
            {tasks.filter(t => t.creator_id === user.id).map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                user={user} 
                onUploadProof={handleUploadProof}
                onApproveTask={handleApproveTask}
                onFlagTask={handleFlagTask}
              />
            ))}
            {tasks.filter(t => t.creator_id === user.id).length === 0 && (
              <Card>
                <CardContent className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tasks created yet. Create your first task to get started!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeTab === 'all' && (
        <div className="space-y-3">
          {tasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              user={user} 
              showUser={true}
              onUploadProof={handleUploadProof}
              onApproveTask={handleApproveTask}
              onFlagTask={handleFlagTask}
            />
          ))}
          {tasks.length === 0 && (
            <Card>
              <CardContent className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tasks in this round yet. Be the first to create one!</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <LeaderboardView 
          roomMembers={roomMembers} 
          socket={socket}
          currentUser={user}
        />
      )}
    </div>
  )
}

// Leaderboard View Component
function LeaderboardView({ roomMembers, socket, currentUser }) {
  const [leaderboardData, setLeaderboardData] = useState([])
  const [animatingScores, setAnimatingScores] = useState({})
  const [lastUpdate, setLastUpdate] = useState(Date.now())

  // Calculate user scores and rankings
  useEffect(() => {
    const calculateLeaderboard = () => {
      const userScores = roomMembers.map(member => {
        // For now, we'll use mock data since we don't have approved tasks yet
        // In a real implementation, this would come from the backend
        const baseScore = member.name === 'Bob' ? 50 : member.name === 'Alice' ? 30 : 0
        const randomBonus = Math.floor(Math.random() * 20) // Simulate dynamic scoring
        
        return {
          id: member.id,
          name: member.name,
          score: baseScore + randomBonus,
          tasksCompleted: member.name === 'Bob' ? 2 : member.name === 'Alice' ? 1 : 0,
          tasksApproved: member.name === 'Bob' ? 1 : 0,
          streak: member.name === 'Bob' ? 3 : member.name === 'Alice' ? 1 : 0,
          avatar: member.name.charAt(0).toUpperCase(),
          isCurrentUser: member.name === currentUser?.name
        }
      })

      // Sort by score (descending)
      userScores.sort((a, b) => b.score - a.score)
      
      // Add rankings
      userScores.forEach((user, index) => {
        user.rank = index + 1
        user.rankChange = 0 // Could track rank changes over time
      })

      setLeaderboardData(userScores)
    }

    calculateLeaderboard()
    
    // Update every 30 seconds to simulate real-time changes
    const interval = setInterval(calculateLeaderboard, 30000)
    return () => clearInterval(interval)
  }, [roomMembers, currentUser])

  // Socket.io listeners for real-time updates
  useEffect(() => {
    if (!socket) return

    const handleScoreUpdate = (data) => {
      setAnimatingScores(prev => ({
        ...prev,
        [data.userId]: data.newScore
      }))
      
      // Clear animation after 2 seconds
      setTimeout(() => {
        setAnimatingScores(prev => {
          const newState = { ...prev }
          delete newState[data.userId]
          return newState
        })
      }, 2000)
      
      setLastUpdate(Date.now())
    }

    socket.on('score:update', handleScoreUpdate)
    socket.on('task:approved', handleScoreUpdate)
    socket.on('leaderboard:update', (data) => {
      setLeaderboardData(data.leaderboard)
      setLastUpdate(Date.now())
    })

    return () => {
      socket.off('score:update', handleScoreUpdate)
      socket.off('task:approved', handleScoreUpdate)
      socket.off('leaderboard:update')
    }
  }, [socket])

  const maxScore = leaderboardData.length > 0 ? leaderboardData[0].score : 100
  const getRankIcon = (rank) => {
    switch(rank) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return `#${rank}`
    }
  }

  const getRankColor = (rank) => {
    switch(rank) {
      case 1: return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 2: return 'text-gray-600 bg-gray-50 border-gray-200'
      case 3: return 'text-orange-600 bg-orange-50 border-orange-200'
      default: return 'text-blue-600 bg-blue-50 border-blue-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Leaderboard Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Trophy className="h-6 w-6 text-yellow-500" />
              <CardTitle>Live Leaderboard</CardTitle>
            </div>
            <div className="text-sm text-gray-500">
              Last updated: {new Date(lastUpdate).toLocaleTimeString()}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Leaderboard Rankings */}
      <div className="space-y-3">
        {leaderboardData.map((user, index) => (
          <Card 
            key={user.id} 
            className={`transition-all duration-500 hover:shadow-md ${
              user.isCurrentUser ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            } ${animatingScores[user.id] ? 'animate-pulse bg-green-50' : ''}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                {/* Rank Badge */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-lg ${getRankColor(user.rank)}`}>
                  {getRankIcon(user.rank)}
                </div>

                {/* User Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                  user.name === 'Bob' ? 'bg-blue-500' : 
                  user.name === 'Alice' ? 'bg-purple-500' : 'bg-gray-500'
                }`}>
                  {user.avatar}
                </div>

                {/* User Info and Progress */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <h3 className={`font-semibold ${user.isCurrentUser ? 'text-blue-700' : 'text-gray-900'}`}>
                        {user.name}
                        {user.isCurrentUser && <span className="text-xs text-blue-600 ml-1">(You)</span>}
                      </h3>
                      {user.streak > 0 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          🔥 {user.streak} day streak
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${animatingScores[user.id] ? 'text-green-600' : 'text-gray-900'}`}>
                        {user.score}
                        {animatingScores[user.id] && (
                          <span className="text-sm text-green-600 ml-1">
                            +{animatingScores[user.id] - user.score}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">points</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-1000 ease-out ${
                          user.rank === 1 ? 'bg-yellow-500' :
                          user.rank === 2 ? 'bg-gray-400' :
                          user.rank === 3 ? 'bg-orange-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${(user.score / maxScore) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center space-x-1">
                      <CheckCircle className="h-4 w-4" />
                      <span>{user.tasksCompleted} tasks</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Star className="h-4 w-4" />
                      <span>{user.tasksApproved} approved</span>
                    </span>
                    {user.rankChange !== 0 && (
                      <span className={`flex items-center space-x-1 ${
                        user.rankChange > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {user.rankChange > 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        <span>{Math.abs(user.rankChange)}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Leaderboard Stats */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{leaderboardData.length}</div>
              <div className="text-sm text-gray-600">Total Players</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {leaderboardData.reduce((sum, user) => sum + user.tasksCompleted, 0)}
              </div>
              <div className="text-sm text-gray-600">Tasks Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {leaderboardData.reduce((sum, user) => sum + user.score, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Points</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Task Card Component
function TaskCard({ task, user, showUser = false, onUploadProof, onApproveTask, onFlagTask }) {
  const [showProofModal, setShowProofModal] = useState(false)
  const [proofText, setProofText] = useState('')
  const [proofFile, setProofFile] = useState(null)
  const [proofType, setProofType] = useState('text')

  const getStatusColor = (approved) => {
    if (approved === null) return 'yellow'
    if (approved === true) return 'green'
    if (approved === false) return 'red'
    return 'gray'
  }

  const getStatusText = (approved) => {
    if (approved === null) return 'pending'
    if (approved === true) return 'approved'
    if (approved === false) return 'rejected'
    return 'unknown'
  }

  const getTemplateIcon = (template) => {
    switch (template) {
      case 'time-boxed': return Clock
      case 'milestone': return Target
      case 'quantitative': return Trophy
      case 'qualitative': return Users
      default: return Target
    }
  }

  const IconComponent = getTemplateIcon(task.template)

  const handleProofSubmit = () => {
    if (proofType === 'text' && proofText.trim()) {
      onUploadProof(task.id, { type: 'text', content: proofText })
    } else if (proofType === 'file' && proofFile) {
      const reader = new FileReader()
      reader.onload = (e) => {
        onUploadProof(task.id, { type: 'file', content: e.target.result, filename: proofFile.name })
      }
      reader.readAsDataURL(proofFile)
    }
    setShowProofModal(false)
    setProofText('')
    setProofFile(null)
  }

  const canApprove = user && task.creator_id !== user.id && task.approved === null
  const canUploadProof = user && task.creator_id === user.id && task.approved === null && !task.proof_url

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-lg">
              <IconComponent className="h-5 w-5 mr-2" />
              {task.title}
              {showUser && (
                <span className="ml-2 text-sm font-normal text-gray-600">
                  by {task.user?.name}
                </span>
              )}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className={`text-${getStatusColor(task.approved)}-600`}>
                {getStatusText(task.approved)}
              </Badge>
              <Badge variant="secondary">
                {task.points} pts
              </Badge>
            </div>
          </div>
          <CardDescription>{task.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {task.template === 'time-boxed' && (
            <div className="text-sm text-gray-600 mb-3">
              <Clock className="h-4 w-4 inline mr-1" />
              Duration: 15-120 minutes
            </div>
          )}
          
          {task.proof_url && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-800 mb-1">Proof Submitted:</p>
              <p className="text-sm text-blue-600">{task.proof_url}</p>
            </div>
          )}
          
          <div className="mt-3 pt-3 border-t flex gap-2">
            {canUploadProof && (
              <Button size="sm" onClick={() => setShowProofModal(true)} className="flex-1">
                <Upload className="h-4 w-4 mr-1" />
                Upload Proof
              </Button>
            )}
            
            {canApprove && task.proof_url && (
              <>
                <Button size="sm" variant="outline" onClick={() => onApproveTask(task.id, true)} className="flex-1">
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => onFlagTask(task.id)} className="flex-1">
                  <Flag className="h-4 w-4 mr-1" />
                  Flag
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Proof Upload Modal */}
      {showProofModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Upload Proof of Completion</CardTitle>
              <CardDescription>Provide evidence that you completed: {task.title}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Proof Type</label>
                <select 
                  value={proofType} 
                  onChange={(e) => setProofType(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="text">Text Description</option>
                  <option value="file">Screenshot/Photo</option>
                </select>
              </div>
              
              {proofType === 'text' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={proofText}
                    onChange={(e) => setProofText(e.target.value)}
                    placeholder="Describe what you accomplished and how you completed the task..."
                    className="w-full p-2 border rounded-md h-24 resize-none"
                  />
                </div>
              )}
              
              {proofType === 'file' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Upload File</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProofFile(e.target.files[0])}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
              )}
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setShowProofModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleProofSubmit} 
                disabled={proofType === 'text' ? !proofText.trim() : !proofFile}
                className="flex-1"
              >
                Submit Proof
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  )
}

export default App

