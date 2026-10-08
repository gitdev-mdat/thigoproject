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

Create `apps/api/.env` the first time:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
```

Then opt in to local fixtures by adding these lines to `apps/api/.env`:

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

The apps call `http://10.0.2.2:3001` on Android by default (`src/services/auth.ts` in Customer, `src/services/config.ts` in Merchant and Driver; `EXPO_PUBLIC_API_URL` overrides it). `10.0.2.2` is the emulator's alias for the Windows host.

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

For F02 storefront checks, also use merchant **0860000005**: it has the Merchant role but no store yet, so it opens the first-run setup. Merchant accounts are provisioned (seeded locally), never self-registered; the setup screen only creates the storefront.

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
| 8   | Merchant (Đơn hàng tab): the new order appears within about 5 s under "Đơn mới" with the same code and total; accept, start preparing, then mark ready. Also reject a second order with a reason                |        |
| 9   | Driver: the open job shows only the district before claiming; claim it; "Đã lấy hàng" stays disabled until the order is ready, then confirm pickup                                                              |        |
| 10  | Driver delivery confirmation: "Đã giao thành công" opens the **native Android dialog**; "Chưa giao" cancels; "Đã giao và thu tiền" completes the delivery                                                       |        |
| 11  | Customer: tracking reaches "Đã giao"; the order is listed under Đơn hàng › Lịch sử đơn and as "Đơn gần đây" on home                                                                                             |        |
| 12  | Hardware back on store, product, cart, checkout and order screens returns one step and does not exit the app                                                                                                    |        |
| 13  | After killing and reopening each app, the session is restored                                                                                                                                                   |        |

To confirm consistency in the database after step 11:

```powershell
docker compose exec postgres psql -U thigo -d thigo -c "select code,status,total_vnd,driver_user_id is not null as has_driver from orders order by placed_at desc limit 3"
```

## 7. F02 Merchant storefront checklist

Run this on the emulator with merchant **0860000005**. Before you start, put a few photos on the emulator: drag a JPEG or PNG onto the emulator window (it lands in Downloads), or run `adb push C:\path\dish.jpg /sdcard/Pictures/` and open the Photos/Files app once so it is indexed.

0860000005 opens setup only until it has created a store. To repeat F1 later, provision another local merchant account (development database only; this is what account provisioning does, not self-registration):

```powershell
docker compose exec postgres psql -U thigo -d thigo -c "insert into users (phone) values ('+84860000006') on conflict do nothing; insert into user_roles (user_id, role) select id, 'MERCHANT' from users where phone = '+84860000006' on conflict do nothing"
```

Then sign in as 0860000006. Running it again is harmless; once that account has a store, use the next number (0860000007, …).

