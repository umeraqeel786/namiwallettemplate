import path from 'path'
import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import env from 'dotenv';

const app = express()

if (process.env.NODE_ENV !== 'production') {
    env.config();
}

app.use(express.static(process.cwd()+"/dist/", { maxAge: "365d"}));
app.use(cors({origin: [
    'http://127.0.0.1',
    'http://localhost:4200'
  ]}));
  
// Configure CORS
app.use((req, res, next) => {
res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
);

res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
next();
});

app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)
// feel free to add your API endpoints here

const PORT = process.env.PORT || 80
const server = app.listen(PORT, () => {
    console.log(`App listening to ${PORT}....`)
    console.log('Press Ctrl+C to quit.')
});