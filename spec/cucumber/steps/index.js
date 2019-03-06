/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable func-names */
import { When, Then } from 'cucumber';
import superagent from 'superagent';
import assert from 'assert';

When(/creates a GET request to \/entry/, function() {
  this.request = superagent('GET', 'localhost:3000/entry');
});

When(/sends the request/, function(callback) {
  this.request
    .send()
    .then(response => {
      this.response = response.res;
      callback();
    })
    .catch(error => {
      this.response = error.response;
      callback();
    });
});

Then(/response with 200 status code/, function() {
  assert.equal(this.response.statusCode, 200);
});

Then(/the payload of the response should be a json object/, function() {
  assert(
    this.response.headers['content-type'].includes('application/json'),
    'json not mentioned in the response header!'
  );
  try {
    this.responsePayload = JSON.parse(this.response.text);
  } catch (err) {
    throw new Error('response is not JSON!');
  }
});
