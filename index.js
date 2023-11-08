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
let χώρες = [];
let επισκεφθείσεςΧώρες = [];
let αριθμόςΧωρών = 0;
let αριθμόςΕπισκεφθέντωνΧωρών = 0;

// Δεδομένα (Data)
// Λειτουργίες (Functions)
const λήψηΧωρών = async (req, res, next) => {
  const data = await db.query(`SELECT * FROM countries`);
  χώρες = data.rows;
  αριθμόςΧωρών = data.rowCount;
  next();
};

const λήψηΕπισκεφθέντωνΧωρών = async (req, res, next) => {
  const data = await db.query(`SELECT * FROM visited_countries`);
  αριθμόςΕπισκεφθέντωνΧωρών = data.rowCount;
  επισκεφθείσεςΧώρες = data.rows.map((row) => row.country_code);
  next();
};

// Ενδιάμεσες Λειτουργίες (Middleware)
διακ.use(bodyParser.urlencoded({ extended: true }));
διακ.use(express.static('public'));
διακ.use(λήψηΧωρών);
διακ.use(λήψηΕπισκεφθέντωνΧωρών);

// GET
διακ.get('/', async (req, res) => {
  console.log(
    'Επισκεφθείσες Χώρες:',
    αριθμόςΕπισκεφθέντωνΧωρών,
    επισκεφθείσεςΧώρες
  );
  res.render('index.ejs', {
    total: αριθμόςΕπισκεφθέντωνΧωρών,
    countries: επισκεφθείσεςΧώρες,
  });
  db.end;
});

// POST
διακ.post('/add', async (req, res) => {
  const νέαΧώρα = req.body.country;

  try {

    const αποτέλεσμα = await db.query(
      `SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%'`,
      [`${νέαΧώρα.toLowerCase()}`]
    )
    const κωδικόςΧώρας = αποτέλεσμα.rows[0].country_code

    // const δείκτηςΧώρας = χώρες.findIndex(
    //   (country) => country.country_name === νέαΧώρα
    // );
    // const κωδικόςΧώρας = χώρες[δείκτηςΧώρας].country_code;

    try {
      await db.query(
        'INSERT INTO visited_countries (country_code) VALUES ($1)',
        [`${κωδικόςΧώρας}`]
      );
      res.redirect('/');
    } catch (err) {
      res.render('index.ejs', {
        total: αριθμόςΕπισκεφθέντωνΧωρών,
        countries: επισκεφθείσεςΧώρες,
        error:
          'The country you are trying to add has already been added. Please try again!',
      });
    }
  } catch (err) {
    res.render('index.ejs', {
      total: αριθμόςΕπισκεφθέντωνΧωρών,
      countries: επισκεφθείσεςΧώρες,
      error: `The country you are trying to find doesn't exist with this name. Please try again!`,
    });
  }
});

// PUT
// PATCH
// DELETE

διακ.listen(πύλη, () => {
  console.log(
    `Διακομιστής: Ενεργός στην πύλη ${πύλη} --> http://localhost:${πύλη}`
  );
});
