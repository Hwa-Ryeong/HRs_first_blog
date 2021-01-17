const express = require('express');
const mysql = require('mysql');
const app = express();
const session = require('express-session');












const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "YakiImo1",
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
        res.locals.username = 'Person';
        console.log('not logged in');
        res.locals.isLoggedIn = false;
    } else {
        console.log('loggedin');
        res.locals.username = req.session.username;
        res.locals.isLoggedIn = true;
        const username = req.session.username;
    }
    next();
});

app.get('/', (req, res)=> {
    res.render('top.ejs');
});

app.get('/index', (req, res) => {
    connection.query(
        'select * from posts',
        (error, results) => {
            console.log(results);
            res.render('index.ejs', {posts: results});
        }
    );
});




app.get('/new', (req, res) => {
    res.render('new.ejs');

});

app.post('/create', (req, res) => {
    connection.query(
        'insert into posts(title, preview, content) values(?, ?, ?)',
        [req.body.title, req.body.preview, req.body.content],
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
        'update posts set content=? where id=?',
        [req.body.itemName, req.params.id],
        (error, results) =>{
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
                if(req.body.password == results[0].password) {
                    res.session.userId = results[0].id;
                    req.session.username = results[0].username;
                    console.log("login success!");
                    res.redirect('/');
                } else {
                    console.log('password is incorrect');
                    res.redirect('/login');
                }
            } else {
                console.log('no users with that email')
                res.redirect('/login');
            }      
        }
    );
});

app.get('/signup', (req, res) => {
    res.render('signup.ejs')
});

app.get('/login', (req, res) => {
    req.session.destroy((error)=> {
        res.redirect('/top');

    });
});

app.listen(3000);