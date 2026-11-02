const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

router.get('/', projectController.getProjects);
router.get('/tts/speak', projectController.streamLiveTTS);
router.get('/:id', projectController.getProjectById);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);
router.post('/:id/retranslate', projectController.retranslateProject);
router.post('/:id/generate-audio', projectController.generateAudio);
router.post('/:id/generate-dubbed-video', projectController.generateDubbedVideo);
router.get('/:id/export/:format', projectController.exportSubtitles);

module.exports = router;
