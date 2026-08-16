import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, '..', 'data', 'db.json');

// Ensure data directory exists
const dataDir = path.dirname(DB_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initial state
const defaultState = {
  seasons: [],
  contests: [],
  contestProblems: [],
  participants: [],
  submissions: [],
  messages: []
};

// In-memory cache with atomic file sync
let db = { ...defaultState };

function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      db = { ...defaultState, ...JSON.parse(data) };
    } else {
      saveDb();
    }
  } catch (err) {
    console.error('Error loading DB, resetting to defaults:', err);
    db = { ...defaultState };
  }
}

function saveDb() {
  try {
    const tmpFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
  } catch (err) {
    console.error('Error saving DB:', err);
  }
}

// Load DB on startup
loadDb();

// Generate short random code (e.g., "55OH7")
export function generateCode(length = 5) {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const dbService = {
  // === SEASONS ===
  getAllSeasons() {
    return db.seasons.map(s => {
      const contests = db.contests.filter(c => c.seasonId === s.id);
      const usedSlugs = this.getSeasonUsedProblems(s.id);
      return {
        ...s,
        contestCount: contests.length,
        usedProblemCount: usedSlugs.length
      };
    });
  },

  getSeason(id) {
    const season = db.seasons.find(s => s.id === id);
    if (!season) return null;
    const contests = db.contests.filter(c => c.seasonId === id);
    const usedSlugs = this.getSeasonUsedProblems(id);
    return {
      ...season,
      contests,
      usedProblemCount: usedSlugs.length,
      usedSlugs
    };
  },

  createSeason({ title, description }) {
    const newSeason = {
      id: `season_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title: title || 'Untitled Season',
      description: description || '',
      createdAt: Math.floor(Date.now() / 1000)
    };
    db.seasons.push(newSeason);
    saveDb();
    return newSeason;
  },

  deleteSeason(id) {
    db.seasons = db.seasons.filter(s => s.id !== id);
    // Unlink contests from season
    db.contests.forEach(c => {
      if (c.seasonId === id) c.seasonId = null;
    });
    saveDb();
    return true;
  },

  getSeasonUsedProblems(seasonId) {
    if (!seasonId) return [];
    const seasonContests = db.contests.filter(c => c.seasonId === seasonId);
    const contestIds = new Set(seasonContests.map(c => c.id));
    const problems = db.contestProblems.filter(p => contestIds.has(p.contestId));
    return Array.from(new Set(problems.map(p => p.titleSlug)));
  },

  getSeasonStandings(seasonId) {
    const seasonContests = db.contests.filter(c => c.seasonId === seasonId);
    const contestIds = seasonContests.map(c => c.id);

    // Map of username -> aggregate stats
    const stats = new Map();

    seasonContests.forEach(contest => {
      const leaderboard = this.getLeaderboard(contest.id);
      leaderboard.forEach((entry, rankIndex) => {
        const username = entry.username;
        if (!stats.has(username)) {
          stats.set(username, {
            username,
            displayName: entry.displayName || username,
            contestsPlayed: 0,
            totalSolved: 0,
            totalPenalty: 0,
            seasonPoints: 0,
            contestRanks: []
          });
        }
        const userStats = stats.get(username);
        userStats.contestsPlayed += 1;
        userStats.totalSolved += entry.solvedCount;
        userStats.totalPenalty += entry.totalPenalty;
        
        // Season points formula: 1st=100, 2nd=80, 3rd=65, 4th=55, 5th=45, 6th=35, 7th=25, 8th=15, solved bonus
        const rankPoints = [100, 80, 65, 55, 45, 35, 25, 20, 15, 10];
        const pointsForRank = rankIndex < rankPoints.length ? rankPoints[rankIndex] : Math.max(5, 10 - rankIndex);
        const earnedPoints = (entry.solvedCount > 0 ? pointsForRank : 0) + (entry.solvedCount * 10);
        userStats.seasonPoints += earnedPoints;
        userStats.contestRanks.push({
          contestId: contest.id,
          contestTitle: contest.title,
          rank: rankIndex + 1,
          solved: entry.solvedCount,
          points: earnedPoints
        });
      });
    });

    return Array.from(stats.values()).sort((a, b) => {
      if (b.seasonPoints !== a.seasonPoints) return b.seasonPoints - a.seasonPoints;
      if (b.totalSolved !== a.totalSolved) return b.totalSolved - a.totalSolved;
      return a.totalPenalty - b.totalPenalty;
    });
  },

  // === CONTESTS ===
  getAllContests() {
    return db.contests.map(c => {
      const season = c.seasonId ? db.seasons.find(s => s.id === c.seasonId) : null;
      const problemCount = db.contestProblems.filter(p => p.contestId === c.id).length;
      const participantCount = db.participants.filter(p => p.contestId === c.id).length;
      return {
        ...c,
        seasonTitle: season ? season.title : null,
        problemCount,
        participantCount
      };
    }).sort((a, b) => b.createdAt - a.createdAt);
  },

  getContest(id) {
    const contest = db.contests.find(c => c.id === id);
    if (!contest) return null;
    return this.enrichContest(contest);
  },

  getContestByCode(code) {
    const contest = db.contests.find(c => c.code.toUpperCase() === code.toUpperCase());
    if (!contest) return null;
    return this.enrichContest(contest);
  },

  enrichContest(contest) {
    const season = contest.seasonId ? db.seasons.find(s => s.id === contest.seasonId) : null;
    const problems = db.contestProblems
      .filter(p => p.contestId === contest.id)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    const participants = db.participants.filter(p => p.contestId === contest.id);
    const submissions = db.submissions.filter(s => s.contestId === contest.id);
    const leaderboard = this.getLeaderboard(contest.id);

    return {
      ...contest,
      season: season ? { id: season.id, title: season.title } : null,
      problems,
      participants,
      submissions,
      leaderboard
    };
  },

  createContest({ title, seasonId, durationMinutes = 90, hostUsername = 'Host', problems = [] }) {
    let code = generateCode(5);
    while (db.contests.some(c => c.code === code)) {
      code = generateCode(5);
    }

    const contestId = `contest_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    // Determine season round number if attached to a season
    let seasonRound = null;
    if (seasonId) {
      const priorContests = db.contests.filter(c => c.seasonId === seasonId);
      seasonRound = priorContests.length + 1;
    }

    const newContest = {
      id: contestId,
      code,
      seasonId: seasonId || null,
      seasonRound,
      title: title || (seasonRound ? `Season Round #${seasonRound}` : `Contest ${code}`),
      durationMinutes: Number(durationMinutes) || 90,
      status: 'WAITING', // WAITING, IN_PROGRESS, FINISHED
      startTime: null,
      endTime: null,
      hostUsername: hostUsername.trim() || 'Host',
      createdAt: Math.floor(Date.now() / 1000)
    };

    db.contests.push(newContest);

    // Add problems
    problems.forEach((p, idx) => {
      db.contestProblems.push({
        id: `prob_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`,
        contestId: contestId,
        frontendId: String(p.frontendId || p.questionFrontendId || idx + 1),
        title: p.title || `Problem ${idx + 1}`,
        titleSlug: p.titleSlug,
        difficulty: p.difficulty || 'Medium',
        points: p.points || ((idx + 1) * 100),
        orderIndex: idx,
        topicTags: p.topicTags || []
      });
    });

    // Add host as initial participant if username provided
    if (hostUsername && hostUsername !== 'Host') {
      db.participants.push({
        id: `part_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        contestId,
        username: hostUsername.trim().toLowerCase(),
        displayName: hostUsername.trim(),
        joinedAt: Math.floor(Date.now() / 1000)
      });
    }

    // Add initial system message
    db.messages.push({
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      contestId,
      username: 'SYSTEM',
      text: `Lobby created! Invite contestants using Lobby Code: ${code}`,
      type: 'SYSTEM',
      createdAt: Math.floor(Date.now() / 1000)
    });

    saveDb();
    return this.enrichContest(newContest);
  },

  startContest(id) {
    const contest = db.contests.find(c => c.id === id);
    if (!contest) return null;
    if (contest.status === 'IN_PROGRESS') return this.enrichContest(contest);

    const now = Math.floor(Date.now() / 1000);
    contest.status = 'IN_PROGRESS';
    contest.startTime = now;
    contest.endTime = now + (contest.durationMinutes * 60);

    db.messages.push({
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      contestId: id,
      username: 'SYSTEM',
      text: `Contest has started! You have ${contest.durationMinutes} minutes. Good luck!`,
      type: 'SYSTEM',
      createdAt: now
    });

    saveDb();
    return this.enrichContest(contest);
  },

  finishContest(id) {
    const contest = db.contests.find(c => c.id === id);
    if (!contest) return null;
    contest.status = 'FINISHED';
    if (!contest.endTime || contest.endTime > Math.floor(Date.now() / 1000)) {
      contest.endTime = Math.floor(Date.now() / 1000);
    }
    db.messages.push({
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      contestId: id,
      username: 'SYSTEM',
      text: `Contest has finished! Final rankings are now locked.`,
      type: 'SYSTEM',
      createdAt: Math.floor(Date.now() / 1000)
    });
    saveDb();
    return this.enrichContest(contest);
  },

  addParticipant(contestId, username, displayName) {
    const cleanUsername = username.trim().toLowerCase();
    const existing = db.participants.find(p => p.contestId === contestId && p.username === cleanUsername);
    if (existing) {
      if (displayName && existing.displayName !== displayName) {
        existing.displayName = displayName;
        saveDb();
      }
      return existing;
    }

    const newParticipant = {
      id: `part_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      contestId,
      username: cleanUsername,
      displayName: (displayName || username).trim(),
      joinedAt: Math.floor(Date.now() / 1000)
    };
    db.participants.push(newParticipant);

    db.messages.push({
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      contestId,
      username: 'SYSTEM',
      text: `${newParticipant.displayName} (@${cleanUsername}) joined the lobby.`,
      type: 'SYSTEM',
      createdAt: Math.floor(Date.now() / 1000)
    });

    saveDb();
    return newParticipant;
  },

  // === SUBMISSIONS ===
  addSubmission({ contestId, username, problemSlug, submissionId, submissionTimestamp }) {
    const cleanUsername = username.trim().toLowerCase();
    
    // Check if already solved
    const existing = db.submissions.find(
      s => s.contestId === contestId && s.username === cleanUsername && s.problemSlug === problemSlug
    );
    if (existing) return existing;

    const contest = db.contests.find(c => c.id === contestId);
    const problem = db.contestProblems.find(p => p.contestId === contestId && p.titleSlug === problemSlug);

    const startTime = contest?.startTime || Math.floor(Date.now() / 1000);
    const solveTimeSeconds = Math.max(0, submissionTimestamp - startTime);
    const penaltyMinutes = Math.floor(solveTimeSeconds / 60);

    const newSubmission = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      contestId,
      username: cleanUsername,
      problemSlug,
      problemTitle: problem?.title || problemSlug,
      status: 'ACCEPTED',
      submissionId: String(submissionId),
      submissionTimestamp: Number(submissionTimestamp),
      penaltyMinutes,
      points: problem?.points || 100,
      verifiedAt: Math.floor(Date.now() / 1000)
    };

    db.submissions.push(newSubmission);

    // Announce in chat
    const participant = db.participants.find(p => p.contestId === contestId && p.username === cleanUsername);
    const name = participant?.displayName || cleanUsername;
    db.messages.push({
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      contestId,
      username: 'SYSTEM',
      text: `🎉 ${name} solved "${newSubmission.problemTitle}" (+${penaltyMinutes}m)!`,
      type: 'SOLVE',
      createdAt: Math.floor(Date.now() / 1000)
    });

    saveDb();
    return newSubmission;
  },

  // === LEADERBOARD COMPUTATION ===
  getLeaderboard(contestId) {
    const contest = db.contests.find(c => c.id === contestId);
    if (!contest) return [];

    const problems = db.contestProblems.filter(p => p.contestId === contestId).sort((a, b) => a.orderIndex - b.orderIndex);
    const participants = db.participants.filter(p => p.contestId === contestId);
    const submissions = db.submissions.filter(s => s.contestId === contestId);

    const board = participants.map(part => {
      const userSubs = submissions.filter(s => s.username === part.username);
      
      let solvedCount = 0;
      let totalScore = 0;
      let totalPenalty = 0;
      const problemStatus = {};

      problems.forEach(prob => {
        const sub = userSubs.find(s => s.problemSlug === prob.titleSlug);
        if (sub) {
          solvedCount += 1;
          totalScore += sub.points;
          totalPenalty += sub.penaltyMinutes;
          problemStatus[prob.titleSlug] = {
            solved: true,
            penaltyMinutes: sub.penaltyMinutes,
            timestamp: sub.submissionTimestamp
          };
        } else {
          problemStatus[prob.titleSlug] = {
            solved: false
          };
        }
      });

      return {
        username: part.username,
        displayName: part.displayName,
        solvedCount,
        totalScore,
        totalPenalty,
        problemStatus
      };
    });

    // Sort by solvedCount DESC, totalPenalty ASC, totalScore DESC
    board.sort((a, b) => {
      if (b.solvedCount !== a.solvedCount) return b.solvedCount - a.solvedCount;
      if (a.totalPenalty !== b.totalPenalty) return a.totalPenalty - b.totalPenalty;
      return b.totalScore - a.totalScore;
    });

    return board.map((item, index) => ({
      rank: index + 1,
      ...item
    }));
  },

  // === CHAT & MESSAGES ===
  getMessages(contestId) {
    return db.messages
      .filter(m => m.contestId === contestId)
      .sort((a, b) => a.createdAt - b.createdAt);
  },

  addChatMessage(contestId, username, text) {
    if (!text || !text.trim()) return null;
    const cleanUsername = (username || 'Anonymous').trim();
    const participant = db.participants.find(p => p.contestId === contestId && p.username === cleanUsername.toLowerCase());
    
    const msg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      contestId,
      username: participant?.displayName || cleanUsername,
      text: text.trim(),
      type: 'CHAT',
      createdAt: Math.floor(Date.now() / 1000)
    };

    db.messages.push(msg);
    saveDb();
    return msg;
  }
};
