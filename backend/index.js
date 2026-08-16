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

const JWT_SECRET = process.env.JWT_SECRET || 'leetcompete_jwt_secret_key_2026_super_secure';

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

/**
 * Password Hashing & Verification using Node.js crypto
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
  const payload = {
    username: user.username.toLowerCase(),
    displayName: user.displayName || user.username,
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
    return payload;
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
    return { username: usernameHeader.trim().toLowerCase(), displayName: usernameHeader.trim() };
  }
  return null;
}

async function resolveContest(codeOrId) {
  if (!codeOrId) return null;
  const clean = codeOrId.trim();
  if (clean.length === 5) {
    const qRes = await docClient.send(new QueryCommand({
      TableName: CONTESTS_TABLE,
      IndexName: 'CodeIndex',
      KeyConditionExpression: 'code = :code',
      ExpressionAttributeValues: { ':code': clean.toUpperCase() }
    }));
    if (qRes.Items && qRes.Items[0]) return qRes.Items[0];
  }
  const getRes = await docClient.send(new GetCommand({
    TableName: CONTESTS_TABLE,
    Key: { id: clean }
  }));
  return getRes.Item || null;
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

    // === AUTHENTICATION ENDPOINTS ===
    if (path === '/api/auth/register' && httpMethod === 'POST') {
      const { username, password, displayName } = body;
      if (!username || !username.trim() || username.trim().length < 2) {
        return jsonResponse(400, { success: false, error: 'Username must be at least 2 characters.' });
      }
      if (!password || password.length < 3) {
        return jsonResponse(400, { success: false, error: 'Password must be at least 3 characters.' });
      }

      const cleanUsername = username.trim().toLowerCase();
      // Check if user already exists
      const existing = await docClient.send(new GetCommand({
        TableName: USERS_TABLE,
        Key: { username: cleanUsername }
      }));

      if (existing.Item) {
        return jsonResponse(400, { success: false, error: `Username "${cleanUsername}" is already taken.` });
      }

      const { hash, salt } = hashPassword(password);
      const newUser = {
        username: cleanUsername,
        displayName: (displayName || username).trim(),
        passwordHash: hash,
        salt,
        createdAt: Math.floor(Date.now() / 1000)
      };

      await docClient.send(new PutCommand({
        TableName: USERS_TABLE,
        Item: newUser
      }));

      const token = generateUserToken(newUser);
      return jsonResponse(200, {
        success: true,
        token,
        user: { username: newUser.username, displayName: newUser.displayName }
      });
    }

    if (path === '/api/auth/login' && httpMethod === 'POST') {
      const { username, password } = body;
      if (!username || !password) {
        return jsonResponse(400, { success: false, error: 'Username and password are required.' });
      }

      const cleanUsername = username.trim().toLowerCase();
      const res = await docClient.send(new GetCommand({
        TableName: USERS_TABLE,
        Key: { username: cleanUsername }
      }));

      const user = res.Item;
      if (!user) {
        return jsonResponse(401, { success: false, error: 'Invalid username or password.' });
      }

      const isValid = verifyPassword(password, user.passwordHash, user.salt);
      if (!isValid) {
        return jsonResponse(401, { success: false, error: 'Invalid username or password.' });
      }

      const token = generateUserToken(user);
      return jsonResponse(200, {
        success: true,
        token,
        user: { username: user.username, displayName: user.displayName || user.username }
      });
    }

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
          createdAt: user.createdAt
        }
      });
    }

    // === SEASONS ENDPOINTS (USER ISOLATED) ===
    if (path === '/api/seasons' && httpMethod === 'GET') {
      const targetUser = queryParams.owner || authUser?.username;
      const result = await docClient.send(new ScanCommand({ TableName: SEASONS_TABLE }));
      
      let allItems = result.Items || [];
      // If user is authenticated or filtering by owner, isolate seasons to that owner (or legacy unassigned)
      if (targetUser) {
        allItems = allItems.filter(s => s.ownerUsername === targetUser || !s.ownerUsername);
      }

      const seasons = allItems.map(s => ({
        ...s,
        isArchived: !!s.isArchived,
        totalPoolCount: s.pool?.length || 0,
        usedProblemCount: Object.keys(s.usedProblems || {}).length,
        remainingProblemCount: (s.pool?.length || 0) - Object.keys(s.usedProblems || {}).length
      }));

      return jsonResponse(200, { success: true, seasons });
    }

    if (path === '/api/seasons' && httpMethod === 'POST') {
      const { title, description, pool = PROBLEM_CATALOG } = body;
      if (!title || !title.trim()) {
        return jsonResponse(400, { success: false, error: 'Season title is required.' });
      }

      const owner = authUser?.username || queryParams.owner || 'public';
      const seasonId = `season_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const newSeason = {
        id: seasonId,
        ownerUsername: owner,
        title: title.trim(),
        description: (description || '').trim(),
        pool: pool && pool.length > 0 ? pool : PROBLEM_CATALOG,
        usedProblems: {}, // map of slug -> { round, contestCode, usedAt }
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

    // Archive Season
    const seasonArchiveMatch = path.match(/^\/api\/seasons\/([a-zA-Z0-9_-]+)\/archive$/);
    if (seasonArchiveMatch && httpMethod === 'POST') {
      const seasonId = seasonArchiveMatch[1];
      await docClient.send(new UpdateCommand({
        TableName: SEASONS_TABLE,
        Key: { id: seasonId },
        UpdateExpression: 'SET isArchived = :a',
        ExpressionAttributeValues: { ':a': true }
      }));
      return jsonResponse(200, { success: true, message: 'Season archived successfully' });
    }

    // Unarchive / Restore Season
    const seasonUnarchiveMatch = path.match(/^\/api\/seasons\/([a-zA-Z0-9_-]+)\/unarchive$/);
    if (seasonUnarchiveMatch && httpMethod === 'POST') {
      const seasonId = seasonUnarchiveMatch[1];
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

    // Season Detail & Rounds
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

    // Generate Round from Season Pool
    const seasonRoundMatch = path.match(/^\/api\/seasons\/([a-zA-Z0-9_-]+)\/generate-round$/);
    if (seasonRoundMatch && httpMethod === 'POST') {
      const seasonId = seasonRoundMatch[1];
      const res = await docClient.send(new GetCommand({
        TableName: SEASONS_TABLE,
        Key: { id: seasonId }
      }));

      if (!res.Item) {
        return jsonResponse(404, { success: false, error: 'Season not found' });
      }

      const season = res.Item;
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
      const result = await docClient.send(new ScanCommand({ TableName: CONTESTS_TABLE }));
      const contests = (result.Items || []).map(c => ({
        id: c.id,
        code: c.code,
        title: c.title,
        seasonId: c.seasonId,
        seasonTitle: c.seasonTitle,
        seasonRound: c.seasonRound,
        isPrivate: !!c.password,
        durationMinutes: c.durationMinutes,
        status: c.status,
        startTime: c.startTime,
        endTime: c.endTime,
        hostUsername: c.hostUsername || c.ownerUsername,
        problemCount: c.problems?.length || 0,
        participantCount: c.participants?.length || 0,
        createdAt: c.createdAt
      })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      return jsonResponse(200, { success: true, contests });
    }

    if (path === '/api/contests' && httpMethod === 'POST') {
      const {
        title,
        seasonId,
        durationMinutes = 90,
        hostUsername = authUser?.username || 'Host',
        password = '',
        problems = []
      } = body;

      if (!title || !title.trim()) {
        return jsonResponse(400, { success: false, error: 'Contest title is required.' });
      }

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

        if (!selectedProblems || selectedProblems.length === 0) {
          const usedSlugs = Object.keys(seasonInfo.usedProblems || {});
          const gen = generateRandomRoundFromPool({
            pool: seasonInfo.pool || PROBLEM_CATALOG,
            usedSlugs,
            countTotal: 6
          });
          selectedProblems = gen.problems;
        }
      }

      if (!selectedProblems || selectedProblems.length === 0) {
        selectedProblems = PROBLEM_CATALOG.slice(0, 4);
      }

      const contestCode = generateCode(5);
      const contestId = `contest_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const now = Math.floor(Date.now() / 1000);

      const newContest = {
        id: contestId,
        code: contestCode,
        title: title.trim(),
        seasonId: seasonId || null,
        seasonTitle: seasonInfo ? seasonInfo.title : null,
        seasonRound: seasonInfo ? (seasonInfo.contestIds?.length || 0) + 1 : null,
        ownerUsername: authUser?.username || hostUsername.toLowerCase(),
        hostUsername: hostUsername.trim(),
        password: (password || '').trim(),
        durationMinutes: Number(durationMinutes) || 90,
        status: 'WAITING',
        startTime: null,
        endTime: null,
        problems: selectedProblems.map(p => ({
          ...p,
          points: p.points || (p.difficulty === 'Easy' ? 100 : p.difficulty === 'Hard' ? 300 : 200)
        })),
        participants: [
          {
            username: hostUsername.trim().toLowerCase(),
            displayName: hostUsername.trim(),
            joinedAt: now
          }
        ],
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

      // Fetch all submissions for this contest
      const subRes = await docClient.send(new QueryCommand({
        TableName: SUBMISSIONS_TABLE,
        KeyConditionExpression: 'contestId = :cId',
        ExpressionAttributeValues: { ':cId': contest.id }
      }));
      const submissions = subRes.Items || [];

      // Calculate Live Leaderboard
      const userMap = {};
      (contest.participants || []).forEach(p => {
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

      return jsonResponse(200, {
        success: true,
        contest: {
          ...contest,
          isPrivate: !!contest.password,
          leaderboard,
          submissions
        }
      });
    }

    // Join Contest (with password check for private lobbies)
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

    // Start Contest
    const startMatch = path.match(/^\/api\/contests\/([a-zA-Z0-9_-]+)\/start$/);
    if (startMatch && httpMethod === 'POST') {
      const codeOrId = startMatch[1];
      const now = Math.floor(Date.now() / 1000);

      const contest = await resolveContest(codeOrId);
      if (!contest) return jsonResponse(404, { success: false, error: 'Contest not found' });

      const duration = contest.durationMinutes || 90;
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

      return jsonResponse(200, { success: true, status: 'IN_PROGRESS', startTime, endTime, contest: { ...contest, status: 'IN_PROGRESS', startTime, endTime } });
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

      // Live verification query against LeetCode GraphQL
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

    // Mock / Test Submission (For verification and testing leaderboard ranking updates)
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
