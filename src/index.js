const express = require('express');
const bodyParser = require('body-parser');
const atob = require('atob')
const con = require('../config/database');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const app = express();

const serverless = require('serverless-http')
const router = express.Router()
// const PORT = process.env.PORT || 3000;

// Set up Global configuration access
dotenv.config();

// set body parser
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));

router.get('/', (req, res) => {
    res.json({
        nama : "hendro"
    })
})

// Register
router.post('/register', (req, res) => {
    const data = {...req.body};

    console.log(data);
    const querySql = 'INSERT INTO users SET ? '

     // jalankan query
     con.query(querySql, data, (err, rows, field) => {
        // error handling
        if (err) {
            return res.status(500).json({ message: 'Gagal insert data!', error: err });
        }

        // jika request berhasil
        res.status(201).json({ success: true, message: 'Berhasil insert data!' });
    });
})

// Login
router.post('/login', (req,res) => {
    const data = {...req.body};
    const querySearch = 'SELECT id, name, email, password FROM users WHERE email = ?';

    // jalankan query untuk melakukan pencarian data
    con.query(querySearch, data.email, (err, rows, field) => {
        // error handling
        if (err) {
            return res.status(500).json({ message: 'Email salah', error: err });
        }

        // jika id yang dimasukkan sesuai dengan data yang ada di db
        if (data.password != rows[0].password) {
            return res.status(500).json({ message: 'Password salah', error: err });
        }

        let jwtSecretKey = process.env.JWT_SECRET_KEY;
        let dataTok = {
            id : rows[0].id,
            name: rows[0].name,
            email: rows[0].email,
        }
      
        const token = jwt.sign(dataTok, jwtSecretKey);
      
        res.send(token);
    
})
})

// add Friend
router.post('/add-friend', (req, res) => {
    const data = {...req.body}

    const bearerHeader = req.headers['authorization']

    const bearer = atob(bearerHeader.split('.')[1])
    const bearerToken = JSON.parse(bearer)

    data.id = `${bearerToken.id}-${data.user_target}`
    data.user_login = `${bearerToken.id}`

    const querySql = 'INSERT INTO users_relation SET ? '

     // jalankan query
     con.query(querySql, data, (err, rows, field) => {
        // error handling
        if (err) {
            return res.status(500).json({ message: 'Gagal mengirim permintaan pertemanan!', error: err });
        }

        // jika request berhasil
        res.status(201).json({ success: true, message: 'Berhasil mengirim permintaan pertemanan!' });
    });
})

// acc friend
router.put('/acc-friend/:id', (req, res) => {
     // buat variabel penampung data dan query sql
     const data = { ...req.body };
     const querySearch = 'SELECT * FROM users_relation WHERE id = ?';
     const queryUpdate = 'UPDATE users_relation SET ? WHERE id = ?';
 
     // jalankan query untuk melakukan pencarian data
     con.query(querySearch, req.params.id, (err, rows, field) => {
         // error handling
         console.log(req.params.id);
         if (err) {
             return res.status(500).json({ message: 'Ada kesalahan', error: err });
         }
 
         // jika id yang dimasukkan sesuai dengan data yang ada di db
         if (rows.length) {
             // jalankan query update
             con.query(queryUpdate, [data, req.params.id], (err, rows, field) => {
                 // error handling
                 if (err) {
                     return res.status(500).json({ message: 'Ada kesalahan', error: err });
                 }
 
                 // jika update berhasil
                 res.status(200).json({ success: true, message: 'Berhasil update data!' });
             });
         } else {
             return res.status(404).json({ message: 'Data tidak ditemukan!', success: false });
         }
     });
})

// list user request follow friend
router.get('/list-acc-friend', (req, res) => {

    const bearerHeader = req.headers['authorization']
    const bearerHeaderSplit = bearerHeader.split('.')[1]
    const bearer = atob(bearerHeaderSplit)
    const bearerToken = JSON.parse(bearer)

    // buat query sql
    const querySql = 'SELECT user_login FROM users_relation WHERE user_target = ? AND is_accepted = 0';

    // jalankan query
    con.query(querySql, req.params.id = bearerToken.id, (err, rows, field) => {
        // error handling
        if (err) {
            return res.status(500).json({ message: 'Ada kesalahan', error: err });
        }


        // jika request berhasil

        res.status(200).json({ success: true, data: rows });
    });
})

// list friend
router.get('/list-friend', (req, res) => {

    const bearerHeader = req.headers['authorization']

    const bearer = atob(bearerHeader.split('.')[1])
    const bearerToken = JSON.parse(bearer)

    // buat query sql
    const querySql = 'SELECT user_login FROM users_relation WHERE user_target = ? AND is_accepted = 1';

    // jalankan query
    con.query(querySql, req.params.id = bearerToken.id, (err, rows, field) => {
        // error handling
        if (err) {
            return res.status(500).json({ message: 'Ada kesalahan', error: err });
        }


        // jika request berhasil

        res.status(200).json({ success: true, data: rows });
    });
})

// Reject User
router.delete('/reject/:id', (req, res) => {
 // buat query sql untuk mencari data dan hapus
 const querySearch = 'SELECT * FROM users_relation WHERE id = ?';
 const queryDelete = 'DELETE FROM users_relation WHERE id = ?';

 // jalankan query untuk melakukan pencarian data
 con.query(querySearch, req.params.id, (err, rows, field) => {
     // error handling
     if (err) {
         return res.status(500).json({ message: 'Ada kesalahan', error: err });
     }

     // jika id yang dimasukkan sesuai dengan data yang ada di db
     if (rows.length) {
         // jalankan query delete
         con.query(queryDelete, req.params.id, (err, rows, field) => {
             // error handling
             if (err) {
                 return res.status(500).json({ message: 'Ada kesalahan', error: err });
             }

             // jika delete berhasil
             res.status(200).json({ success: true, message: 'Berhasil hapus data!' });
         });
     } else {
         return res.status(404).json({ message: 'Data tidak ditemukan!', success: false });
     }
 });
})

// buat server nya
// app.listen(PORT, () => console.log(`Server running at port: ${PORT}`));
app.use(`/.netlify/functions/index`, router);
module.exports = app;
module.exports.handler = serverless(app)