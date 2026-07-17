# Mobile App Assets

These PNG files are generated baseline artwork for the GroupUp app.
Replace them with final brand artwork before store submission if a designed icon set is available.

## Generated Asset Set

| File | Dimensions | Purpose | Notes |
|------|-----------|---------|-------|
| `icon.png` | 1024x1024 | Main app icon | Used by both iOS and Android. No transparency on iOS. |
| `splash.png` | 1284x2778 | Splash/launch screen | Shown while the app loads. Should match brand colors. |
| `adaptive-icon.png` | 1024x1024 | Android adaptive icon | The foreground layer; background color is set in `app.json`. Must have transparent safe zone margins. |
| `favicon.png` | 48x48 | Web favicon | Used when the app runs in a browser via Expo Web. |
| `notification-icon.png` | 96x96 | Push notification icon | Android requires this to be white-on-transparent for proper tinting. |

## Regenerating Assets

```bash
node scripts/generate-assets.js
```

## Guidelines

- All files must be PNG format.
- Do not use transparency in `icon.png` (iOS will render it as black).
- `adaptive-icon.png` should leave ~30% padding around the logo for Android masking.
- `notification-icon.png` must be monochrome (white icon, transparent background) for Android.
