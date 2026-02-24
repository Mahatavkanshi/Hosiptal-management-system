import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';

// Create chat room
export const createChatRoom = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { room_type, name, participants } = req.body;
    const userId = (req as any).user?.id;

    // Add creator to participants
    const allParticipants = [...new Set([...participants, userId])];

    const result = await query(
      `INSERT INTO chat_rooms (room_type, name, participants, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [room_type, name, allParticipants, userId]
    );

    res.status(201).json({
      success: true,
      message: 'Chat room created successfully',
      data: result.rows[0]
    });
  }
);

// Get chat rooms for user
export const getChatRooms = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as any).user?.id;

    const rooms = await query(
      `SELECT cr.*, 
        (SELECT COUNT(*) FROM chat_messages cm WHERE cm.room_id = cr.id AND NOT ($1 = ANY(cm.read_by))) as unread_count,
        (SELECT cm.content FROM chat_messages cm WHERE cm.room_id = cr.id ORDER BY cm.created_at DESC LIMIT 1) as last_message,
        (SELECT cm.created_at FROM chat_messages cm WHERE cm.room_id = cr.id ORDER BY cm.created_at DESC LIMIT 1) as last_message_time
       FROM chat_rooms cr
       WHERE $1 = ANY(cr.participants)
       ORDER BY last_message_time DESC NULLS LAST`,
      [userId]
    );

    res.json({
      success: true,
      data: rooms.rows
    });
  }
);

// Get messages for a room
export const getMessages = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { roomId } = req.params;
    const userId = (req as any).user?.id;

    // Verify user is in the room
    const room = await query(
      'SELECT * FROM chat_rooms WHERE id = $1 AND $2 = ANY(participants)',
      [roomId, userId]
    );

    if (room.rows.length === 0) {
      throw new AppError('Chat room not found or access denied', 404);
    }

    const messages = await query(
      `SELECT cm.*, u.first_name, u.last_name
       FROM chat_messages cm
       JOIN users u ON cm.sender_id = u.id
       WHERE cm.room_id = $1
       ORDER BY cm.created_at ASC`,
      [roomId]
    );

    // Mark messages as read
    await query(
      `UPDATE chat_messages 
       SET read_by = array_append(read_by, $1)
       WHERE room_id = $2 AND NOT ($1 = ANY(read_by))`,
      [userId, roomId]
    );

    res.json({
      success: true,
      data: messages.rows
    });
  }
);

// Send message
export const sendMessage = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { roomId } = req.params;
    const { message_type, content, attachments } = req.body;
    const senderId = (req as any).user?.id;

    // Verify user is in the room
    const room = await query(
      'SELECT * FROM chat_rooms WHERE id = $1 AND $2 = ANY(participants)',
      [roomId, senderId]
    );

    if (room.rows.length === 0) {
      throw new AppError('Chat room not found or access denied', 404);
    }

    const result = await query(
      `INSERT INTO chat_messages (room_id, sender_id, message_type, content, attachments, read_by)
       VALUES ($1, $2, $3, $4, $5, ARRAY[$6])
       RETURNING *`,
      [roomId, senderId, message_type, content, JSON.stringify(attachments), senderId]
    );

    // Get sender details
    const sender = await query(
      'SELECT first_name, last_name FROM users WHERE id = $1',
      [senderId]
    );

    res.status(201).json({
      success: true,
      message: 'Message sent',
      data: {
        ...result.rows[0],
        first_name: sender.rows[0].first_name,
        last_name: sender.rows[0].last_name
      }
    });
  }
);

// Get unread message count
export const getUnreadCount = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as any).user?.id;

    const result = await query(
      `SELECT COUNT(*) as unread_count
       FROM chat_messages cm
       JOIN chat_rooms cr ON cm.room_id = cr.id
       WHERE $1 = ANY(cr.participants) AND NOT ($1 = ANY(cm.read_by))`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        unread_count: parseInt(result.rows[0].unread_count)
      }
    });
  }
);

// Create or get private chat room (for nurse-doctor chat)
export const getOrCreatePrivateRoom = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { other_user_id } = req.body;
    const userId = (req as any).user?.id;

    // Check if room already exists
    const existingRoom = await query(
      `SELECT * FROM chat_rooms 
       WHERE room_type = 'private' 
       AND participants @> ARRAY[$1::uuid, $2::uuid]
       AND array_length(participants, 1) = 2`,
      [userId, other_user_id]
    );

    if (existingRoom.rows.length > 0) {
      res.json({
        success: true,
        data: existingRoom.rows[0]
      });
      return;
    }

    // Get other user details
    const otherUser = await query(
      'SELECT first_name, last_name FROM users WHERE id = $1',
      [other_user_id]
    );

    // Create new room
    const result = await query(
      `INSERT INTO chat_rooms (room_type, name, participants, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      ['private', `Chat with ${otherUser.rows[0].first_name} ${otherUser.rows[0].last_name}`, [userId, other_user_id], userId]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  }
);