| #   | Check                                                                                                                                                                                                                                      | Result |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| F1  | Sign in as 0860000005 with OTP 000000: "Thiết lập cửa hàng" opens. Fill name, type, address, phone. The keyboard never hides the focused field; "Tạo cửa hàng" is reachable                                                                |        |
| F2  | Dashboard (Tổng quan): "Chưa hiển thị" status, setup checklist, counts are 0; nothing sits under the status bar, camera cutout or navigation bar                                                                                           |        |
| F3  | Thực đơn: "Tạo danh mục đầu tiên" opens a sheet; with the keyboard open the name field and "Tạo danh mục" stay visible. Add "Món chính" and "Đồ uống"                                                                                      |        |
| F4  | "Thêm món": tap "Chọn ảnh" → the **native Android photo picker** opens; pick a photo, crop, confirm. The preview shows, "Đang tải ảnh lên…" then the saved image. Fill name, category, price, save. Add 3 dishes                           |        |
| F5  | Edit a dish's price, then press **hardware back** before saving: "Bỏ thay đổi?" appears. "Tiếp tục sửa" keeps the edit; save it. Back with no changes leaves without asking                                                                |        |
| F6  | Turn one dish off with its switch: "Tạm hết" appears. Reorder a category with "Chuyển lên/xuống"                                                                                                                                           |        |
| F7  | Cửa hàng: add a logo and a cover (picker again), set opening hours including one overnight day (18:00 → 02:00 shows "hôm sau"), then switch "Hiển thị với khách" on                                                                        |        |
| F8  | Hardware back closes an open sheet first, then the pushed screen, then returns to Tổng quan, and only then leaves the app                                                                                                                  |        |
| F9  | Customer app (0860000001): search the store name; the logo, cover, new price and "Hết món" on the disabled dish show; ordering the disabled dish is impossible                                                                             |        |
| F10 | Customer orders the available dishes (COD); merchant sees it in Đơn hàng, accepts, starts preparing, marks ready; driver delivers; customer sees "Đã giao" in Lịch sử đơn                                                                  |        |
| F11 | Merchant: turn "Đang nhận đơn" off; the Đơn hàng header shows "Đang tạm ngưng nhận đơn" and the customer store shows it as closed. Turn it back on                                                                                         |        |
| F12 | Sign in as 0860000002 (seeded store, no phone): it stays published and shows "còn thiếu thông tin"; nothing was unpublished                                                                                                                |        |
| F13 | Kill and reopen the Merchant app: the session and the store come back; images still load after restarting `pnpm dev:api`                                                                                                                   |        |
| F14 | Login keyboard: on the phone and OTP steps the field and the main button stay above the keyboard. The login screens deliberately keep the F01 keyboard setting; report it if the keyboard covers them                                      |        |
| F15 | Keyboard footers: in Thêm món, Thông tin cửa hàng and Giờ mở cửa, focus a field. The pinned save button sits directly on top of the keyboard with no empty band under it, and drops back above the navigation bar when the keyboard closes |        |
| F16 | Low fields: with the keyboard open, scroll to and type in "Mô tả" (Thêm món), "Chủ nhật" (Giờ mở cửa) and the last setup field. Each stays visible while typing                                                                            |        |
| F17 | Sheets with the keyboard: "Tạo danh mục" (opens with the keyboard) and an order's "Từ chối" → "Lý do khác". The field and the confirm button stay above the keyboard; hardware back closes the keyboard first, then the sheet              |        |
| F18 | Disabled controls: while a save or toggle is in progress, switches and buttons look disabled (dimmed), not just unresponsive                                                                                                               |        |
| F19 | Dark system theme (Settings → Display → Dark theme) with 3-button navigation: the navigation bar icons are visible against the app background                                                                                              |        |
| F20 | Picker after activity kill: Developer options → "Don't keep activities" on, then pick a photo in Thêm món. Note whether the app returns to the form with the photo, returns without it, or loses the form. Turn the option off afterwards  |        |
| F21 | Toasts: after saving on Thực đơn, the toast does not cover the "Thêm món" button; on pushed screens it sits above the save footer                                                                                                          |        |

Confirm the database afterwards:

```powershell
docker compose exec postgres psql -U thigo -d thigo -c "select s.name, s.is_active, s.phone, p.name, p.price_vnd, p.is_available, p.image_url is not null as has_image from stores s join products p on p.store_id = s.id join users u on u.id = s.owner_user_id where u.phone = '+84860000005' order by p.position"
```

## 8. Capturing evidence and reporting failures

Save evidence in one folder per run, named after the date and the device (for example `2026-10-09-pixel7-api35`).

```powershell
adb exec-out screencap -p > F4-picker.png          # screenshot of the current screen
adb shell screenrecord /sdcard/F5.mp4               # record; stop with Ctrl+C
adb pull /sdcard/F5.mp4 .
adb logcat -c                                        # clear the log before reproducing
adb logcat ReactNativeJS:V ReactNative:V AndroidRuntime:E *:S > F4-log.txt
```

Also keep the Metro terminal output and the end of the API log for a failing step.

Report each failure as:

- **Check:** the number, for example F4.
- **Device:** emulator model, Android version (API level), screen size, and 3-button or gesture navigation.
- **Steps:** what you tapped, in order.
- **Expected / actual:** one line each.
- **Evidence:** the screenshot or recording, plus the log excerpt.

Fill in the Result column (PASS / FAIL / NOT RUN) and attach the folder to PR #1 or the project thread. F02 is marked verified only from this device evidence.

## Troubleshooting

- **"Network request failed" or "Máy chủ hiện chưa phản hồi":** make sure `pnpm dev:api` is running and the check in step 4 passes. Do not set `EXPO_PUBLIC_API_URL` to `localhost` for the emulator.
- **The API refuses to start with `OTP_PROVIDER=test needs THIGO_ENABLE_DEV_FIXTURES=true…`:** add the three lines from step 3.
- **`dev:seed needs THIGO_ENABLE_DEV_FIXTURES=true…`:** same fix. Fixtures are off by default on purpose.
- **Expo Go reports an SDK mismatch:** uninstall Expo Go from the emulator and run `expo start --android` again so it installs the SDK 57 build.
- **The port is already in use:** pick another `--port` for that app.
- **The photo picker shows no photos:** push an image with `adb push` as in section 7 and open the Photos or Files app once.
- **Images upload but do not show after restarting the API:** check `MEDIA_STORAGE_DIR` in `apps/api/.env`. If it is unset, files live in `apps/api/storage/media`; make sure nothing deletes that folder.
