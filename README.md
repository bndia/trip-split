# החשבון שלנו — Italy Trip (GitHub JSON + Cloudflare Worker)

אפליקציית הוצאות שיתופית לארבעה חברים: רובי, גרציאני, ג׳ורדן, בן.

- אתר: `https://bndia.github.io/trip-split/`
- מסך סיסמה פשוט: `bbttrrjj` (לא אמצעי אבטחה משמעותי)
- מטבעות: EUR / ILS / USD, סיכום נפרד לכל מטבע
- הוצאות משותפות בקובץ `expenses.json` בענף `main`
- הוספת הוצאות, מחיקה, חלוקה שווה, קיזוז חובות, פירוט לפי משלם
- סנכרון באמצעות API ב-Cloudflare Worker. האפליקציה מבצעת רענון כל 30 שניות ובכניסה מחדש.
- עדכוני GitHub מתבצעים ב-Worker עם SHA + retry למניעת דריסת שינויים במקביל.

## פרסום Cloudflare Worker (הגדרה חד-פעמית)

### 1. יצירת GitHub Fine-grained PAT

היכנסו ל-GitHub: Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token.

- Resource owner: `bndia`
- Repository access: **Only select repositories** → `trip-split`
- Repository permissions: **Contents → Read and write**
- רצוי תוקף קצר שמספיק לכל הטיול; שימו לב שהתוקף יפסיק את הסנכרון.
- העתיקו את הטוקן לשמירה במקום בטוח. **לא להכניס את הטוקן ל-GitHub עצמו, לקובץ JavaScript ציבורי, או לצ'אט.**

### 2. יצירת Cloudflare Worker

1. כנסו ל-https://dash.cloudflare.com/ , Workers & Pages → Create → Worker → התחילו עם Hello World (שמות/מיקום הכפתורים עשויים להשתנות).
2. שם מומלץ: `trip-split-api`.
3. פתחו את **Edit code**, החליפו את הקוד בתוכן `worker.js`, ולחצו Deploy.
4. תחת **Settings → Variables and Secrets**, הוסיפו שתי משתני **Secret**:
   - `GITHUB_TOKEN` = ה-PAT החדש מ-GitHub
   - `APP_PASSWORD` = `bbttrrjj`
5. Deploy לשמירת הסודות, אם מתבקש.
6. העתיקו את כתובת ה-Worker, לדוגמה `https://trip-split-api.YOUR-SUBDOMAIN.workers.dev` (הכתובת המדויקת נקבעת בחשבון שלכם).

### 3. חיבור האתר ל-Worker

עדכנו בקובץ `index.html` בשורש המאגר את השורה:

```js
const WORKER_URL='';
```

לכתובת ה-Worker, לדוגמה:

```js
const WORKER_URL='https://trip-split-api.YOUR-SUBDOMAIN.workers.dev';
```

עשו Commit. GitHub Pages יפרסם את הגרסה החדשה. עד להגדרת ה-Worker, כפתור שמירת ההוצאות חסום כדי למנוע נתונים שנשמרים רק במכשיר אחד.

### 4. בדיקה

1. פתחו את האתר בשני מכשירים / חלונות גלישה נפרדים, והיכנסו עם הסיסמה.
2. הוסיפו הוצאה ממכשיר אחד.
3. במכשיר השני לחצו על "רענון" (או המתינו עד 30 שניות).
4. ודאו שההוצאה מופיעה בשניהם וגם ב-`expenses.json` ב-GitHub.

## הערות

- הקובץ `expenses.json` ציבורי כי המאגר ציבורי. הסיסמה מגינה רק על הממשק בצורה בסיסית, לא על קריאת הנתונים ב-GitHub. **ה-GitHub PAT חייב להישאר סודי ב-Cloudflare.**
- אם שני אנשים מעדכנים כמעט יחד, ה-Worker קורא את הגרסה העדכנית ומנסה שוב במקרה של קונפליקט.
- **תיעוד בהיסטוריית Git**: כל הוספה ומחיקה עושה Commit, והוצאות שנמחקו נשארות זמינות בהיסטוריית המאגר.
- סנכרון אינו WebSocket בזמן אמת; יש רענון אוטומטי כל 30 שניות.
- אם בדפדפן היו הוצאות מהגרסה המקומית, הן נשמרות ב-localStorage אך אינן מתווספות אוטומטית ל-JSON כדי למנוע כפילויות.
- אין צורך ב-Supabase או שירות אחסון נוסף.
