# Week 5 project review

## Changes made during review
- API update requests now reject empty or unsupported-only update payloads with a field-level 400 response.
- The posts list endpoint now validates the `status` query parameter (`draft` or `published`) rather than silently returning an empty list for invalid values.
- The React search input now follows URL navigation, including browser back/forward.
- README testing language has been corrected so recorded API results are not described as browser click-testing.

## Verification status
- Source files were inspected.
- JavaScript syntax checks were run where Node.js was available.
- A fresh dependency install, MongoDB-backed integration run, and real browser click-through could not be completed in this build environment. No new test pass or browser screenshot is claimed.
- Capture the six real UI screenshots listed in the frontend README after running the app with a working MongoDB instance.
