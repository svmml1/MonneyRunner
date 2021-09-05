import mongoose from 'mongoose';

const URI = 'mongodb+srv://money-runners:wFwXKhNzK790zu7O@dev.s8dma.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';
//wFwXKhNzK790zu7O
let options = {};

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

mongoose
  .connect(URI, options)
  .then(() => console.log('DB is Up!'))
  .catch((err) => console.log(err));