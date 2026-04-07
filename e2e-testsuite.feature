Feature: RunDecode end-to-end run analysis from .fit to Vietnamese AI report
  As a runner
  I want to upload a valid Zepp/Amazfit .fit file and receive editable Vietnamese analysis
  So that I can quickly post high-quality insights to Strava

  Background:
    Given the RunDecode web app is running
    And I open the main upload page

  @happy @upload
  Scenario: Upload a valid .fit file and get a successful analysis response
    Given I have a valid file named "Zepp20260406192022.fit" smaller than 4MB
    When I upload the file from the main form
    Then I should see a loading state indicating analysis is in progress
    And the API should respond with status 200
    And I should see an editable analysis text area
    And I should see metadata cards for core run metrics

  @happy @api
  Scenario: Successful API response returns required JSON contract fields
    Given I upload a valid ".fit" file with parseable session data
    When the analysis request is processed
    Then the response body should include "analysis"
    And the response body should include "metadata"
    And "analysis" should be plain text
    And "metadata" should include distance pace time avg_hr max_hr cadence_spm calories elevation_gain_m

  @happy @analysis
  Scenario: Analysis includes required AI attribution header
    Given I upload a valid ".fit" file
    When analysis is completed
    Then the analysis output should start with "Báo cáo phân tích chạy (Analysis by AI)"

  @happy @editing
  Scenario: User can edit the generated analysis before copying
    Given I have received a successful analysis
    When I modify the text inside the analysis area
    Then my edited content should remain visible
    And the original generated text should not be forcibly restored

  @happy @clipboard
  Scenario: Copy button copies edited text content
    Given I have edited the analysis text
    When I tap "Copy to Clipboard"
    Then the clipboard should contain the edited analysis text
    And I should see a "Copied!" feedback message

  @happy @reset
  Scenario: Analyze another run resets current state
    Given I have a completed analysis on screen
    When I tap "Analyze Another Run"
    Then the file input should be reset
    And the previous analysis text should be cleared
    And the upload form should be ready for a new file

  @validation @extension
  Scenario: Reject file with non-fit extension
    Given I have a file named "activity.tcx"
    When I upload the file from the main form
    Then the API should respond with status 400
    And I should see an error about invalid file type
    And no AI analysis should be triggered

  @validation @extension
  Scenario: Reject uppercase wrong extension despite valid binary data
    Given I have a file named "activity.FITX" containing FIT-like bytes
    When I upload the file
    Then the request should be rejected with status 400
    And the error should mention accepted extension is ".fit"

  @validation @mime
  Scenario: Reject file with disallowed MIME type
    Given I have a file named "run.fit" with MIME type "text/plain"
    When I upload the file
    Then the API should respond with status 400
    And I should see an error about MIME type not allowed

  @validation @signature
  Scenario: Reject file that has .fit extension but invalid FIT signature marker
    Given I have a file named "run.fit" without the FIT signature marker in header
    When I upload the file
    Then the API should respond with status 400
    And I should see an error about invalid FIT signature

  @validation @filesize
  Scenario: Reject file larger than 4MB
    Given I have a valid ".fit" file larger than 4MB
    When I upload the file
    Then the API should respond with status 413
    And I should see an error indicating file is too large
    And no parsing should be performed

  @validation @boundary
  Scenario: Accept file exactly at 4MB boundary
    Given I have a valid ".fit" file with size exactly 4MB
    When I upload the file
    Then the API should continue to parsing
    And the request should not fail with 413

  @validation @missing
  Scenario: Reject request with missing file field
    Given I submit analyze-fit request without attaching any file
    When the server validates the request
    Then the API should respond with status 400
    And I should see an error indicating file is required

  @validation @multifile
  Scenario: Reject request with multiple files when single upload is expected
    Given I attach two valid ".fit" files in one request
    When I submit the analysis request
    Then the API should respond with status 400
    And the error should indicate only one file is supported

  @parsing @session
  Scenario: Parse session metrics from valid FIT payload
    Given I upload a valid .fit file with session fields present
    When the parser decodes the FIT messages
    Then the parsed output should include session total distance in km
    And the parsed output should include total timer time in HH:MM:SS
    And the parsed output should include avg and max heart rate
    And the parsed output should include total calories
    And the parsed output should include cadence in spm
    And the parsed output should include average pace in min per km

  @parsing @lap
  Scenario: Parse lap messages for lap-by-lap analysis
    Given I upload a valid .fit file containing lap messages
    When parsing is completed
    Then each lap should include lap number distance time avg_hr avg_pace and cadence
    And laps should be ordered by lap number

  @parsing @fallback
  Scenario: Continue with session-only analysis when lap data is absent
    Given I upload a valid .fit file that has session data but no laps
    When parsing and analysis are executed
    Then the request should still succeed with status 200
    And the analysis should use available session-level context

  @parsing @record-derived
  Scenario: Use record stream only for derived metrics and fallbacks
    Given I upload a valid .fit file with session and record messages
    When metrics are prepared for AI
    Then session summary should be used as primary source
    And record data should be used only for derived indicators like drift and stability

  @parsing @invalid-data
  Scenario: Reject parsed run when total distance is zero
    Given I upload a .fit file whose parsed session total distance is zero
    When parser validation runs
    Then the API should respond with status 422
    And I should see a parse validation error

  @parsing @invalid-data
  Scenario: Reject parsed run when average heart rate is outside valid range
    Given I upload a .fit file whose parsed average heart rate is below 40 or above 200
    When parser validation runs
    Then the API should respond with status 422
    And I should see a parse validation error for heart rate

  @privacy @gps
  Scenario: GPS coordinates are stripped before AI request
    Given I upload a valid .fit file containing record-level latitude and longitude
    When the AI payload is assembled
    Then latitude fields should not be present in the AI payload
    And longitude fields should not be present in the AI payload

  @privacy @device
  Scenario: Device identifiers are stripped before AI request
    Given I upload a valid .fit file containing device serial identifiers
    When the AI payload is assembled
    Then device identifier fields should not be present in the AI payload

  @privacy @logging
  Scenario: Raw GPS traces are not logged by the backend
    Given I upload a valid .fit file containing GPS traces
    When the server processes the request
    Then server logs should not include raw latitude or longitude values

  @prompt @order
  Scenario: Prompt assembly follows strict ordering rules
    Given parsed fit data is available
    When the Gemini request is constructed
    Then the first part should be the system prompt constant
    And the second part should be structured parsed data context
    And the third part should be additional guardrails instructions

  @prompt @source-of-truth
  Scenario: Prompt uses in-code constant instead of runtime markdown file loading
    Given the analysis request is prepared on the backend
    When prompt source is resolved
    Then the system instruction should come from a TypeScript constant
    And no runtime filesystem read of markdown prompt files should occur

  @ai @model
  Scenario: Gemini request targets the configured default model
    Given a valid analysis request is ready for AI
    When the backend calls the AI provider
    Then the requested model should be "gemini-1.5-flash"

  @ai @language
  Scenario: Generated analysis is in Vietnamese plain text
    Given a valid .fit analysis is generated
    When I inspect the analysis content
    Then the output should be Vietnamese text
    And the output should not contain markdown headings or markdown list syntax

  @ai @metadata
  Scenario: Response includes model metadata and token usage metadata when available
    Given a successful AI completion
    When the API returns the response payload
    Then the payload should include model metadata
    And token usage metadata should be present when provider returns it

  @ai @retry
  Scenario: Retry once on transient AI rate-limit failure
    Given the first AI call fails due to a transient rate limit
    When the backend retry policy is applied
    Then the system should retry exactly once
    And if the retry succeeds the API should return status 200

  @ai @failure
  Scenario: Return graceful error when AI request fails after retry
    Given AI request fails and retry also fails
    When backend maps the failure
    Then the API should respond with status 500
    And the response should contain a safe retry-friendly message

  @api @error-mapping
  Scenario Outline: API returns correct status code for failure categories
    Given a request failure of type "<failureType>"
    When the backend handles the failure
    Then the API should return status <statusCode>

    Examples:
      | failureType              | statusCode |
      | invalid extension        | 400        |
      | invalid mime             | 400        |
      | invalid signature        | 400        |
      | file too large           | 413        |
      | parse validation failure | 422        |
      | model provider failure   | 500        |

  @ui @loading
  Scenario: Loading state is shown during backend processing
    Given I submit a valid .fit file
    When the analysis request is in progress
    Then upload controls should be disabled
    And a loading spinner should be visible
    And a status message should indicate processing

  @ui @errors
  Scenario: Error alert appears with retry action when processing fails
    Given a file analysis request fails
    When the page receives an error response
    Then an error alert should be displayed
    And a retry action should be available

  @ui @metadata-display
  Scenario: Metadata sidebar displays core metrics after success
    Given analysis request completes successfully
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
