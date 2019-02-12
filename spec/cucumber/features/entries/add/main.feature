Feature: Add an entry

   Clients should be able to send a request to the API in order to add a new entry
   to the database of bibliographical records.

  Scenario: Correct payload

  If the user sends a valid POST request, a new entry is added to the 
  database. 

  When The client creates a POST request to /entries 
  And attaches a valid payload
  And sends the request
  Then the API should respond with a 200 code
  And the entry will be added to the database