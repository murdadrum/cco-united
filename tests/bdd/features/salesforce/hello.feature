Feature: CCO United home page
  As a visitor to the CCO United site
  I want to see the landing page loads correctly
  So that I know the platform is accessible

  Scenario: Home page displays the hero title
    Given I am on the CCO United home page
    Then I should see the heading "CCO United"

  Scenario: Navigation includes Events link
    Given I am on the CCO United home page
    Then I should see the navigation bar
    And I should see a link for "Events"
