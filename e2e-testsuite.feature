Feature: RunDecode latest landing, Strava activities flow, and manual FIT analysis
  As a runner
  I want clear entry points for Strava and manual FIT analysis
  So that I can move from landing page to activities dashboard to detailed AI analysis

  Background:
    Given the RunDecode web app is running

  @landing @desktop @mobile
  Scenario: Root landing page shows only two primary entry cards
    When I open the root page "/"
    Then I should see the RunDecode brand hero
    And I should see a card titled "Strava Activities Dashboard"
    And I should see a card titled "Manual FIT flow"
    And I should not see the athlete profile onboarding form on the landing page
    And I should not see the activities dashboard list on the landing page

  @landing @navigation
  Scenario: Landing page cards navigate to the correct routes
    Given I am on the root page "/"
    When I click "Open Activities Dashboard"
    Then I should navigate to "/activities"
    When I go back to the root page
    And I click "Manual Fit flow"
    Then I should navigate to "/manual"

  @activities @auth
  Scenario: Activities route shows Strava authorization card when user is not authenticated
    Given I am not authenticated with Strava
    When I open "/activities"
    Then I should see the heading "Activities Dashboard"
    And I should see a CTA labeled "Login to Strava"
    And I should not see the activity list yet

  @activities @callback
  Scenario: Successful Strava OAuth callback redirects into the activities route
    Given I start Strava OAuth from the app
    When Strava authorization succeeds
    Then the callback should redirect to "/activities"
    And the session tokens should be available to the activities flow

  @activities @onboarding
  Scenario: First authenticated visit requires athlete profile onboarding before activities are shown
    Given I am authenticated with Strava
    And my athlete profile is not complete
    When I open "/activities"
    Then I should see the onboarding title "Athlete Profile: Basic Information"
    And I should see the save action "Lưu profile"
    And I should not see the activities list yet

  @activities @validation
  Scenario: Name is required during athlete profile onboarding
    Given I am authenticated with Strava
    And my athlete profile is not complete
    When I submit the onboarding form without a name
    Then I should see the validation message "Name is required"
    And the profile should not be saved

  @activities @fetch
  Scenario: Completed profile unlocks auto-loading recent activities
    Given I am authenticated with Strava
    And my athlete profile has been saved successfully
    When I stay on "/activities"
    Then the app should automatically fetch recent activities
    And I should see a button labeled "Refresh Activities"
    And I should see a button labeled "View Profile"
    And I should see a connected state badge for Strava

  @activities @list
  Scenario: Auto-loaded recent activities render activity cards with detail CTA
    Given I am authenticated with Strava
    And my athlete profile has been saved successfully
    And Strava returns recent running activities
    When the activities dashboard finishes loading
    Then I should see activity cards in the activities dashboard
    And each activity card should show distance pace and date
    And each activity card should show a button labeled "See details & Analyze"
    And I should not see a model selector on the activities list route

  @profile @stats
  Scenario: Dedicated profile route shows editable athlete profile and readonly Strava stats
    Given I am authenticated with Strava
    When I open "/profile"
    Then I should see the heading "Athlete Profile"
    And I should see readonly "Strava athlete stats"
    And I should see the profile form for editing athlete information

  @activities @detail-navigation
  Scenario: Selecting an activity card opens the activity detail route
    Given I am viewing the activities dashboard with recent activities loaded
    When I click "See details & Analyze" on an activity card
    Then I should navigate to "/activities/{activity_id}"
    And I should see the activity name as the main heading
    And I should see a visible "Back to activities" control

  @activity-detail @analysis
  Scenario: Activity detail route shows richer Strava fields and analysis controls
    Given I am on "/activities/{activity_id}"
    And the selected activity exists in the current session or fetched fallback list
    And the app fetches Strava activity detail from the dedicated activity endpoint
    Then I should see sport type local time and description when available
    And I should see additional metrics such as avg speed max speed watts and elevation bounds
    Then I should see a model selector under "Select AI Model"
    And I should see a button labeled "Generate Report"
    And I should see a disabled or empty sync area before analysis is generated

  @activity-detail @mobile
  Scenario: Mobile activity detail keeps AI analysis above the fold
    Given I am on "/activities/{activity_id}" on a mobile viewport
    When the page is rendered
    Then the AI Analysis panel should appear before the route map and extra metrics
    And lower-priority activity visualizations should remain scrollable below

  @activity-detail @success
  Scenario: Generating analysis on the detail route produces editable AI output
    Given I am on "/activities/{activity_id}"
    And the activity has valid Strava stream data
    When I click "Generate Report"
    Then the app should call the Strava analyze API
    And I should see analysis content in the activity analysis textarea
    And the analysis should remain editable for follow-up actions

  @activity-detail @sync
  Scenario: Syncing generated analysis updates the Strava activity description
    Given I am on "/activities/{activity_id}"
    And an AI analysis has already been generated
    When I click "Sync to Strava"
    Then the app should call the Strava activity description endpoint
    And I should see a success hint if the sync completes

  @manual @upload
  Scenario: Manual FIT route still supports upload preview and AI analysis
    Given I open the route "/manual"
    When I upload a valid ".fit" file
    Then I should see parsed preview metadata
    And I should be able to click "Analyze Run"
    And successful analysis should show an editable analysis textarea

  @manual @validation
  Scenario: Manual FIT route still rejects invalid file extensions
    Given I open the route "/manual"
    When I upload a file named "run.tcx"
    Then I should see an error indicating only ".fit" files are accepted

  @manual @reset
  Scenario: Manual FIT analysis can still be reset for another run
    Given I have completed a manual FIT analysis
    When I click "Analyze Another Run"
    Then the previous analysis should be cleared
    And the manual upload form should be ready for a new file
    When metadata is rendered
    Then I should see distance pace time avg hr max hr cadence calories and elevation

  @ui @accessibility
  Scenario: Upload and action controls are keyboard accessible
    Given I navigate using keyboard only
    When I tab through interactive elements
    Then file input upload button copy button and reset button should be reachable
    And focused controls should display visible focus state

  @ui @mobile
  Scenario: Mobile viewport uses single-column layout
    Given I open the app on a viewport width smaller than 768px
    When the page is rendered
    Then upload and analysis content should be shown in a single-column layout
    And primary actions should remain thumb-reachable

  @ui @desktop
  Scenario: Desktop viewport expands to analysis and metadata layout
    Given I open the app on a viewport width at least 1024px
    When analysis is displayed
    Then analysis content and metadata should be arranged in expanded layout

  @ui @sticky-actions
  Scenario: Mobile sticky action bar remains available while scrolling analysis
    Given I am viewing a long analysis on mobile
    When I scroll through the analysis text
    Then copy and re-analyze actions should remain easy to access

  @ui @file-accept
  Scenario: File picker is constrained to .fit selection hint
    Given I open the file chooser from the upload area
    When available file filters are shown
    Then .fit should be the accepted file type hint

  @ui @dropzone
  Scenario: Drag and drop valid .fit file into dropzone
    Given I drag a valid .fit file over the dropzone
    When I drop the file into the dropzone
    Then the file should be accepted for upload
    And no validation error should be shown

  @ui @dropzone
  Scenario: Drag and drop invalid file shows immediate validation feedback
    Given I drag a non-.fit file over the dropzone
    When I drop the file
    Then the file should be rejected
    And I should see a validation message before submission

  @security @secrets
  Scenario: API key is not exposed to client runtime artifacts
    Given the app is running in browser context
    When I inspect client-side network and rendered source
    Then no Gemini API key value should be present

  @security @transport
  Scenario: Production deployment serves over HTTPS
    Given the app is deployed to production
    When I access the public URL
    Then requests should use HTTPS

  @resilience @ordering
  Scenario: Parser handles FIT files where session summary appears late
    Given I upload a valid .fit file where message order is non-linear
    When parsing completes
    Then required session metrics should still be extracted correctly

  @resilience @smart-recording
  Scenario: Parser handles smart-recording intervals without fixed 1-second cadence
    Given I upload a valid .fit file with irregular record intervals
    When derived metrics are computed
    Then pace volatility and drift calculations should still complete
    And no divide-by-zero or interval assumptions should break parsing

  @resilience @optional-metrics
  Scenario: Missing optional advanced metrics should not fail analysis
    Given I upload a valid .fit file lacking running dynamics and temperature fields
    When analysis is generated
    Then request should still succeed with status 200
    And analysis should gracefully omit unavailable metric commentary

  @resilience @pause-events
  Scenario: Pause and resume events are summarized when available
    Given I upload a valid .fit file containing timer stop and resume events
    When derived context is generated
    Then pause count and pause duration insights should be available for AI analysis

  @content @quality
  Scenario: Analysis remains plain text and editable after rendering
    Given analysis content is returned by API
    When it is shown to the user
    Then it should appear in an editable text area
    And text formatting should remain plain text without rich text editor artifacts

  @content @guardrails
  Scenario: Additional guardrails are included in user context to preserve output style
    Given parsed metrics are ready for prompt assembly
    When the final user context is built
    Then additional instructions should enforce concise and structured output
    And additional instructions should preserve attribution header requirement

  @flow @repeat
  Scenario: User can perform consecutive analyses in one session
    Given I completed one successful analysis
    When I reset and upload a second valid .fit file
    Then the second analysis should complete successfully
    And the second result should replace the first result in UI

  @flow @network
  Scenario: Network interruption during upload shows recoverable error
    Given I start uploading a valid .fit file
    When the network connection drops before request completion
    Then I should see a recoverable error message
    And I should be able to retry after connectivity is restored

  @flow @timeout
  Scenario: Long-running analysis shows persistent progress until completion
    Given I upload a valid .fit file
    When backend processing takes longer than typical duration
    Then loading state should remain visible until response arrives
    And the UI should not falsely indicate completion early

  @compliance @strava
  Scenario: Output is easy to copy and paste into Strava description
    Given analysis is displayed to the user
    When I copy and paste into a plain text destination
    Then the content should remain readable and sectioned
    And no markdown control syntax should be required for readability
