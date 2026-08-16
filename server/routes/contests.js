import express from 'express';
import { dbService } from '../db.js';
import { verifyUserSubmission } from '../leetcode.js';

const router = express.Router();

// List all contests
router.get('/', (req, res) => {
  try {
    const contests = dbService.getAllContests();
    res.json({ success: true, contests });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create a new contest
router.post('/', (req, res) => {
  try {
    const { title, seasonId, durationMinutes, hostUsername, problems } = req.body;

    if (!problems || !Array.isArray(problems) || problems.length === 0) {
      return res.status(400).json({ success: false, error: 'At least 1 problem is required to create a contest.' });
    }

    // Season deduplication check
    if (seasonId) {
      const usedSlugs = new Set(dbService.getSeasonUsedProblems(seasonId));
      const repeated = problems.filter(p => usedSlugs.has(p.titleSlug));
      if (repeated.length > 0) {
        const names = repeated.map(p => p.title || p.titleSlug).join(', ');
        return res.status(400).json({
          success: false,
          error: `Problem(s) already used in this season: ${names}. Season contests cannot reuse problems!`
        });
      }
    }

    const contest = dbService.createContest({
      title,
      seasonId,
      durationMinutes: durationMinutes || 90,
      hostUsername: hostUsername || 'Host',
      problems
    });

    res.json({ success: true, contest });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get contest by ID or 5-char code
router.get('/:codeOrId', (req, res) => {
  try {
    const { codeOrId } = req.params;
    let contest = dbService.getContestByCode(codeOrId);
    if (!contest) {
      contest = dbService.getContest(codeOrId);
    }

    if (!contest) {
      return res.status(404).json({ success: false, error: 'Contest lobby not found.' });
    }

    res.json({ success: true, contest });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start contest
router.post('/:id/start', (req, res) => {
  try {
    const contest = dbService.startContest(req.params.id);
    if (!contest) {
      return res.status(404).json({ success: false, error: 'Contest not found.' });
    }
    // Broadcast via websocket if attached
    if (req.app.locals.broadcastContestUpdate) {
      req.app.locals.broadcastContestUpdate(contest.id, 'CONTEST_STARTED', contest);
    }
    res.json({ success: true, contest });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Finish contest
router.post('/:id/finish', (req, res) => {
  try {
    const contest = dbService.finishContest(req.params.id);
    if (!contest) {
      return res.status(404).json({ success: false, error: 'Contest not found.' });
    }
    if (req.app.locals.broadcastContestUpdate) {
      req.app.locals.broadcastContestUpdate(contest.id, 'CONTEST_FINISHED', contest);
    }
    res.json({ success: true, contest });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Join lobby
router.post('/:id/join', (req, res) => {
  try {
    const { username, displayName } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ success: false, error: 'LeetCode username is required.' });
    }

    const participant = dbService.addParticipant(req.params.id, username, displayName);
    const contest = dbService.getContest(req.params.id);

    if (req.app.locals.broadcastContestUpdate) {
      req.app.locals.broadcastContestUpdate(contest.id, 'PARTICIPANT_JOINED', {
        participant,
        leaderboard: contest.leaderboard
      });
    }

    res.json({ success: true, participant, contest });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify a problem submission
router.post('/:id/verify', async (req, res) => {
  try {
    const { username, problemSlug } = req.body;
    const contest = dbService.getContest(req.params.id);

    if (!contest) {
      return res.status(404).json({ success: false, error: 'Contest not found.' });
    }

    if (!username || !username.trim()) {
      return res.status(400).json({ success: false, error: 'LeetCode username is required to verify submission.' });
    }

    if (!problemSlug) {
      return res.status(400).json({ success: false, error: 'Problem slug is required.' });
    }

    // Check if contest is active
    if (contest.status === 'WAITING') {
      return res.status(400).json({
        success: false,
        error: 'Contest has not started yet. Please wait for the host to start the contest.'
      });
    }

    // Auto add participant if not yet registered
    dbService.addParticipant(contest.id, username, username);

    // Call LeetCode GraphQL verification
    const verification = await verifyUserSubmission(
      username,
      problemSlug,
      contest.startTime,
      contest.endTime
    );

    if (!verification.verified) {
      return res.json({
        success: false,
        verified: false,
        reason: verification.reason
      });
    }

    // Save accepted submission
    const submission = dbService.addSubmission({
      contestId: contest.id,
      username,
      problemSlug,
      submissionId: verification.submission.id,
      submissionTimestamp: verification.submission.timestamp
    });

    const updatedContest = dbService.getContest(contest.id);

    // Broadcast live leaderboard update
    if (req.app.locals.broadcastContestUpdate) {
      req.app.locals.broadcastContestUpdate(contest.id, 'SUBMISSION_VERIFIED', {
        submission,
        leaderboard: updatedContest.leaderboard,
        messages: dbService.getMessages(contest.id)
      });
    }

    res.json({
      success: true,
      verified: true,
      submission,
      leaderboard: updatedContest.leaderboard
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get messages & activity
router.get('/:id/messages', (req, res) => {
  try {
    const messages = dbService.getMessages(req.params.id);
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Post a chat message
router.post('/:id/messages', (req, res) => {
  try {
    const { username, text } = req.body;
    const msg = dbService.addChatMessage(req.params.id, username, text);
    if (!msg) {
      return res.status(400).json({ success: false, error: 'Message cannot be empty.' });
    }

    if (req.app.locals.broadcastContestUpdate) {
      req.app.locals.broadcastContestUpdate(req.params.id, 'NEW_MESSAGE', msg);
    }

    res.json({ success: true, message: msg });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
