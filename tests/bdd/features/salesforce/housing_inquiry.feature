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

  Scenario: Housing form blocks submission when required fields are missing
    Given I am on the housing inquiry page
    When I click the submit button without filling required fields
    Then the success confirmation should not be visible

  Scenario: Housing API error shows an inline error message
    Given I am on the housing inquiry page
    And the housing API will return an error
    When I submit a valid housing inquiry
    Then the success confirmation should not be visible
    And I should see an error message

  Scenario: District liaison lookup shows contact details for selected district
    Given I am on the housing inquiry page
    When I select a district from the liaison dropdown
    Then I should see a liaison contact card

  Scenario: Clicking Contact This Coordinator pre-fills the inquiry message
    Given I am on the housing inquiry page
    When I select a district from the liaison dropdown
    And I click the contact coordinator button
    Then the inquiry message field should be pre-filled
