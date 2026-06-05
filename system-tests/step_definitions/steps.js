const { Given, When, Then, BeforeAll } = require('@cucumber/cucumber');
const { actorCalled, actorInTheSpotlight } = require('@serenity-js/core');
const { Navigate, Page } = require('@serenity-js/web');
const { Ensure, includes } = require('@serenity-js/assertions');
const { Send, GetRequest, LastResponse } = require('@serenity-js/rest');

BeforeAll(() => {
    // any global setup
});

// --- Frontend Steps ---

Given('the user navigates to the cloud platform homepage', async function () {
    await actorCalled('Alice').attemptsTo(
        Navigate.to('/')
    );
});

When('they observe the page title', async function () {
    // we query in the "Then" step for simplicity or perform actions here
});

Then('the browser title should contain {string}', async function (expectedTitle) {
    await actorInTheSpotlight().attemptsTo(
        Ensure.that(Page.current().title(), includes(expectedTitle))
    );
});

// --- Backend API Steps ---

Given('the backend API is running at {string}', async function (baseUrl) {
    this.apiBaseUrl = baseUrl;
});

When('I request the {string} endpoint', async function (endpoint) {
    await actorCalled('API_Client').attemptsTo(
        Send.a(GetRequest.to(this.apiBaseUrl + endpoint))
    );
});

Then('the response status should be {int}', async function (expectedStatus) {
    await actorInTheSpotlight().attemptsTo(
        Ensure.that(LastResponse.status(), equals(expectedStatus))
    );
});

Then('the response should contain exactly {int} cloud providers', async function (expectedCount) {
    await actorInTheSpotlight().attemptsTo(
        Ensure.that(LastResponse.body().providers.length, equals(expectedCount))
    );
});

// Utility equal assertion (not natively exported like includes sometimes)
const { equals } = require('@serenity-js/assertions');
