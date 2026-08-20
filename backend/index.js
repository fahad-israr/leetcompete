const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand
} = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');

const { verifyUserSubmission, getQuestionDetails } = require('./leetcode');
const {
  PROBLEM_CATALOG,
  PRESET_LISTS,
  searchCatalog,
  resolveProblem,
  resolveListOrUrls,
  generateRandomRoundFromPool
} = require('./problemBank');

// Initialize DynamoDB Client
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE = process.env.USERS_TABLE || 'leetcompete-users-dev';
const SEASONS_TABLE = process.env.SEASONS_TABLE || 'leetcompete-seasons-dev';
const CONTESTS_TABLE = process.env.CONTESTS_TABLE || 'leetcompete-contests-dev';
const SUBMISSIONS_TABLE = process.env.SUBMISSIONS_TABLE || 'leetcompete-submissions-dev';
const MESSAGES_TABLE = process.env.MESSAGES_TABLE || 'leetcompete-messages-dev';
const RATELIMITS_TABLE = process.env.RATELIMITS_TABLE || 'leetcompete-ratelimits-dev';

const JWT_SECRET = process.env.JWT_SECRET || 'leetcompete_jwt_secret_key_2026_super_secure';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'onboarding@resend.dev';

// Standard response headers (Function URL handles CORS automatically)
const standardHeaders = {
  'Content-Type': 'application/json'
};

function jsonResponse(statusCode, data) {
  return {
    statusCode,
    headers: standardHeaders,
    body: JSON.stringify(data)
  };
}

