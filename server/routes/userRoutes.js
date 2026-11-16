const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const { imageUpload, handleUploadError } = require('../config/upload');

// S1 + C7: shared hardening - mimetype allowlist, server-generated uuid
// filename, 5 MB cap. The client's originalname never touches the filesystem.
const upload = imageUpload({ dir: 'uploads/avatars', maxSizeMb: 5 });

router.get('/me', auth, userController.getMe);
router.put('/me', auth, userController.updateProfile);
router.post('/avatar', auth, upload.single('avatar'), handleUploadError, userController.uploadAvatar);
// Audit fix B14: the profile detail route only existed as the doubled
// /users/users/:id segment, so the natural GET /api/users/:id hit nothing.
// The legacy alias is kept for any old clients.
router.get('/users/:id', auth, userController.getUserById);
// Audit fix S2: the legacy POST /friends one-way addFriend route was removed
// - it bypassed the friend-request consent flow and enabled messaging any
// stranger. Friendship is created exclusively via /api/friends/requests.
router.get('/users', auth, userController.getAllUsers);
// Audit fix C3: the Find Users page calls GET /api/users - serve it at the
// collection root as well as the legacy /users alias.
router.get('/', auth, userController.getAllUsers);
router.put('/xp', auth, userController.updateXP);
router.put('/streak', auth, userController.updateStreak);
router.post('/badges', auth, userController.addBadge);
// B14: natural detail route - MUST come after the literal paths above so
// /me, /users, /xp... are never captured by :id.
router.get('/:id', auth, userController.getUserById);

module.exports = router; 