var webdriver = require('selenium-webdriver'),
    by = webdriver.By,
    until = webdriver.until,
    chrome = require('selenium-webdriver/chrome'),
    firefox = require('selenium-webdriver/firefox');

var settings = require('./settings.json');
var logger = require('./logger');
var promiseLimit = require('promise-limit');

var userAgent = 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.120 Safari/537.36';

//setup custom Chrome capability
var chromedriver_exe = require('chromedriver').path;
var customChrome = webdriver.Capabilities.chrome();
customChrome.set("chrome.binary.path", chromedriver_exe);

//setup custom phantomJS capability
var phantomjs_exe = require('phantomjs-prebuilt').path;
var customPhantom = webdriver.Capabilities.phantomjs();
customPhantom.set("phantomjs.binary.path", phantomjs_exe);
customPhantom.set("phantomjs.page.settings.userAgent", userAgent);
customPhantom.set("phantomjs.page.settings.loadImages", false);
customPhantom.set("phantomjs.page.settings.localToRemoteUrlAccessEnabled", true);
if(settings.proxy !== "") {
customPhantom.set("phantomjs.cli.args",["--proxy="+settings.proxy,"--proxy-auth="+settings.proxyuserpwd,"--web-security=no","--ignore-ssl-errors=yes"]);
}

var driver;
if (settings.chrome == 1) {
    driver = new webdriver.Builder().withCapabilities(customChrome).build();
} else if (settings.firefox == 1) {
    driver = new webdriver.Builder().forBrowser('firefox').build();
} else {
    driver = new webdriver.Builder().withCapabilities(customPhantom).build();
}

async function login() {
	try {
		await driver.get('https://ok.ru/');
		await driver.findElement(by.name('st.email')).sendKeys(settings.account_username);
		await driver.findElement(by.name('st.password')).sendKeys(settings.account_password);
		await driver.findElement(by.xpath('//*[@id="loginContentBlock"]/form/div[5]/input')).click();
    } catch (e) {
        logger.error('No login');
    }
}

async function share(url) {
	try {
		await driver.get('https://connect.ok.ru/offer?url=' + url);
		await driver.findElement(by.css('button')).click();
		logger.debug('OK: '+ url);
    } catch (e) {
        logger.error('No shared: '+ url);
    }
}

async function share_all(links) {
    await Promise.all(links.map(async (link) => {
    	await share(link);
    }));
}

function get_links() {
	return new Promise(function(resolve, reject) {
		let links = [];
		driver.get('http://getanimal.ru/animals');
		let spans = driver.findElements(webdriver.By.css('h2 > a'));
		return webdriver.promise.filter(spans, function(span) {
		    return span.getAttribute('href').then(function(value) {
		        links.push(value);
		        return true;
		    });
		}).then(function(filteredSpans) {
			resolve(links);
		}, function(err) {
			reject('get_links error');
		});
	});
}

async function share_animals1() {
    let links = [];
    try {
        links = await get_links();
    } catch (e) {
        logger.error(e);
    }
    if (links.length <= 0) {
        logger.error('getanimal no links');
    } else {
        await login();
        await share_all(links);
        await driver.quit();
    }
}

share_animals1();