# החשבון שלנו — טיול איטליה (Vercel + GitHub JSON)

אפליקציית הוצאות בעברית לארבעה חברים: רובי, גרציאני, ג׳ורדן, בן.  
הטוקן **אינו** מופיע בקוד, והוצאות נשמרות בקובץ `expenses.json` בענף `trip-data` ב-GitHub.

## איך לפרסם — הדרך הקלה (Vercel לכל האפליקציה)

1. חילצו את ה-ZIP, והעלו ל-`https://github.com/bndia/trip-split` את:
   - `index.html` (החלפת הקובץ הקיים)
   - `api/expenses.js` (לשמור בתוך תיקייה `api`)
   - `vercel.json`
   - `README.md`
   - `expenses.json` (קובץ ראשוני, אם אינו קיים)
   אין צורך ב-`worker.js` או ב-`setup.sql` הישנים.
2. פתחו **GitHub** → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → Generate new token:
   - Owner: `bndia`
   - Repository access: **Only select repositories** → `trip-split`
   - Repository permissions: **Contents → Read and write**
   - העתיקו את הטוקן, **לא לקובץ GitHub, לא ל-JavaScript, ולא לצ'אט**.
3. היכנסו ל-`https://vercel.com/new` עם GitHub, ובחרו Import למאגר `bndia/trip-split`.
4. השאירו Root Directory על `/`, בחרו Framework Preset = **Other** אם מתבקש, ללא build command.
5. לפני Deploy, הגדירו **Environment Variable**:
   - Name: `GITHUB_TOKEN`
   - Value: ה-PAT שיצרתם
   - Optional: `APP_PASSWORD` = `bbttrrjj` (אם לא מוגדר, ה-API משתמש בסיסמה הזו כברירת מחדל).
6. Deploy. השתמשו בכתובת הציבורית שקיבלתם ב-Vercel (למשל `https://<project>.vercel.app`). **הכתובת בפועל נקבעת בפריסה, לא לנחש אותה.**
7. פתחו את הכתובת. סיסמה: `bbttrrjj`. הוסיפו הוצאה ובדקו שהיא מופיעה אצל חבר נוסף אחרי רענון. בהוצאה הראשונה השרת ייצור אוטומטית ענף Git בשם `trip-data` אם אינו קיים.

**שימו לב:** לאחר שינוי Environment Variables בפרויקט שכבר נפרס, יש לבצע Redeploy כדי שהשינויים יחולו.

## אם רוצים להמשיך להשתמש בכתובת GitHub Pages

GitHub Pages ממשיך לפרסם את הקובץ `index.html` בענף `main`, אבל צריך לחבר אותו ל-API שב-Vercel.

1. העתק את כתובת האתר של Vercel (ללא `/api/expenses`).
2. ערוך ב-GitHub את `index.html`, בתחילת ה-`<script>`:

```js
const API_ORIGIN='https://YOUR-VERCEL-PROJECT.vercel.app';
```

3. Commit. לאחר ש-GitHub Pages יעדכן את הפרסום, השתמשו בכתובת `https://bndia.github.io/trip-split/`.
4. במקביל גם כתובת Vercel תמשיך לפעול. שניהם עובדים מול אותו JSON ב-GitHub.

## איך השיתוף עובד?

- ה-Frontend קורא `GET /api/expenses`, מוסיף `POST /api/expenses`, ומוחק `DELETE /api/expenses`.
- Vercel Function קורא וכותב את `expenses.json` ב-GitHub באמצעות `GITHUB_TOKEN` סודי.
- ה-API משתמש ב-SHA של הקובץ ובניסיונות חוזרים (optimistic concurrency) כדי למנוע אובדן מידע משינויים מקבילים.
- אחרי ההוצאה הראשונה, הנתונים נמצאים בקובץ: `https://github.com/bndia/trip-split/blob/trip-data/expenses.json`.
- המשתמשים רואים שינוי ברענון ידני או אוטומטי כל 30 שניות.
- ענף `trip-data` נפרד מ-`main`, כדי שעבור כל הוצאה לא יהיה צורך לפרסם מחדש את GitHub Pages. `vercel.json` גם חוסם פריסות של ענף הנתונים.

## מגבלות

- סיסמת הכניסה היא הגנה חזותית בלבד: הקוד גלוי, והמאגר ציבורי. אין להעלות מידע רגיש.
- לכל הוצאה יש Commit בהיסטוריית Git. היסטוריה נשמרת גם עבור הוצאה שנמחקה.
- חלוקה שווה בלבד, סנטים עם עיגול דטרמיניסטי, ללא המרה בין מטבעות.
- בהיעדר `GITHUB_TOKEN`, מסך ההוצאות יודיע על שגיאת סנכרון והשמירה תיכשל; הוא אינו שומר נתונים מקומיים בנפרד.
- אם הוספתם הוצאות בעבר ב-localStorage, הן אינן מועברות אוטומטית לענן כדי להימנע מכפילויות.

## סידור הקבצים

```text
trip-split/
├── index.html
├── expenses.json
├── vercel.json
├── api/
│   └── expenses.js
└── README.md
```