function generateCode(length = 5) {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateNumericOTP(length = 6) {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return otp;
}

/**
 * 12-Hour Sliding Window Rate Limiting Engine
 * Max 10 attempts per identifier in a 12-hour window (43200 seconds)
 */
async function checkRateLimit(identifierKey, maxAttempts = 10, windowHours = 12) {
  const now = Math.floor(Date.now() / 1000);
  const windowSeconds = windowHours * 3600;

  try {
    const res = await docClient.send(new GetCommand({
      TableName: RATELIMITS_TABLE,
      Key: { id: identifierKey }
    }));

    const item = res.Item;
    if (!item || now > item.windowExpiresAt) {
      // First attempt in a new window
      const newRecord = {
        id: identifierKey,
        count: 1,
        windowExpiresAt: now + windowSeconds,
        updatedAt: now
      };
      await docClient.send(new PutCommand({
        TableName: RATELIMITS_TABLE,
        Item: newRecord
      }));
      return { allowed: true, remaining: maxAttempts - 1, resetInSeconds: windowSeconds };
    }

    if (item.count >= maxAttempts) {
      const resetInSeconds = Math.max(0, item.windowExpiresAt - now);
      const hoursRemaining = (resetInSeconds / 3600).toFixed(1);
      return {
        allowed: false,
        remaining: 0,
        resetInSeconds,
        error: `Rate limit exceeded (Max ${maxAttempts} requests in ${windowHours} hours). Please try again in ${hoursRemaining} hours.`
      };
    }

    // Increment attempt count
    await docClient.send(new UpdateCommand({
      TableName: RATELIMITS_TABLE,
      Key: { id: identifierKey },
      UpdateExpression: 'SET #c = #c + :one, updatedAt = :now',
      ExpressionAttributeNames: { '#c': 'count' },
      ExpressionAttributeValues: { ':one': 1, ':now': now }
    }));

    return { allowed: true, remaining: maxAttempts - (item.count + 1), resetInSeconds: item.windowExpiresAt - now };
  } catch (e) {
    console.warn('Rate limit check fallback:', e.message);
    return { allowed: true, remaining: maxAttempts, resetInSeconds: windowSeconds };
  }
}

/**
 * Resend Email Dispatcher
 */
async function sendVerificationEmail(recipientEmail, code, username, type = 'verification') {
  const isReset = type === 'reset';
  const title = isReset ? 'Reset Your LeetCompete Password' : 'Verify Your LeetCompete Email';
  const actionText = isReset ? 'use this code to reset your password' : 'use this code to activate your LeetCompete account';

  if (!RESEND_API_KEY || RESEND_API_KEY.includes('mock')) {
    console.log(`[MOCK RESEND EMAIL] To: ${recipientEmail} | Code: ${code} | Type: ${type}`);
    return { success: true, mock: true };
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b0d13; color: #f8fafc; margin: 0; padding: 20px; }
          .container { max-width: 520px; margin: 0 auto; background-color: #131620; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 32px 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
          .header { text-align: center; margin-bottom: 24px; }
          .logo { display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); width: 44px; height: 44px; border-radius: 10px; line-height: 44px; font-size: 18px; font-weight: 800; color: #ffffff; margin-bottom: 12px; font-family: monospace; }
          .title { font-size: 22px; font-weight: 800; color: #ffffff; margin: 0; }
          .subtitle { font-size: 13px; color: #94a3b8; margin-top: 4px; }
          .card { background-color: #1a1e2c; border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 24px; text-align: center; margin: 20px 0; }
          .otp-code { font-family: 'JetBrains Mono', monospace, Courier; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #fbbf24; background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.3); padding: 14px 20px; border-radius: 8px; display: inline-block; margin: 16px 0; }
          .footer { font-size: 12px; color: #64748b; text-align: center; margin-top: 24px; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">&lt;/&gt;</div>
            <h1 class="title">${title}</h1>
            <div class="subtitle">Multiplayer LeetCode Arena & Zero-Repetition Bundles</div>
          </div>
          <div class="card">
            <p style="font-size: 15px; color: #e2e8f0; margin: 0 0 10px;">Hello <strong>@${username}</strong>,</p>
            <p style="font-size: 14px; color: #94a3b8; margin: 0 0 16px;">Please ${actionText}:</p>
            <div class="otp-code">${code}</div>
            <p style="font-size: 13px; color: #94a3b8; margin: 12px 0 0;">This verification code is valid for <strong>15 minutes</strong>.</p>
          </div>
          <div class="footer">
            If you did not request this verification code, no action is needed.<br>
            Protected by 12-hour sliding window rate limiting.
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: SENDER_EMAIL || 'onboarding@resend.dev',
        to: [recipientEmail],
        subject: `[${code}] LeetCompete Verification Code`,
        html
      })
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('Resend API Error:', data);
      return { success: false, error: data.message || 'Failed to send email via Resend' };
    }
    return { success: true, id: data.id };
  } catch (err) {
    console.error('Resend Dispatch Exception:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Password Hashing & Verification
 */
function hashPassword(password, salt = null) {
  if (!salt) salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  const check = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return check === hash;
}

function generateUserToken(user) {
  const isSuper = (user.username || '').toLowerCase() === 'fahad00cms' || (user.email || '').toLowerCase() === 'fahad00cms@gmail.com' || user.role === 'superadmin';
  const payload = {
    username: user.username.toLowerCase(),
    displayName: user.displayName || user.username,
    email: user.email || null,
    isVerified: !!user.isVerified,
    role: isSuper ? 'superadmin' : (user.role || 'organizer'),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 24 * 60 * 60) // 60 days
  };
  const str = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(str).digest('base64url');
  return `${str}.${sig}`;
}

function verifyUserToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [str, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(str).digest('base64url');
  if (sig !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(str, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    const isSuper = (payload.username || '').toLowerCase() === 'fahad00cms' || (payload.email || '').toLowerCase() === 'fahad00cms@gmail.com' || payload.role === 'superadmin';
    return {
      ...payload,
      role: isSuper ? 'superadmin' : (payload.role || 'organizer')
    };
  } catch (e) {
    return null;
  }
}

function getAuthenticatedUser(event) {
  const headers = event.headers || {};
  const authHeader = headers.authorization || headers.Authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const verified = verifyUserToken(token);
    if (verified) return verified;
  }
  const usernameHeader = headers['x-username'] || headers['X-Username'];
  if (usernameHeader) {
    const u = usernameHeader.trim().toLowerCase();
    const isSuper = u === 'fahad00cms' || u === 'fahad00cms@gmail.com';
    return { username: u, displayName: usernameHeader.trim(), role: isSuper ? 'superadmin' : 'organizer' };
  }
  return null;
}

function isSuperAdmin(authUser) {
  if (!authUser) return false;
  const username = (authUser.username || '').toLowerCase();
  const email = (authUser.email || '').toLowerCase();
  return authUser.role === 'superadmin' || username === 'fahad00cms' || email === 'fahad00cms@gmail.com';
}

function isUserOrganizer(authUser, contest) {
  if (!authUser || !contest) return false;
  if (isSuperAdmin(authUser)) return true;
  const uLower = (authUser.username || '').toLowerCase();
  const eLower = (authUser.email || '').toLowerCase();
  const ownerLower = (contest.ownerUsername || '').toLowerCase();
  const hostLower = (contest.hostUsername || '').toLowerCase();
  return uLower === ownerLower || uLower === hostLower || eLower === ownerLower || eLower === hostLower;
}

function getClientIdentifier(event, body) {
  if (body?.clientMachineId && body.clientMachineId.trim()) {
    return `machine_${body.clientMachineId.trim().slice(0, 64)}`;
  }
  const ip = event.requestContext?.http?.sourceIp || event.headers?.['x-forwarded-for'] || '127.0.0.1';
  return `ip_${ip.split(',')[0].trim()}`;
}

async function resolveContest(codeOrId) {
  if (!codeOrId) return null;
  const clean = codeOrId.trim();
  let contest = null;
  if (clean.length === 5) {
    const qRes = await docClient.send(new QueryCommand({
      TableName: CONTESTS_TABLE,
      IndexName: 'CodeIndex',
      KeyConditionExpression: 'code = :code',
      ExpressionAttributeValues: { ':code': clean.toUpperCase() }
    }));
    if (qRes.Items && qRes.Items[0]) contest = qRes.Items[0];
  }
  if (!contest) {
    const getRes = await docClient.send(new GetCommand({
      TableName: CONTESTS_TABLE,
      Key: { id: clean }
    }));
    contest = getRes.Item || null;
  }

  if (!contest) return null;

  const now = Math.floor(Date.now() / 1000);

  // Auto-start prescheduled contests when scheduledStartTime is reached
  if (contest.status === 'WAITING' && contest.scheduledStartTime && now >= contest.scheduledStartTime) {
    const startTime = contest.scheduledStartTime;
    const endTime = contest.scheduledStartTime + ((contest.durationMinutes || 60) * 60);
    const newStatus = now >= endTime ? 'FINISHED' : 'IN_PROGRESS';

    contest.status = newStatus;
    contest.startTime = startTime;
    contest.endTime = endTime;

    docClient.send(new UpdateCommand({
      TableName: CONTESTS_TABLE,
      Key: { id: contest.id },
      UpdateExpression: 'SET #st = :status, startTime = :start, endTime = :end',
      ExpressionAttributeNames: { '#st': 'status' },
      ExpressionAttributeValues: {
        ':status': newStatus,
        ':start': startTime,
        ':end': endTime
      }
    })).catch(() => {});
  } else if (contest.status === 'IN_PROGRESS' && contest.endTime && now >= contest.endTime) {
    contest.status = 'FINISHED';
    docClient.send(new UpdateCommand({
      TableName: CONTESTS_TABLE,
      Key: { id: contest.id },
      UpdateExpression: 'SET #st = :fin',
      ExpressionAttributeNames: { '#st': 'status' },
      ExpressionAttributeValues: { ':fin': 'FINISHED' }
    })).catch(() => {});
  }

  return contest;
}

/**
 * Cascade Hard-Deletion Engine Helpers
 */
async function deleteContestAndCascade(contestId) {
  if (!contestId) return;

  // 1. Delete all submissions for this contest
  try {
    const subRes = await docClient.send(new QueryCommand({
      TableName: SUBMISSIONS_TABLE,
      KeyConditionExpression: 'contestId = :cId',
      ExpressionAttributeValues: { ':cId': contestId }
    }));
    for (const sub of (subRes.Items || [])) {
      await docClient.send(new DeleteCommand({
        TableName: SUBMISSIONS_TABLE,
        Key: { contestId: sub.contestId, id: sub.id }
      })).catch(() => {});
    }
  } catch (e) {
    console.error(`Error deleting submissions for contest ${contestId}:`, e);
  }

  // 2. Delete all chat messages for this contest
  try {
    const msgRes = await docClient.send(new QueryCommand({
      TableName: MESSAGES_TABLE,
      KeyConditionExpression: 'contestId = :cId',
      ExpressionAttributeValues: { ':cId': contestId }
    }));
    for (const msg of (msgRes.Items || [])) {
      await docClient.send(new DeleteCommand({
        TableName: MESSAGES_TABLE,
        Key: { contestId: msg.contestId, createdAt: msg.createdAt }
      })).catch(() => {});
    }
  } catch (e) {
    console.error(`Error deleting messages for contest ${contestId}:`, e);
  }

  // 3. Delete the contest itself
  await docClient.send(new DeleteCommand({
    TableName: CONTESTS_TABLE,
    Key: { id: contestId }
  })).catch(() => {});
}

async function deleteSeasonAndCascade(seasonId) {
  if (!seasonId) return;

  // 1. Find and delete all contests linked to this season
  try {
    const contestsRes = await docClient.send(new ScanCommand({
      TableName: CONTESTS_TABLE,
      FilterExpression: 'seasonId = :sId',
      ExpressionAttributeValues: { ':sId': seasonId }
    }));
    for (const c of (contestsRes.Items || [])) {
      await deleteContestAndCascade(c.id);
    }
  } catch (e) {
    console.error(`Error deleting contests for season ${seasonId}:`, e);
  }

  // 2. Delete the season itself
  await docClient.send(new DeleteCommand({
    TableName: SEASONS_TABLE,
    Key: { id: seasonId }
  })).catch(() => {});
}

async function deleteUserAndCascade(rawUsername) {
  const username = (rawUsername || '').trim();
  const uLower = username.toLowerCase();

  // Root Super Admin Protection
  if (uLower === 'fahad00cms' || uLower === 'fahad00cms@gmail.com') {
    throw new Error('Root superadmin account cannot be deleted.');
  }

  // 1. Find and delete all seasons owned by user
  try {
    const seasonsRes = await docClient.send(new ScanCommand({
      TableName: SEASONS_TABLE,
      FilterExpression: 'ownerUsername = :u OR ownerUsername = :uLower',
      ExpressionAttributeValues: { ':u': username, ':uLower': uLower }
    }));
    for (const s of (seasonsRes.Items || [])) {
      await deleteSeasonAndCascade(s.id);
    }
  } catch (e) {
    console.error(`Error deleting seasons for user ${username}:`, e);
  }

  // 2. Find and delete all contests hosted/owned by user
  try {
    const contestsRes = await docClient.send(new ScanCommand({
      TableName: CONTESTS_TABLE,
      FilterExpression: 'ownerUsername = :u OR ownerUsername = :uLower OR hostUsername = :u OR hostUsername = :uLower',
      ExpressionAttributeValues: { ':u': username, ':uLower': uLower }
    }));
    for (const c of (contestsRes.Items || [])) {
      await deleteContestAndCascade(c.id);
    }
  } catch (e) {
    console.error(`Error deleting contests for user ${username}:`, e);
  }

  // 3. Delete any standalone submissions by this user across other contests
  try {
    const allSubsRes = await docClient.send(new ScanCommand({
      TableName: SUBMISSIONS_TABLE,
      FilterExpression: 'username = :u OR username = :uLower',
      ExpressionAttributeValues: { ':u': username, ':uLower': uLower }
    }));
    for (const sub of (allSubsRes.Items || [])) {
      await docClient.send(new DeleteCommand({
        TableName: SUBMISSIONS_TABLE,
        Key: { contestId: sub.contestId, id: sub.id }
      })).catch(() => {});
    }
  } catch (e) {
    console.error(`Error deleting submissions for user ${username}:`, e);
  }

  // 4. Delete user from UsersTable
  await docClient.send(new DeleteCommand({
    TableName: USERS_TABLE,
    Key: { username }
  }));
}

/**
 * Main AWS Lambda Request Router
 */
exports.handler = async (event) => {
  // Handle HTTP OPTIONS for CORS preflight
  if (event.requestContext?.http?.method === 'OPTIONS' || event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: standardHeaders,
      body: JSON.stringify({ message: 'CORS OK' })
    };
  }

  const httpMethod = event.requestContext?.http?.method || event.httpMethod || 'GET';
  const path = event.rawPath || event.path || '/';
  let body = {};
  if (event.body) {
    try {
      body = JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body);
    } catch (e) {
      body = {};
    }
  }

  const queryParams = event.queryStringParameters || {};
  const authUser = getAuthenticatedUser(event);

  try {
    // Health Check
    if (path === '/api/health' && httpMethod === 'GET') {
      return jsonResponse(200, {
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'LeetCompete Serverless API'
      });
    }

    // === AUTHENTICATION & EMAIL VERIFICATION ENDPOINTS ===
    
    // 1. Register with Email Verification & Rate Limiting
    // 1. Register User (Email + Password only required; username auto-derived from email if omitted)
    if (path === '/api/auth/register' && httpMethod === 'POST') {
      const { email, password, username, displayName } = body;
      
      if (!email || !email.trim() || !email.includes('@')) {
        return jsonResponse(400, { success: false, error: 'A valid email address is required.' });
      }
      if (!password || password.length < 6) {
        return jsonResponse(400, { success: false, error: 'Password must be at least 6 characters long.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      
      // Auto-derive clean username from email prefix if omitted
      let baseUsername = (username && username.trim()) 
        ? username.trim().toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '')
        : cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '');
      
      if (!baseUsername || baseUsername.length < 2) {
        baseUsername = `user_${Date.now().toString(36)}`;
      }

      // Check if email already registered and verified
      const emailScan = await docClient.send(new ScanCommand({
        TableName: USERS_TABLE,
        FilterExpression: 'email = :em',
        ExpressionAttributeValues: { ':em': cleanEmail }
      }));

      if (emailScan.Items && emailScan.Items.length > 0) {
        const existingEmailUser = emailScan.Items[0];
        if (existingEmailUser.isVerified) {
          return jsonResponse(400, { success: false, error: 'This email is already registered. Please sign in or reset your password.' });
        }
        // If unverified, reuse this username
        baseUsername = existingEmailUser.username;
      } else {
        // Ensure unique username
        let cleanUsername = baseUsername;
        let counter = 1;
        while (true) {
          const uRes = await docClient.send(new GetCommand({
            TableName: USERS_TABLE,
            Key: { username: cleanUsername }
          }));
          if (!uRes.Item || !uRes.Item.isVerified) {
            break;
          }
          cleanUsername = `${baseUsername}${counter++}`;
        }
        baseUsername = cleanUsername;
      }

      const clientKey = getClientIdentifier(event, body);
      const now = Math.floor(Date.now() / 1000);

      // Check Rate Limits: Email (10 per 12h) and Client Machine ID (10 per 12h)
      const emailRate = await checkRateLimit(`rate#email#${cleanEmail}`, 10, 12);
      if (!emailRate.allowed) {
        return jsonResponse(429, { success: false, error: emailRate.error });
      }

      const clientRate = await checkRateLimit(`rate#client#${clientKey}`, 10, 12);
      if (!clientRate.allowed) {
        return jsonResponse(429, { success: false, error: clientRate.error });
      }

      const { hash, salt } = hashPassword(password);
      const otpCode = generateNumericOTP(6);

      const newUser = {
        username: baseUsername,
        email: cleanEmail,
        displayName: displayName ? displayName.trim() : baseUsername,
        passwordHash: hash,
        salt,
        isVerified: false,
        verificationCode: otpCode,
        verificationCodeExpiresAt: now + (15 * 60),
        createdAt: now
      };

      await docClient.send(new PutCommand({
        TableName: USERS_TABLE,
        Item: newUser
      }));

      // Send Verification Email via Resend
      await sendVerificationEmail(cleanEmail, otpCode, newUser.username, 'verification');
      return jsonResponse(200, {
        success: true,
        requiresVerification: true,
        username: baseUsername,
        email: cleanEmail,
        message: `Verification code sent to ${cleanEmail}.`
      });
    }

    // 2. Verify Email OTP Code
    if (path === '/api/auth/verify-email' && httpMethod === 'POST') {
      const { username, email, code } = body;
      const target = (username || email || '').trim().toLowerCase();
      if (!target || !code) {
        return jsonResponse(400, { success: false, error: 'Email/Username and 6-digit verification code are required.' });
      }

      const cleanCode = code.trim();
      const now = Math.floor(Date.now() / 1000);

      let user = null;
      const res = await docClient.send(new GetCommand({
        TableName: USERS_TABLE,
        Key: { username: target }
      }));
      if (res.Item) {
        user = res.Item;
      } else {
        const scanRes = await docClient.send(new ScanCommand({
          TableName: USERS_TABLE,
          FilterExpression: 'email = :em',
          ExpressionAttributeValues: { ':em': target }
        }));
        if (scanRes.Items && scanRes.Items.length > 0) {
          user = scanRes.Items[0];
        }
      }

      if (!user) {
        return jsonResponse(404, { success: false, error: 'User account not found.' });
      }

      if (user.isVerified) {
        const token = generateUserToken(user);
        return jsonResponse(200, { success: true, message: 'Account is already verified.', token, user: { username: user.username, displayName: user.displayName } });
      }

      if (!user.verificationCode || user.verificationCode !== cleanCode) {
        return jsonResponse(400, { success: false, error: 'Invalid verification code. Please check your email.' });
      }

      if (user.verificationCodeExpiresAt && user.verificationCodeExpiresAt < now) {
        return jsonResponse(400, { success: false, error: 'Verification code has expired. Please request a new one.' });
      }

      // Activate user account
      const updatedUser = {
        ...user,
        isVerified: true,
        verificationCode: null,
        verificationCodeExpiresAt: null,
        verifiedAt: now
      };

      await docClient.send(new PutCommand({
        TableName: USERS_TABLE,
        Item: updatedUser
      }));

      const token = generateUserToken(updatedUser);
      return jsonResponse(200, {
        success: true,
        message: 'Account verified successfully!',
        token,
        user: { username: updatedUser.username, displayName: updatedUser.displayName, isVerified: true }
      });
    }

    // 3. Resend Verification Code (Rate-limited to 10 per 12 hours)
    if (path === '/api/auth/resend-code' && httpMethod === 'POST') {
      const { username, email } = body;
      const target = (username || email || '').trim().toLowerCase();
      if (!target) {
        return jsonResponse(400, { success: false, error: 'Email or username is required.' });
      }

      let user = null;
      const res = await docClient.send(new GetCommand({
        TableName: USERS_TABLE,
        Key: { username: target }
      }));
      if (res.Item) {
        user = res.Item;
      } else {
        const scanRes = await docClient.send(new ScanCommand({
          TableName: USERS_TABLE,
          FilterExpression: 'email = :em',
          ExpressionAttributeValues: { ':em': target }
        }));
        if (scanRes.Items && scanRes.Items.length > 0) {
          user = scanRes.Items[0];
        }
      }

      if (!user) return jsonResponse(404, { success: false, error: 'User not found.' });
      if (user.isVerified) return jsonResponse(400, { success: false, error: 'User is already verified.' });
      if (!user.email) return jsonResponse(400, { success: false, error: 'No email associated with this account.' });

      const clientKey = getClientIdentifier(event, body);
      const emailRate = await checkRateLimit(`rate#email#${user.email}`, 10, 12);
      if (!emailRate.allowed) return jsonResponse(429, { success: false, error: emailRate.error });

      const clientRate = await checkRateLimit(`rate#client#${clientKey}`, 10, 12);
      if (!clientRate.allowed) return jsonResponse(429, { success: false, error: clientRate.error });

      const now = Math.floor(Date.now() / 1000);
      const newOtp = generateNumericOTP(6);

      await docClient.send(new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { username: user.username },
        UpdateExpression: 'SET verificationCode = :c, verificationCodeExpiresAt = :exp',
        ExpressionAttributeValues: {
          ':c': newOtp,
          ':exp': now + (15 * 60)
        }
      }));

      await sendVerificationEmail(user.email, newOtp, user.username, 'verification');

      return jsonResponse(200, {
        success: true,
        message: `New verification code sent to ${user.email}. (${emailRate.remaining} attempts remaining in 12h window)`
      });
    }

    // 4. Login (Supports Email OR Username + Password)
    if (path === '/api/auth/login' && httpMethod === 'POST') {
      const { username, email, identifier, password } = body;
      const target = (username || email || identifier || '').trim().toLowerCase();
      if (!target || !password) {
        return jsonResponse(400, { success: false, error: 'Email/Username and password are required.' });
      }

      let user = null;
      // Direct username lookup
      const res = await docClient.send(new GetCommand({
        TableName: USERS_TABLE,
        Key: { username: target }
      }));
      if (res.Item) {
        user = res.Item;
      } else {
        // Lookup by email
        const scanRes = await docClient.send(new ScanCommand({
          TableName: USERS_TABLE,
          FilterExpression: 'email = :em',
          ExpressionAttributeValues: { ':em': target }
        }));
        if (scanRes.Items && scanRes.Items.length > 0) {
          user = scanRes.Items[0];
        }
      }

      if (!user) {
        return jsonResponse(401, { success: false, error: 'Invalid email/username or password.' });
      }

      const isValid = verifyPassword(password, user.passwordHash, user.salt);
      if (!isValid) {
        return jsonResponse(401, { success: false, error: 'Invalid email/username or password.' });
      }

      if (user.email && user.isVerified === false) {
        return jsonResponse(403, {
          success: false,
          requiresVerification: true,
          email: user.email,
          username: user.username,
          error: 'Please verify your email address to log in.'
        });
      }

      const token = generateUserToken(user);
      return jsonResponse(200, {
        success: true,
        token,
        user: { username: user.username, displayName: user.displayName || user.username }
      });
    }

    // 5. Auth Me
    if (path === '/api/auth/me' && httpMethod === 'GET') {
      if (!authUser) {
        return jsonResponse(401, { success: false, error: 'Not authenticated.' });
      }

      const res = await docClient.send(new GetCommand({
        TableName: USERS_TABLE,
        Key: { username: authUser.username }
      }));

      const user = res.Item;
      if (!user) {
        return jsonResponse(200, { success: true, user: { username: authUser.username, displayName: authUser.displayName } });
      }

      return jsonResponse(200, {
        success: true,
        user: {
          username: user.username,
          displayName: user.displayName || user.username,
          email: user.email,
          isVerified: !!user.isVerified,
          createdAt: user.createdAt
        }
      });
    }

    // 6. Forgot Password (Sends OTP to Email)
    if (path === '/api/auth/forgot-password' && httpMethod === 'POST') {
      const { usernameOrEmail } = body;
      if (!usernameOrEmail) {
        return jsonResponse(400, { success: false, error: 'Username or email address is required.' });
      }

      const input = usernameOrEmail.trim().toLowerCase();
      let targetUser = null;

      if (input.includes('@')) {
        const scanRes = await docClient.send(new ScanCommand({
          TableName: USERS_TABLE,
          FilterExpression: 'email = :em',
          ExpressionAttributeValues: { ':em': input }
        }));
        targetUser = scanRes.Items?.[0];
      } else {
        const getRes = await docClient.send(new GetCommand({
          TableName: USERS_TABLE,
          Key: { username: input }
        }));
        targetUser = getRes.Item;
      }

      if (!targetUser || !targetUser.email) {
        // Return generic success to prevent email enumeration
        return jsonResponse(200, { success: true, message: 'If an account exists, a password reset code was sent.' });
      }

      const clientKey = getClientIdentifier(event, body);
      const emailRate = await checkRateLimit(`rate#email#${targetUser.email}`, 10, 12);
      if (!emailRate.allowed) return jsonResponse(429, { success: false, error: emailRate.error });

      const clientRate = await checkRateLimit(`rate#client#${clientKey}`, 10, 12);
      if (!clientRate.allowed) return jsonResponse(429, { success: false, error: clientRate.error });

      const now = Math.floor(Date.now() / 1000);
      const resetOtp = generateNumericOTP(6);

      await docClient.send(new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { username: targetUser.username },
        UpdateExpression: 'SET resetCode = :c, resetCodeExpiresAt = :exp',
        ExpressionAttributeValues: {
          ':c': resetOtp,
          ':exp': now + (15 * 60)
        }
      }));

      await sendVerificationEmail(targetUser.email, resetOtp, targetUser.username, 'reset');

      return jsonResponse(200, {
        success: true,
        username: targetUser.username,
        message: 'Password reset code sent to your email.'
      });
    }

    // 7. Reset Password with OTP
    if (path === '/api/auth/reset-password' && httpMethod === 'POST') {
      const { username, code, newPassword } = body;
      if (!username || !code || !newPassword || newPassword.length < 3) {
        return jsonResponse(400, { success: false, error: 'Username, 6-digit code, and new password are required.' });
      }

      const cleanUsername = username.trim().toLowerCase();
      const now = Math.floor(Date.now() / 1000);

      const res = await docClient.send(new GetCommand({
        TableName: USERS_TABLE,
        Key: { username: cleanUsername }
      }));

      const user = res.Item;
      if (!user) return jsonResponse(404, { success: false, error: 'User not found.' });

      if (!user.resetCode || user.resetCode !== code.trim()) {
        return jsonResponse(400, { success: false, error: 'Invalid password reset code.' });
      }

      if (user.resetCodeExpiresAt && user.resetCodeExpiresAt < now) {
        return jsonResponse(400, { success: false, error: 'Password reset code has expired. Please request a new one.' });
      }

      const { hash, salt } = hashPassword(newPassword);

      await docClient.send(new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { username: cleanUsername },
        UpdateExpression: 'SET passwordHash = :h, salt = :s, resetCode = :null, resetCodeExpiresAt = :null',
        ExpressionAttributeValues: {
          ':h': hash,
          ':s': salt,
          ':null': null
        }
      }));

      return jsonResponse(200, {
        success: true,
        message: 'Password has been reset successfully! You can now log in with your new password.'
      });
    }

    // === SEASONS ENDPOINTS (STRICTLY USER ISOLATED & AUTH REQUIRED) ===
    if (path === '/api/seasons' && httpMethod === 'GET') {
      if (!authUser || !authUser.username) {
        // Unauthenticated users have no private seasons
        return jsonResponse(200, { success: true, seasons: [] });
      }

      const targetUser = authUser.username.toLowerCase();
      const result = await docClient.send(new ScanCommand({ TableName: SEASONS_TABLE }));
      
      const userSeasons = (result.Items || [])
        .filter(s => (s.ownerUsername || '').toLowerCase() === targetUser)
        .map(s => ({
          ...s,
          isArchived: !!s.isArchived,
          totalPoolCount: s.pool?.length || 0,
          usedProblemCount: Object.keys(s.usedProblems || {}).length,
          remainingProblemCount: (s.pool?.length || 0) - Object.keys(s.usedProblems || {}).length
        }))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      return jsonResponse(200, { success: true, seasons: userSeasons });
    }

    if (path === '/api/seasons' && httpMethod === 'POST') {
      if (!authUser || !authUser.username) {
        return jsonResponse(401, {
          success: false,
          error: 'Authentication required. Please log in or create an account to create seasons and track non-repeating problem pools.'
        });
      }

      const { title, description, pool = PROBLEM_CATALOG } = body;
      if (!title || !title.trim()) {
        return jsonResponse(400, { success: false, error: 'Season title is required.' });
      }

      const owner = authUser.username.toLowerCase();
      const seasonId = `season_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const newSeason = {
        id: seasonId,
        ownerUsername: owner,
        title: title.trim(),
        description: (description || '').trim(),
        pool: pool && pool.length > 0 ? pool : PROBLEM_CATALOG,
        usedProblems: {},
        contestIds: [],
        isArchived: false,
        createdAt: Math.floor(Date.now() / 1000)
      };

      await docClient.send(new PutCommand({
        TableName: SEASONS_TABLE,
        Item: newSeason
      }));

      return jsonResponse(200, { success: true, season: newSeason });
    }

    // Archive Season (Owner Only)
    const seasonArchiveMatch = path.match(/^\/api\/seasons\/([a-zA-Z0-9_-]+)\/archive$/);
    if (seasonArchiveMatch && httpMethod === 'POST') {
      if (!authUser || !authUser.username) {
        return jsonResponse(401, { success: false, error: 'Authentication required.' });
      }
      const seasonId = seasonArchiveMatch[1];
      const sRes = await docClient.send(new GetCommand({ TableName: SEASONS_TABLE, Key: { id: seasonId } }));
      if (!sRes.Item) return jsonResponse(404, { success: false, error: 'Season not found.' });

      if ((sRes.Item.ownerUsername || '').toLowerCase() !== authUser.username.toLowerCase()) {
        return jsonResponse(403, { success: false, error: 'Access denied. You do not own this season.' });
      }

      await docClient.send(new UpdateCommand({
        TableName: SEASONS_TABLE,
        Key: { id: seasonId },
        UpdateExpression: 'SET isArchived = :a',
        ExpressionAttributeValues: { ':a': true }
      }));
      return jsonResponse(200, { success: true, message: 'Season archived successfully' });
    }

    // Unarchive / Restore Season (Owner Only)
    const seasonUnarchiveMatch = path.match(/^\/api\/seasons\/([a-zA-Z0-9_-]+)\/unarchive$/);
    if (seasonUnarchiveMatch && httpMethod === 'POST') {
      if (!authUser || !authUser.username) {
        return jsonResponse(401, { success: false, error: 'Authentication required.' });
      }
      const seasonId = seasonUnarchiveMatch[1];
      const sRes = await docClient.send(new GetCommand({ TableName: SEASONS_TABLE, Key: { id: seasonId } }));
      if (!sRes.Item) return jsonResponse(404, { success: false, error: 'Season not found.' });

      if ((sRes.Item.ownerUsername || '').toLowerCase() !== authUser.username.toLowerCase()) {
        return jsonResponse(403, { success: false, error: 'Access denied. You do not own this season.' });
      }

      await docClient.send(new UpdateCommand({
        TableName: SEASONS_TABLE,
        Key: { id: seasonId },
        UpdateExpression: 'SET isArchived = :a',
        ExpressionAttributeValues: { ':a': false }
      }));
      return jsonResponse(200, { success: true, message: 'Season restored successfully' });
    }

    // Import Problem List Endpoint
    if (path === '/api/problems/import-list' && httpMethod === 'POST') {
      const { input, listUrl } = body;
      const target = listUrl || input;
      const questions = await resolveListOrUrls(target);
      return jsonResponse(200, { success: true, count: questions.length, problems: questions });
    }

    // Season Detail & Rounds (Owner Only)
    const seasonMatch = path.match(/^\/api\/seasons\/([a-zA-Z0-9_-]+)$/);
    if (seasonMatch && httpMethod === 'GET') {
      const seasonId = seasonMatch[1];
      const res = await docClient.send(new GetCommand({
        TableName: SEASONS_TABLE,
        Key: { id: seasonId }
      }));

      if (!res.Item) {
        return jsonResponse(404, { success: false, error: 'Season not found' });
      }

      const season = res.Item;
      if (season.ownerUsername && (!authUser || (season.ownerUsername || '').toLowerCase() !== authUser.username.toLowerCase())) {
        return jsonResponse(403, { success: false, error: 'Access denied. This season belongs to another user.' });
      }

      const usedSlugs = Object.keys(season.usedProblems || {});
      const remainingPool = (season.pool || []).filter(p => !usedSlugs.includes(p.titleSlug.toLowerCase()));

      return jsonResponse(200, {
        success: true,
        season: {
          ...season,
          totalPoolCount: season.pool?.length || 0,
          usedProblemCount: usedSlugs.length,
          remainingProblemCount: remainingPool.length,
          usedSlugs
        }
      });
    }

    // Add Problems to Season Pool (Owner Only, with automatic deduplication)
    const seasonAddProblemsMatch = path.match(/^\/api\/seasons\/([a-zA-Z0-9_-]+)\/add-problems$/);
    if (seasonAddProblemsMatch && httpMethod === 'POST') {
      if (!authUser || !authUser.username) {
        return jsonResponse(401, { success: false, error: 'Authentication required.' });
      }
      const seasonId = seasonAddProblemsMatch[1];
      const res = await docClient.send(new GetCommand({
        TableName: SEASONS_TABLE,
        Key: { id: seasonId }
      }));

      if (!res.Item) {
        return jsonResponse(404, { success: false, error: 'Season not found' });
      }

      const season = res.Item;
      const isOwner = (season.ownerUsername || '').toLowerCase() === authUser.username.toLowerCase() || isSuperAdmin(authUser);
      if (!isOwner) {
        return jsonResponse(403, { success: false, error: 'Access denied. You do not own this season.' });
      }

      const { problems = [], input } = body;
      let newProblems = [...problems];

      if (input && typeof input === 'string') {
        const resolved = await resolveListOrUrls(input);
        newProblems = [...newProblems, ...resolved];
      }

      // Deduplicate against existing pool and within newProblems by titleSlug
      const existingSlugs = new Set((season.pool || []).map(p => (p.titleSlug || '').toLowerCase().trim()));
      const addedProblems = [];
      let skippedCount = 0;

      for (const prob of newProblems) {
        if (!prob || !prob.titleSlug) continue;
        const slugLower = prob.titleSlug.toLowerCase().trim();
        if (existingSlugs.has(slugLower)) {
          skippedCount++;
        } else {
          existingSlugs.add(slugLower);
          addedProblems.push({
            frontendId: String(prob.frontendId || prob.questionFrontendId || ''),
            title: prob.title || prob.titleSlug,
            titleSlug: prob.titleSlug,
            difficulty: prob.difficulty ? (prob.difficulty.charAt(0).toUpperCase() + prob.difficulty.slice(1).toLowerCase()) : 'Medium',
            topicTags: prob.topicTags || []
          });
        }
      }

      const updatedPool = [...(season.pool || []), ...addedProblems];

      await docClient.send(new UpdateCommand({
        TableName: SEASONS_TABLE,
        Key: { id: seasonId },
        UpdateExpression: 'SET #p = :pool',
        ExpressionAttributeNames: { '#p': 'pool' },
        ExpressionAttributeValues: { ':pool': updatedPool }
      }));

      return jsonResponse(200, {
        success: true,
        message: `Successfully added ${addedProblems.length} new problem(s) to season pool (${skippedCount} duplicate(s) skipped).`,
        addedCount: addedProblems.length,
        skippedCount,
        totalPoolCount: updatedPool.length,
        season: {
          ...season,
          pool: updatedPool,
          totalPoolCount: updatedPool.length
        }
      });
    }

    // Generate Round from Season Pool (Owner Only)
    const seasonRoundMatch = path.match(/^\/api\/seasons\/([a-zA-Z0-9_-]+)\/generate-round$/);
    if (seasonRoundMatch && httpMethod === 'POST') {
      if (!authUser || !authUser.username) {
        return jsonResponse(401, { success: false, error: 'Authentication required.' });
      }
      const seasonId = seasonRoundMatch[1];
      const res = await docClient.send(new GetCommand({
        TableName: SEASONS_TABLE,
        Key: { id: seasonId }
      }));

      if (!res.Item) {
        return jsonResponse(404, { success: false, error: 'Season not found' });
      }

      const season = res.Item;
      if ((season.ownerUsername || '').toLowerCase() !== authUser.username.toLowerCase()) {
        return jsonResponse(403, { success: false, error: 'Access denied. You do not own this season.' });
      }

      const usedSlugs = Object.keys(season.usedProblems || {});
      const { countEasy, countMedium, countHard, countTotal = 6 } = body;

      const generated = generateRandomRoundFromPool({
        pool: season.pool || PROBLEM_CATALOG,
        usedSlugs,
        countEasy,
        countMedium,
        countHard,
        countTotal
      });

      return jsonResponse(200, { success: true, ...generated });
    }

    // === CONTESTS ENDPOINTS ===
    if (path === '/api/contests' && httpMethod === 'GET') {
      const now = Math.floor(Date.now() / 1000);
      const result = await docClient.send(new ScanCommand({ TableName: CONTESTS_TABLE }));
      
      const allItems = result.Items || [];
      const contests = [];

      for (const c of allItems) {
        let currentStatus = c.status || 'WAITING';
        let currentStartTime = c.startTime;
        let currentEndTime = c.endTime;

        // Auto-start prescheduled contests if scheduled start time has arrived
        if (currentStatus === 'WAITING' && c.scheduledStartTime && now >= c.scheduledStartTime) {
          currentStatus = 'IN_PROGRESS';
          currentStartTime = c.scheduledStartTime;
          currentEndTime = c.scheduledStartTime + ((c.durationMinutes || 60) * 60);

          if (now >= currentEndTime) {
            currentStatus = 'FINISHED';
          }

          docClient.send(new UpdateCommand({
            TableName: CONTESTS_TABLE,
            Key: { id: c.id },
            UpdateExpression: 'SET #st = :status, startTime = :start, endTime = :end',
            ExpressionAttributeNames: { '#st': 'status' },
            ExpressionAttributeValues: {
              ':status': currentStatus,
              ':start': currentStartTime,
              ':end': currentEndTime
            }
          })).catch(() => {});
        } else if (currentStatus === 'IN_PROGRESS' && currentEndTime && now >= currentEndTime) {
          // Auto-transition to FINISHED if contest time has expired
          currentStatus = 'FINISHED';
          docClient.send(new UpdateCommand({
            TableName: CONTESTS_TABLE,
            Key: { id: c.id },
            UpdateExpression: 'SET #st = :fin',
            ExpressionAttributeNames: { '#st': 'status' },
            ExpressionAttributeValues: { ':fin': 'FINISHED' }
          })).catch(() => {});
        }

        // Check if contest is active (WAITING within last 48h, or IN_PROGRESS with time remaining)
        const isWaiting = currentStatus === 'WAITING' && (now - (c.createdAt || now)) < (48 * 3600);
        const isInProgress = currentStatus === 'IN_PROGRESS' && (!c.endTime || now < c.endTime);
        const isActive = isWaiting || isInProgress;

        const isOrganizer = authUser && (
          authUser.username.toLowerCase() === (c.ownerUsername || '').toLowerCase() ||
          authUser.username.toLowerCase() === (c.hostUsername || '').toLowerCase()
        );
        const contestEntry = {
          id: c.id,
          code: c.code,
          title: c.title,
          seasonId: c.seasonId,
          seasonTitle: c.seasonTitle,
          seasonRound: c.seasonRound,
          ownerUsername: c.ownerUsername,
          isPrivate: !!c.password,
          password: isOrganizer ? (c.password || '') : (c.password ? '••••••••' : ''),
          isOrganizer: !!isOrganizer,
          durationMinutes: c.durationMinutes,
          status: currentStatus,
          startTime: c.startTime,
          endTime: c.endTime,
          scheduledStartTime: c.scheduledStartTime || null,
          timezone: c.timezone || null,
          isActive,
          hostUsername: c.hostUsername || c.ownerUsername,
          problemCount: c.problems?.length || 0,
          participantCount: c.participants?.length || 0,
          createdAt: c.createdAt
        };

        // Filter: If activeOnly requested (default), only return active ongoing lobbies
        if (queryParams.activeOnly === 'false' || queryParams.all === 'true') {
          contests.push(contestEntry);
        } else if (isActive) {
          contests.push(contestEntry);
        }
      }

      contests.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      return jsonResponse(200, { success: true, count: contests.length, contests });
    }

    if (path === '/api/contests' && httpMethod === 'POST') {
      const {
        title,
        seasonId,
        durationMinutes = 60,
        countEasy = 1,
        countMedium = 2,
        countHard = 1,
        hostUsername = authUser?.username || 'Host',
        password = '',
        problems = [],
        scheduledStartTime = null,
        timezone = 'UTC'
      } = body;

      let selectedProblems = problems;
      let seasonInfo = null;

      if (seasonId) {
        const sRes = await docClient.send(new GetCommand({
          TableName: SEASONS_TABLE,
          Key: { id: seasonId }
        }));
        if (!sRes.Item) {
          return jsonResponse(404, { success: false, error: 'Selected season not found.' });
        }
        seasonInfo = sRes.Item;

        if (seasonInfo.ownerUsername && (!authUser || (seasonInfo.ownerUsername || '').toLowerCase() !== authUser.username.toLowerCase())) {
          return jsonResponse(403, { success: false, error: 'Access denied. You cannot launch rounds from another user\'s private season.' });
        }

        if (!selectedProblems || selectedProblems.length === 0) {
          const usedSlugs = Object.keys(seasonInfo.usedProblems || {});
          const gen = generateRandomRoundFromPool({
            pool: seasonInfo.pool || PROBLEM_CATALOG,
            usedSlugs,
            countEasy: Number(countEasy) || 1,
            countMedium: Number(countMedium) || 2,
            countHard: Number(countHard) || 1,
            countTotal: (Number(countEasy) || 1) + (Number(countMedium) || 2) + (Number(countHard) || 1)
          });
          selectedProblems = gen.problems;
        }
      }

      if (!selectedProblems || selectedProblems.length === 0) {
        const easy = PROBLEM_CATALOG.filter(p => p.difficulty === 'Easy').sort(() => 0.5 - Math.random()).slice(0, Number(countEasy) || 1);
        const med = PROBLEM_CATALOG.filter(p => p.difficulty === 'Medium').sort(() => 0.5 - Math.random()).slice(0, Number(countMedium) || 2);
        const hard = PROBLEM_CATALOG.filter(p => p.difficulty === 'Hard').sort(() => 0.5 - Math.random()).slice(0, Number(countHard) || 1);
        selectedProblems = [...easy, ...med, ...hard].map((p, idx) => ({ ...p, points: (idx + 1) * 100 }));
      }

      const contestCode = generateCode(5);
      const contestId = `contest_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const now = Math.floor(Date.now() / 1000);

      // Auto-generate organized title if omitted
      const nowObj = scheduledStartTime ? new Date(Number(scheduledStartTime) * 1000) : new Date();
      const dateStr = nowObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const timeStr = nowObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      
      let finalTitle = (title && title.trim()) ? title.trim() : null;
      if (!finalTitle) {
        if (seasonInfo) {
          const roundNum = (seasonInfo.contestIds?.length || 0) + 1;
          finalTitle = `${seasonInfo.title} — Round #${roundNum}`;
        } else if (scheduledStartTime) {
          finalTitle = `LeetCompete Scheduled • ${dateStr}, ${timeStr} (${timezone || 'UTC'})`;
        } else {
          finalTitle = `LeetCompete Match • ${dateStr}, ${timeStr} UTC`;
        }
      }

      const newContest = {
        id: contestId,
        code: contestCode,
        title: finalTitle,
        seasonId: seasonId || null,
        seasonTitle: seasonInfo ? seasonInfo.title : null,
        seasonRound: seasonInfo ? (seasonInfo.contestIds?.length || 0) + 1 : null,
        ownerUsername: authUser?.username || hostUsername.toLowerCase(),
        hostUsername: hostUsername.trim(),
        password: (password || '').trim(),
        isPrivate: !!(password && password.trim()),
        durationMinutes: Number(durationMinutes) || 60,
        status: 'WAITING',
        startTime: null,
        endTime: null,
        scheduledStartTime: scheduledStartTime ? Number(scheduledStartTime) : null,
        timezone: timezone || 'UTC',
        problems: selectedProblems.map(p => ({
          ...p,
          points: p.points || (p.difficulty === 'Easy' ? 100 : p.difficulty === 'Hard' ? 300 : 200)
        })),
        participants: [],
        createdAt: now
      };

      await docClient.send(new PutCommand({
        TableName: CONTESTS_TABLE,
        Item: newContest
      }));

      // If tied to a season, update season's usedProblems map & contestIds list
      if (seasonId && seasonInfo) {
        const roundNum = (seasonInfo.contestIds?.length || 0) + 1;
        const updatedUsed = { ...(seasonInfo.usedProblems || {}) };
        selectedProblems.forEach(p => {
          if (p.titleSlug) {
            updatedUsed[p.titleSlug.toLowerCase()] = {
              round: roundNum,
              contestCode,
              usedAt: now
            };
          }
        });
        const updatedContestIds = [...(seasonInfo.contestIds || []), contestId];

        await docClient.send(new UpdateCommand({
          TableName: SEASONS_TABLE,
          Key: { id: seasonId },
          UpdateExpression: 'SET usedProblems = :u, contestIds = :c',
          ExpressionAttributeValues: {
            ':u': updatedUsed,
            ':c': updatedContestIds
          }
        }));
      }

      return jsonResponse(200, { success: true, contest: newContest });
    }

    // Get Contest by ID or Code
    const contestMatch = path.match(/^\/api\/contests\/([a-zA-Z0-9_-]+)$/);
    if (contestMatch && httpMethod === 'GET') {
      const codeOrId = contestMatch[1];
      const contest = await resolveContest(codeOrId);

      if (!contest) {
        return jsonResponse(404, { success: false, error: 'Contest lobby not found.' });
      }

      const subRes = await docClient.send(new QueryCommand({
        TableName: SUBMISSIONS_TABLE,
        KeyConditionExpression: 'contestId = :cId',
        ExpressionAttributeValues: { ':cId': contest.id }
      }));
      const submissions = subRes.Items || [];

      const userMap = {};
      const hostLower = (contest.hostUsername || '').toLowerCase();
      const ownerLower = (contest.ownerUsername || '').toLowerCase();

      (contest.participants || []).forEach(p => {
        const pLower = (p.username || '').toLowerCase();
        // Skip unjoined host/organizer placeholder with 0 score
        if ((pLower === hostLower || pLower === ownerLower) && p.joinedAt === contest.createdAt) {
          return;
        }

        userMap[p.username] = {
          username: p.username,
          displayName: p.displayName || p.username,
          totalScore: 0,
          solvedCount: 0,
          totalPenalty: 0,
          solves: [],
          problemStatus: {}
        };
      });

      submissions.forEach(sub => {
        if (!userMap[sub.username]) {
          userMap[sub.username] = {
            username: sub.username,
            displayName: sub.username,
            totalScore: 0,
            solvedCount: 0,
            totalPenalty: 0,
            solves: [],
            problemStatus: {}
          };
        }
        const u = userMap[sub.username];
        if (!u.problemStatus[sub.problemSlug]) {
          u.totalScore += (sub.points || 100);
          u.solvedCount += 1;
          u.totalPenalty += (sub.penaltyMinutes || 0);
          u.solves.push(sub);
          u.problemStatus[sub.problemSlug] = {
            solved: true,
            penaltyMinutes: sub.penaltyMinutes,
            points: sub.points
          };
        }
      });

      const leaderboard = Object.values(userMap).sort((a, b) => {
        if (b.solvedCount !== a.solvedCount) return b.solvedCount - a.solvedCount;
        if (a.totalPenalty !== b.totalPenalty) return a.totalPenalty - b.totalPenalty;
        return b.totalScore - a.totalScore;
      }).map((u, idx) => ({
        rank: idx + 1,
        ...u
      }));

      const isOrganizer = isUserOrganizer(authUser, contest);

      // Hide problems from competitors if contest is still WAITING
      let sanitizedProblems = contest.problems || [];
      if (contest.status === 'WAITING' && !isOrganizer) {
        sanitizedProblems = [];
      }

      return jsonResponse(200, {
        success: true,
        contest: {
          ...contest,
          problems: sanitizedProblems,
          isPrivate: !!contest.password,
          password: isOrganizer ? (contest.password || '') : (contest.password ? '••••••••' : ''),
          isOrganizer: !!isOrganizer,
          leaderboard,
          submissions
        }
      });
    }

    // Join Contest
    const joinMatch = path.match(/^\/api\/contests\/([a-zA-Z0-9_-]+)\/join$/);
    if (joinMatch && httpMethod === 'POST') {
      const codeOrId = joinMatch[1];
      const { username, displayName, password } = body;

      if (!username || !username.trim()) {
        return jsonResponse(400, { success: false, error: 'LeetCode username is required.' });
      }

      const contest = await resolveContest(codeOrId);
      if (!contest) {
        return jsonResponse(404, { success: false, error: 'Contest not found.' });
      }

      if (contest.password && contest.password !== (password || '').trim()) {
        return jsonResponse(403, { success: false, error: 'Incorrect contest password for private lobby.' });
      }

      const cleanUsername = username.trim().toLowerCase();
      const participants = contest.participants || [];
      if (!participants.some(p => p.username === cleanUsername)) {
        participants.push({
          username: cleanUsername,
          displayName: (displayName || username).trim(),
          joinedAt: Math.floor(Date.now() / 1000)
        });

        await docClient.send(new UpdateCommand({
          TableName: CONTESTS_TABLE,
          Key: { id: contest.id },
          UpdateExpression: 'SET participants = :p',
          ExpressionAttributeValues: { ':p': participants }
        }));
      }

      return jsonResponse(200, { success: true, message: 'Joined successfully', contest });
    }

    // Start Contest (Organizer / Admin only)
    const startMatch = path.match(/^\/api\/contests\/([a-zA-Z0-9_-]+)\/start$/);
    if (startMatch && httpMethod === 'POST') {
      const codeOrId = startMatch[1];
      const now = Math.floor(Date.now() / 1000);

      const contest = await resolveContest(codeOrId);
      if (!contest) return jsonResponse(404, { success: false, error: 'Contest not found' });

      if (!isUserOrganizer(authUser, contest)) {
        return jsonResponse(403, { success: false, error: 'Forbidden. Only the contest organizer can start this match.' });
      }

      const duration = contest.durationMinutes || 60;
      const startTime = now;
      const endTime = now + (duration * 60);

      await docClient.send(new UpdateCommand({
        TableName: CONTESTS_TABLE,
        Key: { id: contest.id },
        UpdateExpression: 'SET #st = :status, startTime = :start, endTime = :end',
        ExpressionAttributeNames: { '#st': 'status' },
        ExpressionAttributeValues: {
          ':status': 'IN_PROGRESS',
          ':start': startTime,
          ':end': endTime
        }
      }));

      return jsonResponse(200, {
        success: true,
        status: 'IN_PROGRESS',
        startTime,
        endTime,
        contest: { ...contest, status: 'IN_PROGRESS', startTime, endTime }
      });
    }

    // Finish Contest (Organizer / Admin only)
    const finishMatch = path.match(/^\/api\/contests\/([a-zA-Z0-9_-]+)\/finish$/);
    if (finishMatch && httpMethod === 'POST') {
      const codeOrId = finishMatch[1];
      const contest = await resolveContest(codeOrId);
      if (!contest) return jsonResponse(404, { success: false, error: 'Contest not found' });

      if (!isUserOrganizer(authUser, contest)) {
        return jsonResponse(403, { success: false, error: 'Forbidden. Only the contest organizer can end this match.' });
      }

      await docClient.send(new UpdateCommand({
        TableName: CONTESTS_TABLE,
        Key: { id: contest.id },
        UpdateExpression: 'SET #st = :status',
        ExpressionAttributeNames: { '#st': 'status' },
        ExpressionAttributeValues: {
          ':status': 'FINISHED'
        }
      }));

      return jsonResponse(200, { success: true, status: 'FINISHED' });
    }

    // Extend Contest Duration (Organizer / Admin only)
    const extendMatch = path.match(/^\/api\/contests\/([a-zA-Z0-9_-]+)\/extend$/);
    if (extendMatch && httpMethod === 'POST') {
      const codeOrId = extendMatch[1];
      const { minutes } = body;
      const extraMinutes = Number(minutes);

      if (!extraMinutes || extraMinutes <= 0 || extraMinutes > 180) {
        return jsonResponse(400, { success: false, error: 'Please specify a valid extra time in minutes (1 - 180).' });
      }

      const contest = await resolveContest(codeOrId);
      if (!contest) return jsonResponse(404, { success: false, error: 'Contest not found' });

      if (!isUserOrganizer(authUser, contest)) {
        return jsonResponse(403, { success: false, error: 'Forbidden. Only the contest organizer can extend match duration.' });
      }

      if (contest.status !== 'IN_PROGRESS') {
        return jsonResponse(400, { success: false, error: 'Contest must be active to extend duration.' });
      }

      const currentEnd = contest.endTime || (contest.startTime + (contest.durationMinutes * 60));
      const newEndTime = currentEnd + (extraMinutes * 60);
      const newExtendedMinutes = (contest.extendedMinutes || 0) + extraMinutes;
      const newDurationMinutes = (contest.durationMinutes || 60) + extraMinutes;

      await docClient.send(new UpdateCommand({
        TableName: CONTESTS_TABLE,
        Key: { id: contest.id },
        UpdateExpression: 'SET endTime = :end, extendedMinutes = :ext, durationMinutes = :dur',
        ExpressionAttributeValues: {
          ':end': newEndTime,
          ':ext': newExtendedMinutes,
          ':dur': newDurationMinutes
        }
      }));

      const updatedContest = {
        ...contest,
        endTime: newEndTime,
        extendedMinutes: newExtendedMinutes,
        durationMinutes: newDurationMinutes
      };

      return jsonResponse(200, {
        success: true,
        message: `Added +${extraMinutes} minutes to contest.`,
        endTime: newEndTime,
        extendedMinutes: newExtendedMinutes,
        contest: updatedContest
      });
    }

    // Verify Submission
    const verifyMatch = path.match(/^\/api\/contests\/([a-zA-Z0-9_-]+)\/verify$/);
    if (verifyMatch && httpMethod === 'POST') {
      const codeOrId = verifyMatch[1];
      const { username, problemSlug } = body;

      const contest = await resolveContest(codeOrId);
      if (!contest) return jsonResponse(404, { success: false, error: 'Contest not found.' });

      if (contest.status !== 'IN_PROGRESS') {
        return jsonResponse(400, { success: false, error: 'Contest is not active.' });
      }

      const problem = (contest.problems || []).find(p => p.titleSlug.toLowerCase() === problemSlug.toLowerCase());
      if (!problem) {
        return jsonResponse(400, { success: false, error: 'Problem not part of this contest.' });
      }

      const verification = await verifyUserSubmission(
        username,
        problemSlug,
        contest.startTime,
        contest.endTime
      );

      if (!verification.verified) {
        return jsonResponse(200, {
          success: false,
          verified: false,
          reason: verification.reason
        });
      }

      const solveTimeSeconds = Math.max(0, verification.submission.timestamp - contest.startTime);
      const penaltyMinutes = Math.floor(solveTimeSeconds / 60);
      const subId = `sub_${contest.id}_${username}_${problemSlug}`;

      const submissionItem = {
        contestId: contest.id,
        id: subId,
        username: username.trim().toLowerCase(),
        problemSlug,
        problemTitle: problem.title,
        points: problem.points || 100,
        submissionId: String(verification.submission.id),
        submissionTimestamp: verification.submission.timestamp,
        penaltyMinutes,
        verifiedAt: Math.floor(Date.now() / 1000)
      };

      await docClient.send(new PutCommand({
        TableName: SUBMISSIONS_TABLE,
        Item: submissionItem
      }));

      return jsonResponse(200, {
        success: true,
        verified: true,
        submission: submissionItem
      });
    }

    // Mock Submission
    const mockSubMatch = path.match(/^\/api\/contests\/([a-zA-Z0-9_-]+)\/mock-submission$/);
    if (mockSubMatch && httpMethod === 'POST') {
      const codeOrId = mockSubMatch[1];
      const { username, problemSlug, penaltyMinutes = 5, points = 100 } = body;

      const contest = await resolveContest(codeOrId);
      if (!contest) return jsonResponse(404, { success: false, error: 'Contest not found.' });

      const problem = (contest.problems || []).find(p => p.titleSlug.toLowerCase() === problemSlug.toLowerCase()) || { title: problemSlug, points };

      const subId = `sub_${contest.id}_${username}_${problemSlug}`;
      const submissionItem = {
        contestId: contest.id,
        id: subId,
        username: username.trim().toLowerCase(),
        problemSlug,
        problemTitle: problem.title,
        points: Number(points) || 100,
        submissionId: `mock_${Date.now()}`,
        submissionTimestamp: Math.floor(Date.now() / 1000),
        penaltyMinutes: Number(penaltyMinutes) || 0,
        verifiedAt: Math.floor(Date.now() / 1000)
      };

      await docClient.send(new PutCommand({
        TableName: SUBMISSIONS_TABLE,
        Item: submissionItem
      }));

      return jsonResponse(200, {
        success: true,
        verified: true,
        submission: submissionItem
      });
    }

    // Messages & Chat
    const msgMatch = path.match(/^\/api\/contests\/([a-zA-Z0-9_-]+)\/messages$/);
    if (msgMatch && httpMethod === 'GET') {
      const contestId = msgMatch[1];
      const res = await docClient.send(new QueryCommand({
        TableName: MESSAGES_TABLE,
        KeyConditionExpression: 'contestId = :cId',
        ExpressionAttributeValues: { ':cId': contestId }
      }));
      return jsonResponse(200, { success: true, messages: res.Items || [] });
    }

    if (msgMatch && httpMethod === 'POST') {
      const contestId = msgMatch[1];
      const { username, text } = body;
      if (!text || !text.trim()) {
        return jsonResponse(400, { success: false, error: 'Message text required' });
      }

      const newMsg = {
        contestId,
        createdAt: Math.floor(Date.now() / 1000),
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        username: (username || 'Anonymous').trim(),
        text: text.trim().slice(0, 500)
      };

      await docClient.send(new PutCommand({
        TableName: MESSAGES_TABLE,
        Item: newMsg
      }));

      return jsonResponse(200, { success: true, message: newMsg });
    }

    // Super Admin Analytics Dashboard
    if (path === '/api/admin/analytics' && httpMethod === 'GET') {
      if (!isSuperAdmin(authUser)) {
        return jsonResponse(403, { success: false, error: 'Forbidden. Superadmin privileges required.' });
      }

      const [usersRes, seasonsRes, contestsRes, subRes, msgRes] = await Promise.all([
        docClient.send(new ScanCommand({ TableName: USERS_TABLE })),
        docClient.send(new ScanCommand({ TableName: SEASONS_TABLE })),
        docClient.send(new ScanCommand({ TableName: CONTESTS_TABLE })),
        docClient.send(new ScanCommand({ TableName: SUBMISSIONS_TABLE })),
        docClient.send(new ScanCommand({ TableName: MESSAGES_TABLE }))
      ]);

      const allUsers = usersRes.Items || [];
      const allSeasons = seasonsRes.Items || [];
      const allContests = contestsRes.Items || [];
      const allSubmissions = subRes.Items || [];
      const allMessages = msgRes.Items || [];

      // Calculate organizer statistics
      const organizers = allUsers.map(u => {
        const uLower = (u.username || '').toLowerCase();
        const eLower = (u.email || '').toLowerCase();
        const userContests = allContests.filter(c => {
          const o = (c.ownerUsername || '').toLowerCase();
          const h = (c.hostUsername || '').toLowerCase();
          return o === uLower || h === uLower || o === eLower || h === eLower;
        });
        const userSeasons = allSeasons.filter(s => (s.ownerUsername || '').toLowerCase() === uLower);

        return {
          username: u.username,
          email: u.email || '—',
          displayName: u.displayName || u.username,
          isVerified: !!u.isVerified,
          role: (uLower === 'fahad00cms' || eLower === 'fahad00cms@gmail.com') ? 'superadmin' : (u.role || 'organizer'),
          createdAt: u.createdAt || null,
          contestsCount: userContests.length,
          seasonsCount: userSeasons.length
        };
      });

      // Calculate season statistics
      const seasons = allSeasons.map(s => ({
        id: s.id,
        title: s.title,
        ownerUsername: s.ownerUsername,
        poolCount: (s.pool || []).length,
        usedCount: Object.keys(s.usedProblems || {}).length,
        roundsCount: (s.contestIds || []).length,
        status: s.status || 'ACTIVE',
        createdAt: s.createdAt || null
      }));

      // Calculate contest statistics
      const contests = allContests.map(c => ({
        id: c.id,
        code: c.code,
        title: c.title,
        hostUsername: c.hostUsername,
        ownerUsername: c.ownerUsername,
        isPrivate: !!c.isPrivate,
        status: c.status,
        durationMinutes: c.durationMinutes || 60,
        extendedMinutes: c.extendedMinutes || 0,
        problemCount: (c.problems || []).length,
        participantCount: (c.participants || []).length,
        createdAt: c.createdAt || null
      }));

      return jsonResponse(200, {
        success: true,
        stats: {
          totalOrganizers: allUsers.length,
          verifiedOrganizers: allUsers.filter(u => u.isVerified).length,
          totalSeasons: allSeasons.length,
          totalContests: allContests.length,
          activeContests: allContests.filter(c => c.status === 'IN_PROGRESS' || c.status === 'WAITING').length,
          totalSubmissions: allSubmissions.length,
          totalMessages: allMessages.length
        },
        organizers,
        seasons,
        contests,
        recentSubmissions: allSubmissions.slice(-25).reverse()
      });
    }

    // Super Admin: Mark User Verified
    const verifyUserMatch = path.match(/^\/api\/admin\/users\/([a-zA-Z0-9_-]+)\/verify$/);
    if (verifyUserMatch && (httpMethod === 'POST' || httpMethod === 'PATCH')) {
      if (!isSuperAdmin(authUser)) {
        return jsonResponse(403, { success: false, error: 'Forbidden. Superadmin privileges required.' });
      }
      const targetUsername = verifyUserMatch[1];
      await docClient.send(new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { username: targetUsername },
        UpdateExpression: 'SET isVerified = :v, isEmailVerified = :ev, updatedAt = :now',
        ExpressionAttributeValues: {
          ':v': true,
          ':ev': true,
          ':now': Math.floor(Date.now() / 1000)
        }
      }));
      return jsonResponse(200, {
        success: true,
        message: `Organizer @${targetUsername} has been marked as verified.`
      });
    }

    // Super Admin: Hard Delete User & Cascade
    const deleteUserMatch = path.match(/^\/api\/admin\/users\/([a-zA-Z0-9_-]+)$/);
    if (deleteUserMatch && httpMethod === 'DELETE') {
      if (!isSuperAdmin(authUser)) {
        return jsonResponse(403, { success: false, error: 'Forbidden. Superadmin privileges required.' });
      }
      const targetUsername = deleteUserMatch[1];
      await deleteUserAndCascade(targetUsername);
      return jsonResponse(200, {
        success: true,
        message: `User @${targetUsername} and all associated seasons, contests, and submissions have been permanently deleted.`
      });
    }

    // Super Admin: Hard Delete Season & Cascade
    const deleteSeasonMatch = path.match(/^\/api\/admin\/seasons\/([a-zA-Z0-9_-]+)$/);
    if (deleteSeasonMatch && httpMethod === 'DELETE') {
      if (!isSuperAdmin(authUser)) {
        return jsonResponse(403, { success: false, error: 'Forbidden. Superadmin privileges required.' });
      }
      const targetSeasonId = deleteSeasonMatch[1];
      await deleteSeasonAndCascade(targetSeasonId);
      return jsonResponse(200, {
        success: true,
        message: `Season ${targetSeasonId} and all associated contests have been permanently deleted.`
      });
    }

    // Super Admin: Hard Delete Contest & Cascade
    const deleteContestMatch = path.match(/^\/api\/admin\/contests\/([a-zA-Z0-9_-]+)$/);
    if (deleteContestMatch && httpMethod === 'DELETE') {
      if (!isSuperAdmin(authUser)) {
        return jsonResponse(403, { success: false, error: 'Forbidden. Superadmin privileges required.' });
      }
      const targetContestId = deleteContestMatch[1];
      await deleteContestAndCascade(targetContestId);
      return jsonResponse(200, {
        success: true,
        message: `Contest ${targetContestId} and all associated submissions have been permanently deleted.`
      });
    }

    // Problem Catalog & Resolver
    if (path === '/api/problems/search' && httpMethod === 'GET') {
      const { query, difficulty, topic, limit } = queryParams;
      const results = searchCatalog({ query, difficulty, topic, limit: limit ? Number(limit) : 20 });
      return jsonResponse(200, { success: true, count: results.length, problems: results });
    }

    if (path === '/api/problems/resolve' && httpMethod === 'POST') {
      const { input } = body;
      const resolved = await resolveProblem(input);
      return jsonResponse(200, { success: true, problem: resolved });
    }

    // 404 Catch-All
    return jsonResponse(404, { success: false, error: `Route ${httpMethod} ${path} not found.` });

  } catch (err) {
    console.error('Unhandled Lambda Error:', err);
    return jsonResponse(500, {
      success: false,
      error: err.message || 'Internal Server Error'
    });
  }
};
