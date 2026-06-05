Feature: Monday-to-Salesforce ETL
  As a system administrator
  I want event data from Monday.com to appear in Salesforce
  So that the platform can serve as a migration demonstration

  Scenario: CCO United site is accessible
    Given I am on the CCO United home page
    Then I should see the heading "CCO United"

  Scenario: Navigation includes Events link
    Given I am on the CCO United home page
    Then I should see the navigation bar
    And I should see a link for "Events"

  # Phase 4: activate when Experience Cloud site is live
  # Scenario: Event list page shows migrated events
  #   Given I navigate to the Salesforce events page
  #   Then I should see at least one event record
  #   And each event should have a name and date
