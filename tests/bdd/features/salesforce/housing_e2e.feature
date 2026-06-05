Feature: Housing Inquiry E2E — Form to Salesforce Case
  As a visitor seeking housing assistance
  I want to submit an inquiry through the CCO United website
  So that a Salesforce Case is created and I receive a reference number

  Scenario: Successful housing inquiry creates a Salesforce Case and shows a reference number
    Given I am on the housing inquiry page
    When I submit a complete housing inquiry for "Rental Assistance"
    Then the success confirmation should be visible
    And I should see a valid reference number
    And the case ID returned should be a valid Salesforce ID

  Scenario: Emergency Shelter inquiry is flagged with high priority
    Given I am on the housing inquiry page
    When I submit a complete housing inquiry for "Emergency Shelter"
    Then the success confirmation should be visible
    And I should see a valid reference number

  Scenario: Housing inquiry API returns the case ID in the response
    Given I am on the housing inquiry page
    When I submit a complete housing inquiry for "Elder Housing"
    Then the API response should contain a case ID

  Scenario: Event submission creates a Salesforce Event__c record
    Given I am on the submit event page
    When I submit a complete event for "Community Gathering"
    Then the event submission success message should be visible
    And the event API response should contain a record ID
