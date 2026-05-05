import { Builder, By, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import "chromedriver";

const APP_URL = "https://bark-buddy.vercel.app/";

//test/basic user login here
const TEST_EMAIL = "Martin1@gmail.com";
const TEST_PASSWORD = "Hello123";

async function runTest() {
  const options = new chrome.Options();
  options.addArguments("--headless=new");
  options.addArguments("--window-size=390,844");

  const driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  try {
    console.log("Opening BarkBuddy...");
    await driver.get(APP_URL);

    await driver.wait(
      until.elementLocated(By.xpath("//*[contains(text(),'BarkBuddy')]")),
      10000
    );
    console.log("PASS: App loaded");

    await driver.wait(
      until.elementLocated(By.xpath("//*[contains(text(),'Sign In')]")),
      10000
    );
    console.log("PASS: Login screen visible");

    const emailInput = await driver.findElement(By.css("input[type='email']"));
    const passwordInput = await driver.findElement(By.css("input[type='password']"));

    await emailInput.clear();
    await emailInput.sendKeys(TEST_EMAIL);

    await passwordInput.clear();
    await passwordInput.sendKeys(TEST_PASSWORD);

    const signInButton = await driver.findElement(
      By.xpath("//button[contains(text(),'Sign In')]")
    );

    await signInButton.click();
console.log("Clicked Sign In");

  // Wait a bit because Render can be slow to wake up
    await driver.sleep(5000);

    // Print current page text
    const bodyText = await driver.findElement(By.css("body")).getText();
    console.log("PAGE TEXT AFTER LOGIN:");
    console.log(bodyText);

    await driver.wait(
      until.elementLocated(
        By.xpath("//*[contains(text(),'Discover') or contains(text(),'Filters') or contains(text(),'Logged in as')]")
      ),
      30000
    );

    console.log("PASS: Basic user logged in");

    const filterButton = await driver.findElement(
      By.xpath("//button[contains(., 'Filter')]")
    );
    await filterButton.click();

    await driver.wait(
      until.elementLocated(By.xpath("//*[contains(text(),'Filters')]")),
      10000
    );
    console.log("PASS: Filter tab opens");

    const swipeButton = await driver.findElement(
      By.xpath("//button[contains(., 'Swipe')]")
    );
    await swipeButton.click();

    await driver.wait(
      until.elementLocated(By.xpath("//*[contains(text(),'Discover')]")),
      10000
    );
    console.log("PASS: Swipe tab opens");

    const messagesButton = await driver.findElement(
      By.xpath("//button[contains(., 'Messages')]")
    );
    await messagesButton.click();

    await driver.wait(
      until.elementLocated(By.xpath("//*[contains(text(),'Messages')]")),
      10000
    );
    console.log("PASS: Messages tab opens");

    console.log("Selenium UI test completed successfully.");
  } catch (error) {
    console.error("FAIL:", error.message);
    process.exitCode = 1;
  } finally {
    await driver.quit();
  }
}

runTest();