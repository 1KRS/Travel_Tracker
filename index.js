import express from 'express';
import bodyParser from 'body-parser';
import pg from 'pg';
import 'dotenv/config';

const διακ = express();
const πύλη = 3000;

const db = new pg.Client({
  user: 'postgres',
  host: 'localhost',
  database: 'world',
  password: process.env.DATABASE_PASSWORD,
  port: 5432,
});

db.connect();

// Αρχικές Τιμές (Initial Values)
var επισκεφθέντεςΧώρες = [];
var σύνολοΧωρών = 0;

// Δεδομένα (Data)
// Λειτουργίες (Functions)
// Ενδιάμεσες Λειτουργίες (Middleware)
διακ.use(bodyParser.urlencoded({ extended: true }));
διακ.use(express.static('public'));

// GET
διακ.get('/', async (req, res) => {
  await db.query(`SELECT * FROM visited_countries`, (err, res) => {
    if (err) {
      console.log('Πρόβλημα ολοκλήρωσης αναζήτησης', err.stack);
    } else {
      σύνολοΧωρών = res.rowCount
      επισκεφθέντεςΧώρες = res.rows.map(row => row.country_code) 
    }
  });
  console.log('Επισκεφθέντες Χώρες:', σύνολοΧωρών, επισκεφθέντεςΧώρες);
  res.render('index.ejs', {total: σύνολοΧωρών, countries: επισκεφθέντεςΧώρες})
  db.end
});

// POST
// PUT
// PATCH
// DELETE

διακ.listen(πύλη, () => {
  console.log(
    `Διακομιστής: Ενεργός στην πύλη ${πύλη} --> http://localhost:${πύλη}`
  );
});
