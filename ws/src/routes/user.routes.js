
import express from 'express';
import morgan from 'morgan';
import Busboy from 'busboy';
import busboyBodyParser from 'busboy-body-parser';
import mongoose from 'mongoose'
import bcrypt from 'bcrypt';

import User from '../models/user.js';
import aws from '../services/aws.js'
import challenge from '../models/challenge.js';
import userChallenge from '../models/relationship/userChallenge.js';

const router = express.Router();

router.post('/', async (req, res) => {
  var busboy = new Busboy({ headers: req.headers });
  busboy.on('finish', async () => {
    console.log(req.body);
    try {

      const userId = mongoose.Types.ObjectId();
      let photo = '';
      //UPLOAD DA IMAGE

      if (req.files) {
        const file = req.files.photo;

        const nameParts = file.name.split('.');
        const fileName = `${userId}.${nameParts[nameParts.length - 1]}`;
        photo = `users/${fileName}`;

        const response = await aws.uploadToS3(file, photo);

        if (response.error) {
          res.json({
            error: true,
            message: response.message,
          });
          return false

        }
      }

       // CRIAR SENHA COM BCRYPT
       const password = await bcrypt.hash(req.body.password, 10);

       const user = await new User({
         ...req.body,
         _id: userId,
         password,
         photo,
       }).save();
 
       res.json({ user });
     } catch (err) {
       res.json({ error: true, message: err.message });
     }
   });
   req.pipe(busboy);
 });





//CRIAR USUÁRIO

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email,
      status: 'A',
    });

    if (!user) {
      res.json({ error: true, message: 'Nenhum e-mail ativo encontrado.' });
      return false;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.json({
        error: true,
        message: 'Combinação errada de E-mail / Senha.',
      });
      return false;
    }

    delete user.password;

    res.json({
      user,
    });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

router.get('/:id/challenge', async (req, res) => {
  try {
    // RECUPERAR DESAFIO ATUAL
    // CRONJOB CUIDARÁ DO STATUS
    const challenge = await Challenge.findOne({
      status: 'A',
    });

    if (!challenge) {
      res.json({ error: true, message: 'Nenhum desafio ativo.' });
      return false;
    }

    // VERIFICAR SE O USUÁRIO ESTÁ NELE
    const userChallenge = await UserChallenge.findOne({
      userId: req.params.id,
      challengeId: challenge._id,
    });

    // VERIFICAR VALOR DIÁRIO
    const dayStart = moment(challenge.date.start, 'YYYY-MM-DD');
    const dayEnd = moment(challenge.date.end, 'YYYY-MM-DD');
    const challengePeriod = dayEnd.diff(dayStart, 'days');
    const currentPeriod = moment().diff(dayStart.subtract(1, 'day'), 'days');

    const dailyAmount = challenge.fee / challengePeriod;

    // VERIFICAR QUANTAS VEZES ELE PARTICIPOU
    const participatedTimes = await Tracking.find({
      operation: 'G',
      userId: req.params.id,
      challengeId: challenge._id,
    });

    // CALCULAR SALDO CONQUISTADO
    const balance = participatedTimes.length * dailyAmount;

    // CALCULAR SE JÁ FEZ O DESAFIO HOJE
    const challengeFinishedToday = await Tracking.findOne({
      userId: req.params.id,
      challengeId: challenge._id,
      register: {
        $lte: moment().endOf('day'),
        $gte: moment().startOf('day'),
      },
      operation: {
        $in: ['G', 'L'],
      },
    });

    // CALCULAR A DISCIPLINA
    const periodDiscipline = Boolean(challengeFinishedToday)
      ? currentPeriod
      : currentPeriod - 1;
    const discipline = participatedTimes?.length / periodDiscipline;

    // RECUPERANDO TODOS OS RESULTADOS DO DIA
    const dailyResults = await Tracking.find({
      challengeId: challenge._id,
      register: {
        $lte: moment().endOf('day'),
        $gte: moment().startOf('day'),
      },
      operation: {
        $in: ['G', 'L'],
      },
    })
      .populate('userId', 'name photo')
      .select('userId amount operation');

    res.json({
      challenge,
      isParticipant: Boolean(userChallenge),
      dailyAmount,
      challengePeriod,
      participatedTimes: participatedTimes?.length,
      discipline,
      balance,
      challengeFinishedToday: Boolean(challengeFinishedToday),
      currentPeriod,
      dailyResults,
    });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

       
export default router;