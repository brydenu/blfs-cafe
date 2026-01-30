const { Server } = require("socket.io");
const http = require("http");

const server = http.createServer();
const PORT = process.env.SOCKET_PORT || 3001;

const io = new Server(server, {
    path: '/socket.io/',
    cors: {
        origin: process.env.NEXT_PUBLIC_URL || "*",
        methods: ["GET", "POST"],
        credentials: true
    },
});

io.on("connection", (socket) => {
    console.log(`⚡ Client connected: ${socket.id}`);

    // 1. ADMIN QUEUE Event
    socket.on("refresh-queue", (data) => {
        // console.log("📢 Broadcasting 'refresh-queue'"); // Optional log
        io.emit("refresh-queue", data);
    });

    // 2. CUSTOMER TRACKER Event
    socket.on("order-update", (data) => {
        // console.log("📢 Broadcasting 'order-update'"); // Optional log
        io.emit("order-update", data);
    });

    socket.on("disconnect", () => {
        // console.log(`❌ Client disconnected`);
    });
});

server.listen(PORT, () => {
    console.log(`✅ WebSocket Server running on port ${PORT}`);
});
