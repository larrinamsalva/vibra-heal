# VibraHeal private session journal

The private session journal is a deliberately opt-in reflection tool. It does not create automatic listening history, infer that a session was completed, or analyze what a person writes.

## Privacy model

The journal is off by default. Enabling it only permits manual saves; it does not begin background recording. Every entry requires a press of **Save journal entry**.

Journal data stays in the current browser profile under:

- `vibraheal:journal-enabled:v1` for the enabled or disabled preference
- `vibraheal:journal-entries:v1` for up to 100 deliberate entries

Disabling the journal prevents new saves but does not silently erase existing entries. Deleting one entry and deleting all entries are separate explicit actions.

VibraHeal does not upload journal entries, create an account, add analytics, record audio, inspect browser history, or classify journal text.

## Entry contents

Each entry contains:

- a generated id
- a user-supplied or locally generated title
- an optional reflection of up to 1,600 characters
- the explicit save time
- an optional snapshot of the controls at the moment the entry is saved

The optional snapshot may include:

- tone name and carrier frequency
- human-listening volume and stereo offset
- timer duration
- selected wellness path
- guided-breathing pattern and pace
- configured nature-mixer master, rain, ocean, and wind levels

Configured nature levels are not presented as proof that ambience was playing. The journal does not infer session completion or duration from the timer.

## Export and deletion

People can download all entries as:

- structured JSON for a private archive
- a self-contained readable HTML file that can also be printed

Exported text is escaped before it is placed into HTML. Journal exports may contain sensitive personal reflections and should be stored somewhere trusted.

The journal is intentionally separate from Backup Format v2. This prevents personal reflections from being added to a general settings backup without a separate product and privacy decision.

## Safety and product boundaries

- The journal is for personal reflection, not diagnosis, treatment, clinical tracking, or veterinary records.
- VibraHeal does not score, summarize, interpret, or recommend actions from journal text.
- Sound snapshots repeat low-volume and human-only headphone boundaries elsewhere in the app.
- Breathing remains optional pacing guidance; every hold is optional.
- Animal Calm observations are not copied into the journal automatically.

## Manual review checklist

1. Confirm the journal starts disabled in a fresh browser profile.
2. Open the panel and verify that no entry appears automatically.
3. Enable the journal and confirm that enabling alone does not create an entry.
4. Save an entry with only a title, only a reflection, and both fields.
5. Save with and without the current-session snapshot.
6. Change tone, volume, offset, timer, wellness path, breathing, and nature settings; save and verify the attached values.
7. Disable the journal and confirm existing entries remain readable while new saves are blocked.
8. Delete one entry and verify the others remain.
9. Arm and cancel delete-all, then complete delete-all and confirm the list is empty.
10. Export JSON and readable HTML; test symbols such as `<`, `>`, `&`, quotes, and line breaks.
11. Test the 100-entry cap and the title and reflection length limits.
12. Test blocked local storage and verify the warning appears.
13. Test keyboard navigation, Escape-to-close, reduced motion, larger text, high contrast, forced colors, and a narrow phone viewport.
14. Confirm journal actions never start or stop tone audio, nature ambience, breathing, or Animal Calm.
