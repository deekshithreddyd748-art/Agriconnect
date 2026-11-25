import mongoose from 'mongoose';

let memoryServer = null;

/**
 * Connect to MongoDB using MONGO_URI, falling back to an embedded local
 * MongoDB instance in development when no external MongoDB server is running.
 */
export async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/agriconnect';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    const allowEmbedded =
      process.env.NODE_ENV !== 'production' &&
      process.env.ENABLE_EMBEDDED_MONGO !== 'false';

    if (!allowEmbedded) {
      throw err;
    }

    console.warn(
      `External MongoDB not reachable (${err.message}). Starting embedded local MongoDB...`
    );
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'agriconnect',
        launchTimeoutMS: 45000,
      },
    });
    const memoryUri = memoryServer.getUri();
    const conn = await mongoose.connect(memoryUri);
    console.log(`Embedded local MongoDB started at ${memoryUri}`);
    return conn;
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
