# UltraServers Userscripts Collection by Mortis

![Made with ❤️](https://img.shields.io/badge/made%20by-Mortis-blueviolet)
![License: MIT](https://img.shields.io/badge/license-MIT-green)
![Userscripts](https://img.shields.io/badge/scripts-2-blue)

This repository contains a collection of userscripts designed to introduce features that are not officially added.

> [!NOTE]
> These scripts are made with the intent to provide additional functionality and are not officially supported by UltraServers — even though they are made by an UltraServers employee.

---

## 🚀 How to Use

To use these userscripts, install a userscript manager browser extension:

- [Violentmonkey](https://violentmonkey.github.io/get-it) — Open source, works on Firefox and Chrome
- [Tampermonkey](https://www.tampermonkey.net/) — Closed source, popular Chrome alternative

> [!IMPORTANT]
> Click an install button below to open the script in your userscript manager.

---

## 📜 Available Scripts

### 🕓 Show files relative timestamp  
Adds relative timestamps (e.g. `3 hours ago`) next to "Last Modified" in your server's file manager.

> [!WARNING]
> This script may cause slowness in directories with a large number of files. That’s why this feature was removed from the official panel.

**🔗 [Install Script](https://github.com/UltraMortis/random-ultra-stuff/raw/refs/heads/main/filesRelativeTimestamp.user.js)**

---

### 🔗 Pterodactyl Backup Copy URL Button  
Adds a **Copy URL** button to each backup entry. Useful for downloading backups using CLI tools or custom workflows.

**🔗 [Install Script](https://github.com/UltraMortis/random-ultra-stuff/raw/refs/heads/main/copyBackupURL.user.js)**

<details>
<summary>📦 Example usage with CLI tools</summary>

```bash
# wget (respects filename from Content-Disposition)
wget --content-disposition "URL"

# curl (equivalent to wget --content-disposition)
curl -OJ "URL"

# aria2c (multi-connection downloader)
aria2c --auto-file-renaming=false --content-disposition-default-utf8=true "URL"
