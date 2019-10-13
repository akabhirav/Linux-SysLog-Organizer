const app = require('express')();
const port = process.env.PORT || 3000
const fs = require('fs')
const path = require('path')

app.get('/', (req, res) => {
    res.sendFile('index.html', {root: __dirname })
})

app.listen(port, () => {
    console.log(`Listening at PORT ${port}`);
})