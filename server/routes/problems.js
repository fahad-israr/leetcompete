import express from 'express';
import { searchCatalog, resolveProblem, generateRandomProblemSet } from '../problemBank.js';

const router = express.Router();

// Search problem catalog
router.get('/search', (req, res) => {
  try {
    const { query, difficulty, topic, seasonId, limit } = req.query;
    const results = searchCatalog({
      query: query || '',
      difficulty: difficulty || '',
      topic: topic || '',
      seasonId: seasonId || null,
      limit: limit ? Number(limit) : 50
    });
    res.json({ success: true, count: results.length, problems: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Resolve problem by URL, slug, or ID
router.post('/resolve', async (req, res) => {
  try {
    const { input, seasonId } = req.body;
    if (!input || !input.trim()) {
      return res.status(400).json({ success: false, error: 'Problem input or URL is required' });
    }
    const problem = await resolveProblem(input, seasonId);
    if (!problem) {
      return res.status(404).json({ success: false, error: `Could not find LeetCode problem "${input}"` });
    }
    res.json({ success: true, problem });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate random problem set with season deduplication
router.post('/generate', (req, res) => {
  try {
    const { countEasy, countMedium, countHard, topic, seasonId } = req.body;
    const result = generateRandomProblemSet({
      countEasy: countEasy ?? 1,
      countMedium: countMedium ?? 2,
      countHard: countHard ?? 1,
      topic: topic || '',
      seasonId: seasonId || null
    });
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
