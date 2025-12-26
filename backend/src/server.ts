import { createApp } from "./app";
import { config } from "./config";
import { DatabaseClient } from "./config/database";
import { queueManager } from "./queue";
import { scraperManager } from "./scrapers";

/**
 * Start the HTTP server
 */
const startServer = async (): Promise<void> => {
  try {
    // Test database connection
    console.log("🔌 Connecting to database...");
    const dbHealthy = await DatabaseClient.healthCheck();

    if (!dbHealthy) {
      console.error("❌ Database connection failed");
      process.exit(1);
    }

    console.log("✅ Database connection successful");

    // Initialize queue
    console.log("🔌 Initializing queue...");
    await queueManager.initialize();
    console.log("✅ Queue initialized successfully");

    // Create Express app
    const app = createApp();

    // Start server
    const server = app.listen(config.server.port, () => {
      console.log("🚀 Server started successfully");
      console.log(`📍 Environment: ${config.server.env}`);
      console.log(`📡 Listening on port: ${config.server.port}`);
      console.log(
        `🏥 Health check: http://localhost:${config.server.port}/health`
      );
      console.log(
        `🔐 API endpoints: http://localhost:${config.server.port}/api`
      );
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n⚠️  ${signal} received, starting graceful shutdown...`);

      server.close(async () => {
        console.log("🔌 HTTP server closed");

        // Close queue
        await queueManager.close();

        // Cleanup scrapers
        await scraperManager.cleanup();

        // Disconnect from database
        await DatabaseClient.disconnect();

        console.log("✅ Graceful shutdown completed");
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error("❌ Forced shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Handle uncaught errors
    process.on("uncaughtException", (error) => {
      console.error("❌ Uncaught Exception:", error);
      process.exit(1);
    });

    process.on("unhandledRejection", (reason, promise) => {
      console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
      process.exit(1);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Start server
startServer();
