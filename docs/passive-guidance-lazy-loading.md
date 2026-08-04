# Passive guidance registry and lazy loading

VibraHeal keeps seven large, read-only artifact-reference panels outside the initial application bundle and loads each one only after a person deliberately selects it through **Tools**.

This is a performance architecture change. It does not change an artifact format, parser, producer, importer, compatibility route, privacy declaration, responsibility rule, decision boundary, or panel design.

## Panels loaded on demand

The shared registry covers:

- Workflow Map
- Artifact Glossary
- Artifact Version Guide
- Artifact Support Status
- Artifact Responsibility Map
- Artifact Decision Boundary Guide
- Guidance Index

Artifact Inspector is not part of this lazy group because it is an active file-validation tool rather than a passive reference. Device Check, Issue Report, Release Checklist, Release History, Release Package, audio tools, browser-local data tools, and Animal Calm also keep their existing eager behavior.

## Shared typed registry

`src/toolRegistry.ts` owns the current Tool Center metadata for all tools and the additional passive-guidance metadata needed by the lazy system:

- tool id
- label and description
- Tool Center symbol and group
- compatibility trigger selector
- panel and close selectors
- dynamic module loader
- Guidance Index group, question, answer summary, source-model names, and non-goals

Tool Center and Guidance Index consume the same records. A passive reference label, selector, description, or Index explanation therefore cannot be changed in one surface while silently remaining stale in the other.

Guidance Index deliberately excludes itself from its six-entry directory even though it is the seventh lazy module.

## Loading sequence

1. The app starts with `PassiveGuidanceHost` mounted but no passive guidance component loaded.
2. A person opens **Tools** and deliberately chooses one passive reference.
3. Tool Center closes any currently open panel.
4. Tool Center dispatches a typed local request containing only the registered tool id.
5. The host runs that tool's dynamic `import()` function.
6. The selected component and its CSS are mounted behind the existing hidden compatibility trigger.
7. The host announces that the trigger is ready.
8. Tool Center activates the existing trigger and moves focus to the panel's close control.

No artifact, filename, journal entry, browser-storage value, user-agent string, audio state, or account information is included in the request.

## Repeat use and cancellation

After a passive module loads successfully, it remains mounted for the current page session. Reopening it does not create a duplicate component or repeat the dynamic import.

Every Tool Center selection receives a request token. When a person chooses another destination or presses Escape while a passive module is still loading, the old token becomes stale. The downloaded module may finish loading into the local page cache, but it cannot open itself later or replace the person's newer choice.

## Loading failure

A failed or timed-out module request:

- does not open a partial panel
- does not guess that the tool is available
- does not retry continuously
- does not reveal the raw browser or network error
- returns focus to the Tools launcher
- provides a clear local status message

The person may deliberately try again later.

## Offline behavior

The service worker continues to cache successful same-origin GET responses under `/vibra-heal/`. That includes a passive panel's JavaScript and CSS chunks after they have been fetched successfully.

Therefore:

- a passive guide opened once while online can normally be reopened from the runtime cache when offline
- a passive guide never opened on that installed version may be unavailable during a first-ever offline attempt
- an uncached offline chunk receives the existing clear `503` response
- Tool Center reports that the guide could not load and suggests opening it once online

The lazy chunks are not added to the initial shell precache because doing so would download all seven modules during installation and defeat the network-saving part of on-demand loading.

## Privacy boundary

Choosing an unloaded passive guide may request same-origin static JavaScript and CSS from the VibraHeal deployment. It does not:

- send a selected file or original filename
- read localStorage, Cache Storage contents, a browser profile, or a device report
- contact an analytics, account, issue-tracker, release, or health service
- upload, synchronize, submit, publish, sign, deploy, or certify anything
- start audio or change current session settings
- turn guidance into validation, migration, scoring, ranking, recommendation, or approval

## Accessibility

The architecture preserves each panel's existing:

- readable dialog name
- close-button focus on open
- Escape behavior
- focus return
- larger-text support
- reduced-motion support
- high-contrast and forced-colors support

The compatibility trigger is hidden by a shared host rule and is also marked `aria-hidden="true"` and `tabindex="-1"` by Tool Center after it mounts.

## Automated tests

`src/toolRegistry.test.ts` verifies:

- twenty-two Tool Center destinations
- twenty panel tools and two page destinations
- seven unique passive modules
- six non-self-referential Guidance Index entries
- three complete, non-overlapping Index groups
- shared labels and metadata
- unknown ids are rejected rather than guessed

`src/PassiveGuidanceHost.test.tsx` verifies:

- no passive component mounts at startup
- only the deliberately requested module mounts
- loading does not read localStorage or call `fetch` in the component-test runtime
- repeated requests do not duplicate a component
- a second module can load without removing the first
- requests fail locally when no host is available

`src/ToolCenter.test.tsx` also verifies the asynchronous request-ready-open bridge and removal of the newly mounted trigger from keyboard and assistive-technology navigation.

The production build remains the authoritative proof that Vite emits real dynamic chunks.

## Production verification and budget

Two separate post-build checks protect this architecture:

```bash
npm run check:guidance-chunks
npm run check:bundle-budget
```

The first requires all seven panels to remain distinct dynamic entries declared by the production entry. The second walks the complete Vite manifest graph and measures:

- initial JavaScript and CSS
- shared synchronous startup chunks
- the complete passive-guidance JavaScript and CSS graph
- the largest startup JavaScript chunk by raw size
- the largest startup JavaScript chunk by gzip size

The budget counts a startup vendor chunk as startup. Splitting one large entry file therefore cannot create a false reduction in total initial bytes.

See [`startup-bundle-budget.md`](startup-bundle-budget.md) for the current baseline, limits, report format, and contribution rules.

## Real-browser review still required

Review should cover:

- first open on a normal connection
- a deliberately throttled connection
- cancelling a load with Escape
- choosing a different tool while a load is pending
- reopening a previously loaded guide
- installed-app use after opening a guide online
- first-ever offline use of an unopened guide
- screen-reader announcements during loading and failure
- 200% and 400% zoom
- narrow phones, larger text, high contrast, and forced colors

## Contribution rule

A new passive artifact reference must be registered in `src/toolRegistry.ts` with a unique id, selectors, loader, and Index metadata decision. It must not be statically imported by `src/main.tsx`.

Adding a dynamic loader does not authorize the panel to read files, storage, network data, or user context. Consequential actions remain inside their existing deliberate tools and confirmations.

A new or renamed passive entry must also update the shared source list used by both production checks. A change that exceeds the bundle budget must reduce the emitted graph or include a separately reviewed budget change with measured justification.
