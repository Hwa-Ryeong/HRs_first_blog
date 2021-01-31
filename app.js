const express = require('express');
const mysql = require('mysql');
const session = require('express-session');
const bcrypt = require('bcrypt');
const app = express();











const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "password",
    database: 'HRs_first_blog'
}); 

connection.connect((err) => {
    if (err) throw err;
    console.log('Connected!');
});

app.use(express.static('public'));
app.use(express.urlencoded({extended: false}));

app.use(
    session({
        secret: 'my_secret_key',
        resave: false,
        saveUninitialized: false,
    })
);






app.use((req, res, next) => {
    if (req.session.userId === undefined) {
        res.locals.username = 'My Friend!';
        console.log('not logged in');
        res.locals.isLoggedIn = false;
        
    } else {
        console.log('loggedin');
        res.locals.username = req.session.username;
        res.locals.isLoggedIn = true;
        const username = req.session.username;
        res.locals.userId = req.session.userId;
    }
    next();
});

app.get('/', (req, res)=> {
    res.render('top.ejs');
});

app.get('/index', (req, res) => {
    connection.query(
        'select posts.*, users.username from posts join users on users.id = author_id',
        (error, results) => {
            console.log(results);
            res.render('index.ejs', {posts: results});
        }
    );
});


app.get('/myposts', (req, res) => {
    connection.query(
        'select * from posts where author_id =?',
        [req.session.userId],        
        (error, results) => {
            console.log(results);
            res.render('myposts.ejs', {posts: results});
        }
    )
});


app.get('/new', (req, res) => {
    res.render('new.ejs');

});

app.post('/create', (req, res) => {
    connection.query(
        'insert into posts(title, preview, content, author_id) values(?, ?, ?, ?)',
        [req.body.title, req.body.preview, req.body.content, req.session.userId],
        (error, results) => {
            console.log(results);
            res.redirect('/index');
        }
    );

});

app.post('/delete/:id', (req, res)=>{
    connection.query(
        'delete from posts where id=?',
        [req.params.id],
        (error, results) => {
            res.redirect('/index');
        }
    );
    
});

app.get('/edit/:id', (req, res)=> {
    connection.query(
        'select * from posts where id=?',
        [req.params.id],
        (error, results) => {
            res.render('edit.ejs', {post: results[0]});
        }
        
    )
});

app.post('/update/:id', (req, res)=> {
    connection.query(
        'update posts set content=?, preview=?, title=? where id=?',
        [req.body.contentName, req.body.previewName, req.body.titleName, req.params.id],
        (error, results) =>{
            console.log(error);
            console.log(results);
            res.redirect('/index')
        }
        
    );
  
});

app.get('/login', (req, res)=> {
    res.render('login.ejs');
});

app.post('/login', (req, res)=> {
    const email= req.body.email;

    connection.query(
        'select * from users where email=?',
        [email],
        (error, results)=> {
            
            if (error !== null) {
                console.log(error);
                res.redirect('/login');
            }
            
            if (results.length > 0) {

                console.log('hash test:');
                bcrypt.hash('sa', 10, (error, hash) => {
                    console.log('attempt 1 hash: ', hash);
                })
                bcrypt.hash('sa', 10, (error, hash) => {
                    console.log('attempt 2 hash: ', hash);
                })
                
                bcrypt.compare(req.body.password, results[0].password, (error, isSame) => {
                    console.log('password', req.body.password);
                    // console.log('hash', hash);
                    console.log('results[0]', results[0].password);
                    if (isSame) {
                        req.session.userId = results[0].id;
                        req.session.username = results[0].username;
                        console.log("login success!");
                        res.redirect('/');

                    } else {
                        console.log('password is incorrect');
                        res.redirect('/login');
                    }
                });

               

            } else {
                console.log('no users with that email')
                res.redirect('/login');
            }      
        }
    );
});

app.get('/signup', (req, res) => {
    res.render('signup.ejs', {errors: []});
});

app.post('/signup', (req, res, next) => {
    console.log('check for empty value');
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    const errors = [];

    if(username === '') {
        errors.push('Username is empty');
    }

    if(email === '') {
        errors.push('Email is empty');
    }

    if (password === '') {
        errors.push('Password is empty');
    }

    if (errors.length > 0) {
        res.render('signup.ejs', {errors: errors});
    } else {
        next();
    }
},
(req, res, next) => {
    console.log('Check for muliple email');
    const email = req.body.email;
    const errors = [];

    connection.query(
        'select * from users where email = ?',
        [email],
        (error, results) => {
            if (results.lenght > 0) {
                errors.push('The email has been already used');
                res.render('signup.ejs', { errors: errors });
            } else {
                next();
            }
         }
    );
},
(req, res)=> {
    console.log('helloooo');
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    bcrypt.hash(password, 10, (error, hash)=> 
        connection.query(
            'insert into users(username, email, password) values (?, ?, ?)',
            [username, email, hash],
            (error, results) => {
                console.log('hash', hash);
                console.log(error);
                req.session.userId = results.insertId;
                req.session.username = username;
                res.redirect('/');
            }
        )
    )
});

app.get('/login', (req, res) => {
    req.session.destroy(error=> {
        res.redirect('/top');

    });
});

app.get('/content/:id', (req, res)=> {
    
    connection.query(
        'select * from posts where id=?',
        [req.params.id],
        (error, results) => {
            console.log(error);
            console.log('result: ', results);
            res.render('content.ejs', {posts: results[0]});
        }
    )
});

app.post('/logout', (req, res) => {
    console.log('POST received at /login');
    req.session.destroy(error => {
        res.redirect('/');
    });
});



app.listen(3000);

