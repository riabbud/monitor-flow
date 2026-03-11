import { io } from 'socket.io-client'

let socket = null

export function connectSocket(token) {
    if (socket?.connected) return socket

    socket = io('/', {
        auth: { token },
        transports: ['websocket', 'polling'],
    })

    socket.on('connect', () => {
        console.log('[Socket] Conectado ao servidor')
    })

    socket.on('disconnect', (reason) => {
        console.log('[Socket] Desconectado:', reason)
    })

    socket.on('connect_error', (error) => {
        console.error('[Socket] Erro de conexão:', error.message)
    })

    return socket
}

export function disconnectSocket() {
    if (socket) {
        socket.disconnect()
        socket = null
    }
}

export function getSocket() {
    return socket
}
