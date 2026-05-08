import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const useSocket = (
    projectId: string, 
    onTaskUpdate: (task: any) => void,
    onCommentAdded?: (comment: any) => void,
    onProjectUpdate?: (project: any) => void
) => {
    const onTaskUpdateRef = useRef(onTaskUpdate);
    const onCommentAddedRef = useRef(onCommentAdded);
    const onProjectUpdateRef = useRef(onProjectUpdate);

    useEffect(() => {
        onTaskUpdateRef.current = onTaskUpdate;
        onCommentAddedRef.current = onCommentAdded;
        onProjectUpdateRef.current = onProjectUpdate;
    }, [onTaskUpdate, onCommentAdded, onProjectUpdate]);

    useEffect(() => {
        if (!projectId) return;

        // In AI Studio, the frontend and backend are on the same origin (port 3000)
        if (!socket) {
            socket = io('/', {
                withCredentials: true,
                transports: ['websocket', 'polling']
            });
        }

        socket.on('connect', () => {
            console.log('Connected to socket server');
            socket?.emit('join-board', projectId);
        });

        socket.on('task:updated', (task) => {
            onTaskUpdateRef.current(task);
        });

        socket.on('task:created', (task) => {
            onTaskUpdateRef.current({ ...task, _isNew: true });
        });

        socket.on('task:deleted', (taskId) => {
            onTaskUpdateRef.current({ _id: taskId, _isDeleted: true });
        });

        socket.on('comment:added', (comment) => {
            if (onCommentAddedRef.current) {
                onCommentAddedRef.current(comment);
            }
        });

        socket.on('project:updated', (project) => {
            if (onProjectUpdateRef.current) {
                onProjectUpdateRef.current(project);
            }
        });

        return () => {
            if (socket) {
                socket.off('task:updated');
                socket.off('task:created');
                socket.off('task:deleted');
                socket.off('comment:added');
                socket.off('project:updated');
            }
        };
    }, [projectId]);

    return socket;
};
