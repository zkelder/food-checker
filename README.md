# Food Checker

## Public Beta URLs

- API: https://api.foodchecker.zkelder.dev
- Privacy: https://zkelder.dev/foodchecker/privacy.html
- Support: https://zkelder.dev/foodchecker/support.html
- Terms: https://zkelder.dev/foodchecker/terms.html

The previous raw EC2 HTTP URL should not be used by the mobile app anymore.

## Backend tests

Install backend dependencies, then run the test suite:

```bash
python -m pip install -r requirements.txt
python -m pytest -q
```

## Mobile checks

Run the Expo app sanity checks from the mobile directory:

```bash
cd mobile
npm ci
npx expo config --type public
npm run typecheck
npm run lint
```
