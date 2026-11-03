# Reminder dispatch Edge package — disabled

`configuration.example.json` is disabled, with missing operational budget,
capability lifetime, account and recipient allowlists. It cannot dispatch simply
by flipping enabled. Existing approved SDK version is reused; no installation.

```powershell
node qa/reminders/prepare-dispatch-function.mjs
```

Creates an ignored payload/digest manifest under `.astro/reminder-dispatch-function/`.
An approved nonsecret `.astro/reminder-dispatch-settings.json` may be explicitly
provided. No environment/secret files are read and nothing is uploaded/sent.

The endpoint exposes only authenticated fixed dispatch, authenticated fixed
callback bootstrap, and a separately authenticated provider callback. There is
no arbitrary account/locale/recipient/delay request body. Server bindings are read
only by enabled Edge code. All operational/activation details are in
`../../reminder-dispatch/README.md` and `../../../qa/reminders/DISPATCH.md`.
