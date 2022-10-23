# BNI Scraper

Web scraping using NODEJS (cheerio & axios) under the hood

## Installation

```
npm install nodejs-bni-scraper
```

## Usage

```
const BNI = require('nodejs-bni-scraper');

// Get Balance
const balance = await BNI.getBalance('username', 'password');
console.log(balance); // { status: true, data: { balance: 1000 } }

const mutation = await BNI.getMutation('username', 'password', '20-Oct-2022', '22-Oct-2022');
console.log(mutation); // { status: true, data: { no_rek: '1234567xxxx', values: [] } }

```

Hopefully you find this useful !
Any feedback ? Please open issue ! :D Thanks
