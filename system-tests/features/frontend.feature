Feature: Frontend User Workflow

  As a user
  I want to log into the CloudWise platform
  So that I can use the orchestration engine

  Scenario: User visits the CloudWise homepage
    Given the user navigates to the cloud platform homepage
    When they observe the page title
    Then the browser title should contain "CloudWise"
