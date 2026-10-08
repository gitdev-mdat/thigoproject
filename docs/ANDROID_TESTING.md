# Android Emulator testing (Windows)

Use this guide to verify Customer, Merchant and Driver on a local Android Emulator against the local NestJS API and PostgreSQL. A check passes only when it was run on an emulator or a physical Android device. A browser render does not count.

## 1. Prerequisites

- Node.js 24.15 or newer and pnpm 11.13 (`corepack enable`), as `package.json` requires.
- Docker Desktop for the local PostgreSQL in `compose.yaml`. Any PostgreSQL that `DATABASE_URL` points to also works.
- Android Studio with a running emulator, for example Pixel 7 with API 35.
- The Expo Go build for SDK 57. `expo start --android` offers to install it on the emulator when it is missing.
- `adb` on `PATH`. It is usually in `%LOCALAPPDATA%\Android\Sdk\platform-tools`.

## 2. Detect the emulator

```powershell
adb devices
# Expected: emulator-5554   device
```

If the list is empty, start the emulator from Android Studio's Device Manager. If the device shows as `unauthorized`, run `adb kill-server` and then `adb devices` again.

## 3. Database, fixtures and API

In `apps/api/.env` (copy it from `.env.example` the first time), opt in to local fixtures:

```sh
NODE_ENV=development
THIGO_ENABLE_DEV_FIXTURES=true
OTP_PROVIDER=test
```

Then, from the repository root:

```powershell
pnpm install
pnpm db:up
pnpm db:migrate
pnpm dev:seed      # idempotent; safe to run again
pnpm dev:api       # NestJS on http://0.0.0.0:3001
```

## 4. Check emulator-to-API connectivity

The apps call `http://10.0.2.2:3001` on Android by default (`src/services/auth.ts`). `10.0.2.2` is the emulator's alias for the Windows host.

```powershell
adb shell "curl -s -o /dev/null -w '%{http_code}' http://10.0.2.2:3001/customer/recommendations"
# Expected: 401 (the API answered; that route needs sign-in)
```

If the emulator image has no `curl`, open `http://10.0.2.2:3001/customer/recommendations` in the emulator's Chrome. You should see a JSON 401 response.

On a physical phone on the same Wi-Fi, use the PC's LAN address. Allow inbound TCP 3001 in Windows Defender Firewall first:

```powershell
$env:EXPO_PUBLIC_API_URL = "http://192.168.1.20:3001"   # your PC's IPv4 from ipconfig
```

## 5. Launch the apps

Each app runs its own Metro server. Run each command in its own terminal and give each one a different port:

```powershell
pnpm --filter @thigo/customer exec expo start --android --port 8081
pnpm --filter @thigo/merchant exec expo start --android --port 8082
pnpm --filter @thigo/driver   exec expo start --android --port 8083
```

Expo Go keeps every project in its "Recently opened" list, so you can switch between them there. Press `r` in a terminal to reload that app.

Sign in with OTP `000000`:

| App      | Phone      |
| -------- | ---------- |
| Customer | 0860000001 |
| Merchant | 0860000002 |
| Driver   | 0860000003 |

The OTP resend cooldown is 60 seconds per phone number.

## 6. Checklist

Record each result as PASS, FAIL (with a screenshot) or NOT RUN. Check at least one small device (360×640 dp, for example a Pixel 4a-class AVD) and one large device (412×915 dp).

| #   | Check                                                                                                                                                                                                           | Result |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | `adb devices` lists the emulator                                                                                                                                                                                |        |
| 2   | The API is reachable from the emulator (step 4)                                                                                                                                                                 |        |
| 3   | Login: a wrong OTP clears the cells; a correct one signs in; the hardware back button on the OTP step returns to the phone step                                                                                 |        |
| 4   | Keyboard: the OTP field, home search, checkout note, address form and merchant "Lý do khác" reason stay visible above the keyboard. The reject sheet is a `Modal`, so check it carefully                        |        |
| 5   | Safe area: no content under the status bar or camera cutout; the bottom tab bar, cart bar, checkout button and driver action bar sit above the gesture or 3-button navigation bar (check both navigation modes) |        |
| 6   | Scrolling: home, store menu, cart, checkout and order details scroll to the last item; pull-to-refresh works on the merchant and driver lists                                                                   |        |
| 7   | Customer checkout: add Cơm tấm sườn bì chả with Trứng ốp la, then Trà đá; check out with COD and a note; the server total shows; the order screen says "Chờ quán xác nhận"                                      |        |
| 8   | Merchant: the new order appears within about 5 s under "Đơn mới" with the same code and total; accept, start preparing, then mark ready. Also reject a second order with a reason                               |        |
| 9   | Driver: the open job shows only the district before claiming; claim it; "Đã lấy hàng" stays disabled until the order is ready, then confirm pickup                                                              |        |
| 10  | Driver delivery confirmation: "Đã giao thành công" opens the **native Android dialog**; "Chưa giao" cancels; "Đã giao và thu tiền" completes the delivery                                                       |        |
| 11  | Customer: tracking reaches "Đã giao"; the order is listed under Đơn hàng › Lịch sử đơn and as "Đơn gần đây" on home                                                                                             |        |
| 12  | Hardware back on store, product, cart, checkout and order screens returns one step and does not exit the app                                                                                                    |        |
| 13  | After killing and reopening each app, the session is restored                                                                                                                                                   |        |

To confirm consistency in the database after step 11:

```powershell
docker compose exec postgres psql -U thigo -d thigo -c "select code,status,total_vnd,driver_user_id is not null as has_driver from orders order by placed_at desc limit 3"
```

## Troubleshooting

- **"Network request failed" or "Máy chủ hiện chưa phản hồi":** make sure `pnpm dev:api` is running and the check in step 4 passes. Do not set `EXPO_PUBLIC_API_URL` to `localhost` for the emulator.
- **The API refuses to start with `OTP_PROVIDER=test needs THIGO_ENABLE_DEV_FIXTURES=true…`:** add the three lines from step 3.
- **`dev:seed needs THIGO_ENABLE_DEV_FIXTURES=true…`:** same fix. Fixtures are off by default on purpose.
- **Expo Go reports an SDK mismatch:** uninstall Expo Go from the emulator and run `expo start --android` again so it installs the SDK 57 build.
- **The port is already in use:** pick another `--port` for that app.
