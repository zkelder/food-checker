# TestFlight Beta Checklist

## Manual Test Steps

1. Install the latest iOS preview/TestFlight build.
2. Sign up or sign in with Supabase email/password auth.
3. Confirm the Account tab shows the signed-in email, API status, preference count, scan count, and Beta diagnostics.
4. Tap Refresh Account Status and confirm counts/status update without exposing tokens.
5. Open Privacy Policy, Support, Terms / Disclaimer, and Request Data Deletion actions.
6. Go to Preferences, use Recommended, Common Allergens, and Clear All, then confirm the selected count updates.
7. Return to Scan. If no preferences are saved, confirm the onboarding banner links to Preferences.
8. Take or choose a JPG/PNG/WEBP label photo under 8 MB and run a scan.
9. Confirm scan loading states appear and the result shows either grouped matches or No selected concerns found.
10. Open History and confirm scan count, date/time, risk level, match count, and summary are readable.
11. Sign out, sign back in, and confirm another user's preferences/history are not visible.

## Data Collected Summary

- Account email and Supabase user id for authentication.
- User-selected ingredient screening preferences.
- Uploaded ingredient label images for OCR processing.
- Extracted ingredient text and scan results.
- Scan history tied to the authenticated user.

No analytics or tracking SDKs are currently added.

## Disclaimer Text

Food Checker is an informational ingredient-screening tool. OCR and ingredient matching may be incomplete or inaccurate. Always verify ingredients on the product label. Do not rely on this app as your only source for allergy, medical, or dietary decisions.

## TestFlight Beta Notes Draft

Food Checker helps testers scan ingredient labels and compare extracted text against selected ingredient concerns. This beta uses Supabase login and the HTTPS API at https://api.foodchecker.zkelder.dev. Please test sign-in, preferences, image scanning, scan history, logout, and data deletion/support request flows.

Known beta limitation: OCR may miss or misread label text, especially on blurry, cropped, reflective, or low-light photos. Always verify against the product label.

## App Privacy Categories Draft

- Contact Info: email address for account authentication.
- User Content: uploaded label images, extracted ingredient text, selected preferences, and scan history.
- Diagnostics: basic API health status shown in-app for beta testing.
- Tracking: no tracking currently implemented.

## Public Beta URLs

- API: https://api.foodchecker.zkelder.dev
- Privacy: https://zkelder.dev/foodchecker/privacy.html
- Support: https://zkelder.dev/foodchecker/support.html
- Terms: https://zkelder.dev/foodchecker/terms.html

The previous raw EC2 HTTP URL should not be used by the mobile app anymore.
