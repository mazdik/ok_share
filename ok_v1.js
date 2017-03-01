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

function login() {
	return new webdriver.promise.Promise(function(resolve, reject) {
		driver.get('https://ok.ru/');
		driver.findElement(by.name('st.email')).sendKeys(settings.account_username);
		driver.findElement(by.name('st.password')).sendKeys(settings.account_password);
		driver.findElement(by.xpath('//*[@id="loginContentBlock"]/form/div[5]/input')).then(function(button) {
			button.click();
		}, function(err) {
	        logger.error('No login');
        });;
		resolve();
	});
}

function share(url) {
	return new webdriver.promise.Promise(function(resolve, reject) {
		driver.get('https://connect.ok.ru/offer?url=' + url);
		driver.findElement(by.css('button')).then(function(button) {
			button.click();
			logger.debug('OK: '+ url);
		}, function(err) {
	        logger.error('No shared: '+ url);
        });
		resolve();
	});
}

function share_animals() {
	let links = [];
	let limit = promiseLimit(1);
	driver.get('http://getanimal.ru/animals');
	let spans = driver.findElements(webdriver.By.css('h2 > a'));
	return webdriver.promise.filter(spans, function(span) {
	    return span.getAttribute('href').then(function(value) {
	        links.push(value);
	        return true;
	    });
	}).then(function(filteredSpans) {
		if(links.length <= 0) {
			logger.error('getanimal no links');
			return;
		}
		login().then(function() {
			return Promise.all(links.map(function(link) {
				return new Promise(function(resolve, reject) {
					return limit(function() {
			    		return share(link).then(function() {
			    			resolve(link);
			    		});
			    	});
		    	});
			}));
		});
	}, function(err) {
		logger.error('getanimal error');
	});
}

share_animals().then(function() {
	driver.quit();
});

/*login().then(function() {
	share('http://getanimal.ru/animals/ocharovatelnye_shenochki_v_dar_1488200662').then(function() {
		driver.quit();
	});
});
*/
