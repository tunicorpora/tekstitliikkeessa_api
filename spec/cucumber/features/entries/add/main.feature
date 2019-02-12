Feature: Add an entry

   Clients should be able to send a request to the API in order to add a new entry
   to the database of bibliographical records.

   Scenario: Adding an entry by a previously unused author

      If the user sends a valid POST request, a new entry is added to the
      database. A new author is created in the authors database

      When The client creates a POST request to /entries
      And attaches a valid payload
      And sends the request
      Then the API should respond with a 200 code
      And the entry will be added to the database

   Scenario: Adding an entry by a known author

      If the user sends a valid POST request, a new entry is added to the
      database. The database uses an author that is already known

      When The client creates a POST request to /entries
      And attaches a valid payload
      And sends the request
      Then the API should respond with a 200 code
      And the entry will be added to the database