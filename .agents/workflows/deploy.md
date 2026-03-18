---
description: Push changes to git and provide deployment commands for testing on VPS
---

This workflow will push the latest changes to GitHub and provide commands to execute on the VPS.

// turbo-all
1. Add, commit, and push changes to GitHub:
```bash
git add .
git commit -m "Update deployment process"
git push origin main
```

2. Process to follow on VPS:
Run the following commands on your VPS `root@147.93.107.21` to deploy for testing:
```bash
cd /var/www/avr
git pull origin main
npm install
npm run build
curl -I http://147.93.107.21/api/update_db.php
```

3. Verification:
Check if the dashboard is now showing the data.
