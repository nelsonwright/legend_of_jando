# features/startPage.feature

Feature: Meaningful start page
  As a user of the game project
  I want to see a meaningful start page
  So that I can understand my setup choices

  Scenario: See correct title
    Given I am on the game project index page
    Then I should see "Nelson and Lewis' game project: the Legend of Jando - Choose Hero" as the page title