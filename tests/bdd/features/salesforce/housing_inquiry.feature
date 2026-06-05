Feature: Housing Inquiry Form
  As a visitor seeking housing assistance
  I want to submit an inquiry through the CCO United website
  So that a coordinator can connect me with the right program

  Scenario: Housing page loads with inquiry form
    Given I am on the CCO United home page
    When I navigate to "/housing"
    Then I should see the heading "Welcome Home"
    And I should see a form field labeled "Full Name"
    And I should see a form field labeled "Email Address"

  Scenario: Housing form has a submit button
    Given I am on the housing inquiry page
    Then I should see a button labeled "Send Inquiry"
