const express = require('express');
const app = express();

const port = process.argv[2]

let x = 0;

app.get('/', function (req, res) {
   res.send(`counter: ${x++}`);
})

const server = app.listen(port, function () {
   const host = server.address().address
   const port = server.address().port
   
   console.log("Example app listening at http://%s:%s", host, port)
})
