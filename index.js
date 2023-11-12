import express from 'express';
import bodyParser from 'body-parser';
import pg from 'pg';
import 'dotenv/config';

// Σύνδεση σε Διακομιστή (Connect to Server)
const διακ = express();
const πύλη = 3000;

// Σύνδεση σε Βάση Δεδομένων (Connect to Database)
const db = new pg.Client({
  user: 'postgres',
  host: 'localhost',
  database: 'world',
  password: process.env.DATABASE_PASSWORD,
  port: 5432,
});

db.connect();

// Αρχικές Τιμές (Initial Values)
let τρέχωνΧρήστης = 1;
let χρώμαΧρήστη = 'teal'
let χρήστες = [];
let χώρες = [];
let ταξίδια = [];
let επισκεφθείσεςΧώρεςΧρήστη = [];
let αριθμόςΧρηστών = 0;
let αριθμόςΧωρών = 0;
let αριθμόςΕπισκεφθέντωνΧωρών = 0;

// Δεδομένα (Data)
let users = [
  { id: 1, name: 'Angela', color: 'teal' },
  { id: 2, name: 'Jack', color: 'powderblue' },
];

// Λειτουργίες (Functions)
const φιλτράρισμαΤαξιδιώνΧρήστη = (τΧρήστη) => {
  const ΦιλτραρισμένεςΧώρες = ταξίδια.rows.filter(
    (index) => index.user_id == τΧρήστη
  );
  return ΦιλτραρισμένεςΧώρες;
};

const μετατροπήΤαξιδιώνΣεΚωδικούςΧωρών = (τΧρήστη) => {
  const ΦιλτραρισμένεςΧώρες = φιλτράρισμαΤαξιδιώνΧρήστη(τΧρήστη).map(
    (index) => {
      const δΧώρας = index.country_id - 1;
      return χώρες[δΧώρας].country_code;
    }
  );
  return ΦιλτραρισμένεςΧώρες;
};

const μετατροπήΚωδικώνΣεΤαυτότητεςΧωρών = (κΧώρας) => {
  const δΧώρας = χώρες.findIndex(country => country.country_code === κΧώρας)
  const τΧώρας = χώρες[δΧώρας].id
  return τΧώρας;
};

// Ενδιάμεσες Λειτουργίες Διακομιστή (Middleware)

const λήψηΧρηστών = async (req, res, next) => {
  const δεδομένα = await db.query(`SELECT * FROM users`);
  χρήστες = δεδομένα.rows;
  αριθμόςΧρηστών = χρήστες.length;
  next();
};

const λήψηΧωρών = async (req, res, next) => {
  const δεδομένα = await db.query(`SELECT * FROM countries`);
  χώρες = δεδομένα.rows;
  αριθμόςΧωρών = χώρες.length;

  next();
};

const λήψηΕπισκεφθέντωνΧωρών = async (req, res, next) => {
  ταξίδια = await db.query(`SELECT * FROM visited_countries`);
  επισκεφθείσεςΧώρεςΧρήστη = μετατροπήΤαξιδιώνΣεΚωδικούςΧωρών(τρέχωνΧρήστης);
  αριθμόςΕπισκεφθέντωνΧωρών = επισκεφθείσεςΧώρεςΧρήστη.length;
  next();
};

διακ.use(bodyParser.urlencoded({ extended: true }));
διακ.use(express.static('public'));
διακ.use(λήψηΧρηστών);
διακ.use(λήψηΧωρών);
διακ.use(λήψηΕπισκεφθέντωνΧωρών);
// db.end;

// GET
διακ.get('/', async (req, res) => {
  res.render('index.ejs', {
    total: αριθμόςΕπισκεφθέντωνΧωρών,
    countries: επισκεφθείσεςΧώρεςΧρήστη,
    users: χρήστες,
    color: χρώμαΧρήστη
  });
});

// POST
διακ.post('/add', async (req, res) => {
  const νέαΧώρα = req.body.country;
  let κωδικόςΧώρας = '';
  let ταυτότηταΧώρας = '';
  
  console.log('Νέα Χώρα', νέαΧώρα);
  let error = '';

  if (νέαΧώρα === 'Μακεδονία' || νέαΧώρα === 'Macedonia') {
    error =
      'There is no country named Macedonia. Macedonia was a Greek Kingdom and today is a Greek peninsula in Northern Greece. Do you mean North Macedonia or Skopje perhaps? Try again!';
  }

  try {
    if (νέαΧώρα === 'Μακεδονία' || νέαΧώρα === 'Macedonia') {
      κωδικόςΧώρας = -1;
    } else {
      const αποτέλεσμα = await db.query(
        `SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%'`,
        [`${νέαΧώρα.toLowerCase()}`]
      );
      κωδικόςΧώρας = αποτέλεσμα.rows[0].country_code;
      ταυτότηταΧώρας = μετατροπήΚωδικώνΣεΤαυτότητεςΧωρών(κωδικόςΧώρας)
    }

    try {
      await db.query(
        'INSERT INTO visited_countries (user_id, country_id) VALUES ($1, $2)',
        [`${τρέχωνΧρήστης}`, `${ταυτότηταΧώρας}`]
      );
      res.redirect('/');
    } catch (err) {
      res.render('index.ejs', {
        total: αριθμόςΕπισκεφθέντωνΧωρών,
        countries: επισκεφθείσεςΧώρεςΧρήστη,
        users: χρήστες,
        color: 'teal',
        error:
          error ||
          'The country you are trying to add has already been added. Please try again!',
      });
    }
  } catch (err) {
    res.render('index.ejs', {
      total: αριθμόςΕπισκεφθέντωνΧωρών,
      countries: επισκεφθείσεςΧώρεςΧρήστη,
      users: χρήστες,
      color: 'teal',
      error:
        error ||
        `The country you are trying to find doesn't exist with this name. Please try again!`,
    });
  }
});

διακ.post('/user', async (req, res) => {
  if (req.body.add) {
    res.render('new.ejs')
  }
  if (req.body.user) {
    τρέχωνΧρήστης = req.body.user
    χρώμαΧρήστη = χρήστες.find(χ => χ.id == τρέχωνΧρήστης).color
  }

  επισκεφθείσεςΧώρεςΧρήστη = await μετατροπήΤαξιδιώνΣεΚωδικούςΧωρών(τρέχωνΧρήστης);
  res.render('index.ejs', {
    total: επισκεφθείσεςΧώρεςΧρήστη.length,
    countries: επισκεφθείσεςΧώρεςΧρήστη,
    users: χρήστες,
    color: χρώμαΧρήστη,
  });
});

διακ.post('/new', async (req, res) => {
  const νέοςΧρήστης = req.body.name
  const χρώμαΧρήστη = req.body.color

  await db.query(
    'INSERT INTO users (name, color) VALUES ($1, $2)',
    [`${νέοςΧρήστης}`, `${χρώμαΧρήστη}`]
  );
  res.redirect('/');
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
});

// PUT
// PATCH
// DELETE

διακ.listen(πύλη, () => {
  console.log(
    `Διακομιστής: Ενεργός στην πύλη ${πύλη} --> http://localhost:${πύλη}`
  );
});
