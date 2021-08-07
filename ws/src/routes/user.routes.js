
import express from 'express';
import morgan from 'morgan';
import Busboy from 'busboy';
import busboyBodyParser from 'busboy-body-parser';
import mongoose from 'mongoose'

import aws from '../services/aws'

const router = express.Router();

router.post('/', async (req, res) => {
  var busboy = new Busboy({ headers: req.header});
  busboy.on('finish', async () => {
      try {

        const userId = mongoose.Types.ObjectId()
        //UPLOAD DA IMAGE
        
        if (req.files) {
            const file = req.files.photo;

            const nameParts = file.name.split('.');
            const fileName = `${userId}.${nameParts[nameParts.length -1]}`;
            photo = `user/${fileName}`;

            const response = await aws.uploadToS3(file, photo);

            if (response.error) {
                res.json({
                    error: true,
                    message: response.message,
                });
                return false
            }
        }

        //CRIAR USUÁRIO

      } catch(err) {
        res.json({ error: true, message: err.message})
      }
  });
  req.pipe(busboy)
})


export default router;