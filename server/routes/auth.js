const express = require('express');
const { body, validationResult } = require('express-validator');
const { register, login } = require('../controllers/authController');
const router = express.Router();

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ error: errors.array()[0].msg });
  next();
};

router.post(
  '/register',
  [
    body('username').trim().isLength({ min: 3, max: 20 }).withMessage('Kullanıcı adı 3-20 karakter olmalı'),
    body('email').isEmail().normalizeEmail().withMessage('Geçerli bir e-posta gir'),
    body('password').isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalı'),
  ],
  handleValidation,
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Geçerli bir e-posta gir'),
    body('password').notEmpty().withMessage('Şifre boş olamaz'),
  ],
  handleValidation,
  login
);

module.exports = router;
