const { Server } = require("socket.io");

const io = new Server(3001, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
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

console.log("✅ WebSocket Server running on port 3001");
