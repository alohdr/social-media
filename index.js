const express = require('express');
const bodyParser = require('body-parser');
const con = require('./config/database');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const app = express();
const PORT = process.env.PORT || 3000;

// Set up Global configuration access
dotenv.config();

// set body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Register
app.post('/register', (req, res) => {
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
app.post('/login', (req,res) => {
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
app.post('/add-friend', (req, res) => {
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
app.put('/acc-friend/:id', (req, res) => {
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
app.get('/list-acc-friend', (req, res) => {

    const bearerHeader = req.headers['authorization']

    const bearer = atob(bearerHeader.split('.')[1])
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
app.get('/list-friend', (req, res) => {

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
app.delete('/reject/:id', (req, res) => {
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
app.listen(PORT, () => console.log(`Server running at port: ${PORT}`));