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
  // console.log('Ταξίδια σε χώρες:', ΦιλτραρισμένεςΧώρες);
  return ΦιλτραρισμένεςΧώρες;
};

const μετατροπήΤαξιδιώνΣεΚωδικούςΧωρών = (τΧρήστη) => {
  const ΦιλτραρισμένεςΧώρες = φιλτράρισμαΤαξιδιώνΧρήστη(τΧρήστη).map(
    (index) => {
      const δΧώρας = index.country_id - 1;
      return χώρες[δΧώρας].country_code;
    }
  );
  // console.log('Ταξίδια με κωδικούς χωρών', ΦιλτραρισμένεςΧώρες);
  return ΦιλτραρισμένεςΧώρες;
};

const μετατροπήΚωδικώνΣεΤαυτότητεςΧωρών = (κΧώρας) => {
  console.log('Κωδικός Νέας Χώρας', κΧώρας);
  const δΧώρας = χώρες.findIndex(country => country.country_code === κΧώρας)
  console.log('Δείκτης Νέας Χώρας', δΧώρας);
  const τΧώρας = χώρες[δΧώρας].id
  console.log('Ταυτότητα Νέας Χώρας', τΧώρας);
  return τΧώρας;
};

// Ενδιάμεσες Λειτουργίες Διακομιστή (Middleware)

const λήψηΧρηστών = async (req, res, next) => {
  const δεδομένα = await db.query(`SELECT * FROM users`);
  χρήστες = δεδομένα.rows;
  αριθμόςΧρηστών = χρήστες.length;
  // console.log('Χρήστες', αριθμόςΧρηστών, χρήστες)
  next();
};

const λήψηΧωρών = async (req, res, next) => {
  const δεδομένα = await db.query(`SELECT * FROM countries`);
  χώρες = δεδομένα.rows;
  αριθμόςΧωρών = χώρες.length;

  // console.log('Χώρες', χώρες, αριθμόςΧωρών)
  next();
};

const λήψηΕπισκεφθέντωνΧωρών = async (req, res, next) => {
  ταξίδια = await db.query(`SELECT * FROM visited_countries`);
  επισκεφθείσεςΧώρεςΧρήστη = μετατροπήΤαξιδιώνΣεΚωδικούςΧωρών(τρέχωνΧρήστης);
  αριθμόςΕπισκεφθέντωνΧωρών = επισκεφθείσεςΧώρεςΧρήστη.length;
  // console.log('Επισκεφθείσες Χώρες', αριθμόςΕπισκεφθέντωνΧωρών, επισκεφθείσεςΧώρεςΧρήστη)
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
  // console.log(
  //   `Επισκεφθείσες Χώρες ${χρήστες[τρέχωνΧρήστης - 1].name}:`,
  //   αριθμόςΕπισκεφθέντωνΧωρών,
  //   επισκεφθείσεςΧώρεςΧρήστη
  //   // χρήστες
  // );
  res.render('index.ejs', {
    total: αριθμόςΕπισκεφθέντωνΧωρών,
    countries: επισκεφθείσεςΧώρεςΧρήστη,
    users: χρήστες,
    color: 'teal',
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
      console.log('Έφτασα', κωδικόςΧώρας)
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
  req.body.new ? res.redirect('/new') : console.log('Χρήστης', req.body.user);
  if (req.body.user) {
    τρέχωνΧρήστης = req.body.user
  }
  console.log('Τρέχων Χρήστης', τρέχωνΧρήστης);

  επισκεφθείσεςΧώρεςΧρήστη = await μετατροπήΤαξιδιώνΣεΚωδικούςΧωρών(τρέχωνΧρήστης);
  res.render('index.ejs', {
    total: επισκεφθείσεςΧώρεςΧρήστη.length,
    countries: επισκεφθείσεςΧώρεςΧρήστη,
    users: χρήστες,
    color: 'teal',
  });
});

διακ.post('/new', async (req, res) => {
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
