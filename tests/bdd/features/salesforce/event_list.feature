Feature: Public Events Calendar
  As a community member
  I want to browse upcoming CCO United events
  So that I can attend programs relevant to my interests

  Scenario: Events page loads with correct heading
    Given I am on the CCO United home page
    When I navigate to "/events"
    Then I should see the heading "Upcoming Events"

  Scenario: Events page shows the events grid
    Given I am on the events page
    Then I should see the events grid container

  Scenario: Events page has view toggle controls
    Given I am on the events page
    Then I should see a button labeled "Grid"
    And I should see a button labeled "List"
    And I should see a button labeled "Calendar"

  Scenario: Events API returning empty results does not crash the page
    Given the events API returns an empty list
    When I navigate to "/events"
    Then I should see the heading "Upcoming Events"

  Scenario: Events subscribe section is present
    Given I am on the events page
    Then I should see the events subscribe section

  Scenario: Navigating directly to a non-existent event shows a fallback
    When I navigate to "/events/nonexistent-00000000"
    Then I should see the site navigation
