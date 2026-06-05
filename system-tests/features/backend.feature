Feature: Backend API Validation

  As a cloud developer
  I want to ensure the backend REST APIs return the correct cloud provider data
  So that the frontend dashboard renders correctly

  Scenario: Fetching cloud providers returns the default list
    Given the backend API is running at "http://localhost:8000"
    When I request the "/providers" endpoint
    Then the response status should be 200
    And the response should contain exactly 13 cloud providers
