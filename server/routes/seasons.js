import express from 'express';
import { dbService } from '../db.js';

const router = express.Router();

// List all seasons
router.get('/', (req, res) => {
  try {
    const seasons = dbService.getAllSeasons();
    res.json({ success: true, seasons });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create a new season
router.post('/', (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Season title is required' });
    }
    const season = dbService.createSeason({ title, description });
    res.json({ success: true, season });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get season detail, rounds, used problems, and standings
router.get('/:id', (req, res) => {
  try {
    const season = dbService.getSeason(req.params.id);
    if (!season) {
      return res.status(404).json({ success: false, error: 'Season not found' });
    }

    const standings = dbService.getSeasonStandings(req.params.id);
    res.json({
      success: true,
      season,
      standings
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete season
router.delete('/:id', (req, res) => {
  try {
    dbService.deleteSeason(req.params.id);
    res.json({ success: true, message: 'Season deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
