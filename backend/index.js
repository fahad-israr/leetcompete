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

const { verifyUserSubmission, getQuestionDetails } = require('./leetcode');
const {
  PROBLEM_CATALOG,
  PRESET_LISTS,
  searchCatalog,
  resolveProblem,
  generateRandomRoundFromPool
} = require('./problemBank');

// Initialize DynamoDB Client
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const SEASONS_TABLE = process.env.SEASONS_TABLE || 'leetcompete-seasons-dev';
const CONTESTS_TABLE = process.env.CONTESTS_TABLE || 'leetcompete-contests-dev';
const SUBMISSIONS_TABLE = process.env.SUBMISSIONS_TABLE || 'leetcompete-submissions-dev';
const MESSAGES_TABLE = process.env.MESSAGES_TABLE || 'leetcompete-messages-dev';

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'leetcompete_admin_2026';
const ALLOWED_ADMIN_EMAILS = (process.env.ALLOWED_ADMIN_EMAILS || 'fahad00cms@gmail.com').split(',').map(e => e.trim().toLowerCase());

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
 * Verify Admin Authentication (Passcode or Google JWT header)
 */
function verifyAdminAuth(event) {
  const headers = event.headers || {};
  const passcode = headers['x-admin-passcode'] || headers['X-Admin-Passcode'];
  if (passcode && passcode === ADMIN_PASSCODE) {
    return { isAdmin: true, method: 'passcode' };
  }

  // Google OAuth JWT check in Authorization: Bearer <token>
  const authHeader = headers.authorization || headers.Authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        if (payload.email && ALLOWED_ADMIN_EMAILS.includes(payload.email.toLowerCase())) {
          return { isAdmin: true, method: 'gauth', email: payload.email };
        }
      }
    } catch (e) {
      console.warn('Failed to parse bearer token:', e);
    }
  }

  return { isAdmin: false };
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

  try {
    // === HEALTH CHECK ===
    if (path === '/api/health' || path === '/health') {
      return jsonResponse(200, { status: 'ok', service: 'LeetCompete', timestamp: new Date().toISOString() });
    }

    // === SEASONS ENDPOINTS ===
    if (path === '/api/seasons' && httpMethod === 'GET') {
      const result = await docClient.send(new ScanCommand({ TableName: SEASONS_TABLE }));
      const seasons = (result.Items || []).map(s => ({
        ...s,
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

      const seasonId = `season_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const newSeason = {
        id: seasonId,
        title: title.trim(),
        description: (description || '').trim(),
        pool: pool && pool.length > 0 ? pool : PROBLEM_CATALOG,
        usedProblems: {}, // map of slug -> { round, contestCode, usedAt }
        contestIds: [],
        createdAt: Math.floor(Date.now() / 1000)
      };

      await docClient.send(new PutCommand({
        TableName: SEASONS_TABLE,
        Item: newSeason
      }));

      return jsonResponse(200, { success: true, season: newSeason });
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
        hostUsername = 'Host',
        password = '',
        problems = []
      } = body;

      if (!problems || problems.length === 0) {
        return jsonResponse(400, { success: false, error: 'At least 1 problem is required.' });
      }

      let season = null;
      let seasonRound = null;

      if (seasonId) {
        const sRes = await docClient.send(new GetCommand({
          TableName: SEASONS_TABLE,
          Key: { id: seasonId }
        }));
        season = sRes.Item;
        if (season) {
          const usedMap = season.usedProblems || {};
          // Check deduplication
          const duplicates = problems.filter(p => !!usedMap[p.titleSlug.toLowerCase()]);
          if (duplicates.length > 0) {
            const names = duplicates.map(p => p.title || p.titleSlug).join(', ');
            return jsonResponse(400, {
              success: false,
              error: `Problem(s) already used in this season: ${names}. Season rounds cannot repeat problems!`
            });
          }
          seasonRound = (season.contestIds?.length || 0) + 1;
        }
      }

      const contestId = `contest_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const code = generateCode(5);

      const newContest = {
        id: contestId,
        code,
        seasonId: seasonId || null,
        seasonTitle: season ? season.title : null,
        seasonRound,
        title: title?.trim() || (season ? `${season.title} - Round #${seasonRound}` : `Contest ${code}`),
        durationMinutes: Number(durationMinutes) || 90,
        password: password ? password.trim() : null,
        isPrivate: !!password,
        status: 'WAITING',
        startTime: null,
        endTime: null,
        hostUsername: hostUsername.trim() || 'Host',
        problems: problems.map((p, idx) => ({
          frontendId: String(p.frontendId || idx + 1),
          title: p.title || `Problem ${idx + 1}`,
          titleSlug: p.titleSlug,
          difficulty: p.difficulty || 'Medium',
          points: p.points || (idx + 1) * 100,
          topicTags: p.topicTags || []
        })),
        participants: hostUsername && hostUsername !== 'Host' ? [{
          username: hostUsername.trim().toLowerCase(),
          displayName: hostUsername.trim(),
          joinedAt: Math.floor(Date.now() / 1000)
        }] : [],
        createdAt: Math.floor(Date.now() / 1000)
      };

      await docClient.send(new PutCommand({
        TableName: CONTESTS_TABLE,
        Item: newContest
      }));

      // Update Season's used problem bank and contest list
      if (season && seasonId) {
        const updatedUsed = { ...(season.usedProblems || {}) };
        problems.forEach(p => {
          updatedUsed[p.titleSlug.toLowerCase()] = {
            round: seasonRound,
            contestId,
            contestCode: code,
            usedAt: Math.floor(Date.now() / 1000)
          };
        });

        await docClient.send(new UpdateCommand({
          TableName: SEASONS_TABLE,
          Key: { id: seasonId },
          UpdateExpression: 'SET usedProblems = :u, contestIds = list_append(if_not_exists(contestIds, :emptyList), :cId)',
          ExpressionAttributeValues: {
            ':u': updatedUsed,
            ':cId': [contestId],
            ':emptyList': []
          }
        }));
      }

      return jsonResponse(200, { success: true, contest: newContest });
    }

    // Get Contest by Code or ID
    const contestMatch = path.match(/^\/api\/contests\/([a-zA-Z0-9_-]+)$/);
    if (contestMatch && httpMethod === 'GET') {
      const codeOrId = contestMatch[1];
      let contest = null;

      if (codeOrId.length === 5) {
        const queryRes = await docClient.send(new QueryCommand({
          TableName: CONTESTS_TABLE,
          IndexName: 'CodeIndex',
          KeyConditionExpression: 'code = :code',
          ExpressionAttributeValues: { ':code': codeOrId.toUpperCase() }
        }));
        contest = queryRes.Items?.[0];
      }

      if (!contest) {
        const getRes = await docClient.send(new GetCommand({
          TableName: CONTESTS_TABLE,
          Key: { id: codeOrId }
        }));
        contest = getRes.Item;
      }

      if (!contest) {
        return jsonResponse(404, { success: false, error: 'Contest lobby not found.' });
      }

      // Fetch submissions to build live leaderboard
      const subRes = await docClient.send(new QueryCommand({
        TableName: SUBMISSIONS_TABLE,
        KeyConditionExpression: 'contestId = :cId',
        ExpressionAttributeValues: { ':cId': contest.id }
      }));
      const submissions = subRes.Items || [];

      // Compute Leaderboard
      const leaderboard = (contest.participants || []).map(p => {
        const userSubs = submissions.filter(s => s.username === p.username);
        let solvedCount = 0;
        let totalScore = 0;
        let totalPenalty = 0;
        const problemStatus = {};

        (contest.problems || []).forEach(prob => {
          const sub = userSubs.find(s => s.problemSlug === prob.titleSlug);
          if (sub) {
            solvedCount += 1;
            totalScore += (sub.points || prob.points || 100);
            totalPenalty += (sub.penaltyMinutes || 0);
            problemStatus[prob.titleSlug] = {
              solved: true,
              penaltyMinutes: sub.penaltyMinutes,
              timestamp: sub.submissionTimestamp
            };
          } else {
            problemStatus[prob.titleSlug] = { solved: false };
          }
        });

        return {
          username: p.username,
          displayName: p.displayName || p.username,
          solvedCount,
          totalScore,
          totalPenalty,
          problemStatus
        };
      }).sort((a, b) => {
        if (b.solvedCount !== a.solvedCount) return b.solvedCount - a.solvedCount;
        if (a.totalPenalty !== b.totalPenalty) return a.totalPenalty - b.totalPenalty;
        return b.totalScore - a.totalScore;
      }).map((item, index) => ({ rank: index + 1, ...item }));

      return jsonResponse(200, {
        success: true,
        contest: {
          ...contest,
          isPrivate: !!contest.password,
          password: contest.password ? true : null, // do not expose plain password
          leaderboard
        }
      });
    }

    // Join Contest (with password check for private lobbies)
    const joinMatch = path.match(/^\/api\/contests\/([a-zA-Z0-9_-]+)\/join$/);
    if (joinMatch && httpMethod === 'POST') {
      const contestId = joinMatch[1];
      const { username, displayName, password } = body;

      if (!username || !username.trim()) {
        return jsonResponse(400, { success: false, error: 'LeetCode username is required.' });
      }

      const cRes = await docClient.send(new GetCommand({
        TableName: CONTESTS_TABLE,
        Key: { id: contestId }
      }));
      const contest = cRes.Item;
      if (!contest) {
        return jsonResponse(404, { success: false, error: 'Contest not found.' });
      }

      // Check password if private
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
          Key: { id: contestId },
          UpdateExpression: 'SET participants = :p',
          ExpressionAttributeValues: { ':p': participants }
        }));
      }

      return jsonResponse(200, { success: true, message: 'Joined successfully' });
    }

    // Start Contest
    const startMatch = path.match(/^\/api\/contests\/([a-zA-Z0-9_-]+)\/start$/);
    if (startMatch && httpMethod === 'POST') {
      const contestId = startMatch[1];
      const now = Math.floor(Date.now() / 1000);

      const cRes = await docClient.send(new GetCommand({
        TableName: CONTESTS_TABLE,
        Key: { id: contestId }
      }));
      const contest = cRes.Item;
      if (!contest) return jsonResponse(404, { success: false, error: 'Contest not found' });

      const duration = contest.durationMinutes || 90;
      const startTime = now;
      const endTime = now + (duration * 60);

      await docClient.send(new UpdateCommand({
        TableName: CONTESTS_TABLE,
        Key: { id: contestId },
        UpdateExpression: 'SET #st = :status, startTime = :start, endTime = :end',
        ExpressionAttributeNames: { '#st': 'status' },
        ExpressionAttributeValues: {
          ':status': 'IN_PROGRESS',
          ':start': startTime,
          ':end': endTime
        }
      }));

      return jsonResponse(200, { success: true, status: 'IN_PROGRESS', startTime, endTime });
    }

    // Verify Submission
    const verifyMatch = path.match(/^\/api\/contests\/([a-zA-Z0-9_-]+)\/verify$/);
    if (verifyMatch && httpMethod === 'POST') {
      const contestId = verifyMatch[1];
      const { username, problemSlug } = body;

      const cRes = await docClient.send(new GetCommand({
        TableName: CONTESTS_TABLE,
        Key: { id: contestId }
      }));
      const contest = cRes.Item;
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
      const subId = `sub_${contestId}_${username}_${problemSlug}`;

      const submissionItem = {
        contestId,
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
      const problems = searchCatalog({ query, difficulty, topic, limit: limit ? Number(limit) : 50 });
      return jsonResponse(200, { success: true, count: problems.length, problems });
    }

    if (path === '/api/problems/resolve' && httpMethod === 'POST') {
      const { input } = body;
      const problem = await resolveProblem(input);
      if (!problem) return jsonResponse(404, { success: false, error: 'Problem not found on LeetCode' });
      return jsonResponse(200, { success: true, problem });
    }

    return jsonResponse(404, { success: false, error: `Route not found: ${httpMethod} ${path}` });
  } catch (error) {
    console.error('Lambda handler error:', error);
    return jsonResponse(500, { success: false, error: error.message });
  }
};
