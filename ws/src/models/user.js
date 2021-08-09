import mongoose from 'mongoose';
const Schema = mongoose.Schema;


const User = new Schema({

    name: {
        type: String,
        required: [true, 'Nome é obrigatório'],
      },
});

export default mongoose.model('User', User)