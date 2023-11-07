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

διακ.use(bodyParser.urlencoded({ extended: true }));
διακ.use(express.static('public'));

διακ.get('/', async (req, res) => {
  // res.render('index.ejs', {total: 275 })
  //Write your code here.
});

διακ.listen(πύλη, () => {
  console.log(
    `Διακομιστής: Ενεργός στην πύλη ${πύλη} --> http://localhost:${πύλη}`
  );
});
