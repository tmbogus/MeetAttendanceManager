# MeetAttendanceManager

A Chrome extension that enhances Google Meet's moderation capabilities with a real-time attendance overlay.

## Features
- Inline status indicators for participants: banned (red), allowed (green), neutral (yellow)
- Quick Ban/Allow buttons next to each participant
- Live updates as participants join/leave (debounced for performance)
- Popup to manage banned/allowed lists
- Enable/disable overlay toggle
- Import/export lists as JSON

## Install (Developer Mode)
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable Developer Mode (top-right)
4. Click "Load unpacked" and select this folder

## Usage
- Open a Google Meet: `https://meet.google.com/...`
- Click the extension icon to open the popup
- Toggle "Enable overlay" as needed (enabled by default)
- Add users to Ban or Allow lists in the popup
- The overlay will show status dots and action buttons next to participants

## Import/Export
- Export: Popup → Export → downloads a JSON file
- Import: Popup → Import → choose a previously exported JSON file

## Permissions
- `storage`: save settings and lists
- `activeTab` and `host_permissions` for `https://meet.google.com/*`: enable functionality on Meet pages

## Notes
- Google Meet DOM changes over time. The extension uses multiple resilient selectors and a debounced observer
- If the overlay does not appear, ensure the People panel is open and the extension is enabled

## Troubleshooting
- Refresh the Meet tab after installing or updating the extension
- In `chrome://extensions`, click "Reload" on this extension after making changes
- Open DevTools on the Meet tab and check the Console for messages from "Meet Admin Overlay"

## License
MIT
