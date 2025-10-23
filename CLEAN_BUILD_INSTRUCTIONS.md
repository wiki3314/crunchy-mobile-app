# Clean Build Instructions - API Disabled Version

## 🧹 Steps to Clean and Rebuild (IMPORTANT!)

Purana cached code remove karne ke liye ye steps follow karo:

### Step 1: Stop Metro Bundler

```bash
# Ctrl+C press karo Metro bundler stop karne ke liye
```

### Step 2: Clean Android Build

```bash
cd /Users/mac/Downloads/CrunchiiAPI-2/android
./gradlew clean
cd ..
```

### Step 3: Clear Metro Cache

```bash
npx react-native start --reset-cache
```

### Step 4: Rebuild App (New Terminal)

```bash
# Dusre terminal window mein
cd /Users/mac/Downloads/CrunchiiAPI-2
npx react-native run-android
```

---

## ✅ Expected Result:

Jab app run hoga toh console mein ye dikhega:

```
LOG  API calls disabled for design testing
```

**Network Error NAHI aana chahiye!**

---

## 🎯 What You'll See:

1. **Splash Screen** ✅
2. **Landing Screen** (Intro slides) ✅
3. **Home Without Login** (Empty - no posts) ✅
4. **Login Screen** - When you try to login:
   - Error message: "API calls disabled for design testing"
5. **Registration Screen** - When you try to register:
   - Error message: "API calls disabled for design testing"

---

## 🚫 What You WON'T See:

- ❌ Network Error
- ❌ Axios Error
- ❌ Restaurant posts (because Google API disabled)
- ❌ Any API calls in logs

---

## 💡 Quick Test:

Login screen pe jao aur kuch bhi email/password dalo:

- **Expected:** "API calls disabled for design testing" message

Agar "Network Error" aaya toh:

```bash
# Watchman cache clear karo
watchman watch-del-all

# Node modules reinstall (last resort)
rm -rf node_modules
npm install
```

---

## 📱 Design Check Karne Ke Liye:

Ab tum easily check kar sakte ho:

- ✅ Splash screen design
- ✅ Landing/Onboarding screens
- ✅ Login screen design
- ✅ Registration screen design
- ✅ Bottom tabs (without login)
- ✅ All UI/UX elements
- ✅ Animations
- ✅ Dark/Light mode

Backend ready hone ke baad API enable kar dena!
