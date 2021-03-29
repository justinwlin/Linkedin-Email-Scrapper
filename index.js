const puppeteer = require('puppeteer');
const fs = require('fs');
const ObjectsToCsv = require('objects-to-csv');
const csvReader = require('csv-parser');
const chalk = require('chalk');
var query = require('cli-interact').getYesNo;
const log = console.log;

const scrapeCompany = async (companyName, searchTerm) => {
    // LOCAL RUNNING ON COMPUTER
    const browser = await puppeteer.launch({
        headless: true,
    });
    const page = await browser.newPage();
    await page.goto('https://google.com');
    let company = companyName.toLowerCase();
    let myLocalValue = `site:linkedin.com \"@${company}.com\" \"${searchTerm}\" email`;
    await page.$eval('input[name=q]', (el, value) => el.value = value, myLocalValue);
    page.keyboard.press('Enter');
    await page.waitForNavigation();
    return await page.evaluate((company) => {
        function extractEmails(text) {
            return text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi);
        }
        let results = [...document.querySelectorAll('.g')];
        let temp = [];
        for (const elem of results) {
            temp.push({
                company: company,
                link: elem.querySelector('a').href.replace(/(\r\n|\n|\r)/gm, ""),
                description: elem.innerText.replace(/(\r\n|\n|\r)/gm, ""),
                email: extractEmails(elem.innerText)
            });
        }
        return temp;
    }, company);
    browser.close();
};

const driver = async () => {
    // Variable to change if you want to specify search term
    var searchTerm = 'recruiter';
    // Do not touch
    var arr = [];
    var results = [];
    log(chalk.blue('Hello, please make sure that the input.csv file has been written with the list of companies you want'));
    log(chalk.green('type y to continue'));
    ans = query('');
    if (!ans) {
        log(chalk.red('program shutting down, please restart'));
        return;
    }
    fs.createReadStream('input.csv')
        .pipe(csvReader())
        .on('data', (row) => {
            arr.push(row.company);
        })
        .on('end', async () => {
            console.log('CSV file successfully processed');
            for (const company of arr) {
                console.log(`Company ${company} is being processed`);
                companySearch = await scrapeCompany(company, searchTerm);
                results = [...results, ...companySearch];
            }
            let data = results;
            const csv = new ObjectsToCsv(data);
            await csv.toDisk('./output.csv');
            log(chalk.green('CSV file successfully written, please check the output.csv file'));
        });
};

driver();