// Trigger emergency alert
export const triggerEmergencyAlert = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { alert_type, location, description } = req.body;
    const triggeredBy = (req as any).user?.id;

    const result = await query(
      `INSERT INTO emergency_alerts (alert_type, location, triggered_by, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [alert_type, location, triggeredBy, description]
    );

    res.status(201).json({
      success: true,
      message: 'Emergency alert triggered',
      data: result.rows[0]
    });
  }
);

// Get emergency alerts
export const getEmergencyAlerts = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { status } = req.query;

    let whereClause = '';
    const params: any[] = [];

    if (status) {
      whereClause = 'WHERE status = $1';
      params.push(status);
    }

    const alerts = await query(
      `SELECT ea.*, u.first_name as triggered_by_first_name, u.last_name as triggered_by_last_name
       FROM emergency_alerts ea
       JOIN users u ON ea.triggered_by = u.id
       ${whereClause}
       ORDER BY ea.created_at DESC
       LIMIT 50`,
      params
    );

    res.json({
      success: true,
      data: alerts.rows
    });
  }
);

// Resolve emergency alert
export const resolveEmergencyAlert = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;

    const result = await query(
      `UPDATE emergency_alerts 
       SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Emergency alert not found', 404);
    }

    res.json({
      success: true,
      message: 'Emergency alert resolved',
      data: result.rows[0]
    });
  }
);

// Initiate video call
export const initiateVideoCall = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { callee_id, call_type } = req.body;
    const callerId = (req as any).user?.id;

    // Generate unique room ID
    const roomId = `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const result = await query(
      `INSERT INTO video_calls (room_id, caller_id, callee_id, call_type)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [roomId, callerId, callee_id, call_type]
    );

    res.status(201).json({
      success: true,
      message: 'Video call initiated',
      data: result.rows[0]
    });
  }
);

// Get video call status
export const getVideoCall = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { roomId } = req.params;
    const userId = (req as any).user?.id;

    const call = await query(
      `SELECT vc.*, 
        caller.first_name as caller_first_name, caller.last_name as caller_last_name,
        callee.first_name as callee_first_name, callee.last_name as callee_last_name
       FROM video_calls vc
       JOIN users caller ON vc.caller_id = caller.id
       JOIN users callee ON vc.callee_id = callee.id
       WHERE vc.room_id = $1 AND (vc.caller_id = $2 OR vc.callee_id = $2)`,
      [roomId, userId]
    );

    if (call.rows.length === 0) {
      throw new AppError('Video call not found', 404);
    }

    res.json({
      success: true,
      data: call.rows[0]
    });
  }
);

// Update video call status
export const updateVideoCallStatus = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { roomId } = req.params;
    const { status, duration_seconds } = req.body;

    let updateFields = 'status = $1';
    const params: any[] = [status, roomId];

    if (status === 'ongoing') {
      updateFields += ', started_at = CURRENT_TIMESTAMP';
    } else if (status === 'completed') {
      updateFields += ', ended_at = CURRENT_TIMESTAMP, duration_seconds = $3';
      params.splice(2, 0, duration_seconds);
    }

    const result = await query(
      `UPDATE video_calls SET ${updateFields} WHERE room_id = $2 RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      throw new AppError('Video call not found', 404);
    }

    res.json({
      success: true,
      message: 'Call status updated',
      data: result.rows[0]
    });
  }
);

// Get call history
export const getCallHistory = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as any).user?.id;

    const calls = await query(
      `SELECT vc.*, 
        CASE 
          WHEN vc.caller_id = $1 THEN callee.first_name
          ELSE caller.first_name
        END as other_party_first_name,
        CASE 
          WHEN vc.caller_id = $1 THEN callee.last_name
          ELSE caller.last_name
        END as other_party_last_name
       FROM video_calls vc
       JOIN users caller ON vc.caller_id = caller.id
       JOIN users callee ON vc.callee_id = callee.id
       WHERE vc.caller_id = $1 OR vc.callee_id = $1
       ORDER BY vc.created_at DESC
       LIMIT 50`,
      [userId]
    );

    res.json({
      success: true,
      data: calls.rows
    });
  }
);
