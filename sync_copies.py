import shutil
import os

root_dir = r"C:\Users\divya\.gemini\antigravity\scratch\autorecon-ai"
targets = [
    os.path.join(root_dir, "public"),
    os.path.join(root_dir, "src", "main", "resources", "static")
]

files_to_sync = [
    "index.html",
    "app.js",
    "style.css",
    "auth.html",
    "privacy.html",
    "terms.html",
    "report.html",
    "salary-report.html",
    "report.js",
    "salary-report.js"
]

for target in targets:
    if os.path.exists(target):
        for fname in files_to_sync:
            src = os.path.join(root_dir, fname)
            dst = os.path.join(target, fname)
            if os.path.exists(src):
                shutil.copy2(src, dst)
                print(f"Copied {fname} -> {target}")

print("All copies successfully synchronized!")
