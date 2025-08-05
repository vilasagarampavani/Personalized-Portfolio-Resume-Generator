var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
const app = express();
var path = require('path');
const JWT_SECRET = 'resume_generate';

app.use(bodyParser.json());
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'templates')));
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect('mongodb://127.0.0.1:27017/project', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
var db = mongoose.connection;
db.on('error', () => console.log("Error connecting to the Database"));
db.once('open', () => console.log("Connected to the Database"));

var userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String
});
var User = mongoose.model('User', userSchema);

app.post("/register", async (req, res) => {
  var name = req.body.name;
  var email = req.body.email;
  var password = req.body.password;
  var hashedPassword = await bcrypt.hash(password, 10);
  var data = {
    "name": name,
    "email": email,
    "password": hashedPassword
  }

  db.collection('users').insertOne(data, (err, collection) => {
    if (err) { 
      throw err;
    }
    console.log("Record Inserted Successfully");
  });
  return res.redirect('login.html');
});

app.post("/login", async (req, res) => {
  var email = req.body.email;
  var password = req.body.password;
  var user = await User.findOne({ email: email });
  if (!user) {
    return res.status(400).send('Invalid email or password');
  }
  var validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(400).send('Invalid email or password');
  }
  var token = jwt.sign({ _id: user._id }, JWT_SECRET, { expiresIn: '1h' });
  res.header('auth-token', token).send({ token: token });
});

app.get('/', (req, res) => {res.sendFile(path.join(__dirname, 'public', 'register.html'));});
app.listen(3000, () => {console.log("Listening on port 3000");});