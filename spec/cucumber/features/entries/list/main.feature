
Feature: List entries

  Clients should be able to get a list of all entries in the database.

  Scenario: requesting all the entries

    If the users sends a get request, he should get a 200 status code as a response
    and a list of all the entries in the database as JSON.

    When the user creates a GET request to /entry
    And sends the request
    Then the API should response with 200 status code
    And the payload of the response should be a json object