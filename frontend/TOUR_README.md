# Placify Visual Navigation Guide

Files: `js/placify-tour.js` (engine + step config), `placify-tour.css` (look), hooks in `index.html` and `js/enhancements.js` ("Guide me" buttons now replay the new tour; old click-blocking guide removed).

## How it works
- Runs automatically only after a **new registration** (wraps `placifySupervisor.registerUser`). Existing users signing in see nothing automatic.
- Each tip shows ~3.6s, then the hand moves on. No Next/Skip buttons; overlay is `pointer-events: none`, so the page stays fully clickable.
- The tour never clicks, selects or submits anything.
- A DOM watcher re-checks the page after changes, so newly revealed content (Level Selection Step 2 → Step 3, roadmap months → weeks → tasks) is explained once it appears. Already-explained tips are never repeated.
- Progress is saved per account in localStorage (`placify_tour_journey_<user_id>`) and also sent to `PUT /api/users/:id/onboarding-tour` if your backend adds that endpoint (failures are ignored).
- The journey completes once the Navigation, Domain Selection, Level Selection and Roadmap tours are done (`REQUIRED_PAGES`).

## Adding / editing steps
Edit `PAGES` in `js/placify-tour.js`:
```js
{ page: 'internships', view: 'view-internships', groups: [
  { id: 'intern', when: () => true, steps: [
    { id: 'in.filter', target: '#internship-domain-select, [data-tour="filter"]', title: 'Filter', text: 'Narrow listings.', placement: 'top' }
  ] }
] }
```
- `id` must be stable and unique. `target` is a selector list; first visible match wins; missing targets are skipped.
- `when` makes a group conditional (only explained while true).

## Console helpers
`PlacifyTour.replay()`, `PlacifyTour.startOnboarding()`, `PlacifyTour.resetOnboarding()`, `PlacifyTour.status()`.
