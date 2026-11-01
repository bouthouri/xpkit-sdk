# Area: EX — XP Kit example app (examples/expo-app)

Feature: The example app shows XP Kit end to end

  @scenario-EX-01 @ios @android:todo
  Scenario: Onboarding, first badge, first level up, all kept after a relaunch
    Given a fresh install of the example app
    When I go through the 3 onboarding screens
    Then I see "Level: Beginner" and the "Starter" badge locked
    When I complete one action
    Then the "Starter" badge is unlocked
    When I complete 2 more actions
    Then I see "Level: Explorer" and "3 XP"
    When I close and reopen the app
    Then I still see "Level: Explorer", "3 XP" and the "Starter" badge unlocked
    And the onboarding does not show again
