const mongoose = require('mongoose');
const https = require('https');
const dns = require('dns');

let isMongoConnected = false;
let isFallbackMode = false;

/**
 * Resolves a mongodb+srv:// URI into a standard mongodb:// shard seedlist URI
 * using Google DNS-over-HTTPS (port 443) whenever local UDP port 53 refuses querySrv!
 */
async function convertSrvToStandardUri(srvUri) {
  try {
    if (!srvUri || !srvUri.startsWith('mongodb+srv://')) return null;

    const withoutProto = srvUri.replace('mongodb+srv://', '');
    const atIndex = withoutProto.indexOf('@');
    if (atIndex === -1) return null;

    const authPart = withoutProto.substring(0, atIndex);
    const restPart = withoutProto.substring(atIndex + 1);
    const slashIndex = restPart.indexOf('/');
    const host = slashIndex === -1 ? restPart : restPart.substring(0, slashIndex);
    const pathAndQuery = slashIndex === -1 ? '/aggentic_future_farming' : restPart.substring(slashIndex);

    const fetchDoH = (name, type) =>
      new Promise((resolve, reject) => {
        https
          .get(`https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`, (res) => {
            let body = '';
            res.on('data', (chunk) => (body += chunk));
            res.on('end', () => {
              try {
                resolve(JSON.parse(body));
              } catch (e) {
                reject(e);
              }
            });
          })
          .on('error', reject);
      });

    const srvData = await fetchDoH(`_mongodb._tcp.${host}`, 'SRV');
    if (!srvData.Answer || !srvData.Answer.length) return null;

    const hosts = srvData.Answer.map((ans) => {
      const parts = ans.data.trim().split(/\s+/);
      const port = parts[2] || '27017';
      const target = parts[3].replace(/\.$/, '');
      return `${target}:${port}`;
    }).join(',');

    const txtData = await fetchDoH(host, 'TXT');
    let txtParams = 'ssl=true&authSource=admin&retryWrites=true&w=majority';
    if (txtData.Answer && txtData.Answer.length) {
      const rawTxt = txtData.Answer[0].data.replace(/"/g, '').trim();
      txtParams = `ssl=true&${rawTxt}`;
    }

    const hasQuery = pathAndQuery.includes('?');
    const separator = hasQuery ? '&' : '?';
    return `mongodb://${authPart}@${hosts}${pathAndQuery}${separator}${txtParams}`;
  } catch (err) {
    return null;
  }
}

async function connectDatabase(maxAttempts = 3) {
  if (isMongoConnected && mongoose.connection.readyState === 1) {
    return mongoose;
  }

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aggentic_future_farming';

  // Prevent Mongoose from buffering operations indefinitely when disconnected
  mongoose.set('bufferCommands', false);

  // Prevent duplicate error listener spam during connection retries
  mongoose.connection.removeAllListeners('error');
  mongoose.connection.on('error', (err) => {
    if (isMongoConnected) {
      console.error('[MongoDB Runtime Error]:', err.message);
    }
  });

  mongoose.connection.removeAllListeners('connected');
  mongoose.connection.on('connected', () => {
    isMongoConnected = true;
    isFallbackMode = false;
    console.log('[MongoDB] Successfully connected to MongoDB Atlas (aggentic_future_farming)');
  });

  mongoose.connection.removeAllListeners('disconnected');
  mongoose.connection.on('disconnected', () => {
    if (isMongoConnected) {
      console.warn('[MongoDB] Connection lost. Operating with persistent local fallback until reconnected.');
    }
    isMongoConnected = false;
  });

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Mask password in log
      const maskedUri = (mongoUri || '').replace(/:([^:@]+)@/, ':****@');
      console.log(`[MongoDB] Attempting database connection (Attempt ${attempt}/${maxAttempts}) to: ${maskedUri}`);

      // Re-assert Google/Cloudflare DNS before each attempt
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4', '1.0.0.1']);
      } catch (_) {}

      await mongoose.connect(mongoUri, {
        family: 4, // Force IPv4 socket
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 45000,
      });

      isMongoConnected = true;
      isFallbackMode = false;
      return mongoose;
    } catch (err) {
      console.warn(`[MongoDB Warning] Connection attempt ${attempt}/${maxAttempts} failed: ${err.message}`);

      // If SRV lookup failed (querySrv ECONNREFUSED / ETIMEDOUT / ENOTFOUND), try converting SRV to direct shard URI via DNS-over-HTTPS!
      if (
        err.message &&
        (err.message.includes('querySrv') || err.message.includes('ENOTFOUND') || err.message.includes('ETIMEDOUT'))
      ) {
        console.log('[MongoDB DNS Recovery] Resolving Atlas shards via Google DNS-over-HTTPS (Port 443)...');
        const directUri = await convertSrvToStandardUri(mongoUri);
        if (directUri) {
          try {
            console.log('[MongoDB DNS Recovery] Attempting connection via resolved direct shard seedlist...');
            await mongoose.connect(directUri, {
              family: 4,
              serverSelectionTimeoutMS: 8000,
              socketTimeoutMS: 45000,
            });
            isMongoConnected = true;
            isFallbackMode = false;
            console.log('[MongoDB DNS Recovery] Connected to MongoDB Atlas via direct shard seedlist!');
            return mongoose;
          } catch (directErr) {
            console.warn('[MongoDB DNS Recovery] Direct shard connection failed:', directErr.message);
          }
        }
      }

      if (attempt < maxAttempts) {
        const delaySec = attempt * 2;
        console.log(`[MongoDB] Retrying in ${delaySec} seconds...`);
        await new Promise((r) => setTimeout(r, delaySec * 1000));
      }
    }
  }

  // Try Local MongoDB on 127.0.0.1:27017 before engaging disk fallback
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/aggentic_future_farming', {
      family: 4,
      serverSelectionTimeoutMS: 2500,
    });
    isMongoConnected = true;
    isFallbackMode = false;
    console.log('[MongoDB] Connected to local MongoDB instance (127.0.0.1:27017)');
    return mongoose;
  } catch (_) {
    isFallbackMode = true;
    isMongoConnected = false;
    console.log(
      '[MongoDB Fallback Active] Network/Atlas unreachable. Server is 100% operational using Persistent Disk Storage (backend/data/fallback_db.json).'
    );
    return null;
  }
}

module.exports = {
  connectDatabase,
  connectDB: connectDatabase,
  isDatabaseConnected: () => mongoose.connection.readyState === 1,
  isFallbackMode: () => isFallbackMode || mongoose.connection.readyState !== 1,
};
